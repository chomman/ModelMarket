var mongoose = require('mongoose');

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

var Item = mongoose.model('User', userSchema);

module.exports = {
  model: Item
}