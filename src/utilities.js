var database = require('./database.js');
var con = database.connection;

// utility functions / tools
module.exports = function() {

	// write tree data to string
	this.serializeToString = function(tree) {

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

	// write tree safely into stable_tree table
	this.serializeToDatabase = function(serialization) {
		var data = serialization.split(' ');

		// ensure serialization is not corrupted
		if (data.length % 3 != 0) {
			console.log("ERR IN SERIALIZATION (utilities.js: serialize to db)");
		} else {

			this.insertAllToSwap(data, function() {
				con.query('SELECT * FROM swap_tree;', function(err, res) {
					if (err) throw err;
					console.log(res);
					console.log("FINISHED getting from swap");
				});
			});

		}
	}

	this.insertAllToSwap = function(data, callback) {
		// iterate through data in triplets (data, probability, parent id)
		var id = 1;
		for (var i = 0; i < data.length; i += 3) {
			console.log(data.slice(i, i + 3));
			con.query('INSERT INTO swap_tree (data, probability, uid_parent) VALUES (?, ?, ?);', [data[i], data[i + 1], data[i + 2]], function(err, result) {
				if (err) throw err;
			});
		}
		callback();
	},

	// construct tree from stable_tree table
	this.constructFromDatabase = function(tree) {

	}

}