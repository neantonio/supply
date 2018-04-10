let dataRouter = require('../../routers/dataRouter');
import {utils} from '../../utils';

// в этот обработчик пока попадают все запросы с action === customAction, дальнейший роутинг проходит по полю 'serverFunction'
export async function handler(clientData) {

    let path = clientData.path;
    //let filter = clientData.data.filter;
    let queryParams = clientData.data.queryParams;
    let serverFunction = clientData.data.serverFunction;
    let token = clientData.token;
    let objViewClient = clientData.objView;

    let object = utils.getObjectName(path);
    // формируем параметры запроса на сервер
    let queryOptions = {
        object: object,
        method: serverFunction,
        //filter: filter,
        queryParams: queryParams,
        token: token,
        objViewClient : objViewClient
    };
    let result;
    try {
        result = await dataRouter.performCustomAction(queryOptions);
    } catch (err) {
        throw("Ошибка исполнения функции " + serverFunction + " объекта " + object + ": " + err);
    }

    if (serverFunction === 'download') {
        let key = Object.keys(result.records)[0];
        result = {
            fileName : result.records[key].fields.description,
            fileExtension : result.records[key].fields.extension,
            fileContent : result.records[key].fields.file
        };
        return result;
    }

}