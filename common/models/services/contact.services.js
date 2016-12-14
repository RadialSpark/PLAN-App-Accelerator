/**
 * Services method used in the HTTP API endpoints
 */
// import utilities methods for working with models
var modelUtils = require( '../utils/model-utils' );
// server wide constants for status and error messages
var constants = require( '../utils/constants' );

/**
 * Returns a map of contacts to contact related information (name, etc.)
 * @param where - where clause for filtering contacts
 * @param model - db model used to call Loopback functions
 * @param tx - optional transaction for database queries - set to null for no transaction
 * @param callback - callback function
 */
var getContactNamesMap = function ( where, model, tx, callback ) {
	// create the filter based off the where passed in. Limit only fields that are intended to be returned
	var filter = {
		where: where,
		fields: {
			firstname: true,
			lastname: true,
			name: true,
			pg_id__c: true,
			email: true,
			account__pg_id__c: true
		}
	};
	// init the query options
	var options = ( tx ? {
		transaction: tx
	} : {} );
	// find the contacts based on the above filter
	model.app.models.contact.find( filter, options, function ( err, contacts ) {
		if ( err ) {
			console.log( err );
			return callback( {
				status: 500,
				message: constants.errorMessages.couldNotGetContacts
			} );
		}
		// create a map of contact sfids to contact objets
		var contactMap = {};
		for ( var contact of contacts ) {
			contactMap[ contact.pg_id__c ] = contact;
		}
		// send the data back
		return callback( null, contactMap );
	} );
};

module.exports = {
	getContactNamesMap: getContactNamesMap
};
