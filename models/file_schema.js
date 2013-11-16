var mongoose = require('mongoose');
var fs = require('fs');


var fileSchema = new mongoose.Schema({
  location: {
    type: String
  },
  file_type: {
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
});

var db_model = mongoose.model('File', fileSchema);

module.exports = {
  model: db_model
}
module.exports.find_by_location = function(loc, callback){
  db_model.findOne({location : loc}, function(err, obj) {
    if(err) callback(err, obj);
    else callback(err, obj);
  });
};

module.exports.find_by_id = function(id, callback){
  db_model.findOne({_id : id}, function(err, obj) {
    if(err) callback(err, obj);
    else callback(err, obj);
  });
};

module.exports.find_all_belonging_to_model_with_type = function(model_id, type, callback){
  db_model.find({owner : model_id}, function(err, obj) {
    if(err) callback(err, obj);
    else callback(err, obj);
  });
};

/*  ------------------------------------------------------------------
    move:
    @location: location of the file we are trying to move
    @new_name: the name to give this file once we have moved it
    @callback: callback(err) that takes an error as a parameter

    ---------------------------------------------------------------- */
module.exports.move = function(location, new_name, callback){
    fs.readFile(location, function (err, data) {
        console.log("yo");
        var newPath = global.root_path + "/public/uploads/" + new_name;
        console.log(newPath);
        fs.writeFile(newPath, data, function (err) {
            callback(err)
        });
     });
}
