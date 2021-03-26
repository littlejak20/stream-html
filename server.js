const consts = require('./server/const.js');

// profile and config names are the same

var serverPort = 3000;
var userCount = 0;
var startConfigName = 'Twitch Stream';
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

const fetch = require('node-fetch');
//const fetchSync  = require('fetch-sync');

var express = require('express');
var fs = require('fs')
var http = require('http');
var https = require('https');
var app = express();

var server = http.createServer(app);
/*var server = https.createServer({
	key: fs.readFileSync('server.key'),
	cert: fs.readFileSync('server.cert')
}, app);*/

var io = require('socket.io')(server);

var distPath = __dirname + '/dist';
var filePath = __dirname + '/files';

app.use(express.static(distPath));
app.use(express.static(filePath));
app.get('/', (req, res) => { res.sendFile(distPath + '/view.html'); });
app.get('/v', (req, res) => { res.sendFile(distPath + '/view.html'); });
app.get('/view', (req, res) => { res.sendFile(distPath + '/view.html'); });
app.get('/c', (req, res) => { res.sendFile(distPath + '/config.html'); });
app.get('/config', (req, res) => { res.sendFile(distPath + '/config.html'); });

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
	const url = 'mongodb://127.0.0.1:27017';
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

let startIoOnConnection = () => {
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

	socket.on('twitch get channelInfosBig', async () => {
		console.log('twitch get channelInfosBig');
		const dictChannelInfosBig = await getChannelInfosBig();		
		console.log(dictChannelInfosBig);
		io.emit('twitch get channelInfosBig', dictChannelInfosBig);
	});
});
}

const getTwitchRequestHeader = async () => {
	if (consts.twitch.authRight) return consts.twitch.requestHeader;

	const twicthAuth = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${consts.twitch.clientId}&client_secret=${consts.twitch.clientSecret}&grant_type=client_credentials`, {
		method: 'post',
	}).then(res => res.json());

	consts.twitch.requestHeader['Authorization'] = `Bearer ${twicthAuth['access_token']}`;
	consts.twitch.authRight = true;
	return consts.twitch.authRight ? consts.twitch.requestHeader : false;
}

const getFollowedStreamChannels = async (beforeData, paginationCursor) => {
	const header = await getTwitchRequestHeader();
	if (!header) return [];

	console.log('getFollowedStreamChannels');
	let arrayStreamItems = [];
	if (beforeData !== undefined) arrayStreamItems = beforeData;

	const responseData = await fetch(`https://api.twitch.tv/helix/users/follows?first=${consts.twitch.maxItemCount}&from_id=${consts.twitch.useerId}`+(paginationCursor !== undefined ? `&after=${paginationCursor}` : ``), {
		method: 'get',
		headers: header,
	}).then(res => res.json());

	if (responseData !== undefined) {
		if (responseData.data !== undefined) {
			arrayStreamItems = arrayStreamItems.concat(responseData.data);
		}
		if (responseData.pagination !== undefined) {
			if (responseData.pagination.cursor !== undefined) {
				return await getFollowedStreamChannels(arrayStreamItems, responseData.pagination.cursor);
			}
		}
	}
	return arrayStreamItems;
}

const getChannelNames = async () => {
	const arrayStreamItems = await getFollowedStreamChannels();
	let tmp = { names: [], namesStack: [[]], ids: [], idsStack: [[]],  loginIdQs: '', loginIdQsStack: [''], idQs: '', idQsStack: [''] };
	if (arrayStreamItems === undefined) return tmp;
	if (arrayStreamItems.length <= 0) return tmp;

	let stackIndex = 0;
	let stackCount = 0;

	arrayStreamItems.forEach((streamItem, index) => {
		if (streamItem === undefined) return;
		const channelName = streamItem['to_name'];
		const channelId = streamItem['to_id'];
		if (channelName === undefined || channelId === undefined) return;
		if (channelName <= 0 || channelId <= 0) return;

		if (stackIndex >= consts.twitch.maxItemCount) {
			stackIndex = 0;
			stackCount++;

			tmp.namesStack[stackCount] = [];
			tmp.idsStack[stackCount] = [];
			tmp.loginIdQsStack[stackCount] = '';
			tmp.idQsStack[stackCount] = '';
		}

		tmp.names.push(channelName);
		tmp.namesStack[stackCount].push(channelName);

		tmp.ids.push(channelId);
		tmp.idsStack[stackCount].push(channelId);

		tmp.loginIdQs += `&user_id=${channelId}`;
		tmp.loginIdQsStack[stackCount] += `&user_id=${channelId}`;

		tmp.idQs += `&id=${channelId}`;
		tmp.idQsStack[stackCount] += `&id=${channelId}`;

		stackIndex++;
	});

	return tmp;
}

