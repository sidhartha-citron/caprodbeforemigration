	angular.module('supportModule')
		.service('srdCreateService', ['errorModel', '$uibModal','$sce',
			function (errorModel, $uibModal, $sce) {

				function dismissSrdModal(modalInstance) {
					errorModel.clearAllErrors();
					modalInstance.dismiss('cancel');
				}
						
				this.showSupportSrdCreateDialog = function (srd, additionalParam) {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					$uibModal.open({
						templateUrl: resourceUrl+'views/support/request-modal.html',
						ariaDescribedBy: 'support-modal__srd-header-description',
						ariaLabelledBy:'support-modal-header__title support-modal__srd-header',
						backdrop: 'static',
						windowClass: srColumnLayoutForSS3Val == 2 ? 'sr2ColumnLayout' : '',
						controller: ['$uibModalInstance', '$scope', 'supportModel', '$state','$q',
							function ($uibModalInstance, $scope, supportModel, $state,$q) {
								supportModel.modalInstance = $uibModalInstance;
								$scope.selectedSRD = srd;
								$scope.supportModel = supportModel;	
								$scope.lightningModule = lightningModule;
								supportModel.TicketOrRequest = 'Request';
								$scope.requestDetailLeftFieldSet = namespace+'leftPanel';
								$scope.requestDetailRightFieldSet = namespace+'rightPanel';
								$scope.requestDetailSS3FieldSet = namespace+'RequestDetailsSelfService3';
								if($scope.lightningModule){
									$scope.SRColumnLayoutForSS3 = false;	
								}else{
									$scope.SRColumnLayoutForSS3 = srColumnLayoutForSS3Val == 2;
								}								
								$scope.srdDetailsUrl=resourceUrl+'views/support/srd-details.html'	;	
								$scope.detailsUrl=resourceUrl+'views/support/srd-questions-list.html'	;
								
								// Catch-all case, SRD will be loaded from server
								supportModel.selectedFoundSRD = srd;
								supportModel.setToDefault();
								if(srd.action !== undefined && srd.action != null && srd.action != ''){
									supportModel.config.action = srd.action;
								}else{
									supportModel.config.action = 'NEW';
								}
								var srdId = '';
								if(srd.id !== undefined && srd.id !== null && srd.id !== '' && srd.action === 'COPY'){
									srdId = srd.id;
								}
								
								supportModel.getSRDById(srd.serviceRequestDefinitionId, srdId, supportModel.config.action, additionalParam)
									.then(supportModel.onGetSrdByIdSuccessCallback)
									['catch'](supportModel.onGetSrdByIdFailCallback)
									['finally'](function (result) {
										
										if($scope.supportModel.isDraft) {
											$scope.supportModel.clientId = $scope.supportModel.srData.clientId;
											$scope.supportModel.clientUsername = $scope.supportModel.srData.clientUsername;
											$scope.supportModel.clientName = $scope.supportModel.srData.clientName;
											$scope.supportModel.clientEmail = $scope.supportModel.srData.clientEmail;
											var attachmentRefId = $scope.supportModel.srData.AttachmentRefGeneratorId;
											if(attachmentRefId) {
												supportModel.tempAttachmentId = attachmentRefId;
												var Param = {AttachmentRefGeneratorId : attachmentRefId};
												$scope.getAttachmentDetails(srdId, Param).then(function(result){
													$scope.supportModel.attachmentData.attachments = result;
												});
											}
											
										}
										
									});
									$scope.trustedHtml = function(plainText){
										return $sce.trustAsHtml(plainText);
									}
									$scope.getAttachmentDetails = function(draftId, additionalParam) {
								        var deferred = $q.defer();
										$scope.supportModel.attachmentData.isAttachmentLoading = true;
								        Visualforce.remoting.Manager.invokeAction(_RemotingActions.getDraftAttachmentlist,draftId, additionalParam, function(result,event) {
								            if (event.status) { 
								            	if(result.length > 0){
								            		for(var i=0; i<result.length;i++){
						                        		var tempAttachment = result[i];
														tempAttachment.iconClass = supportModel.getFileGenericIconClass(tempAttachment.Name);
													}
								            	}								              	
								              deferred.resolve(result);
								            }else{
								              deferred.reject();
								            }
											$scope.supportModel.attachmentData.isAttachmentLoading = false;
								        });
								        return deferred.promise;  
								    }
								$scope.cancel = function () {
									var response = {
													message: "Close_After_Cancel",
													component: cmpId
												};
									if (lightningModule=='createSR')
										parent.postMessage(response, lexOpenerURL);
									dismissSrdModal($uibModalInstance);

									if(supportModel.smartSuggestionsData && supportModel.smartSuggestionsData.isSuggestionsOpen==true){
										supportModel.smartSuggestionsData.isSuggestionsOpen = false;
										supportModel.smartSuggestionsData.clearSearchString = true;
									}
								}; 

								$scope.$on('$destroy', function () {
									supportModel.selectedFoundSRD = {};
									supportModel.isDraft = false;
									supportModel.clientId = '';
									supportModel.tempAttachmentId = null;
									supportModel.requestDetailId = null;
								})
							}]
					});
				};
			}
		]);
