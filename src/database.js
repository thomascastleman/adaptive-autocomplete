var mysql = require('mysql');
var creds = require('./credentials.js');

var con = mysql.createConnection({
    host: 'localhost',
    user: creds.MySQL_username,
    password: creds.MySQL_password,
    database: 'adaptive_complete'
});

module.exports = {
	connection : con
}