const getChannelInfosBig = async () => {	
	const header = await getTwitchRequestHeader();
	if (!header) return [];

	const arrayChannelNames = await getChannelNames();
	if (arrayChannelNames === undefined) return [];

	var arrayChannelInfo = [];
	for (const queryString of arrayChannelNames.idQsStack) {
		const responseData = await fetch(`https://api.twitch.tv/helix/users?${queryString.substr(1)}`, {
			method: 'get',
			headers: header,
		}).then(res => res.json());

		if (responseData !== undefined) {
			if (responseData.data !== undefined) {
				arrayChannelInfo = arrayChannelInfo.concat(responseData.data);
			}
		}
	};

	var arrayStreamLiveItems = [];
	for (const queryString of arrayChannelNames.loginIdQsStack) {
		const responseData = await fetch(`https://api.twitch.tv/helix/streams?first=${consts.twitch.maxItemCount}${queryString}`, {
			method: 'get',
			headers: header,
		}).then(res => res.json());

		if (responseData !== undefined) {
			if (responseData.data !== undefined) {
				arrayStreamLiveItems = arrayStreamLiveItems.concat(responseData.data);
			}
		}
	};

	var arrayChannelInfoBig = [];
	arrayChannelInfo.forEach((channelInfo, index) => {
		const streamLive = arrayStreamLiveItems.find(o => o.user_name === channelInfo.display_name);
		if (streamLive !== undefined) {
			streamLive.flgLive = true;
			arrayChannelInfoBig.push(Object.assign(channelInfo, streamLive));
		} else {
			arrayChannelInfoBig.push(channelInfo);
		}
	});

	return arrayChannelInfoBig;
}


/*(async () => {
	getChannelInfosBig();
})();*/















/*
// ####################################################
// #################### START #########################
// ############### TWITCH OAUATH ######################
// ####################################################

// https://www.npmjs.com/package/@callowcreation/basic-twitch-oauth#loading-and-configuration

const TwitchOAuth = require("@callowcreation/basic-twitch-oauth");
 
const state = 'a-Unique-ID-98765432-For_Security';
 
const twitchOAuth = new TwitchOAuth({
	client_id: consts.twitch.clientId,
	client_secret: consts.twitch.clientSecret,
	redirect_uri: 'http://127.0.0.1:3000/auth/twitch/callback',
	scopes: [
		//'user:edit:broadcast'
	]
}, state);
 
//const express = require('express');
//const app = express();
 
app.get('/c', (req, res) => {
	res.redirect(twitchOAuth.authorizeUrl);
});
 
// redirect_uri ends up here
app.get('/auth/twitch/callback', (req, res) => {
	const qs = require('querystring');
	const req_data = qs.parse(req.url.split('?')[1]);
	const code = req_data['code'];
	const state = req_data['state'];
 
	if (twitchOAuth.confirmState(state) === true) {
		twitchOAuth.fetchToken(code).then(json => {
			if (json.success === true) {
				console.log('authenticated');
				res.redirect('/c-start');
			} else {
				console.log('error');
				res.redirect('/c-start');
			}
		}).catch(err => console.error(err));
	} else {
		console.log('error');
		res.redirect('/c-start');
	}
});

app.get('/user', (req, res) => {
	const url = `https://api.twitch.tv/helix/users/extensions?user_id=101223367`;
	twitchOAuth.getEndpoint(url)
		.then(json => res.status(200).json(json));
});
app.get('/streams', (req, res) => {
	const url = `https://api.twitch.tv/helix/streams`;
	twitchOAuth.getEndpoint(url)
		.then(json => res.status(200).json(json));
});
app.get('/follows', (req, res) => {
	const url = `https://api.twitch.tv/helix/users/follows?from_id=127816533`;
	twitchOAuth.getEndpoint(url)
		.then(json => res.status(200).json(json));
});

// ####################################################
// ##################### END ##########################
// ############### TWITCH OAUATH ######################
// ####################################################
*/
