import * as textM from "../main/util/TextM";
import {subscriberView} from "../../subscriberView";

export class Populate1C {

    constructor() {
        this.objView = new subscriberView("supplyWithRoles");
    }


    async sync1C() {
        await this.objView.init();
        await this.objView.query(textM.supply.organization, textM.dbMethod.sync, {});
        await this.objView.query(textM.supply.subdivision, textM.dbMethod.sync, {});
        await this.objView.query(textM.supply.stock, textM.dbMethod.sync, {});
        await this.objView.query(textM.supply.unit, textM.dbMethod.sync, {});
        await this.objView.query(textM.supply.product, textM.dbMethod.sync, {});
    }
}
