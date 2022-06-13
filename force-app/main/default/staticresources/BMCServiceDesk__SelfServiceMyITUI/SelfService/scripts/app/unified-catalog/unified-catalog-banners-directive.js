	angular.module('unifiedCatalogModule')
		.directive('unifiedCatalogBanners', unifiedCatalogBanners);


	function unifiedCatalogBanners() {
		var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
		return {
			restrict: 'E',
			replace: true,
			scope: {
				sectionData: "=data"
			},
			templateUrl: resourceUrl+'views/unified-catalog/banners-directive.html',
			controller: unifiedCatalogBannersController
		};
	}

	unifiedCatalogBannersController.$inject = ['$scope', 'srdCreateService', 'supportModel'];

	function unifiedCatalogBannersController($scope, srdCreateService, supportModel) {
		var maxVisibleBanners = 4,
			banners = $scope.sectionData && $scope.sectionData.items || [],
			bannersLength = banners.length,
			startBanner = 0,
			endBanner = startBanner + maxVisibleBanners;

		$scope.banners = banners;
		$scope.nextBanner = next;
		$scope.prevBanner = prev;
		$scope.prevEnabled = $scope.nextEnabled = false;
		$scope.activateItem = activateItem;

		update();

		/// implementation details

		/**
		 * Hides banners not in current visible range, and update next/prev arrows visibility
		 */
		function update() {
			_.each(banners, function (banner, index) {
				banner.isVisible = index >= startBanner && index < endBanner;
			});

			// check buttons status
			$scope.prevEnabled = !!startBanner;
			$scope.nextEnabled = startBanner + maxVisibleBanners < bannersLength;
		}


		/**
		 * Moves visible range of banners to the right. Banners themselves are moved to the left
		 */
		function next() {
			if ($scope.nextEnabled) {
				startBanner++;
				endBanner++;
				update();
			}
		}


		/**
		 * Moves visible range of banners to the left. Banners themselves are moved to the right
		 */
		function prev() {
			if (startBanner) {
				startBanner--;
				endBanner--;
				update();
			}
		}


		/**
		 * Opens banner URL or open SRD modal based on banner type
		 */
		function activateItem(banner) {
			if (!banner.bannerSrdId) {
				window.open(banner.extData.linkUrl, '_blank');
			} else {
				if (!banner.srdLoading) {
					// For SRM items, open SRD modal
					banner.srdLoading = true;
					supportModel.getSRDById(banner.bannerSrdId)
						.then(function (result) {
							if (result && result[0] && result[0].items && result[0].items[0]) {
								var selectedSRD = result[0].items[0];
								if (selectedSRD.hasCrossLaunchUrl) {
									srdCreateService.showAifSrdCreateDialog(selectedSRD);
								} else {
									srdCreateService.showServiceResourceSrdCreateDialog(selectedSRD, result);
								}
							}
						})
						.finally(function () {
							banner.srdLoading = false;
						});
				}
			}
		}
	}
