import {Secure} from "../../main/secureService/Secure";
import * as textM from "../../main/util/TextM";
import {subscriberView} from "../../../subscriberView";
import {DeletePopulateAliasTest} from "./DeletePopulateAliasTest";
import {PopulateAliasTest} from "./PopulateAliasTest";
import {EntityBuilder} from "../../main/util/EntityBuilder";


let view = new subscriberView("supplyWithRoles");
let secure = new Secure(null, view);

export class AliasTest {

    async init() {
        let parameters = {
            filter: {
                comparisons: {
                    name: {
                        left: {type: "field", value: "queryID.description"},
                        right: {type: "value", value: "z1"},
                        sign: "equal"
                    }
                },
                tree: {and: ["name"]}
            },
            values: [{description: "newDescription"}]
        };

        await secure.init();
        await new DeletePopulateAliasTest(view).deletePopulate();
        await new PopulateAliasTest(view).populate();

        let token = await secure.login("admin", "admin");
        let testQuery = await secure.query(textM.supply.query_position, textM.dbMethod.get, parameters, token);

        let sum = 0;
        if (testQuery) {
            for (let position in testQuery.records) {
                sum++;
            }
        }
        console.log(`всего записей: ${sum}`);
        console.log("stop");
        await secure.logout(token);
        console.log("зарегистрирован");
    }

}