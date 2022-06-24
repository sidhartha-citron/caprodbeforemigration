	angular.module('selfServiceApp')
		.directive('thumbnailImg', ['attachmentService', function (attachmentService) {
			return {
				restrict: "A",
				replace: true,
				priority: 99, // it needs to run after the attributes are interpolated
				link: function (scope, element, attr) {
					var placeholder = attr.placeholder;
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					switch (placeholder) {
						case 'application':
						case 'asset':
						case 'resource':
							placeholder = resourceUrl+'styles/img/asset-thumbnail-placeholder.png';
							break;
						case 'group':
							placeholder = resourceUrl+'styles/img/group-thumbnail-placeholder.png';
							break;
						case 'location':
							placeholder = resourceUrl+'styles/img/location-thumbnail-placeholder.png';
							break;
						case 'service_offering':
						case 'service':
							placeholder = resourceUrl+'styles/img/service-thumbnail-placeholder.png';
							break;
						case 'user':
							placeholder = resourceUrl+'styles/img/user-thumbnail-placeholder.png';
							break;
					}

					attr.$set('src', placeholder);

					attr.$observe('thumbnailImg', function (value) {
						value = attachmentService.normalizeDataUrlString(value);
						if (~value.indexOf('base64')) {
							attr.$set('src', value);
						}

					});

					attr.$observe('thumbnailUrl', function (value) {
						if (value) {
							var image = new Image();
							image.onload = function () {
								attr.$set('src', value);
							};
							image.src = value;
						}
					});
				}
			}
		}])