	angular.module('selfServiceApp')
		.factory('pageBreadcrumbsModel', [
			function () {
				var self = {
					home: {
						isHome: true,
						state: 'home'
					},
					items: []
				};

				self.clearItems = function () {
					self.items = [];
				};

				self.pushItems = function (breadcrumbItems) {
					if (angular.isDefined(breadcrumbItems) && !angular.isArray(breadcrumbItems)) {
						breadcrumbItems = [breadcrumbItems];
					}

					for (var i = 0, length = breadcrumbItems.length; i < length; i++) {
						if (breadcrumbItems[i].label || breadcrumbItems[i].i18nKey || breadcrumbItems[i].isHome) {
							if (angular.isUndefined(breadcrumbItems[i].stateParams)) {
								breadcrumbItems[i].stateParams = {};
							}
							self.items.push(breadcrumbItems[i]);
						}
					}
				};

				self.setItems = function (breadcrumbItems) {
					self.clearItems();
					self.pushItems(breadcrumbItems);
				};


				return self;
			}]);