let scheduler = require('node-schedule');
let emailSender = require('./emailSender');
let fs = require('fs');

let config = JSON.parse(fs.readFileSync('./config.json'));


let sender = new emailSender(config.database, config.timeout);
let a = 0;

function start(){
    let j = scheduler.scheduleJob(`*/${config.timeout} * * * *`, function(){
        sender.send()
            .then(a => {
                console.log();
            })
            .catch(e => {
                console.log();
            });

        console.log(`Check #${a++}.`);
    });
}

start();

module.exports = start;