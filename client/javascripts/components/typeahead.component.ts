import {Component, Input, Directive, ElementRef, Inject, Output, EventEmitter, OnChanges, SimpleChange} from '@angular/core';

import {FocusDirective} from '../directives/focus.directive';

@Component({
    selector: 'typeahead',
    templateUrl: '/templates/typeahead.html',
	directives: [FocusDirective]
})

/**
 * Controller for the typeahead component
 */
export class TypeaheadComponent {

	// The index of the selected option in the array of displayed options
	private selectedOption: number;
	// Array of options to display
	private displayedOptions: Object[];
	// Whether or not to display the options list
	private displayOptions: boolean;
	// Height of each option in pixels
	private optionRowHeight: number = 34;
	// Height of option list
	private optionListHeight: number;

	constructor() { };

	ngOnInit() {
		// Sets displayed options to an empty list
		this.displayedOptions = [];

		// If the input configuration object exists, populate inputs based on it
		if (this.inputConfiguration) {
			this.placeholder = this.inputConfiguration['placeholder'] || this.placeholder;
			this.focusInput = this.inputConfiguration['focusInput'] || this.focusInput;
			this.alwaysShowOptions = this.inputConfiguration['alwaysShowOptions'] || this.alwaysShowOptions;
			this.propertyToSearch = this.inputConfiguration['propertyToSearch'] || this.propertyToSearch;
			this.width = this.inputConfiguration['width'] || this.width;
			this.optionsToShow = this.inputConfiguration['optionsToShow'] || this.optionsToShow;
			this.showClearButton = this.inputConfiguration['showClearButton'] || this.showClearButton;
			this.formatOption = this.inputConfiguration['formatOption'] || this.formatOption;
			this.initialValue = this.inputConfiguration['initialValue'] || this.initialValue;
			this.noOptionsMessage = this.inputConfiguration['noOptionsMessage'] || this.noOptionsMessage;
		}

		// Set inputs to default values if undefined
		this.placeholder = this.placeholder || '';
		this.focusInput = this.focusInput || false;
		this.alwaysShowOptions = this.alwaysShowOptions || false;
		this.width = this.width || '200px';
		this.optionsToShow = this.optionsToShow || 5;
		this.showClearButton = this.showClearButton || false;
		this.initialValue = this.initialValue || '';
		this.noOptionsMessage = this.noOptionsMessage || 'No options';

		// Sets the text of the input box to the initial value if specified
		if (this.initialValue) {
			this.inputText = this.initialValue;
		}

		// Set the option list height to the amount of options to show times the
		// height of each option row
		this.optionListHeight = this.optionsToShow * this.optionRowHeight;

		// Disables typeahead input box if certain required inputs are undefined
		if (!this.options || !this.propertyToSearch || !this.formatOption) {
			this.disabled = true;
			this.placeholder = 'TYPEAHEAD MISSING REQUIRED INPUTS';
		}
	}

	/**
	 * Populate displayed options for dropdown menu with filtered
	 * list based on input
	 * @param text - The text to filter by
	 */
	populateDisplayedOptions(text): void {
		this.displayedOptions = [];
		if (!text) {
			// Show full options list if text is empty and always
			// show options is true. Otherwise, don't display options
			if (this.alwaysShowOptions) {
				this.displayedOptions = this.options;
			} else {
				this.displayOptions = false;
			}
			return;
		}
		text = text.toLowerCase();
		// Loop through all options, check if the text is found in the
		// option, and push it to the displayed options array if not
		for (let option of this.options) {
			if (option && option[this.propertyToSearch] && option[this.propertyToSearch].toLowerCase().includes(text)) {
				this.displayedOptions.push(option);
			}
		}
		// Display options
		this.displayOptions = true;
	}

	/**
	 * Selects the currently selected option
	 * Triggered by keydown.enter / mousedown
	 */
	selectOption(): void {
		if (this.displayedOptions[this.selectedOption]) {
			this.onSelect.emit(this.displayedOptions[this.selectedOption]);
			this.inputText = this.formatOption(this.displayedOptions[this.selectedOption]);
			this.displayedOptions = [];
			this.displayOptions = false;
		}
	}

