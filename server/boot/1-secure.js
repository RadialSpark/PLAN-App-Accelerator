var helmet = require( 'helmet' );

module.exports = function secureApp( app ) {
	// Enable HelmetJS XSS protections and ensure that HTTPS transports are used for Production instance
	if ( process.env.NODE_ENV === 'production' ) {
		app.use( helmet() );
		app.enable( 'trust proxy' );
		app.use( function ( req, res, next ) {
			if ( !req.secure ) {
				return res.redirect( [ 'https://', req.get( 'Host' ), req.url ].join( '' ) );
			}
			next();
		} );
	}
};
