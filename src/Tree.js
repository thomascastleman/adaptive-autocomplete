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
}