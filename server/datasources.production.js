module.exports = {
	pgDB: {
		url: process.env.DATABASE_URL
	},
	herokuConnectDB: {
		url: process.env.HEROKUCONNECT_DB_URL
	},
	sendGrid: {
		transports: [ {
			type: 'SMTP',
			host: 'smtp.sendgrid.net',
			secure: true,
			port: 465,
			auth: {
				user: process.env.SENDGRID_USERNAME,
				pass: process.env.SENDGRID_PASSWORD
			}
		} ]
	}
};
