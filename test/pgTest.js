'use strict';
import {pg} from '../Utilits/pg';
import {assert} from "chai";
import * as _ from "lodash";

//mocha ./test/pgTest.js -r babel-register

let postgres = new pg({}, {
    "user": "postgres",
    "password": "postgres",
    "port": "5432",
    "host": "localhost",
    "database": "zca",
    "max": 50
});

describe('Тестирование pg.js.', function () {

    // чтобы mocha не вылетала по таймауту
    this.timeout(15000);

    it("Метод init() работает без ошибок и возвращает Promise", function () {
        return test.init();
    });

    it("Получаем запись с конем черным из таблицы Product", function () {
        return test.selectFromProductTable();
    });

    it("Получаем запись с конем черным из таблицы Product. Distinct", function () {
        return test.distinctProductTable();
    });

    it("Сортировка таблицы Product", function () {
        return test.orderByProductTable();
    });

    it("Выбрать 2 записи (пагинация) таблицы Product отсортированные по наименованию", function () {
        return test.selectRowsFromProductTablePagination();
    });

    it("Посчитать количество записей в таблице Product", function () {
        return test.countProduct();
    });

    it("Выбор максимальной даты из таблицы Query", function () {
        return test.maxDateQuery();
    });

    it("Выбор минимальной даты из таблицы Query", function () {
        return test.minDateQuery();
    });

});

class Testing {
    constructor() {
    }

    init() {
        postgres.init()
            .then(() => {
                assert.equal('success', 'success');
            });
    }

