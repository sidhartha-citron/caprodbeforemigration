var MAActionFramework = {
	buildRecordIdMap: function(records) {
		var recordIdMap = {};

		records.forEach(function(record) {
			var supportsActivities;
			var baseObjectName;
			var baseObjectLabel;
			var recordId = getProperty(record,'record.Id',false) || '';

			if (!recordId) return;

			try {
				// keeping existing logic just in case
				var queryData = record.plottedQuery.data();
				supportsActivities = queryData.options.supportsActivities;
				baseObjectName = queryData.options.baseObjectName;
				baseObjectLabel = queryData.options.baseObjectLabel;
			} catch (ex) {
				// if plottedQuery is undefined we can grab what we need from the record itself
				supportsActivities = record.supportsActivities;
				baseObjectName = record.baseObjectName;
				baseObjectLabel = record.baseObjectLabel;
			}
	
			if (supportsActivities) {
				recordIdMap[baseObjectName] = recordIdMap[baseObjectName] || { baseObjectLabel: baseObjectLabel, recordIds: [] };
				recordIdMap[baseObjectName].recordIds.push(recordId);
			}
		});

		return recordIdMap;
	},
	getNormalizedRoutingData: function(options) {
		var items = [];
		if (options.hasOwnProperty('customMarkers') && options.customMarkers.length) {
        	// POI and Take-Me-There
            for (var i = 0; i < options.customMarkers.length; i++) {
                var marker = options.customMarkers[i];
                // get lat lng
				var latlng = marker.latlng;
				if (!latlng) {
					try {
						latlng = marker.getPosition();
					} catch(e) {}
				}
                if (latlng === undefined) {
                    continue;
                }
				var placeId = getProperty(marker, 'place.id', false);
                items.push({
                    title: marker.title || 'POI Marker',
                    marker: marker,
                    lat: latlng.lat(),
					lng: latlng.lng(),
					// TODO
					// Dynamically set the baseObjectLabel because right now every MALocation is labeled as a POI
                    baseObjectLabel: 'POI',
                    placeId: placeId,
                    isMALocation: true
                });
            }
        }

        if (options.hasOwnProperty('records') && options.records.length) {
        	// Record Markers
            var qidToOptionsMap = {};

            $('.savedQuery').each(function() {
                var savedQueryData = $(this).data();
                var options = savedQueryData.options || {};
                qidToOptionsMap[savedQueryData.qid] = {
                    supportsActivities: options.supportsActivities,
                    baseObjectLabel: options.baseObjectLabel,
					baseObjectId: options.baseObjectId
                };
            });

        	for (var i = 0; i < options.records.length; i++) {
                var marker = options.records[i], lat, lng;
                var queryData = marker.plottedQuery ? marker.plottedQuery.data() || {} : {};

        		if (marker.location && marker.location.coordinates) {
        			lat = marker.location.coordinates.lat;
        			lng = marker.location.coordinates.lng;
        		}

        		// Skip if we do not have location data
                if (!lat || !lng) continue;

                var qidOptions = qidToOptionsMap[marker.qid];

                // If the marker layer is no longer available then qidOptions is null. We can safely assume we are attempting
                // to add a waypoint to the schedule. In this case, we can grab the data we need from the record/marker.
                if (!qidOptions) {
					if (marker.type != 'feature') {
						qidOptions = {
							baseObjectId: marker.baseObjectId,
							baseObjectLabel: marker.baseObjectLabel,
							supportsActivities: marker.supportsActivities
						};
					}
                }

				var markerTitle = getProperty(marker,'marker.title',false) || getProperty(marker,'Name',false) || '';
        		items.push(
                    $.extend({
            			title: markerTitle,
    					lat: lat,
            			lng: lng,
            			LinkId__c: marker.Id,
						MASavedQry__c: queryData.savedQueryId,
                        marker: marker
            		},
                    qidOptions)
                );
        	}
        }
        if (options.hasOwnProperty('favorites') && options.favorites.length) {
        	for (var i = 0; i < options.favorites.length; i++) {
				var fav = options.favorites[i];
				var favoritePosition = fav.getPosition();
                items.push({
                    title: fav.title,
                    lat: fav.location.lat,
                    lng: fav.location.lng,
                    marker: fav,
                    address: fav.location.address
                });
			}
        }

        if (options.hasOwnProperty('dataLayers') && options.dataLayers) {
            var keys = Object.keys(options.dataLayers);

            for (var j = 0; j < keys.length; j++) {
                var layer = options.dataLayers[keys[j]];
                for (var i = 0; i < layer.length; i++) {
                    var marker = layer[i];
                    marker.address = 'Lat: '+ marker.position.lat() +', Lng: ' + marker.position.lng();

                    items.push({
                        title: marker.title,
                        lat: marker.position.lat(),
                        lng: marker.position.lng(),
                        marker: marker,
                        supportsActivities: false
                    });
                }
            }
        }

        return items;
   	},
			//definitions for buttons that exist in the framework
			standardActions: {
				'Section': {
					Label: 'Section', defaultIcon: '', Type: 'Section', Modes: ['Desktop', 'Mobile']
				},
				'Blank Space': {
					Label: 'Blank Space', defaultIcon: '', Type: 'Blank', Modes: ['Desktop', 'Mobile'], Requirements: []
				},
				'View Record': {
				    Label: MASystem.Labels.MA_VIEW_RECORD, defaultIcon: 'ma-icon-document', Type: 'Standard Action', Modes: [], Layouts: [], Requirements: [], Action: 'Javascript', ActionValue: function (options) {
				       setMobileState().always(function() {
							if (options.records) {
								var records = options.records || []
								var record = records[0] || {};
								// find record id (record.record.id === legacy code)
								var recordId = getProperty(record,'Id',false) || getProperty(record, 'record.Id', false);
								//check if this is salesforce1
								ma_navigateToSObject(recordId);
							} else if (options.favorites) {
								var records = options.favorites || []
								var record = records[0] || {};
								// find record id (record.record.id === legacy code)
								var recordId = getProperty(record, 'record.Id', false);
								//check if this is salesforce1
								ma_navigateToSObject(recordId);
							} else {
								console.warn('record type not supported.');
							}
				       });
				    }
				},
				'Set Reference Point': {
					Label: "Set Reference Point", defaultIcon: 'ma-icon-priority', Type: 'Standard Action', Modes: ['Desktop'], Layouts: ['Tooltip', 'MyPosition', 'POI'], Requirements: [], Action: 'Javascript', ActionValue: function (options) {
	       				//If this is a marker
	       				jQuery.each(options.records || [], function (index, record) {
	       				    var recordCoord;
	       				    var reocrdAddress;
	       				    //var record = options.records[0];
							if( record.hasOwnProperty('formattedMarkerAddress') && record.hasOwnProperty('latLng') ) {
								//WE GOT A FAVORITE LOCATION HERE!
								reocrdAddress = record.formattedMarkerAddress;
								recordCoord = record.latLng;
							}
							else {
								var markerLat = record.location.coordinates.lat || marker.getPosition().lat();
								var markerLng = record.location.coordinates.lng || marker.getPosition().lng();
								var queryData = record.plottedQuery.data() || {};
								var formattedAddress = MAPlotting.getFormattedAddress(record, queryData);
								reocrdAddress = formattedAddress;
								recordCoord = record.marker.position;
							}

							if(typeof VueEventBus != 'undefined') {
								VueEventBus.$emit('set-reference-point', {
									address: reocrdAddress,
									coordinates: recordCoord
								});
							}
	       				});

	       				// If this is POI or My Position
	       				jQuery.each(options.customMarkers || [], function (index, customMarker) {
	       				    if (customMarker.type === 'POI' || customMarker.type === 'MyPosition')
	       				    {
								if(typeof VueEventBus != 'undefined') {
									VueEventBus.$emit('set-reference-point', {
										address: customMarker.address,
										coordinates: customMarker.latlng
									});
								}
	       				    }
	       				});
	           		}
	           	},
				'Add to Trip': {
					//Add To Route
					Label: MASystem.Labels.MAActionFramework_Add_to_Trip,
					defaultIcon: 'ma-icon-route',
					Type: 'Standard Action',
					Modes: ['Desktop', 'Mobile'],
					Layouts: ['Tooltip', 'Mass', 'MyPosition', 'POI'],
					Requirements: [],
					Action: 'Javascript',
	           		ActionValue: function(options) {
						var items = MAActionFramework.getNormalizedRoutingData(options);
						VueEventBus.$emit('add-to-route', items);

						if (!options.isMassAction) {
							MA.Map.InfoBubble.hide();
						}
                    }
				},
                'Add to Schedule': {
                    Label: MASystem.Labels.MA_ADD_TO_SCHEDULE,
                    defaultIcon: 'ma-icon-route',
                    Type: 'Standard Action',
                    Modes: [ 'Desktop', 'Mobile'],
                    Layouts: [ 'Tooltip', 'Mass', 'POI' ],
                    Requirements: [],
                    Action: 'Javascript',
                    ActionValue: function(options) {
                        if(MA.isMobile) {
							// move to schedule tab, then do the processing, better user experience
							VueEventBus.$emit('activate-scheduling', function() {
								var items = MAActionFramework.getNormalizedRoutingData(options);
								VueEventBus.$emit('add-to-schedule', items);
							});
                        } else {
                            var items = MAActionFramework.getNormalizedRoutingData(options);

                            if (!items || !items.length) return;

                            VueEventBus.$emit('activate-scheduling', function() {
                                VueEventBus.$emit('add-to-schedule', items);
                            });

                            if (!options.isMassAction) {
                                MA.Map.InfoBubble.hide();
                            }
                        }
                    }
                },

                /////////////////////////////////////////////////////////// new functions 4/7/2017
				'Add to New Route': {
					Label: MASystem.Labels.MA_Add_To_New_Route,
					defaultIcon: 'ma-icon-route',
					Type: 'Standard Action',
					Modes: ['Desktop', 'Mobile'],
					Layouts: ['Tooltip', 'Mass', 'MyPosition', 'POI'],
					Requirements: [],
					Action: 'Javascript',
                    ActionValue: function (options) {
						var items = MAActionFramework.getNormalizedRoutingData(options);
						VueEventBus.$emit('add-to-new-route', items);

						if (!options.isMassAction) {
							MA.Map.InfoBubble.hide();
						}
	           		}
	           	},

	           	///////////////////////////////////////////////////////////
	           	'Set Proximity Center': {
	           		Label: MASystem.Labels.MAActionFramework_Set_Proximity_Center, defaultIcon: 'ma-icon-proximity', Type: 'Standard Action', Modes: ['Desktop', 'Mobile'], Layouts: ['Tooltip', 'Mass', 'MyPosition', 'POI'], Requirements: [], Action: 'Javascript', ActionValue: function (options) {
						var proximityType = getProperty(userSettings, 'defaultProximitySettings.DefaultProximityType') || 'Circle';

						jQuery.each(options.records || [], function (index, record) {
							addProximityLayer({ proximityType: proximityType, center:{lat:record.location.coordinates.lat, lng:record.location.coordinates.lng}, latitude: record.location.coordinates.lat, longitude: record.location.coordinates.lng, record: record });
						});
						jQuery.each(options.customMarkers || [], function (index, customMarker) {
							addProximityLayer({ proximityType: proximityType, center:{lat:customMarker.latlng.lat(), lng:customMarker.latlng.lng()}, latitude: customMarker.latlng.lat(), longitude: customMarker.latlng.lng() });
						});
						jQuery.each(options.favorites || [], function (index, favorite) {
							addProximityLayer({ proximityType: proximityType, center:{lat:favorite.location.lat, lng:favorite.location.lng}, latitude: favorite.location.lat, longitude: favorite.location.lng });
						});

						//loop over object of dlayers
						var dlayers = options.dataLayers || {};
						for(var dlid in dlayers) {
							var dl = dlayers[dlid] || [];
							for(var i = 0; i < dl.length; i++) {
								var dataLayer = dl[i];
								addProximityLayer({ proximityType: proximityType, center:{lat:dataLayer.getPosition().lat(), lng:dataLayer.getPosition().lng()}, latitude: dataLayer.position.lat(), longitude: dataLayer.position.lng() });
							}
						}

	           			//hide the tooltip if this is not a mass action
	           			if (!options.isMassAction) {
	           				try{
	           					MA.Map.InfoBubble.hide();
	           				}
	           				catch (e){
	           					//do nothing
	           				}
	           			}
	           		}
				},
				'Remove C2C Marker': {
					Label: MASystem.Labels.MAContext_Remove_Marker,
					defaultIcon: 'ma-icon-close',
					Type: 'Standard Action',
					Modes: ['Desktop', 'Mobile', 'NearBy'],
					Layouts: ['Tooltip', 'Mass'],
					Requirements: [],
					Action: 'Javascript',
					ActionValue: function (options) {
						// putting this in for quick fix, mobile is expecting records for other actions but this is expecting customMarkers (desktop?)
						try {
							var c2c_marker;
							if (options.customMarkers) {
								c2c_marker = options.customMarkers[0].marker;
							} else if (options.records) {
								c2c_marker = options.records[0];
							}
							c2c_marker.setMap(null);
							VueEventBus.$bus.$emit('hide-tooltip');
						} catch (e) {
							console.warn('Unable to remove c2c marker', e);
						}
					}
				},
	           	'Remove Marker': {
	           		Label: MASystem.Labels.MAContext_Remove_Marker,
	           		defaultIcon: 'ma-icon-close',
	           		Type: 'Standard Action',
	           		Modes: ['Desktop', 'Mobile', 'NearBy'],
	           		Layouts: ['Tooltip', 'Mass'],
	           		Requirements: [],
	           		Action: 'Javascript',
	           		ActionValue: function (options) {
	           			var $dfd = $.Deferred();

	           			var $loadingToastUI = MAToastMessages.showLoading({message:'Loading...',subMessage:'Removing markers...', timeOut:0, extendedTimeOut:0});

	           		    var plottedQueries = {}; // store a record of plotted queries for redrawing listviews
	           			if (options.mode == 'Mobile') {
	           				jQuery.each(options.records || [], function (index, record) {
	           					RemoveMarker(record.marker);

	           					plottedQueries[ $(record['plottedQuery']).data('qid') ] = null; // add unique plottedQuery qid to list
	           				});
	           			}
	           			else if (options.mode == 'NearBy') {
	           				jQuery.each(options.records || [], function (index, record) {
	           					NearByRemoveMarker(record.marker);

	           					plottedQueries[ $(record['plottedQuery']).data('qid') ] = null; // add unique plottedQuery qid to list
	           				});
	           			}
	           			else {
							var sfRecords = options.records || [];
							var waypointMarkers = {};
							try {
								VueEventBus.$bus.$emit('hide-tooltip');
								MALayers.moveToTab('hideMarkerInfo');
							}
							catch(e){}
							//batch add to route
							var markerProcessingBatchSize = 100;
							var markerProcessingTimeout = 1;
							var recordsRemaining = sfRecords.length;
							var updateQueryMap = {};
							setTimeout(function doBatch() {
								if(sfRecords.length > 0) {
									var recordsProcessed = 0;
									while (recordsProcessed < markerProcessingBatchSize && sfRecords.length > 0)
									{
										recordsProcessed++;
										var record = sfRecords.shift();

										//if route marker, do not add to map (nothing to update)
										if(record.isRouteMarker) {
											//remove the waypoint from the waypoint list
											MAToastMessages.showWarning({message:'Remove Marker Warning!',subMessage:'Action is not supported for waypoints. Please remove route or hide waypoints.',timeOut:7000,closeButton:true})

											continue;

											/*****************************************************************************************
											 *
											 * try simple notification to start, uncomment below code to actually remove the marker
											 * will need to update the mass action (right click on circles) as well
											 *
											 *****************************************************************************************/
											//waypointMarkers[record.Id] = record;
										}
										else if(record.type == 'feature'){
											record.sublayer.remove(record.feature);
										}
										else{
											RemoveMarkerDesktop(record, {updateQueryInfo:false});

											var qid = record.marker.qid;
											updateQueryMap[qid] = 'process';
											plottedQueries[ $(record['plottedQuery']).data('qid') ] = null; // add unique plottedQuery qid to list
										}
									}

									//do next record
									setTimeout(doBatch, markerProcessingTimeout);
								}
								else {
									for(var queryid in updateQueryMap) {
										var $plottedQuery = $('#PlottedQueriesTable .PlottedRowUnit[qid="'+queryid+'"]')
										if ($plottedQuery.data('type') == 'datalayer') {
											var renderModes = MADemographicLayer.getRenderModes($plottedQuery);
											// TODO: Currently, rerender "all" markers again. How to just count remaining markers and refresh legend?
											MADemographicLayer.rerenderDataLayer($plottedQuery,{renderModes: renderModes},function() {
											});
										}
										else {
											MAPlotting.updateQueryInfo($plottedQuery);
										}
									}
									/*****************************************************************************************
									 *
									 * Actual code that removes waypoint markers
									 *
									 *****************************************************************************************/
									//remove any waypoint markers found above
									/*if(Object.keys(waypointMarkers).length > 0) {
										var wpMarkers = MARoutes.waypointMarkers.getMarkers();
										for(var w = 0, len = wpMarkers.length; w < len; w++) {
											var wMarker= wpMarkers[w];
											var wpId = '';
											try {
												wpId = wMarker.record.Id;
											}catch(e) {}

											//check if id exist in map
											if(waypointMarkers[wpId]) {
												wMarker.setMap(null);
												//remove from array
												wpMarkers.splice(w, 1);
											}
										}
									}*/
									// we are getting into this for all marker types
									var keys = Object.keys(updateQueryMap);
									if(keys.length > 0) {
										NotifySuccess('Success', 'Marker(s) removed');
									}
									MAToastMessages.hideMessage($loadingToastUI);
								}

								// redraw necessary list views
								Object.keys(plottedQueries).forEach(function(qid) {
									if(!plottedQueries[qid])
									{
										if(!MA.isMobile) {
											MAListView.ConstructTab(qid);
										}
										plottedQueries[qid] = true;
									}
								});

							}, markerProcessingTimeout);
	           			}

	           			// remove data layer markers
	           			var removeDataLayerMarkerPromises = [];
	           			var dlayers = options.dataLayers || {};
	       				for(var dlid in dlayers) {
							var $plottedLayer = $('.DataLayer[uid="'+dlid+'"]');
							if ($plottedLayer.data() == undefined) {
								$plottedLayer = $('.DataLayer[qid="'+dlid+'"]');
							}

	       					var dlMarkers = [];
	       					var dlMarkers2 = [];
	       				    var dl = dlayers[dlid] || [];
	       				    for(var i = 0; i < dl.length; i++) {
	       				        var dataLayer = dl[i];
	       				        dlMarkers2.push(dataLayer.markerId);
	       				        //dlMarkers.push(dataLayer.data.marker.uid);

	       				        dlMarkers.push(dataLayer.data.uid);
	       				        //MADemographicLayer.removeDataLayerMarker(dataLayer);
	       				    }

	       				   var removeDataLayerMarkerPromise = MADemographicLayer.removeDataLayerMarker({markers:dlMarkers, markers2 : dlMarkers2, layer: $plottedLayer});

	       				   if(removeDataLayerMarkerPromise) {
	       				       removeDataLayerMarkerPromises.push(removeDataLayerMarkerPromise);
	       				   }
	       				}

	       				$.when.apply($, removeDataLayerMarkerPromises).then(function() {
	       					if(arguments.length > 0) { // if any data layer markers were actually present and got removed
	       						NotifySuccess('Success', 'Data layer marker(s) removed');
	       					}
	       				});

						// hide the tooltip if this is not a mass action
	           			if (!options.isMassAction) {
	           				try{
	           					MA.Map.InfoBubble.hide();
	           				}
	           				catch (e){
	           					//do nothing
	           				}
	           			}


                        // redraw necessary list views
                    	Object.keys(plottedQueries).forEach(function(qid) {
                    	    if(!plottedQueries[qid])
                    	    {
    	           			    MAListView.ConstructTab(qid);
    	           			    plottedQueries[qid] = true;
                    	    }
	           			});
	           		}
	           	},
	           	'Take Me There': {
	           		Label: MASystem.Labels.MAActionFramework_Take_Me_There, defaultIcon: 'ma-icon-navigate-arrow', Type: 'Standard Action', Modes: ['Desktop', 'Mobile'], Layouts: ['Tooltip', 'POI'], Requirements: [], Action: 'Javascript', ActionValue: function (options) {
	           			//get coordinates
	           			var lat, lng;
                        var dlMarkerPositions = [];

	           			if (options.records && options.records.length > 0) {
							if(options.records[0].location && options.records[0].location.coordinates) {
								lat = options.records[0].location.coordinates.lat;
								lng = options.records[0].location.coordinates.lng;
							}
	       				}
	       				else if (options.customMarkers && options.customMarkers.length > 0) {
							//case 00023859
							//spiderfy can alter the position if in spiderfy mode, changing to lat lng stored on actual marker
							try {
								lat = options.customMarkers[0].markerLocation.lat;
								lng = options.customMarkers[0].markerLocation.lng;
							}
							catch(e) {
								//fall back to getting the location off marker if hardcoded values are missing
								lat = options.customMarkers[0].latlng.lat();
								lng = options.customMarkers[0].latlng.lng();
							}
				        }
				        else if (options.customWPMarkers && options.customWPMarkers.length > 0) {
							//case 00023859
							//spiderfy can alter the position if in spiderfy mode, changing to lat lng stored on actual marker
							try {
								lat = options.customWPMarkers[0].markerLocation.lat;
								lng = options.customWPMarkers[0].markerLocation.lng;
							}
							catch(e) {
								//fall back to getting the location off marker if hardcoded values are missing
								lat = options.customWPMarkers[0].position.lat();
								lng = options.customWPMarkers[0].position.lng();
							}
				        } else if (options.dataLayers) {
                            // Sales commit SFCF-855
                            var dlayers = options.dataLayers || {};

                            for (var dlid in dlayers) {
                                var dl = dlayers[dlid] || [];

                                for (var i = 0; i < dl.length; i++) {
                                    var dataLayerMarker = dl[i];

                                    lat = dataLayerMarker.getPosition().lat();
                                    lng = dataLayerMarker.getPosition().lng();

                                    dlMarkerPositions.push({lat: lat, lng: lng});
                                }
                            }
                        }



				        //Let's get the start position
				        var startPos = {
				        	lat: '',
				        	lng: ''
				        }

				        if( options.startPosition !== undefined ) {
				        	if( options.startPosition.coords !== undefined ) {
				        		startPos.lat = options.startPosition.coords.latitude;
				        		startPos.lng = options.startPosition.coords.longitude;
				        	}
						}
						
						//////////////////////////////////////////////////////
				        // DETERMINE WHETHER APP IS ACCESSED FROM SALESFORCE1 OR BROWSER
				        //////////////////////////////////////////////////////

			            var usingSalesforce1 = typeof sforce != 'undefined'
			            	&& sforce.one
			            	&& window.navigator.userAgent.toLowerCase().indexOf('salesforce1') != -1;

				        //////////////////////////////////////////////////////
				        // DETERMINE USER DEVICE
				        //////////////////////////////////////////////////////

				        var isAppleDevice = navigator.platform.indexOf("iPhone") != -1
				        	|| navigator.platform.indexOf("iPod") != -1
							|| navigator.platform.indexOf("iPad") != -1
							|| (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

						// maybe not the best way to identify android devices as MDN
						// does not sugges using userAgent for this, but it seems to be
						// the most used way currently?
						var isAndroidDeviceOnSF1 = navigator.userAgent.match(/Android/i) && usingSalesforce1;


				        //////////////////////////////////////////////////////
				        // SETUP DEEP LINK OPTIONS W/ FALLBACKS
				        //////////////////////////////////////////////////////

						//case 19114 fix
				        var takeMeThereLinks = [
				        	// 'comgooglemaps://',
				        ];
				        if (isAppleDevice) {
				        	takeMeThereLinks.push('http://maps.apple.com/');
				        } else if (isAndroidDeviceOnSF1) {
							takeMeThereLinks.push('google.navigation:');
						}
				        else {
				        	takeMeThereLinks.push('https://www.google.com/maps');
                        }

				        //////////////////////////////////////////////////////
				        // BUILD QUERY STRING W/ ROUTE ENDPOINTS
				        //////////////////////////////////////////////////////

				        var takeMeThereQueryString = '?';

				        // Add Start Address (saddr) if exists
				        if (startPos && startPos.lat !== '' && startPos.lng !== '') {
				        	if (!isAndroidDeviceOnSF1) {
								takeMeThereQueryString += 'saddr='
								+ encodeURIComponent(startPos.lat + ',' + startPos.lng)
								+ '&';
							}
                        }

                        // Sales commit SFCF-855
                        var takeMeThereQueryStringArray = [];

                        if (dlMarkerPositions && dlMarkerPositions.length > 0) {
                            for (var i = 0; i < dlMarkerPositions.length; i++) {
                                takeMeThereQueryStringArray.push(takeMeThereQueryString += 'daddr=' + encodeURIComponent(dlMarkerPositions[i].lat + ',' + dlMarkerPositions[i].lng));
                            }
                        } else {
                            if (isAndroidDeviceOnSF1) {
								takeMeThereQueryStringArray.push(takeMeThereQueryString += 'q=' + encodeURIComponent(lat + ',' + lng));
							}
							else {
								takeMeThereQueryStringArray.push(takeMeThereQueryString += 'daddr=' + encodeURIComponent(lat + ',' + lng));
							}
                        }

						setMobileState().always(function() {
					        //////////////////////////////////////////////////////
					        // OPEN "TAKE ME THERE" DIRECTIONS
                            //////////////////////////////////////////////////////
							for (var i = 0; i < takeMeThereLinks.length; i++) {
                                for (var j = 0; j < takeMeThereQueryStringArray.length; j++) {
									var url = takeMeThereLinks[i] + takeMeThereQueryStringArray[j];
                                    setTimeout(function(){
                                        // open the link in sf1 or a new window
                                        if (usingSalesforce1) {
                                            sforce.one.navigateToURL(url);
                                        }
                                        else {
                                            //try new window
                                            if(!window.open(url, '_blank')) {
                                                window.open(url, '_parent');
                                            }
                                        }
                                    }, i * 1000);
                                }
							}
						});
	           		}
	           	},
	           	'Set Verified Location': {
	           		Label: MASystem.Labels.MAActionFramework_Set_Verified_Location, defaultIcon: 'ma-icon-my-location', Type: 'Standard Action', Modes: ['Desktop', 'Mobile'], RenderModes: ['Marker'], Layouts: ['Tooltip', 'Mass'], Requirements: ['Verified Location Support'], Action: 'Javascript', ActionValue: function (options) {
				        if (options.mode == 'Mobile')
				        {
				        	jQuery.each(options.records || [], function (index, record) {
	           					SetVerifiedLocation(record.marker);
	           				});
	                        MA.Map.InfoBubble.hide();
				        }
				        else
				        {
					        MA.Map.InfoBubble.hide();
					        jQuery.each(options.records || [], function (index, record) {

					        	//find out what marker is visible
					        	var marker;
					        	var isRendered = [];
					        	//needs to be reworked,timeline
					        	if (record.isScattered) {
					        		//start wit scatter
					        		marker = record.scatterMarker;
					        		record.scatterMarker.setMap(null);
					        		isRendered.push(record.scatterMarker);
					        	}
					        	if (record.isClustered) {
					        		//no scatter, use cluster
					        		marker = record.clusterMarker;
					        		record.clusterMarker.setMap(null);
					        		isRendered.push(record.clusterMarker);
					        	}
					        	if(record.isVisible) {
					        		//we want the marker so end here
					        		marker = record.marker;
					        		record.marker.setMap(null);
					        		isRendered.push(record.marker);
					        	}

					        	//var marker = record.marker;
					        	if(marker === undefined) {
					        		MAToastMessages.showWarning({message:'Unable to locate marker information.',subMessage:'Please try a different render mode.',timeOut:5000});
					        		return;
					        	}
								marker.setMap(MA.map);


					        	var currentLatLng = marker.getPosition();

								//hide all other render modes until done moving

								//marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
						        //make the marker draggable and listen for drag events
						        marker.setDraggable(true);
						        marker.setOpacity(0.4);
								google.maps.event.addListenerOnce(marker, 'dragend', function (e) {

									//reset the marker to non-draggable
									marker.setDraggable(false);
									marker.setOpacity(1);

									//send request to update the verified lat/long for this record
									var newLatLngPostion = marker.getPosition();
									var newLatLng = jQuery.extend({}, newLatLngPostion);
									var queryData = record.plottedQuery.data();

									var processData = {
						            	ajaxResource : 'MATooltipAJAXResources',
						            	action			: 'set_verified_location',
										baseObjectId	: queryData.options.baseObjectId,
										recordId		: record.Id,
										latitude		: newLatLng.lat(),
										longitude		: newLatLng.lng()
									};
																			
									// SFMAP-676 Update record so that marker remaings on map when coordinates are cleared if a layer refresh hasn't taken place.
									record.Verified_Latitude__c = newLatLng.lat();
									record.Verified_Longitude__c = newLatLng.lng();

									update_marker_on_drag_end(processData).then(function(res) {
										//show success or error mes
										if(res && res.success) {
											//grab the lat lng fields
											if (record.location && record.location.fields) {
												var latField = record.location.fields.lat.replace('sma__','');
												var lngField = record.location.fields.lng.replace('sma__','');
												record.location.coordinates.lat = record[latField] = newLatLng.lat();
												record.location.coordinates.lng = record[lngField] = newLatLng.lng();
											}

											//update all marker types
											for(var m = 0; m < isRendered.length; m++) {
												var newMarker = isRendered[m];
												newMarker.setPosition(newLatLngPostion);
												newMarker.setMap(MA.map);
											}
											MAToastMessages.showSuccess({message:'Location updated successfully',timeOut:3000});
										}
										else {
											marker.setPosition(currentLatLng);
											MAToastMessages.showError({message:res.message,timeOut:6000,closeButton:true});
										}
									});
								});
							});

							//fav location
							jQuery.each(options.favorites || [], function (index, favMarker) {
								var currentLatLng = favMarker.getPosition();
								//make the marker draggable and listen for drag events
								favMarker.setDraggable(true);
								favMarker.setOpacity(0.4);
								google.maps.event.addListenerOnce(favMarker, 'dragend', function (e) {

									//reset the marker to non-draggable
									favMarker.setDraggable(false);
									favMarker.setOpacity(1);

									//send request to update the verified lat/long for this record
									var newLatLngPostion = favMarker.getPosition();
									var newLatLng = jQuery.extend({}, newLatLngPostion);
									var recordId = getProperty(favMarker,'record.Id',false);

									if(recordId == undefined){
										MAToastMessages.showError({message:'Unable to set verified location',subMessage:'Record ID missing',timeOut:6000,closeButton:true});
										return;
									}

									var processData = {
										ajaxResource: 'MATooltipAJAXResources',
										action: 'set_verified_location',
										update_favorite_location : 'true',
										recordId: recordId,
										latitude: newLatLng.lat(),
										longitude: newLatLng.lng()
									};

									update_marker_on_drag_end(processData).then(function(res) {
										//show success or error mes
										if(res && res.success) {
											//update lat lng fields on marker in case they are reference elsewhere
											favMarker.location.lat = newLatLng.lat();
											favMarker.location.lng = newLatLng.lng();
											try {
												favMarker.record.record.Latitude__c = newLatLng.lat();
												favMarker.record.record.Longitude__c = newLatLng.lng();
											}
											catch(e){}

											//update all marker types
											favMarker.setPosition(newLatLngPostion);
											MAToastMessages.showSuccess({message:'Location updated successfully',timeOut:3000});
										}
										else {
											marker.setPosition(currentLatLng);
											MAToastMessages.showError({message:res.message,timeOut:6000,closeButton:true});
										}
									});
								});
							});
						}
	           		}
	           	},
	           	'Add to Campaign': {
	           		Label: MASystem.Labels.MAActionFramework_Add_to_Campaign, defaultIcon: 'ma-icon-campaign', Type: 'Standard Action', Modes: ['Desktop', 'Mobile'], Layouts: ['Tooltip', 'Mass'], Requirements: ['Contact Or Lead'], Action: 'Javascript', ActionValue: function (options) {
	           			
						if (MA.isMobile) {
							VueEventBus.$bus.$emit('open-modal', { modal: 'add-to-campaign', options: options});
						} else {
							if (options.isMassAction) {
								AddVisibleToCampaign(options.records);
							}
							else {
								var recordId;
								recordId = options.records[0].Id;
								AddVisibleToCampaign(recordId);
							}
							MA.Map.InfoBubble.hide();
						}
	           		}
	           	},
	           	'Change Owner': {
	           		Label: MASystem.Labels.MAActionFramework_Change_Owner, defaultIcon: 'ma-icon-change-owner', Type: 'Standard Action', Modes: ['Desktop', 'Mobile'], Layouts: ['Tooltip', 'Mass'], Requirements: [], Action: 'Javascript', ActionValue: function (options) {
	           			var recordIds = [];
	           			jQuery.each(options.records || [], function (index, record) {
							
							let records=Lite = null;
												 
							recordLite = {
								Id: record.Id,
								Name: record.Name
							};
							   
							recordIds.push(recordLite);

	           			});
	           			var defaultSubordinates = getProperty(MASystem,'Organization.ShowOnlySubordinates',false) || false;

    					$('#ChangeOwnerPopup .show-only-subordinate').prop('checked', defaultSubordinates);
	           			if (MA.isMobile) {
							VueEventBus.$bus.$emit('open-modal', { modal: 'ChangeOwnerPopup', options: options }, function() {
								mobileChangeOwner(recordIds);
							});
	           			} else {
							VueEventBus.$bus.$emit('open-modal', { modal: 'ChangeOwnerPopup', options: recordIds });
						}

				        MA.Map.InfoBubble.hide();
	           		}
	           	},
	           	'Send Email': {
	           		Label: MASystem.Labels.MAActionFramework_Send_Email, Type: 'Standard Action', defaultIcon: 'ma-icon-email', Modes: ['Desktop'], Layouts: ['Tooltip', 'Mass'], Requirements: ['Activity Support'], Action: 'Javascript', ActionValue: function (options) {
				    	jQuery.each(options.records || [], function (index, record) {
				    	    var recordId;
				    	    var recordType;
							recordId = record.Id;
							recordType = '';

		           			var EmailURL = "/_ui/core/email/author/EmailAuthor?p2_lkid=" + recordId + "&rtype=" + recordId.substring(0,3) + "&retURL=%2F" + recordId;
				            if(jQuery.inArray(recordId.substring(0,3), ['003', '00Q']) == -1)
				            {
				            	//check if account, record type and person account match record
				            	if(MA.personAccounts.enabled && recordId.substring(0,3) == '001' && recordType == MA.personAccounts.recordType) {
				            		//treat this as a contact with to and related to accounts
					    			EmailURL = "/_ui/core/email/author/EmailAuthor?p2_lkid="+ recordId +"&p3_lkid=" + recordId + "&retURL=%2F" + recordId;
					    		}
					    		else {
					    			EmailURL = "/_ui/core/email/author/EmailAuthor?p3_lkid=" + recordId + "&retURL=%2F" + recordId;
					    		}
				            }

				            window.open(EmailURL);
			            });
	           		}
	           	},
	           	'Log a Call': {
	           		Label: MASystem.Labels.MAActionFramework_Log_a_Call, defaultIcon: 'ma-icon-call', Type: 'Standard Action', Modes: ['Desktop', 'Mobile', 'NearBy'], Layouts: ['Tooltip', 'Mass'], Requirements: ['Activity Support'], Action: 'Javascript', ActionValue: function (options) {

	           			var actionHandler = getProperty(MASystem,'Organization.HandleAction') || 'showPopup'; // showPopup || showSalesforce || showOptions

						function showSF() {
							jQuery.each(options.records || [], function (index, record) {
						    	var recordId = record.Id;
			           			var redirectURL = MA.resources.MapActions + '?action=log_call&id=' + recordId;
		           				window.open(redirectURL);
				            });
						}
						function showQuickPopup() {
							var recordIds = [];

		           			jQuery.each(options.records || [], function (index, record) {
						    	var recordId = record.Id;
					    	    recordIds.push(recordId);
				            });

				            logACall_First(recordIds);
						}
						if (MA.isMobile) {
							VueEventBus.$bus.$emit('open-modal',  { modal: 'LogACallPopup', options: options }, function() {
								$('#LogACallPopup').data('records', options.records);
								if (actionHandler == 'showPopup') {
									//click options 2
									showQuickPopup();
								} else {
									//click option 3
									showSF();
								}
							});
	           			} else {
							$('#LogACallPopup').data('records',options.records);
							if (actionHandler == 'showPopup') {
								//click options 2
								showQuickPopup();
							} else {
								//click option 3
								showSF();
							}
						}
	           		}
	           	},
	           	'New Task': {
	           		Label: MASystem.Labels.MAActionFramework_New_Task, defaultIcon: 'ma-icon-new-task', Type: 'Standard Action', Modes: ['Desktop', 'Mobile', 'NearBy'], Layouts: ['Tooltip', 'Mass'], Requirements: ['Activity Support'], Action: 'Javascript', ActionValue: function (options) {
						var modalMounted = true;
						if (MA.isMobile) {
							modalMounted = false;
							VueEventBus.$bus.$emit('open-modal', { modal: 'NewTaskPopup', options: options }, function() {
								modalMounted = true;
							});
	           			}

						var taskInt = setInterval(function() {
							if (modalMounted) {
								clearInterval(taskInt);
								$('#NewTaskPopup').data('records',options.records);

								if (!options.records.length) {
									MAToastMessages.showWarning({ message:'No markers found to perform the mass action.', timeOut:6000 });
									return;
								}

								if (options.isMassAction && options.records.length) {
									$('#newTaskClassic').hide();
									NewTask(MAActionFramework.buildRecordIdMap(options.records || []));
								} else {
									$('#newTaskClassic').show();
									var actionHandler = getProperty(MASystem,'Organization.HandleAction') || 'showPopup'; // showPopup || showSalesforce || showOptions

									function showSF() {
										var recordId = options.records[0].Id;
										var redirectURL = MA.resources.MapActions + '?action=new_task&id=' + recordId;
										window.open(redirectURL);
									}

									if (actionHandler == 'showPopup') {
										NewTask(MAActionFramework.buildRecordIdMap(options.records || []));
									} else {
										showSF();
									}
								}
							}
						}, 100);
	           		}
	           	},
	           	'New Event': {
	           		Label: MASystem.Labels.MAActionFramework_New_Event, defaultIcon: 'ma-icon-event', Type: 'Standard Action', Modes: ['Desktop', 'Mobile', 'NearBy'], Layouts: ['Tooltip', 'Mass'], Requirements: ['Activity Support'], Action: 'Javascript', ActionValue: function (options) {
						var modalMounted = true;

						if (MA.isMobile) {
							modalMounted = false;
							VueEventBus.$bus.$emit('open-modal', { modal: 'NewEventPopup', options: options }, function() {
								modalMounted = true;
							});
						}

						var eventInt = setInterval(function() {
							if (modalMounted) {
								clearInterval(eventInt);
								$('#NewEventPopup').data('records',options.records);

								if (!options.records.length) {
									MAToastMessages.showWarning({ message:'No markers found to perform the mass action.', timeOut:6000 });
									return;
								}

								if (options.isMassAction) {
									$('#newEventClassic').hide();
									NewEvent(MAActionFramework.buildRecordIdMap(options.records || []));
								} else {
									$('#newEventClassic').show();
									var actionHandler = getProperty(MASystem,'Organization.HandleAction') || 'showPopup';

									function showSF() {
										var recordId = options.records[0].Id;

										var redirectURL = MA.resources.MapActions + '?action=new_event&id=' + recordId;
										window.open(redirectURL);
									}

									if (actionHandler == 'showPopup') {
										NewEvent(MAActionFramework.buildRecordIdMap(options.records || []));
									} else {
										showSF();
									}
								}
							}
						}, 100);
	           		}
	           	},
	           	'Check In': {
	           		Label: MASystem.Labels.MAActionFramework_Check_In, defaultIcon: 'ma-icon-check', Type: 'Standard Action', Modes: ['Mobile'], Layouts: ['Tooltip'], Requirements: [], Action: 'Javascript',
	           		ActionValue: function (options) {
						var $dfd = $.Deferred();
						var $button;
						var checkInId = '';
						if (options.buttonInfo) {
							// deprecating dom object
							$button = $('<button>temp</button>');
						} else {
							$button = options.button;
						}
						var thisRecord = options.records[0];
	           			var record = thisRecord.marker != null ? thisRecord : getProperty(thisRecord,'record',false) || {};                                
                        var marker = record.marker || {};
                        var showPopup = options.showPopup || false;
                        var postTo = '';
                        // if this is an event, we need to validate if checking into self or creating new
                        // if self show popup and validate check in or out?
                        var qid = marker.qid || '';
                        var $plottedQuery = $('#PlottedQueriesTable .PlottedRowUnit[qid="'+qid+'"]');
                        var queryData = $plottedQuery.data() || {};
                        var checkInSettings = getProperty(queryData, 'queryRecord.BaseObject__r.Settings__c') || '{}';
                        try {
                            checkInSettings = JSON.parse(checkInSettings);
                            postTo = getProperty(checkInSettings, 'CheckInPostTo', false) || '';
                            if (postTo === 'Same' && options.showPopup !== false) {
                                showPopup = true;
                            }
                        } catch (e) {
                            checkInSettings = {};
                        }
                        if (showPopup) {
                            var buttonHTML = '<div style="text-align: center;"><button class="slds-button slds-button_brand js-checkIn" onclick="">Check In</button><button class="slds-button slds-button_brand js-checkOut">Check Out</button></div>';
                            var popup = MA.Popup.showMAPopup({
                                template: buttonHTML,
                                popupId: 'checkinPopup',
                                width: '200px',
                                buttons: [
                                    {
                                        text: 'Cancel',
                                        type: 'slds-button_neutral'
                                        //no onTap or onclick just closes the popup
                                    }
                                ]
                            });
                            // attch listener to continue process
                            $('#checkinPopup').off('click', '.js-checkOut');
                            $('#checkinPopup').on('click', '.js-checkOut', function() {
                                var checkOutAction = MAActionFramework.standardActions['Check Out'];
                                options.showPopup = false;
                                options.postTo = 'Same';
                                MA.Popup.closeMAPopup();
                                checkOutAction.ActionValue(options);
                            });
                            $('#checkinPopup').off('click', '.js-checkIn');
                            $('#checkinPopup').on('click', '.js-checkIn', function() {
                                var checkInAction = MAActionFramework.standardActions['Check In'];
                                options.showPopup = false;
                                MA.Popup.closeMAPopup();
                                checkInAction.ActionValue(options);
							});
							$dfd.resolve('');
                        }
                        else {
                            if(MA.CheckIn && MA.CheckIn.general && MA.CheckIn.general['Activity-FieldSet'] && MA.CheckIn.general['Activity-FieldSet'] != 'Select' && MA.CheckIn.general['AutoCheckOutEnabled'] == 'true') {
								
								var thisRecord = options.records[0];
								var recordData =  thisRecord.marker != null ? thisRecord : thisRecord.record;
								var opt = {
                                    button : options.button,
                                    record : recordData,
                                    marker : recordData.marker
                                }
                                ShowCheckInDisposition(opt).then(function(checkInId) {

									$dfd.resolve(checkInId);
								});
                            }
                            else {
								//continue as normal
                                CheckIn(marker).then(function(response) {
                                    var CheckInId = response.taskId || response.eventId;
                                    if (CheckInId) {
										$button.text('Check Out');
                                        if (!MA.enabledFeatures.autoCheckOut && postTo !== 'Same') {
                                            $button.data('CheckInId', CheckInId).attr('data-action', 'Check Out').find('.action-bar-button-text').text(MASystem.Labels.MAActionFramework_Check_Out);
                                        }

                                        //add this check in record to the raw plot data
                                        if (CheckInId.substring(0,3) == '00T') {
                                            if(legacyMobile) {
                                                if (!record.record.Tasks) { record.record.Tasks = {}; }
                                                if (!record.record.Tasks.records) { record.record.Tasks.records = []; }
                                                record.record.Tasks.records.push({
                                                    Id: CheckInId,
                                                    IsClosed: MA.enabledFeatures.autoCheckOut
                                                });
                                            }
                                            else {
                                                if (!record.Tasks) { record.Tasks = []; }
                                                record.Tasks.push({
                                                    Id: CheckInId,
                                                    IsClosed: MA.enabledFeatures.autoCheckOut
                                                });
                                            }
                                        }
                                        else {
                                            if (postTo !== 'Same') {
                                                if (!record.Events) { record.Events = []; }
                                                record.Events.push({
                                                    Id: CheckInId,
                                                    Subject: MA.enabledFeatures.autoCheckOut ? 'Check Out @' : 'Check In @'
                                                });
                                            }
										}
										// SFCF-357, rerender marker info
										// google.maps.event.trigger(marker,'click');
										$dfd.resolve(CheckInId);
                                    } else {
										$dfd.reject();
									}
                                });
                            }
						}
						MA.Map.InfoBubble.hide();
						return $dfd.promise();
	           		},
	           		events: {
	           			'ready': [
	           				function (options)
	           				{
	           					//try to pull activity type from this record
	           					var postTo = '';
	           					try { postTo = JSON.parse(options.record.plottedQuery.data('baseObjectSettings')).CheckInPostTo; }
	           					catch (err) { postTo = 'Task'; }

	           					//update check in button to check out if already checked in
	           					if (postTo.indexOf('Task') != -1) {
		                            if (options.record.record.Tasks)
		                            {
										jQuery.each(options.record.record.Tasks, function (index, task) {
											if (!task.IsClosed) {
												try {
													options.button.data('CheckInId', task.Id).text(MASystem.Labels.MAActionFramework_Check_Out).attr('data-action', 'Check Out');
												}
												catch(e) {}
												return false;
											}
										});
		                            }
		                        } else if (postTo.indexOf('Event') != -1) {
		                        	if (options.record.record.Events)
		                            {
										jQuery.each(options.record.record.Events, function (index, event) {
											if (event.Subject && event.Subject.indexOf('Check In @') == 0)
											{
												options.button.data('CheckInId', event.Id).text(MASystem.Labels.MAActionFramework_Check_Out).attr('data-action', 'Check Out');
												return false;
											}
										});
		                            }
		                        }
	           				}
	           			]
	           		}
	           	},
	           	'Check Out': {
	           		Label: MASystem.Labels.MAActionFramework_Check_Out, defaultIcon: 'ma-icon-check', Type: 'Standard Action', Modes: [], Layouts: [], Requirements: [], Action: 'Javascript', ActionValue: function (options) {
						var $dfd = $.Deferred();   
						var $button;
						var checkinId = '';
						if (options.buttonInfo) {
							// deprecating dom object
							$button = $('<button>temp</button>');
							checkinId = getProperty(options || {}, 'buttonInfo.checkInId', false) || '';
						} else {
							$button = options.button;
							checkinId = $button.data('CheckInId') || '';
						}
						var thisRecord = options.records[0];
						var record = thisRecord.marker != null ? thisRecord : getProperty(thisRecord,'record',false) || {};       
                        var marker = record.marker;
                        if (options.postTo === 'Same') {
                            checkinId = getProperty(record, 'record.Id', false) || '';
                        }
				    	if(MA.CheckIn && MA.CheckIn.general && MA.CheckIn.general['Activity-FieldSet'] && MA.CheckIn.general['Activity-FieldSet'] != 'Select' && checkinId.indexOf('00U') != 0)
				    	{
				    		var options = {
				    			button : $button,
				    			record : record,
								marker : marker,
								checkinId: checkinId
				    		}
				    		ShowCheckOutDisposition(options);
				    	} else {
				    		CheckOut(marker, checkinId, function (CheckInId) {
								$button.find('.action-bar-button-text').text('Check In');
								$button.data('CheckInId', null);
		                        //update this check in record in the raw plot data
		                        if (CheckInId.indexOf('00T') == 0)
		                        {
									jQuery.each(record.Tasks, function (index, task) {
										if (task.Id == CheckInId) {
											task.IsClosed = true;
											return false;
										}
									});
		                        } else {
									jQuery.each(record.Events, function (index, event) {
										if (event.Id == CheckInId) {
											event.Subject = event.Subject.replace('Check In @', 'Check Out @');
											return false;
										}
									});
								}
								// SFCF-357, rerender marker info
								// google.maps.event.trigger(marker,'click');
								$dfd.resolve(CheckInId);
		                    });
				    	}
						MA.Map.InfoBubble.hide();
						return $dfd.promise();
	           		}
	           	},
	           	'Clear Coordinates': {
	           		Label: MASystem.Labels.MAActionFramework_Clear_Coordinates,
	           		defaultIcon: 'ma-icon-clear',
	           		Type: 'Standard Action',
	           		Modes: ['Desktop'],
	           		Layouts: ['Tooltip', 'Mass'],
	           		Requirements: [],
	           		Action: 'Javascript',
					ActionValue: function (options) {
						MA.Map.InfoBubble.hide();

						//start building request data
						var queriesToClear = [];
						var queriesToUpdate = [];

						// Clears coordinates for marker
						$('#ClearCoordinatesPopup').data('records', options.records);
                        $('#ClearCoordinatesPopup').data('coordErrors',[]);
                        ClearCoordinates_Prompt(options.records);

						// This block is needed for populating the 'Actions' buttons for the markers. Otherwise it does nothing.
						//set an interval to track when all the batches have returned
						var $status = jQuery('#growl-wrapper').data({batchCount: 0, failureCount: 0 });
						$status.data(
							'batchInterval',
							setInterval(function () {
								//remove the needed markers from the map by looping over the queries to update
								jQuery.each(queriesToUpdate, function (index, queryToUpdate) {
									jQuery.each(queryToUpdate.recordsToRemove, function (recordId, record) {
									});
								});
							}, 1000)
						);
					}
	           	},
	           	'Chatter Post': {
	           		Label: MASystem.Labels.MA_Chatter_Post, Type: 'Standard Action', defaultIcon: 'ma-icon-email-chatter', Modes: ['Desktop'], Layouts: ['Tooltip', 'Mass'], Requirements: ['Chatter Support'], Action: 'Javascript', ActionValue: function (options) {
			        	var recordIds = [];
			        	jQuery.each(options.records || [], function (index, record) {
			        	    var supportsChatter = false;
							var queryData = record.plottedQuery.data();
							supportsChatter = queryData.options.supportsChatter;
			        		if (supportsChatter) {
				            	recordIds.push(record.record.Id);
				            }
			        	});
			            ChatterPost(recordIds);
	           		}
	           	},
	           	'Follow': {
	           		Label: MASystem.Labels.MAActionFramework_Follow, defaultIcon: 'ma-icon-follow', Type: 'Standard Action', Modes: ['Desktop', 'Mobile'], Layouts: ['Mass'], Requirements: [], Action: 'Javascript', ActionValue: function (options) {
	           			updateChatterSubscriptions(true, options.records);
	           		}
	           	},
	           	'Unfollow': {
	           		Label: MASystem.Labels.MAActionFramework_Unfollow, defaultIcon: 'ma-icon-following', Type: 'Standard Action', Modes: ['Desktop', 'Mobile'], Layouts: ['Mass'], Requirements: [], Action: 'Javascript', ActionValue: function (options) {
	           			updateChatterSubscriptions(false, options.records);
	           		}
	           	},
	           	'Update Field': {
	           		Label: MASystem.Labels.MAActionFramework_Update_Field, defaultIcon: 'ma-icon-edit', Type: 'Standard Action', Modes: ['Desktop', 'Mobile'], Layouts: ['Mass'], Requirements: [], Action: 'Javascript', ActionValue: function (options) {
	           			UpdateFieldOfVisible(options.records);
	           		}
	           	},
	           	'Create Favorite': {
	           		Label: MASystem.Labels.MAActionFramework_Create_Favorite, defaultIcon: 'ma-icon-favorite', Type: 'Standard Action', Modes: ['Mobile'], Layouts: ['Tooltip', 'MyPosition', 'POI'], Requirements: [], Action: 'Javascript', ActionValue: function (options) {

						if (options.records && options.records.length > 0) {
							var record = options.records[0];
							var latLng = getProperty(record,'location.coordinates');
							var queryData = $('#PlottedQueriesTable .savedQuery[data-id="'+record.savedQueryId+'"]').data() || {};
							var address = MAPlotting.getFormattedAddress(record,queryData);
							CreateFavorite({ latlng: latLng, address: address, name: record.marker.title });
						}
						else if (options.customMarkers && options.customMarkers.length > 0) {
							var marker = options.customMarkers[0];
							var markerPostion = marker.latlng;
							CreateFavorite({
								latlng: {
									lat: markerPostion.lat(),
									lng: markerPostion.lng()
								},
								address: marker.address || '',
								name: marker.title
							});
						}
	           		}
	           	},
	           	'Create Record': {
                    Label: "Click2Create\u2122",
                    defaultIcon: 'ma-icon-world',
                    Type: 'Standard Action',
                    Modes: ['Desktop', 'Mobile'],
                    Layouts: ['MyPosition', 'POI', 'Mass'],
                    Requirements: [],
                    Action: 'Javascript',
                    ActionValue: function (options) {
                        if (options.isMassAction) {
                            //do we have any data layers plotted?
                            if($('.DataLayer').length === 0) {
                                MAToastMessages.showWarning({message:'Click2Create\u2122 Warning',subMessage:'Please plot a supported "Data Layer" to continue',timeOut:6000});
                            }
                            else {
                                //show data layer selection menu
                                var dataLayerSelectHTML = '<div class="overflow" style="max-height:400px; overflow: auto;">'+
                                                            '<div class="createrecord-formitem slds-form-element">'+
                                                                '<label class="slds-form-element__label">What data will we be using?</label>'+
                                                                '<div class="slds-form-element__control">'+
                                                                    '<div class="slds-select_container">'+
                                                                        '<select class="slds-select createrecordDataLayer2-dataType"></select>'+
                                                                    '</div>'+
                                                                '</div>'+
                                                            '</div>'+
                                                        '</div>';

                                var dlSelectPopup = MA.Popup.showMAPopup({
                                    title: 'Click2Create\u2122',
                                    template: dataLayerSelectHTML,
                                    popupId : 'dataLayerSelction',
                                    width: 400,
                                    buttons: [
                                        {
                                        text: 'Cancel',
                                        type: 'slds-button_neutral'
                                        //no onTap or onclick just closes the popup
                                        },
                                        {
                                            text: 'Continue',
                                            type: 'slds-button_brand',
                                            onTap: function(e) {
                                                //get the password and name
                                                var returnOpt = {
                                                    dlid : $('#dataLayerSelction .createrecordDataLayer2-dataType').val(),
                                                    lid : $('#dataLayerSelction .createrecordDataLayer2-dataType option:selected').attr('data-uid')
                                                }

                                                return returnOpt;
                                            }
                                        }
                                    ]
                                });

                                //fill out selectbox
                                MAData.createRecordFromDataLayer.getDataLayerc2cOptions();

                                dlSelectPopup.then(function(dlSelectPopupRes) {
                                    if(dlSelectPopupRes) {
                                        //update the options with the selected data layers markers
                                        var layerData = $('.DataLayer[qid="'+dlSelectPopupRes.lid+'"]').data();
                                        //grab the makrers from the selected layer
										// var markerArr = options.dataLayers[dlSelectPopupRes.lid];
										var markerArr = options.dataLayers[dlSelectPopupRes.lid] || options.dataLayers[layerData.key];
                                        options.dataLayers = markerArr || [];
                                        //check the number of records
                                        if(options.dataLayers.length > 5000) {
                                            MA.Popup.showMAAlert({
                                                title: 'Click2Create\u2122',
                                                template: '<div style="font-weight: bold;font-size: 13px;text-align: center;color: #d4504c;padding-bottom: 10px;">Please limit your selection and try again.</div><div style="text-align: center;">Currently a max of 5000 markers are permitted.</div>',
                                                width: 400
                                            });
                                            return;
                                        }

                                        var confirmPopup = MA.Popup.showMAConfirm({
                                            title: 'Click2Create\u2122',
                                            template: '<div style="font-weight: bold;font-size: 13px;text-align: center;color: #d4504c;padding-bottom: 10px;">Please read the information below fully.</div><div style="text-align: center;">You are about to create '+options.dataLayers.length+' record(s). Any options selected during these steps will be used for all new records.  If a value is blank, it will be auto populated with the fields selected on the \'Data Layer Settings\' page.</div><div style="text-align: center;padding-top: 10px;">Are you sure you want to continue?</div>',
                                            cancelText : 'Cancel',
                                            width: 400
                                        });

                                        confirmPopup.then(function(res) {
                                            if(res) {
                                                //you clicked the ok button
                                                MAData.createRecordFromDataLayer.launch_popupV2({isMassAction : options.isMassAction || false, dataLayers : options.dataLayers, layerType : dlSelectPopupRes.dlid});
                                            }
                                            else {
                                                //you clicked cancel button
                                            }
                                        });
                                    }
                                    else {
                                        //you clicked cancel button
                                    }
                                });
                            }
                            return;
                        }
						// end mass action
						// start data layers
                        var dlayers = options.dataLayers || {};
                        for(var dlid in dlayers) {
                            var dl = dlayers[dlid] || [];
							var marker = dl[0];
                            //MAData.createRecordFromDataLayer.launch_popupV2({isMassAction : false, dataLayers : dl, layerType : marker.data.marker.dataType});
                            MAData.createRecordFromDataLayer.launch_popupV2({isMassAction : false, dataLayers : dl, layerType : marker.data.datatype});
						}
						// end data layers
						// start custom markers
                        if (options.customMarkers && options.customMarkers.length > 0) {
							var customMarker = options.customMarkers[0] || {};
							c2c.launch_popupV2({
								type: customMarker.type,
								position: customMarker.latlng,
								address: customMarker.address,
								name: customMarker.title,
								phone: getProperty(customMarker, 'place.formatted_phone_number', false) || '',
								website: getProperty(customMarker, 'place.website', false) || '',
								place: customMarker.place || null
							});
						}
						// end custom markers
                        try {
                            MA.Map.InfoBubble.hide();
                        } catch (e) {
                            //do nothing
                        }
                    }
	           	},
	           	'Street View': {
	           		Label: MASystem.Labels.MA_STREET_VIEW, defaultIcon: 'ma-icon-new-account', Type: 'Standard Action', Modes: ['Desktop'], Layouts: ['Tooltip', 'MyPosition', 'POI', 'DataLayer'], Requirements: [], Action: 'Javascript', ActionValue: function (options) {
	           			options.button.text('Searching...');

	           			var pos;
	           			if (options.records && options.records.length > 0) {
							var lat = options.records[0].location.coordinates.lat;
							var lng = options.records[0].location.coordinates.lng;
							pos = new google.maps.LatLng(lat, lng);
	           			}
	           			else if (options.customMarkers && options.customMarkers.length > 0) {
	           				pos = options.customMarkers[0].latlng;
	           			}
	           			else if (options.dataLayers) {
	           			    var dlayers = options.dataLayers || {};
		       				for(var dlid in dlayers) {
		       				    var dl = dlayers[dlid] || [];
		       				    for(var i = 0; i < dl.length; i++) {
		       				        var dataLayer = dl[i];
		       				        pos = dataLayer.getPosition();
								}
							}
	           			}

	           			 //If the radius is 50 meters or less, the panorama returned will be the nearest panorama to the given location.
	           			var radius = 50; //meters


	           			//Find closed point that has street view

                        new google.maps.StreetViewService().getPanoramaByLocation(pos, radius, function (data1, status1) {

                            if (status1 == google.maps.StreetViewStatus.OK)
                            {
                                //return data.location.latLng;

                                MA.Map.InfoBubble.hide();
	           					MA.map.getStreetView().setOptions({ position: data1.location.latLng, visible: true });
                            }
                            else
                            {
                                //Try again with a larger radius
                                radius = radius * 2;

                                new google.maps.StreetViewService().getPanoramaByLocation(pos, radius, function (data2, status2) {

                                    if (status2 == google.maps.StreetViewStatus.OK)
                                    {
                                        MA.Map.InfoBubble.hide();
	           					        MA.map.getStreetView().setOptions({ position: data2.location.latLng, visible: true });
                                    }
                                    else
                                    {
                                        //Try again with a larger radius
                                        radius = radius * 2;

                                        new google.maps.StreetViewService().getPanoramaByLocation(pos, radius, function (data3, status3) {

                                            if (status3 == google.maps.StreetViewStatus.OK)
                                            {
                                                MA.Map.InfoBubble.hide();
        	           					        MA.map.getStreetView().setOptions({ position: data3.location.latLng, visible: true });
                                            }
                                            else
                                            {
                                                options.button.text('Not Available');
                                            }


                                        });
                                    }


                                });

                            }

                        });
	           		}
	           	}
	        },

	        //placeholder for custom actions that will be injected into the framework
	        customActions: {},

	        //settings for marker layouts
	        markerLayouts: {
				tooltip         : { fieldName: 'TooltipLayout__c', selector: '.layout-tooltip', defaultHTML: '<div class="section-dropzone ui-droppable"></div>\
																												<div class="buttonset-section">\
																														<div class="buttonset-section-header ui-draggable">\
																															<div class="buttonset-section-name editable">Actions</div>\
																														</div>\
																														<div class="buttonset-section-columns">\
																														<div class="buttoncolumn">\
																															<div class="button-dropzone">\
																																<div class="button-dropzone-handle ui-droppable"></div>\
																															</div>\
																															<div class="buttonset-button ui-draggable">\
																																<div class="actionbutton Tooltip Mass MyPosition POI ui-draggable" data-type="Standard Action" data-action="Add to Trip">' + MASystem.Labels.MAActionFramework_Add_to_Trip + '</div>\
																																<div class="buttonset-button ui-draggable">\
																																	<div class="actionbutton Tooltip POI ui-draggable" data-type="Standard Action" data-action="Take Me There">Take Me There</div>\
																																	<div class="button-dropzone">\
																																		<div class="button-dropzone-handle ui-droppable"></div>\
																																	</div>\
																																</div>\
																																<div class="button-dropzone">\
																																	<div class="button-dropzone-handle ui-droppable"></div>\
																																</div>\
																															</div>\
																														</div>\
																														<div class="buttoncolumn">\
																															<div class="button-dropzone">\
																																<div class="button-dropzone-handle ui-droppable"></div>\
																															</div>\
																															<div class="buttonset-button ui-draggable">\
																																<div class="actionbutton Tooltip Mass MyPosition POI ui-draggable" data-type="Standard Action" data-action="Set Proximity Center">Set Proximity Center</div>\
																																<div class="button-dropzone">\
																																	<div class="button-dropzone-handle ui-droppable"></div>\
																																</div>\
																															</div>\
																														</div>\
																														<div class="buttoncolumn">\
																															<div class="button-dropzone">\
																																<div class="button-dropzone-handle ui-droppable"></div>\
																															</div>\
																															<div class="buttonset-button ui-draggable">\
																																<div class="actionbutton Tooltip Mass ui-draggable" data-type="Standard Action" data-action="Remove Marker">' + MASystem.Labels.MAContext_Remove_Marker + '</div>\
																																<div class="button-dropzone">\
																																	<div class="button-dropzone-handle ui-droppable"></div>\
																																</div>\
																															</div>\
																															<div class="buttonset-button ui-draggable">\
																																<div class="actionbutton Tooltip ui-draggable" data-type="Standard Action" data-action="Check In">Check In</div>\
																																	<div class="button-dropzone">\
																																		<div class="button-dropzone-handle ui-droppable"></div>\
																																	</div>\
																																</div>\
																															</div>\
																														</div>\
																														<div class="section-dropzone ui-droppable"></div>\
																													</div>\
																													<div class="buttonset-section">\
																														<div class="buttonset-section-header ui-draggable">\
																															<div class="buttonset-section-name editable">Admin</div>\
																														</div>\
																														<div class="buttonset-section-columns">\
																															<div class="buttoncolumn">\
																																<div class="button-dropzone">\
																																	<div class="button-dropzone-handle ui-droppable"></div>\
																																</div>\
																																<div class="buttonset-button ui-draggable">\
																																	<div class="actionbutton Tooltip Mass ui-draggable" data-type="Standard Action" data-action="Set Verified Location">Set Verified Location</div>\
																																	<div class="button-dropzone">\
																																		<div class="button-dropzone-handle ui-droppable"></div>\
																																	</div>\
																																</div>\
																															</div>\
																															<div class="buttoncolumn">\
																																<div class="button-dropzone">\
																																	<div class="button-dropzone-handle ui-droppable"></div>\
																																</div>\
																																<div class="buttonset-button ui-draggable">\
																																	<div class="actionbutton Tooltip Mass ui-draggable" data-type="Standard Action" data-action="Clear Coordinates">'+ MASystem.Labels.MAActionFramework_Clear_Coordinates + '</div>\
																																	<div class="button-dropzone">\
																																		<div class="button-dropzone-handle ui-droppable"></div>\
																																	</div>\
																																</div>\
																															</div>\
																															<div class="buttoncolumn">\
																																<div class="button-dropzone">\
																																	<div class="button-dropzone-handle ui-droppable"></div>\
																																</div>\
																																<div class="buttonset-button ui-draggable">\
																																	<div class="actionbutton Tooltip Mass ui-draggable" data-type="Standard Action" data-action="Change Owner">' + MASystem.Labels.MAActionFramework_Change_Owner + '</div>\
																																	<div class="button-dropzone">\
																																		<div class="button-dropzone-handle ui-droppable"></div>\
																																	</div>\
																																</div>\
																															</div>\
																														</div>\
																														<div class="section-dropzone ui-droppable"></div>\
																													</div>\
																													<div class="buttonset-section">\
																														<div class="buttonset-section-header ui-draggable">\
																															<div class="buttonset-section-name editable">Activities</div>\
																														</div>\
																														<div class="buttonset-section-columns">\
																															<div class="buttoncolumn">\
																																<div class="button-dropzone">\
																																	<div class="button-dropzone-handle ui-droppable"></div>\
																																</div>\
																																<div class="buttonset-button ui-draggable">\
																																	<div class="actionbutton Tooltip Mass ui-draggable" data-type="Standard Action" data-action="Log a Call">' + MASystem.Labels.MAActionFramework_Log_a_Call + '</div>\
																																	<div class="button-dropzone">\
																																		<div class="button-dropzone-handle ui-droppable"></div>\
																																	</div>\
																																</div>\
																															</div>\
																															<div class="buttoncolumn">\
																																<div class="button-dropzone">\
																																	<div class="button-dropzone-handle ui-droppable"></div>\
																																</div>\
																																<div class="buttonset-button ui-draggable">\
																																	<div class="actionbutton Tooltip Mass ui-draggable" data-type="Standard Action" data-action="Send Email">' + MASystem.Labels.MAActionFramework_Send_Email + '</div>\
																																	<div class="button-dropzone">\
																																		<div class="button-dropzone-handle ui-droppable"></div>\
																																	</div>\
																																</div>\
																															</div>\
																															<div class="buttoncolumn">\
																																<div class="button-dropzone">\
																																	<div class="button-dropzone-handle ui-droppable"></div>\
																																</div>\
																																<div class="buttonset-button ui-draggable">\
																																	<div class="actionbutton Tooltip Mass ui-draggable" data-type="Standard Action" data-action="New Event">' + MASystem.Labels.MAActionFramework_New_Event + '</div>\
																																	<div class="button-dropzone">\
																																		<div class="button-dropzone-handle ui-droppable"></div>\
																																	</div>\
																																</div>\
																																<div class="buttonset-button ui-draggable">\
																																	<div class="actionbutton Tooltip Mass ui-draggable" data-type="Standard Action" data-action="Add to Campaign">'+ MASystem.Labels.MAActionFramework_Add_to_Campaign + '</div>\
																																	<div class="button-dropzone">\
																																		<div class="button-dropzone-handle ui-droppable"></div>\
																																	</div>\
																																</div>\
																															</div>\
																														</div>\
																														<div class="section-dropzone ui-droppable"></div>\
																													</div>' },
				myPosition      : { fieldName: 'MyPositionLayout__c', selector: '.layout-myposition', defaultHTML: '<div class="section-dropzone ui-droppable"></div>\
																													<div class="buttonset-section">\
																														<div class="buttonset-section-header ui-draggable">\
																															<div class="buttonset-section-name editable">Actions</div>\
																														</div>\
																														<div class="buttonset-section-columns">\
																															<div class="buttoncolumn">\
																																<div class="button-dropzone">\
																																	<div class="button-dropzone-handle ui-droppable"></div>\
																																</div>\
																																<div class="buttonset-button ui-draggable">\
																																	<div class="actionbutton Tooltip Mass MyPosition POI ui-draggable" data-type="Standard Action" data-action="Add to Trip">' + MASystem.Labels.MAActionFramework_Add_to_Trip + '</div>\
																																	<div class="button-dropzone">\
																																		<div class="button-dropzone-handle ui-droppable"></div>\
																																	</div>\
																																</div>\
																															</div>\
																															<div class="buttoncolumn">\
																																<div class="button-dropzone">\
																																	<div class="button-dropzone-handle ui-droppable"></div>\
																																</div>\
																																<div class="buttonset-button ui-draggable">\
																																	<div class="actionbutton Tooltip Mass MyPosition POI ui-draggable" data-type="Standard Action" data-action="Set Proximity Center">Set Proximity Center</div>\
																																	<div class="button-dropzone">\
																																		<div class="button-dropzone-handle ui-droppable"></div>\
																																	</div>\
																																</div>\
																															</div>\
																															<div class="buttoncolumn">\
																																<div class="button-dropzone">\
																																	<div class="button-dropzone-handle ui-droppable"></div>\
																																</div>\
																															</div>\
																														</div>\
																														<div class="section-dropzone ui-droppable"></div>\
																													</div>' },
				poi             : { fieldName: 'POILayout__c', selector: '.layout-poi', defaultHTML: '<div class="section-dropzone ui-droppable"></div>\
																									<div class="buttonset-section">\
																										<div class="buttonset-section-header ui-draggable">\
																											<div class="buttonset-section-name editable">Actions</div>\
																												</div>\
																											<div class="buttonset-section-columns">\
																												<div class="buttoncolumn">\
																													<div class="button-dropzone">\
																														<div class="button-dropzone-handle ui-droppable"></div>\
																													</div>\
																													<div class="buttonset-button ui-draggable">\
																														<div class="actionbutton Tooltip Mass MyPosition POI ui-draggable" data-type="Standard Action" data-action="Add to Trip">' + MASystem.Labels.MAActionFramework_Add_to_Trip + '</div>\
																														<div class="button-dropzone">\
																															<div class="button-dropzone-handle ui-droppable"></div>\
																														</div>\
																													</div>\
																												</div>\
																												<div class="buttoncolumn">\
																													<div class="button-dropzone">\
																														<div class="button-dropzone-handle ui-droppable"></div>\
																													</div>\
																													<div class="buttonset-button ui-draggable">\
																														<div class="actionbutton Tooltip POI ui-draggable" data-type="Standard Action" data-action="Take Me There" style="background: rgb(250, 250, 250);">Take Me There</div>\
																														<div class="button-dropzone">\
																															<div class="button-dropzone-handle ui-droppable"></div>\
																														</div>\
																													</div>\
																												</div>\
																												<div class="buttoncolumn">\
																													<div class="button-dropzone">\
																														<div class="button-dropzone-handle ui-droppable"></div>\
																													</div>\
																												</div>\
																											</div>\
																											<div class="section-dropzone ui-droppable"></div>\
																										</div>' }
	        },

			getAction: function (type, action) {
				return type == 'Custom Action'
					? MAActionFramework.customActions[action] || null
					: MAActionFramework.standardActions[action] || null;
			},

			buildMobileLayoutFromContentsListView: function (layoutContents, options) {

	        	options = jQuery.extend({
	        		queryMetadata: { options: {supportsActivities: false, supportsChatter: false }},
	        		record: { record: { Id: '' } },
	        		renderType: '',
	        	}, options || {});

				var ActionsArr = [];
				jQuery.each(layoutContents, function (sectionIndex, section) {

					//add this section
					var obj = {
						label : section.Label,
						type : null,
						action : null,
						header : true
					};
					ActionsArr.push(obj);

					//loop over each column in this section
					jQuery.each(section.Columns, function (columnIndex, column) {

						//loop over each button in this column
						jQuery.each(column, function (buttonIndex, button) {

							//find the definition of this button in the action framework
							var buttonDefinition = {};
							if (button.Type == 'Custom Action' && MAActionFramework.customActions[button.Label]) {
								jQuery.extend(buttonDefinition, MAActionFramework.customActions[button.Label]);

								//disable Iframe on nearby for now
								var ActionType = MAActionFramework.customActions[button.Label].Action;
								if(MA.isMobile && ActionType == 'Iframe') {
									return;
								}
							}
							else if (MAActionFramework.standardActions[button.Action || button.Label]) {
								if(options && options.mode == 'NearBy') {
									var modes = MAActionFramework.standardActions[button.Action || button.Label].Modes;
									if($.inArray('NearBy',modes) >= 0) {
										jQuery.extend(buttonDefinition, MAActionFramework.standardActions[button.Action || button.Label]);
									}
								}
								else {
									jQuery.extend(buttonDefinition, MAActionFramework.standardActions[button.Action || button.Label]);
								}
							}
							else {
								return;
							}
							var actButton = {
								label : buttonDefinition.Label, // this is the translated button text
								type : buttonDefinition.Type,
								action : button.Label, // this is the actual button action property in action framework => ex 'Add to Trip' is the action, 'Add to Route' is the label
								header : false,
								icon : button.icon || buttonDefinition.defaultIcon
							}

							//validate that this button meets mode requirements.  if it doesn't then disable it
							if ((MA.isMobile && jQuery.inArray('Mobile', buttonDefinition.Modes) == -1) || (!MA.isMobile && jQuery.inArray('Desktop', buttonDefinition.Modes) == -1)) {
								actButton['disabled'] = true;
								//ActionsArr.push(actButton);
								return;
							}

							//validate that this button meets visibility requirements.  if it doesn't then disable it
							jQuery.each(buttonDefinition.Requirements, function (index, requirement) {
								var supportsActivities = false;
								if (options.queryMetadata.options.supportsActivities !== undefined) {
									supportsActivities = options.queryMetadata.options.supportsActivities;
								} else if (options.record.supportsActivities !== undefined) {
									supportsActivities = options.record.supportsActivities;
								}

								if (requirement == 'Activity Support' && !supportsActivities) {
									actButton['disabled'] = true;
									//ActionsArr.push(actButton);
									return false;
								}
								else if (requirement == 'Verified Location Support' && options.queryMetadata.addressFields && !(options.queryMetadata.addressFields.verifiedLatitude && options.queryMetadata.addressFields.verifiedLongitude)) {
									actButton['disabled'] = true;
									//ActionsArr.push(actButton);
									return false;
								}
								else if (requirement == 'Contact Or Lead' && jQuery.inArray(options.record.record.Id.substring(0, 3), ['003', '00Q']) == -1) {
									actButton['disabled'] = true;
									//ActionsArr.push(actButton);
									return false;
								}
								else if (requirement == 'Chatter Support' && !options.queryMetadata.options.supportsChatter) {
									actButton['disabled'] = true;
									//ActionsArr.push(actButton);
									return false;
								}
							});
							//validate that this button meets render type requirements
		                    if (buttonDefinition.RenderModes && jQuery.inArray(options.markerType, buttonDefinition.RenderModes) == -1 && buttonDefinition.Label != MASystem.Labels.MAActionFramework_Set_Verified_Location) {
		                    	actButton['disabled'] = true;
		                    	//return false;
			                }

			                if(!actButton.disabled) {
			                	ActionsArr.push(actButton);
			                }
						});

					});
				});
				return ActionsArr;
	        },


			buildLayoutFromContentsListView: function (layoutContents, options) {

	        	jQuery.extend({
	        		queryMetadata: { supportsActivities: false, supportsChatter: false },
	        		record: { record: { Id: '' } },
	        		renderType: '',
	        	}, options || {});

	        	var ActionsArr = [];
				jQuery.each(layoutContents, function (sectionIndex, section) {

					//add this section
					var obj = {
						label : section.Label,
						type : null,
						action : null,
						header : true
					};
					ActionsArr.push(obj);

					//loop over each column in this section
					jQuery.each(section.Columns, function (columnIndex, column) {

						//loop over each button in this column
						jQuery.each(column, function (buttonIndex, button) {

							//find the definition of this button in the action framework
							var buttonDefinition = {};
							if (button.Type == 'Custom Action' && MAActionFramework.customActions[button.Label]) {
								jQuery.extend(buttonDefinition, MAActionFramework.customActions[button.Label]);

								//disable Iframe on nearby for now
								var ActionType = MAActionFramework.customActions[button.Label].Action;
								if(MA.IsMobile && ActionType == 'Iframe') {
									return;
								}
							}
							else if (MAActionFramework.standardActions[button.Action || button.Label]) {
								if(options && options.mode == 'NearBy') {
									var modes = MAActionFramework.standardActions[button.Action || button.Label].Modes;
									if($.inArray('NearBy',modes) >= 0) {
										jQuery.extend(buttonDefinition, MAActionFramework.standardActions[button.Action || button.Label]);
									}
								}
								else {
									jQuery.extend(buttonDefinition, MAActionFramework.standardActions[button.Action || button.Label]);
								}
							}
							else {
								return;
							}

							var actButton = {
								label : buttonDefinition.Label,
								type : buttonDefinition.Type,
								action : button.Label,
								header : false
							}

							//validate that this button meets mode requirements.  if it doesn't then disable it
							if ((MA.IsMobile && jQuery.inArray('Mobile', buttonDefinition.Modes) == -1) || (!MA.IsMobile && jQuery.inArray('Desktop', buttonDefinition.Modes) == -1)) {
								actButton['disabled'] = true;
								//ActionsArr.push(actButton);
								return;
							}

							//validate that this button meets visibility requirements.  if it doesn't then disable it
							jQuery.each(buttonDefinition.Requirements, function (index, requirement) {
								if (requirement == 'Activity Support' && !options.queryMetadata.supportsActivities) {
									actButton['disabled'] = true;
									//ActionsArr.push(actButton);
									return false;
								}
								else if (requirement == 'Verified Location Support' && options.queryMetadata.coordinateFields && !(options.queryMetadata.coordinateFields.VerifiedLatitude && options.queryMetadata.coordinateFields.VerifiedLongitude)) {
									actButton['disabled'] = true;
									//ActionsArr.push(actButton);
									return false;
								}
								else if (requirement == 'Contact Or Lead' && jQuery.inArray(options.record.record.Id.substring(0, 3), ['003', '00Q']) == -1) {
									actButton['disabled'] = true;
									//ActionsArr.push(actButton);
									return false;
								}
								else if (requirement == 'Chatter Support' && !options.queryMetadata.supportsChatter) {
									actButton['disabled'] = true;
									//ActionsArr.push(actButton);
									return false;
								}
							});
							//validate that this button meets render type requirements
		                    if (buttonDefinition.RenderModes && jQuery.inArray(options.markerType, buttonDefinition.RenderModes) == -1) {
		                    	actButton['disabled'] = true;
		                    	//return false;
			                }

			                //check if this is a duplicate
			                if(actButton.label == "Add to Trip" || actButton.label == MASystem.Labels.MAActionFramework_Add_to_Trip || actButton.label == MASystem.Labels.MAActionFramework_Check_In || actButton.label == MASystem.Labels.MAActionFramework_Check_Out || actButton.label == MASystem.Labels.MAActionFramework_Take_Me_There) {
			                	actButton['disabled'] = true;
			                	//return false;
			                }
			                if(!actButton.disabled) {
			                	ActionsArr.push(actButton);
			                }
						});

					});
				});

				return ActionsArr;
	        },

	        buildLayoutFromContents: function (layoutContents, options) {
	        	options = jQuery.extend({
	        		queryMetadata: { supportsActivities: false, supportsChatter: false },
	        		record: { record: { Id: '' } },
	        		renderType: ''
	        	}, options);

				var $layout = jQuery('<div/>');
				jQuery.each(layoutContents, function (sectionIndex, section) {

					//add this section
					var $section = jQuery('#templates .buttonset-section').clone().appendTo($layout);

					$section.find('.buttonset-section-header').text(section.Label);

					//loop over each column in this section
					jQuery.each(section.Columns, function (columnIndex, column) {

						//loop over each button in this column
						var $column = $section.find('.buttoncolumn').eq(columnIndex);
						jQuery.each(column, function (buttonIndex, button) {

							//find the definition of this button in the action framework
							var buttonDefinition = {};
							if (button.Type == 'Custom Action' && MAActionFramework.customActions[button.Label]) {
								jQuery.extend(buttonDefinition, MAActionFramework.customActions[button.Label]);
							}
							else if (MAActionFramework.standardActions[button.Action || button.Label]) {
								jQuery.extend(buttonDefinition, MAActionFramework.standardActions[button.Action || button.Label]);
							}
							else {
								return;
							}

							//add this button
							var $button = jQuery('<div class="actionbutton" />').attr({'data-type': buttonDefinition.Type, 'data-action': button.Action || button.Label}).html(htmlEncode(buttonDefinition.Label)).appendTo($column);

							//validate that this button meets mode requirements.  if it doesn't then disable it
							if ((MA.IsMobile && jQuery.inArray('Mobile', buttonDefinition.Modes) == -1) || (!MA.IsMobile && jQuery.inArray('Desktop', buttonDefinition.Modes) == -1)) {
								$button.addClass('disabled'); return;
							}

							//validate that this button meets visibility requirements.  if it doesn't then disable it
							jQuery.each(buttonDefinition.Requirements, function (index, requirement) {
								if (requirement == 'Activity Support' && !options.queryMetadata.supportsActivities) {
									$button.addClass('disabled'); return false;
								}
								else if (requirement == 'Verified Location Support' && options.queryMetadata.coordinateFields && !(options.queryMetadata.coordinateFields.VerifiedLatitude && options.queryMetadata.coordinateFields.VerifiedLongitude)) {
									$button.addClass('disabled'); return false;
								}
								else if (requirement == 'Contact Or Lead' && jQuery.inArray(options.record.record.Id.substring(0, 3), ['003', '00Q']) == -1) {
									$button.addClass('disabled'); return false;
								}
								else if (requirement == 'Chatter Support' && !options.queryMetadata.supportsChatter) {
									$button.addClass('disabled'); return false;
								}
							});

							//validate that this button meets render type requirements
		                    if (buttonDefinition.RenderModes && jQuery.inArray(options.markerType, buttonDefinition.RenderModes) == -1) {
		                    	$button.addClass('disabled');
			                }

						});

					});
				});

				return $layout;
	        },

	        buildLayoutFromContentsV2: function (layoutContents, options) {

	        	options = jQuery.extend({
	        		queryMetadata: {
	        		    options : {
	        		        supportsActivities: false,
	        		        supportsChatter: false
	        		     }
	        		},
	        		record: { record: { Id: '' } },
	        		renderType: ''
	        	}, options);

				var $layout = jQuery('<div/>');
				jQuery.each(layoutContents, function (sectionIndex, section) {

					//add this section
					var $section = jQuery('#templates .buttonset-section').clone().appendTo($layout);

					$section.find('.buttonset-section-header').text(section.Label);

					//loop over each column in this section
					jQuery.each(section.Columns, function (columnIndex, column) {

						//loop over each button in this column
						var $column = $section.find('.buttoncolumn').eq(columnIndex);
						jQuery.each(column, function (buttonIndex, button) {

							//find the definition of this button in the action framework
							var buttonDefinition = {};
							if (button.Type == 'Custom Action' && MAActionFramework.customActions[button.Label]) {
								jQuery.extend(buttonDefinition, MAActionFramework.customActions[button.Label]);
							}
							else if (MAActionFramework.standardActions[button.Action || button.Label]) {
								jQuery.extend(buttonDefinition, MAActionFramework.standardActions[button.Action || button.Label]);
							}
							else {
								return;
							}

							//add this button
							var $button = jQuery('<div class="actionbutton" onclick="MAPlotting.tooltipActionClick(this)" />')
                                .attr({
                                    'data-type': buttonDefinition.Type,
                                    'data-action': button.Action || button.Label
                                })
                                .html(htmlEncode(buttonDefinition.Label))
                                .appendTo($column);

							//validate that this button meets mode requirements.  if it doesn't then disable it
							if ((MA.IsMobile && jQuery.inArray('Mobile', buttonDefinition.Modes) == -1) || (!MA.IsMobile && jQuery.inArray('Desktop', buttonDefinition.Modes) == -1)) {
								$button.addClass('disabled'); return;
							}

							//validate that this button meets visibility requirements.  if it doesn't then disable it
							jQuery.each(buttonDefinition.Requirements, function (index, requirement) {
								if (requirement == 'Activity Support' && !options.queryMetadata.options.supportsActivities) {
									$button.addClass('disabled'); return false;
								}
								else if (requirement == 'Verified Location Support' && options.queryMetadata.addressFields && !(options.queryMetadata.addressFields.verifiedLatitude && options.queryMetadata.addressFields.verifiedLongitude)) {
									$button.addClass('disabled'); return false;
								}
								else if (requirement == 'Contact Or Lead' && jQuery.inArray(options.record.Id.substring(0, 3), ['003', '00Q']) == -1) {
									$button.addClass('disabled'); return false;
								}
								else if (requirement == 'Chatter Support' && !options.queryMetadata.options.supportsChatter) {
									$button.addClass('disabled'); return false;
								}
							});

							//validate that this button meets render type requirements
		                    if (buttonDefinition.RenderModes && jQuery.inArray(options.markerType, buttonDefinition.RenderModes) == -1) {
		                    	$button.addClass('disabled');
			                }

						});

					});
				});

				return $layout;
	        },

	        //events that will be fired by this framework.  developers can hook onto these events using the on method
	        events: {
	        	'ready': []
	        },

	        //used to attach handlers to action framework events
	        on: function (event, method) {
	        	try {
	        		this.events[event].push(method);
	        	}
	        	catch (err) {
	        		MALog('Invalid Event: ' + event);
	        	}
	        },

	        //used to refresh the custom actions and
	        refresh: function () {
				var dfd = $.Deferred();
	        	var me = this;

	        	//remove existing custom actions from the framework
	        	me.customActions = {};

	        	//look for custom actions that need to be injected into the framework
				var processData = {
	                action : 'get_customactions'
	            };

	            Visualforce.remoting.Manager.invokeAction(MARemoting.AdminStartUpAction,
	                processData,
	                function(response, event){
			        	//add each custom action to the available buttons
			        	jQuery.each(response.results, function (index, action) {
							removeNamespace(MASystem.MergeFields.NameSpace, action);
							var modes = action.Modes__c || 'Desktop';
							modes = modes.split(';');
							if(typeof MA !== 'undefined') {
								if((!MA.isMobile && modes.indexOf('Desktop') != -1)  || (MA.isMobile && modes.indexOf('Mobile') != -1)) {
									me.customActions[action.Name] = {
										Id				: action.Id,
										Label			: action.Name,
										Type			: 'Custom Action',
										Modes			: action.Modes__c ? action.Modes__c.split(';') : [],
										Layouts			: ['Tooltip','MyPosition','POI','Mass'],
										Requirements	: action.Requirements__c ? action.Requirements__c.split(';') : [],
										Action			: action.Action__c,
										ActionValue		: action.ActionValue__c,
										Options			: action.Options__c ? JSON.parse(action.Options__c) : {method:'GET',addRecords:false}
									};
								}
							} else {
								me.customActions[action.Name] = {
									Id				: action.Id,
									Label			: action.Name,
									Type			: 'Custom Action',
									Modes			: action.Modes__c ? action.Modes__c.split(';') : [],
									Layouts			: ['Tooltip','MyPosition','POI','Mass'],
									Requirements	: action.Requirements__c ? action.Requirements__c.split(';') : [],
									Action			: action.Action__c,
									ActionValue		: action.ActionValue__c,
									Options			: action.Options__c ? JSON.parse(action.Options__c) : {method:'GET',addRecords:false}
								};
							}		        		
			        	});

			        	//fire ready events
			        	jQuery.each(me.events['ready'], function (index, method) {
			        		method();
						});
						dfd.resolve();
			        },{buffer:false,escape:false}
			    );
				return dfd.promise();
	        },

	        //an index to be used and incremented by anything interacting with the framework to ensure uniqueness
	        componentIndex: 1

		};

		//refresh the framework on ready
		jQuery(function () {
			MAActionFramework.refresh();
		});
