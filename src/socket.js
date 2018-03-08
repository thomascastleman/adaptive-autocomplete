
var nodeClass 	= require('./Node.js').toString();
var treeClass 	= require('./Tree.js').toString();
var database 	= require('./database.js');
var con = database.connection;

module.exports = function(s) {

	// on client connection through socket
	s.on('connection', function(socket) {

		// maintain new words used by this user to limit access to novelty table
		var used_new_words = [];

		// send all necessary data on connection
		socket.emit('initial data', {
			node_class: nodeClass,
			tree_class: treeClass,
			tree_data: global.stableSerialization
		});

		// on client tree modification
		socket.on('modification', function(data) {
			if (data != undefined) {
				// check if word exists in stable tree
				con.query('SELECT * FROM word_table WHERE word = ?;', [data.word], function(err, result) {
					if (err) throw err;
					// if word exists
					if (result.length > 0) {
						// apply modification
						con.query('INSERT INTO modifications (word, delta) VALUES (?, ?) ON DUPLICATE KEY UPDATE delta = delta + ?;', [data.word, data.delta, data.delta], function(err, result) {
							if (err) throw err;
							console.log("Inserted '" + data.word + "' with delta " + data.delta + " into mod table.");
						});
					} else {
						// if new word NOT already used
						if (used_new_words.indexOf(data.word) == -1) {
							used_new_words.push(data.word);

							con.query('INSERT INTO novelty (word, user_frequency) VALUES (?, 1) ON DUPLICATE KEY UPDATE user_frequency = user_frequency + 1;', [data.word], function(err, result) {
								if (err) throw err;
								console.log("Inserted '" + data.word + "' into novelty");
							});
						}
					}
				});
			}
		});
	});
}