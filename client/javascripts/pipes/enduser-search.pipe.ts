import {Pipe} from "@angular/core";

@Pipe({
	name: "enduserSearch",
	pure: false
})

/**
 * Pipe for filtering out endUsers by search
 * @param endUsers - endUsers to filter
 * @param searchText - text to use to filter
 */
export class EndUserSearch {
	transform(endUsers, searchText) {
		// no endUsers to test, so return
		if (!endUsers) {
			return;
		}
		if (!searchText) return endUsers;
		let results = [];
		for (var endUser of endUsers) {
			// if the endUser matches search term, include it
			if (endUser.firstName.toLowerCase().includes(searchText.toLowerCase())
				|| endUser.firstName.toLowerCase().includes(searchText.toLowerCase())
				|| endUser.email.toLowerCase().includes(searchText.toLowerCase())
				// if type matches search text, include it
				|| ('admin'.indexOf(searchText.toLowerCase()) === 0 && endUser.accountType === 3)
				|| ('external'.indexOf(searchText.toLowerCase()) === 0 && endUser.accountType === 2)
				|| ('internal'.indexOf(searchText.toLowerCase()) === 0 && endUser.accountType === 1)) {
				results.push(endUser);
			}
		}
		return results;
	}
}
