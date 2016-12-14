import {Component, Injector} from '@angular/core';
import {SecurityService} from '../services/security.service';
@Component({
	selector: 'logout-page',
	templateUrl: '/templates/logout.html'
})
export class LogoutPage {
	constructor(
		private securityService: SecurityService
	) { };
};
