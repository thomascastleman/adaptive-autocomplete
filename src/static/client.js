
var socket;
var Node;
var Tree;
var charTree;
var wordTree;

// completion data
var fragment = "";			// (string) the current substring fragment from which we're completing
var tracepoint;				// (Node) pointer to lowest node we've traced down in tree
var tabbed;					// (bool) did user tab over completions in most recent offering?
var offeringCompletions;	// (bool) are completions currently being offered (changes function of some keys)
var ranSearch;				// (bool) was a search attempted at some point throughout typing
var completions = [];		// (Node[]) set of completions found so far, if exist

// DEBUG
// var q = [];	// queue of characters yet to be traced async

$(document).ready(function() {
	var $chatbox = $('#chatbox');
	$chatbox.val('');	// make sure chat box is clear

	socket = io();	// init socket connection

	// listen for initial data needed to construct trees
	socket.on('initial data', function(data) {
		console.log("Initial data received");

		// evaluate definitions of node and tree classes
		var node_def = 'Node = ' + data.node_class + ';';
		var tree_def = 'Tree = ' + data.tree_class + ';';
		eval(node_def + tree_def);

		// init char tree from tree data
		charTree = new Tree(undefined);
		charTree.construct(data.tree_data);

		// init tracepoint
		tracepoint = charTree.root;
	});

	// listen for all key presses
	$(window).keydown(function(event) {
		$chatbox.focus();	// select chat box automatically

		// if key is alphabetic
		if (event.keyCode <= 90 && event.keyCode >= 65) {
			fragment += event.key;	// add key to fragment

			if (!tracepoint) {
				console.log("Establishing tracepoint...");//dbug
				// establish tracepoint
				charTree.traceFullSection(fragment.split(''), function(res) {
					if (res.remainingBranch.length == 0) tracepoint = res.node;
				});
			} else {
				console.log("Attempting trace from " + tracepoint.data + " to " + event.key);
				// trace down following this char
				charTree.traceToChild(tracepoint, event.key, function(res) {
					console.log("Result: " + res.node);
					tracepoint = res.node;
					console.log(tracepoint);
				});
			}

			// q.push(event.key);
			// if (q.length == 1) traceQueue();
		}

		// special key listeners
		switch (event.keyCode) {

			// on space key
			case 32:
				fragment = "";	// clear fragment
				break;

			// on backspace key
			case 8:
				// remove a char from fragment if not empty
				if (fragment.length > 0) {
					fragment = fragment.slice(0, fragment.length - 1);
				}
				break;

			// on tab key
			case 9: 
				event.preventDefault();	// prevent tab refocusing in browser
				break;

			// on enter key
			case 13:
				break;
		}
	});
});

// function traceQueue() {
// 	console.log("CALL to traceQueue");
// 	while (q.length > 0) {
// 		// trace this char
// 		charTree.traceToChild(tracepoint, q.shift(), function(res) {
// 			console.log("Traced from '" + tracepoint.data + "' to '" + res.node.data + "'");
// 			tracepoint = res.node;	// update tracepoint
// 		});
// 	}
// }


// DEBUGE
setInterval( function() {
	$('#debug').text("");
	$('#debug').append("Fragment: \'" + fragment + "\'<br>");
	if (tracepoint) $('#debug').append("Tracepoint: \'" + tracepoint.data + "\'<br>");
}, 50);