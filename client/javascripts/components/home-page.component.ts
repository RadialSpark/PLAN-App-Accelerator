import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {SecurityService} from '../services/security.service';

@Component({
	selector: 'home-page',
	templateUrl: '/templates/home.html'
})
export class HomePage implements OnInit {
	constructor(
		private router: Router,
		private securityService: SecurityService
	) { };

	ngOnInit() {
		if (this.securityService.loginNeeded()) {
			this.router.navigate(['/login']);
			return;
		}
		if (!this.securityService.getEndUser()) {
			this.securityService.currentEndUser()
				.then(response => this.route())
				.catch(error => console.log(error));
		} else {
			this.route();
		}
	};

	route(): void {
		// default page should be users
		this.router.navigate(['/users']);
	};
};
