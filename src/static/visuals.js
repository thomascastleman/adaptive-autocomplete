
// render certain number of completions
function renderCompletions() {
	var html;
	$completions.text('');
	for (var i = visibleMin; i < visibleMax; i++) {
		if (i == selectedIndex) {
			html = '<span style=\"background-color: gray\">' + completions[i].completion + '</span><br>';
		} else {
			html = '<span>' + completions[i].completion + '</span><br>';
		}
		$completions.append(html);
	}
	$completions.show();
}

// remove the display of completions
function hideCompletions() {
	console.log("Hiding completions");
	$completions.hide();
}

// scroll to the next available completion option
function selectNextCompletion() {
	selectedIndex++;

	if (selectedIndex >= visibleMax - 1 && visibleMax < completions.length) {
		visibleMin++;
		visibleMax++;
	}
	renderCompletions();
	console.log(completions[selectedIndex]);

	// NOW UPDATE THE HIGHLIGHTED OFFERING AND IF NECESSARY SCROLL OPTIONS ALONG
}

// write the currently selected completion to the chat string
function fillCompletion(completion) {
	var chat_string = $chatbox.val();

	if (chat_string[chat_string.length - 1] == ' ') {
		chat_string += completion;
	} else {
		chat_string = chat_string.split(" ");
		chat_string.pop();
		chat_string = chat_string.join(" ") + " " + completion;
	}

	$chatbox.val(chat_string + " ");
}