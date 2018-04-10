let express = require('express');
let router = express.Router();

/* POST home page. */
router.post('/', async function (req, res, next) {

    let clientData = req.body;
    let token = clientData.token;

    try {
        let configInfo = await objView.getInterface(token);
        if (configInfo) {
            res.send({
                status: "success",
                message: configInfo
            });
        } else {
            console.log(err);
            res.send({
                status: "error",
                message: 'Error!'
            });
        }
    } catch (err) {
        console.log(err);
        res.status(401).send({
            status: "error",
            message: 'Login error!'
        });
    }
});

module.exports = router;