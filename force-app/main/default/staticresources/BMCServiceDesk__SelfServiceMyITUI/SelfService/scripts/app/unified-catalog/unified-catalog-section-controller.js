
	angular
		.module('unifiedCatalogModule')
		.controller('UnifiedCatalogSectionController', UnifiedCatalogSectionController);

	UnifiedCatalogSectionController.$inject = ['pageBreadcrumbsModel', '$q', '$scope', '$state', '$stateParams',
		'unifiedCatalogModel','supportService'];

	function UnifiedCatalogSectionController(pageBreadcrumbsModel, $q, $scope, $state, $stateParams, unifiedCatalogModel,supportService) {
		var noOfRec = getRecordsCount($scope);
		var unifiedCatalogSectionCtrlState = $scope.unifiedCatalogSectionCtrlState = {
			itemsLoading: false,
			numberOfColumns: noOfRec[1],
			sort: {
				types: {
					name: {
						field: 'title',
						desc: false,
						i18n: 'catalog.sorting.byName'
					},
					rating: {
						field: 'extData.rating',
						desc: true,
						i18n: 'catalog.sorting.byRating'
					}
				},
				activeType: null
			}
		};

		function init() {
			getItems();
			pageBreadcrumbsModel.setItems([
						{
							state: 'support.common.home',
							label: selfServiceLabels.home
						},
						{
							label: unifiedCatalogSectionCtrlState.section.title
						}
			]);
					//unifiedCatalogSectionCtrlState.categories = extractCategories(unifiedCatalogSectionCtrlState.section.items);
		
		}


		function getItems() {
			//unifiedCatalogSectionCtrlState.sectionLoading = true;

			unifiedCatalogSectionCtrlState.section = unifiedCatalogModel.getSectionWithItems($stateParams.id);
			return unifiedCatalogSectionCtrlState.section;
				/*.then(function (section) {
					unifiedCatalogSectionCtrlState.section = section;
				})
				.catch(function () {
					$state.go('unified-catalog.home');
					return $q.reject();
				})
				.finally(function () {
					//unifiedCatalogSectionCtrlState.sectionLoading = false;
				})*/
		}


		function extractCategories(sectionItems) {
			var categories = [];
			_.each(sectionItems, function (item) {
				var itemCategoryNames = [];

				if (item.isSrm) {
					itemCategoryNames = [item.extData.categoryName];
				}

				if (item.isAppZone && item.extData) {
					itemCategoryNames = item.extData.categories;
				}

				item.categoryNames = itemCategoryNames;

				_.each(itemCategoryNames, function (categoryName) {
					if (categoryName) {
						if (!_.findWhere(categories, { name: categoryName })) {
							categories.push({
								name: categoryName,
								count: 0
							});
						}
						_.findWhere(categories, { name: categoryName }).count++;
					}
				});
			});

			return categories.sort();
		}


		$scope.setCategoryFilter = function (category) {
			unifiedCatalogSectionCtrlState.filteredCategory = category;
		};


		$scope.clearCategoryFilter = function () {
			unifiedCatalogSectionCtrlState.filteredCategory = null;
		};


		$scope.filterByCategory = function (item) {
			if (!unifiedCatalogSectionCtrlState.filteredCategory) {
				return true;
			} else {
				return _.contains(item.categoryNames, unifiedCatalogSectionCtrlState.filteredCategory.name);
			}
		};


		$scope.setSort = function (sortType) {
			unifiedCatalogSectionCtrlState.sort.activeType = unifiedCatalogSectionCtrlState.sort.types[sortType];
		};


		$scope.clearSort = function () {
			unifiedCatalogSectionCtrlState.sort.activeType = null;
		};

		$scope.setFocusToElement = function () {
			setTimeout(function(){ 
				supportService.setFocusToElement('firstElementFocusId');
			}, 1000);
		};

		if(typeof unifiedCatalogModel.sectionsCache[$stateParams.id] == 'undefined')
			setTimeout(function(){ init() }, 2000); 
		else
			init();
	}
