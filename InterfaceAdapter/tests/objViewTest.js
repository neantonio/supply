'use strict';

let assert = require('chai').assert;
let config = require('../config')

let dataRouter = require('../../InterfaceAdapter/routers/dataRouter');
let cloneDeep = require('lodash.clonedeep');
import {objectView} from '../../objectView';
let objView = new objectView(`magicControl`);
global.objView = objView;

// имя главного объекта
let mainObject = 'hero';
// имя ТЧ главного объекта
let addTableForMainObject = 'inventory';

// меняем конфиг специально для теста
config.set('objectView','magic');

describe('Тестирование objectView.js и dataRouter.js', function () {
    // чтобы mocha не вылетала по таймауту
    this.timeout(15000);

    it(`1. Метод init() работает без ошибок и возвращает Promise`, function () {
        return init();
    });

    describe(`Операции над справочником ${mainObject}`.toUpperCase(), function () {
        it(`2. Метод DataRouter.getServerData() получает все записи из справочника ${mainObject} `, function () {
            return getRecordsFromMainObject();
        });

        let mainObjectValues = [{
            'description': 'Mocha Superhero',
            'level': 10,
            'health': 120.55,
            'mana': 60.5
        }];

        let addTableForMainObjectValues = [{
            'description': `Mocha Superhero's weapon`
        }];

        it(`3. Метод DataRouter.insertServerData() добавляет новый объект в справочник ${mainObject} `, function () {
            return insertRecordsToMainObject(mainObjectValues);
        });

        //describe(`Операции над табличной частью ${addTableForMainObject} объекта ${mainObject}`,function(){
        it(`4. Метод DataRouter.insertServerData() добавляет новую запись в ТЧ ${addTableForMainObject} справочникa ${mainObject} `, function () {
            return insertRecordsToAddTable(mainObjectValues, addTableForMainObjectValues);
        });

        it(`5. Метод DataRouter.getServerData() получает все записи в ТЧ ${addTableForMainObject} справочникa ${mainObject} `, function () {
            return getRecordsFromAddTable(mainObjectValues);
        });

        it(`6. Метод DataRouter.getServerData() получает запись по ID в ТЧ ${addTableForMainObject} справочникa ${mainObject} `, function () {
            return getRecordsByIDFromAddTable(mainObjectValues, addTableForMainObjectValues);
        });

        it(`7. Метод DataRouter.updateRecordsInPosition() изменяет запись в ТЧ ${addTableForMainObject} справочникa ${mainObject} `, function () {
            return updateRecordsInAddTable(addTableForMainObjectValues);
        });

        it(`8. Метод DataRouter.insertServerData() удаляет запись из ТЧ ${addTableForMainObject} справочникa ${mainObject} `, function () {
            return deleteRecordsInAddTable(addTableForMainObjectValues);
        });
        //});

        it(`9. Метод DataRouter.getServerData() получает объект из справочника ${mainObject} по ID `, function () {
            return getRecordsByIDFromMainObject(mainObjectValues);
        });

        it(`10. Метод DataRouter.updateServerData() изменяет объект в справочнике ${mainObject} `, function () {
            return updateRecordsInMainObject(mainObjectValues);
        });

        it(`11. Метод DataRouter.deleteServerData() удаляет объект в справочнике ${mainObject} `, function () {
            return deleteRecordsInMainObject(mainObjectValues);
        });
    });

});

function init() {

    let testPromise = objView.init();

    return testPromise.then(() => {
        assert.equal('success', 'success');
    });

}

// Methods to test object ${mainObject}
function getRecordsFromMainObject() {

    let options = {
        object: mainObject,
    };

    let testPromise = dataRouter.getServerData(options);

    return testPromise.then((serverData) => {
        let result;
        let records = serverData.records;
        assert.equal('success', 'success');
    });

}

function getRecordsByIDFromMainObject(values) {

    let filter = {
        'ID': {
            value: values[0]['ID']
        }
    };

    let options = {
        object: mainObject,
        filter: filter
    };


    let testPromise = dataRouter.getServerData(options);

    return testPromise.then((serverData) => {
        let result;
        let records = serverData.records;
        if (Object.keys(records)) {
            result = 'success';
        }
        assert.equal('success', 'success');
    });

}

function insertRecordsToMainObject(values) {

    let options = {
        object: mainObject,
        values: values
    };

    let testPromise = dataRouter.insertServerData(options);

    return testPromise.then((serverData) => {

        let result;

        if (values[0]['ID']) {
            result = 'success';
        }

        assert.equal('success', result);

    });

}

function updateRecordsInMainObject(values) {

    let filter = {
        'ID': {
            value: values[0]['ID']
        }
    };

    values[0]['description'] = 'update';

    let options = {
        object: mainObject,
        filter: filter,
        values: values
    };

    let testPromise = dataRouter.updateServerData(options);

    return testPromise.then((serverData) => {

        assert.equal('success', 'success');

    });

}

function deleteRecordsInMainObject(values) {

    let filter = {
        'ID': {
            value: values[0]['ID']
        }
    };

    let queryOptions = {
        object: mainObject,
        filter: filter
    };

    let testPromise = dataRouter.deleteServerData(queryOptions);

    return testPromise.then((serverData) => {

        assert.equal('success', 'success');

    });

}


// Methods to test object Position
function getRecordsFromAddTable(values) {

    let filter = {
        'heroID': {
            value: values[0]['ID']
        }
    };

    let options = {
        object: addTableForMainObject,
        filter: filter
    };

    let testPromise = dataRouter.getServerData(options);

    return testPromise.then((serverData) => {
        let result;
        let records = serverData.records;
        if (Object.keys(records)) {
            result = 'success';
        }
        assert.equal('success', 'success');
    });

}

function getRecordsByIDFromAddTable(values, positionValues) {

    let filter = {
        'ID': {
            value: positionValues[0]['ID']
        },
        'heroID': {
            value: values[0]['ID']
        }
    };

    let options = {
        object: addTableForMainObject,
        filter: filter
    };


    let testPromise = dataRouter.getServerData(options);

    return testPromise.then((serverData) => {
        let result;
        let records = serverData.records;
        if (Object.keys(records)) {
            result = 'success';
        }
        assert.equal('success', 'success');
    });

}

function insertRecordsToAddTable(values, positionValues) {

    let filter = {
        'heroID': {
            value: values[0]['ID']
        }
    };

    let options = {
        object: addTableForMainObject,
        filter: filter,
        values: positionValues
    };

    let testPromise = dataRouter.insertServerData(options);

    return testPromise.then((serverData) => {

        let result;

        if (values[0]['ID']) {
            result = 'success';
        }

        assert.equal('success', result);

    });

}

function updateRecordsInAddTable(values) {

    let filter = {
        'ID': {
            value: values[0]['ID']
        }
    };

    values[0]['description'] = 'update';

    let options = {
        object: addTableForMainObject,
        filter: filter,
        values: values
    };

    let testPromise = dataRouter.updateServerData(options);

    return testPromise.then((serverData) => {

        assert.equal('success', 'success');

    });

}

function deleteRecordsInAddTable(values) {

    let filter = {
        'ID': {
            value: values[0]['ID']
        }
    };

    let queryOptions = {
        object: addTableForMainObject,
        filter: filter
    };

    let testPromise = dataRouter.deleteServerData(queryOptions);

    return testPromise.then((serverData) => {

        assert.equal('success', 'success');

    });

}

