import 'rxjs/add/operator/toPromise';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {SecurityService} from './security.service';

import {EndUser} from '../interfaces/enduser';

@Injectable()
export class EndUserService {

	private endUserUrl: string = '/api/EndUsers';
	private updateEndpoint: string = '/update/';
	private insertEndpoint: string = '/insert';

	constructor(
		private http: Http,
		private securityService: SecurityService
	) { };

	/**
	 * Attempt to send a Password Reset Email
	 * @param email - email for account that user
	 * 		is trying to reset password for
	 */
	sendResetEmail = (email: string) => {
		return this.http.post(
			this.endUserUrl + '/reset',
			JSON.stringify({ email: email }),
			{ headers: this.securityService.getNoAuthHeaders() }
		)
			.toPromise()
			.then(() => this.securityService.returnToPath())
			.catch(error => { throw error; });
	};

	// TODO - Comment when fixing
	//Attempt to update the password of the current user
	updatePassword = (password: string) => {
		return this.http.put(
			this.endUserUrl + '/' + this.securityService.getUserId(),
			JSON.stringify({ password: password }),
			{ headers: this.securityService.getAuthHeaders() }
		).toPromise().then((res) => {
			console.log(res);
			this.securityService.returnToPath();
		}).catch(error => { throw error; });
	};

	/**
	 * Method to retrieve a list of endUsers
	 * @param filter - loopback filter object to be used in find
	 */
	findEndUsers = (filter?: any) => {
		filter = filter || {};
		filter.include = ['roles', 'contact'];
		return this.http.get(
			'/api/EndUsers?filter=' + JSON.stringify(filter),
			{ headers: this.securityService.getAuthHeaders() }
		)
			.toPromise()
			.then(response => {
				let endUsers = response.json();
				// Sets the admin boolean to true for all users with admin role
				for (let endUser of endUsers) {
					for (let role of endUser.roles) {
						if (role.name === 'admin') endUser.admin = true;
					}
				}
				return endUsers;
			})
			.catch(error => { throw error; });
	};

	/**
	 * Method that sends delete request for an endUser
	 * @param endUser - endUser to be deleted
	 */
	deleteEndUser = (endUser: EndUser) => {
		return this.http.delete(
			'/api/EndUsers/' + endUser.id,
			{ headers: this.securityService.getAuthHeaders() }
		)
			.toPromise()
			.catch(error => { throw error; });
	}

	/**
	 * Method for updating a single user.
	 * @param endUser - user to be updated
	 */
	update = (endUser: EndUser) => {
		return this.http.post(
			this.endUserUrl + this.updateEndpoint,
			{ data: { endUser: endUser } },
			{ headers: this.securityService.getAuthHeaders() }
		)
			.toPromise()
			.then(res => res.json().data)
			.catch(error => { throw error; });
	}

	/**
	 * Method for creating users. Expects a fully formed list of users
	 * @param endUsers - array of endUsers (boolean for admin true gives admin role)
	 */
	insertEndUsers = (endUsers: EndUser[]) => {
		return this.http.post(
			this.endUserUrl + this.insertEndpoint,
			{ data: { endUsers: endUsers } },
			{ headers: this.securityService.getAuthHeaders() }
		)
			.toPromise()
			.then(res => res.json().data)
			.catch(error => { throw error; });
	}
};
