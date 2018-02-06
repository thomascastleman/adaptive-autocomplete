var constants = require('./constants.js');
var Node = require('./Node.js');

module.exports = function(_treeQuality) {

	this.treeQuality = _treeQuality;
	this.root = new Node(undefined, undefined);

	this.log = function() {
		console.log();
		var stack = [this.root];
		var total = 0;
		while (stack.length > 0) {
			var node = stack.pop();
			total++;
			stack.push.apply(stack, node.children);
			console.log(node);
		}
		console.log(total + ' nodes total');
	}

	// serialize all nodes and tree structure into json format
	this.serialize = function() {

		var allNodes = []; 				// every node in tree
		var numChildren = new Array();	// map of node id to number of children
		var currentNode;				// current node being serialized
		var currentID = 1;				// id of node
		var currentParentID = 0;		// id of parent
		var currentNumChildren = this.root.children.length;	// num children remaining to be serialized of this parent
		var q = [];
		q.push.apply(q, this.root.children);	// start with children of root

		// while still nodes left to serialize
		while (q.length > 0) {
			currentNode = q.shift();								// pop from queue
			q.push.apply(q, currentNode.children);					// add children to q
			numChildren[currentID] = currentNode.children.length;	// get number of children off this id

			// make modified copy
			var copy = Object.assign({id: currentID++, parentID: currentParentID}, currentNode);
			delete copy.children;
			allNodes.push(copy);

			// decrease num children left to serialize from this parent
			currentNumChildren--;
			if (currentNumChildren == 0) {
				// move to next parent if out of children
				currentParentID++;
				currentNumChildren = numChildren[currentParentID];
			}
		}

		return JSON.stringify(allNodes);
	}

	// construct full tree from json serialization
	this.construct = function(serialization) {
		var nodes = JSON.parse(serialization); // parse json
		var idToNode = new Array();	// temp link ids to node objects
		idToNode[0] = this.root;

		for (var i = 0; i < nodes.length; i++) {
			var n = nodes[i];	// get node
			var parent = idToNode[n.parentID];	// get parent
			idToNode[n.id] = n;
			n.children = [];

			// remove unnecessary attributes
			delete n.id;
			delete n.parentID;

			// add to parent's children
			parent.children.push(n);
		}
	}

	// return true if string A comes alphabetically before B, false otherwise
	this.alphaLessThan = function(strA, strB) {
		// this doesn't support word comparison YET
		return strA.charCodeAt(0) < strB.charCodeAt(0);
	}

	this.pushInOrder = function(array, completionData) {
		var min = 0;
		var max = array.length;
		var halfway, h;
		var insertion;

		if (array.length == 0) {
			// push normally
			array.push(completionData);
		} else {

			while (true) {

				halfway = Math.floor((max - min) / 2) + min;
				h = array[halfway];

				// if same probability
				if (h.node.probability == completionData.node.probability) {
					array.splice(halfway, 0, completionData);	// insert into array
					break;
				// if halfway comes before
				} else if (h.node.probability > completionData.node.probability) {
					insertion = max;
					min = halfway + 1;
				// if halfway comes after
				} else {
					insertion = min;
					max = halfway;
				}

				// insert if no match in array
				if (min == max) {
					array.splice(insertion, 0, completionData);
					break;
				}
			}
		}
	}

	// asynchronously trace from a node to one of its childs which matches given data
	this.traceToChild = function(node, data, callback) {

		var result = {};
		var min = 0;
		var max = node.children.length;
		var halfway, h;

		while (true) {
			// calculate halfway index and get node
			halfway = Math.floor((max - min) / 2) + min;
			h = node.children[halfway];

			// if match found
			if (h.data == data) {
				result.matchingChild = h;
				delete result.insertion_index;
				break;
			// if halfway node comes before
			} else if (this.alphaLessThan(h.data, data)) {
				result.insertion_index = max;	// insert to the right
				min = halfway + 1;
			// if halfway node comes after
			} else {
				result.insertion_index = min;	// insert to the left
				max = halfway;
			}

			if (min == max) break;
		}

		callback(result);
	}

	// trace a branch down tree as far as possible
	this.traceFullSection = function(branch, callback) {
		var lowest = this.root;
		var result;

		for (var i = 0; i < branch.length; i++) {
			// trace from current lowest to child with matching data
			this.traceToChild(lowest, branch[i], function(data) {
				if (!data.matchingChild) {
					// return lowest node found, remaining branch to trace, and where to insert
					result = {node: lowest, remainingBranch: branch.slice(i, branch.length), insertion_index: data.insertion_index};
					return;
				} else {
					lowest = data.matchingChild;	// move to child node
				}
			});
			if (result) break;
		}

		if (!result) result = {node: lowest, remainingBranch: []};
		console.log(result);

		// return terminal node and empty remaining branch
		callback(result);
	}

	// search the subtree rooted at a given node for all terminal node completions
	this.getSubtreeCompletions = function(node, fragment) {
		// for word tree maybe check if fragment is undefined here and just return ordered children of this node

		var completions = [];
		var stack = node.children;

		while (stack.length > 0) {
			var node = stack.pop();

			// if actual node
			if (node) {
				// if terminal node
				if (node.probability > 0) {
					// add string to completions
					this.pushInOrder(completions, {completion: fragment.slice() + node.data, node: node});
				} else {
					// push separator and all children
					stack.push(undefined);
					stack.push.apply(stack, node.children);
					fragment += node.data;
				}

			} else {
				// backtrack
				fragment = fragment.substring(0, fragment.length - 1);
			}
		}

		return completions;
	}

	// add a new branch starting from a given node, and inserting to a given index
	this.addSection = function(node, insertion_index, branch) {
		if (branch.length > 0) {
			var currentNode = node;	// start at last matching node

			while (branch.length > 0) {
				var child = new Node(branch.shift(), 0);			// init new node
				currentNode.children.splice(insertion_index, 0, child);		// add child to children of current node
				currentNode = child;										// move to child
				insertion_index = 0;										// (after initial use, insertion index defaults to 0)
			}

			currentNode.probability = 1;	// init terminal probability
		}
	}

	// trace word into tree and increment terminal probability, create branch if nonexistent
	this.increment = function(word) {
		var self = this;

		this.traceFullSection(word.split(""), function(result) {
			// if full word found
			if (result.remainingBranch.length == 0) {
				result.node.probability++;
				if (result.node.localDelta) {
					result.node.localDelta++;
				} else {
					result.node.localDelta = 1
				}

				// if delta exceeds threshold !!!
					// ping server here
			} else {
				self.addSection(result.node, result.insertion_index, result.remainingBranch);
			}
		});
	}

	// trace word into tree and decrement terminal probability
	this.decrement = function(word) {

	}

	// train wordtree on corpus of text
	this.train = function(data) {

	}

}