import {Component, OnInit} from '@angular/core';

import {SecurityService} from '../services/security.service';

import {EventMessage, Status} from './eventMessage.component';
import {ForgotPasswordModal} from './forgotPassword-modal.component';

@Component({
	selector: 'login-page',
	templateUrl: '/templates/login.html',
	directives: [EventMessage, ForgotPasswordModal]
})
export class LoginPage implements OnInit {
	//EventMessage component inputs
	private eventMessage: string;
	private eventMessageStatus: Status;

	private username: string;
	private password: string;
	constructor(
		private securityService: SecurityService
	) { };
	//Do this on Component Init
	ngOnInit() {
		this.username = '';
		this.password = '';
	};
	/**
	 * Logs the user in the system
	 */
	login() {
		this.securityService.login(this.username, this.password)
			.then()
			.catch((err) => {
				// set the error message
				this.eventMessageStatus = Status.ERROR;
				// set the error message based on the type of http error
				var message: string;
				if (err.status === 401) message = 'Incorrect login credentials. Please try again.';
				else if (err.status === 500) message = 'Bad callout. Please contact the system admin.';
				this.eventMessage = 'Error ' + err.status + ': ' + message;
			});
	};
};
