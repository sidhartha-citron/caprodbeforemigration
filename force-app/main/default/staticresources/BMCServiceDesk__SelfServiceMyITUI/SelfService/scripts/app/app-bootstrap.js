$(function () {
	'use strict';
	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
	
	var supportedLanguages = [
			'ar', 'de', 'en', 'es', 'fi', 'fr', 'he', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'sv', 'zh', 'zh-tw'
		],
		rtlLanguages = ['ar', 'he'],
		defaultLocale = 'en-US',
		nav = window.navigator,
		locale = !$.browser.msie && (nav.languages && nav.languages[0] || nav.language) || $.cookie('myit_locale'),
		language = defaultLocale.substr(0, 2);

	init();

	// 1. Load config, get REST prefix from it
	function init() {
	/*	var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
		$.getJSON(resourceUrl+'scripts/app/config.json').always(function (data) {
			angular.appConfig = data;
		}); */
	//	loadRtlCss();
		if(isRTLRequired)
			loadRtlCss();
		
		startApp();
		
	}	
	
	// loads RTL styles
	function loadRtlCss() {
		var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
		var rtlStyles =  [
					'styles/vendor/bootstrap/bootstrap-rtl.min.css',
					'styles/scss/myit-rtl.css',
					'styles/scss/rtl.css'
				];
		
		if(isSwitchToEnhancedUI){
			rtlStyles.push('styles/scss/myit-enhanced-rtl.css');
		}
		var styles = '';		
		$.each(rtlStyles, function (i, css) {
				styles += '<link rel="stylesheet" href="' + resourceUrl + css + '" />';
			});
		$('head').append(styles);		
	}

	function startApp() {
		angular.bootstrap(document.documentElement, ['selfServiceApp']);
	}
});