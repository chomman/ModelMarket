/*jslint node: true */
"use strict";
// Users Controller
// * * * * * * * * * * 
var Model3d = require('./../models/model3d_schema');
var File = require('./../models/file_schema');
var User = require('./../models/user_schema');
var user_model = User.model;
var Auth = require('./authentication_controller');
var async = require('async');

var stripe = require("stripe")(
  "sk_test_SBwGeHO10EJ0xTnmImA0W3uC"
);


// users/register GET
function  get_register(req, res) {
    var res_message = "";
    res.render('users/register', {message: res_message});
}

// users/register POST
function post_register(req, res) {
    console.log("--------new user----------");
    console.log(req.body.username);
    console.log(req.body.password);
    console.log("--------------------------");

    //stripe.setApiKey(global.keys.stripeSecretTest);
    
    user_model.register(new user_model({
        username : req.body.username,
        email: req.body.email
    }), 
        req.body.password, 
        function(err, account) {
            /*jshint unused: vars */
            if (err) 
            {
                var res_message = "Please pick a new username. This one already exists.";
                return res.render('users/register', {message: res_message});
            }
            res.redirect('/');
        });
    
}

// users/:username GET
function get_show(req, res){
    User.find_by_name(req.params.username, function(err, user_result){
        if(err) {
            console.log(err);
        }
        if(user_result)
        { 
            async.parallel([
                function(callback){
                    Model3d.model.find({creator: user_result.username}).sort({views: -1}).exec(function(err, models){
                        callback(err, models);
                    });
                },
                function(callback){
                    Model3d.model.find({favorites: user_result.username}).exec(function(err, models){
                        callback(err, models);
                    });
                }

            ], function(err, results){
                    console.log(err);
                    console.log(results);
                    res.render('users/show', {user: user_result, models: results[0], starred: results[1]});
                }
            );
        }
        else {
            res.status(404).send('Not found');
        }
    });
}

// users/:username/edit GET
function get_edit(req, res){
    if(Auth.current_user(req) === req.params.username){
        User.find_by_name(req.params.username, function(err, result){
            console.log(result);
            res.render('users/edit', {user: result});
        });
    }
    else{
        res.send("Not Authorized to perform this action. Sorry");
    }
}

// users/:username/edit PUT
function put_edit(req, res){
    res.render('/');
}

// users/:username DELETE
function del_user(req, res){
    res.render('/');
}

// users/:username/upload_image
function post_upload_image(req, res) {
    console.log(req.files);
    var user = Auth.current_user(req);
    if(user !== req.params.username){
        res.send("not authorized to change this users image.");
        return;
    }
    User.find_by_name(user, function(err, user){
        var temp_path = req.files.profile_picture.path;
        File.put_file_into_database(temp_path, function(err, gridfs_id){
            user.imageid = gridfs_id;
            user.save(function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Image saved!");
                    res.redirect("/");
                }
            });
        });
    });
}

// users/:username/image
function get_image(req, res) {
    console.log("got here hi, " + req.params.username);
    User.find_by_name(req.params.username, function(err, user){
        if(err){
            console.log(err);
        }
        var readstream =  File.get_readstream_id(user.imageid);
        console.log(readstream);
        readstream.pipe(res);
        readstream.on('error', function(){
            console.log("prof pic not found. Sending default");
            res.sendfile(global.root_path + "/public/default-user-icon.png");
        });
    });
}

function get_bank_info(req, res){
    if(Auth.current_user(req) === req.params.username){
        res.render('users/bank_info', { });
    }
    else{
        res.send("Not Authorized to perform this action. Sorry");
    }
}

function update_recipient(user_obj, res, first_name, last_name, recipient) {
    console.log(user_obj);
    user_obj.firstname = first_name;
    user_obj.lastname = last_name;
    /*jshint sub: true */
    user_obj.recipientid = recipient["id"];
    user_obj.save(function(err){
        if(err)
        {
            console.log(err);
            res.status(500);
            res.send("Server error");
        }
        else
        {
            res.redirect('/');
        }
    });
}

function handle_transaction(token, first_name, last_name, req, res) {

    /*jshint sub: true */
    if(token["id"] !== undefined)
    {
        console.log(token["id"]);
        stripe.recipients.create({
            name: first_name + " " + last_name,
            type: "individual",
            bank_account: token["id"],
            email: req.body.email
        }, 
        function(err, recipient) {
            if(err)
            {
                console.log(err);
            }
            else
            {
                console.log(recipient);
                console.log("Hello There I reached here");
                User.find_by_name(req.params.username, function(err, user_obj){
                    update_recipient(user_obj, res, first_name, last_name, recipient);
                });
            }
        });
    }   
}

function post_bank_info(req, res){
    var first_name = req.body.firstname;
    var last_name = req.body.lastname;
    var routing_number = req.body.routingNumber;
    var account_number = req.body.accountNumber;
    var token = stripe.tokens.create({
        bank_account: {
            country: 'US',
            routing_number: routing_number,
            account_number: account_number
        }
    }, 
    function(err, token) {
        if(err)
        {
            console.log("ERROR");
            console.log(err);
        }
        else
        {
            handle_transaction(token, first_name, last_name, req, res);
        }
    });

}

module.exports = {
    get_register: get_register,
    post_register: post_register,
    get_show: get_show,
    get_edit: get_edit,
    put_edit: put_edit,
    del: del_user,
    post_upload_image: post_upload_image,
    get_image: get_image,
    get_bank_info: get_bank_info,
    post_bank_info: post_bank_info
};
