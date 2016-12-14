var model = require( './model' );

module.exports = function ( app ) {
	// all of the tables that need to be configured should be added here
	var modelNames = [ 'contact', 'account' ];
	// go through all of them and configure if necessary
	for ( var i = 0; i < modelNames.length; i++ ) {
		model( app, modelNames[ i ] );
	}
};
