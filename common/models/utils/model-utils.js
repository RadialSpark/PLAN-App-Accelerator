// server wide constants for status and error messages
var constants = require( './constants' );

/**
 * Callback method to handle errors, including optional transaction management for handling rollbacks in db errors
 * @param res - thee http response modelect
 * @param status - the http error status
 * @param message - the error message
 * @param transaction - optional, the db transaction instance
 * @return If the rollback is successful, the provided error with status and message. Otherwise, the error from the rollback breaking
 */
var handleError = function ( res, status, message, transaction ) {
	// if the transaciton was passed in, then we want to rollback
	if ( transaction ) {
		transaction.rollback( function ( err ) {
			if ( err ) {
				console.log( err );
				return res.status( 500 )
					.send( 'Error: Could not rollback data after error occurred.' );
			}
		} );
	}
	// return the provided status and message
	return res.status( status )
		.send( message );
};

/**
 * Handles sending success responses to the user
 * @param res - the http response modelect
 * @param status - the http status to be sent
 * @param data - the data to be sent in the response body
 * @param transaction - optional transaction for committing to the database
 */
var handleSuccess = function ( res, status, data, transaction ) {
	if ( transaction ) {
		transaction.commit( function ( err ) {
			// if there is an error in committing, then rollback and send a 500 to the user
			if ( err ) {
				return handleError( res, 500, 'Error: Could not commit data to the database', transaction );
			}
			// otherwise return the committed data
			return res.status( status )
				.send( {
					data: data
				} );
		} );
	} else {
		return res.status( status )
			.send( {
				data: data
			} );
	}
};

/**
 * Retrieves the end user from the authorization token in the headers
 * @param auth - the authorization headers for hte logged in user
 * @param model - the loopback model modelect (e.g. Timesheetc)
 * @param callback - the callback to be executed once the end user has been retrieved
 */
var getEndUserFromHeaders = function ( auth, model, callback ) {
	// no authorization headers, so we can't get the user
	if ( !auth ) {
		return callback( {
			status: 401,
			message: constants.errorMessages.notLoggedIn
		} );
	}
	// retrieve the access token in order to get the user id
	model.app.models.AccessToken.findById( auth, function ( err, token ) {
		if ( err ) {
			console.log( err );
			return callback( {
				status: 500,
				message: constants.errorMessages.endUserNotFound
			} );
		}
		// token not found -- stop execution and return 404
		if ( !token ) {
			return callback( {
				status: 404,
				message: constants.errorMessages.invalidAccessToken
			} );
		}
		// retrieve the enduser
		model.app.models.EndUser.findById( token.userId, function ( err, endUser ) {
			if ( err ) {
				console.log( err );
				return callback( {
					status: 500,
					message: constants.errorMessages.endUserNotFound
				} );
			}
			// user was not found
			if ( !endUser ) {
				return callback( {
					status: 404,
					message: constants.errorMessages.endUserNotFound
				} );
			}
			// execute endpoint code based off enduser
			return callback( null, endUser );
		} );
	} );
};


// outward facing interface
module.exports = {
	handleError: handleError,
	handleSuccess: handleSuccess,
	getEndUserFromHeaders: getEndUserFromHeaders
};
