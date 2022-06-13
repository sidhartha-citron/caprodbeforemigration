angular.module('supportModule')
		.controller('SupportSearchController', ['rkmDetailsService', 'broadcastDetailService', '$scope', '$state', 'srdCreateService', 'supportSearchModel','incidentCreateService',
			function (rkmDetailsService, broadcastDetailService, $scope, $state, srdCreateService, supportSearchModel,incidentCreateService) {
				$scope.supportSearchModel = supportSearchModel;
				

				$scope.supportSearchModel.getSearchResults(decodeURIComponent($state.params.searchText), supportSearchModel.lastSelectedSection, true);
				 

				$scope.openRkmItem = function (rkm) {
					//if(rkm.articleType != "How To")
						rkmDetailsService.showDialog(rkm.id);	
					//else
						//window.open(rkm.source, '_blank');
				};
				$scope.openSFKMItem = function (rkm) {
					if(!isUserInLightningMode)
						rkmDetailsService.showDialog(rkm.id, rkm);
					else
						window.open(rkm.urlLink , '_blank');
				};
				
				$scope.selectSrd = function (srd) {					
						srdCreateService.showSupportSrdCreateDialog(srd);
				}
				
				$scope.openBroadcast = function (recList, record) {
						var recListData = [];
						
						angular.forEach(recList,function(rec){
								var recData = {
									broadcastMessage__c : $scope.supportSearchModel.htmlDecode($scope.supportSearchModel.htmlDecode(rec.description)),
							    	Priority_ID__c      : rec.priority,
							    	id                  : rec.recordId
						    	};
								recListData.push(recData);
						});
						
						var additionalInfo = {};
						additionalInfo.selecteBrId = record.recordId;
						broadcastDetailService.showBroadcastDialog(recListData, additionalInfo);
				}
				$scope.createIncident=function(template){
					incidentCreateService.showSupportSrdCreateDialog(template.id);
				}
				$scope.openItem = function(item){
					if(item.isSrd){
						$scope.selectSrd(item);
					}else if(item.isTmp){
						$scope.createIncident(item);
					}else if(item.isRkm){
						$scope.openRkmItem(item);
					}else if(item.isBR){
						$scope.openBroadcast($scope.supportSearchModel.searchResults.items, item);
					}else if(item.isSFkm){
						$scope.openSFKMItem(item);
					}
					
				}
				
				
			}
		]);
