	angular.module('selfServiceApp')
		.directive('focusElm', ['$timeout', '$parse', function ($timeout, $parse) {
			return {
				link: function (scope, element, attrs) {
					var model = $parse(attrs.focusElm);
					scope.$watch(model, function (value) {
						if (value === true) {
							$timeout(function () {
								element[0].focus();
							});
						}
					});
				}
			};
		}]);

