let express = require('express');
let router = express.Router();
let dataRouter = require('../routers/dataRouter');

// запрашиваем дополнительную информацию для закупочной комиссии по переданным позициям
router.post('/', async function (req, res) {
    let clientData = req.body;
    let token = clientData.token;
    let object = clientData.object;
    let method = clientData.method;
    let parameters = clientData.parameters;

    try {
        1+1;
        let responseRes = await dataRouter.execDirectAction(object, method, parameters, token);

        res.send({
            status: 'success',
            message: responseRes
        });
    } catch (err) {
        res.send({
            status: "error",
            message: err.message
        })
    }
});

router.use(function (err, req, res, next) {
    res.send({
        status: 'error',
        message: err.message
    });
});

module.exports = router;