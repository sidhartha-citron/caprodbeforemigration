	angular.module('supportModule')
		.factory('srDetailsService', ['$uibModal', '$timeout',
			function ($uibModal, $timeout) {				
				return {
					showDialog: function (options) {
						var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
						var modalOptions = {
							templateUrl: resourceUrl+'views/support/sr-modal.html',
							controller: 'SrDetailsModalController',
							ariaDescribedBy: 'support-modal__srd-header-description',
							ariaLabelledBy:'support-modal-header__title ',
							resolve: {
								selectedSrId: function () {
									return options.srId;
								},
								getByRequestId: function () {
									return options.getByRequestId || false;
								},
								parentScope: function () {
									return options.parentScope;
								},
								isRequest: function () {
									return options.isRequest;
								},
								isTicket: function () {
									return options.isTicket;
								},
								isDisableEdit: function () {
									return options.isDisableEdit;
								}
							},
							backdrop: 'static'
						};

						if (options.scope) {
							modalOptions.scope = options.scope;
						}

						return $uibModal.open(modalOptions).rendered.then(function(){
							if(options.isTicket){
								angular.element('.modal-dialog').addClass('modal-dialog-incident');
							}
						});
					},

					/**
					 *
					 * @param options Config
					 * @param options.srId ID of SR
					 * @param options.parentModalScope $scope of parent modal window (to close it after successful request cancellation)
					 */
					showRequestCancellationDialog: function (options) {
						var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
						$uibModal.open({
							templateUrl: resourceUrl+'views/support/cancel-sr-modal.html',
							ariaDescribedBy: 'modal-header__title',
							ariaLabelledBy:'modal-header__description',
							controller: ['errorDialogService', '$uibModalInstance', 'parentModalScope', '$rootScope', '$scope', 'srModel',
								function (errorDialogService, $uibModalInstance, parentModalScope, $rootScope, $scope, srModel) {
									$scope.srModel = srModel;
									$scope.options = options;
									$scope.resolution='';
									$scope.showError=false;
									$scope.isResolutionMandatory = allowResolutionBeforeClose;
									$scope.hasResolution = typeof options.resolution !== 'undefined' && options.resolution !== '';
									if ($scope.hasResolution) {
										$scope.resolution = options.resolution;
									}
									$scope.cancelSR = function () {
										$scope.showError=false;
										if(options.isTicket && !$scope.hasResolution){
											$scope.resolution=$("textarea[id*='ticketCloseResolution']").val();
											if (($scope.isResolutionMandatory && $scope.resolution !== null && $.trim($scope.resolution) !== '') || !$scope.isResolutionMandatory) {
												closeTicket(options.srId,$scope.resolution,options);
											} else {
												$scope.showError=true;
											}
										} else {
											closeTicket(options.srId,$scope.resolution,options);
										}
									};
									function closeTicket(srId,resolution,options){
										srModel.cancelServiceRequest(srId,resolution)
												.then(function (result) {
													if(typeof(result) == 'undefined' || result == null || result == ''){
														$rootScope.$broadcast('myit.support.cancelRequest', { requestId: options.srId });
														if (parentModalScope && _.isFunction(parentModalScope.close)) {
															parentModalScope.close();
														}
														showServiceRequestClosedSuccessfullyMessage(options);
													}else{
														errorDialogService.showDialog({
															title: selfServiceLabels.close,
															titleI18nKey: 'support.sr.modal.cancel.errorHeader',
															text: result
														});
													}
												})
												['catch'](function (response) {
													errorDialogService.showDialog({
														titleI18nKey: 'support.sr.modal.cancel.errorHeader',
														text: response.data.defaultMessage
													});
												})
												['finally']($scope.close);
									}
									$scope.close = function () {
										$uibModalInstance.dismiss();
									};
									function showServiceRequestClosedSuccessfullyMessage(options){
										var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');					
										$uibModal.open({
											templateUrl: resourceUrl+'views/support/Sr-Or-Ticket-Closed-Message.html',
											ariaDescribedBy: 'modal-header__title',
											ariaLabelledBy:'modal-header__description',
											controller: ['$scope', '$uibModalInstance',
												function ($scope, $uibModalInstance) {
													$scope.recordTitle = options.recordTitle;
													$scope.message = selfServiceLabels.ServiceRequestOrTicketClosedMessage.replace('{0}', options.recordTitle);
													$scope.SROrTicket = '';
													if(options.isTicket){
														$scope.SROrTicket = selfServiceLabels.incident;
													}else if(options.isRequest){
														$scope.SROrTicket = selfServiceLabels.serviceRequest;
													}
													$timeout(function () {
														$uibModalInstance.dismiss('cancel');
													}, 5000);
												}
											]
										});
									}
								}],
							resolve: {
								parentModalScope: function () {
									return options.parentModalScope;
								}
							},
							backdrop: 'static'
						});
					}
				};
			}
		]);
