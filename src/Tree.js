var constants = require('./constants.js');
var Node = require('./Node.js');

module.exports = function(_treeQuality) {
	
	this.treeQuality = _treeQuality;
	this.root = new Node(undefined, undefined);

	this.serialize = function() {

		var allNodes = []; 				// every node in tree
		var numChildren = new Array();	// map of node id to number of children
		var currentNode;				// current node being serialized
		var currentID = 0;				// id of node
		var currentParentID = -1;		// id of parent
		var currentNumChildren = 1;		// num children remaining to be serialized of this parent
		var q = [this.root];			// queue starts with just root

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
}