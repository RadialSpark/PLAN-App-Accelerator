/**
 * Services method used in the HTTP API endpoints
 */
// import utilities methods for working with models
var modelUtils = require( '../utils/model-utils' );
// server wide constants for status and error messages
var constants = require( '../utils/constants' );

/**
 * Validates a user auth token
 * @param access_token - url access token
 * @param auth - authorization headers
 * @param model - db model used to call Loopback functions
 * @param tx - optional transaction for database queries
 * @param callback - callback function
 */
var validate = function ( access_token, auth, model, callback ) {
	var authorization;
	// pull the token from url or headers
	if ( auth ) {
		authorization = auth;
	} else if ( access_token !== null ) {
		authorization = access_token;
	}
	if ( authorization === null ) {
		return callback( null, {
			isValid: false,
			accessToken: {}
		} );
	}
	// if we have a token, then retrieve it
	model.app.models.AccessToken.findById( authorization, function ( err, accessToken ) {
		if ( err ) {
			return callback( {
				status: 404,
				message: constants.errorMessages.endUserNotFound
			} );
		}
		if ( accessToken === null ) {
			return callback( null, {
				isValid: false,
				accessToken: {}
			} );
		}
		// validate the token
		accessToken.validate( function ( err, isValid ) {
			if ( err ) {
				return callback( {
					status: 404,
					message: constants.errorMessages.endUserNotFound
				} );
			}
			return callback( null, {
				isValid: isValid,
				accessToken: accessToken
			} );
		} );
	} );
};

/**
 * Method for updating end user
 * @param data - object containing endUser for update at prop endUser
 * @param model - db model used to call Loopback functions
 * @param tx - optional transaction for database queries
 * @param callback - callback function
 */
var updateEndUser = function ( data, model, tx, callback ) {
	// Verifies correct data for endPoint before continuing
	if ( !data.endUser ) {
		return callback( {
			status: 400,
			message: constants.errorMessages.endUserRequired
		} );
	}
	if ( !data.endUser.id ) {
		return callback( {
			status: 400,
			message: constants.errorMessages.endUserIDRequired
		} );
	}
	if ( data.endUser.password ) {
		return callback( {
			status: 400,
			message: constants.errorMessages.passwordProvided
		} );
	}
	// init query transaction options
	var options = ( tx ? {
		transaction: tx
	} : {} );
	var updateErrorMessage = constants.errorMessages.couldNotUpdateUser + data.endUser.email;

	// Updates the user in the database
	model.app.models.EndUser.upsert( data.endUser, options, function ( err, updatedEndUser ) {
		if ( err ) {
			console.log( err );
			return callback( {
				status: 500,
				message: updateErrorMessage
			} )
		}
		// Finds the admin role to create or destroy admin mapping
		model.app.models.Role.findOne( {
			where: {
				name: 'admin'
			}
		}, options, function ( err, adminRole ) {
			if ( err ) {
				console.log( err );
				return callback( {
					status: 500,
					message: updateErrorMessage
				} );
			}
			// Destroys all admin mappings to prevent duplication
			model.app.models.RoleMapping.destroyAll( {
				principalType: 'USER',
				principalId: updatedEndUser.id,
				roleId: adminRole.id
			}, options, function ( err, info ) {
				if ( err ) {
					console.log( err );
					return callback( {
						status: 500,
						message: updateErrorMessage
					} );
				}
				// Creates admin mapping if user is admin
				if ( updatedEndUser.admin ) {
					adminRole.principals.create( {
						principalType: 'USER',
						principalId: updatedEndUser.id
					}, options, function ( err, roleMappings ) {
						if ( err ) {
							console.log( err );
							return callback( {
								status: 500,
								message: updateErrorMessage
							} )
						}
						return callback( null, updatedEndUser );
					} )
				} else {
					return callback( null, updatedEndUser );
				}
			} );
		} );
	} );
};

