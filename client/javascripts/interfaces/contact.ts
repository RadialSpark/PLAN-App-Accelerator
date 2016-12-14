/**
 * Interface used to store a Salesforce Contact object as represented in the PostgreSQL DB
 */
export interface Contact {
	// postgres id
	pg_id__c: number;
	// account id
	account__pg_id__c?: number;
	// salesforce contact email
	email?: string;
	// last name
	lastname: string
	// first name;
	firstname?: string;
	// date the record was created
	createddate?: Date;
	// the salesforce name for the user
	name?: string;
	// url for the user photo
	photourl?: string;
	// date last modified
	systemmodstamp?: Date;
};
