import {objectView} from './objectView';
import {ViewController} from './view/viewController';

let objView = new objectView("supplyWithoutRoles");
let viewController = new ViewController(objView);

// console.log('before init');
//
// objView.init().then(() => {
//     console.log('before query');
//     let start = new Date();
//     objView.query('supply.product', 'getInterface').then(() => {
//         console.log('getInterface was performed in ' + (new Date() - start));
//     });
//     console.log('after query');
// });
//
// console.log('after init');

objView.init().then(() => {
    let someView = viewController.query('getForm', {
        object: 'product',
        formType: 'list'
    });
});

