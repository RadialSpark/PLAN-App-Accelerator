var loopback = require( 'loopback' );
module.exports = function enableAuthentication( server ) {
	// enable authentication
	server.enableAuth();
	// enable use of the me token in urls e.g. /endusers/me/someResource
	server.middleware( 'auth', loopback.token( {
		currentUserLiteral: 'me'
	} ) );
};
