var socket = io();

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
console.log(players);

var strOverlayClass = '.overlay';

$(strOverlayClassSliderLR).attr({
	"max": intWidthMaxProzent,
	"min": 100-intWidthMaxProzent
});
$(strOverlayClassSliderTB).attr({
	"max": intHeightMaxProzent,
	"min": 100-intHeightMaxProzent
});

var strContainerClass = '.container';

var intLeftBeforeGlo = intLeftCurentGlo;
var intRightBeforeGlo = intRightCurentGlo;
var intTopBeforeGlo = intTopCurentGlo;
var intBottomBeforeGlo = intBottomCurentGlo;

// isNumber
$(strOverlayClassInput).on('keypress',function(e){
	var charCode = (e.which) ? e.which : e.keyCode
	if (charCode > 31 && (charCode < 48 || charCode > 57))
		return false;
	return true;
});

$(strOverlayClass+' .mode a').on('click', function(e) {
	e.preventDefault();
	socket.emit('mode click', $(this).attr('class'));
});
socket.on('mode click', function(strModeName) {
	console.log('mode click', strModeName);
	var objContainer = $(strContainerClass+'.main');
	objContainer.removeAttr('class');
	objContainer.removeAttr('style');
	objContainer.addClass(strModeName+' main');

	console.log(strModeName.split(' ')[1], $(strOverlayClass+' .mode a.'+strModeName));
	$(strOverlayClass+' .mode a').removeClass('is-active');
	$(strOverlayClass+' .mode a.'+strModeName.split(' ')[1]).addClass('is-active');
});

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
socket.on('videourl submit', function(dict) {
	console.log('videourl submit', dict);
	var playerContainer = $(strContainerClass+'.main [data-id="'+dict.videoId+'"]');

	if (dict.videoUrl.length > 0 && playerContainer.length > 0) {
		playerContainer.html('');
		players['player'+dict.videoId] = '';

		if (dict.videoUrl.indexOf('http') > 0 || dict.videoUrl.indexOf('https') > 0) {
			players['player'+dict.videoId] = dict.videoUrl;
			playerContainer.html('<iframe data-id="'+dict.videoId+'" src="'+dict.videoUrl+'" allow="accelerometer; autoplay; encrypted-media; gyroscope"></iframe>');
		} else {
			players['player'+dict.videoId] = new Twitch.Player('player'+dict.videoId, { channel: dict.videoUrl});

			setTimeout(function() {
				var videoVolume = 0.0;
				if (dict.videoVolume > 0) videoVolume = dict.videoVolume;
				players['player'+dict.videoId].setVolume(videoVolume);
			}, 1000);
		}
	}

	$(strOverlayClass+' .form form[data-id="'+dict.videoId+'"] input[type="text"]').val(dict.videoUrl);
});

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