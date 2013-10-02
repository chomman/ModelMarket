// Models Controller
// * * * * * * * * * * 
var model3d = require('./../models/model3d_schema');

// models/new GET
function get_new(req, res){
	res.render('models/new');
}

// models/new POST
function post_new(req, res){
	console.log(req.body);
	var new_model3d = new model3d.model(
		{name : req.body.name || "undefined",
		 description: req.body.descripton || "no description"
		});
	new_model3d.save(function (err) {
	  if (err) // ...
	  console.log('error saving model!');
	});
	console.log("creating and saved new model3d with id: " + new_model3d._id);
	res.send("created new model. Thanks");
}

// models/:id GET
function get_show(req, res){
	model3d.model.findOne({_id: req.params.id}, function(err,obj) { 
		console.log("model: " + obj.name);
		res.render('models/show', {name: obj.name, description: obj.description});
	});
}

// models/:id DELETE
function delete_model(req, res){
	res.send("deleting model");
}
module.exports = {
	get_new: get_new,
	post_new: post_new,
	show: get_show,
	del: delete_model
}