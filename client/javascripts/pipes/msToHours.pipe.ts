import {Pipe} from "@angular/core";

@Pipe({
	name: "msToHours",
})

/**
 * Converts a time value from milliseconds to hours (2 decimals)
 */
export class MsToHoursPipe {
	transform(value) {
		return (value / 3600000).toFixed(2);
	}
}
