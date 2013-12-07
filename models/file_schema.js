/*jslint node: true */
"use strict";
var mongoose = require('mongoose');
var fs = require('fs'); 

var Grid = require("gridfs-stream");
var db = mongoose.connection;
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
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            index: true
        },
    });

var db_model = mongoose.model('File', fileSchema);

module.exports = {
    model: db_model
};
module.exports.find_by_location = function(loc, callback){
    "use strict";
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
    "use strict";
    db_model.findOne({_id : id}, function(err, obj) {
        if(err)  {
            callback(err, obj);
        }
        else {
            callback(err, obj);
        }
    });
};

module.exports.find_all_belonging_to_model_with_type = function(model_id, type, callback){
    "use strict";
    db_model.find({owner : model_id}, function(err, obj) {
        if(err) callback(err, obj);
        else callback(err, obj);
    });
};

/*  ------------------------------------------------------------------
 move:
 @location: location of the file we are trying to move
 @new_name: the name to give this file once we have moved it
 @callback: callback(err) that takes an error as a parameter

 ---------------------------------------------------------------- */
module.exports.move = function(locationOnDisk, new_name, callback){
    "use strict";
    putFileIntoDatabase(locationOnDisk);
    fs.readFile(locationOnDisk, function (err, data) {
        console.log("yo");
        var newPath = global.root_path + "/public/uploads/" + new_name;
        console.log(newPath);
        fs.writeFile(newPath, data, function (err) {
            callback(err);
        });
    });
};

function putFileIntoDatabase(locationOnDisk) {
    //var buffer = "";

    var gridfs = Grid(conn.db);
    
    // write file
    var writeStream = gridfs.createWriteStream({ filename: locationOnDisk });
    console.log("reached putFileIntoDatabase");
    fs.createReadStream(locationOnDisk).pipe(writeStream);

    // after the write is finished
    writeStream.on("close", function () {
        console.log("write file finished");
        gridfs.files.find({ filename: locationOnDisk }).toArray(function (err, files) {
            if (err) {
                console.log(err);
            }
            console.log(files);

        });
    });
}
