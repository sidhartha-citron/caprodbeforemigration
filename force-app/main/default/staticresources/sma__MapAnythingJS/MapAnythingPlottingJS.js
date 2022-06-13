/*global
    MAListView MASystem MA google $ MAToastMessages MALayers userSettings getProperty
*/
var defaultListViewPageSize = 50;

//commit for pull request
//commit post merge request test
var MAPlotting = {
    workerTesting: true,
    plottedUniqueIds: {},
    plottedIds: {},
    mobileForceCluster: function (renderArray) {
        // forcing mobile to use clusters, confusing bit of logic here
        // actually marking them as markers, but at the plotting stage we will set the cluster threshold high so everything is clustered.
        // will keep proximity circles and other options available on mobile
        // search for m_clusterer.setMaxZoom(0); to see the change in plotting || var mobileClusterForce = MA.isMobile ? 22 : 0;
        renderArray = renderArray || [];
        var newRenderMap = {};
        if (Array.isArray(renderArray)) {
            for (var i = 0; i < renderArray.length; i++) {
                var renderType = renderArray[i] || '';
                var lowerRenderType = renderType.toLowerCase()
                if (lowerRenderType === 'cluster') {
                    renderType = 'Markers';
                }
                newRenderMap[renderType] = 0;
            }
        } else {
            newRenderMap = { Markers: 0 };
        }
        return Object.keys(newRenderMap);
    },
    analyzeQuery: function (plotOptions) {
        var dfd = $.Deferred();
        plotOptions = $.extend({
            id: '',
            renderAs: ['Markers'],
            visibleAreaOnly: false,
            name: '',
            refreshThisQuery: false,
            isPlotOnLoad: false,
            proximityOptions: {},
            isLive: false,
            ignoreZoomToFit: false
        }, plotOptions || {});
        plotOptions.savedQueryId = plotOptions.id;

        // if a qid, reuse
        if (!plotOptions.qid) {
            plotOptions.qid = plotOptions.savedQueryId + new Date().getTime();
        }
        //html decode our plotoptions.name, using .text() will encode it properly
        plotOptions.name = htmlDecode(plotOptions.name);
        // check mobile visible area toggle
        if (MA.isMobile) {
            // is this plotting visible area by default?
            var defaultActionIsVisibleArea = plotOptions.visibleAreaOnly;
            // if plot visible by default it overwrites the settings toggle
            if (defaultActionIsVisibleArea) {
                plotOptions.visibleAreaOnly = true;
            } else {
                plotOptions.visibleAreaOnly = window.userSettings.visibleAreaOnMobile || false;
            }

            // force the render type from default || markers to cluster
            plotOptions.renderAs = MAPlotting.mobileForceCluster(plotOptions.renderAs);
        }

        // if live, disable visible area
        var isLive = String(plotOptions.layerType).match(/live/i) !== null || String(plotOptions.type).match(/live/i) !== null || plotOptions.isLive;

        plotOptions.visibleAreaOnly = isLive ? false : plotOptions.visibleAreaOnly;
        // if map it, disable visible area
        plotOptions.visibleAreaOnly = plotOptions.isMapIt ? false : plotOptions.visibleAreaOnly;

        //create a new plotted query from the template
        if (plotOptions.plottedQuery) {
            plotOptions.refreshThisQuery = true;
        }

        MAPlotting.buildLayerElement(plotOptions).then(function ($plottedQuery) {
            var $mobileMessage;
            // var $mobilePlottedQuery;

            if (MA.isMobile) {
                //we need to create a individual view
                $mobileMessage = MAToastMessages.showLoading({ message: plotOptions.name, subMessage: 'Loading...', timeOut: 0, extendedTimeOut: 0 });
                $plottedQuery.data('mobileMessage', $mobileMessage);
                // $mobilePlottedQuery = MAPlotting.buildMobileElement(plotOptions);
            }

            $plottedQuery.find('.queryIcon').hide();
            $plottedQuery.find('.queryError').hide();
            $plottedQuery.find('.queryLoader, .loading-icon').show();
            $plottedQuery.data('imgIds', []);
            $plottedQuery.data('savedQueryId', plotOptions.savedQueryId);
            //ensure we have unique qid, we should have one from buildLayerElement function
            var qid = plotOptions.qid;
            //keep track of general info for mobile quick access
            var plottedObj = MAPlotting.plottedIds[plotOptions.id] = {
                type: 'markerLayer',
                qid: qid,
                name: plotOptions.name,
                savedQueryId: plotOptions.id
            }
            //data to send to phase 1
            var requestData = {};

            //update mobile with qid
            if (MA.isMobile) {
                var queryLimit = 1000;
                if (userSettings.mobilePlotLimit) {
                    queryLimit = userSettings.mobilePlotLimit == '' ? 1000 : MA.Util.parseNumberString(userSettings.mobilePlotLimit);
                }
                requestData.limitMobile = queryLimit;
            }

            try {
                //BEGIN MA ANALYTICS
                var processData = {
                    ajaxResource: 'MATreeAJAXResources',
                    action: 'store_layer_analytics',
                    track: 'true',
                    subtype: 'Marker Layer',
                    id: plotOptions.id
                };

                Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                    processData,
                    function (res, event) {
                        //done saving analytics
                        VueEventBus.$emit('load-recents-layers');
                    }, { buffer: false, escape: true, timeout: 120000 }
                );

            } catch (err) {
                MA.log(err);
            }
            trackUsage('MapAnything', { action: 'Plotted Query', subtype: 'Salesforce Layer' });
            //END MA ANALYTICS

            //check if we can edit this
            $plottedQuery.data('modify', plotOptions.modify || false);
            if (plotOptions.modify !== true) {
                $plottedQuery.find('.edit-query').remove();
            }

            //build request data

            if (plotOptions.isMapIt) {
                $.extend(requestData, {
                    BaseObjectId: plotOptions.baseObjectId,
                    recordIds: plotOptions.recordIds.join(','),
                    markerColor: plotOptions.markerColor,
                    tooltipFieldsString: plotOptions.tooltipFields.join(','),
                    name: plotOptions.name || 'Map It',
                    action: 'phase_1Mapit'
                });

                if (MA.isMobile) {
                    //make sure we have a name
                    $mobileMessage.find('.toast-title').text(plotOptions.name);
                }

                $plottedQuery.data('mapItOptions', plotOptions.proximityOptions);
                $plottedQuery.find('.edit-query').remove();
                $plottedQuery.find('.refresh-query').remove();
            }
            else {
                requestData.savedQueryId = plotOptions.savedQueryId;
                requestData.action = 'phase_1';
            }

            if(!plotOptions.refreshThisQuery) {
                if (MA.isMobile) {
                    VueEventBus.$emit('change-tab', 'layers');
                    VueEventBus.$emit('update-layer-tab', 'tabLayersActive');
                } else {
                    MALayers.moveToTab('plotted');
                }
            } else {
                VueEventBus.$emit('hide-markerData-views');
            }

            var isVisibleAreaQuery = false;
            var visibleAreaObj = {};
            if (!String(plotOptions.layerType).match(/live/i) && plotOptions.visibleAreaOnly) {
                var mapBounds = MA.map.getBounds();
                isVisibleAreaQuery = true;

                var currentCenterPoint = MA.map.getCenter();
                var adjustedCenterPoint = new google.maps.LatLng(currentCenterPoint.lat(), currentCenterPoint.lng());

                visibleAreaObj = {
                    visibleAreaOnly: true,
                    mapLat: adjustedCenterPoint.lat(),//MA.map.getCenter().lat(),
                    mapLong: adjustedCenterPoint.lng(),//MA.map.getCenter().lng() ,
                    mapHeight: Math.abs(mapBounds.getNorthEast().lat() - mapBounds.getSouthWest().lat()),
                    mapWidth: Math.abs(mapBounds.getNorthEast().lng() - mapBounds.getSouthWest().lng())
                };
                $.extend(requestData, visibleAreaObj);
            }

            //get the query information (analyze_query)
            $.extend(requestData, {
                ajaxResource: 'MASavedQueryAJAXResources'
            });

            Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequestReadOnly,
                requestData,
                function (response, event) {
                    if (event.status) {
                        if (response && response.success) {
                            var queryData = response.data || {};
                            //check if it was actually successful
                            if (queryData.recordIds === null) {
                                growlError($('#growl-wrapper'), 'Error Analyzing Query', 6000);
                                $plottedQuery.find('.basicinfo-name').text(plotOptions.name);
                                $plottedQuery.find('.queryLoader, .loading-icon').hide();
                                $plottedQuery.removeClass('loading').addClass('error').find('.status').text('Unable to plot this query.');
                                if (MA.isMobile) {
                                    // $mobilePlottedQuery.find('.legendField').text('Unable to plot this query.');
                                    MAToastMessages.hideMessage($plottedQuery.data('mobileMessage'));
                                }
                                $plottedQuery.find('.queryError').show();
                                $plottedQuery.find('.query-visibility').css('visibility', 'hidden');
                                dfd.reject({ success: false, options: plotOptions })
                                return;
                            }

                            // unpack any query data that needs unpacking
                            // ex. json strings that can be native JS objects
                            var queryData = MAPlotting.unpackPlottingData(queryData);
                            // fill in baseobject
                            var baseObjectLabel = getProperty(queryData, 'options.baseObjectLabel');
                            $plottedQuery.find('.basicinfo-baseobjectname').text(baseObjectLabel || '');

                            // what type of query is this?
                            var queryType = getProperty(queryData, 'layerType');


                            if (String(queryType).match(/live/i)) {
                                $plottedQuery.addClass('LiveLayer');
                                $plottedQuery.find('.layer-type-icon .ma-icon').attr('type', 'live');
                            }

                            if (!MASystem.Organization.isMALiveEnabled && String(queryType).match(/live/i)) {
                                MAToastMessages.showWarning({ message: 'MapAnything Live Warning', subMessage: 'This organization does not have a "Live" subscription', timeOut: 6000 });
                                $plottedQuery.find('.basicinfo-name').text(plotOptions.name);
                                $plottedQuery.find('.queryLoader, .loading-icon').hide();
                                $plottedQuery.removeClass('loading').addClass('error').find('.status').text('Unable to plot this query.');
                                if (MA.isMobile) {
                                    // $mobilePlottedQuery.find('.legendField').text('Unable to plot this query.');
                                }
                                $plottedQuery.find('.queryError').show();
                                $plottedQuery.find('.query-visibility').css('visibility', 'hidden');
                                if (MA.isMobile) {
                                    MAToastMessages.hideMessage($plottedQuery.data('mobileMessage'));
                                }
                                dfd.reject({ success: false, options: plotOptions })

                                return;
                            }

                            if (plotOptions.isPlotOnLoad) {
                                //update some query info
                                var savedQueryRecord = getProperty(queryData, 'savedQueryRecord') || {};
                                var createdBy = getProperty(savedQueryRecord, 'CreatedBy') || {};
                                var modifiedBy = getProperty(savedQueryRecord, 'LastModifiedBy') || {};
                                var createdDate = moment(MA.Util.normalizeDateTime(savedQueryRecord.CreatedDate)).format(MASystem.User.dateTimeFormat.replace(/d/g, 'D').replace('yyyy', 'YYYY'));
                                var formattedCreatedBy = createdBy.Name + ', ' + createdDate;
                                var modifiedByDate = moment(MA.Util.normalizeDateTime(savedQueryRecord.LastModifiedDate)).format(MASystem.User.dateTimeFormat.replace(/d/g, 'D').replace('yyyy', 'YYYY'));
                                var formattedModifiedBy = modifiedBy.Name + ', ' + modifiedByDate;
                                $plottedQuery.data({
                                    savedQueryName: queryData.savedQueryName || 'N/A',
                                    baseObjectLabel: getProperty(queryData, 'options.baseObjectLabel') || 'N/A',
                                    createdBy: formattedCreatedBy,
                                    modifiedBy: formattedModifiedBy,
                                    folderPath: plotOptions.folderPath || '',
                                    description: savedQueryRecord.Desciption__c || 'N/A'
                                });
                            }

                            //if this is a maplock/visible area,extend the queryData if dynamic
                            var markerAssignmentType = getProperty(queryData, 'markerAssignmentType');
                            if (markerAssignmentType === 'dynamicQuery' && isVisibleAreaQuery) {
                                //extend the query data with maplock/visible area
                                queryData.visibleAreaInfo = visibleAreaObj;
                            }

                            //check if this is a dynamic query
                            MAPlotting.processDynamicFilters(queryData, function (res) {
                                //done checking for dynamic, continue with plotting
                                if (res.success) {
                                    //update query info
                                    var queryData = res.data;
                                    if (MA.isMobile) {
                                        plottedObj.name = queryData.savedQueryName;
                                        plottedObj.layerType = getProperty(queryData, 'options.baseObjectLabel') || 'N/A';
                                        $plottedQuery.data({
                                            savedQueryName: plottedObj.name,
                                            baseObjectLabel: plottedObj.layerType,
                                        });
                                    }

                                    $plottedQuery.data('recordList', queryData.recordIds);
                                    var savedQueryRecord = MA.Util.removeNamespace(queryData.savedQueryRecord, 'sma__');

                                    try {
                                        if (savedQueryRecord.ColorAssignment__c) {
                                            savedQueryRecord.ColorAssignment__c = JSON.parse(savedQueryRecord.ColorAssignment__c);
                                        }
                                        if (savedQueryRecord.AdvancedOptions__c) {
                                            savedQueryRecord.AdvancedOptions__c = JSON.parse(savedQueryRecord.AdvancedOptions__c);
                                        }
                                        if (savedQueryRecord.ProximityOptions__c) {
                                            savedQueryRecord.ProximityOptions__c = JSON.parse(savedQueryRecord.ProximityOptions__c);
                                        }
                                        if (savedQueryRecord.ShapeAssignment__c) {
                                            savedQueryRecord.ShapeAssignment__c = JSON.parse(savedQueryRecord.ShapeAssignment__c);
                                        }
                                    } catch (e) { }

                                    $plottedQuery.data('queryRecord', savedQueryRecord);

                                    //get the filter type for formatting
                                    var queryTooltips = queryData.tooltips || [];
                                    var legendFormatType = 'string';
                                    var picklistMap = {};
                                    for (var i = 0; i < queryTooltips.length; i++) {
                                        var tp = queryTooltips[i];
                                        var type = tp.TooltipType || '';
                                        if ((/color/i).test(type) || (/shape/i).test(type)) {
                                            var soapType = getProperty(tp, 'describe.type') || 'string';
                                            legendFormatType = soapType.toLowerCase();

                                            if (legendFormatType == 'picklist') {
                                                //create a map for the legend to translate the values into labels
                                                var picklistOptions = getProperty(tp, 'describe.picklistValues', false) || [];
                                                if (Array.isArray(picklistOptions)) {
                                                    for (var t = 0; t < picklistOptions.length; t++) {
                                                        var tpOpt = picklistOptions[t];
                                                        var value = tpOpt.value;
                                                        var label = tpOpt.label;
                                                        picklistMap[value] = label;
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    //update query and build legend
                                    $plottedQuery.find('.color-box').replaceWith('<span style="font-size: 24px;vertical-align: middle;margin-right: 4px;color:#217AA6;display:none;" class="MAIcon ion-android-pin queryIcon"></span>');
                                    if (savedQueryRecord.ColorAssignmentType__c == 'Static') {
                                        $plottedQuery.find('.color-box').replaceWith('<span style="font-size: 24px;vertical-align: middle;margin-right: 4px;color:#217AA6; display:none;" class="MAIcon ion-android-pin queryIcon"></span>');
                                    }
                                    else if (savedQueryRecord.ColorAssignmentType__c == 'Dynamic-Label') {
                                        $plottedQuery.find('.color-box').replaceWith('<span style="font-size: 24px;vertical-align: middle;margin-right: 4px;color:#217AA6;display:none;" class="MAIcon ion-chatbox queryIcon"></span>');
                                    }
                                    else if (savedQueryRecord.ColorAssignmentType__c == 'Dynamic-Order') {
                                        $plottedQuery.find('.color-box').replaceWith('<span style="font-size: 24px;vertical-align: middle;margin-right: 4px;color:#217AA6;display:none;" class="MAIcon ion-ios-infinite queryIcon"></span>');
                                    }
                                    else if (savedQueryRecord.ColorAssignmentType__c == 'Dynamic-multiField') {
                                        $plottedQuery.data('shapeAssignmentIsFirst', true);
                                    }

                                    //build the legend
                                    var imagesDone = false;
                                    MAPlotting.buildLegend({ qid: $plottedQuery.attr('qid'), legendFormatType: legendFormatType, picklistMap: picklistMap, queryData: queryData }).then(function (buildLegendInfo) {
                                        if (MA.isMobile) {
                                            // $mobilePlottedQuery.find('.legend-wrap').html(buildLegendInfo.legendHTML);
                                        }
                                        $plottedQuery.find('.legend').html(buildLegendInfo.legendHTML);
                                        //keep track for mobile access
                                        plottedObj.legendInfo = buildLegendInfo;
                                        $plottedQuery.data('legendInfo', buildLegendInfo.legendMap);
                                        $plottedQuery.data('imgIds', buildLegendInfo.ImgIds);
                                        $plottedQuery.data('imgInfo', buildLegendInfo.imageArray);
                                        var $imgLegendRows = $plottedQuery.find('.legend-image');
                                        $.each($imgLegendRows, function (i, row) {
                                            var $row = $(row);
                                            var rowImgId = $row.attr('data-id');
                                            var cachedImgUrl = imgLoaderDimensions[rowImgId];
                                            if (cachedImgUrl && cachedImgUrl.imgURL) {
                                                $row.attr('src', cachedImgUrl.imgURL);
                                            }
                                        });
                                        imagesDone = true;
                                    });

                                    imgLoaderIntervals[$plottedQuery.attr('qid')] = setInterval(function () {
                                        if ((imgLoaderCounts[$plottedQuery.attr('qid')] || 0) === 0) {
                                            imagesDone = true;
                                            clearInterval(imgLoaderIntervals[$plottedQuery.attr('qid')]);
                                            //done processing images, update any legend images that failed
                                            var $imgLegendRows = $plottedQuery.find('.legend-image');
                                            $.each($imgLegendRows, function (i, row) {
                                                var $row = $(row);
                                                var rowImgId = $row.attr('data-id');
                                                var cachedImgUrl = imgLoaderDimensions[rowImgId];
                                                if (cachedImgUrl && cachedImgUrl.imgURL) {
                                                    $row.attr('src', cachedImgUrl.imgURL);
                                                }
                                            });
                                        }
                                    }, 400);

                                    //now process the data
                                    var queryImageInterval = setInterval(function () {
                                        if (imagesDone) {
                                            clearInterval(queryImageInterval);
                                            var plottingData = res.data;
                                            plottingData.plottedQuery = $plottedQuery;
                                            //keep track of refresh and force render options
                                            plottingData.isRefresh = false;
                                            if (plotOptions.refreshThisQuery) {
                                                plottingData.isRefresh = true;
                                            }
                                            if (plotOptions.disableProximityOverride) {
                                                plottingData.disableProximityOverride = true;
                                            }
                                            // show alert on mobile to warn of memory consumption if proximity options
                                            MAPlotting.warnProximityOptions(plottingData).then(function(proximityRes) {
                                                if (proximityRes.override) {
                                                    $plottedQuery.data('disableProximityOverride', true);
                                                    plottingData.proximityOptions = {};
                                                    plottingData.proximityOptions.enabled = 'false'
                                                }
                                                MAPlotting.plotQuery(plottingData, plotOptions.renderAs, function (res) {
                                                    if (plotOptions.isMapIt) {
                                                        if (NewLayerNavigationEnabled()) {
                                                            MALayers.moveToTab('plotted');
                                                        }
                                                        else {
                                                            if (!$('#tabs-nav-plotted').hasClass('tab-open')) {
                                                                $('#tabs-nav-plotted').click();
                                                            }
                                                        }
                                                        if (!plotOptions.ignoreZoomToFit) {
                                                            ZoomToFit();
                                                        }
                                                        else {
                                                            try {
                                                                //zoom to that marker
                                                                var bounds = new google.maps.LatLngBounds();
                                                                $.each($plottedQuery.data('records'), function (index, record) {
                                                                    if (record.marker && (record.isVisible || record.isClustered || record.isScattered)) {
                                                                        bounds.extend(record.marker.getPosition());
                                                                    }
                                                                });
                                                                if (!bounds.isEmpty()) {
                                                                    MA.map.fitBounds(bounds);
                                                                    //back out the zoom
                                                                    MA.map.setZoom(13);
                                                                }
                                                            }
                                                            catch (e) {
                                                                MA.log('Unable to zoom to sf record search marker.', e);
                                                            }
                                                        }
                                                    }

                                                    var endTime = new Date().getTime();
                                                    $plottedQuery.removeClass('loading');
                                                    $plottedQuery.find('.queryIcon').show();
                                                    $plottedQuery.find('.queryLoader, .loading-icon').hide();
                                                    $plottedQuery.find('.legend').show();
                                                    $plottedQuery.addClass('testing');

                                                    var savedQueryName = plottingData.savedQueryName || $plottedQuery.data('savedQueryName') ||
                                                        getProperty($plottedQuery.data('savedQueryName') || {}, 'queryRecord.Name', false) ||
                                                        getProperty($plottedQuery.data('savedQueryName') || {}, 'savedQueryRecord.Name', false) ||
                                                        '';

                                                    savedQueryName = htmlDecode(savedQueryName);

                                                    $plottedQuery.find('.basicinfo-name').text(savedQueryName || '');

                                                    // check if this is an auto refreshing layer
                                                    if (savedQueryRecord.RefreshInterval__c) {
                                                        var refreshIntervalParts = savedQueryRecord.RefreshInterval__c.split(' ');
                                                        var refreshUnit = refreshIntervalParts[1];
                                                        var refreshTimeoutValue = parseInt(refreshIntervalParts[0]) * (refreshUnit == 'sec' ? 1000 : 60000);

                                                        $plottedQuery.data('refreshTimeout', setTimeout(function () {
                                                            MAPlotting.refreshQuery($plottedQuery, refreshTimeoutValue).then(function (res) {
                                                                //nothing to do
                                                            });

                                                        }, refreshTimeoutValue)
                                                        );
                                                    }

                                                    //create listview
                                                    if (!MA.isMobile) {
                                                        MAListView.ConstructTab($plottedQuery.attr('qid'));
                                                    }
                                                    else {
                                                        MAToastMessages.hideMessage($plottedQuery.data('mobileMessage'));
                                                        if ($('#mapWrapSelector').width() < 769 && !plotOptions.refreshThisQuery) {
                                                            MAToastMessages.showSuccess({
                                                                subMessage: 'Success: View on Map',
                                                                timeOut: 5000,
                                                                extendedTimeOut: 5000,
                                                                onclick: function () {
                                                                    VueEventBus.$bus.$emit('change-tab', 'map');
                                                                    ZoomToFit({ queries: [$plottedQuery] });
                                                                }
                                                            });
                                                        }

                                                        
                                                    }

                                                    dfd.resolve({ success: true, queryData: $plottedQuery.data() })

                                                    // check if we have proximity enabled
                                                    $('#PlottedQueriesContainer .PlottedRowUnit').each(function (i, row) {
                                                        var $query = $(row);
                                                        var queryData = $query.data() || {};
                                                        ChangeVisibilityWhenCircleIsAdded({ force: false, keepRelatedShapes: true });
                                                        return;
                                                    });

                                                });
                                            });
                                        }
                                    }, 100);
                                }
                                else {
                                    growlError($('#growl-wrapper'), res.message, 6000);
                                    $plottedQuery.find('.basicinfo-name').text('Error');
                                    $plottedQuery.find('.drop-menu-wrapper').hide();
                                    $plottedQuery.removeClass('loading').addClass('error').find('.status').text('Unable to plot this query.');
                                    $plottedQuery.find('.queryError').show();
                                    $plottedQuery.find('.queryLoader, .loading-icon').hide();
                                    dfd.reject({ success: false, options: plotOptions })

                                    if (MA.isMobile) {
                                        MAToastMessages.hideMessage($plottedQuery.data('mobileMessage'));
                                    }
                                }
                            });
                        }
                        else {
                            $plottedQuery.removeClass('loading').addClass('error').find('.status').text(response.message);
                            $plottedQuery.find('.queryLoader, .loading-icon').hide();
                            $plottedQuery.removeClass('loading').addClass('error').find('.status').text('Unable to plot this query.');
                            $plottedQuery.find('.queryError').show();
                            $plottedQuery.find('.query-visibility').css('visibility', 'hidden');
                            dfd.reject({ success: false, options: plotOptions })

                            if (MA.isMobile) {
                                MAToastMessages.hideMessage($plottedQuery.data('mobileMessage'));
                            }
                            else {
                                NotifyError('Unable to plot this query.', response.message || '');
                            }
                        }
                    }
                    else if (event.type === 'exception') {
                        MA.log(event.message + ' :: ' + event.where);
                        growlError($('#growl-wrapper'), event.message, 6000);
                        $plottedQuery.find('.basicinfo-name').text('Error');
                        $plottedQuery.find('.drop-menu-wrapper').hide();
                        $plottedQuery.removeClass('loading').addClass('error').find('.status').text('Unable to plot this query.');
                        $plottedQuery.find('.queryError').show();
                        $plottedQuery.find('.queryLoader, .loading-icon').hide();
                        dfd.reject({ success: false, options: plotOptions })
                        if (MA.isMobile) {
                            MAToastMessages.hideMessage($plottedQuery.data('mobileMessage'));
                        }
                    }
                    else {
                        MA.log(event.message);
                        growlError($('#growl-wrapper'), res.message, 6000);
                        $plottedQuery.find('.basicinfo-name').text('Error');
                        $plottedQuery.find('.drop-menu-wrapper').hide();
                        $plottedQuery.removeClass('loading').addClass('error').find('.status').text('Unable to plot this query.');
                        $plottedQuery.find('.queryError').show();
                        $plottedQuery.find('.queryLoader, .loading-icon').hide();
                        dfd.reject({ success: false, options: plotOptions })

                        if (MA.isMobile) {
                            MAToastMessages.hideMessage($plottedQuery.data('mobileMessage'));
                        }
                    }
                }, { buffer: false, escape: false, timeout: 120000 }
            );
        });
        return dfd.promise();
    },

    sortRecordList: function ($plottedQuery, sortDirection) {
        //1st round will always be asc... 1,2,3,etc...
        sortDirection = sortDirection || 'asc';
        var dfd = $.Deferred();

        var recCount = 0;
        var queryData = $plottedQuery.data() || {};
        var records = queryData.records;
        var keys = Object.keys(records) || [];
        var sortObject = {
            sortBy: sortDirection
        }
        var len = keys.length;
        var markerProcessingBatchSize = MA.Util.isIE() ? 200 : 500;
        var sortArray = [];
        var sortedList = keys;
        while (recCount < len) {
            var recordsProcessed = 0;
            while (recordsProcessed < markerProcessingBatchSize && recCount < len) {
                recordsProcessed++;
                var key = keys[recCount];
                var record = records[key];

                var sortBy = record.sf_order;
                sortBy = isNaN(sortBy) === true ? undefined : parseFloat(sortBy);

                sortArray.push({ sortBy: sortBy, id: recCount, recId: record.Id });
                recCount++;
            }
        }

        if (sortArray.length > 0) {
            //create a worker to sort the records
            if (window.Worker) {
                //create a new worker to process the records
                var sortWorker = new Worker(MA.resources.MAWorker);
                var processOptions = {
                    cmd: 'sortListView',
                    recordList: JSON.stringify(keys),
                    sortArray: JSON.stringify(sortArray),
                    externalScripts: JSON.stringify(MASystem.WorkerResources),
                    //sortDirection : sortDirection,
                    sortObject: JSON.stringify(sortObject)
                };
                sortWorker.postMessage(processOptions);
                sortWorker.onmessage = function (e) {
                    var res = e.data;
                    sortWorker.terminate();
                    if (res.success) {
                        var data = JSON.parse(res.data);
                        //update the record list with the sorted version
                        sortedList = data.recordList;
                    }
                    dfd.resolve({ success: true, sortedList: sortedList });
                };
            }
            else {
                var processOptions = {
                    recordList: keys,
                    sortArray: sortArray,
                    sortObject: sortObject
                };
                mobileSortListView(processOptions, function (res) {
                    if (res.success) {
                        var data = res.data;
                        //update the record list with the sorted version
                        sortedList = data.recordList;
                    }
                    dfd.resolve({ success: true, sortedList: sortedList });
                });
            }
        }
        else {
            dfd.resolve({ success: true, sortedList: sortedList });
        }

        return dfd.promise();
    },

    drawQueryOrderLine: function ($plottedQuery) {
        //get the recordList
        var recordList = $plottedQuery.data('recordList');
        var plottedRecords = $plottedQuery.data('records') || {};
        var keys = Object.keys(plottedRecords) || [];
        var orderedPolylineCoordinates = [];
        //loop over the list and push coords in order
        var orderedList = [];
        MAPlotting.sortRecordList($plottedQuery).then(function (res) {
            var sortedList = res.sortedList || recordList;
            for (var l = 0, len = sortedList.length; l < len; l++) {
                var recordId = sortedList[l];
                var record = plottedRecords[recordId];
                if (record && record.marker) {
                    orderedPolylineCoordinates.push(record.marker.getPosition());
                }
            }

            var orderedPolyline = new google.maps.Polyline({
                map: MA.map,
                path: orderedPolylineCoordinates,
                strokeColor: "#F95",
                strokeWeight: 3
            });

            //store the polyline with the plotted query so it can be removed later
            $plottedQuery.data({
                orderedPolyline: orderedPolyline,
                orderedPolylineCoordinates: orderedPolylineCoordinates
            });
        });
    },

    updateQueryInfo: function ($plottedQuery, callback) {
        callback = callback || function () { };
        var queryData = $plottedQuery.data();

        //loop over records and update legend counts and render info
        var visibleCount = 0;
        var clusterCount = 0;
        var scatterCount = 0;
        var records = queryData.records || {};
        var legendVisible = false;
        //reset legend rows to 0 and total
        $plottedQuery.find('.legend-row .visiblemarkers').text('0');
        $plottedQuery.find('.legend-row .totalmarkers').text('0');
        $plottedQuery.find('.legend-row-header .visiblemarkers').text('0');
        $plottedQuery.find('.legend-row-header .totalmarkers').text('0');

        var filterByAddress = $plottedQuery.data('distanceLimitCircle') == undefined ? false : true;

        var keys = Object.keys(records) || [];
        queryData.recordList = keys; //this is getting overwritten in multiple places... this is the final list
        var len = keys.length;
        var queryTotal = 0;
        var i = 0;
        var prop;
        var markerProcessingBatchSize = MA.Util.isIE() ? 200 : 500;
        var recordsRemaining = len;
        var legendData = queryData.legendInfo;
        //reset legend
        for (var lId in legendData) {
            var section = legendData[lId];
            section.count = 0;
            section.totalmarkers = 0;
        }
        $plottedQuery.find('.status').text('Processing...' + recordsRemaining + ' remaining');

        while (i < len) {
            var recordsProcessed = 0;
            while (recordsProcessed < markerProcessingBatchSize && i < len) {
                recordsProcessed++;
                prop = keys[i];
                var record = records[prop];
                //update counts
                if (record.isVisible) { visibleCount++; }
                if (record.isClustered) { clusterCount++; }
                if (record.isScattered) { scatterCount++; }

                //update legend
                var recordLegendId = record.legendId;
                var legendRowData = legendData[recordLegendId];
                var recIsVisible = (record.isVisible || record.isClustered || record.isScattered);
                if (recIsVisible) {
                    legendVisible = true;
                    legendRowData.count++;
                    record.listViewVisible = true;
                }
                else {
                    record.listViewVisible = false;
                }

                legendRowData.totalmarkers++;

                if (record.marker) {
                    queryTotal++;
                }

                i += 1;
                recordsRemaining--;
            }
            $plottedQuery.find('.status').text('Processing...' + recordsRemaining + ' remaining');
            record = null;
            legendRowData = null;
        }
        prop = null;

        
        var isLoaded = $plottedQuery.data('isLoaded') || false;

        //update the status with total numbers
        $plottedQuery.find('.status').html(MASystem.Labels.MA_RECORDS + ": " + $plottedQuery.data('numRecords') + ($plottedQuery.data('method') == 'cache' ? ' (from cache)' : ''));

        //start build extra info for the query
        var infoHTML = '';

        //geocode info
        var badAddresses = queryData.badAddressArray || [];
        if (queryData.numGeocodeRequestsNeeded > 0 || badAddresses.length > 0) {
            var numNeeded = queryData.numGeocodeRequestsNeeded || 0;
            var totalToGeoCount = queryData.numSuccessfulGeocodes;
            var geoErrorsCountHTML = queryData.geoErrorsCount > 0 ? '<span style="color:#d4504c;cursor:pointer;" onclick="MAPlotting.showGeoErrors(\'' + queryData.qid + '\');">' + queryData.geoErrorsCount + ' errors </span> - ' : '';
            infoHTML += "<div>" + numNeeded + " " + MASystem.Labels.MA_geocodes_completed + ". " + geoErrorsCountHTML + "<span onclick='MAPlotting.showBadGeocodes(\"" + queryData.qid + "\");' class='geocode link'>" + queryData.numFailedGeocodes + " " + MASystem.Labels.MA_bad_address + "</span>.</div>";
        }

        //update info on what was plotted, markers, scatter, etc
        if ($plottedQuery.find('.renderButtons-button.markers').is('.on')) {
            var infoDivText = queryData.numRecords + " " + MASystem.Labels.MA_Markers_Created + ", " + visibleCount + " " + MASystem.Labels.MA_Visible;

            if (/live/i.test(queryData.layerType) && !MA.isMobile) {
                var badLiveRecords = queryData.badLiveRecords || [];

                // If live, display hyperlink which displays a popup with records that had bad device IDs
                if (Array.isArray(badLiveRecords)) {
                    infoDivText += ". <span onclick='MAPlotting.showBadLiveRecords(\"" + queryData.qid + "\");' class='geocode link'>" + badLiveRecords.length + ' Devices Never Reported</span>';
                }

                var liveCriteriaUnmet = queryData.liveCriteriaUnmet || [];

                if (Array.isArray(liveCriteriaUnmet) && isNum(visibleCount)) {
                    infoDivText += "</br>" + visibleCount + " visible. <span onclick='MAPlotting.showLiveCriteriaInfo(\"" + queryData.qid + "\");' class='geocode link'>" + liveCriteriaUnmet.length + ' not visible</span>';
                }
            }

            infoHTML += "<div>" + infoDivText + ".</div>";
        }

        //heatmap info
        if ($plottedQuery.find('.renderButtons-button.heatmap').is('.on')) {
            infoHTML += "<div style='text-transform: lowercase;'>" + $plottedQuery.data('numHeatmapDataPoints') + " heatmap " + MASystem.Labels.MA_RECORDS + ".</div>";
            if (queryData.advancedOptions && queryData.advancedOptions.heatmapWeightedValue && queryData.advancedOptions.heatmapWeightedValue !== "" && queryData.advancedOptions.heatmapWeightedValue !== "None") {
                infoHTML += "<div>" + "Range: " + queryData.lowestHeatMapWeightedValue + " - " + queryData.highestHeatMapWeightedValue + "</div>";
            }
        }

        //cluster info
        if ($plottedQuery.find('.renderButtons-button.cluster').is('.on')) {
            infoHTML += "<div style='text-transform: lowercase;'>" + clusterCount + " cluster " + MASystem.Labels.MA_RECORDS + ".</div>";
        }

        //scatter info
        if ($plottedQuery.find('.renderButtons-button.scatter').is('.on')) {
            infoHTML += "<div style='text-transform: lowercase;'>" + scatterCount + " scatter " + MASystem.Labels.MA_RECORDS + ".</div>";
        }

        $plottedQuery.find('.legend-row .totalmarkers').text(queryTotal);

        //show hide the legendRows now
        for (var lId in legendData) {
            var section = legendData[lId];
            var $row = $plottedQuery.find('.legend-row[data-id="' + lId + '"]');
            var legendSectionId = section.sectionId || '';
            var $sectionRow = $plottedQuery.find('.legend-row-header[data-sectionid="' + legendSectionId + '"]');
            $sectionRow.find('.visiblemarkers').text(parseFloat($sectionRow.find('.visiblemarkers').text()) + section.count);
            $sectionRow.find('.totalmarkers').text(parseFloat($sectionRow.find('.totalmarkers').text()) + section.totalmarkers);
            $row.find('.visiblemarkers').text(section.count);
            if (filterByAddress) {
                //case 00013505, also setting proxliimit to false so drawing shapes will render properly if 'only show markers inside shape' is checked
                section.totalmarkers = section.count;
                queryData.advancedOptions.enableProxLimit = 'false'
            }
            $row.find('.totalmarkers').text(section.totalmarkers);

            var sectionId = $row.attr('data-sectionid');
            var $section = $plottedQuery.find('.legend-row-header[data-sectionid="' + sectionId + '"]');
            if (section.count > 0) {
                if (!isLoaded) {
                    //get the sectionid on update the section if needed
                    $section.removeClass('empty sectionClosed').addClass('sectionOpen').show();
                    $section.find('.rowDropIcon').addClass('ion-android-arrow-dropdown').removeClass('ion-android-arrow-dropup');
                    $row.removeClass('empty');
                    $row.show();
                    $plottedQuery.data('isLoaded', true)
                }
                else {
                    if ($section.find('.rowDropIcon').hasClass('ion-android-arrow-dropdown')) {
                        //get the sectionid on update the section if needed
                        $section.removeClass('empty sectionClosed').addClass('sectionOpen').show();
                        $row.removeClass('empty');
                        $row.show();
                        $row.find('.legend-checkbox').prop('checked', true);
                        $section.find('.legend-header-checkbox').addClass('ion-checkmark-round');
                    }
                    else {
                        //just update the row don't show
                        $row.removeClass('empty');
                        $row.find('.legend-checkbox').prop('checked', true);
                        $section.find('.legend-header-checkbox').addClass('ion-checkmark-round');
                        $section.removeClass('empty').show();
                    }
                }
            }

            var totalCheck = $plottedQuery.find('.legend-row[data-sectionid="' + sectionId + '"] .legend-checkbox:checked').length;
            var totalRows = $plottedQuery.find('.legend-row[data-sectionid="' + sectionId + '"] .legend-checkbox').length;
            if (totalCheck == 0) {
                $section.find('.legend-header-checkbox').removeClass('ion-checkmark-round ion-minus-round');
            }
            else if (totalRows > totalCheck) {
                $section.find('.legend-header-checkbox').addClass('ion-minus-round').removeClass('ion-checkmark-round');
            }
            else {
                $section.find('.legend-header-checkbox').addClass('ion-checkmark-round').removeClass('ion-minus-round');
            }
        }

        if (legendVisible) {
            //$plottedQuery.find('.legend-row').not('.empty').show();
            $plottedQuery.find('.legend-moreless').show();
        }

        //update legend field
        var tooltips = queryData.tooltips || [];
        var tp = tooltips.length;
        while (tp--) {
            var tooltip = tooltips[tp];
            if ((/color/i).test(tooltip.TooltipType)) {
                infoHTML += "<div style='color: black;margin-top: 10px;'>" + MASystem.Labels.MA_LEGEND_FIELD + ": " + htmlEncode(tooltip.FieldLabel) + "</div>";
                break;
            }
        }
        tooltips = null;

        //show the renderbuttons
        var renderTotal = $plottedQuery.find('.item-selectable.active').length;
        if (renderTotal >= 1) {
            //enable visible
            $plottedQuery.find('#select-hide').prop('checked', true);
            $plottedQuery.find('.ma-icon-hide').hide();
            if (renderTotal > 1) {
                $plottedQuery.find('.select-icon').hide();
                $plottedQuery.find('.plotted-visibile-icon .svg-circle-num').remove();

                //add circle icon
                var $cirIcon = $('#templates .svg-circle-num').clone().wrap('<div/>').parent().html()
                    .replace(/__TEXT__/g, renderTotal);
                $plottedQuery.find('.plotted-visibile-icon .multi-select').show().append($cirIcon);
            }
            else {
                $plottedQuery.find('.multi-select').hide();
                var mode = $plottedQuery.find('.item-selectable.active a').attr('data-renderas');
                $plottedQuery.find('.plotted-visibile-icon .select-icon').removeClass('Heatmap Cluster Markers Scatter');
                $plottedQuery.find('.plotted-visibile-icon .select-icon').addClass(mode).show();
            }
        }
        else {
            $plottedQuery.find('#select-hide').prop('checked', false);
            $plottedQuery.find('.plotted-visibile-icon .ma-icon-hide').show();
            $plottedQuery.find('.multi-select, .select-icon').hide();
        }

        MAPlotting.orderLegendRows($plottedQuery);

        $plottedQuery.find('.plottinginfo-wrapper .info').html(infoHTML);
        infoHTML = null;

        callback({ success: true });
    },


    orderLegendRows: function orderLegendRowsAlias($plottedQuery) {
        $plottedQuery = $($plottedQuery);
        var $legendTable = $plottedQuery.find('.legend');
        var legendTableAutoRows = $legendTable.find('.auto-row').remove();

        var arrayWithSortBy = legendTableAutoRows.get().map(function (row) {
            row.sortBy = Number($(row).find('.totalmarkers').text());
            return row;
        });

        var sortedRows = MAListView.MergeSortDesc(arrayWithSortBy);

        $legendTable.find('tr.other').before(sortedRows);

        return;
    },


    MissingAddress_DropPin: function (link, options) {
        var $missingAddress = $(link).closest('.missingAddress');
        options = $.extend({
            qid: '',
            recordId: ''
        }, options || {});

        var $plottedQuery = $('#PlottedQueriesTable .PlottedRowUnit[qid="' + options.qid + '"]');
        var queryData = $plottedQuery.data();
        var badRecords = $('#badAddressPopup').data('recordInfo');
        var record = badRecords[options.recordId];
        if (record) {
            //prepare a status message
            var $statusMessage = $('<div>Click the map to drop a pin or <span>cancel</span></div>');
            $statusMessage.find('span').css({ color: 'blue', cursor: 'pointer' }).click(function () {
                MA.off('nextclick');
            });

            //attach a handler to the next map click
            MA.on('nextclick', function (e, type) {
                //update the record
                updateValue(record, queryData.addressFields.latitude, e.latLng.lat());
                updateValue(record, queryData.addressFields.longitude, e.latLng.lng());

                record.isBadAddress = false;
                record.location = {
                    coordinates: {
                        lat: e.latLng.lat(),
                        lng: e.latLng.lng()
                    }
                }

                //get render modes
                var renderModes = $plottedQuery.find('.renderButtons-button');
                var renderAs = [];
                for (var m = 0; m < renderModes.length; m++) {
                    var $mode = $(renderModes[m]);
                    if ($mode.hasClass('on')) {
                        renderAs.push($mode.attr('data-renderas'));
                    }
                }

                //create record
                var processData = {
                    records: [record],
                    queryRecord: queryData.queryRecord,
                    addressFields: queryData.addressFields,
                    isIE: MA.Util.isIE(),
                    MAIO_URL: getProperty(MASystem || {}, 'Organization.MAIO_URL', false) || 'https://api.mapanything.io',
                    recordList: queryData.recordList,
                    tooltips: queryData.tooltips,
                    imgLoaderDimensions: imgLoaderDimensions,
                    ImageServerEnabled: MASystem.Organization.ImageServerEnabled
                }
                processRecords(processData, function (res) {
                    MAPlotting.processWorkerRecords($plottedQuery, { modes: renderAs, records: [record] }, function () {
                        if (($plottedQuery.data('macluster_clusterGroup') || []).length > 0) {
                            if (!queryData.macluster_cluster) {
                                var clusterer = new MarkerClusterer(MA.map, $plottedQuery.data('macluster_clusterGroup').slice(0, MA.limits.maxClusterSize), {
                                    zoomOnClick: false,
                                    imagePath: MASystem.Images.clusterFolder,
                                    savedQueryName: $plottedQuery.data('savedQueryName'),
                                    qid: $plottedQuery.attr('qid')
                                });
                                clusterer.qid = $plottedQuery.attr('qid');
                                google.maps.event.addListener(clusterer, 'click', cluster_Click);
                                google.maps.event.addListener(clusterer, 'rightclick', cluster_context);
                                $plottedQuery.data('macluster_cluster', clusterer);
                                clusterer.addMarkers($plottedQuery.data('macluster_clusterGroup').slice(0, MA.limits.maxClusterSize));
                                $plottedQuery.data('numClusterDataPoints', clusterer.getTotalMarkers());
                                $plottedQuery.data('macluster_clusterGroup', []);
                            } else {
                                var clusterer = queryData.macluster_cluster;
                                clusterer.addMarkers($plottedQuery.data('macluster_clusterGroup').slice(0, MA.limits.maxClusterSize));
                                $plottedQuery.data('numClusterDataPoints', clusterer.getTotalMarkers());
                                $plottedQuery.data('macluster_clusterGroup', []);
                            }
                        }
                        if (($plottedQuery.data('macluster_scatterGroup') || []).length > 0) {
                            if (!queryData.macluster_scatter) {
                                var cluster_scatter = new MarkerClusterer(MA.map, $plottedQuery.data('macluster_scatterGroup'), {
                                    zoomOnClick: false,
                                    imagePath: MASystem.Images.clusterFolder,
                                    savedQueryName: $plottedQuery.data('savedQueryName'),
                                    qid: $plottedQuery.attr('qid')
                                });
                                var clusterZoomLevel = getProperty(userSettings || {}, 'ClusterZoomLevel', false) || 13;
                                var mobileClusterForce = MA.isMobile ? clusterZoomLevel : 0;
                                cluster_scatter.setMaxZoom(mobileClusterForce);
                                cluster_scatter.qid = $plottedQuery.attr('qid');
                                google.maps.event.addListener(cluster_scatter, 'click', cluster_Click);
                                google.maps.event.addListener(cluster_scatter, 'rightclick', cluster_context);
                                $plottedQuery.data('macluster_scatter', cluster_scatter);
                                cluster_scatter.addMarkers($plottedQuery.data('macluster_scatterGroup'));
                                $plottedQuery.data('macluster_scatterGroup', []);
                            } else {
                                var s_clusterer = queryData.macluster_scatter;
                                s_clusterer.addMarkers($plottedQuery.data('macluster_scatterGroup'));
                                $plottedQuery.data('macluster_scatterGroup', []);
                            }
                        }
                        if (($plottedQuery.data('macluster_markerGroup') || []).length > 0) {
                            if (!queryData.macluster_marker) {
                                var clusterer = new MarkerClusterer(MA.map, $plottedQuery.data('macluster_markerGroup'), {
                                    zoomOnClick: false,
                                    imagePath: MASystem.Images.clusterFolder,
                                    savedQueryName: $plottedQuery.data('savedQueryName'),
                                    qid: $plottedQuery.attr('qid')
                                });
                                var clusterZoomLevel = getProperty(userSettings || {}, 'ClusterZoomLevel', false) || 13;
                                var mobileClusterForce = MA.isMobile ? clusterZoomLevel : 1;
                                clusterer.setMaxZoom(mobileClusterForce);
                                clusterer.qid = $plottedQuery.attr('qid');
                                google.maps.event.addListener(clusterer, 'click', cluster_Click);
                                google.maps.event.addListener(clusterer, 'rightclick', cluster_context);
                                $plottedQuery.data('macluster_marker', clusterer);
                                clusterer.addMarkers($plottedQuery.data('macluster_markerGroup'));
                                $plottedQuery.data('macluster_markerGroup', []);
                            } else {
                                var clusterer = queryData.macluster_marker;
                                clusterer.addMarkers($plottedQuery.data('macluster_markerGroup'));
                                // $plottedQuery.data('numClusterDataPoints', clusterer.getTotalMarkers());
                                $plottedQuery.data('macluster_markerGroup', []);
                            }
                        }

                        $plottedQuery.data('numMarkers', ($plottedQuery.data('numMarkers') || 0) + 1);
                        $plottedQuery.data('numFailedGeocodes', ($plottedQuery.data('numFailedGeocodes') || 1) - 1);
                        MAPlotting.updateQueryInfo($plottedQuery);
                        MA.off('nextclick');



                        //loop over bad addreses and remove
                        var badAddressData = queryData.badAddressArray;
                        var addressCount = badAddressData.length;
                        while (addressCount--) {
                            var badRecord = badAddressData[addressCount];
                            if (badRecord.Id == options.recordId) {
                                badAddressData.splice(addressCount, 1);
                                break;
                            }
                        }
                        var updateData = [{ field: queryData.addressFields.latitude, newValue: e.latLng.lat() }, { field: queryData.addressFields.longitude, newValue: e.latLng.lng() }];

                        var processData = {
                            ajaxResource: 'MATooltipAJAXResources',
                            action: 'updateRecordFields',
                            baseObjectId: queryData.options.baseObjectId || '',
                            recordId: options.recordId,
                            updateData: JSON.stringify(updateData)
                        };

                        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                            processData,
                            function (response, event) {
                                //nothing to do
                            }, { buffer: false, escape: true, timeout: 120000 }
                        );
                    });
                });

            }, { message: $statusMessage });

        }
        MA.Popup.closeMAPopup();

    },

    showBadGeocodes: function (qid) {
        /*
         * remove!
         * $('#PlottedQueriesContainer').on('click', '.PlottedRowUnit .plottinginfo-wrapper .link.geocode', function () {});
         */
        var $plottedQuery = $('#PlottedQueriesTable .PlottedRowUnit[qid="' + qid + '"]');
        var queryData = $plottedQuery.data();

        var html = '<div class="missingAddressWrapper"><table style="width: 100%;">';

        //loop over queries bad addresses
        var badAddresses = queryData.badAddressArray || [];
        var badAddressData = {};
        var tpMetaData = queryData.tooltips;
        var recordInfo = {};
        for (var b = 0, len = badAddresses.length; b < len; b++) {
            var record = badAddresses[b];
            var tooltip1 = formatTooltip(record, queryData.tooltips[0], true) || 'N/A';
            var formattedAddress = MAPlotting.getFormattedAddress(record, queryData) || '';
            html += '<tr class="missingAddress" data-id="' + record.Id + '">' +
                '<td><input type="checkbox" class="missingaddress-checkbox" /> <a target="_blank" href="/' + record.Id + '">' + htmlEncode(tooltip1) + '</a></td></td>' +
                '<td>' + htmlEncode(formattedAddress) + '</td>' +
                '<td class="MAbutton button-clear button-small button-blue" onclick="MAPlotting.MissingAddress_DropPin(this,{qid:\'' + queryData.qid + '\',recordId:\'' + record.Id + '\'})">Drop Pin</td>' +
                '</tr>';
            recordInfo[record.Id] = record;
            badAddressData[record.Id] = {
                recordId: record.Id,
                objectType: queryData.options.baseObjectLabel,
                savedQueryName: queryData.savedQueryName,
                tooltip1Label: tpMetaData[0] ? tpMetaData[0].FieldLabel : '',
                tooltip1Value: tooltip1 || '',
                street: getProperty(record, queryData.addressFields.street) || '',
                city: getProperty(record, queryData.addressFields.city) || '',
                state: getProperty(record, queryData.addressFields.state) || '',
                zip: getProperty(record, queryData.addressFields.zip) || '',
                country: getProperty(record, queryData.addressFields.country) || ''
            }
        }

        html += '</table></div>';

        var badAddressPopup = MA.Popup.showMAPopup({
            template: html,
            width: 700,
            popupId: 'badAddressPopup',
            title: 'Saved Layer Name: ' + queryData.savedQueryName,
            subTitle: queryData.numFailedGeocodes + ' Bad Addresses',
            buttons: [
                {
                    text: 'Close',
                    type: 'slds-button_neutral'
                    //no onTap or onclick just closes the popup
                },
                // {
                //     text: '<b>Export All</b>',
                //     type: 'button-blue',
                //     onTap : function() {
                //         MAPlotting.exportBadAddresses(badAddressData, true, 'xls')
                //     }
                // },
                // {
                //     text: '<b>Export Selected</b>',
                //     type: 'button-blue',
                //     onTap : function() {
                //         MAPlotting.exportBadAddresses(badAddressData, false, 'xls')
                //     }
                // },
                // {
                //     text: '<b>Export All (CSV)</b>',
                //     type: 'button-blue',
                //     onTap : function() {
                //         MAPlotting.exportBadAddresses(badAddressData, true, 'csv')
                //     }
                // },
                // {
                //     text: '<b>Export Selected (CSV)</b>',
                //     type: 'button-blue',
                //     onTap : function() {
                //         MAPlotting.exportBadAddresses(badAddressData, false, 'csv')
                //     }
                // }
                {
                    text: '<b>Export All</b>',
                    type: 'slds-button_brand',
                    buttonType: 'dropdown',
                    buttonOptions: [
                        {
                            text: 'As Excel File',
                            onTap: function () {
                                MAPlotting.exportBadAddresses(badAddressData, true, 'xls')
                            }
                        },
                        {
                            text: 'As CSV File',
                            onTap: function () {
                                MAPlotting.exportBadAddresses(badAddressData, true, 'csv')
                            }
                        }
                    ]
                },
                {
                    text: '<b>Export Selected</b>',
                    type: 'slds-button_brand',
                    buttonType: 'dropdown',
                    buttonOptions: [
                        {
                            text: 'As Excel File',
                            onTap: function () {
                                MAPlotting.exportBadAddresses(badAddressData, false, 'xls')
                            }
                        },
                        {
                            text: 'As CSV File',
                            onTap: function () {
                                MAPlotting.exportBadAddresses(badAddressData, false, 'csv')
                            }
                        }
                    ]
                }
            ]
        });

        $('#badAddressPopup').data('recordInfo', recordInfo);

    },

    // exportBadAddresses : function (badAddressData,exportAll) {
    //     MAPlotting.exportBadAddressesAs(badAddressData, true, 'xls');
    // },

    exportBadAddresses: function (badAddressData, exportAll, exportType) {
        var popup = $('#badAddressPopup');
        // var $addressesToExport = exportAll
        //     ? $('#badAddressPopup .missingAddress')
        //     : $('#badAddressPopup .missingaddress-checkbox:checked').closest('.missingAddress');
        var $addressesToExport = exportAll
            ? $('.missingAddress')
            : $('.missingaddress-checkbox:checked').closest('.missingAddress');

        exportType = exportType != undefined ? exportType : 'xls';

        var missingAddresses = [];
        var uniqueMissingAddressesMap = {};
        $addressesToExport.each(function () {
            var $row = $(this);
            var recordId = $row.attr('data-id');
            var recordData = badAddressData[recordId];

            //make sure we haven't already added this record
            if (uniqueMissingAddressesMap[recordData.recordId]) { return; }

            //add this record
            uniqueMissingAddressesMap[recordData.recordId] = true;
            missingAddresses.push(recordData);
        });

        //this will break with any string/file of substantial size.
        $("<form method='POST' action='" + MA.resources.MissingAddressExport + "' target='_blank'></form>"
        ).append(
            $("<input type='hidden' name='serializedMissingAddresses' />").attr('value', JSON.stringify(missingAddresses))
        ).append(
            $("<input type='hidden' name='type' />").attr('value', exportType)
        ).appendTo('body').submit().remove();

        //make an ajax call to push the IDs to the exports
        //when the callback happens, do a window.open with a '_blank' to the correct export ID
    },

    removeQuery: function ($plottedQuery) {
        var dfd = $.Deferred();
        var queryMetaData = $plottedQuery.data();
        var layerType = queryMetaData.layerType;

        //show loading icon
        $plottedQuery.find('.queryIcon').hide();
        $plottedQuery.find('.queryLoader, .loading-icon').show();
        $plottedQuery.find('.queryError').hide();
        MA.Map.InfoBubble.hide();

        // if a timeout is present, clear it
        clearTimeout(queryMetaData.refreshTimeout);
        queryMetaData.refreshTimeout = null;

        if (MA.getProperty(queryMetaData, ['queryRecord', 'RefreshInterval__c'])) {
            queryMetaData.queryRecord.RefreshInterval__c = null;
        }

        //kill any geocoding processess
        if ($plottedQuery.data('geoQueue')) {
            $plottedQuery.data('geoQueue').kill();
        }

        var qid = $plottedQuery.attr('qid');
        delete MAPlotting.plottedUniqueIds[qid];
        var savedQueryId = $plottedQuery.attr('savedQueryId') || '';
        delete MAPlotting.plottedIds[savedQueryId];

        //unrender the plotted modes
        var renderModes = [];
        var activeModes = $plottedQuery.find('.renderButtons .item-selectable .on');
        for (var a = 0; a < activeModes.length; a++) {
            var mode = activeModes[a].getAttribute('data-renderAs');
            renderModes.push(mode);
        }
        MAPlotting.unrenderQuery($plottedQuery, { modes: renderModes, clearData: true }, function () {
            //remove plotted query
            try { $plottedQuery.data('distanceLimitCircle').setMap(null); } catch (err) { }

            if (!MA.isMobile) {
                MAListView.FixListViewTab();
            }
            //if there are no more queries, clear spiderfy
            setTimeout(function () {
                if ($('#PlottedQueriesTable .PlottedRowUnit').length == 0) {
                    MA.Map.spiderfier.clearMarkers();
                }
            }, 2000);

            if ($('#PlottedQueriesTable .PlottedRowUnit.visibleOnly').length == 0) {
                $('#visibleAreaRefeshMap').addClass('ready').removeClass('visible');
            }
            // desktop listview breaks if included (cleaning up on mobile)
            if (MA.isMobile) {
                var dataKeys = Object.keys(queryMetaData);
                for (var i = 0; i < dataKeys.length; i++) {
                    var attr = dataKeys[i];
                    $plottedQuery.removeData(attr);
                    $plottedQuery.removeAttr(attr);
                }
            }
            dfd.resolve();
        });
        return dfd.promise();
    },

    shapeContainsMarker: function (marker, options) {
        options = $.extend({
            enableProxLimit: false,
            queryProximityEnabled: false,
            queryProximityHideMarkers: false,
            proximityCircle: null
        }, options || {});
        var invertProximity = getProperty(userSettings || {}, 'InvertProximity', false) || false;
        var shapeTest = MA.Map.hitTestShapeMgr.hasShapes();

        if (shapeTest) { //do we have a shape to test against
            //loop through all prox objects to see if this marker falls inside or outside
            var isInsideProxObject = MA.Map.hitTestShapeMgr.containsLatLng(marker.getPosition());

            //determine if we should continue based on whether or not prox visibility has been inverted or this query has prox enabled
            if (((invertProximity && isInsideProxObject) || (!invertProximity && !isInsideProxObject)) && !options.queryProximityEnabled) {
                //we should not plot this marker so continue to the next one
                return false;
            }
        }
        //check if we have an address limited query to test against
        if (options.enableProxLimit) {
            if (options.proximityCircle && !options.proximityCircle.contains(marker.getPosition())) {
                return false;
            }
        }

        return true;
    },

    processAutomaticAssign: function ($plottedQuery, options, callback) {
        options = $.extend({
            modes: [],
            records: [],
            automaticAssign: false
        }, options || {});
        callback = callback || function () { };
        var queryMetaData = $plottedQuery.data();
        var automaticAssign = options.automaticAssign;
        var MAIO_URL = getProperty(MASystem, 'Organization.MAIO_URL', false) || 'https://api.mapanything.io';
        var processData = {
            records: options.records,
            queryRecord: queryMetaData.queryRecord,
            addressFields: queryMetaData.addressFields,
            isIE: MA.Util.isIE(),
            MAIO_URL: MAIO_URL,
            recordList: queryMetaData.recordList,
            tooltips: queryMetaData.tooltips,
            imgLoaderDimensions: imgLoaderDimensions,
            ImageServerEnabled: MASystem.Organization.ImageServerEnabled
        }
        processRecords(processData, function (res) {
            if (res.success) {
                var records = res.records;
                var autoAssignMap = res.autoAssignMap;
                var advancedOptions = queryMetaData.queryRecord.AdvancedOptions__c || {};
                var thresholdPercent = +advancedOptions.otherthreshold || 10;
                var cutOffValue = records.length * (thresholdPercent / 100);
                //loop over and determine if threshold matches, otherwise other bucket
                var isIE = MA.Util.isIE();
                for (var key in autoAssignMap) {
                    if (key == 'OtherInfo') {
                        continue;
                    }
                    var legendInfo = autoAssignMap[key];
                    var colorCheck = getProperty(legendInfo, 'markerValue') || '';
                    colorCheck = colorCheck.split(':')[1] || 'Marker';
                    colorCheck = MAMarkerBuilder.shapes[colorCheck];
                    if (legendInfo.count < cutOffValue) {
                        //place all values as other;
                        for (var c = 0, len = legendInfo.recordIndexes.length; c < len; c++) {
                            var recordIndex = legendInfo.recordIndexes[c];
                            //update the reocrd to other
                            var updateRecord = records[recordIndex];
                            updateRecord.legendId = autoAssignMap.OtherInfo.legendId;
                            updateRecord.markerValue = autoAssignMap.OtherInfo.markerValue;

                            updateRecord.markerInfo.icon = {
                                url: autoAssignMap.OtherInfo.markerImgUrl,
                                anchor: autoAssignMap.OtherInfo.markerAnchor,
                                scaledSize: autoAssignMap.OtherInfo.scaledmarkerSize,
                                size: autoAssignMap.OtherInfo.markerSize
                            };
                            updateRecord.markerInfo.optimized = false;
                            updateRecord.scatterMarkerInfo.icon = {
                                url: autoAssignMap.OtherInfo.scatterMarkerURL,
                                anchor: autoAssignMap.OtherInfo.scatterMarkerAnchor
                            }
                        }
                    }
                    else {
                        //make a legend row
                        var legendCheckboxId = 'legend-checkbox' + MA.componentIndex++;
                        var colorParts = legendInfo.markerValue.split(':');
                        var iconPart = colorParts[1] || 'Circle';
                        var iconColor = colorParts[0] || '3083d3';
                        iconColor = iconColor.replace(/#/g, '');
                        var imageURL = MAIO_URL + '/services/images/marker?color=' + iconColor + '&forlegend=false&icon=' + iconPart;
                        var staticImage = '<img style="height:20px" class="legend-image" src="' + imageURL + '" />';
                        // var staticImage = MAMarkerBuilder.createSVG({ color: legendInfo.markerValue, forLegend: true });
                        var legendHTML = "<tr data-id='" + legendInfo.legendId + "' class='legend-row empty auto-row' style='display:none;'><td class='legend-checkbox-wrapper'><input type='checkbox' class='legend-checkbox' checked='checked' id='" + legendCheckboxId + "' data-rule='" + legendInfo.legendId + "' /><label for='" + legendCheckboxId + "'></label></td><td class='legend-text'>" + htmlEncode(legendInfo.legendValue) + "</td><td class='visiblemarkers'>0</td><td class='of'>of</td><td class='totalmarkers'>0</td><td class='legend-color'>" + staticImage + "</td></tr>";

                        $plottedQuery.find('.legend .legend-row:last').before(legendHTML);

                        queryMetaData.legendInfo[legendInfo.legendId] = {
                            count: 0,
                            label: legendInfo.legendValue,
                            legendId: legendInfo.legendId,
                            markerValue: legendInfo.markerValue,
                            icon: imageURL,
                            isOther: false,
                            active: true,
                            isAuto: true
                        };
                    }
                }

                if (MA.isMobile) {
                    //rebuild the legend html
                    try {
                        var savedQueryId = queryMetaData.savedQueryId || '';
                        if (MAPlotting.plottedIds.hasOwnProperty(savedQueryId)) {
                            //update the saved html
                            var plottedInfo = MAPlotting.plottedIds[savedQueryId];
                            var legendData = getProperty(plottedInfo, 'legendInfo');
                            if (legendData) {
                                legendData.legendHTML = MAPlotting.mobile.rebuildLegendFromObj(queryMetaData.legendInfo);
                            }
                        }

                        //update the legend
                        if (!$('#layersIndividualWrap').hasClass('nest-out')) {
                            MAPlotting.mobile.rebuildSigleView({ id: savedQueryId });
                        }
                    }
                    catch (e) { }
                }

                MAPlotting.processWorkerRecords($plottedQuery, { modes: options.modes, records: records }, function () {
                    callback({ success: true });
                });
            }
        });
    },

    processWorkerRecords: function ($plottedQuery, options, callback, routingData) {
        this.routingData = routingData;
        options = $.extend({
            modes: [],
            records: [],
            automaticAssign: false,
            isMapIt: false,
            forceWaypoints: false
        }, options || {});
        callback = callback || function () { };

        var queryData = routingData || $plottedQuery.data();

        if (options.automaticAssign) {
            MAPlotting.processAutomaticAssign($plottedQuery, options, function () {
                callback({ success: true });
            });
        }
        else {
            var renderMarkers = false;
            var renderCluster = false;
            var renderScatter = false;
            var renderHeatmap = false;

            for (var i = 0, len = options.modes.length; i < len; i++) {
                var mode = options.modes[i];
                if (mode == 'Markers') {
                    renderMarkers = true;
                }
                else if (mode == 'Cluster') {
                    renderCluster = true;
                }

                else if (mode == 'Scatter') {
                    renderScatter = true;
                }
                else if (mode == 'Heatmap') {
                    renderHeatmap = true;
                }

                if (!routingData) {
                    $plottedQuery.find('.renderButtons-button[data-renderAs="' + mode + '"]').addClass('on');
                    $plottedQuery.find('.renderButtons-button[data-renderAs="' + mode + '"]').closest('li').addClass('active').removeClass('sudo-active');
                }
            }

            var recordsObj = queryData.records;
            var queryRecord = queryData.queryRecord || {};
            var queryType = queryData.layerType || getProperty(queryRecord, 'BaseObject__r.Type__c') || 'Marker';

            var invertProximity = getProperty(userSettings || {}, 'InvertProximity', false) || false;
            var proximityOptions = queryData.proximityOptions || {};
            //We need to check and see if they are using mapit. If so we need to make sure that the layers proximity options are taken in to account.
            if (queryData.mapItOptions) {
                proximityOptions.radius = getProperty(queryData, 'mapItOptions.radius', false);
                var measurementType = getProperty(queryData, 'mapItOptions.unit', false) || 'MILES';
                proximityOptions.measurementType = measurementType.toUpperCase();
            }
            var queryProximityEnabled = (proximityOptions && proximityOptions.enabled) == 'true' ? true : false;
            var queryProximityHideMarkers = queryProximityEnabled && proximityOptions.hideMarkers == 'true' ? true : false;
            var shapeTest = MA.Map.hitTestShapeMgr.hasShapes();
            var proximityObjects = queryData.proximityObjects;

            //check if proximity (address) limited query
            var advancedOptions = queryData.advancedOptions || {};
            var enableProxLimit = advancedOptions.enableProxLimit == 'true' && !/live/i.test(queryType) ? true : false;
            var proximityCircle = queryData.distanceLimitCircle;

            var shapeTestingOptions = {
                enableProxLimit: enableProxLimit,
                queryProximityEnabled: queryProximityEnabled,
                queryProximityHideMarkers: queryProximityHideMarkers,
                proximityCircle: proximityCircle
            };

            //build a list of heatmap data points and add it
            var heatMapDataPoints = queryData.heatMapDataPoints || [];
            // var heatMapDataPoints = $plottedQuery.data('heatMapDataPoints') || [];

            var LowestHeatMapWeightedValue = 9999999999;
            var HighestHeatMapWeightedValue = -9999999999;
            //queryData.recordList = [];
            //non-blocking loop test
            var markerProcessingBatchSize = shapeTest
                ? MA.Util.isIE()
                    ? 20
                    : 250
                : MA.Util.isIE() ? 100 : 500;
            var markerProcessingTimeout = 1;
            var len = options.records.length;
            var recordCount = 0;

            if (!routingData) {
                $plottedQuery.find('.status').text("Rendering: 0 " + MASystem.Labels.MA_of + " " + len);
            }

            var deviceVendorFieldName, deviceReportDateAndTimeCriteria, deviceIdFieldName, deviceMap;

            if (/live/ig.test(queryType)) {
                markerProcessingBatchSize = 100;
                try {
                    var deviceReportDateAndTimeCriteriaObj = MAPlotting.getLiveDeviceReportDateAndTimeCriteria($plottedQuery);
                    deviceReportDateAndTimeCriteria = deviceReportDateAndTimeCriteriaObj.criteria;
                    deviceIdFieldName = String(getProperty(queryData, 'deviceFields.deviceId')).replace(MA.Namespace + '__', '');
                    deviceMap = queryData.deviceMap;
                    deviceVendorFieldName = String(getProperty(queryData, 'deviceFields.deviceVendor', false)).replace(MA.Namespace + '__', '');

                    // disable query proximity options
                    shapeTestingOptions.queryProximityEnabled = false;
                } catch (e) { console.warn(e); }
            }
            /********************************
             * End Live Variables
            ********************************/

            var totalMarkersPlotted = queryData.totalMarkersPlotted || 0;
            var totalClusterPlotted = queryData.totalClusterPlotted || 0;
            var totalScatterPlotted = queryData.totalScatterPlotted || 0;
            while (options.records.length > 0) {
                var recordsProcessed = 0;
                while (recordsProcessed < markerProcessingBatchSize && options.records.length > 0) {

                    recordsProcessed++;
                    recordCount++
                    var record = options.records.shift();
                    record.plottedQuery = $plottedQuery;

                    // BK
                    var priorityField = queryData.options.priorityField || '';
                    if (priorityField.indexOf('sma__') === 0) {
                        priorityField = priorityField.substring(5);
                    }

                    record.prioritySettings = {
                        field: queryData.options.priorityField,
                        type: queryData.options.priorityType,
                        label: queryData.options.priorityLabel,
                        sfdcFieldType: queryData.options.priorityFieldType,
                        sfdcFieldValue: getProperty(record, priorityField, false) || 0
                    };

                    if (/live/i.test(queryType)) {
                        // get real device Id by combining vendor and esn field if a vendor is available
                        try {
                            // get current record's device Id and vendor string values
                            var deviceId = MA.getProperty(record, deviceIdFieldName.trim().split('.'));
                            var deviceVendor = MA.getProperty(record, deviceVendorFieldName.trim().split('.'));

                            // reset realdeviceId
                            var realDeviceId = null;

                            // build current record's realdeviceId by combining the deviceId and deviceVendor
                            if (deviceId) { // if device Id is not blank
                                realDeviceId = deviceVendor ? (deviceVendor.trim().replace(/(\s|\n)/ig, '').toLowerCase() + '-' + deviceId.trim()) : deviceId.trim();
                            }

                            // retreive current record's device from deviceMap using reladeviceId
                            var device = MA.getProperty(deviceMap, [realDeviceId, 'device']);

                            if (device && device.successful()) // device info was successfully retreived from live gateway
                            {
                                var deviceLocation = device.getPosition(); // get device location

                                if (deviceLocation) // device has a valid location
                                {
                                    // set record location as device location
                                    record.location.coordinates.lat = deviceLocation.lat;
                                    record.location.coordinates.lng = deviceLocation.lng;

                                    // assign device to current record
                                    record.device = device;

                                    // update current record's live info
                                    record.isLiveRecord = true;
                                }
                            }
                            else {
                                // this is the first plotting round and the device was not successful or we don't have it for some reason
                                delete (deviceMap || {})[realDeviceId]; // delete the deviceId from the devicemap so we don't try to query for it later
                            }
                        }
                        catch (e) {
                            console.warn(e);
                        }

                    }

                    var coordLat = parseFloat(getProperty(record, 'location.coordinates.lat', false));
                    var coordLng = parseFloat(getProperty(record, 'location.coordinates.lng', false));

                    if (isNum(coordLat) && isNum(coordLng)) {
                        //create markers
                        record = MAPlotting.createMarkerFromRecordWithWorker.call(this, record);
                        recordsObj[record.Id] = record;

                        //check shape info for rendering
                        var renderMarkerBasedOnShapes = MAPlotting.shapeContainsMarker(record.marker, shapeTestingOptions);

                        if (record.marker && renderMarkers) {
                            if (!renderMarkerBasedOnShapes) {
                                //if this is a address limited query and marker is outside prox, delete it and record.
                                if (enableProxLimit) {
                                    record.isVisible = false;
                                    delete record.marker;
                                    record.isScattered = false;
                                    delete record.scatterMarker;
                                    record.isClustered = false;
                                    delete record.clusterMarker;
                                }
                                continue;
                            }

                            //we are not force hiding markers, so show
                            if (!queryProximityHideMarkers) {
                                record.isVisible = true;
                                totalMarkersPlotted++;
                                record.listViewVisible = true;
                                record.marker.isMarker = true;
                                // record.marker.setMap(MA.map);
                                MA.Map.spiderfier.addMarker(record.marker);
                                $plottedQuery.data('macluster_markerGroup').push(record.marker);
                            }

                            //do we need to draw circles around the markers?
                            if (proximityOptions.enabled == 'true' && !options.forceWaypoints) {
                                try {
                                    if (proximityOptions.selectType == 'circle') {
                                        var newCircle = new google.maps.Circle({
                                            map: MA.map,
                                            center: record.marker.getPosition(),
                                            radius: proximityOptions.radius * unitFactors[proximityOptions.measurementType]['METERS'],
                                            layerType: 'prox',
                                            strokeColor: proximityOptions.border,
                                            strokeWeight: 3,
                                            strokeOpacity: 1,
                                            fillColor: proximityOptions.fill,
                                            fillOpacity: proximityOptions.opacity,
                                            maData: { marker: record.marker }
                                        });

                                        proximityObjects.push(newCircle);

                                        //keep track of this circle so it can be toggled with the marker
                                        record.marker.maData = $.extend(record.marker.maData || {}, { proximityCircle: newCircle });

                                        //handle clicking on the circle
                                        google.maps.event.addListener(newCircle, 'click', function (e) {
                                            //proximityLayer_Click({ position: e.latLng, type: 'shape', shape: newCircle });
                                            proximityLayer_Click({ position: e.latLng, type: 'shape', shape: this });
                                        });
                                        google.maps.event.addListener(newCircle, 'rightclick', function (e) {
                                            Shape_Context.call(this, e);
                                        });
                                    }
                                }
                                catch (err) { }
                            }
                        }
                        if (record.scatterMarker && renderScatter) {
                            var renderScatterMarkerBasedOnShapes = MAPlotting.shapeContainsMarker(record.scatterMarker, shapeTestingOptions);

                            if (!renderScatterMarkerBasedOnShapes) {
                                if (enableProxLimit) {
                                    record.isVisible = false;
                                    delete record.marker;
                                    record.isScattered = false;
                                    delete record.scatterMarker;
                                    record.isClustered = false;
                                    delete record.clusterMarker;
                                }
                                continue;
                            }
                            totalScatterPlotted++;
                            record.isScattered = true;
                            record.listViewVisible = true;
                            // record.scatterMarker.setMap(MA.map);
                            $plottedQuery.data('macluster_scatterGroup').push(record.scatterMarker);
                        }
                        //done creating markers for each type, now determine if we should show it
                        if (record.clusterMarker && renderCluster) { //we have a marker
                            var renderClusterMarkerBasedOnShapes = MAPlotting.shapeContainsMarker(record.clusterMarker, shapeTestingOptions);

                            if (!renderClusterMarkerBasedOnShapes) {
                                if (enableProxLimit) {
                                    record.isVisible = false;
                                    delete record.marker;
                                    record.isScattered = false;
                                    delete record.scatterMarker;
                                    record.isClustered = false;
                                    delete record.clusterMarker;
                                }
                                continue;
                            }
                            totalClusterPlotted++;
                            //we are not force hiding markers, so show
                            record.isClustered = true;
                            record.listViewVisible = true;
                            record.clusterMarker.isClustered = true;
                            MA.Map.spiderfier.addMarker(record.clusterMarker);
                            $plottedQuery.data('macluster_clusterGroup').push(record.clusterMarker);
                        }

                        if (renderHeatmap) {
                            if (advancedOptions.heatmapWeightedValue && advancedOptions.heatmapWeightedValue != 'None') {
                                if (record[advancedOptions.heatmapWeightedValue]) {
                                    if (MA.Util.testLatLng(record.location.coordinates.lat, record.location.coordinates.lng)) {
                                        //var OldValue = parseFloat(record.record[heatmapWeightedValue]);

                                        var value = parseFloat(record[advancedOptions.heatmapWeightedValue]);

                                        if (value > HighestHeatMapWeightedValue) {
                                            HighestHeatMapWeightedValue = value;
                                        }

                                        if (value < LowestHeatMapWeightedValue) {
                                            LowestHeatMapWeightedValue = value;
                                        }

                                        heatMapDataPoints.push({
                                            'location': new google.maps.LatLng(record.location.coordinates.lat, record.location.coordinates.lng),
                                            'weight': parseFloat(record[advancedOptions.heatmapWeightedValue])
                                        });


                                    }
                                }
                            }
                            else {
                                if (MA.Util.testLatLng(record.location.coordinates.lat, record.location.coordinates.lng)) {
                                    heatMapDataPoints.push(new google.maps.LatLng(record.location.coordinates.lat, record.location.coordinates.lng));
                                }
                            }
                        }

                        if (queryData.options.isMapIt && !options.forceWaypoints) {
                            //this is map it, check for prox
                            var mapItOptions = getProperty(queryData, 'mapItOptions') || {};

                                //MA.map.zoom = parseInt(mapItOptions.mapItZoom);
                            if (mapItOptions.radius && mapItOptions.radius != 'false') {
                                //override the checkbox on the page
                                //update the unit
                                var proxUnit = mapItOptions.unit || 'MILES';
                                proxUnit = proxUnit.toUpperCase();
                                proxUnit = proxUnit == 'KILOMETERS' ? 'KM' : proxUnit;
                                var proxRadius = parseFloat(mapItOptions.radius);
                                //var proxRadius2 = +mapItOptions.radius;
                                if (unitFactors[proxUnit]) {
                                    proxRadius = proxRadius * unitFactors[proxUnit]['METERS'];
                                }
                                //this is a map it query and we need to put a prox circle on the marker
                                try {
                                    addProximityLayer({
                                        proximityType: 'Circle',
                                        radius: proxRadius,
                                        latitude: record.location.coordinates.lat,
                                        longitude: record.location.coordinates.lng,
                                        record: record,
                                        affectVisible: mapItOptions.affectVisible,
                                        success: function (res) {
                                            //ZoomToFit();  //this is now handled by the ma options handlers


                                            if (mapItOptions.affectVisible) {
                                                ChangeVisibilityWhenCircleIsAdded();
                                            }
                                            if (res.layer) {
                                                //the addProximityLayer has a callback and a return
                                                //added the layer in the callback to emulate the return
                                                //case 00012068
                                                res.layer.find('.js-radiusDistance').val(+mapItOptions.radius || '');
                                                res.layer.find('.js-radiusUnit').val(proxUnit);
                                            }
                                        }
                                    }).then(function ($proxLayer) {
                                        // not needed at moment
                                    });

                                    //update the select fields with proper settings, case 00012068
                                                                        }
                                catch (err) {
                                }
                            }
                            //else if ($('.mapit-proximity-on').is(':checked'))
                            else if (mapItOptions.proximityOn) {
                                //this is a map it query and we need to put a prox circle on the marker

                                try {
                                    addProximityLayer({
                                        proximityType: 'Circle',
                                        latitude: record.location.coordinates.lat,
                                        longitude: record.location.coordinates.lng,
                                        record: record,
                                        success: function () {
                                            //ZoomToFit();  //this is now handled by the ma options handlers
                                            ChangeVisibilityWhenCircleIsAdded();
                                        }
                                    });
                                }
                                catch (err) {
                                    MA.log(err);
                                }
                            }

                        }

                        // change visibility based on live criteria
                        if (/live/i.test(queryType)) {
                            if (device) {
                                if (Array.isArray(deviceReportDateAndTimeCriteria)) {
                                    if (deviceReportDateAndTimeCriteria.length > 0) {
                                        var liveDeviceCriteriaMet = device.meetsLiveCriteria(deviceReportDateAndTimeCriteria);

                                        if (liveDeviceCriteriaMet === false) {
                                            record.isVisible = liveDeviceCriteriaMet;

                                            if (record.marker) {
                                                record.marker.setVisible(liveDeviceCriteriaMet);
                                            }
                                            queryData['liveCriteriaUnmet'].push(record);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (/live/i.test(queryType)) {
                            // the lat lng value for the device in this Live record was not found.
                            if (Array.isArray(queryData.badLiveRecords)) {
                                queryData.badLiveRecords.push(record);
                            }
                        }
                        else if (/geofence/i.test(queryType)) {
                            // the lat lng value for the device in this Live record was not found.
                            if (Array.isArray(queryData.geofenceRecordsWithoutLocation)) {
                                queryData.geofenceRecordsWithoutLocation.push(record);
                            }
                        }
                    }
                }
                //do next record
                if (!routingData) {
                    $plottedQuery.find('.status').html("Rendering:" + recordCount + " " + MASystem.Labels.MA_of + " " + len);
                }

            }
            if (!routingData) {
                $plottedQuery.data('totalMarkersPlotted', totalMarkersPlotted);
                $plottedQuery.data('totalClusterPlotted', totalClusterPlotted);
                $plottedQuery.data('totalScatterPlotted', totalScatterPlotted);

                //find the total markers plotted
                if (totalMarkersPlotted > 0) {
                    $plottedQuery.data('numRecords', totalMarkersPlotted);
                }
                else if (totalClusterPlotted > 0) {
                    $plottedQuery.data('numRecords', totalClusterPlotted);
                }
                else if (totalScatterPlotted > 0) {
                    $plottedQuery.data('numRecords', totalScatterPlotted);
                }
            }

            if (renderHeatmap && !routingData) {
                $plottedQuery.data('numHeatmapDataPoints', heatMapDataPoints.length);
                $plottedQuery.data('heatMapDataPoints', heatMapDataPoints);
                if ($plottedQuery.data('heatmapLayer')) {
                    $plottedQuery.data('heatmapLayer').setMap(null);
                    $plottedQuery.data('heatmapLayer', null);
                }

                if (advancedOptions.heatmapWeightedValue) {
                    var heatmapOptions = advancedOptions;
                    var heatmapGradient = JSON.parse(advancedOptions.heatmapGradient);
                    heatmapGradient.splice(0, 0, 'rgba(0,0,0,0)');

                    var HeatMapLayervar = new google.maps.visualization.HeatmapLayer({
                        map: MA.map,
                        data: heatMapDataPoints,
                        dissipating: (advancedOptions.heatmapDissipating == 'true') ? true : false,
                        gradient: heatmapGradient,
                        maxIntensity: parseFloat(advancedOptions.heatmapMaxIntensity),
                        radius: parseFloat(advancedOptions.heatmapRadius),
                        opacity: parseFloat(advancedOptions.heatmapOpacity),
                        plottedQuery: $plottedQuery,
                    });

                    //fill out the options in the plotted layer
                    $plottedQuery.find('#heatIntensity').val(parseFloat(advancedOptions.heatmapMaxIntensity));
                    $plottedQuery.find('#heatRadius').val(parseFloat(advancedOptions.heatmapRadius));
                    if (advancedOptions.heatmapDissipating == 'true') {
                        $plottedQuery.find('#heatDissipate').prop('checked', true);
                    }
                    else {
                        $plottedQuery.find('#heatDissipate').prop('checked', false);
                    }
                    $plottedQuery.find('.heatmapOpacity').val(advancedOptions.heatmapOpacity);
                    $plottedQuery.find('.heatmap-opitons').show();


                    $plottedQuery.data('heatmapLayer', HeatMapLayervar);

                    $plottedQuery.data('lowestHeatMapWeightedValue', LowestHeatMapWeightedValue);
                    $plottedQuery.data('highestHeatMapWeightedValue', HighestHeatMapWeightedValue);

                }
                else {
                    $plottedQuery.data('heatmapLayer', new google.maps.visualization.HeatmapLayer({
                        map: MA.map,
                        data: heatMapDataPoints,
                        dissipating: true,
                        radius: 15,
                        opacity: 0.8,
                        maxIntensity: 5,
                        gradient: ['rgba(0,0,0,0)', 'rgb(0,0,255)', 'rgb(0,255,255)', 'rgb(0,255,0)', 'yellow', 'rgb(255,0,0)'],
                        plottedQuery: $plottedQuery,
                    }));

                    //fill out the options in the plotted layer
                    $plottedQuery.find('#heatIntensity').val(parseFloat(advancedOptions.heatmapMaxIntensity));
                    $plottedQuery.find('#heatRadius').val(parseFloat(advancedOptions.heatmapRadius));
                    if (advancedOptions.heatmapDissipating == 'true') {
                        $plottedQuery.find('#heatDissipate').prop('checked', true);
                    }
                    else {
                        $plottedQuery.find('#heatDissipate').prop('checked', false);
                    }
                    $plottedQuery.find('.heatmapOpacity').val(advancedOptions.heatmapOpacity);

                    $plottedQuery.find('.heatmap-opitons').show();
                }
            }
            callback({ success: true });
        }
    },

    updateHeatMapOptions: function (button) {
        var $button = $(button);
        var $plottedQuery = $button.closest('.PlottedRowUnit');
        var shouldSave = $button.hasClass('saveHeatmap');

        //update the heatmap layer
        try {
            //check that radius and intensity are numbers
            if (isNaN($plottedQuery.find('#heatIntensity').val()) || isNaN($plottedQuery.find('#heatRadius').val())) {
                NotifyError('Heatmap Error.', '"Max Intensity" and "Radius" values must be valid numbers.')
                return false;
            }

            //update the plottedQuery with new values
            var queryData = $plottedQuery.data();
            var heatmapOptions = queryData.advancedOptions;
            heatmapOptions.heatmapDissipating = $plottedQuery.find('#heatDissipate').is(':checked') == true ? 'true' : 'false';
            heatmapOptions.heatmapOpacity = $plottedQuery.find('.heatmapOpacity').val();
            heatmapOptions.heatmapRadius = $plottedQuery.find('#heatRadius').val();
            heatmapOptions.heatmapMaxIntensity = $plottedQuery.find('#heatIntensity').val();

            $plottedQuery.data('heatmapLayer').set('maxIntensity', parseFloat(heatmapOptions.heatmapMaxIntensity));
            $plottedQuery.data('heatmapLayer').set('radius', parseFloat(heatmapOptions.heatmapRadius));
            $plottedQuery.data('heatmapLayer').set('opacity', parseFloat(heatmapOptions.heatmapOpacity));
            $plottedQuery.data('heatmapLayer').set('dissipating', $plottedQuery.find('#heatDissipate').is(':checked'));
        }
        catch (e) {
            //do nothing
        }

        try {
            if (shouldSave) {
                //save
                $.ajax({
                    url: "/services/data/v32.0/query?q=SELECT sma__AdvancedOptions__c FROM sma__MASavedQry__c where id='" + queryData.savedQueryId + "'",
                    type: 'GET',
                    dataType: 'JSON',
                    data: {},
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', "OAuth " + MA.SessionId);
                        xhr.setRequestHeader('Accept', "application/json");
                        //usually not needed but when you are
                        xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
                        xhr.setRequestHeader('Access-Control-Allow-Methods', 'GET');
                    },
                    success: function (response) {
                        if (response.records.length > 0) {
                            //parse the response
                            var record = JSON.parse(response.records[0].sma__AdvancedOptions__c);

                            //update the record
                            record.heatmapDissipating = $plottedQuery.find('#heatDissipate').is(':checked') == true ? 'true' : 'false';
                            record.heatmapOpacity = $plottedQuery.find('.heatmapOpacity').val();
                            record.heatmapRadius = $plottedQuery.find('#heatRadius').val();
                            record.heatmapMaxIntensity = $plottedQuery.find('#heatIntensity').val();

                            //stringigy the field data for sForce
                            var data = JSON.stringify(record);

                            //now save the changes to database
                            var patchObj = {
                                "sma__AdvancedOptions__c": data
                            }
                            $.ajax({
                                url: "/services/data/v32.0/sobjects/sma__MASavedQry__c/" + queryData.savedQueryId + "",
                                type: 'PATCH',
                                dataType: 'JSON',
                                contentType: "application/json",
                                data: JSON.stringify(patchObj),
                                beforeSend: function (xhr) {
                                    xhr.setRequestHeader('Authorization', "OAuth " + MA.SessionId);
                                    xhr.setRequestHeader('Accept', "application/json");
                                },
                                success: function (response) {
                                    //nothing to do if successful
                                },
                                error: function (response) {
                                    NotifyError('Save Error', 'The heatmap changes were unable to be permenatly saved for ' + $plottedQuery.data("savedQueryName") + '.');
                                    MA.log(response);
                                }
                            });

                        }
                    },
                    error: function (response) {
                        MA.log('Unable to save heatmap options', response);
                    }
                });
            }
        }
        catch (e) {
            MA.log('Unable to get heatmap options', e)
        }
    },

    renderQueryV2: function ($plottedQuery, renderAs, callback) {
        callback = callback || function () { };

        //create vars to check what is being rendered
        var renderMarkers = false;
        var renderCluster = false;
        var renderScatter = false;
        var renderHeatmap = false;

        for (var i = 0, len = renderAs.length; i < len; i++) {
            var mode = renderAs[i];
            if (mode == 'Markers') {
                renderMarkers = true;
            }
            else if (mode == 'Cluster') {
                renderCluster = true;
            }
            else if (mode == 'Scatter') {
                renderScatter = true;
            }
            else if (mode == 'Heatmap') {
                renderHeatmap = true;
            }
            $plottedQuery.find('.renderButtons-button[data-renderAs="' + mode + '"]').addClass('on');
            $plottedQuery.find('.renderButtons-button[data-renderAs="' + mode + '"]').closest('li').addClass('active').removeClass('sudo-active');
        }
        //get some shape info to test against
        var queryData = $plottedQuery.data() || {};

        //Check if the object is empty
        var checkIfQueryDataIsEmpty = Object.keys(queryData).length === 0 && queryData.constructor === Object;

        //If object is not empty, set isVisble property to true so that markers within shape are the only records visible within the map. Case solve: SFCM - 2522
        if(!checkIfQueryDataIsEmpty) {
            Object.keys(queryData.records).forEach(function(idObj) {
                queryData.records[idObj].isVisible = queryData.records[idObj].marker.isAdded;
            });
        }


        var queryType = getProperty(queryData, 'queryRecord.BaseObject__r.Type__c');
        var invertProximity = getProperty(userSettings || {}, 'InvertProximity', false) || false;
        var proximityOptions = queryData.proximityOptions || {};
        var queryProximityEnabled = (proximityOptions && proximityOptions.enabled) == 'true' ? true : false;
        var queryProximityHideMarkers = queryProximityEnabled && proximityOptions.hideMarkers == 'true' ? true : false;
        var shapeTest = MA.Map.hitTestShapeMgr.hasShapes();
        var proximityObjects = queryData.proximityObjects;

        //check if proximity (address) limited query
        var advancedOptions = queryData.advancedOptions || {};
        var enableProxLimit = advancedOptions.enableProxLimit == 'true' ? true : false;
        var proximityCircle = queryData.distanceLimitCircle;

        var shapeTestingOptions = {
            enableProxLimit: enableProxLimit,
            queryProximityEnabled: queryProximityEnabled,
            queryProximityHideMarkers: queryProximityHideMarkers,
            proximityCircle: proximityCircle
        };

        //heatmap options
        //build a list of heatmap data points and add it
        var heatMapDataPoints = [];

        var LowestHeatMapWeightedValue = 9999999999;
        var HighestHeatMapWeightedValue = -9999999999;


        var records = $plottedQuery.data('records') || {};
        var markerAssignmentType = $plottedQuery.data('markerAssignmentType');

        //check if this has been rendered before otherwise push to create new markers
        //create smaller chunks of records
        var keys = Object.keys(records) || [],
            len = keys.length,
            i = 0,
            prop,
            value;
        var markerProcessingBatchSize = shapeTest
            ? MA.Util.isIE()
                ? 20
                : 250
            : MA.Util.isIE() ? 50 : 500;
        var markerProcessingTimeout = 1;
        $plottedQuery.find('.status').html("Rendering: 0 " + MASystem.Labels.MA_of + " " + len);
        while (i < len) {
            var recordsProcessed = 0;
            while (i < len && recordsProcessed < markerProcessingBatchSize) {
                prop = keys[i];
                record = records[prop];
                i += 1;

                if (!record) {
                    continue;
                }

                //done creating markers for each type, now determine if we should show it
                if (record.marker && renderMarkers) { //we have a marker and need to render
                    //check if this marker should be rendered based on shape criteria
                    var renderMarkerBasedOnShapes = MAPlotting.shapeContainsMarker(record.marker, shapeTestingOptions);

                    if (!renderMarkerBasedOnShapes) {
                        //if this is a address limited query and marker is outside prox, delete it and record.
                        if (enableProxLimit) {
                            record.isVisible = false;
                            delete record.marker;
                            record.isScattered = false;
                            delete record.scatterMarker;
                            record.isClustered = false;
                            delete record.clusterMarker;
                        }
                        continue;
                    }

                    //we are not force hiding markers, so show
                    if (!queryProximityHideMarkers) {
                        record.isVisible = true;
                        record.listViewVisible = true;
                        // record.marker.setMap(MA.map);

                        /**************************************************************
                        * Default marker event listeners
                        **************************************************************/
                        if (!MA.isMobile) {
                            // marker
                            google.maps.event.addListener(record.marker, 'mousedown', function () { $('#mapdiv').contextMenu('hide'); window.ContextMenuClick = {}; });
                            google.maps.event.addListener(record.marker, 'rightclick', function (e) { marker_Context.call(this, e); });

                            // clusterMarker
                            google.maps.event.addListener(record.clusterMarker, 'mousedown', function () { $('#mapdiv').contextMenu('hide'); window.ContextMenuClick = {}; });
                            google.maps.event.addListener(record.clusterMarker, 'rightclick', function (e) { marker_Context.call(this, e); });
                        }
                        /*************************************************************/
                        record.marker.isMarker = true;
                        MA.Map.spiderfier.addMarker(record.marker);
                        $plottedQuery.data('macluster_markerGroup').push(record.marker);
                    }

                    //do we need to draw circles around the markers?
                    if (proximityOptions.enabled == 'true') {
                        try {
                            if (proximityOptions.selectType == 'circle') {
                                var newCircle = new google.maps.Circle({
                                    map: MA.map,
                                    center: record.marker.getPosition(),
                                    radius: proximityOptions.radius * unitFactors[proximityOptions.measurementType]['METERS'],
                                    layerType: 'prox',
                                    strokeColor: proximityOptions.border,
                                    strokeWeight: 3,
                                    strokeOpacity: 1,
                                    fillColor: proximityOptions.fill,
                                    fillOpacity: proximityOptions.opacity,
                                    maData: { marker: record.marker }
                                });

                                proximityObjects.push(newCircle);

                                //keep track of this circle so it can be toggled with the marker
                                record.marker.maData = $.extend(record.marker.maData || {}, { proximityCircle: newCircle });

                                //handle clicking on the circle
                                google.maps.event.addListener(newCircle, 'click', function (e) {
                                    proximityLayer_Click({ position: e.latLng, type: 'shape', shape: newCircle });
                                });
                                google.maps.event.addListener(newCircle, 'rightclick', function (e) {
                                    Shape_Context.call(this, e);
                                });
                            }
                        }
                        catch (err) { }
                    }
                }
                //done creating markers for each type, now determine if we should show it
                if (record.scatterMarker && renderScatter) {
                    var renderScatterMarkerBasedOnShapes = MAPlotting.shapeContainsMarker(record.scatterMarker, shapeTestingOptions);

                    if (!renderScatterMarkerBasedOnShapes) {
                        if (enableProxLimit) {
                            record.isVisible = false;
                            delete record.marker;
                            record.isScattered = false;
                            delete record.scatterMarker;
                            record.isClustered = false;
                            delete record.clusterMarker;
                        }
                        continue;
                    }

                    record.isScattered = true;
                    record.listViewVisible = true;
                    // record.scatterMarker.setMap(MA.map);
                    $plottedQuery.data('macluster_scatterGroup').push(record.scatterMarker);
                    google.maps.event.clearListeners(record.scatterMarker, 'click');
                    google.maps.event.addListener(record.scatterMarker, 'click', function (e) { MAPlotting.marker_Click.call(this); });
                    google.maps.event.addListener(record.scatterMarker, 'rightclick', function (e) { marker_Context.call(this, e) });
                }
                //done creating markers for each type, now determine if we should show it
                if (record.clusterMarker && renderCluster) { //we have a marker
                    var renderClusterMarkerBasedOnShapes = MAPlotting.shapeContainsMarker(record.clusterMarker, shapeTestingOptions);

                    if (!renderClusterMarkerBasedOnShapes) {
                        if (enableProxLimit) {
                            record.isVisible = false;
                            delete record.marker;
                            record.isScattered = false;
                            delete record.scatterMarker;
                            record.isClustered = false;
                            delete record.clusterMarker;
                        }
                        continue;
                    }
                    //we are not force hiding markers, so show
                    record.isClustered = true;
                    record.listViewVisible = true;
                    record.clusterMarker.isClustered = true;
                    MA.Map.spiderfier.addMarker(record.clusterMarker);
                    $plottedQuery.data('macluster_clusterGroup').push(record.clusterMarker);

                }
                if (renderHeatmap) {
                    if (advancedOptions.heatmapWeightedValue && advancedOptions.heatmapWeightedValue != 'None') {
                        if (record[advancedOptions.heatmapWeightedValue]) {
                            if (MA.Util.testLatLng(record.location.coordinates.lat, record.location.coordinates.lng)) {
                                //var OldValue = parseFloat(record.record[heatmapWeightedValue]);

                                var value = parseFloat(record[advancedOptions.heatmapWeightedValue]);

                                if (value > HighestHeatMapWeightedValue) {
                                    HighestHeatMapWeightedValue = value;
                                }

                                if (value < LowestHeatMapWeightedValue) {
                                    LowestHeatMapWeightedValue = value;
                                }

                                heatMapDataPoints.push({
                                    'location': new google.maps.LatLng(record.location.coordinates.lat, record.location.coordinates.lng),
                                    'weight': parseFloat(record[advancedOptions.heatmapWeightedValue])
                                });


                            }
                        }
                    }
                    else {
                        if (MA.Util.testLatLng(record.location.coordinates.lat, record.location.coordinates.lng)) {
                            heatMapDataPoints.push(new google.maps.LatLng(record.location.coordinates.lat, record.location.coordinates.lng));
                        }
                    }
                }
            }
            //continue next batch
            $plottedQuery.find('.status').html("Rendering:" + i + " " + MASystem.Labels.MA_of + " " + len);
        }
        //all markers that need to be rendered have been created, no need to continue
        if (renderCluster) {
            var clusterer = new MarkerClusterer(MA.map, $plottedQuery.data('macluster_clusterGroup').slice(0, MA.limits.maxClusterSize), {
                zoomOnClick: false,
                imagePath: MASystem.Images.clusterFolder,
                savedQueryName: $plottedQuery.data('savedQueryName'),
                qid: $plottedQuery.attr('qid')
            });
            clusterer.qid = $plottedQuery.attr('qid');
            google.maps.event.addListener(clusterer, 'click', cluster_Click);
            google.maps.event.addListener(clusterer, 'rightclick', cluster_context);

            $plottedQuery.data('macluster_cluster', clusterer);
            $plottedQuery.data('numClusterDataPoints', clusterer.getTotalMarkers());
            $plottedQuery.data('macluster_clusterGroup', []);
        }
        if (renderMarkers) {
            var clusterer2 = new MarkerClusterer(MA.map, $plottedQuery.data('macluster_markerGroup'), {
                zoomOnClick: false,
                imagePath: MASystem.Images.clusterFolder,
                savedQueryName: $plottedQuery.data('savedQueryName'),
                qid: $plottedQuery.attr('qid')
            });
            var clusterZoomLevel = getProperty(userSettings || {}, 'ClusterZoomLevel', false) || 13;
            var mobileClusterForce = MA.isMobile ? clusterZoomLevel : 1;
            clusterer2.setMaxZoom(mobileClusterForce);
            clusterer2.qid = $plottedQuery.attr('qid');
            google.maps.event.addListener(clusterer2, 'click', cluster_Click);
            google.maps.event.addListener(clusterer2, 'rightclick', cluster_context);
            $plottedQuery.data('macluster_marker', clusterer2);
            $plottedQuery.data('marker_cluster_dataPoints', clusterer2.getTotalMarkers());
            $plottedQuery.data('macluster_markerGroup', []);
        }
        if (renderScatter) {
            var cluster_scatter = new MarkerClusterer(MA.map, $plottedQuery.data('macluster_scatterGroup'), {
                zoomOnClick: false,
                imagePath: MASystem.Images.clusterFolder,
                savedQueryName: $plottedQuery.data('savedQueryName'),
                qid: $plottedQuery.attr('qid')
            });
            var clusterZoomLevel = getProperty(userSettings || {}, 'ClusterZoomLevel', false) || 13;
            var mobileClusterForce = MA.isMobile ? clusterZoomLevel : 0;
            cluster_scatter.setMaxZoom(mobileClusterForce);
            cluster_scatter.qid = $plottedQuery.attr('qid');
            google.maps.event.addListener(cluster_scatter, 'click', cluster_Click);
            google.maps.event.addListener(cluster_scatter, 'rightclick', cluster_context);
            $plottedQuery.data('macluster_scatter', cluster_scatter);
            // $plottedQuery.data('marker_cluster_dataPoints', cluster_scatter.getTotalMarkers());
            $plottedQuery.data('macluster_scatterGroup', []);
        }
        if (renderHeatmap) {
            $plottedQuery.data('numHeatmapDataPoints', heatMapDataPoints.length);
            if ($plottedQuery.data('heatmapLayer')) {
                $plottedQuery.data('heatmapLayer').setMap(null);
                $plottedQuery.data('heatmapLayer', null);
            }

            //fill out the options in the plotted layer
            $plottedQuery.find('#heatIntensity').val(parseFloat(advancedOptions.heatmapMaxIntensity));
            $plottedQuery.find('#heatRadius').val(parseFloat(advancedOptions.heatmapRadius));
            if (advancedOptions.heatmapDissipating == 'true') {
                $plottedQuery.find('#heatDissipate').prop('checked', true);
            }
            else {
                $plottedQuery.find('#heatDissipate').prop('checked', false);
            }
            $plottedQuery.find('.heatmapOpacity').val(advancedOptions.heatmapOpacity);

            if (advancedOptions.heatmapWeightedValue) {
                var heatmapOptions = advancedOptions;
                var heatmapGradient = JSON.parse(advancedOptions.heatmapGradient);
                heatmapGradient.splice(0, 0, 'rgba(0,0,0,0)');

                var HeatMapLayervar = new google.maps.visualization.HeatmapLayer({
                    map: MA.map,
                    data: heatMapDataPoints,
                    dissipating: (advancedOptions.heatmapDissipating == 'true') ? true : false,
                    gradient: heatmapGradient,
                    maxIntensity: parseFloat(advancedOptions.heatmapMaxIntensity),
                    radius: parseFloat(advancedOptions.heatmapRadius),
                    opacity: parseFloat(advancedOptions.heatmapOpacity),
                    plottedQuery: $plottedQuery,
                });


                $plottedQuery.find('.heatmap-opitons').show();

                $plottedQuery.data('heatmapLayer', HeatMapLayervar);

                $plottedQuery.data('lowestHeatMapWeightedValue', LowestHeatMapWeightedValue);
                $plottedQuery.data('highestHeatMapWeightedValue', HighestHeatMapWeightedValue);

            }
            else {
                $plottedQuery.data('heatmapLayer', new google.maps.visualization.HeatmapLayer({
                    map: MA.map,
                    data: heatMapDataPoints,
                    dissipating: true,
                    radius: 15,
                    opacity: 0.8,
                    maxIntensity: 5,
                    gradient: ['rgba(0,0,0,0)', 'rgb(0,0,255)', 'rgb(0,255,255)', 'rgb(0,255,0)', 'yellow', 'rgb(255,0,0)'],
                    plottedQuery: $plottedQuery,
                }));

                $plottedQuery.find('.heatmap-opitons').show();
            }
        }

        callback({ success: true });
    },

    queryActions: {
        updateVisibleArea: function (checkbox) {
            var checked = $(this).attr('checked') == 'checked' ? true : false;
            if (checked) {
                //plot visible area
                $plottedQuery.data('visibleAreaOnly', true);
            }
            else {
                //plot all
                $plottedQuery.data('visibleAreaOnly', false);
            }
            MAPlotting.refreshQuery($plottedQuery);
        },
        renderSelection: function (element) {            
            var $row = $(element);
            var $plottedQuery = $row.closest('.PlottedRowUnit').addClass('loading');
            //get render mode
            var renderSelection = $row.find('.renderButtons-button').attr('data-renderAs');
            var $renderRows = $plottedQuery.find('.renderButtons-button').closest('.item-selectable');

            //check if markers are visible and if we need to render/unrender
            var markersAreVisible = $plottedQuery.find('#select-hide').is(':checked');
            var renderThisMode = !$row.hasClass('active');


            if (!markersAreVisible && renderThisMode) { //remove placeholders for rerendering and only render this mode
                $renderRows.removeClass('sudo-active');
            }

            if (renderThisMode) {
                //render
                MAPlotting.renderQueryV2($plottedQuery, [renderSelection], function () {
                    $plottedQuery.removeClass('loading');
                    //enable this mode selection in the plottedQuery
                    MAPlotting.updateQueryInfo($plottedQuery);
                });

                if (!MA.isMobile) {
                    MAListView.FixListViewTab();
                }
            }
            else {
                //unrender
                MAPlotting.unrenderQuery($plottedQuery, { modes: [renderSelection] }, function () {
                    $plottedQuery.removeClass('loading');
                    MAPlotting.updateQueryInfo($plottedQuery);
                    $plottedQuery.find('.queryIcon').show();
                    $plottedQuery.find('.queryError').hide();
                    $plottedQuery.find('.queryLoader, .loading-icon').hide();
                });

                if (!MA.isMobile) {
                    MAListView.FixListViewTab();
                }
            }

            //check if any are visible and update icons
            var totalRendered = $plottedQuery.find('.renderButtons-button.on').length;
            if (totalRendered === 0) {
                //change icons and uncheck markers are visible
            }
        },
        showHideMarkers: function (checkbox) {
            var checked;

            if (checkbox !== typeof 'boolean') {
                var $checkbox = $(checkbox);
                checked = $checkbox.prop('checked');
                var $plottedQuery = $checkbox.closest('.PlottedRowUnit');
            } else {
                checked = checkbox;
            }

            if (checked == true) {
                //loop over list and render selections
                var list = $plottedQuery.find('.item-selectable.sudo-active');

                var renderList = [];
                for (var r = 0; r < list.length; r++) {
                    var $row = $(list[r]);
                    var renderAs = $row.find('.renderButtons-button').attr('data-renderAs');
                    renderList.push(renderAs);
                }

                MAPlotting.renderQueryV2($plottedQuery, renderList, function () {
                    MAPlotting.updateQueryInfo($plottedQuery);
                });

                if (!MA.isMobile) {
                    MAListView.FixListViewTab();
                }

            }
            else {

                var list = $plottedQuery.find('.item-selectable.active');

                var renderList = [];
                for (var r = 0; r < list.length; r++) {
                    var $row = $(list[r]);
                    $row.addClass('sudo-active');
                    var renderAs = $row.find('.renderButtons-button').attr('data-renderAs');
                    renderList.push(renderAs);
                }
                //unrender
                MAPlotting.unrenderQuery($plottedQuery, { modes: renderList }, function () {
                    $plottedQuery.removeClass('loading');
                    MAPlotting.updateQueryInfo($plottedQuery);
                    $plottedQuery.find('.queryIcon').show();
                    $plottedQuery.find('.queryError').hide();
                    $plottedQuery.find('.queryLoader, .loading-icon').hide();
                });

                if (!MA.isMobile) {
                    MAListView.FixListViewTab();
                }
            }
        },
        showHideHoverOptions: function (menu, display) {

            var $button = $(menu);
            var $plottedQuery = $button.closest('.PlottedRowUnit');
            var queryMetaData = $($plottedQuery).data();

            if (/live/i.test(queryMetaData.layerType)) {
                // $plottedQuery.find('.renderButtons li a').not('.markers').closest('li').not('.hide-markers').remove();
                $plottedQuery.find('.renderButtons li a').not('.markers').closest('li').not('.hide-markers').hide();
                $plottedQuery.find('.live.live-remove-all-tracking-histories').show();
            }
            else {
                $plottedQuery.find('.live.live-remove-all-tracking-histories').hide();
            }

            if (display == 'show') {
                var menuItemPos = $button.position();
                //get position to show menu
                var topPos = menuItemPos.top + 25; //+25px for button size

                if ($button.is('.query-visibility')) {
                    $plottedQuery.find('.renderButtons').css('top', topPos);
                    $plottedQuery.find('.plotted-visibile-icon, .renderButtons').addClass('active');
                }
                else if ($button.is('.query-options')) {
                    $plottedQuery.find('.query-menu-options').css('top', topPos);
                    $plottedQuery.find('.plotted-menu-icon, .query-menu-options').addClass('active');
                }

                var $menu = $button.find('.drop-down-menu');
                var menuOff = $menu.offset();
                var menuHeight = $menu.height();
                //check the menu height and offset
                var totalMenu = menuOff.top + menuHeight;

                //get the map dimensions
                var $container = $('#mapcontainer');
                var containerOff = $container.offset();
                var containerHeight = $container.height();
                var containerTotal = containerOff.top + containerHeight;

                //appears offscreen
                if (totalMenu >= containerTotal) {
                    //place the menu on the bottom of the container
                    topPos = menuItemPos.top - menuHeight;
                    $menu.css('top', topPos);
                }


            }
            else {
                if (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0)) {
                    $('html').click(function (event) {
                        //check up the tree of the click target to check whether user has clicked outside of menu

                        if ($(event.target).parents('.query-menu-options').length == 0) {
                            $plottedQuery.find('.plotted-visibile-icon, .renderButtons').removeClass('active');
                            $plottedQuery.find('.plotted-menu-icon, .query-menu-options').removeClass('active');

                            //this event listener has done its job so we can unbind it.
                            $(this).unbind(event);
                        }

                    })

                }
                else {
                    $plottedQuery.find('.plotted-visibile-icon, .renderButtons').removeClass('active');
                    $plottedQuery.find('.plotted-menu-icon, .query-menu-options').removeClass('active');
                }

            }
        },

        handleQueryOptions: function (item, action) {
            var $plottedQuery = $(item).closest('.PlottedRowUnit');
            var layerType = $plottedQuery.data('layerType');
            var id = $plottedQuery.attr('data-qid');
            if (action == 'editQuery') {
                if (layerType == 'ArcGISLayer') {
                    MALayers.displayCreateArcGISWebMapLayerPopup({
                        action: 'edit-data-layer',
                        id: id
                    });
                }
                else {
                    launchQueryEditor(MA.resources.QueryBuilder + '?q=' + $plottedQuery.data('savedQueryId') + '&qi=' + $plottedQuery.index());
                }
                return;
            }
            else if (action == 'refreshQuery') {
                if (layerType == 'ArcGISLayer') {
                    var layerId = $plottedQuery.attr('qid');
                    ArcGIS.refreshLayer(layerId);
                }
                else {
                    MAPlotting.refreshQuery($plottedQuery, 0, { force: true });
                }
                return;
            }
            else if (action == 'zoomToFit') {
                if (layerType == 'ArcGISLayer') {
                    ZoomToFit({ arcgisLayers: [$plottedQuery] });
                }
                else {
                    ZoomToFit({ queries: [$plottedQuery] });
                }
                return;
            }
            else if (action == 'live-remove-all-tracking-histories') {
                MAPlotting.removeAllTrackingHistories($plottedQuery);
                return;
            }

        }
    },

    refreshQuery: function ($plottedQuery, refreshTimeoutValue, options) {
        var metaData = $plottedQuery.data();
        options = $.extend({ force: false }, options || {});

        var dfd = jQuery.Deferred();

        if ($plottedQuery.hasClass('error') || $plottedQuery.hasClass('loading')) {
            //callback({success:false});
            dfd.resolve({ success: false });
            return dfd.promise();
        }

        var qid = $plottedQuery.attr('qid');
        delete MAPlotting.plottedUniqueIds[qid];

        //mark the query as loading
        $plottedQuery.addClass('loading');
        $plottedQuery.find('.queryIcon').hide();
        $plottedQuery.find('.queryError').hide();
        $plottedQuery.find('.queryLoader, .loading-icon').show();

        // MAP-7035, reset show all/less toggle
        var $toggleWrap = $plottedQuery.find('.legend-moreless-wrapper');
        $toggleWrap.find('.legend-moreless-checkbox .iconWrapper').removeClass('intermediate').addClass('checked');
        var showMoreText = getProperty(MASystem || {}, 'Labels.MA_Show_All', false) || 'Show All';
        $toggleWrap.find('.legend-moreless-text .moreless-text').text(showMoreText);
        $toggleWrap.find('.legend-moreless-text .MAIcon').removeClass('glyphicon-collapse-up').addClass('glyphicon-collapse-down');

        //grab the modes to render
        var modes = $plottedQuery.find('.renderButtons-button.on');
        var modesToRender = [];
        var updatedRenderMode = metaData.renderMode;
        for (var i = 0, len = modes.length; i < len; i++) {
            var mode = modes[i].getAttribute('data-renderAs');
            modesToRender.push(mode);
        }


        var layerType = getProperty(metaData, 'layerType');
        var deviceMap = $plottedQuery.data('deviceMap');

        //if live just move markers
        if (/live/i.test(layerType) && !options.force) {
            var $loadingMobile;
            if (MA.isMobile) {
                $loadingMobile = MAToastMessages.showLoading({ 'message': 'Refreshing Live Layer', timeOut: 0, extendedTimeOut: 0 });
            }

            MAPlotting.processLiveLayer($plottedQuery, { isRefresh: true }, function (res) {
                if (MA.isMobile) {
                    MAToastMessages.hideMessage($loadingMobile);
                }
                if (res.success) {
                    $plottedQuery.removeClass('loading');
                    // $plottedQuery.removeClass('error');
                    $plottedQuery.find('.queryError').hide();
                    $plottedQuery.find('.queryLoader, .loading-icon').hide();
                    $plottedQuery.find('.queryIcon').show();

                    //clear the previous timeout if this is called to soon
                    if (metaData.refreshTimeout) {
                        clearTimeout(metaData.refreshTimeout);
                    }

                    var refreshInterval = MA.getProperty(metaData, ['queryRecord', 'RefreshInterval__c']);
                    var shouldRefreshLive = (metaData.refreshTimeout && isNum(metaData.refreshTimeout)) || (refreshInterval && String(refreshInterval).trim());

                    if (shouldRefreshLive) // if query was unrendered, refreshTimeout will have been nullified so we don't need to refreh live layer again
                    {
                        metaData.refreshTimeout = setTimeout(function () {
                            // dfd.resolve({success:true});

                            // refresh the list view for this query
                            if (!MA.isMobile) {
                                if (MAListView.listViewSettings.filters.length > 0) {
                                    MAListView.Search({ layerId: metaData.qid });
                                } else {
                                    MAListView.DrawTab({ layerId: metaData.qid, isSelectedTab: false, isExport: false });
                                }
                            }

                            return MAPlotting.refreshQuery($plottedQuery, refreshTimeoutValue || 30000);

                        }, refreshTimeoutValue);
                    }
                }
                else {
                    dfd.resolve({ success: false });
                }
            });
        }
        else {
            if (metaData.refreshTimeout) {
                clearTimeout(metaData.refreshTimeout);
            }
            // lets unrender everything
            MAPlotting.unrenderQuery($plottedQuery, { modes: modesToRender, isRefresh: true }, function () {
                //everything is unrendered, replot the query
                var plotOptions = {
                    qid: $plottedQuery.data('qid'),
                    id: $plottedQuery.data('savedQueryId'),
                    renderAs: updatedRenderMode ? [updatedRenderMode] : modesToRender,
                    visibleAreaOnly: $plottedQuery.hasClass('visibleOnly'),
                    name: $plottedQuery.data('savedQueryName'),
                    refreshThisQuery: true,
                    modify: $plottedQuery.data('modify') || false,
                    plottedQuery: $plottedQuery,
                    description: $plottedQuery.data('description') || 'N/A',
                    modifiedInfo: $plottedQuery.data('modifiedInfo') || 'N/A',
                    createdInfo: $plottedQuery.data('createdInfo') || 'N/A',
                    baseObjectLabel: $plottedQuery.data('baseObjectLabel') || 'N/A',
                    isLive: $plottedQuery.hasClass('LiveLayer') || false,
                    layerType: $plottedQuery.data('layerType') || 'Marker',
                    type: $plottedQuery.data('type') || 'marker',
                    stayOnMapTab: options.stayOnMapTab || false,
                    disableProximityOverride: $plottedQuery.data('disableProximityOverride') || false
                };
                MAPlotting.analyzeQuery(plotOptions).always(function () {
                    dfd.resolve({ success: true });
                });

            });
        }

        return dfd.promise();
    },

    unrenderQuery: function ($plottedQuery, options, callback) {
        options = $.extend({
            modes: ['Markers', 'Cluster', 'Scatter', 'Heatmap'],
            isRefresh: false,
            clearData: false,
            keepRelatedShapes: false
        }, options || {});
        callback = callback || function () { };

        if (options.modes.length === 0) {
            callback({ success: false, message: 'No mode was passed to unrender' });
            return;
        }

        MA.Map.InfoBubble.hide();
        MA.Map.spiderfier.unspiderfy();
        var qryData = $plottedQuery.data();
        if (qryData.hasOwnProperty('qid') && !MA.isMobile) {
            MAListView.RemoveTab(qryData.qid);
        }

        $plottedQuery.find('.queryIcon').hide();
        $plottedQuery.find('.queryError').hide();
        $plottedQuery.find('.queryLoader, .loading-icon').show();
        $plottedQuery.find('.info').html('');

        //create vars to check what is being removed
        var unrenderMarkers = false;
        var unrenderCluster = false;
        var unrenderScatter = false;
        var unrenderHeatmap = false;

        for (var i = 0, len = options.modes.length; i < len; i++) {
            var mode = options.modes[i];
            if (mode == 'Markers') {
                unrenderMarkers = true;
            }
            else if (mode == 'Cluster') {
                unrenderCluster = true;
            }
            else if (mode == 'Scatter') {
                unrenderScatter = true;
            }
            else if (mode == 'Heatmap') {
                unrenderHeatmap = true;
            }
            $plottedQuery.find('.renderButtons-button[data-renderAs="' + mode + '"]').removeClass('on');
            $plottedQuery.find('.renderButtons-button[data-renderAs="' + mode + '"]').closest('li').removeClass('active');
        }             

        //do cluster
        if (unrenderCluster) {
            if ($plottedQuery.data('macluster_cluster')) {
                //remove the cluster
                var spiderMarkers = MA.Map.spiderfier.getMarkers();
                for (i = 0; i < spiderMarkers.length; i++) {
                    if (spiderMarkers[i].qid == $plottedQuery.data('qid') && spiderMarkers[i].isClustered) {
                        MA.Map.spiderfier.removeMarker(spiderMarkers[i]);
                    }
                }
                $plottedQuery.data('macluster_cluster').clearMarkers();
                $plottedQuery.removeData('macluster_cluster');
            }
        }
        if (unrenderMarkers) {
            if ($plottedQuery.data('macluster_marker')) {
                //remove the cluster
                var spiderMarkers = MA.Map.spiderfier.getMarkers();
                for (i = 0; i < spiderMarkers.length; i++) {
                    if (spiderMarkers[i].qid == $plottedQuery.data('qid') && spiderMarkers[i].isMarker) {
                        MA.Map.spiderfier.removeMarker(spiderMarkers[i]);
                    }
                }
                $plottedQuery.data('macluster_marker').clearMarkers();
                $plottedQuery.removeData('macluster_marker');
            }
        }
        if (unrenderScatter) {
            if ($plottedQuery.data('macluster_scatter')) {
                //remove the cluster
                $plottedQuery.data('macluster_scatter').clearMarkers();
                $plottedQuery.removeData('macluster_scatter');
            }
        }

        var queryShapes = [];
        if (!options.keepRelatedShapes) {
            queryShapes = $plottedQuery.data('queryShapes') || [];
        }
        var sLen = queryShapes.length;
        var s = 0;

        function doShapeBatch(callback){
            while (s < sLen) {
                var recordsProcessed = 0;
                while (recordsProcessed < 10 && s < sLen) {
                    recordsProcessed++;
    
                    //grab the shape
                    var $shape = queryShapes[s];
                    $shape.find('.btn-remove').click();
    
                    s++;
                }
            }

            callback();
        }
        var records = $plottedQuery.data('records') || {};
        var keys = Object.keys(records),
            len = keys.length,
            i = 0,
            prop,
            value;
        var markerProcessingBatchSize = 5000;
        var markerProcessingTimeout = 1;
        var recordsRemaining = len;
        doShapeBatch(function (){
            //create batches to render
            $plottedQuery.find('.status').html("Unrendering:" + recordsRemaining + " " + MASystem.Labels.MA_of + " " + len);
            
            doBatch();
        });

        function finishUnrender() {
            callback({success:true});
        }
        var clearData = options.clearData || false;
        function doBatch() {
            while (i < len) {
                var recordsProcessed = 0;
                while (recordsProcessed < markerProcessingBatchSize && i < len) {
                    recordsProcessed++;
                    prop = keys[i];
                    record = records[prop];
                    i++;

                    if (!record) {
                        continue;
                    }

                    //do marker work
                    if (unrenderMarkers) {
                        //check if we have a marker and it's plotted
                        if (record.marker && record.isVisible) {
                            record.isVisible = false;
                            // record.marker.setMap(null);
                            google.maps.event.clearListeners(record.marker, 'click');
                            MA.Map.spiderfier.removeMarker(record.marker);
                            if (clearData) {
                                record.marker = null;
                            }
                        }
                    }
                    //do cluster
                    if (unrenderCluster) {
                        if (record.clusterMarker && record.isClustered) {
                            record.isClustered = false;
                            google.maps.event.clearListeners(record.clusterMarker, 'click');
                            MA.Map.spiderfier.removeMarker(record.clusterMarker);
                            if (clearData) {
                                record.clusterMarker = null;
                            }
                        }
                    }
                    //do scatter
                    if (unrenderScatter) {
                        if (record.scatterMarker && record.isScattered) {
                            record.isScattered = false;
                            google.maps.event.clearListeners(record.scatterMarker, 'click');
                            if (clearData) {
                                record.scatterMarker = null;
                            }
                        }
                    }

                    recordsRemaining--;
                }

                //continue next batch
                $plottedQuery.find('.status').html("Unrendering:" + recordsRemaining + " " + MASystem.Labels.MA_of + " " + len);
            }
            //handle single action events
            if (unrenderMarkers || MA.isMobile) {
                //remove prox objects
                var proximityObjects = $plottedQuery.data('proximityObjects') || [];
                var proxIndex = proximityObjects.length;
                while (proxIndex--) {
                    var proxObject = proximityObjects[proxIndex];
                    try { proxObject.setMap(null); }
                    catch (err) { }
                }
                $plottedQuery.data('proximityObjects', []);

            }
            if (unrenderHeatmap) {
                if ($plottedQuery.data('heatmapLayer')) {
                    $plottedQuery.data('heatmapLayer').setMap(null);
                }

                $plottedQuery.find('.heatmap-opitons').hide();
            }

            //remove the ordered polyline if it exists
            try {
                $plottedQuery.data('orderedPolyline').setMap(null);
            }
            catch (err) { }

            //update visiblility if needed
            if (!options.isRefresh && $plottedQuery.data('affectVisible')) {
                ChangeVisibilityWhenCircleIsAdded({ force: true });
            }
            finishUnrender();
        }
    },

    warnProximityOptions: function(plottingData) {
        var dfd = $.Deferred();
        if (MA.isMobile) {
            plottingData = plottingData || {};
            // check the proximity settings
            var proxEnabled = getProperty(plottingData, 'proximityOptions.enabled', false) || false;
            proxEnabled = proxEnabled === 'true';
            if (plottingData.disableProximityOverride) {
                dfd.resolve({override: true});
            } else if (proxEnabled) {
                var confirmPop = MA.Popup.showMAConfirm({
                    template: 'This query has proximity enabled which could lead to increased memory consumption and limited performance on a mobile device. <br><br>Would you like to plot this query with this feature enabled?',
                    cancelText: MASystem.Labels.MA_No,
                    okText: MASystem.Labels.MA_Yes
                });
                confirmPop.then(function(res) {
                    // respond true to keep the prox, false to remove
                    var newOptions = {override: false};
                    if (!res) {
                        // remove the prox settings
                        newOptions = {override: true};
                    }
                    dfd.resolve(newOptions);
                });
            } else {
                dfd.resolve({override: false});
            }
        } else {
            dfd.resolve({override: false});
        }
        return dfd.promise();
    },

    plotQuery: function (plottingData, renderAs, callback) {
        var $plottedQuery = plottingData.plottedQuery;
        var queryMetaData = $plottedQuery.data();
        //update the $plottedQuery with metadata
        $plottedQuery.data('tooltips', plottingData.tooltips || []);
        $plottedQuery.data('addressFields', plottingData.addressFields || []);
        $plottedQuery.data('deviceFields', plottingData.deviceFields);
        $plottedQuery.data('layerTypeFields', plottingData.layerTypeFields);
        $plottedQuery.data('layerType', plottingData.layerType);
        var advancedOptions = plottingData.advancedOptions || {};
        var automaticAssign = advancedOptions.automaticassign == 'true' ? true : false;
        $plottedQuery.data('advancedOptions', advancedOptions);
        var proximityOptions = plottingData.proximityOptions || {};
        $plottedQuery.data('proximityOptions', proximityOptions);
        $plottedQuery.data('options', plottingData.options || {});
        $plottedQuery.data('macluster_clusterGroup', []);
        $plottedQuery.data('macluster_markerGroup', []);
        $plottedQuery.data('macluster_scatterGroup', []);
        $plottedQuery.data('needsGeocoding', []);
        $plottedQuery.data('badAddressArray', []);
        $plottedQuery.data('workers', {});

        //if this is a proximity limited query (address), draw circle
        var defaultRenderMode = getProperty(queryMetaData || {}, 'advancedOptions.defaultRenderMode') || 'Markers';
        var addressProxLimit = advancedOptions.enableProxLimit == 'true' ? true : false;
        var addressProxLimitInfo = { enabled: false };
        if (addressProxLimit) {
            $plottedQuery.data('distanceLimitCircle', new google.maps.Circle({
                map: MA.map,
                center: new google.maps.LatLng(parseFloat(advancedOptions.distanceLat), parseFloat(advancedOptions.distanceLong)),
                radius: parseFloat(advancedOptions.distanceMeters),
                layerType: 'prox',
                strokeColor: '#FF0000',
                strokeWeight: 3,
                strokeOpacity: 1,
                fillOpacity: 0,
                zIndex: -999
            }));
            addressProxLimitInfo = normalizeShape(queryMetaData.distanceLimitCircle);
            addressProxLimitInfo.enabled = true;
        }

        //check if this query will affectVisible of markers
        $plottedQuery.data('affectVisible', false);
        if (proximityOptions.enabled == 'true' && proximityOptions.affectVisibility == 'true') {
            $plottedQuery.data('affectVisible', true);
        }

        //start batching the records
        var records = plottingData.recordIds || []; //returned records
        var recordLength = records.length;
        $plottedQuery.find('.status').text(MASystem.Labels.MA_Analyzing_Query + "...");
        $plottedQuery.data('numRecords', recordLength);

        var adjustedRenderMode = defaultRenderMode == 'Default' ? 'Markers' : defaultRenderMode;
        //check default render mode
        if (renderAs.indexOf('Default') != -1) {
            if (renderAs.indexOf(adjustedRenderMode) === -1) {
                renderAs.splice(renderAs.indexOf('Default'), 1, adjustedRenderMode); //change default to markers
            }
            else {
                renderAs.splice(renderAs.indexOf('Default'), 1); //remove default
            }
        }

        //if default/markers, check if we should cluster (removing markers and limits from this... what could go wrong)
        var needsCluster = false;
        if ((recordLength >= MASystem.MergeFields.AutomaticClusterThreshold) && defaultRenderMode == 'Default') {
            //default to clustering
            needsCluster = true;
        }

        if (/live/i.test(plottingData.layerType) || queryMetaData.visibleAreaOnly) {
            needsCluster = false;
        }

        //if needsCluster, remove marker render mode and append cluster
        if (needsCluster && !plottingData.isRefresh) {
            var raIndex = renderAs.length;
            var foundMarkers = false;
            var foundCluster = false;
            while (raIndex--) {
                var mode = renderAs[raIndex];
                if (mode == 'Markers') {
                    renderAs.splice(raIndex, 1);
                    foundMarkers = true;
                }
                else if (mode == 'Cluster') {
                    renderAs.splice(raIndex, 1);
                    foundCluster = true;
                }
            }
            //ensure only one cluster is in array
            if (foundMarkers || foundCluster) {
                renderAs.push('Cluster');
            }
        }

        //create batchable records
        var arrayOfRecords = MA.Util.createBatchable(records, MASystem.Organization.MarkerLayerBatchsize);

        //start processing markers
        var markerOptions = {
            cluster: needsCluster,
            qid: $plottedQuery.attr('qid'),
            renderAs: renderAs
        }
        //store the markers on this plotted Query
        var markerObj = $plottedQuery.data('records');

        //set up async calls
        var legendInfo = $plottedQuery.data('legendInfo');
        var queryResults = {
            success: true,
            message: ''
        };

        var sobjects = [];
        var shapesToPlot = {};
        //worker info
        var workerObject = $plottedQuery.data('workers');
        var queryRecord = queryMetaData.queryRecord;
        queryRecord.qid = queryMetaData.qid;
        queryRecord.sfTimeZoneOffset = MASystem.User.timeZoneOffset;
        queryRecord.timeZoneId = MASystem.User.timezoneId;
        $plottedQuery.data('workerTesting', []);
        var workerTesting = $plottedQuery.data('workerTesting');
        //end worker info


        // if plotting live layer, create a device map to store a mapping of device ids to list of corresponding records later
        var layerType = queryMetaData.layerType;
        if (/live/i.test(layerType)) {
            queryMetaData['deviceMap'] = {};
            queryMetaData['badLiveRecords'] = [];
        }

        // device map reference
        var deviceMap = getProperty(queryMetaData, 'deviceMap');

        // string field/property to access the deviceId and device vendor values name within a record object
        var deviceIdFieldName = getProperty(queryMetaData, 'deviceFields.deviceId');
        var deviceVendorFieldName = getProperty(queryMetaData, 'deviceFields.deviceVendor');

        var recordList = queryMetaData.recordList;
        var plotQueue = async.queue(function (queryData, callback) {
            if (queryData.stopQueue) {
                callback({ success: true, recTotal: 0 });
                return;
            }

            Visualforce.remoting.Manager.invokeAction(MARemoting.phase_4,
                escape(queryData.queryString),
                queryData.recordIds.split(','),
                function (result, event) {
                    if (event.status) {
                        if (automaticAssign) {
                            var recLength = result.records.length;
                            //do some minor processing of auto assign information
                            if (window.Worker && MAPlotting.workerTesting) {
                                workerObject['worker' + queryData.workerIndex] = new Worker(MA.resources.MAWorker);
                                var processOptions = {
                                    cmd: 'processAutoAssignRecords',
                                    records: JSON.stringify(result.records),
                                    deviceIdFieldName: deviceIdFieldName,
                                    deviceVendorFieldName: deviceVendorFieldName,
                                    layerType: layerType,
                                    MAIO_URL: getProperty(MASystem || {}, 'Organization.MAIO_URL', false) || 'https://api.mapanything.io',
                                    deviceMap: JSON.stringify(deviceMap || {}),
                                    addressFields: JSON.stringify(queryMetaData.addressFields),
                                    externalScripts: JSON.stringify(MASystem.WorkerResources),
                                    addressProxLimitInfo: JSON.stringify(addressProxLimitInfo)
                                }
                                workerObject['worker' + queryData.workerIndex].postMessage(processOptions);
                                workerObject['worker' + queryData.workerIndex].onmessage = function (e) {
                                    var data = e.data;
                                    if (data.success) {
                                        var geocodedRecords = data.records || '[]';
                                        sobjects = sobjects.concat(JSON.parse(geocodedRecords));

                                        //check for geocoding
                                        var recordsToGeocode = JSON.parse(data.recordsToGeocode);
                                        var needsGeocoding = $plottedQuery.data('needsGeocoding') || [];
                                        var combinedGeoArray = needsGeocoding.concat(recordsToGeocode)
                                        $plottedQuery.data('needsGeocoding', combinedGeoArray);

                                        //update device map
                                        var returnedDeviceMap = JSON.parse(data.deviceMap);
                                        var oldDeviceMap = $plottedQuery.data('deviceMap') || {};
                                        var newDeviceMap = $.extend(true, returnedDeviceMap, oldDeviceMap);
                                        $plottedQuery.data('deviceMap', newDeviceMap);
                                        callback({ success: true, recTotal: recLength });
                                    }
                                    else {
                                        callback({ success: false, recTotal: 0 });
                                    }
                                    workerObject['worker' + queryData.workerIndex].terminate();
                                };
                            }
                            else {
                                var processOptions = {
                                    records: result.records,
                                    deviceIdFieldName: deviceIdFieldName,
                                    deviceVendorFieldName: deviceVendorFieldName,
                                    MAIO_URL: getProperty(MASystem || {}, 'Organization.MAIO_URL', false) || 'https://api.mapanything.io',
                                    layerType: layerType,
                                    deviceMap: deviceMap,
                                    addressFields: queryMetaData.addressFields,
                                    addressProxLimitInfo: addressProxLimitInfo
                                }
                                processAutoAssignRecords(processOptions, function (res) {
                                    if (res.success) {
                                        var geocodedRecords = res.records;
                                        sobjects = sobjects.concat(geocodedRecords);

                                        //check for geocoding
                                        var recordsToGeocode = res.recordsToGeocode;
                                        var needsGeocoding = $plottedQuery.data('needsGeocoding') || [];
                                        var combinedGeoArray = needsGeocoding.concat(recordsToGeocode)
                                        $plottedQuery.data('needsGeocoding', combinedGeoArray);

                                        //update device map
                                        var returnedDeviceMap = res.deviceMap;
                                        var oldDeviceMap = $plottedQuery.data('deviceMap') || {};
                                        var newDeviceMap = $.extend(true, returnedDeviceMap, oldDeviceMap);
                                        $plottedQuery.data('deviceMap', newDeviceMap);
                                        callback({ success: true, recTotal: recLength });
                                    }
                                    else {
                                        callback({ success: false, recTotal: 0 });
                                    }
                                });
                            }
                        }
                        else {
                            if (window.Worker && MAPlotting.workerTesting) {
                                //create a new worker to process the records
                                workerObject['worker' + queryData.workerIndex] = new Worker(MA.resources.MAWorker);
                                var processOptions = {
                                    cmd: 'updateRecords',
                                    records: JSON.stringify(result.records),
                                    queryRecord: JSON.stringify(queryRecord),
                                    addressFields: JSON.stringify(queryMetaData.addressFields),
                                    MAIO_URL: getProperty(MASystem || {}, 'Organization.MAIO_URL', false) || 'https://api.mapanything.io',
                                    deviceFields: JSON.stringify(queryMetaData.deviceFields),
                                    layerTypeFields: JSON.stringify(queryMetaData.layerTypeFields),
                                    layerType: JSON.stringify(queryMetaData.layerType),
                                    externalScripts: JSON.stringify(MASystem.WorkerResources),
                                    isIE: MA.Util.isIE(),
                                    recordList: JSON.stringify(queryMetaData.recordList),
                                    tooltips: JSON.stringify(queryMetaData.tooltips),
                                    imgLoaderDimensions: JSON.stringify(imgLoaderDimensions),
                                    ImageServerEnabled: MASystem.Organization.ImageServerEnabled,
                                    addressProxLimitInfo: JSON.stringify(addressProxLimitInfo),
                                    FiscalYearSettings: JSON.stringify(MA.getProperty(MASystem, ['Organization', 'FiscalYearSettings']))
                                };
                                workerObject['worker' + queryData.workerIndex].postMessage(processOptions);
                                workerObject['worker' + queryData.workerIndex].onmessage = function (e) {
                                    var data = e.data;
                                    if (data.success) {
                                        if (addressProxLimit) {
                                            //we need to update our record list, remove those not in circle
                                            try {
                                                recordList = JSON.parse(data.recordList);
                                                queryMetaData.recordList = recordList;
                                            }
                                            catch (e) {
                                                MA.log('Failed to parse record list');
                                                MA.log(e);
                                                //do nothing, may result missing numbers if dynamic order
                                            }
                                        }

                                        //get the records
                                        var recordsToGeocode = JSON.parse(data.recordsToGeocode);
                                        var needsGeocoding = $plottedQuery.data('needsGeocoding') || [];
                                        var combinedGeoArray = needsGeocoding.concat(recordsToGeocode)
                                        $plottedQuery.data('needsGeocoding', combinedGeoArray);
                                        var processedRecords = JSON.parse(data.records);
                                        var shapeObjToPlot = JSON.parse(data.shapeIdsToPlot);
                                        shapesToPlot = $.extend(shapesToPlot, shapeObjToPlot);
                                        var recLength = processedRecords.length;
                                        for (var i = 0; i < recLength; i++) {
                                            //workerTesting.push(result.records[i]);
                                            sobjects.push(processedRecords[i]);

                                            // populate device Map if applicable
                                            if (deviceIdFieldName && /live/i.test(layerType)) {
                                                var deviceId = getProperty(processedRecords[i], deviceIdFieldName);
                                                var deviceVendor = getProperty(processedRecords[i], deviceVendorFieldName);
                                                var realDeviceId = null;

                                                if (deviceId) {
                                                    realDeviceId = deviceVendor ? (deviceVendor.trim().replace(/(\s|\n)/ig, '').toLowerCase() + '-' + deviceId.trim()) : deviceId.trim();
                                                }

                                                var recId = getProperty(processedRecords[i], 'Id');

                                                if (realDeviceId) {
                                                    if (!deviceMap[realDeviceId]) {
                                                        deviceMap[realDeviceId] = {
                                                            vendor: deviceVendor,
                                                            records: [],
                                                            liveInfo: {},
                                                        };
                                                    }
                                                    if (recId) {
                                                        deviceMap[realDeviceId]['records'].push(recId);
                                                    }
                                                }
                                            }
                                        }
                                        callback({ success: true, recTotal: recLength });
                                    }
                                    else {
                                        callback({ success: false, recTotal: 0 });
                                    }
                                    workerObject['worker' + queryData.workerIndex].terminate();
                                };
                            }
                            else {
                                var processData = {
                                    records: result.records,
                                    queryRecord: queryRecord,
                                    addressFields: queryMetaData.addressFields,
                                    deviceFields: queryMetaData.deviceFields,
                                    layerTypeFields: queryMetaData.layerTypeFields,
                                    layerType: queryMetaData.layerType,
                                    MAIO_URL: getProperty(MASystem || {}, 'Organization.MAIO_URL', false) || 'https://api.mapanything.io',
                                    isIE: MA.Util.isIE(),
                                    recordList: queryMetaData.recordList,
                                    tooltips: queryMetaData.tooltips,
                                    imgLoaderDimensions: imgLoaderDimensions,
                                    ImageServerEnabled: MASystem.Organization.ImageServerEnabled,
                                    FiscalYearSettings: JSON.stringify(MA.getProperty(MASystem, ['Organization', 'FiscalYearSettings'])),
                                    addressProxLimitInfo: addressProxLimitInfo
                                }
                                processRecords(processData, function (res) {
                                    if (addressProxLimit) {
                                        //we need to update our record list, remove those not in circle
                                        recordList = res.recordList;
                                        queryMetaData.recordList = recordList;
                                    }
                                    var shapeObjToPlot = res.shapeIdsToPlot;
                                    shapesToPlot = $.extend(shapesToPlot, shapeObjToPlot);
                                    var recordsToGeocode = res.recordsToGeocode || [];
                                    var needsGeocoding = $plottedQuery.data('needsGeocoding') || [];
                                    var combinedGeoArray = needsGeocoding.concat(recordsToGeocode);
                                    var processedRecords = res.records;
                                    $plottedQuery.data('needsGeocoding', combinedGeoArray);
                                    for (var i = 0; i < res.records.length; i++) {
                                        //workerTesting.push(result.records[i]);
                                        sobjects.push(res.records[i]);

                                        // populate device Map if applicable
                                        if (deviceIdFieldName && (layerType || '').toLowerCase() == 'live') {
                                            var deviceId = getProperty(processedRecords[i], deviceIdFieldName);
                                            var deviceVendor = getProperty(processedRecords[i], deviceVendorFieldName);
                                            var realDeviceId = null;

                                            if (deviceId) {
                                                realDeviceId = deviceVendor ? (deviceVendor.trim().replace(/(\s|\n)/ig, '').toLowerCase() + '-' + deviceId.trim()) : deviceId.trim();
                                            }

                                            var recId = getProperty(processedRecords[i], 'Id');

                                            if (realDeviceId) {
                                                if (!deviceMap[realDeviceId]) {
                                                    deviceMap[realDeviceId] = {
                                                        records: [],
                                                        liveInfo: {},
                                                    };
                                                }
                                                if (recId) {
                                                    deviceMap[realDeviceId]['records'].push(recId);
                                                }
                                            }
                                        }
                                    }
                                    callback({ success: true, recTotal: res.records.length });
                                });
                            }
                        }
                    }
                    else {
                        callback({ success: false, recTotal: 0 });
                    }
                }, { buffer: false, escape: true, timeout: 120000 }
            );

        }, 25);

        plotQueue.concurrency = addressProxLimit ? 1 : 5; //how many we send at one time to fill queue

        //create our batches
        var recordCount = 0;
        if (arrayOfRecords.length == 0) {
            plotQueue.push({ stopQueue: true }, function (res) { });
        }
        else {

            for (var a = 0; a < arrayOfRecords.length; a++) {
                //Add to the queue, with a callback to handle errors
                var rec = arrayOfRecords[a];
                var recordData = {
                    recordIds: rec.join(),
                    'queryString': plottingData.queryString,
                    workerIndex: a
                }
                plotQueue.push(recordData, function (res) {
                    if (!res.success) {
                        //cancel all batches
                        plotQueue.tasks = [];
                    }
                    else {
                        recordCount = recordCount + res.recTotal;
                        $plottedQuery.find('.status').html(MASystem.Labels.MA_Processing + ": " + recordCount + " " + MASystem.Labels.MA_of + " " + recordLength);

                        if (MA.isMobile) {
                            $plottedQuery.data('mobileMessage').find('.toast-message').html(MASystem.Labels.MA_Processing + ": " + recordCount + " " + MASystem.Labels.MA_of + " " + recordLength);
                        }
                    }

                    //$plottedLayer.find('.name').text(recordLength + ' records remaining!');
                });
            }
        }

        //done with all the batches
        plotQueue.drain = function () {
            if (!queryResults.success) {
                NotifyError("Error Running Query", queryResults.message);
                callback({ success: false });
            }
            else {
                if (addressProxLimit) {
                    //we need to update our record list, remove those not in circle
                    try {
                        $plottedQuery.removeData('recordList');
                        $plottedQuery.data('recordList', recordList);

                    }
                    catch (e) {
                        MA.log('Failed to parse record list');
                        MA.log(e);
                        //do nothing, may result missing numbers if dynamic order
                    }
                }
                // do some layer spefific processing first
                MAPlotting.processLayer($plottedQuery, { records: sobjects, isRefresh: false }).then(function (processLayerResponse) {

                    if (processLayerResponse.success) {
                        // some stuff may have needed to be changed while processing the layer, so the lines below pick up the new versions if they were returned and otherwise defaults to the old/current ones
                        sobjects = processLayerResponse.records || sobjects;
                        shapesToPlot = processLayerResponse.shapesToPlot || shapesToPlot;
                        renderAs = processLayerResponse.renderAs || renderAs;

                        //add our shapes to the plottedquery
                        MAPlotting.checkForShapes($plottedQuery, shapesToPlot).then(function (res) {
                            MAPlotting.checkForGeocodes($plottedQuery, renderAs, sobjects).then(function (res) {
                                //update our sobjects with geocoded records
                                var sobjects = res.records;

                                MAPlotting.processWorkerRecords($plottedQuery, { modes: renderAs, records: sobjects, automaticAssign: automaticAssign }, function () {
                                    MAPlotting.updateQueryInfo($plottedQuery, function () {
                                        var savedQueryRecord = $plottedQuery.data('queryRecord') || {};
                                        if (savedQueryRecord.ColorAssignmentType__c === 'Dynamic-Order' && $plottedQuery.data('options').drawLine) {
                                            $plottedQuery.removeData('recordList');
                                            $plottedQuery.data('recordList', recordList);
                                            MAPlotting.drawQueryOrderLine($plottedQuery);
                                        }

                                        if (($plottedQuery.data('macluster_markerGroup') || []).length > 0) {
                                            var m_clusterer = new MarkerClusterer(MA.map, [], {
                                                zoomOnClick: false,
                                                imagePath: MASystem.Images.clusterFolder,
                                                savedQueryName: plottingData.savedQueryName,
                                                qid: $plottedQuery.attr('qid')
                                            });
                                            // level pulled from settings
                                            var clusterZoomLevel = getProperty(userSettings || {}, 'ClusterZoomLevel', false) || 13;
                                            var mobileClusterForce = MA.isMobile ? clusterZoomLevel : 1;
                                            m_clusterer.setMaxZoom(mobileClusterForce);
                                            m_clusterer.qid = $plottedQuery.attr('qid');
                                            m_clusterer.addMarkers($plottedQuery.data('macluster_markerGroup'));
                                            google.maps.event.addListener(m_clusterer, 'click', cluster_Click);
                                            google.maps.event.addListener(m_clusterer, 'rightclick', cluster_context);
                                            $plottedQuery.data('macluster_marker', m_clusterer);
                                            $plottedQuery.data('marker_cluster_dataPoints', m_clusterer.getTotalMarkers());
                                            $plottedQuery.data('macluster_markerGroup', []);
                                            m_clusterer = null;
                                        }

                                        if (($plottedQuery.data('macluster_scatterGroup') || []).length > 0) {
                                            var scatter_clusterer = new MarkerClusterer(MA.map, [], {
                                                zoomOnClick: false,
                                                imagePath: MASystem.Images.clusterFolder,
                                                savedQueryName: plottingData.savedQueryName,
                                                qid: $plottedQuery.attr('qid')
                                            });
                                            var clusterZoomLevel = getProperty(userSettings || {}, 'ClusterZoomLevel', false) || 13;
                                            var mobileClusterForce = MA.isMobile ? clusterZoomLevel : 1;
                                            scatter_clusterer.setMaxZoom(mobileClusterForce);
                                            scatter_clusterer.qid = $plottedQuery.attr('qid');
                                            scatter_clusterer.addMarkers($plottedQuery.data('macluster_scatterGroup'));
                                            google.maps.event.addListener(scatter_clusterer, 'click', cluster_Click);
                                            google.maps.event.addListener(scatter_clusterer, 'rightclick', cluster_context);
                                            $plottedQuery.data('macluster_scatter', scatter_clusterer);
                                            // $plottedQuery.data('marker_cluster_dataPoints', m_clusterer.getTotalMarkers());
                                            $plottedQuery.data('macluster_scatterGroup', []);
                                            scatter_clusterer = null;
                                        }

                                        if (($plottedQuery.data('macluster_clusterGroup') || []).length > 0) {
                                            var clusterer = new MarkerClusterer(MA.map, [], {
                                                zoomOnClick: false,
                                                imagePath: MASystem.Images.clusterFolder,
                                                savedQueryName: plottingData.savedQueryName,
                                                qid: $plottedQuery.attr('qid')
                                            });

                                            clusterer.qid = $plottedQuery.attr('qid');
                                            clusterer.addMarkers($plottedQuery.data('macluster_clusterGroup').slice(0, MA.limits.maxClusterSize));
                                            google.maps.event.addListener(clusterer, 'click', cluster_Click);
                                            google.maps.event.addListener(clusterer, 'rightclick', cluster_context);
                                            $plottedQuery.data('macluster_cluster', clusterer);
                                            $plottedQuery.data('numClusterDataPoints', clusterer.getTotalMarkers());
                                            $plottedQuery.data('macluster_clusterGroup', []);
                                            clusterer = null;
                                        }
                                        sobjects = [];
                                        callback({ success: true });
                                    });
                                });
                            });
                        });
                    }
                    else {
                        callback({ success: false, message: processLayerResponse.message || 'Plotting error' });
                    }
                });
            }
        };
    },

    checkForShapes: function ($plottedQuery, shapeObj) {
        var dfd = jQuery.Deferred();
        shapeObj = shapeObj || {};

        var shapeKeys;
        try {
            shapeKeys = Object.keys(shapeObj);
        }
        catch (e) {
            shapeKeys = [];
        }

        if (shapeKeys.length > 0) {
            var queryShapes = [];
            var totalShapes = shapeKeys.length;
            var shapesRemaining = shapeKeys.length;
            var i = 0;
            
            while (i < totalShapes) {
                var shapesProcessed = 0;
                while (shapesProcessed < 100 && i < totalShapes) {
                    shapesProcessed++;
                    var shapeProp = shapeKeys[i];
                    var isCustomShape = shapeObj[shapeProp];

                    var plotOptions = {
                        customShape: isCustomShape,
                        id: shapeProp
                    }

                    //remove namespace of shape
                    MA_DrawShapes.init(plotOptions).then(function (res) {
                        queryShapes.push(res.layer);
                    });

                    shapesRemaining--;
                    i++;
                }
            }
            $plottedQuery.data('queryShapes', queryShapes);
            dfd.resolve({ success: true });
        }
        else {
            dfd.resolve({ success: true });
        }

        return dfd.promise();
    },

    checkForGeocodes: function ($plottedQuery, renderAs, recordArr) {
        var queryData = $plottedQuery.data();
        var dfd = jQuery.Deferred();

        var disableGeocoding = getProperty(MASystem || {}, 'Organization.disable_forward_geocoding', false) || false;

        if (/geofence/i.test(getProperty(queryData, 'layerType', false)) && /irregular/i.test(getProperty(queryData, 'advancedOptions.layerTypeOptions.geofence.geofenceType', false))) {
            dfd.resolve({ success: true, records: recordArr, message: 'No need to geocode for geofence layers with geofence type irregular' });
        }
        else {
            var mobileMessage;
            if (MA.isMobile) {
                mobileMessage = $plottedQuery.data('mobileMessage');
            }

            var recordsToGeocode = queryData.needsGeocoding || [];
            var needGeocodeCounter = recordsToGeocode.length;
            var badAddresses = queryData.badAddressArray || [];
            var initialRequestCounter = 0;
            var newGeo = true;
            var automaticAssign = getProperty(queryData, 'advancedOptions.automaticassign') == 'true' ? true : false;
            if (disableGeocoding) {
                $plottedQuery.data('badAddressArray', recordsToGeocode);
                var numFail = recordsToGeocode.length;
                $plottedQuery.data({ numSuccessfulGeocodes: 0, numFailedGeocodes: numFail });
                dfd.resolve({ success: true, records: recordArr, message: 'Geocoding is disabled' });
            }
            else {
                if (needGeocodeCounter == 0) {
                    dfd.resolve({ success: true, records: recordArr });
                }
                else {
                    var baseObjectId = getProperty(queryData, 'options.baseObjectId') || '';
                    var workerObject = {};
                    $plottedQuery.data({ numGeocodeRequestsNeeded: needGeocodeCounter, numGeocodeRequestsOut: needGeocodeCounter, numGeocodeRequestsOut: needGeocodeCounter });
                    $plottedQuery.find('.status').html(MASystem.Labels.MA_Geocoding + ": " + (needGeocodeCounter - needGeocodeCounter) + ' of ' + needGeocodeCounter);

                    var itemsToUpdate = [];
                    var recordBatch = [];
                    var numSuccess = 0;
                    var numFail = 0;
                    var saveBatches = 0;
                    var geocodeBatchWorkers = [];
                    var latField = getProperty(queryData, 'addressFields.latitude') || '';
                    var lngField = getProperty(queryData, 'addressFields.longitude') || '';

                    var useWorker = true;
                    if (latField.indexOf('.') != -1 || lngField.indexOf('.') != -1) {
                        //when using lookup fields, workers are not working -> Account.BillingLatitude
                        useWorker = false;
                    }

                    queryData['geoQueue'] = async.queue(function (geoBatchOptions, asyncCallback) {
                        var recordsForBatch = geoBatchOptions.recordsToGeo;
                        var sfRecordsInBatch = geoBatchOptions.sfRecordsInBatch;
                        var requestsInBatch = geoBatchOptions.requestsInBatch || 50;
                        var workerIndex = geoBatchOptions.workerIndex || MA.componentIndex++;
                        if (recordsForBatch != undefined) {
                            //use batch geocodes
                            var jsonParams = JSON.stringify(recordsForBatch);
                            Visualforce.remoting.Manager.invokeAction(MARemoting.MapAnythingIORequestPOST,
                                {
                                    method: 'post',
                                    action: 'batchgeocode',
                                    subType: 'core',
                                    version: '2'
                                },
                                jsonParams,
                                function (res, event) {
                                    $plottedQuery.data('numGeocodeRequestsOut', $plottedQuery.data('numGeocodeRequestsOut') - requestsInBatch);
                                    $plottedQuery.find('.status').html(MASystem.Labels.MA_Geocoding + ": " + ($plottedQuery.data('numGeocodeRequestsNeeded') - $plottedQuery.data('numGeocodeRequestsOut')) + ' of ' + $plottedQuery.data('numGeocodeRequestsNeeded'));
                                    if (event.status) {
                                        if (res.success) {
                                            var geocodedRecords = getProperty(res, 'data.results', false) || {};
                                            if (window.Worker && useWorker) {
                                                workerObject['worker' + workerIndex] = new Worker(MA.resources.MAWorker);
                                                //need to stringify things for workers
                                                //processGeocodeRecordsArray handles updating the records and counts then passes values back
                                                var processOptions = {
                                                    cmd: 'processGeocodeRecordsArrayBatch',
                                                    sfRecords: JSON.stringify(sfRecordsInBatch),
                                                    geocodedRecords: JSON.stringify(geocodedRecords),
                                                    latField: latField,
                                                    lngField: lngField,
                                                    externalScripts: JSON.stringify(MASystem.WorkerResources)
                                                }
                                                //send the request
                                                workerObject['worker' + workerIndex].postMessage(processOptions);
                                                workerObject['worker' + workerIndex].onmessage = function (e) {
                                                    var data = e.data;
                                                    asyncCallback();
                                                    if (data.success) {
                                                        //parse response info
                                                        var response = JSON.parse(data.data);
                                                        var badAddressRes = response.badAddressArray;
                                                        var resRecordBatch = response.recordBatch;
                                                        var itemsToUpdateArr = response.itemsToUpdate;

                                                        //update values
                                                        badAddresses = badAddresses.concat(badAddressRes);
                                                        var resNumFailed = numFail + response.numFail;
                                                        numFail = resNumFailed;
                                                        var resNumSuccess = numSuccess + response.numSuccess;
                                                        numSuccess = resNumSuccess;
                                                        $plottedQuery.data({ numSuccessfulGeocodes: resNumSuccess, numFailedGeocodes: resNumFailed });
                                                        $plottedQuery.data('badAddressArray', badAddresses);

                                                        //save results
                                                        doSave(itemsToUpdateArr);
                                                        recordBatch = recordBatch.concat(resRecordBatch);
                                                    }
                                                    else {
                                                        //something went wrong, silent fail for now
                                                        MA.log(data);
                                                    }

                                                    //terminate this worker
                                                    workerObject['worker' + workerIndex].terminate();
                                                };
                                            }
                                            else {
                                                //old browsers (this will lock the main thread and see slow behavior-->moving map while processing results)
                                                var processOptions = {
                                                    sfRecords: sfRecordsInBatch,
                                                    geocodedRecords: geocodedRecords,
                                                    latField: latField,
                                                    lngField: lngField
                                                };
                                                processGeocodeRecordsArrayBatch(processOptions, function (res) {
                                                    if (res.success) {
                                                        //parse response info
                                                        var badAddressRes = res.badAddressArray;
                                                        var resRecordBatch = res.recordBatch;
                                                        var itemsToUpdateArr = res.itemsToUpdate;

                                                        //update values
                                                        badAddresses = badAddresses.concat(badAddressRes);
                                                        var resNumFailed = numFail + res.numFail;
                                                        numFail = resNumFailed;
                                                        var resNumSuccess = numSuccess + res.numSuccess;
                                                        numSuccess = resNumSuccess;
                                                        $plottedQuery.data({ numSuccessfulGeocodes: resNumSuccess, numFailedGeocodes: resNumFailed });
                                                        $plottedQuery.data('badAddressArray', badAddresses);

                                                        //save results
                                                        doSave(itemsToUpdateArr);
                                                        recordBatch = recordBatch.concat(resRecordBatch);
                                                    }
                                                    else {
                                                        MA.log(data);
                                                        var resNumFailed = numFail + geocodeBatchWorkers.length;
                                                        numFail = resNumFailed;
                                                    }
                                                    asyncCallback();
                                                });
                                            }
                                        }
                                        else {
                                            var badAddressRes = geoBatchOptions.recordInSFArray || [];
                                            var badLength = badAddressRes.length;
                                            badAddresses = badAddresses.concat(badAddressRes);
                                            $plottedQuery.data('badAddressArray', badAddresses);
                                            numFail = numFail + badAddressRes.length;
                                            asyncCallback()
                                        }
                                    }
                                    else {
                                        var badAddressRes = geoBatchOptions.recordInSFArray || [];
                                        var badLength = badAddressRes.length;
                                        badAddresses = badAddresses.concat(badAddressRes);
                                        $plottedQuery.data('badAddressArray', badAddresses);
                                        numFail = numFail + badAddressRes.length;
                                        asyncCallback();
                                    }
                                }, { buffer: false, timeout: 40000, escape: false }
                            );
                        }
                        else {
                            asyncCallback();
                        }
                    });

                    //send 5 out at one time, raising this number may increase network 'stalled' status
                    queryData['geoQueue'].concurrency = 5;

                    //loop over our records and send to async call
                    var batchableRecords = {};
                    var sfRecords = {};
                    var sfRecordsArr = [];
                    var countIndex = 0;
                    var needsProcessing = false;
                    for (var rg = 0; rg < recordsToGeocode.length; rg++) {
                        var geoRecord = recordsToGeocode[rg];
                        if (geoRecord.Id) {
                            var formattedAddress = '';

                            if (geoRecord.FormattedAddress_MA != undefined && geoRecord.FormattedAddress_MA != '') {
                                formattedAddress = geoRecord.FormattedAddress_MA;
                            }
                            else {
                                //try and get formatted address
                                formattedAddress = MAPlotting.getFormattedAddress(geoRecord, queryData);
                            }

                            formattedAddress = formattedAddress || '';

                            //case 00023792, formula field injecting <br>
                            //format special characters
                            formattedAddress = htmlDecode(formattedAddress);
                            formattedAddress = formattedAddress.replace(/<br>/g, ' ');

                            if (formattedAddress.trim() == '') {
                                geoRecord.IsBadAddress = true;
                                $plottedQuery.data('badAddressArray').push(geoRecord);
                                $plottedQuery.data('numGeocodeRequestsOut', $plottedQuery.data('numGeocodeRequestsOut') - 1);
                                numFail++;
                            }
                            else {
                                var uid = String(geoRecord.Id).toLowerCase();
                                sfRecords[uid] = geoRecord;
                                batchableRecords[uid] = { 'address': formattedAddress };
                                sfRecordsArr.push(geoRecord);
                                countIndex++;
                            }
                        }

                        if (countIndex >= 50) {
                            needsProcessing = true;
                            queryData['geoQueue'].push({ recordInSFArray: sfRecordsArr, recordsToGeo: batchableRecords, workerIndex: MA.componentIndex++, sfRecordsInBatch: sfRecords, requestsInBatch: countIndex }, function (res) { });
                            countIndex = 0;
                            batchableRecords = {};
                            sfRecords = {};
                            sfRecordsArr = [];
                        }
                    }

                    var remaining = Object.keys(batchableRecords);
                    if (remaining.length > 0) {
                        needsProcessing = true;
                        queryData['geoQueue'].push({ recordInSFArray: sfRecordsArr, recordsToGeo: batchableRecords, workerIndex: MA.componentIndex++, sfRecordsInBatch: sfRecords, requestsInBatch: remaining.length }, function (res) { });
                        batchableRecords = {};
                        sfRecords = {};
                        sfRecordsArr = [];
                    }

                    //finished with all records...
                    var errorArr = [];
                    queryData['geoQueue'].drain = function () {
                        //update values
                        $plottedQuery.data({ numSuccessfulGeocodes: numSuccess, numFailedGeocodes: numFail });
                        $plottedQuery.find('.status').html('Saving Geocodes...');
                        if (MA.isMobile) {
                            mobileMessage.find('.toast-message').html('Saving Geocodes...');
                        }

                        var saveInter = setInterval(function () {
                            if (saveBatches <= 0) {
                                clearInterval(saveInter);
                                recordArr = recordArr.concat(recordBatch);

                                if (errorArr.length > 0) {
                                    $plottedQuery.data('geoErrors', errorArr);
                                    $plottedQuery.data('geoErrorsCount', errorArr.length);
                                    MAToastMessages.showError({
                                        message: 'Unable to save ' + errorArr.length + ' geocode(s)',
                                        subMessage: 'Click here to view these error(s)',
                                        timeOut: 0,
                                        extendedTimeOut: 0,
                                        closeButton: true,
                                        onclick: function () {
                                            MAPlotting.showGeoErrors(queryData.qid);
                                        }
                                    });
                                }

                                dfd.resolve({ success: true, records: recordArr });
                            }
                        }, 500);
                    }

                    function doSave(itemsToUpdateArr) {
                        saveBatches++;
                        var processData = {
                            ajaxResource: 'MAGeoCodeAJAXResources',
                            action: 'updateRecordsFromQueueItems',
                            serializedItems: JSON.stringify(itemsToUpdateArr),
                            baseObjectId: baseObjectId || ''
                        };

                        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                            processData,
                            function (response, event) {
                                if (event.status) {
                                    if (response && response.success) {
                                        //check our save results for error
                                        var saveResults = getProperty(response, 'SaveResults') || [];

                                        $.each(saveResults, function (i, result) {
                                            if (!result.success) {
                                                errorArr.push(result)
                                            }
                                        });
                                    }
                                    else {
                                        console.warn('err', response);

                                    }
                                    saveBatches--;
                                }
                                else {
                                    //still proceed, but log an error that we couldn't write back to the database
                                    MA.log('Unable to write back to the database', response);
                                    saveBatches--;
                                }
                                //geocodingComplete();
                            }, { buffer: false, escape: true, timeout: 120000 }
                        );
                    };

                    if (!needsProcessing) {
                        //just call our drain function
                        queryData['geoQueue'].drain();
                    }
                }
            }
        }

        return dfd.promise();
    },

    showGeoErrors: function (queryId) {
        var $plottedQuery = $('#PlottedQueriesTable .savedQuery[qid="' + queryId + '"]');
        var queryData = $plottedQuery.data() || {};
        var records = queryData.records || {};
        var tooltips = queryData.tooltips || [];
        var tooltip1 = { describe: { soapType: 'string' } };
        $.each(tooltips, function (i, tp) {
            tooltip1 = tooltips[i];
            return false;
        });
        var geoErrors = queryData.geoErrors || [];

        var errorHTML = '<div style="overflow:auto; max-height:300px;"><table class="ma-table ma-table--fullwidth"><thead class="ma-table-header"><tr><th>#</th><th>Record Link</th><th>Error Information</th></tr><thead><tbody>';
        $.each(geoErrors, function (i, err) {
            var rowNum = i + 1;
            //grab the record
            var recordId = err.recordId;
            var rec = records[recordId];
            var recordName = recordId;
            if (rec != undefined) {
                //grab tooltip1
                recordName = formatTooltip(rec, tooltip1);
            }
            var errArr = err.errors || [];
            var errMsg = 'Unknown Error';
            $.each(errArr, function (i, e) {
                var fields = e.fields || [];
                var fieldsString = fields.join(',');
                var eMsg = e.message || '';
                var statusCodeMsg = e.statusCode || '';
                if (fieldsString.length > 0) {
                    errMsg = 'Field(s) to check:' + fieldsString + '. ' + eMsg + ', ' + statusCodeMsg;
                }
                else {
                    errMsg = eMsg + ', ' + statusCodeMsg;
                }
            });
            errorHTML += '<tr><td>' + rowNum + '.</td><td><a href="/' + recordId + '" target="_blank">' + recordName + '</a></td><td>' + htmlEncode(errMsg) + '</td></tr>';
        });
        errorHTML += '</tbody></table></div>';

        MA.Popup.showMAAlert({
            template: errorHTML,
            width: '80%'
        });
    },

    buildMobileElement: function (plotOptions) {
        var $mobilePlottedQuery;
        //check if we are refreshing and the current view is a single layer
        var $wrapper = $('#layersIndividualWrap');
        if (plotOptions.refreshThisQuery && !$wrapper.hasClass('nest-out')) {
            //we are in a single view check if this is the visible element
            var plottedQueryId = $wrapper.find('.layersIndividual').attr('data-id')
            if (plottedQueryId === plotOptions.id) {
                //we found the plotted layer
                $mobilePlottedQuery = $wrapper.find('.layersIndividual');
            }
            else {
                //just return a template
                $mobilePlottedQuery = $('#templates .layersIndividual.template').clone().removeClass('template');
            }
            //clear previous data
            //$mobilePlottedQuery.removeData().addClass('loading').find('.legend-showhide, .legend, .legend-moreless').hide().filter('.legend').empty();
            $mobilePlottedQuery.find('.status').html(MASystem.Labels.MA_Refreshing_query + "...");
            $mobilePlottedQuery.find('.legendField').html(MASystem.Labels.MA_Refreshing_query + "...");
        }
        else {
            $mobilePlottedQuery = $('#templates .layersIndividual.template').clone().removeClass('template');
            $mobilePlottedQuery.find('.status').html(MASystem.Labels.MA_Running_Query + "...");
            $mobilePlottedQuery.find('.legendField').html(MASystem.Labels.MA_Running_Query + "...");
            $mobilePlottedQuery.find('.plotLayer').attr('data-type', 'savedQuery');
            $wrapper.empty();

            $wrapper.append($mobilePlottedQuery);
        }



        var subTitleHTML = '<div class="ma-top-bar-subtext layerType">' + plotOptions.baseObjectLabel + '</div>';
        $mobilePlottedQuery.find('.layerName').html(plotOptions.name + subTitleHTML);
        $mobilePlottedQuery.attr({ 'data-id': plotOptions.savedQueryId, 'type': 'marker' });

        if (MALayers.isPlotOnLoad.hasOwnProperty(plotOptions.savedQueryId)) {
            $mobilePlottedQuery.find('.plotOnLoadToggle').prop('checked', true);
        }

        return $mobilePlottedQuery;
    },

    buildLayerElement: function (plotOptions) {
        var dfd = $.Deferred();
        var $plottedQuery;
        if (plotOptions.refreshThisQuery) {
            $plottedQuery = plotOptions.plottedQuery;
            delete plotOptions.plottedQuery;

            //clear previous data
            try { $plottedQuery.data('distanceLimitCircle').setMap(null); } catch (err) { }
            $plottedQuery.removeData().addClass('loading').find('.legend-showhide, .legend, .legend-moreless').hide().filter('.legend').empty();
            $plottedQuery.find('.status').html(MASystem.Labels.MA_Refreshing_query + "...");

            MAPlotting.appendingDataToPlottedQuery($plottedQuery, plotOptions);
            dfd.resolve($plottedQuery);
        } else {
            plotOptions.component = 'MarkerLayer';
            window.VueEventBus.$emit('add-layer', plotOptions, function (plottedQueryRef) {
                $plottedQuery = $(plottedQueryRef).addClass('loading');
                // $plottedQuery = $('#templates .PlottedRowUnit').clone().addClass('loading').prependTo($('#PlottedQueriesTable'));
                $plottedQuery.find('.status').html(MASystem.Labels.MA_Running_Query + "...");
                if (plotOptions.type == 'folder') { plotOptions.type = 'marker' }
                $plottedQuery.find('.queryIcon .ftu-icon-icon').attr('type', String(plotOptions.layerType || plotOptions.type || 'marker').trim().toLowerCase());

                MAPlotting.appendingDataToPlottedQuery($plottedQuery, plotOptions);
                dfd.resolve($plottedQuery);
            });
        }

        return dfd.promise();
    },

    appendingDataToPlottedQuery: function ($plottedQuery, plotOptions) {
        $plottedQuery.data('records', {});
        var savedQueryId = plotOptions.savedQueryId || '';
        $plottedQuery.attr('data-id', savedQueryId);

        // var attr = $plottedQuery.attr('qid');
        $plottedQuery.data('qid', plotOptions.qid);
        $plottedQuery.attr('qid', plotOptions.qid);
        MAPlotting.plottedUniqueIds[plotOptions.qid] = 'plotted';
        //add listview settings object
        $plottedQuery.data('listViewSettings', {
            pageNumber: 1,
            pageSize: defaultListViewPageSize,
            selectedIds: [],
            startIndex: 0,
            currentSort: { columnToSort: '', sort: '' },
            filterCount: 0,
            queryCount: 0,
            filters: []
        });

        //store basic data for hover info
        $plottedQuery.data({
            description: plotOptions.description,
            savedQueryName: plotOptions.name,
            baseObjectLabel: plotOptions.baseObjectLabel,
            createdBy: plotOptions.createdInfo,
            modifiedBy: plotOptions.modifiedInfo,
            folderPath: plotOptions.folderPath || '',
            type: plotOptions.type
        });

        //add a recordList array
        $plottedQuery.data('recordList', []);

        var checkboxUID = MA.componentIndex++
        $plottedQuery.find('.ma-toggle').attr('id', checkboxUID);
        $plottedQuery.find('.ma-toggle-label').attr('for', checkboxUID);

        //add basic info
        $plottedQuery.data('componentIndex', ++MA.componentIndex);
        if (plotOptions.id) {
            $plottedQuery.find('.basicinfo-name').text(MASystem.Labels.MA_Loading + "...");
        }
        else {
            $plottedQuery.find('.basicinfo-name').text(plotOptions.name || 'Map It');
            $plottedQuery.find('.basicinfo-baseobjectname').text(MASystem.Labels.MA_Plotting);
            //hide the mod edit dots
            $plottedQuery.find('.query-options').hide();
            //adjust sizing for aesthetics
        }
        //check if visible area query
        if (plotOptions.visibleAreaOnly) {
            //add check for this query
            $plottedQuery.find('#select-VisibleArea').prop('checked', true);

            //show refresh query button
            $('#visibleAreaRefeshMap').addClass('visible');

            $plottedQuery.addClass('visibleOnly');
        }
        else {
            $plottedQuery.removeClass('visibleOnly');
            //remove check for this query
            $plottedQuery.find('#select-VisibleArea').prop('checked', false);
        }

        //hide edit if no permissions
        if ((!MASystem.User.IsCorporateAdmin && !plotOptions.modify) && (plotOptions.nodeType == 'CorporateSavedQuery' || plotOptions.nodetype == 'CorporateSavedQuery')) {
            $plottedQuery.find('.edit-query').remove();
            $plottedQuery.find('.updateHeatmap').removeClass('saveHeatmap').text('Refresh');
        }

        //keep track of permissions for this pq
        $plottedQuery.attr('perm-modify', plotOptions.modify);
        $plottedQuery.addClass('savedQuery');

        //populate default data
        $.extend($plottedQuery.data(), {
            recordsToGeocode: [],
            numGeocodeRequestsOut: 0,
            numSuccessfulGeocodes: 0,
            numFailedGeocodes: 0,
            visibleAreaOnly: plotOptions.visibleAreaOnly || false,
            proximityObjects: [],
            savedQueryId: plotOptions.savedQueryId || ''
        });

        if (MA.isMobile) {
            $plottedQuery.attr({
                'id': 'ACTIVE_' + savedQueryId,
                'data-id': savedQueryId,
                'nodetype': plotOptions.nodetype,
                'type': plotOptions.type ? plotOptions.type.toLowerCase() : 'marker',
                'perm-create': plotOptions.create,
                'perm-delete': plotOptions.delete,
                'perm-export': plotOptions.export,
                'perm-read': plotOptions.read,
                'perm-setpermissions': plotOptions.setpermissions
            });
            $plottedQuery.find('.layer-nest-click-area').attr({ 'action': plotOptions.action });
        }
    },

    processDynamicFilters: function (queryData, callback) {
        var isVisibleAreaQuery = getProperty(queryData, 'visibleAreaInfo.visibleAreaOnly') || false;
        //if dynamic, show popup before continuing
        if (queryData.markerAssignmentType == "dynamicQuery") {
            var $mobileLoader;
            if (queryData.savedQueryId) {
                var $plottedQuery = $('#PlottedQueriesTable .savedQuery[data-id="' + queryData.savedQueryId + '"]');
                var getData = $plottedQuery.data();
                $mobileLoader = getData.mobileMessage;
                if ($mobileLoader != undefined) {
                    $mobileLoader.hide();
                }

            }
            var $popupHtml = $('#templates .dynamicFilterPopup.template').clone().removeClass('template');
            //get the filters and create rows
            var filters = queryData.dynamicFilters || [];
            $.each(filters, function (i, filter) {

                var filterOperator = '(' + filter.Operator + ')' || '';
                var rowUID = 'selectId_' + i;
                var $row;

                var templateHTML = $('#templates .queryFilter.template').clone().removeClass('template').html()
                    .replace(/::FIELD::/g, filter.FormattedLabel + ' (' + filter.Operator + ')')
                    .replace(/::parentfield::/g, filter.ParentField)
                    .replace(/::fieldlabel::/g, filter.FieldLabel)
                    .replace(/::fieldapiname::/g, filter.FieldApiName)
                    .replace(/::operator::/g, filter.Operator)
                    .replace(/::RowUID::/g, rowUID);
                $row = $(templateHTML);


                //$popupHtml.css({'position':'fixed'})
                $popupHtml.find('.form-stretch').append($row);
                var $lookup = $row.find('.' + rowUID + '');
                if (MA.isMobile) {
                    $popupHtml.find('#accountPlotDynamicField').attr("readonly", "readonly");
                    //attach our lookup popup to each input
                    $row.off('click', '.' + rowUID + ''); //remove any previous
                    $row.on('click', '.' + rowUID + '', function () {
                        MALayers.showModal('dynamicSearchModal');
                        $('#dynamicSearchModal').removeData();
                        $('#dynamicFilterPopup .slds-modal').removeClass('slds-fade-in-open');
                        //add modal hide functionality
                        $('#dynamicSearchModal').off('click', '.hideDynamicModal');
                        $('#dynamicSearchModal').on('click', '.hideDynamicModal', function () {
                            MALayers.hideModal('dynamicSearchModal', false);
                        });

                        //keep track of origin
                        $('#dynamicSearchModal').data('domOrigin', $(this));
                        //clear any previous
                        $('#searchDynamicInput').val('');
                        var $searchModal = $('#dynamicSearchModal');
                        $searchModal.find('.search-empty-state').removeClass('hidden');
                        $searchModal.find('.search-results-wrapper').addClass('hidden');
                        $('#searchDynamicInput').focus();

                        //remove any previous event listener
                        $('#dynamicSearchModal').off('keyup', '#searchDynamicInput');

                        //attach event listener to input
                        $('#dynamicSearchModal').on('keyup', '#searchDynamicInput', function () {
                            var $input = $(this);
                            var searchTerm = $input.val();
                            var $searchModal = $('#dynamicSearchModal');
                            var $searchResults = $searchModal.find('.search-table-view').empty();
                            if (searchTimeout !== null) {
                                clearTimeout(searchTimeout);
                            }

                            if (searchTerm === '') {
                                $searchModal.find('.search-empty-state').removeClass('hidden');
                                $searchModal.find('.search-results-wrapper').addClass('hidden');
                                return;
                            }

                            searchTimeout = setTimeout(function () {
                                searchTimeout = null;
                                var $favLoading = MAToastMessages.showLoading({ message: MASystem.Labels.MA_Loading, timeOut: 0, extendedTimeOut: 0 });

                                var processData = {
                                    ajaxResource: 'MATooltipAJAXResources',
                                    action: 'get_lookup_optionsv2',
                                    baseObject: filter.BaseObject,
                                    fieldApiName: filter.FieldApiName,
                                    fieldName: filter.ParentField == null ? filter.FieldApiName : filter.ParentField,
                                    grandparentField: filter.GrandparentField == null ? '--none--' : filter.GrandparentField,
                                    term: searchTerm
                                };

                                Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                                    processData,
                                    function (successResponse, event) {
                                        $searchModal.find('.search-empty-state').addClass('hidden');
                                        $searchModal.find('.search-results-wrapper').removeClass('hidden');
                                        MAToastMessages.hideMessage($favLoading);
                                        $favLoading = null;
                                        if (event.status) {
                                            if (successResponse.success) {
                                                var resultHTML = '';
                                                var lookupData = successResponse.lookupOptions || [];
                                                var lookupDataLength = lookupData.length;
                                                var resultHTML = '';
                                                if (lookupDataLength === 0) {
                                                    //show no results
                                                    $searchResults.html('<li class="table-view-cell">No Results</li>');
                                                }
                                                else {
                                                    $.each(lookupData, function (index, data) {
                                                        resultHTML += '<li class="table-view-cell ownerSuccess" data-id="' + htmlEncode(data.value) + '">' + htmlEncode(data.label) + '</li>';
                                                    });

                                                    $searchResults.html(resultHTML);

                                                    //attach click handler to rows
                                                    $searchResults.off('click', '.ownerSuccess');
                                                    $searchResults.on('click', '.ownerSuccess', function () {
                                                        var $searchFow = $(this);
                                                        var dataId = htmlEncode($searchFow.attr('data-id'));
                                                        var rowVal = htmlEncode($searchFow.text());

                                                        var $searchOriginLocation = $('#dynamicSearchModal').data('domOrigin');

                                                        //$searchOriginLocation.attr('data-id',dataId).val(rowVal);

                                                        //hide modal
                                                        MALayers.hideModal('dynamicSearchModal', false);

                                                        var selection = {
                                                            Name: rowVal,
                                                            Id: dataId
                                                        };
                                                        var pillHTML = '<span data-id="' + dataId + '" class="filter-pill slds-pill slds-pill_link js-remove-pill"><a href="javascript:void(0);" class="slds-pill__action" title="' + rowVal + '"><span class="slds-pill__label filter-pill-value">' + rowVal + '</span></a><button class="slds-button slds-button_icon slds-button_icon slds-pill__remove js-remove-pill" title="Remove"><div class="slds-button__icon ma-icon ma-icon-remove remove-filter-pill"></div></button></span>';
                                                        $row.find('.filter-item-pills').append(pillHTML);
                                                        //$lookup.val(rowVal).data('selectedItem', dataId);
                                                        $('#dynamicFilterPopup .slds-modal').addClass('slds-fade-in-open');
                                                    });
                                                }
                                            }
                                            else {
                                                $searchResults.html('<li class="table-view-cell">No Results</li>');
                                            }
                                        }
                                        else {
                                            $searchResults.html('<li class="table-view-cell">No Results</li>');
                                        }
                                    }, { buffer: false, escape: false, timeout: 120000 }

                                );
                            }, 500);
                        });

                        $('#dynamicSearchModal').off('click', '.clearOriginInput');

                        $('#dynamicSearchModal').on('click', '.clearOriginInput', function () {
                            var $searchOriginLocation = $('#dynamicSearchModal').data('domOrigin');
                            $('#dynamicFilterPopup .slds-modal').addClass('slds-fade-in-open');
                            $searchOriginLocation.removeAttr('data-id').val('');
                        });
                        $('#dynamicSearchModal').off('click', '.hideDynamicModal');

                        //add modal hide functionality
                        $('#dynamicSearchModal').on('click', '.hideDynamicModal', function () {
                            MALayers.hideModal('dynamicSearchModal', false);
                            $('#dynamicFilterPopup .slds-modal').addClass('slds-fade-in-open');
                        });
                    });

                    if (filter.Reference) {
                        var $pills = $lookup.closest('.filter-row').find(' .filter-item-pills');
                        $pills.append('<span data-id="' + MA.CurrentUser.Id + '" class="filter-pill slds-pill slds-pill_link js-remove-pill"><a href="javascript:void(0);" class="slds-pill__action" title="' + MA.CurrentUser.Name + '"><span class="slds-pill__label filter-pill-value">' + MA.CurrentUser.Name + '</span></a><button class="slds-button slds-button_icon slds-button_icon slds-pill__remove js-remove-pill" title="Remove"><div class="slds-button__icon ma-icon ma-icon-remove remove-filter-pill"></div></button></span>');
                        //$lookup.val(MA.CurrentUser.Name).attr('data-id',MA.CurrentUser.Id).data('selectedItem', { label: MA.CurrentUser.Name, value: MA.CurrentUser.Id }).select();
                    }


                }
                else {
                    //moving to select2 for fix to comma seperated search multiple
                    $lookup.addClass('select2Lookup').select2(
                        {
                            minimumInputLength: 2,
                            templateResult: function (opt) {
                                if (opt.loading) {
                                    return MASystem.Labels.MA_Loading + '...';
                                }
                                var returnText = opt.text;
                                if (opt.icon) {
                                    returnText = '<span style="vertical-align: middle;" class="ma-icon ma-icon-' + opt.icon + '"></span><span style="margin-left: 6px;">' + opt.text + '</span>';
                                }

                                return $(returnText);
                            },
                            ajax: {
                                delay: 250,
                                transport: function (params, success, failure) {
                                    var paramData = params.data || {};
                                    var searchTerm = paramData.term || '';
                                    var request = searchLookupOptions(filter, queryData, searchTerm).then(success);
                                    return request;
                                },
                                processResults: function (resp, page) {
                                    //MAData.wizard.searchIndex--;
                                    if (resp.success) {
                                        var returnData = getProperty(resp, 'lookupOptions') || [];
                                        var results = [];
                                        $.each(returnData, function (i, item) {
                                            var icon = '';
                                            if (item.icon) {
                                                icon = item.icon;
                                            }
                                            results.push({ text: item.label, id: item.value, icon: icon });
                                        });

                                        return {
                                            results: results
                                        };
                                    }
                                    else {
                                        return {
                                            results: []
                                        }
                                    }
                                }
                            },
                            tags: true,
                            language: {
                                noResults: function (params) {
                                    return "Please enter a value above";
                                }
                            }
                        }
                    );
                    if (filter.Reference) {
                        var optionHTML = '<option value="' + MASystem.User.Id + '">' + MASystem.User.FullName + '</option>';
                        $lookup.append(optionHTML);
                        $lookup.val(MASystem.User.Id);
                        //$lookup.val(MA.CurrentUser.Name).data('selectedItem', { label: MA.CurrentUser.Name, value: MA.CurrentUser.Id }).select();
                    }
                }


            });

            //show popup with updated rows     
            
            // GUID generator for generating a unique ID for each pop-up.
            const getGUID = function() {
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
                }
            
                return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
            };

            var dynamicFilterPopupId = 'dynamicFilterPopup' + getGUID();
            var dynamicFilterPopupTitle = MASystem.Labels.MA_MARKER_LAYER_FILTERS || 'Marker Layer Filters';
            var dynamicFilterPopup = MA.Popup.showMAPopup({
                template: $popupHtml,
                popupId: dynamicFilterPopupId,
                title: dynamicFilterPopupTitle + ' (' + htmlEncode(queryData.savedQueryName) + ')',
                compact: MA.isMobile ? true : false,
                buttons: [
                    {
                        text: MASystem.Labels.MA_Cancel || 'Cancel',
                        type: 'slds-button_neutral',
                        onTap: function (e) {
                            MALayers.hideModal('dynamicSearchModal', true);
                            return { success: false, 'message': 'Unable to process dynamic data.' };
                        }
                        //no onTap or onclick just closes the popup
                    },
                    {
                        text: MASystem.Labels.MA_Continue || 'Continue',
                        type: 'slds-button_brand',
                        onTap: function (e) {
                            //loop over rows and create phase_2 data
                            var dynamicFilters = [];
                            var popupRows = $('#' + dynamicFilterPopupId + ' .filter-row');

                            for (var d = 0; d < popupRows.length; d++) {
                                var $row = $(popupRows[d]);
                                var inputValue;
                                var $input = $row.find('.fieldInput');
                                var rowOperator = $row.attr('data-operator');
                                if ($input.hasClass('select2Lookup')) {
                                    var valueArr = $input.val();
                                    if (Array.isArray(valueArr)) {
                                        //if(rowOperator.toLowerCase() == 'contains' || rowOperator.toLowerCase() == 'does not contain')
                                        // {
                                        //     inputValue = valueArr.join('%~~~%');
                                        //} else {
                                        inputValue = valueArr.join('~~~');
                                        // }

                                    }
                                    else {
                                        if (valueArr) {
                                            inputValue = String(valueArr);
                                        } else {
                                            inputValue = '';
                                        }
                                    }
                                }
                                else {
                                    if (MA.isMobile) {
                                        //build our string from pills
                                        var inputArr = [];
                                        var pills = $row.find('.filter-item-pills .filter-pill');
                                        $.each(pills || [], function (i, pill) {
                                            var dataValue = $(pill).attr('data-id');
                                            if (dataValue != 'undefined' || dataValue != '') {
                                                inputArr.push(dataValue);
                                            }
                                        });
                                        //join our values for searching multiple items
                                        inputValue = inputArr.join('~~~');
                                    }
                                    else {
                                        //this may not be needed
                                        inputValue = $input.val();
                                    }
                                }
                                var filterObj = {
                                    FieldApiName: $row.attr('data-fieldApiName'),
                                    FieldLabel: $row.attr('data-fieldLabel'),
                                    Operator: rowOperator,
                                    ParentField: $row.attr('data-parentField'),
                                    Value: inputValue
                                };

                                dynamicFilters.push(filterObj);
                            }
                            MALayers.hideModal('dynamicSearchModal', true);
                            return { success: true, data: dynamicFilters };
                        }
                    }
                ]
            });
            //adding a timeout to ensure a box is selected
            setTimeout(function () {
                var $firstInput = $('#dynamicFilterPopup .fieldInput').eq(0);
                if ($firstInput.hasClass('select2Lookup')) {
                    $('#dynamicFilterPopup .fieldInput').eq(0).select2('open').select2('close');
                }
                else {
                    $('#dynamicFilterPopup .fieldInput').eq(0).select();
                }
            }, 500);

            //$('.ma-modal-content').css({'min-height':'20em','position':'fixed'}).removeClass('compact');
            $('.ui-menu-item').css('z-index', '99999')
            dynamicFilterPopup.then(function (res) {
                if (res.success) {
                    //update response if visible area
                    var requestData = {
                        'savedQueryId': queryData.savedQueryId,
                        'dynamicData': JSON.stringify(res.data)
                    }
                    if (isVisibleAreaQuery) {
                        var visibleAreaInfo = getProperty(queryData, 'visibleAreaInfo') || {};
                        $.extend(requestData, visibleAreaInfo);
                    }

                    if (MA.isMobile) {
                        var queryLimit = 1000;
                        if (userSettings.mobilePlotLimit) {
                            queryLimit = userSettings.mobilePlotLimit == '' ? 1000 : MA.Util.parseNumberString(userSettings.mobilePlotLimit);
                        }
                        requestData.limitMobile = queryLimit;
                        requestData.isMobile = 'true';
                    }

                    //make ajax call to phase 2
                    $.extend(requestData, {
                        ajaxResource: 'MASavedQueryAJAXResources',
                        action: 'phase_2'
                    });

                    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequestReadOnly,
                        requestData,
                        function (dynamicResponse, event) {
                            if (event.status) {
                                if (dynamicResponse.success) {
                                    callback(dynamicResponse);
                                }
                                else {
                                    MA.log(dynamicResponse);
                                    callback({ success: false, 'message': 'Unable to process dynamic data.' });
                                }
                            }
                            else if (event.type === 'exception') {
                                MA.log(event.message + ' :: ' + event.where);
                                callback({ success: false, 'message': 'Unable to process dynamic data.' });
                            }
                            else {
                                MA.log(event.message);
                                callback({ success: false, 'message': 'Unable to process dynamic data.' });
                            }
                            if ($mobileLoader != undefined) {
                                $mobileLoader.show();
                            }
                        }, { buffer: false, escape: false, timeout: 120000 }
                    );
                }
                else {
                    callback({ success: false, 'message': 'Unable to process dynamic data.' });
                }
            });

            //move on to plotting with response data
        }
        else {
            //just move on to plotting
            callback({ success: true, data: queryData });
        }
    },

    expandLegendSection: function (header) {
        var $row = $(header).closest('.legend-row-header');
        //check if open or closed
        var isOpen = $row.hasClass('sectionOpen');
        var sectionId = $row.attr('data-sectionid');
        var $legendSection = $row.closest('.legend');
        if (isOpen) {
            $row.removeClass('sectionOpen').addClass('sectionClosed');
            $row.find('.rowDropIcon').removeClass('ion-android-arrow-dropdown').addClass('ion-android-arrow-dropup');
            $legendSection.find('.legend-row[data-sectionid="' + sectionId + '"]').hide();
        }
        else {
            $row.addClass('sectionOpen').removeClass('sectionClosed');
            $row.find('.rowDropIcon').removeClass('ion-android-arrow-dropup').addClass('ion-android-arrow-dropdown');
            $legendSection.find('.legend-row[data-sectionid="' + sectionId + '"]').show();
        }
    },

    legendRowTimeout: null,
    legendRowSelections: {},

    toggleLegendRow: function (options, callback) {
        MA.Map.InfoBubble.hide();
        MA.Map.spiderfier.unspiderfy();
        callback = callback || function () { };
        options = $.extend({
            plottedQuery: null,
            rows: {}
        }, options || {});

        if (options.plottedQuery == null) {
            return;
        }

        //show loading
        var $plottedQuery = options.plottedQuery;
        $plottedQuery.addClass('loading');
        $plottedQuery.find('.queryIcon').hide();
        $plottedQuery.find('.queryLoader, .loading-icon').show();
        var queryData = $plottedQuery.data();
        var invertProximity = getProperty(userSettings || {}, 'InvertProximity', false) || false;
        var queryProximityEnabled = (queryData.proximityOptions && queryData.proximityOptions.enabled == 'true');
        var queryProximityHideMarkers = queryProximityEnabled && queryData.proximityOptions.hideMarkers == 'true';

        // update legend info object
        var legendInfo = queryData.legendInfo;
        var rowsToChange = options.rows;
        var keys = Object.keys(rowsToChange);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var isActive = rowsToChange[key];
            legendInfo[key].active = isActive;
        }
        queryData.legendInfo = legendInfo;
        //check if markers are visible
        var markersAreVisible = $plottedQuery.find('#select-hide').prop('checked');

        if (MA.isMobile) {
            markersAreVisible = true;
        }

        var isRendered = {};
        var activeModes = $plottedQuery.find('.renderButtons .item-selectable .on');
        for (var a = 0; a < activeModes.length; a++) {
            var mode = activeModes[a].getAttribute('data-renderAs');
            isRendered[mode] = true;
        }
        //loop over records and enable/disable
        var records = queryData.records || {};
        var keys = Object.keys(records);
        var len = keys.length;
        var i = 0;
        var prop;
        var markerProcessingBatchSize = MA.Util.isIE() ? 200 : 1000;
        var markerProcessingTimeout = 1;
        var marker_addToCluster = [];
        var scatter_addToCluster = [];
        var marker_removeFromCluster = []
        var scatter_removeFromCluster = [];
        var addClusterMarkers = [];
        var removeClusterMarkers = [];
        var needToUpdateVisibility = false;
        var recordsRemaining = len;
        $plottedQuery.find('.status').text('Rendering...' + recordsRemaining + ' remaining');
        var mobileMessage;
        if (MA.isMobile) {
            mobileMessage = queryData.mobileMessage;
            mobileMessage.find('.toast-message').text('Rendering...' + recordsRemaining + ' remaining');
        }

        while (i < len) {
            var recordsProcessed = 0;
            while (recordsProcessed < markerProcessingBatchSize && i < len) {
                recordsProcessed++;
                prop = keys[i];
                var record = records[prop];
                recordsRemaining--;
                i += 1;

                //get the record legendId
                var recordLegendId = record.legendId;
                if (options.rows[recordLegendId] == null) {
                    if (record.isClustered) {
                        addClusterMarkers.push(record.clusterMarker); //redraw cluster at end
                    }
                    if (record.isVisible) {
                        marker_addToCluster.push(record.marker); //redraw cluster at end
                    }
                    if (record.isScattered) {
                        scatter_addToCluster.push(record.scatterMarker); //redraw cluster at end
                    }
                    continue;
                }

                var rowEnabled = options.rows[recordLegendId];
                if (rowEnabled && markersAreVisible) {
                    
                    if ((((record.marker && !record.isVisible) || (queryProximityEnabled && MA.Util.g(record, 'marker.maData.proximityCircle') && MA.Util.g(record, 'marker.maData.proximityCircle').getMap() == null)) || (record.clusterMarker && !record.isClustered) || (record.scatterMarker && !record.isScattered))) {
                        //check for proximity if needed, otherwise just add this marker to the list
                        if (MA.Map.hitTestShapeMgr.hasShapes()) {
                            //loop through all prox objects to see if this marker falls inside or outside
                            var isInsideProxObject = MA.Map.hitTestShapeMgr.containsLatLng(record.marker.getPosition());
                            var hitTestGood = (!invertProximity && isInsideProxObject) || (invertProximity && !isInsideProxObject);
                            //plot
                            if (isRendered.Markers && (hitTestGood || queryProximityEnabled)) {
                                if (record.marker && !record.isVisible && !queryProximityHideMarkers) {
                                    record.isVisible = true;
                                    record.listViewVisible = true;
                                    // record.marker.setMap(MA.map);
                                    marker_addToCluster.push(record.marker);
                                }
                                if (queryProximityEnabled && MA.Util.g(record, 'marker.maData.proximityCircle') && MA.Util.g(record, 'marker.maData.proximityCircle').getMap() == null) {
                                    record.marker.maData.proximityCircle.setMap(MA.map);
                                    needToUpdateVisibility = true;
                                }
                            }
                            if (isRendered.Cluster /*&& !record.isClustered*/ && hitTestGood) {
                                addClusterMarkers.push(record.clusterMarker);
                                record.isClustered = true;
                                record.listViewVisible = true;
                            }
                            if (isRendered.Scatter /*&& !record.isScattered*/ && hitTestGood) {
                                scatter_addToCluster.push(record.scatterMarker);
                                record.isScattered = true;
                                record.listViewVisible = true;
                                // record.scatterMarker.setMap(MA.map);
                            }
                        }
                        else {
                            if (isRendered.Markers) {
                                //  record.marker.isAdded fixes the checkall issue and record.isVisible && !record.marker.isAdded fixes zooming issue SFCM-2662
                                if (record.marker && !record.isVisible && !queryProximityHideMarkers || record.marker.isAdded || record.isVisible && !record.marker.isAdded) {
                                    record.isVisible = true
                                    record.listViewVisible = true;
                                    // record.marker.setMap(MA.map);
                                    marker_addToCluster.push(record.marker);
                                }
                                if (queryProximityEnabled && MA.Util.g(record, 'marker.maData.proximityCircle') && MA.Util.g(record, 'marker.maData.proximityCircle').getMap() == null) {
                                    record.marker.maData.proximityCircle.setMap(MA.map);
                                    needToUpdateVisibility = true;
                                }
                            }
                            if (isRendered.Cluster && record.clusterMarker/* && !record.isClustered*/) {
                                addClusterMarkers.push(record.clusterMarker);
                                record.isClustered = true;
                                record.listViewVisible = true;
                            }
                            if (isRendered.Scatter && record.scatterMarker /*&& !record.isScattered*/) {
                                record.isScattered = true;
                                record.listViewVisible = true;
                                scatter_addToCluster.push(record.scatterMarker);
                                // record.scatterMarker.setMap(MA.map);
                            }
                        }
                    }
                }
                else {
                    //unplot
                    if (isRendered.Markers) {
                        if (record.marker && record.isVisible) {
                            record.isVisible = false;
                            // record.marker.setMap(null);
                            marker_removeFromCluster.push(record.marker);
                        }
                        if (queryProximityEnabled && MA.Util.g(record, 'marker.maData.proximityCircle') && MA.Util.g(record, 'marker.maData.proximityCircle').getMap() != null) {
                            record.marker.maData.proximityCircle.setMap(null);
                            needToUpdateVisibility = true;
                        }
                    }
                    if (isRendered.Cluster && record.clusterMarker && record.isClustered) {
                        removeClusterMarkers.push(record.clusterMarker);
                        record.isClustered = false;
                    }
                    if (isRendered.Scatter && record.scatterMarker && record.isScattered) {
                        record.isScattered = false;
                        scatter_removeFromCluster.push(record.scatterMarker);
                        //record.scatterMarker.setMap(null);
                    }
                }
            }
            $plottedQuery.find('.status').text('Rendering...' + recordsRemaining + ' remaining');
            if (MA.isMobile) {
                mobileMessage.find('.toast-message').text('Rendering...' + recordsRemaining + ' remaining');
            }
        }
        //finish up
        if (isRendered.Cluster) {
            var clusterer = queryData.macluster_cluster;
            if (clusterer) {
                clusterer.clearMarkers();
                clusterer.addMarkers(addClusterMarkers);
            }
        }
        if (isRendered.Markers) {
            var m_clusterer = queryData.macluster_marker;
            if (m_clusterer) {
                m_clusterer.clearMarkers();
                m_clusterer.addMarkers(marker_addToCluster);
            }
        }
        if (isRendered.Scatter) {
            var s_clusterer = queryData.macluster_scatter;
            if (s_clusterer) {
                s_clusterer.clearMarkers();
                s_clusterer.addMarkers(scatter_addToCluster);
            }
        }

        //update marker visibility if needed
        if (needToUpdateVisibility) {
            ChangeVisibilityWhenCircleIsAdded();
        }
        callback({ success: true });
    },
    toggleLegendHeaderRow: function (checkbox) {
        if (checkbox != null && $(checkbox)) {
            var $checkbox = $(checkbox);
            var $row = $checkbox.closest('.legend-row-header');
            var sectionId = $row.attr('data-sectionid');
            var $plottedQuery = $row.closest('.PlottedRowUnit');
            var hideAll = $checkbox.hasClass('ion-checkmark-round');
            //grab the rows to show/hide
            var $rows = $plottedQuery.find('.legend-row[data-sectionid="' + sectionId + '"]');
            var rowObj = {};
            $.each($rows, function (i, row) {
                if (row != null && $(row)) {
                    var $row = $(row);
                    var legendId = $row.attr('data-id');
                    $row.find('.legend-checkbox').prop('checked', !hideAll);
                    rowObj[legendId] = !hideAll;
                } else {
                    window.MAToastMessages.showError({
                        message: 'Error',
                        subMessage: 'There is no row to toggle in this section',
                        timeOut: 10000,
                        extendedTimeOut: 0,
                        closeButton: true
                    });
                }
            });

            if ($plottedQuery != null && hideAll != null) {
                MAPlotting.toggleLegendRow({ plottedQuery: $plottedQuery, rows: rowObj }, function () {
                    if (hideAll) {
                        $checkbox.removeClass('ion-minus-round ion-checkmark-round');
                    }
                    else {
                        $checkbox.removeClass('ion-minus-round').addClass('ion-checkmark-round');
                    }
                    MAPlotting.updateQueryInfo($plottedQuery, function () {
                        //remove loading
                        $plottedQuery.removeClass('loading');
                        $plottedQuery.find('.queryIcon').show();
                        $plottedQuery.find('.queryLoader').hide();
                        var qid = $plottedQuery.attr('qid') || '';
                        delete MAPlotting.legendRowSelections[qid];
                    });

                    if (!MA.isMobile) {
                        MAListView.DrawTab({ layerId: $plottedQuery.attr('qid'), isSelectedTab: false, isExport: false });
                    }

                });
            } else {
                window.MAToastMessages.showError({
                    message: 'Error',
                    subMessage: 'There is no data to show',
                    timeOut: 10000,
                    extendedTimeOut: 0,
                    closeButton: true
                });
            }
        } else {
            // show toast message
            window.MAToastMessages.showError({
                message: 'Error',
                subMessage: 'There is no row to toggle',
                timeOut: 10000,
                extendedTimeOut: 0,
                closeButton: true
            });
        }
    },

    useRichmarker: false,

    createWaypointFromRecord: function (record, options) {
        var waypointInfo = MAPlotting.buildWaypointMarkerData(record, options);
        var waypointMarker = new google.maps.Marker(waypointInfo);

        if (record && options && options.routingData && options.routingData.records && options.routingData.records[record.Id]) {
            options.routingData.records[record.Id].marker = waypointMarker;
        }

        google.maps.event.addListener(waypointMarker, 'click', function (e) { MAPlotting.marker_Click.call(this, options); });

        return waypointMarker;
    },

    buildWaypointMarkerData: function (record, options) {
        var MAIO_URL = getProperty(MASystem, 'Organization.MAIO_URL', false) || 'https://api.mapanything.io';
        options = $.extend({
            type: '',
            uid: '',
            iconOptions: {
                url: MAIO_URL + '/services/images/marker?color=1589ee&forlegend=false&icon=markerWaypoint&text=0',
                anchor: new google.maps.Point(14, 42),
                size: { height: 70, width: 56 },
                scaledSize: { height: 35, width: 28 }
            }
        }, options || {});

        var MarkerCoordinate = new google.maps.LatLng(record.location.coordinates.lat, record.location.coordinates.lng);
        var layerType = options.type === 'schedQuery' ? 'sched-marker' : 'waypoint-marker';
        var waypointMarker;
        var waypointInfo = {
            layerType: layerType,
            position: MarkerCoordinate,
            map: MA.map,
            zIndex: 99999999, //force to top, case 23397
            savedQueryId: record.savedQueryId || '',
            linkId: record.linkId || record.LinkId__c || '',
            LinkId__c: record.linkId || record.LinkId__c || '',
            type: options.type,
            uid: options.uid,
            markerLocation: { lat: record.location.coordinates.lat, lng: record.location.coordinates.lng } //adding this since spiderfy changes the getPostion coords, use this to get actual lat lng
        }
        if (record.markerInfo) {
            waypointInfo.qid = record.markerInfo.qid || '';
            waypointInfo.record = record.markerInfo.record;
            // add extra waypoint info to the record for custom work, SERVICES-467
            try {
                // waypointInfo.record should always be object, but check
                var typeCheckRecord = waypointInfo.record;
                if (typeof typeCheckRecord === 'object') {
                    // add extra param for waypoint sf id and overall route sf id
                    waypointInfo.record.savedWaypointId = record.savedWaypointId || '';
                    waypointInfo.record.savedRouteId = record.savedRouteId || '';
                }
            } catch (e) {
                console.warn('error adding extra waypoint info to record: ', record);
                console.warn('error info:', e);
            }

            // MAP-6476, missing tooltip 1
            var markerTitle = getProperty(record, 'markerInfo.title', false);
            if (markerTitle === undefined) {
                try {
                    // get tooltip 1 from route data
                    var subRecord = getProperty(record, 'markerInfo.record', false);
                    var tooltips = getProperty(options, 'routingData.tooltips', false) || [];
                    var tooltip1Info = tooltips[0];
                    var formattedTooltip = formatTooltip(subRecord, tooltip1Info, true);
                    record.markerInfo.title = formattedTooltip;
                }
                catch (e) {
                    console.warn('Unable to build tooltip 1');
                    record.markerInfo.title = "MapAnything Waypoint";
                }
            }

            waypointInfo.title = record.markerInfo.title;
        }
        else {
            //label
            waypointInfo.qid = record.labelInfo.lableMarker.qid || '';
            waypointInfo.record = record.labelInfo.lableMarker.record;
            waypointInfo.title = record.labelInfo.lableMarker.title;
        }
        waypointInfo.icon = options.iconOptions;
        waypointInfo.zIndex = 1000;

        return waypointInfo;
    },

    createMarkerFromRecordWithWorker: function (record, options) {
        options = $.extend({
            savedQueryId: ''
        }, options || {});
        var marker;
        var clusterMarker;
        var scatterMarker;
        var MarkerCoordinate = new google.maps.LatLng(record.location.coordinates.lat, record.location.coordinates.lng);

        //create the marker url based on imageServer,IE,etc... and update record
        /*faster to create all markers at once*/
        if (record.markerInfo) {
            record.markerInfo.position = MarkerCoordinate;
            // var markerSize = record.markerInfo.size || {x:20,y:36};
            // var scaledSize = new google.maps.Size(markerSize.x,markerSize.y);
            marker = new google.maps.Marker(record.markerInfo);
            record.markerInfo.omsCluster = true;
            clusterMarker = new google.maps.Marker(record.markerInfo);
        }
        if (record.scatterMarkerInfo) {
            record.scatterMarkerInfo.position = MarkerCoordinate;
            // var markerSize = record.scatterMarkerInfo.size || {x:16,y:16};
            // var scaledSize = new google.maps.Size(markerSize.x,markerSize.y);
            // record.scatterMarkerInfo.icon.scaledSize = scaledSize;
            var scatterIcon = getProperty(record, 'scatterMarkerInfo.icon.url', false);
            if (scatterIcon === undefined) {
                // failing in record process for <Other>
                updateValue(record, 'scatterMarkerInfo.icon.url', record.scatterMarkerInfo.markerImgUrl);
            }
            scatterMarker = new google.maps.Marker(record.scatterMarkerInfo);
        }
        // check for label marker
        if (record.labelInfo) {
            //do some formatting for the label,
            //doing this here due to worker needing moment and other functions
            var labelType = getProperty(record, 'labelInfo.labelType', false);
            var formattedValue = getProperty(record, 'labelInfo.lableMarker.title', false) || 'N/A';
            if (labelType.indexOf('date') >= 0) {
                //create fake date tooltip
                var formatObj = { DisplayType: labelType, describe: { soapType: labelType }, ActualFieldName: record.tooltip1Field };
                formattedValue = formatTooltip(record, formatObj);
                formatObj = null;
                if (formattedValue == undefined || formattedValue == '') {
                    formattedValue = 'N/A'
                }
                record.labelInfo.lableMarker.title = htmlDecode(formattedValue);
            }
            var styleIconText = htmlDecode(formattedValue);
            if (/^\<a.*\>.*\<\/a\>/i.test(styleIconText)) {
                styleIconText = styleIconText.match(/<a [^>]+>([^<]+)<\/a>/)[1];
            }

            // determine width of marker
            var markerWidth = MAPlotting.getTextWidth.calculateWidth(styleIconText);
            var labelColor = record.labelInfo.labelStyledIcon.color;
            labelColor = record.labelInfo.labelStyledIcon.color.replace('#', '');
            var tempURL = MASystem.Organization.MAIO_URL + '/images/marker?color=' + labelColor + '&forlegend=false&icon=textBox&text=' + encodeURIComponent(styleIconText) + '&textWidth=' + markerWidth;
            var markerInfo = {
                markerImgUrl : tempURL,
                icon: {
                    url: tempURL,
                    anchor: { x: 0, y: 33 },
                    size : { height: 36, width: markerWidth + 20 }
                },
                position: MarkerCoordinate,
                markerValue : record.labelInfo.labelStyledIcon.color,
                optimized: true,
                cursor: 'pointer',
                layerType: 'query-marker',
                title: record.labelInfo.lableMarker.title || '',
                qid : record.labelInfo.lableMarker.qid,
                record : record.labelInfo.lableMarker.record
            }
            marker = new google.maps.Marker(markerInfo);
            if(record.markerInfo){ 
                record.markerInfo.omsCluster = true;
            } else {
                record.markerInfo = {omsCluster:true}
            }            
            clusterMarker = new google.maps.Marker(markerInfo);
            labelColor = null;
            markerWidth = null;
            tempURL = null;
            markerInfo = null;

            if (record.scatterMarkerInfo) {
                record.scatterMarkerInfo.position = MarkerCoordinate;
                scatterMarker = new google.maps.Marker(record.scatterMarkerInfo);
            }
            styleIcon = null;
        }

        record.marker = marker;
        if (MA.isMobile) {
            // do not create cluster marker
            record.clusterMarker = null;
        } else {
            record.clusterMarker = clusterMarker;
        }
        record.scatterMarker = scatterMarker;

        // scatter click always added here
        google.maps.event.addListener(scatterMarker, 'click', function (e) { MAPlotting.marker_Click.call(this, { routingData: this.routingData }); });
        // if mobile, no longer using spiderfy, add clicks here
        if (MA.isMobile) {
            // not adding cluster listener, should never plot clusters on mobile now (markers are rendered as clusters)
            google.maps.event.addListener(marker, 'click', function (e) { MAPlotting.marker_Click.call(this, { routingData: this.routingData }); });
        } else {
            //handle right click (left click is handled by MA.Map.spiderfier) => desktop
            google.maps.event.addListener(scatterMarker, 'rightclick', function (e) { marker_Context.call(this, e) });
            google.maps.event.addListener(clusterMarker, 'rightclick', function (e) { marker_Context.call(this, e) });
            google.maps.event.addListener(marker, 'rightclick', function (e) { marker_Context.call(this, e) });
        }
        marker = null;
        scatterMarker = null;
        clusterMarker = null;
        MarkerCoordinate = null;
        return record;
    },
    getTextWidth: {
        calculateWidth: function(text) {
            // re-use canvas object for better performance
            var canvas = MAPlotting.getTextWidth.canvas || (MAPlotting.getTextWidth.canvas = document.createElement("canvas"));
            var context = canvas.getContext("2d");
            context.font = '18px Salesforce Sans';
            var metrics = context.measureText(text);
            canvas = null;
            context = null;
            return Math.ceil(metrics.width) + 30;
        },
        canvas: document.createElement("canvas")
    },

    getFormattedAddress: function getFormattedAddressAlias(record, queryData) {
        record = record || {};
        queryData = queryData || {};

        var layerType = queryData.layerType;
        var formattedAddress = '';
        var street, city, state, zipCode, country;

        if (/live/i.test(layerType)) {
            var device = record.device;

            if (device instanceof MADevice) {
                formattedAddress = device.getFormattedAddress();
            }
        }
        else if (/marker/i.test(layerType)) // new layers may have now marker as a layertype
        {
            var addressInfo = {};
            var addressFields = queryData.addressFields || {};

            for (var key in addressFields) {
                var fieldName = addressFields[key];
                var propertyValue = getProperty(record, fieldName) || '';
                addressInfo[key] = propertyValue;
            }

            street = addressInfo.street ? addressInfo.street + ', ' : '';
            city = addressInfo.city ? addressInfo.city + ', ' : '';
            state = addressInfo.state ? addressInfo.state + ' ' : '';
            zipCode = addressInfo.zip ? addressInfo.zip + ' ' : '';
            country = addressInfo.country ? addressInfo.country : '';

            formattedAddress = (street || '') + (city || '') + (state || '') + (zipCode || '') + (country || '');
        }
        else // old layers that didn't have the layertype property, assumed to be marker layers
        {
            var addressInfo = {};
            var addressFields = queryData.addressFields || {};

            for (var key in addressFields) {
                var fieldName = addressFields[key];
                var propertyValue = getProperty(record, fieldName) || '';
                addressInfo[key] = propertyValue;
            }

            street = addressInfo.street ? addressInfo.street + ', ' : '';
            city = addressInfo.city ? addressInfo.city + ', ' : '';
            state = addressInfo.state ? addressInfo.state + ' ' : '';
            zipCode = addressInfo.zip ? addressInfo.zip + ' ' : '';
            country = addressInfo.country ? addressInfo.country : '';

            formattedAddress = (street || '') + (city || '') + (state || '') + (zipCode || '') + (country || '');
        }

        //formattedAddress = formattedAddress.replace('&#39;','`');

        return formattedAddress;
    },

    marker_Click: function (options, callback) {
        callback = callback || function () { };

        options = $.extend({
            markerType: 'marker'
        }, options || {});

        var marker = this;
        var qid = marker.qid;
        if (!qid) {
            return;
        }
        var $plottedQuery;

        if (marker.layerType === 'waypoint-marker' && !options.routingData) {

            var $routingTable;
            if (MA.isMobile) {
                $routingTable = $('#routeSingleListView');
            }
            else {
                $routingTable = notPrintEmailPage ? $('#Routing-Table') : $(window.opener.document.getElementById('Routing-Table'));
            }
            //grab the secondary data
            var routeData = $routingTable.data() || {};
            //grab the plotted queries
            var plottedQueries = routeData.plottedQueries;
            //grab the query we need
            $plottedQuery = plottedQueries[marker.savedQueryId] || {};

        }
        else {
            $plottedQuery = $('#PlottedQueriesTable .PlottedRowUnit[qid="' + qid + '"]');
        }

        //get the recordInfo from the plottedQuery, not the marker
        var queryMetaData = options.routingData || $plottedQuery.data();
        var records = queryMetaData.records || {};
        var recordId = marker.record.Id;
        var record = records[recordId];// (options.routingData && options.routingData.records.length) ? options.routingData.records[0] :

        // location
        var recordMarkerLocation = {
            lat: MA.getProperty(record, 'location.coordinates.lat') || marker.getPosition().lat(),
            lng: MA.getProperty(record, 'location.coordinates.lng') || marker.getPosition().lng()
        };

        if (isNum())

            if (marker.layerType === 'waypoint-marker') {
                record.isRouteMarker = true;
            }

        var $tooltipContent = $('#tooltip-content-template').clone().attr('id', 'tooltip-content');

        var recordInfo = records[record.Id];
        //show related list tab if needed
        if (queryMetaData.options.relatedListCount > 0) {
            $tooltipContent.find('#tab-relatedlist').show();
        }

        //show weather tab if needed
        if (userSettings.ShowWeather) {
            $tooltipContent.find('#tab-weather').show();
        }

        // display device Live and Device History tabs if applicable and remove related template classes
        //var layerType = getProperty(queryMetaData, 'queryRecord.BaseObject__r.Type__c');
        var layerType = getProperty(queryMetaData, 'layerType', false) || ''; // teddy - replaced line above
        if (/^live$/ig.test(layerType)) {
            // $tooltipContent.find('#tab-live').show();
            // $tooltipContent.find('#tab-history').show();

            $tooltipContent.find('.tooltip-tab[data-tab="live"]').show();
            $tooltipContent.find('.tooltip-tab[data-tab="live-history"]').show();

            $tooltipContent.find('*').removeClass('live-template');
            
            setTimeout(function() {
                $('.tooltip-tab').click(function() {
                    $('.select2-hidden-accessible').select2('close');
                });
            }, 3000);
        }

        //show picklist field info if needed
        if (queryMetaData.colorAssignmentType == 'dynamicField') {
            $tooltipContent.find('.picklistinfo').show();
        }

        var $tooltips = $tooltipContent.find('.tooltips > table');
        var tooltip1Value = 'Tooltip 1';
        record.tooltips = [];
        var tooltipMetaData = queryMetaData.tooltips || [];
        for (var tp = 0; tp < tooltipMetaData.length; tp++) {
            var tpMetaData = tooltipMetaData[tp];
            var rawValue = getProperty(record, tpMetaData.ActualFieldName) || '';
            var formattedValue = formatTooltip(record, tpMetaData) || rawValue;

            //Check if formattedValue is encoded HTML (for SFCM-1906 - Rich Text Image Field support).
            if (formattedValue) {
                var a = document.createElement('div');
                a.innerHTML = htmlDecode(formattedValue);

                for (var c = a.childNodes, i = c.length; i--;) {
                    // If formattedValue has valid HTML, it will have appended a childNode into the div we created.
                    if (c[i].nodeType == 1) {
                        formattedValue = htmlDecode(formattedValue);
                    }
                }
            }

            if (tp === 0) {
                //treat as a name only, link get's handled lower => reference the record id, not the related id (special case)
                formattedValue = formatTooltip(record, tpMetaData, true) || rawValue;
                tooltip1Value = formattedValue == '' ? 'N/A' : formattedValue;
            } else {
                //fixing xss using .html()
                var $newTooltip = $("<tr class='tooltip-row'><td class='icon'></td><td class='label'><b class='fieldLabel'>" + htmlEncode(tpMetaData.FieldLabel) + "</b></td><td class='value'>" + formattedValue + "</td><td class='tooltip-loader'><img class='saving' src='" + MASystem.Images.chatterLoader + "' /><img class='error' src='" + MASystem.Images.x22 + "' title='Unable to save' /></td></tr>");
                // $newTooltip.find('.fieldLabel').text(tpMetaData.FieldLabel);
                // $newTooltip.find('.value').text(formattedValue);
                if (!(/tooltip/i).test(tpMetaData.TooltipType)) {
                    var newTooltipTitle = typeof tpMetaData.TooltipType == 'string' ? tpMetaData.TooltipType.split(':').reduce(function (acc, curr) { return curr + ' ' + acc }) + ' field' : '';
                    $newTooltip.find('.icon').attr('title', newTooltipTitle);
                }

                //make this tooltip editable if needed

                if (userSettings.EditableTooltips && tpMetaData.Accessible && tpMetaData.Updateable && displayTypeMetadata[tpMetaData.DisplayType]) {
                    $newTooltip.find('td.value').addClass('editable');
                }

                //if this tooltip row is for a textarea, allow wrapping
                if (tpMetaData.DisplayType == 'TEXTAREA') {
                    $newTooltip.find('td.label').css('vertical-align', 'top');
                    $newTooltip.find('td.value').css('white-space', 'normal');
                }

                // assign classes
                if (typeof tpMetaData.TooltipType == 'string') {
                    tpMetaData.TooltipType.split(':').map(function (item) { $newTooltip.addClass(item); });
                }

                //append this new row to the tooltips table
                $newTooltip.appendTo($tooltips).data('tooltip', tpMetaData);
            }
            record.tooltips.push({ rawValue: rawValue, formattedValue: formattedValue })
        }

        //populate template merge fields
        //create a formatted address
        var formattedAddress = MAPlotting.getFormattedAddress(record, queryMetaData) || '';
        var savedQueryName = htmlDecode(record.savedQueryName || options.title || '');

        $tooltipContent = $(
            $tooltipContent.wrap('<div></div>').show().parent().html()
                .replace(/::ContentKey::/g, marker.qid)
                .replace(/\/::Id::/g, (MA.SitePrefix + '/' + record.Id) || '')
                .replace(/::Name::/g, tooltip1Value || '')
                .replace(/::Address::/g, htmlEncode(formattedAddress))
                .replace(/::PicklistFieldLabel::/g, 'PicklistFieldLabel')
                .replace(/::PicklistFieldValue::/g, 'PicklistFieldValue')
                .replace(/::QueryName::/g, htmlEncode(savedQueryName))
        );

        MA.Map.InfoBubble['layerType'] = getProperty(queryMetaData, 'layerType', false);
        MA.Map.InfoBubble['recordId'] = record.Id;

        // launch infobubble
        MA.Map.InfoBubble.show({
            position: this.getPosition(),
            anchor: marker,
            minWidth: 420,
            content: $tooltipContent.get(0)
        });

        // set close click handler if any was passed
        if (options.closeClickHandler && typeof options.closeClickHandler === 'function') {
            MA.Map.InfoBubble.setCloseButtonHandler(options.closeClickHandler);
        }

        //check chatter support
        var hideChatterOverride = getProperty(MASystem || {}, 'Organization.hideChatterTab', false) || false;
        if (!hideChatterOverride && queryMetaData.options.supportsChatter) {
            $tooltipContent.find('#tab-chatter').show().data('recordId', record.Id).data('contentKey', marker.qid).data('loaded', false);
        }

        function removeFirstChar(match, offset, string) {
            return match.substring(1);
        }

        //init tabs
        function tabCreateActivate(event, ui) {
            var panel = ui.newPanel || ui.panel || { selector: '' };
            //handle clicking the weather tab
            var selector = panel.attr('id');
            if (selector.indexOf('pane-weather') > -1 && !$tooltipContent.find('#tab-weather').data('loaded')) {
                // do not load the weather every time
                $tooltipContent.find('#tab-weather').data('loaded', true);
                //build a request url
                var AJAXURL = "https://api.aerisapi.com/forecasts/closest?p=[lat],[log]&client_id=aMmtNIJO93b1YWgxPPzjw&client_secret=N4Bbg4p2hMMhXgO7NgNwGxTjHxbG0DbMeq9YZhPo"
                    .replace('[lat]', recordMarkerLocation.lat)
                    .replace('[log]', recordMarkerLocation.lng);

                //show loading
                $('#weather-ajax-' + marker.qid).html(MASystem.Labels.MA_Loading + "...");
                // send request to get weather content
                // getting weird results with jsonp => Uncaught ReferenceError: jQuery randomly occures.
                // moving to json and updating ajax call
                $.ajax({
                    url: AJAXURL,
                    method: "GET",
                    dataType: "JSON"
                }).done(function (json) {
                    if (json && json.success) {
                        var response = json.response || [];
                        var firstDay = response[0] || {};
                        var periods = firstDay.periods || [];
                        var WeatherIconURL = MASystem.Images.weatherIconURL;
                        $.each(periods, function (index, value) {

                            var WeatherObj = value;
                            var WeatherDate = new Date(value.timestamp * 1000);
                            if (index === 0) {
                                $('#weather-ajax-' + marker.qid).html(
                                    $('#CurrentLocationWeatherTemplate').clone().html()
                                        .replace(/::date::/g, WeatherDate.toLocaleDateString())
                                        .replace(/::maxTempF::/g, WeatherObj['maxTempF'])
                                        .replace(/::maxTempC::/g, WeatherObj['maxTempC'])
                                        .replace(/::minTempC::/g, WeatherObj['minTempC'])
                                        .replace(/::minTempF::/g, WeatherObj['minTempF'])
                                        .replace(/::avgTempF::/g, WeatherObj['avgTempF'])
                                        .replace(/::feelslikeF::/g, WeatherObj['feelslikeF'])
                                        .replace(/::icon::/g, '<img src="' + WeatherIconURL + '/' + WeatherObj['icon'] + '" />')
                                        .replace(/::weather::/g, WeatherObj['weather'])
                                        .replace(/::pop::/g, WeatherObj['pop'])
                                        .replace(/::humidity::/g, WeatherObj['humidity'])
                                        .replace(/::windDir::/g, WeatherObj['windDir'])
                                        .replace(/::windSpeedMPH::/g, WeatherObj['windSpeedMPH'])
                                );
                            }
                            else {
                                $('#weather-ajax-' + marker.qid).append(
                                    $('#LocationWeatherTemplate').clone().html()
                                        .replace(/::date::/g, WeatherDate.toLocaleDateString())
                                        .replace(/::maxTempF::/g, WeatherObj['maxTempF'])
                                        .replace(/::maxTempC::/g, WeatherObj['maxTempC'])
                                        .replace(/::minTempC::/g, WeatherObj['minTempC'])
                                        .replace(/::minTempF::/g, WeatherObj['minTempF'])
                                        .replace(/::icon::/g, '<img src="' + WeatherIconURL + '/' + WeatherObj['icon'] + '" />')
                                        .replace(/::weather::/g, WeatherObj['weather'])
                                        .replace(/::pop::/g, WeatherObj['pop'])
                                        .replace(/::humidity::/g, WeatherObj['humidity'])
                                        .replace(/::windDir::/g, WeatherObj['windDir'])
                                        .replace(/::windSpeedMPH::/g, WeatherObj['windSpeedMPH'])
                                );
                            }
                        });
                        MA.Map.InfoBubble.adjust();
                    } else {
                        $('#weather-ajax-' + marker.qid).html('Unable to get weather in this area.');
                        MA.Map.InfoBubble.adjust();
                    }
                }).fail(function(err) {
                    console.warn(err);
                    $('#weather-ajax-' + marker.qid).html('Unable to get weather in this area.');
                    MA.Map.InfoBubble.adjust();
                });
            } else if (selector.indexOf('pane-chatter') > -1 && !$tooltipContent.find('#tab-chatter').data('loaded')) {
                //mark as loaded so we don't load again
                $tooltipContent.find('#tab-chatter').data('loaded', true);

                //load chatter integration
                $tooltipContent.find('#pane-chatter-' + $tooltipContent.find('#tab-chatter').data('contentKey')).append("<iframe src='" + MA.resources.ChatterFeed + "?entityId=" + $tooltipContent.find('#tab-chatter').data('recordId') + "' style='width: 100%; min-height: 220px; height: 100%; border: none; max-height: 355px; overflow: hidden;'></iframe>");
                MA.Map.InfoBubble.adjust();
            } else if (selector.indexOf('pane-history') > -1 && !$tooltipContent.find('#tab-history').data('loaded')) {
                // Live Tracking History...
                $tooltipContent.find('#tab-history').data('loaded', true);
                var layerId = queryMetaData.savedQueryId;
                MAPlotting.getLiveConfigs(layerId).then(function (res) {
                    var $configSelector = $('#live-configs');
                    var configOptions = '';

                    res.sort(function (a, b) {
                        if (a.configName < b.configName) {
                            return -1;
                        }
                        if (a.configName > b.configName) {
                            return 1;
                        }
                        return 0;
                    });

                    for (var i = 0; i < res.length; i++) {
                        configOptions += '<option value="' + res[i]['configId'] + '">' + res[i]['configName'] + '</option>';
                    }

                    $configSelector.html(configOptions);
                    MA.Map.InfoBubble.adjust();
                }).fail(function (err) {
                    MAToastMessages.showError({ 'message': err, timeOut: 6000 });
                    MA.Map.InfoBubble.adjust();
                });
            } else if (selector.indexOf('pane-relatedlist') > -1 && !$tooltipContent.find('#tab-relatedlist').data('loaded')) {
                $tooltipContent.find('#tab-relatedlist').data('loaded', true);
                var $relatedList = $tooltipContent.find("#ajax-" + marker.qid).html(MASystem.Labels.MA_Loading + '...');
                //get related list info
                $.ajax({
                    url: MA.resources.RelatedLists,
                    type: 'GET',
                    dataType: 'HTML',
                    data: {
                        parentid: record.Id,
                        sqid: queryMetaData.savedQueryId
                    }
                })
                .done(function (data,textStatus,res) {
                    MA.Map.InfoBubble.adjust();
                    if (res) {
                        var getHTML = res.responseText || '';
                        var decodedHTML = htmlDecode(getHTML);
                        $relatedList.html(decodedHTML.replace(/\\./g, removeFirstChar));
                        MA.Map.InfoBubble.adjust();
                    }
                });
            } else if (selector.indexOf('pane-info') > -1 && !$tooltipContent.find('#tab-info').data('loaded')) {
                // on initial load, do not call adjust since it is alreay being moved
                $tooltipContent.find('#tab-info').data('loaded', true);
            } else {
                MA.Map.InfoBubble.adjust();
            }
        }

        // this takes care of the case where the default tooltip tab is set as related list but no related list is set up in the layer. In this case it defaults to the info tab
        if (queryMetaData.advancedOptions.defaultLiveTab == 'relatedlist' && queryMetaData.options.relatedListCount <= 0) {
            queryMetaData.advancedOptions.defaultLiveTab = 'info';
        }

        if (/^live$/i.test(layerType)) // KW - removed .trim()
        {
            $tooltipContent.find('.tabs').tabs({
                active: queryMetaData.advancedOptions ? $tooltipContent.find('#tab-' + (queryMetaData.advancedOptions.defaultLiveTab || 'live')).index() : 0,
                create: tabCreateActivate,
                activate: tabCreateActivate
            });
        }
        else {
            $tooltipContent.find('.tabs').tabs({
                active: queryMetaData.advancedOptions ? $tooltipContent.find('#tab-' + (queryMetaData.advancedOptions.defaultTab || 'info')).index() : 0,
                create: tabCreateActivate,
                activate: tabCreateActivate
            });
        }



        // activate device tab contents if applicable
        if (/live/i.test(layerType)) {
            var device = getProperty(record, 'device');
            if (device instanceof MADevice) { 
                /******
                 *  Live Tab
                 *********/
                // since live tab loads on default, treat the info tab as loaded
                $tooltipContent.find('#tab-info').data('loaded', true);
                var DataNotAvailableText = 'Data Not Available';
                var deviceId = getProperty(record, 'device.deviceId', false);

                // Converts speed to user settings units for distance.
                var formatSpeed = function (speedInMilesPerHour) {
                    var formattedSpeed = null;

                    if (isNum(speedInMilesPerHour)) {
                        // convert from miles/h to user setting units
                        var userSettingsUnits = String(getProperty(userSettings || {}, 'RouteDefaults.unit', false) || 'mi').toUpperCase();
                        var convertedSpeed = speedInMilesPerHour * unitFactors['MILES'][userSettingsUnits];

                        if (isNum(convertedSpeed)) {
                            formattedSpeed = Number(convertedSpeed).toFixed(2);
                        }
                    }

                    return formattedSpeed;
                }

                // Converts odometer to user settings units for distance.
                var formatOdometer = function (odometer) {
                    var formattedOdometer = NaN;

                    if (isNum(odometer)) {
                        var userSettingsUnits = String(getProperty(userSettings || {}, 'RouteDefaults.unit', false) || 'mi').toUpperCase();
                        var convertedOdometer = odometer * unitFactors['MILES'][userSettingsUnits];
                        formattedOdometer = Number(convertedOdometer).toFixed(2);
                    }

                    return formattedOdometer;
                }

                var timezoneId = MASystem.User.timezoneId;
                var dateFormat = getProperty(MASystem, 'User.dateFormat').toUpperCase();
                var timeFormat = getProperty(MASystem, 'User.timeFormat');

                MAPlotting.getLatestLiveData(deviceId)
                    .then(function (response) {
                        var latestDeviceData = response.data.positions[0];
                        // retrieve table values from device
                        var deviceSpeed = latestDeviceData.speed ? formatSpeed(latestDeviceData.speed.value) : DataNotAvailableText; // speed converted to current user setting and 2 decimal places
                        var deviceDirection = latestDeviceData.heading ? latestDeviceData.heading.value : DataNotAvailableText;
                        var deviceOdometer = latestDeviceData.odometer ? formatOdometer(latestDeviceData.odometer.value) : DataNotAvailableText;
                        var reportDate = latestDeviceData.lastEventTime ? moment(latestDeviceData.lastEventTime.value).tz(timezoneId).format(dateFormat) : DataNotAvailableText;
                        var reportTime = latestDeviceData.lastEventTime.value ? moment(latestDeviceData.lastEventTime.value).tz(timezoneId).format(timeFormat) : DataNotAvailableText;
                        var deviceFormattedTimezone = (latestDeviceData.timezone && latestDeviceData.timezone.value && latestDeviceData.timezone.value.shortName) ? latestDeviceData.timezone.value.shortName : DataNotAvailableText;
                        var $liveInfoDiv = $tooltipContent.find('.live-info');

                        // to display on tooltip Live tab                    
                        var infoRequired = {
                            'Report Date': { value: reportDate },
                            'Report Time': { value: reportTime },
                            'Time Zone of Device': { value: deviceFormattedTimezone },
                            'Direction': { value: deviceDirection },
                            'Speed': { value: deviceSpeed },
                            'Odometer': { value: deviceOdometer }
                        };

                        // create and display device info table
                        var liveTableHTML = MAPlotting.create2DTableHTML({ data: infoRequired });
                        $liveInfoDiv.html(liveTableHTML);
                        $liveInfoDiv.show();

                        MA.Map.InfoBubble.adjust();

                        // calculate ETA and update infobubble with the info
                        $tooltipContent.find('.live-record-eta').each(function (el, i) {
                            var $tooltipETARowData = $(this);
                            var $etaTableDataElement = $tooltipETARowData.closest('td');

                            var eta;

                            MAPlotting.getLiveRecordETA(record, queryMetaData).then(function (etaResp) {
                                clearTimeout(timeOut);

                                if (etaResp && etaResp.success) {
                                    var result = etaResp.result || {};
                                    var etaMilliseconds = result.eta * unitFactors[String(result.units).trim().toUpperCase()]['SECONDS'] * unitFactors['SECONDS']['MILLISECONDS'];
                                    var etaString = MAPlotting.millisecondsToTime(etaMilliseconds);

                                    if (etaString && typeof etaString == 'string' && String(etaString).trim() != '') {
                                        eta = etaString.trim();
                                    }
                                }

                                $etaTableDataElement.empty().text(eta || DataNotAvailableText);
                                MA.Map.InfoBubble.adjust();
                            });

                            // update ETA with DATA NOT AVAILABLE if eta is not retreived within 10 seconds. If eta is retreived after 10 seconds, eta field will still be updated
                            var timeOut = setTimeout(function () {
                                $etaTableDataElement.empty().text(DataNotAvailableText);
                                MA.Map.InfoBubble.adjust();
                            }, 10000);
                        });
                    })
                    .fail(function (e) {
                        MAToastMessages.showError({ message: 'Error retrieving latest data for this asset.', timeOut: 6000 })
                    });

                /******
                 *  Device History Tab
                 *********/

                // setup and activate device history inputs
                var $deviceHistoryInputs = $tooltipContent.find('.device-history-input');
                var $deviceHistoryDayInput = $deviceHistoryInputs.find('.live-day-input .date-input,.date-input-enddate');

                var timezoneId = getProperty(MASystem, 'User.timezoneId');
                var twoYearsAgo;

                try {
                    twoYearsAgo = moment(new Date().getTime()).tz(timezoneId).subtract(2, 'years').toDate();
                } catch (e) {
                    twoYearsAgo = new Date(new Date().getTime() - (365 * 2 * 24 * 60 * 60 * 1000));
                }

                //setup up date input calendar widget and it's default date
                $deviceHistoryDayInput.each(function (index) {
                    var clickHandler;
                    var isShown = false;


                    $(this)
                        .datepicker({
                            dateFormat: formatUserLocaleDate({ datepicker: true }),
                            changeYear: true,
                            onClose: function () {
                                isShown = false;
                                document.body.removeEventListener('click', clickHandler, true);
                                document.body.removeEventListener('wheel', clickHandler, true);
                            }
                        })
                        .datepicker("option", "minDate", twoYearsAgo)
                        .datepicker("option", "maxDate", new Date().getTime())
                        .bind('focus', function () {
                            if (isShown) return;

                            var self = this;
                            clickHandler = function (e) {
                                if (e.target === self || $(e.target).parents('#ui-datepicker-div').length) return;
                                $(self).datepicker('hide');
                                $(self).blur(); // trigger removal of event listeners
                            }

                            isShown = true;
                            document.body.addEventListener('click', clickHandler, true);
                            document.body.addEventListener('wheel', clickHandler, true); // Fix to hide calendar selector on wheel/scroll movement.
                        });
                    $(this).val(moment.tz(timezoneId).format(dateFormat));
                });

                var $deviceHistoryStartTimeInput = $deviceHistoryInputs.find('.live-starttime');
                var $deviceHistoryEndTimeInput = $deviceHistoryInputs.find('.live-endtime');
                var $deviceHistoryTimezoneInput = $deviceHistoryInputs.find('.live-time-zone');

                var defaultStartTime = '12:00 AM';
                var defaultEndTime = '11:59 PM';

                // set default time ranges
                $deviceHistoryStartTimeInput.each(function (index) {
                    $(this).val(defaultStartTime);

                    // if 12 hour didn't populate, html5 time input is supported so set defaults in 24-hour formats and try again.
                    if ($(this).val().trim() == '') {
                        defaultStartTime = '00:00';
                        defaultEndTime = '23:59';
                    }

                    $(this).val(defaultStartTime);
                });

                $deviceHistoryEndTimeInput.each(function () {
                    $(this).val(defaultEndTime);
                });


                // populate timezone picklist
                var timezoneList = getProperty(MASystem, 'Organization.timeZoneList');

                if (Array.isArray(timezoneList)) {
                    for (var i = 0; i < timezoneList.length; i++) {
                        var tz = timezoneList[i];

                        if (typeof tz == 'object') {
                            var tzLabel = tz.label;
                            var tzValue = tz.value;

                            if (tzLabel && tzValue) {
                                var option = $('<option></option>');
                                if (tzValue == timezoneId) {
                                    option.attr({ 'value': String(tzValue).trim(), 'selected': 'selected' }).text(tzLabel);
                                } else {
                                    option.attr({ 'value': String(tzValue).trim() }).text(tzLabel);
                                }

                                $deviceHistoryTimezoneInput.append(option);
                            }
                        }
                    }
                }

                // timezone input - make it a jquery ui select 2 widget
                $deviceHistoryTimezoneInput.select2({ dropdownAutoWidth: true, width: '100%' });

                // adjust tooltip size to fit timezone length when a timezone is selected
                $deviceHistoryTimezoneInput.on('select2:select', function (evt) {
                    MA.Map.InfoBubble.adjust();
                });

                // display device history input ui
                $deviceHistoryInputs.show();

                // default to selected point density to 100%
                $deviceHistoryInputs.find('.live-point-density').eq(0).find('option').attr('selected', false);
                $deviceHistoryInputs.find('.live-point-density').eq(0).find('option[value="100"]').attr('selected', 'selected');

                // setup and activate device history action buttons
                var $deviceHistoryButtons = $tooltipContent.find('.device-history-buttons');
                $deviceHistoryButtons.find('.device-history-button').each(function (index) {
                    $(this).click(function liveInfoButtonClick(event) {
                        $tooltipContent.find('.live-input').prop("disabled", true);
                        MAPlotting.liveButtonHandler(this, event, $plottedQuery, marker);
                        $tooltipContent.find('.live-input').prop("disabled", false);
                    });
                });

                $deviceHistoryButtons.show();

                // Live Tracking History Layer toggle...
                var $deviceHistoryInput = $tooltipContent.find('.device-history-input');

                $deviceHistoryInput.find('.view-full-history').each(function (index) {
                    $(this).click(function () {
                        MAPlotting.toggleLiveTrackingHistorySidebar(this);
                    });
                });

                // set default color
                $tooltipContent.find('input#cor1').prop('checked', true);
                $tooltipContent.find('label.cor1').addClass('colorIsChecked');

                $tooltipContent.find('.live-history-color label').on('click', function (event, ui) {
                    if ($(this).hasClass('cor1')) { } else {
                        $tooltipContent.find('label.cor1').css({ 'background-image': 'none' });
                        $tooltipContent.find('label.cor1').removeClass('colorIsChecked');
                    }
                });
            }
        }

        //build actions layout using the button set settings
        if (userSettings.ButtonSetSettings && userSettings.ButtonSetSettings.tooltipLayout) {
            $tooltipContent.find('.layout-tooltip').html(
                MAActionFramework.buildLayoutFromContentsV2(userSettings.ButtonSetSettings.tooltipLayout, {
                    queryMetadata: queryMetaData,
                    record: record,
                    markerType: options.markerType
                })
            );

            if (marker.layerType === 'waypoint-marker') {
                //(Bagley) Update MAP-2385 Remove Marker disabled for Waypoint Markers
                $tooltipContent.find('.layout-tooltip .actionbutton[data-action="Remove Marker"]').addClass("disabled");
            }
        }

        var deskTopCheckIn = getProperty(MASystem, 'Organization.CheckInAllDevicesEnabled', false) || false;
        if (deskTopCheckIn) {
            var tasks = [];
            var events = [];
            try {
                tasks = record.Tasks || [];
            } catch (e) { }
            try {
                events = record.Events || [];
            } catch (e) { }
            if (tasks.length > 0) {
                $.each(tasks, function (index, task) {
                    if (!task.IsClosed) {
                        var $actionButton = $tooltipContent.find('.actionbutton[data-action="Check In"]');
                        var $listButton = $('#markerActionSheet').find('.actionbutton[data-action="Check In"]');
                        $actionButton.data('CheckInId', task.Id).attr('data-action', 'Check Out').text(MASystem.Labels.MAActionFramework_Check_Out);
                        $listButton.data('CheckInId', task.Id).attr('data-action', 'Check Out').text(MASystem.Labels.MAActionFramework_Check_Out);
                        return false;
                    }
                });
            }
            if (events.length > 0) {
                $.each(events, function (index, event) {
                    if (event.Subject.indexOf('Check In @') == 0) {
                        var $actionButton = $tooltipContent.find('.actionbutton[data-action="Check In"]');
                        var $listButton = $('#markerActionSheet').find('.actionbutton[data-action="Check In"]');
                        $actionButton.data('CheckInId', event.Id).attr('data-action', 'Check Out').text(MASystem.Labels.MAActionFramework_Check_Out);
                        $listButton.data('CheckInId', event.Id).attr('data-action', 'Check Out').text(MASystem.Labels.MAActionFramework_Check_Out);
                        return false;
                    }
                });
            }
        }
        else {
            //remove check in/out buttons
            $tooltipContent.find('.actionbutton[data-action="Check In"]').remove();
            $tooltipContent.find('.actionbutton[data-action="Check Out"]').remove();
        }

        //store the record info for action button use
        $tooltipContent.data('recordInfo', recordInfo);

        $tooltipContent.find('.layout-tooltip .actionbutton').each(function () {
            var $button = $(this);
            var frameworkAction = $button.attr('data-type') == 'Custom Action'
                ? MAActionFramework.customActions[$button.attr('data-action')] || null
                : MAActionFramework.standardActions[$button.attr('data-action')] || null;

            if (frameworkAction) {
                if (frameworkAction.events && frameworkAction.events['ready']) {
                    $.each(frameworkAction.events['ready'], function (index, method) {
                        method.call(this, {
                            button: $button,
                            record: record,
                            marker: record.marker,
                            mode: 'Desktop'
                        });
                    });
                }
            }
        });

        $tooltipContent.find('.tooltip-row').each(function () {
            $(this).data('saveTimeouts', []);
        });

        //handle clicking links in tooltips (need to stop propagation so the links will fire instead of editing the tooltip)
        $tooltipContent.on('click', '.tooltip-row td.value a', function (e) {
            e.stopPropagation();
        });

        $tooltipContent.on('click', function (e) {
            $('html').click();
        });

        // this is a house of cards... continue forward carefully
        $tooltipContent.on('blur', '.tooltip-row td.value.editable', function () {
            var $tooltipRow = $(this).closest('.tooltip-row');
            var tooltipMetadata = queryMetaData.tooltips[$tooltipRow.index() + 1];
            var $valueCell = $(this);
            var editType = displayTypeMetadata[tooltipMetadata.DisplayType] ? displayTypeMetadata[tooltipMetadata.DisplayType].editType : '';
            var renderType = displayTypeMetadata[tooltipMetadata.DisplayType] ? displayTypeMetadata[tooltipMetadata.DisplayType].renderType : '';
            var fieldValue = record.tooltips[$tooltipRow.index() + 1].rawValue;
            if (tooltipMetadata.needsLink) {
                editType = 'reference';
                renderType = 'html';
            }

            switch (editType) {
                case 'time':
                    if (fieldValue != '') {
                        var displayValue = moment.tz(fieldValue, 'x', 'GMT').format('HH:mm');
                    } else {
                        var displayValue = '';
                    }

                    $valueCell.html("<input type='time' class='time timepicker' value='" + displayValue + "' />").find('input').data('originalValue', moment(displayValue, 'HH:mm').format('hh:mm a') + '').focus().blur(function () {
                        $valueCell.removeClass('editing').addClass('editable');

                        if (renderType == 'html') {
                            $tooltipRow.find('td.value').html(record.tooltips[$tooltipRow.index() + 1].formattedValue || '');
                        } else {
                            $tooltipRow.find('td.value').text(record.tooltips[$tooltipRow.index() + 1].formattedValue || '');
                        }

                    });
                    break;
            }

        });




        //handle clicking to edit tooltips
        $tooltipContent.on('click', '.tooltip-row td.value.editable', function () {
            //close any existing picklist fields by clicking the html element
            $('html').click();
            var $tooltipRow = $(this).closest('.tooltip-row');
            var tooltipMetadata = queryMetaData.tooltips[$tooltipRow.index() + 1];
            var $valueCell = $(this).removeClass('editable').addClass('editing');
            //var fieldValue = extractValue(record.record, tooltipMetadata.ActualFieldName);
            var editType = displayTypeMetadata[tooltipMetadata.DisplayType] ? displayTypeMetadata[tooltipMetadata.DisplayType].editType : '';
            var renderType = displayTypeMetadata[tooltipMetadata.DisplayType] ? displayTypeMetadata[tooltipMetadata.DisplayType].renderType : '';
            var fieldValue = record.tooltips[$tooltipRow.index() + 1].rawValue;
            if (tooltipMetadata.needsLink) {
                editType = 'reference';
                renderType = 'html';
            }
            switch (editType) {
                case 'string':

                    $valueCell.html("<input type='text' value='" + fieldValue + "' />").find('input').data('originalValue', fieldValue + '').focus().blur(function () {
                        $valueCell.removeClass('editing').addClass('editable');
                        if (renderType == 'html') {
                            $tooltipRow.find('td.value').html(formatTooltip(record, tooltipMetadata) || '');
                        }
                        else {
                            $tooltipRow.find('td.value').html(formatTooltip(record, tooltipMetadata) || '');
                        }
                    });
                    break;

                case 'number':

                    $valueCell.html("<input type='text' value='" + fieldValue + "' />").find('input').data('originalValue', fieldValue + '').focus().blur(function () {
                        $valueCell.removeClass('editing').addClass('editable');
                        if (renderType == 'html') {
                            $tooltipRow.find('td.value').html(formatTooltip(record, tooltipMetadata) || '');
                        }
                        else {
                            $tooltipRow.find('td.value').html(formatTooltip(record, tooltipMetadata) || '');
                        }
                    });
                    break;
                case 'time':
                    var displayValue = moment.tz(fieldValue, 'x', 'GMT').format('HH:mm');

                    $valueCell.html("<input type='time' class='time timepicker' value='" + displayValue + "' />").find('input').data('originalValue', moment(displayValue, 'HH:mm').format('hh:mm a') + '').focus().blur(function () {
                        $valueCell.removeClass('editing').addClass('editable');

                        if (fieldValue != '') {
                            if (renderType == 'html') {
                                $tooltipRow.find('td.value').html(record.tooltips[$tooltipRow.index() + 1].formattedValue || '');
                            } else {
                                $tooltipRow.find('td.value').html(record.tooltips[$tooltipRow.index() + 1].formattedValue || '');
                            }
                        }
                    });
                    break;
                case 'textarea':
                    $valueCell.html($("<textarea />").val($valueCell.text()).width($valueCell.width() + 'px')).find('textarea').data('originalValue', fieldValue + '').focus().select().blur(function () {
                        $valueCell.removeClass('editing').addClass('editable');
                        MA.Map.InfoBubble.adjust();
                        if (renderType == 'html') {
                            $tooltipRow.find('td.value').html(formatTooltip(record, tooltipMetadata) || '');
                        }
                        else {
                            $tooltipRow.find('td.value').html(formatTooltip(record, tooltipMetadata) || '');
                        }
                    });
                    break;

                case 'picklist':

                    // var $picklistOptions = $('<select class="combobox" />');
                    var picklistOptions = document.createElement('select');
                    picklistOptions.setAttribute('class', 'combobox')
                    for (var i = 0; i < tooltipMetadata.PicklistOptions.length; i += 1) {
                        var option = tooltipMetadata.PicklistOptions[i];
                        var opt = document.createElement('option');
                        opt.value = option.value;
                        opt.innerHTML = htmlEncode(option.label);
                        picklistOptions.appendChild(opt);
                    }
                    var $select = $valueCell.html(picklistOptions).find('.combobox');
                    $select.val(htmlDecode(fieldValue));
                    $select.select2().next().click(function () { return false; }).find('input').data('originalValue', fieldValue + '').focus().select();

                    $('html').on('click', function () {
                        $tooltipRow.find('.combobox').select2('close');
                        $tooltipRow.find('.combobox').blur();
                        $valueCell.removeClass('editing').addClass('editable');
                        if (renderType == 'html') {
                            $tooltipRow.find('td.value').html(formatTooltip(record, tooltipMetadata) || '');
                        }
                        else {
                            $tooltipRow.find('td.value').html(formatTooltip(record, tooltipMetadata) || '');
                        }
                        $('html').off('click');
                    });
                    break;

                case 'multipicklist':

                    var $picklistOptions = $('<select class="multiselect" multiple="multiple"/>');
                    $.each(tooltipMetadata.describe.picklistValues, function (index, option) {
                        $picklistOptions.append($('<option />').attr('value', option.value).text(option.label).attr('selected', (';' + fieldValue + ';').indexOf(option.value) != -1).prop('checked', (';' + fieldValue + ';').indexOf(option.value) != -1));
                    });

                    $valueCell.html($picklistOptions).find('.multiselect').multiselect({
                        noneSelectedText: 'Click here to select options',
                        selectedList: 2,
                        close: function () {
                            $('html').click();
                        }
                    }).multiselectfilter().multiselect('widget').click(function (e) { e.stopPropagation(); });
                    $('html').on('click', function () {

                        //save
                        $picklistOptions.data('newValue', $picklistOptions.multiselect('getChecked').map(function () {
                            return this.value;
                        }).get().join(';')).change();

                        $valueCell.removeClass('editing').addClass('editable');
                        if (renderType == 'html') {
                            $tooltipRow.find('td.value').html(formatTooltip(record, tooltipMetadata) || '');
                        }
                        else {
                            $tooltipRow.find('td.value').html(formatTooltip(record, tooltipMetadata) || '');
                        }
                        $('html').off('click');
                    });
                    break;

                case 'boolean':

                    $valueCell.html($("<input type='checkbox' />").prop('checked', $valueCell.text().toLowerCase() == 'true')).find('input').click(function (e) { e.stopPropagation(); }).data('originalValue', fieldValue).focus();

                    $('html').on('click', function () {
                        $valueCell.removeClass('editing').addClass('editable');
                        if (renderType == 'html') {
                            $tooltipRow.find('td.value').html(formatTooltip(record, tooltipMetadata) || '');
                        }
                        else {
                            $tooltipRow.find('td.value').html(formatTooltip(record, tooltipMetadata) || '');
                        }
                        $('html').off('click');
                    });
                    break;

                case 'date':
                    ////////////////////////Format Date Locale ///////////////////////////////
                    var formatedDate = formatUserLocaleDate({ datepicker: true });
                    ////////////////////////Format Date Locale ///////////////////////////////

                    $valueCell.html($("<input type='text' class='date' />").val($valueCell.text())).find('input').datepicker({ dateFormat: "" + formatedDate + "" }).focus().click(function (e) { e.stopPropagation(); });

                    //modified to not hide datepicker on month change
                    $('html').on('click', function (e) {
                        //if click on datepicker, do not hide
                        if ($(e.target).is('[class^="ui-datepicker"]') == true || $(e.target).is('[class^="ui-icon"]') == true) {
                            return false;
                        }
                        $('#ui-datepicker-div').hide();
                        $valueCell.removeClass('editing').addClass('editable');
                        var formattedValue = formatTooltip(record, tooltipMetadata) || '';
                        formattedValue = formattedValue.toLowerCase() == 'invalid date' ? '' : formattedValue;
                        if (renderType == 'html') {
                            $tooltipRow.find('td.value').html(formattedValue || '');
                        }
                        else {
                            $tooltipRow.find('td.value').text(formattedValue || '');
                        }
                        $('html').off('click');
                    });


                    break;

                case 'datetime':
                    ////////////////////////Format Date Locale ///////////////////////////////
                    var formatedDate = formatUserLocaleDate({ datepicker: true });
                    ////////////////////////Format Date Locale ///////////////////////////////

                    $valueCell.html($("<input type='text' class='datetime' />").val($valueCell.text())).find('input').datepicker({ dateFormat: "" + formatedDate + "" }).focus().click(function (e) { e.stopPropagation(); });

                    //modified to not hide datepicker on month change
                    $('html').on('click', function (e) {
                        //if click on datepicker, do not hide
                        if ($(e.target).is('[class^="ui-datepicker"]') == true || $(e.target).is('[class^="ui-icon"]') == true) {
                            return false;
                        }
                        $('#ui-datepicker-div').hide();
                        $valueCell.removeClass('editing').addClass('editable');
                        var formattedValue = formatTooltip(record, tooltipMetadata) || '';
                        formattedValue = formattedValue.toLowerCase() == 'invalid date' ? '' : formattedValue;
                        if (renderType == 'html') {
                            $tooltipRow.find('td.value').html(formattedValue || '');
                        }
                        else {
                            $tooltipRow.find('td.value').text(formattedValue || '');
                        }
                        $('html').off('click');
                    });


                    break;

                case 'reference':

                    var $lookupWrapper = $('<div class="autocomplete-wrapper"><input type="text" class="autocomplete" /><div class="autocomplete-clear">x</div></div>')
                    var $lookup = $lookupWrapper.find('input');
                    $valueCell.html($lookupWrapper).find('input').click(function (e) { e.stopPropagation(); }).focus().data('originalValue', fieldValue);
                    $valueCell.find('.autocomplete-clear').click(function (e) { $lookup.data('selectedItem', { value: '', label: '' }); });

                    $lookup.autocomplete({
                        focus: function (event, ui) {
                            $lookup.val(ui.item.label);
                            return false;
                        },
                        select: function (event, ui) {
                            $lookup.val(ui.item.label).data('selectedItem', ui.item);
                            event.stopPropagation();
                            return false;
                        },
                        search: function () {
                            $lookup.addClass('searching');
                        },
                        source: function (request, response) {
                            var searchOpt = {
                                baseObject: tooltipMetadata.BaseObject,
                                fieldName: tooltipMetadata.updateField,
                                searchTerm: request.term
                            };

                            getLookupOptions(searchOpt).then(function (options) {
                                response(options);
                            }).fail(function (err) {
                                console.warn(err);
                                response([]);
                            }).always(function () {
                                $lookup.removeClass('searching');
                            });
                        }
                    });

                    $('html, #tooltip-content').on('click', function () {
                        var $inputField = $valueCell.find('input');
                        if ($inputField.data('selectedItem') && $inputField.data('selectedItem').value != $inputField.data('originalValue')) {
                            $inputField.change();
                        }

                        $valueCell.removeClass('editing').addClass('editable');
                        if (renderType == 'html') {
                            $tooltipRow.find('td.value').html(formatTooltip(record, tooltipMetadata) || '');
                        }
                        else {
                            $tooltipRow.find('td.value').text(formatTooltip(record, tooltipMetadata) || '');
                        }
                        // $('html, #tooltip-content').off('click');
                    });
                    break;

                default:

                    //no matching type so do nothing
                    $valueCell.removeClass('editing').addClass('editable');
                    return;
            }

            //handle pressing tab or enter on an input
            $valueCell.find('input, textarea').keydown(function (e) {
                if (e.keyCode == 9) {

                    //find the next element that we want to move focus to by moving forward or backward through the tooltip rows and looking for an editable value
                    var $nextTooltipRow = $(this).closest('.tooltip-row');
                    var $nextElement;
                    while ($nextTooltipRow.length > 0) {
                        $nextTooltipRow = e.shiftKey ? $nextTooltipRow.prev() : $nextTooltipRow.next();
                        $nextElement = $nextTooltipRow.find('td.value.editable');
                        if ($nextElement.length > 0) {
                            break;
                        }
                    }

                    //fire the change event if the user has changed the value
                    var inputValue = $(this).is('[type="checkbox"]') ? $(this).is(':checked') : $(this).val();
                    if ($(this).data('originalValue') != inputValue) {
                        $(this).change();
                    }

                    //remove focus from this element and click the next one
                    $(this).blur();
                    $('html').click();
                    $nextElement.click();

                    //cancel the default behavior
                    return false;
                }
                else if (e.keyCode == 32 && $(this).is('[type="checkbox"]')) {
                    $(this).prop('checked', !$(this).is(':checked'));
                    return false;
                }
            });
            $valueCell.find('input, textarea').keypress(function (e) {
                if (e.keyCode == 13) {

                    //fire the change event if the user has changed the value
                    var inputValue = $(this).is('[type="checkbox"]') ? $(this).is(':checked') : $(this).val();
                    if ($(this).data('originalValue') != inputValue) {
                        $(this).change();
                    }

                    //remove focus from this element
                    $(this).blur();
                    $('html').click();
                }
            });

            return false;

        });

        //handle actually editing tooltips
        $tooltipContent.on('change', '.tooltip-row td.value.editing input, .tooltip-row td.value.editing textarea, .tooltip-row td.value.editing select', function () {
            //gather some basic info about the input field, the tooltip row, and the metadata we have for this tooltip
            var $inputField = $(this);
            var $tooltipRow = $inputField.closest('.tooltip-row').addClass('saving').removeClass('error');
            var tooltipMetadata = queryMetaData.tooltips[$tooltipRow.index() + 1];

            //figure out the current value of this field based on the type
            var inputValue = '';
            var inputValueName = '';
            if ($inputField.is('[type="checkbox"]')) {
                inputValue = $inputField.is(':checked');
            }
            else if ($inputField.is('.autocomplete')) {
                try {
                    inputValue = $inputField.data('selectedItem').value;
                    inputValueName = $inputField.data('selectedItem').label;

                    //remove the selected item to avoid future searching from being considered a valid change
                    $inputField.data('selectedItem', null);
                }
                catch (err) {
                    //this failure means that the value has not yet been selected and this is part of the search function.  do nothing in this case
                    $tooltipRow.removeClass('saving');
                    return false;
                }
            }
            else if ($inputField.is('.multiselect')) {
                //for a multiselect, a single selection shouldn't trigger an update so wait until we have a new value (assigned by the html click handler for this type)
                if (!$inputField.data('newValue')) {
                    $tooltipRow.removeClass('saving');
                    return false;
                }
                else {
                    inputValue = $inputField.data('newValue');
                    $inputField.data('newValue', null);
                }
            }
            else if ($inputField.is('.datetime')) {
                inputValue = $inputField.val();
                //set proper save date format
                var dateformat = formatUserLocaleDate({ moment: true });
                //update inputValue with date and time to match user selected locale
                inputValue = moment(inputValue, dateformat).format(dateformat);
                if (inputValue === 'Invalid date') {
                    inputValue = "";
                }
            }
            else if ($inputField.is('.time')) {
                var normalTime = moment($inputField.val(), 'HH:mm').format('hh:mm a');
                var momentTime = moment(normalTime, 'hh:mm a');
                var militaryTime = moment($inputField.val(), 'HH:mm');
                inputValue = momentTime._a[1] + "/" + momentTime._a[2] + "/" + momentTime._a[0] + " " + momentTime._i;
            }
            else {
                inputValue = $inputField.val();
                if (MA.Util.isNumber(inputValue)) {
                    inputValue = MA.Util.parseNumberString(inputValue);
                }
            }

            //clear any existing save timeouts for this field
            var saveTimeouts = $tooltipRow.data('saveTimeouts');
            $.each(saveTimeouts, function (index, saveTimeout) {

                try {
                    clearTimeout(saveTimeout);
                    while ($.inArray(saveTimeout, saveTimeouts) != -1) {
                        saveTimeouts.splice($.inArray(saveTimeout, saveTimeouts));
                    }
                }
                catch (err) { }

            });

            //set a timeout to save this field
            var saveTimeout = setTimeout(function () {
                var updateField = tooltipMetadata.updateField || tooltipMetadata.FieldName;
                var processData = {
                    ajaxResource: 'MATooltipAJAXResources',
                    action: 'save_tooltip',
                    recordId: record.record.Id,
                    fieldName: updateField,
                    newValue: inputValue
                };
                Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                    processData,
                    function (response, event) {
                        if (event.status) {

                            if (!response.success) {
                                $tooltipRow.removeClass('saving');
                                MAToastMessages.showError({ message: response.error, timeOut: 0, extendedTimeOut: 0 });
                                MA.Map.InfoBubble.adjust();
                                return;
                            }
                            //update the underlying record (and the name field of the related object if this is a reference field)
                            var saveValue = getProperty(response.updatedRecord, updateField);
                            //do some formatting for dates
                            if (tooltipMetadata.describe.soapType.indexOf('date') >= 0) {
                                //convert to unix
                                saveValue = saveValue == undefined ? '' : moment(saveValue).valueOf();
                            } else if (queryMetaData.tooltips[$tooltipRow.index() + 1].soapType.indexOf('TIME') >= 0) {
                                saveValue = saveValue == undefined ? '' : moment(saveValue, 'hh:mm a');
                            }
                            //update the actual field
                            updateValue(record, tooltipMetadata.FieldName, saveValue);
                            var formattedValue = formatTooltip(record, tooltipMetadata) || inputValueName;

                            if (saveValue === undefined || saveValue === '') {
                                saveValue = '';
                                formattedValue = '';
                            }

                            if ($inputField.is('.autocomplete')) {
                                //update the lookup
                                updateValue(record, tooltipMetadata.updateField, saveValue);
                                updateValue(record, tooltipMetadata.ActualFieldName, inputValueName);
                                formattedValue = formatTooltip(record, tooltipMetadata) || inputValueName;
                            } else if ($inputField.is('.time')) {
                                timeInHours = moment(saveValue, 'HH:mm:ss[.SSSZ]').format('hh:mm a');
                                calculatedTime = moment(timeInHours, MASystem.User.timeFormat).format('X') - moment('12:00 am', MASystem.User.timeFormat).format('X');
                                formattedValue = moment(saveValue, 'HH:mm:ss[.SSSZ]').format('hh:mm a');
                                saveValue = calculatedTime * 1000;
                                updateValue(record, tooltipMetadata.FieldName, saveValue);
                            }
                            var recordTooltips = record.tooltips;
                            recordTooltips[$tooltipRow.index() + 1] = {
                                rawValue: saveValue,
                                formattedValue: formattedValue
                            }

                            //update the displayed tooltip if we are no longer in edit mode
                            if (!$tooltipRow.find('td.value').is('.editing')) {
                                var renderType = displayTypeMetadata[tooltipMetadata.DisplayType].renderType;
                                if (tooltipMetadata.needsLink) {
                                    renderType = 'html';
                                }
                                if (renderType == 'html') {
                                    $tooltipRow.find('td.value').html(formattedValue);
                                }
                                else {
                                    $tooltipRow.find('td.value').text(htmlDecode(formattedValue));
                                }
                            }

                            //update the marker if this was a marker field
                            if (!$tooltipRow.is('.ToolTip')) {
                                // This function assumes the record was just updated with new information and hence automatically rerenders it's marker with the new info
                                MAPlotting.updatePlottedQueryMarkerRecordInfo(record);
                            }

                            //remove this timeout from the array of timeouts for this tooltip
                            while ($.inArray(saveTimeout, saveTimeouts) != -1) {
                                saveTimeouts.splice($.inArray(saveTimeout, saveTimeouts));
                            }

                            //if this was the last save timeout for this tooltip then we are no longer saving so remove the saving class
                            if (saveTimeouts.length == 0) {
                                $tooltipRow.removeClass('saving');
                                MA.Map.InfoBubble.adjust();
                            }
                        }
                        else if (event.type === 'exception') {
                            MA.log(event.message + ' :: ' + event.where);
                            $tooltipRow.addClass('error').find('img.error').attr('title', response.error);
                            return;
                        }
                        else {
                            MA.log(event.message);
                            $tooltipRow.addClass('error').find('img.error').attr('title', response.error);
                            return;
                        }
                    }, { buffer: false, escape: true, timeout: 120000 }
                );

            }, 1000);

            //store the timeout so it can be cleared later if needed
            $tooltipRow.data('saveTimeouts').push(saveTimeout);
        });

        $tooltipContent.find('label.cor1').click();
        $tooltipContent.find('input#cor1').prop('checked', true);

    },

    // @asynschronous
    /* live record eta is calculated between the most current location of the record's live device, and the address stored in the salesforce record */
    getLiveRecordETA: function getLiveRecordETAAliasAsync(record, queryData) {
        var $dfd = $.Deferred();

        try {
            if (typeof record == 'object' && typeof queryData == 'object') {
                var device = record.device;
                var addressFields = queryData.addressFields;

                if (device instanceof MADevice && typeof addressFields == 'object') {
                    var recordAddress = getRecordAddress(record, queryData) || {}; // gets the address as it is stored in the sfdc record (and not necessarily as the device's location)
                    var recordFormattedAddress = recordAddress.formattedAddress;

                    // var deviceAddress = getRecordAddress(record, {source:'device'}); // gets record from device, current location
                    var devicePosition = device.getPosition();

                    if (typeof recordFormattedAddress == 'string' && String(recordFormattedAddress).trim() != '' && typeof devicePosition == 'object') {
                        var origin = {
                            type: 'string',
                            value: recordFormattedAddress.trim(),
                        };

                        var destination = {
                            type: 'coordinates',
                            value: {
                                lat: devicePosition.lat,
                                lng: devicePosition.lng
                            },
                        };

                        var distanceMatrixRequest = {
                            origins: [origin],
                            destinations: [destination],
                        };

                        getDistanceMatrix(distanceMatrixRequest).then(function (res) {
                            if (res && res.success) {
                                var result = res.result || {};

                                $dfd.resolve({
                                    success: true, result: {
                                        eta: getProperty(result, 'row.duration_in_traffic.value'),
                                        units: 'seconds'
                                    }
                                });
                            }
                            else {
                                $dfd.resolve({ success: false, message: 'Distance Matrix error' });
                            }
                        });
                    }
                    else {
                        $dfd.resolve({ success: false, message: 'One of record or device position not found' });
                    }
                }
                else {
                    $dfd.resolve({ success: false, message: 'Missing device or record address fields' });
                }
            }
            else {
                $dfd.resolve({ success: false, message: 'Missing record or query data' });
            }
        }
        catch (e) {
            $dfd.resolve({ success: false, message: 'Error while calculating live record ETA', exception: e });
        }

        return $dfd.promise();
    },
    tooltipActionClick: function (button) {
        var $button = $(button);
        var $tooltipContent = $button.closest('#tooltip-content');
        //grab the record from the queryMetaData
        var record = $tooltipContent.data('recordInfo');
        var frameworkAction = $button.attr('data-type') == 'Custom Action'
            ? MAActionFramework.customActions[$button.attr('data-action')] || null
            : MAActionFramework.standardActions[$button.attr('data-action')] || null;

        if (frameworkAction) {
            switch (frameworkAction.Action) {
                case 'Iframe':

                    //get a component index from the action framework to make this tab unique and build the iframe url
                    var componentIndex = MAActionFramework.componentIndex++;
                    var iframeURL = frameworkAction.ActionValue
                        + (frameworkAction.ActionValue.indexOf('?') == -1 ? '?noparams' : '')
                        + '&Button=' + encodeURIComponent(frameworkAction.Label)
                        + '&RecordId=' + record.Id;

                    //build the new tab and the corresponding pane
                    var $newTab = $("<li id='CustomTab-" + componentIndex + "'><a href='#pane-customaction-" + componentIndex + "'>" + frameworkAction.Label + "</a> <span class='ui-icon ui-icon-close'>Remove Tab</span></li>");
                    var $newPane = $("<div id='pane-customaction-" + componentIndex + "'><iframe src='" + iframeURL + "' style='width: 100%; height: 100%;'></iframe></div>");

                    //append the tab and pane to the tooltip tabs and refresh
                    $('#tooltip-content').find('.ui-tabs-nav').append($newTab).closest('.tabs').append($newPane).tabs('refresh').find('#CustomTab-' + componentIndex + ' a').click();

                    //handle clicking the close button for this new tab
                    $newTab.css({ 'width': 'auto', 'padding-right': '5px' }).find('.ui-icon-close').css({ 'cursor': 'pointer', 'position': 'absolute', 'right': '0' }).click(function () {
                        if ($newTab.is('.ui-tabs-active')) {
                            $('#tooltip-content').find('.ui-tabs-nav > li:first-child a').click();
                        }

                        $newTab.remove();
                        $newPane.remove();
                    });
                    break;

                case 'NewWindow':
                    var options = {
                        recString: ''
                    };
                    if (frameworkAction.ActionValue.indexOf('{records}') >= 0) {
                        options.records = true;
                    }

                    var newURL = frameworkAction.ActionValue
                        + (frameworkAction.ActionValue.indexOf('?') == -1 ? '?noparams' : '')
                        + '&Button=' + encodeURIComponent(frameworkAction.Label)
                        + '&RecordId=' + record.record.Id;
                    if (frameworkAction.Options.method == 'GET') {
                        if (frameworkAction.Options.addRecords) {
                            newURL += '&' + frameworkAction.Options.paramName + '=' + record.Id;
                        }
                        window.open(newURL, 'Parent');
                        break;
                    }
                    else {
                        var postData = {};
                        if (frameworkAction.Options.addRecords) {
                            postData[frameworkAction.Options.paramName] = record.Id;
                        }
                        openNewWindow('POST', newURL, postData, '_blank');
                        break;
                    }

                case 'Javascript':

                    frameworkAction.ActionValue.call(this, {
                        button: $button,
                        records: [record]
                    });
                    break;

                default:
                    break;
            }
        }

        //stop the click from getting to the map
        //e.stopPropagation();
    },

    getImageInfoForLegend: function (savedQueryRecord, qid) {
        var dfd = $.Deferred();
        var queryType = getProperty(savedQueryRecord, 'ColorAssignmentType__c', false);
        var MAIO_URL = getProperty(MASystem, 'Organization.MAIO_URL', false) || 'https://api.mapanything.io';
        var imagesToProcess = [];
        switch (queryType) {
            case 'Static':
                var iconColor = savedQueryRecord.IconColor__c;
                imagesToProcess.push(iconColor);
                break;
            case 'Dynamic-multiField':
                var assignmentOne = savedQueryRecord.ShapeAssignment__c;
                var assignmentTwo = savedQueryRecord.ColorAssignment__c;
                for (var i = 0, len = assignmentOne.length; i < len; i++) {
                    var rule = assignmentOne[i];
                    imagesToProcess.push('000000:' + rule.value);
                    // process color options for shape
                    for (var s = 0, lens = assignmentTwo.length; s < lens; s++) {
                        var shapeRule = assignmentTwo[s];
                        var markerValue = shapeRule.value + ':' + rule.value;
                        imagesToProcess.push(markerValue);
                    }
                }
                break;
            case 'Dynamic, Field':
                var colorAssignment = savedQueryRecord.ColorAssignment__c;
                for (var ii = 0, len = colorAssignment.length; ii < len; ii++) {
                    var rule = colorAssignment[ii];
                    imagesToProcess.push(rule.value);
                }
                break;
        }
        if (imagesToProcess.length > 0) {
            for (var g = 0; g < imagesToProcess.length; g++) {
                var imgIcon = imagesToProcess[g];
                var imageURL = '';
                var imgId = '';
                // preload our images
                if (imgIcon && imgIcon.indexOf('image:') === 0) {
                    var staticImageId = imgIcon.split('image:')[1];
                    imgId = staticImageId;
                    if(imgId.substring(0, 3) === '015') {
                        console.log('lets check out the id..');
                        console.log(imgId);
                        imageURL = MA.SitePrefix + '/servlet/servlet.FileDownload?file=' + staticImageId;
                    } else {
                        imageURL = MA.SitePrefix + '/sfc/servlet.shepherd/version/download/' + staticImageId;
                    }

                } else {
                    var colorParts = imgIcon.split(':');
                    var iconPart = colorParts[1] || 'Marker';
                    var iconColor = colorParts[0] || '3083d3';
                    iconColor = iconColor.replace(/#/g, '');
                    imgId = imgIcon;
                    imageURL = MAIO_URL + '/services/images/marker?color=' + iconColor + '&forlegend=false&icon=' + iconPart;
                }
                // if cached, skip
                if (imgLoaderDimensions[imgIcon] === undefined) {
                    var img = new Image();
                    img.imgId = imgId;
                    img.queryId = qid;
                    img.name = imageURL;
                    img.src = imageURL;
                    img.onload = imgLoaded;
                    img.onerror = imgError;
                    img.onabort = imgError;
                    imgLoaderCounts[qid] = (imgLoaderCounts[qid] || 0) + 1;
                }
            }
            var imgInterval = setInterval(function () {
                if ((imgLoaderCounts[qid] || 0) === 0) {
                    clearInterval(imgInterval);
                    dfd.resolve();
                }
            }, 200);
        } else {
            dfd.resolve();
        }
        return dfd.promise();
    },

    buildLegend: function (options) {
        var dfd = $.Deferred();
        options = $.extend({
            shapeAssignmentIsFirst: true,
            queryRecord: {},
            qid: '',
            legendFormatType: 'string',
            picklistMap: {},
        }, options || {});
        var legendHTML = '';
        var legendFormatType = options.legendFormatType;
        var imageArray = []; // since moving all markers to img server, need to pre load them as well.
        var legendCheckboxId;
        var legendMap = {};
        var picklistMap = options.picklistMap || {};
        var savedQueryRecord = MA.Util.removeNamespace(MA.getProperty(options.queryData, ['savedQueryRecord']), 'sma__'); // options.queryRecord;
        // format tooltips as object with field name as keys for easier access in the function
        var tooltips = {};
        (MA.getProperty(options.queryData, ['tooltips']) || []).forEach(function (tooltip, index) {
            tooltips[MA.getProperty(tooltip, ['FieldName'])] = tooltip;
            tooltips[MA.getProperty(tooltip, ['ActualFieldName'])] = tooltip;
        });


        // load our images before processing
        MAPlotting.getImageInfoForLegend(savedQueryRecord, options.qid).then(function () {
            if (savedQueryRecord.ColorAssignmentType__c == 'Static') {
                var imageId = '';
                var iconColor = savedQueryRecord.IconColor__c;
                if (iconColor && iconColor.indexOf('image:') === 0) {
                    var staticImageId = iconColor.split('image:')[1];
                    imageId = staticImageId;
                } else {
                    imageId = iconColor;
                }
                var imgInfo = imgLoaderDimensions[imageId] || {};
                var staticImage = '<img data-id="' + imageId + '" style="height:20px; max-width: 30px;"" class="legend-image" src="' + imgInfo.imgURL + '"/>';
                imageArray.push({ id: imageId, url: imgInfo.imgURL });
                //$plottedQuery.find('.color-box').replaceWith('<span style="font-size: 24px;vertical-align: middle;margin-right: 4px;color:#217AA6; display:none;" class="MAIcon ion-android-pin queryIcon"></span>');
                legendMap['lid0'] = {
                    count: 0,
                    active: true,
                    label: 'All',
                    legendId: 'lid0',
                    markerValue: iconColor,
                    icon: imgInfo.imgURL
                };
                legendCheckboxId = 'legend-checkbox' + MA.componentIndex++;
                if (MA.isMobile) {
                    legendHTML += $('#templates .legend-item.template').clone().removeClass('template').html()
                        .replace(/::legendCheckboxId::/g, legendCheckboxId)
                        .replace(/::dataRule::/g, '0')
                        .replace(/::Label::/g, 'All')
                        .replace(/::isAuto::/g, '')
                        .replace(/::OTHER::/g, '')
                        .replace(/::Marker::/g, staticImage);
                }
                else {
                    legendHTML += "<tr data-id='lid0' class='legend-row empty' style='display:none;'><td class='legend-checkbox-wrapper'><input type='checkbox' class='legend-checkbox' checked='checked' id='" + legendCheckboxId + "' data-rule='0' /><label for='" + legendCheckboxId + "'></label></td><td class='legend-text'>All</td><td class='visiblemarkers'>0</td><td class='of'>of</td><td class='totalmarkers'>0</td><td class='legend-color'>" + staticImage + "</td></tr>";
                }
            }
            else if (savedQueryRecord.ColorAssignmentType__c == 'Dynamic-Label') {
                // new feature. we have color assigments for dynamic label. process if existent.
                if (savedQueryRecord.ColorAssignment__c && String(savedQueryRecord.ColorAssignment__c).trim() != '') //
                {
                    processColorAssignentsForDynamicLabel();
                }
                else {// legacy support. process dynamic labels.
                    legendCheckboxId = 'legend-checkbox' + MA.componentIndex++;
                    var labelImage = '<span style="font-size: 16px;color: #A0A0A0;" class="MAIcon glyphicon-comment"></span>';

                    if (MA.isMobile) {
                        legendHTML += $('#templates .legend-item.template').clone().removeClass('template').html()
                            .replace(/::legendCheckboxId::/g, legendCheckboxId)
                            .replace(/::dataRule::/g, '0')
                            .replace(/::Label::/g, 'All')
                            .replace(/::isAuto::/g, '')
                            .replace(/::OTHER::/g, '')
                            .replace(/::Marker::/g, labelImage);
                    }
                    else {
                        legendHTML += "<tr data-id='lid0' class='legend-row empty' style='display:none;'><td class='legend-checkbox-wrapper'><input type='checkbox' class='legend-checkbox' checked='checked' id='" + legendCheckboxId + "' data-rule='0' /><label for='" + legendCheckboxId + "'></label></td><td class='legend-text'>All</td><td class='visiblemarkers'>0</td><td class='of'>of</td><td class='totalmarkers'>0</td><td class='legend-color'>" + labelImage + "</td></tr>";
                    }

                    legendMap['lid0'] = {
                        count: 0,
                        active: true,
                        label: 'All',
                        legendId: 'lid0',
                        markerValue: 'labelMarker',
                        icon: labelImage
                    };

                }
            }
            else if (savedQueryRecord.ColorAssignmentType__c == 'Dynamic-Order') {
                legendCheckboxId = 'legend-checkbox' + MA.componentIndex++;
                var orderImage = '<span style="font-size: 16px;color: #A0A0A0;" class="MAIcon ion-ios-infinite"></span>';
                if (MA.isMobile) {
                    legendHTML += $('#templates .legend-item.template').clone().removeClass('template').html()
                        .replace(/::legendCheckboxId::/g, legendCheckboxId)
                        .replace(/::dataRule::/g, '0')
                        .replace(/::Label::/g, 'All')
                        .replace(/::isAuto::/g, '')
                        .replace(/::OTHER::/g, '')
                        .replace(/::Marker::/g, orderImage);
                }
                else {
                    legendHTML += "<tr data-id='lid0' class='legend-row empty' style='display:none;'>\
                                        <td class='legend-checkbox-wrapper'>\
                                            <input type='checkbox' class='legend-checkbox' checked='checked' id='"+ legendCheckboxId + "' data-rule='0' />\
                                            <label for='"+ legendCheckboxId + "'></label>\
                                        </td>\
                                        <td class='legend-text'>All</td>\
                                        <td class='visiblemarkers'>0</td>\
                                        <td class='of'>of</td>\
                                        <td class='totalmarkers'>0</td>\
                                        <td class='legend-color'>"+ orderImage + "</td>\
                                    </tr>";
                }
                legendMap['lid0'] = {
                    count: 0,
                    active: true,
                    label: 'All',
                    legendId: 'lid0',
                    markerValue: 'orderMarker',
                    icon: orderImage
                };
            }
            else if (savedQueryRecord.ColorAssignmentType__c == 'Dynamic-multiField') {
                var assignmentOne = savedQueryRecord.ShapeAssignment__c;
                var assignmentTwo = savedQueryRecord.ColorAssignment__c;
                var assignmentOneIcon;
                var ruleIndex = 0;

                for (var i = 0, len = assignmentOne.length; i < len; i++) {
                    var rule = assignmentOne[i];
                    var legendLabel = '';
                    var defulatImgeId = '000000:' + rule.value;
                    var defaultImgInfo = imgLoaderDimensions[defulatImgeId] || {};
                    imageArray.push({ id: defulatImgeId, url: defaultImgInfo.imgURL });
                    assignmentOneIcon = '<img data-id="' + defulatImgeId + '" style="height:20px; max-width: 30px;"" class="legend-image" src="' + defaultImgInfo.imgURL + '"/>';
                    //start building a new legend row for this assignment based on field selection
                    if (rule.operator == 'currency') {
                        legendLabel = getCurrencyLegendLabel(rule, legendFormatType, savedQueryRecord);
                    }
                    else if (rule.comparedisplay != null) {
                        var legendLabelFormattedValue = picklistMap[rule.comparedisplay] || rule.comparedisplay;
                        legendLabel = htmlEncode(legendLabelFormattedValue);
                    }
                    else if (rule.operator == 'includes') {
                        if (rule.comparevalue == '<Other>') {
                            legendLabel = htmlEncode(rule.comparevalue);
                        }
                        else {
                            var results = rule.comparevalue.split('~~');
                            var resultArrCheck = [];
                            for (var r = 0; r < results.length; r++) {
                                var ruleCheck = results[r];
                                //try and grab the value from pick list options
                                ruleCheck = picklistMap[ruleCheck] || ruleCheck;
                                resultArrCheck.push(ruleCheck);
                            }

                            var toStringResults = String(resultArrCheck);
                            results = 'Includes ' + toStringResults + '';
                            legendLabel = htmlEncode(results);
                        }
                    }
                    else if (rule.operator == 'excludes') {
                        var eresults = rule.comparevalue.split('~~');
                        var eresultArrCheck = [];
                        for (var er = 0; er < results.length; er++) {
                            var eruleCheck = eresults[er];
                            //try and grab the value from pick list options
                            eruleCheck = picklistMap[eruleCheck] || eruleCheck;
                            eresultArrCheck.push(eruleCheck);
                        }

                        var etoStringResults = String(eresultArrCheck);
                        eresults = 'Excludes ' + etoStringResults + '';
                        legendLabel = htmlEncode(eresults);
                    }
                    else if (rule.operator == 'date') {
                        legendLabel = getDateLegendLabel(rule);
                    }
                    else {
                        var legendLabelFormattedValue2 = picklistMap[rule.comparevalue] || rule.comparevalue;
                        legendLabel = htmlEncode(legendLabelFormattedValue2);
                    }

                    //create header for multi legend section
                    var sectionID = "section_" + i;
                    if (MA.isMobile) {
                        legendHTML += $('#templates .legend-section-item.template').clone().removeClass('template').html()
                            //.replace(/::legendCheckboxId::/g,legendCheckboxId)
                            .replace(/::sectionID::/g, sectionID)
                            .replace(/::Label::/g, legendLabel)
                            .replace(/::isAuto::/g, '')
                            .replace(/::OTHER::/g, '')
                            .replace(/::Marker::/g, assignmentOneIcon);
                    }
                    else {
                        legendHTML += "<tr style='display:none;' data-sectionid='" + sectionID + "' class='legend-row-header sectionClosed empty'><td colspan='9' style='position: relative;' class='legend-text'><span class='MAIcon ion-checkmark-round legend-header-checkbox' onclick='MAPlotting.toggleLegendHeaderRow(this);'></span><span style='cursor:pointer;vertical-align: top;' onclick='MAPlotting.expandLegendSection(this);'>" + legendLabel + "<span style='font-size: 14px;position: absolute;top: 3px;margin-left: 6px;' class='MAIcon rowDropIcon ion-android-arrow-dropup'></span></span><span style='float:right;'><span class='visiblemarkers'>0</span><span class='of'>of</span><span class='totalmarkers'>0</span><div style='position:absolute;top:2px;right:4px;' class='legend-color'>" + assignmentOneIcon + "</div></span></td></tr>";
                    }

                    for (var s = 0, lens = assignmentTwo.length; s < lens; s++) {
                        var shapeRule = assignmentTwo[s];
                        var shapeLabel;

                        //start building a new legend row for this assignment based on field selection
                        if (shapeRule.operator == 'currency') {
                            shapeLabel = getCurrencyLegendLabel(shapeRule, legendFormatType, savedQueryRecord);
                        }
                        else if (shapeRule.comparedisplay != null) {
                            var legendLabelFormattedValue2 = picklistMap[shapeRule.comparedisplay] || shapeRule.comparedisplay;
                            shapeLabel = htmlEncode(legendLabelFormattedValue2);
                        }
                        else if (shapeRule.operator == 'includes') {
                            if (shapeRule.comparevalue == '<Other>') {
                                shapeLabel = htmlEncode(shapeRule.comparevalue);
                            }
                            else {
                                var results = shapeRule.comparevalue.split('~~');
                                var resultArrCheck = [];
                                for (var r = 0; r < results.length; r++) {
                                    var ruleCheck = results[r];
                                    //try and grab the value from pick list options
                                    ruleCheck = picklistMap[ruleCheck] || ruleCheck;
                                    resultArrCheck.push(ruleCheck);
                                }

                                var toStringResults = String(resultArrCheck);
                                results = 'Includes ' + toStringResults + '';
                                shapeLabel = htmlEncode(results);
                            }
                        }
                        else if (shapeRule.operator == 'excludes') {
                            var eresults = shapeRule.comparevalue.split('~~');
                            var eresultArrCheck = [];
                            for (var er = 0; er < results.length; er++) {
                                var eruleCheck = eresults[er];
                                //try and grab the value from pick list options
                                eruleCheck = picklistMap[eruleCheck] || eruleCheck;
                                eresultArrCheck.push(eruleCheck);
                            }

                            var etoStringResults = String(eresultArrCheck);
                            eresults = 'Excludes ' + etoStringResults + '';
                            shapeLabel = htmlEncode(eresults);
                        }
                        else if (shapeRule.operator == 'date') {
                            shapeLabel = getDateLegendLabel(shapeRule);
                        }
                        else {
                            var legendLabelFormattedValue2 = picklistMap[shapeRule.comparevalue] || shapeRule.comparevalue;
                            shapeLabel = htmlEncode(legendLabelFormattedValue2);
                        }

                        var markerValue;

                        if (options.shapeAssignmentIsFirst) {
                            markerValue = shapeRule.value + ':' + rule.value;
                        }
                        else {
                            markerValue = rule.value + ':' + shapeRule.value;
                        }
                        var imgInfo = imgLoaderDimensions[markerValue] || {};
                        legendMap['lid' + ruleIndex] = {
                            count: 0,
                            active: true,
                            label: legendLabel + ':' + shapeLabel,
                            legendId: 'lid' + ruleIndex,
                            markerValue: markerValue,
                            sectionId: sectionID,
                            icon: imgInfo.imgURL
                        };

                        imageArray.push({ id: markerValue, url: imgInfo.imgURL });
                        legendImage = '<img data-id="' + markerValue + '" style="height:20px; max-width: 30px;"" class="legend-image" src="' + imgInfo.imgURL + '"/>';
                        legendCheckboxId = 'legend-checkbox' + MA.componentIndex++;
                        if (MA.isMobile) {
                            var $row = $('#templates .legend-item.template').clone().removeClass('template');
                            $row.find('.legend-row').attr('data-sectionid', sectionID).addClass('sectionRow');
                            legendHTML += $row.html()
                                .replace(/::legendCheckboxId::/g, legendCheckboxId)
                                .replace(/::dataRule::/g, ruleIndex)
                                .replace(/::Label::/g, shapeLabel)
                                .replace(/::isAuto::/g, '')
                                .replace(/::OTHER::/g, '')
                                .replace(/::Marker::/g, legendImage);
                        }
                        else {
                            legendHTML += "<tr data-sectionid='" + sectionID + "' data-id='lid" + ruleIndex + "' class='legend-row empty' style='display:none;'><td style='padding-left: 15px;' class='legend-checkbox-wrapper'><input type='checkbox' class='legend-checkbox' checked='checked' id='" + legendCheckboxId + "' data-rule='" + ruleIndex + "' /><label for='" + legendCheckboxId + "'></label></td><td class='legend-text'>" + shapeLabel + "</td><td class='visiblemarkers'>0</td><td class='of'>of</td><td class='totalmarkers'>0</td><td class='legend-color'>" + legendImage + "</td></tr>";
                        }
                        ruleIndex++;
                    }
                }
            }
            else if (savedQueryRecord.ColorAssignmentType__c == 'Dynamic, Field') {
                var assignmentOne = savedQueryRecord.ColorAssignment__c;

                for (var i = 0, len = assignmentOne.length; i < len; i++) {
                    var ruleIndex = i;
                    var rule = assignmentOne[i];
                    var legendLabel = '';
                    rule.legendId = 'lid' + i;
                    //crate legend image
                    var legendImage = '';
                    var imageId = rule.value;
                    if (imageId.indexOf('image:') === 0) {
                        var dynamicImageId = imageId.split('image:')[1];
                        imageId = dynamicImageId;
                    }
                    var imgInfo = imgLoaderDimensions[imageId];
                    imageArray.push({ id: imageId, url: imgInfo.imgURL });

                    var otherClass = '';

                    if (rule.comparevalue.indexOf('<Other>') >= 0) {
                        otherClass = 'other';
                    }

                    //start building a new legend row for this assignment based on field selection
                    if (rule.operator == 'currency') {
                        legendLabel = getCurrencyLegendLabel(rule, legendFormatType, savedQueryRecord);
                    }
                    else if (rule.comparedisplay != null) {
                        var legendLabelFormattedValue = picklistMap[rule.comparedisplay] || rule.comparedisplay;
                        legendLabel = htmlEncode(legendLabelFormattedValue);
                    }
                    else if (rule.operator == 'includes') {
                        if (rule.comparevalue == '<Other>') {
                            legendLabel = htmlEncode(rule.comparevalue);
                        }
                        else {
                            //check if this needs to be traslated
                            var results = rule.comparevalue.split('~~');
                            var resultArrCheck = [];
                            for (var r = 0; r < results.length; r++) {
                                var ruleCheck = results[r];
                                //try and grab the value from pick list options
                                ruleCheck = picklistMap[ruleCheck] || ruleCheck;
                                resultArrCheck.push(ruleCheck);
                            }

                            var toStringResults = String(resultArrCheck)
                            results = 'Includes ' + toStringResults + '';
                            legendLabel = htmlEncode(results);
                        }
                    }
                    else if (rule.operator == 'excludes') {
                        var eresults = rule.comparevalue.split('~~');
                        var eresultArrCheck = [];
                        for (var r = 0; r < eresults.length; r++) {
                            var eruleCheck = eresults[r];
                            //try and grab the value from pick list options
                            ruleCheck = picklistMap[eruleCheck] || eruleCheck;
                            eresultArrCheck.push(eruleCheck);
                        }

                        var etoStringResults = String(eresultArrCheck)
                        eresults = 'Excludes ' + etoStringResults + '';

                        legendLabel = htmlEncode(eresults);
                    }
                    else if (rule.operator == 'date') {
                        legendLabel = getDateLegendLabel(rule);
                    }
                    else {
                        var legendLabelFormattedValue2 = picklistMap[rule.comparevalue] || rule.comparevalue;
                        legendLabel = htmlEncode(legendLabelFormattedValue2);
                    }

                    legendMap['lid' + ruleIndex] = {
                        count: 0,
                        active: true,
                        label: legendLabel,
                        legendId: 'lid' + ruleIndex,
                        markerValue: rule.value,
                        isOther: otherClass == 'other' ? true : false,
                        icon: imgInfo.imgURL
                    };

                    legendImage = '<img data-id="' + imageId + '" style="height:20px; max-width: 30px;"" class="legend-image" src="' + imgInfo.imgURL + '"/>';
                    legendCheckboxId = 'legend-checkbox' + MA.componentIndex++;
                    if (MA.isMobile) {
                        legendHTML += $('#templates .legend-item.template').clone().removeClass('template').html()
                            .replace(/::legendCheckboxId::/g, legendCheckboxId)
                            .replace(/::dataRule::/g, ruleIndex)
                            .replace(/::Label::/g, legendLabel)
                            .replace(/::Marker::/g, legendImage)
                            .replace(/::isAuto::/g, '')
                            .replace(/::OTHER::/g, otherClass);
                    }
                    else {
                        legendHTML += "<tr data-id='lid" + ruleIndex + "' class='legend-row empty " + otherClass + "' style='display:none;'>\
                                            <td class='legend-checkbox-wrapper'>\
                                                <input type='checkbox' class='legend-checkbox' checked='checked' id='"+ legendCheckboxId + "' data-rule='" + ruleIndex + "' />\
                                                <label for='"+ legendCheckboxId + "'></label>\
                                            </td>\
                                            <td class='legend-text'>"+ legendLabel + "</td>\
                                            <td class='visiblemarkers'>0</td>\
                                            <td class='of'>of</td>\
                                            <td class='totalmarkers'>0</td>\
                                            <td class='legend-color'>"+ legendImage + "</td>\
                                        </tr>";
                    }

                }
            }

            dfd.resolve({
                legendHTML: legendHTML,
                legendMap: legendMap,
                qid: options.qid,
                imageArray: imageArray
            });
        });

        return dfd.promise();

        function getDateLegendLabel(rule) {
            var formatedDate = formatUserLocaleDate({ datepicker: true }).replace('mm', 'MM').replace('dd', 'DD').replace('yy', 'YYYY');
            var formatCompareValue;
            var formatEndDate;
            var comparevalueIsDateLiteral = false;
            var enddateIsDateLiteral = false;
            var legendLabel = '';

            try {
                var stringParts = rule.comparevalue.split(' ');
                formatCompareValue = rule.comparevalue;
                comparevalueIsDateLiteral = checkIfIsDateLiteral(stringParts);
            }
            catch (err) { }
            
            //check if the to value is a dynamic date literal
            try {
                var stringParts = rule.enddate.split(' ');
                enddateIsDateLiteral = checkIfIsDateLiteral(stringParts);
                formatEndDate = rule.enddate;
            }
            catch (err) { }

            //format date to display correct user locale
            if (enddateIsDateLiteral !== true) {
                formatEndDate = moment(rule.enddate, 'YYYY-MM-DD').format(formatedDate);
            }
            if (comparevalueIsDateLiteral !== true) {
                formatCompareValue = moment(rule.comparevalue, 'YYYY-MM-DD').format(formatedDate);
            }

            if (rule.comparevalue == '<Other>') {
                legendLabel = htmlEncode(rule.comparevalue);
            }
            else if (rule.comparevalue == rule.enddate) {
                legendLabel = htmlEncode(formatCompareValue);
            }
            else {
                var assignmentValue = formatCompareValue + ' to ' + formatEndDate;
                legendLabel = htmlEncode(assignmentValue);
            }
            return legendLabel;
        }

        function getCurrencyLegendLabel(rule, legendFormatType, savedQueryRecord) {
            var toval = rule.toVal.replace(/,/g, '');
            var fromval = rule.comparevalue.replace(/,/g, '');
            var pickListField = getProperty(savedQueryRecord, 'PicklistField__c');
            var formatObj = { DisplayType: legendFormatType, describe: { soapType: '' }, ActualFieldName: pickListField };
            var legendLabel = '';
            //crate formatTooltip
            if (rule.comparevalue == '<Other>') {
                legendLabel = htmlEncode('<Other>');
            }
            else if (rule.comparevalue === '') {
                //format the toval
                if (pickListField) {
                    var formatRecObject = rebuildRecordFromDotNotation(pickListField, toval);
                    //formatRecObject[pickListField] = toval;
                    toval = formatTooltip(formatRecObject, formatObj, true);
                }
                legendLabel = htmlEncode(toval + ' ' + 'and lower');
            }
            else if (rule.toVal === '') {
                if (pickListField) {
                    var formatRecObject = rebuildRecordFromDotNotation(pickListField, fromval);
                    //formatRecObject[pickListField] = fromval;
                    fromval = formatTooltip(formatRecObject, formatObj, true);
                }
                legendLabel = htmlEncode(fromval + ' ' + 'and higher');
            }
            else {
                if (pickListField) {
                    var formatRecObject = rebuildRecordFromDotNotation(pickListField, toval);
                    toval = formatTooltip(formatRecObject, formatObj, true);
                    formatRecObject = rebuildRecordFromDotNotation(pickListField, fromval);
                    //formatRecObject[pickListField] = fromval;
                    fromval = formatTooltip(formatRecObject, formatObj, true);
                }
                legendLabel = htmlEncode(fromval + ' ' + 'to' + ' ' + toval);
            }

            return legendLabel;
        }

        function checkIfIsDateLiteral(stringParts) {
            //check if the from value is a dynamic date literal
            var comparevalueIsDateLiteral = false;
            var comparevalue = stringParts.join(' ');

            //check for date literals
            for (var i in MADateLiterals)
            {
                //check if the label matches and the value is not blank (blank value denotes a dynamic date literal and cannot be matched directly)
                if (MADateLiterals[i].label == comparevalue && MADateLiterals[i].value != 'DYNAMIC')
                {
                    comparevalueIsDateLiteral = true;
                }
            }
    
            try {
                //var stringParts = rule.comparevalue.split(' ');
                if (stringParts[0] == 'NEXT' || stringParts[0] == 'LAST') {
                    if (!isNaN(parseInt(stringParts[1])) && stringParts.length == 3 && $.inArray(stringParts[2], ['DAYS', 'QUARTERS', 'YEARS', 'WEEKS', 'MONTHS']) != -1) {
                        comparevalueIsDateLiteral = true;
                    }
                    else if (stringParts.length == 4 && stringParts[2] == 'FISCAL') {
                        if (stringParts[3] == 'QUARTERS' || stringParts[3] == 'YEARS') {
                            comparevalueIsDateLiteral = true;
                        }
                    }
                }
                else if (stringParts[2] == 'AGO' || stringParts[2] == 'FROM') {
                    var stringPartsValue = parseInt(stringParts[0]);
                    var stringPartsUnit = stringParts[1].toLowerCase();
                    if (!isNaN(stringPartsValue) && $.inArray(stringPartsUnit, ['days', 'years']) != -1) {
                        comparevalueIsDateLiteral = true;
                    }
                }
            }
            catch (err) {
                return false;
            }

            return comparevalueIsDateLiteral;
        }

        // dynamic labels now have color assignments. New feature. Run this as you would 'Dynamic, Field'
        function processColorAssignentsForDynamicLabel() {

            var assignmentOne = savedQueryRecord.ColorAssignment__c;
            for (var i = 0, len = assignmentOne.length; i < len; i++) {
                var ruleIndex = i;
                var rule = assignmentOne[i];
                var legendLabel = '';

                rule.legendId = 'lid' + i;
                //crate legend image
                var legendImage = '';

                if (rule.value.split(':').length === 2) {
                    var color = rule.value[0] || '#A0A0A0';
                    legendImage = '<span style="font-size: 16px;color:' + color + ';" class="MAIcon glyphicon-comment"></span>';
                }
                else {
                    var oColor = rule.value || '#A0A0A0'
                    legendImage = '<span style="font-size: 16px;color:' + oColor + ';" class="MAIcon glyphicon-comment"></span>';
                }

                var otherClass = '';

                if (rule.comparevalue.indexOf('<Other>') >= 0) {
                    otherClass = 'other';
                }

                //create a label

                //start building a new legend row for this assignment based on field selection
                if (rule.operator == 'currency') {
                    legendLabel = getCurrencyLegendLabel(rule, legendFormatType, savedQueryRecord);
                }
                else if (rule.comparedisplay != null) {
                    var legendLabelFormattedValue = picklistMap[rule.comparedisplay] || rule.comparedisplay;
                    legendLabel = htmlEncode(legendLabelFormattedValue);
                }
                else if (rule.operator == 'includes') {
                    if (rule.comparevalue == '<Other>') {
                        legendLabel = htmlEncode(rule.comparevalue);
                    }
                    else {
                        //check if this needs to be traslated
                        var results = rule.comparevalue.split('~~');
                        var resultArrCheck = [];
                        for (var r = 0; r < results.length; r++) {
                            var ruleCheck = results[r];
                            //try and grab the value from pick list options
                            ruleCheck = picklistMap[ruleCheck] || ruleCheck;
                            resultArrCheck.push(ruleCheck);
                        }

                        var toStringResults = String(resultArrCheck)
                        results = 'Includes ' + toStringResults + '';
                        legendLabel = htmlEncode(results);
                    }
                }
                else if (rule.operator == 'excludes') {
                    var eresults = rule.comparevalue.split('~~');
                    var eresultArrCheck = [];
                    for (var r = 0; r < eresults.length; r++) {
                        var eruleCheck = eresults[r];
                        //try and grab the value from pick list options
                        ruleCheck = picklistMap[eruleCheck] || eruleCheck;
                        eresultArrCheck.push(eruleCheck);
                    }

                    var etoStringResults = String(eresultArrCheck)
                    eresults = 'Excludes ' + etoStringResults + '';

                    legendLabel = htmlEncode(eresults);
                }
                else if (rule.operator == 'date') {
                    legendLabel = getDateLegendLabel(rule);
                }
                else {
                    var legendLabelFormattedValue2 = picklistMap[rule.comparevalue] || rule.comparevalue;
                    legendLabel = htmlEncode(legendLabelFormattedValue2);
                }

                legendMap['lid' + ruleIndex] = {
                    count: 0,
                    active: true,
                    label: legendLabel,
                    legendId: 'lid' + ruleIndex,
                    markerValue: rule.value,
                    isOther: otherClass == 'other' ? true : false,
                    icon: legendImage
                };
                legendCheckboxId = 'legend-checkbox' + MA.componentIndex++;
                if (MA.isMobile) {
                    legendHTML += $('#templates .legend-item.template').clone().removeClass('template').html()
                        .replace(/::legendCheckboxId::/g, legendCheckboxId)
                        .replace(/::dataRule::/g, ruleIndex)
                        .replace(/::Label::/g, legendLabel)
                        .replace(/::Marker::/g, legendImage)
                        .replace(/::isAuto::/g, '')
                        .replace(/::OTHER::/g, otherClass);
                }
                else {
                    legendHTML += "<tr data-id='lid" + ruleIndex + "' class='legend-row empty " + otherClass + "' style='display:none;'>\
                                        <td class='legend-checkbox-wrapper'>\
                                            <input type='checkbox' class='legend-checkbox' checked='checked' id='"+ legendCheckboxId + "' data-rule='" + ruleIndex + "' />\
                                            <label for='"+ legendCheckboxId + "'></label>\
                                        </td>\
                                        <td class='legend-text'>"+ legendLabel + "</td>\
                                        <td class='visiblemarkers'>0</td><td class='of'>of</td>\
                                        <td class='totalmarkers'>0</td>\
                                        <td class='legend-color'>"+ legendImage + "</td>\
                                    </tr>";
                }
            }
        }
    },



    /**
     * assumes record was just updated with new information
     * rerenders the query and markers with new information without having to refresh whole query
     * dynamic marker assignments and the plotted query legend get updated with new information
     * This makes it possible to reflect changes in query automatically without a hard query refresh
     * */
    updatePlottedQueryMarkerRecordInfo: function (record) {
        if (record && typeof record == 'object') {
            var qid = record.qid;
            var $plottedQuery = $('#PlottedQueriesTable .PlottedRowUnit[qid="' + qid + '"]');
            var queryMetaData = $plottedQuery.data();

            var autoAssign = true;
            try {
                autoAssign = getProperty(queryData || {}, 'advancedOptions.automaticassign') == 'true' ? true : false
            }
            catch (e) {
                //quick fix since auto assign does not work.
            }

            if (queryMetaData && !autoAssign) {
                //update record's plotted query's legend row
                var legendId = record.legendId;
                var $legendRow = $plottedQuery.find('.legend-row[data-id="' + legendId + '"]');
                $legendRow.data('numMarkers', $legendRow.data('numMarkers') - 1);
                $legendRow.find('.visiblemarkers').text((parseInt($legendRow.find('.visiblemarkers').text()) || 0) - 1);
                $legendRow.find('.totalmarkers').text((parseInt($legendRow.find('.totalmarkers').text()) || 0) - 1);
                if ($legendRow.data('numMarkers') == 0) {
                    $legendRow.addClass('empty').hide();
                    if (record.plottedQuery.find('.legend').css('display') != 'none') {
                        record.plottedQuery.find('.legend-moreless').show();
                    }
                }

                //remove the current marker and create the new one
                var oldMarker = record.marker;
                var oldClusterMarker = record.clusterMarker;
                var oldScatterMarker = record.scatterMarker;
                var renderMarker = [];
                if ($plottedQuery.find('.renderButtons-button.markers').is('.on') && record.marker && record.isVisible) {
                    MA.Map.spiderfier.removeMarker(oldMarker);
                    oldMarker.setMap(null);
                    renderMarker.push('Markers');
                }
                if ($plottedQuery.find('.renderButtons-button.cluster').is('.on') && record.clusterMarker && record.isClustered) {
                    $plottedQuery.data('macluster_cluster').removeMarker(oldClusterMarker);
                    renderMarker.push('Cluster');
                }
                if ($plottedQuery.find('.renderButtons-button.scatter').is('.on') && record.scatterMarker && record.isScattered) {
                    oldScatterMarker.setMap(null);
                    renderMarker.push('Scatter');
                }
                delete record.marker;
                delete record.clusterMarker;
                delete record.scatterMarker;
                delete record.markerInfo;
                delete record.scatterMarkerInfo;
                delete record.labelInfo;
                delete record.plottedQuery;

                // create new marker and update query marker rendering
                var processData = {
                    records: [record],
                    queryRecord: queryMetaData.queryRecord,
                    addressFields: queryMetaData.addressFields,
                    isIE: MA.Util.isIE(),
                    MAIO_URL: getProperty(MASystem || {}, 'Organization.MAIO_URL', false) || 'https://api.mapanything.io',
                    recordList: queryMetaData.recordList,
                    tooltips: queryMetaData.tooltips,
                    imgLoaderDimensions: imgLoaderDimensions,
                    ImageServerEnabled: MASystem.Organization.ImageServerEnabled
                }

                processRecords(processData, function (res) {
                    MAPlotting.processWorkerRecords($plottedQuery, { modes: renderMarker, records: [record] }, function () {
                        //update the legend
                        var newlegendId = record.legendId;
                        var $newLegendRow = $plottedQuery.find('.legend-row[data-id="' + newlegendId + '"]');
                        $newLegendRow.data('numMarkers', $newLegendRow.data('numMarkers') + 1);
                        $newLegendRow.find('.visiblemarkers').text((parseInt($newLegendRow.find('.visiblemarkers').text()) || 0) + 1);
                        $newLegendRow.find('.totalmarkers').text((parseInt($newLegendRow.find('.totalmarkers').text()) || 0) + 1);
                        $newLegendRow.removeClass('empty').show();
                        if (record.plottedQuery.find('.legend-row.empty').length == 0) {
                            record.plottedQuery.find('.legend-moreless').hide();
                        }
                    });
                });
            }
        }
    },

    /**************************************************************************************************************************************************************************************************************
     *
     *
     *  Boundary plotting options and related helper function - traveltime, traveldistance, servicearea
     *
     *
     * ****************************************************************************************************************************************************************************************************************/

    /**
     * @info: Plots a travel time boundary
     *
     * @param: $proxLayer - jquery boundary sidebar plotting DOM  element
     * @param: callback - function
     * @return: callback(response)
     * @return: response.success - on success. with results.
     * @return: response.message, response.exception(optional) - on error
     */
    plotTravelTimeBoundary: function plotTravelTimeBoundaryAlias($proxLayer, callback) {
        // show loading
        var $loadingShape = MAToastMessages.showLoading({ message: 'Validating options...', timeOut: 0, extendedTimeOut: 0 });

        // extract input
        var fillColor = $proxLayer.find('.js-colorOptions .fillcolor').val() || '#3083d3';
        var borderColor = $proxLayer.find('.js-colorOptions .bordercolor').val() || '#16325C';


        var boundaryTrafficEnabled = $proxLayer.find('.radius-traffic-checkbox').prop('checked'); //check if traffic is toggled

        var opacityFraction = $proxLayer.find(".js-proxOpacity").val();

        var radiusHours = Number($proxLayer.find('.radius-hours').val().trim() || '0');
        var radiusMinutes = Number($proxLayer.find('.radius-minutes').val().trim() || '0');

        var travelMode = $proxLayer.find('.plotted-radius-travel-type-wrap .js-travel-mode.selected').attr('data-id');
        var travelTimeAddress = $proxLayer.find('.js-address-input').val().trim();

        // get Location
        var lat;
        var lng;

        //validate time (20000s api max) hard coding 5hr 30m max
        var totalSeconds = (radiusHours * 3600) + (radiusMinutes * 60);
        if ((isNaN(radiusHours) && isNaN(radiusMinutes)) || travelTimeAddress == '' || (!radiusHours && !radiusMinutes)) {
            MAToastMessages.hideMessage($loadingShape);
            //MAToastMessages.showWarning({message:'All fields must be completed before continuing.'});
            //$proxLayer.find('.loadmask').remove();
            callback({ success: false, message: 'All fields must be completed with valid input to continue.' });
        }
        else if (radiusHours < 0 || radiusMinutes < 0) {
            MAToastMessages.hideMessage($loadingShape);
            callback({ success: false, message: 'Negative values are not allowed.' });
        }
        else if (totalSeconds > 19800) {
            MAToastMessages.hideMessage($loadingShape);
            //MAToastMessages.showWarning({message:'All fields must be completed before continuing.'});
            //$proxLayer.find('.loadmask').remove();
            callback({ success: false, message: 'Please reduce travel time. Max travel time equals 5 hours and 30 minutes.' });
        }
        else {
            MAPlotting.getBoundaryAddressLocation($proxLayer, function (res) {
                if (res.success) {
                    lat = getProperty(res, 'location.lat');
                    lng = getProperty(res, 'location.lng');

                    // validate all needed parameters
                    if (!isNaN(lat) && !isNaN(lng) && !isNaN(radiusHours) && !isNaN(radiusMinutes) && (radiusHours || radiusMinutes)) {
                        // build service area request
                        var travelTime = (radiusHours * 60 + radiusMinutes);

                        //Convert user input day of week into a number from 0 to 6
                        var userSelectDayOfWk = $proxLayer.find('.radius-traffic-day-wrap .ma-sibling-toggle.active').attr('data-dayIndex') || 0;;
                        var userSelectTime = sliderToTimeString($proxLayer.find('.radius-traffic-time').slider('value'));
                        var sliderHour = userSelectTime.milHours;
                        var sliderMinute = userSelectTime.minutes;
                        var momentTime = moment().day(userSelectDayOfWk).add(-1, 'weeks').hour(sliderHour).minutes(sliderMinute).format('YYYY-MM-DDTHH:mm:ss');
                        //var lastWeekISO = moment.parseZone(momentTime.toISOString()).local().format();
                        //Dynamic options and params
                        var trafficTravelPref = 'fastest';
                        var trafficTravelMethod = 'car';
                        var trafficEnabled = $proxLayer.find('.radius-traffic-checkbox').prop('checked') == true ? 'enabled' : 'disabled';
                        var optionMode = trafficTravelPref + ';' + trafficTravelMethod + ';' + 'traffic:' + trafficEnabled;

                        var paramStart = lat + ',' + lng;
                        var paramRange = travelTime * 60;
                        var paramRangeType = 'time';
                        var paramDepartureTime = momentTime;

                        var options = {
                            subType: 'core',
                            action: 'isoline',
                            version: '1',
                            method: 'get'
                        };

                        var params = {
                            mode: optionMode,
                            start: 'geo!' + paramStart,
                            range: paramRange,
                            rangetype: paramRangeType,
                            departure: paramDepartureTime
                        }

                        // update status
                        $loadingShape.find('.toast-title').text('Calculating Travel Time...');

                        var polygons = [];

                        // get service area
                        MAPlotting.getServiceArea(options, params).then(function (res) {
                            var bounds = new google.maps.LatLngBounds();

                            // draw a small circle to indicate the center
                            var centerPoint = new google.maps.Marker({
                                position: new google.maps.LatLng({ lat: lat, lng: lng }),
                                title: travelTimeAddress || '',
                                icon: {
                                    path: google.maps.SymbolPath.CIRCLE,
                                    fillColor: '#ffffff', //'#E7E7E7',
                                    fillOpacity: 1,
                                    strokeColor: '#000000',
                                    strokeWeight: 1,
                                    scale: 4
                                },
                            });

                            // include center points in bounds
                            bounds.extend(centerPoint.getPosition());

                            // create polygon objects from shapes data
                            res.shapes.forEach(function (shape) {
                                var endpoints = shape.coordinates;

                                var polygon = new google.maps.Polygon({
                                    path: endpoints,
                                    geodesic: true,
                                    isTravelGeom: true,
                                    shapeType: 'travelTime',
                                    fillColor: fillColor,
                                    fillOpacity: opacityFraction,
                                    layer: $proxLayer,
                                    strokeColor: borderColor,
                                    saveData: {
                                        isCustom: true,
                                        proximityType: 'travelTime',
                                        travelTime: travelTime,
                                        travelLatitude: lat,
                                        travelLongitude: lng,
                                        travelDistance: '',
                                        travelMode: trafficTravelMethod,
                                        travelPreference: trafficTravelPref,
                                        trafficEnabled: trafficEnabled,
                                        departure: paramDepartureTime
                                    }
                                });

                                // polygon click handlers
                                google.maps.event.addListener(polygon, 'click', function (e) {
                                    proximityLayer_Click({ position: e.latLng, type: 'Polygon', shape: polygon });
                                });

                                google.maps.event.addListener(polygon, 'rightclick', function (e) {
                                    Shape_Context.call(this, e);
                                });

                                // cache reference to center point in each polygon for removal later
                                polygon.centerPoint = centerPoint;

                                // add to our list of polygon objects
                                polygons.push(polygon);

                                // add this shapes bounds to shapes bounds union
                                bounds.union(shape.bounds);

                                // show polygon on map
                                polygon.setMap(MA.map);
                            });

                            // show center point on map
                            centerPoint.setMap(MA.map);

                            // bring the plotted boundary into close view using bounds
                            MA.map.fitBounds(bounds);

                            // save to DOM
                            $proxLayer.data('proxObjects', polygons);

                            MAToastMessages.hideMessage($loadingShape);
                            callback({ success: true });
                        }).fail(function (res) {
                            MAToastMessages.hideMessage($loadingShape);
                            var errMsg = res.message || 'Unknown Error';

                            if (errMsg.indexOf('endpoint') > -1) {
                                errMsg = 'Unautorized endpoint: ' + MASystem.Organization.MAIO_URL
                            }

                            callback({ success: false, message: 'Unable to get the service area. ' + errMsg });
                        });
                    }
                    else {
                        MAToastMessages.hideMessage($loadingShape);
                        //$proxLayer.find('.loadmask').remove();
                        //MAToastMessages.showError({message:'Unable to calculate travel time from input provided.'});
                        callback({ success: false, message: 'Unable to calculate travel time.' });
                    }
                }
                else // location not found
                {
                    MAToastMessages.hideMessage($loadingShape);
                    //$proxLayer.find('.loadmask').remove();
                    callback({ success: false, message: 'Unable to process location.' }); // This message will be displayed to users at callback.
                }
            });
        }
    },

    /**
     * @info: Plots a distance boundary
     *
     * @param: $proxLayer - jquery boundary sidebar plotting DOM  element
     * @param: callback - function
     * @return: callback(response)
     * @return: response.success - on success. with results.
     * @return: response.message, response.exception(optional) - on error
     */
    plotTravelDistanceBoundary: function plotTravelDistanceBoundaryAlias($proxLayer, callback) {
        // show loading
        var $loadingShape = MAToastMessages.showLoading({ message: 'Validating options...', timeOut: 0, extendedTimeOut: 0 });

        var fillColor = $proxLayer.find('.js-colorOptions .fillcolor').val() || '#3083d3';
        var borderColor = $proxLayer.find('.js-colorOptions .bordercolor').val() || '#16325C';

        var opacityFraction = Number($proxLayer.find(".js-proxOpacity").val());

        var lat;
        var lng;

        var travelDistanceValue = Number($proxLayer.find('.js-radiusDistance').val().trim());
        var travelDistanceUnits = $proxLayer.find('.js-radiusUnit').val();
        travelDistanceUnits = travelDistanceUnits == '' ? 'MILES' : travelDistanceUnits.toUpperCase();
        var travelmiles = travelDistanceValue * unitFactors[travelDistanceUnits]['METERS'] * unitFactors['METERS']['MILES'];
        var travelMeters = Math.round(travelmiles * 1609.34);
        var travelMode = $proxLayer.find('.plotted-radius-travel-type-wrap .js-travel-mode.selected').attr('data-id');
        var travelDistanceAddress = $proxLayer.find('.js-address-input').val().trim();


        if (!isNum(travelmiles) || travelDistanceAddress == '') {
            MAToastMessages.hideMessage($loadingShape);
            callback({ success: false, message: 'All fields must be completed with valid input to continue.' });
        }
        else if (travelmiles < 0) {
            MAToastMessages.hideMessage($loadingShape);
            callback({ success: false, message: 'Negative values are not allowed.' });
        }
        else if (travelMeters > 500000) {
            MAToastMessages.hideMessage($loadingShape);
            //MAToastMessages.showWarning({message:'All fields must be completed before continuing.'});
            //$proxLayer.find('.loadmask').remove();
            // format error msg to selected unit
            var convertedUnit = Math.round(500000 * unitFactors['METERS'][travelDistanceUnits]);
            // subtract 1 just so the error lines up
            convertedUnit = convertedUnit > 1 ? (convertedUnit - 1) : convertedUnit;
            callback({ success: false, message: 'Please reduce travel distance. Max travel distance is ' + convertedUnit + ' ' + $proxLayer.find('.js-radiusUnit option:selected').text() + '.' });
        }
        else {
            MAPlotting.getBoundaryAddressLocation($proxLayer, function (res) {
                if (res.success) {
                    lat = getProperty(res, 'location.lat');
                    lng = getProperty(res, 'location.lng');

                    //Convert user input day of week into a number from 0 to 6
                    var userSelectDayOfWk = $proxLayer.find('.radius-traffic-day-wrap .ma-sibling-toggle.active').attr('data-dayIndex') || 0;
                    var userSelectTime = sliderToTimeString($proxLayer.find('.radius-traffic-time').slider('value'));
                    var sliderHour = userSelectTime.milHours;
                    var sliderMinute = userSelectTime.minutes;
                    var lastWeekISO = moment().format('YYYY-MM-DDTHH:mm:ss');
                    //Dynamic options and params
                    var trafficTravelPref = 'fastest';
                    var trafficTravelMethod = 'car';
                    var trafficEnabled = 'disabled';
                    var optionMode = trafficTravelPref + ';' + trafficTravelMethod + ';' + 'traffic:' + trafficEnabled;
                    var paramStart = lat + ',' + lng;
                    var paramRange = travelMeters;
                    var paramRangeType = 'distance';
                    var paramDepartureTime = lastWeekISO;

                    var options = {
                        subType: 'core',
                        action: 'isoline',
                        version: '1',
                        method: 'get'
                    };

                    var params = {
                        mode: optionMode,
                        start: 'geo!' + paramStart,
                        range: paramRange,
                        rangetype: paramRangeType
                    };

                    // update status
                    $loadingShape.find('.toast-title').text('Calculating Travel Distance...');
                    // get service area
                    MAPlotting.getServiceArea(options, params, function (res) {
                        if (res && res.success) {
                            var bounds = res.bounds; // bounds to bring plotted boundary into view
                            var endpoints = res.points; // the boundary polygon waypoints

                            if (Array.isArray(endpoints)) {
                                var boundary = new google.maps.Polygon({
                                    path: endpoints,
                                    geodesic: true,
                                    isTravelGeom: true,
                                    shapeType: 'travelDistance',
                                    fillColor: fillColor,
                                    fillOpacity: opacityFraction,
                                    layer: $proxLayer,
                                    strokeColor: borderColor,
                                    saveData: {
                                        isCustom: true,
                                        proximityType: 'travelDistance',
                                        travelTime: '',
                                        travelLatitude: lat,
                                        travelLongitude: lng,
                                        travelDistance: travelmiles,
                                        travelMode: trafficTravelMethod,
                                        travelPreference: trafficTravelPref,
                                        trafficEnabled: trafficEnabled,
                                        departure: paramDepartureTime
                                    }
                                });

                                // save to DOM
                                $proxLayer.data('proxObject', boundary);

                                //handle clicking on polygon
                                google.maps.event.addListener(boundary, 'click', function (e) {
                                    proximityLayer_Click({ position: e.latLng, type: 'Polygon', shape: boundary });
                                });
                                google.maps.event.addListener(boundary, 'rightclick', function (e) {
                                    Shape_Context.call(this, e);
                                });

                                // this displays a center for the plotted boundary
                                var centerPoint = new google.maps.Marker({
                                    position: new google.maps.LatLng({ lat: lat, lng: lng }),
                                    title: travelDistanceAddress || '',
                                    icon: {
                                        path: google.maps.SymbolPath.CIRCLE,
                                        fillColor: '#ffffff', //'#E7E7E7',
                                        fillOpacity: 1,
                                        strokeColor: '#000000',
                                        strokeWeight: 1,
                                        scale: 4
                                    },
                                });

                                bounds.extend(centerPoint.getPosition());
                                boundary.centerPoint = centerPoint;

                                // display boundary and center circle on map
                                boundary.setMap(MA.map);
                                centerPoint.setMap(MA.map);

                                // move view to also fit in the boundary
                                MA.map.fitBounds(bounds);

                                //$proxLayer.find('.loadmask').remove();
                                MAToastMessages.hideMessage($loadingShape);
                                callback({ success: true });
                            }
                            else {
                                //$proxLayer.find('.loadmask').remove();
                                MAToastMessages.hideMessage($loadingShape);
                                //MAToastMessages.showError({message:'Unable to find boundary points.'});
                                callback({ success: false, message: 'Unable to find boundary points.' });
                            }
                        }
                        else {
                            //$proxLayer.find('.loadmask').remove();
                            MAToastMessages.hideMessage($loadingShape);
                            var errMsg = res.message || 'Unknown Error';
                            if (errMsg.indexOf('endpoint') > -1) {
                                errMsg = 'Unautorized endpoint: ' + MASystem.Organization.MAIO_URL
                            }
                            //MAToastMessages.showError({message:'Unable to retreive boundary.', subMessage:'Please try again.'});
                            callback({ success: false, message: 'Unable to retreive the service area. ' + errMsg });
                        }
                    });
                }
                else {
                    // $proxLayer.find('.loadmask').remove();
                    MAToastMessages.hideMessage($loadingShape);
                    callback({ success: false, message: 'Unable to process Location.' });
                }
            });
        }
    },


    /**
     * @info: retreives string input address from the Address text area and returns a geolocation for it.
     * @info: saves the geocoded location in the text area element to avoid multiple geocodes for similar/consecutive address text area input.
     * @info: if there is no lcoation saved, the address is geocoded and saved.
     *
     * @param: $proxLayer - jquery boundary sidebar plotting DOM  element
     * @param: travelTimeAddress - String. text
     * @return: callback(response)
     * @return: response.success - on success. with results.
     * @return: response.message, response.exception(optional) - on error
     */
    getBoundaryAddressLocation: function getBoundaryLocationAlias($proxLayer, callback) {
        var $addressElement = $proxLayer.find('.js-address-input');

        var saved = $addressElement.data();

        var lat = saved.lat;
        var lng = saved.lng;
        var savedAddress = saved.address;

        if (!isNaN(lat) && !isNaN(lat) && typeof savedAddress == 'string' && String(savedAddress).trim() != '') // if there's is a saved and valid lat, lng and address
        {
            callback({ success: true, location: { lat: lat, lng: lng, address: savedAddress } }); // return already saved location
        }
        else // address string not saved. Let's retreive the location
        {
            var address = $addressElement.val().trim();

            if (address != '') {
                // geocode this unsaved address the save it
                MAPlotting.getLocationFromAddressString(address, function (res) {
                    if (res.success) {
                        // save the address to the adress input text area
                        saved.lat = res.location.lat;
                        saved.lng = res.location.lng;
                        saved.address = res.location.address;

                        if ($addressElement.val().trim() == '') {
                            $addressElement.val(res.location.address);
                        }

                        // return address
                        callback(res);
                    }
                    else // failed to get location
                    {
                        callback(res);
                    }
                });
            }
            else {
                callback({ success: false, message: 'No address input found. Please try again.' });
            }
        }
    },


    /**
     * @info: Processes address string input to find it's location (Lat/Lng)
     *
     * @param: address - can be a string address or "Lat: Number [<whitespace> or <linebreak>] Long: Number"
     *
     * @return: if a Lat/Lng Literal String is passed, the values are passed and returned
     * @return: if an actual string address is passed, geocodes and returns result
     *
     * @return: callback(response.success) - on success. with results.
     * @return: callback(response.message), response.exception(optional) - on error
     */
    getLocationFromAddressString: function getLocationFromAddressStringAlias(address, callback) {
        if (typeof address == 'string') {
            address = address.trim();
            address = address.replace(/\n\s*\n/g, '\n');
            var testAddress = address.toLowerCase();
            var lat, lng;

            var regExp = /^lat: ([^\n]*)\nlong: ([^\n]*)$/;

            if (regExp.test(testAddress)) {
                //we have a lat/long so parse and use it
                var matches = regExp.exec(testAddress);

                if (Array.isArray(matches)) {
                    var localLat = MA.Util.parseNumberString(matches[1]);
                    var localLng = MA.Util.parseNumberString(matches[2]);
                    lat = Number(localLat);
                    lng = Number(localLng);

                    callback({ success: true, location: { lat: lat, lng: lng, address: address } });
                }
                else {
                    callback({ success: false, message: 'Unknown error while parsing the Lat/Lng input.', address: address });
                }
            }
            else {
                geocode({
                    address: address,
                    complete: function (res) {
                        if (res.success) {
                            lat = Number(res.results.Latitude);
                            lng = Number(res.results.Longitude);

                            if (!isNaN(lat) && !isNaN(lng)) {
                                callback({ success: true, location: { lat: lat, lng: lng, address: address, geocodeResponse: res } });
                            } else {
                                callback({ success: false, message: 'No valid geocode received.', address: address, geocodeRespoonse: res });
                            }
                        }
                        else {
                            callback({ success: false, message: 'Geocode error.', address: address, geocodeRespoonse: res });
                        }
                    }
                });
            }
        }
        else {
            callback({ success: false, message: 'Invalid address input.', address: address });
        }
    },

    /*
     * returns a result with an array of a polyline coordinates to plot around the given position
    /*Example for values
     *var options = {
     *   subType: 'core',
     *   action : 'isoline',
     *   version: '1',
     *   method : 'get'
     *}
     *var params = {
     *  mode : "fastest;car;traffic:enabled", preferences and traffic enabled/disable.
     *   start: "geo!33.86,-84.68", lat and lng of address input.
     *   range: "1000", travel time in seconds.
     *   rangetype: "time", either time or distance.
     *   departure: "2017-06-01T10:04:10-04:00", iso date format.
     *}
     */
    getServiceArea: function getServiceAreaAlias(options, params, callback) {
        var $dfd = $.Deferred();
        var response;
        callback = callback || function () { };
        //params = JSON.stringify(params);
        try {
            Visualforce.remoting.Manager.invokeAction(MARemoting.MapAnythingIORequest,
                options, params,
                function (res, event) {
                    if (event.status) // remote call successfull
                    {
                        if (res.success) {
                            //Enter the structure of response
                            var isolines = getProperty(res, 'data.response.isoline', false) || [];
                            var successfulParse = true;
                            var isolineArray = isolines[0] || {};
                            //store list of geo lat lng
                            var components = isolineArray.component || [];
                            var componentArray = components[0] || {};

                            var shapes = [];
                            var numOfShapes = 0;

                            // extract shapes from components
                            if (Array.isArray(components) && components.length > 0) {
                                var numOfShapes = components.length;

                                components.forEach(function (component) {
                                    var points = component.shape || [];
                                    var bounds = new google.maps.LatLngBounds();
                                    var googlePointArr = [];

                                    // reformat shape
                                    for (var s = 0; s < points.length; s++) {
                                        var point = points[s];
                                        var pointParts = point.split(',');

                                        if (pointParts.length == 2) {
                                            var lat = pointParts[0];
                                            var lng = pointParts[1];
                                            if (isNaN(lat) || isNaN(lng)) {
                                                successfulParse = false;
                                                break;
                                            }
                                            else {
                                                var googleLatLng = { lat: +lat, lng: +lng };
                                                bounds.extend(googleLatLng);
                                                googlePointArr.push(googleLatLng);
                                            }
                                        }
                                    }

                                    // add to list of shapes
                                    if (successfulParse) {
                                        shapes.push({
                                            id: component.id,
                                            coordinates: googlePointArr,
                                            bounds: bounds
                                        });
                                    }
                                });
                            }

                            // build and return result
                            if (shapes.length > 0) { // some shapes were successfully added
                                response = {
                                    shapes: shapes,
                                    count: numOfShapes
                                };

                                if (shapes.length != numOfShapes) { // we have some shapes, but not all shapes had the right format
                                    response.warning = {
                                        message: 'Some service area shapes could not be parsed correctly due to unexpected format.'
                                    };
                                }

                                callback({
                                    success: true,
                                    points: shapes[0].coordinates,
                                    bounds: shapes[0].bounds
                                });
                                $dfd.resolve(response);
                            } else { // no shapes added
                                response = {
                                    success: false,
                                    message: 'Zero shapes found for the service area'
                                };

                                callback(response);
                                $dfd.reject(response);
                            }
                        }
                        else {
                            callback(res);
                            $dfd.reject(res);
                        }
                    }
                    else // remote call failed
                    {
                        callback({ success: false, message: 'remote call failed. ' + getProperty(event, 'message') });
                        $dfd.reject({ success: false, message: 'remote call failed. ' + getProperty(event, 'message') });
                    }
                }, { buffer: false, escape: false, timeout: 120000 });
        }
        catch (e) {
            callback({ success: false, errorType: 'exception', exception: e });
            $dfd.reject({ success: false, errorType: 'exception', exception: e });
        }

        return $dfd.promise();
    },


    processLayer: function processLayerAlias($plottedQuery, options) {
        var $dfd = $.Deferred();

        // grab layer Info
        var metaData = $($plottedQuery).data() || {};
        var layerType = metaData.layerType;
        options = $.extend({}, options);

        // based on the layer type, process the layer
        if (/live/i.test(layerType)) // captures 'live' and 'live-device' layers
        {
            MAPlotting.processLiveLayer($plottedQuery, options, function (processLiveLayerResponse) {
                $dfd.resolve(processLiveLayerResponse);
            });
        }
        else if (/geofence/i.test(layerType)) // geofence layer type
        {
            MAPlotting.processGeofenceLayer($plottedQuery, options).then($dfd.resolve);
        }
        else // Layer Type property unknown. This is most likely just a regular marker layer
        {
            $dfd.resolve({ success: true, message: 'Layer Type property not unknown' });
        }

        // return promise
        return $dfd.promise();
    },

    /*
    ****************************************************************************************************************************************************************************************************************
    *                                                                                                                                                                                                              *
    *                                                                                                                                                                                                              *
    *                              process layer types functions                                                                                                                                                    *
    *                                                                                                                                                                                                              *
    *                                                                                                                                                                                                              *
    ****************************************************************************************************************************************************************************************************************
    */
    processLiveLayer: function processLiveLayerAlias($plottedQuery, options, callback) {
        callback = callback || function () { };
        options = $.extend({}, options); // options => {records: [], isRefresh: Boolean}

        // grab layer Info
        var metaData = $($plottedQuery).data() || {};
        var layerType = metaData.layerType;

        if (/live/i.test(layerType)) {
            $plottedQuery.find('.live_legend_info').html('Processing Live Layer...');

            // live variables
            var deviceIdFieldName = String(getProperty(metaData, 'deviceFields.deviceId')).replace(MA.Namespace + '__', '');
            var deviceVendorFieldName = String(getProperty(metaData, 'deviceFields.deviceVendor', false)).replace(MA.Namespace + '__', '');
            var deviceMap = metaData.deviceMap || {}; // getProperty(metaData, 'deviceMap') || {};
            var deviceIds = Object.keys(deviceMap) || [];
            var animateLiveLayers = getProperty(MASystem || {}, 'Organization.AnimateLiveLayers', false);

            var MAX_NUM_OF_TIMES_TO_RETRY_GETTING_CURRENT_DEVICE_LOCATIONS = 5;

            // initialize arrays in plotted. to store successful, failed and unment criteria devices. clears any from previous query if refresh
            metaData['successfulDevices'] = [];
            metaData['failedDevices'] = [];
            metaData['liveCriteriaUnmet'] = [];

            // initialize numOfRetries if it's not already a number. Keeps count of how many times we've failed to receive current device locations
            metaData.numberOfRetries = isNum(metaData.numberOfRetries) ? metaData.numberOfRetries : 0;

            // show progress info on plotted query legend
            $plottedQuery.find('.live_legend_info').html('Retrieving devices current locations...');

            // get latest locations from device ids extracted above
            MAPlotting.getLatestDeviceLocations(deviceIds, function getDeviceLocationsCallback(res) {
                if (res && res.success) {
                    res.positions.forEach(function(pos) {
                        if (pos.success) {
                            // If the position property is not present we will need to add it to fit the schema of the
                            // MADevice class. Also we need to convert deviceId to the expected format fot other functionality
                            // to work properly
                            if(!pos.hasOwnProperty('position')) {
                                pos.deviceId = pos.vendor + '-' + pos.deviceId;
                                pos.position = {
                                    lat: pos.hasOwnProperty('lat') ? pos.lat.value : 'Data Not Available',
                                    lng: pos.hasOwnProperty('lng') ? pos.lng.value : 'Data Not Available',
                                    address: pos.hasOwnProperty('address') ? pos.address.value : 'Data Not Available',
                                    heading: pos.hasOwnProperty('heading') ? pos.heading.value : 'Data Not Available'
                                };
                                pos.timestamp = pos.hasOwnProperty('lastEventTime') ? pos.lastEventTime.value : 'Data Not Available';
                                pos.metadata = {};
                                pos.metadata.speed = pos.hasOwnProperty('speed') ? pos.speed.value : 'Data Not Available';
                                pos.metadata.odometer = pos.hasOwnProperty('odometer') ? pos.odometer.value : 'Data Not Available'
                            }
                        }
                    });

                    metaData.numberOfRetries = 0; // reset number of times we've retried to get current device locations

                    // get result properties
                    var deviceCount = res.count;
                    var deviceResults = res.positions;
                    var failedBatchDevices = res.failed || [];

                    // update legend
                    $plottedQuery.find('.live_legend_info').html(deviceIds.length + ' devices queried...');

                    //loop over devices to create map

                    var i = 0;
                    var markerProcessingBatchSize = 100;
                    var markerProcessingTimeout = 2;
                    var deviceResultsLength = deviceResults.length;
                    var devicesRemaining = deviceResultsLength;
                    var deviceSussess = 0;
                    var deviceFailures = 0;

                    $plottedQuery.find('.live_legend_info').html("Checking Devices:" + i + " " + MASystem.Labels.MA_of + " " + deviceResultsLength);

                    // loop through returned devices and update the device map with latest devices info
                    setTimeout(function doBatch() {
                        if (i < deviceResultsLength) {
                            var devicesProcessed = 0;
                            while (devicesProcessed < markerProcessingBatchSize && i < deviceResultsLength) {
                                devicesProcessed++;

                                var device = new MADevice(deviceResults[i]);
                                var deviceId = device.getId(); // getProperty(device, 'deviceId');
                                if (device.successful()) {
                                    // add device info to device map
                                    (deviceMap[deviceId] || {})['device'] = device;

                                    // add to current list of successful devices
                                    metaData.successfulDevices.push(deviceId);
                                }
                                else {
                                    // add to the most current list of failed devices
                                    metaData.failedDevices.push(deviceId);
                                }

                                devicesRemaining--;
                                i++;
                            }

                            //continue next batch
                            $plottedQuery.find('.live_legend_info').html("Processing Devices:" + i + " " + MASystem.Labels.MA_of + " " + deviceResultsLength);
                            setTimeout(doBatch, markerProcessingTimeout);
                        }
                        else {
                            metaData.failedDevices = metaData.failedDevices.concat(failedBatchDevices);

                            // if we hit this part, we are done looping through returned devices.
                            $plottedQuery.find('.live_legend_info').html('Devices Updated: ' + metaData['successfulDevices'].length + ' Successful. ' + metaData['failedDevices'].length + ' Failed.');

                            // if refresh, let's loop over the plotted query records which should already be pre-populated in the query data
                            // for each record, we'll get the device id and use it to get the latest device info which was just updated above on the device map
                            if (options.isRefresh) {
                                var records = getProperty(metaData, 'records', false) || {};
                                var keys = Object.keys(records),
                                    len = keys.length,
                                    r = 0,
                                    prop,
                                    value;
                                var recordsRemaining = len;

                                // get the live criteria for this plotting refresh round
                                var deviceReportDateAndTimeCriteriaResult = MAPlotting.getLiveDeviceReportDateAndTimeCriteria($plottedQuery);
                                var deviceReportDateAndTimeCriteria = getProperty(deviceReportDateAndTimeCriteriaResult || {}, 'criteria', false);


                                $plottedQuery.find('.live_legend_info').html("Processing:" + r + " " + MASystem.Labels.MA_of + " " + len);

                                // loop through records in this query. If this is the first run and not the refresh, there is no records to loop through yet, as they'll be populated elsewhere
                                // if this is a refresh, there should be records to loop over, and the marker positions on these records will be updated based on latest device locations retreived above
                                setTimeout(function doRecordBatch() {
                                    if (r < len) {
                                        var recordsProcessed = 0;
                                        while (recordsProcessed < 25 && r < len) {
                                            recordsProcessed++;
                                            prop = keys[r];
                                            record = records[prop];

                                            // try to get the device
                                            try {
                                                var deviceId = MA.getProperty(record, deviceIdFieldName.trim().split('.'));
                                                var deviceVendor = MA.getProperty(record, deviceVendorFieldName.trim().split('.'));

                                                var realDeviceId = null;

                                                if (deviceId) {
                                                    realDeviceId = deviceVendor ? (deviceVendor.trim().replace(/(\s|\n)/ig, '').toLowerCase() + '-' + deviceId.trim()) : deviceId.trim();
                                                }

                                                var deviceObj = deviceMap[realDeviceId]; // getProperty(deviceMap,realDeviceId) || {};
                                                var device = deviceObj.device || ''; // getProperty(deviceObj,'device') || {};
                                            } catch (e) { console.warn(e); }

                                            // if first run, markers are not created yet and get created after this
                                            if (record && record.location) {
                                                if (device) {
                                                    var currentDevicePosition = device.getPosition();

                                                    if (currentDevicePosition) {
                                                        // update record lat lng
                                                        record.location.coordinates.lat = currentDevicePosition.lat;
                                                        record.location.coordinates.lng = currentDevicePosition.lng;

                                                        // for refresh, marker already exists, update position
                                                        if (record.marker) {
                                                            // update marker position
                                                            if (animateLiveLayers) {
                                                                // if animation enabled
                                                                MAPlotting.animateMarkerTo(record.marker, currentDevicePosition); // animate
                                                            }
                                                            else {
                                                                record.marker.setPosition(currentDevicePosition);
                                                            }

                                                            // if we have a list of criteria for device last report date and time, check if the record's device meets it
                                                            if (Array.isArray(deviceReportDateAndTimeCriteria)) {
                                                                if (deviceReportDateAndTimeCriteria.length > 0) // criteria has to exist
                                                                {
                                                                    // change marker visibility based on live criteria
                                                                    var deviceMeetsLiveCriteria = device.meetsLiveCriteria(deviceReportDateAndTimeCriteria);

                                                                    // we need to know the criteria was tested successfully and no null/undefined was returned instead
                                                                    if (deviceMeetsLiveCriteria === false || deviceMeetsLiveCriteria === true) {
                                                                        record.marker.setVisible(deviceMeetsLiveCriteria);
                                                                        record.isVisible = deviceMeetsLiveCriteria;

                                                                        if (deviceMeetsLiveCriteria === false) {
                                                                            metaData['liveCriteriaUnmet'].push(record);
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }

                                                    // update record device
                                                    record.device = device;
                                                }
                                            }

                                            recordsRemaining--;
                                            r++;
                                        }

                                        //continue next batch
                                        $plottedQuery.find('.live_legend_info').html('<div class="live-status">' + "Processing:" + r + " " + MASystem.Labels.MA_of + " " + len + '</div>');
                                        setTimeout(doRecordBatch, markerProcessingTimeout);
                                    }
                                    else {
                                        $plottedQuery.find('.live_legend_info').html('Devices Updated: ' + metaData['successfulDevices'].length + ' Successful. ' + metaData['failedDevices'].length + ' Failed.');

                                        MAPlotting.updateQueryInfo($plottedQuery, function (res) { });

                                        callback({ success: true, deviceCount: deviceCount });
                                    }
                                }, markerProcessingTimeout);
                            }
                            else {
                                // process Live layer has done its job i.e. retreived current device locations and updated markers with new information
                                // since this is not a refresh, no markers are created yet available to update position for
                                callback({ success: true, deviceCount: deviceResultsLength });
                            }
                        }
                    }, markerProcessingTimeout);
                }
                else // getting most current device locations failed
                {
                    // increment this layers number of times we've failed to get current device locations
                    metaData.numberOfRetries += 1;

                    // update number of device successful/failed
                    metaData['successfulDevices'].length = 0
                    metaData['failedDevices'].length = (deviceIds || []).length;

                    // update query legend with number of devices successful/failed
                    $plottedQuery.find('.live_legend_info').html('Devices Updated: ' + metaData['successfulDevices'].length + ' Successful. ' + metaData['failedDevices'].length + ' Failed.');

                    // check if we need to keep trying querying for devce locations (if we've failed this time)
                    if (metaData.numberOfRetries >= MAX_NUM_OF_TIMES_TO_RETRY_GETTING_CURRENT_DEVICE_LOCATIONS && options.isRefresh) {
                        $plottedQuery.removeClass('loading');
                        $plottedQuery.find('.queryIcon').hide();
                        $plottedQuery.find('.queryLoader').hide();
                        $plottedQuery.find('.queryError').show();
                        var message = 'Could not retrieve current locations. Refresh query or page.';
                        // $plottedQuery.find('.live_legend_info').html('Error. ' + message);
                        NotifyError('Live Error', message);
                        callback({ success: false });
                    }
                    else // return a success true and fail after 5th time round
                    {
                        callback({ success: true, message: 'Layer counts as succeeded but current device locations failed. We will try again on next refresh round and only fail the layer after 5 times of the same.' });
                    }
                }
            });
        }
        else // not a live layer
        {
            // ignore and callback successfully
            callback({ success: true, message: 'Not a live layer' });
        }
    },



    processGeofenceLayer: function processGeofenceLayerAlias($plottedQuery, options) {
        var $dfd = $.Deferred();
        var response = {};

        var metaData = $($plottedQuery).data() || {};
        options = $.extend({}, options); // options => {records: [], isRefresh: Boolean}


        // initialize array to store failed geofence records
        metaData.geofenceRecordsWithoutLocation = [];

        // initialize array to store geofence records without shapes
        metaData.geofenceRecordsWithoutShape = [];

        // get geofence data
        var geofenceData = getProperty(metaData, 'advancedOptions.layerTypeOptions.geofence');

        // process geofence layer based on the geofence type
        if (typeof geofenceData == 'object') // we have geofence data!
        {
            var geofenceType = geofenceData.geofenceType; // retreive geofence type
            var geofenceFields = getProperty(metaData, 'layerTypeFields.fields');  // locate geofence fields to help us find the mapanything territories or lat/lng 's in the records

            if (/circle/i.test(geofenceType)) {
                var latField = geofenceFields.latitude;
                var lngField = geofenceFields.longitude;

                if (latField && lngField && typeof latField == 'string' && typeof lngField == 'string') {
                    response.success = true;
                    response.renderAs = ['Markers'];
                }
                else {
                    response.success = false;
                    response.message = 'Geofence layer Lat/Lng field names could not be located';
                }
            }
            else if (/irregular/i.test(geofenceType)) // for irregular, find geofence shape Ids in records and build shapeIdsToPlot object to return
            {
                if (typeof geofenceFields == 'object') {
                    var shapeField = geofenceFields.shape;
                    var isCustomGeometryField = geofenceFields.isCustomGeometry;

                    var records = options.records;

                    if (shapeField && typeof shapeField == 'string' && String(shapeField).trim() != '' && isCustomGeometryField && typeof isCustomGeometryField == 'string' && String(isCustomGeometryField).trim() && Array.isArray(records)) {
                        var geofenceShapeIdsToPlot = {};
                        var recordsWithShapes = []; // these are the records returned for plotting

                        // go through each record and pick out shape Ids to plot
                        records.map(function (record, index) {
                            var recordShapeId = getProperty(record, shapeField);
                            var recordShapeIsCustomGeometry = getProperty(record, isCustomGeometryField);

                            if (recordShapeId && String(recordShapeId).trim() != '' && recordShapeIsCustomGeometry && String(recordShapeIsCustomGeometry).trim() != '') {
                                geofenceShapeIdsToPlot[recordShapeId] = recordShapeIsCustomGeometry;
                                recordsWithShapes.push(record);
                            }
                            else {
                                // record has no territory and does not go into list of records with shapes
                                metaData.geofenceRecordsWithoutShape.push(record);
                            }
                        });


                        response.success = true;
                        response.shapesToPlot = geofenceShapeIdsToPlot;
                        response.records = recordsWithShapes;
                    }
                    else {
                        response.success = false;
                        response.message = 'Records not found or geofence base object not properly configured';
                    }
                }
                else {
                    response.success = false;
                    response.message = 'Could not locate record Geofence layer fields';
                }
            }
            else {
                response.success = false;
                response.message = 'Unknown geofence type';
            }
        }
        else // geofence data could not be successfully located
        {
            response.success = false;
            response.message = 'Geofence layer data not found';
        }

        // resolve promise with final response
        $dfd.resolve(response);

        // return promise
        return $dfd.promise();
    },


    processGeofenceLayer: function processGeofenceLayerAlias($plottedQuery, options) {
        var $dfd = $.Deferred();
        var response = {};

        var metaData = $($plottedQuery).data() || {};
        options = $.extend({}, options); // options => {records: [], isRefresh: Boolean}


        // initialize array to store failed geofence records
        metaData.geofenceRecordsWithoutLocation = [];

        // initialize array to store geofence records without shapes
        metaData.geofenceRecordsWithoutShape = [];

        // get geofence data
        var geofenceData = getProperty(metaData, 'advancedOptions.layerTypeOptions.geofence');

        // process geofence layer based on the geofence type
        if (typeof geofenceData == 'object') // we have geofence data!
        {
            var geofenceType = geofenceData.geofenceType; // retreive geofence type
            var geofenceFields = getProperty(metaData, 'layerTypeFields.fields');  // locate geofence fields to help us find the mapanything territories or lat/lng 's in the records

            if (/circle/i.test(geofenceType)) {
                var latField = geofenceFields.latitude;
                var lngField = geofenceFields.longitude;

                if (latField && lngField && typeof latField == 'string' && typeof lngField == 'string') {
                    response.success = true;
                    response.renderAs = ['Markers'];
                }
                else {
                    response.success = false;
                    response.message = 'Geofence layer Lat/Lng field names could not be located';
                }
            }
            else if (/irregular/i.test(geofenceType)) // for irregular, find geofence shape Ids in records and build shapeIdsToPlot object to return
            {
                if (typeof geofenceFields == 'object') {
                    var shapeField = geofenceFields.shape;
                    var isCustomGeometryField = geofenceFields.isCustomGeometry;

                    var records = options.records;

                    if (shapeField && typeof shapeField == 'string' && String(shapeField).trim() != '' && isCustomGeometryField && typeof isCustomGeometryField == 'string' && String(isCustomGeometryField).trim() && Array.isArray(records)) {
                        var geofenceShapeIdsToPlot = {};
                        var recordsWithShapes = []; // these are the records returned for plotting

                        // go through each record and pick out shape Ids to plot
                        records.map(function (record, index) {
                            var recordShapeId = getProperty(record, shapeField);
                            var recordShapeIsCustomGeometry = getProperty(record, isCustomGeometryField);

                            if (recordShapeId && String(recordShapeId).trim() != '') {
                                geofenceShapeIdsToPlot[recordShapeId] = recordShapeIsCustomGeometry;
                                recordsWithShapes.push(record);
                            }
                            else {
                                // record has no territory and does not go into list of records with shapes
                                metaData.geofenceRecordsWithoutShape.push(record);
                            }
                        });


                        response.success = true;
                        response.shapesToPlot = geofenceShapeIdsToPlot;
                        response.records = recordsWithShapes;
                    }
                    else {
                        response.success = false;
                        response.message = 'Records not found or geofence base object not properly configured';
                    }
                }
                else {
                    response.success = false;
                    response.message = 'Could not locate record Geofence layer fields';
                }
            }
            else {
                response.success = false;
                response.message = 'Unknown geofence type';
            }
        }
        else // geofence data could not be successfully located
        {
            response.success = false;
            response.message = 'Geofence layer data not found';
        }

        // resolve promise with final response
        $dfd.resolve(response);

        // return promise
        return $dfd.promise();
    },

    /*
     ****************************************************************************************************************************************************************************************************************
     *                                                                                                                                                                                                              *
     *                                                                                                                                                                                                              *
     *                              LIVE FUNCTIONS section                                                                                                                                                          *
     *                                                                                                                                                                                                              *
     *                                                                                                                                                                                                              *
     ****************************************************************************************************************************************************************************************************************
     */
    getLiveDeviceReportDateAndTimeCriteria: function getLiveDeviceReportDateAndTimeCriteriaAlias($plottedQuery) {
        var liveDeviceReportDateAndTimeCriteria = [];

        try {
            var queryMetaData = $($plottedQuery).data() || {};

            var filterByLastReportDateAndTimeData = getProperty(queryMetaData, 'advancedOptions.liveOptions.filterByLastReportDateAndTime', false) || getProperty(queryMetaData, 'advancedOptions.layerTypeOptions.live.filterByLastReportDateAndTime', false);

            if (filterByLastReportDateAndTimeData && typeof filterByLastReportDateAndTimeData == 'object') {
                var dateTimeData = filterByLastReportDateAndTimeData.dateTime;
                var filterByLastReportDateTimeCriteria = MAPlotting.buildLiveDateTimeCriteria(dateTimeData);

                if (filterByLastReportDateTimeCriteria) {
                    liveDeviceReportDateAndTimeCriteria.push(filterByLastReportDateTimeCriteria);
                }

            }
        }
        catch (e) { console.warn(e); }

        finally { return { criteria: liveDeviceReportDateAndTimeCriteria }; }
    },

    buildLiveDateTimeCriteria: function (dateTimeDataList) {
        var result = null;

        try {
            if (Array.isArray(dateTimeDataList)) {
                var dateTimeData = dateTimeDataList[0];

                if (dateTimeData && typeof dateTimeData == 'object') {
                    var dateTimeRange = dateTimeData.dateTimeRange;
                    var dateInputFormat = String(dateTimeData.dateInputFormat).toUpperCase();

                    var fromDate = dateTimeData.fromDate;
                    var toDate = dateTimeData.toDate;

                    var duration = dateTimeData.duration;
                    var timeUnits = dateTimeData.timeUnits;

                    var dateTimeRelation = dateTimeData.dateTimeRelation;

                    var timezone = getProperty(MASystem, 'User.timezoneId');

                    if (dateTimeRange == 'today' || dateTimeRange == 'yesterday') {
                        result = {
                            operator: 'EQUALS',
                            time: dateTimeRange,
                            type: 'date',
                            tz: timezone,
                        };
                    }
                    else if (dateTimeRange == 'date') {
                        var t1, t2;

                        if (fromDate == '' && toDate != '') // from date blank - to date
                        {
                            var twoYearsAgoMom = moment().subtract(2, 'years');

                            if (twoYearsAgoMom.isValid()) {
                                fromDate = twoYearsAgoMom.format(dateInputFormat);
                            }
                        }
                        else if (fromDate != '' && toDate == '') // from date - to date blank
                        {
                            toDate = 'today';
                        }

                        if (fromDate != '' && toDate != '') {
                            if (fromDate == 'today' || fromDate == 'yesterday' || fromDate == 'tomorrow') {
                                t1 = fromDate;
                            }

                            if (toDate == 'today' || toDate == 'yesterday' || toDate == 'tomorrow') {
                                t2 = toDate;
                            }

                            if (validateDate(fromDate).success) {
                                var fromMom = moment(fromDate, dateInputFormat);

                                if (fromMom.isValid()) {
                                    t1 = fromMom.valueOf();
                                }
                            }

                            if (validateDate(toDate).success) {
                                var toMom = moment(toDate, dateInputFormat);

                                if (toMom.isValid()) {
                                    t2 = toMom.valueOf();
                                }
                            }
                        }


                        if ((t1 || t1 == 0) && (t2 || t2 == 0)) {
                            result = {
                                operator: 'WITHIN',
                                type: 'date',
                                t1: t1,
                                t2: t2,
                                tz: timezone,
                            };
                        }
                    }
                    else if (dateTimeRange == 'duration') {
                        var t1, t2;

                        if (isNum(duration)) {
                            var fromMom = moment().subtract(duration, timeUnits);

                            if (fromMom.isValid()) {
                                t1 = fromMom.valueOf();
                            }
                        }

                        if (isNum(t1)) {
                            result = {
                                operator: 'WITHIN',
                                type: 'timestamp',
                                t1: t1,
                                t2: 'now',
                                tz: timezone,
                            };

                            if (dateTimeRelation == 'not_in') {
                                result.negate = true;
                            }
                            else if (dateTimeRelation == 'in') {
                                result.negate = false;
                            }
                            else {
                                result = null;
                            }
                        }
                    }
                }
            }
        }
        catch (e) { console.warn(e); }

        return result;
    },

    getLatestDeviceLocations: function getLatestDeviceLocationsAlias(deviceIds, callback) {
        callback = callback || function () { };

        var resp = { count: 0 }; // function final response

        var responsePositions = [];
        var responseCount = 0;

        var plotQueue = async.queue(function (queryData, cb) {
            if (queryData.stopQueue) {
                resp.success = true;
                resp.count = 0;
                resp.positions = [];
                cb(resp);
            }
            else {
                Visualforce.remoting.Manager.invokeAction(MARemoting.live_phase_4, queryData.liveAPIVersion, queryData.deviceIds, function (response, event) {
                    if (event.status) // remote call successful
                    {
                        cb(response);
                    }
                    else // remote call failed
                    {
                        cb({ success: false, message: 'remote call failed. ' + getProperty(event, 'message') });
                    }

                }, { buffer: false, escape: true, timeout: 120000 }); // end inner remote call}
            }

        });

        plotQueue.concurrency = 5;

        if (Array.isArray(deviceIds)) {
            if (deviceIds.length == 0) {
                plotQueue.push({ stopQueue: true }, function (res) { });
            }
            else {
                // create batches
                // var newArray = deviceIds.concat(deviceIds);
                var devicesIdsArrays = MA.Util.createBatchable(deviceIds, 50);

                var numOfArrays = devicesIdsArrays.length;

                for (var c = 0; c < numOfArrays; c++) {
                    var devicesIdArray = devicesIdsArrays[c];
                    var reqData = {
                        deviceIds: devicesIdArray,
                        liveAPIVersion: '1', // MASystem.Organization.MapAnythingLiveAPIVersion,
                    };
                    plotQueue.push(reqData, function (res) {
                        if (!res.success) // remote call was not successfull at getting results from the live api
                        {
                            resp.success = resp.success || res.success;

                            // failed because apex remote call was not successfull. add the batch that failed to failed devices array
                            resp.failed = (resp.failed || []).concat(reqData.deviceIds);
                        }
                        else // remote call successfully received a result from the live api. The result itself could be a success or fail
                        {
                            var result = res.result || {};

                            if (result.success) {
                                // validate lat lng is in range;
                                //var location = 
                                resp.positions = (resp.positions || []).concat(res.result.positions);
                                resp.count += res.result.count;
                            }
                            else {
                                // failed because result returned from live api was invalid. add the batch that failed to failed devices array
                                resp.failed = (resp.failed || []).concat(reqData.deviceIds);
                            }

                            resp.success = resp.success || result.success; // combine this batch success with other batches success
                        }
                    });
                }
            }

            plotQueue.drain = function () {
                callback(resp);
            };
        }

    }, // end getDeviceCurrentLocations


    /***********************************************
    * moves the given marker to the given position using animation
    * params: marker (google.maps.Marker), The New Position (google.maps.LatLng)
    ***********************************************/
    animateMarkerTo: function animateMarkerToAlias(marker, newPosition) {
        var i = 0;
        var numDeltas = 100;
        var delay = 10; //milliseconds

        var currentPosition = marker.getPosition();

        var deltaLat = (newPosition.lat - currentPosition.lat()) / numDeltas;
        var deltaLng = (newPosition.lng - currentPosition.lng()) / numDeltas;

        var tempPosition = { lat: currentPosition.lat(), lng: currentPosition.lng() };

        moveMarker(marker, deltaLat, deltaLng);

        function moveMarker(marker, deltaLat, deltaLng) {
            tempPosition.lat += deltaLat;
            tempPosition.lng += deltaLng;

            marker.setPosition(tempPosition);

            if (i != numDeltas) {
                i++;
                setTimeout(function () {
                    moveMarker(marker, deltaLat, deltaLng);

                }, delay);
            }
        }
    }, // end animateMarkerTo


    /*******************************************************************
     * For new Live Tracking History Sidebar
     * getLatestLiveData
     *******************************************************************/
    getLatestLiveData: function (deviceId) {
        var dfd = $.Deferred();

        var options = {
            method: 'get',
            action: 'devices/latest',
            subType: 'live/client',
            version: 'v1'
        };

        var parameters = {
            deviceid: deviceId
        };

        Visualforce.remoting.Manager.invokeAction(MARemoting.MapAnythingIORequest,
            options,
            parameters,
            function (res, event) {
                if (event.status) {
                    if (res && res.success) {
                        dfd.resolve(res);
                    } else {
                        MAToastMessages.showError({ 'message': 'Error retrieving latest data for this asset.', timeOut: 6000 });
                    }
                } else {
                    dfd.reject(MAToastMessages.showError({ 'message': 'Unable to retrieve latest data for this asset.', timeOut: 6000 }));
                }
            }, { escape: false, buffer: false, timeout: 120000 });

        return dfd.promise();
    },
    /*******************************************************************
     * For new Live Tracking History Sidebar
     * getLiveConfigs
     *******************************************************************/
    getLiveConfigs: function (layerId) {
        var dfd = $.Deferred();
        var nameSpace = MASystem.MergeFields.OrgNameSpace;

        // This config has really high values set for the summary config in order to prevent Stops and Speeding Events from coming back in the Summary...
        var defaultSummaryConfig = {
            speedLimitUnits: 'mph',
            speedLimitDurationTimeUnits: 'Minutes',
            speedLimitDuration: null,
            speedLimit: 250,
            configName: 'Default Configuration',
            configId: 'ma_defaultConfig',
            allowedTimeUnits: 'Minutes',
            allowedTime: 60000,
            allowedDistanceUnits: 'feet',
            allowedDistance: 700000
        };

        if (nameSpace !== 'sma') {
            Visualforce.remoting.Manager.invokeAction(
                MARemoting.getLiveConfigs,
                layerId,
                function (response, event) {
                    if (event.status) {
                        if (response && response.success) {
                            // data comes back a as a string, do some validation
                            var configData = response.data || '[]';
                            var parsedData = [];
                            if (typeof configData === 'string') {
                                try {
                                    parsedData = JSON.parse(configData);
                                } catch (e) {
                                    parsedData = [];
                                }
                            } else if (Array.isArray(configData)) {
                                parsedData = configData;
                            }

                            if (parsedData.length < 1) {
                                // Add a default configuration in the case there are no existing configurations in Live package...
                                parsedData.push(defaultSummaryConfig)
                            }
                            dfd.resolve(parsedData);
                        } else {
                            console.warn('Error while retrieving Live Config');
                            dfd.resolve([defaultSummaryConfig]);
                        }
                    } else {
                        console.warn('Error while retrieving Live Config: ' + event.message);
                        dfd.resolve([defaultSummaryConfig]);
                    }
                }, { buffer: false, escape: false, timeout: 30000 }
            );
        } else {
            var data = [defaultSummaryConfig];
            dfd.resolve(data);
        }
        return dfd.promise();
    },
    /*******************************************************************
     * For new Live Tracking History Sidebar
     * toggleLiveTrackingHistorySidebar
     *******************************************************************/
    toggleLiveTrackingHistorySidebar: function (button) {
        var $button = $(button)
        var $tooltipContent = $button.closest('#tooltip-content');
        var toolTipData = $tooltipContent.data() || {};
        var record = toolTipData.recordInfo;
        var deviceId = getProperty(record, 'device.deviceId', false);
        var $deviceHistoryInputs = $tooltipContent.find('.device-history-input');
        var $selectedConfig = $tooltipContent.find('#live-configs');
        var $dateInput;

        if (MA.isMobile) {
            $dateInput = $deviceHistoryInputs.find('.ma-datepicker');
        }
        else {
            $dateInput = $deviceHistoryInputs.find('.date-input');
            $dateInputEndDate = $deviceHistoryInputs.find('.date-input-enddate');
        }

        var $liveStartTime = $deviceHistoryInputs.find('.live-starttime');
        var $liveEndTime = $deviceHistoryInputs.find('.live-endtime');
        var $liveTimezone = $deviceHistoryInputs.find('.live-time-zone');
        var startDate = $dateInput.eq(0).val().trim();
        var endDate = $dateInputEndDate.eq(0).val().trim() || startDate;

        var dateFormat = getProperty(MASystem, 'User.dateFormat', false);
        dateFormat = dateFormat.toUpperCase();

        var userLocale = getProperty(MASystem, 'User.UserLocale', false);

        // Check that end date is not before start date.
        if (startDate != null && endDate != null) {
            if (moment(startDate, dateFormat).locale(userLocale).valueOf() > moment(endDate, dateFormat).locale(userLocale).valueOf()) {
                MAToastMessages.showError({
                    message: 'Validation Error',
                    subMessage: 'Your end date cannot be before your start date. Please adjust your start and end dates.',
                    timeOut: 6000
                })
                return;
            }
        }

        var daysSearching = moment.duration(moment(endDate, dateFormat).locale(userLocale).diff(moment(startDate, dateFormat).locale(userLocale))).asDays();
        if (daysSearching > 7) {
            MAToastMessages.showError({ 'message': 'You can only select up to seven days', timeOut: 6000 })
            return;
        }

        var monthsBeforeCurrentDate = moment.duration(moment().diff(moment(startDate, dateFormat).locale(userLocale))).asMonths();

        if(monthsBeforeCurrentDate > 6)
        {
            MAToastMessages.showError({ 'message': 'Start time cannot be older than 6 months', timeOut: 6000 })
            return;
        }

        var collapseOptions = daysSearching == 0 ? false : true;

        var layerPromises = [];
        var multiPathBounds = [];
        var layers = []
        // convert dates to moment obj in order to properly handle TZ and format differences
        startDate = moment(startDate, dateFormat).locale(userLocale);
        endDate = moment(endDate, dateFormat).locale(userLocale);
        while (startDate.isSameOrBefore(endDate)) {
            var layerOptions = {
                component: 'LiveTrackingLayer',
                selectedDeviceId: deviceId,
                record: record,
                qid: Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1) + '_live', // We need a unique id.
                liveLayerQid: record.qid,
                startTime: $liveStartTime.eq(0).val().trim(),
                endTime: $liveEndTime.eq(0).val().trim(),
                selectedDate: startDate.format(dateFormat),
                selectedTimezone: $liveTimezone.eq(0).val().trim(),
                selectedConfig: $selectedConfig.eq(0).val(),
                selectedAsset: $('.tooltip-header').find('.name a').html(),
                collapseOptions: collapseOptions
            };
            
            layers.push(layerOptions);
            
            startDate = startDate.add(24, 'hours');
        }

        window.VueEventBus.$emit('add-layers', layers, function (routeData) {

        })

        return;

    },
    /*******************************************************************
     * For new Live Tracking History Sidebar
     * Hide/Show plotted line
     *******************************************************************/
    toggleDeviceHistoryPolyline: function toggleDeviceHistoryPolylineAlias(record, showLayer) {
        var dfd = $.Deferred();

        try {
            record = record || {};
            var deviceHistory = record.DeviceHistory || {};

            var deviceHistoryPolylines = deviceHistory.polylines;
            var deviceHistoryVertices = deviceHistory.vertices;

            // Hide vertices...
            if (Array.isArray(deviceHistoryVertices)) {
                var historyVerticesLength = deviceHistoryVertices.length;
                for (var v = 0; v < historyVerticesLength; v++) {
                    var verticeMarker = deviceHistoryVertices[v];

                    // if (!verticeMarker.device.polylineEdge) {
                    if (showLayer) {
                        verticeMarker.setMap(MA.map);
                    } else {
                        verticeMarker.setMap(null);
                    }
                    // }
                }
            }

            // Hide polylines...
            if (Array.isArray(deviceHistoryPolylines)) {
                var historyPolylinesLength = deviceHistoryPolylines.length;
                for (var p = 0; p < historyPolylinesLength; p++) {
                    var polyline = deviceHistoryPolylines[p];

                    if (showLayer) {
                        polyline.setMap(MA.map);
                    } else {
                        polyline.setMap(null);
                    }
                }
            }
            MA.Map.InfoBubble.hide();
            dfd.resolve({ success: true });
        }
        catch (e) {
            dfd.reject({ success: false, type: 'exception', exception: e, message: 'Unexpected error while toggling plotted history for record ' + record.Name || '' + '(' + record.Id || '' + ')' });
        }

        return dfd.promise();
    },

    /*******************************************************************
     * maps and handles click events of the buttons under the live tabs
     * of a marker Infobubble to respective actions
     *******************************************************************/
    liveButtonHandler: function liveButtonHandlerAlias(button, event, $plottedQuery, marker) {

        var $button = $(button);
        var buttonData = $button.data();
        var action = buttonData.action;
        var $trackLoading = MAToastMessages.showLoading({ message: MASystem.Labels.MA_Loading + '...', timeOut: 0, extendedTimeOut: 0 });
        var $tooltipContent;
        var toolTipData;
        var record;
        if (MA.isMobile) {
            $tooltipContent = $('#markerTooltipBody');
            toolTipData = $('#markerTooltipWrap').data();
            record = toolTipData.record;
        }
        else {
            $tooltipContent = $button.closest('#tooltip-content');
            toolTipData = $tooltipContent.data() || {};
            record = toolTipData.recordInfo;
        }
        var assetName;

        //$button.siblings('.error').hide();
        $button.siblings('.saving').show();

        $tooltipContent.find('.live-button').prop('disabled', true);

        if (action && record) {
            assetName = record.Name;

            switch (action) {
                case "Remove History":
                    MAPlotting.removeDeviceHistory(record, function (res) {
                        $button.siblings('.saving').hide();
                        MAToastMessages.hideMessage($trackLoading);
                        if (res.success) {
                            //$button.siblings('.error').hide();
                        }
                        else {
                            //$button.siblings('.error').show();
                            MAToastMessages.showError({ 'message': 'Error while removing history', timeOut: 6000 });
                            //growlError($('#growl-wrapper'), 'Error while removing history', 6000);
                        }
                        $tooltipContent.find('.live-button').prop('disabled', false);
                    });
                    break;

                case "Track History":
                    $tooltipContent.find('input.live-input').datepicker("disable");
                    $tooltipContent.find('input.live-input').prop("readonly", true);
                    MAPlotting.trackDeviceHistory(record, marker, $plottedQuery, $tooltipContent, function (res) {
                        try {
                            // process response
                            if (res.success) {
                                // notify user if no device history was found but really no error occured and it was a res.success = true anyway
                                if (res.message && (res.message + '').toLowerCase().includes('no device history found')) {
                                    NotifyWarning('No device history', 'There is no tracking history for <b>' + (assetName || 'Asset') + '</b> for the date and time selected.');
                                }
                            }
                            else {
                                var errMsg = res.message || 'There was an issue loading tracking history. Please try again.';
                                NotifyError('Track History error', errMsg);
                            }

                            // if this is mobile and phone size, close tooltip to bring device history into view
                            if (MA.isMobile && MALayers.isPhoneSize()) {
                                MALayers.moveToTab('hideTooltip');
                            }

                            // close tooltip
                            MA.Map.InfoBubble.hide();
                        }
                        catch (e) {
                            console.warn(e);
                            NotifyError('Error while processing tracking device history action results.');
                        }
                        finally {
                            // hide a bunch of loading/progress UI stuff
                            $button.siblings('.saving').hide();
                            MAToastMessages.hideMessage($trackLoading);

                            // re-enable tooltip inputs that were temporarily disabled as device history was plotting
                            $tooltipContent.find('input.live-input').datepicker("enable");
                            $tooltipContent.find('input.live-input').prop("readonly", false);
                            $tooltipContent.find('.live-button').prop('disabled', false);

                            if ($tooltipContent.find('input.live-input.hasDatepicker').is(":focus")) {
                                $tooltipContent.find('input.live-input.hasDatepicker').datepicker('show');
                            }
                        }
                    });
                    break;

                default:
                    $button.siblings('.saving').hide();
                    break;
            }
        }
        else {
            MAToastMessages.hideMessage($trackLoading);
            $button.siblings('.saving').hide();
            MAToastMessages.showError({ 'message': 'There was an issue loading tracking history. Please try again later.', timeOut: 6000 });;
            $tooltipContent.find('.live-button').prop('disabled', false);
        }
    }, // end liveButtonHandler


    /*******************************************************************
    * removes plotted device history on the given recors if any
    * device history exists
    *******************************************************************/
    removeDeviceHistory: function removeDeviceHistoryAlias(record, callback) {
        try {
            // callback = callback || function(){};
            callback = (typeof callback == 'function' ? callback : function () { });

            record = record || {};
            var deviceHistory = record.DeviceHistory || {};

            var deviceHistoryPolylines = deviceHistory.polylines;
            var deviceHistoryVertices = deviceHistory.vertices;

            // delete vertices
            if (Array.isArray(deviceHistoryVertices)) {
                var historyVerticesLength = deviceHistoryVertices.length;
                for (var v = 0; v < historyVerticesLength; v++) {
                    var verticeMarker = deviceHistoryVertices[v];
                    verticeMarker.setMap(null);
                }
                deviceHistoryVertices = null;
            }

            // delete polylines
            if (Array.isArray(deviceHistoryPolylines)) {

                var historyPolylinesLength = deviceHistoryPolylines.length;
                for (var p = 0; p < historyPolylinesLength; p++) {
                    var polyline = deviceHistoryPolylines[p];
                    polyline.setMap(null);
                }
                deviceHistoryPolylines = null;
            }

            deviceHistory = null;

            MA.Map.InfoBubble.hide();
            callback({ success: true });
        }
        catch (e) {
            callback({ success: false, type: 'exception', exception: e, message: 'Unexpected error while removing plotted history for the record ' + record.Name || '' + '(' + record.Id || '' + ')' });
        }
    }, // end removeDeviceHistory

    removeAllTrackingHistories: function ($plottedQuery) {
        var queryMetaData = $($plottedQuery).data();

        if (queryMetaData && typeof queryMetaData == 'object') // plotted query exists
        {
            var layerType = queryMetaData.layerType;

            if (/live/i.test(layerType)) // live layer
            {
                var records = queryMetaData.records;

                for (var recId in records) {
                    var record = records[recId];

                    if (record) {
                        MAPlotting.removeDeviceHistory(record, function (res) { });
                    }
                }
            }
        }
    },

    /********************************************************
    * Process device history input and begin plotting process
    ********************************************************/
    trackDeviceHistory: function trackDeviceHistoryAlias(record, marker, $plottedQuery, $tooltipContent, callback) {
        callback = callback || function () { };

        try {
            record = record || {};
            var recordId = record.Id;
            var queryMetadata = $($plottedQuery).data();
            var device = record.device;

            if (device instanceof MADevice) {
                var deviceId = device.getId();

                $tooltipContent = $($tooltipContent);
                // select input elements
                var $deviceHistoryInputs = $tooltipContent.find('.device-history-input');
                var $dateInput;
                // fix mobile tracking history, slds class changes
                if (MA.isMobile) {
                    $dateInput = $deviceHistoryInputs.find('.ma-datepicker');
                }
                else {
                    $dateInput = $deviceHistoryInputs.find('.date-input');
                }
                var $liveStartTime = $deviceHistoryInputs.find('.live-starttime');
                var $liveEndTime = $deviceHistoryInputs.find('.live-endtime');
                var $livePathColorDiv = $deviceHistoryInputs.find('.live-history-color');
                var $livepointDensity = $deviceHistoryInputs.find('.live-point-density');
                var $liveTimezone = $deviceHistoryInputs.find('.live-time-zone');
                var $livePathColor = $livePathColorDiv.find("input:radio[name='colorChoice']:checked");


                if ($dateInput.length == 1 && $liveStartTime.length == 1 && $liveEndTime.length == 1 && $livepointDensity.length == 1 && recordId /*&& $livePathColor.length == 1*/) {
                    // get inputs
                    var day = $dateInput.eq(0).val().trim();
                    var starttime = $liveStartTime.eq(0).val().trim();
                    var endtime = $liveEndTime.eq(0).val().trim();
                    var inputTimezoneId = $liveTimezone.eq(0).val().trim();
                    var pointDensity = $livepointDensity.eq(0).val().trim();

                    // get color input
                    // var defaultColorKey = 'cor1';
                    var pathColor = $livePathColor.val() || '#4986E7';

                    // get date time inputs
                    // time moment helper variables
                    var dateFormatString = String(getProperty(MASystem || {}, 'User.dateFormat', false)).toUpperCase();


                    /***********************************************
                    *
                    * Start time validation and input checking
                    *
                    *******************************************/
                    var dayIsValid = moment(day, dateFormatString).isValid();
                    var startIsValid = validateTime(starttime);
                    var endIsValid = validateTime(endtime);

                    if (!dayIsValid) {
                        callback({ success: false, message: 'Invalid Day input', error: dayIsValid.message });
                        return;
                    }

                    if (startIsValid.success) {
                        starttime = startIsValid.time12hr; // 12-hour format
                    }
                    else {
                        callback({ success: false, message: 'Invalid start time input', error: startIsValid.message });
                        return;
                    }

                    if (endIsValid.success) {
                        endtime = endIsValid.time12hr; // 12-hour format
                    }
                    else {
                        callback({ success: false, message: 'Invalid end time input', error: endIsValid.message });
                        return;
                    }
                    /***********************************************
                    *
                    * End time validation and input checking
                    *
                    *******************************************/

                    // moment date and time format
                    var dateFormat = dateFormatString.trim().toUpperCase();
                    var timeFormat = "h:mm a"; // 12 hour format

                    //format the datetimes based on SF timezone offset
                    var dateAndTimeFormat = dateFormat + ' ' + timeFormat;
                    var startDateTime = moment.tz(day + ' ' + starttime, dateAndTimeFormat, inputTimezoneId);
                    var endDateTime = moment.tz(day + ' ' + endtime, dateAndTimeFormat, inputTimezoneId);

                    if (startDateTime.isValid() && endDateTime.isValid()) {
                        var liveStartTime = startDateTime.valueOf().toString();
                        var liveEndTime = endDateTime.valueOf().toString();

                        var options = {
                            deviceId: deviceId,
                            version: '1', // MASystem.Organization.MapAnythingLiveAPIVersion,
                            starttime: liveStartTime,
                            endtime: liveEndTime,
                        };

                        MAPlotting.getDeviceHistory(options, function (res) {
                            try {
                                if (res.success) {
                                    if (res.result.success) {
                                        var positions = getProperty(res, 'result.positions');

                                        if (positions && Array.isArray(positions)) {
                                            var numOfPositions = positions.length;

                                            if (numOfPositions < 1) {
                                                callback({ success: true, message: 'No device history found' });
                                            }
                                            else {
                                                var deviceHistoryCoordinates = [];
                                                var pathBounds = new google.maps.LatLngBounds();

                                                var mandatoryEventTypes = null; // ['PRIOD', 'APOSN', 'AMOTN'];

                                                MAPlotting.getFilteredDeviceHistory(positions, pointDensity, mandatoryEventTypes, function (res) {
                                                    try {
                                                        if (res.success) {
                                                            var devices = res.devices;

                                                            MAPlotting.plotRecordDeviceHistory(devices, record, pathColor, inputTimezoneId, { pointDensity: pointDensity }, function (res) {
                                                                try {
                                                                    callback(res);
                                                                }
                                                                catch (e) {
                                                                    console.warn(e);
                                                                    callback({ success: false, 'message': 'Unexpected error while tracking device history.', exception: e });
                                                                }
                                                            });

                                                        }
                                                    }
                                                    catch (e) {
                                                        callback({ success: false, 'message': 'Unexpected error while plotting record device history.', exception: e });
                                                        console.warn(e);
                                                    }
                                                });
                                            }
                                        }
                                    } else {
                                        callback({ success: false, 'message': res.result.message, error: res });
                                    }
                                }
                                else {
                                    callback({ success: false, 'message': 'Failed to get device history.', error: res });
                                }
                            }
                            catch (e) {
                                callback({ success: false, 'message': 'Unexpected error while tracking device history.', exception: e });
                                console.warn(e);
                            }
                        });
                    }
                    else {
                        callback({ success: false, message: 'Processed time input is invalid.' });
                    }
                }
                else {
                    callback({ success: false, message: 'Error retreiving input or finding related record.' });
                }
            }
        } catch (e) {
            callback({ success: false, message: 'Unexpected error while plotting device history.', type: 'exception', exception: e });
        }
    }, // end trackDeviceHistory


    /********************************************************
    * creates vertices and polylines plotting the device
    * history of the given record on the map.
    * Assigns click handlers of the vertices and polylines
    ********************************************************/
    plotRecordDeviceHistory: function plotRecordDeviceHistoryAlias(devices, record, pathColor, timezoneId, options, callback) {
        // Sort devices by timestamp
        devices.sort(function (a, b) {

            if (a.timestamp < b.timestamp) {
                return -1;
            }
            if (a.timestamp > b.timestamp) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });
        try {
            if (record) {
                var deviceHistory = record.deviceHistory;

                // first clear any existing plotted history of the same record
                MAPlotting.removeDeviceHistory(record, function (res) {
                    try {
                        if (res.success) {
                            var devicesLength = devices.length;
                            var pathBounds = new google.maps.LatLngBounds();

                            record.DeviceHistory = {
                                vertices: [],
                                polylines: [],
                            };


                            for (var i = 0; i < devicesLength; i++) {
                                var device = new MADevice(devices[i]);

                                // current device history point
                                if (device && device.getPosition()) {
                                    var devicePosition = device.getPosition(); // current device

                                    // device information
                                    var deviceEvent = device.getEvent();
                                    var deviceFormattedDate = device.getFormattedDate(timezoneId);
                                    var deviceFormattedTime = device.getFormattedTime(timezoneId);

                                    // build device title with event name, and last reported date and time, whichever exists
                                    var deviceTitle = '';
                                    deviceTitle += deviceEvent ? 'Event: ' + (deviceEvent.name || deviceEvent.code || '') + ' ' + '\n' : '';
                                    deviceTitle += deviceFormattedDate ? (deviceFormattedDate + ' ') : '';
                                    deviceTitle += deviceFormattedTime ? (deviceFormattedTime + ' ') : '';

                                    var icon;

                                    if (i == 0) {
                                        icon = MAPlotting.getFirstIcon();
                                    } else if ((i + 1) == devicesLength) {
                                        icon = MAPlotting.getLastIcon();
                                    } else {
                                        icon = MASystem.Images.trackingHistoryMarker;
                                    }

                                    var vertice = new google.maps.Marker({
                                        position: devicePosition,
                                        title: deviceTitle,
                                        icon: icon,
                                        device: device,
                                        record: record,
                                        timezoneId: timezoneId,
                                    });

                                    // get the last vertice we drew on the map and draw a polyline to connect this current vertice to the previous vertice
                                    var lastVertice = (MA.getProperty(record, ['DeviceHistory', 'vertices']) || []).slice(-1)[0];

                                    // current device history point click listener. builds tooltip.
                                    google.maps.event.addListener(vertice, 'click', function (e) {
                                        e.stop();
                                        MAPlotting.deviceHistoryVerticeClick.call(this, e);
                                    });

                                    // draw vertice on map
                                    if (!isNum(options.pointDensity) || Number(options.pointDensity) != 0) { // don't draw history points when density is zero
                                        // if (!device.polylineEdge) {
                                        vertice.setMap(MA.map);
                                        // }
                                    }

                                    // add vertice to our collection of vertices so far
                                    record.DeviceHistory.vertices.push(vertice);

                                    if (lastVertice && lastVertice.getPosition()) {
                                        var edgeVertices = [lastVertice.getPosition(), vertice.getPosition()];

                                        var arrow = {
                                            path: 'M -2,0 0,-2 2,0',
                                            strokeColor: '#FFF',
                                            fillColor: '#FFF',
                                            fillOpacity: 0.0,
                                            scale: 1
                                        };


                                        var edge = new google.maps.Polyline({
                                            path: edgeVertices,
                                            geodesic: true,
                                            strokeColor: pathColor || '#0088cc',
                                            strokeWeight: 7,
                                            recordId: record.Id,
                                            record: record,
                                            firstVertice: lastVertice,
                                            secondVertice: vertice,
                                            icons: [
                                                {
                                                    icon: arrow,
                                                    offset: '20%'
                                                },
                                                {
                                                    icon: arrow, // google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                                    offset: '40%'
                                                },
                                                {
                                                    icon: arrow, // google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                                    offset: '60%'
                                                },
                                                {
                                                    icon: arrow, // google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                                    offset: '80%'
                                                }
                                            ],
                                        });

                                        google.maps.event.addListener(edge, 'click', function (e) {
                                            e.stop();
                                            MAPlotting.deviceHistoryPolylineClick.call(this, e);
                                        });

                                        // make line segment visible on map
                                        //  if (device.polylineEdge) {
                                        // add to array of edges which form eventual path
                                        record.DeviceHistory.polylines.push(edge);
                                        edge.setMap(MA.map);
                                        //  }

                                        // add vertice to bounds object so as to zoom in the right amount later
                                        pathBounds.extend(vertice.getPosition());
                                    }
                                } // end if
                            } // end for

                            // bring all vertices drawn into view
                            if (record.DeviceHistory.vertices.length > 1) {
                                MA.map.fitBounds(pathBounds);
                            } else if (record.DeviceHistory.vertices.length == 1) {
                                if (record.DeviceHistory.vertices[0]) {
                                    MA.map.panTo(record.DeviceHistory.vertices[0].getPosition());
                                }
                            }

                            // success!
                            callback({ success: true });
                        }
                        else // error occured while trying to delete already plotted history
                        {
                            callback({ success: false, message: 'Previously plotted history on the same record could not be successfully removed. ' + res.message || '' });
                        }
                    }
                    catch (e) {
                        callback({ success: false, message: 'Error while plotting record device history.', exception: e });
                        console.warn(e);
                    }
                });
            }
            else {
                callback({ success: false, message: 'Record not found.' });
            }
        }
        catch (e) {
            callback({ success: false, message: 'Unexpected error while plotting device history.', type: 'exception', exception: e });
        }
    }, // end plotRecordDeviceHistory


    getFirstIcon: function () {
        var firstWaypointSVGTemplate = $('#templates #svgMarkerWaypointFirst')
            .clone()
            .wrap('<div/>')
            .parent()
            .html();

        var firstWaypointSVG = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(firstWaypointSVGTemplate));

        return {
            url: 'data:image/svg+xml;base64,' + firstWaypointSVG,
            anchor: new google.maps.Point(14, 35),
            scaledSize: { height: 35, width: 28 }
        };
    },

    getLastIcon: function () {
        const lastWaypointSVGTemplate = window.$('#templates #svgMarkerWaypointLast')
            .clone()
            .wrap('<div/>')
            .parent()
            .html();

        var lastWaypointSVG = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(lastWaypointSVGTemplate));

        return {
            url: 'data:image/svg+xml;base64,' + lastWaypointSVG,
            anchor: new google.maps.Point(14, 35),
            scaledSize: { height: 35, width: 28 }
        };
    },

    getFirstLastIcon: function () {
        var firstLastWaypointSVGTemplate = $('#templates #svgMarkerWaypointCombo')
            .clone()
            .wrap('<div/>')
            .parent()
            .html();

        var firstLastWaypointSVG = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(firstLastWaypointSVGTemplate));

        return {
            url: 'data:image/svg+xml;base64,' + firstLastWaypointSVG,
            anchor: new google.maps.Point(14, 35),
            scaledSize: { height: 35, width: 42 }
        };
    },

    /***********************************************************************
* given the point density and a list of retreived device history objects
* returns a filtered list of device objects based on the point density
************************************************************************/
    getFilteredDeviceHistory: function getFilteredDeviceHistoryAlias(deviceHistoryPoints, pointDensity, mandatoryEvents, callback) {
        deviceHistoryPoints = deviceHistoryPoints || [];

        // for these events, all points will be plotted regardless of the point density
        var eventsMap = (new MADevice({})).eventsMap || {};
        var events = Object.keys(eventsMap);
        var nonMondatoryEvents = ['PRIOD', 'APOSN', 'AMOTN', 'position_update'];
        var mandatoryEvents = mandatoryEvents || events.filter(function (event, index, events) {
            return nonMondatoryEvents.indexOf(event) == -1;
        });

        var numOfPositions = deviceHistoryPoints.length;

        try {
            var resultPoints = []; //return value

            // extract device history positions

            if (pointDensity == 50) // show all mandatory device events. Skip every other non-mandatory devic event.
            {
                var eventPlotted = {};
                var label = 0; // label to display on device history point when plotted. devices filtered out also do get labels.

                for (var i = 0; i < numOfPositions; i++) {
                    if (deviceEvent != 'application_opened') // always ignore 'application_opened' device events
                    {
                        label++; // increment numeric label

                        var device = deviceHistoryPoints[i];
                        var deviceEvent = device.eventType;

                        if (mandatoryEvents.indexOf(deviceEvent) == -1) // non-mandatory event. skip if the last similar event was not skipped. Every other
                        {
                            if (eventPlotted[deviceEvent] === true) // if was plotted last time, skip
                            {
                                eventPlotted[deviceEvent] = false;
                                // device.plot = false;
                                // resultPoints.push(device);
                            }
                            else // plot this time
                            {
                                // resultPoints.push(device);
                                eventPlotted[deviceEvent] = true;
                                // device.plot = true;
                                device.label = label;
                                resultPoints.push(device);
                            }
                        }
                        else // mandatory device event. always plot
                        {
                            // device.plot = true;
                            device.label = label;
                            resultPoints.push(device);
                        }
                    }
                }
            }
            else // 100% point density. get all devices but ignore application_opened
            {
                var label = 0;

                for (var i = 0; i < numOfPositions; i++) {
                    var device = deviceHistoryPoints[i];
                    var deviceEvent = device.eventType;

                    if (deviceEvent != 'application_opened') { // always ignore 'application_opened' device events
                        // device.plot = true;
                        label++;
                        device.label = label;
                        resultPoints.push(device);
                    }
                }
            }

            callback({ success: true, devices: resultPoints });
        }
        catch (e) {
            callback({ success: false, type: 'exception', exception: e, message: 'Unexpected error while computing device history point density.' });
        }
    }, // end getFilteredDeviceHistory



    /***********************************************
     * makes a remote call to retreive device history
     * options: Device Id (string), Live API Version (string|num), Start Time, End Time (timestamp|number)
     * options.deviceId, options.liveAPIVersion, options.starttime, options.endtime
     ***********************************************/
    getDeviceHistory: function getDeviceHistoryAlias(options, callback) {
        options = options || {};
        callback = callback || function () { };

        var deviceId = options.deviceId || '';
        var liveAPIVersion = options.version;
        var starttime = options.starttime;
        var endtime = options.endtime;

        // creating a batch for history since reports can be too large.
        var batchedTimeIntervals = MAPlotting.buildDeviceHistoryTimes(starttime, endtime);

        // set up a queue
        var devicePositions = [];
        var hasError = false;
        var q = async.queue(function (timeOptions, queueCallback) {
            Visualforce.remoting.Manager.invokeAction(MARemoting.live_history, deviceId, liveAPIVersion, timeOptions.start, timeOptions.end, function (res, event) {
                if (event.status) {
                    var result = res.result || {};
                    devicePositions = devicePositions.concat(result.positions || []);
                    queueCallback();
                }
                else {
                    hasError = true;
                    console.warn('Error retreiving device history for time range. Start: ' + timeOptions.start + ', End: ' + timeOptions.end);
                    queueCallback();
                }
            }, { buffer: false, escape: false, timeout: 120000 });
        });
        q.concurrency = 3;

        for (var i = 0; i < batchedTimeIntervals.length; i++) {
            var intervalTime = batchedTimeIntervals[i];
            q.push(intervalTime)
        }

        q.drain = function () {
            /* original code wanted resposne to look like, keeping repetitive for now
            {
                success: boolean,
                result: {
                    success: boolean,
                    positions: []
                }
            }
            */
            if (hasError) {
                // may need to change in future
                MAToastMessages.showWarning({ message: 'History Warning', subMessage: 'Not able to retrieve all data. This could be a result of missing data or a network timeout.  Retrying this time range may fix this issue.', closeButton: true, timeOut: 20000, extendedTimeOut: 0 });
            }
            callback({ success: true, result: { success: true, positions: devicePositions } });
        };
    }, // end getDeviceHistory

    // create intervals for history
    buildDeviceHistoryTimes: function (startTime, endTime) {
        var timeChuncks = [];
        var hourSetting = 2; // change this number to increase decrease batch size
        var intervalSettings = hourSetting * 3600000; // convert hour into milliseconds
        var timeCheck = endTime;
        while (timeCheck > startTime) {
            var tempEnd = timeCheck;
            timeCheck = timeCheck - intervalSettings;
            var tempStart = timeCheck;
            if (timeCheck > startTime) {
                timeChuncks.unshift({ start: tempStart, end: tempEnd });
            } else {
                timeChuncks.unshift({ start: startTime, end: tempEnd });
            }
        }
        return timeChuncks;
    },

    /********************************************************
    * handle click event for the vertice of a
    * plotted record device history
    ********************************************************/
    deviceHistoryVerticeClick: function deviceHistoryVerticeClickAlias(event) {
        var device = this.device;
        var record = this.record;
        var timezoneId = this.timezoneId;

        if (device instanceof MADevice) {
            // retrieve table values
            var deviceLocation = device.getPosition();
            var liveFormattedAddress = device.getFormattedAddress();
            var deviceId = device.getId();
            var deviceESN = device.getESN();
            var deviceSpeed = device.getFormattedSpeed(); // speed converted to current user setting and 2 decimal places
            var deviceSpeedLimit = device.getSpeedLimit();
            var odometer = device.getFormattedOdometer();
            var deviceBatteryLife = device.getBatteryLevel();
            // var fuelEconomy = device.getFormattedFuelEconomy();
            var geocodeType = device.getGeocodeType();
            var direction = device.getDirection();
            var deviceTimestamp = device.getTimestamp();

            var formattedDate = device.getFormattedDate(timezoneId);
            var formattedTime = device.getFormattedTime(timezoneId);
            var deviceFormattedTimezone = device.getFormattedTimezone();

            var deviceEvent = device.getEvent();

            var DataNotAvailableText = 'Data Not Available';

            var infoRequired = {
                Coordinates: { value: deviceLocation ? '(' + deviceLocation.lat + ', ' + deviceLocation.lng + ')' : DataNotAvailableText },
                Location: { value: liveFormattedAddress || DataNotAvailableText },
                // 'Geocode Type': geocodeType || DataNotAvailableText,
                'Report Date': { value: formattedDate ? formattedDate : DataNotAvailableText },
                'Report Time': { value: formattedTime ? formattedTime : DataNotAvailableText },
                'Time Zone': { value: deviceFormattedTimezone ? deviceFormattedTimezone : DataNotAvailableText },
                'Event': { value: deviceEvent ? deviceEvent.name || deviceEvent.code : DataNotAvailableText },
                Direction: { value: direction || DataNotAvailableText },
                Speed: { value: isNum(deviceSpeed) ? deviceSpeed : DataNotAvailableText },
                'Posted Speed Limit': { value: deviceSpeedLimit && typeof deviceSpeedLimit == 'object' ? deviceSpeedLimit.value + ' ' + deviceSpeedLimit.unit : DataNotAvailableText },
                // 'Fuel Economy': isNum(fuelEconomy) ? fuelEconomy : DataNotAvailableText,
                Odometer: { value: isNum(odometer) ? odometer : DataNotAvailableText },
                'Battery Life': { value: isNum(deviceBatteryLife) ? deviceBatteryLife : DataNotAvailableText },  //isNum(deviceBatteryLife) ? deviceBatteryLife: DataNotAvailableText,
                'Device ID': { value: (deviceESN || deviceESN == 0) ? deviceESN : DataNotAvailableText },
            };

            // remove some information to be displayed based on the type of device
            if (/avail/i.test(device.getType())) // availability device
            {
                delete infoRequired['Odometer'];
                delete infoRequired['Direction'];
                infoRequired['Geocode Type'] = { value: geocodeType || DataNotAvailableText };
                // delete infoRequired['Fuel Economy'];
            }

            if (!/calamp/i.test(device.getVendor())) {
                delete infoRequired['Battery Life'];
            }

            var liveTableHTML = MAPlotting.create2DTableHTML({ data: infoRequired });

            if (MA.isMobile) {
                var $verticeTooltipContent = $('#live-vertice-tooltip-content');
            }
            else {
                var $verticeTooltipContent = $('#live-vertice-tooltip-content-template').clone().attr('id', 'live-vertice-tooltip-content');
            }

            $verticeTooltipContent.find('.device-history-vertice-info').html(liveTableHTML);
            $verticeTooltipContent = $(
                $verticeTooltipContent.wrap('<div></div>').show().parent().html()
                    .replace(/\/::Id::/g, MA.SitePrefix + '/' + record.Id)
                    .replace(/::Name::/g, record['tooltip1'])
                    .replace(/::Address::/g, liveFormattedAddress || '')
                    .replace(/::QueryName::/g, record.savedQueryName)
            );


            // if device has no address, reverse geocode and display
            if (!liveFormattedAddress) {
                device.updateAddress(function (res)  // reverse geocodes the address
                {
                    try {
                        if (res.success) {
                            var updatedAddress = device.getFormattedAddress();
                            var updatedDeviceAddressObject = device.getAddressObject();

                            infoRequired.Location = updatedAddress;
                            $verticeTooltipContent.find('.Location').text(updatedAddress);

                            //  update the list view columns
                            MAListView.updateRecordRowAddress(record, updatedAddress, updatedDeviceAddressObject);
                        }
                    }
                    catch (e) {
                        console.warn(e);
                    }
                });
            }

            if (MA.isMobile) {
                MALayers.showModal('live-vertice-tooltip-content');
                $('#live-vertice-tooltip-content').off('click', '.removeHistoryButton');
                $('#live-vertice-tooltip-content').on('click', '.removeHistoryButton', function () {
                    MAPlotting.removeDeviceHistory(record, function () {
                        MALayers.hideModal();
                    });
                });
            }
            else {
                $verticeTooltipContent.on('click', '.removeHistoryButton', function (e) {
                    MAPlotting.removeDeviceHistory(record, function () {
                        MA.Map.InfoBubble.hide();
                    });
                });

                MA.Map.InfoBubble.show({
                    position: this.getPosition(),
                    anchor: this,
                    minWidth: 300,
                    content: $verticeTooltipContent[0],
                });

                MA.Map.InfoBubble.adjust();
            }

            $verticeTooltipContent.show();
        }
    }, // deviceHistoryVerticeClick


    /********************************************************
    * handle click event for the line segment of a
    * plotted record device history
    ********************************************************/
    deviceHistoryPolylineClick: function deviceHistoryPolylineClickAlias(event) {
        try {
            var polyline = this || {};

            var firstVertice = polyline.firstVertice || {};
            var secondVertice = polyline.secondVertice || {};

            var firstVerticeDevice = new MADevice(firstVertice.device);
            var secondVerticeDevice = new MADevice(secondVertice.device);

            if (firstVerticeDevice instanceof MADevice && secondVerticeDevice instanceof MADevice) {
                // get polyline distance
                var formattedDistanceBetween = firstVerticeDevice.getFormattedDistance(secondVerticeDevice); // meters

                // get time difference between two vertices
                var timestampDifference = firstVerticeDevice.getTimeDifference(secondVerticeDevice); // milliseconds
                var formattedTimeDifference = isNum(timestampDifference) ? MAPlotting.millisecondsToTime(timestampDifference) : null;

                // compute average speed
                var formattedAverageSpeed = firstVerticeDevice.getFormattedAverageSpeed(secondVerticeDevice); // converted to user settings units

                // get the polyline center
                var bounds = new google.maps.LatLngBounds();
                bounds.extend(firstVertice.getPosition());
                bounds.extend(secondVertice.getPosition());
                var center = bounds.getCenter();

                // create tooltip to display
                var $polylineTooltipContent;
                if (MA.isMobile) {
                    $polylineTooltipContent = $('#live-polyline-tooltip-content');
                }
                else {
                    $polylineTooltipContent = $('#live-polyline-tooltip-content-template').clone().attr('id', 'live-polyline-tooltip-content');
                }

                var DataNotAvailableText = 'Data Not Available';

                // Info to display on tooltip
                var infoRequired = {
                    'Segment Distance': { value: isNum(formattedDistanceBetween) ? formattedDistanceBetween : DataNotAvailableText },
                    'Segment Time': { value: formattedTimeDifference ? formattedTimeDifference : DataNotAvailableText },
                    'Average Speed': { value: isNum(formattedAverageSpeed) ? formattedAverageSpeed : DataNotAvailableText },
                };

                var liveTableHTML = MAPlotting.create2DTableHTML({ data: infoRequired });
                $polylineTooltipContent.find('.device-history-polyline-info').html(liveTableHTML);


                $polylineTooltipContent = $(
                    $polylineTooltipContent.wrap('<div></div>').show().parent().html()
                        .replace(/\/::Id::/g, MA.SitePrefix + '/' + polyline.record.Id)
                        .replace(/::Name::/g, polyline.record['tooltip1'])
                        .replace(/::Address::/g, '') // no address needs to be displayed for polylines
                        .replace(/::QueryName::/g, polyline.record.savedQueryName)
                );

                $polylineTooltipContent.show();

                if (MA.isMobile) {
                    MALayers.showModal('live-polyline-tooltip-content');
                    $('#live-polyline-tooltip-content').off('click', '.removeHistoryButton');
                    $('#live-polyline-tooltip-content').on('click', '.removeHistoryButton', function () {
                        MAPlotting.removeDeviceHistory(polyline.record, function () {
                            MALayers.hideModal();
                        });
                    });
                }
                else {
                    $polylineTooltipContent.on('click', '.removeHistoryButton', function (e) {
                        MAPlotting.removeDeviceHistory(polyline.record, function () {
                            MA.Map.InfoBubble.hide();
                        });
                    });

                    MA.Map.InfoBubble.show({
                        position: center,
                        minWidth: 200,
                        content: $polylineTooltipContent[0] || '',
                    });

                    MA.Map.InfoBubble.adjust();
                }
            }
            else {
                var errMsg = 'There was an issue retreiving line segment information. Please try again later.';
                MAToastMessages.showError({ 'message': errMsg, timeOut: 6000 });
            }
        } catch (e) {
            var errMsg = 'There was an issue displaying line segment information. Please try again later.';
            MAToastMessages.showError({ 'message': errMsg, timeOut: 6000 });
            MA.log(e);
        }
    },


    /** create a popup showing records with bad device Ids **/
    showBadLiveRecords: function showBadLiveRecordsAlias(qid) {
        var $plottedQuery = $('#PlottedQueriesTable .PlottedRowUnit[qid="' + qid + '"]');
        var queryData = $plottedQuery.data();

        if (queryData && /live/i.test(queryData.layerType) && !MA.isMobile) {
            var html = '<div class="badLiveRecordsWrapper"><table style="width: 100%;">';
            html += '<thead><tr><th>Record</th><th>Device ID</th></tr></thead>';

            //loop over queries bad addresses
            var badLiveRecords = queryData.badLiveRecords || [];
            var deviceIdField = String(getProperty(queryData, 'deviceFields.deviceId')).trim().replace(MA.Namespace + '__', '');
            var badAddressData = {};
            var tpMetaData = queryData.tooltips;
            var recordInfo = {};

            for (var b = 0, len = badLiveRecords.length; b < len; b++) {
                var record = badLiveRecords[b];
                var tooltip1 = formatTooltip(record, queryData.tooltips[0], true) || 'N/A';
                var deviceId = getProperty(record || {}, deviceIdField) || '';
                html += '<tr class="missingAddress" data-id="' + record.Id + '">' +
                    '<td><input type="checkbox" class="missingaddress-checkbox" /> <a target="_blank" href="/' + record.Id + '">' + tooltip1 + '</a></td></td>' +
                    '<td>' + deviceId + '</td>' +
                    '</tr>';
                recordInfo[record.Id] = record;
                badAddressData[record.Id] = {
                    recordId: record.Id,
                    objectType: queryData.options.baseObjectLabel,
                    savedQueryName: queryData.savedQueryName,
                    tooltip1Label: tpMetaData[0] ? tpMetaData[0].FieldLabel : '',
                    tooltip1Value: tooltip1 || '',
                    street: getProperty(record, queryData.addressFields.street) || '',
                    city: getProperty(record, queryData.addressFields.city) || '',
                    state: getProperty(record, queryData.addressFields.state) || '',
                    zip: getProperty(record, queryData.addressFields.zip) || '',
                    country: getProperty(record, queryData.addressFields.country) || ''
                }
            }

            html += '</table></div>';

            var badAddressPopup = MA.Popup.showMAPopup({
                template: html,
                width: 700,
                popupId: 'badLiveRecordsPopup',
                title: 'Saved Layer Name: ' + queryData.savedQueryName,
                subTitle: len + ' Records with a Bad Device ID',
                buttons: [
                    {
                        text: 'Close',
                        type: 'slds-button_neutral'
                        //no onTap or onclick just closes the popup
                    },

                    {
                        text: 'Export All',
                        type: 'slds-button_brand',
                        buttonType: 'dropdown',
                        buttonOptions: [
                            {
                                text: 'As CSV File',
                                onTap: function () {
                                    MAPlotting.exportBadAddresses(badAddressData, true, 'csv')
                                }
                            }
                        ]
                    },
                    {
                        text: 'Export Selected',
                        type: 'slds-button_brand',
                        buttonType: 'dropdown',
                        buttonOptions: [
                            {
                                text: 'As CSV File',
                                onTap: function () {
                                    MAPlotting.exportBadAddresses(badAddressData, false, 'csv')
                                }
                            }
                        ]
                    }
                ]
            });

            $('#badAddressPopup').data('recordInfo', recordInfo);
        }

    },



    showLiveCriteriaInfo: function showLiveCriteriaInfoAlias(qid) {
        var $plottedQuery = $('#PlottedQueriesTable .PlottedRowUnit[qid="' + qid + '"]');
        var queryData = $plottedQuery.data();

        if (queryData && /live/i.test(queryData.layerType) && !MA.isMobile) {
            var html = '<div class="unmet_live_device_criteria_records_wrapper"><table style="width: 100%;">';
            html += '<thead><tr><th>Record</th><th>Device ID</th><th>Last Report Date/Time</th><th>Why Not Visible</th></tr></thead>';

            var failedDeviceCriteria = queryData.liveCriteriaUnmet;

            //loop over queries bad addresses
            var deviceIdField = getProperty(queryData, 'deviceFields.deviceId');
            var badAddressData = {};
            var tpMetaData = queryData.tooltips;
            var recordInfo = {};

            for (var b = 0, len = failedDeviceCriteria.length; b < len; b++) {
                var record = failedDeviceCriteria[b];
                var tooltip1 = formatTooltip(record, queryData.tooltips[0], true) || 'N/A';
                var deviceId = String(getProperty(record || {}, deviceIdField) || '').trim().replace(MA.Namespace + '__', '');
                var device = record.device || {};

                html += '<tr class="missingAddress" data-id="' + record.Id + '">' +
                    '<td><input type="checkbox" class="missingaddress-checkbox" /> <a target="_blank" href="/' + record.Id + '">' + tooltip1 + '</a></td></td>' +
                    '<td>' + deviceId + '</td>' +
                    '<td>' + device.getFormattedDate() + ' ' + device.getFormattedTime() + '</td>' +
                    '<td>Layer configurations</td>' +
                    '</tr>';
                recordInfo[record.Id] = record;
                badAddressData[record.Id] = {
                    recordId: record.Id,
                    objectType: queryData.options.baseObjectLabel,
                    savedQueryName: queryData.savedQueryName,

                    // device info
                    deviceId: record.device.getId(),

                    tooltip1Label: tpMetaData[0] ? tpMetaData[0].FieldLabel : '',
                    tooltip1Value: tooltip1 || '',
                    street: getProperty(record, queryData.addressFields.street) || '',
                    city: getProperty(record, queryData.addressFields.city) || '',
                    state: getProperty(record, queryData.addressFields.state) || '',
                    zip: getProperty(record, queryData.addressFields.zip) || '',
                    country: getProperty(record, queryData.addressFields.country) || ''
                }
            }

            html += '</table></div>';

            var badAddressPopup = MA.Popup.showMAPopup({
                template: html,
                width: 700,
                popupId: 'unmetDeviceCriteriaPopup',
                title: 'Saved Layer Name: ' + queryData.savedQueryName,
                subTitle: len + ' Record Devices Did Not Meet Last Report Date and Time Conditions',
                buttons: [
                    {
                        text: 'Close',
                        type: 'slds-button_neutral',
                        //no onTap or onclick just closes the popup
                    },

                    {
                        text: 'Export All',
                        type: 'slds-button_brand',
                        buttonType: 'dropdown',
                        buttonOptions: [
                            {
                                text: 'As Excel File',
                                onTap: function () {
                                    MAPlotting.exportBadAddresses(badAddressData, true, 'xls')
                                }
                            },
                            {
                                text: 'As CSV File',
                                onTap: function () {
                                    MAPlotting.exportBadAddresses(badAddressData, true, 'csv')
                                }
                            }
                        ]
                    },
                    {
                        text: '<b>Export Selected</b>',
                        type: 'slds-button_brand',
                        buttonType: 'dropdown',
                        buttonOptions: [
                            {
                                text: 'As Excel File',
                                onTap: function () {
                                    MAPlotting.exportBadAddresses(badAddressData, false, 'xls')
                                }
                            },
                            {
                                text: 'As CSV File',
                                onTap: function () {
                                    MAPlotting.exportBadAddresses(badAddressData, false, 'csv')
                                }
                            }
                        ]
                    }
                ]
            });

            $('#badAddressPopup').data('recordInfo', recordInfo);
        }
    },

    /**************************************************************************************************
    *
    *
    *   end LIVE FUNCTIONS section
    *
    *
    **************************************************************************************************/
    /****************************************************
     * creates and returns a 2D html <table> from given
     * object
     ****************************************************/
    create2DTableHTML: function create2DTableHTMLAlias(options) {
        var $tableDiv = $('<div/>');
        options = options || {};
        var data = getProperty(options, 'data') || {};
        var tableTitleText = options.title || '';
        var dataRowsHTML = MAPlotting.createDataRowsHTML({ data: data }) || $('<tr/>');

        var $table = $('<table/>');
        var $tbody = $('<tbody/>');
        var $thead = $('<thead/>');
        var $tableTitle = $('<caption/>');
        $tableTitle.text(tableTitleText);
        var $tableRows = $(dataRowsHTML);


        $tbody.append($tableRows);

        $table.append($tableTitle);
        $table.append($thead);
        $table.append($tbody);

        $tableDiv.append($table);

        return $tableDiv.html();
    },


    /****************************************************
      * creates and returns a list of html <tr> table
      * rows from given object
      ****************************************************/
    createDataRowsHTML: function createDataRowsHTMLAlias(options) {
        options = options || {};
        var rowsData = options.data || {};
        var resultDiv = $('<div/>');
        if (rowsData && typeof rowsData == 'object') {
            var keys = Object.keys(rowsData);
            var keyLength = keys.length;

            for (var c = 0; c < keyLength; c++) {
                var labelText = htmlDecode(keys[c] || '');
                var valueText = htmlDecode((rowsData[labelText] || {}).value || '');

                var displayFields = ['Report Date', 'Report Time', 'Time Zone of Device', 'Direction', 'Odometer', 'Speed']

                // Show only the following fields on Live tab of marker tooltip...
                if (displayFields.indexOf(labelText) > -1) {

                    // Format Report Date field with long
                    var html = (rowsData[labelText] || {}).html;
                    var $newTr = $('<tr style="padding-top: 2px; padding-bottom: 2px"></tr>');

                    var $label = $('<td class="label"><div class="labelBold"></div></td>');

                    $label.find('.labelBold').text(labelText);

                    var $value = $('<td style="font-weight: bold"></td>');

                    if (html) {
                        if (!/<script>/ig.test(valueText)) {
                            $value.html(valueText);
                        }
                    }
                    else {
                        $value.text(valueText);
                    }

                    $value.addClass(labelText);

                    $newTr.append($label);
                    $newTr.append($value);

                    resultDiv.append($newTr);

                }
            }
        }

        return resultDiv.html();
    },

    getFormattedDate: function getFormattedDateAlias(timestamp) {
        timestamp = Number(timestamp);
        var formattedDate;

        if (timestamp) {
            timestamp = moment.utc(parseInt(timestamp)).local();
            var dateFormat = getProperty(MASystem || {}, 'User.dateFormat') || 'Bad Date Format';
            var dateString = timestamp.format(dateFormat.toUpperCase());

            if (moment(dateString, dateFormat).isValid()) { formattedDate = dateString };
        }

        return formattedDate;
    },

    getFormattedTime: function getFormattedTimeAlias(timestamp) {
        timestamp = Number(timestamp);
        var formattedTime;

        if (timestamp) {
            timestamp = moment.utc(parseInt(timestamp)).local();
            var timeFormat = getProperty(MASystem || {}, 'User.timeFormat') || 'Bad Time Format';
            var timeString = timestamp.format(timeFormat);

            if (moment(timeString, timeFormat).isValid()) { formattedTime = timeString };
        }

        return formattedTime;
    },

    /**
     * @param time in seconds: Number
     * @return formatted time for display in the Format - hrs:mins:sec: String
     *
     */
    millisecondsToTime: function millisecondsToTimeAlias(s) {
        var formattedTime = null;

        if (isNum(s)) {
            var ms = s % 1000;
            s = (s - ms) / 1000;
            var secs = s % 60;
            s = (s - secs) / 60;
            var mins = s % 60;
            var hrs = (s - mins) / 60;

            // add padding as needed
            hrs = hrs < 10 ? '0' + hrs : hrs;
            mins = mins < 10 ? '0' + mins : mins;
            secs = secs < 10 ? '0' + secs : secs;

            formattedTime = hrs + ':' + mins + ':' + secs;
        }

        return formattedTime;
    }, // end millisecondsToTime

    /**
     * changes back specific JSON strings back to their native object format for easier use by the plotting processes
     * */
    unpackPlottingData: function (plottingData) {
        var result = plottingData;

        try {
            if (typeof plottingData == 'object') {
                var layerType = plottingData.layerType;

                if (getProperty(plottingData, 'advancedOptions')) {
                    // unpack layerTypeOptions
                    if (typeof getProperty(plottingData, 'advancedOptions.layerTypeOptions') == 'string') {
                        var layerTypeOptionsObject = JSON.parse(plottingData.advancedOptions.layerTypeOptions || null);

                        if (typeof layerTypeOptionsObject == 'object') {
                            result.advancedOptions.layerTypeOptions = layerTypeOptionsObject;
                        }
                    }

                    // unpack liveOptionsObject. Legacy support. This used to be the point of storage for live options
                    if (typeof getProperty(plottingData, 'advancedOptions.liveOptions') == 'string') {
                        var liveOptionsObject = JSON.parse(plottingData.advancedOptions.liveOptions || null);

                        if (typeof liveOptionsObject == 'object') {
                            result.advancedOptions.liveOptions = liveOptionsObject;
                        }
                    }
                }
            }
        } catch (e) { console.warn(e); }

        return result;
    },

    getPlottedQueryData: function (qid) {
        var queryData = null;

        if (isNum(qid) || (typeof qid == 'string' && qid.trim() != '')) {
            var $plottedQuery = $('.savedQuery[qid="' + qid + '"]');

            if ($plottedQuery.length = 1) {
                var data = $plottedQuery.data();

                if (data && typeof data == 'object') {
                    queryData = data;
                }
            }
        }

        return queryData;
    },

    plotSalesforceRecord: function (options) {
        /**
            options = {
                recordId: STRING,
                recordName: STRING,
                baseObjectId: STRING,
                baseObjectName; STRING
            }
        **/
        var $dfd = $.Deferred();

        if (options && typeof options == 'object') {
            var baseObjectId = options.baseObjectId;
            var recordId = options.recordId;
            var name = options.recordName;
            var $loading = MAToastMessages.showLoading({ message: MASystem.Labels.MA_Loading + '...', timeOut: 0, extendedTimeOut: 0 });

            Visualforce.remoting.Manager.invokeAction(MARemoting.validateMABaseObjectTooltips,
                baseObjectId,
                function (res, event) {
                    MAToastMessages.hideMessage($loading);
                    if (event.status) {
                        if (res && res.success) {
                            var tooltips = res.tooltips || [];
                            var plotOptions = {
                                baseObjectId: baseObjectId,
                                recordIds: [recordId],
                                markerColor: '#00FF00:Marker2',
                                tooltipFields: tooltips,
                                name: name,
                                action: 'phase_1Mapit',
                                isMapIt: true,
                                ignoreZoomToFit: true,
                                type: 'marker'
                                /**Commenting this out until we determine how to handle proximity circles for MAP-5656
                                proximityOptions : {
                                    measurementType : userSettings.defaultProximitySettings.circleRadiusUnits || 'MILES',
                                    radius :  userSettings.defaultProximitySettings.circleRadius || '50'
                                }*/
                            };
                            if (!$('#tabs-nav-plotted').hasClass('tab-open')) {
                                $('#tabs-nav-plotted').click();
                            }
                            MALayers.moveToTab('plotted');
                            MAPlotting.analyzeQuery(plotOptions);

                            $dfd.resolve({ success: true });
                        }
                        else {
                            MA.log(event, res);
                            var errMsg = res != undefined ? res.message : 'Unknown Error';
                            MAToastMessages.showWarning({ message: 'Plotting warning.', subMessage: errMsg, closeButton: true, timeOut: 0, extendedTimeOut: 0 });
                            $dfd.reject({ success: false, message: errMsg });
                        }
                    }
                    else {
                        var errMsg = event.message || 'Unknown Error';
                        MAToastMessages.showWarning({ message: 'Plotting warning.', subMessage: errMsg, closeButton: true, timeOut: 0, extendedTimeOut: 0 });
                        MA.log(event, res);
                        $dfd.reject({ success: false, message: errMsg });
                    }
                }, { escape: false, buffer: false, timeout: 120000 }
            );
        }
        else {
            $dfd.reject({ success: false, message: 'Invalid Input' });
        }

        return $dfd.promise();
    },

    // get list of data objects representing plotted Saved Query objects on the map
    getPlottedSavedQueries: function () {
        var plottesSavedQueries = [];

        $('.savedQuery').each(function () {
            plottesSavedQueries.push($(this).data());
        });

        return plottesSavedQueries;
    },

    refreshLayersOnMapVisibleArea: function () {
        // remove ready class until finished and update text
        $('#visibleAreaRefeshMap').removeClass('ready update').addClass('refreshing');
        $('.visibleAreaRefreshMapText').text('Refresh layers in this area');
        $('.visibleAreaRefreshMapText').text('Refreshing...');
        $('#PlottedQueriesContainer .visibleOnly').addClass('visibleLoading');

        // batch the visiblOnly queries
        var q = async.queue(function (options, callback) {
            switch (options.layerType) {
                case 'ArcGISLayer':
                    ArcGIS.refreshLayer(options.pq.attr('qid')).then(function () {
                        options.pq.removeClass('visibleLoading');
                        callback({ success: true, data: options });
                    });
                    break;
                case 'DataLayer': {
                    var dlOptions = {};

                    window.MADemographicLayer.refreshDataLayer(options.pq, dlOptions, function () {
                        options.pq.removeClass('visibleLoading');
                        callback({ success: true, data: options });
                    });

                    break;
                }
                default:
                    window.MAPlotting.refreshQuery(options.pq).then(function () {
                        options.pq.removeClass('visibleLoading');
                        callback({ success: true, data: options });
                    });
                    break;
            }
        });

        // loop over the visibleOnly queries and add to que
        $('.PlottedRowUnit.visibleOnly').each(function (i, row) {
            var opt = {
                pq: $(row),
                layerType: $(row).hasClass('DataLayer') ? 'DataLayer' : 'OtherLayer'
            };

            q.push(opt, null);
        });

        $('.ArcGISLayer.PlottedRowUnit').each(function (i, row) {
            var opt = {
                pq: $(row),
                layerType: 'ArcGISLayer'
            };

            q.push(opt, null);
        });

        q.drain = function () {
            if ($('#visibleAreaRefeshMap').hasClass('update')) {
                $('#visibleAreaRefeshMap').removeClass('refreshing update').addClass('ready');
                $('.visibleAreaRefreshMapText').text('Refresh layers in this area');
            } else {
                // map has not moved show finished
                $('#visibleAreaRefeshMap').removeClass('refreshing').addClass('finished');
                $('.visibleAreaRefreshMapText').text('Done');

                // wait 3 seconds then hide button
                window.setTimeout(function () {
                    // if map has moved since we started this process just show the normal button
                    if ($('#visibleAreaRefeshMap').hasClass('finished')) {
                        $('#visibleAreaRefeshMap').removeClass('visible update finished').addClass('ready');
                        $('.visibleAreaRefreshMapText').text('Refresh layers in this area');
                    }
                }, 1500);
            }
        };
    },
};


/************************************
 *
 * add mobile logic
 *
************************************/
MAPlotting.mobile = {
    toggleLegend: function (button) {
        /*************************
         * handle show all legend
        **************************/
        var $button = $(button);
        var $legendLocation = $button.closest('.qidLocation');
        var queryId = $legendLocation.attr('data-id');
        var $plottedQuery = $('#PlottedQueriesTable .savedQuery[data-id="' + queryId + '"]');
        var queryData = $plottedQuery.data() || {};
        if (queryData.markerAssignmentType === 'Dynamic-multiField') {
            handleDynamicMultifieldClick($plottedQuery, $button);
            return;
        }
        if ($button.find('.moreless-text').text() == MASystem.Labels.MA_Show_All) {
            $button.find('.moreless-text').text(MASystem.Labels.MA_Show_Less);
            $button.find('.MAIcon').removeClass('glyphicon-collapse-down').addClass('glyphicon-collapse-up');
            $legendLocation.find('.legend-row').css('display', 'flex');
            $legendLocation.find('.legend-row-header').css('display', 'flex');
            $legendLocation.find('.legend-row-header').addClass('sectionOpen').removeClass('sectionClosed');
            $legendLocation.find('.legend-row-header .rowDropIcon').addClass('ion-android-arrow-dropdown').removeClass('ion-android-arrow-dropup');
        }
        else {
            $button.find('.moreless-text').text(MASystem.Labels.MA_Show_All);
            $button.find('.MAIcon').removeClass('glyphicon-collapse-up').addClass('glyphicon-collapse-down');
            $legendLocation.find('.legend-row.empty').css('display', 'none');
            $legendLocation.find('.legend-row-header.empty').css('display', 'none');
            $legendLocation.find('.legend-row-header.empty').removeClass('sectionOpen').addClass('sectionClosed');
            $legendLocation.find('.legend-row-header.empty .rowDropIcon').removeClass('ion-android-arrow-dropdown').addClass('ion-android-arrow-dropup');
        }
        //end legend
    },
    showPlotOptions: function (option) {
        //grab the current query to toggle
        var queryId = '';
        if ($('#legendWrap').hasClass('in')) {
            queryId = $('#legendBody').attr('data-id');
        }
        else {
            queryId = $('#layersIndividualWrap .layersIndividual').attr('data-id');
        }

        if (option === 'display') {
            //grab the plotted query
            $('#queryPlottingOptions').removeAttr('data-id');
            $('#queryPlottingOptions').attr('data-id', queryId);

            //grab the already plotted options and update checkboxes
            var $plottedQuery = $('#PlottedQueriesTable .PlottedRowUnit[data-id="' + queryId + '"]');
            if ($plottedQuery.hasClass('DataLayer')) {
                //hide some options
                $('#queryPlottingOptions .renderToggle.heatmap').closest('.ma-list-item').hide();
                $('#queryPlottingOptions .renderToggle.scatter').closest('.ma-list-item').hide();
            }
            else {
                //show all
                $('#queryPlottingOptions .MapViewTable  .ma-list-item').show();
            }
            $('#queryPlottingOptions .renderToggle').prop('checked', false);

            $plottedQuery.find('.renderButtons .renderButtons-button').each(function (i, row) {
                var $row = $(row);
                var renderType = $row.attr('data-renderas');
                if ($(row).hasClass('on')) {
                    $('#queryPlottingOptions .renderToggle[data-renderas="' + renderType + '"]').prop('checked', true);
                }
            });

            MALayers.showModal('queryPlottingOptions');
        }
    },
    toggleDisplayType: function (button) {
        var $button = $(button);
        $('#queryPlottingOptions .renderToggle ').prop('checked', false);
        $button.prop('checked', true);
        var queryId = $('#queryPlottingOptions').attr('data-id');
        var $plottedQuery = $('#PlottedQueriesTable .PlottedRowUnit[data-id="' + queryId + '"]');

        var renderType = $button.attr('data-renderas');
        var pqData = $plottedQuery.data() || {};
        // if saved query
        if ($('#PlottedQueriesTable .PlottedRowUnit').hasClass('savedQuery')) {
            MAPlotting.unrenderQuery($plottedQuery, { modes: ['Cluster', 'Markers', 'Scatter', 'Heatmap'] }, function () {
                $plottedQuery.find('.renderButtons .renderButtons-button[data-renderas="' + renderType + '"]').closest('.drop-menu-item').click();
            });
        }
        else {
            if ($plottedQuery.hasClass('DataLayer')) {
                if (renderType == 'Cluster') {
                    pqData.clusterGroup.setMaxZoom(22);
                    pqData.clusterGroup.setMap(MA.map);
                } else {
                    var clusterZoomLevel = getProperty(userSettings || {}, 'ClusterZoomLevel', false) || 13;
                    var mobileClusterForce = MA.isMobile ? clusterZoomLevel : 1;
                    pqData.clusterGroup.setMaxZoom(mobileClusterForce);
                    pqData.clusterGroup.setMap(null);
                }
                $plottedQuery.find('.renderButtons .renderButtons-button[data-renderas="' + renderType + '"]').closest('.drop-menu-item').click();
            }
            else if (pqData.hasOwnProperty('macluster_cluster')) {
                MAPlotting.unrenderQuery($plottedQuery, { modes: ['Cluster', 'Markers', 'Scatter', 'Heatmap'] }, function () {
                    $plottedQuery.find('.renderButtons .renderButtons-button[data-renderas="' + renderType + '"]').closest('.drop-menu-item').click();
                });
            } else {
                MAToastMessages.showError({ message: 'Unable to update marker images at this time.' });
            }
        }
    },
    poiClick: function (options) {
        options = $.extend({
            markerType: 'poi'
        }, options || {});
        var marker = this;
        var poiData = getProperty(marker, 'maData.place', false) || {};
        poiData = $.extend(
            {
                location: {
                    coordinates: {
                        lat: marker.getPosition().lat(),
                        lng: marker.getPosition().lng()
                    }
                }
            },
            poiData
        );
        var markerOptions = {
            type: 'poi',
            record: poiData,
            marker: marker,
            queryMetaData: {}
        };
        VueEventBus.$emit('show-marker-tooltip', true, markerOptions);
    },
    searchForMarkers: function (searchText) {
        searchText = searchText || '';
        var results = '<li class="ma-section-title">Active Layer Markers</li>';
        if ($('#PlottedQueriesTable .savedQuery').length > 0 && searchText.length > 0) {
            //remove previous results
            //$('#search-menu .search-row.results').remove();
            var recordArray = [];

            //loop over plotted queries and create array of results
            $('#PlottedQueriesTable .savedQuery').each(function () {
                $.each($(this).data('records'), function (index, record) {
                    if (recordArray.length == 6) { return false; }

                    //check search term then push to array
                    if ((record.isVisible || record.isClustered || record.isScattered) && record.marker.title.toLowerCase().indexOf(searchText.toLowerCase()) != -1) {
                        recordArray.push(record);
                    }
                });
            });

            //loop over search results and create rows
            $.each(recordArray, function (index, record) {
                //$newRow.find('.image-replace').replaceWith(image);
                var lat = getProperty(record, 'location.coordinates.lat') || '';
                var lng = getProperty(record, 'location.coordinates.lng') || '';

                //append to results table
                var title = record.marker.title.length > 24 ? record.marker.title.substring(0, 24).concat('...') : record.marker.title;
                title = title + '<div class="search-result-subtext">' + record.savedQueryName || '' + '</div>';

                //create new row
                var newRow = $('#templates .searh-row.template').clone().removeClass('template').html()
                    .replace(/::lat::/g, lat)
                    .replace(/::lng::/g, lng)
                    .replace(/::ICON::/g, 'ma-icon-checkin')
                    .replace(/::ID::/g, record.Id)
                    .replace(/::QID::/g, record.savedQueryId)
                    .replace(/::TYPE::/g, 'record')
                    .replace(/::NAME::/g, title);

                results += newRow;
            });
            if (recordArray.length === 0) {
                results += $('#templates .searh-row.template').clone().removeClass('template').html()
                    .replace(/::lat::/g, '')
                    .replace(/::lng::/g, '')
                    .replace(/::ID::/g, '')
                    .replace(/::TYPE::/g, '')
                    .replace(/::QID::/g, '')
                    .replace(/::ICON::/g, 'ma-icon-warning')
                    .replace(/::NAME::/g, MASystem.Labels.MA_NO_RESULTS_FOUND);
            }

            //$('.search-result-wrap').append(results);
        }
        else {
            results += $('#templates .searh-row.template').clone().removeClass('template').html()
                .replace(/::lat::/g, '')
                .replace(/::lng::/g, '')
                .replace(/::ID::/g, '')
                .replace(/::TYPE::/g, '')
                .replace(/::QID::/g, '')
                .replace(/::ICON::/g, 'ma-icon-warning')
                .replace(/::NAME::/g, MASystem.Labels.MA_NO_RESULTS_FOUND);
        }
        return results;
    },
    previousMarker: null,
    clickedIcon: {
        url: MASystem.Images.clicked_icon,
        anchor: { x: 11, y: 36, rich: 8 },
        scaledSize: new google.maps.Size(24, 34)
    },
    createLayerSingleView: function (plottedInfo) {
        var $singleLayer = MAPlotting.buildMobileElement(plottedInfo);

        var layerType = plottedInfo.type == 'arcgisonline' ? 'ArcGIS Layer' : plottedInfo.type;
        $singleLayer.attr({ 'data-id': plottedInfo.id, 'type': plottedInfo.type });
        $singleLayer.find('.layerName').html(plottedInfo.name + '<div class="ma-top-bar-subtext layerType">' + layerType + '</div>');
        $singleLayer.find('.plotLayer').prop('checked', true).attr('data-type', plottedInfo.type);
        $singleLayer.find('.plottedMoreOptions').show();
        $singleLayer.find('.plotOnLoadWrapper').show();
        if (plottedInfo.type === 'datalayer' || plottedInfo.type === 'arcgisonline') {
            $singleLayer.find('.plotOnLoadToggle').prop('checked', false).attr('disabled', true);

            if (plottedInfo.type === 'favorite') {
                $singleLayer.find('.plottedMoreOptions').hide();
            }
        }
        else {
            //check if plot on load
            var isPlotOnLoad = MALayers.isPlotOnLoad[plottedInfo.id];
            if (isPlotOnLoad) {
                $singleLayer.find('.plotOnLoadToggle').prop('checked', true);
            }
        }

        if (plottedInfo.type === 'datalayer') {
            //rebuild the legend
            var legendInfo = getProperty(plottedInfo, 'legendInfo') || {};
            var legendRows = legendInfo.legendMap || [];

            var tableHTML = MADemographicLayer.BuildLegend(legendRows);
            $singleLayer.find('.legend-wrap').html(tableHTML);
            $singleLayer.find('.legendField').html(plottedInfo.colorField || '');

            //find the plotted data layer info and clone it
            var $plottedDataLayer = $('#PlottedQueriesTable .DataLayer[data-id="' + plottedInfo.id + '"]');
            $singleLayer.find('.legendField').append($plottedDataLayer.find('.plottinginfo-wrapper').clone());


            //updata counts
            for (var rl = 0; rl < legendRows.length; rl++) {
                var lrow = legendRows[rl];
                lrow.total = lrow.total;
                lrow.visible = lrow.visible;

                if (lrow.total > 0) {

                    //update the legend rows
                    var $row = $('#layersIndividualWrap').find('.legend-row[uid="' + lrow.rowId + '"]');
                    $row.find('.visiblemarkers').text(lrow.visible);
                    $row.find('.totalmarkers').text(lrow.total);

                } else {
                    var $row = $('#layersIndividualWrap').find('.legend-row[uid="' + lrow.rowId + '"]');
                }
            }
        }
        else if (plottedInfo.type === 'arcgisonline') {
            $singleLayer.find('.ma-section-title').html('Sublayers');
            $singleLayer.find('.pad-16-16-8').empty();
        }
        else {
            var descriptionHTML = '<div class="pad-16"><label class="ma-input-label">Description</label><textarea class="ma-input fav-description" disabled="disabled" type="text" placeholder="Description"></textarea></div>'
            $singleLayer.find('#layersIndividualBody').empty().html(descriptionHTML);
            $singleLayer.find('.fav-description').val(plottedInfo.description);
        }
    },
    removeFavoriteLayer: function (layer) {
        var plottedId = $(layer).closest('.qidLocation').attr('data-id');
        var $favLayer = $('#PlottedQueriesTable .FavoriteRowUnit[data-id="' + plottedId + '"]');
        $('#folder-contents .ma-folder-item[data-id="' + plottedId + '"] .layer-toggle .ma-toggle').prop('checked', false);
        delete MAPlotting.plottedIds[plottedId];
        MALayers.moveToTab('allLayers');
        removeFavLocaiton($favLayer);
    },
    removeProximityLayer: function (layer, type) {
        var plottedId = $(layer).closest('.qidLocation').attr('data-id');
        var qid = $(layer).closest('.qidLocation').attr('qid');

        if (!qid) {
            qid = $('#PlottedQueriesTable .PlottedShapeLayer.qidLocation[data-id="' + plottedId + '"]').attr('qid');
        }

        $proxLayer = $('#PlottedQueriesTable .shapeWrapper[qid="' + qid + '"]');

        if (plottedId) {
            delete MAPlotting.plottedIds[plottedId];
        }

        if ($proxLayer.hasClass('maTerritory')) {
            try { $proxLayer.data('dataLayer').setMap(null); } catch (err) { }
            try { $proxLayer.data('kmlLayer').hideDocument(); } catch (err) { }
            try { $proxLayer.data('proxObject').setMap(map); } catch (err) { }
            try { $.each($proxLayer.data('proxObjects'), function (i, proxObject) { proxObject.setMap(map); }); } catch (err) { }
            //check if show labels is checked
            try {
                if ($proxLayer.data('labelmarkers')) {
                    var markers = $proxLayer.data('labelmarkers');

                    for (var i = 0; i < markers.length; i++) {
                        markers[i].setVisible(false);
                    }
                }
            }
            catch (err) { }
            removeProximityLayer($proxLayer);
        }
        else if ($proxLayer.data('isParcel')) {
            //there should only ever be one parcel per layer for now
            var parcel = $proxLayer.data('proxObjects')[0];
            MA.map.data.remove(parcel[0]);
            removeProximityLayer($proxLayer);
        }
        else if (type === 'drawnShape') {
            $proxLayer = $(layer).closest('.qidLocation');
        }
        removeProximityLayer($proxLayer);
    },
    tooltipActionClick: function (button, isListView) {
        isListView = isListView || false;
        var $button = $(button);
        var type = $button.attr('data-marker');
        if (type === 'record') {

            var record;
            if (isListView) {
                record = $('#listScrollingBodyFull').data('record');
            }
            else {
                record = $('#markerTooltipWrap').data('record');
            }

            var frameworkAction = $button.attr('data-type') == 'Custom Action'
                ? MAActionFramework.customActions[$button.attr('data-action')] || null
                : MAActionFramework.standardActions[$button.attr('data-action')] || null;

            if (frameworkAction) {
                switch (frameworkAction.Action) {
                    case 'Iframe':

                        //get a component index from the action framework to make this tab unique and build the iframe url
                        var componentIndex = MAActionFramework.componentIndex++;
                        var iframeURL = frameworkAction.ActionValue
                            + (frameworkAction.ActionValue.indexOf('?') == -1 ? '?noparams' : '')
                            + '&Button=' + encodeURIComponent(frameworkAction.Label)
                            + '&RecordId=' + record.Id;

                        //build the new tab and the corresponding pane
                        var $newTab = $("<li id='CustomTab-" + componentIndex + "'><a href='#pane-customaction-" + componentIndex + "'>" + frameworkAction.Label + "</a> <span class='ui-icon ui-icon-close'>Remove Tab</span></li>");
                        var $newPane = $("<div id='pane-customaction-" + componentIndex + "'><iframe src='" + iframeURL + "' style='width: 100%; height: 100%;'></iframe></div>");

                        //append the tab and pane to the tooltip tabs and refresh
                        $('#tooltip-content').find('.ui-tabs-nav').append($newTab).closest('.tabs').append($newPane).tabs('refresh').find('#CustomTab-' + componentIndex + ' a').click();

                        //handle clicking the close button for this new tab
                        $newTab.css({ 'width': 'auto', 'padding-right': '5px' }).find('.ui-icon-close').css({ 'cursor': 'pointer', 'position': 'absolute', 'right': '0' }).click(function () {
                            if ($newTab.is('.ui-tabs-active')) {
                                $('#tooltip-content').find('.ui-tabs-nav > li:first-child a').click();
                            }

                            $newTab.remove();
                            $newPane.remove();
                        });
                        break;

                    case 'NewWindow':
                        setMobileState().always(function () {
                            var options = {
                                recString: ''
                            };
                            if (frameworkAction.ActionValue.indexOf('{records}') >= 0) {
                                options.records = true;
                            }

                            var newURL = frameworkAction.ActionValue
                                + (frameworkAction.ActionValue.indexOf('?') == -1 ? '?noparams' : '')
                                + '&Button=' + encodeURIComponent(frameworkAction.Label)
                                + '&RecordId=' + record.record.Id;
                            if (frameworkAction.Options.method == 'GET') {
                                if (frameworkAction.Options.addRecords) {
                                    newURL += '&' + frameworkAction.Options.paramName + '=' + record.Id;
                                }
                                window.open(newURL);
                            }
                            else {
                                var postData = {};
                                if (frameworkAction.Options.addRecords) {
                                    postData[frameworkAction.Options.paramName] = record.Id;
                                }
                                openNewWindow('POST', newURL, postData, '_blank');

                            }
                        });
                        break;
                    case 'Javascript':
                        frameworkAction.ActionValue.call(this, {
                            button: $button,
                            records: [record],
                            mode: 'newMobile',
                            isListView: isListView
                        });
                        break;

                    default:
                        break;
                }
            }
        }
        else if (type === 'datalayer') {
            var marker = $('#markerTooltipWrap').data('record');
            var frameworkAction = $button.attr('data-type') == 'Custom Action'
                ? MAActionFramework.customActions[$button.attr('data-action')] || null
                : MAActionFramework.standardActions[$button.attr('data-action')] || null;

            if (frameworkAction) {
                switch (frameworkAction.Action) {
                    case 'Iframe':
                        break;

                    case 'NewWindow':
                        break;

                    case 'Javascript':
                        var layerObj = {};
                        layerObj[marker.key || 'dlClick'] = [marker];
                        frameworkAction.ActionValue.call(this, {
                            button: $button,
                            dataLayers: layerObj,
                            mode: 'newMobile'
                        });
                        break;

                    default:
                        break;
                }
            }
        }
        else if (type === 'MyPosition') {
            var frameworkAction = $button.attr('data-type') == 'Custom Action'
                ? MAActionFramework.customActions[$button.attr('data-action')] || null
                : MAActionFramework.standardActions[$button.attr('data-action')] || null;

            if (frameworkAction) {
                switch (frameworkAction.Action) {
                    case 'Iframe':

                        //get a component index from the action framework to make this tab unique and build the iframe url
                        var componentIndex = MAActionFramework.componentIndex++;
                        var iframeURL = frameworkAction.ActionValue
                            + (frameworkAction.ActionValue.indexOf('?') == -1 ? '?noparams' : '')
                            + '&Button=' + encodeURIComponent(frameworkAction.Label)
                            + '&RecordId=' + record.record.Id;

                        //build the new tab and the corresponding pane
                        var $newTab = $("<li id='CustomTab-" + componentIndex + "'><a href='#pane-customaction-" + componentIndex + "'>" + frameworkAction.Label + "</a> <span class='ui-icon ui-icon-close'>Remove Tab</span></li>");
                        var $newPane = $("<div id='pane-customaction-" + componentIndex + "'><iframe src='" + iframeURL + "' style='width: 100%; height: 100%;'></iframe></div>");

                        //append the tab and pane to the tooltip tabs and refresh
                        $('#tooltip-content').find('.ui-tabs-nav').append($newTab).closest('.tabs').append($newPane).tabs('refresh').find('#CustomTab-' + componentIndex + ' a').click();

                        //handle clicking the close button for this new tab
                        $newTab.css({ 'width': 'auto', 'padding-right': '5px' }).find('.ui-icon-close').css({ 'cursor': 'pointer', 'position': 'absolute', 'right': '0' }).click(function () {
                            if ($newTab.is('.ui-tabs-active')) {
                                $('#tooltip-content').find('.ui-tabs-nav > li:first-child a').click();
                            }

                            $newTab.remove();
                            $newPane.remove();
                        });
                        break;

                    case 'NewWindow':
                        setMobileState().always(function () {
                            var newURL = frameworkAction.ActionValue
                                + (frameworkAction.ActionValue.indexOf('?') == -1 ? '?noparams' : '')
                                + '&Button=' + encodeURIComponent(frameworkAction.Label)
                                + '&type=My%20Position'
                                + '&latitude=' + myCachedPositionInfo.coords.latitude
                                + '&longitude=' + myCachedPositionInfo.coords.longitude
                                + '&address=' + $('#markerTooltipTopBar').find('.recordAddress').text();

                            window.open(newURL);
                        });
                        break;

                    case 'Javascript':

                        frameworkAction.ActionValue.call(this, {
                            button: $button,
                            mode: 'newMobile',
                            customMarkers: [{ type: 'MyPosition', title: 'My Position', latlng: new google.maps.LatLng(myCachedPositionInfo.coords.latitude, myCachedPositionInfo.coords.longitude), address: $('#markerTooltipTopBar').find('.recordAddress').text() }]
                        });

                        break;

                    default:
                        break;
                }
            }
        }
        else if (type === 'c2cRecord') {
            /*****************************
             *
             * this needs to be addressed when more time
             * mashup of old marker layout and new
             *
            *******************************/
            var marker = $('#markerTooltipWrap').data('record') || {};
            var record = marker.record || {};
            var frameworkAction = $button.attr('data-type') == 'Custom Action'
                ? MAActionFramework.customActions[$button.attr('data-action')] || null
                : MAActionFramework.standardActions[$button.attr('data-action')] || null;

            if (frameworkAction) {
                switch ($button.text().toLowerCase()) {
                    case MASystem.Labels.MA_VIEW_RECORD.toLowerCase():
                        // MAActionFramework.standardActions['View Record'].ActionValue({
                        //     button: $button,
                        //     records: [record]
                        // });
                        frameworkAction.ActionValue.call(this, {
                            button: $button,
                            records: [record],
                            mode: 'newMobile',
                            isListView: isListView
                        });
                        break;

                    case MASystem.Labels.MAActionFramework_Add_to_Trip.toLowerCase():
                        var c2cRec = {
                            id: getProperty(record, 'record.Id'),
                            baseObject: '{C2C}' + $('#createrecord-object').val()
                        }
                        MAActionFramework.standardActions['Add to Trip'].ActionValue({
                            customMarkers: [{ type: 'dataLayer', title: marker.title, latlng: marker.getPosition(), address: marker.address, c2cRec: c2cRec }]
                        });

                        break;
                    case MASystem.Labels.MAActionFramework_Take_Me_There.toLowerCase():

                        MAActionFramework.standardActions['Take Me There'].ActionValue({
                            customMarkers: [{ type: 'dataLayer', title: marker.title, latlng: marker.getPosition(), address: marker.address }]
                        });

                        break;
                    case MASystem.Labels.MAActionFramework_Check_In.toLowerCase():

                        MAActionFramework.standardActions['Check In'].ActionValue({
                            button: $button,
                            records: [marker.record]
                        });

                        break;

                    case MASystem.Labels.MAActionFramework_Check_Out.toLowerCase():

                        MAActionFramework.standardActions['Check Out'].ActionValue({
                            //Case 00013863 - After creating a new Account using C2C - the client reported that they could not check into the newly created Account.
                            // button: $(this),
                            button: $button,
                            records: [marker.record]
                        });

                        break;
                    case MASystem.Labels.MAContext_Remove_Marker.toLowerCase():

                        marker.setMap(null);
                        MALayers.moveToTab('hideTooltip');
                        break;
                }
            }
        }
        else if (type === 'favorite') {
            var marker = $('#markerTooltipWrap').data('marker') || {};
            var record = marker.record || {};
            switch ($button.text().toLowerCase()) {
                case MASystem.Labels.MA_VIEW_RECORD.toLowerCase():
                    MAActionFramework.standardActions['View Record'].ActionValue({
                        button: $button,
                        records: [record]
                    });
                    break;
                case MASystem.Labels.MAActionFramework_Add_to_Trip.toLowerCase():
                    if (MA.isMobile && !MARoutes.mobile.routesLoaded) {
                        var items = MAActionFramework.getNormalizedRoutingData({
                            button: $button,
                            records: [record]
                        });
                        VueEventBus.$emit('add-to-route', items);
                    }
                    AddMarkerToTrip(marker);
                    MALayers.moveToTab('routeSingleView');
                    break;
                case MASystem.Labels.MAActionFramework_Set_Proximity_Center.toLowerCase():
                    var proxType = getProperty(userSettings || {}, 'defaultProximitySettings.DefaultProximityType') || 'Circle';
                    addProximityLayer({ proximityType: proxType, center: { lat: marker.getPosition().lat(), lng: marker.getPosition().lng() }, latitude: marker.getPosition().lat(), longitude: marker.getPosition().lng() });
                    break;
                case 'remove marker':
                    marker.setMap(null);
                    var favorites = [];
                    var removeIndex = marker.removeIndex;
                    $('#PlottedQueriesTable .FavoriteRowUnit').each(function (i, row) {
                        if ($(row).attr('data-id') == removeIndex) {
                            $(row).find('.btn-remove').click();
                        }
                    });
                    MALayers.moveToTab('hideTooltip');
                    break;
                case 'set reference point':
                    var newOptions = {
                        records: [],
                        favorites: [],
                        customMarkers: []
                    };

                    newOptions.records.push({ formattedMarkerAddress: marker.record.markerAddress, latLng: marker.position });

                    MAActionFramework.standardActions['Set Reference Point'].ActionValue(newOptions);
                    break;
            }
        }
        else if (type === 'arcgisonline') {
            var sublayer = $('#markerTooltipWrap').data('sublayer');
            var feature = $('#markerTooltipWrap').data('feature');

            var frameworkAction = $button.attr('data-type') == 'Custom Action'
                ? MAActionFramework.customActions[$button.attr('data-action')] || null
                : MAActionFramework.standardActions[$button.attr('data-action')] || null;

            if (frameworkAction) {
                switch (frameworkAction.Action) {
                    case 'Iframe':
                        console.warn('debug frameworkAction.Action Iframe not supported for arcgisonline');
                        break;

                    case 'NewWindow':
                        console.warn('debug frameworkAction.Action NewWindow not supported for arcgisonline');
                        break;

                    case 'Javascript':
                        var record = {
                            location: {
                                coordinates: {
                                    lat: $('#markerTooltipWrap').attr('lat'),
                                    lng: $('#markerTooltipWrap').attr('lng')
                                }
                            },
                            type: 'feature',
                            sublayer: sublayer,
                            feature: feature
                        };
                        frameworkAction.ActionValue.call(this, {
                            button: $button,
                            records: [record],
                            mode: 'newMobile',
                            isListView: isListView
                        });
                        break;

                    default:
                        break;
                }
            }
        }
    },
    toggleAllRows: function (toggle) {
        var $toggle = $(toggle);
        var uncheckAll = $toggle.prop('checked');
        //$('#markerLegendCheckAll').removeClass('intermediate checked');
        //grab the current legend
        var queryId = $('#legendBody').attr('data-id');
        var $plottedQuery = $('#PlottedQueriesTable .savedQuery[data-id="' + queryId + '"]');
        if ($plottedQuery.hasClass('loading')) {
            return;
        }

        //grab the legend
        var $legendContainer = $toggle.closest('.qidLocation');

        //loop over rows to get all legendids
        var isChecked = uncheckAll;
        var legendRows = $legendContainer.find('.legend-row').not('.empty');
        //$button.find('.iconWrapper').removeClass('checked').addClass(' intermediate');
        var qid = $plottedQuery.attr('qid');
        //keep track of the rows being toggled
        MAPlotting.legendRowSelections[qid] = MAPlotting.legendRowSelections[qid] || {};

        for (var l = 0, len = legendRows.length; l < len; l++) {
            var legendId = legendRows[l].getAttribute('data-id');
            MAPlotting.legendRowSelections[qid][legendId] = uncheckAll

        }

        if (!uncheckAll) {
            //remove checkbox
            $legendContainer.find('.legend-row .legend-checkbox').prop('checked', false).prop('checked', false);
            $legendContainer.find('.legend-row-header .legend-checkbox').prop('checked', false).prop('checked', false);
        }
        else {
            //add checkbox
            $legendContainer.find('.legend-row .legend-checkbox').prop('checked', true).prop('checked', true);
            $legendContainer.find('.legend-row-header .legend-checkbox').prop('checked', true).prop('checked', true);
        }

        var legendRowHTML = $legendContainer.find('.legend-wrap').html();
        var queryInfo = getProperty(MAPlotting.plottedIds, queryId) || {};
        var legendInfo = queryInfo.legendInfo || {};
        legendInfo.legendHTML = legendRowHTML;

        //check if we are waiting for a timeout
        var options = {
            plottedQuery: $plottedQuery,
            rows: MAPlotting.legendRowSelections[qid]
        }
        MAPlotting.toggleLegendRow(options, function () {
            MAPlotting.updateQueryInfo($plottedQuery, function () {
                //remove loading
                $plottedQuery.removeClass('loading');
                $plottedQuery.find('.queryIcon').show();
                $plottedQuery.find('.queryLoader').hide();
                //MAPlotting.mobile.updateMobileQueryInfo($plottedQuery);
                delete MAPlotting.legendRowSelections[qid];
                if (uncheckAll) {
                    $('#markerLegendCheckAll').removeClass('checked intermediate');
                }
                else {
                    $('#markerLegendCheckAll').removeClass('intermediate').addClass('checked');
                }

            });
        });
    },
    toggleLegendHeaderRow: function (row) {
        var $legendCheckbox = $(row);
        var $legendRow = $legendCheckbox.closest('.legend-row-header');
        var queryId = $legendCheckbox.closest('.qidLocation').attr('data-id');
        var sectionId = $legendRow.attr('data-sectionid');
        var isChecked = $legendCheckbox.prop('checked');
        var $legendContainer = $legendCheckbox.closest('.qidLocation');
        var $plottedQuery = $('#PlottedQueriesTable .savedQuery[data-id="' + queryId + '"]');

        var $rows = $legendContainer.find('.legend-row[data-sectionid="' + sectionId + '"]');
        var rowObj = {};
        $.each($rows, function (i, row) {
            var $row = $(row);
            var legendId = $row.attr('data-id');
            $row.find('.legend-checkbox').prop('checked', isChecked);
            rowObj[legendId] = isChecked;
        });

        var legendRows = $legendContainer.find('.legend-row');
        var activeRows = $legendContainer.find('.legend-row .legend-checkbox:checked');
        //var isChecked = $legendCheckbox.prop('checked');
        if (isChecked) {
            $legendCheckbox.prop('checked', true);
        }
        else {
            $legendCheckbox.prop('checked', false);
        }


        var legendRows = $legendContainer.find('.legend-row');
        var activeRows = $legendContainer.find('.legend-row .legend-checkbox:checked');
        var isChecked = $legendCheckbox.prop('checked');
        if ($plottedQuery.hasClass('loading')) {
            $legendRow.find('.legend-checkbox').prop('checked', isChecked);
            return;
        }
        if (activeRows.length === legendRows.length) {
            $legendContainer.find('#markerLegendCheckAll').removeClass('intermediate').addClass('checked').prop('checked', true);
        }
        else if (activeRows.length === 0) {
            $legendContainer.find('#markerLegendCheckAll').removeClass('intermediate checked').prop('checked', false);
        }
        else {
            $legendContainer.find('#markerLegendCheckAll').removeClass('checked').addClass('intermediate').prop('checked', false);
        }

        //check for a section and update that checkbox
        var sectionId = $legendRow.attr('data-sectionid') || '';
        var $sectionHeaderRow = $legendContainer.find('.legend-row-header[data-sectionid="' + sectionId + '"]');
        var sectionRows = $legendContainer.find('.legend-row[data-sectionid="' + sectionId + '"]');
        var activeSectionRows = $legendContainer.find('.legend-row[data-sectionid="' + sectionId + '"] .legend-checkbox:checked');
        if (activeSectionRows.length === sectionRows.length) {
            //checked
            $sectionHeaderRow.find('.legend-checkbox').removeClass('intermediate');
        }
        else if (activeSectionRows.length === 0) {
            //unchecked
            $sectionHeaderRow.find('.legend-checkbox').removeClass('intermediate');
        }
        else {
            //intermediate
            $sectionHeaderRow.find('.legend-checkbox').addClass('intermediate')
        }

        var legendRowHTML = $legendCheckbox.closest('.legend-wrap').html();
        var queryInfo = getProperty(MAPlotting.plottedIds, queryId) || {};
        var legendInfo = queryInfo.legendInfo || {};
        legendInfo.legendHTML = legendRowHTML;

        var legendId = $legendRow.attr('data-id');
        var qid = $plottedQuery.attr('qid');
        //keep track of the rows being toggled
        MAPlotting.legendRowSelections[qid] = MAPlotting.legendRowSelections[qid] || {}
        MAPlotting.legendRowSelections[qid][legendId] = isChecked

        MAPlotting.toggleLegendRow({ plottedQuery: $plottedQuery, rows: rowObj }, function () {
            MAPlotting.updateQueryInfo($plottedQuery, function () {
                //remove loading
                $plottedQuery.removeClass('loading');
                $plottedQuery.find('.queryIcon').show();
                $plottedQuery.find('.queryLoader').hide();
                MAPlotting.mobile.updateMobileQueryInfo(queryInfo);
                delete MAPlotting.legendRowSelections[qid];
            });
        });
    },
    toggleRow: function (row) {
        var $legendCheckbox = $(row);
        var dataType = $legendCheckbox.attr('data-type');
        var $legendRow = $legendCheckbox.closest('.legend-row');
        var queryId = $legendCheckbox.closest('.qidLocation').attr('data-id');

        if (dataType === 'datalayer') {
            var $plottedLayer = $('#PlottedQueriesTable .DataLayer[data-id="' + queryId + '"]');
            var options = {
                isMobile: true,
                plottedLayer: $plottedLayer
            }
            MADemographicLayer.ToggleMarkerRow(row, options);
            return;
        }

        var $plottedQuery = $('#PlottedQueriesTable .savedQuery[data-id="' + queryId + '"]');
        var $legendContainer = $legendCheckbox.closest('.qidLocation');
        if ($plottedQuery.length === 0) {
            return;
        }

        //update the global check box
        var legendRows = $legendContainer.find('.legend-row');
        var activeRows = $legendContainer.find('.legend-row .legend-checkbox:checked');
        var isChecked = $legendCheckbox.prop('checked');
        if (isChecked) {
            $legendCheckbox.prop('checked', true);
        }
        else {
            $legendCheckbox.prop('checked', false);
        }

        if ($plottedQuery.hasClass('loading')) {
            $legendRow.find('.legend-checkbox').prop('checked', !isChecked);
            return;
        }
        if (activeRows.length === legendRows.length) {
            $legendContainer.find('#markerLegendCheckAll').removeClass('intermediate').addClass('checked').prop('checked', true);
        }
        else if (activeRows.length === 0) {
            $legendContainer.find('#markerLegendCheckAll').removeClass('intermediate checked').prop('checked', false);
        }
        else {
            $legendContainer.find('#markerLegendCheckAll').removeClass('checked').addClass('intermediate').prop('checked', false);
        }

        //check for a section and update that checkbox
        var sectionId = $legendRow.attr('data-sectionid') || '';
        var $sectionHeaderRow = $legendContainer.find('.legend-row-header[data-sectionid="' + sectionId + '"]');
        var sectionRows = $legendContainer.find('.legend-row[data-sectionid="' + sectionId + '"]');
        var activeSectionRows = $legendContainer.find('.legend-row[data-sectionid="' + sectionId + '"] .legend-checkbox:checked');
        if (activeSectionRows.length === sectionRows.length) {
            //checked
            $sectionHeaderRow.find('.legend-checkbox').prop('checked', true).removeClass('intermediate').prop('checked', true);
        }
        else if (activeSectionRows.length === 0) {
            //unchecked
            $sectionHeaderRow.find('.legend-checkbox').prop('checked', false).removeClass('intermediate').prop('checked', false);
        }
        else {
            //intermediate
            $sectionHeaderRow.find('.legend-checkbox').prop('checked', false).addClass('intermediate').prop('checked', false);
        }

        var legendRowHTML = $legendCheckbox.closest('.legend-wrap').html();
        var queryInfo = getProperty(MAPlotting.plottedIds, queryId) || {};
        var legendInfo = queryInfo.legendInfo || {};
        legendInfo.legendHTML = legendRowHTML;

        var legendId = $legendRow.attr('data-id');
        var qid = $plottedQuery.attr('qid');
        //keep track of the rows being toggled
        MAPlotting.legendRowSelections[qid] = MAPlotting.legendRowSelections[qid] || {}
        MAPlotting.legendRowSelections[qid][legendId] = isChecked
        //check if we are waiting for a timeout
        clearTimeout(MAPlotting.legendRowTimeout);
        MAPlotting.legendRowTimeout = null;

        MAPlotting.legendRowTimeout = setTimeout(function () {
            var options = {
                plottedQuery: $plottedQuery,
                rows: MAPlotting.legendRowSelections[qid]
            }
            MAPlotting.legendRowTimeout = null;
            var $loadingMessage = MAToastMessages.showLoading({ message: MASystem.Labels.MA_Rendering + '...', timeOut: 0, extendedTimeOut: 0 });
            MAPlotting.toggleLegendRow(options, function () {
                MAPlotting.updateQueryInfo($plottedQuery, function () {
                    //remove loading
                    MAToastMessages.hideMessage($loadingMessage);
                    $plottedQuery.removeClass('loading');
                    $plottedQuery.find('.queryIcon').show();
                    $plottedQuery.find('.queryLoader').hide();
                    MAPlotting.mobile.updateMobileQueryInfo(queryInfo);
                    delete MAPlotting.legendRowSelections[qid];
                });
            });
        }, 500);

    },
    refreshAllPlotted: function () {
        var $plottedQueries = $('#PlottedQueriesTable .PlottedRowUnit');
        var queryCount = $plottedQueries.length;
        var queyTotal = 0;
        $('#mapMarkerRefreshButton').removeClass('in');
        var plotQueue = async.queue(function (queryData, callback) {
            var $legendLocaiton;
            queyTotal++;
            var queryId = queryData.attr('data-id');
            var isDataLayer = queryData.hasClass('DataLayer');
            var type = queryData.attr('type');

            if (isDataLayer) {
                MADemographicLayer.refreshDataLayer(queryData, {}, function (res) {
                    queryData.removeClass('visibleLoading');
                    $('#layersIndividualWrap .plotLayer').prop('checked', 'checked');

                    callback();
                });
            }
            else {
                if (type == 'arcgisonline') {
                    var layerId = queryData.attr('qid');
                    ArcGIS.refreshLayer(layerId);
                }
                else {
                    MAPlotting.refreshQuery(queryData, null, { force: true }).then(function (res) {
                        if ($('#legendWrap').hasClass('in') && queryId == $('#legendLayerSelector .selectOption ').attr('data-id')) {
                            MAPlotting.mobile.updateLegendCounts({
                                plottedQuery: queryData,
                                legendLocation: $('#legendWrap')
                            });
                        }
                        if (!$('#layersIndividualWrap').hasClass('nest-out') && queryId == $('#layersIndividualWrap .layersIndividual').attr('savedqueryid')) {
                            $legendLocaiton = $('#layersIndividualWrap');
                            MAPlotting.mobile.updateLegendCounts({
                                plottedQuery: queryData,
                                legendLocation: $('#layersIndividualWrap')
                            });
                        }

                        callback();
                    });
                }
            }
        });


        $.each($plottedQueries, function (i, query) {
            plotQueue.push($(query));
        });

        plotQueue.drain = function () {
            MAToastMessages.showSuccess({ message: 'Done' });
        };
    },
    lastLegendViewed: '', //keep track of last legend viewed and recall
    lastListViewed: '',
    toggleLayer: function (toggle) {
        var $toggle = $(toggle);
        var type = $toggle.closest('.qidLocation').attr('type');
        var renderLayer = $toggle.prop('checked');
        var toggleId = $toggle.closest('.qidLocation').attr('data-id');
        if (renderLayer) {
            $toggle.prop('checked', false); //keep unchecked, will get checked in function
            $toggle.closest('.ma-folder-item').find('.layer-nest-click-area').click();
        }
        else {
            MALayers.moveToTab('allLayers');
            if (type === 'arcgisonline') {
                MAPlotting.mobile.removeArcGISLayer(toggle);
            }
            else if (type === 'favorite') {
                MAPlotting.mobile.removeFavoriteLayer(toggle);
            }
            else if (type === 'marker') {
                MAPlotting.mobile.removeQuery(toggle);
            }
            else if (type === 'shape') {
                MAPlotting.mobile.removeProximityLayer(toggle);
            }
            else if (type === 'datalayer') {
                var $plottedQuery = $('#PlottedQueriesTable .PlottedRowUnit[data-id="' + toggleId + '"]');
                MADemographicLayer.RemoveLayerFromDom($plottedQuery);
                //MAPlotting.mobile.removeQuery(toggle);
            }
            else if (type === 'boundary') {
                var $plottedBoundary = $('#PlottedQueriesTable .layer.proximity[data-id="' + toggleId + '"]');
                $plottedBoundary.find('.layer-toggle input').click();
                MALayers.moveToTab('allLayers');
            }
            else if (type === 'live') {
                var $plottedQuery = $('#PlottedQueriesTable .PlottedRowUnit[data-id="' + toggleId + '"]');
                MAPlotting.removeQuery($plottedQuery);
            }
        }
    },
    layerTypePlotted: function (typeToFind) {
        var markersArePlotted = false;
        for (var id in MAPlotting.plottedIds) {
            var layer = MAPlotting.plottedIds[id];
            if (layer.type === typeToFind) {
                markersArePlotted = true;
                break;
            }
        }
        return markersArePlotted;
    },
    removeArcGISLayer: function (removeToggle) {
        var id = $(removeToggle).closest('.qidLocation').attr('data-id');

        ArcGIS.removeLayer(id);

        //remove all info extect legend from single view if visible
        var $singleVisibleLayer = $('#layersIndividualWrap .layersIndividual');
        var singleViewId = $singleVisibleLayer.attr('data-id');

        if (singleViewId === id) {
            $singleVisibleLayer.find('.plotLayer').prop('checked', false);
            $singleVisibleLayer.removeAttr('qid');
            $singleVisibleLayer.find('.legend-count').attr('disabled', 'disabled');
            $singleVisibleLayer.find('.legend-checkbox').hide();
        }
    },
    removeQuery: function (removeToggle) {
        var dfd = $.Deferred();
        var $qidLocation = $(removeToggle).closest('.qidLocation');
        var qid = $qidLocation.attr('qid');
        var savedQueryId = $qidLocation.attr('data-id');
        var $plottedQuery = $('#PlottedQueriesTable .PlottedRowUnit[data-id="' + savedQueryId + '"]');

        var $singleVisibleLayer = $('#layersIndividualWrap .layersIndividual');
        var singleViewQid = $('#layersIndividualWrap .layersIndividual').attr('qid');
        var singleViewId = $('#layersIndividualWrap .layersIndividual').attr('data-id');

        delete MAPlotting.plottedIds[savedQueryId];
        
        //uncheck this from all layers view
        //$('#folder-contents .ma-folder-item[data-id="'+savedQueryId+'"] .layer-toggle .ma-toggle').prop('checked',false);

        //remove all info extect legend from single view if visible
        if (singleViewId === savedQueryId) {
            $singleVisibleLayer.find('.plotLayer').prop('checked', false);
            $singleVisibleLayer.removeAttr('qid');
            $singleVisibleLayer.find('.legend-count').attr('disabled', 'disabled');
            $singleVisibleLayer.find('.legend-checkbox').hide();
        }

        MAPlotting.removeQuery($plottedQuery).then(function () {
            if (!$('#layersIndividualWrap').hasClass('nest-out')) {
                MALayers.moveToTab('allLayers');
            }

            //check if we need to hide buttons
            var markersArePlotted = MAPlotting.mobile.layerTypePlotted('markerLayer');
            if (!markersArePlotted) {
                $('#maMasterWrap').removeClass('has-list-results has-marker-legend');
                $('#mapMarkerRefreshButton').removeClass('in');
            }

            //if the list is empty, show empty state
            if (!$('#layersIndividualWrap').hasClass('nest-out')) {
                MALayers.moveToTab('allLayers');
            }

            //check if we need to hide buttons
            var markersArePlotted = MAPlotting.mobile.layerTypePlotted('markerLayer');
            if (!markersArePlotted) {
                $('#maMasterWrap').removeClass('has-list-results has-marker-legend');
                $('#mapMarkerRefreshButton').removeClass('in');
            }
            //if the list is empty, show empty state
            setTimeout(function () {
                setMobileState();
                dfd.resolve();
            }, 500);
        });
        return dfd.promise();
    },
    layersArePlotted: function () {
        var $wrapper = $('#PlottedQueriesTable');
        // do we have children elements?
        var layerLength = $('#PlottedQueriesTable').children().length
        var isPlotted = layerLength === 0 ? false : true;
        return isPlotted;
    },
    analyzeQuery: function (options) {
        //handle mobile styling and mobification before running standard analyze call
        var $layer = options.layer;
        var $checkbox = $layer.find('.layer-toggle .ma-toggle');

        //move to single view
        MALayers.moveToTab('singleLayer');
        var $mapLoadingMessage;
        //has this been plotted?
        if ($checkbox.prop('checked')) {
            $mapLoadingMessage = MAToastMessages.showLoading({ message: MASystem.Labels.MA_Loading + '...' });
            MAToastMessages.hideMessage($mapLoadingMessage);

            //rebuild the single layer info
            MAPlotting.mobile.rebuildSigleView(options);

            return;
        }
        else {
            //add check
            $checkbox.prop('checked', 'checked');

            //show loading message
            //$mapLoadingMessage = MAToastMessages.showLoading({message:MASystem.Labels.MA_Plotting+'...',timeOut:0,extendedTimeOut:0});
        }

        //check if visible area
        if (MA.isMobile) {
            options.visibleAreaOnly = MASystem.Organization.VisibleAreaEnabledMobileDefault;
        }

        MAPlotting.analyzeQuery(options).then(function (res) {
            var queryData = res.queryData;
            $layer.attr('qid', queryData.qid);
            MALayers.loadRecent();
        }).fail(function (res) {
            var data = getProperty(res, 'options');
            if (data !== undefined) {
                delete MAPlotting.plottedIds[data.id];
                $layer.find('.layer-toggle .ma-toggle').prop('checked', false);
            }
            //remove query
            MAPlotting.mobile.removeQuery($('#PlottedQueriesTable .savedQuery[data-id="' + data.id + '"]'));
        });
    },
    updateMobileQueryInfo: function (plottedObj) {
        plottedObj = $.extend({
            savedQueryId: ''
        }, plottedObj || {});
        plottedObj = plottedObj || {};
        if ($('#legendWrap #legendBody').attr('data-id') == plottedObj.savedQueryId) {
            MALayers.buildLegendFromPickList(plottedObj);
        }
        if ($('#layersWrap .layersIndividual').attr('data-id') == plottedObj.savedQueryId) {
            MAPlotting.mobile.rebuildSigleView({ id: plottedObj.savedQueryId });
        }
    },
    updateLegendCounts: function (options) {
        //update legend info for different views, just pass the legend wrapper
        if (!options.plottedQuery || !options.legendLocation) {
            return;
        }
        var $mobilePlottedQuery = options.legendLocation;
        var $plottedQuery = options.plottedQuery;
        $mobilePlottedQuery.find('.totalmarkers').text('0');
        $mobilePlottedQuery.find('.visiblemarkers').text('0');
        var legendData = $plottedQuery.data('legendInfo') || {};
        for (var lId in legendData) {
            var section = legendData[lId];
            var $row = $mobilePlottedQuery.find('.legend-row[data-id="' + lId + '"]');
            var legendSectionId = section.sectionId || '';
            var $sectionRow = $mobilePlottedQuery.find('.legend-row-header[data-sectionid="' + legendSectionId + '"]');
            $sectionRow.find('.visiblemarkers').text(parseFloat($sectionRow.find('.visiblemarkers').text()) + section.count);
            $sectionRow.find('.totalmarkers').text(parseFloat($sectionRow.find('.totalmarkers').text()) + section.totalmarkers);
            $row.find('.visiblemarkers').text(section.count);
            $row.find('.totalmarkers').text(section.totalmarkers);
            var sectionId = $row.attr('data-sectionid');
            var $section = $mobilePlottedQuery.find('.legend-row-header[data-sectionid="' + sectionId + '"]');
            if (section.count > 0) {
                if (false) {
                    //get the sectionid on update the section if needed
                    $section.removeClass('empty sectionClosed').addClass('sectionOpen').show();
                    $section.find('.rowDropIcon').addClass('ion-android-arrow-dropdown').removeClass('ion-android-arrow-dropup');
                    $row.removeClass('empty');
                    $row.show();
                    $plottedQuery.data('isLoaded', true)
                }
                else {
                    if ($section.find('.rowDropIcon').hasClass('ion-android-arrow-dropdown')) {
                        //get the sectionid on update the section if needed
                        $section.removeClass('empty sectionClosed').addClass('sectionOpen').show();
                        $row.removeClass('empty');
                        $row.show();
                        $row.find('.legend-checkbox').prop('checked', true);
                        $section.find('.legend-header-checkbox').addClass('ion-checkmark-round');
                    }
                    else {
                        //just update the row don't show
                        $row.removeClass('empty');
                        $row.find('.legend-checkbox').prop('checked', true);
                        $section.find('.legend-header-checkbox').addClass('ion-checkmark-round');
                        $section.removeClass('empty').show();
                    }
                }
            }

            var totalCheck = $mobilePlottedQuery.find('.legend-row[data-sectionid="' + sectionId + '"] .legend-checkbox:checked').length;
            var totalRows = $mobilePlottedQuery.find('.legend-row[data-sectionid="' + sectionId + '"] .legend-checkbox').length;
            if (totalCheck === 0) {
                $section.find('.legend-header-checkbox').removeClass('ion-checkmark-round ion-minus-round');
            }
            else if (totalRows > totalCheck) {
                $section.find('.legend-header-checkbox').addClass('ion-minus-round').removeClass('ion-checkmark-round');
            }
            else {
                $section.find('.legend-header-checkbox').addClass('ion-checkmark-round').removeClass('ion-minus-round');
            }
        }

        //update order of rows
        var $legendTable = $mobilePlottedQuery.find('.legend-wrap');
        var legendTableAutoRows = $legendTable.find('.auto-row').remove();

        var arrayWithSortBy = legendTableAutoRows.get().map(function (row) {
            row.sortBy = Number($(row).find('.totalmarkers').text());
            return row;
        });

        var sortedRows = MAListView.MergeSortDesc(arrayWithSortBy);

        $legendTable.find('.other').before(sortedRows);

        //update total counts
        $mobilePlottedQuery.find('.legendField').append($plottedQuery.find('.plottinginfo-wrapper').clone().removeClass('hidden'));
    },
    rebuildSigleView: function (options) {
        var plottedInfo = getProperty(MAPlotting.plottedIds, options.id) || {};

        var $mobilePlottedQuery = MAPlotting.buildMobileElement(options);

        var legendHTML = getProperty(plottedInfo, 'legendInfo.legendHTML') || '';
        $mobilePlottedQuery.find('.legend-wrap').html(legendHTML);
        $mobilePlottedQuery.attr('data-id', options.id);
        //toggle plotted and plot on load if needed
        $mobilePlottedQuery.find('.plotLayer').prop('checked', true);
        if (MALayers.isPlotOnLoad.hasOwnProperty(options.id)) {
            $mobilePlottedQuery.find('.plotOnLoadToggle').prop('checked', true);
        }

        var subTitleHTML = '<div class="ma-top-bar-subtext layerType">' + plottedInfo.layerType + '</div>';
        $mobilePlottedQuery.find('.layerName').html(plottedInfo.name + subTitleHTML);
        $mobilePlottedQuery.find('.ma-toggle').attr('data-type', 'savedQuery');
        $mobilePlottedQuery.find('.plotOnLoadToggle').attr('disabled', false);
        $mobilePlottedQuery.find('.plotOnLoadLabel').removeClass('disabled');
        if (plottedInfo.colorField !== 'N/A') {
            $mobilePlottedQuery.find('.legendField').html('<strong>' + MASystem.Labels.MA_Field + ':</strong> ' + plottedInfo.colorField);
        }
        else {
            $mobilePlottedQuery.find('.legendField').html('');
        }


        //loop over legend object and update values
        var $plottedQuery = $('#PlottedQueriesTable .savedQuery[qid="' + plottedInfo.qid + '"]');
        var legendData = $plottedQuery.data('legendInfo') || {};


        MAPlotting.mobile.updateLegendCounts({
            plottedQuery: $plottedQuery,
            legendLocation: $mobilePlottedQuery
        });
    },
    rebuildLegendFromObj: function (legendObj) {
        var legendHTML = '';
        legendObj = legendObj || {};
        var MAIO_URL = getProperty(MASystem, 'Organization.MAIO_URL', false) || 'https://api.mapanything.io';
        var otherRowInfo = {};
        for (var rowID in legendObj) {
            var legendInfo = legendObj[rowID];

            if (legendInfo.isOther) {
                otherRowInfo = legendInfo;
                continue;
            }

            var rowImage = '';
            if (legendInfo.markerValue.indexOf('image:') === -1) {
                var colorParts = legendInfo.markerValue.split(':');
                var iconPart = colorParts[1] || 'Marker';
                var iconColor = colorParts[0] || '3083d3';
                iconColor = iconColor.replace(/#/g, '');
                var imageURL = MAIO_URL + '/services/images/marker?color=' + iconColor + '&forlegend=false&icon=' + iconPart;
                rowImage = '<img style="height:20px" class="legend-image" src="' + imageURL + '" />';
            }

            legendHTML += $('#templates .legend-item.template').clone().removeClass('template').html()
                .replace(/::legendCheckboxId::/g, 'legend-checkbox' + MA.componentIndex++)
                .replace(/::dataRule::/g, legendInfo.legendId.replace(/lid/g, ''))
                .replace(/::Label::/g, legendInfo.label)
                .replace(/::isAuto::/g, legendInfo.isAuto ? 'auto-row' : '')
                .replace(/::OTHER::/g, '')
                .replace(/::Marker::/g, rowImage);
        }

        if (otherRowInfo.hasOwnProperty('label')) {
            var otherImage = '';
            if (legendInfo.markerValue.indexOf('image:') === -1) {
                var colorParts = otherRowInfo.markerValue.split(':');
                var iconPart = colorParts[1] || 'Circle';
                var iconColor = colorParts[0] || '3083d3';
                iconColor = iconColor.replace(/#/g, '');
                var imageURL = MAIO_URL + '/services/images/marker?color=' + iconColor + '&forlegend=false&icon=' + iconPart;
                otherImage = '<img class="legend-image" src="' + imageURL + '" style="height: 20px; max-width: 30px;"/>';
                // otherImage = MAMarkerBuilder.createSVG({forLegend:true, color:otherRowInfo.markerValue});
            }
            legendHTML += $('#templates .legend-item.template').clone().removeClass('template').html()
                .replace(/::legendCheckboxId::/g, 'legend-checkbox' + MA.componentIndex++)
                .replace(/::dataRule::/g, otherRowInfo.legendId.replace(/lid/g, ''))
                .replace(/::Label::/g, otherRowInfo.label)
                .replace(/::isAuto::/g, '')
                .replace(/::OTHER::/g, 'other')
                .replace(/::Marker::/g, otherImage);
        }

        return legendHTML;
    },
    showShapeLayer: function (layerId) {
        var plottedObj = getProperty(MAPlotting.plottedIds, layerId);

        if (plottedObj) {

        }
        else {
            MAToastMessages.showError({ message: 'Shape Info', subMessage: 'Unable to build layer view.' });
        }
    },
    poiListClick: function (placeId, callback) {
        callback = callback || function () { };
        var places = MA.Map.Search.markers;
        var foundMatch = false;
        for (var p = 0, len = places.length; p < len; p++) {
            var marker = places[p];
            var place = marker.maData.place;
            var pId = place.place_id;
            if (pId === placeId) {
                MAPlotting.mobile.poiClick.call(marker, { markerType: 'POI' });
                foundMatch = true;
                break;
            }
        }

        if (!foundMatch) {
            var placesService = new google.maps.places.PlacesService(MA.map);
            placesService.getDetails({ placeId: placeId }, function (place, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    //create a marker
                    var marker = new google.maps.Marker({
                        map: MA.map,
                        position: place.geometry.location,
                        title: place.name,
                        maData: { place: place },
                        icon: {
                            url: place.icon,
                            size: new google.maps.Size(71, 71),
                            origin: new google.maps.Point(0, 0),
                            anchor: new google.maps.Point(12, 25),
                            scaledSize: new google.maps.Size(25, 25)
                        },
                        zIndex: 999
                    });
                    MA.Map.Search.markers.push(marker);
                    google.maps.event.addListener(marker, 'click', function (e) { MAPlotting.mobile.poiClick.call(this); });
                    MAPlotting.mobile.poiClick.call(marker, { markerType: 'POI' });
                    callback({ success: true });
                }

            });
        }
        else {
            callback({ success: true });
        }
    },
    removePOI: function (clearAll) {
        //remove previous markers and table info
        try {
            $.each(MA.Map.Search.markers || [], function (i, marker) {
                marker.setMap(null);
            });
            MA.Map.Search.markers = [];
            $('#removePOI').remove();
            if (clearAll) {
                $('#searchResults .poiResults').empty();
                $('#searchResults').removeClass('in');
                $('#searchInput').val('');
            }
        }
        catch (e) {
            //do nothing
        }
    },
    createMarkersFromWaypoints: function (records, tooltips) {
        tooltips = [{ "updateField": "Name", "Updateable": true, "TooltipType": "ToolTip", "soapType": "STRING", "shapeFields": {}, "PicklistOptions": [], "needsLink": false, "includeShapeInfo": false, "FieldName": "Name", "FieldLabel": "Account Name", "DisplayType": "STRING", "describe": { "aggregatable": true, "autoNumber": false, "byteLength": 765, "calculated": false, "cascadeDelete": false, "caseSensitive": false, "compoundFieldName": "Name", "createable": true, "custom": false, "defaultedOnCreate": false, "dependentPicklist": false, "deprecatedAndHidden": false, "digits": 0, "displayLocationInDecimal": false, "encrypted": false, "externalId": false, "extraTypeInfo": "switchablepersonname", "filterable": true, "groupable": true, "highScaleNumber": false, "htmlFormatted": false, "idLookup": false, "label": "Account Name", "length": 255, "name": "Name", "nameField": true, "namePointing": false, "nillable": false, "permissionable": false, "picklistValues": [], "polymorphicForeignKey": false, "precision": 0, "queryByDistance": false, "referenceTo": [], "restrictedDelete": false, "restrictedPicklist": false, "scale": 0, "searchPrefilterable": false, "soapType": "xsd:string", "sortable": true, "type": "string", "unique": false, "updateable": true, "writeRequiresMasterRead": false }, "BaseObject": "Account", "ActualFieldName": "Name", "Accessible": true }, { "updateField": "NumberOfEmployees", "Updateable": true, "TooltipType": "ToolTip", "soapType": "INTEGER", "shapeFields": {}, "PicklistOptions": [], "needsLink": false, "includeShapeInfo": false, "FieldName": "NumberOfEmployees", "FieldLabel": "Employees", "DisplayType": "INTEGER", "describe": { "aggregatable": true, "autoNumber": false, "byteLength": 0, "calculated": false, "cascadeDelete": false, "caseSensitive": false, "createable": true, "custom": false, "defaultedOnCreate": false, "dependentPicklist": false, "deprecatedAndHidden": false, "digits": 8, "displayLocationInDecimal": false, "encrypted": false, "externalId": false, "filterable": true, "groupable": true, "highScaleNumber": false, "htmlFormatted": false, "idLookup": false, "label": "Employees", "length": 0, "name": "NumberOfEmployees", "nameField": false, "namePointing": false, "nillable": true, "permissionable": true, "picklistValues": [], "polymorphicForeignKey": false, "precision": 0, "queryByDistance": false, "referenceTo": [], "restrictedDelete": false, "restrictedPicklist": false, "scale": 0, "searchPrefilterable": false, "soapType": "xsd:int", "sortable": true, "type": "int", "unique": false, "updateable": true, "writeRequiresMasterRead": false }, "BaseObject": "Account", "ActualFieldName": "NumberOfEmployees", "Accessible": true }, { "updateField": "Description", "Updateable": true, "TooltipType": "ToolTip", "soapType": "STRING", "shapeFields": {}, "PicklistOptions": [], "needsLink": false, "includeShapeInfo": false, "FieldName": "Description", "FieldLabel": "Account Description", "DisplayType": "TEXTAREA", "describe": { "aggregatable": false, "autoNumber": false, "byteLength": 96000, "calculated": false, "cascadeDelete": false, "caseSensitive": false, "createable": true, "custom": false, "defaultedOnCreate": false, "dependentPicklist": false, "deprecatedAndHidden": false, "digits": 0, "displayLocationInDecimal": false, "encrypted": false, "externalId": false, "extraTypeInfo": "plaintextarea", "filterable": false, "groupable": false, "highScaleNumber": false, "htmlFormatted": false, "idLookup": false, "label": "Account Description", "length": 32000, "name": "Description", "nameField": false, "namePointing": false, "nillable": true, "permissionable": true, "picklistValues": [], "polymorphicForeignKey": false, "precision": 0, "queryByDistance": false, "referenceTo": [], "restrictedDelete": false, "restrictedPicklist": false, "scale": 0, "searchPrefilterable": false, "soapType": "xsd:string", "sortable": false, "type": "textarea", "unique": false, "updateable": true, "writeRequiresMasterRead": false }, "BaseObject": "Account", "ActualFieldName": "Description", "Accessible": true }, { "updateField": "sma__CustomDateField__c", "Updateable": true, "TooltipType": "ToolTip", "soapType": "DATE", "shapeFields": {}, "PicklistOptions": [], "needsLink": false, "includeShapeInfo": false, "FieldName": "sma__CustomDateField__c", "FieldLabel": "CustomDateField", "DisplayType": "DATE", "describe": { "aggregatable": true, "autoNumber": false, "byteLength": 0, "calculated": false, "cascadeDelete": false, "caseSensitive": false, "createable": true, "custom": true, "defaultedOnCreate": false, "dependentPicklist": false, "deprecatedAndHidden": false, "digits": 0, "displayLocationInDecimal": false, "encrypted": false, "externalId": false, "filterable": true, "groupable": true, "highScaleNumber": false, "htmlFormatted": false, "idLookup": false, "label": "CustomDateField", "length": 0, "name": "sma__CustomDateField__c", "nameField": false, "namePointing": false, "nillable": true, "permissionable": true, "picklistValues": [], "polymorphicForeignKey": false, "precision": 0, "queryByDistance": false, "referenceTo": [], "restrictedDelete": false, "restrictedPicklist": false, "scale": 0, "searchPrefilterable": false, "soapType": "xsd:date", "sortable": true, "type": "date", "unique": false, "updateable": true, "writeRequiresMasterRead": false }, "BaseObject": "Account", "ActualFieldName": "sma__CustomDateField__c", "Accessible": true }, { "updateField": "AnnualRevenue", "Updateable": true, "TooltipType": "ToolTip", "soapType": "DOUBLE", "shapeFields": {}, "PicklistOptions": [], "needsLink": false, "includeShapeInfo": false, "FieldName": "AnnualRevenue", "FieldLabel": "Annual Revenue", "DisplayType": "CURRENCY", "describe": { "aggregatable": true, "autoNumber": false, "byteLength": 0, "calculated": false, "cascadeDelete": false, "caseSensitive": false, "createable": true, "custom": false, "defaultedOnCreate": false, "dependentPicklist": false, "deprecatedAndHidden": false, "digits": 0, "displayLocationInDecimal": false, "encrypted": false, "externalId": false, "filterable": true, "groupable": false, "highScaleNumber": false, "htmlFormatted": false, "idLookup": false, "label": "Annual Revenue", "length": 0, "name": "AnnualRevenue", "nameField": false, "namePointing": false, "nillable": true, "permissionable": true, "picklistValues": [], "polymorphicForeignKey": false, "precision": 18, "queryByDistance": false, "referenceTo": [], "restrictedDelete": false, "restrictedPicklist": false, "scale": 0, "searchPrefilterable": false, "soapType": "xsd:double", "sortable": true, "type": "currency", "unique": false, "updateable": true, "writeRequiresMasterRead": false }, "BaseObject": "Account", "ActualFieldName": "AnnualRevenue", "Accessible": true }, { "updateField": "sma__MapAnythingTerritory__c", "Updateable": true, "TooltipType": "ToolTip", "soapType": "STRING", "shapeFields": { "isCustomGeometry": "sma__MapAnythingTerritory__r.sma__CustomGeometry__c" }, "PicklistOptions": [], "parentDescribe": { "aggregatable": true, "autoNumber": false, "byteLength": 18, "calculated": false, "cascadeDelete": false, "caseSensitive": false, "createable": true, "custom": true, "defaultedOnCreate": false, "dependentPicklist": false, "deprecatedAndHidden": false, "digits": 0, "displayLocationInDecimal": false, "encrypted": false, "externalId": false, "filterable": true, "groupable": true, "highScaleNumber": false, "htmlFormatted": false, "idLookup": false, "label": "MapAnything Territory", "length": 18, "name": "sma__MapAnythingTerritory__c", "nameField": false, "namePointing": false, "nillable": true, "permissionable": true, "picklistValues": [], "polymorphicForeignKey": false, "precision": 0, "queryByDistance": false, "referenceTo": ["sma__MATerritory__c"], "relationshipName": "sma__MapAnythingTerritory__r", "restrictedDelete": false, "restrictedPicklist": false, "scale": 0, "searchPrefilterable": false, "soapType": "tns:ID", "sortable": true, "type": "reference", "unique": false, "updateable": true, "writeRequiresMasterRead": false }, "needsLink": true, "linkId": "sma__MapAnythingTerritory__r.Id", "includeShapeInfo": true, "FieldName": "sma__MapAnythingTerritory__r.Name", "FieldLabel": "MapAnything Territory > Name", "DisplayType": "STRING", "describe": { "aggregatable": true, "autoNumber": false, "byteLength": 240, "calculated": false, "cascadeDelete": false, "caseSensitive": false, "createable": true, "custom": false, "defaultedOnCreate": true, "dependentPicklist": false, "deprecatedAndHidden": false, "digits": 0, "displayLocationInDecimal": false, "encrypted": false, "externalId": false, "filterable": true, "groupable": true, "highScaleNumber": false, "htmlFormatted": false, "idLookup": true, "label": "Name", "length": 80, "name": "Name", "nameField": true, "namePointing": false, "nillable": true, "permissionable": false, "picklistValues": [], "polymorphicForeignKey": false, "precision": 0, "queryByDistance": false, "referenceTo": [], "restrictedDelete": false, "restrictedPicklist": false, "scale": 0, "searchPrefilterable": false, "soapType": "xsd:string", "sortable": true, "type": "string", "unique": false, "updateable": true, "writeRequiresMasterRead": false }, "BaseObject": "Account", "ActualFieldName": "sma__MapAnythingTerritory__r.Name", "Accessible": true }, { "updateField": "OwnerId", "Updateable": true, "TooltipType": "Color", "soapType": "STRING", "shapeFields": {}, "PicklistOptions": [], "parentDescribe": { "aggregatable": true, "autoNumber": false, "byteLength": 18, "calculated": false, "cascadeDelete": false, "caseSensitive": false, "createable": true, "custom": false, "defaultedOnCreate": true, "dependentPicklist": false, "deprecatedAndHidden": false, "digits": 0, "displayLocationInDecimal": false, "encrypted": false, "externalId": false, "filterable": true, "groupable": true, "highScaleNumber": false, "htmlFormatted": false, "idLookup": false, "label": "Owner ID", "length": 18, "name": "OwnerId", "nameField": false, "namePointing": false, "nillable": false, "permissionable": false, "picklistValues": [], "polymorphicForeignKey": false, "precision": 0, "queryByDistance": false, "referenceTo": ["User"], "relationshipName": "Owner", "restrictedDelete": false, "restrictedPicklist": false, "scale": 0, "searchPrefilterable": false, "soapType": "tns:ID", "sortable": true, "type": "reference", "unique": false, "updateable": true, "writeRequiresMasterRead": false }, "needsLink": true, "linkId": "Owner.Id", "includeShapeInfo": false, "FieldName": "Owner.Name", "FieldLabel": "Owner > Full Name", "DisplayType": "STRING", "describe": { "aggregatable": true, "autoNumber": false, "byteLength": 363, "calculated": false, "cascadeDelete": false, "caseSensitive": false, "createable": false, "custom": false, "defaultedOnCreate": false, "dependentPicklist": false, "deprecatedAndHidden": false, "digits": 0, "displayLocationInDecimal": false, "encrypted": false, "externalId": false, "extraTypeInfo": "personname", "filterable": true, "groupable": true, "highScaleNumber": false, "htmlFormatted": false, "idLookup": false, "label": "Full Name", "length": 121, "name": "Name", "nameField": true, "namePointing": false, "nillable": false, "permissionable": false, "picklistValues": [], "polymorphicForeignKey": false, "precision": 0, "queryByDistance": false, "referenceTo": [], "restrictedDelete": false, "restrictedPicklist": false, "scale": 0, "searchPrefilterable": false, "soapType": "xsd:string", "sortable": true, "type": "string", "unique": false, "updateable": false, "writeRequiresMasterRead": false }, "BaseObject": "Account", "ActualFieldName": "Owner.Name", "Accessible": true }];
    }
};