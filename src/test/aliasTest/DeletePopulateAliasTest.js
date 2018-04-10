import * as textM from "../../main/util/TextM";

const parameters = {};

export class DeletePopulateAliasTest {
    constructor(view) {
        this.view = view;
    }


    async deletePopulate() {
        let parameters = {};

        //supply
        await this.view.query(textM.supply.query_position, textM.dbMethod.delete, parameters);
        await this.view.query(textM.supply.query, textM.dbMethod.delete, parameters);

        //role
        // await this.view.query(textM.role.users_tokens, textM.dbMethod.delete, parameters);
        await this.view.query(textM.role.users_filters, textM.dbMethod.delete, parameters);
        await this.view.query(textM.role.users_roles, textM.dbMethod.delete, parameters);
        await this.view.query(textM.role.users, textM.dbMethod.delete, parameters);

        await this.view.query(textM.role.roles, textM.dbMethod.delete, parameters);
        await this.view.query(textM.role.roles_filters, textM.dbMethod.delete, parameters);

        await this.view.query(textM.role.filters_fields, textM.dbMethod.delete, parameters);
        await this.view.query(textM.role.filters_actions, textM.dbMethod.delete, parameters);
        await this.view.query(textM.role.filters, textM.dbMethod.delete, parameters);

        await this.view.query(textM.role.signs, textM.dbMethod.delete, parameters);

        await this.view.query(textM.role.objects_actions, textM.dbMethod.delete, parameters);
        await this.view.query(textM.role.objects_fields, textM.dbMethod.delete, parameters);
        await this.view.query(textM.role.objects, textM.dbMethod.delete, parameters);



        // await this.view.query(textM.supply.query, textM.dbMethod.delete, parameters);

    }
}