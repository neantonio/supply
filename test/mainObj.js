/**
 * Created by User on 06.06.2017.
 */

"use strict"
;


class testSubscriberBehavior{
    async __runSubscribers(sbs){
        let preAr = [];
        try {
            for (let p of sbs) {
                preAr.push({
                    data: await p.sb(...args),
                    rbFunction: p.rb ? p.rb : Promise.resolve
                });
            }
        }
        catch(e){
            for(let rb of preAr)
                try{
                    await rb.rbFunction(data);
                }
                catch(e){
                    console.log("Error by execute rollback function.");
                }
        }
        return preAr;
    }

    async pushPreSubscriber(){

    }

    async pushPostSubscriber(){

    }

    constructor(){
        let self = this;
        this.sbs = {
            testMethod: {
                preSB: [
                    {
                        sb: async () => {
                            console.log("Blya");
                        },
                        rb: async () => {
                            console.log("Blya rollback")
                        }
                    },
                    {
                        sb: async ()  =>  {
                            console.log("Zalupa");
                        }
                    }
                ],
                postSB: [

                ],
                rollBack: async () => {
                    console.log("Main rollback for testMethod");
                }
            }
        };

        let pr = Object.getPrototypeOf(this);
        let ks = Object.getOwnPropertyNames(pr);
        for(let m in ks){
            let f = pr[ks[m]];
            if(typeof f === "function")
                this[ks[m]] = async function(...args){
                    if (self.sbs[ks[m]] && self.sbs[ks[m]].preSB)
                        self.__runSubscribers(self.sbs[ks[m]].preSB);
                    let res;

                    try {
                        res = f(...args);
                    }
                    catch(e){

                    }
                }
        }
        1+1
    }

    async init() {
        /*for(let p in super)
            if(typeof(super[p]) === "function")
                this[p] = (...pars) => {
                    if(this.sbs[p])
                        Promise.all(this.sbs[p]);
                    super[p](...pars);
                }*/
    }

    async testMethod(){
        console.log("HujPizda");
    }
}

let t = new testSubscriberBehavior();
t.init()
    .then( () => {
        return t.testMethod()
    })
    .then(
        () => {
            // console.log(1)
        }
    )
    .then(() => {
        t.sbs.testMethod.push(
            async () =>{
                throw "Solnyshko";
            });
        return t.testMethod();
    })
    .then(() => {
        console.log("11");
    })
    .catch(
        (e) => {
            console.log(2)
        }
    );