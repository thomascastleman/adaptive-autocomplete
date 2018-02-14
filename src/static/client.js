
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
			// no longer offering completions
			if (offeringCompletions) offeringCompletions = false;

			// establish fragment if backspaced
			if (fragment == '') {
				var chat_string = $chatbox.val();
				if (chat_string[chat_string.length - 1] != ' ') {
					chat_string = chat_string.split(" ");
					fragment = chat_string[chat_string.length - 1];
				}
			}
			fragment += event.key;	// add key to fragment

			if (!tracepoint) {
				console.log("Establishing tracepoint...");//dbug
				// establish tracepoint
				charTree.traceFullSection(fragment.split(''), function(res) {
					if (res.remainingBranch.length == 0) tracepoint = res.node;
					console.log("Resulting tp: ");
					console.log(tracepoint);
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
		}

		// special key listeners
		switch (event.keyCode) {

			// on backspace key
			case 8:
				// remove a char from fragment if not empty
				if (fragment.length > 0) {
					fragment = fragment.slice(0, fragment.length - 1);
				}

				// clear search data
				tracepoint = undefined;
				tabbed = false;
				offeringCompletions = false;
				ranSearch = false;
				completions = [];
				break;

			// on tab key
			case 9: 
				event.preventDefault();	// prevent tab refocusing in browser

				if (!offeringCompletions) {
					// if we CAN search
					if (tracepoint) {

						offeringCompletions = true;
						tabbed = false;

						if (fragment == "") {
							var chat_string = $chatbox.val();
							if (chat_string[chat_string.length - 1] == ' ') {

								// SEARCH WORD TREE

								ranSearch = false;
							} else {
								// get last string in chat string as fragment
								var split = chat_string.split(" ");
								fragment = split[split.length - 1];
							}

						} else if (completions.length == 0) {
							completions = charTree.getSubtreeCompletions(tracepoint, fragment);
							ranSearch = true;
						} else {
							var copy = [];
							// remove all completions no longer possible
							for (var i = 0; i < completions.length; i++) {
								var sub = completions[i].completion.slice(0, fragment.length);
								if (sub == fragment) copy.push(completions[i]);
							}
							completions = copy;

							// RESET VISIBILITY
						}

						for (var i = 0; i < completions.length; i++) {
							console.log(completions[i].completion);
						}
					}
				} else {

					// SCROLL TO NEXT COMPLETION OPTION

				}

				break;

			// on enter key
			case 13:
				break;

			// on space key
			case 32:
				if (offeringCompletions) {
					offeringCompletions = false;
					// REMOVE COMPLETION DISPLAY
				}

				fragment = "";	// clear fragment
				tracepoint = undefined;
				break;
		}
	});
});

// DEBUGE
setInterval( function() {
	$('#debug').text("");
	$('#debug').append("Fragment: \'" + fragment + "\'<br>");
	$('#debug').append("Offering: " + offeringCompletions + "<br>");
	$('#debug').append("Tabbed: " + tabbed + "<br>");
	$('#debug').append("Ransearch: \'" + ranSearch + "<br>");
	if (tracepoint) $('#debug').append("Tracepoint: \'" + tracepoint.data + "\'<br>");
}, 50);