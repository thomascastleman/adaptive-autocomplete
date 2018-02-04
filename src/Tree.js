var constants = require('./constants.js');
var Node = require('./Node.js');

module.exports = function(_treeQuality) {
	this.treeQuality = _treeQuality;
	this.root = new Node(undefined, 0);


	this.serialize = function() {

		var allNodes = [];

		var currentNode = Object.assign({}, this.root);	// copy root node
		currentNode.id = 0;

		allNodes.push(currentNode);

		var currentID = 1;
		var currentParentID = 0;
		var currentNumChildren = this.root.children.length;

		var q = this.root.children;


		while (q.length > 0) {



			currentNode = q.shift();
			q.push.apply(q, currentNode.children);

			if (currentNumChildren == 0) {
				currentParentID++;
				currentNumChildren = 
			}

			var copy = Object.assign({}, currentNode);

			copy.id = currentID++;
			// currentID++;

			copy.parentID = currentParentID++;
			// currentParentID++;

			allNodes.push(copy);

			currentNumChildren--;

		}

		return JSON.stringify(allNodes);
	}
}