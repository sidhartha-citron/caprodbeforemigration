	angular.module('userModule')
		.directive('profileStatus', function () {
			return {
				restrict: 'E',
				replace: true,
				template: "<ins ng-class=\"{" +
					"'profile-status_up': status === 'AVAILABLE' || status == 1," +
					"'profile-status_down': status === 'BUSY' || status == 2," +
					"'profile-status_unknown': status === 'UNKNOWN' || status == 0" +
					"}\"></ins>",
				scope: {
					status: '@'
				}
			}
		})