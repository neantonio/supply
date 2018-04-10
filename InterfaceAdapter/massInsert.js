let dataRouter = require('./routers/dataRouter');
let Profiler = require('./profiler');
import {objectView} from '../objectView';

let objView = new objectView("supplyWithRoles");

global.objView = objView;

objView.init()
    .then(() => {
            let profiler = new Profiler('Замер функции insertRecords');
            profiler.start();
            let result = insertRecords('query', 50);

            result.then(() => {
                profiler.end();
                console.log('Записи успешно созданы!');
            });
            result.catch((err) => {
                console.log('ERROR! Ошибка при создании записей! ' + err);
            });
        }, (err) => {
            console.log("massInsert.js ERROR! Server hasn't been created! " + err);
        }
    );


async function insertRecords(object, amount) {

    let options = {};

    options.object = object;
    options.values = formValues();

    return dataRouter.insertServerData(options);

    function formValues() {

        let result = [];

        for (let i = 0; i < amount; i++) {
            let obj = {};
            obj.description = 'Тестовый объект ' + i;
            result.push(obj);
        }

        return result;

    }

}

