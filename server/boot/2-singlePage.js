var path = require( 'path' );

module.exports = function singlePage( app ) {
	// Handle path location strategy for Angular 2 Routing
	app.get( '/page', function ( req, res ) {
		res.sendFile( path.join( __dirname, '../../client/index.html' ) );
	} );
	app.get( '/page/*', function ( req, res ) {
		res.sendFile( path.join( __dirname, '../../client/index.html' ) );
	} );
};