	/**
	 * Checks to see if the current option is selected
	 * Used for highlighting selected option in list of options
	 * @param index - The index of the option to check
	 */
	checkSelectedOption(index): boolean {
		return index === this.selectedOption;
	}

	/**
	 * Scrolls the option list
	 * @param target - The element to scroll
	 * @param direction - The direction to scroll
	 */
	scrollOptionList(target, direction): void {
		let viewTop = target.scrollTop;
		let viewBottom = target.scrollTop + this.optionListHeight;
		let optionPosition = this.selectedOption * this.optionRowHeight;
		if (optionPosition < viewTop || optionPosition >= viewBottom) {
			if (direction.toLowerCase() === 'down') {
				target.scrollTop = (optionPosition - this.optionListHeight) + this.optionRowHeight;
			} else if (direction.toLowerCase() === 'up') {
				target.scrollTop = optionPosition;
			}
		}
	}

	/**
	 * Handles keyup events
	 * @param event - The keyup event
	 */
	handleKeyup(event): void {
		if ((event.keyCode >= 48 && event.keyCode <= 90)
			|| (event.keyCode >= 96 && event.keyCode <= 111)
			|| (event.keyCode >= 186 && event.keyCode <= 222)
			|| event.keyCode === 46
			|| event.keyCode === 8) {
			// Any letter, number or symbol, or delete or backspace
			// Resets the selected option to the first on the list and
			// populates the displayed search options list
			this.selectedOption = 0;
			if (event.target.nextElementSibling) {
				event.target.nextElementSibling.scrollTop = 0;
			}
			this.populateDisplayedOptions(this.inputText);
			this.onSelect.emit(null);
			this.onChange.emit(this.inputText);
		}
	}

	/**
	 * Handles keydown events
	 * @param event - The keydown event
	 */
	handleKeydown(event): void {
		// Enter key
		if (event.keyCode === 13) {
			// Selects the currently selected option
			this.selectOption();
			// Up arrow key
		} else if (event.keyCode === 38) {
			event.preventDefault();
			// If no options are displayed, populate list and select the last option
			if (this.displayedOptions.length === 0 && this.options.length > 0) {
				if (!this.inputText) {
					this.displayedOptions = this.options;
					this.displayOptions = true;
				} else {
					this.populateDisplayedOptions(this.inputText);
				}
				this.selectedOption = this.displayedOptions.length - 1;
				// Timeout on setting scrollTop to allow options to display first
				setTimeout(() => event.target.nextElementSibling.scrollTop = event.target.nextElementSibling.scrollHeight);
				return;
			}
			// Moves the selected option up in the list
			if (this.selectedOption - 1 >= 0) {
				this.selectedOption--;
				// Scroll the options list up
				this.scrollOptionList(event.target.nextElementSibling, 'up');
			} else {
				// Goes down to the bottom of the list
				this.selectedOption = this.displayedOptions.length - 1;
				event.target.nextElementSibling.scrollTop = event.target.nextElementSibling.scrollHeight;
			}
			// Down arrow key
		} else if (event.keyCode === 40) {
			event.preventDefault();
			// If no options are displayed, populate list and select the first option
			if (this.displayedOptions.length === 0 && this.options.length > 0) {
				if (!this.inputText) {
					this.displayedOptions = this.options;
					this.displayOptions = true;
				} else {
					this.populateDisplayedOptions(this.inputText);
				}
				this.selectedOption = 0;
				return;
			}
			// Moves the selected option down in the list
			if (this.selectedOption + 1 <= this.displayedOptions.length - 1) {
				this.selectedOption++;
				// Scroll the options list down
				if (this.selectedOption !== this.displayedOptions.length - 1) {
					this.scrollOptionList(event.target.nextElementSibling, 'down');
				} else {
					// If the last option is selected, make sure the list is scrolled to the bottom
					event.target.nextElementSibling.scrollTop = event.target.nextElementSibling.scrollHeight;
				}
			} else {
				// Goes back up to the top of the list
				this.selectedOption = 0;
				event.target.nextElementSibling.scrollTop = 0;
			}
			// Escape key
		} else if (event.keyCode === 27) {
			this.displayedOptions = [];
			this.displayOptions = false;
		}
	}

