let dataRouter = require('../../routers/dataRouter');
let mode = process.env.NODE_ENV || 'development';

// обработчик для получения меню
export async function handler(clientData) {
    let token = clientData.token;
    let objectView = clientData.objView; // предметная область в которой работает пользователь
    let objectViewInterface;
    try {
        //objectViewInterface = await objView.getInterface(token);
        objectViewInterface = await dataRouter.getInterface(objectView, null, token);
    } catch (err) {
        throw("Ошибка при получении меню. Ошибка при получении интерфейса supply: " + err);
    }

    let menu = {};

    let objects = objectViewInterface.objects;
    // получим массив с именами объектов, корторые являются ТЧ, чтобы не отрисовывать их в меню в 'production' режиме
    let allRefs = getAllRefs(objects);

    for (let objName in objects) {
        if (allRefs.indexOf(objName) !== -1 && mode === 'production') {
            continue;
        }
        if (!objects[objName].methods.get) {
            continue;
        }
        let obj = objects[objName];
        let objType = obj.common;

        if (objType === 'reference') {
            objType = 'Справочники';
        } else if (objType === 'reference1C') {
            objType = 'Справочники 1C';
        } else if (objType === 'stage') {
            objType = 'Этапы';
        } else if (objType === 'scheme') {
            objType = 'Схемы';
        }

        if (menu[objType] === undefined) {
            menu[objType] = {
                display: objType,
                objects: []
            };
        }
        menu[objType].objects.push({
            key: obj.name,
            value: obj.description
        });
    }

    return menu;

    // функция получает все на вход массив объектов и возвращает массив с их табличными частями
    function getAllRefs(objects){
        let allRefs = [];
        for (let objName in objects) {
            let obj = objects[objName];
            if (obj.refs) {
                allRefs = allRefs.concat(obj.refs);
            }
        }
        return allRefs;
    }

}