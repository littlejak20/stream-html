var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var userCount = 0;

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/view.html');
});

http.listen(4000, function () {
	console.log('listen on *:4000');
});


var dictCurConfig = {
	modeName: 'container top3-bottom2',
	videos: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, ],
};

io.on('connection', function(socket) {
	userCount++;
	console.log('connected', socket.id, userCount);

	socket.on('disconnect', function() {
		userCount--;
		console.log('disconnected', socket.id, userCount);
	});

	socket.emit('mode click', dictCurConfig.modeName);
	dictCurConfig.videos.forEach(function(strVideoUrl, intVideoId) {
		if (strVideoUrl!==undefined) {
			socket.emit('videourl submit', {
				videoId: intVideoId,
				videoUrl: strVideoUrl,
			});
		}
	});

	socket.on('mode click', function(strModeName) {
		console.log('mode click', strModeName);
		io.emit('mode click', strModeName);
		dictCurConfig.modeName = strModeName;
	});

	socket.on('videourl submit', function(dict) {
		console.log('mode click', dict);
		io.emit('videourl submit', dict);
		dictCurConfig.videos[dict.videoId] = dict.videoUrl;
	});

	socket.on('video switcher', function(arrVideoIds) {
		var strVideoUrlA = dictCurConfig.videos[arrVideoIds[0]];
		var strVideoUrlB = dictCurConfig.videos[arrVideoIds[1]];

		dictCurConfig.videos[arrVideoIds[0]] = strVideoUrlB;
		dictCurConfig.videos[arrVideoIds[1]] = strVideoUrlA;

		io.emit('videourl submit', {
			videoId: arrVideoIds[0],
			videoUrl: dictCurConfig.videos[arrVideoIds[0]],
		});
		io.emit('videourl submit', {
			videoId: arrVideoIds[1],
			videoUrl: dictCurConfig.videos[arrVideoIds[1]],
		});
	});

	socket.on('video reloader', function(intVideoId) {
		if (dictCurConfig.videos[intVideoId]!==undefined) {
			io.emit('videourl submit', {
				videoId: intVideoId,
				videoUrl: dictCurConfig.videos[intVideoId],
			});
		}
	});
});