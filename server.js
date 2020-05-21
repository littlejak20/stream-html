// profile and config names are the same

var serverPort = 3000;
var userCount = 0;
var startConfigName = 'Disable';
var dictLastConfig = {
	name: 'setByServer',
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
var arrayProfileNames = [];
/*var blankBlankProfile = {"_id":"name":"blank","modeName":"container top2x4-bottom-2","sources":[{"name":"","volume":{"$numberInt":0.0}},{"name":"","platform":"other","type":"video","muted":false,"volume":0.0},{"name":"","platform":"other","type":"video","muted":false,"volume":0.0},{"name":"","platform":"other","type":"video","muted":false,"volume":0.0},{"name":"","platform":"other","type":"video","muted":false,"volume":0.0},{"name":"","platform":"other","type":"video","muted":false,"volume":0.0},{"name":"","platform":"other","type":"video","muted":false,"volume":0.0},{"name":"","platform":"other","type":"video","muted":false,"volume":0.0},{"name":"","platform":"other","type":"video","muted":false,"volume":0.0},{"name":"","platform":"other","type":"video","muted":false,"volume":0.0},{"name":"","platform":"other","type":"video","muted":false,"volume":0.0}]};*/

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
app.get('/', (req, res) => { res.sendFile(publicPath + '/view.html'); });
app.get('/v', (req, res) => { res.sendFile(publicPath + '/view.html'); });
app.get('/view', (req, res) => { res.sendFile(publicPath + '/view.html'); });
app.get('/c', (req, res) => { res.sendFile(publicPath + '/config.html'); });
app.get('/config', (req, res) => { res.sendFile(publicPath + '/config.html'); });

server.listen(serverPort, () => { console.log('Listening on port '+serverPort)+'!'; });

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
				if (functionCheck(callbackFunc)) callbackFunc(result, error);
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
				if (functionCheck(callbackFunc)) callbackFunc(docs, error);
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
				if (functionCheck(callbackFunc)) callbackFunc(result, error);
				client.close();
			});
		});
	}
// Database - END

const loadAllProfileNames = () => {
	findDocuments('configs', {}, {}, (data, error) => {
		if (data.length > 0) arrayProfileNames = data;
		try { io.emit('profileName reload', arrayProfileNames); } catch {}
	});
}
const configUpdateInsert = (strConfigName) => {
	var dictNewConfig = {
		name: strConfigName,
		modeName: dictLastConfig.modeName,
		sources: dictLastConfig.sources,
	};

	findDocuments('configs', { name: strConfigName }, {}, (data, error) => {
		if (data.length > 0) {
			updateDocuments('configs', { name: strConfigName }, dictNewConfig, {}, (data, error) => {
				console.log('update config');
				loadAllProfileNames();
				try { io.emit('config reload', dictLastConfig); } catch {}
			});
		} else {
			insertDocuments('configs', [dictNewConfig], {}, (data, error) => {
				console.log('insert config');
				loadAllProfileNames();
				try { io.emit('config reload', dictLastConfig); } catch {}
			});
		}
	});
}

// Start
findDocuments('configs', { name: startConfigName }, {}, (data, error) => {
	if (data.length > 0) {
		dictLastConfig = data[0];
		loadAllProfileNames();
		startIoOnConnection();
	} else {
		insertDocuments('configs', [dictLastConfig], {}, (data, error) => {
			console.log('insert config');
			loadAllProfileNames();
			startIoOnConnection();
		});
	}
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
	socket.emit('profileName reload', arrayProfileNames);
	
	socket.on('addProfile submit', (dictForms) => {
		console.log('addProfile submit', dictForms);
		if (!dictCheck(dictForms)) return false;
		
		if (dictForms.formProfile.name.length > 0) dictLastConfig.name = dictForms.formProfile.name;
		if (arrayCheck(dictForms.sources)) dictLastConfig.sources = dictForms.sources;
		configUpdateInsert(dictForms.formProfile.name);
	});
	
	socket.on('loadProfile submit', (dictForms) => {
		console.log('loadProfile submit', dictForms);
		if (!dictCheck(dictForms)) return false;
		if (dictForms.formProfile.select.length <= 0) return false;

		findDocuments('configs', { name: dictForms.formProfile.select }, {}, (data, error) => {
			console.log('loadProfile submit --> findDocuments');
			if (data.length > 0) dictLastConfig = data[0];
			io.emit('config reload', dictLastConfig);
			io.emit('profileName reload', arrayProfileNames);
		});
	});

	socket.on('saveProfile submit', (dictForms) => {
		console.log('saveProfile submit', dictForms);
		if (!dictCheck(dictForms)) return false;

		if (dictForms.formProfile.select.length > 0) dictLastConfig.name = dictForms.formProfile.select;
		if (arrayCheck(dictForms.sources)) dictLastConfig.sources = dictForms.sources;
		configUpdateInsert(dictLastConfig.name);
	});

	socket.on('mode click', (strModeName) => {
		console.log('mode click', strModeName);
		dictLastConfig.modeName = strModeName;
		configUpdateInsert(dictLastConfig.name);
	});

	socket.on('video switcher', (arrVideoIds) => {
		console.log('video switcher', arrVideoIds);

		var dictSource0 = dictLastConfig.sources[arrVideoIds[0]];
		var dictSource1 = dictLastConfig.sources[arrVideoIds[1]];
		dictLastConfig.sources[arrVideoIds[0]] = dictSource1;
		dictLastConfig.sources[arrVideoIds[1]] = dictSource0;

		io.emit('video switcher', arrVideoIds);
	});
	socket.on('video switcher finish', () => {		
		configUpdateInsert(dictLastConfig.name);
	});

	socket.on('video reloader', (intVideoId) => {
		console.log('video reloader', intVideoId);
		io.emit('video reloader', intVideoId);
	});
	socket.on('video reloader finish', () => {
		io.emit('config reload', dictLastConfig);
	});
});
}