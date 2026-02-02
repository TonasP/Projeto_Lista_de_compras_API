const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // Vai ler smtp.gmail.com
    port: Number(process.env.EMAIL_PORT), // Vai ler 587
    secure: false, // true para 465, false para outras portas
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Aquela senha de app gerada
    },
    tls: {
        rejectUnauthorized: false // Ajuda a evitar erros de certificado em localhost
    }
});

module.exports = transporter;