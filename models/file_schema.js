/*jslint node: true */
"use strict";
var mongoose = require('mongoose');
var fs = require('fs'); 
var Model3d = require('./../models/model3d_schema'); 
var File = require('./../models/file_schema'); 

var Grid = require("gridfs-stream");
Grid.mongo = mongoose.mongo;

var conn = mongoose.createConnection('mongodb://localhost/mmdb');

conn.on('error', console.error.bind(console, 'connection error:'));

var fileSchema = new mongoose.Schema({
        location: {
            type: String
        },
        file_type: {
            type: String
        },
        gridfs_id : {
            type: mongoose.Schema.Types.ObjectId
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            index: true
        },
    });

var db_model = mongoose.model('File', fileSchema);

module.exports = {
    model: db_model,
    delete_file: delete_file
};

module.exports.find_by_location = function(loc, callback){
    db_model.findOne({location : loc}, function(err, obj) {
        if(err) { 
            callback(err, obj);
        }
        else {
            callback(err, obj);
        }
    });
};

module.exports.find_by_id = function(id, callback){
    db_model.findOne({_id : id}, function(err, obj) {
        if(err) {
            callback(err, obj);
        }
        else {
            callback(err, obj);
        }
    });
};

module.exports.find_all_belonging_to_model_with_type = function(model_id, type, callback){
    Model3d.find_by_id(model_id, function(err, obj) {
        if(err) {
            callback(err, obj.grid_files);
        }
        else {
            callback(err, obj.grid_files);
        }
    });
};

/*  ------------------------------------------------------------------
 move:
 @location: location of the file we are trying to move
 @new_name: the name to give this file once we have moved it
 @callback: callback(err) that takes an error as a parameter

 ---------------------------------------------------------------- */
module.exports.move = function(new_file, locationOnDisk, new_name, callback){
    put_file_into_database(new_file, locationOnDisk, function(gridfs_id) {
        new_file.gridfs_id = gridfs_id;
        new_file.save();
        callback(null);
    });
};

module.exports.put_file_into_database = function(locationOnDisk, callback) {
    var gridfs = Grid(conn.db);
   
    var writeStream = gridfs.createWriteStream({ filename: locationOnDisk });
    console.log("reached putFileIntoDatabase");
    fs.createReadStream(locationOnDisk).pipe(writeStream);

    writeStream.on("close", function (gridfile) {
        console.log("file : " + gridfile);
        console.log("write file finished");
        callback(null, gridfile._id);
    });
}

function delete_file(model_id) {
    var gridfs = Grid(conn.db);
    db_model.find({owner : model_id}, function(err, files) {
        for (var index in files) {
            console.log("reached here");
            var file = files[index];
            console.log(file);
            gridfs.remove({_id : file.gridfs_id}, function() {
                if (err) {
                    console.log(err);
                }
                console.log('success');
                file.remove();
            });
        }
    });
}

module.exports.get_readstream_id = function(id){
    var gfs = Grid(conn.db);
    return gfs.createReadStream({_id : id});
}
