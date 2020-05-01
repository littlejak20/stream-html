function startRenderPage(strPageName) {
var socket = io();

var strOverlayClass = '.overlay';
var strContainerClass = '.container';

var strProfileNameShowPlaceClass = '#profileNameShowPlace';

var strFormProfileClass = 'form#formProfile';
var strFormSourcesClass = '#formSources form';
var strFormAddButtonClass = '#profileAdd';
var strFormLoadButtonClass = '#profileLoad';
var strFormSaveButtonClass = '#profileSave';

var arraySourceItems = ['name', 'platform', 'type', 'muted', 'volume'];

var players = { player1: '', player2: '', player3: '', player4: '', player5: '', player6: '', player7: '', player8: '', player9: '', player10: '' };
var youtubePlayerIndex = 0;
var dictClientConfig = {};
var arrayClientProfileNames = [];

var arrayPlayerForceHighestQuality = [1,2]; // FOR - setQuality for twicth streams

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
		return false;
	}
// Helpers - END

function getDictFormProfile() {
	var formProfile = $(strFormProfileClass);
	return dictFormProfile = {
		name: formProfile.find('[name="name"]').val(),
		select: formProfile.find('[name="select"]').val(),
	};
}
function getArrayFormSources() {
	var arrayTmpSources = [
		{ // 0 attention: not set 
			name: '',
			volume: 0.0,
		},
	];
	$(strFormSourcesClass).each(function(index, form) {
		var formContainer = $(form);
		var dictTmpSource = {};

		$.each(arraySourceItems, function(index, fieldname) {
		});
		$.each(arraySourceItems, function(index, fieldname) {
			var inputElement = formContainer.find('[name="'+fieldname+'"]');
			var inputType = inputElement.attr('type');

			if (inputType == 'checkbox') {
				dictTmpSource[fieldname] = inputElement.is(':checked');
			} else {
				dictTmpSource[fieldname] = inputElement.val();
			}
		});
		arrayTmpSources.push(dictTmpSource);

		//if (dictServerSource.name.indexOf('http') > 0 || dictServerSource.name.indexOf('https') > 0) {}
	});
	return arrayTmpSources;
}
function getDictAllFormData() {
	return {
		formProfile: getDictFormProfile(),
		sources: getArrayFormSources(),
	};
}

