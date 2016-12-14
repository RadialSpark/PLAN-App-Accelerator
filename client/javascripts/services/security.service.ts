import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Router, ActivatedRoute} from '@angular/router';
import {Location} from '@angular/common'
import {EndUser} from '../interfaces/enduser';
@Injectable()
export class SecurityService {
	//Headers for HTTP calls
	private noAuthHeaders: Headers;
	private authHeaders: Headers;
	//Security info
	private accessToken: any;
	private endUser: EndUser;
	private tokenIsValid: boolean;
	private userIsAdmin: boolean;
	private loginReturnPath: string; // path to return to after login

	// error message returned in 500 response for token already doesn't exist on logout
	private ERR_MESSAGE_NO_TOKEN: string = "could not find accessToken";

	//Class Constructor
	constructor(
		private http: Http,
		private router: Router,
		private route: ActivatedRoute,
		private location: Location
	) {
		this.init();
	};
	//Do this on Service Init
	init() {
		this.noAuthHeaders = new Headers({
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		});
		this.tokenIsValid = false;
		this.userIsAdmin = false;
		this.setTokenFromLocal();
	};

	/**
	 * Authenticate the current EndUser on login or token refresh
	 */
	authenticate = (accessToken) => {
		this.tokenIsValid = accessToken.id ? true : false;
		this.accessToken = accessToken;
		//console.log(this.accessToken);
		this.authHeaders = new Headers({
			'Authorization': accessToken.id,
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		});
		window.localStorage.setItem('token', JSON.stringify(accessToken));
		this.currentEndUser();
	};
	/**
	 * Verify the current token is valid
	 */
	validate = (accessToken) => {
		if (!accessToken) this.authenticate({});
		var access_token = '?access_token=' + accessToken;
		return this.http.get(
			'/api/EndUsers/validate' + access_token,
			{ headers: this.noAuthHeaders }
		).toPromise()
			.then((res) => {
				this.authenticate(res.json().data.accessToken);
			})
			.catch(error => { throw error; });
	};

	/**
	 * Attempt to login user with given credentials
	 * @param username - user entered username
	 * @param password - user entered password
	 */
	login = (username: string, password: string) => {
		return this.http.post(
			'/api/EndUsers/login',
			JSON.stringify({ username: username, password: password }),
			{ headers: this.noAuthHeaders }
		).toPromise()
			.then((res) => {
				this.setTokenFromRes(res);
				this.returnToPath(this.loginReturnPath);
			})
			.catch(error => { throw error; });
	};

	/**
	 * Used on pages where login is required to check if logged in
	 * @return boolean: whether or not user login is still needed (user not logged in)
	 */
	loginNeeded = (): boolean => {
		if (this.tokenIsValid) {
			return false;
		} else {
			// Store path loginNeeded is being checked from
			this.setLoginReturnPath();
			// Redirect user to login page
			this.returnToPath('/login');
			return true;
		}
	}

	/**
	 * Sets login return path to be used after successful login
	 */
	setLoginReturnPath = (): void => {
		let loginReturnPath = this.location.path();
		// doesn't set if redirecting from login to login
		if (loginReturnPath !== '/login') {
			this.loginReturnPath = loginReturnPath;
		}
	}

	/**
	 * Retrieves end user object for signed in user
	 */
	currentEndUser = () => {
		if (!this.accessToken.userId) {
			this.endUser = null;
			return;
		}
		return this.http.get(
			'/api/EndUsers/' + this.accessToken.userId + '?filter[include]=roles',
			{ headers: this.authHeaders }
		).toPromise()
			.then((res) => {
				this.endUser = res.json();
				if (this.endUser.roles) {
					for (var role of this.endUser.roles) {
						if (role.name === 'admin') {
							return this.userIsAdmin = true
						};
					}
				}
				this.userIsAdmin = false;
			})
			.catch(error => {
				throw error;
			});
	};

