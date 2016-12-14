var roles = require( '../roles/index.js' );

module.exports = function syncPgDB( app ) {
	// Auto-Update PGDB to match latest models
	var pgDB = app.dataSources.pgDB;
	pgDB.isActual( function ( err, actual ) {
		if ( !actual ) {
			pgDB.autoupdate( function ( err ) {
				if ( err ) {
					throw err;
				}
				roles( app );
			} );
		} else {
			roles( app );
		}
	} );
};
