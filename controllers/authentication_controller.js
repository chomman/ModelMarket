// Authentication Controller
// * * * * * * * * * * 

// requires the model with Passport-Local Mongoose plugged in
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('./../models/user_schema').model;

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// /login GET
function get_login(req, res) {
    //prevent people logging in again
    if(req.session.passport.user){
        res.redirect('/');
        return;
    }
    res.render('authentication/login', {passport : req.session.passport, selected: "login"});
}

// /login POST
function post_login(req, res, serr) {
    res.redirect('/');
}

// /logout GET
function logout(req, res) {
    req.logout();
    res.redirect('/');
}
module.exports = {
    get_login: get_login
    ,post_login: post_login
    ,get_logout: logout
    ,current_user: function(req) {
        return req.session.passport.user || null
    }
}