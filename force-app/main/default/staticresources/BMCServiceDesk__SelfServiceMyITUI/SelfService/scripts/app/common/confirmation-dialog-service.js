	angular.module('selfServiceApp')
		.factory('confirmationDialogService', ['$uibModal', '$rootScope',
			function ($uibModal, $rootScope) {

				var self = {};
				self.showDialog = function (options) {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					return $uibModal.open({
						templateUrl: resourceUrl+'views/common/confirmation-dialog.html',
						ariaLabelledBy:'modal-header__title',
						ariaDescribedBy: 'modal-header__text',
						controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
							$scope.title = options.title;
							$scope.titleI18nKey = options.titleI18nKey;
							$scope.text = options.text;
							$scope.textI18nKey = options.textI18nKey;

							$scope.confirm = function () {
								if(options.functionType != null && options.functionType != ""){
									if(options.functionType == "deleteIncident"){
										$rootScope.deleteAttach();
									}
								}
								$uibModalInstance.close();
							};

							$scope.dismiss = function () {
								$uibModalInstance.dismiss();
							};
						}]
					});
				};
				return self;
			}]
		);