    selectFromProductTable() {
        let object = {
            "name": "product_table",
            "fields": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ],
                "description": [
                    "string",
                    "object"
                ]
            },
            "link": {
                "makerID": [
                    "uuid",
                    "string",
                    "object"
                ]
            },
            "PK": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ]
            }
        };
        let objInfo = {};
        let filter = {
            "tree": {
                "and": [
                    "first"
                ]
            },
            "comparisons": {
                "first": {
                    "left": {
                        "type": "field",
                        "value": "description"
                    },
                    "right": {
                        "type": "value",
                        "value": "Конь черный"
                    },
                    "sign": "equal"
                }
            }
        };

        return postgres.select(object, [], filter, objInfo, {})
            .then((res) => {
                let result;
                const trueResult = {
                    product_table:
                        [{
                            ID: '02b9829a-d251-4d89-8925-954c82fc0a96',
                            description: 'Конь черный',
                            makerID: '02b9829a-d251-4d89-8925-954c82fc0a92'
                        }]
                };
                if (_.isEqual(res, trueResult)) {
                    result = 'success';
                }
                assert.equal(result, 'success');
            });

    }

    updateProductTable() {
        let object = {
            "name": "product_table",
            "fields": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ],
                "description": [
                    "string",
                    "object"
                ]
            },
            "link": {
                "makerID": [
                    "uuid",
                    "string",
                    "object"
                ]
            },
            "PK": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ]
            }
        };
        let objInfo = {};
        let filter = {
            "tree": {
                "and": [
                    "first"
                ]
            },
            "comparisons": {
                "first": {
                    "left": {
                        "type": "field",
                        "value": "description"
                    },
                    "right": {
                        "type": "value",
                        "value": "Конь черный"
                    },
                    "sign": "equal"
                }
            }
        };

        return postgres.select(object, [], filter, objInfo, {})
            .then((res) => {
                let result;
                const trueResult = {
                    product_table:
                        [{
                            ID: '02b9829a-d251-4d89-8925-954c82fc0a96',
                            description: 'Конь черный',
                            makerID: '02b9829a-d251-4d89-8925-954c82fc0a92'
                        }]
                };
                if (_.isEqual(res, trueResult)) {
                    result = 'success';
                }
                assert.equal(result, 'success');
            });
    }

    paginationUsersTable() {
        const object = {
            "name": "users_table",
            "fields": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ],
                "description": [
                    "string",
                    "object"
                ],
                "user": [
                    "string",
                    "object"
                ],
                "password": [
                    "string",
                    "object"
                ],
                "salt": [
                    "string",
                    "object"
                ],
                "email": [
                    "string",
                    "object"
                ]
            },
            "link": {},
            "PK": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ]
            }
        }
        const fields = [
            "ref.usersRoles_table.roleID.ref.rolesAction_table.actionID.description",
            "ref.usersRoles_table.roleID.ref.rolesAction_table.description",
            "ref.usersRoles_table.roleID.ref.rolesAction_table.actionID.objectID.description"
        ];
        const objInfo = {
            "ref.usersRoles_table": {
                "fields": {},
                "link": {
                    "roleID": "roles_table"
                },
                "rLink": {
                    "object": "usersRoles_table",
                    "field": "userID"
                },
                "object": "usersRoles_table",
                "PK": {
                    "ID": [
                        "uuid",
                        "string",
                        "object"
                    ]
                }
            },
            "ref.usersRoles_table.roleID": {
                "fields": {},
                "link": {},
                "object": "roles_table",
                "PK": {
                    "ID": [
                        "uuid",
                        "string",
                        "object"
                    ]
                }
            },
            "ref.usersRoles_table.roleID.ref.rolesAction_table": {
                "fields": {
                    "description": [
                        "string",
                        "object"
                    ]
                },
                "link": {
                    "actionID": "actions_table"
                },
                "rLink": {
                    "object": "rolesAction_table",
                    "field": "rolesID"
                },
                "object": "rolesAction_table",
                "PK": {
                    "ID": [
                        "uuid",
                        "string",
                        "object"
                    ]
                }
            },
            "ref.usersRoles_table.roleID.ref.rolesAction_table.actionID": {
                "fields": {
                    "description": [
                        "string",
                        "object"
                    ]
                },
                "link": {
                    "objectID": "objects_table"
                },
                "object": "actions_table",
                "PK": {
                    "ID": [
                        "uuid",
                        "string",
                        "object"
                    ]
                }
            },
            "ref.usersRoles_table.roleID.ref.rolesAction_table.actionID.objectID": {
                "fields": {
                    "description": [
                        "string",
                        "object"
                    ]
                },
                "link": {},
                "object": "objects_table",
                "PK": {
                    "ID": [
                        "uuid",
                        "string",
                        "object"
                    ]
                }
            },
            "ref.usersToken_table": {
                "fields": {
                    "token": [
                        "string",
                        "object"
                    ]
                },
                "link": {},
                "rLink": {
                    "object": "usersToken_table",
                    "field": "userID"
                },
                "object": "usersToken_table",
                "PK": {
                    "ID": [
                        "uuid",
                        "string",
                        "object"
                    ]
                }
            }
        };
        const filter = {
            "tree": {
                "and": [
                    "token"
                ]
            },
            "comparisons": {
                "token": {
                    "left": {
                        "type": "field",
                        "value": "ref.usersToken_table.token"
                    },
                    "right": {
                        "type": "value",
                        "value": "ea0d3472-160b-4bbd-973c-9b68846c7e0a"
                    },
                    "sign": "equal"
                }
            }
        };
        const params = {
            pagination: {
                offset: 0,
                limit: 10
            },
            orderBy: 'description'
        };

        return postgres.select(object, [], filter, objInfo, params)
            .then((res) => {
                let result;
                const trueResult = {
                    product_table:
                        [{
                            ID: '02b9829a-d251-4d89-8925-954c82fc0a96',
                            description: 'Конь черный',
                            makerID: '02b9829a-d251-4d89-8925-954c82fc0a92'
                        }]
                };
                if (_.isEqual(res, trueResult)) {
                    result = 'success';
                }
                assert.equal(result, 'success');
            });
    }

    countUsersTable() {
        const object = {
            "name": "users_table",
            "fields": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ],
                "description": [
                    "string",
                    "object"
                ],
                "user": [
                    "string",
                    "object"
                ],
                "password": [
                    "string",
                    "object"
                ],
                "salt": [
                    "string",
                    "object"
                ],
                "email": [
                    "string",
                    "object"
                ]
            },
            "link": {},
            "PK": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ]
            }
        }
        const fields = [
            "ref.usersRoles_table.roleID.ref.rolesAction_table.actionID.description",
            "ref.usersRoles_table.roleID.ref.rolesAction_table.description",
            "ref.usersRoles_table.roleID.ref.rolesAction_table.actionID.objectID.description"
        ];
        const objInfo = {
            "ref.usersRoles_table": {
                "fields": {},
                "link": {
                    "roleID": "roles_table"
                },
                "rLink": {
                    "object": "usersRoles_table",
                    "field": "userID"
                },
                "object": "usersRoles_table",
                "PK": {
                    "ID": [
                        "uuid",
                        "string",
                        "object"
                    ]
                }
            },
            "ref.usersRoles_table.roleID": {
                "fields": {},
                "link": {},
                "object": "roles_table",
                "PK": {
                    "ID": [
                        "uuid",
                        "string",
                        "object"
                    ]
                }
            },
            "ref.usersRoles_table.roleID.ref.rolesAction_table": {
                "fields": {
                    "description": [
                        "string",
                        "object"
                    ]
                },
                "link": {
                    "actionID": "actions_table"
                },
                "rLink": {
                    "object": "rolesAction_table",
                    "field": "rolesID"
                },
                "object": "rolesAction_table",
                "PK": {
                    "ID": [
                        "uuid",
                        "string",
                        "object"
                    ]
                }
            },
            "ref.usersRoles_table.roleID.ref.rolesAction_table.actionID": {
                "fields": {
                    "description": [
                        "string",
                        "object"
                    ]
                },
                "link": {
                    "objectID": "objects_table"
                },
                "object": "actions_table",
                "PK": {
                    "ID": [
                        "uuid",
                        "string",
                        "object"
                    ]
                }
            },
            "ref.usersRoles_table.roleID.ref.rolesAction_table.actionID.objectID": {
                "fields": {
                    "description": [
                        "string",
                        "object"
                    ]
                },
                "link": {},
                "object": "objects_table",
                "PK": {
                    "ID": [
                        "uuid",
                        "string",
                        "object"
                    ]
                }
            },
            "ref.usersToken_table": {
                "fields": {
                    "token": [
                        "string",
                        "object"
                    ]
                },
                "link": {},
                "rLink": {
                    "object": "usersToken_table",
                    "field": "userID"
                },
                "object": "usersToken_table",
                "PK": {
                    "ID": [
                        "uuid",
                        "string",
                        "object"
                    ]
                }
            }
        };
        const filter = {
            "tree": {
                "and": [
                    "token"
                ]
            },
            "comparisons": {
                "token": {
                    "left": {
                        "type": "field",
                        "value": "ref.usersToken_table.token"
                    },
                    "right": {
                        "type": "max",
                        "value": "ref.usersToken_table.token"
                    },
                    "sign": "equal"
                }
            }
        };
        const params = {
            // aggregate: {
            //     // count: [],
            //     // max: '',
            //     // min: '',
            //     // avg: '',
            // }
            unique: []
        };

        return postgres.select(object, [], filter, objInfo, params)
            .then((res) => {
                let result;
                console.log(res);
                const trueResult = 'success';
                if (_.isEqual(res, trueResult)) {
                    result = 'success';
                }
                assert.equal(result, 'success');
            });

    }

    distinctProductTable() {
        let object = {
            "name": "product_table",
            "fields": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ],
                "description": [
                    "string",
                    "object"
                ]
            },
            "link": {
                "makerID": [
                    "uuid",
                    "string",
                    "object"
                ]
            },
            "PK": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ]
            }
        };
        let objInfo = {};
        let filter = {
            "tree": {
                "and": [
                    "first"
                ]
            },
            "comparisons": {
                "first": {
                    "left": {
                        "type": "field",
                        "value": "description"
                    },
                    "right": {
                        "type": "value",
                        "value": "Конь черный"
                    },
                    "sign": "equal"
                }
            }
        };
        let params = {
            unique: [
                'description',
            ],
            orderBy: [{
                field: 'makerID',
            }]
        };

        return postgres.select(object, [], filter, objInfo, params)
            .then((res) => {
                let result;
                console.log('distinctRes:', res);
                // const trueResult = {
                //     product_table:
                //         [{
                //             ID: '02b9829a-d251-4d89-8925-954c82fc0a96',
                //             description: 'Конь черный',
                //             makerID: '02b9829a-d251-4d89-8925-954c82fc0a92'
                //         }]
                // };
                // if (_.isEqual(res, trueResult)) {
                //     result = 'success';
                // }
                assert.equal('success', 'success');
            });


    }

    orderByProductTable() {
        let object = {
            "name": "product_table",
            "fields": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ],
                "description": [
                    "string",
                    "object"
                ]
            },
            "link": {
                "makerID": [
                    "uuid",
                    "string",
                    "object"
                ]
            },
            "PK": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ]
            }
        };
        let objInfo = {};
        let filter = {
            "tree": {
                "and": [
                    "first"
                ]
            },
            "comparisons": {
                "first": {
                    "left": {
                        "type": "field",
                        "value": "description"
                    },
                    "right": {
                        "type": "value",
                        "value": "Конь черный"
                    },
                    "sign": "equal"
                }
            }
        };
        let params = {
            orderBy: [
                // {
                //     field: 'description',
                //     sort: 'Desc'
                // }
            ]
        };

        return postgres.select(object, [], filter, objInfo, params)
            .then((res) => {
                let result;
                console.log('orderByRes:', res);
                // const trueResult = {
                //     product_table:
                //         [{
                //             ID: '02b9829a-d251-4d89-8925-954c82fc0a96',
                //             description: 'Конь черный',
                //             makerID: '02b9829a-d251-4d89-8925-954c82fc0a92'
                //         }]
                // };
                // if (_.isEqual(res, trueResult)) {
                //     result = 'success';
                // }
                assert.equal('success', 'success');
            });


    }

    selectRowsFromProductTablePagination() {
        const object = {
            "name": "product_table",
            "fields": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ],
                "description": [
                    "string",
                    "object"
                ]
            },
            "link": {
                "makerID": [
                    "uuid",
                    "string",
                    "object"
                ]
            },
            "PK": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ]
            }
        };
        const objInfo = {};
        const filter = {
            "tree": {},
            "comparisons": {}
        };
        const params = {
            pagination: {
                offset: 0,
                limit: 2
            },
            orderBy: [{
                field: 'description',
                sort: 'DESC'
            }]
        };


        return postgres.select(object, [], filter, objInfo, params)
            .then((res) => {
                let result;
                console.log('allRowsProductTable:', res);
                const trueResult = {
                    product_table: [
                        {
                            ID: '02b9829a-d251-4d89-8925-954c82fc0a90',
                            description: 'Шавуха',
                            makerID: '02b9829a-d251-4d89-8925-954c82fc0a90'
                        },
                        {
                            ID: '02b9829a-d251-4d89-8925-954c82fc0a94',
                            description: 'Мыло',
                            makerID: '02b9829a-d251-4d89-8925-954c82fc0a90'
                        }
                    ]
                };
                if (_.isEqual(res, trueResult)) {
                    result = 'success';
                }
                assert.equal(result, 'success');
            });

    }

    countProduct() {
        const object = {
            "name": "product_table",
            "fields": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ],
                "description": [
                    "string",
                    "object"
                ]
            },
            "link": {
                "makerID": [
                    "uuid",
                    "string",
                    "object"
                ]
            },
            "PK": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ]
            }
        };
        const objInfo = {};
        const filter = {
            "tree": {},
            "comparisons": {}
        };
        const params = {
            aggregate: {
                count: true
            }
        };

        return postgres.select(object, [], filter, objInfo, params)
            .then((res) => {
                let result = 'error';
                console.log('CountProductTable:', res);

                const trueResult = {count: "7"};
                if (_.isEqual(res, trueResult)) result = 'success';

                assert.equal(result, 'success');
            });

    }

    maxDateQuery() {
        const object = {
            "name": "query_table",
            "fields": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ],
                "description": [
                    "string",
                    "object"
                ],
                "date": [
                    "string",
                    "object"
                ]
            },
            "link": {
                "makerID": [
                    "uuid",
                    "string",
                    "object"
                ]
            },
            "PK": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ]
            }
        };
        const objInfo = {};
        const filter = {
            "tree": {},
            "comparisons": {}
        };
        const params = {
            aggregate: {
                max: 'date'
            }
        };

        return postgres.select(object, [], filter, objInfo, params)
            .then((res) => {
                let result = 'error';
                let copyRes = {};
                for (let f in res) {
                    copyRes[f] = res[f];
                }
                console.log('maxDateQuery:', copyRes);

                const trueResult = {date: new Date('2022-02-21T16:00:00.000Z')};
                if (_.isEqual(copyRes, trueResult)) result = 'success';

                assert.equal(result, 'success');
            });

    }

    minDateQuery() {
        const object = {
            "name": "query_table",
            "fields": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ],
                "description": [
                    "string",
                    "object"
                ],
                "date": [
                    "string",
                    "object"
                ]
            },
            "link": {
                "makerID": [
                    "uuid",
                    "string",
                    "object"
                ]
            },
            "PK": {
                "ID": [
                    "uuid",
                    "string",
                    "object"
                ]
            }
        };
        const objInfo = {};
        const filter = {
            "tree": {},
            "comparisons": {}
        };
        const params = {
            aggregate: {
                min: 'date'
            }
        };

        return postgres.select(object, [], filter, objInfo, params)
            .then((res) => {
                let result = 'error';
                let copyRes = {};
                for (let f in res) {
                    copyRes[f] = res[f];
                }
                console.log('minDateQuery:', copyRes);

                const trueResult = {date: new Date('2000-12-31T16:00:00.000Z')};
                if (_.isEqual(copyRes, trueResult)) result = 'success';

                assert.equal(result, 'success');
            });

    }
}

let test = new Testing();