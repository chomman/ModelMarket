var url = require('url');
//#express
var express = require('express');
var app = express();
app.use(express.bodyParser());

// # Controllers:
// 	This is where the model schemas are defined
var models_controller = require('./controllers/models_controller');
// -----------------------

// # Models:
// 	This is where the model schemas are defined
var model3d = require('./models/model3d_schema');
// -----------------------

// # Setup Views
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
// ----------------------

// #DB# :
// 	Set Up Data Base and pass it to all routes
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("mongo open");
});

global.root_path = __dirname;
console.log(global.root_path);

app.all('*', function(request, response, next)
    {
    request.mongoose = mongoose;
    next();
});
//------------------------------------------

// #Session stuff:
app.use(express.static(__dirname + '/public'))
app.use(express.cookieParser());
app.use(express.session({secret: 'IMMABEAST'}));

//--------------------------------

// #Routes
app.get('/models/new', models_controller.get_new);
app.post('/models/new', models_controller.post_new);
app.get('/models/:id', models_controller.show);
app.del('/models/:id', models_controller.del);
app.get('/models/:id/buy',  models_controller.get_buy);
app.post('/models/:id/buy',  models_controller.post_buy);

app.listen(process.env.PORT || 3000);