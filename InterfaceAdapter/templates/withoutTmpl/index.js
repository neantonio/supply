let dataRouter = require('../../routers/dataRouter');
import {utils} from '../../utils';

export async function handler(clientData) {

    let path = clientData.path;
    let action = clientData.action;
    //let filter = clientData.data.filter;
    let queryParams = clientData.data.queryParams;
    let token = clientData.token;
    let objViewClient = clientData.objView;

    if (action === 'delete') {
        let object = utils.getObjectName(path);
        // формируем параметры запроса на сервер
        let queryOptions = {
            object: object,
            method: action,
            //filter: filter,
            queryParams: queryParams,
            token: token,
            objViewClient: objViewClient
        };
        try {
            let serverData = await dataRouter.deleteServerData(queryOptions);
        } catch (err) {
            throw("Ошибка при удалени записи объекта " + object + ": " + err)
        }

    }

}