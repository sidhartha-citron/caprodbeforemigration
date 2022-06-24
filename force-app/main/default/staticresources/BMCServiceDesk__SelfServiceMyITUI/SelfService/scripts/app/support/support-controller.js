angular.module('supportModule')
		.controller('SupportController', ['$filter', '$uibModal', '$scope', '$state', 
		                                  'contactItModalService', 'urlSanitizerService', 'supportModel',
		                                  'userModel','$rootScope','$location',
		                                  'incidentCreateService','srdCreateService','rkmDetailsService','errorDialogService','supportSearchModel','supportService',
			function ($filter, $uibModal, $scope, $state, contactItModalService, urlSanitizerService,supportModel,
					userModel,$rootScope,$location,incidentCreateService,srdCreateService,rkmDetailsService,errorDialogService, supportSearchModel,supportService) {
				$scope.supportCtrlState = {};
				$scope.supportModel = supportModel;
				var availableWidth = ((window.innerWidth) * 0.815) * 0.75;
				var maxWidthForTile = isSwitchToEnhancedUI ? 270 : 216;
				var numberOfCol = Math.floor((availableWidth - 60) / maxWidthForTile);
				
				if(isSwitchToEnhancedUI){
					if(numberOfCol < 2){
						numberOfCol = 2;
					}				
				}else {
					if(numberOfCol < 3){
						numberOfCol = 3;
					}	
				}
								
				
				$scope.numberOfCols = numberOfCol;
				$scope.userModel = userModel;
				$scope.supportSearchModel = supportSearchModel;
				$scope.showHome=false;
				$scope.supportServiceModel=supportService;
				//$scope.howToModel = howToModel;
				$scope.searchBarHandler = function (isFocused){
					let searchDiv = document.getElementById('searchDiv');	
					if(searchDiv){
						if(isFocused === true){
							searchDiv.classList.add('support-search-active');
							document.getElementById('superboxId').focus();
						}
						else if(!$scope.supportCtrlState.searchText){
							searchDiv.classList.remove('support-search-active');
						}
						else {
							searchDiv.classList.add('support-search-active');
						}
					}
				};
				$scope.goHome = function () {					
					$state.go('support.common.home');
					resetHelpLink();
					document.getElementById('superboxId').style.height = '38px';
					enterPressedCount = 0;
					if(supportSearchModel && supportSearchModel.resetSearch){
						supportSearchModel.resetSearch();
					}
				};
				$scope.menu =[];
				$scope.showExistingTicketsLink= false;
				$scope.customTileName='';
				$scope.customTileTitle='';
				$scope.submitINSR='';
				$scope.submitLabel = '';
            	$scope.isAccessibilityMode = isAccessibilityMode;
				if(!lightningModule)
					initMenu();
				function initMenu(){
					supportModel.getTilesData().then(function(data){
						if(data.Tiles){
							for (i = 0; i < data.Tiles.length; i++) { 
								if(data.Tiles[i].shortName=='NEWINC'){
									$scope.menu.push(	{
										statePrefix: 'other-requests',
										state: 'support.other-requests.all',
										title: data.Tiles[i].Label, //selfServiceLabels.submitATicket
										icon: 'd-icon-file_text_o home-page-tile-icon',
										tileDescription : selfServiceLabels.SSSubmitTicketDescription
									});
								}
								if(data.Tiles[i].shortName=='NEWSR'){
									$scope.menu.push(	{
										statePrefix: 'problem-requests',
										state: 'support.problem-requests.all',						
										title: data.Tiles[i].Label, //selfServiceLabels.requestAService
										icon: 'd-icon-file_atom_o home-page-tile-icon',
										tileDescription : selfServiceLabels.SSSubmitSRDescription
									});
								}
								if(data.Tiles[i].shortName=='KA'){
									$scope.menu.push(	{
										statePrefix: 'how-to',
										state: 'support.howto.all',
										title: data.Tiles[i].Label, //selfServiceLabels.viewSelfKA
										icon: 'd-icon-lightbulb_o home-page-tile-icon',
										tileDescription : selfServiceLabels.SSKADescription
									});
								}
								if(data.Tiles[i].shortName=='APPROVAL'){
									$scope.menu.push(	{
										statePrefix: 'manageApprovals',
										state: 'support.manageApprovals.all',
										title: data.Tiles[i].Label, //selfServiceLabels.manageApprovals
										icon: 'd-icon-check_shield home-page-tile-icon',
										tileDescription : selfServiceLabels.SSApprovalDescription
									});
								}
								if(data.Tiles[i].shortName=='SHD'){
									$scope.menu.push(	{
										statePrefix: 'ViewServiceHealth',
										state: 'support.ViewServiceHealth.all',
										title: data.Tiles[i].Label,
										icon: 'd-icon-file_pulse_o home-page-tile-icon',
										tileDescription : selfServiceLabels.SSSHDDescription
									});
								}
								if(data.Tiles[i].shortName=='CMDB'){
									$scope.menu.push(	{
										statePrefix: 'ViewCIsAssets',
										state: 'support.ViewCIsAssets.all',
										title: data.Tiles[i].Label,
										icon: 'd-icon-cube_square home-page-tile-icon',
										tileDescription : selfServiceLabels.SSCMDBDescription
									});
								}
								if(data.Tiles[i].isCustom){
									$scope.menu.push(	{
										statePrefix: 'custom-link',
										state: 'support.customlink.all',
										title: data.Tiles[i].Label,
										icon: 'd-icon-file_o home-page-tile-icon',
										customTileName:data.Tiles[i].shortName,
										tileDescription : data.Tiles[i].tileDescription
									});
									if($scope.customTileName==''){
										$scope.customTileName=data.Tiles[i].shortName;
										$scope.customTileTitle=data.Tiles[i].Label;										
										$rootScope.$emit("showCustomTilesFromIndex", $scope.customTileName);
									}
								}
							}
						}
						
						
						if(data.showINCSRLST == true){
							$scope.showExistingTicketsLink= true;
						}
						$scope.submitINSR = data.submitINSR;
						if($scope.submitINSR.indexOf('SR:') > -1){
							$scope.submitLabel = selfServiceLabels.submitARequest;
						}else{
							$scope.submitLabel = selfServiceLabels.submitATicket;
						}
					});
				}
				
				$scope.getTitle = function () {
					if ($state.$current.self.name === 'support.problem-requests.all.segregation') {						
							return selfServiceLabels.srdResultsTitle;
					}
					if ($state.$current.data.type === 'problem-requests') {
						if(isCategoryHierarchyNavEnabled){
							return selfServiceLabels.requestAService;
						}
						else{
						if(typeof($state.params.categoryId) != 'undefined' && $state.params.categoryId != null && $state.params.categoryId != ''){
							var categoryArr = $state.params.categoryId.split('¬');
							if(categoryArr.length > 0){
								return $scope.supportModel.htmlUnescape(categoryArr[1]) + ": " + selfServiceLabels.srdResultsTitle;
							}else{
								return selfServiceLabels.Categories;
							}
						}else{
							return selfServiceLabels.Categories;
						}
						}						
					}
					if ($state.$current.data.type === 'other-requests') {
						
						return ;
					}
					if ($state.$current.self.name === 'support.howto.all.segregation') {						
							return selfServiceLabels.SS_Articles;
					}
					if ($state.$current.data.type === 'how-to') {
						if(EnableCategoriesForArticles){
							return selfServiceLabels.Categories;
						}else	
							return selfServiceLabels.SS_Articles;
					}
					if ($state.$current.data.type === 'search') {
						return selfServiceLabels.searchTitle;
					}
				    if($state.$current.data.type === 'manageApprovals'){
					    return selfServiceLabels.PendingApproval;
				    }
					if($state.$current.data.type === 'ViewCIsAssets'){
					    return selfServiceLabels.ViewCIsAssets;
				    }
					if($state.$current.data.type === 'customlink'){						
					    return $scope.customTileTitle;
					}
					if($state.$current.data.type === 'draft-requests'){						
					    return selfServiceLabels.Drafts;
					} 
				};
				
				$scope.setHelpURL = function(menuItem){
					console.log(menuItem.title);
					var helpURLMap = JSON.parse(helpURL);
					if(helpURLMap[menuItem.title] != undefined && helpURLMap[menuItem.title] != null && helpURLMap[menuItem.title] != ''){
						console.log(helpURLMap[menuItem.title]);
						helpLink = helpURLMap[menuItem.title];
					}else{
						console.log(helpURLMap['defaultURL']);
						helpLink = helpURLMap['defaultURL'];
					}
				};
				$scope.setCurrentTile = function(customTileName,title) {
					$scope.customTileName=customTileName;
					$scope.customTileTitle=title;	
					$rootScope.$emit("showCustomTilesFromIndex", $scope.customTileName);					
				};
				$scope.goToState = function(state) {
					$state.go(state);
					if(isCategoryHierarchyNavEnabled){
						supportModel.isProblemRequestAllState = state === 'support.problem-requests.all'? true : false;
					}
					supportService.setFocusToElement('firstElementFocusId');
				};	
				$scope.goBack = function () {
					var currCategoryId = $state.params.categoryId;
					if (currCategoryId) {
						$scope.prevState = getPrevCategoryState($state.$current.data.type);
					}
					$state.go($scope.prevState, $scope.prevStateParams);
				};

				var getPrevCategoryState = function (viewType) {
					var parentCategory = $scope.supportModel.parentCategoryHash[$state.params.categoryId];
					if (parentCategory ) {						
						$scope.prevStateParams = { categoryId: parentCategory.id };
						return 'support.' + viewType + '.all.category';
					} else {
						return 'support.' + viewType + '.all';
					}
				};

				var handlePrevState = function () {
					var backLinkTitle,
						viewType = $state.$current.data.type;

					$scope.prevStateParams = {};

					switch (viewType) {
						case 'problem-requests':
							if ($state.current.name === 'support.problem-requests.all') {
								/*backLinkTitle = $filter('i18n')('support.navigation.backToQuickPick');
								$scope.prevState = 'support.problem-requests.quick-pick';
								$scope.showBackLink = !_.isEmpty(supportModel.quickPickSrds);*/
								backLinkTitle='';
								$scope.showBackLink=false;
							} else  if ($state.params.categoryId) {
								backLinkTitle = 'Back';
								$scope.showBackLink = true;
							} else {
								backLinkTitle = '';
								$scope.showBackLink = false;
							}
							$scope.showHome=true;
							break;
						/*case 'other-requests':
							if ($state.current.name === 'support.other-requests.all') {
								backLinkTitle = $filter('i18n')('support.navigation.backToQuickPick');
								$scope.prevState = 'support.other-requests.quick-pick';
								$scope.showBackLink = !_.isEmpty(supportModel.quickPickSrds);
							} else if ($state.params.categoryId) {
								backLinkTitle = 'Back';
								$scope.showBackLink = true;
							} else {
								backLinkTitle = '';
								$scope.showBackLink = false;
							}
							break;*/
						case 'how-to':
							/*if ($state.current.name === 'support.howto.all') {
								backLinkTitle = $filter('i18n')('support.navigation.backToQuickPick');
								$scope.prevState = 'support.howto.quick-pick';
								$scope.showBackLink = true;
							} else {
								backLinkTitle = '';
							}*/
							$scope.showHome=true;
							break;
						default :
							backLinkTitle = '';
							$scope.showHome=false;
							$scope.showBackLink = false;
					}
					$scope.backLinkTitle = backLinkTitle;
				};

				var refreshSearchTextValue = function () {
					$scope.supportCtrlState.searchText = $state.params.searchText ? decodeURIComponent($state.params.searchText) : '';
					$scope.supportCtrlState.previouslySearchedText = $scope.supportCtrlState.searchText;
				};


				$scope.$watch(function(){return $state.current.name;}, handlePrevState);
				$scope.$watch('$state.params.searchText', refreshSearchTextValue);


				var showSearchResults = _.debounce(function (searchText) {
					if (searchText && (searchText.length >= 2 || $scope.supportModel.isCJKPattern(searchText) ) && $scope.supportCtrlState.previouslySearchedText !== searchText) {
						$state.go('support.search', { searchText: encodeURIComponent(searchText) });
					}
				}, 500);

				$scope.onSearchTextChange = function () {
					var text = $scope.supportCtrlState.searchText ? $scope.supportCtrlState.searchText.trim() : '';
					var searchInput = angular.element(superboxId);
					if (text) {
						showSearchResults(text);
					}

					$scope.searchBarHandler(true);
				};

				$scope.showTooltipDescription = function (menuState,menucustomTileName) {
					if(menucustomTileName==undefined)
					menucustomTileName='';
					var spanIconId = 'info'+menuState+menucustomTileName;
					var infoIconDom = document.getElementById(spanIconId);
					if(infoIconDom){
						infoIconDom.style.visibility='visible';
					}

				};

				$scope.hideTooltipDescription = function (menuState,menucustomTileName) {
					if(menucustomTileName==undefined)
					menucustomTileName='';
					var spanIconId = 'info'+menuState+menucustomTileName;
					var infoIconDom = document.getElementById(spanIconId);
					if(infoIconDom){
						infoIconDom.style.visibility='hidden';
					}
					$(".popover") != undefined && $(".popover").popover('hide');
				};

				$scope.clearTooltip = function () {
					$(".popover") != undefined && $(".popover").popover('hide');
				};

				$scope.clearSearchText = function () {
					$scope.supportCtrlState.searchText = '';
					document.getElementById('superboxId').style.height = '38px';
					enterPressedCount = 0;

					if(isAccessibilityMode){
						document.getElementById('superboxId').focus();
					}

					$scope.searchBarHandler(true);
				};
				$scope.changeSectionType = function (section) {
					var searchString = angular.element(superboxId).value;
					if(!searchString)
						searchString = $scope.supportCtrlState.previouslySearchedText;
					supportSearchModel.changeSectionType(section, searchString);
				};

			/*	$scope.createAppointment = function () {
					appointmentCreateService.showCreationDialog();
				};*/

				$scope.showContactIT = function () {
					contactItModalService.showModal();
				};
				

				$scope.showModalBrowser = function (state) {
					if (state) {
						$state.go(state);
					}
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					$uibModal.open({
						templateUrl: resourceUrl+'views/support/support-browser.html',
						controller: 'SupportBrowserController',
						windowClass: 'support-browser'
					})
						.result
							['finally'](function () {
								// when modal browser will gets closed, go to default support state to satisfy condition in srdCreateService.showSupportSrdCreateDialog()
								$state.go('support');
							})
				};

				function validateDirectLink(obj, module){
					if(obj!=null && obj!=undefined){
						var objId, errorMessage;
						switch(module){
							case 'KA':
								objId = obj.KAId;
								errorMessage = selfServiceLabels.kaDirectLinkErrorMsg;
								break;
							case 'TEMPLATE':
								objId = obj.TemplateId;
								errorMessage =selfServiceLabels.templateDirectLinkErrorMsg;
								break;
							case 'SR':
								objId = obj.serviceRequestDefinitionId;
								errorMessage = selfServiceLabels.srDirectLinkErrorMsg;
								break;
						}
			 	 		Visualforce.remoting.Manager.invokeAction(_RemotingActions.ValidateDirectLink,objId,module,function (result,event) {
							if(event.status){
								if(result!=null && result.length>0 && result[0]=='false'){
									errorDialogService.showDialog({
										title: selfServiceLabels.Error,
										titleI18nKey: 'support.sr.modal.cancel.errorHeader',
										text: errorMessage
									});
								}
								else{
									switch(module){
										case 'KA':
											rkmDetailsService.showDialog(objId);
											break;
										case 'TEMPLATE':
											incidentCreateService.showSupportSrdCreateDialog(objId);
											break;
										case 'SR':
											srdCreateService.showSupportSrdCreateDialog(obj);
											break;
									}
								}
							}
						},{escape:true});
			 	 	}
				}
				
				if($state.current.name == 'support.common.home' && lightningModule!='createInc' && lightningModule!='createSR'){
					var idParam = $location.search().id;
					var type = $location.search().type;
					if(idParam){
						if(type == 'ka'){
							var kaObj = {'KAId':idParam}
							validateDirectLink(kaObj, 'KA');
						}else{
							var templateObj = {'TemplateId':idParam}
							validateDirectLink(templateObj, 'TEMPLATE');
						}
					}
				} else if (lightningModule=='createInc' && templateId != ''){
					incidentCreateService.showSupportSrdCreateDialog(templateId);
				}
				if($state.current.name == 'support'){
					$state.go('support.common.home');					
				}
				if($state.$current.data.type === 'problem-requests'){
					var idParam = $location.search().id;
					if(idParam){
						var obj={
									'serviceRequestDefinitionId':idParam
						}	
						validateDirectLink(obj, 'SR');
					}
				}

				var enterPressedCount = 0;
				$scope.preventEnter = function(keyEvent) {
					if (keyEvent.which === 13 && enterPressedCount < 2){
						enterPressedCount++;
						var searchBox = document.getElementById('superboxId');
						searchBox.style.height = (searchBox.offsetHeight+21)+'px';
					}
				}
				
				$scope.submitTicket = function(){
					//if Incident
					if($scope.submitINSR == 'IN'){
						var text = $scope.supportCtrlState.searchText ? $scope.supportCtrlState.searchText.trim() : '';
						incidentCreateService.showSupportSrdCreateDialog('','','',text);
					}
					else if($scope.submitINSR.indexOf('SR:') > -1){//If request catch all
						var srdId = $scope.submitINSR.split(':');
						item = {};
						item.id = srdId[1];
						item.recordId = srdId[1];
						item.serviceRequestDefinitionId = srdId[1];
						
						supportModel.isActiveSRD(item.id).then(function(data){
							if(data){
								srdCreateService.showSupportSrdCreateDialog(item);
							}else{
								errorDialogService.showDialog({
									title: selfServiceLabels.Error,
									titleI18nKey: 'support.sr.modal.cancel.errorHeader',
									text: selfServiceLabels.ServiceRequestErrorMessage
								});
							}
						});
						
					}
					
				}
			}
		]);
