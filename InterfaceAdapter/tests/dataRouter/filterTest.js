let Filter = require('../../routers/filter');
let assert = require('chai').assert;

describe("ТЕСТ класса Filter", function () {

    describe("Тест функции _feelTree", function () {

        it("1. Если relation === {} все параметры фильтра добавляются в отношение and", function () {

            let filterFields = {
                "ID": {},
                "description": {},
                "product.description": {}
            };

            let relation = {};

            let filter = new Filter();
            filter._feelTree(filterFields, relation);

            let result = {
                and: ["ID", "description", "product.description"]
            };

            assert.deepEqual(result, filter.tree);

        });

        it("2. Если передали только or и это массив, то в фильтре заполняется or", function () {

            let filterFields = {
                "ID": {},
                "description": {},
                "product.description": {}
            };

            let relation = {
                or: ["ID", "description"]
            };

            let filter = new Filter();
            filter._feelTree(filterFields, relation);

            let result = {
                or: ["ID", "description"]
            };

            assert.deepEqual(result, filter.tree);

        });

        it("3. Если передали только and и это массив, то в фильтре заполняется and", function () {

            let filterFields = {
                "ID": {},
                "description": {},
                "product.description": {}
            };

            let relation = {
                and: ["ID", "description"]
            };

            let filter = new Filter();
            filter._feelTree(filterFields, relation);

            let result = {
                and: ["ID", "description"]
            };

            assert.deepEqual(result, filter.tree);

        });

        it("4. Если передали and и or, то получаем определенную древовидную структуру", function () {

            let filterFields = {
                "ID": {},
                "description": {},
                "product.description": {},
                "maker.description": {}
            };

            let relation = {
                or: ["product.description"],
                and: ["ID", "description"]
            };

            let filter = new Filter();
            filter._feelTree(filterFields, relation);

            let result = {
                and: [
                    {
                        or: ["product.description"]
                    },
                    "ID",
                    "description"
                ]
            };

            assert.deepEqual(result, filter.tree);

        });

    });

    describe("Тест преобразования sign === 'between' функцией _substituteBetweenSign", function () {

        it("1. Если у поля фильтра sign === 'between' и поле в relation.and", function () {

            let filterFields = {
                "description1": {
                    value: '555',
                    sign: 'consist'
                },
                "date": {
                    value: [1, 2],
                    sign: 'between'
                },
                "description2": {
                    value: '123',
                    sign: 'consist'
                }
            };

            let relation = {
                or: ["description1"],
                and: ["description2", "date"]
            };

            let filter = new Filter();
            filter._substituteBetweenSign(filterFields, relation);

            let resultFields = {
                "description1": {"value": "555", "sign": "consist"},
                "description2": {"value": "123", "sign": "consist"},
                "date-greater": {"value": 1, "sign": "greaterEqual"},
                "date-less": {"value": 2, "sign": "lessEqual"}
            };

            let resultRelation = {
                or: ["description1"],
                and: ["description2", "date-greater", "date-less"]
            };

            assert.deepEqual(resultFields, filterFields);
            assert.deepEqual(resultRelation, relation);

        });

        it("2. Если у поля фильтра sign === 'between' и поле в relation.or", function () {

            let filterFields = {
                "description1": {
                    value: '555',
                    sign: 'consist'
                },
                "date": {
                    value: [1, 2],
                    sign: 'between'
                },
                "description2": {
                    value: '123',
                    sign: 'consist'
                }
            };

            let relation = {
                or: ["description1", "date"],
                and: ["description2"]
            };

            let filter = new Filter();
            filter._substituteBetweenSign(filterFields, relation);

            let resultFields = {
                "description1": {"value": "555", "sign": "consist"},
                "description2": {"value": "123", "sign": "consist"},
                "date-greater": {"value": 1, "sign": "greaterEqual"},
                "date-less": {"value": 2, "sign": "lessEqual"}
            };

            let resultRelation = {
                or: ["description1"],
                and: ["description2", "date-greater", "date-less"]
            };

            assert.deepEqual(resultFields, filterFields);
            assert.deepEqual(resultRelation, relation);

        });

        it("3. Если у поля фильтра sign === 'between' и поля нет в relation", function () {

            let filterFields = {
                "description1": {
                    value: '555',
                    sign: 'consist'
                },
                "date": {
                    value: [1, 2],
                    sign: 'between'
                },
                "description2": {
                    value: '123',
                    sign: 'consist'
                }
            };

            let relation = {
                or: ["description1"],
                and: ["description2"]
            };

            let filter = new Filter();
            filter._substituteBetweenSign(filterFields, relation);

            let resultFields = {
                "description1": {"value": "555", "sign": "consist"},
                "description2": {"value": "123", "sign": "consist"},
                "date-greater": {"value": 1, "sign": "greaterEqual"},
                "date-less": {"value": 2, "sign": "lessEqual"}
            };

            let resultRelation = {
                or: ["description1"],
                and: ["description2", "date-greater", "date-less"]
            };

            assert.deepEqual(resultFields, filterFields);
            assert.deepEqual(resultRelation, relation);

        });

        it("4. Если у поля фильтра sign === 'between' в value не массив, то такое поле удаляется", function () {

            let filterFields = {
                "description1": {
                    value: '555',
                    sign: 'consist'
                },
                "date": {
                    value: new Date,
                    sign: 'between'
                },
                "description2": {
                    value: '123',
                    sign: 'consist'
                }
            };

            let relation = {
                or: ["description1"],
                and: ["description2"]
            };

            let filter = new Filter();
            filter._substituteBetweenSign(filterFields, relation);

            let resultFields = {
                "description1": {"value": "555", "sign": "consist"},
                "description2": {"value": "123", "sign": "consist"}
            };

            let resultRelation = {
                or: ["description1"],
                and: ["description2"]
            };

            assert.deepEqual(resultFields, filterFields);
            assert.deepEqual(resultRelation, relation);

        });

    });

    describe("Тест функции _feelPagination", function () {

        it("1. Если параметр pagination === {} тогда this.pagination === {}", function () {

            let pagination = {};

            let filter = new Filter();
            filter._feelPagination(pagination);

            let result = {};

            assert.deepEqual(filter.pagination, result);

        });

        it("2. Если pagination содержит свойства кроме limit и offset, то они не попадут в this.pagination", function () {

            let pagination = {
                offset: 0,
                limit: 10,
                spyField: 'I wanna hack you!'
            };

            let filter = new Filter();
            filter._feelPagination(pagination);

            let result = {
                offset: 0,
                limit: 10
            };

            assert.deepEqual(filter.pagination, result);

        });

    });

    describe("Тест функции _feelOrderBy", function () {

        it("Если передали не массив то this.orderBy === []", function () {

            let orderBy = {};

            let filter = new Filter();
            filter._feelOrderBy(orderBy);

            let result = [];

            assert.deepEqual(filter.orderBy, result);

        });

    });

});

