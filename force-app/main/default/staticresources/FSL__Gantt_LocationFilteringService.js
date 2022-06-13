/***
 * (function() {

    LocationFilteringService.$inject = ['$compile', '$rootScope', 'ResourcesAndTerritoriesService', 'userSettingsManager', 'sfdcService', 'utils', 'TimePhasedDataService', 'StateService', 'calendarsService', 'monthlyViewHelperService', 'ResourceCrewsService', 'ResourceCapacitiesService', 'GanttPalettesService'];

    angular.module('serviceExpert').factory('LocationFilteringService', LocationFilteringService);

    function LocationFilteringService($compile, $rootScope, ResourcesAndTerritoriesService, userSettingsManager, sfdcService, utils, TimePhasedDataService, StateService, calendarsService, monthlyViewHelperService, ResourceCrewsService, ResourceCapacitiesService, GanttPalettesService) {

        // create new isolated scope
        let $scope = $rootScope.$new(true);


        // add to body
        let lightboxDomElement = generateTemplate().hide();
        lightboxDomElement.find('#LocationFilteringLightbox').draggable({ containment: 'document', handle: '#LocationFilteringLightboxHeader' });
        angular.element('body').append(lightboxDomElement);


        // init stuff
        $scope.trust = utils.trust;
        $scope.showOrphanServices = true;
        $scope.locationSearchTerm = '';
        $scope.showLocationFiltering = false;
        $scope.noLocationsLoad = false;
        $scope.locationFilter = {};
        $scope.locationFilterCopy = {};
        $scope.locationsFlat = [];
        $scope.territoriesSortedByTree = [];
        $scope.showSecondaryTimezoneNotice = showSecondarySTMs && useLocationTimezone;
        $scope.opened = false;

        // compile
        $compile(lightboxDomElement)($scope);


        // add ESC shortcut
        $scope.$on('keypress', (broadcastData, e) => {
            if (e.which === 27) {
                $scope.closeLightbox();
            }
        });


        // open the UI
        function open(reload = false) {
            lightboxDomElement.find('#LocationFilteringLightbox').draggable({ handle: '#LocationFilteringLightboxHeader' });
            $scope.opened = true;
            $scope.reload = reload;
            lightboxDomElement.show();
            StateService.setLightBoxStatus(); // set lightbox state to open
        }


        // window.__openLocationFilteringAndReload = () => open(true);


        // close the UI (only if we have at least 1 loaded location)
        $scope.closeLightbox = () => {
            if (!$scope.noLocationsLoad) {
                for (let key in $scope.locationFilterCopy) {
                    $scope.locationFilter[key] = $scope.locationFilterCopy[key];
                }

                $scope.showOrphanServices = $scope.showOrphanServicesOldValue;

                lightboxDomElement.hide();
                StateService.setLightBoxStatus(false); // set lightbox state to open

                $scope.opened = false;
            }
        };


        // this object will make the indentations on the tree UI
        $scope.styleForLocationTree =  (depth) => {
            return {
                'margin-left': depth * 20 + 'px'
            }
        };


        // ready data for display - should happen only once when finished loading the territories list
        ResourcesAndTerritoriesService.promises.territories().then(() => {

            var treeData = {},
                m_locationTreeDataUnflatten = [],
                userSettingLocations = [],
                showLocations = [];

            // start build unflatten tree for location filtering hierarchy
            for (let id in ResourcesAndTerritoriesService.territories()) {
                treeData[id] = {
                    id: id,
                    parent: ResourcesAndTerritoriesService.territories()[id].parentTerritory ? ResourcesAndTerritoriesService.territories()[id].parentTerritory : 0,
                    text: ResourcesAndTerritoriesService.territories()[id].name,
                    items: []
                };
            }


            // build data stuctures (tree + flat)
            for (let key in treeData) {

                let  node = treeData[key];
                let activeParent = getFirstActiveParent(node);

                if (node.parent !== 0 && activeParent) {
                    treeData[activeParent.id].items.push(node);
                } else {
                    m_locationTreeDataUnflatten.push(node);
                }
            }

            function getFirstActiveParent(node) {
                if (!node.id || !node.parent)
                    return;

                if (treeData[node.parent.id])
                    return node.parent;
                else {

                    //check if territory is even available for user
                    let parentNode = {};
                    if (ResourcesAndTerritoriesService.allTerritories[node.parent.id])
                        parentNode = {
                            id: ResourcesAndTerritoriesService.allTerritories[node.parent.id].id,
                            parent: ResourcesAndTerritoriesService.allTerritories[node.parent.id].parentTerritory ? ResourcesAndTerritoriesService.allTerritories[node.parent.id].parentTerritory : 0
                        };

                    return getFirstActiveParent(parentNode);
                }
            }

            $scope.locationsTree = m_locationTreeDataUnflatten;

            for (let i = 0; i < m_locationTreeDataUnflatten.length; i++) {
                setNodeDepth(m_locationTreeDataUnflatten[i], 0, $scope.locationsFlat);
            }

            // check if we need to show services without locations (and without resource)
            $scope.showOrphanServices = JSON.parse(userSettingsManager.GetUserSettingsProperty('Show_Orphan_Services__c'));
            $scope.showOrphanServicesOldValue = $scope.showOrphanServices;

            $scope.territoriesSortedByTree = sortLocationsByTree(ResourcesAndTerritoriesService.territories(), $scope.locationsFlat);

            // we have something saved, lets parse it
            if (userSettingsManager.GetUserSettingsProperty('locations') != null) {
                userSettingLocations = userSettingsManager.GetUserSettingsProperty('locations');
            }

            sfdcService.getUnPrivilegeUserSettingsFields().then(result => {

                if (result.length > 1) {

                    let errMsg = customLabels.Unprivileged_Usersettings_Fields_Msg.split('{1}'),
                        originalMsg = errMsg[0],
                        fields = '',
                        maxFields = 3;

                    for (let i = 0; i < result.length && i < maxFields; ++i) {
                        fields += '<br>' + result[i];
                    }

                    if (maxFields < result.length) {
                        let additionalFields = result.length - maxFields;
                        fields += '<br>';
                        originalMsg += errMsg[1].replace('{2}',additionalFields);
                    }

                    originalMsg = originalMsg.replace('{0}',fields);
                    utils.addNotification(customLabels.Unprivileged_Usersettings_Fields, originalMsg);
                }
            }).catch(err => {
                console.warn('GetUserSettingsProperty failed :-(');
                console.error(err);
            });

            for (let i = 0; i < $scope.locationsFlat.length; i++) {

                // no local storage, show location filtering box
                // if (userSettingLocations.length === 0) {
                //     $scope.showLocationFiltering = true;
                //     $scope.noLocationsLoad = true;
                //     open();
                //     return;
                // }

                $scope.noLocationsLoad = false;
                $scope.locationFilter[$scope.locationsFlat[i].id] = userSettingLocations.indexOf($scope.locationsFlat[i].id) > -1;

                if ($scope.locationFilter[$scope.locationsFlat[i].id])
                    showLocations.push($scope.locationsFlat[i].id);
            }

            // make a copy, used when user closing without save
            $scope.locationFilterCopy = angular.copy($scope.locationFilter);
            userSettingsManager.SetUserSettingsProperty('locations', JSON.stringify(showLocations));

        });


        // set node depth on each location (will be used to indent in the UI)
        function setNodeDepth(current, depth, arr) {
            current.depth = depth;
            arr.push(current);

            if (current.items) {
                for (let i = 0, len = current.items.length; i < len; i++) {
                    current.items[i].depth = depth;
                    setNodeDepth(current.items[i], depth + 1, arr);
                }
            }
        }


        // apply location filtering (clean memorym bring new objects)
        $scope.applyFilterLocation = () => {

            let showLocations = [], hideLocations = [];

            for (let key in $scope.locationFilter) {
                if ($scope.locationFilter[key]) {
                    showLocations.push(key);
                } else {
                    hideLocations.push(key);
                }
            }

            if (showLocations.length === 0) {
                alert(customLabels.One_loaded_location);
                return;
            }

            $scope.noLocationsLoad = false;
            angular.extend($scope.locationFilterCopy, $scope.locationFilter);
            $scope.showOrphanServicesOldValue = $scope.showOrphanServices;

            StateService.isLoadingNewLocations = true;

            GanttPalettesService.resetCurrentPalette();

            // save settings
            userSettingsManager.SetUserSettingProperties($scope.parseLocationSettings(JSON.stringify(showLocations), $scope.showOrphanServices))
                .then( () => {


                    if ($scope.reload) {
                        window.window.location.reload();
                        return;
                    }


                    // reset monthly
                    monthlyViewHelperService.reset();

                    // reset resource and territories
                    ResourcesAndTerritoriesService.reset();

                    // reset all gantt events
                    scheduler._events = {};
                    // delete all calendars, relocations...
                    scheduler.deleteMarkedTimespan();

                    // reset timephased object
                    TimePhasedDataService.reset();

                     // calendars, relocations... crew members... capacity white markings...
                    calendarsService.reset();
                    ResourceCrewsService.reset();
                    ResourceCapacitiesService.reset();

                    ResourcesAndTerritoriesService.getResourceAndTerritories().then( () => {

                        let start = new Date(scheduler.getState().min_date),
                            finish = new Date(scheduler.getState().max_date);

                            start.setDate(start.getDate() - 1);
                            finish.setDate(finish.getDate() + 1);

                            TimePhasedDataService.getTimePhasedObjects(start, finish)
                                .then( () => {
                                    updateViewDebounced();
                                    $rootScope.$broadcast('gotNewResources', { show: showLocations });
                                    StateService.isLoadingNewLocations = false;
                                });
                    });

                }).catch(err => {
                    // console.warn('SetUserSettingProperties failed :-(');
                    // console.error(err);
                    var msg = customLabels.territories_r_failure_msg + '\n';
                    var FailedLocations = JSON.parse(err.FailedLocations);

                    for (let i = 0; i < FailedLocations.length; i++) {
                        msg +=  FailedLocations[i].Name + '\n';
                    }

                    utils.addNotification(customLabels.territories_r_failure, msg);
                    StateService.isLoadingNewLocations = false;
                });


            $scope.closeLightbox();
        };

        $scope.parseLocationSettings = (locations, showOrphanServices) => {
            return {
                locations,
                Show_Orphan_Services__c: showOrphanServices
            };
        };


        // for location filter
        $scope.selectLocation = (locationId) => {
            let bool = $scope.locationFilter[locationId],
                parentLocation = findLocationInTree($scope.locationsTree, locationId);

            if (parentLocation) {
                selectLocationTree(parentLocation, bool);
            }
        };


        // find parent location in the tree
        function findLocationInTree(locationsTree, locationId) {

            let child = null;

            for (let i = 0; i < locationsTree.length; i++) {
                if (locationsTree[i].id === locationId) {
                    return locationsTree[i];
                }
                else {
                    child = findLocationInTree(locationsTree[i].items, locationId);
                    if (child) {
                         return child;
                    }
                }
            }

            return child;
        }


        // check / uncheck the locations.
        function selectLocationTree(location, bool) {
            for (let i = 0; i < location.items.length; i++) {
                $scope.locationFilter[location.items[i].id] = bool;
                selectLocationTree(location.items[i], bool);
            }
        }


        // select all available locations
        $scope.selectAllLocations = (isSelectAll, filteredLocations, locationFilter) => {
            angular.forEach(filteredLocations, function (item) {
                locationFilter[item.id] = isSelectAll;
            });
        };


        function sortLocationsByTree(territories, flatLocations) {
            let territoriesArray = Object.keys(territories)
                    .map(key => territories[key])
                    .sort( (a,b) => {

                        let a_pos = 0,
                            b_pos = 0;

                        flatLocations.forEach( (location, index) => {
                            if (location.id === a.id) {
                                a_pos = index;
                            }

                            if (location.id === b.id) {
                                b_pos = index;
                            }
                        });

                        if (a_pos > b_pos) return 1;
                        if (a_pos < b_pos) return -1;
                        return 0;
                    });

            return territoriesArray;
        }


        // DOM element
        function generateTemplate() {
            return angular.element(`<div class="LightboxBlackContainer">
                        <div class="LightboxContainer" id="LocationFilteringLightbox" ng-if="opened">

                            <div class="lightboxHeaderContainer" id="LocationFilteringLightboxHeader">
                                <h1 class="light-box-header">${customLabels.Location_filtering}</h1>
                                <svg ng-click="closeLightbox()" aria-hidden="true" class="slds-icon CloseLightbox" ng-hide="noLocationsLoad">
                                      <use xlink:href="${lsdIcons.close}"></use>
                                </svg>
                            </div>

                            <div class="lightboxContentContainer">

                                <p>${customLabels.LocationFilteringParagraph}</p>
                                <div class="LocationsTreeContainer">
                                    <p id="secondary-notice" ng-show="showSecondaryTimezoneNotice">${customLabels.Stms_with_different_tz}</p>

                                    <div class="locationFilterRow addBorderBottom">
                                        <input type="checkbox" ng-model="showOrphanServices" id="servicesNoLocations" />
                                        <label for="servicesNoLocations">${customLabels.unassosiated_filtering}</label><br/>
                                    </div>

                                    <input id="locationFilteringSearch" type="text" ng-model="locationSearchTerm.text" placeholder="${customLabels.Search_location}" />
                                    <span class="selectAllLocations" ng-click="selectAllLocations(true, filteredLocations, locationFilter)" title="${customLabels.Select_all}">${customLabels.All}</span>
                                    <span class="selectAllLocations" ng-click="selectAllLocations(false, filteredLocations, locationFilter)" title="${customLabels.Select_none}">${customLabels.None}</span>

                                    <div ng-repeat="l in filteredLocations = (locationsFlat | filter:locationSearchTerm)" class="locationFilterRow" ng-style="{{ styleForLocationTree(l.depth) }}" ng-click="selectLocation(l.id)">
                                        <input type="checkbox" ng-model="locationFilter[l.id]" id="LB_location_{{ l.id }}" />
                                        <label for="LB_location_{{ l.id }}" ng-bind="l.text"></label><br/>
                                    </div>

                                </div>

                            </div>

                            <div class="lightboxControllers">
                                <div class="lightboxSaveButton" ng-click="applyFilterLocation()">${customLabels.Save}</div>
                            </div>

                        </div>
                    </div>`);
        }


        function getFlatTerritoriesArray() {
            return $scope.locationsFlat;
        }

        function getTerritoriesSortedByTree() {
            return $scope.territoriesSortedByTree;
        }


        // This will be our factory
        return {
            open,
            getFlatTerritoriesArray,
            getTerritoriesSortedByTree
        };
    }


}());


***/
"use strict";