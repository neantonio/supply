let express = require('express');
let router = express.Router();

/* POST home page. */
router.post('/', async function (req, res, next) {

    let clientData = req.body;
    let user = clientData.user;
    let password = clientData.pswd;
    let loginAnswer;
    try {
        loginAnswer = await objView.login(user, password);
        if (loginAnswer.token) {
            res.send({
                status: "success",
                message: {
                    token: loginAnswer.token,
                    userName: loginAnswer.description
                }
            });
        } else {
            res.status(401).send({
                status: "error",
                message: 'Login error!'
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