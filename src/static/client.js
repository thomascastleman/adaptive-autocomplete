
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
			if (offeringCompletions) {
				offeringCompletions = false;
				hideCompletions();
			}

			// establish fragment if backspaced
			if (fragment == '') {
				fragment = $chatbox.val().split(" ");
				fragment = fragment[fragment.length - 1];
			}

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
					socket.emit('completion accepted', {word: selectedCompletion.completion});
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

				// DO ALL OF THE ANALYTICS HERE (tabbed and search data)

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