socket.on('config reload', function(dictServerConfig) {
	console.log('config reload', dictServerConfig);

	// for site config - source form
	$.each(dictServerConfig.sources, function(indexServerSource, dictServerSource) {
		console.log('setFormSource ==>', indexServerSource, dictServerSource);
		if (!dictCheck(dictServerSource)) return false;

		var formContainer = $(strFormSourcesClass+'[data-id="'+indexServerSource+'"]');
		if (formContainer.length > 0) {
			$.each(arraySourceItems, function(index, fieldname) {
				var inputElement = formContainer.find('[name="'+fieldname+'"]');
				var inputType = $(inputElement).attr('type');
				if (inputType == 'checkbox') {
					inputElement.prop('checked', dictServerSource[fieldname]);
				} else {
					inputElement.val(dictServerSource[fieldname]);
				}
			});
		}
	});

	/*
	 * At this position it is checked whether config dict from the server and client are the same.
	 * If yes, then end the function here.
	 */
	//if (objectsAreEqual(dictServerConfig, dictClientConfig)) return false; // FOR - setQuality for twicth streams
	
	if (dictServerConfig.name != dictClientConfig.name) {
		var formProfile = $(strFormProfileClass);
		//formProfile.find('[name="name"]').val(dictServerConfig.name);
		$(strProfileNameShowPlaceClass).html(dictServerConfig.name);
	}

	// for site view/config - mode
	if (dictServerConfig.modeName != dictClientConfig.modeName) {
		console.log('setModeName ==>', dictServerConfig.modeName);
		var objContainer = $(strContainerClass+'.main');
		objContainer.removeAttr('class');
		objContainer.removeAttr('style');
		objContainer.addClass(dictServerConfig.modeName+' main');

		console.log(dictServerConfig.modeName.split(' ')[1], $(strOverlayClass+' .mode a.'+dictServerConfig.modeName));
		$(strOverlayClass+' .mode a').removeClass('is-active');
		$(strOverlayClass+' .mode a.'+dictServerConfig.modeName.split(' ')[1]).addClass('is-active');
	}

	// for site view - player
	//if (!objectsAreEqual(dictServerConfig.sources, dictClientConfig.sources)) { // FOR - setQuality for twicth streams
		$.each(dictServerConfig.sources, function(indexServerSource, dictServerSource) {
			console.log('setPlayerContainer ==>', indexServerSource, dictServerSource);
			if (!dictCheck(dictServerSource)) return false;

			var dictClientSource = [];
			var waitTimeMsec = 0;
			if (arrayCheck(dictClientConfig.sources)) dictClientSource = dictClientConfig.sources[indexServerSource];
			//if (objectsAreEqual(dictServerSource, dictClientSource)) return false; // error?

			var strServerSourceName = String(dictServerSource.name).trim();
			var strClientSourceName = String(dictClientSource.name).trim();

			var boolHasName = (dictServerSource.name.length > 0);
			var boolChangeVideoPlayer = (
				strServerSourceName !== strClientSourceName ||
				dictServerSource.platform !== dictClientSource.platform ||
				dictServerSource.type !== dictClientSource.type
			);
			var boolChangeVolume = (dictServerSource.volume !== dictClientSource.volume);
			var boolOnlyUseIframe = false;

			var dictPlayerConfig = {};
			var tmpContainerName = '';
			
			var playerContainer = $(strContainerClass+'.main [data-id="'+indexServerSource+'"]');
			if (playerContainer.length > 0) {

				if (boolChangeVideoPlayer) {
					playerContainer.html('');
					players['player'+indexServerSource] = '';
				}

				if (strServerSourceName.indexOf('http') <= 0) {
					if (dictServerSource.platform == 'twitch') {

						if (boolChangeVideoPlayer && boolHasName) {
							dictPlayerConfig.parent = ['https://twicth.tv'];

							if (dictServerSource.type == 'stream') {
								dictPlayerConfig.channel = strServerSourceName;
							} else if (dictServerSource.type == 'video') {
								dictPlayerConfig.video = strServerSourceName;
							} else if (dictServerSource.type == 'playlist') {
								dictPlayerConfig.collection = strServerSourceName;
							} else {
								boolOnlyUseIframe = true;
							}

							if (!boolOnlyUseIframe) {
								players['player'+indexServerSource] = new Twitch.Player('player'+indexServerSource, dictPlayerConfig);
								waitTimeMsec = 2000;
								boolChangeVolume = true;
							}
						}

						if (!boolOnlyUseIframe) {
							if (boolChangeVolume) {
								(async() => {
								try {
									var waitIndex = 0;
									while(!functionCheck(players['player'+indexServerSource].setVolume) && waitIndex <= 30) {
										waitIndex++;
										await new Promise(resolve => setTimeout(resolve, 1000));
									}

									if (!functionCheck(players['player'+indexServerSource].setVolume)) return false;

									var videoVolume = 0.0;
									if (dictServerSource.volume > 0) videoVolume = dictServerSource.volume;
									players['player'+indexServerSource].setVolume(videoVolume);
								} catch(e) { console.error('wait error ==> changeVolume', e); }
								})();
							}

							// setQuality for twicth streams - START
							(async() => {
								try {
								var waitIndex = 0;
								while(!functionCheck(players['player'+indexServerSource].getQualities) && waitIndex <= 30) {
									waitIndex++;
									await new Promise(resolve => setTimeout(resolve, 1000));
								}

								if (!functionCheck(players['player'+indexServerSource].getQualities)) return false;

								waitIndex = 0;
								while(players['player'+indexServerSource].getQualities().length < 1 && waitIndex <= 30) {
									waitIndex++;
									await new Promise(resolve => setTimeout(resolve, 1000));
								}

								if (players['player'+indexServerSource].getQualities().length < 1) return false;

								var twitchQualities = players['player'+indexServerSource].getQualities();
								if (arrayPlayerForceHighestQuality.indexOf(indexServerSource) >= 0) {
									players['player'+indexServerSource].setQuality(twitchQualities[1]['group']);
								} else {
									players['player'+indexServerSource].setQuality(twitchQualities[0]['group']);
								}
								} catch(e) { console.error('wait error ==> setQuality', e); }
							})();
							// setQuality for twicth streams - END
						}

					} else if (dictServerSource.platform == 'youtube') {

						if (boolChangeVideoPlayer && boolHasName) {
							dictPlayerConfig.playerVars = {
								autoplay: 1,
								controls: 1,
								playsinline: 1,
								cc_load_policy: 0,
								iv_load_policy: 3,
								origin: 'https://www.youtube.com',
							};

							if (dictServerSource.type == 'stream' || dictServerSource.type == 'video') {
								if (strServerSourceName.indexOf(',') >= 0) {
									dictPlayerConfig.playerVars.listType = 'playlist';
									dictPlayerConfig.playerVars.playlist = strServerSourceName;
								} else {
									dictPlayerConfig.videoId = strServerSourceName;
								}
							} else if (dictServerSource.type == 'playlist') {
								dictPlayerConfig.playerVars.listType = 'playlist';
								if (strServerSourceName.indexOf(',') >= 0) {
									dictPlayerConfig.playerVars.playlist = strServerSourceName;
								} else {
									dictPlayerConfig.playerVars.list = strServerSourceName;
								}
							} else {
								boolOnlyUseIframe = true;
							}

							if (!boolOnlyUseIframe) {
								tmpContainerName = 'youtubeplayer'+(youtubePlayerIndex++);
								playerContainer.append('<div id="'+tmpContainerName+'"></div>');
								
								players['player'+indexServerSource] = new YT.Player(tmpContainerName, dictPlayerConfig);
								waitTimeMsec = 2000;
								boolChangeVolume = true;

								// Start Video - START
								(async() => {
								try {
									var waitIndex = 0;
									while(!functionCheck(players['player'+indexServerSource].playVideo) && waitIndex <= 30) {
										waitIndex++;
										await new Promise(resolve => setTimeout(resolve, 1000));
									}

									if (!functionCheck(players['player'+indexServerSource].playVideo)) return false;

									players['player'+indexServerSource].playVideo();
								} catch(e) { console.error('wait error ==> changeVolume', e); }
								})();								
								// Start Video - END
							}
						}

						if (!boolOnlyUseIframe) {
							if (boolChangeVolume) {
								setTimeout(function() {
									var videoVolume = 0;
									if (dictServerSource.volume > 0) videoVolume = dictServerSource.volume * 100;
									players['player'+indexServerSource].setVolume(videoVolume);
								}, waitTimeMsec);

								(async() => {
								try {
									var waitIndex = 0;
									while(!functionCheck(players['player'+indexServerSource].setVolume) && waitIndex <= 30) {
										waitIndex++;
										await new Promise(resolve => setTimeout(resolve, 1000));
									}

									if (!functionCheck(players['player'+indexServerSource].setVolume)) return false;

									var videoVolume = 0.0;
									if (dictServerSource.volume > 0) videoVolume = dictServerSource.volume;
									players['player'+indexServerSource].setVolume(videoVolume);
								} catch(e) { console.error('wait error ==> changeVolume', e); }
								})();
							}
						}
					} else { boolOnlyUseIframe = true }
				} else {
					boolOnlyUseIframe = true;
				}
			}

			if (boolOnlyUseIframe && boolChangeVideoPlayer && boolHasName) {
				playerContainer.html('<iframe src="'+strServerSourceName+'"></iframe>');
			}
		});
	//}

	dictClientConfig = dictServerConfig;
	console.log(JSON.stringify(dictClientConfig));
});
socket.on('config onlyset', function(dictServerConfig) {
	dictClientConfig = dictServerConfig;
});

