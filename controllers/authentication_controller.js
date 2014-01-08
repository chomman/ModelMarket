/*jslint node: true */
"use strict";
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
    console.log("setting back url");
    var backURL = req.header('Referer') || '/';
    //prevent people logging in again
    if(req.session.passport.user){
        res.redirect(backURL);
        return;
    }
    res.render('authentication/login', {passport : req.session.passport, selected: "login"});
    req.session.return_to = backURL; //inject previous page into the user session
}

// /login POST
function post_login(req, res, serr) {
    /*jshint unused: vars */
    //res.redirect(req.session.backURL);
    console.log("post_login, what?");
}

// /logout GET
function logout(req, res) {
    req.logout();
    res.redirect('back');
}

module.exports = {
    get_login: get_login,
    post_login: post_login, 
    get_logout: logout,
    current_user: function(req) {
        return req.session.passport.user || null;
    },
    back: function(req, res){
        console.log("going back!");
        res.redirect(req.session.return_to || "/");
    }
};
