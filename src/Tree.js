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

	// trace a section down tree as far as possible
	this.traceFullSection = function(section) {
		var lowest = this.root;
		var result;

		for (var i = 0; i < section.length; i++) {
			// trace from current lowest to child with matching data
			this.traceToChild(lowest, section[i], function(data) {
				if (!data.matchingChild) {
					// return lowest node found, remaining section to trace, and where to insert
					result = {lowest: lowest, remainingSection: section.slice(i, section.length), insertion_index: data.insertion_index};
				} else {
					lowest = data.matchingChild;	// move to child node
				}
			});
			// if disagreement, return
			if (result) return result;
		}

		// return terminal node and empty remaining section
		return {lowest: lowest, remainingSection: []};
	}

	// search the subtree rooted at a given node for all terminal node completions
	this.getSubtreeCompletions = function(node, fragment) {

	}

	// add a new branch starting from a given node, and inserting to a given index
	this.addSection = function(node, insertion_index, section) {
		if (section.length > 0) {
			var currentNode = node;	// start at last matching node

			while(section.length > 0) {
				var child = new Node(section.shift(), undefined);			// init new node
				currentNode.children.splice(insertion_index, 0, child);		// add child to children of current node
				currentNode = child;										// move to child
				insertion_index = 0;										// (after initial use, insertion index defaults to 0)
			}

			currentNode.probability = 1;	// init terminal probability
		}
	}

	// trace word into tree and increment terminal probability, create branch if nonexistent
	this.increment = function(word) {

	}

	// trace word into tree and decrement terminal probability
	this.decrement = function(word) {

	}

	// train wordtree on corpus of text
	this.train = function(data) {

	}

}