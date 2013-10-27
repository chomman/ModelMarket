// Users Controller
// * * * * * * * * * * 
var Model3d = require('./../models/model3d_schema');
var File = require('./../models/file_schema');
var User = require('./../models/user_schema');
var Auth = require('./authentication_controller')


// users/register GET
function  get_register(req, res) {
    res.render('users/register', { });
}

// users/register POST
function post_register(req, res) {
    console.log("--------new user----------");
    console.log(req);
    console.log(req.body.username);
    console.log(req.body.password);
    console.log("--------------------------");

    User.model.register(new User({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
            return res.render('users/register', { account : account });
        }
        res.redirect('/');
    });
}

// users/:username GET
function get_show(req, res){
    User.find_by_name(req.params.username, function(err, result){
        if(err) console.log(err);
        if(result) res.render('users/show', {user: result});
        else res.status(404).send('Not found');
    });
}

// users/:username/edit GET
function get_edit(req, res){
    if(Auth.current_user(req) == req.params.username){
        User.find_by_name(req.params.username, function(err, result){
            console.log(result);
            res.render('users/edit', {user: result});
        });
    }
    else{
        res.send("Not Authorized to perform this action. Sorry")
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


module.exports = {
    get_register: get_register,
    post_register: post_register,
    get_show: get_show,
    get_edit: get_edit,
    put_edit: put_edit,
    del: del_user
}