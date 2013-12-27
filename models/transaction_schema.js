/*jslint node: true */
"use strict";
var mongoose = require('mongoose');

var transactionSchema = new mongoose.Schema({
    model_id: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    model_cost: Number,
    money_recieved: { //this refers to the money being recieved by us but not yet transfered to the creator yet
        type: Boolean,
        default: false
    },
    money_transfered: { //this refers to us having sent the creator of the model the money he is owed
        type: Boolean,
        default: false
    },
    date_recieved: {
        type: Date,
    },
    data_transfered: {
        type: Date,
    },
    purchase_username: {
        type: String,
        index: true
    },
    model_owner_username: {
        type: String,
        index: true
    }
});

var db_model = mongoose.model('Transaction', transactionSchema);

// username
// callback(err, obj)
module.exports.find_by_name = function(username, callback){
    db_model.findOne({username: username}, callback);
};

module.exports.model = db_model;
