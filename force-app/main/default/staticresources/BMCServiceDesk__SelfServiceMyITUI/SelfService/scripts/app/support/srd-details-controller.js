	angular.module('supportModule')
		.controller('SrdDetailsController', ['errorModel', '$scope', 'errorDialogService', 'draftService','supportModel', 'userModel','$rootScope',
			function (errorModel, $scope, errorDialogService, draftService, supportModel, userModel,$rootScope) {
				$scope.supportModel = supportModel;
				$scope.userModel = userModel;
				$scope.formSubmitted = false;
				errorModel.clearAllErrors();
				var srdDetailsCtrlState = {};
				$scope.srdDetailsCtrlState = srdDetailsCtrlState;
				
				srdDetailsCtrlState.requestedFor = {
					userId: userModel.userId,
					userName: userModel.userName,
					phone: userModel.UserPhone,
					email: userModel.userEmail
				};
				
				var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
				srdDetailsCtrlState.onBehalfOfEnabled = userModel.isOnBehalfOfEnabled;

				$scope.executeAfterSrCreation = function(promise, isDraft) {
	                var requestDetailId = $scope.supportModel.requestDetailId;
	                if (promise !== undefined && promise != null) {
	                    promise.then(function(result) {
	                        if (result.success) {
	                            var recId;
	                            if (result.data != undefined || result.data != null) {
	                                recId = result.data.id;
	                            } else {
	                                recId = supportModel.tempAttachmentId;
	                            }

	                            if (!requestDetailId) {
	                                supportModel.q.all(supportModel.createAttachments(recId, supportModel.attachmentData.attachments)).then(function() {
	                                    if(!isDraft)
	                                    	supportModel.openSuccessSRCreatedConfirmationModal(result.data.incidentName);
	                                })['catch'](function() {
	                                    if (!isDraft)
	                                        supportModel.openSRCreatedWithErrorConfirmationModal();
	                                })['finally'](function() {
	                                    supportModel.isSrCreating = false;
	                                    supportModel.dataLoading = false;
	                                    supportModel.close(result);
	                                    $rootScope.$emit("refreshActivityStream", {});
	                                });
	                            }

	                            if (!isDraft) {
	                                if (requestDetailId) {
	                                    supportModel.openSuccessSRCreatedConfirmationModal(result.data.incidentName);
	                                    supportModel.savedDraftCount--;
	                                }

	                            } else {
	                                supportModel.isSrCreating = false;
	                                supportModel.dataLoading = false;
	                                $rootScope.$emit("refreshActivityStream", {});
	                                if (requestDetailId == null || requestDetailId == undefined)
	                                    supportModel.savedDraftCount++;
	                            }
	                            $scope.supportModel.tempAttachmentId = null;
	                            $scope.supportModel.requestDetailId = null;
	                            draftService.loadDrafts();
	                            supportModel.close(result);
	                        } else {
	                            var error = {
	                                text: result.error,
	                                hide: "10000"
	                            };

	                            supportModel.isSrCreating = false;
	                            supportModel.dataLoading = false;
	                            errorModel.clearAllErrors();
	                            error.text = supportModel.htmlDecode(error.text);
	                            errorModel.addModalError(error);
	                        }
	                    })['catch']();
	                }
	            }

				$scope.createSR = function (model,isDraft) {
					$scope.formSubmitted = true;
					//$scope.supportModel.isDraft = isDraft;
					var requestDetailId = $scope.supportModel.requestDetailId;
					if(isDraft && supportModel.savedDraftCount >= draftsLimit && (requestDetailId == null || requestDetailId == undefined)) {
						var error={
								text : supportModel.htmlDecode(selfServiceLabels.ErrorMsgSaveSRDraft),
								hide : "10000"
							};
							
							supportModel.isSrCreating = false;
							supportModel.dataLoading = false;
							errorModel.clearAllErrors();
							errorModel.addModalError(error);
					} else if (($scope.createSRForm !== undefined && $scope.createSRForm.$valid) || isDraft) {
						var promise;
	                    if (!requestDetailId && isDraft && supportModel.attachmentData.attachments && supportModel.attachmentData.attachments.length > 0) {
	                        supportModel.CreateTempAttachment().then(function(result) {
	                            promise = supportModel.createSR(isDraft, requestDetailId);
	                            $scope.executeAfterSrCreation(promise, true);
	                        });
	                    } else {
	                        promise = supportModel.createSR(isDraft, requestDetailId);
	                        $scope.executeAfterSrCreation(promise, isDraft);
	                    }						
					} else {
						var error={
							text : selfServiceLabels.ValidationMsg,
							hide : "10000"
						};
						supportModel.isSrCreating = false;
						supportModel.dataLoading = false;
						errorModel.clearAllErrors();
						error.text = supportModel.htmlDecode(error.text);
						errorModel.addModalError(error);
					}
				};
			}
		]);