/**
 * Method that inserts multiple endUsers and creates roll
 * mappings for endUsers that are admins
 * @param data - object containing endUser for update at prop endUser
 * @param model - db model used to call Loopback functions
 * @param tx - optional transaction for database queries
 * @param callback - callback function
 */
var createEndUsers = function ( data, model, tx, callback ) {
	// Responds with error if no endUsers provided
	if ( !data.endUsers || !data.endUsers.length ) {
		return callback( {
			status: 400,
			message: constants.errorMessages.mustBeAnArray
		} );
	}
	// Maps of users that check for uniqueness
	var emailToUsersMap = {};
	var idToUsersMap = {};

	// Validation occurs here over before hook because there are
	// times where you would need to insert without some of required data
	// i.e. default user at app startup
	for ( var endUser of data.endUsers ) {
		// -- begin validation of required fields --//
		if ( !endUser.email ) {
			return callback( {
				status: 400,
				message: constants.errorMessages.emailRequired
			} );
		}
		if ( !endUser.firstName ) {
			return callback( {
				status: 400,
				message: constants.errorMessages.firstNameRequired
			} );
		}
		if ( !endUser.lastName ) {
			return callback( {
				status: 400,
				message: constants.errorMessages.lastNameRequired
			} );
		}
		if ( !endUser.contact__r__pg_id__c ) {
			return callback( {
				status: 400,
				message: constants.errorMessages.contactIDRequired
			} )
		}
		// -- end validation of required fields -- //

		// Verifies that contact and email are unique to each user being inserted
		if ( emailToUsersMap[ endUser.email ] ) {
			return callback( {
				status: 400,
				message: constants.errorMessages.uniqueEmail
			} );
		}
		if ( idToUsersMap[ endUser.contact__r__pg_id__c ] ) {
			return callback( {
				status: 400,
				message: constants.errorMessages.multipleUsersForContact
			} );
		}

		// adds user to both email and sfid map
		emailToUsersMap[ endUser.email ] = endUser;
		idToUsersMap[ endUser.contact__r__pg_id__c ] = endUser;

		// sets the username to email
		endUser.username = endUser.email;

		// creates a random password that will be reset when user clicks link in email
		endUser.password = generateRandomPassword();
	}

	// filter to be used for finding any existing users with same email, username, or sfid
	// as any user being inserted
	var endUserFilter = {
		where: {
			or: [ {
				contact__r__pg_id__c: {
					inq: Object.keys( idToUsersMap )
				}
			}, {
				email: {
					inq: Object.keys( emailToUsersMap )
				}
			}, {
				username: {
					inq: Object.keys( emailToUsersMap )
				}
			} ]
		}
	};

	// init query transaction options
	var options = ( tx ? {
		transaction: tx
	} : {} );
	// Looks for end users with matching emails and/or sfContactIds
	model.app.models.EndUser.find( endUserFilter, options, function ( err, duplicateEndUsers ) {
		if ( err ) {
			console.log( err );
			return callback( {
				status: 500,
				message: constants.errorMessages.couldNotCreateUser
			} );
		}

		// returns error if any users that would be duplicates found
		if ( duplicateEndUsers.length ) {
			return callback( {
				status: 400,
				message: constants.errorMessages.duplicateUser
			} )
		}

		// Creates all new end users
		model.app.models.EndUser.create( data.endUsers, options, function ( err, createdUsers ) {
			if ( err ) {
				console.log( err );
				return callback( {
					status: 500,
					message: constants.errorMessages.couldNotCreateUser
				} );
			}

			// Generates array of role mapping objects for users to be given admin roles
			var adminMappings = [];
			for ( var createdUser of createdUsers ) {
				if ( createdUser.admin ) {
					adminMappings.push( {
						principalType: 'USER',
						principalId: createdUser.id
					} )
				}
			}

			// Sends emails and responds with created users if no users need to be given admin role mapping
			if ( !adminMappings.length ) {
				sendPasswordEmails( createdUsers, model );
				return callback( null, createdUsers );
			}

			// Finds the admin role to apply to user
			model.app.models.Role.findOne( {
				where: {
					name: 'admin'
				}
			}, options, function ( err, adminRole ) {
				if ( err ) {
					console.log( err );
					return callback( {
						status: 500,
						message: constants.errorMessages.couldNotCreateUser
					} );
				}

				// Inserts all mapping objects created above for admin role
				adminRole.principals.create( adminMappings, options, function ( err, roleMappings ) {
					if ( err ) {
						console.log( err );
						return callback( {
							status: 500,
							message: constants.errorMessages.couldNotCreateUser
						} );
					}

					// Sends emails and responds with created users
					sendPasswordEmails( createdUsers, model );
					return callback( null, createdUsers );
				} )
			} );;
		} );
	} );
};

