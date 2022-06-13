	angular.module('unifiedCatalogModule')
		.directive('unifiedCatalogItem', unifiedCatalogItem);

	unifiedCatalogItem.$inject = [];

	function unifiedCatalogItem() {
		var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
		return {
			restrict: 'E',
			replace: true,
			scope: {
				itemData: "=data",
				numberOfCols: "=noc",
				/** {String} Possible values: 'catalog', 'search' */
				displayStyle: "@"
			},
			templateUrl: resourceUrl+'views/unified-catalog/item-directive.html',
			controller: unifiedCatalogItemDirectiveController
		};
	}


	unifiedCatalogItemDirectiveController.$inject = ['rkmDetailsService', '$scope', 'srdCreateService', '$state', 'supportModel','incidentCreateService'];

	function unifiedCatalogItemDirectiveController(rkmDetailsService, $scope, srdCreateService, $state, supportModel,incidentCreateService) {

		/**
		 * Take actions appropriate to catalog item's type (open SRD, AppZone profile etc.)
		 * @param catalogItem Catalog item object
		 */
		 
		$scope.decodeText = function(str){
		 return supportModel.decodeText(str);
		}
		
		$scope.activateItem = function (catalogItem) {
			if (catalogItem.isSrm && catalogItem.externalId && !catalogItem.srdLoading) {
				// For SRM items, open SRD modal
			//	catalogItem.srdLoading = true;
				srdCreateService.showSupportSrdCreateDialog(catalogItem);
			/*	supportModel.getSRDById(catalogItem.id)
					.then(function (result) {
						if (result && result[0] && result[0].items) {
							var selectedSRD = result[0].items[0];
							//if (selectedSRD.hasCrossLaunchUrl) {
								srdCreateService.showAifSrdCreateDialog(selectedSRD);
							} else {
								srdCreateService.showServiceResourceSrdCreateDialog(selectedSRD, result);
							}
						}
					})
					.finally(function () {
						catalogItem.srdLoading = false;
					});*/
			}
			
			if (catalogItem.isTmp  && !catalogItem.srdLoading) {
				// For SRM items, open SRD modal
				catalogItem.srdLoading = true;
				incidentCreateService.showSupportSrdCreateDialog(catalogItem.id);
				catalogItem.srdLoading = false;
				
			}

			if (catalogItem.isAppZone && catalogItem.externalId) {
				// For AppZone items, go to product profile
				$state.go('appzone.product-profile', { productId: catalogItem.externalId });
			}

			// for quick link and how-to items, open linked url
			if ((catalogItem.isQuickLink || catalogItem.isHowTo) && catalogItem.extData.url) {
				window.open(catalogItem.extData.url, '_blank');
			}

			if (catalogItem.isClm && catalogItem.externalId) {
				// For CLM items, go to offering profile
				$state.go('unified-catalog.clm-offering', { id: catalogItem.externalId });
			}

			if (catalogItem.isRkm ) {
				// For RKM items, open knowledge article
				rkmDetailsService.showDialog(catalogItem.id);
			}
			if (catalogItem.isSFkm ) {
				// For salesforce knowledge article items, open knowledge article
				if(!isUserInLightningMode)
					rkmDetailsService.showDialog(catalogItem.id, catalogItem);
				else
					window.open(catalogItem.urlLink , '_blank');
			}
		};
	}
