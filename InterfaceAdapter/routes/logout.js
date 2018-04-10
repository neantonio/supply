let express = require('express');
let router = express.Router();

/* POST home page. */
router.post('/', async function (req, res, next) {
    let clientData = req.body;
    let token = clientData.token;
    try {
        await objView.logout(token);
        res.send({
            status: "success",
            message: "success"
        });
    } catch (err) {
        res.send({
            status: "error",
            message: "Logout error!"
        });
    }
});

module.exports = router;