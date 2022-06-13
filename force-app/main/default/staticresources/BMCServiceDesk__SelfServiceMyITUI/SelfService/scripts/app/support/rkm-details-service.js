	angular.module('supportModule')
		.factory('rkmDetailsService', ['$uibModal','$q','urlSanitizerService',
			function ($uibModal,$q,urlSanitizerService) {

				var self = {};
				var kaDetailsModalState = {};				
				self.openItem = function (item) {
					if(item.isHowTo)
						window.open(item.source || item.url , '_blank');
					else
						self.showDialog(item.ID);				
				};
				function dismissSrdModal(modalInstance) {
					modalInstance.dismiss('cancel');
				}
				self.showDialog = function (rkmItem, additionalInfo) {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					var fromSmartSuggestion;
					return $uibModal.open({
						templateUrl: resourceUrl+'views/support/rkm-article-modal.html',
						ariaDescribedBy: 'ka-title',
						ariaLabelledBy:'support-modal-header__title ',
						controller: ['$uibModalInstance','$scope', '$window', '$timeout','$rootScope', 'supportModel', function ($uibModalInstance,$scope,$window, $timeout, $rootScope, supportModel) {
							$scope.rkmArticleStyle = '';
							$scope.isMinimized = true;
							$scope.rkmSmartSuggestionsData = [];
							$scope.supportModel = supportModel;
							//Changes for smart suggestions
							$scope.additionalInfo = additionalInfo;
							fromSmartSuggestion = ($scope.additionalInfo && $scope.additionalInfo.rkmRecords) ? true : false;
							
							/* block for smart suggestions start */
							$scope.isBackEnable = ($scope.additionalInfo && $scope.additionalInfo.parentModelInstance) ? true : false;
							if($scope.additionalInfo && $scope.additionalInfo.parentModelInstance)
								angular.element('.toggle-incident-modal-window').css('display', 'none');
							
							if($scope.additionalInfo && $scope.additionalInfo.rkmRecords && $scope.additionalInfo.rkmRecords.length > 1) {
									$scope.rkmSmartSuggestionsData.records = $scope.additionalInfo.rkmRecords;
									$scope.rkmSmartSuggestionsData.modalInstance = $uibModalInstance;
								$timeout(function () {	
									angular.element('.modal-dialog').addClass('modal-dialog-incident');
									var element = angular.element('#rkm-smart-suggestions-pane');
										if(element)
											(element).toggleClass('toggle-smart-suggestions');
								}, 0,false);
							}
							$rootScope.reRenderRKMiFrame = function(rkmItem) {
								$scope.kaDetailsModalState.isRerendering=true;
								self.getKASetails(rkmItem).then(function(result){								
									self.processRkmTextFields(result);
									$scope.selectedRKM = result;															
								});
							}

							window.frameload = function() {
								$scope.kaDetailsModalState.isRerendering=false;
							}
							/* block for smart suggestions end */

							$scope.maximize = function(){
								if(!fromSmartSuggestion)
									angular.element('.modal-dialog').removeClass('modal-dialog-default');
								else
									angular.element('.modal-dialog').removeClass('modal-dialog-incident');

								angular.element('.modal-dialog').addClass('modal-dialog-fullscreen');
								angular.element('.modal-content').addClass('modal-content-fullscreen');
								$scope.isMinimized = false;
								if($scope.additionalInfo && $scope.additionalInfo.rkmRecords && $scope.additionalInfo.rkmRecords.length > 1) {
									var element = angular.element('#rkm-smart-suggestions-pane');
										if(element) {
											angular.element('#rkm-smart-suggestions-pane').addClass('rkm-smart-suggestions-pane');
											(element).toggleClass('toggle-smart-suggestions');
										}
								}
							};
							$scope.minimize = function(){
								angular.element('.modal-dialog').removeClass('modal-dialog-fullscreen');
								angular.element('.modal-content').removeClass('modal-content-fullscreen');
								if(!fromSmartSuggestion)
									angular.element('.modal-dialog').addClass('modal-dialog-default');
								else
									angular.element('.modal-dialog').addClass('modal-dialog-incident');

								$scope.isMinimized = true;
								if($scope.additionalInfo && $scope.additionalInfo.rkmRecords && $scope.additionalInfo.rkmRecords.length > 1) {
									var element = angular.element('#rkm-smart-suggestions-pane');
										if(element) {
											angular.element('#rkm-smart-suggestions-pane').removeClass('rkm-smart-suggestions-pane');
											(element).toggleClass('toggle-smart-suggestions');
										}
								}
							};
							kaDetailsModalState.isLoading=true;
							$scope.kaDetailsModalState=kaDetailsModalState;
							if($scope.additionalInfo && $scope.additionalInfo.isSFkm){
								kaDetailsModalState.isLoading=false;	
							}else{
								self.getKASetails(rkmItem).then(function(result){								
									self.processRkmTextFields(result);
									$scope.selectedRKM = result;
									kaDetailsModalState.isLoading=false;																
								});
							}
							$scope.rkmArticleStyle = '';
							$scope.cancel = function () {
								//For Smart suggestions
								if($scope.additionalInfo && $scope.additionalInfo.parentModelInstance)
									angular.element('.toggle-incident-modal-window').css('display', 'block');
									dismissSrdModal($uibModalInstance);
									$scope.minimize();
								};
							$scope.cancelForSmartSuggeestions = function() {
								if($scope.additionalInfo && $scope.additionalInfo.parentModelInstance) {
									$scope.additionalInfo.parentModelInstance.dismiss('cancel');
									if(supportModel.smartSuggestionsData && supportModel.smartSuggestionsData.isSuggestionsOpen==true){
										supportModel.smartSuggestionsData.isSuggestionsOpen = false;
										supportModel.smartSuggestionsData.clearSearchString = true;
									}
								}
							}

							$scope.iframeUrl = function () {
								var urlStr = '';
								if($scope.additionalInfo && $scope.additionalInfo.isSFkm){
									urlStr = $scope.additionalInfo.urlLink;
								}else{
									urlStr = '/apex/' + namespaceprefix + '__KM_ArticleView?id='+$scope.selectedRKM.ID+
									'&RecordTypeID='+$scope.selectedRKM.ArticleId+'&incidentID=&problemID=&popupHeader=Global%20Search'
									+'&standardLayout=false'
									+'&calledFromForm=true&enableSelfClosing=false&fromSS3=true';
								}
								return urlStr;
							};	
							$window.closeModelFromIframe = $scope.cancel;
							$window.closePopupWindowSSSmartSuggestions = $scope.cancelForSmartSuggeestions;
						}],
						windowClass: 'modal_knowledge-article'
					}).rendered.then(function(){
						if(!fromSmartSuggestion){
							angular.element('.modal-dialog').addClass('modal-dialog-default');
						}else{
							angular.element('.modal-dialog').addClass('modal-dialog-incident');
						}
					});
				};
				self.htmlDecode=function (input){
					if(input)
						return angular.element('<div>' + input + '</div>').text().replace(/&amp;/g, '&');
					return '';
				}
				self.getKASetails=function (id){
					var deferred = $q.defer();  
						var nullVar=[];
						 Visualforce.remoting.Manager.invokeAction(_RemotingActions.getKnowledgeArticles, id,true, null, function(result, event) {
							if (event.status) {	
								deferred.resolve(result.Result);
								return ;
							}else{
								deferred.reject();
							}
						});	
						return deferred.promise;	
					
				}
				self.processRkmTextFields = function (item) {
				/*	if(item.ArticleType=='How To')
						item.isHowTo= true;*/
					
					var bracketsRegex = /\[([^\]]+)\]/g;
					item.title=item.Title;
					item.cleanTitle = item.title.replace(bracketsRegex, '$1');
					
					if(	!item.Problem || item.Problem == "undefined")
						item.Problem='';
					if( !item.Solution || item.Solution == "undefined")
						item.Solution='';
					
			    	item.Problem=self.htmlDecode(item.Problem);
					item.Solution=self.htmlDecode(item.Solution);
					item.title = item.title.replace(bracketsRegex, '<b>$1</b>');
					item.IconClass = getSFDocumentURL(item.IconClass);
					if (item.description) {
						item.description = item.description.replace(bracketsRegex, '<b>$1</b>');
					}
					/*if(item.isHowTo){
						item.Solution = urlSanitizerService.sanitize(item.Solution);
					}*/
				};
				
				return self;
			}]
	);