socket.on('profileName reload', function(arrayServerProfileNames) {
	console.log('profileName reload', arrayServerProfileNames);
		
	var formProfile = $(strFormProfileClass);
	var strSelectOptions = '';
	$.each(arrayServerProfileNames, function(index, profile) {
		strSelectOptions += 
			'<option name="'+profile.name+'"'+
			(profile.name == dictClientConfig.name ? ' selected' : '')+
			'>'+profile.name+'</option>';
	});
	formProfile.find('[name="select"]').html(strSelectOptions);

	arrayClientProfileNames = arrayServerProfileNames;
});
socket.on('profileName onlyset', function(arrayServerProfileNames) {
	arrayClientProfileNames = arrayServerProfileNames;
});

$(strFormAddButtonClass).on('click', function(e) {
	console.log('addProfile submit -->'+strFormLoadButtonClass);
	socket.emit('addProfile submit', $.extend({}, getDictAllFormData()));
});

$(strFormLoadButtonClass).on('click', function(e) {
	console.log('loadProfile submit --> '+strFormLoadButtonClass);
	socket.emit('loadProfile submit', $.extend({}, getDictAllFormData()));
});

$(strFormSaveButtonClass).on('click', function(e) {
	console.log('saveProfile submit --> '+strFormSaveButtonClass);
	e.preventDefault();
	socket.emit('saveProfile submit', $.extend({}, getDictAllFormData()));
});

