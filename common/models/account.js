// import error handling and commit handling
var modelUtils = require( './utils/model-utils' );
// server wide constants
var constants = require( './utils/constants' );
var accountServices = require( './services/account.services' );

module.exports = function ( Account ) {
	/**
	 * Retrieves all accounts as a map
	 * @param req - the http request object
	 * @param res - the http response object
	 */
	Account.getAccountMap = function ( req, res ) {
		accountServices.getAccountMap( Account, null, function ( err, accountMap ) {
			if ( err ) {
				console.log( err );
				return modelUtils.handleError( res, err.status, err.message );
			}
			return modelUtils.handleSuccess( res, 200, accountMap );
		} )
	};

	/**
	 * Registers the getAccountsMap method
	 */
	Account.remoteMethod(
		'getAccountMap', {
			http: {
				path: '/accountMap',
				verb: 'get'
			},
			description: 'Return all accounts as a map.',
			accepts: [ {
				arg: 'req',
				type: 'object',
				http: {
					source: 'req'
				}
			}, {
				arg: 'res',
				type: 'object',
				http: {
					source: 'res'
				}
			} ],
			returns: [ {
				arg: 'data',
				type: 'object',
				description: 'Map of all sfids to accounts.'
			} ]
		} );
};
