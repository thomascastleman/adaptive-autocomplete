
var nodeClass = require('./Node.js').toString();
var treeClass = require('./Tree.js').toString();

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
			console.log("'" + data.word + "' modified by " + data.delta);
		});
	});

}