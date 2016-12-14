import {Component, Input, Output, EventEmitter, OnChanges, SimpleChange} from '@angular/core';
import {Preloader} from './preloader.component';
import {ConfirmationModal} from './confirmation-modal.component';
import {TypeaheadComponent} from './typeahead.component';
import {ContactService} from '../services/contact.service';
import {AccountService} from '../services/account.service';
import {EndUserService} from '../services/enduser.service';
import {SecurityService} from '../services/security.service';

import {Contact} from '../interfaces/contact';
import {Account} from '../interfaces/account';
import {EndUser} from '../interfaces/enduser';

@Component({
	selector: 'add-users',
	templateUrl: '/templates/addUsers.html',
	directives: [Preloader, ConfirmationModal, TypeaheadComponent]
})

export class AddUsers implements OnChanges {

	private hasBeenToggled: boolean; // tracks whether or not add users has been expanded or collapsed for animation purposes
	private expanded: boolean = false; // wheter or not add users is currently expanded
	private contactsMap: Object; // a map of all contacts by id
	private contactsArray: Contact[]; // array of all contacts that match current filters and don't have endUsers
	private accountsMap: Object; // a map of all accounts by id
	private accountsArray: Account[]; // array of accounts for iteration purposes
	private newUsers: EndUser[]; // array of end user objects currently in staging "new users" area
	private loading: boolean; // tracks whether or not any requests are currently loading
	private errorMessage: string;
	private searchText: string; // text in the search input field
	private filteringAccount: number; // account currently selected to use for filtering contacts
	private formatAccountOption = (account) => account.name; // function for formatting account option in typeahead
	private showConfirmation: boolean; // whether or not to show the save confirmation modal

	constructor(
		private contactService: ContactService,
		private accountService: AccountService,
		private endUserService: EndUserService,
		private securityService: SecurityService
	) { };

	ngOnInit() {
		// sets loading to true
		this.loading = true;
		// populates contacts and accounts
		this.populateContacts();
		this.populateAccounts();

		// Defaults card to expanded if there are no endUsers on page
		if (this.endUsers.length <= 1) {
			this.toggleExpanded();
		}
	};

	/**
	 * Watches for changes
	 */
	ngOnChanges(changes: { [propertyName: string]: SimpleChange }) {
		// Regenerates contacts array if any changes are made to endUsers
		if (changes.hasOwnProperty('endUsers')) {
			this.generateContactsArray();
		}
	}

	/**
	 * Retrieves all contacts from database
	 */
	populateContacts(): void {
		// If signed in user has an id, exclude that from the contact search
		// (default user should be only to not have an id)
		let contactWhere = {};
		if (this.securityService.getEndUser().contact__r__pg_id__c) {
			contactWhere['pg_id__c'] = {
				neq: this.securityService.getEndUser().contact__r__pg_id__c
			};
			// 'Josh Davis' in SF Dev org has bad email (j.davis@expressl&t.net),
			// exclude him from contact list
			contactWhere['email'] = {
				neq: 'j.davis@expressl%26t.net'
			};
		}

		// Retrieve all contacts other than contact for signed in user
		this.contactService.getContacts(contactWhere)
			.then(contacts => {
				this.contactsMap = contacts;
				// generate contacts array after contact retrieval
				this.generateContactsArray();
				// sets loading to false only if accounts have also loaded
				if (this.accountsMap) this.loading = false;
			})
			.catch(error => {
				this.securityService.checkUnauthorized(error);
				this.loading = false;
			})
	}

	/**
	 * Generates contacts array from contacts map exluding current end users
	 * and contacts that don't match current filters
	 */
	generateContactsArray(): void {
		// creates an empty contacts array that will replace contacts array after it is populated
		let newContactsArray = [];
		// generate an array of contact ids of all current endUsers and new endUsers
		let contactsWithUsersPgIDs = [];
		for (let endUser of this.endUsers) {
			contactsWithUsersPgIDs.push(endUser.contact__r__pg_id__c);
		}
		if (this.newUsers) {
			for (let user of this.newUsers) {
				contactsWithUsersPgIDs.push(user.contact__r__pg_id__c)
			}
		}

		for (let pgID in this.contactsMap) {
			// If contact is not in array of contacts with users and...
			if ((
				contactsWithUsersPgIDs.indexOf(parseInt(pgID)) < 0
			) && (
					// not currently searching or...
					!this.searchText ||
					// first name, last name, or email includes currently searched text
					this.contactsMap[pgID].firstname && this.contactsMap[pgID].firstname.toLowerCase().includes(this.searchText.toLowerCase()) ||
					this.contactsMap[pgID].lastname && this.contactsMap[pgID].lastname.toLowerCase().includes(this.searchText.toLowerCase()) ||
					this.contactsMap[pgID].email && this.contactsMap[pgID].email.toLowerCase().includes(this.searchText.toLowerCase())
					// and there is no filtering account or contact belongs to filtering account
				) && (
					!this.filteringAccount || this.contactsMap[pgID].account__pg_id__c === this.filteringAccount
				)
			) {
				// Add the contact to array of contacts
				newContactsArray.push(this.contactsMap[pgID]);
			}
		}

		// Save the populated array to contactsArray
		this.contactsArray = newContactsArray;

		this.sortContacts();
	}

	/**
	 * Handles selection of a filtering account.
	 * Triggered by onSelect of typeahead.
	 * @param account: account being selected (null to reset selection)
	 */
	selectAccount(account: Account): void {
		if (account) {
			this.filteringAccount = account.pg_id__c;
		} else {
			this.filteringAccount = null;
		}

		// regenerate contacts array as filters have changed
		this.generateContactsArray();
	}

