import {Secure} from "../../main/secureService/Secure";
import * as textM from "../../main/util/TextM";


let secure = new Secure("root");


export class SecureTest {

    /*
    * readName password
    * userName
    * adminName
    *
    * */
    async init() {
        await secure.init();

        let token = await secure.login("admin", "admin");
        let testQuery = await secure.query('supply.stages', 'abort', {
            filter : {
                comparisons: {
                    "qid": {
                        "left": {
                            "type": "field",
                            "value": "qid"
                        },
                        "right": {
                            "type": "value",
                            "value": "33a57230-5a16-b663-6371-3b0a14aa96a1"
                        },
                        "sign": "equal"
                    }
                },
                tree: {
                    "and": [
                        "qid"
                    ]
                }
            }
        }, token.token);
        // let testQuery = await secure.getInterface(token);
        await secure.logout(token.token);
        console.log("зарегистрирован");
    }


}