	/**
	 * Attempt to logout the current user
	 */
	logout = () => {
		return this.http.post(
			'/api/EndUsers/logout',
			'',
			{ headers: this.authHeaders }
		).toPromise()
			.then((res) => {
				this.setTokenFromRes(res);
				this.returnToPath();
			})
			.catch(error => {
				// If logout is refused for accessToken already not existing, set accessToken
				if (JSON.parse(error._body).error.message === this.ERR_MESSAGE_NO_TOKEN) {
					this.returnToPath();
					return this.setTokenFromRes({});
				};
				throw error;
			});
	};

	/**
	 * Helper for SecurityService.authenticate.
	 * Parses the accessToken from the response.
	 */
	setTokenFromRes = (res) => {
		var accessToken = res._body ? res.json() : {};
		this.authenticate(accessToken);
	};

	/**
	 * Sets token based on token stored in localStorage
	 */
	setTokenFromLocal = () => {
		let token = JSON.parse(window.localStorage.getItem('token'));
		if (token) {
			this.validate(token.id);
		}
	}

	/**
	 * Redirects to login page is error is for unauthorized user
	 * @param error - error from response in http request being checked
	 */
	checkUnauthorized = (error) => {
		if (error.status === 401) {
			// resets user validation variables
			this.endUser = null;
			this.userIsAdmin = null;
			this.tokenIsValid = null;
			// stores location redirecting from
			this.loginReturnPath = this.location.path();

			this.returnToPath('/login');
		}
	}

	/**
	 * Verifies that a user has the appropriate app privileges. Used in the page components
	 * @param admin - boolean whether or not the page required admin access
	 */
	checkAccessPrivileges = (admin: boolean) => {
		if (!this.endUser) {
			this.currentEndUser()
				.then(response => {
					this.checkPrivilegesHelper(admin);
				})
		} else {
			this.checkPrivilegesHelper(admin);
		}
	};

	/**
	 * Helper method that abstracts out the actual priviledges check so that we can retrieve the current end user if we dont have it for some reason
	 */
	checkPrivilegesHelper = (admin: boolean) => {
		// check that the user has the appropriate access privileges, otherwise return them to home
		if (admin && !this.userIsAdmin) {
			this.returnToPath('/forbidden');
		}
	};

	/**
	 * Helper method to navigate to specified path.
	 * Defaults to home if no path provided
	 * @param path - path to navigate to (should start in slash. i.e. '/timesheets')
	 */
	returnToPath = (path?: string) => {
		path = path || '/';
		// creates an array of path sections
		let pathArray = path.split('/');

		// will hold path parts and param objects
		let pathArrayWithParams = [];

		// loops over each path part
		for (let pathPart of pathArray) {
			// breaks the path part appart by semi-colons to retrive params
			let pathPartArray = pathPart.split(';');
			// adds the first item in the split as this part will be a path (not param)
			pathArrayWithParams.push(pathPartArray[0]);

			// creates an empty object to hold the params
			let params = {};

			// loops over each item in the split path part
			for (let param in pathPartArray) {
				if (+param > 0) {
					// adds each item after the first to the params object
					params[pathPartArray[param].split('=')[0]] = pathPartArray[param].split('=')[1];
				}
			}

			// adds the params object to the array if there are any values in it
			if (Object.keys(params).length) {
				pathArrayWithParams.push(params);
			}
		}

		// routes to path
		return this.router.navigate(pathArrayWithParams);
	};

	/**
	 * Returns authenticated headers
	 * @return authHeaders
	 */
	getAuthHeaders = () => {
		return this.authHeaders;
	};

	/**
	 * Returns unauthenticated headers
	 * @return noAuthHeaders
	 */
	getNoAuthHeaders = () => {
		return this.noAuthHeaders;
	};

	/**
	 * Returns signed in user's userId
	 * @return accessToken.userId
	 */
	getUserId = () => {
		return this.accessToken.userId;
	};

	/**
	 * Returns endUser object for signed in user
	 * @return endUser
	 */
	getEndUser = () => {
		return this.endUser;
	};

	/**
	 * Returns whether or not current token is valid
	 * @return tokenIsValid
	 */
	getTokenIsValid = () => {
		return this.tokenIsValid;
	};

	/**
	 * Returns whether or not signed in user is admin
	 * @return userIsAdmin
	 */
	getUserIsAdmin = () => {
		return this.userIsAdmin;
	};
};
