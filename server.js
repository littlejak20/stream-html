var userCount = 0;
var lastConfigName = 'lastConfig';
var dictLastConfig = {
	name: lastConfigName,
	modeName: 'container top',
	date: new Date(),
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

app.get('/', (req, res) => {
	res.sendFile(publicPath + '/view.html');
});
app.get('/view', (req, res) => {
	res.sendFile(publicPath + '/view.html');
});
app.get('/config', (req, res) => {
	res.sendFile(publicPath + '/config.html');
});

server.listen(3000, () => {
  console.log('Listening port 3000')
});

// Helpers - START
	const objectsAreEqual = (obj1, obj2) => {
		return (JSON.stringify(obj1) === JSON.stringify(obj2));
	}
	// https://stackoverflow.com/questions/38304401/javascript-check-if-dictionary/39339225#39339225
	const dictCheck = (object, strObjectName) => {
		if (object!==undefined && object!==null && typeof object==='object' && !(object instanceof Array) && !(object instanceof Date)) return true;
		return false;
	}
	const arrayCheck = (object, strObjectName) => {
		if (object!==undefined && object!==null && typeof object==='object' && object instanceof Array) return true;
		return false;
	}
	const functionCheck = (object, strObjectName) => {
		if (object!==undefined && object!==null && object instanceof Function) return true;
		if (boolApiCheckCanUse) requiredError(strObjectName);
		return false;
	}
// Helpers - END

// Database - START
	const MongoClient = require('mongodb').MongoClient;
	const assert = require('assert');
	const url = 'mongodb://localhost:27017';
	const dbName = 'stream-html';

	const insertDocuments = (collectionName, docs, options, callbackFunc) => {
		var client = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});
		client.connect((err) => {
			const db = client.db(dbName);
			const collection = db.collection(collectionName);

			collection.insertMany(docs, options, (error, result) => {
				callbackFunc(result, error);
				client.close();
			});
		});
	}

	const findDocuments = (collectionName, query, options, callbackFunc) => {
		var client = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});
		client.connect((err) => {
			const db = client.db(dbName);
			const collection = db.collection(collectionName);

			collection.find(query, options).toArray((error, docs) => {
				callbackFunc(docs, error);
				client.close();
			});
		});
	}

	const updateDocuments = (collectionName, filter, update, options, callbackFunc) => {
		var client = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});
		client.connect((err) => {
			const db = client.db(dbName);
			const collection = db.collection(collectionName);

			collection.updateMany(filter, { $set: update }, options, (error, result) => {
				callbackFunc(result, error);
				client.close();
			});
		});
	}

	const lastConfigUpdateInsert = () => {
		delete dictLastConfig['_id'];
		dictLastConfig['date'] = new Date();

		findDocuments('configs', { name: lastConfigName }, {}, (data, error) => {
			if (data.length > 0) {
				updateDocuments('configs', { name: lastConfigName }, dictLastConfig, {}, (data, error) => {
					console.log('update config');
				});
			} else {
				insertDocuments('configs', [dictLastConfig], {}, (data, error) => {
					console.log('insert config');
				});
			}
		});
	}
// Database - END

findDocuments('configs', { name: 'lastConfig' }, {}, (data, error) => {
	if (data.length > 0) {
		dictLastConfig = data[0];
	} else {
		insertDocuments('configs', [dictLastConfig], {}, (data, error) => {
			console.log('insert config');
		});
	}
	startIoOnConnection();
});

const startIoOnConnection = () => {
io.on('connection', (socket) => {
	userCount++;
	console.log('connected', socket.id, userCount);

	socket.on('disconnect', () => {
		userCount--;
		console.log('disconnected', socket.id, userCount);	
	});

	socket.emit('config reload', dictLastConfig);

	socket.on('mode click', (strModeName) => {
		console.log('mode click', strModeName);
		dictLastConfig.modeName = strModeName;
		
		lastConfigUpdateInsert();
		io.emit('config reload', dictLastConfig);
	});

	socket.on('formSources submit', (arrayTmpSources) => {
		console.log('formSources submit', arrayTmpSources);
		if (arrayCheck(arrayTmpSources)) {
			dictLastConfig.sources = arrayTmpSources;
			lastConfigUpdateInsert();
		}
		io.emit('config reload', dictLastConfig);
	});

	socket.on('video switcher', (arrVideoIds) => {
		console.log('video switcher', arrVideoIds);

		var dictSource0 = dictLastConfig.sources[arrVideoIds[0]];
		var dictSource1 = dictLastConfig.sources[arrVideoIds[1]];
		dictLastConfig.sources[arrVideoIds[0]] = dictSource1;
		dictLastConfig.sources[arrVideoIds[1]] = dictSource0;

		lastConfigUpdateInsert();
		io.emit('video switcher', arrVideoIds);
	});
	socket.on('video switcher finish', (arrVideoIds) => {
		io.emit('config reload', dictLastConfig);
	});

	/*socket.on('video reloader', (intVideoId) => {
		console.log('video reloader', intVideoId);
		io.emit('config reload', dictLastConfig);
	});*/
});
}