
	angular.module('unifiedCatalogModule')
		.factory('unifiedCatalogModel',  ['$q', '$rootScope','unifiedCatalogService','enhanceduiService',	function ($q, $rootScope,unifiedCatalogService,enhanceduiService) {
		var self = {
			sectionsCache: {}
		};
        $rootScope.resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
		var DEFAULT_ITEMS_PER_SECTION = 6;


		/**
		 * Get all Unified Catalog sections
		 * @param itemsPerSection Number of items to return for each section
		 * @returns {*}
		 */
		self.getAllSections = function (itemsPerSection) {
			itemsPerSection = itemsPerSection || DEFAULT_ITEMS_PER_SECTION;

			if (!_.isEmpty(self.sectionsCache)) {
				return $q.when(self.sectionsCache);
			}

			if (self.sectionsLoadingFlag) {
				return self.sectionsLoadingPromise;
			}

			self.sectionsLoadingFlag = true;

			self.sectionsLoadingPromise = unifiedCatalogService.getAllSections()
				.then(function (data) {
					if (data && data.length) {
						var sections=processCatalogSections(data);
						_.each(sections,function(section){
							self.sectionsCache [section.id]=section;
						});						 
					} else {
						self.sectionsCache = {};
					}

					return self.sectionsCache;
				})
				.finally(function () {
					self.sectionsLoadingFlag = false;
				});

			return self.sectionsLoadingPromise;
			return;
		};


		/**
		 * Get all items of catalog section with ID = sectionId
		 * - Items will be processed with default model processing
		 * @param sectionId ID of catalog section
		 * @returns {*} Promise that will be resolved with section object. It will have full items list from server
		 */
		self.getSectionWithItems = function (sectionId) {
			if(typeof self.sectionsCache[sectionId] == 'undefined'){
				self.sectionsCache = self.getAllSections();
				return self.sectionsCache[sectionId];
			}else{
				return self.sectionsCache[sectionId];
			}
			/*var allSectionsPromise = self.getAllSections(),
				sectionItemsPromise = unifiedCatalogService.getSectionItems({ sectionId: sectionId }).$promise;

			return $q.all([allSectionsPromise, sectionItemsPromise])
				.then(function (results) {
					var section = _.findWhere(results[0], { id: sectionId });

					if (_.isEmpty(results[1]) || !section) {
						return $q.reject();
					}

					// section exists, update its items with ones returned from server
					section.items = processCatalogItems(results[1]);

					return section;
				});*/
		};


		/**
		 * Makes search request and returns processed items
		 * @param searchStr
		 * @returns {*}
		 */
		self.search = function (searchStr) {
			/*return unifiedCatalogService.search({ searchText: searchStr }).$promise
				.then(function (response) {
					return processCatalogItems(response, true);
				});*/
		};


		self.getClmOffering = function (offeringId) {
			/*return unifiedCatalogService.getClmOffering({ id: offeringId }).$promise
				.then(function (response) {
					return response.id ? response : $q.reject();
				})*/
		};


		/**
		 * - Converts section's displayType and sourceType to lowercase for easier use
		 * - Sets flags based on displayType and sourceType
		 * - Processes individual section items
		 * @param sections
		 */
		function processCatalogSections(sections) {
			_.forEach(sections, function (section) {
				processItemTypes(section);
				section.items = processCatalogItems(section.items);
			});

			return sections;
		}


		/**
		 * - Converts item's sourceType to lowercase for easier use
		 * - Sets flags based on sourceType
		 * - Converts rating to Integer
		 * - Extracts price and currency from 'baselinePrice' for CLM items
		 * - Converts price(s) to Float
		 * - Sanitizes URL for Quick Link and How-To items
		 * - Returns grouped items by sourceType if groupByType param is set
		 * @param items
		 * @param groupByType
		 * @returns {Array|Object} Returns array or object of items grouped by sourceType if groupByType param is set
		 */
		function processCatalogItems(items, groupByType) {
			var grouped = {};
			_.forEach(items, function (item) {
				processItemTypes(item);
				item.imageUrl = getSFDocumentURL(item.imageUrl);
				if (item.extData && item.extData.rating) {
					item.extData.rating = parseInt(item.extData.rating, 10);
				}

				if (item.isClm && item.extData && item.extData.baselinePrice) {
					var baselinePriceArray = item.extData.baselinePrice.split(' ');
					item.extData.price = baselinePriceArray[0];
					item.extData.currencySymbol = baselinePriceArray[1];
				}

				if (item.highPrice) {
					item.highPrice = parseFloat(item.highPrice);
				}

				if ((item.isQuickLink || item.isHowTo) && item.extData && item.extData.url) {
					//item.extData.url = urlSanitizerService.sanitize(item.extData.url);
				}

				if (groupByType) {
					if (item.sourceType) {
						if (!grouped[item.sourceType]) {
							grouped[item.sourceType] = [];
						}
						grouped[item.sourceType].push(item);
					}
				}
			});

			return groupByType ? grouped : items;
		}


		/**
		 * Processes sourceType and displayType for catalog section or item.
		 * - Converts to lowercase and replaces "_" with "-"
		 * - Sets flags based on sourceType and displayType
		 * - Checks items witch has isBanner flag and sets flag for SRD banners
		 * @param item Catalog section or item object
		 * @returns {string}
		 */
		function processItemTypes(item) {
			var match;
			item.sourceType = (item.sourceType || '').toLowerCase().replace('_', '-');
			item.displayType = (item.displayType || '').toLowerCase();

			item.isSrm = item.sourceType === 'srm';
			item.isTmp = item.sourceType === 'tmp';
			item.isAppZone = item.sourceType === 'app-zone';
			item.isClm = item.sourceType === 'clm';
			item.isQuickLink = item.sourceType === 'quick-link';
			item.isHowTo = item.sourceType === 'how-to';
			item.isBanner = item.displayType === 'banner';
			item.isRkm = item.sourceType === 'rkm';

			if (item.isBanner && item.extData && item.extData.linkUrl) {
				match = /^http[s]?:\/\/myit\.srd\/(\w*)$/.exec(item.extData.linkUrl);
				item.bannerSrdId = match && match.length > 1 ? match[1] : null;
			}
		}


		// Clear cache on logout 
		$rootScope.$on('myit.user.logout', function () {
			self.sectionsCache = [];
		});

		return self;
	}]);