//$(document).ready(function() {
	var socket = io();

	var intWidthMaxProzent = 85;
	var intHeightMaxProzent = 65;

	var intAniDurSec = 1500;
	var intLeftCurentGlo = 50;
	var intRightCurentGlo = 100-intLeftCurentGlo;
	var intTopCurentGlo = 50;
	var intBottomCurentGlo = 100-intTopCurentGlo;

	var strOverlayClass = '.overlay';
	var strOverlayClassInput = strOverlayClass+' input[type=number]';
	var strOverlayClassRange = strOverlayClass+' input[type=range]';

	var strOverlayClassLeft = strOverlayClass+' input[name=left]';
	var strOverlayClassRight = strOverlayClass+' input[name=right]';
	var strOverlayClassTop = strOverlayClass+' input[name=top]';
	var strOverlayClassBottom = strOverlayClass+' input[name=bottom]';
	var strOverlayClassSliderLR = strOverlayClass+' input[name=slider-lr]';
	var strOverlayClassSliderTB = strOverlayClass+' input[name=slider-tb]';

	$(strOverlayClassSliderLR).attr({
		"max": intWidthMaxProzent,
		"min": 100-intWidthMaxProzent
	});
	$(strOverlayClassSliderTB).attr({
		"max": intHeightMaxProzent,
		"min": 100-intHeightMaxProzent
	});

	var strContainerClass = '.container';
	var strJsUseClass = strContainerClass+".normal"
	var strColumnsProperty = "grid-template-columns";
	var strRowsProperty = "grid-template-rows";

	var strTransClassWD = 'trans';

	var intLeftBeforeGlo = intLeftCurentGlo;
	var intRightBeforeGlo = intRightCurentGlo;
	var intTopBeforeGlo = intTopCurentGlo;
	var intBottomBeforeGlo = intBottomCurentGlo;

	setProzentValues();
	$(strOverlayClassInput).on('input', function(e) { calcProzentValues(this, e) });
	$(strOverlayClassInput).on('focusout', function(e) { calcProzentValues(this, e)	});
	$(strOverlayClassRange).on('change', function(e) { calcProzentValues(this, e) });

	// isNumber
	$(strOverlayClassInput).on('keypress',function(e){
		var charCode = (e.which) ? e.which : e.keyCode
		if (charCode > 31 && (charCode < 48 || charCode > 57))
			return false;
		return true;
	});

	$('.overlay .mode a').on('click', function(e) {
		e.preventDefault();
		socket.emit('mode click', $(this).attr('class'));
	});
	socket.on('mode click', function(strModeName) {
		console.log('mode click', strModeName);
		var objContainer = $(strContainerClass+'.main');
		objContainer.removeAttr('class');
		objContainer.removeAttr('style');
		objContainer.addClass(strModeName+' main');

		setProzentValues();

		console.log(strModeName.split(' ')[1], $('.overlay .mode a.'+strModeName));
		$('.overlay .mode a').removeClass('is-active');
		$('.overlay .mode a.'+strModeName.split(' ')[1]).addClass('is-active');
	});

	function calcProzentValues(thisTmp, e) {
		var intInputValue = $(thisTmp).val();
		var strAttrName = $(thisTmp).attr('name');

		console.log(intInputValue);

		intLeftCurentGlo = $(strOverlayClassSliderLR).val();
		intRightCurentGlo = 100-intLeftCurentGlo;
		intTopCurentGlo = $(strOverlayClassSliderTB).val();
		intBottomCurentGlo = 100-intTopCurentGlo;

		if (strAttrName == 'left') {
			intLeftCurentGlo = intInputValue;
			intRightCurentGlo = 100-intInputValue;
		}
		if (strAttrName == 'right') {
			intLeftCurentGlo = 100-intInputValue;
			intRightCurentGlo = intInputValue;
		}
		if (strAttrName == 'top') {
			intTopCurentGlo = intInputValue;
			intBottomCurentGlo = 100-intInputValue;
		}
		if (strAttrName == 'bottom') {
			intTopCurentGlo = 100-intInputValue;
			intBottomCurentGlo = intInputValue;
		}

		if (intLeftCurentGlo > intWidthMaxProzent) {
			intLeftCurentGlo = intWidthMaxProzent;
			intRightCurentGlo = 100-intWidthMaxProzent;
		}
		if (intRightCurentGlo > intWidthMaxProzent) {
			intLeftCurentGlo = 100-intWidthMaxProzent;
			intRightCurentGlo = intWidthMaxProzent;
		}
		if (intTopCurentGlo > intHeightMaxProzent) {
			intTopCurentGlo = intHeightMaxProzent;
			intBottomCurentGlo = 100-intHeightMaxProzent;
		}
		if (intBottomCurentGlo > intHeightMaxProzent) {
			intTopCurentGlo = 100-intHeightMaxProzent;
			intBottomCurentGlo = intHeightMaxProzent;
		}

		setProzentValues();

		intLeftBeforeGlo = intLeftCurentGlo; 
		intRightBeforeGlo = intRightCurentGlo;
		intTopBeforeGlo = intTopCurentGlo; 
		intBottomBeforeGlo = intBottomCurentGlo;
	}

	function setProzentValues() {
		$(strJsUseClass).css(strColumnsProperty, intLeftCurentGlo+'% '+intRightCurentGlo+'%');
		$(strJsUseClass).css(strRowsProperty, intTopCurentGlo+'% '+intBottomCurentGlo+'%');

		$(strOverlayClassLeft).val(intLeftCurentGlo);
		$(strOverlayClassRight).val(intRightCurentGlo);
		$(strOverlayClassTop).val(intTopCurentGlo);
		$(strOverlayClassBottom).val(intBottomCurentGlo);
		$(strOverlayClassSliderLR).val(intLeftCurentGlo);
		$(strOverlayClassSliderTB).val(intTopCurentGlo);
	}

	$('.overlay .form form').on('submit', function(e) {
		e.preventDefault();
		var elm = $(this);
		socket.emit('videourl submit', {
			videoId: elm.data('id'),
			videoUrl: elm.find('input[name="vurl"]').val(),
		});
	});
	socket.on('videourl submit', function(dict) {
		console.log('videourl submit', dict);
		var objContainer = $(strContainerClass+".main");

		$(strContainerClass+'.main [data-id="'+dict.videoId+'"]').remove();
		if (dict.videoUrl.length > 0) {
			objContainer.append('<iframe data-id="'+dict.videoId+'" src="'+dict.videoUrl+'" allow="accelerometer; autoplay; encrypted-media; gyroscope"></iframe>');
		}/* else {
			objContainer.append('<div data-id="'+dict.videoId+'" class="no-video"></div>');
		}*/

		$('.overlay .form form[data-id="'+dict.videoId+'"] input[type="text"]').val(dict.videoUrl);
	});

	var videoId0 = -1;
	var videoId1 = -1;
	$('.overlay .js-switcher a').on('click', function(e) {
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
		videoContainer0.attr('data-id', arrVideoIds[1]);
		videoContainer1.attr('data-id', arrVideoIds[0]);
	});


	$('.overlay .js-reloader a').on('click', function(e) {
		e.preventDefault();
		socket.emit('video reloader', $(this).data('id'));
	});
	// use socket.on - videourl submit

//});