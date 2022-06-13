	angular.module('selfServiceApp')
		.directive('loadingSpinner', function () {
			var resourceUrl = document.getElementById("selfServiceResourcesUrl").getAttribute('href');
			var ssPageloading;
			var ssPageloadingDone;
			if(typeof selfServiceLabels != 'undefined'){
				ssPageloading = selfServiceLabels.loading;
				ssPageloadingDone = selfServiceLabels.loadingDone;
			}else if(typeof ssLoading != 'undefined' && typeof ssLoadingDone != 'undefined'){
				ssPageloading = ssLoading;
				ssPageloadingDone = ssLoadingDone;
			}
			return {
				restrict: 'AE',
				replace: true,
				templateUrl: resourceUrl+'views/common/loading-spinner-directive.html',
				scope: {
					centered: "@",
					overlay: "@",
					inline: "@",
					wide: "@",
					if: "="
				},
				link: function(scope){
					scope.ssPageloading=ssPageloading;
					if(typeof isAccessibilityMode != 'undefined' && isAccessibilityMode){
						scope.$watch('if', function() {
							var loadingSpinner = document.getElementById('loadingSpinner');
							if(scope.if){
								loadingSpinner.innerText=ssPageloading;
							}else if(!scope.if){
								loadingSpinner.innerText=ssPageloadingDone;
							}
						});
					}
				}
			}
		})