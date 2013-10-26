// Navigation Controller
// * * * * * * * * * * 
var Model3d = require('./../models/model3d_schema');
var File = require('./../models/file_schema');

// / GET
function home(req, res){
    console.log("-----current user-------");
    console.log(req.session);
	Model3d.model.find({}).sort({views: -1}).execFind(function(err, results){
        //console.log(results);
        res.render('navigation/home', {models: results});
    });
}

/* search? GET
TODO: 
*/
function search(req, res){

}

module.exports = {
    get_home: home
}