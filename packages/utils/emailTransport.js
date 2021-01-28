import 'dotenv/config';
import nodemailer from 'nodemailer';
import sgTransport from 'nodemailer-sendgrid-transport';

export const emailTransport = nodemailer.createTransport(
	sgTransport({
		auth: {
			api_key: process.env.SENDGRID_KEY,
		},
	})
);