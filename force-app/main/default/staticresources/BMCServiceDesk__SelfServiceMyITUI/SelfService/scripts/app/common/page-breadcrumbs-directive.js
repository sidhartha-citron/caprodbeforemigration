
	angular.module('selfServiceApp')
		.directive('pageBreadcrumbs', function () {
			var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
			return {
				restrict: "AE",
				replace: true,
				templateUrl: resourceUrl+'views/common/page-breadcrumbs-directive.html',
				controller: ['pageBreadcrumbsModel', '$scope', '$state', function (pageBreadcrumbsModel, $scope,$state) {
					$scope.pageBreadcrumbsModel = pageBreadcrumbsModel;
					$scope.goToState = function(state){
						$state.go(state);
					};
				}]
			}
		})