/**
 * Helper function to generate random password
 * @return string: generated password
 */
var generateRandomPassword = function () {
	var result = '';
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()';
	for ( var i = 32; i > 0; --i ) result += chars[ Math.floor( Math.random() * chars.length ) ];
	return result;
}

/**
 * Helper function to send set password emails to created users
 * @param users - users that need an email sent to them
 * @param model - the loopback model used for operations
 */
var sendPasswordEmails = function ( users, model ) {
	// tracks the number of token creation / send email attempts
	// that have occured. This is used to commit after all attempts
	// have been made.
	var accessTokenSendAttempts = 0;

	// Function that generates an access token and sends it as part of a link in an email
	// This is done as funciton to give scope to each user in later for loop
	var createTokenThenSendEmail = function ( user, tx ) {
			// Creates an access token for the user (expiring after 48 hours or 172800 seconds)
			user.createAccessToken( 172800, {
				transaction: tx
			}, function ( err, token ) {
				if ( err ) {
					// counts an attempt if an error occurs
					accessTokenSendAttempts++;
					console.log( 'Error creating accessToken for: ', user.email );
					console.log( 'Error: ', err )
						// commits any and all successes if all attempts have been made
					if ( accessTokenSendAttempts === users.length ) {
						tx.commit();
					}
				}
				// URL to be used in email link
				var url = process.env.ROOT_DOMAIN + '/page/resetPassword';
				// HTML of email body
				var html =
					'<h1>Someone created you a TimeTracker account!</h1>' +
					'<table><tr><th>Username: </th><td>' +
					user.email.split( '@' )[ 0 ] + '<span>@</span>';

				// Breaks email domain into seperate spans so email clients don't create links for email
				var emailDomain = user.email.split( '@' )[ 1 ].split( '.' );
				for ( var part in emailDomain ) {
					html += '<span>' + emailDomain[ part ] + '</span>';
					if ( part < emailDomain.length - 1 ) html += '.';
				}

				html += '</td></tr><tr><th>Password: </th><td><a href="' +
					url + ';access_token=' + token.id +
					'">Set your password</a></tr></table>';

				// Sends the email to the user's email
				model.app.models.SendGrid.send( {
					to: user.email,
					from: '"TimeTracker" <' + process.env.NOREPLYEMAIL_ADDRESS + '>',
					subject: 'Your TimeTracker User Account',
					html: html
				}, function ( err ) {
					if ( !err ) {
						console.log( 'Sending password setup email to: ', user.email );
						// counts an attempt if an error occurs
						accessTokenSendAttempts++;
					} else {
						console.log( 'Error sending password setup email to: ', user.email );
						console.log( 'Error: ', err );
						// counts an attempt if an error does not occur
						accessTokenSendAttempts++;
					}

					// commits any and all successes if all attempts have been made
					if ( accessTokenSendAttempts === users.length ) {
						tx.commit();
					}
				} );
			} );
		}
		// Begins transaction to send all emails and create all access tokens under single transaction
	model.beginTransaction( {
		isolationLevel: model.Transaction.READ_COMMITTED
	}, function ( err, tx ) {
		// creates an access token and emails it for each user
		for ( var user of users ) {
			createTokenThenSendEmail( user, tx );
		}
	} );
};


module.exports = {
	validate: validate,
	updateEndUser: updateEndUser,
	createEndUsers: createEndUsers
};
