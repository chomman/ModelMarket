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
  price_USD: {
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

var Item = mongoose.model('Model3d', modelSchema);

module.exports = {
  model: Item
}