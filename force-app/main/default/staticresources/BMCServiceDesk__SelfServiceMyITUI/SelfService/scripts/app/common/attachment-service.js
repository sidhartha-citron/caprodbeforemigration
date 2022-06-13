	angular.module('selfServiceApp')
		.factory('attachmentService', ['$http', '$q',
			function ($http, $q) {
				var self = {
					imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tga', 'tif', 'tiff'],
					blockedFileFormats: ["exe", "com", "php", "asp", "html", "htm"],
					contentTypeToAttachmentType: {
						'application/octet-stream': 'generic',
						'application/ogg': 'generic',
						'application/pdf': 'pdf',
						'application/xml': 'generic',
						'application/zip': 'generic',
						'application/gzip': 'generic',
						'text/cmd': 'text',
						'text/css': 'text',
						'text/csv': 'text',
						'text/html': 'text',
						'text/plain': 'text',
						'text/vcard': 'text',
						'text/xml': 'text',
						'image/gif': "photo",
						'image/jpeg': "photo",
						'image/pjpeg': "photo",
						'image/png': "photo",
						'image/svg+xml': "photo",
						'video/mpeg': "movie",
						'video/mp4': "movie",
						'video/ogg': "movie",
						'video/quicktime': "movie",
						'video/webm': "movie",
						'video/x-matroska': "movie",
						'video/x-ms-wmv': "movie",
						'video/x-flv': "movie"
					},
					extensionToAttachmentType: {
						pdf: 'pdf',
						xls: 'spreadsheet',
						xlsx: 'spreadsheet',
						ods: 'generic',
						fods: 'generic',
						doc: 'word',
						docx: 'word',
						odt: 'generic',
						fodt: 'generic',
						ppt: 'powerpoint',
						pptx: 'powerpoint',
						pps: 'powerpoint',
						ppsx: 'powerpoint',
						odp: 'generic',
						fodp: 'generic',
						csv: 'text',
						txt: 'text'
					}
				};


				/**
				 * Recognizes file type of attachment
				 *
				 * @param {String} contentType Attachment contentType string
				 * @param {String} filename Attachment filename
				 * @returns {String} file type
				 */
				self.recognizeFileType = function (contentType, filename) {
					var fileType = self.recognizeFileTypeByContentType(contentType);

					// additional support for office files recognition
					if (fileType === 'text' || fileType === 'generic') {
						fileType = self.recognizeFileTypeByFilename(filename) || fileType;
					}

					return fileType;
				};


				/**
				 * Recognizes file type by its content type
				 *
				 * @param {String} contentType
				 * @returns {String} file type
				 */
				self.recognizeFileTypeByContentType = function (contentType) {
					// remove charset information
					if (contentType && contentType.indexOf(";") > -1) {
						contentType = contentType.substr(0, contentType.indexOf(";"));
					}

					return contentType && self.contentTypeToAttachmentType[contentType] || 'generic';
				};


				/**
				 * Recognizes file type by its filename
				 *
				 * @param {String} filename
				 * @returns {String} file type
				 */
				self.recognizeFileTypeByFilename = function (filename) {
					return self.extensionToAttachmentType[self.extractFileExtension(filename)];
				};


				/**
				 * Extracts file extension.
				 *
				 * @param {String} filename
				 * @return {String} file extension
				 */
				self.extractFileExtension = function (filename) {
					return filename.split('.')[filename.split('.').length - 1].toLowerCase();
				};


				self.normalizeDataUrlString = function (string, mimeType) {
					var result = '';
					if (string && ~string.indexOf('base64')) {
						result = string;
					} else if (string) {
						mimeType = mimeType || '';
						if (mimeType.indexOf('base64') === -1) {
							if (mimeType.indexOf('image/') === 0) {
								mimeType = 'data:' + mimeType + ';base64';
							} else {
								mimeType = 'data:image/png;base64';
							}
						}
						result = mimeType + ',' + string.replace(',', '');
					}
					return result;
				};


				self.getProfileImageUrl = function (objectType, objectId, noCache) {
					return angular.restPrefix + 'rest/v2/attachment/content/' + objectType + '/' + encodeURIComponent(objectId) + '/profileImage' + (noCache ? '?_=' + moment().valueOf() : '');
				};


				self.getProfileImage = function (objectType, objectId) {
					var deferred = $q.defer();

					var img = new Image();
					img.onload = function () {
						deferred.resolve();
					};
					img.onerror = function () {
						deferred.reject();
					};
					img.src = self.getProfileImageUrl(objectType, objectId);

					return deferred.promise;
				};


				self.uploadProfileImage = function (profileOwnerType, profileOwnerId, image, circular) {
					if (image.base64) {
						return $http({
							url: angular.restPrefix + 'rest/v2/attachment/' + profileOwnerType + '/' + encodeURIComponent(profileOwnerId) + '/profileImage',
							method: 'PUT',
							params: {
								circularThumbnail: circular ? true : false
							},
							data: image,
							transformRequest: function (data, headerGetter) {
								var headers = headerGetter();
								headers['Content-Type'] = data.contentType || 'image/png';
								headers['X-MyIT-Attachment-Encoding'] = 'BASE64';

								// Server doesn't need 'data:xxx/yyy;base64,' part
								return data.base64.replace(/^.*base64,/, '');
							}
						});
					} else if (image.fileInput) {
						return self.uploadFileWithIframe(profileOwnerType, profileOwnerId, image.fileInput, true, circular);
					} else {
						return $q.when($q.reject());
					}
				};


				self.uploadFileWithIframe = function (itemType, id, fileInput, isProfileImage, circularThumbnail) {
					var deferred = $q.defer();

					$.ajax(angular.restPrefix + 'rest/v2/attachment/' + itemType + '/' + encodeURIComponent(id) + (isProfileImage ? '/profileImage' + (circularThumbnail ? '?circularThumbnail=true' : '') : ''), {
						files: fileInput,
						iframe: true
					}).complete(function () {
						deferred.resolve();
					});

					return deferred.promise;
				};


				self.processProfileImageFile = function (fileInput) {
					var attachment = {};

					if (window.FileReader && fileInput.files) {
						attachment.file = fileInput.files[0];
					} else {
						attachment.fileInput = fileInput;
					}

					return attachment;
				};


				/**
				 * Check if file with passed extension is an image
				 * @param {String} fileExt File extension
				 * @return {Boolean}
				 */
				self.isImageExtension = function (fileExt) {
					fileExt = (fileExt || '').toLowerCase();

					return self.imageFormats.indexOf(fileExt) !== -1;
				};


				return self;
			}
		]);