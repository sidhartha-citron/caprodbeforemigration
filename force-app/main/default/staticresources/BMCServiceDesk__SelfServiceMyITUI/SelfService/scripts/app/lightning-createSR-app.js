/*
 	Date: 15-11-2017
 	Update: We use the SR submission form from SS 3.0 in the
 	Lightning Component as well. In order to manage the changes required in the form for the component, a new flag lightningModule
 	is introduced. We have included this new lightning--createSR-app.js instead of app.js to load only the required methods and elements from SS 3.0 in the Lightning Component .
 */			
	
	
	
	angular.module('selfServiceApp', ['mgcrea.ngStrap', 'ui.router',  'ui.bootstrap', 'ngAnimate','supportModule','i18nModule','appointmentModule','profileModule','userModule','socialModule','unifiedCatalogModule']);
	angular.module('i18nModule', ['ngCookies']);
	angular.module('httpRequestBufferModule', []);
	angular.module('socialModule', ['ngResource', 'ngSanitize']);
	angular.module('supportModule', ['ngResource', 'i18nModule', 'httpRequestBufferModule','ui.grid', 
	                                 'ui.grid.resizeColumns', 'ngSanitize','angularjs-datetime-picker']);
	angular.module('profileModule', ['ui.map']);
	angular.module('userModule', ['ngResource', 'i18nModule', 'httpRequestBufferModule']);
	angular.module('appointmentModule', ['ngResource','userModule']);
	angular.module('unifiedCatalogModule',[]);
	angular.module('selfServiceApp').config(['$stateProvider','$urlRouterProvider',
			function ($stateProvider, $urlRouterProvider) {
				
				var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
				
				$urlRouterProvider.otherwise('/support');
				
				$stateProvider
					.state('home', {
						url: '^/',
						controller: 'MainController'
					})				
					.state('support', {
						url: '/support',
						templateUrl: resourceUrl+'views/support/index.html',
						controller: 'SupportController',						
						data: {
							featureDependence: 'Assistance'
						}
					})
					.state('support.problem-requests', {
						abstract: true,
						url: '/problem-requests',
						template: '<ui-view autoscroll="false"></ui-view>',
						data: {
							type: 'problem-requests'
						}
					})
					.state('support.problem-requests.all',
					{
						url: '/all',
						templateUrl: resourceUrl+'views/support/all-requests.html',
						controller: 'AllSrdController'
					})
			}
			

		]).config(['$qProvider', function ($qProvider) {
			$qProvider.errorOnUnhandledRejections(false);
		}]).config(['$locationProvider', function($locationProvider) {
			$locationProvider.hashPrefix('');
		}]).config(['$httpProvider', function ($httpProvider) {
			$httpProvider.defaults.headers.get = {
				'If-Modified-Since': 0,
				'Cache-Control': 'no-cache',
				Pragma: 'no-cache'
			};
		}]).run(['$state', function ($state) {
		}]);