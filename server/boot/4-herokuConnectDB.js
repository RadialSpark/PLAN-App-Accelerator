var connect = require( '../connect/index' );

module.exports = function discoverHerokuConnectDB( app ) {
	//Primary Key management for Heroku Connect
	/* ONLY USE THIS IF YOU ARE USING HEROKU CONNECT ON THE 2ND POSTGRESQL DB */
	connect( app );
};
