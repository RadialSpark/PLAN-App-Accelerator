module.exports = function ( app, modelName ) {
	app.models[ modelName ].findOne( function ( err, model ) {
		if ( err ) console.log( err );
		// set the schema namespace
		var tableName = 'salesforce.' + modelName;
		// create and reset the auto increment sequence
		console.log( 'Begin creating/updating ' + tableName + '_pg_id_seq.' );
		app.dataSources.herokuConnectDB.connector.execute(
			"CREATE SEQUENCE IF NOT EXISTS " + tableName + "_pg_id_seq;" +
			"SELECT setval('" + tableName + "_pg_id_seq', (SELECT last_value FROM " + tableName + "_id_seq) );",
			null,
			function ( err, output ) {
				if ( err ) {
					console.log( err );
					return;
				}
				console.log( 'Finished creating/updating ' + tableName + '_pg_id_seq.' );
				app.dataSources.herokuConnectDB.discoverPrimaryKeys( modelName, null, function ( err, pkeys ) {
					if ( err ) {
						console.log( err );
						return;
					}
					// check the first primary key since we only ever use 1
					// if the pk is set to the pg_id then config has already ran
					if ( pkeys[ 0 ].columnName === 'pg_id__c' ) {
						console.log( 'Table ' + tableName + ' already configured.' )
							// the pg_id column is already the primary key
					} else {
						// create or replace the base trigger function for handling null input from salesforce
						app.dataSources.herokuConnectDB.connector.execute(
							"CREATE OR REPLACE FUNCTION " + modelName + "_no_null() RETURNS TRIGGER AS $$" +
							"BEGIN " +
							"IF NEW.pg_id__c IS NULL THEN " +
							"NEW.id := nextval('" + tableName + "_id_seq'); " +
							"NEW.pg_id__c := nextval('" + tableName + "_pg_id_seq'); " +
							"END IF;" +
							"RETURN NEW;" +
							"END;" +
							"$$ LANGUAGE plpgsql;",
							null,
							function ( err, results ) {
								if ( err ) {
									console.log( err );
									return;
								}
								console.log( 'Finished adding null trigger for: ' + tableName + '.' );
								app.dataSources.herokuConnectDB.connector.execute(
									"DROP TRIGGER IF EXISTS null_pk_trigger ON " + tableName + ";" +
									"CREATE TRIGGER null_pk_trigger " +
									"BEFORE INSERT ON " + tableName +
									" FOR EACH ROW " +
									"EXECUTE PROCEDURE " + modelName + "_no_null()",
									null,
									function ( err, results ) {
										if ( err ) {
											console.log( err );
											return;
										};
										console.log( 'Finished hooking in null trigger for: ' + tableName + '.' );
										// create or replace the base trigger function for sending an update request to heroku connect
										app.dataSources.herokuConnectDB.connector.execute(
											"CREATE OR REPLACE FUNCTION " + modelName + "_update_sf() RETURNS TRIGGER AS $$" +
											"DECLARE trigger_row salesforce._trigger_log;" +
											"excluded_cols text[] = ARRAY['_hc_lastop', '_hc_err']::text[];" +
											"BEGIN " +
											"IF NEW.sfid IS NOT NULL THEN " +
											"trigger_row.id = nextval('salesforce._trigger_log_id_seq');" +
											"trigger_row.action = 'UPDATE';" +
											"trigger_row.table_name = TG_TABLE_NAME::text;" +
											"trigger_row.txid = txid_current();" +
											"trigger_row.created_at = clock_timestamp();" +
											"trigger_row.state = 'NEW';" +
											"trigger_row.record_id = NEW.id;" +
											"trigger_row.values = hstore('pg_id__c', NEW.pg_id__c::text);" +
											"NEW.pg_id__c = NULL;" +
											"trigger_row.old = hstore(NEW.*) - excluded_cols;" +
											"INSERT INTO salesforce._trigger_log VALUES (trigger_row.*);" +
											"END IF;" +
											"RETURN NEW;" +
											"END;" +
											"$$ LANGUAGE plpgsql;",
											null,
											function ( err, results ) {
												if ( err ) {
													console.log( err );
													return;
												}
												console.log( 'Finished adding update sf trigger for: ' + tableName + '.' );
												app.dataSources.herokuConnectDB.connector.execute(
													"DROP TRIGGER IF EXISTS update_sf_trigger ON " + tableName + ";" +
													"CREATE TRIGGER update_sf_trigger " +
													"AFTER INSERT ON " + tableName +
													" FOR EACH ROW " +
													"EXECUTE PROCEDURE " + modelName + "_update_sf()",
													null,
													function ( err, results ) {
														if ( err ) {
															console.log( err );
															return;
														}
														console.log( 'Finished hooking in update sf trigger for: ' + tableName + '.' );
														console.log( 'Configuring ' + tableName + '.' );
														app.dataSources.herokuConnectDB.connector.execute(
															"ALTER TABLE " + tableName + " DROP CONSTRAINT " + modelName + "_pkey;" +
															"UPDATE " + tableName + " SET pg_id__c = id;" +
															"ALTER TABLE " + tableName + " ADD PRIMARY KEY(pg_id__c);" +
															"ALTER TABLE " + tableName + " ALTER COLUMN pg_id__c SET DEFAULT nextval('" + tableName + "_pg_id_seq');" +
															"ALTER SEQUENCE " + tableName + "_id_seq OWNED BY " + tableName + ".pg_id__c;",
															null,
															function ( err, output ) {
																if ( err ) {
																	console.log( err );
																	return;
																}
																console.log( 'Finished configuring columns for ' + tableName + '.' );
																console.log( 'Finished configuring table ' + tableName + '.' );
															}
														);
													}
												);
											}
										);
									}
								);
							}
						);
					}
				} );
			} );
	} );
};
