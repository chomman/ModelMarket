// Authentication Controller
// * * * * * * * * * * 

// requires the model with Passport-Local Mongoose plugged in
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('./../models/user_schema');

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// /login GET
function get_login(req, res) {
    res.render('authentication/login', {passport : req.session.passport, selected: "login"});
}

// /login POST
function post_login(req, res) {
    res.redirect('/');
}


// /register GET
function  get_register(req, res) {
    res.render('authentication/register', { });
}

// /register POST
function post_register(req, res) {
    console.log("--------new user----------");
    console.log(req);
    console.log(req.body.username);
    console.log(req.body.password);
    console.log("--------------------------");

    User.register(new User({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
            return res.render('authentication/register', { account : account });
        }
        res.redirect('/');
    });
}

// /logout GET
function logout(req, res) {
    req.logout();
    res.redirect('/');
}
module.exports = {
    get_login: get_login
    ,post_login: post_login
    ,get_register: get_register
    ,post_register: post_register
    ,get_logout: logout
}