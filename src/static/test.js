
/*
String fragment;			// the current substring fragment from which we're completing
Node * tracepoint;			// pointer to lowest node we've traced down in tree
bool tabbed;				// did user tab over completions in most recent offering?
bool offeringCompletions;	// are completions currently being offered (changes function of some keys)
bool ranSearch;				// was a search attempted at some point throughout typing
Node[] completions;	
*/

function Node() {

}

function traceToChild(node, content, callback) {
	console.log("Tracing to child");
	setTimeout(function() {
		callback(node);
	}, 20);
}

function traceQueue() {
	while (q.length > 0) {
		var n = q.shift(); // pop char from q

		// trace to child of tracepoint matching this char
		traceToChild(tracepoint, n, function(node) {
			tracepoint = node;
		})
	}
}

var q = [];
var fragment = "";
var tracepoint;
var tabbed;
var offeringCompletions;
var ranSearch;
var completions = [];


$(document).ready( function() {
	// listen for all key presses
	$(window).keydown(function(event) {
		$('#input').focus();

		// if key is alphabetic
		if (event.keyCode <= 90 && event.keyCode >= 65) {
			console.log("Char: \'" + event.key + "\'");

			$('#offering').text("False");
			$('#output').prepend("now offering completions? " + offeringCompletions + "<br>");


			if (offeringCompletions) {
				offeringCompletions = false;
			}

			fragment += event.key;
			$('#fragment').text(fragment);

			if (!tracepoint) {
				// trace ALL THE WAY
				// add the entirety of the fragment to the q
				// call trace q

			} else {
				// add to char to q
				// if q has 1 element
					// trace q
			}

		}

		// special cases
		switch (event.keyCode) {
			case 32:
				console.log("Space key pressed");


				fragment = "";
				$('#fragment').text();



				break;
			case 8:
				console.log("Backspace key pressed");
				break;
			case 9: 
				console.log("Tab key pressed");
				event.preventDefault();

				if (!offeringCompletions) {
					offeringCompletions = true;
					tabbed = false;

					if (fragment == "") {
						$('#output').prepend("Searching word tree...<br>");
					}	

					else if (completions.length == 0) {
						$('#output').prepend("Running search on \'" + fragment + "\'...<br>")
					} else {
						$('#ouput').prepend("Removing all no longer possible<br>");
						$('#output').prepend("Reseting visibility attributes");
					}
				} else {
					$('#output').prepend("scrolling to next completion<br>");
				}

				$('#output').prepend("OFfering copletions? " + offeringCompletions + "<br>");


				break;
			case 13:
				console.log("Enter key pressed");
				break;
		}
	});

});