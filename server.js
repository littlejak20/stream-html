var express = require('express');
var fs = require('fs')
var http = require('http');
//var https = require('https');
var app = express();

var server = http.createServer(app);
/*var server = https.createServer({
	key: fs.readFileSync('server.key'),
	cert: fs.readFileSync('server.cert')
}, app);*/

var io = require('socket.io')(server);

var publicPath = __dirname + '/public';
var filePath = __dirname + '/files';

app.use(express.static(publicPath));
app.use(express.static(filePath));

app.get('/', function(req, res) {
	res.sendFile(publicPath + '/view.html');
});
app.get('/view', function(req, res) {
	res.sendFile(publicPath + '/view.html');
});
app.get('/config', function(req, res) {
	res.sendFile(publicPath + '/config.html');
});

server.listen(3000, function () {
  console.log('Listening port 3000')
});

// database - START
	const MongoClient = require('mongodb').MongoClient;
	const assert = require('assert');
	const url = 'mongodb://localhost:27017';
	const dbName = 'stream-html';

	const insertDocuments = function(collectionName, docs, options, callbackFunc) {
		var client = new MongoClient(url, {useNewUrlParser: true});
		client.connect(function(err) {
			//console.log("Connected successfully to server");
			const db = client.db(dbName);
			const collection = db.collection(collectionName);

			console.log('insertDocuments');
			//console.log(docs);
			collection.insertMany(docs, function(error, result) {
				console.log('insertMany');
				callbackFunc(result, error);
				client.close();
			});
		});
	}

	const findDocuments = function(collectionName, query, options, callbackFunc) {
		var client = new MongoClient(url, {useNewUrlParser: true});
		client.connect(function(err) {
			//console.log("Connected successfully to server");
			const db = client.db(dbName);
			const collection = db.collection(collectionName);

			collection.find(query).toArray(function(error, docs) {
				callbackFunc(docs, error);			
				client.close();
			});
		});
	}
// database - END

// Helpers - START
	function objectsAreEqual(obj1, obj2) {
		return (JSON.stringify(obj1) === JSON.stringify(obj2));
	}
	// https://stackoverflow.com/questions/38304401/javascript-check-if-dictionary/39339225#39339225
	function dictCheck(object, strObjectName) {
		if (object!==undefined && object!==null && typeof object==='object' && !(object instanceof Array) && !(object instanceof Date)) return true;
		return false;
	}
	function arrayCheck(object, strObjectName) {
		if (object!==undefined && object!==null && typeof object==='object' && object instanceof Array) return true;
		return false;
	}
// Helpers - END

var userCount = 0;
var dictCurConfig = {
	modeName: 'container top',
	sources: [ 
		{ // 0 attention: not set 
			name: '',
			platform: 'other',
			type: 'video',
			volume: 0.0,
		},
		{
			name: 'gronkh',
			platform: 'twitch',
			type: 'stream',
			volume: 1.0,
		},
		{
			name: 'xpandorya',
			platform: 'twitch',
			type: 'stream',
			volume: 0.0,
		},
		{
			name: 'royalphunk',
			platform: 'twitch',
			type: 'stream',
			volume: 0.0,
		},
		{
			name: 'pietsmiet',
			platform: 'twitch',
			type: 'stream',
			volume: 0.0,
		},
		{
			name: 'heidergeil',
			platform: 'twitch',
			type: 'stream',
			volume: 0.0,
		},
		{
			name: 'fishc0p',
			platform: 'twitch',
			type: 'stream',
			volume: 0.0,
		},
		{
			name: 'eosandy',
			platform: 'twitch',
			type: 'stream',
			volume: 0.0,
		},
		{
			name: 'mrmoregame',
			platform: 'twitch',
			type: 'stream',
			volume: 0.0,
		},
		{
			name: 'nancywenzmakeup',
			platform: 'twitch',
			type: 'stream',
			volume: 0.0,
		},
		{
			name: 'https://friendlyfi.re/',
			platform: 'other',
			type: 'video',
			volume: 0.0,
		},
	]
};

io.on('connection', function(socket) {
	userCount++;
	console.log('connected', socket.id, userCount);

	socket.on('disconnect', function() {
		userCount--;
		console.log('disconnected', socket.id, userCount);
	});

	socket.emit('config reload', dictCurConfig);

	socket.on('mode click', function(strModeName) {
		console.log('mode click', strModeName);
		dictCurConfig.modeName = strModeName;
		io.emit('config reload', dictCurConfig);
	});

	socket.on('formSources submit', function(arrayTmpSources) {
		console.log('formSources submit', arrayTmpSources);
		if (arrayCheck(arrayTmpSources)) {

			dictCurConfig.sources = arrayTmpSources;

			delete dictCurConfig['_id'];
			insertDocuments('configs', [dictCurConfig], {}, function(data, error) {
				//console.log(data);
			});
			/*findDocuments('configs', {}, {}, function(data, error) {
				console.log('find');
				console.log(data);
			});*/

		}

		io.emit('config reload', dictCurConfig);
	});

	socket.on('video switcher', function(arrVideoIds) {
		console.log('video switcher', arrVideoIds);

		var dictSource0 = dictCurConfig.sources[arrVideoIds[0]];
		var dictSource1 = dictCurConfig.sources[arrVideoIds[1]];
		dictCurConfig.sources[arrVideoIds[0]] = dictSource1;
		dictCurConfig.sources[arrVideoIds[1]] = dictSource0;

		io.emit('video switcher', arrVideoIds);
	});
	socket.on('video switcher finish', function(arrVideoIds) {
		io.emit('config reload', dictCurConfig);
	});

	socket.on('video reloader', function(intVideoId) {
		console.log('video reloader', intVideoId);
		io.emit('config reload', dictCurConfig);
	});
});