	/**
	 * Sort the contacts array by last name then first name
	 */
	sortContacts(): void {
		this.contactsArray.sort(function(a, b) {
			if (a.lastname.toLowerCase() < b.lastname.toLowerCase()) return -1;
			else if (a.lastname.toLowerCase() > b.lastname.toLowerCase()) return 1;
			else if (a.firstname.toLowerCase() < b.firstname.toLowerCase()) return -1;
			else if (a.firstname.toLowerCase() > b.firstname.toLowerCase()) return 1;
			else return 0;
		})
	}

	/**
	 * Retrieve all acounts from the database
	 */
	populateAccounts(): void {
		this.accountService.getAccounts()
			.then(accounts => {
				this.accountsMap = accounts;
				// Generate array of accounts to pass into typeahead
				this.generateAccountArray();
				// Sets loading to false only if contacts are also finished loading
				if (this.contactsMap) this.loading = false;
			})
			.catch(error => {
				this.securityService.checkUnauthorized(error);
				this.loading = false;
			})
	}

	/**
	 * Generates array of all accounts to be passed into typeahead
	 */
	generateAccountArray() {
		// Creates a new array and populates with accounts
		let newAccountsArray = [];
		for (let pgID in this.accountsMap) {
			newAccountsArray.push(this.accountsMap[pgID]);
		}

		// sorts the accounts by name
		newAccountsArray.sort(function(a, b) {
			if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
			else if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
			else return 0;
		});

		// sets the accounts array to the populated array of accounts
		this.accountsArray = newAccountsArray;
	}

	/**
	 * Adds a new user object for a contact to newUsers and removes contact
	 * from contactsArray
	 * @param index - index of contact in contacts array
	 */
	moveToNewUsers(index: number): void {
		// creates empty new users array if array does not currently exist
		this.newUsers = this.newUsers || [];

		// Checks contact has an email
		if (this.contactsArray[index].email) {
			// Remove contact from contactsArray and set as contact
			let contact = this.contactsArray.splice(index, 1)[0];
			// Adds a new endUser object for contact to beginning of newUsers
			this.newUsers.unshift({
				contact__r__pg_id__c: contact.pg_id__c,
				firstName: contact.firstname,
				lastName: contact.lastname,
				email: contact.email,
				admin: false
			});
			// reset the error message
			this.errorMessage = "";
			// Sets error if contact does not have an email
		} else {
			this.errorMessage = "Email required to create user account."
		}
	}

	/**
	 * Adds users for all displayed contacts to new users
	 */
	moveAllToNewUsers(): void {
		// Users will be added from end of contacts to start, as they are added to start of newUsers

		// Offset from length for contact to currently add
		let offset = 1;

		// Use a while loop to continue if offset is not greater than length of contacts
		while (offset <= this.contactsArray.length) {
			// If user to be added has an email
			if (this.contactsArray[this.contactsArray.length - offset].email) {
				// Add user (moveToNewUsers removes each contact from array)
				this.moveToNewUsers(this.contactsArray.length - offset);
			} else {
				// If user doesn't have email, don't add. Instead increase offset from length
				offset++;
			}
		}
		// If offset has been increased, alert user of contacts that were not added
		if (offset > 1) {
			this.errorMessage = "Email required to create user account. " + (offset - 1) + " contacts not added."
		} else {
			this.errorMessage = "";
		}
	}

	/**
	 * Remove a new user and add their contact back to contactsArray
	 * @param index - index of user in newUsers array
	 */
	moveBackToContacts(index: number): void {
		// remove user from list of newUsers and set as endUser
		let endUser = this.newUsers.splice(index, 1)[0];
		// add contact back to contacts array for endUser
		this.contactsArray.push(this.contactsMap[endUser.contact__r__pg_id__c]);
		// sort contacts again
		this.sortContacts();
		// reset error message
		this.errorMessage = "";
	}

	/**
	 * Resets new users array
	 */
	resetNewUsers(): void {
		this.newUsers = [];
		this.generateContactsArray();
		this.errorMessage = "";
	}

	/**
	 * Sets privilege for all new users based on currently selected privilege
	 * @param privilege - privilege to set (i.e. admin)
	 */
	setPrivilege(privilege: string): void {
		// keeps track of if all are true
		let all = true;
		for (let user of this.newUsers) {
			if (!user[privilege]) all = false;
		}

		// True if some but not all are true or none are true
		// False if all are true
		for (let user of this.newUsers) {
			user[privilege] = !all;
		}
	}

	/**
	 * Toggles card expansion
	 */
	toggleExpanded(): void {
		this.hasBeenToggled = true;
		this.expanded = !this.expanded;
		this.errorMessage = "";
	}

	/**
	 * Triggered by clicking cancel. Resets and collapses cards.
	 */
	handleCancel() {
		this.resetNewUsers();
		this.toggleExpanded();
	}

	/**
	 * Triggered by clicking continue or cancel in confirmation
	 * @param confirmed - whether or not confirmation action occured
	 */
	handleConfirmation(confirmed: boolean): void {
		// saves users if continue selected
		if (confirmed) this.saveUsers();
		// Always hides confirmation modal
		this.showConfirmation = false;
	}

	/**
	 * Saves new users to the database
	 */
	saveUsers() {
		this.loading = true;
		// Attempts to insert newUsers
		this.endUserService.insertEndUsers(this.newUsers)
			.then(users => {
				this.loading = false;
				// emits that save occured with saved users
				this.onSave.emit(users);
				// resets newUsers array
				this.newUsers = [];
				// collapses card
				this.toggleExpanded();
			})
			.catch(error => {
				this.securityService.checkUnauthorized(error);
				this.errorMessage = error._body;
				this.loading = false;
			});
	}

	@Input() endUsers; // current endUsers
	@Output() onSave = new EventEmitter<EndUser[]>(); // emits users that were saved on save
}
