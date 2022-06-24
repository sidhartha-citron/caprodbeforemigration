
	angular.module('selfServiceApp')
		.factory('errorModel', ['$timeout',
			function ($timeout) {
				var errorModel = {
					error: {
						modal: [],
						global: []
					},

					clearAllErrors: function () {
						this.error = {
							modal: [],
							global: []
						}
					},

					addModalError: function (options) {
						options.type = 'modal';
						_addError(options);
					},

					addGlobalError: function (options) {
						options.type = 'global';
						_addError(options);
					},

					removeErrorById: function (errorType, errorId) {
						var error = _.findWhere(errorModel.error[errorType], { id: errorId });
						if (!_.isEmpty(error)) {
							errorModel.error[errorType] = _.without(errorModel.error[errorType], error);
						}
					}
				};


				/**
				 * @param {object} options Config
				 * @param {string} [options.id] Message ID. Specify to prevent multiple errors caused by the same reason
				 * @param {string} [options.text] Error text, when i18n key is not present
				 * @param {string} [options.i18nKey] String key for localized error message
				 * @param {string} [options.html] HTML content for localized error message
				 * @param {string} [options.hide] Interval, after which error will be hidden
				 * @param {boolean} [options.clear] Clear errors before pushing new one
				 * @private
				 */
				function _addError(options) {
					if (!options.text && !options.i18nKey && !options.html) { return; }

					if (options.clear) { _clearErrors(options.type); }

					// if no message ID is specified, of error with such ID was not created earlier...
					if (!options.id || !_.findWhere(errorModel.error[options.type], { id: options.id })) {
						// ...insert new error
						errorModel.error[options.type].push({
							id: options.id || Date.now(),
							text: options.text,
							i18nKey: options.i18nKey,
							html: options.html,
							multiline: options.multiline
						});
					} else {
						// ...in other case, find the error and update it
						var existingError = _.findWhere(errorModel.error[options.type], { id: options.id });
						existingError.text = options.text;
						existingError.i18nKey = options.i18nKey;
					}


					if (options.hide) {
						$timeout(function () {
							errorModel.error[options.type].pop();
						}, options.hide)
					}
				}


				function _clearErrors(type) {
					if (type) { errorModel.error[type] = []; }
				}


				return errorModel;
			}
		]);
