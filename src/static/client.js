
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
var attemptedTrace;			// (bool) has a trace been attempted on this word
var completions = [];		// (Node[]) set of completions found so far, if exist

var selectedIndex = 0;		// index of completion the user has selected
var visibleMin;
var visibleMax;

var DEFAULT_NUM_COMPLETIONS = 4;

var $chatbox;
var $completions;

$(document).ready(function() {
	$chatbox = $('#chatbox');
	$chatbox.val('');	// ensure chat box is clear
	$completions = $('#completions');

	socket = io();	// init socket connection

	// listen for initial data needed to construct trees
	socket.on('initial data', function(data) {
		// evaluate definitions of node and tree classes
		var node_def = 'Node = ' + data.node_class + ';';
		var tree_def = 'Tree = ' + data.tree_class + ';';
		eval(node_def + tree_def);

		// init char tree from tree data
		charTree = new Tree();
		charTree.construct(data.tree_data);
		tracepoint = charTree.root;
	});

	// listen for all key presses
	$(window).keydown(function(event) {
		$chatbox.focus();	// select chat box automatically

		// if key is alphabetic
		if (event.keyCode <= 90 && event.keyCode >= 65) {
			// no longer offering completions
			if (offeringCompletions) {
				offeringCompletions = false;
				hideCompletions();
			}

			// establish fragment if backspaced
			if (fragment == '') fragment = $chatbox.val().split(" ").pop();

			fragment += event.key;	// add key to fragment

			// if no tp, establish
			if (!tracepoint) {
				// if no previous attempt on this word, trace
				if (!attemptedTrace) establishTracePoint();
			} else {
				// trace from tp to child with this char
				charTree.traceToChild(tracepoint, event.key, function(res) {
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
				if (fragment.length > 0) fragment = fragment.slice(0, fragment.length - 1);
				clearData();
				break;

			// on tab key
			case 9: 
				event.preventDefault();	// prevent tab refocusing in browser
				tabbed = true;			// register tab

				if (!offeringCompletions) {
					offeringCompletions = true;
					ranSearch = true;

					// if empty fragment (backspace or new word)
					if (fragment == '') {
						var chat_string = $chatbox.val();

						// if last char space (beginning of word)
						if (chat_string[chat_string.length - 1] == ' ') {

							// SEARCH WORD TREE ------------------------------------------

							ranSearch = false;
							break;
						} else {
							// get last string in chat string as fragment
							var split = chat_string.split(" ");
							fragment = split[split.length - 1];
						}
					}

					if (!tracepoint) establishTracePoint();

					// if tp successfully found
					if (tracepoint) {
						// if no completions exist, search
						if (completions.length == 0) {
							completions = charTree.getSubtreeCompletions(tracepoint, fragment);
							ranSearch = true;
						// if search already run
						} else {
							var copy = [];
							
							// remove all completions no longer possible
							for (var i = 0; i < completions.length; i++) {
								delete completions[i].was_visible;	// reset visibility
								var sub = completions[i].completion.slice(0, fragment.length);
								if (sub == fragment) copy.push(completions[i]);
							}
							console.log("Narrowed from " + completions.length + " to " + copy.length);
							completions = copy;
						}

						visibleMin = 0;
						visibleMax = completions.length >= DEFAULT_NUM_COMPLETIONS ? DEFAULT_NUM_COMPLETIONS : completions.length;
						renderCompletions();

						// debug
						for (var i = 0; i < completions.length; i++) {
							console.log(completions[i].completion);
						}
					}
				} else {

					if (selectedIndex < completions.length - 1) {
						selectNextCompletion();	// scroll to next completion
					} else {
						offeringCompletions = false;
						selectedIndex = 0;
						hideCompletions();
					}
				}

				break;

			// on enter key
			case 13:
				if (offeringCompletions) {
					var selectedCompletion = completions[selectedIndex];
					hideCompletions();
					fillCompletion(selectedCompletion.completion);
					selectedCompletion.node.probability++;
					
					socket.emit('modification', {
						word: selectedCompletion.completion,
						delta: 1
					});
				} else {
					// SEND CHAT MESSAGE HERE
				}

				fragment = "";
				clearData();
				break;

			// on space key
			case 32:
				if (offeringCompletions) {
					offeringCompletions = false;
					hideCompletions();
				}

				// data analytics
				if (ranSearch) {
					var user_completed_word = $chatbox.val().split(" ").pop();
					var completion_match;

					for (var i = 0; i < completions.length; i++) {
						if (user_completed_word == completions[i].completion) {
							completion_match = completions[i];
							break;
						}
					}

					// if no match or not visible
					if (!completion_match || !completion_match.was_visible) {
						// word was not visible and user looked for it
						if (tabbed) {
							console.log("word was not visible and user looked for it");
							if (completion_match) {
								incrementNode(completion_match.node);
							} else {
								// add new branch since not in tree
								charTree.increment(user_completed_word);
							}

						// word was not visible and user did not look
						} else {
							console.log("word was not visible and user did not look");
							if (completion_match) {
								decrementNode(completion_match.node);
							}
						}
					// visible
					} else if (completion_match.was_visible) {
						// word was visible and user looked for it
						if (tabbed) {
							console.log("word was visible and user looked for it");
							console.log("What to do?");

						// word was visible and user did not look for it
						} else {
							console.log("word was visible and user did not look for it");
							decrementNode(completion_match.node);
						}
					}
				}

				fragment = "";
				clearData();
				break;
		}
	});
});

function clearData() {
	tracepoint = undefined;
	offeringCompletions = false;
	ranSearch = false;
	tabbed = false;
	attemptedTrace = false;
	completions = [];
	selectedIndex = 0;
}

// establish a tracepoint from the current fragment
function establishTracePoint() {
	console.log("establishing tp on fragment '" + fragment + "'");	// debug
	attemptedTrace = true;
	charTree.traceFullSection(fragment.split(''), function(res) {
		if (res.remainingBranch.length == 0) tracepoint = res.node;
		console.log(res.node);
	});
}

function incrementNode(node) {
	node.probability++;
	if (node.localDelta) {
		node.localDelta++;
	} else {
		node.localDelta = 1
	}
	
	// if delta exceeds threshold !!!
		// ping server here
}

// decrement single node's probability
function decrementNode(node) {
	if (node.probability > 0) {
		node.probability--;
		if (node.localDelta) {
			node.localDelta--;
		} else {
			node.localDelta = -1;
		}

		// if delta exceeds threshold
			// ping server
	}
}

// DEBUGE
setInterval( function() {
	$('#debug').text("");
	$('#debug').append("Fragment: \'" + fragment + "\'<br>");
	$('#debug').append("Offering: " + offeringCompletions + "<br>");
	$('#debug').append("Tabbed: " + tabbed + "<br>");
	$('#debug').append("Ransearch: " + ranSearch + "<br>");
	$('#debug').append("Attempted trace: " + attemptedTrace + "<br>");
	if (completions.length > 0) $('#debug').append("Selected completion: \'" + completions[selectedIndex].completion + "\'<br>");
	
	if (tracepoint) {
		$('#debug').append("<br>TP:<br>");
		$('#debug').append("Data: '" + tracepoint.data + "'<br>");
		$('#debug').append("Prob: " + tracepoint.probability + "<br>");
	}
}, 50);