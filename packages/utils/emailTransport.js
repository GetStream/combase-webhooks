import 'dotenv/config';
import nodemailer from 'nodemailer';

export const emailTransport = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 465,
    secure: true,
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_SMTP_PASS,
    }
});