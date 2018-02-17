

// remove the display of completions
function hideCompletions() {
	
}

// scroll to the next available completion option
function selectNextCompletion() {
	selectedIndex++;
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