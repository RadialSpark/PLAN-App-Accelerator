module.exports = {
	pgDB: {
		user: process.env.LOCAL_USER,
		password: process.env.LOCAL_PASSWORD,
		database: process.env.LOCAL_DATABASE
	},
	herokuConnectDB: {
		user: process.env.LOCAL_USER,
		password: process.env.LOCAL_PASSWORD,
		database: process.env.LOCAL_HEROKUCONNECT_DB
	},
	sendGrid: {
		transports: [ {
			type: 'smtp',
			host: 'smtp.sendgrid.net',
			secure: false,
			port: 587,
			auth: {
				user: process.env.SENDGRID_USERNAME,
				pass: process.env.SENDGRID_PASSWORD
			}
		} ]
	}
};
