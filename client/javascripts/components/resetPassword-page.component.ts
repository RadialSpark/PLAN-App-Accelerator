import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {EndUserService} from '../services/enduser.service';
import {SecurityService} from '../services/security.service';

import {EventMessage} from './eventMessage.component';
@Component({
	selector: 'reset-password',
	templateUrl: '/templates/resetPassword.html',
	directives: [EventMessage]
})
export class ResetPasswordPage implements OnInit {
	private newPassword: string;
	private confirmNewPassword: string;
	private errorMessage: string;

	constructor(
		private route: ActivatedRoute,
		private endUserService: EndUserService,
		private securityService: SecurityService
	) { };

	//Do this on Component Init
	ngOnInit(): void {
		let accessToken = this.route.snapshot.params['access_token'];
		this.securityService.validate(accessToken);
		this.newPassword = '';
		this.confirmNewPassword = '';
	};

	/**
	 * Updates the password if both password checks are the same
	 */
	updatePassword(): void {
		if (this.newPassword === this.confirmNewPassword) {
			this.endUserService.updatePassword(this.newPassword)
				.catch((err) => this.errorMessage = 'Server error. Please try again.')
		} else {
			this.errorMessage = 'Passwords must match. Please try again.';
		}
	};
};
