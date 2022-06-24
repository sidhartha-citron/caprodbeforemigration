	angular.module('unifiedCatalogModule')
		.controller('UnifiedCatalogController', UnifiedCatalogController);

	UnifiedCatalogController.$inject = [ '$scope', 'unifiedCatalogModel', '$timeout','$state','supportService'];

	function getRecordsCount() {
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
	function UnifiedCatalogController($scope, unifiedCatalogModel, $timeout,$state,supportService) {
		var noOfRec = getRecordsCount($scope);
		var unifiedCatalogCtrlState = $scope.unifiedCatalogCtrlState = {
				sectionsLoading: false,
				itemsPerSection: noOfRec[0],
				numberOfColumns: noOfRec[1],
				search: {
					string: '',
					results: null,
					loading: false,
					resultTypes: {
						srm: 'catalog.searchResultTypes.srm',
						'app-zone': 'catalog.searchResultTypes.appZone',
						clm: 'catalog.searchResultTypes.clm',
						'quick-link': 'catalog.searchResultTypes.quickLink',
						'how-to': 'catalog.searchResultTypes.howTo',
						rkm: 'catalog.searchResultTypes.rkm'
					}
				}
			},
			startSearchDebounced;

		$scope.initSearch = initSearch;
		$scope.isSearchDropdownShown = false;
		$scope.showSearchDropdown = showSearchDropdown;
		$scope.hideSearchDropdown = hideSearchDropdown;
		$scope.createAppointment = createAppointment;
		$scope.contactIt = contactIt;
		$scope.supportServiceModel=supportService;
		init();


		function init() {
			getSections();
		}


		/**
		 * Gets all catalog sections
		 */
		function getSections() {
			unifiedCatalogCtrlState.sectionsLoading = true;
			$scope.resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
			unifiedCatalogModel.getAllSections(unifiedCatalogCtrlState.itemsPerSection)
				.then(function (sections) {
					unifiedCatalogCtrlState.sections = sections;
				})
				.finally(function () {
					unifiedCatalogCtrlState.sectionsLoading = false;
				});
		}
		$scope.goToState = function(sectionId){
			$state.go('support.common.section',{'id':sectionId});
		};

		/**
		 * Checks search input length and call search func
		 */
		function initSearch() {
			var searchString = unifiedCatalogCtrlState.search.string.trim();

			unifiedCatalogCtrlState.search.nothingFound = false;

			if (searchString.length > 2) {
				unifiedCatalogCtrlState.search.loading = true;
				startSearchDebounced(searchString);
			} else {
				unifiedCatalogCtrlState.search.results = null;
			}
		}


		startSearchDebounced = _.debounce(startSearch, 500);


		/**
		 * Makes search request
		 * @param {String} searchString
		 */
		function startSearch(searchString) {
			unifiedCatalogModel.search(searchString)
				.then(function (searchResults) {
					unifiedCatalogCtrlState.search.results = searchResults;

					unifiedCatalogCtrlState.search.nothingFound = _.isEmpty(searchResults);
				})
				.finally(function () {
					unifiedCatalogCtrlState.search.loading = false;
				});
		}


		/**
		 * Hides search dropdown on input blur or on item click
		 */
		function hideSearchDropdown() {
			$timeout(function () {
				$scope.isSearchDropdownShown = false;
			}, 100);
		}


		/**
		 * Shows search dropdown on input focus
		 */
		function showSearchDropdown() {
			$scope.isSearchDropdownShown = true;
		}


		/**
		 * Opens modal for appointment creating
		 */
		function createAppointment() {
			//appointmentCreateService.showCreationDialog();
		}


		/**
		 * Opens modal with contacts information
		 */
		function contactIt() {
			//contactItModalService.showModal();
		}
	}