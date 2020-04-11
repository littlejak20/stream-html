var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

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

http.listen(4000, function () {
	console.log('listen on *:4000');
});

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
	videos: ['', // attention: not set 
		'gronkh', // 1
		'xpandorya', // 2
		'tobinatorlp', // 3
		'royalphunk', // 4
		'', // 5
		'', // 6
		'', // 7
		'', // 8
		'', // 9
		'', // 10
		'', // 11
		'', // 12
		'', // 13
		'', // 14
		'', // 15
		'', // 16
	],
	sources: [ 
		{ // 0 attention: not set 
			name: '',
			volume: 0.0,
		},
		{ // 1
			name: 'gronkh',
			platform: 'twitch',
			type: 'stream',
			volume: 0.5,
		},
		{ // 2
			name: 'xpandorya',
			platform: 'twitch',
			type: 'stream',
			volume: 0.0,
		},
		{ // 3
			name: 'tobinatorlp',
			platform: 'twitch',
			type: 'stream',
			volume: 0.0,
		},
		{ // 4
			name: 'royalphunk',
			platform: 'twitch',
			type: 'stream',
			volume: 0.0,
		},
		{ // 5
			name: '',
			volume: 0.0,
		},
		{ // 6
			name: '',
			volume: 0.0,
		},
		{ // 7
			name: '',
			volume: 0.0,
		},
		{ // 8
			name: '',
			volume: 0.0,
		},
		{ // 9
			name: '',
			volume: 0.0,
		},
		{ // 10
			name: '',
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

	/*socket.on('videourl submit', function(dict) {
		console.log('videourl submit', dict);
		dictCurConfig.videos[dict.videoId] = dict.videoUrl;
		io.emit('config reload', dictCurConfig);
	});*/

	socket.on('player volumeChange', function(dict) {
		console.log('player volumeChange', dict);
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