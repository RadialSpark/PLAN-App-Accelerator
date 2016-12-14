import {Component, Input} from '@angular/core';
import {NgClass} from '@angular/common';

export enum Status { ERROR, MESSAGE, SUCCESS };

@Component({
	selector: 'event-message',
	templateUrl: '/templates/eventMessage.html'
})
export class EventMessage {

	@Input('status') status: Status;
	@Input('message') message: string = '';
	@Input('height') height: string;

	/**
	 * EventMessage component constructor
	 */
	constructor() { }

	//Status functions to link to class
	isError() {
		return this.status === Status.ERROR;
	};
	isMessage() {
		return this.status === Status.MESSAGE;
	};
	isSuccess() {
		return this.status === Status.SUCCESS;
	};
};
