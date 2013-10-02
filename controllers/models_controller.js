// Models Controller
// * * * * * * * * * * 

// models/new GET
function get_new(req, res){
	res.send("render form for new model3d");
}

// models/new POST
function post_new(req, res){
	console.log("creating new model?")
	res.send("render form for new model3d");
}

// models/:id GET
function get_show(req, res){
	res.send("render model id:" + req.params.id);
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