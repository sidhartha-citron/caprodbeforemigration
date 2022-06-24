	angular.module('socialModule')
		.controller('ActivityStreamController', ['activityStreamModel', 'errorModel', '$q', '$scope', '$timeout', 'userModel',
			function (activityStreamModel, errorModel, $q, $scope, $timeout, userModel) {

				var activityStreamCtrlState = {
					allowMorePastItems: true,
					notificationsMode: false,
					isScopeDestroyed: false
				};
				$scope.activityStreamCtrlState = activityStreamCtrlState;

				$scope.activityStreamModel = activityStreamModel;
				var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
				var templateUrls={
					filterUrl:resourceUrl+'views/profile/timeline-toolbar-filter.html',
					srFilter:resourceUrl+'views/social/service-request-filter.html'
				};
				$scope.templateUrls=templateUrls;
				function init() {
					errorModel.clearAllErrors();
					$scope.loadActivityStream();

					$scope.$on('$destroy', function () {
						activityStreamCtrlState.isScopeDestroyed = true;
						destroyActivityStreamRefreshTimeout();
					});
				}
				
				var activityStreamRefreshTimeout;
				function startActivityStreamRefreshTimeout() {
					/*if (activityStreamCtrlState.isScopeDestroyed) { return; }
					destroyActivityStreamRefreshTimeout();
					activityStreamRefreshTimeout = $timeout($scope.loadActivityStream, $scope.timelineRefreshTimeout);*/
				}


				function destroyActivityStreamRefreshTimeout() {
					$timeout.cancel(activityStreamRefreshTimeout);
				}


				$scope.loadActivityStream = function () {
					$scope.refreshActivityStream();
				};


				$scope.refreshActivityStream = function (past) {
					if (!past && activityStreamCtrlState.updatesDisabled) {
						return $q.when(1);
					}

					return activityStreamModel.getActivityStream({
							type: 'user',
							elementId: userModel.userId,
							own: true,
							loadMorePastItems: past || false,
							currentPageNo : activityStreamModel.currentPageNo +1,
							isSelfActivity:activityStreamModel.isSelfActivity
						})
							.then(function (activityStreamCache) {
								activityStreamCtrlState.items = activityStreamCache.items;
								activityStreamCtrlState.allowMorePastItems = activityStreamCache.allowMorePastItems;
								errorModel.removeErrorById('global', 'homeActivityStreamLoadingError');
							})
							.catch(function (response) {
								// Only meaningful messages will be shown
								if (response && response.data && response.data.defaultMessage) {
									errorModel.addGlobalError({
										id: 'homeActivityStreamLoadingError',
										text: response.data.defaultMessage
									});
								}
							})
							.finally(function () {
								if (!past) {
									//startActivityStreamRefreshTimeout();
								}
							});
				};


				$scope.toggleNotificationsMode = function () {
					activityStreamCtrlState.notificationsMode = !activityStreamCtrlState.notificationsMode;
				};


				$scope.notificationItemsFilter = function (activityItem) {
					return activityItem.isSticky || (activityStreamCtrlState.notificationsMode && activityItem.isNotification);
				};


				/** Disable updating of activity stream (i.e. when post with attachments is submitted */
				$scope.disableActivityStreamUpdates = function () {
					activityStreamCtrlState.updatesDisabled = true;
				};


				/** Enable updating of activity stream back (i.e. when post with attachments finished submitting */
				$scope.enableActivityStreamUpdates = function () {
					activityStreamCtrlState.updatesDisabled = false;
				};


				init();

			}]);