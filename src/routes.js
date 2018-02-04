var Node = require('./Node.js');

module.exports = function(app) {

	app.get('/', function(req, res) {
		console.log(global.stableTree);
		res.render('client.html');
	});

}

