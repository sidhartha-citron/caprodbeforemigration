	angular.module('supportModule')
		.controller('HowToController', ['howToModel', '$uibModal', '$scope', '$state', 'supportModel','rkmDetailsService','supportService',
			function (howToModel, $uibModal, $scope, $state, supportModel,rkmDetailsService,supportService) {
				$scope.howToModel = howToModel;
				$scope.supportModel = supportModel;
				$scope.resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');		
				$scope.moduleName = 'KA';
				$scope.namespaceWithoutUnderscore = namespace.replace('__','');
				$scope.supportServiceModel=supportService;
				$scope.sortBy=selfServiceLabels.SortOrder.replace('{0}','');
				$scope.sortByTitle=selfServiceLabels.SortOrder.replace('{0}',selfServiceLabels.ServiceTargetTitle);
				$scope.sortByPopularity=selfServiceLabels.SortOrder.replace('{0}',selfServiceLabels.Popular);
				function init(){					
					$scope.dynamicOrder = '';
					supportModel.initDropDownBreadCrumbsData();
					$scope.dropDownBreadCrumbsData = supportModel.dropDownBreadCrumbsData;					
				}
				
				$scope.openItem = function (item) {
					rkmDetailsService.openItem(item);
				};
				$scope.selectItem = function (category,isForward) {
					supportModel.selectItem(category,isForward,$scope,$scope.moduleName);
				};				
				$scope.goBackToCategory = function(index){
					supportModel.goBackToCategory(index,$scope,$scope.moduleName);
				};	
				$scope.$on('$stateChangeSuccess', function () {
					if (EnableCategoriesForArticles && $state.$current.self.name != 'support.howto.all.segregation') {
						supportModel.dataLoading = true;
						init(); 
						$scope.howToModel.fetchKACategories()					
							.then(function (result) {
								_.each(result,function(cat){
									supportModel.categoriesDescMap[cat.categoryId] = cat.categoryDescription;
								});
								$scope.topLevelCategories = result;								
								supportModel.dataLoading = false;
								supportService.setFocusToElement('firstElementFocusId');
							});
						$scope.howToItems = [];	
					}	
				});		
				$scope.setOrder = function(orderByParam) {					
			        if(typeof orderByParam !='undefined' && orderByParam!=null){
			        	if(orderByParam == 'title'){
			        		$scope.dynamicOrder = orderByParam;
			        	}
			        	else
			        		$scope.dynamicOrder = '';
			        }
			    	else{
			    		$scope.dynamicOrder = '';
			    	}
    			};
				init();	
				if(EnableCategoriesForArticles){
					if ($state.$current.self.name === 'support.howto.all.segregation') {
						$state.go('support.howto.all');
					}
				}else{
					supportModel. dataLoading = true;
					rkmDetailsService.getKASetails(null)
						.then(function (result) {
							howToModel.allHowTos = result;
							_.each(howToModel.allHowTos, function (item) {
								rkmDetailsService.processRkmTextFields(item);
							});
							$scope.howToItems = howToModel.allHowTos;
							supportModel. dataLoading = false;
							$scope.KADisplayed = true;
						})
						['finally'](function () {
							supportModel.dataLoading = false;
							supportService.setFocusToElement('firstElementFocusId');
						});
				}				
			}
		]);
