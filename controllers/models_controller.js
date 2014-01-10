/*jslint node: true */
"use strict";
// Models Controller
// * * * * * * * * * * 
var Model3d = require('./../models/model3d_schema'); 
var File = require('./../models/file_schema'); 
var User = require('./../models/user_schema'); 
var Auth = require('./authentication_controller');
var Transaction = require('./../models/transaction_schema');

var Grid = require("gridfs-stream");
var mongoose = require('mongoose');
Grid.mongo = mongoose.mongo;

var conn = mongoose.createConnection('mongodb://localhost/mmdb');

conn.on('error', console.error.bind(console, 'connection error:'));

var stripe = require("stripe")(
  "sk_test_SBwGeHO10EJ0xTnmImA0W3uC"
);

var async = require('async');
var q = require('q');

// models/new GET
function get_new(req, res){
    if(Auth.current_user(req) !== null) {
        res.render('models/new', {selected: "upload"});
    }else {
        res.redirect('/login');
    }
}


// models/new POST
function post_new(req, res){
    console.log(req.body);
    console.log(req.files.model.path);
    console.log(Auth.current_user(req));

    var new_model3d = new Model3d.model({name : req.body.name || "undefined",
                                        description: req.body.description || "no description",
                                        price: parseFloat(req.body.price) || 0.0,
                                        creator: Auth.current_user(req)
                                        });
    console.log("price : $" + new_model3d.price + " " + parseFloat(req.body.price));
    console.log("user: " + Auth.current_user(req));
    /*  This shit should probably be done in the file_schema module */

    /*q.ncall(File.put_file_into_database, fs, 'test.txt')
    .then(function(gridfs_id){
            new_model3d.grid_files.push(gridfs_id);
            new_model3d.grid_display = gridfs_id;
            return new_model3d;
            new_model3d.save(function(err){
                res.redirect("/");
            });
    });*/

    File.put_file_into_database(req.files.model.path, function(err, gridfs_id){
        if(err)
        {
            console.log("There was an error moving the file to the database");
            console.log(err);
            res.redirect("/");
        }
        else
        {
            new_model3d.grid_files.push(gridfs_id);
            new_model3d.grid_display = gridfs_id;
            new_model3d.save(function(err) {
                if (err) {
                    console.log(err);
                }
                res.redirect("/");
            });
        } 
    });

}

// models/:id GET
function get_show(req, res){
    Model3d.find_by_id(req.params.id, function(err, model_obj){ 
        if(err) {
            res.status(501).send('something_broke :(');
        }
        else
        {
            console.log(model_obj);
            model_obj.views = model_obj.views + 1; 
            var should_show_edit = (Auth.current_user(req) === model_obj.creator);
            var starred = model_obj.favorites.indexOf(Auth.current_user(req)) !== -1;
            var logged_in = Auth.current_user(req) !== null;

            res.render('models/show', {model: model_obj,
                                       model_URL: model_obj.grid_display,
                                       description: model_obj.description,
                                       show_edit: should_show_edit,
                                       starred: starred,
                                       logged_in: logged_in,
                                       keys: global.keys});
            //save the model becasue we updated how many views it had
            model_obj.save(function(err) {
                console.log(err);
            });
        } 
    });
}

// models/:id/edit GET
function get_model_edit(req, res){
    console.log("current user: " + Auth.current_user(req));
    if(!Auth.current_user(req)){
        res.redirect("/login");
        return;
    }
    Model3d.find_by_id(req.params.id, function(err, model_obj){ 
        if(err){
            console.log(err);
            res.status(500).send('something_broke :(');
            return;
        }
        if(Auth.current_user(req) === model_obj.creator){
            res.render("models/edit", {model: model_obj, model_URL:  model_obj.grid_display});
            return;
        }else{
            res.status(401).send('You are unauthorized to modify this model');
        }
    });
}

// models/:id DELETE
function delete_model(req, res){
    Model3d.find_by_id(req.params.id, function(err, model_obj){
        console.log(model_obj);
        for(var i =0; i < model_obj.grid_files.length; i ++){
            var gridfs_id = model_obj.grid_files[i];
            File.delete_file(gridfs_id);
        }
        
        User.find_by_name(model_obj.creator, function(error, user){
            if(error){
                console.log("was an error reading the model: " + error);
            }
            else{
                console.log("found the user!");
                var index = user.uploads.indexOf(model_obj._id);
                if(index !== -1){
                    user.uploads.splice(index, 1); 
                }
                user.save();
                model_obj.remove();
                res.send("done");
            }
        });
    });
}

// models/:id/star
function post_star(req, res){
    toggle_star(req, res, true);
}
// models/:id/unstar
function post_unstar(req, res){
    toggle_star(req, res, false);
}

