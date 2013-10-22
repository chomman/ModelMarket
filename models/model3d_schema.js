var mongoose = require('mongoose');

var File = require('./file_schema');

var modelSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true
  },
  description: {
    type: String,
    index: false
  },
  price: {
    type: Number
  },
  views: {
    type: Number,
    index: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  owners: Array,
  favorites: Array,
  upload: {
    type: mongoose.Schema.Types.ObjectId,
    index: false
  }
});

var db_model = mongoose.model('Model3d', modelSchema);

module.exports = {
  model: db_model
}
module.exports.find_by_name = function(name, callback){
  db_model.findOne({name : name}, function(err,obj) {
    if(err) callback(null ,err);
    else callback(obj);
  });
};

module.exports.find_by_id = function(id, callback){
  db_model.findOne({_id : id}, function(err,obj) {
    if(err) callback(err , null);
    else callback(null, obj);
  });
};

module.exports.create = function(hash, filelocation, callback){
  var new_model3d = new db_model(hash);
  new_model3d.save(function (err) {
    if (err) { callback(null,err); return;}
    console.log("no error saving model");
    File.create({owner: new_model3d._id}, filelocation, function(err, obj){
      if(err) { callback(null,err); return;}
      console.log("no error creating file") 
      new_model3d.upload = obj._id;
      callback(null,new_model3d);
    });
  });
};