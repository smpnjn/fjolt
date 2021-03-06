import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '../', '.env') });

import mail from 'nodemailer'
import schedule from 'node-schedule'
import mongoose from 'mongoose'
import { createPage } from '../bin/util.js'
import * as Subscription from '../models/subscription.model.js';


const connection = mongoose.connect(process.env.mongooseUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const mailer = async () => {	
    try {
        let transporter = mail.createTransport({
            host: process.env.contactHost,
            port: 465,
            debug: true,
            pool: true,
            maxMessages: Infinity,
            secure: true,
            auth:{
                user: process.env.contactEmail,
                pass: process.env.contactPassword
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        let allSubs = await Subscription.Subscription.find();

        allSubs.forEach(async function(item) {
            let text = await createPage('subscription', { session: { data: [] } }, true);
            if(typeof item.email !== "undefined") {
                transporter.sendMail({
                    from   : `${process.env.websiteName} <${process.env.contactEmail}>`,
                    to     : item.email,
                    subject: process.env.subscriptionEmailTitle,
                    replyTo: process.env.contactEmail,
                    headers: { 'Mime-Version' : '1.0', 'X-Priority' : '3', 'Content-type' : 'text/html; charset=iso-8859-1' },
                    html   : text
                }, (err, info) => {
                    if(err !== null) {
                        console.log(err);
                    }
                    else {
                        console.log(`Email sent to ${item.email} at ${new Date().toISOString()}`);
                    }
                });
            }
        });

    } catch(e) {
        console.log(e);
    }
}

if(process.env.subscriptionEnabled === "true" || process.env.subscriptionEnabled == true) {
    schedule.scheduleJob('00 30 10 * * 1', async function() {
        try {
            mailer();
        } catch(e) {
            console.log(e);
        }
    });
}
