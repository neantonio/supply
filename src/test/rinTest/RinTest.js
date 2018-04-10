import {Secure} from "../../main/secureService/Secure";
import * as textM from "../../main/util/TextM";
import {subscriberView} from "../../../subscriberView";
import {DeletePopulateRinTest} from "./DeletePopulateRinTest";
import {PopulateRinTest} from "./PopulateRinTest";
import {IntrospectingUtil} from "../../main/util/IntrospectingUtil";

let view = new subscriberView("supplyWithRoles");
let secure = new Secure(null, view);

export class RinTest {

    async init() {
        await secure.init();
        let parameters = await this.startCondition();
        IntrospectingUtil.init(view);
        parameters = {};
        let token = await secure.login("admin", "admin");
        let testQuery = await secure.query(textM.supply.query_position, textM.dbMethod.get, parameters, token);
        let sum = 0;

        for (let position in testQuery.records) {
            sum++;
        }
        console.log(`всего записей: ${sum}`);
        console.log("stop");
        await secure.logout(token);
        console.log("зарегистрирован");
    }

    async startCondition() {
        let parameters = {
            filter: {
                comparisons: {
                    name: {
                        left: {type: "field", value: "ID"},
                        right: {type: "field", value: "ID"},
                        sign: "equal"
                    }
                },
                tree: {and: ["name"]}
            }/*,
            values: [{description: "newDescription"}]*/
        };
       /* await new DeletePopulateRinTest(view).deletePopulate();
        await new PopulateRinTest(view).populate();*/
        return parameters;
    }
}
