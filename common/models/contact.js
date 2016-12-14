// import error handling and commit handling
var modelUtils = require( './utils/model-utils' );
// server wide constants
var constants = require( './utils/constants' );
var contactServices = require( './services/contact.services' );

module.exports = function ( Contact ) {
	/**
	 * Returns a map of contacts to contact related information (name, etc.)
	 * @param req - the http request object
	 * @param res - the http respones object
	 * @where - there where clause for filtering which contact names to get
	 */
	Contact.getContactNamesMap = function ( req, res, where ) {
		contactServices.getContactNamesMap( where, Contact, null, function ( err, contactMap ) {
			if ( err ) {
				console.log( err );
				return modelUtils.handleError( res, err.status, err.message );
			}
			return modelUtils.handleSuccess( res, 200, contactMap );
		} );
	};

	// set the getContactNamesMap function to be called at the url /api/contacts/NamesMap
	Contact.remoteMethod(
		'getContactNamesMap', {
			http: {
				path: '/namesMap',
				verb: 'get'
			},
			description: 'returns an object of pg ids to contact names (inside contact object).',
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
			}, {
				arg: 'where',
				type: 'object',
				description: 'A where clause for filtering which contact names to retrieve.'
			} ],
			returns: [ {
				arg: 'data',
				type: 'object',
				description: 'Map of pg ids to contacts.'
			} ]
		} );
};
