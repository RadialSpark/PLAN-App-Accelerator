///<reference path="../../typings/browser.d.ts"/>

import {Component, AfterViewInit} from '@angular/core';
import {ROUTER_DIRECTIVES} from '@angular/router';
import {DROPDOWN_DIRECTIVES} from 'ng2-bootstrap/components/dropdown';
import {ScrollSpyDirective, ScrollSpyService} from 'ng2-scrollspy';

import {HomePage} from './components/home-page.component';
import {LoginPage} from './components/login-page.component';
import {LogoutPage} from './components/logout-page.component';
import {ResetPasswordPage} from './components/resetPassword-page.component';
import {UserManagementPage} from './components/userManagement-page.component';

import {SecurityService} from './services/security.service';
import {ScrollService} from './services/scroll.service';

import {EndUser} from './interfaces/enduser';

@Component({
	selector: 'main-app',
	templateUrl: '/templates/app.html',
	directives: [ROUTER_DIRECTIVES, DROPDOWN_DIRECTIVES, ScrollSpyDirective]
	// TODO: Add precompile array
})

export class MainApp implements AfterViewInit {
	private userDropdown: boolean;

	constructor(
		private securityService: SecurityService,
		private scrollSpyService: ScrollSpyService,
		private scrollService: ScrollService
	) {
		this.scrollSpyService = scrollSpyService;
	};

	/**
	 * Watches for window scroll
	 */
	ngAfterViewInit(): void {
		this.scrollSpyService.getObservable('window').subscribe((e: any) => {
			let y = this.scrollService.setScrollPostion(e);
		});
	};

	/**
	 * Used to toggle the user dropdown (containing profile/logout)
	 */
	toggleDropdown(): void {
		this.userDropdown = !this.userDropdown;
	};

	/**
	 * Used to update the logged in user's display name
	 * @return the users full dipslay name as a string
	 */
	getUsersFullName(): string {
		return this.securityService.getEndUser().firstName + ' ' + this.securityService.getEndUser().lastName;
	};
};
