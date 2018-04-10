let assert = require('chai').assert;
let viewConfig = require('../../config/controller');

describe("Тестирование класса ConfigController", () => {
    describe("Тестирование метода get", () => {

        let configDataForTest = {
            "query": {
                "forms": {
                    "helloWorldForm": 123
                }
            },
            "reference": {
                "forms": {
                    "list": {},
                    "element": {},
                    "choose": {}
                }
            },
            "stages": {
                "forms": {
                    "list": {},
                    "element": {},
                    "choose": {}
                }
            }
        };

        viewConfig.setConfigInfo(configDataForTest);

        it("При вызове без параметров возвращает весь конфиг", () => {
            let result = viewConfig.get();
            assert.deepEqual(result,configDataForTest);
        });

        it("При при передаче параметра не строкового типа возвращается null", () => {
            assert.isNull(viewConfig.get(null,null));
            assert.isNull(viewConfig.get(null,undefined));
            assert.isNull(viewConfig.get(null,[]));
            assert.isNull(viewConfig.get(null,{}));
            assert.isNull(viewConfig.get(null,123));
            assert.isNull(viewConfig.get(null,NaN));

            // assert.throws(viewConfig.get.bind(null,null));
            // assert.throws(viewConfig.get.bind(null,undefined));
            // assert.throws(viewConfig.get.bind(null,[]));
            // assert.throws(viewConfig.get.bind(null,{}));
            // assert.throws(viewConfig.get.bind(null,123));
            // assert.throws(viewConfig.get.bind(null,NaN));
        });

        it("При обращании к несуществующему свойству возвращается null", () => {
            assert.isNull(viewConfig.get(null,""));
            assert.isNull(viewConfig.get(null,"reference.hodor"));
            assert.isNull(viewConfig.get(null,"reference."));

            // assert.throws(viewConfig.get.bind(null,""));
            // assert.throws(viewConfig.get.bind(null,"reference.hodor"));
            // assert.throws(viewConfig.get.bind(null,"reference."));
        });

        it("При обращании к существующему свойству 1-го уровня возвращается это свойство", () => {
            let result = {
                "forms": {
                    "helloWorldForm": 123
                }
            };
            let value = viewConfig.get('query');
            assert.deepEqual(value,result);
        });

        it("При обращании к существующему свойству 2-го уровня возвращается это свойство", () => {
            let result = {
                "helloWorldForm": 123
            };
            let value = viewConfig.get('query.forms');
            assert.deepEqual(value,result);
        });

        it("При обращании к существующему свойству 3-го уровня возвращается это свойство", () => {
            let result = 123;
            let value = viewConfig.get('query.forms.helloWorldForm');
            assert.deepEqual(value,result);
        });


    })
});