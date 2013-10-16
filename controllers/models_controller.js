// Models Controller
// * * * * * * * * * * 
var fs = require('fs');
var Model3d = require('./../models/model3d_schema');

// models/new GET
function get_new(req, res){
    res.render('models/new');
}

// models/new POST
function post_new(req, res){
    console.log(req.body);
    var new_model3d = new Model3d.model(
        {name : req.body.name || "undefined",
         description: req.body.description || "no description"
        });
    new_model3d.save(function (err) {
      if (err) // ...
      console.log('error saving model!');
    });
    console.log("creating and saved new model3d with id: " + new_model3d._id);
    console.log(req.files);
    fs.readFile(req.files.model.path, function (err, data) {
      if(err) console.log(err);
      var newPath = __dirname + "/../uploads/" + new_model3d._id + ".obj";
      console.log(newPath);
      fs.writeFile(newPath, data, function (err) {
        res.send("created new model. Thanks");
      });
    });

}

// models/:id GET
function get_show(req, res){
    Model3d.find_by_id(req.params.id, function(obj, err){
        if(err) res.render('something_broke :(');
        else res.render('models/show', {name: obj.name, description: obj.description});
    });
}

// models/:id DELETE
function delete_model(req, res){
    res.send("deleting model");
}

function get_buy(req, res){
    Model3d.find_by_id(req.params.id, function(obj, err){
        if(err) res.render('something_broke :(');
        else res.render('models/buy', {name: obj.name, description: obj.description, price: obj.price, id: obj._id});
    });
    //res.render('models/buy', {});
}
function post_buy(req, res){
    res.send("Thanks, for your purchase");
}

module.exports = {
    get_new: get_new,
    post_new: post_new,
    show: get_show,
    del: delete_model,
    get_buy: get_buy,
    post_buy: post_buy
}