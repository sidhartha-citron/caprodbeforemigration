	angular.module('selfServiceApp')
		.factory('errorDialogService', ['$uibModal',
			function ($uibModal) {

				var self = {};

				self.showDialog = function (options) {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					return $uibModal.open({
						templateUrl: resourceUrl+'views/common/error-message.html',
						ariaLabelledBy:'modal-header__title',
						ariaDescribedBy: 'modal-header__text',
						controller: ['$scope', '$uibModalInstance', '$timeout', function ($scope, $uibModalInstance, $timeout) {
							$scope.title = options.title;
							$scope.titleI18nKey = options.titleI18nKey;
							$scope.text = options.text;
							$scope.textI18nKey = options.textI18nKey;

							if(options.timeout){
								$timeout(function () {$uibModalInstance.dismiss('cancel');}, options.timeout);
							}else{
								$timeout(function () {$uibModalInstance.dismiss('cancel');}, 5000);
							}

							$scope.confirm = function () {
								$uibModalInstance.close();
							};

						}]
					});
				};

				return self;
			}]
		);
