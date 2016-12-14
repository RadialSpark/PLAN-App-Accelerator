// Location for all constants widely used through out the app

// all error message related constants
const errorMessages = {
	// error text for when a user is not logged in
	notLoggedIn: 'Unauthorized. Please log in',
	// error text for when a user has an invalid access token
	invalidAccessToken: 'Could not find authorization token.',
	// error text for when an end user can not be found for an access token
	endUserNotFound: 'End user could not be retrieved.',
	// error message for when a contact fk is not pass in as an argument
	contactRequired: 'Contact field required.',
	// error message for when an enduser isnt available when required
	endUserRequired: 'Enduser requred for update',
	// error message for when an id is required on an end user object
	endUserIDRequired: 'ID required on endUser for update.',
	// error message for when a password is incorrectly provided
	passwordProvided: 'Password cannot be updated via update endpoint.',
	// error message for when a user cannot be updated
	couldNotUpdateUser: 'Could not update user: ',
	// error message for when a user could not be created
	couldNotCreateUser: 'Could not create user.',
	// error message for when an array is required
	mustBeAnArray: 'Arguments must be an array.',
	// error message for when an email is required
	emailRequired: 'Email required.',
	// error message for when a first name is required
	firstNameRequired: 'First name required.',
	// error message for when a last name is required
	lastNameRequired: 'Last name required.',
	// error message for requiring a contact id on an enduser
	contactIDRequired: 'Contact postgres id required for end user.',
	// error message for when a user has an email that is not unique
	uniqueEmail: 'Email must be unique.',
	// error message for when a salesforce contact has multiple users
	multipleUsersForContact: 'Multiple users for the same Salesforce contact.',
	// for when a duplicate end user is found
	duplicateUser: 'User for one or more provided emails or sfContactIds already exists.',
	// error when trying to retrieve contact information
	couldNotGetContacts: 'Could not retrieve contact information.',
	// error when trying to get account map information
	couldNotGetAccounts: 'Could not retrieve account information.',
	// error when display name not included as field
	displayNameRequired: 'Display name required and must be unique.',
	// error for when id field is not provided
	idRequired: 'Postgres id is required.',
	// error for when invalid data is passed in as args
	invalidArgs: 'Invalid arguments passed in.',
};

// public interface
module.exports = {
	errorMessages: errorMessages
};
