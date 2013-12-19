/*jslint node: true */
"use strict";
// Navigation Controller
// * * * * * * * * * * 
var Model3d = require('./../models/model3d_schema');

// / GET
function home(req, res){
    console.log("-----current user-------");
    console.log(req.session);
	Model3d.model.find({}).sort({views: -1}).exec(function(err, results){
        //console.log(results);
        res.render('navigation/home', {models: results, selected: "home"});
    });
}

/* search? GET
TODO: 
*/
function search(req, res){
    res.render('navigation/search_bar', {selected: "search" });
}

/**
 * Renders the about page.
 **/
function about(req, res){
    res.render('about', {selected: "about"});
}

/**
 * Renders the search results.
 **/
function post_search(req, res) {
    console.log(req.body);
    Model3d.find_by_string(req.body.search_bar, function(err, docs) {
        if (err) {
            res.send("something went wrong");
        }
        else {
            res.render('navigation/search', {models: docs, selected: "Search Results" });
        }
    });
}

module.exports = {
    get_home: home,
    get_about: about,
    get_search: search,
    post_search: post_search
};
