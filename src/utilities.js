
// utility functions / tools
module.exports = {

	serializeToString: function(tree) {

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

			// make modified copy
			var copy = Object.assign({id: currentID++, parentID: currentParentID}, currentNode);
			delete copy.children;

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

}