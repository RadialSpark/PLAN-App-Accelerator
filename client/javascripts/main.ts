import {bootstrap} from '@angular/platform-browser-dynamic';
import {provide} from '@angular/core';
import {APP_BASE_HREF} from '@angular/common';
import {HTTP_PROVIDERS} from '@angular/http';
import {MainApp} from './app.component';
import {APP_ROUTER_PROVIDERS} from './app.routes';
import {EndUserService} from './services/enduser.service';
import {SecurityService} from './services/security.service';
import {ScrollSpyService} from 'ng2-scrollspy';
import {ScrollService} from './services/scroll.service';
import {ContactService} from './services/contact.service';
import {AccountService} from './services/account.service';

bootstrap(MainApp, [
	HTTP_PROVIDERS,
	APP_ROUTER_PROVIDERS,
	provide(APP_BASE_HREF, { useValue: '/page' }),
	EndUserService,
	SecurityService,
	ScrollSpyService,
	ScrollService,
	ContactService,
	AccountService
]);
