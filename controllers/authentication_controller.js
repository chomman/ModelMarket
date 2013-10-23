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
function login(req, res){
	
}


module.exports = {
    get_login: login
}