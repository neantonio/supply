import {objectView} from "../objectView";

let ov = new objectView("supplyWithRoles");
ov.init()
    .then(() => ov.info())
    .then(() => {
        return ov.query("supply.query", "get", {
            fields: ["ref.position.description"]
        })
    })
    .then(async (res) => {
        let roles = ov.__objectViews["role"];
        let supply = ov.__objectViews["supply"];
        let interfaceRole = await roles.getInterface();
        let interfaceSupply = await supply.getInterface();

        function getObjMethods(intface) {
            let result = {};
            let objects = Object.keys(intface.objects);
            for (let obj in objects) {
                result[objects[obj]] = [];
                for (let m in intface.objects[objects[obj]].methods) {
                    result[objects[obj]].push(m);
                }
            }
            return result;
        }

        let objMethodsSupply = getObjMethods(interfaceSupply);

        let objects = await roles.query('objects', 'get', {});
        let objectsInDB = {};
        for (let f in objects.records) {
            objectsInDB[objects.records[f].fields.description] = objects.records[f].fields.ID;
        }

        //ищем недостающие объекты, если находим - записываем в бд
        let toObjects = [];
        for (let f in objMethodsSupply) {
            let tmp = f;
            if (!objectsInDB[f]) {
                toObjects.push({description: tmp});
            }
        }
        if (toObjects.length !== 0) {
            await roles.query('objects', 'insert', {values: toObjects});
        }

        //получаем обновленные записи, для того чтобы узнать uuid новых записей
        objects = await roles.query('objects', 'get', {});
        objectsInDB = {};
        for (let f in objects.records) {
            objectsInDB[objects.records[f].fields.description] = objects.records[f].fields.ID;
        }
        objMethodsSupply = getObjMethods(interfaceSupply);

        let actionsSupply = await roles.query('actions', 'get', {});

        //смотрим все записи в actions и если находим недостающие записи то вставляем их
        let toActions = [];
        for (let f in objMethodsSupply) {
            let methods = objMethodsSupply[f];
            for (let m in methods) {
                let objectID = objectsInDB[f];
                if (!findAction(actionsSupply.records, methods[m], objectID)) {
                    toActions.push({
                        description: methods[m],
                        objectID: objectID
                    });
                }
            }
        }
        if (toActions.length !== 0) {
            await roles.query('actions', 'insert', {values: toActions});
        }

        function findAction(actions, nameAction, objectID) {
            for (let f in actions) {
                if (actions[f].fields.description === nameAction && actions[f].fields.objectID === objectID) {
                    return {ID: actions[f].fields.ID, description: actions[f].fields.description};
                }
            }
            return false;
        }

        // Object.keys(actions.records).map(row => {
        //     row = row.fields.description;
        // });
        /*await roles.query('objects', 'insert', {//добавить в таблицу objects записи
            values: Object.keys(interfaceSupply.objects).map(row => {//таблицы объекта supply
                return {description: row};
            })
        });
        let actions = await roles.query('objects', 'get', {

        //1) получить список всех зарегистрированных действий для всех объектов, зарегистрированных в ролях (чтобы не дублировалось)
        //2) получить список всех объектов которые есть в supply
        //3) сопоставить 1 и 2, добавить все что незарегистрировано в роли
        //4) добавить все действия которые можно делать с объектом (суперадмин)
        let roleObjects = await roles.query("objs", "get", {
            fields: [
                "ref.actions.ID",
                "ref.actions.description"
            ]
        });
        let supplyInterface = supply.getInterface();

        // проверка, что есть из supplyInterfaces в roleObjects
        let absentObjects = [];*/

        1 + 1;
    })
    .then(o => {
        console.log(o)
    })
    .catch(e => {
        console.log('azaza');
        logger.write(`warning`, `Ошибка при инициализации предметной области: \n Error: ${e}`, new Error())
    });
