import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';

import {Contact} from '../interfaces/contact';

import {SecurityService} from './security.service';

@Injectable()
export class ContactService {
	private contactUrl: string = '/api/Contacts/'
	private getNamesEndpoint: string = "NamesMap/"
    constructor(
        private http: Http,
        private securityService: SecurityService
    ) { }

	/**
	 * Returns all contacts provided in array of contact ids
	 * @param where - optional where clause for returning contacts
	 * @return - promise containing a map of sfids to contacts
	 */
	getContacts(where?: Object): Promise<Object> {
		// if no where passed in default to an empty object
		// the filter will break if nothing is submitted for the where clause
		where = where || {};
		return this.http.get(this.contactUrl + this.getNamesEndpoint + "?where=" + JSON.stringify(where), { 'headers': this.securityService.getAuthHeaders() })
			.toPromise()
			.then(response => response.json().data)
			.catch(error => { throw error; });
	};
};
