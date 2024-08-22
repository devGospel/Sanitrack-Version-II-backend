import  transporter  from '../config/nodemailer';
import  hbs from 'nodemailer-express-handlebars';
import path from "path"
import { createChildLogger } from "../utils/childLogger";

const moduleName = '[sendEmail]/controller'
const Logger = createChildLogger(moduleName)
function sendEmail(email: string, otp: string) {

  const handlebarOptions = {
    viewEngine: {
      extName: ".handlebars",
      partialsDir: path.resolve('./src/views'),
      defaultLayout: 'src/views/email',
    },
    viewPath: path.resolve('./src/views'),
    extName: ".handlebars",
  }

  transporter.use('compile', hbs(handlebarOptions));

    var mailOptions = {
      from: 'OrionTech',
      to: email,
      subject: 'OTP',
      template: "email", 
      context: {
        otp: otp,
      }
    };


    transporter.sendMail(mailOptions, (err, res) => {
      if (err) {
          console.log(err);
          Logger.error(`the email I want to send with => ${process.env.MY_EMAIL} password is ${process.env.APP_PASSWORD}`)
      } else {
          console.log('Email sent successfully');
      }
    });
}
export default sendEmail