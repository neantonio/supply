'use strict';

let assert = require('chai').assert;
import {utils} from '../utils';

describe("ТЕСТ класса utils", function () {
    describe("Тест функции getPrimaryKeyField", function () {
        it("1. В мета-информации действительно есть информация о первичном ключе", function () {
            let fields = {
                "ID": {
                    "type": [
                        "uuid",
                        "string",
                        "object"
                    ],
                    "isPrimary": true,
                    "readonly": true
                },
                "description": {
                    "type": [
                        "string",
                        "object"
                    ],
                    "required": true,
                    "title": "Описание"
                },
                "date": {
                    "type": [
                        "date",
                        "object"
                    ],
                    "required": false,
                    "title": "Дата создания"
                }
            }

            let PK = utils.getPrimaryKeyField(fields);
            assert.equal(PK, 'ID');

        });
        it("2. В мета-информации нет информации о первичном ключе", function () {
            let fields = {
                "ID": {
                    "type": [
                        "uuid",
                        "string",
                        "object"
                    ],
                    "readonly": true
                },
                "description": {
                    "type": [
                        "string",
                        "object"
                    ],
                    "required": true,
                    "title": "Описание"
                },
                "date": {
                    "type": [
                        "date",
                        "object"
                    ],
                    "required": false,
                    "title": "Дата создания"
                }
            }
            let PK = utils.getPrimaryKeyField(fields);
            assert.equal(PK, null);
        })
    });
});
