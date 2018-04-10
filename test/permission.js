import {Permissions} from '../permissions';

let permissions = new Permissions("supplyWithRoles");

// permissions.init()
//     .then(async (res) => {
//         let result = await permissions.login('admin', 'azaa');
//         console.log(result);
//     })
//     .catch(err => console.log(err));

permissions.init()
    .then(async (res) => {
        const intfc = await permissions.getInterface();
        // const q = await permissions.query('role.users', "get", {}, '');
        // const token = await permissions.login('testUser', 'password');
        const token = await permissions.login('admin', 'root');
        const result = await permissions.getInterface(token);
        const q = await permissions.query('role.users', "get", {}, token);
        console.log(result);
    })
    .catch(err => {
        console.log(err);
    });

// permissions.init()
//     .then(async (res) => {
//         // let interface = await permissions.getInterface();
//         let token = await permissions.login('admin', 'root');
//         let result = await permissions.getInterface(token);
//         //делаем query к необходимым объектам
//
//         console.log('result:', result);
//     })
//     .catch(err => console.log('error:', err));