import {Input, Directive, ElementRef, Inject} from '@angular/core';

/**
 * Directive for automatically focusing newly displayed input
 */
@Directive({
	selector: '[focus]'
})

export class FocusDirective {
	constructor( @Inject(ElementRef) private element: ElementRef) { }

	protected ngOnChanges() {
		if (this.focus) {
			this.element.nativeElement.focus();
		}

	}

	@Input() focus: boolean;
}
