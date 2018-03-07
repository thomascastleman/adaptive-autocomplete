
var nodeClass 	= require('./Node.js').toString();
var treeClass 	= require('./Tree.js').toString();
var database 	= require('./database.js');
var con = database.connection;

module.exports = function(s) {

	// on client connection through socket
	s.on('connection', function(socket) {

		// send all necessary data on connection
		socket.emit('initial data', {
			node_class: nodeClass,
			tree_class: treeClass,
			tree_data: global.stableSerialization
		});

		// on client tree modification
		socket.on('modification', function(data) {
			con.query('INSERT INTO modifications (word, delta) VALUES (?, ?) ON DUPLICATE KEY UPDATE delta = delta + ?;', [data.word, data.delta, data.delta], function(err, result) {
				if (err) throw err;
				console.log("Inserted '" + data.word + "' with delta " + data.delta + " into mod table.");
			});
		});
	});
}

// check if a record exists:
// SELECT COUNT(*) FROM <table> WHERE <condition>;