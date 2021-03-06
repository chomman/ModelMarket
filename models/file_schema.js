/*jslint node: true */
"use strict";
var mongoose = require('mongoose');
var fs = require('fs'); 

var Grid = require("gridfs-stream");
Grid.mongo = mongoose.mongo;

var conn = mongoose.createConnection('mongodb://localhost/mmdb');

conn.on('error', console.error.bind(console, 'connection error:'));

/* ------------------- File -------------------------
// This class handles all interaction with files in the databse
*/

module.exports.put_file_into_database = function(file, callback) {
    var gridfs = Grid(conn.db);
   
    var options = {
        filename: file.originalFilename,
        metadata: {
            file_description: file.description,
            owner: file.model_id 
        }
        
    }
    console.log("options: ");
    console.log(options);

    var writeStream = gridfs.createWriteStream(options);
    console.log("reached putFileIntoDatabase");
    fs.createReadStream(file.path).pipe(writeStream);

    writeStream.on("close", function (gridfile) {
        console.log("file : " + gridfile);
        console.log("write file finished");
        callback(null, gridfile._id);
    });
};


/* ----------------------------------------------------
// delete_file
// @gridfs_id : the id of the file in the gridfs database
// @callback (err) : a callback that takes an error
*/
module.exports.delete_file = function(gridfs_id, callback) {
    var gridfs = Grid(conn.db);
    gridfs.remove({_id : gridfs_id}, function(err) {
        if (err) {
            console.log(err);
            callback(err);
        }
        else{
            callback(err);
        }
    });
};



module.exports.get_readstream_id = function(id){
    var gfs = Grid(conn.db);
    return gfs.createReadStream({_id : id});
};
