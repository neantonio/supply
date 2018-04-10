let express = require('express');
let path = require('path');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');

let root = require('./InterfaceAdapter/routes/root');
let login = require('./InterfaceAdapter/routes/login');
let logout = require('./InterfaceAdapter/routes/logout');
let request = require('./InterfaceAdapter/routes/request');
let getConfigInfo = require('./InterfaceAdapter/routes/getConfigInfo');
let cli = require('./InterfaceAdapter/routes/cli');

let app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({
    limit: '5mb', // максимальный размер тела запроса
}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

// ответ на кроссдоменный запрос
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
        next();
    }
});

app.use(function (req, res, next) {
    console.log('Incoming parameters: ' + JSON.stringify(req.body));
    next();
});


app.use('/', root);
app.use('/login', login);
app.use('/logout', logout);
app.use('/request', request);
app.use('/getConfigInfo', getConfigInfo);
app.use('/cli', cli);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    //res.locals.message = err.message;
    //res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    ///res.status(err.status || 500);
    console.log(err);
    res.status(500).send({
        status: 'error',
        message: err
    });
    //sendResponse(res, 'error', "Server error!");
    // return;
    //res.render('error');
});

module.exports = app;
