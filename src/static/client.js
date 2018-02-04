
var socket;
var Node;
var Tree;
var charTree;
var wordTree;

$(document).ready(function() {

	socket = io();	// init socket connection

	socket.on('initial data', function(data) {
		console.log("Initial data received");

		// evaluate definitions of node and tree classes
		var node_def = 'Node = ' + data.node_class + ';';
		var tree_def = 'Tree = ' + data.tree_class + ';';
		eval(node_def + tree_def);

		// init char tree from tree data
		charTree = new Tree(undefined);
		charTree.construct(data.tree_data);

	});

	// listen for all key presses
	$(window).keydown(function(event) {
		$('#input').focus();

		// if key is alphabetic
		if (event.keyCode <= 90 && event.keyCode >= 65) {
			console.log("Char: \'" + event.key + "\'");
		}

		// special cases
		switch (event.keyCode) {
			case 32:
				console.log("Space key pressed");
				break;
			case 8:
				console.log("Backspace key pressed");
				break;
			case 9: 
				console.log("Tab key pressed");
				event.preventDefault();
				break;
			case 13:
				console.log("Enter key pressed");
				break;
		}
	});
});