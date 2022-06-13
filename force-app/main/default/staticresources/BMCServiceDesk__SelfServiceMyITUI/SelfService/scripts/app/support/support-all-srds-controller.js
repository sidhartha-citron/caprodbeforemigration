	angular.module('supportModule')
		.controller('AllSrdController', ['$scope', '$state', '$uibModal', 'supportModel',
		 'srdCreateService', '$q','userModel','incidentCreateService','supportService',
		 'unifiedCatalogModel', '$filter',

			function ($scope, $state, $uibModal, supportModel, srdCreateService,
				 $q,userModel,incidentCreateService,supportService,unifiedCatalogModel,$filter) {
				$scope.supportModel = supportModel;
				$scope.userModel = userModel;	
				supportModel.initDropDownBreadCrumbsData();	
				$scope.dropDownBreadCrumbsData = supportModel.dropDownBreadCrumbsData;	
				$scope.supportServiceModel=supportService;
			$scope.showCategory = supportModel.showCategory;
			$scope.upScrollAvailable = false;
			$scope.downScrollAvailable = false;
				$scope.unifiedCatalogModel = unifiedCatalogModel;
				$scope.isCategoryHierarchyNavEnabled = isCategoryHierarchyNavEnabled;
			supportModel.isProblemRequestAllState = true;
				$scope.isAccessibilityMode = isAccessibilityMode;
				$scope.sectionsLoadingFlag = false;
				var noOfRec = getRecordsCount($scope);
				itemsPerSection = noOfRec[0];
				numberOfColumns = noOfRec[1];
				$scope.allSrdCtrlState = {
					numberOfColumns : noOfRec[1]
				}
				$scope.section = [];
				getSRSection();
				
				function getSRSection() {
					$scope.sectionsLoadingFlag = true;
					if(isCategoryHierarchyNavEnabled){
						unifiedCatalogModel.getAllSections(itemsPerSection)
						.then(function (sections) {
							var filteredSections = [];
							for (var key in sections) {
								if(key.indexOf('SR') !== -1){
									$scope.section = sections[key];
								}
							}												
						})
						.finally(function () {
							$scope.sectionsLoadingFlag = false;
						});	
					}		
				}

				$scope.showSRDDetails = function (srd) {
					srdCreateService.showSupportSrdCreateDialog(srd);
				};	

				$scope.selectItem = function (category,isForward) {
					if(category.id){
						if(isCategoryHierarchyNavEnabled && supportModel.showCategory){
							supportModel.toggleBrowseCategory();
						}
						supportModel.selectItem(category,isForward,$scope,'SR');
					}
			};

			$scope.initBrowseCategory = function (){
				var scrollCategoryUp = document.getElementById('scrollCategoryUp');
				if(scrollCategoryUp){
					scrollCategoryUp.style.backgroundImage = "url("+SDEFStylesURL+"/SDEFicons/arrow-up.png)";
				}
				var scrollCategoryDown = document.getElementById('scrollCategoryDown');
				if(scrollCategoryDown){
					scrollCategoryDown.style.backgroundImage = "url("+SDEFStylesURL+"/SDEFicons/arrow-down.png)";
				}
				var browseCategoryButtonIcon = document.getElementsByClassName('browseCategoryButtonIcon');
				if(browseCategoryButtonIcon && browseCategoryButtonIcon.length > 0){
					for(var i=0; i<browseCategoryButtonIcon.length; i++){
						browseCategoryButtonIcon[i].style.backgroundImage = "url("+SDEFStylesURL+"/SDEFimages/ic-open-folder.svg)";
					}
				}
				var scrolling = false;
				// Wire up events for the Category 'scrollUp' link
				$("#scrollCategoryUp").bind("mouseover", function(event) {
					scrolling = true;
					scrollCategoryContent("up");
				}).bind("mouseout", function(event) {
					scrolling = false;
				});

				// Wire up events for the Category 'scrollDown' link
				$("#scrollCategoryDown").bind("mouseover", function(event) {
					scrolling = true;
					scrollCategoryContent("down");
				}).bind("mouseout", function(event) {
					scrolling = false;
				});

				function scrollCategoryContent(direction) {
					var amount = (direction === "up" ? "-=15px" : "+=15px");
					$("#browseCategoryContent").animate({
						scrollTop: amount
					}, 1, function() {
						if (scrolling) {
							scrollCategoryContent(direction);
						}
						
						//Hide Up Scroll
						var contentPosition = $('#browseCategoryContent').scrollTop();
						$scope.upScrollAvailable = (contentPosition == 0) ? false : true;
						
						//Hide Down Scroll
						var lastElementList = $('#browseCategoryContent .category-dropdown-nav:last');
						var lastDiv = $('#scrollEndDiv');
						if(lastElementList && lastElementList.offset() && lastElementList.offset().top && lastDiv && lastDiv.offset() && lastDiv.offset().top){
							if(lastElementList.offset().top > lastDiv.offset().top){
								$scope.downScrollAvailable = true;
							}else{
								$scope.downScrollAvailable = false;
							}
						}
					});
				}
			};
			
			$scope.browseCategory = function(){
				//Initially hide the Up and Down scroll
				$scope.upScrollAvailable = false;
				$scope.downScrollAvailable = false;
				supportModel.toggleBrowseCategory();

				setTimeout(function(){
					//Check if category is present and down scroll is required or not
					var lastElement = $('#browseCategoryContent .category-dropdown-nav:last');
					if($scope.showCategory && lastElement && lastElement.length > 0){
						var childTotalHeight = lastElement.height() * $scope.browseCategoryData.length;
						//Show first level category down scroll if categories are not visible in the view port
						if(childTotalHeight > $('#browseCategoryContent').height()){
							$scope.downScrollAvailable = true;
						}
					}else if($scope.showCategory){
						//Show No Record Found if category is not present
						var noRecordObj = {
							'name': selfServiceLabels.MsgNoRecordFound,
							'accessibilityName': isAccessibilityMode ? selfServiceLabels.MsgNoRecordFound : ''
						};
						$scope.browseCategoryData=[noRecordObj];
					}
				},100);
				
				//Clear second and third level categories
				supportModel.showSecondLevelCategories = false;
				supportModel.secondCategoryData = {};
				supportModel.showThirdLevelCategories = false;
				supportModel.thirdCategoryData = {};
				
				if(supportModel.showCategory && $scope.browseCategoryData && $scope.browseCategoryData.length > 0){
					for(var i=0; i<$scope.browseCategoryData.length; i++){
						$scope.browseCategoryData[i].hovering=false;
					}
				}
				
				if(isAccessibilityMode){
					setTimeout(function(){
						var browseCategoryList = document.getElementById("browseCategoryContent");
						if(browseCategoryList){
							browseCategoryList.focus();
						}
					},100);
				}
				$(".popover").popover('hide');
			};

			$scope.getCategoryDivClass = function(item){
				if(isAccessibilityMode && item.hasErrorMsg){
					return 'category-dropdown-nav categoryDivFocus browseCategoryErrorDivClass';
				}else if(isAccessibilityMode){
					return 'category-dropdown-nav categoryDivFocus';
				}else if(item.hasErrorMsg){
					return 'category-dropdown-nav browseCategoryErrorDivClass';
				}else{
					return 'category-dropdown-nav';
				}
			};

			$scope.getCategoryTextClass = function(item){
				if(item.hasErrorMsg){
					return 'browseCategoryTextClass browseCategoryErrorClass';
				}else if(item.hovering){
					return 'browseCategoryTextClass browseCategoryhoverClass';
				}else{
					return 'browseCategoryTextClass';
				}
			};

			$scope.handleCategoryEnter = function(event, item){
				if(item.id){
					for(var i=0; i<$scope.browseCategoryData.length; i++){
						$scope.browseCategoryData[i].hovering=false;
					}
					item.hovering=true;
					$scope.lastCategory=item.id;
					$scope.rect=event.target.getBoundingClientRect();
					supportModel.showThirdLevelCategories = false;
					supportModel.thirdCategoryData = {};
					supportModel.browseCategoryHash={};
					supportModel.getBrowseCategories(item.id, item.parentCategory).then(function(){
						if(item.id == $scope.lastCategory){
							item.subCategories=[];
							item.subCategories = _.filter(supportModel.browseCategoryHash[item.id], function (srd) {
								if(srd.catImage && srd.catImage != 'useDefaultFromStaticResource') {
									srd.catImage = getSFDocumentURL('', srd.catImage);
									if(isAccessibilityMode){
										srd.accessibilityName = $scope.getAriaLabel(srd);
									}
								}
								return srd.name != undefined;
							});
							item.subCategories = $filter('orderBy')(item.subCategories, 'name');
							if(item.leaf == 'false' && item.subCategories && item.subCategories.length == 0){
								var errorObj = {
									'name': selfServiceLabels.SSServiceRequestNotFound,
									'hasErrorMsg': true,
									'accessibilityName': isAccessibilityMode ? selfServiceLabels.SSServiceRequestNotFound : ''
								};
								item.subCategories=[errorObj];
							}
							item.showChildCategories = (item.subCategories && item.subCategories.length > 0) ? true : false;
							
							var buttonTop = document.getElementById('browseCategoryActive').getBoundingClientRect();
							var childTop = $scope.rect.top - buttonTop.top;
							item.childUpScrollAvailable=false;
							item.childDownScrollAvailable=false;

							var lastElement = $('#browseCategoryContent .category-dropdown-nav:last');
							if(lastElement && lastElement.height() && item.subCategories.length > 0){
								var childrenHeight = lastElement.height() * item.subCategories.length;
								var endPosition = document.getElementById('scrollEndDiv').getBoundingClientRect().top;
								var browseCategoryTop = $('#browseCategoryContent').offset().top;
								if(($scope.rect.top + childrenHeight) > endPosition){

									var newTop;
									var maxHeight;
									if(($scope.rect.top - buttonTop.top) + buttonTop.height > childrenHeight){
										newTop = ($scope.rect.top - childrenHeight - buttonTop.top) + lastElement.height();
										maxHeight = endPosition - buttonTop.top - newTop;
									}else if(($scope.rect.top - buttonTop.top - buttonTop.height) == 1){
										newTop = buttonTop.height + 1;
										maxHeight = endPosition - buttonTop.top - newTop - lastElement.height();
									}else{
										newTop = buttonTop.height + lastElement.height();
										maxHeight = endPosition - buttonTop.top - newTop - lastElement.height();
									}
									
									if(childrenHeight > maxHeight){
										item.childDownScrollAvailable=true;
									}

									item.styleData = {top: newTop+'px'};
									item.styleData['max-height'] = maxHeight+'px';
									item.scrollUpStyle = {top: newTop+'px', left: '266px'};
									item.scrollDownStyle = {top: ((newTop+maxHeight)-30)+'px', left: '266px'};
									item.scrollEndStyle = {top: (newTop+maxHeight)+'px'};

									item.scrollUpScrollImage={};
									item.scrollUpScrollImage['background-image'] = "url("+SDEFStylesURL+"/SDEFicons/arrow-up.png)";
									item.scrollUpScrollImage['margin-top'] = '8px';
									item.scrollDownScrollImage={};
									item.scrollDownScrollImage['background-image'] = "url("+SDEFStylesURL+"/SDEFicons/arrow-down.png)";
									item.scrollDownScrollImage['margin-top'] = '12px';
								}else{
									var adjustedTop = (childTop - buttonTop.height) % lastElement.height();
									adjustedTop = (lastElement.height() - adjustedTop) < 10 ? 0 : adjustedTop;
									item.styleData = {top: (childTop - adjustedTop)+'px'};
								}
							}
							supportModel.secondCategoryData={};
							supportModel.secondCategoryData.styleData = item.styleData;
							supportModel.secondCategoryData.data = item;
							supportModel.showSecondLevelCategories = item.showChildCategories;
							supportModel.showThirdLevelCategories = false;
							supportModel.thirdCategoryData = {};

							if(isAccessibilityMode){
								setTimeout(function(){
									var subList = document.getElementById('secondLevelCategoryId');
									if(subList){
										subList.focus();
									}
								},500);
							}
						}
					});
				}
			};
			
			$scope.handleCategoryLeave = function(item){
				clearTimeout(1000);
				$(".popover").popover('hide');
			};

			$scope.catKeyPressHandler = function(event, item){
				if (isAccessibilityMode && event.keyCode === 39) {
					supportModel.firstParentElement = event.currentTarget;
					$scope.handleCategoryEnter(event, item);
				}
				event.stopPropagation();
			};

			$scope.getAriaLabel = function(item){
				var catDescription = item.categoryDescription ? item.categoryDescription : '';
				if(item.leaf == 'false'){
					return item.name + '. ' + selfServiceLabels.SSExpandCollapseCategory + ' ' + catDescription;
				}else{
					return item.name + '. ' + catDescription;
				}
			};
			
			$scope.goBackToCategory = function(index){	
				if(index == -1){
					if(isCategoryHierarchyNavEnabled)
							supportModel.isProblemRequestAllState = true;
					$scope.goToState('support.problem-requests.all');
				}
				else
					supportModel.goBackToCategory(index,$scope,'SR');
				};
				$scope.$watchCollection('supportModel.dropDownBreadCrumbsData', function () {	
					$scope.dropDownBreadCrumbsData = supportModel.dropDownBreadCrumbsData;
				});
			$scope.$watchCollection('supportModel.showCategory', function () {	
				$scope.showCategory = supportModel.showCategory;
			});
			$scope.$watchCollection('supportModel.topLevelCategories', function () {	
				$scope.browseCategoryData = supportModel.topLevelCategories;
				
				if($scope.browseCategoryData && $scope.browseCategoryData.length > 0){
					//Sort categories
					var orderByField = supportModel.config.isSRD ? 'title' : 'name';
					$scope.browseCategoryData = $filter('orderBy')($scope.browseCategoryData, orderByField);
					
					//Show only first 1000 categories
					if($scope.browseCategoryData.length > 1000){
						$scope.browseCategoryData.splice(1000 - $scope.browseCategoryData.length);
					}

					//Set aria-label for categories
					if(isAccessibilityMode){
						for(var i=0; i<$scope.browseCategoryData.length; i++){
							$scope.browseCategoryData[i].accessibilityName=$scope.getAriaLabel($scope.browseCategoryData[i]);
						}
					}
				}
			});
				$scope.$on('$stateChangeSuccess', function () {
					if (lightningModule == ''){
						if ($state.current.data.type == 'problem-requests' && $state.$current.self.name != 'support.problem-requests.all.segregation') {
							loadTopLevelCategories();
							supportModel.initDropDownBreadCrumbsData();
						}else if ($state.current.data.type == 'other-requests') {
							loadOtherRequests();
						}		
					}
				});	
				initLightningModule();				
				if ($state.$current.self.name === 'support.problem-requests.all.segregation') {
						$state.go('support.problem-requests.all');
				}	
				function loadTopLevelCategories(){
					var promises;
					$scope.dataLoading = true;
					if ($state.current.data.type == 'problem-requests') {
						promises = [supportModel.getProblemCategories(supportModel.getAllSrdCategoriesSuccessCallback)];
					} 
					$q.all(promises)
						.then(function () {
							$scope.dataLoading = false;
							supportService.setFocusToElement('firstElementFocusId');

							if(categoryIdFromURL){
								supportModel.getCategoryInfo(categoryIdFromURL).then(function(){
									if(supportModel.categoryInfo && supportModel.categoryInfo.length > 0){
										supportModel.selectItem(supportModel.categoryInfo[supportModel.categoryInfo.length - 1],true,$scope,'SR');
									}
								});
							}
					});
				}
				function initLightningModule(){
					if (lightningModule=='createInc' && templateId != ''){
						incidentCreateService.showSupportSrdCreateDialog(templateId);
						$state.go('support.common.home');
					}else if ($state.current.data.type == 'other-requests' && (lightningModule=='createInc' || lightningModule == 'createSR')){
						loadOtherRequests();
					}
				}
				function loadOtherRequests(){
					$scope.dataLoading = false;
					incidentCreateService.showSupportSrdCreateDialog();
					$state.go('support.common.home');
				}
				function getRecordsCount() {
					var availableWidth = ((window.innerWidth) * 0.815) * 0.75;
					var numberOfCol = Math.floor((availableWidth - 60) / 270);
					if(numberOfCol < 2){
						numberOfCol = 2;
					}
					var numberOfSections =  ( isIncSRTogether ? 2 : 3);
					var availableHeight = ((document.body.offsetHeight - 75 - 50 - 68 - (91 * numberOfSections)) / 55 );
					var numberOfRows = Math.floor((availableHeight) / numberOfSections);
					if(numberOfRows < 2){
						numberOfRows = 2;
					}
					var noOfItems = numberOfCol * numberOfRows;
					var resultArr =new Array(3);
					resultArr[0] = noOfItems; resultArr[1] = numberOfCol; resultArr[2] = numberOfRows;
					return resultArr;
				}
			}
		]);
