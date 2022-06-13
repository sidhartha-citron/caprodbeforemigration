	angular.module('socialModule')
		.directive('activityStreamItem', function () {
			var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
			return {
				replace: true,
				templateUrl: resourceUrl+'views/social/activity-stream-item-directive.html',
				controller: ['activityStreamModel', 
					'$modal', '$rootScope', '$scope', 'srDetailsService', 'urlSanitizerService', 'userModel', '$window', '$sce',
					function (activityStreamModel, 	$modal, $rootScope, $scope, srDetailsService, urlSanitizerService, userModel, $window, $sce) {

					var disableActivityStreamUpdates = angular.isFunction($scope.disableActivityStreamUpdates) ? $scope.disableActivityStreamUpdates : angular.noop,
						enableActivityStreamUpdates = angular.isFunction($scope.enableActivityStreamUpdates) ? $scope.enableActivityStreamUpdates : angular.noop;
					$scope.htmlUnescape = $rootScope.supportModel.htmlUnescape;	
					$scope.to_trusted = function(html_code) {
  		    			return $sce.trustAsHtml(html_code);
  					};

					$scope.toggleComment = function () {
						if ($scope.activityItem.likeToggleInProgress) {
							return;
						}

						$scope.activityItem.likeToggleInProgress = true;

						if (!$scope.activityItem.selfLike) {
							activityStreamModel.postActivityItemLike($scope.activityItem.id)
								.finally(function () {
									$scope.activityItem.likeToggleInProgress = false;
								})
						} else {
							activityStreamModel.deleteActivityItemLike($scope.activityItem.id)
								.finally(function () {
									$scope.activityItem.likeToggleInProgress = false;
								})
						}
					};

					$scope.markAsRead = function ($event) {
						$event.stopPropagation();

						if ($scope.activityItem.markAsReadInProgress) { return; }

						activityStreamModel.markStickyItemAsRead($scope.activityItem.id)
							.then(function () {
								$rootScope.$broadcast('myit.notification.markedAsRead', $scope.activityItem.id);
							});
					};

					$scope.sharePost = function (post) {
						var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
						$modal.open({
							scope: $scope,
							templateUrl: resourceUrl+'views/social/share-post-modal.html',
							controller: 'SharingController',
							backdrop: 'static',
							resolve: {
								activityItem: function () {
									return post;
								}
							}
						});
					};

					$scope.deletePost = function ($event) {
						$event.stopPropagation();

						if ($scope.activityItem.deletingPostInProgress) { return; }

						/*confirmationDialogService.showDialog({
							titleI18nKey: 'social.deletePostDialog.title',
							textI18nKey: 'social.deletePostDialog.text'
						})
							.result.then(function () {
								$scope.activityItem.deletingPostInProgress = true;
								activityStreamModel.deleteActivityStreamItem($scope.activityItem.id)
									.finally(function () {
										$scope.activityItem.deletingPostInProgress = false;

										if (angular.isFunction($scope.activityItemDeletedCallback)) {
											$scope.activityItemDeletedCallback();
										}
									});
							});*/
					};

					$scope.openDetails = function (item) {
						if (item.feedObjectType === "request") {
							openSRDetailsModal(item);
						} else if (item.feedObjectType === "broadcast") {
							openBroadcast(item);
						} else if (item.feedObjectType === 'appointment') {
							openAppointmentDetails(item.feedData.feedId);
						} else if (item.isApproval) {
							//approvalDetailsService.showDialog(item.feedData);
						}
					};


					$scope.showRequestCancellationDialog = function (item, $event) {
						$event.stopPropagation();
						registerRequestCancellationListener(item);
						srDetailsService.showRequestCancellationDialog({
							srId: item.feedData.feedId
						});
					};


					function registerRequestCancellationListener(item) {
						var eventListenerDeregistrator = $scope.$on('myit.support.cancelRequest', function ($event, data) {
							if (data.requestId === item.feedData.feedId) {
								item.feedData.status = 8000;
								if (angular.isFunction($scope.setTimelineOptions)) {
									$scope.setTimelineOptions();
								}
								eventListenerDeregistrator();
							}
						});
					}


					var openSRDetailsModal = function (item) {
						registerRequestCancellationListener(item);

						srDetailsService.showDialog({
							srId: item.feedData.feedId,
							parentScope: $scope,
							isRequest: item.isRequest,
							isTicket: item.isTicket
						});
					};

					var openBroadcast = function (item) {
						if (item.feedData.url) {
							$window.open(urlSanitizerService.sanitize(item.feedData.url), '_blank');
						}
					};


					var openAppointmentDetails = function (appointmentId) {
						// background stream updates can interfere with manipulations below, so disable the updates
						disableActivityStreamUpdates();

						$scope.$on('myit.appointment.cancel', function ($event, data) {
							if (data.appointmentId === appointmentId) {
								var currentActivityItem = $scope.activityItem;

								// turn sticky notification into regular item
								currentActivityItem.isSticky = false;
								currentActivityItem.isNotification = false;
								// mark appointment item as cancelled
								currentActivityItem.feedData.status = 'cancelled';
								// update item's modifiedDate so it would appear at the top of the stream
								currentActivityItem.modifiedDate = moment().valueOf();
								//console.log(moment().valueOf()+'---------'+moment().tz("America/Los_Angeles").format());
								//currentActivityItem.modifiedDate =  moment().tz("America/Los_Angeles").format();
								// move item from notifications cache into regular cache
								activityStreamModel.removeActivityItemFromCache(currentActivityItem);
								activityStreamModel.insertActivityItemIntoObjectCache(currentActivityItem, 'user', userModel.userId);
							}
						});

						/*appointmentDetailsService.showDialog({ appointmentId: appointmentId })
							.finally(enableActivityStreamUpdates);*/
					};


					var requestAddCommentEventDeregistrator = $scope.$on('myit.support.addComment', function ($event, data) {
						if (data.requestId === $scope.activityItem.feedData.feedId) {
							$scope.activityItem.modifiedDate = moment().valueOf();
							//console.log(moment().valueOf()+'---------'+moment().tz("America/Los_Angeles").format());
							//$scope.activityItem.modifiedDate = moment().tz("America/Los_Angeles").format();
							$scope.activityItem.commentCount++;
							$scope.activityItem.needsAttentionFlag = false;
						}
					});
	
	
					$scope.$on('$destroy', requestAddCommentEventDeregistrator);

				}],
				link: function (scope, element, attrs) {
					// this all shoud be in isolate scope
					if (attrs.type) {
						scope.itemType = attrs.type;
					}
					scope.allowNotificationStyling = attrs.allowNotificationStyling;
					scope.timelineStyle = attrs.timelineStyle
				}
			}
		})

		.directive('pastItemsLoader', ['$window', function ($window) {
			return {
				replace: true,
				scope: {
					loadPastActivityItems: '&'
				},
				template: '<div><div ng-if="loadingFlag"><loading-spinner if="true" inline="true"></loading-spinner>{{$root.selfServiceLabels.loading}}</div></div>',
				link: function (scope, element) {
					scope.loadPastActivityItemsThrottled = _.throttle(function () {
						if (!scope.loadingFlag && (element.offset().top <= (angular.element($window).scrollTop() + $window.innerHeight))) {
							scope.loadingFlag = true;
							scope.loadPastActivityItems()
								.finally(function () {
									scope.loadingFlag = false;
								})
						}
					}, 500);
					angular.element($window).bind('scroll', scope.loadPastActivityItemsThrottled);

					scope.$on('$destroy', function () {
						angular.element($window).unbind('scroll', scope.loadPastActivityItemsThrottled);
					});
				}
			}
		}])

		.directive('activityItemAttachments', ['activityStreamModel', function (activityStreamModel) {
			var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
			return {
				restrict: 'E',
				replace: true,
				scope: {
					attachments: '=',
					activityItemType: '@',
					activityItemId: '@'
				},
				templateUrl: resourceUrl+'views/social/activity-item-attachments.html',
				link: function (scope) {
					scope.activityStreamModel = activityStreamModel;
				}
			}
		}]);
