var admin = require( './admin' );

module.exports = function configRoles( app ) {
	//Configure all pre-defined App Roles
	admin( app ); //Configure Admin Role
};
