	angular.module('supportModule')
		.factory('contactItModalService', contactItModalService);

	contactItModalService.$inject = ['$modal'];

	function contactItModalService($modal) {
		return {
			showModal: showModal
		};

		function showModal() {
			var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
			$modal.open({
				templateUrl: resourceUrl+'views/support/contact-it-modal.html',
				controller: modalController
			});

			modalController.$inject = ['$scope', 'userModel'];

			function modalController($scope, userModel) {
				$scope.userModel = userModel;
				userModel.getLoginHelp("contactIT");
			}
		}
	}
