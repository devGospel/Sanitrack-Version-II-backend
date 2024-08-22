import nodemailer from 'nodemailer';
import env from "dotenv"

env.config()

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MY_EMAIL!,
        pass: process.env.APP_PASSWORD!
    }
});

export default transporter