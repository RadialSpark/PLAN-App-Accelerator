import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
	selector: 'confirmation-modal',
	templateUrl: '/templates/confirmationModal.html'
})
export class ConfirmationModal {

	constructor() { }

	ngOnInit() { };

	/**
	 * Handles the response given on the modal
	 * @param response - The response given (true if confirmed, false if rejected)
	 */
	handleResponse(response: boolean): void {
		this.onResponse.emit({ confirmed: response, name: this.name });
	}

	// Title that shows at the top of the modal
	@Input() title: string;
	// Main body of text to display on modal
	@Input() body: string;
	// Confirmation button text
	@Input() confirm: string;
	// Rejection button text
	@Input() reject: string;
	// Name to use as reference in component (if multiple confirmations on one page)
	@Input() name: string;

	// Event emitted when a response is selected {confirmed: boolean, name: string}
	@Output() onResponse = new EventEmitter<Object>();
};
