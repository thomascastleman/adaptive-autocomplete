
var Node = require('./Node.js');
var Tree = require('./Tree.js');

module.exports = function(socket) {

	socket.on('connection', function(sock) {

		// send all necessary data on connection
		sock.emit('initial data', {
			node_class: Node.toString(),
			tree_class: Tree.toString(),
			tree_data: global.stableTree.serialize(),
		});
	});

}