$(strFormSourcesClass+' [name="volume"]').on('change.playerVolume', function(e) {
	console.log('saveProfile submit --> '+strFormSourcesClass+' [name="volume"]');
	e.preventDefault();
	socket.emit('saveProfile submit', $.extend({}, getDictAllFormData()));
});

$(strOverlayClass+' .mode a').on('click', function(e) {
	e.preventDefault();
	socket.emit('mode click', $(this).attr('class'));
});

var videoId0 = -1;
var videoId1 = -1;
$(strOverlayClass+' .js-switcher a').on('click', function(e) {
	if (e !== undefined) e.preventDefault();
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
	var dictSource0 = dictClientConfig.sources[arrVideoIds[0]];
	var dictSource1 = dictClientConfig.sources[arrVideoIds[1]];

	videoContainer0.attr('data-id', arrVideoIds[1]);
	videoContainer1.attr('data-id', arrVideoIds[0]);
	videoContainer0.attr('id', idName1);
	videoContainer1.attr('id', idName0);
	players['player'+arrVideoIds[0]] = player1;
	players['player'+arrVideoIds[1]] = player0;
	dictClientConfig.sources[arrVideoIds[0]] = dictSource1;
	dictClientConfig.sources[arrVideoIds[1]] = dictSource0;

	socket.emit('video switcher finish');
});

$(strOverlayClass+' .js-reloader a').on('click', function(e) {
	e.preventDefault();
	socket.emit('video reloader', $(this).data('id'));
});



// Fullscreen - START
	var fullElem = document.documentElement;

	/* View in fullscreen */
	function openFullscreen() {
		console.log('openFullscreen');
		if (fullElem.requestFullscreen) {
			fullElem.requestFullscreen();
		} else if (fullElem.mozRequestFullScreen) { /* Firefox */
			fullElem.mozRequestFullScreen();
		} else if (fullElem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
			fullElem.webkitRequestFullscreen();
		} else if (fullElem.msRequestFullscreen) { /* IE/Edge */
			fullElem.msRequestFullscreen();
		}
	}

	/* Close fullscreen */
	function closeFullscreen() {
		console.log('closeFullscreen');
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.mozCancelFullScreen) { /* Firefox */
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
			document.webkitExitFullscreen();
		} else if (document.msExitFullscreen) { /* IE/Edge */
			document.msExitFullscreen();
		}
	}

	var boolIsFullscreen = false;
	$('.fullscreenall').on('click', function(e) {
		e.preventDefault();
		console.log('click fullscreen');
		if (!boolIsFullscreen) {
			openFullscreen();
		} else {
			closeFullscreen();
		}
		boolIsFullscreen = !boolIsFullscreen;
	});
// Fullscreen - END
}