// Navigation Controller
// * * * * * * * * * * 
var Model3d = require('./../models/model3d_schema');
var File = require('./../models/file_schema');

// / GET
function home(req, res){
    console.log("-----current user-------");
    console.log(req.session);
	Model3d.model.find({}).sort({views: -1}).exec(function(err, results){
        //console.log(results);
        res.render('navigation/home', {models: results, selected: "home"});
    });
}

/* search? GET
TODO: 
*/
function search(req, res){
    
}

function about(req, res){
    res.render('about', {selected: "about"});
}

module.exports = {
    get_home: home,
    get_about: about
}