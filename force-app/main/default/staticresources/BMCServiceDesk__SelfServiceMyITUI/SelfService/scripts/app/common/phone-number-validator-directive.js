	angular.module('selfServiceApp')
		.directive('phoneNumberValidator', function () {
			return {
				require: 'ngModel',
				link: function (scope, elm, attrs, ctrl) {
					ctrl.$parsers.unshift(function (viewValue) {
						var valid = true;

						// valid phone must have at least 7 digits
						if (viewValue.replace(/\D/g, '').length < 7) {
							valid = false;
						}

						// valid phone must not contains anything beside digits, spaces, and these symbols: +-().x
						if (/[^\d\s\+\-\(\)\.x]/.test(viewValue)) {
							valid = false;
						}
						if (valid) {
							ctrl.$setValidity('string', true);
							return viewValue;
						} else {
							ctrl.$setValidity('string', false);
							return undefined;
						}
					});
				}
			};
		});