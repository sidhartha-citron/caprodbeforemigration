	angular.module('selfServiceApp')
		.factory('urlSanitizerService', urlSanitizerService);

	urlSanitizerService.$inject = ['$sce'];

	function urlSanitizerService($sce) {
		var base64prefix = 'base64,';

		return {
			sanitize: function (url) {
				url = url || '';

				if (url.indexOf(base64prefix) != -1) {
					url = url.substr(url.indexOf(base64prefix) + base64prefix.length);
					if (window.atob) {
						url = atob(url);
					}
				}

				return $sce.getTrustedHtml(url);
			}
		}
	}