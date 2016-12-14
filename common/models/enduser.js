// import error handling and commit handling
var modelUtils = require( './utils/model-utils' );
// server wide constants
var constants = require( './utils/constants' );
// enduser point services
var endUserServices = require( './services/enduser.services' );

module.exports = function ( EndUser ) {
	/**
	 * validates user access token
	 * @param access_token - url access token
	 * @param req - the http request object
	 * @param res - the http response object
	 */
	EndUser.validate = function ( access_token, req, res ) {
		endUserServices.validate( access_token, req.headers.authorization, EndUser, function ( err, token ) {
			if ( err ) {
				return modelUtils.handleError( res, err.status, err.message );
			}
			return modelUtils.handleSuccess( res, 200, token );
		} );
	};

	EndUser.remoteMethod(
		'validate', {
			http: {
				path: '/validate',
				verb: 'get'
			},
			description: 'Verify the current User Id and Access Token match and are valid.',
			accepts: [ {
				arg: 'access_token',
				type: 'string'
			}, {
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
				arg: 'isValid',
				type: 'boolean'
			}, {
				arg: 'accessToken',
				type: 'object'
			} ]
		} );

	// resets a user password
	EndUser.on( 'resetPasswordRequest', function ( info ) {
		var url = process.env.ROOT_DOMAIN + '/page/resetPassword';
		var html = '<h1>It seems you\'ve requested a password reset for TimeTracker!</h1>'
		html += '<h3>Click <a href="' + url + ';access_token=' + info.accessToken.id + '">here</a> to reset your password.</h3>';

		EndUser.app.models.SendGrid.send( {
			to: info.email,
			from: '"TimeTracker" <' + process.env.NOREPLYEMAIL_ADDRESS + '>',
			subject: 'Password Reset',
			html: html
		}, function ( err ) {
			if ( !err ) {
				console.log( 'Sending password reset email to: ', info.email );
			} else {
				console.log( 'Error sending password reset email' );
				console.log( 'Error: ', err );
			}
		} );
	} );

	/**
	 * Updates an application user
	 * @param req - the http request object
	 * @param res - the http response object
	 * @param data - the data containing an enduser
	 */
	EndUser.updateEndUser = function ( req, res, data ) {
		// Begins transaction to rollback changes if any errors occur
		EndUser.beginTransaction( {
			isolationLevel: EndUser.Transaction.READ_COMMITTED
		}, function ( err, tx ) {
			if ( err ) {
				console.log( err );
				return modelUtils.handleError( res, 500, constants.errorMessages.couldNotUpdateUser + data.endUser.email, tx );
			}
			endUserServices.updateEndUser( data, EndUser, tx, function ( err, updatedEndUser ) {
				if ( err ) {
					console.log( err );
					return modelUtils.handleError( res, err.status, err.message, tx );
				}
				return modelUtils.handleSuccess( res, 200, updatedEndUser, tx );
			} );
		} );
	};

	/**
	 * Registers the setAdmin method at path /api/EndUser/:id/privileges/admin
	 */
	EndUser.remoteMethod(
		'updateEndUser', {
			http: {
				path: '/update',
				verb: 'post'
			},
			description: 'Updates an endUser',
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
				arg: 'data',
				type: 'object',
				description: 'Object with endUser on endUser property'
			} ],
			returns: [ {
				arg: 'data',
				type: 'object'
			}, ]
		}
	);

	/**
	 * Method that inserts multiple endUsers and creates roll
	 * mappings for endUsers that are admins
	 * @param req - http request object
	 * @param res - http response object
	 * @param data - object containing an array of endUsers
	 */
	EndUser.createEndUsers = function ( req, res, data ) {
		// Begins transaction to rollback changes if any errors occur
		EndUser.beginTransaction( {
			isolationLevel: EndUser.Transaction.READ_COMMITTED
		}, function ( err, tx ) {
			if ( err ) {
				console.log( err );
				return modelUtils.handleError( res, 500, constants.errorMessages.couldNotCreateUsers, tx );
			}
			endUserServices.createEndUsers( data, EndUser, tx, function ( err, endUsers ) {
				if ( err ) {
					console.log( err );
					return modelUtils.handleError( res, err.status, err.message, tx );
				}
				return modelUtils.handleSuccess( res, 201, endUsers, tx );
			} );
		} );
	};

	/**
	 * Registers the setExternal method at path /api/EndUser/create
	 */
	EndUser.remoteMethod(
		'createEndUsers', {
			http: {
				path: '/insert/',
				verb: 'post'
			},
			description: 'Inserts endUsers from an array of endUsers.',
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
				arg: 'data',
				type: 'object',
				description: 'Object containing array of new EndUsers to be inserted into database at prop \"endUsers\"'
			} ],
			returns: [ {
				arg: 'data',
				type: 'object'
			}, ]
		}
	);
};
