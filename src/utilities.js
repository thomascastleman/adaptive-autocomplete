var Node = require('./Node.js');
var database = require('./database.js');
var con = database.connection;

// write tree data to string
function serializeToString(tree) {

	var serialization = "";
	var numChildren = new Array();	// map of node id to number of children
	var currentNode;				// current node being serialized
	var currentID = 1;				// id of node
	var currentParentID = 0;		// id of parent
	var currentNumChildren = tree.root.children.length;	// num children remaining to be serialized of this parent
	var q = [];
	q.push.apply(q, tree.root.children);	// start with children of root

	// while still nodes left to serialize
	while (q.length > 0) {
		currentNode = q.shift();								// pop from queue
		q.push.apply(q, currentNode.children);					// add children to q
		numChildren[currentID] = currentNode.children.length;	// get number of children off this id
		currentID++;

		// add to serialization string
		serialization += currentNode.data + ' ' + currentNode.probability + ' ' + currentParentID + ' ';

		// decrease num children left to serialize from this parent
		currentNumChildren--;

		if (currentNumChildren <= 0) {
			// move to next parent with children if out of children
			if (q.length > 0) {
				while (true) {
					currentParentID++;
					if (numChildren[currentParentID] > 0) {
						currentNumChildren = numChildren[currentParentID];
						break;
					}
				}
			}
		}
	}

	// cut off last trailing space char
	return serialization.substring(0, serialization.length - 1);
}

// write tree safely into stable_tree table, given serialization string
function serializeToDatabase(serialization, callback) {
	var data = serialization.split(' ');

	// ensure serialization is not corrupted
	if (data.length % 3 != 0) {
		console.log("ERR IN SERIALIZATION (utilities.js: serialize to db)");
	} else {
		var values = [];
		// iterate through data in triplets (data, probability, parent id), add to array for bulk insert
		for (var i = 0; i < data.length; i += 3) {
			values.push([data[i], parseFloat(data[i + 1]), parseInt(data[i + 2])]);
		}

		// push tree serialization to swap table in db
		con.query('INSERT INTO swap_tree (data, probability, uid_parent) VALUES ?;', [values], function(err, result) {
			if (err) throw err;
			// remove all previous records of stable tree
			con.query('DELETE FROM stable_tree;', function(err, result) {
				if (err) throw err;
				// migrate tree data into actual table
				con.query('INSERT INTO stable_tree SELECT * FROM swap_tree;', function(err, result) {
					if (err) throw err;
					// reset swap table for later use
					con.query('DELETE FROM swap_tree;', function(err, result) {
						if (err) throw err;
						callback();
					});
				});
			});
		});
	}
}

// construct tree from stable_tree table
function constructFromDatabase(tree, callback) {
	// pull tree data from db
	con.query('SELECT * FROM stable_tree;', function(err, result) {
		// ensure serialization is not corrupted
		if (result.length % 3 != 0) {
			console.log("UNABLE TO CONSTRUCT: ERR IN SERIALIZATION");
		} else {
			var idToNode = new Array();	// temp link ids to node objects
			idToNode[0] = tree.root;

			// iterate through data in triplets (data, probability, parent id)
			for (var i = 0; i < result.length; i++) {
				var n = new Node(result[i].data, parseFloat(result[i].probability));
				var parent = idToNode[result[i].uid_parent];	// get parent
				idToNode[result[i].uid] = n;
				parent.children.push(n);
			}

			callback();
		}
	});
}

// apply filtered modifications to stable tree and update all serializations
function applyFilter(callback) {
	var modifiedNodes;
	var deltas;

	// search modifications into tree
	getNodePointers(function(result) {
		modifiedNodes = result.nodes;
		deltas = result.deltas;

		var alpha = calculateAlpha(deltas);	// calculate outlier threshold

		// apply all modifications
		for (var i = 0; i < modifiedNodes.length; i++) {
			var mod = modifiedNodes[i];

			// calculate applied change to make
			var delta_k = delta_k(Math.abs(mod.delta), alpha);
			if (mod.delta < 0) delta_k *= -1;

			// update probability (if negative, make 0)
			mod.node.probability = relu(mod.node.probability + delta_k);
		}

		// prune and recenter
		pruneAndRecenter(searchForMin());

		// for DEBUG!!!!! since we haven't figured out novelty yet
		callback();

		// // add new entries
		// self.applyNovelty(function() {
		// 	global.stableSerialization = self.serializeToString(global.stableTree);
		// 	self.serializeToDatabase(global.stableSerialization, function() {
		// 		callback();
		// 	});
		// });
	});
}

