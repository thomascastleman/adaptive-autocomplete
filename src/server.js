
var express         = require('express');
var mustacheExpress = require('mustache-express');
var bodyParser      = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.engine('html', mustacheExpress());
app.use('/', express.static('static'));

var moment          = require('moment');
var server          = require('http').createServer(app);
var socket          = require('socket.io')(server);


var listeners		= require('./socket.js')(socket);
var routes          = require('./routes.js')(app);
var constants		= require('./constants.js');

var Node			= require('./Node.js');
var Tree			= require('./Tree.js');
var Database		= require('./Database.js');

var port = 8080;

// init trees
global.stableTree = new Tree(constants.STABLE);
global.unstableTree = new Tree(constants.UNSTABLE);
global.noveltyTree = new Tree(constants.NOVELTY);

server.listen(port, function() {
	console.log("Autocomplete server listening on port %d", port);
});



// debug ---------------------------------------------------------


stableTree.root.children.push(new Node('a', 10));
stableTree.root.children.push(new Node('c', 20));
stableTree.root.children.push(new Node('h', 21));
stableTree.root.children.push(new Node('q', 56));
stableTree.root.children[0].children.push(new Node('n', 7));
stableTree.root.children[0].children.push(new Node('r', 5));
stableTree.root.children[1].children.push(new Node('a', 16));
stableTree.root.children[1].children[0].children.push(new Node('t', 15));

console.log(stableTree.traceFullSection(['c', 'a', 'x']));