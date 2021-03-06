
var express         = require('express');
var mustacheExpress = require('mustache-express');
var bodyParser      = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.engine('html', mustacheExpress());
app.use('/', express.static('static'));

var server          = require('http').createServer(app);
var socket          = require('socket.io')(server);
var fs 				= require('fs');	// for temp debug tree data
var listeners		= require('./socket.js')(socket);
var routes          = require('./routes.js')(app);
var Node			= require('./Node.js');
var Tree			= require('./Tree.js');
var database		= require('./database.js');
var util			= require('./utilities.js');

var port = 8080;

// tree data
global.stableTree = new Tree();
global.stableSerialization = "";

// thresholds
global.noveltyThreshold = 0.9;
global.netDeltaThreshold = 100;

// net change in stable tree
global.netDelta = 0;

console.log("Novelty Threshold @ " + global.noveltyThreshold);
console.log("Net Delta Threshold @ " + global.netDeltaThreshold + "\n");

// bring service to working state
util.initialize(function() {
	console.log("Finished initialization.\n");

	// launch server
	server.listen(port, function() {
		console.log('Adaptive autocomplete server listening on port %d', port);
	});
});

// // debug ---------------------------------------------------------

// // read words from dictionary into tree
// fs.readFile('./lots_of_words.txt', 'utf8', function (err, data) {
// 	if (err) throw err;

// 	var words = data.split(" ");
// 	for (var i = 0; i < words.length; i++) {
// 		stableTree.increment(words[i]);
// 	}

// 	global.stableSerialization = util.serializeToString(global.stableTree);
// 	util.serializeToDatabase(global.stableSerialization, function() {
// 		console.log("Finished serializing");
// 	});
// });