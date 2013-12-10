"use strict"
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
  price: Number,
  views: {
    type: Number,
    required: true,
    default: 0
  },
  creator: {
    type: String,
    index: true,
    required: true
  },
  favorites: Array,
  grid_files: Array,
  grid_display:{
    type:  mongoose.Schema.Types.ObjectId,
    index: false
  },
  public: {
      type: Boolean,
      default: false
  }
});

var db_model = mongoose.model('Model3d', modelSchema);

module.exports = {
    model: db_model
};
module.exports.find_by_name = function(name, callback){
    db_model.findOne({name : name}, function(err,obj) {
        if(err) callback(err ,null);
        else callback(err,obj);
    });
  };

module.exports.find_by_id = function(id, callback){
    db_model.findOne({_id : id}, function(err,obj) {
        if(err) callback(err , null);
        else callback(err, obj);
    });
  };

module.exports.find_by_string = (function(query, callback) {
    var tokens = query.split();
    var re = new RegExp(query, "i");
    db_model.find({name: re}, function(err, docs) {
        if(err) callback(err , null);
        else callback(err, docs);
    });
});
