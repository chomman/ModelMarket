// Navigation Controller
// * * * * * * * * * * 
var Model3d = require('./../models/model3d_schema');
var File = require('./../models/file_schema');

// /home GET
function home(req, res){
	Model3d.model.find({}, function(err, results){
		console.log(results);
		res.render('navigation/home', {models: results});
	});
}

module.exports = {
    get_home: home
}