// function toggle_star
//@param req: the http reqest
//@param res: the http respose
//@param increase: (bool) to increase or decrease the star cound for this model
function toggle_star(req, res, increase){
    //star button should not even apear if user isnt logged in
    var current_username = Auth.current_user(req);
    if(!current_username){
        res.status(403).send("hacking?");
        return;
    }
    async.waterfall([
        function(callback){
            Model3d.find_by_id(req.params.id, function(err, model_obj){
                if(err) {
                    callback(err);
                }
                callback(err, model_obj);
            });
        },
        function(model_obj, callback){
            var index = model_obj.favorites.indexOf(current_username);
            if(index === -1 && increase)
            {
                model_obj.favorites =  model_obj.favorites || [];
                model_obj.favorites.push(current_username);
                model_obj.save();
            }
            else if(!increase){
                model_obj.favorites.splice(index, 1);
                model_obj.save();
            }
            callback(null, model_obj.favorites.length);
        }
    ],function (err, num_stars) {
        console.log("got this far");

        if(!err) {
            res.status(200).send(" " + num_stars);
        }
        else {
            res.status(500).send();
        }
    });
}

//GET models/:id/buy
function get_buy(req, res){
    var model_id = req.params.id;
    if(!Auth.current_user(req)){
        res.status(401).redirect("/login");
        return;
    }
    async.parallel([

        function(callback){
            Model3d.find_by_id(model_id, callback);
        },
        function(callback){
            Transaction.find_transaction_for_user_model(Auth.current_user(req), model_id, callback);
        }],

        function(err, results){
            console.log(results);
            if(err){
                console.error(err);
                res.status(501).send("Something went wrong :(");
                return;
            }
            var modelobj = results[0];
            var transaction = results[1];
            console.log(results);
            if(!modelobj || !transaction){
                console.error("download link failed");
                console.log(err);
                res.status(501).send("Something went wrong :(");
                return;
            }
            res.render("models/buy", {transaction: transaction, model: modelobj});
        }
    );
}

function stripe_make_charge(amount, currency, card_token, description, callback){
    stripe.setApiKey(global.keys.stripeSecretTest);
    stripe.charges.create({
        amount: amount, // amount in cents, again
        currency: currency,
        card: card_token,
        description: description
        }, callback);
}

// POST models/:id/buy 
// sent from the stripe front end module

function post_buy(req, res){
    if(!Auth.current_user(req)){
        res.send("need to login to purchase models!");
        return;
    }

    var stripeToken = req.body.stripeToken;
    var amount = req.body.amount;
    var transaction = new Transaction.model({model_id: req.params.id
                                            ,purchase_username: Auth.current_user(req)});
    var model_ref;

    //does each of these steps async and passes the result to the next step
    async.waterfall([
        function(callback){
            Model3d.model.findById(transaction.model_id, callback);
        },
        function(model3d, callback){

            model_ref = model3d;
            transaction.model_owner_username = model3d.creator;
            transaction.model_cost = model3d.price;
            var description = model3d.name + " by " + model3d.creator;
            transaction.description = description;
            if(model3d.price == 0){
                //skips the stripe charge 
                callback(null, false);
            }else{
                stripe_make_charge(amount, "usd", stripeToken, description, callback);
            }
        },
        function(charge, callback){
            transaction.date_recieved = Date.now();
            transaction.money_recieved = charge ? true : false;
            transaction.save(callback);
        },
        function(transaction, num, callback){
            callback(null); //no error
        }
    ],  function (err, result) {
        if(err){

            // if any errors occured throughout this proccess this function will be called
            console.error("an error occured during the transaction process");
            console.error(err);
            transaction.aborted = true;
            transaction.save();
        }else{
            //check if the model owner has a high enough balance to be payed
            User.resolve_transfers_for_username(transaction.model_owner_username);
            //render the download page to the user who purchased the model
            res.redirect("/models/"+model_ref._id+"/buy");
        }
    });

}


// models/:id/downloads
function get_downloads(req, res){
    var current_user = Auth.current_user(req);
    Model3d.find_by_id(req.params.id, function(err, model_obj){ 
        if(Model3d.was_purchased_by_username(model_obj._id, current_user, function(purchased){
            if(purchased){
                req.send("yo");
            }
        }));
    });
}

// models/uploads/:id
function get_file(req, res) {
    var current_user = Auth.current_user(req);
    var gridfs = Grid(conn.db);
    Model3d.find_by_id(req.params.id, function(err, model_obj){ 
        if(err || !model_obj){
            res.status(404).send();
            console.log(err);
            return;
        }
        if(model_obj.price == 0){
            pipe_file_to_stream(model_obj.grid_display, res);
        }
        else{
            //validate that the user bought this model at some point, then send
            Transaction.find_transaction_for_user_model(current_user, model_obj._id, function(err, transaction){
                if(transaction){
                    pipe_file_to_stream(model_obj.grid_display, res);
                }
            })
        }
    });
}



// pipes a grid file to the specified output stream
function pipe_file_to_stream(grid_id, res){
    var readstream = gridfs.createReadStream({_id : grid_id });
    console.log("readstream in models/uploads :");
    console.log(readstream);
    res.header('Content-Type', 'plain/text');
    readstream.pipe(res);
}

module.exports = {
    get_new: get_new,
    post_new: post_new,
    show: get_show,
    del: delete_model,
    get_edit: get_model_edit,
    get_buy: get_buy,
    get_file: get_file,
    post_buy: post_buy,
    post_star: post_star,
    post_unstar: post_unstar
};
