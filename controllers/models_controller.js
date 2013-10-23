// Models Controller
// * * * * * * * * * * 
var Model3d = require('./../models/model3d_schema');
var File = require('./../models/file_schema');

// models/new GET
function get_new(req, res){
    res.render('models/new');
}

// models/new POST
function post_new(req, res){
    console.log(req.body);
    console.log(req.files.model.path);

    var new_model3d = new Model3d.model({name : req.body.name || "undefined"
                                        ,description: req.body.description || "no description"
                                        ,price: 5.00
                                        });

    var new_file = new File.model({owner: new_model3d.id});

    /*  This shit shoud probably be done in the file_schema module */

    var obj_file_name = new_model3d.id + "_" + new_file.id + ".obj"
    var obj_file_type = "OBJ"

    new_file.location = obj_file_name;
    new_file.type = obj_file_type;

    

    File.move(req.files.model.path, obj_file_name, function(err){
        if(err)
        {
            console.log("There was an error moving the file to uploads");
            console.log(err);
        }
        else console.log("File saved!");
    });

    new_model3d.save(function (err, product, numberAffected) {
        if(err) console.log("There was an error saving the model3d to the db! \n" + err);
    });
    new_file.save(function (err, product, numberAffected) {
        if(err) console.log("There was an error saving the file to the db! \n" + err);
    });

    console.log("new model id: " + new_model3d.id);
    res.redirect("models/"+new_model3d.id);
}

// models/:id GET
function get_show(req, res){
    Model3d.find_by_id(req.params.id, function(err, model_obj){ 
        if(err) res.render('something_broke :(');
        else
        {
            console.log(model_obj);
            console.log("something: " + model_obj.price);
            model_obj.views = model_obj.views + 1; 
            var parent_id = model_obj._id;
            File.find_all_belonging_to_model_with_type(parent_id, "OBJ", function(file_obj_array, err)
            {
                console.log("yo: " + file_obj_array);
                console.log(file_obj_array);
                res.render('models/show', {name: model_obj.name, model_URL: file_obj_array[0].location, description: model_obj.description, price: model_obj.price, views: model_obj.views});
            });
            model_obj.save();
        } 
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