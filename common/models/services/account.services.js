// import error handling and commit handling
var modelUtils = require( '../utils/model-utils' );
// server wide constants
var constants = require( '../utils/constants' );

/**
 * Retrieves all accounts as a map
 * @param model - db model used to call Loopback functions
 * @param tx - optional transaction for database queries - set to null for no transaction
 * @param callback - callback function
 */
var getAccountMap = function ( model, tx, callback ) {
	// init the query options
	var options = ( tx ? {
		transaction: tx
	} : {} );
	// get all accounts and return them
	model.app.models.account.find( {}, options, function ( err, accounts ) {
		// internal DB error
		if ( err ) {
			console.log( err );
			return callback( {
				status: 500,
				message: constants.errorMessages.couldNotGetAccounts
			} );
		}
		// create a map of account ids to account objects
		var accountMap = {};
		for ( var account of accounts ) {
			accountMap[ account.pg_id__c ] = account;
		}
		return callback( null, accountMap );
	} );
};

module.exports = {
	getAccountMap: getAccountMap
};
