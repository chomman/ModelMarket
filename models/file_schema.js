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

/* ------------------- File -------------------------
// This class handles all interaction with files in the databse
*/

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
