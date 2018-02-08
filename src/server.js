
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
	console.log('Adaptive autocomplete server listening on port %d', port);
});


// debug ---------------------------------------------------------
var words = "Of on affixed civilly moments promise explain fertile in. Assurance advantage belonging happiness departure so of. Now improving and one sincerity intention allowance commanded not. Oh an am frankness be necessary earnestly advantage estimable extensive. Five he wife gone ye. Mrs suffering sportsmen earnestly any. In am do giving to afford parish settle easily garret.".split(" ");
for (var i = 0; i < words.length; i++) {
	stableTree.increment(words[i]);
}