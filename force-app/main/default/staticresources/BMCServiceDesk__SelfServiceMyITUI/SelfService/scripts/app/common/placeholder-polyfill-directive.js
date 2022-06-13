	angular.module('selfServiceApp')
		.directive('placeholder', ['$compile', function ($compile) {
			return {
				restrict: 'A',
				scope: {
					inputClass: '@class',
					inputPlaceholder: '@placeholder',
					inputNgModel: '=ngModel',
					inputNgHide: '=ngHide'
				},
				link: function (scope, element, attrs) {
					// element must be either input or textarea
					if (element[0].nodeName.toLowerCase() !== 'input' && element[0].nodeName.toLowerCase() !== 'textarea') {
						return;
					}

					// ignore for Bootstrap directives
					if (attrs.bsDatepicker || attrs.bsTimepicker) { return; }

					// element must have ngModel
					if (!attrs.ngModel) { return; }

					// element must not support placeholders natively
					if (!_.isUndefined(element[0].placeholder)) { return; }


					var placeholderElement = angular.element('<span class="ie-placeholder {{inputClass}}">{{inputPlaceholder}}</span>');
					element[0].parentNode.insertBefore(placeholderElement[0], element[0]);

					if (!attrs.ngHide) {
						// placeholder will be shown only when input's value is empty
						placeholderElement.attr('ng-show', '!inputNgModel');
					} else {
						// if ng-hide is present, placeholder will be hidden if input's value is present, or its ng-hide is true
						placeholderElement.attr('ng-hide', '!(!inputNgModel && !inputNgHide)');
					}

					angular.element(placeholderElement).on('click', function () {
						element.focus();
						element.click();
					});

					$compile(placeholderElement)(scope);
				}
			}
		}])
	.directive('maxlength', [function () {
		return {
			require: 'ngModel',
			link: function (scope, element, attrs, ngModelCtrl) {
				// element must be either input or textarea
				if (element[0].nodeName.toLowerCase() !== 'input' && element[0].nodeName.toLowerCase() !== 'textarea') {
					return;
				}
			
				// element must have ngModel
				if (!attrs.ngModel) { return; }
				
				// element must not support maxlength natively
				if (!_.isUndefined(element[0].maxlength)) { return; }
				
				var maxlength = -1;
				if (attrs.maxlength && attrs.maxlength != "") {
					maxlength = Number(attrs.maxlength);
				}
				
				function fromUser(text) {
					if (maxlength > -1 && text != null && text != '' && text.length > maxlength) {
						var transformedInput = text.substring(0, maxlength);
						ngModelCtrl.$setViewValue(transformedInput);
						ngModelCtrl.$render();
						return transformedInput;
					}
					return text;
				}
				ngModelCtrl.$parsers.push(fromUser);
			}
		};
	}]);