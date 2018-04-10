import {PopulateHistoryTest} from "./PopulateHistoryTest";
import {Secure} from "../../main/secureService/Secure";
import {DeletePopulateHistoryTest} from "./DeletePopulateHistoryTest";
import {subscriberView} from "../../../subscriberView";
import * as textM from "../../main/util/TextM";
import {EntityBuilder} from "../../main/util/EntityBuilder";

let view =  new subscriberView("supplyWithRoles");
let secure = new Secure(null, view);

export class HistoryTest {
    async init() {
        await secure.init();

        await new DeletePopulateHistoryTest(view).deletePopulate();
        await new PopulateHistoryTest(view).populate();
        let token = await secure.login("admin", "admin");

        // let testQuery = await secure.query(textM.supply.query_position, textM.dbMethod.delete, {}, token);
        let testQuery = await secure.query(textM.role.users_tokens, textM.dbMethod.get, {}, token);
       /* let insertObject = [];
        insertObject.push(EntityBuilder.buildObject("newObject1"));
        insertObject.push(EntityBuilder.buildObject("newObject2"));
        insertObject.push(EntityBuilder.buildObject("newObject3"));
        insertObject.push(EntityBuilder.buildObject("newObject4"));
        insertObject.push(EntityBuilder.buildObject("newObject5"));


        let testQuery = await secure.query(textM.role.objects, textM.dbMethod.update,
            {values: insertObject},
            token);*/

        let sum = 0;
        for (let position in testQuery) {
            sum++;
        }
        console.log(`всего записей: ${sum}`);
        console.log("stop");
        await secure.logout(token);
        console.log("зарегистрирован");
    }
}