import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import 'rxjs/add/operator/toPromise';

import {Account} from '../interfaces/account';

import {SecurityService} from './security.service';

@Injectable()
export class AccountService {
	constructor(
        private http: Http,
        private securityService: SecurityService
    ) {}

	// the base api endpoint for the account loopback model
    private baseUrl = '/api/accounts';
	// the url endpoint for the accountMap endpoint
    private accountsEndpoint = '/AccountMap';

    /**
	 * Returns a map of all accounts
	 * @return - promise containing a map account sfids to account objects
	 */
    getAccounts(): Promise<Object> {
        return this.http.get(this.baseUrl + this.accountsEndpoint, { headers: this.securityService.getAuthHeaders() })
                .toPromise()
                .then(response => response.json().data)
				.catch(error => { throw error; });
    };
};