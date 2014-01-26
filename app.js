/*jslint node: true */
"use strict";
var passport = require('passport');
var cel = require('connect-ensure-login');
//#express
var express = require('express');
var app = express();

//------------------------------------------

// # Setup Views
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
// ----------------------

// #Session stuff:
app.use(express.static(__dirname + '/public'));
app.use(express.cookieParser());
app.use(express.bodyParser());

app.use(express.session({secret: 'IMMABEAST'}));

app.use(passport.initialize());
app.use(passport.session());

app.configure(function(){
    //...
    app.use(function(req, res, next){
        res.locals.passport = req.session.passport;
        next();
    });
});

//--------------------------------

// # Controllers:
// This is where the controllers are defined
var models_controller = require('./controllers/models_controller');
var navigation_controller = require('./controllers/navigation_controller');
var authentication_controller = require('./controllers/authentication_controller');
var users_controller = require('./controllers/users_controller');

// #DB# :
// Set Up Data Base and pass it to all routes
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mmdb');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
    console.log("mongo open");
});

global.root_path = __dirname;
console.log(global.root_path);

app.all('*', function(request, response, next)
{
    console.log("goes through here");
    next();
});

var fs = require('fs');
var keysfile = __dirname + '/keys.json';

fs.readFile(keysfile, 'utf8', function (err, data) {
    if (err) {
        console.log('Error reading keys!: ' + err);
        return;
    }

    data = JSON.parse(data);
    global.keys = data;
});

// #Routes
app.get('/', navigation_controller.get_home);
app.get('/about', navigation_controller.get_about);
app.get('/search', navigation_controller.get_search);
app.post('/search', navigation_controller.post_search);

app.get('/models/new', cel.ensureLoggedIn('/login'), models_controller.get_new);
app.post('/models/new', cel.ensureLoggedIn('/login'), models_controller.post_new);
app.get('/models/:id', models_controller.show);
app.del('/models/:id', cel.ensureLoggedIn('/login'), models_controller.del);
app.get('/models/:id/edit', cel.ensureLoggedIn('/login'), models_controller.get_edit);
app.get('/models/:id/download', models_controller.get_downloads);
app.get('/models/:id/buy',  cel.ensureLoggedIn('/login'), models_controller.get_buy);
app.post('/models/:id/buy',  models_controller.post_buy);
app.post('/models/:id/star', cel.ensureLoggedIn('/login'), models_controller.post_star);
app.post('/models/:id/unstar', cel.ensureLoggedIn('/login'), models_controller.post_unstar);
app.get('/models/uploads/:id', models_controller.get_file);
app.get('/models/:id/display', models_controller.get_display_model);
app.post('/models/:id/submit_screenshot', models_controller.post_submit_screenshot);


app.get('/logout', authentication_controller.get_logout);
app.get('/login', authentication_controller.get_login);
app.post('/login', passport.authenticate('local', { successReturnToOrRedirect: '/beforelogin',failureRedirect: '/login' }));//, authentication_controller.post_login);
app.get('/beforelogin', authentication_controller.back);

app.get('/users/register', users_controller.get_register);
app.post('/users/register', users_controller.post_register);
app.get('/users/:username', users_controller.get_show);
app.get('/users/:username/edit', users_controller.get_edit);
app.put('/users/:username/edit', users_controller.put_edit);
app.post('/users/:username/upload_image', users_controller.post_upload_image);
app.get('/users/:username/image', users_controller.get_image);
app.del('/users/:username', cel.ensureLoggedIn('/login'), users_controller.del);
app.get('/users/:username/bank_info', cel.ensureLoggedIn('/login'), users_controller.get_bank_info);
app.post('/users/:username/bank_info', cel.ensureLoggedIn('/login'), users_controller.post_bank_info);
app.get('/users/:username/purchases', cel.ensureLoggedIn('/login'), users_controller.get_purchases);
app.get('/users/:username/payments', cel.ensureLoggedIn('/login'), users_controller.get_payments);


console.log("running on port: " + (process.env.PORT || 3000));
app.listen(process.env.PORT || 3000);
