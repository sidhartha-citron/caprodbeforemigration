	angular.module('selfServiceApp')
		.controller('MainController', [ '$http','$log', '$uibModal', '$uibModalStack','$q', '$rootScope', '$scope', '$state', '$stateParams', '$timeout', '$window','profileModel','userModel','thumbnailCache','confirmationDialogService','supportModel','broadcastDetailService','draftService','supportService',
			function ($http, $log, $uibModal, $uibModalStack,  $q,  $rootScope, $scope, $state,
				$stateParams,  $timeout,  $window,profileModel,userModel,thumbnailCache,confirmationDialogService,supportModel,broadcastDetailService,draftService,supportService) {

				var activityStreamNotifications;

				// these will hold state info for navigation (at the end of init()) after feature settings are loaded
				var nextState, nextStateParams, recursiveCall;
				var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
				$rootScope.selfServiceLabels=selfServiceLabels;
				$rootScope.CKPluginLabels=CKPluginLabels;
				$rootScope.resourceUrl=resourceUrl;
				$scope.userModel = userModel;
				$scope.profileModel = profileModel;
				$scope.thumbnailCache = thumbnailCache;
				$scope.logoUrl=logoUrl;
				if(companyUrl) 
					$scope.companyUrl=companyUrl;
				else
					$scope.companyUrl='';
				$scope.logoTip=logoTip;
				$scope.$state = $state;
				$scope.$stateParams = $stateParams;
				$scope.isSiteUser = isSiteUser;
				$scope.showReturnUrl = showReturnUrl;
				$scope.showMyProfile = showMyProfile;
				$rootScope.hasAPIEnabledPermission = hasAPIEnabledPermission;
				$scope.supportServiceModel=supportService;
				$scope.isAccessibilityMode = isAccessibilityMode;
				
				$scope.onLoadLogoFocusAccessibilityMode = function() {
	                var logoCompany = document.getElementById('bmcLink');
	                if (isAccessibilityMode && logoCompany)
	                    logoCompany.focus();

	            }
				$scope.timelineRefreshTimeout = 30000;
				$scope.isRtl = $window.isRtl;
				var defaultNavigationTabs=[
						{
                            name: selfServiceLabels.home,
                            state: 'support.common.home'                                                     
                        } 
                ];
				$rootScope.navigationTabs = defaultNavigationTabs ;
				function init(){
					$rootScope.isSwitchToEnhancedUI = isSwitchToEnhancedUI;	
					if(!lightningModule)
						getBroadcastMessages();
					$scope.isRTLRequired=isRTLRequired;
					userModel.getLoggedInUserId().then(function () {
						if (userModel.userId) {
							profileModel.getProfileData(userModel.userId);
						}
					});
					if(supportModel.enableSaveAsDraft) {
						draftService.fetchSavedDraftCount().then(function (result) {
							supportModel.savedDraftCount = result[0].count;
						});
					}
				}
				init();			
				
				$scope.setChatbotURL = function() {
					supportModel.getChatBotUrl().then(function(data){
						var iFrameElement = angular.element('#chatbot-iframe');
						if(iFrameElement && iFrameElement[0]){	
							if(data != ''){						
								if(isLightningThemeDisplayed && document.referrer) {
									data = data.replace(/LIGHTNING_URL/g, encodeURIComponent(document.referrer));
								}else{
												//to replace 'LIGHTNING_URL,'       //to replace 'LIGHTNING_URL '
									data = data.replace('LIGHTNING_URL%2C', '').replace('LIGHTNING_URL+','');
								}
								iFrameElement[0].src = data;
							}else{
								iFrameElement[0].setAttribute('hidden',true);
							}
						}
						
					});
				};
				
				$rootScope.openHelp = function(){
						window.open(helpLink, '_blank');
				}
				
				$rootScope.logOut=function () {					
					window.location=logoutURL;
				};
				
				$rootScope.goBackToSalesforce=function () {					
					window.location=sfHomeURL;
				};

				$rootScope.decodeText=function (text) {
					return supportModel.decodeText(text);
				};

				$scope.isLightningView = function(){
					return((typeof sforce != 'undefined') && sforce && (!!sforce.one) && isLightningThemeDisplayed);
				}

				function getBroadcastMessages(){
				   Visualforce.remoting.Manager.invokeAction(
					   _RemotingActions.getBroadcastMsgsList,
					   function(result, event){
					   		$scope.allBroadcasts = result;
						   $scope.BroadcastSize = result != null ? result.length-1 : 0;
						   $scope.broadcast = result;
						   $scope.AllScrollingBroadcasts = [];
						   $scope.AllScollingBroadcastSize = 0;
						   $scope.message = '';
						   $scope.isBroadcast_MessageScrollEnabled = ($scope.broadcast[$scope.BroadcastSize].isBroadcast_MessageScrollEnabled).toLowerCase() == 'true';
						   $scope.broadcast.ssTickerVisible = $scope.broadcast[$scope.BroadcastSize].ssTickerVisible;
						   var msgSeparator = String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) +String.fromCharCode(160);
	
						   if(!$scope.isBroadcast_MessageScrollEnabled){
								if($scope.isRTLRequired == false){
								angular.forEach($scope.allBroadcasts,function(broadcast){
									if(broadcast.BroadcastMessage){
										broadcast.BroadcastMessage = $rootScope.decodeText(broadcast.BroadcastMessage);
										if(broadcast.broadcastScrollMessage == 'true'){
											if(broadcast.BroadcastMessage.length > 255)
													$scope.message += broadcast.BroadcastMessage.slice(0,255) + msgSeparator ;
											else
													$scope.message += broadcast.BroadcastMessage + msgSeparator ;
										}
									}
								});
								}else{
									var marqueeElm= document.getElementById('broadcast-ticker');
									if(marqueeElm){
										$scope.setBroadcastMessageForRTL();
									}else{
									setTimeout(function(){
										//fucntion to create broadcast message for text scrolling for hebrew
										$scope.setBroadcastMessageForRTL();
									},100);	
									}
									
								}
								
								if($scope.broadcast[$scope.BroadcastSize].TickerSpeed && $scope.broadcast[$scope.BroadcastSize].TickerSpeed!= "null")
								   $scope.broadcast.TickerSpeed = parseInt($scope.broadcast[$scope.BroadcastSize].TickerSpeed);
							   else
								   $scope.broadcast.TickerSpeed = 5;
						   }else{
							   angular.forEach($scope.allBroadcasts,function(broadcast){
								   broadcast.BroadcastMessage = $rootScope.decodeText(broadcast.BroadcastMessage);								
									if(broadcast.broadcastScrollMessage == 'true'){
										$scope.AllScrollingBroadcasts.push(broadcast);
									}
								});
							   $scope.AllScollingBroadcastSize = $scope.AllScrollingBroadcasts.length;
							   $scope.currentBroadcast = 1;
							   if($scope.broadcast[$scope.BroadcastSize].interval && $scope.broadcast[$scope.BroadcastSize].interval!= "null")
								   $scope.broadcast.interval = parseInt($scope.broadcast[$scope.BroadcastSize].interval)*1000;
							   else
								   $scope.broadcast.interval = 10000;
								setTimeout(function(){$scope.showNextBroadcast($scope.currentBroadcast);},$scope.broadcast.interval);
						   }								
						   $scope.$apply();
					   },
					   {escape: true});
					   
					   setTimeout(function(){getBroadcastMessages();},300000);
				}
				
				
				
				$scope.setBroadcastMessageForRTL = function () {
					var parentDiv  = document.createElement('div');
					parentDiv.setAttribute("class","broadcast-rtl-container-css");
					var msgSeparator = String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) +String.fromCharCode(160);
	
					angular.forEach($scope.allBroadcasts,function(broadcast){
						if(broadcast.BroadcastMessage){
							broadcast.BroadcastMessage = $rootScope.decodeText(broadcast.BroadcastMessage);
							if(broadcast.broadcastScrollMessage == 'true'){
							
								var dataDiv  = document.createElement('div');										
								dataDiv.classList.add("broadcast-msg-rtl-css");				
								var msgText = broadcast.BroadcastMessage.slice(0,255) + msgSeparator ;
								var textNode = document.createTextNode(msgText);
								dataDiv.appendChild(textNode);
								parentDiv.appendChild(dataDiv);
								var mq = document.getElementById('broadcast-ticker');
								if(document.getElementsByClassName('broadcast-rtl-container-css')[0] == undefined){
									mq.appendChild(parentDiv);
								}
								else{
									var ContainerItem = document.getElementsByClassName('broadcast-rtl-container-css')[0];
									mq.replaceChild(parentDiv, ContainerItem);
								}	
							}
													
						}
									
					});
					
					
				}
				
				$scope.navigationTabClass = function (navItem) {
					var
						statesPrefixes = navItem.selectedStatesPrefixes || navItem.state,
						tabClass = 'modules-nav__item';

					if (!angular.isArray(statesPrefixes)) {
						statesPrefixes = [statesPrefixes];
					}

					for (var i = 0, l = statesPrefixes.length; i < l; i++) {
						if ($state.current.name.indexOf(statesPrefixes[i]) === 0) {
							tabClass = 'modules-nav__item_selected';
							break;
						}
					}

					return tabClass;
				};
	            $scope.openClientForm = function(sourceId) {
	                userModel.showClientFormDialog(null, sourceId);
				};
				
				$scope.showBroadcastPopup = function (HighlightBroadcastid, event) {
					if (event) {
	                    event.preventDefault();
	                }
					if(HighlightBroadcastid == undefined || HighlightBroadcastid == null){
						HighlightBroadcastid = $scope.allBroadcasts[0].id;
					}
					var recListData = [];
					var additionalInfo = {};
					angular.forEach($scope.allBroadcasts,function(broadcast){
								if(broadcast.BroadcastMessage){
									var recData = {
											broadcastMessage__c : broadcast.BroadcastMessage,
											id : broadcast.id,
											Priority_ID__c:broadcast.priority
									}; 
									recListData.push(recData);
								}
                            });
					additionalInfo.selecteBrId = HighlightBroadcastid;
					broadcastDetailService.showBroadcastDialog(recListData, additionalInfo);
				};
				
				$scope.showNextBroadcast = function (currentpos) {
					if($scope.AllScollingBroadcastSize > 1 ){
					//var recursiveCall;
					if(recursiveCall)
						clearTimeout(recursiveCall);
					if(currentpos != $scope.AllScollingBroadcastSize)
						$scope.currentBroadcast = currentpos + 1;
					else
						$scope.currentBroadcast = 1;
					recursiveCall = setTimeout(function(){$scope.showNextBroadcast($scope.currentBroadcast);},$scope.broadcast.interval);
					}
				};
				
				$scope.showPreviousBroadcast = function (currentpos) {
					if(recursiveCall)
						clearTimeout(recursiveCall);
					if(currentpos != 1)
						$scope.currentBroadcast = currentpos - 1;
					else
						$scope.currentBroadcast = $scope.AllScollingBroadcastSize;
					recursiveCall = setTimeout(function(){$scope.showNextBroadcast($scope.currentBroadcast);},$scope.broadcast.interval);
				};
				
				$scope.setBroadcastMsgWidth = function () {
					
					var recordFrame= document.getElementById('headerId');
					
					var frameWidth= recordFrame.innerWidth || recordFrame.clientWidth; 
					if($scope.AllScollingBroadcastSize == 0 || $scope.AllScollingBroadcastSize == 1 )
					{
					$('#ScrollMsgId').css('max-width', frameWidth-220 +'px'); 
					$('#ScrollMsgId').css('width', frameWidth-220 +'px'); 
					
					}else{
					$('#ScrollMsgId').css('max-width', frameWidth-295 +'px'); 
					$('#ScrollMsgId').css('width', frameWidth-295 +'px'); 
					}
					
				};
				
				$(window).resize(function(){
					$scope.setBroadcastMsgWidth();
				});
				$scope.setBroadcastMsgWidthonLoad = function () {
					setTimeout(function(){
					$scope.setBroadcastMsgWidth();},100);
   
				};
				
				
			}]);
