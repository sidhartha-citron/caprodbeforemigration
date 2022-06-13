	angular.module('selfServiceApp')
		.factory('userContextInfoModel', ['$rootScope', '$locale', '$log', 'localStorageService', '$q', '$timeout', 'userModel', 'locationModel',
			function ($rootScope, $locale, $log, localStorageService, $q, $timeout, userModel, locationModel) {

				var self = this;
				var browserInformation = {
						browser: _.keys($.browser)[0],
						browserVersion: $.browser.version,
						local: $locale.id
					},
					preferredContactByIT = {
						preferredContact: '',
						contact: ''
					},
					currentLocation = {
						address: '',
						closestCustomer: '',
						latitude: '',
						longitude: '',
						homeLocation: ''
					},
					preferredLocation = {
						preferredHomeLocation: '',
						preferredHomeAddress: ''
					};

				var deleteOldActivityHistory = function () {
					var localData, newData;

					localData = getActivityHistory();

					_.each(localData, function (element, index) {

						var now = new Date().getTime();

						if ((now - element.time) / 3600000 > 24) {
							delete localData[index];
						}
					});

					newData = _.values(localData);
					return newData;
				};

				var getActivityHistory = function () {
					var history = _.toArray(JSON.parse(localStorageService.get("activity_history")));
					if (!history) {
						return false;
					}
					return history;
				};

				var saveActivityHistory = function (data) {
					var storeData = deleteOldActivityHistory(),
						timeStamp = data.time;
					storeData[_.size(storeData)] = { time: timeStamp, data: data.message };
					localStorageService.add("activity_history", JSON.stringify(storeData));// add check for localStorage size
					return storeData;
				};

				var setActivityHistory = function (message, prefix) {
					var timeStamp = new Date(),
						newActivity = {
							time: timeStamp.getTime(),
							data: message,
							message: timeStamp + " " + prefix + " " + message
						};
					saveActivityHistory(newActivity);
				};

				self.saveSRDHistory = function (name) {
					setActivityHistory(name, "Viewed SRD: ");
				};

				self.saveSearchHistory = function (name) {
					setActivityHistory(name, "Searched by ");
				};

				self.saveRKMHistory = function (name) {
					setActivityHistory(name, "Viewed RKM: ");
				};

				self.saveHowToHistory = function (name) {
					setActivityHistory(name, "Viewed How To:  ");
				};

				function toInfoString(object) {
					var activity = '',
						string;

					_.each(object.activityHistory, function (elem) {
						activity += elem.data + "\n";
					});

					string = "Browser Information:" + "\n" +
						"\t" + "Browser Name: " + browserInformation.browser + "\n" +
						"\t" + "Browser Version: " + browserInformation.browserVersion + "\n" +
						"\t" + "Browser Locale: " + browserInformation.local + "\n";
					if (object.activityHistory.length) {
						string += "Activity History: " + "\n" + activity;
					}

					string += "User Location:" + "\n";

					if (angular.isObject(object.currentLocation)) {
						string += "\t" + "User Coordinates: " + object.currentLocation.latitude + " N, " + object.currentLocation.longitude + " W \n";
						string += "\t" + "User Current Address: " + object.currentLocation.address + "\n";

						if (object.currentLocation.closestCustomer && object.currentLocation.closestCustomer.name) {
							string += "\t" + "Closest Location: " + object.currentLocation.closestCustomer.name + "\n";
						}

						if (object.currentLocation.homeLocation) {

							if (object.currentLocation.homeLocation.preferredHomeLocation) {
								string += "\t" + "Preferred Home Location: " + object.currentLocation.homeLocation.preferredHomeLocation + "\n";
							}

							if (object.currentLocation.homeLocation.preferredHomeAddress) {
								string += "\t" + "Preferred Home Address: " + object.currentLocation.homeLocation.preferredHomeAddress + "\n";
							}
						}

					} else {
						string += "\t" + object.currentLocation + "\n";
					}
					string += "Communication Preferences: " + "\n" +
						"\t" + object.preferredContactByIT.preferredContact + "\n" +
						"\t" + object.preferredContactByIT.contact + "\n";

					return string;
				}

				/* main public method to get user context information */
				self.getUserContextInfo = function () {

					var userContextInfo = {
						currentLocation: currentLocation,
						preferredContactByIT: preferredContactByIT,
						browserInformation: browserInformation,
						activityHistory: []
					};

					if (angular.isDefined(userModel.userGeoPosition)) {
						currentLocation.latitude = userModel.userGeoPosition.coords.latitude;
						currentLocation.longitude = userModel.userGeoPosition.coords.longitude;
					}
					currentLocation.closestCustomer = null;

					if (userModel.userPreferences.srEmailCommunication) {
						preferredContactByIT.preferredContact = "email";
						preferredContactByIT.contact = userModel.userPreferences.email;
					} else {
						preferredContactByIT.preferredContact = "phone";
						preferredContactByIT.contact = userModel.userPreferences.phone;
					}

					preferredLocation.preferredHomeAddress = userModel.userPreferences.address + " " +
						userModel.userPreferences.city + " " +
						userModel.userPreferences.zip + " " +
						userModel.userPreferences.country;
					currentLocation.homeLocation = preferredLocation;

					userContextInfo.activityHistory = deleteOldActivityHistory();

					return toInfoString(userContextInfo);

				};

				return self;
			}])
