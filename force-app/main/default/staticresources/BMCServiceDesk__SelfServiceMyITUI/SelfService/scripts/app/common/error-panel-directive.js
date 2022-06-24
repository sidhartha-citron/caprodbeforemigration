
	angular.module('selfServiceApp')
		.directive('errorPanel', [function () {
			var resourceUrl = document.getElementById("selfServiceResourcesUrl").href;
			return {
				restrict: "A",
				replace: true,
				templateUrl: resourceUrl+'views/common/error-panel-directive.html',
				scope: {
					type: '@'
				},
				controller: ['$scope', 'errorModel', function ($scope, errorModel) {
					$scope.errorModel = errorModel;

				}],
				link: function (scope) {
					scope.$watchCollection('errorModel.error.' + scope.type, function () {
						scope.displayErrors = scope.errorModel.error[scope.type]
					})
				}
			}
		}])