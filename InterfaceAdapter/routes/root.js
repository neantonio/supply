let tmplRouter = require('../routers/tmplRouter');
let express = require('express');
let router = express.Router();

/* POST home page. */
router.post('/', function(req, res, next) {

    let clientData = req.body;

    //Получим handler, который должен обрабатывать текущий запрос
    try {
        let handler = tmplRouter.getHandler(clientData);
        // запускаем обработчик формирования формы, в процессе идет обращение к серверу поэтому обрабатываем в then
        let resultPromise = handler(clientData);
        resultPromise.then((result) => {
            res.send({
                status : 'success',
                message : result
            });
        }, (err) => {
            console.log(err.stack);
            res.send({
                status : 'error',
                message : err
            });
        });
    } catch (err) {
        next(err);
    }

});

module.exports = router;