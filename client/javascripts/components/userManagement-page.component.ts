import {Component, OnInit} from '@angular/core';
import {EndUser} from '../interfaces/enduser';
import {SecurityService} from '../services/security.service';
import {EndUserService} from '../services/enduser.service';
import {Preloader} from './preloader.component';
import {ConfirmationModal} from './confirmation-modal.component';
import {AddUsers} from './add-users.component';
import {EndUserSearch} from '../pipes/enduser-search.pipe';

@Component({
	selector: 'user-management-page',
	templateUrl: '/templates/userManagement.html',
	directives: [Preloader, AddUsers, ConfirmationModal],
	pipes: [EndUserSearch]
})
export class UserManagementPage implements OnInit {
	private endUsers: EndUser[]; // Array of all endUsers, initially sorted by last name then first name
	private hasBeenToggled: boolean; // Tracks whether or not the current users card has been toggled
	private expanded: boolean = true; // Tracks whether or not the current users card is expanded
	private loading: boolean; // Tracks if currently loading (for displaying preloader)
	private searchText: string; // Text from search box
	private errorMessage: string; // current error message to be displayed
	private showConfirmation: boolean; // whether or not to show the save confirmation modal
	private deletionStaging: Object; // object for staging user for deletion {user: EndUser, index: number}


	constructor(
		private securityService: SecurityService,
		private endUserService: EndUserService
	) { };

	//Do this on Component Init
	ngOnInit(): void {
		// Checks if you need to login before initializing
		if (this.securityService.loginNeeded()) return;
		// verify that the user has admin privileges
		this.securityService.checkAccessPrivileges(true);

		// finds end users
		this.findEndUsers();
	};

	/**
	 * Retrives all end users and stores them
	 */
	findEndUsers(): void {
		// Filter to be used in retreiving endusers
		let filter = {
			// Orders by last name then first name
			order: "lastName ASC, firstName ASC"
		}

		this.loading = true;

		this.endUserService.findEndUsers(filter)
			.then((endUsers) => {
				this.endUsers = endUsers;
				this.loading = false;
			})
			// sends to login if unauthorized
			.catch(error => {
				this.securityService.checkUnauthorized(error);
				this.errorMessage = error._body;
				this.loading = false;
			});
	}

	/**
	 * Toggles expansion of current users card
	 */
	toggleExpanded(): void {
		this.hasBeenToggled = true;
		this.expanded = !this.expanded;
	}

	/**
	 * Creates edits object on endUser and sets editing to true
	 * @param endUser - endUser to be put in edit mode
	 */
	startEditing(endUser: EndUser): void {
		endUser['edits'] = {
			admin: endUser.admin
		}
		endUser['editing'] = true;
	}

	/**
	 * Stages user for deletion and displays deletion confirmation modal
	 * @param endUser - user to be deleted
	 * @param index - user's index in endUsers array
	 */
	confirmDeletion(endUser: EndUser) {
		console.log(this.endUsers.indexOf(endUser));
		this.deletionStaging = {};
		// Saves end user and index to deletion staging object
		this.deletionStaging['user'] = endUser;
		this.deletionStaging['index'] = this.endUsers.indexOf(endUser);
		// Shows confirmation modal
		this.showConfirmation = true;
	}

	/**
	 * Triggered by clicking continue or cancel in confirmation
	 * @param confirmed - whether or not confirmation action occured
	 */
	handleConfirmation(confirmed: boolean): void {
		// saves users if continue selected
		if (confirmed) this.deleteUser();
		// resets deletion staging if canceled
		else this.deletionStaging = {};
		// Always hides confirmation modal
		this.showConfirmation = false;
	}

	/**
	 * Deletes an endUser from database and removes from local list
	 */
	deleteUser(): void {
		// Makes a copy of endUsers to assign back to end users
		// This is to force ngOnChange to occur in nested components
		let newEndUsers = this.endUsers.slice();

		// Attempts to deleteEndUser
		this.endUserService.deleteEndUser(this.deletionStaging['user'])
			.then(() => {
				// Removes from array on success
				newEndUsers.splice(this.deletionStaging['index'], 1);
				// Sets modified copy to endUsers array
				this.endUsers = newEndUsers;
				// Resets deletionStaging object
				this.deletionStaging = {};
			})
			.catch(error => {
				this.securityService.checkUnauthorized(error);
				this.errorMessage = error._body;
			})
	}

	/**
	 * Updates endUser with contents of edits in database
	 * @param endUser - endUser to be updated in database
	 * @param index - index of endUser in endUsers array
	 */
	saveUser(endUser: EndUser): boolean {
		// Checks if any of the privileges were changed
		if (endUser.admin == endUser['edits'].admin
		) {
			// Cancels edit if nothing changed and does not continue
			return endUser.editing = false;
		}

		this.loading = true;
		let index = this.endUsers.indexOf(endUser);
		// Creates new user object with correct information for upsert
		var modifiedUser = {
			id: endUser.id,
			contact__r__pg_id__c: endUser.contact__r__pg_id__c,
			firstName: endUser.firstName,
			lastName: endUser.lastName,
			email: endUser.email,
			admin: endUser['edits'].admin
		};

		// Sends update request with modifiedUser
		this.endUserService.update(modifiedUser)
			.then((updatedUser) => {
				// Sets editing true and edits animate change in padding
				updatedUser.editing = true;
				updatedUser.edits = endUser['edits'];
				console.log(updatedUser)
				// Replaces user in endUsers array with updated user
				this.endUsers[index] = updatedUser;
				// Sets timeout of 1ms before setting editing false to allow render before
				// setting back to not editing, triggering animation
				setTimeout(() => { updatedUser['editing'] = false; }, 1);
				this.loading = false;
			})
			.catch(error => {
				this.securityService.checkUnauthorized(error);
				this.errorMessage = error._body;
				this.loading = false;
			});
	}

	/**
	 * Checks if user matches the current search text
	 * @param endUser - user you want to check the search text against
	 * @return boolean: true if match, false if not match
	 */
	searchResult(endUser: EndUser): boolean {
		return (!this.searchText ||
			endUser.firstName.toLowerCase().includes(this.searchText.toLowerCase()) ||
			endUser.firstName.toLowerCase().includes(this.searchText.toLowerCase()))
	}

	/**
	 * Adds new users to the beginning of the endUsers array (top of table)
	 * Called from onSave trigger of add-users card
	 * @param newUsers - array of users that were added
	 */
	addNewUsers(newUsers: EndUser[]): void {
		this.endUsers = newUsers.concat(this.endUsers);
	}
};
