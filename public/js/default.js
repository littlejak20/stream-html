var socket = io();

//console.log('same', (JSON.stringify({ test1: '' }) === JSON.stringify({ test1: '' })));
//console.log('other', (JSON.stringify({ test1: '' }) === JSON.stringify({ test2: '' })));

var strOverlayClass = '.overlay';
var strContainerClass = '.container';
var players = {
	player1: '',
	player2: '',
	player3: '',
	player4: '',
	player5: '',
	player6: '',
	player7: '',
	player8: '',
	player9: '',
	player10: '',
	player11: '',
	player12: '',
	player13: '',
	player14: '',
	player15: '',
	player16: '',
}
var dictClientConfig = {};

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

socket.on('config all', function(dictServerConfig) {
	console.log('config all', dictServerConfig);
	if (objectsAreEqual(dictServerConfig, dictClientConfig)) return false;

	if (dictServerConfig.modeName != dictClientConfig.modeName) setModeName(dictServerConfig.modeName);

	if (!objectsAreEqual(dictServerConfig.sources, dictClientConfig.sources)) {
		$.each(dictServerConfig.sources, function(indexServerSource, dictServerSource) {
			setPlayerContainer(indexServerSource, dictServerSource);
		});
	}

	dictClientConfig = dictServerConfig;
});


$(strOverlayClass+' .mode a').on('click', function(e) {
	e.preventDefault();
	socket.emit('mode click', $(this).attr('class'));
});
function setModeName(strModeName) {
	console.log('setModeName ==>', strModeName);
	var objContainer = $(strContainerClass+'.main');
	objContainer.removeAttr('class');
	objContainer.removeAttr('style');
	objContainer.addClass(strModeName+' main');

	console.log(strModeName.split(' ')[1], $(strOverlayClass+' .mode a.'+strModeName));
	$(strOverlayClass+' .mode a').removeClass('is-active');
	$(strOverlayClass+' .mode a.'+strModeName.split(' ')[1]).addClass('is-active');
};

function overlayFormEmit(e, form, strEmitName) {
	e.preventDefault();
	socket.emit(strEmitName, {
		videoId: form.data('id'),
		videoUrl: form.find('input[name="vurl"]').val(),
		videoVolume: parseFloat(form.find('input[name="vvolume"]').val()),
	});
}

$(strOverlayClass+' .form form').on('submit', function(e) {
	overlayFormEmit(e, $(this), 'videourl submit');
});
function setPlayerContainer(indexServerSource, dictServerSource) {
	console.log('setPlayerContainer ==>', indexServerSource, dictServerSource);

	var dictClientSource = [];
	if (arrayCheck(dictClientConfig.sources)) dictClientSource = dictClientConfig.sources[indexServerSource];
	if (objectsAreEqual(dictServerSource, dictClientSource)) return false;
	var playerContainer = $(strContainerClass+'.main [data-id="'+(indexServerSource+1)+'"]');

	if (dictServerSource.name.length > 0 && playerContainer.length > 0) {

		if (dictServerSource.name.indexOf('http') > 0 || dictServerSource.name.indexOf('https') > 0) {
			if (dictServerSource.name === dictClientSource.name) {
				playerContainer.html('');
				playerContainer.html('<iframe data-id="'+(indexServerSource+1)+'" src="'+dictServerSource.name+'" allow="accelerometer; autoplay; encrypted-media; gyroscope"></iframe>');
			}
		} else {
			if (dictServerSource.name != dictClientSource.name) {
				playerContainer.html('');
				players['player'+(indexServerSource+1)] = '';
				players['player'+(indexServerSource+1)] = new Twitch.Player('player'+(indexServerSource+1), { channel: dictServerSource.name});
			}

			if (dictServerSource.volume != dictClientSource.volume) {
				setTimeout(function() {
					var videoVolume = 0.0;
					if (dictServerSource.volume > 0) videoVolume = dictServerSource.volume;
					players['player'+(indexServerSource+1)].setVolume(videoVolume);
				}, 1000);
			}
		}
	}
}

$(strOverlayClass+' .form form').on('change.playerVolume', function(e) {
	overlayFormEmit(e, $(this), 'player volumeChange');
});
socket.on('player volumeChange', function(dict) {
	console.log('player volumeChange', dict);
	var playerContainer = $(strContainerClass+'.main [data-id="'+dict.videoId+'"]');

	if (dict.videoUrl.length > 0 && playerContainer.length > 0) {
		if (dict.videoUrl.indexOf('http') > 0 || dict.videoUrl.indexOf('https') > 0) {
			// do nothing
		} else {
			var videoVolume = 0.0;
			if (dict.videoVolume > 0) videoVolume = dict.videoVolume;
			players['player'+dict.videoId].setVolume(videoVolume);
		}
	}
});

var videoId0 = -1;
var videoId1 = -1;
$(strOverlayClass+' .js-switcher a').on('click', function(e) {
	e.preventDefault();
	var videoId = $(this).data('id');

	if (videoId0 <= -1) {
		videoId0 = videoId;
	} else {
		videoId1 = videoId;
	}
	console.log(videoId0, videoId1);

	if (videoId0 > -1 & videoId1 > -1) {
		socket.emit('video switcher', [videoId0, videoId1]);
		videoId0 = -1;
		videoId1 = -1;
	}
});
socket.on('video switcher', function(arrVideoIds) {
	console.log('video switcher', arrVideoIds);

	var videoContainer0 = $(strContainerClass+'.main [data-id="'+arrVideoIds[0]+'"]');
	var videoContainer1 = $(strContainerClass+'.main [data-id="'+arrVideoIds[1]+'"]');
	var idName0 = videoContainer0.attr('id');
	var idName1 = videoContainer1.attr('id');
	var player0 = players['player'+arrVideoIds[0]];
	var player1 = players['player'+arrVideoIds[1]];

	videoContainer0.attr('data-id', arrVideoIds[1]);
	videoContainer1.attr('data-id', arrVideoIds[0]);
	videoContainer0.attr('id', idName1);
	videoContainer1.attr('id', idName0);
	players['player'+arrVideoIds[0]] = player1;
	players['player'+arrVideoIds[1]] = player0;
});

// use socket.on - videourl submit
$(strOverlayClass+' .js-reloader a').on('click', function(e) {
	e.preventDefault();
	socket.emit('video reloader', $(this).data('id'));
});