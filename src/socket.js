
var Node = require('./Node.js');
var Tree = require('./Tree.js');

module.exports = function(s) {

	// on client connection through socket
	s.on('connection', function(socket) {

		// send all necessary data on connection
		socket.emit('initial data', {
			node_class: Node.toString(),
			tree_class: Tree.toString(),
			tree_data: global.stableSerialization
		});

		// when completion accepted by client
		socket.on('completion accepted', function(data) {
			console.log("'" + data.word + "' accepted");
		});
	});

}