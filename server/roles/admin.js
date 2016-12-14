// initializes the user roles within the applicaiton, and creates a default admin user if no other users exist
module.exports = function ( app, callback ) {
	/**
	 * Creates a default admin user. **NOTE** This user should be deleted upon app startup once a new admin has been created
	 * @param adminRole - the admin record object from the Role table
	 */
	var createDefaultUser = function ( adminRole ) {
		// create a new user with some default settings
		var newUser = {
			username: 'admin',
			password: 'password',
			firstName: 'default',
			lastName: 'admin',
			email: 'test@cloudsoftwarellc.com'
		};
		// Create a filter to retrieve (or create) the new user defined above
		var filter = {
			where: {
				email: 'test@cloudsoftwarellc.com'
			}
		};
		// if the user somehow already exists, then just find that user
		// otherwise, create a new one.
		app.models.EndUser.findOrCreate( filter, newUser, function ( err, endUser, created ) {
			// there was an error in creating the user. Log and stop execution of the function
			if ( err ) {
				return console.log( err )
			};
			// set the role mapping for the new user to admin
			adminRole.principals.create( {
				principalType: 'USER',
				principalId: endUser.id
			}, function ( err, roleMapping ) {
				// there was an error setting the role mapping. Log and stop execution of the function
				if ( err ) {
					return console.log( err );
				}
				// log information so visible at deployment/startup
				console.log( 'Default admin EndUser was created.' );
				console.log( 'EndUser %j', {
					username: 'admin',
					password: 'password'
				} );
			} );
		} );
	};

	// Create a new admin role if one does not already exist
	app.models.Role.findOrCreate(
		// filter fields for finding the role
		{
			fields: {
				id: true
			},
			limit: 1,
			where: {
				name: 'admin'
			}
		},
		// values for what to set if the role does not exist
		{
			name: 'admin',
			description: 'Loopback System Administrator'
		},
		function ( err, admin, created ) {
			// there was an error finding or creating the role. Log and stop execution of the function
			if ( err ) {
				return console.log( err );
			}
			// if the role was created and not found
			if ( created ) {
				// notify via log
				console.log( 'Admin Role not found, was created.' );
				// and create a new default user
				createDefaultUser( admin );
			} else {
				// otherwise just log that the user was found, not created
				console.log( 'Admin Role found.' );
			}
		}
	);
};
