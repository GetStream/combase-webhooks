import 'dotenv/config';
import nodemailer from 'nodemailer';
import sgTransport from 'nodemailer-sendgrid-transport';
console.log(process.env.SENDGRID_KEY)
export const emailTransport = nodemailer.createTransport(
	sgTransport({
		auth: {
			api_key: process.env.SENDGRID_KEY,
		},
	})
);