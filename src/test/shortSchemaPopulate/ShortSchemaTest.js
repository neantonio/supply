import {Secure} from "../../main/secureService/Secure";
import {subscriberView} from "../../../subscriberView";
import * as textM from "../../main/util/TextM";
import {PopulateSchemaTest} from "./PopulateShemaTest";
import {DeletePopulateShortTest} from "./DeletePopulateShortTest";

let view =  new subscriberView("root");
let secure = new Secure(null, view);

export class ShortSchemaTest {
    async init() {
        await secure.init();

        await new DeletePopulateShortTest(view).deletePopulate();
        await new PopulateSchemaTest(view).populate();
        let token = await secure.login("asmUser", "asmUser");

        let testQuery = await secure.query(textM.supply.stages_supSelection, textM.dbMethod.get, {}, token);

        let sum = 0;
        for (let position in testQuery.records) {
            sum++;
        }
        console.log(`всего записей: ${sum}`);
        console.log("stop");
        await secure.logout(token);
        console.log("зарегистрирован");
    }
}