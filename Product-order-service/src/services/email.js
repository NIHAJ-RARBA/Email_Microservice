// src/services/email.js
const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
        user: process.env.SMTP_USER || 'your-user',
        pass: process.env.SMTP_PASS || 'your-pass'
    }
});

const sendEmail = async ({ to, subject, text }) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@example.com',
            to,
            subject,
            text
        });
    } catch (error) {
        console.error('Email sending failed:', error);
        // Don't throw error - we don't want failed emails to break the order process
    }
};

module.exports = sendEmail;