// search modification entries and return pointers to actual nodes in stable tree
function getNodePointers(callback) {
	var nodes = [];
	var deltas = [];
	// var novelty = [];

	// get all modification data
	con.query('SELECT * FROM modifications;', function(err, result) {
		// // debug: need to uncomment this!
		// // clear mod table
		// con.query('DELETE FROM modifications;', function(err, res) {
		// 	if (err) throw err;
		// });

		for (var i = 0; i < result.length; i++) {
			if (Math.abs(result[i].delta) > 0) {
				global.stableTree.traceFullSection(result[i].word.split(''), function(search_res) {
					// if search completed
					if (search_res.remainingBranch.length == 0) {
						nodes.push({node: search_res.node, delta: result[i].delta});	// keep track of node pointer with delta
						deltas.push(Math.abs(result[i].delta));	// add delta abs value for alpha calculation later
					} 
					// else if (result[i].delta > 0) {
					// 	// insert into novelty (if pos delta)
					// 	novelty.push([result[i].word, result[i].delta]);
					// }
				});
			}
		}

		// if (novelty.length > 0) {
		// 	// batch insert all novelty entries
		// 	con.query('INSERT INTO novelty (word, user_frequency) VALUES ?;', [novelty], function(err, result) {
		// 		if (err) throw err;
		// 		console.log("Inserted " + novelty.length + " entries into novelty");
		// 	});
		// }

		callback({nodes: nodes, deltas: deltas});
	});
}

// calculate the outlier threshold, alpha, of a given data set
function calculateAlpha(deltas) {
	deltas.sort(function(a, b){ return a - b });
	var ind = Math.floor(deltas.length / 2);
	var q1, q3;

	// calculate quartiles
	if (deltas.length % 2 == 0) {
		q1 = median(deltas.slice(0, ind));
		q3 = median(deltas.slice(ind, deltas.length));
	} else {
		q1 = median(deltas.slice(0, ind));
		q3 = median(deltas.slice(ind + 1, deltas.length));
	}

	return q3 + (1.5 * (q3 - q1));
}

// get the median of a dataset
function median(dataset) {
	dataset.sort(function(a, b){ return a - b });
	var ind = Math.floor(dataset.length / 2);

	if (dataset.length % 2 != 0) {
		return dataset[ind];
	} else {
		return (dataset[ind] + dataset[ind - 1]) / 2.0;
	}
}

// calculate the "applied" delta based on initial delta
function delta_k(delta_p, alpha) {
	if (delta_p <= alpha) {
		return delta_p;
	} else {
		return alpha * Math.exp(Math.pow(delta_p - alpha, 2) / (-2.0 * alpha));
	}
}

function relu(x) {
	return x > 0 ? x : 0;
}

// recenter and prune all <= 0 branches
function pruneAndRecenter(min_prob) {
	var path = [];
	var current = global.stableTree.root;
	var next;

	while (true) {

		// keep track of current child branch we're searching
		if (current.child_index != undefined) {
			current.child_index++;
		} else {
			current.child_index = 0;
		}

		// recenter when first encountering a terminal node
		if (current.child_index == 0 && (current.probability > 0 || current.children.length == 0)) {
			current.probability -= min_prob;	// recenter probability
		}

		// get next child
		if (current.child_index < current.children.length) {
			next = current.children[current.child_index];
		} else {
			next = undefined;
			delete current.child_index;
		}

		if (next) {
			// move to child
			path.push(current);
			current = next;
		} else if (path.length > 0) {
			// if dead leaf node
			if (current.probability <= 0 && current.children.length == 0) {
				while (true) {
					// backtrack to last terminal node or last node with > 1 children
					current = path.pop();
					if (current.probability != 0 || current.children.length > 1) {
						break;
					}
				}

				// remove child (and thus, dead branch)
				current.children.splice(current.child_index, 1);
				current.child_index--;
			} else {
				// if normal leaf node, backtrack
				current = path.pop();
			}
		} else {
			// if no next child and path empty, break (back at root)
			break;
		}
	}
	// debug
	console.log("Finished pruning / recentering");
}

// determine minimum probability of stable tree
function searchForMin() {
	var stack = [global.stableTree.root];
	var min = Number.POSITIVE_INFINITY;
	while (stack.length > 0) {
		var node = stack.pop();
		stack.push.apply(stack, node.children);

		// update min
		if (node.probability > 0 && node.probability < min) {
			min = node.probability;
		}
	}

	return min;
}

// add trusted novelty entries into stable tree
function applyNovelty(callback) {
	callback();
}

module.exports = {
	serializeToString: serializeToString,
	serializeToDatabase: serializeToDatabase,
	constructFromDatabase: constructFromDatabase,
	applyFilter: applyFilter
}