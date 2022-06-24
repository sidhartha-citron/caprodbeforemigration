angular.module('supportModule')
.factory('broadcastDetailService', ['$uibModal','$q','urlSanitizerService',
    function ($uibModal,$q,urlSanitizerService) {	
        var self = {};		
        function dismissBroadcastdModal(modalInstance) {
            modalInstance.dismiss('cancel');
        }
        self.showBroadcastDialog = function (data, additionalInfo) {
            var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
            return $uibModal.open({
                backdrop: 'static',
                windowClass: 'broadcast-modal-window',
				ariaLabelledBy: 'broadcast-model-title',
                templateUrl: resourceUrl+'views/support/broadcast-modal.html',
                controller: ['$uibModalInstance','$scope', '$window', '$timeout',function ($uibModalInstance,$scope,$window,$timeout) {
                    $scope.allBroadcastsData = data;
                    $scope.broadcastDetailServiceCtrl = {};
                    $scope.broadcastDetailServiceCtrl.dataLoading = true;
                    $scope.selectedBroadcast = {};
                    $scope.headerInfo = {};
                    $scope.additionalInfo = additionalInfo;
                    $scope.isBackEnable = ($scope.additionalInfo && $scope.additionalInfo.parentModelInstance) ? true : false;

                    /*$timeout(function () {
                        $('#inner-table-container').mCustomScrollbar({ 
                            theme:"dark-thick"   
                        });
                        $('.broadcast-message-block').mCustomScrollbar({ 
                            theme:"dark-thick"   
                        });
                    }, 0,false);*/
                    
                    if($scope.additionalInfo && $scope.additionalInfo.parentModelInstance)
								angular.element('.toggle-incident-modal-window').css('display', 'none');

                    $scope.cancel = function () {
                        if($scope.additionalInfo && $scope.additionalInfo.parentModelInstance)
                            angular.element('.toggle-incident-modal-window').css('display', 'block');
                        dismissBroadcastdModal($uibModalInstance);
                    };

                    $scope.openSelectedBroadcast = function(brId, isGetHeaderInfo) {
                        if(brId) {
                            $scope.broadcastDetailServiceCtrl.upperContainerLoading = true;
                            var param = {};
                            param.brId = brId;
                            param.isGetHeaderInfo = isGetHeaderInfo;
                            Visualforce.remoting.Manager.invokeAction(_RemotingActions.getBroadcastById, param, function(result, event) {
                                if (event.status && result != null) {
                                    $scope.selectedBroadcast = result.record;
									$scope.selectedBroadcast.broadcastMessage__c = ($scope.selectedBroadcast && $scope.selectedBroadcast.broadcastMessage__c) ? htmlUnescape($scope.selectedBroadcast.broadcastMessage__c) : $scope.selectedBroadcast.broadcastMessage__c; 
									$scope.selectedBroadcast.Name = ($scope.selectedBroadcast && $scope.selectedBroadcast.Name) ? htmlUnescape($scope.selectedBroadcast.Name) : $scope.selectedBroadcast.Name; 
                                    if(result.header){
                                        $scope.headerInfo = result.header;
                                    }                                    
                                }
								$scope.broadcastDetailServiceCtrl.upperContainerLoading = false;
                                $scope.broadcastDetailServiceCtrl.dataLoading = false;
                                $scope.$apply();
                            });
                        }	
                    }
					
					 $scope.checkBrdPriority = function(prId) {
                        if(prId) {
							var priorityValue=  parseInt(prId);
							if(priorityValue== 1|| priorityValue== 2 || priorityValue== 3 || priorityValue== 4 || priorityValue== 5){
								return true;
							}else{
								return false;
							}
						 }
							
						return false;
                    }
					
					 $scope.setBrdPriorityClass = function(prId) {
						 var priorityClass = 'priority_five_color';
                        if(prId) {
							var priorityValue=  parseInt(prId);
							if(priorityValue== 1){
								priorityClass='priority_one_color';
							}else if( priorityValue== 2 ){
								priorityClass='priority_two_color';
							}else if(priorityValue== 3 ){
								priorityClass= 'priority_three_color';
							}else if( priorityValue== 4){
								priorityClass= 'priority_four_color';
							} else if( priorityValue>= 5){
								priorityClass='priority_five_color';
							}
							 
                        }
						return priorityClass;
                    }

					
                    //Call this method in modal load for first time.
                    if($scope.additionalInfo && $scope.additionalInfo.selecteBrId)
                        $scope.openSelectedBroadcast($scope.additionalInfo.selecteBrId, true);
					
					function htmlUnescape(str){
                        if(str){
                            str = str.replace(/&quot;/g, '"');
                            str = str.replace(/&#39;/g, "'");
                            str = str.replace(/&lt;/g, '<');
                            str = str.replace(/&gt;/g, '>');
                            str = str.replace(/&amp;/g, '&');
                            str = str.replace(/%2F/g, '/');
                            return str;
                        }else{
                            return '';
                        }
                    }
                }],
            });
        };
        return self;
    }]
);
