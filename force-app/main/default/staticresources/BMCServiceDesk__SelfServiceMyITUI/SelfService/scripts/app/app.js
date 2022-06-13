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
					.state('support.other-requests', {
						abstract: true,
						url: '/other-requests',
						template: '<ui-view autoscroll="false"></ui-view>',
						data: {
							type: 'other-requests'
						}
					})
					.state('support.howto', {
						abstract: true,
						url: '/howto',
						template: '<ui-view autoscroll="false"></ui-view>',
						data: {
							type: 'how-to'
						}
					})          
			          .state('support.manageApprovals', {
			            abstract: true,
			            url: '/manageApprovals',
			            template: '<ui-view autoscroll="false"></ui-view>',
			            data: {
			              type: 'manageApprovals'
			            }
			          })
					 .state('support.draft-requests', {
						  abstract: true,
						  url: enableSaveAsDraft ? '/save-draft-requests' : '^/',
						  template: '<ui-view autoscroll="false"></ui-view>',
						  data: {
							type: 'draft-requests'
						  }
					 })
					.state(
							'support.customlink',
							{
								abstract : true,
								url : '/customlink',
								template : '<ui-view autoscroll="false"></ui-view>',
								data : {
									type : 'customlink'
								}
							})
					.state(
							'support.ViewServiceHealth',
							{
								abstract: true,
								url: '/ViewServiceHealth',
										template: '<ui-view autoscroll="false"></ui-view>',
										data: {
							  type: 'ViewServiceHealth'
							}
					})
					.state(
							'support.relatedTickets',
							{
								abstract: true,
								url: '/relatedTickets',
										template: '<ui-view autoscroll="false"></ui-view>',
										data: {
							  type: 'relatedTickets'
							}
					})
					.state(
							'support.ViewCIsAssets',
							{
								abstract: true,
								url: '/ViewCIsAssets',
										template: '<ui-view autoscroll="false"></ui-view>',
										data: {
							  type: 'ViewCIsAssets'
							}
					})
					.state('support.search', {
						url: '/search/{searchText}',
						templateUrl: resourceUrl+'views/support/search-results.html',
						controller: 'SupportSearchController',
						data: {
							type: 'search'
						}
					})
					.state('support.problem-requests.all.segregation', {
						url: '/segregation',
						templateUrl: resourceUrl+'views/support/all-requests.html'
					})
					.state('support.other-requests.quick-pick', {
						url: '/quick-pick',
						templateUrl:resourceUrl+'views/support/quick-pick-requests.html',
						controller: 'QuickPickListController'
					})
					.state('support.howto.quick-pick', {
						url: '/quick-pick',
						templateUrl: resourceUrl+'views/support/how-to.html',
						controller: 'HowToController'
					})
					.state('support.howto.all', {
						url: '/all',
						templateUrl: resourceUrl+'views/support/how-to.html',
						controller: 'HowToController'
					})
					.state('support.howto.all.segregation', {
						url: '/segregation',
						templateUrl: resourceUrl+'views/support/how-to.html'
					})
					.state('support.ViewServiceHealth.all', {
						url: '/all',
						templateUrl: resourceUrl+'views/support/ViewServiceHealth.html',
						controller: 'ViewServiceHealth'
					})
					.state('support.relatedTickets.all', {
						url: '/all/{beId}/{beName}/{pageNo}',
						templateUrl: resourceUrl+'views/profile/related-tickets.html',
						controller: 'ProfileController',
					})
					.state('support.ViewCIsAssets.all', {
						url: '/all/{currentPageNo}',
						templateUrl: resourceUrl+'views/support/ViewMyCMDBInfo.html',
						controller: 'viewCMDBController'
					})
					.state(
							'support.customlink.all',
							{
							url: '/all',
								templateUrl : resourceUrl
										+ 'views/support/customlink.html',
								controller : 'customlink'
							})		
					.state(
							'support.manageApprovals.all',
							{
								url : '/all',
								templateUrl : resourceUrl
										+ 'views/support/manageApprovals.html',
						controller: 'manageApprovalsController'
					  })
					 
					.state('support.draft-requests.all',
					{
						url: '/all',
						templateUrl: resourceUrl+'views/support/srd-drafts.html',
						controller: 'SaveDraftContorller'
					}) 
 
					.state('support.problem-requests.all',
					{
						url: '/all',
						templateUrl: resourceUrl+'views/support/all-requests.html',
						controller: 'AllSrdController'
					})
					.state('support.common', {
						url: '/catalog',
						abstract: true,
						controller: 'UnifiedCatalogRootController',
						template: '<ui-view autoscroll="false"></ui-view>'
					})
					.state('support.common.home',
					{
						url: '/common',
						templateUrl: resourceUrl+'views/unified-catalog/index.html',
						controller: 'UnifiedCatalogController'
					})
					.state('support.common.section', {
						url: '/section-:id',
						templateUrl: resourceUrl+'views/unified-catalog/section.html',
						controller: 'UnifiedCatalogSectionController'
					})
					.state('support.other-requests.all',
					{
						url: '/all',
						//templateUrl: resourceUrl+'views/support/incident-modal.html',
						controller: 'AllSrdController'
					})
					.state('support.my-requests', {
						url: '/my-requests',
						templateUrl: resourceUrl+'views/support/my-requests.html',
						controller: 'MyRequestController',
						data: {
							type: 'my-requests'
						}
					})
					.state('support.problem-requests.all.category',
					{
						url: '/{categoryId}&{parentCategoryId}',
						templateUrl: resourceUrl+'views/support/all-requests.html'
					})
					.state('support.other-requests.all.category',
					{
						url: '/{categoryId}',
						templateUrl: resourceUrl+'views/support/all-requests.html'
					}).state('profile', {
						url: '/profile?activityTab&requestId&searchStr',
						templateUrl: resourceUrl+'views/profile/index.html',
						controller: 'ProfileController'
					})
					.state('location-profile', {
						url: '/location/:locationId',
						templateUrl: resourceUrl+'views/profile/location-profile.html',
						controller: 'LocationProfileController',
						data: {
							featureDependence: 'Location'
						}
					})
					.state('resource-profile', {
						url: '/resource/:resourceId',
						templateUrl: resourceUrl+'views/profile/resource-profile.html',
						controller: 'ResourceProfileController',
						data: {
							featureDependence: 'Location'
						}
					})
					.state('user-profile', {
						url: '/profile/:userId',
						templateUrl: resourceUrl+'views/profile/user-profile.html',
						controller: 'UserProfileController'
					})
					.state('group-profile', {
						url: '/group/:groupId',
						templateUrl: resourceUrl+'views/profile/group-profile.html',
						controller: 'GroupProfileController'
					})
					.state('service-profile', {
						url: '/service/:serviceId',
						templateUrl: resourceUrl+'views/profile/service-profile.html',
						controller: 'ServiceProfileController',
						data: {
							featureDependence: 'ServiceAvailability'
						}
					});
					
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
		}])
		.run(['$state', function ($state) {
		}]);