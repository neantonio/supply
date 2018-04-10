class TextM {

    constructor() {
        this.methods = {
            addObject: "addObject",
            delObject: "delObject",
            get: "get",
            getInterface: "getInterface",
            getLinks: "getLinks",
            getRefs: "getRefs",
            query: "query",
            login: "login",
            logout: "logout"
        };

        this.role = {
            role: "role",
            filters: "role.filters",
            filters_actions: "role.filters_actions",
            filters_fields: "role.filters_fields",
            objects: "role.objects",
            objects_actions: "role.objects_actions",
            objects_fields: "role.objects_fields",
            roles: "role.roles",
            roles_filters: "role.roles_filters",
            signs: "role.signs",

            users: "role.users",
            users_filters: "role.users_filters",
            users_roles: "role.users_roles",
            users_tokens: "role.users_tokens",

            history: "role.history",
            history_instances: "role.history_instances",
            history_instances_fields: "role.history_instances_fields"
        };

        this.supply = {
            supply: "supply",
            product: "supply.product",
            query_position: "supply.query_position",
            query: "supply.query",
            organization: "supply.organization",
            subdivision: "supply.subdivision",
            stock: "supply.stock",
            unit: "supply.unit",
            stages_supSelection: "supply.stages_supSelection"
        };


        this.fields = {
            id: "ID",
            description: "description",
            email: "email",
            password: "password",
            salt: "salt",
            user: "user",
            userId: "userID",
            token: "token",
            expirationDate: "expirationDate",
            IP: "IP",

            sign: "sign",
            actionId: "actionID",
            filterId: "filterID",
            filtersGroup:"filtersGroup",
            fieldId: "fieldID",
            signId: "signID",
            objectId: "objectID",
            roleId: "roleID",
            values: "values",
            parentID: "parentID",
            nomGroup: "nomGroup",
            productID: "productID",
            queryID: "queryID",
            organization: "organization",
            linkValue: "linkValue",
            date: "date",
            methodId: "methodID",

            entityId: "entityID",
            historyId: "historyID",
            historyInstanceId: "historyInstanceID",
            valueOld: "valueOld",
            valueNew: "valueNew"
        };

        this.typeField = {
            ref: "ref",
            link: "link",
            string: "string",
            object: "object",
            value: "value",
            field: "field"
        };

        this.dbMethod = {
            get: "get",
            insert: "insert",
            update: "update",
            "delete": "delete",
            sync: "sync"
        };

        this.rang = {
            readOnly: "read",
            admin: "admin",
            user: "user",
        };

        this.message = {
            noSuccess: "нет доступа",
            notDefinedValueAliasMap: "not this defined value in CryptAliasesMapUtil",
            notToken: "Токен не передан"

        };

        this.znak = {
            'equal': '=',
            'unEqual': '!=',
            'greater': '>',
            'less': '<',
            'greaterEqual': '>=',
            'lessEqual': '<=',
            'in': 'IN',
            'consist': 'ILIKE',
            'rin': "rin"

        };

        this.sign = {
            'equal': 'equal',
            'unEqual': 'unEqual',
            'greater': 'greater',
            'less': 'less',
            'greaterEqual': 'greaterEqual',
            'lessEqual': 'lessEqual',
            'in': 'in',
            'consist': 'consist',
            'rin': "rin"
        }
    }
}

module.exports = new TextM();