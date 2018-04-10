let scheduler = require('node-schedule');
let checkModule = require('./applyChecker');
let fs = require('fs');

let config = JSON.parse(fs.readFileSync('./config.json'));


let checker = new checkModule(config.userData, config.timeout);
let a = 0;
let j;

function start(){
    j = scheduler.scheduleJob(`*/${config.schedulerTimeout} * * * *`, function(){
        checker.check()
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