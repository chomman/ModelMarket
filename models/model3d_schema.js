var mongoose = require('mongoose');

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
    type: Number,
    index: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  owners: Array,
  favorites: Array,
  location: {
    type: String,
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
    if(err) callback(null ,err);
    else callback(obj);
  });
};

module.exports.create = function(obj, callback){
  
};