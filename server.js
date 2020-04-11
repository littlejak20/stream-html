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
			name: 'tobinatorlp',
			platform: 'twitch',
			type: 'stream',
			volume: 0.0,
		},
		{
			name: 'royalphunk',
			platform: 'twitch',
			type: 'stream',
			volume: 1.0,
		},
		{
			name: 'https://blabla.de',
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

	socket.emit('mode click', dictCurConfig.modeName);
	socket.emit('config all', dictCurConfig);

	socket.on('mode click', function(strModeName) {
		console.log('mode click', strModeName);
		dictCurConfig.modeName = strModeName;
		socket.emit('config all', dictCurConfig);
	});

	socket.on('videourl submit', function(dict) {
		console.log('videourl submit', dict);
		dictCurConfig.videos[dict.videoId] = dict.videoUrl;
		socket.emit('config all', dictCurConfig);
	});
	socket.on('player volumeChange', function(dict) {
		console.log('player volumeChange', dict);
		socket.emit('config all', dictCurConfig);
	});

	socket.on('video switcher', function(arrVideoIds) {
		console.log('video switcher', arrVideoIds);
		var strVideoUrl0 = dictCurConfig.videos[arrVideoIds[0]];
		var strVideoUrl1 = dictCurConfig.videos[arrVideoIds[1]];
		dictCurConfig.videos[arrVideoIds[0]] = strVideoUrl1;
		dictCurConfig.videos[arrVideoIds[1]] = strVideoUrl0;
		socket.emit('config all', dictCurConfig);
	});

	socket.on('video reloader', function(intVideoId) {
		console.log('video reloader', intVideoId);
		socket.emit('config all', dictCurConfig);
	});
});