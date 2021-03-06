var Node = require('./Node.js');

module.exports = function() {

	this.root = new Node(undefined, undefined);

	// debug
	this.log = function() {
		console.log();
		var stack = [this.root];
		var total = 0;
		var numChild = 0;
		while (stack.length > 0) {
			var node = stack.pop();
			total++;
			numChild += node.children.length;
			stack.push.apply(stack, node.children);
			console.log(node);
		}
		console.log(total + ' nodes total');
		console.log(numChild / total);
	}

	// construct full tree from json serialization
	this.construct = function(serialization) {
		var data = serialization.split(' ');

		// ensure serialization is not corrupted
		if (data.length % 3 != 0) {
			console.log("UNABLE TO CONSTRUCT: ERR IN SERIALIZATION");
		} else {

			var idToNode = new Array();	// temp link ids to node objects
			idToNode[0] = this.root;

			// iterate through data in triplets (data, probability, parent id)
			for (var i = 0; i < data.length; i += 3) {

				var n = new Node(data[i], parseFloat(data[i + 1]));
				var parent = idToNode[data[i + 2]];	// get parent
				idToNode[(i / 3) + 1] = n;
				parent.children.push(n);
			}
		}
	}

	// return true if string A comes alphabetically before B, false otherwise
	this.alphaLessThan = function(strA, strB) {

		var i = 0;
		while (strA.charAt(i) == strB.charAt(i)) {
			i++;

			if (i >= strA.length) {
				return true;
			} else if (i >= strB.length) {
				return false;
			}
		}

		return strA.charCodeAt(i) < strB.charCodeAt(i);
	}

	// push a completion object to an array such that probability order is maintained
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

		if (node.children.length > 0) {
			while (true) {
				// calculate halfway index and get node
				halfway = Math.floor((max - min) / 2) + min;
				h = node.children[halfway];

				// if match found
				if (h.data == data) {
					result.node = h;
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
		} else {
			result.insertion_index = 0;
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
				if (!data.node) {
					// return lowest node found, remaining branch to trace, and where to insert
					result = {node: lowest, remainingBranch: branch.slice(i, branch.length), insertion_index: data.insertion_index};
					return;
				} else {
					lowest = data.node;	// move to child node
				}
			});
			if (result) break;
		}	

		if (!result) result = {node: lowest, remainingBranch: []};

		// return terminal node and empty remaining branch
		callback(result);
	}

	// search the subtree rooted at a given node for all terminal node completions
	this.getSubtreeCompletions = function(node, fragment) {
		var completions = [];

		// if completing from word tree
		if (fragment == undefined) {
			for (var i = 0; i < node.children.length; i++) {
				// if terminal node
				if (node.children[i].probability > 0) {
					this.pushInOrder(completions, {completion: node.children[i].data, node: node.children[i]});
				}
			}
		// if char tree
		} else {
			var stack = [];
			stack.push.apply(stack, node.children);

			while (stack.length > 0) {
				var node = stack.pop();

				// if actual node
				if (node) {
					// if terminal node
					if (node.probability > 0) {
						// add string to completions
						this.pushInOrder(completions, {completion: fragment.slice() + node.data, node: node});
					}
					if (node.children.length > 0) {
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

	// CHAR TREE
	// trace word into tree and increment terminal probability, create branch if nonexistent
	this.increment = function(word) {
		var self = this;	// capture 'this' from tree scope

		this.traceFullSection(word.split(""), function(result) {
			// if full word found
			if (result.remainingBranch.length == 0) {
				result.node.probability++;
			} else {
				self.addSection(result.node, result.insertion_index, result.remainingBranch);
			}
		});
	}

	// CHAR TREE
	// trace word into tree and decrement terminal probability
	this.decrement = function(word) {
		var self = this;
		this.traceFullSection(word.split(""), function(result) {
			// if full word found
			if (result.remainingBranch.length == 0) {
				if (result.node.probability > 0) result.node.probability--;
			}
		});
	}

	// WORD TREE
	// train wordtree on corpus of text
	this.train = function(words, ngram) {
		var self = this;
		// for each word
		for (var i = 0; i <= words.length - ngram; i++) {
			// trace into tree
			this.traceFullSection(words.slice(i, i + ngram), function(result) {
				if (result.remainingBranch.length == 0) {
					result.node.probability++;
				} else {
					self.addSection(result.node, result.insertion_index, result.remainingBranch);
				}
			});
		}
	}

}