'use strict';
import * as emailBills from "./configs/emailBills.json";

const PQueue = require('p-queue');
import * as nodemailer from "nodemailer";

let transporter;
let queue;

/**
 * @param config - config for email
 * @param config.user {string} - username
 * @param config.password {string} - password
 * @param config.smtp {string} - smtp server
 * @param config.from {string} - field from
 * @param config.concurrency {number} - concurrency for emails
 * @param config.timeout {number} - if email fail to send, then timeout for repeat. In milliseconds.
 * @param config.numberOfAttempts {number} - how much attempts for sending email.
 * @param config.aliasFrom {string} - alias for field from.
 */
class Email {
    constructor(config) {
        this.__config = config;
    }

    _init() {
        const config = this._getConfig();
        transporter = nodemailer.createTransport({
                host: config.smtp,
                secure: true,
                auth: {
                    user: config.user,
                    pass: config.password
                },
                tls: {
                    rejectUnauthorized: false
                }
            }
        );

        queue = new PQueue({concurrency: config.concurrency});
    }

    _getConfig() {
        return this.__config;
    }

    /**
     *
     * @param letters {Array} - array emails
     * @param letters.subj || subject {string} - subject email
     * @param letters.to {string} - field to
     * @param letters.from {string} - field from
     * @param letters.body {string} - body email
     * @return {Promise.<string>} - "All email's has been sending"
     */
    async sendEmails(letters) {
        const config = this._getConfig();
        const promisesMail = [];
        for (let i = 0; i < letters.length; i++) {
            const aliasFrom = config.aliasFrom + '  ';
            const params = {
                from: aliasFrom + config.from,
                to: letters[i].to,
                subject: letters[i].subject || letters[i].subj,
                html: letters[i].body
            };
            if (letters[i].replyTo) {
                params.replyTo = letters[i].replyTo;
            }
            if (letters[i].attach) {
                params.attach = letters[i].attach;
            }
            await this._sendMail(params);
        }

        //await Promise.all(promisesMail);
        return 'All email\'s has been sending.';
    }

    _sendMail(params) {
        const self = this;
        return new Promise((resolve, reject) => {
            const config = self._getConfig();
            let counter = 0;
            queue.add(mail)
                .then(res => {
                    resolve(res);
                })
                .catch(err => {
                    reject(err);
                });

            function mail() {
                return new Promise((resolve, reject) => {
                    transporter.sendMail(params)
                        .then(() => {
                            resolve('success');
                        })
                        .catch(() => {
                            if (counter < config.numberOfAttempts) {
                                counter++;
                                setTimeout(mail, config.timeout);
                            } else {
                                reject('Error sending mail')
                            }
                        });
                });
            }
        });
    }
}

const confEmail = emailBills.config;
const email = new Email(confEmail);
email._init();

export {email};