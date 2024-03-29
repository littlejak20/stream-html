//https://stackoverflow.com/questions/27670401/using-jquery-this-with-es6-arrow-functions-lexical-this-binding/34199426#34199426

//import regeneratorRuntime from "regenerator-runtime";
//import * as Sqrl from 'squirrelly'

GLOBAL_SITE = String(GLOBAL_SITE).toLowerCase();
console.log(GLOBAL_SITE);

/*let onYouTubeIframeAPIReady = () => {
	console.log('onYouTubeIframeAPIReady');
	startRenderPage();
}
if (GLOBAL_SITE === 'config') startRenderPage();*/

let startRenderPage = () => {
console.log('startRenderPage');
const socket = io();

const strOverlayClass = '.overlay';
const strContainerClass = '.container';

const strProfileNameShowPlaceClass = '#profileNameShowPlace';

const strFormProfileClass = 'form#formProfile';
const strFormSourcesContainerClass = '#formSources';
const strFormSourcesClass = strFormSourcesContainerClass+' form';
const strFormAddButtonClass = '#profileAdd';
const strFormLoadButtonClass = '#profileLoad';
const strFormSaveButtonClass = '#profileSave';
const strModeItemClass = strOverlayClass+' .mode .mode-item .container';

const strChannelNamesClass = '#channelNamesTarget';

const arraySourceItems = ['name', 'platform', 'type', 'muted', 'volume'];
const arraySourceFloatItems = ['volume'];
const arrayPlayerForceHighestQuality = [1,2]; // FOR - setQuality for twicth streams

let players = { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: '' };
let youtubePlayerIndex = 0;
let dictClientConfig = {};
let arrayClientProfileNames = [];

let flgTwitchChannelNamesSet = false;
let intTwitchChannelCurrentSourceId = -1;

let twitchEvents = [];
try {
	twitchEvents = [
		{
			name: Twitch.Player.CAPTIONS,
			volumeChange: false,
			qualityChange: false,
		},
		{
			name: Twitch.Player.ENDED,
			volumeChange: false,
			qualityChange: false,
		},
		{
			name: Twitch.Player.PAUSE,
			volumeChange: false,
			qualityChange: false,
		},
		{
			name: Twitch.Player.PLAY,
			volumeChange: false,
			qualityChange: false,
		},
		{
			name: Twitch.Player.PLAYBACK_BLOCKED,
			volumeChange: false,
			qualityChange: false,
		},
		{
			name: Twitch.Player.PLAYING,
			volumeChange: false,
			qualityChange: false,
		},
		{
			name: Twitch.Player.OFFLINE,
			volumeChange: false,
			qualityChange: false,
		},
		{
			name: Twitch.Player.ONLINE,
			volumeChange: true,
			qualityChange: true,
		},
		{
			name: Twitch.Player.READY,
			volumeChange: false,
			qualityChange: false,
		},
	];
} catch(e) { console.error(e) }

// Helpers - START
	let objectsAreEqual = (obj1, obj2) => (JSON.stringify(obj1) === JSON.stringify(obj2));
	// https://stackoverflow.com/questions/38304401/javascript-check-if-dictionary/39339225#39339225
	let dictCheck = (object, strObjectName) => {
		if (object!==undefined && object!==null && typeof object==='object' && !(object instanceof Array) && !(object instanceof Date)) return true;
		return false;
	}
	let arrayCheck = (object, strObjectName) => {
		if (object!==undefined && object!==null && typeof object==='object' && object instanceof Array) return true;
		return false;
	}
	let funcCheck = (object, strObjectName) => {
		if (object!==undefined && object!==null && object instanceof Function) return true;
		return false;
	}
// Helpers - END

let getDictFormProfile = () => {
	var formProfile = $(strFormProfileClass);
	return {
		name: formProfile.find('[name="name"]').val(),
		select: formProfile.find('[name="select"]').val(),
	};
}
let getArrayFormSources = () => {
	var arrayTmpSources = [
		{ // 0 attention: not set 
			name: '',
			volume: 0.0,
		},
	];
	$(strFormSourcesClass).each((index, form) => {
		var formContainer = $(form);
		var dictTmpSource = {};

		arraySourceItems.forEach((fieldname, index) => {
			var inputElement = formContainer.find('[name="'+fieldname+'"]');
			var inputType = inputElement.attr('type');

			if (inputType === 'checkbox') {
				dictTmpSource[fieldname] = inputElement.is(':checked');
			} else {
				if (arraySourceFloatItems.indexOf(fieldname) >= 0) {
					console.log('float value');
					dictTmpSource[fieldname] = parseFloat(inputElement.val());
				} else {
					console.log('string value');
					dictTmpSource[fieldname] = inputElement.val();
				}
			}
		});
		arrayTmpSources.push(dictTmpSource);

		//if (dictServerSource.name.indexOf('http') > 0 || dictServerSource.name.indexOf('https') > 0) {}
	});
	return arrayTmpSources;
}
let getDictAllFormData = () => {
	return {
		formProfile: getDictFormProfile(),
		sources: getArrayFormSources(),
	};
}

let setTwitchVolume = (sourceIndex, dictSource) => {
	(async () => {
	try {
		var waitIndex = 0;
		while(!funcCheck(players[sourceIndex].setVolume) && waitIndex <= 30) {
			waitIndex++;
			console.log('twitch volume', players[sourceIndex], waitIndex);
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
		if (!funcCheck(players[sourceIndex].setVolume)) return false;

		if (dictSource.volume > 0.0) {
			players[sourceIndex].setVolume(dictSource.volume);
			players[sourceIndex].setMuted(false);
		} else {
			players[sourceIndex].setMuted(true);
		}
	} catch(e) { console.error(e); }
	})();
}
let setTwitchQuality = (sourceIndex, dictSource) => {
	(async () => {
	try {
		var waitIndex = 0;
		while(!funcCheck(players[sourceIndex].getQualities) && waitIndex <= 30) {
			waitIndex++;
			await new Promise(resolve => setTimeout(resolve, 1000));
		}

		if (!funcCheck(players[sourceIndex].getQualities)) return false;

		waitIndex = 0;
		while(players[sourceIndex].getQualities().length < 1 && waitIndex <= 30) {
			waitIndex++;
			await new Promise(resolve => setTimeout(resolve, 1000));
		}

		if (players[sourceIndex].getQualities().length < 1) return false;

		var twitchQualities = players[sourceIndex].getQualities();
		if (arrayPlayerForceHighestQuality.indexOf(sourceIndex) >= 0) {
			console.log('high quality');
			players[sourceIndex].setQuality(twitchQualities[1]['group']);
		} else {
			players[sourceIndex].setQuality(twitchQualities[0]['group']);
		}
	} catch(e) { console.error(e) }
	})();
}
let addTwitchEventListener = (sourceIndex, dictSource) => {
	console.log('addTwitchEventListener', sourceIndex, dictSource);
	twitchEvents.forEach((event, index) => {
		try {
			players[sourceIndex].addEventListener(event.name, () => {
				console.log('TWITCH EVENT', sourceIndex, event);
				if (event.volumeChange) setTwitchVolume(sourceIndex, dictSource);
				if (event.qualityChange) setTwitchQuality(sourceIndex, dictSource);
			});
		} catch(e) { console.error(e) }
	});
}
let removeTwitchEventListener = (sourceIndex) => {
	console.log('removeTwitchEventListener', sourceIndex);
	twitchEvents.forEach((event, index) => {
		try {
			players[sourceIndex].removeEventListener(event.name);			
		} catch(e) { console.error(e) }
	});
}


socket.on('config reload', dictServerConfig => {
	console.log('config reload', dictServerConfig);

	// for site config - source form
	dictServerConfig.sources.forEach((dictServerSource, indexServerSource) => {
		console.log('setFormSource -->', indexServerSource, dictServerSource);
		if (!dictCheck(dictServerSource)) return false;
		
		var formContainer = $(strFormSourcesClass+'[data-id="'+indexServerSource+'"]');
		if (formContainer.length > 0) {
			arraySourceItems.forEach((fieldname, index) => {
				var inputElement = formContainer.find('[name="'+fieldname+'"]');
				var inputType = $(inputElement).attr('type');
				if (inputType == 'checkbox') {
					inputElement.prop('checked', dictServerSource[fieldname]);
				} else {
					inputElement.val(dictServerSource[fieldname]);
				}
			});

			if (dictServerSource.platform === 'twitch') {
				formContainer.css({
					'background-image': `url('https://static-cdn.jtvnw.net/previews-ttv/live_user_${dictServerSource['name']}-1920x1080.jpg')`,
				});
			} else {
				formContainer.attr('css', '');
			}
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
		console.log('setModeName -->', dictServerConfig.modeName);
		var objContainer = $(strContainerClass+'.main');
		if (objContainer.length > 0) {
			objContainer.removeAttr('class');
			objContainer.removeAttr('style');
			objContainer.addClass(dictServerConfig.modeName+' main');
		}

		var objForm = $(strFormSourcesContainerClass);
		if (objForm.length > 0) {
			objForm.removeAttr('class');
			objForm.removeAttr('style');
			objForm.addClass(dictServerConfig.modeName+' form');
		}

		console.log(dictServerConfig.modeName.split(' ')[1], $(strModeItemClass+'.'+dictServerConfig.modeName));
		$(strModeItemClass).removeClass('is-active');
		$(strModeItemClass+'.'+dictServerConfig.modeName.split(' ')[1]).addClass('is-active');
	}

	// for site view - player
	//if (!objectsAreEqual(dictServerConfig.sources, dictClientConfig.sources)) { // FOR - setQuality for twicth streams
		dictServerConfig.sources.forEach((dictServerSource, indexServerSource) => {
			console.log('setPlayerContainer -->', indexServerSource, dictServerSource);
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
					players[indexServerSource] = '';
				}

				if (strServerSourceName.indexOf('http') <= 0) {
					if (dictServerSource.platform === 'twitch') {
						if (boolHasName) {
							dictPlayerConfig.allowFullScreen = false;
							//dictPlayerConfig.parent = ["10yannick041019", "loacalhost", "youtube.com"];

							if (dictServerSource.type === 'stream') {
								dictPlayerConfig.channel = strServerSourceName;
							} else if (dictServerSource.type === 'video') {
								dictPlayerConfig.video = strServerSourceName;
							} else if (dictServerSource.type === 'playlist') {
								dictPlayerConfig.collection = strServerSourceName;
							} else {
								boolOnlyUseIframe = true;
							}

							if (!boolOnlyUseIframe) {
								if (boolChangeVideoPlayer) {
									players[indexServerSource] = new Twitch.Player('player'+indexServerSource, dictPlayerConfig);
								}

								removeTwitchEventListener(indexServerSource);
								addTwitchEventListener(indexServerSource, dictServerSource);

								if (boolChangeVideoPlayer || dictClientSource.forcecUpdateQuality) {
									setTwitchQuality(indexServerSource, dictServerSource);
								}
								setTwitchVolume(indexServerSource, dictServerSource);
							}
						}
					// überprüfe youtube zweig. der ist anders
					} else if (dictServerSource.platform === 'youtube') {

						if (boolHasName) {
							dictPlayerConfig.playerVars = {
								autoplay: 1,
								controls: 1,
								playsinline: 1,
								cc_load_policy: 0,
								iv_load_policy: 3,
							};

							if (dictServerSource.type === 'stream' || dictServerSource.type === 'video') {
								if (strServerSourceName.indexOf(',') >= 0) {
									dictPlayerConfig.playerVars.listType = 'playlist';
									dictPlayerConfig.playerVars.playlist = strServerSourceName;
								} else {
									dictPlayerConfig.videoId = strServerSourceName;
								}
							} else if (dictServerSource.type === 'playlist') {
								dictPlayerConfig.playerVars.listType = 'playlist';
								if (strServerSourceName.indexOf(',') >= 0) {
									dictPlayerConfig.playerVars.playlist = strServerSourceName;
								} else {
									dictPlayerConfig.playerVars.list = strServerSourceName;
								}
							} else {
								boolOnlyUseIframe = true;
							}

							if (boolChangeVideoPlayer && !boolOnlyUseIframe) {
								tmpContainerName = 'youtubeplayer'+(youtubePlayerIndex++);
								playerContainer.append('<div id="'+tmpContainerName+'"></div>');
								
								players[indexServerSource] = new YT.Player(tmpContainerName, dictPlayerConfig);
								waitTimeMsec = 2000;
								boolChangeVolume = true;

								// Start Video - START
								(async () => {
								try {
									var waitIndex = 0;
									while(!funcCheck(players[indexServerSource].playVideo) && waitIndex <= 30) {
										waitIndex++;
										await new Promise(resolve => setTimeout(resolve, 1000));
									}

									if (!funcCheck(players[indexServerSource].playVideo)) return false;

									players[indexServerSource].playVideo();
								} catch(e) { console.error('wait error --> changeVolume', e); }
								})();								
								// Start Video - END
							}
						}

						if (!boolOnlyUseIframe) {
							if (boolChangeVolume) {
								setTimeout(() => {
									var videoVolume = 0.0;
									dictServerSource.volume = parseFloat(dictServerSource.volume);
									if (dictServerSource.volume > 0) videoVolume = dictServerSource.volume * 100;
									players[indexServerSource].setVolume(videoVolume);
								}, waitTimeMsec);

								(async () => {
									try {
										var waitIndex = 0;
										while(!funcCheck(players[indexServerSource].setVolume) && waitIndex <= 30) {
											waitIndex++;
											console.warn('WAIT change youtube set volume')
											await new Promise(resolve => setTimeout(resolve, 1000));
										}

										if (!funcCheck(players[indexServerSource].setVolume)) return false;

										console.warn('SET change youtube set volume')

										var videoVolume = 0.0;
										dictServerSource.volume = parseFloat(dictServerSource.volume);
										if (dictServerSource.volume > 0) videoVolume = dictServerSource.volume;
										players[indexServerSource].setVolume(videoVolume);
									} catch(e) { console.error('wait error --> changeVolume', e); }
								})();
							}
						}
					} else {
						boolOnlyUseIframe = true
					}
				} else {
					boolOnlyUseIframe = true;
				}
			}

			if (boolOnlyUseIframe && boolChangeVideoPlayer && boolHasName) {
				playerContainer.html('<iframe src="'+strServerSourceName+'" allow="autoplay; fullscreen" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
			}
		});
	//}

	dictClientConfig = dictServerConfig;
	console.warn('players --> end', players);
});
socket.on('config onlyset', dictServerConfig => dictClientConfig = dictServerConfig);

socket.on('profileName reload', arrayServerProfileNames => {
	console.log('profileName reload', arrayServerProfileNames);
		
	var formProfile = $(strFormProfileClass);
	var strSelectOptions = '';
	arrayServerProfileNames.forEach((profile, index) => {
		strSelectOptions += 
			'<option name="'+profile.name+'"'+
			(profile.name == dictClientConfig.name ? ' selected' : '')+
			'>'+profile.name+'</option>';
	});
	formProfile.find('[name="select"]').html(strSelectOptions);

	arrayClientProfileNames = arrayServerProfileNames;
});
socket.on('profileName onlyset', arrayServerProfileNames => arrayClientProfileNames = arrayServerProfileNames);

$(strFormAddButtonClass).on('click', e => {
	console.log('addProfile submit -->'+strFormLoadButtonClass);
	socket.emit('addProfile submit', $.extend({}, getDictAllFormData()));
});

$(strFormLoadButtonClass).on('click', e => {
	console.log('loadProfile submit --> '+strFormLoadButtonClass);
	socket.emit('loadProfile submit', $.extend({}, getDictAllFormData()));
});

$(strFormSaveButtonClass).on('click', e => {
	console.log('saveProfile submit --> '+strFormSaveButtonClass);
	e.preventDefault();
	socket.emit('saveProfile submit', $.extend({}, getDictAllFormData()));
});

$(strFormSourcesClass+' [name="volume"]').on('change.playerVolume', e => {
	console.log('saveProfile submit --> '+strFormSourcesClass+' [name="volume"]');
	e.preventDefault();
	socket.emit('saveProfile submit', $.extend({}, getDictAllFormData()));
});

$(strModeItemClass).on('click', e => {
	e.preventDefault();
	var $this = $(e.currentTarget);
	console.warn($($this).attr('class'));
	socket.emit('mode click', $this.attr('class'));
});

var videoId0 = -1;
var videoId1 = -1;
$(`${strFormSourcesClass} .btn-switch`).on('click', e => {
	e.preventDefault();
	var $this = $(e.currentTarget);
	var videoId = $this.parent().data('id');

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
socket.on('video switcher', arrVideoIds => {
	console.log('video switcher', arrVideoIds);

	var videoContainer0 = $(strContainerClass+'.main [data-id="'+arrVideoIds[0]+'"]');
	var videoContainer1 = $(strContainerClass+'.main [data-id="'+arrVideoIds[1]+'"]');
	var idName0 = videoContainer0.attr('id');
	var idName1 = videoContainer1.attr('id');
	var player0 = players[arrVideoIds[0]];
	var player1 = players[arrVideoIds[1]];
	var dictClientSource0 = dictClientConfig.sources[arrVideoIds[0]];
	var dictClientSource1 = dictClientConfig.sources[arrVideoIds[1]];

	// not change quality, if is index in arrayPlayerForceHighestQuality
	if (!(
		arrayPlayerForceHighestQuality.indexOf(arrVideoIds[0]) >= 0 &&
		arrayPlayerForceHighestQuality.indexOf(arrVideoIds[1]) >= 0
	)) {
		dictClientSource0.forcecUpdateQuality = true;
		dictClientSource1.forcecUpdateQuality = true;
	}

	videoContainer0.attr('data-id', arrVideoIds[1]);
	videoContainer1.attr('data-id', arrVideoIds[0]);
	videoContainer0.attr('id', idName1);
	videoContainer1.attr('id', idName0);
	players[arrVideoIds[0]] = player1;
	players[arrVideoIds[1]] = player0;
	dictClientConfig.sources[arrVideoIds[0]] = dictClientSource1;
	dictClientConfig.sources[arrVideoIds[1]] = dictClientSource0;

	socket.emit('video switcher finish');
});

$(`${strFormSourcesClass} .btn-reload`).on('click', e => {
	e.preventDefault();
	var $this = $(e.currentTarget);
	var videoId = $this.parent().data('id');
	socket.emit('video reloader', videoId);
});
socket.on('video reloader', intVideoId => {
	console.log('video reloader', intVideoId);
	dictClientConfig.sources[intVideoId] = { name: '', volume: 0.0 };
	socket.emit('video reloader finish');
});


$('body').on('click', `${strFormSourcesClass} .btn-select-twitch`, {}, e => {
	e.preventDefault();
	if (GLOBAL_SITE !== 'config') return;

	if (!flgTwitchChannelNamesSet) socket.emit('twitch get channelInfosBig');
	flgTwitchChannelNamesSet = true;

	var $this = $(e.currentTarget);
	var formContainer = $this.parent('form');
	intTwitchChannelCurrentSourceId = formContainer.data('id');

	$(strChannelNamesClass).show();

	console.log(intTwitchChannelCurrentSourceId);
});

$('body').on('click', `${strChannelNamesClass} .con-names .item`, {}, e => {
	e.preventDefault();
	if (GLOBAL_SITE !== 'config') return;
	var $this = $(e.currentTarget);

	var channelName = $this.data('channelname');
	var formContainer = $(`${strFormSourcesClass}[data-id='${intTwitchChannelCurrentSourceId}']`);

	formContainer.find(`[name="platform"]`).val('twitch');
	formContainer.find(`[name="type"]`).val('stream');
	formContainer.find(`[name="name"]`).val(channelName);

	intTwitchChannelCurrentSourceId = -1;
	$(strChannelNamesClass).hide();

	console.log(intTwitchChannelCurrentSourceId, formContainer, channelName);
});

$('body').on('click', `${strChannelNamesClass} .btn-close`, {}, e => {
	e.preventDefault();
	if (GLOBAL_SITE !== 'config') return;
	var $this = $(e.currentTarget);

	intTwitchChannelCurrentSourceId = -1;
	$(strChannelNamesClass).hide();
});

$('body').on('click', `${strChannelNamesClass} .btn-reload`, {}, e => {
	e.preventDefault();
	if (GLOBAL_SITE !== 'config') return;
	socket.emit('twitch get channelInfosBig');
});

socket.on('twitch get channelInfosBig', arrayChannelInfosBig => {
	console.log('twitch get channelInfosBig', arrayChannelInfosBig);
	if (GLOBAL_SITE !== 'config') return;

	var flgFilterLive = ($(`${strChannelNamesClass} .filter-live:checked`).length > 0);
	console.log('twitch get channelInfosBig flgFilterLive', flgFilterLive);

	let tmpHtml = '';
	arrayChannelInfosBig.forEach((channel) => {
		console.log(channel.channelInfo.login, channel);
		if (flgFilterLive && !channel.extra.flgLive) return;
		tmpHtml += `<a href="#" class="item" data-channelname="${channel.channelInfo.login}" style="display: flex; margin: 10px; align-items: center;"><img src="${channel.channelInfo.profile_image_url}" style="width: 30px; height: 30px"></img>&nbsp;<span>${channel.channelInfo.display_name}${channel.extra.flgLive ? ' (LIVE)':''} (${channel.streamLive.game_name})</span></a>`
	});
	$(`${strChannelNamesClass} .con-names`).html(tmpHtml);
});




// Fullscreen - START
	var fullElem = document.documentElement;

	/* View in fullscreen */
	let openFullscreen = () => {
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
	let closeFullscreen = () => {
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
	$('.fullscreenall').on('click', e => {
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

if (GLOBAL_SITE === 'view') {
	(async () => {
	//try {
		var waitIndex = 0;
		while(YT.loaded <= 0 && waitIndex <= 15) {
			waitIndex++;
			console.log('wait YT.loaded 1: '+ waitIndex);
			await new Promise(resolve => setTimeout(resolve, 1000));
		}

		if (YT.loaded >= 1) startRenderPage();
	//} catch(e) {}
	})();
} else {
	console.log('else');
	startRenderPage();
}