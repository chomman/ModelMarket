var url = require('url');

//#express
var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'))

app.use(express.cookieParser());
app.use(express.session({secret: 'IMMABEAST'}));


app.get('*', function(req, res){
	req.session.lastPage = req.session.lastPage + "Asdf";
	res.send(req.session.lastPage);
})

app.listen(process.env.PORT || 3000);