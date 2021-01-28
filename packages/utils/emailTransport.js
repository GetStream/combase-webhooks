import 'dotenv/config';
import nodemailer from 'nodemailer';
import sgTransport from 'nodemailer-sendgrid-transport';

export const emailTransport = nodemailer.createTransport(
	sgTransport({
		auth: {
			api_key: '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',
		},
	})
);