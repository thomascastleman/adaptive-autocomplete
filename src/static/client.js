
var socket;
var Node;
var Tree;
var charTree;
var wordTree;

// completion data
var fragment;				// (string) the current substring fragment from which we're completing
var tracepoint;				// (Node) pointer to lowest node we've traced down in tree
var tabbed;					// (bool) did user tab over completions in most recent offering?
var offeringCompletions;	// (bool) are completions currently being offered (changes function of some keys)
var ranSearch;				// (bool) was a search attempted at some point throughout typing
var completions = [];		// (Node[]) set of completions found so far, if exist

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