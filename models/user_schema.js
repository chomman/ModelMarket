/*jslint node: true */
"use strict";
var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        index: true
    },
    lastname: {
        type: String,
        index: true
    },
    username: {
        type: String,
        index: true
    },
    recipientid: {
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
    imageid: mongoose.Schema.Types.ObjectId
});

userSchema.plugin(passportLocalMongoose);

var db_model = mongoose.model('User', userSchema);

// username
// callback(err, obj)
module.exports.find_by_name = function(username, callback){
    db_model.findOne({username: username}, callback);
};

function create_transfer(user_obj, amount) {
    var recipient = stripe.recipients.retrieve(user_obj.recipientid, function(err, recipient){
        if(err){
            console.log(err);
        }else{
            stripe.transfers.create({
                    amount: amount,
                    currency: "usd",
                    /*jshint sub: true */
                    recipient: recipient["id"],
                    description: "Transfer for test@example.com"
                }, 
                function(err, transfer) {
                    if(err){
                        console.log(err);
                    }else{
                        console.log(transfer);
                    }
                });
        }
    });
}

function transfer_money_to_creator(err, user_obj, amount) {
    if(err){
        console.log(err);
    }
    else{
        if(!user_obj.recipientid){
            console.log("recipient hasnt yet setup their banking information. We should store this transaction and pay them in the future.");
        }
        else {
            create_transfer(user_obj, amount);
        }
    }
}


function update_payments(username) {
    console.error("upadte payments in users model not implemented!");
    //first check if the user has enough money to get cashed out. Make minimum $30 for now?
    //check if the user has setup his bankind creditials
    // ! notify user that he has money waiting but hasnt been payed via email
    //  create a stripe transfer to move money from our account to the users 
    // log this transaction somehow and also email them to tell them they have been payed
}

module.exports.model = db_model;
module.exports.resolve_transfers_for_username = update_payments;
