var Node = require('./Node.js');

module.exports = function(app) {


	app.get('/', function(req, res) {
		res.render('client.html');
	});

}