	/**
	 * Handles mouseenter events
	 * @param index - The index of the option that was moused over
	 */
	handleMouseenter(index): void {
		this.selectedOption = index;
	}

	/**
	 * Handles mouseleave events
	 * @param index - The index of the option that the mouse left
	 */
	handleMouseleave(index): void {
		this.selectedOption = index;
	}

	/**
	 * Handles focusing of input box
	 */
	handleFocus(): void {
		if (this.alwaysShowOptions || this.inputText) {
			this.selectedOption = 0;
			if (this.inputText) {
				this.populateDisplayedOptions(this.inputText);
			} else {
				this.displayedOptions = this.options;
			}
			this.displayOptions = true;
		}
	}

	/**
	 * Handles blurring of input box
	 */
	handleBlur(): void {
		this.displayedOptions = [];
		this.displayOptions = false;
	}

	/**
	 * Clears the input field
	 */
	clearInputField(): void {
		this.inputText = '';
		this.populateDisplayedOptions(this.inputText);
		this.onChange.emit(this.inputText);
		this.onSelect.emit(null);
		this.focusInput = true;
		// Gives input time to focus before resetting to false
		setTimeout(() => { this.focusInput = false; });
	}

	// Placeholder in input field
	@Input() placeholder: string;
	// Input field should automatically focus
	@Input() focusInput: boolean;
	// Options list should always show, even when input is empty
	@Input() alwaysShowOptions: boolean;
	// Array of options to use when building options list
	@Input() options: Object[];
	// Property on each option object to search for when filtering
	@Input() propertyToSearch: string;
	// Width of the input field and options list
	@Input() width: string;
	// Max amount of options to show in list at once
	@Input() optionsToShow: number;
	// Clear button should show in input field when input field is populated
	@Input() showClearButton: boolean;
	// The input box should be disabled
	@Input() disabled: boolean;
	// The initial value of the input field
	@Input() initialValue: string;
	// The message that displays if displayed option list is empty
	@Input() noOptionsMessage: string;
	// The text that appears in the input field
	// NOTE: Only pass in if the input field's value needs to be updated from another component
	@Input() inputText: string;

	// Function for how to format how options are displayed in options templates
	// Example - Will display options as "Lastname, Firstname"
	//		(option) => {
	//			return option['lastname'] + ', ' + option['firstname'];
	//		}
	@Input() formatOption: Function;

	// Event that is emitted when an option from the option list is selected
	@Output() onSelect = new EventEmitter<Object>();
	// Event that is emitted when a chance is made to the input field
	@Output() onChange = new EventEmitter<string>();

	// Configuration object that handles population of all inputs
	@Input() inputConfiguration: Object;

	/**
	 * * * * * * * * * * * * * * * * * * *
	 * inputConfiguration Best Practices *
	 * * * * * * * * * * * * * * * * * * *
	 *
	 * Create a configuration object in the ngOnInit() function
	 * of the component containing the typeahead
	 *
	 * Example:
	 *
		this.typeaheadConfiguration = {
			inputs: {
				propertyToSearch: <name of property on options>,
				placeholder: <placeholder>,
				alwaysShowOptions: <true/false>,
				showClearButton: <true/false>,
				focusInput: <true/false>,
				width: <string, like '250px' or '100%'>,
				optionsToShow: <number of options to show>
				formatOption: <function, see example above>
			},
			outputs: {
				onSelect: (event) => {
					// function, param is emitted event
				},
				onChange: (event) => {
					// function, param is emitted event
				}
			}
		}
	 *
	 * Then put the typeahead component in the containing component's template
	 *
	 * Example:
	 *
		<typeahead
			[inputConfiguration]="typeaheadConfiguration.inputs"
			[options]="<array of options>"
			(onSelect)="typeaheadConfiguration.outputs.onSelect($event)"
			(onChange)="typeaheadConfiguration.outputs.onChange($event)">
		</typeahead>
	 *
	 */
}
