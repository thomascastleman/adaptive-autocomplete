
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
util = new util();

var port = 8080;

global.stableTree = new Tree();
global.stableSerialization = "";

server.listen(port, function() {
	console.log('Adaptive autocomplete server listening on port %d', port);
});

// debug ---------------------------------------------------------

// // construct tree from db serialization
// util.constructFromDatabase(global.stableTree, function() {
// 	global.stableSerialization = util.serializeToString(global.stableTree);
// });

// // read words from dictionary into tree
// fs.readFile('./lots_of_words.txt', 'utf8', function (err, data) {
// 	if (err) throw err;

// 	var words = data.split(" ");
// 	for (var i = 0; i < words.length; i++) {
// 		stableTree.increment(words[i]);
// 	}

// 	global.stableSerialization = util.serializeToString(global.stableTree);


// 	util.applyFilter();
// });

// at: 3
global.stableTree.increment('at');
global.stableTree.increment('at');
global.stableTree.increment('at');

// an: 0
global.stableTree.increment('an');
global.stableTree.decrement('an');

global.stableTree.increment('iola');
global.stableTree.decrement('iola');

global.stableTree.increment('iol');
global.stableTree.increment('iol');

global.stableTree.increment('ion');

global.stableTree.increment('it');
global.stableTree.increment('it');
global.stableTree.increment('it');
global.stableTree.increment('it');
global.stableTree.increment('it');
global.stableTree.increment('it');


util.applyFilter();