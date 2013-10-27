var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var userSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true
  },
  username: {
    type: String,
    index: true
  },
  email: {
    type: String,
    index: true
  },
  blurb: {
    type: String,
    index: false
  },
  location: {
    type: String,
    index: false
  },
  uploads: Array,
  purchases: Array,
  favorites: Array
});

userSchema.plugin(passportLocalMongoose);

var db_model = mongoose.model('User', userSchema);

// username
// callback(err, obj)

module.exports.find_by_name = function(username, callback){
    db_model.findOne({username: username}, callback);
}

module.exports.model = db_model