// Authentication Controller
// * * * * * * * * * * 

// requires the model with Passport-Local Mongoose plugged in
//var passport = require('passport-local');
//var User = require('./models/user');

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// /login GET
function login(req, res){
	Model3d.model.find({}, function(err, results){
		console.log(results);
		res.render('navigation/home', {models: results});
	});
}

/* search? GET
TODO: 
*/
function search(req, res){

}

module.exports = {
    get_login: login
}