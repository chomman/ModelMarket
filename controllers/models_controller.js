/*jslint node: true */
"use strict";
// Models Controller
// * * * * * * * * * * 
var Model3d = require('./../models/model3d_schema'); 
var File = require('./../models/file_schema'); 
var User = require('./../models/user_schema'); 
var Auth = require('./authentication_controller');
var Transaction = require('./../models/transaction_schema');

var streamifier = require('streamifier');

var Grid = require("gridfs-stream");
var mongoose = require('mongoose');
Grid.mongo = mongoose.mongo;

var conn = mongoose.createConnection('mongodb://localhost/mmdb');

conn.on('error', console.error.bind(console, 'connection error:'));

var stripe = require("stripe")(
  "sk_test_SBwGeHO10EJ0xTnmImA0W3uC"
);

var async = require('async');

// models/new GET
function get_new(req, res){
    if(Auth.current_user(req) !== null) {
        res.render('models/new', {selected: "upload"});
    }else {
        res.redirect('/login');
    }
}

// make sure that all the required inputs were suplied by the user
function validate_post_new_form(req){
    if(!req.body.name) return false;
    if(!req.body.price) return false;
    if(!req.body.description) return false;
    if(!req.files.display_model) return false;

    return true;
}

function get_asset_description_from_form(req, asset_name){
    console.log("getting description for asset: "+ asset_name);
    if(asset_name == "display_model") return "Display model";
    if(asset_name == "display_texture") return "Display texture";

    var number = new RegExp(/(\d+)/).exec(asset_name)[0];
    console.log(number);
    var description_field = "description_asset" + number;
    var drop_field = "drop_asset"+number;

    return req.body[description_field] + "(" + req.body[drop_field] + ")";
}

// models/new POST
function post_new(req, res){
    //TODO: Authenticate
    if( !validate_post_new_form(req) ){
        req.redirect('back');
        console.log("invalid inputs!");
        return;
    }
    console.log("new model posted");
    console.log(req.body);
    console.log(req.files);
    console.log(Auth.current_user(req));

    var new_model3d = new Model3d.model({name : req.body.name || "undefined",
                                        description: req.body.description || "no description",
                                        price: parseFloat(req.body.price) || 0.0,
                                        creator: Auth.current_user(req)
                                        });
    console.log("price : $" + new_model3d.price + " " + parseFloat(req.body.price));
    console.log("user: " + Auth.current_user(req));

    var files = req.files;

    var model_display_index;
    var asset_files = [];
    for(var f in files){
        var file = files[f];
        if(file.size > 0){
            if(f == "display_model") model_display_index = asset_files.length;
            var description = get_asset_description_from_form(req, f);
            console.log(description);
            //inject description onto object
            file.description = description;
            file.model_id = new_model3d._id;
            asset_files.push(file);
        }
    }

    
    console.log("saving following files to db");

    async.map(asset_files, File.put_file_into_database, function(err, results){
        //results contains the gridfs id's of the files
        if(err){
            console.log("error saving uploads");
            res.status(502).redirect("/");
        }else{
            console.log("sucessufully uploaded files... saving model");
            new_model3d.grid_files = results;
            //TODO: process file @tarun
            new_model3d.grid_display = results[model_display_index];
            console.log("grid display file id: " + new_model3d.grid_display);
            new_model3d.save(function(err) {
                if (err) {
                    console.log(err);
                }
                res.redirect("/models/"+new_model3d._id+"/edit");
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
            console.log("got here");
            console.log(results);
            if(err){
                console.log(err);
                res.status(501).send("Something went wrong :(");
                return;
            }
            var modelobj = results[0];
            var transaction = results[1];
            console.log(results);
            if(!modelobj || !transaction){
                console.log("download link failed");
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


// models/:id/download
function get_downloads(req, res){
    var current_user = Auth.current_user(req);
    Model3d.find_by_id(req.params.id, function(err, model_obj){ 
        var model_id = model_obj._id;
        if(model_obj.price <= 0){
            render_downloads(res, model_obj);
        }
        else{
            Model3d.was_purchased_by_username(model_id, current_user, function(purchased){
                if(purchased){
                    render_downloads(res, model_obj);
                }else{
                    res.status(401).send("You have not purchased this model");
                }
            });
        } 
    });
}


// models/:id/download
function render_downloads (res, model) {
    var gridfs = Grid(conn.db);

    gridfs.files.find({'metadata.owner':model._id }).toArray(function (err, files) {
        console.log("-----------------------------------------");
        console.log(files);
        res.render("models/download", {files: files, model: model});
    })
}


// models/uploads/:id
function get_file(req, res) {
    var grid_id = req.params.id;
    pipe_file_to_stream(grid_id, res);
}

// models/:id/display
function get_display_model(req, res) {

    var current_user = Auth.current_user(req);
    Model3d.find_by_id(req.params.id, function(err, model_obj){ 
        console.log("found model display: " + model_obj.grid_display);
        if(err || !model_obj){
            res.status(404).send();
            console.log(err);
            return;
        }
        pipe_file_to_stream(model_obj.grid_display, res);
    });
}

// pipes a grid file to the specified output stream
function pipe_file_to_stream(grid_id, res){
    var gridfs = Grid(conn.db);

    var readstream = gridfs.createReadStream({_id : grid_id });
    console.log("readstream in models/uploads :");
    console.log(readstream);
    //res.header('Content-Type', 'plain/text');
    readstream.pipe(res);
}

// POST models/:id/submit_screenshot
function post_submit_screenshot(req, res) {
    //console.log(req.body);
    console.log("yoyoyoyoyoyo");
    save_screenshot_image(req.body.image.replace(/^data:image\/png;base64,/,""), function(err, grid_id){
        Model3d.find_by_id(req.params.id, function(err, model_obj){
            model_obj.grid_files.push(grid_id);
            model_obj.grid_screenshot = grid_id;
            model_obj.save(function(err){
                res.status(200).end();
            });
        })
    });
}

function save_screenshot_image(base64_data, callback) {
    var img = new Buffer(base64_data, 'base64');
    var gridfs = Grid(conn.db);
    var options = {
        filename: "Screenshot- " + new Date(),
        metadata: {
            file_description: "Screenshot"
        }
    };

    var writeStream = gridfs.createWriteStream(options);
    streamifier.createReadStream(img).pipe(writeStream);
    writeStream.on("close", function (gridfile) {
        console.log("file : " + gridfile);
        console.log("write file finished");
        console.log("gridfile-------------------------------");
        console.log(gridfile);
        callback(null, gridfile._id);
    });
}

// GET models/:id/screenshot
function get_screenshot(req, res){
    var model_id = req.params.id;
    Model3d.find_by_id(model_id, function(err, model_obj){
        console.log("screenshot id: " + model_obj.grid_screenshot);
        pipe_file_to_stream(model_obj.grid_screenshot, res);
    });
}

module.exports = {
    get_new: get_new,
    post_new: post_new,
    show: get_show,
    del: delete_model,
    get_edit: get_model_edit,
    get_downloads: get_downloads,
    get_buy: get_buy,
    get_file: get_file,
    get_display_model: get_display_model,
    post_buy: post_buy,
    post_star: post_star,
    post_unstar: post_unstar,
    post_submit_screenshot: post_submit_screenshot,
    get_screenshot: get_screenshot
};
