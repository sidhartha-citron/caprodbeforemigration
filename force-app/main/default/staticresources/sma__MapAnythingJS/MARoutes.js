var MARoutes = {
    // test change
    routeCount : 0,
    mobileStateZoom : null,
    mobileStateCenter : null,
    mobilestate : function (routeId) {
        var dfd = jQuery.Deferred();

        MARoutes.displayRoute(null,routeId).then(function() {
            dfd.resolve({success:true});
        });

        return dfd.promise();
    },

    displayRoute : function (route,mobileStateRouteId) {

        ClearDirections({ loadDefaultLocations: false });

        // promise
        var dfd = jQuery.Deferred();
        var isMultiDayRoute = false;
        var $routingTable;
        if(MA.isMobile) {
            $routingTable = $('#routeSingleListView');
        } else {
            $routingTable = notPrintEmailPage ? $('#Routing-Table') : $(window.opener.document.getElementById('Routing-Table'));
        }
        $routingTable.removeData();
        $routingTable.data('queriesToRequest', {});
        $routingTable.data('mapItQueries', {});
        var isMobileRecall = false;
        // show waypoints slide
        var $mobileLoading;
        if(MA.isMobile) {
            MARoutes.mobile.routeInProgress = true;
            MALayers.moveToTab('routeSingleView');
            $mobileLoading = MAToastMessages.showLoading({message:MASystem.Labels.MA_PROCESSING_ROUTE,subMessage:MASystem.Labels.MA_UPDATING_WAYPOINT_INFORMATION,timeOut:0,extendedTimeOut:0});
            $('#routeOptimizeMask').addClass('in');
            $('#routesWrap').removeClass('isVisible');
            // remove all warnings
        }
        else {
            showSingleRoute();
        }

        var routeId;
        if(route) {
            routeId = $(route).attr('id');
        }
        else {
            routeId = mobileStateRouteId;
            isMobileRecall = true;
        }


        var queryArray = [];
        var routeDefaults = getProperty(userSettings || {}, 'RouteDefaults');
        $('#routeTypeSidebarTable').attr('routeId',routeId);
        var processData = {
            ajaxResource : 'MAWaypointAJAXResources',
            action : 'getRoute',
            routeId: routeId
        };

        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
            processData,
            function(response, event){
                if(event.status) {
                    if(response && response.success) {
                        //basic info
                        MA.Util.removeNamespace(response.route,'sma__');
                        MA.Util.removeNamespace(response.route,'mamd__');
                        $('#tab-routes-route').data('route', response.route);

                        //options
                        isMultiDayRoute = response.multiday || false;
                        $routingTable.data('isMultiDayRoute',isMultiDayRoute);
                        var routeOptions = getProperty(response,'route.Options__c') || '{}';
                        var parsedOptions = {};
                        try {
                            parsedOptions = JSON.parse(routeOptions);
                        }
                        catch(e) {
                            parsedOptions = {};
                        }
                        var options = $.extend({ isMultiDay : response.multiday }, MA.defaults.routeOptions, parsedOptions);

                        // update the icon based on route type
                        var driveProfile = parsedOptions.DriveProfile || 'driving';
                        // update the route with a class to change icons
                        $routingTable.removeAttr('data-type').attr('data-type',driveProfile);
                        // set the drive select
                        MARoutes.mobile.setRouteType(driveProfile);
                        try{
                            var element = document.getElementsByClassName("guide-route-header")[0];

                            if(!isMultiDayRoute)
                            {
                                element.className = "action-bar-wrap slds-scope guide-route-header hidden";
                            }else{
                                element.className = "action-bar-wrap slds-scope guide-route-header";
                            }
                        }catch(noticeErr){}

                        var isTimeBased = getProperty(options,'TimeBasedOptions.Enabled');
                        var timeStart = '8:00 am';
                        var timeEnd = '6:00 pm';
                        var routeDate = new moment();
                        $routingTable.removeClass('js-guideRoute');
                        if(isMultiDayRoute) {
                            isTimeBased = true;
                            try {
                                $('#mobile-drive-button').hide();
                                $('#routeTypeModal .ma-route-type').val('driving');
                                MARoutes.mobile.setRouteType();
                            } catch(e) {}
                            timeStart = getProperty(options,'TimeBasedOptions.Start');
                            timeEnd = getProperty(options,'TimeBasedOptions.End');
                            routeDate = getProperty(response, 'route.Route_Date__c');
                            $routingTable.addClass('js-guideRoute');

                        }
                        else {
                            $('#mobile-drive-button').show();
                            timeStart = getProperty(options,'TimeBasedOptions.Start');
                            timeEnd = getProperty(options,'TimeBasedOptions.End');
                            routeDate = getProperty(response, 'route.Date__c')
                        }

                        routeDate = moment(routeDate,'YYYY-MM-DD').format(MASystem.User.dateFormat.toUpperCase());

                        if(options.DriveProfile != undefined)
                        {
                            $('#DriveProfile').val(options.DriveProfile);
                        } else {
                            // if not drive profile, just set to global defaul
                            var routeDefault = $('#RouteMode').val() || 'driving';
                            $('#DriveProfile').val(routeDefault);
                        }


                        if(MA.isMobile) {
                            $('#mobileDate').val(routeDate);
                            var $routeWrapper = $('#routenameWrapper');
                            $routeWrapper.html('<span data-id="'+response.route.Id+'" id="routename">' + response.route.Name + '</span><span class="ma-icon ma-icon-edit" style="font-size: 12px;margin-left: 8px;"></span>');
                            var routeSubTextHTML = '<div class="ma-top-bar-subtext"><span><span class="ma-icon ma-icon-event"></span> '+routeDate+'</span>'
                            if(isTimeBased) {
                                var timeString = timeStart + ' - ' + timeEnd;
                                routeSubTextHTML += '<span><span class="ma-icon ma-icon-clock"></span> '+ timeString +'</span>';
                            }
                            routeSubTextHTML += '</div>';
                            $routeWrapper.append(routeSubTextHTML);
                            $mobileLoading.find('.toast-message').text('Updating waypoint information');
                        }
                        else {
                            $('#routename').val(response.route.Name).change().attr('data-id', response.route.Id);
                        }

                        $('#tab-routes-route .toggle.timebased').toggleClass('active', isTimeBased);
                        $('#tab-routes-route').toggleClass('timebased', isTimeBased);
                        $('#timeoptions-routestart').val(timeStart).change();
                        $('#timeoptions-routeend').val(timeEnd).change();

                        if(!isTimeBased) {
                            $('#routesWrap').removeClass('isTimeBased');
                        }
                        else {
                            $('#routesWrap').addClass('isTimeBased');
                        }

                        // If route was saved with a custom drive profile then we need to use that record.
                        // if(options.d)

                        // waypoints
                        if(response.waypoints.length > 0) {
                            var uidDate = new Date();
                            var uid = uidDate.getTime();

                            $.each(response.waypoints, function(index, waypoint) {
                                try{
                                    MA.Util.removeNamespace(waypoint,'sma__');
                                    MA.Util.removeNamespace(waypoint,'mamd__');

                                    if( isMultiDayRoute )
                                    {
                                        $('#Routing-Table').removeClass('coreRoute');
                                        waypoint = $.extend(waypoint,{
                                            Latitude__c : waypoint.Lat_Long__c.latitude ,
                                            Longitude__c : waypoint.Lat_Long__c.longitude
                                        });

                                        waypoint.BaseObject__c = waypoint.Base_Object_Api__c;
                                        waypoint.LinkId__c = waypoint.Routed_Object_Id__c;
                                        waypoint.MASavedQry__c = waypoint.MapAnything_Saved_Query_Id__c;


                                    }
                                    else {
                                        // hiding the lock icon with css for now
                                        $('#Routing-Table').addClass('coreRoute');
                                    }



                                    var $row;
                                    var wpOptions = $.extend({}, MA.defaults.waypointOptions, JSON.parse(waypoint.Options__c || '{}'));
                                    var startTime = getProperty(wpOptions, 'TimeBasedOptions.Start') || 'Set start time...';
                                    var duration = getProperty(wpOptions, 'TimeBasedOptions.Duration') || '0 hr, 0 min';
                                    var lockType = getProperty(wpOptions || {}, 'LockType') || 'unlocked';
                                    // change duration for start and end guide routes
                                    if(isMultiDayRoute) {
                                        if(lockType == 'start' || lockType == 'end') {
                                            duration = '0 hr, 0 min';
                                        }
                                    }

                                    if(MA.isMobile)
                                    {
                                        $row = $('#templates .route-list-row').clone().appendTo('#routeListView');
                                        
                                        $row.find('.name').text(htmlDecode(waypoint.Name));
                                        $row.find('.address').text(waypoint.Address__c);

                                        var wpTime;

                                        // store notes
                                        $row.attr('Notes', waypoint.Notes__c || '');
                                        
                                        // style formatting
                                        var needsNumber = true;
                                        if(lockType === 'start') {
                                            $row.addClass('start');
                                            needsNumber = false;
                                            $row.find('.time-block-counter').html('<span class="ma-icon ma-icon-custom26"></span>');
                                            // set duration to 0, keep saved start unless set start time
                                            duration = '0 hr, 0 min';
                                            if (!isMultiDayRoute) { 
                                                // only set this, if not a guide route
                                                startTime = timeStart || routeDefaults.start || '9:00 am';
                                            }
                                        }
                                        else if(lockType === 'end') {
                                            $row.addClass('end');
                                            needsNumber = false;
                                            $row.find('.time-block-counter').html('<span class="ma-icon ma-icon-goal"></span>');
                                            // set duration to 0, keep saved start unless set start time
                                            duration = '0 hr, 0 min';
                                            if (!isMultiDayRoute) { 
                                                // only set this, if not a guide route
                                                startTime = timeEnd || routeDefaults.end || '5:00 pm';
                                            }
                                        }
                                        else if(response.waypoints.length === index+1) {
                                            // last waypoint
                                            $row.addClass('end-location');
                                            if (wpOptions.LockType != 'unlocked') {
                                                needsNumber = false;
                                                $row.find('.time-block-counter').html('<span class="ma-icon ma-icon-goal"></span>');
                                            }
                                        }
                                        else if (index === 0) {
                                            $row.addClass('start-location');
                                            if (wpOptions.LockType != 'unlocked') {
                                                needsNumber = false;
                                                $row.find('.time-block-counter').html('<span class="ma-icon ma-icon-custom26"></span>');
                                            }
                                        }
                                        if(needsNumber) {
                                            $row.find('.time-block-counter').text(waypoint.SortOrder__c);
                                        }

                                        // update time options
                                        var $wpStart = $row.find('.timeoptions-waypointstart');
                                        MARoutes.mobile.buildTimeOptions($wpStart,15);
                                        MARoutes.mobile.buildDurationOptions($row.find('.timeoptions-waypointduration'));
                                        // make sure this duration exists
                                        if($row.find('.timeoptions-waypointduration option[value="'+duration+'"]').length === 0) {
                                            $row.find('.timeoptions-waypointduration').append('<option value="'+duration+'">'+duration+'</option>');
                                        }
                                        if($row.find('.timeoptions-waypointstart option[value="'+startTime+'"]').length === 0) {
                                            $wpStart.append('<option value="'+startTime+'">'+startTime+'</option>');
                                        }
                                        
                                        $row.find('.timeoptions-waypointstart').val(startTime).change();
                                        $row.find('.timeoptions-waypointduration').val(duration).change();
                                        // timebased formatting
                                        if(startTime === 'Set start time...') {
                                            wpTime = startTime + ' - ' + duration;
                                            var noTimeHTML = '<div onclick="MARoutes.mobile.showTimeModal(this);" class="time-label-text">'+ wpTime +'</div>';
                                            $row.find('.time-label').html(noTimeHTML);
                                        }
                                        else {
                                            // calculate times
                                            var mTime = moment(startTime,'hh:mm a');
                                            var durationParts = duration.split(',');
                                            var hours = durationParts[0] || 0;
                                            var mins = durationParts[1] || 0;
                                            var totalAddition = parseInt(hours) + (parseInt(mins)/60);
                                            var formattedStartTime = moment(startTime,'hh:mm a').format(MASystem.User.timeFormat).replace(':00','');

                                            try {
                                                var maddition = mTime.add(totalAddition,'hours').format(MASystem.User.timeFormat).replace(':00','');
                                                if(formattedStartTime == maddition) {
                                                    wpTime = formattedStartTime
                                                }
                                                else {
                                                    wpTime = formattedStartTime + ' - ' + maddition;
                                                }
                                            }
                                            catch (e) {
                                                wpTime = formattedStartTime + ' - ' + duration;
                                            }
                                            var timeHTML = '<div onclick="MARoutes.mobile.showTimeModal(this);" class="time-label-text">'+ wpTime +'</div>';
                                            $row.find('.time-label').html(timeHTML);
                                        }
                                    }
                                    else
                                    {
                                        $row = $('#routing-templates .waypoint-row').clone().appendTo('#Routing-Table .waypoints');
                                        $row.find('.name').val(waypoint.Name).change();
                                        if( response.multiday )
                                        {
                                            $row.find('.name').addClass('DisabledWaypoint');
                                        }

                                        $row.find('.index').append($('#templates .svg-marker-waypoint').clone().wrap('<div/>').parent().html().replace(/__INDEX__/g, waypoint.Id + '_table').replace(/__TEXT__/g, waypoint.SortOrder__c));
                                        $row.find('.notes').val(waypoint.Notes__c).change();
                                        $row.find('.address').val(waypoint.Address__c).change();

                                        // if( response.multiday )
                                        //    $row.find('.address').addClass('DisabledWaypoint');

                                        $row.find('.timeoptions-waypointstart').html($('.timedefaults-routestart').html()).prepend(
                                            $('<option/>').attr('value', 'Set start time...').text('Set start time...')
                                        );

                                        $row.find('.timeoptions-waypointduration').html($('.timedefaults-appointmentduration').html()).val($('.timedefaults-appointmentduration').val());

                                        if($row.find('.timeoptions-waypointduration option[value="'+duration+'"]').length === 0) {
                                            $row.find('.timeoptions-waypointduration').append('<option value="'+duration+'">'+duration+'</option>');
                                        }
                                        if($row.find('.timeoptions-waypointstart option[value="'+startTime+'"]').length === 0) {
                                            $wpStart.append('<option value="'+startTime+'">'+startTime+'</option>');
                                        }

                                        $row.find('.timeoptions-waypointstart').val(startTime).change();
                                        $row.find('.timeoptions-waypointduration').val(duration).change();
                                    }

                                    // LOCKING ICON
                                    if( isMultiDayRoute )
                                    {

                                        if(waypoint.isLocked__c)
                                        {
                                            $row.find('.js-toggle-guide-waypoint-lock').addClass('is-locked');
                                        }
                                    }

                                    $row.attr('index',index);
                                    $row.attr('uid',uid+index);
                                    // options
                                    if (wpOptions.LockType != 'unlocked') {
                                        $row.addClass(wpOptions.LockType);
                                    }

                                    if (waypoint.Latitude__c && waypoint.Longitude__c) {
                                        $row.attr({ Lat: waypoint.Latitude__c, Long: waypoint.Longitude__c });
                                        $row.find('.address').attr('markerposition', JSON.stringify({ latitude: waypoint.Latitude__c, longitude: waypoint.Longitude__c }));
                                    }

                                    $row.attr('waypoint-id', waypoint.Id);

                                    // add saved query id if we have it
                                    if (waypoint.MASavedQry__c || response.multiday ) {
                                        var savedQueryId = waypoint.MASavedQry__c;

                                        $row.attr('data-id', waypoint.LinkId__c);
                                        $row.attr('baseObjId', waypoint.BaseObjectId__c);

                                        if(response.multiday) {
                                            savedQueryId = 'Guide--'+(waypoint.BaseObjectId__c || waypoint.Base_Object_Id__c);
                                        }

                                        if(savedQueryId != undefined && savedQueryId != 'Guide--' && savedQueryId != 'Guide--undefined') {
                                            $row.attr('savedQueryId', savedQueryId);
                                            // yes, make sure the query exists in our list
                                            if (!$routingTable.data('queriesToRequest')[savedQueryId]) {
                                                queryArray.push(savedQueryId);
                                                $routingTable.data('queriesToRequest')[savedQueryId] = {
                                                    waypoints: [],
                                                    done: false
                                                };
                                            }
    
                                            // add this waypoint to the query
                                            $routingTable.data('queriesToRequest')[savedQueryId].waypoints.push(waypoint);
                                        }
                                    }
                                    else if (waypoint.LinkId__c && waypoint.BaseObjectId__c)
                                    {
                                        // if we have a link id, treat it like a map it
                                        $row.attr('data-id', waypoint.LinkId__c);
                                        $row.attr('baseObjId', waypoint.BaseObjectId__c);

                                        savedQueryId = 'mapit--'+(waypoint.BaseObjectId__c);
                                        $row.attr('savedQueryId', savedQueryId);
                                        // yes, make sure the query exists in our list
                                        if (!$routingTable.data('queriesToRequest')[savedQueryId]) {
                                            queryArray.push(savedQueryId);
                                            $routingTable.data('queriesToRequest')[savedQueryId] = {
                                                waypoints: [],
                                                done: false
                                            };
                                        }
                                        // add this waypoint to the query
                                        $routingTable.data('queriesToRequest')[savedQueryId].waypoints.push(waypoint);
                                    }

                                    var waypointName = waypoint.Name;
                                    if(waypoint.LinkId__c != null) {
                                        var processData2 = {
                                            ajaxResource : 'MAWaypointAJAXResources',
                                            action : 'getTooltips',
                                            linkId          : waypoint.LinkId__c,
                                            baseObject      : waypoint.BaseObject__c,
                                            tooltips        : waypoint.AdditionalData__c,
                                            format          : 'html'
                                        };

                                        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                                            processData2,
                                            function(response, event){
                                                if(event.status) {
                                                    // update the name with tooltip1 info

                                                    var tooltipDecoded = htmlDecode(response.tooltips); //html was not always decoded case 00009973
                                                    // case 10061, getting the tooltip info to replace the id with the name of a lookup
                                                    // not necessary in later releases, can be removed in August
                                                    try {
                                                        var $html = $(tooltipDecoded);
                                                        var updateName = $html.find('.data').eq(0);
                                                        if(updateName.length > 0) {
                                                            $row.find('[data-for="name"]').text(updateName.text());
                                                            $row.find('.name').text(updateName.text());
                                                        }

                                                    }
                                                    catch(e) {}
                                                    $row.find('.tooltips').html(tooltipDecoded).show();
                                                    $row.find('.additionalinfo-header[data-for="tooltips"]').show();
                                                }
                                                else {
                                                    console.warn(response,event);
                                                }
                                            },{escape:true,timeout:12000}
                                        );

                                        $row.find('.name').attr('data-id', waypoint.LinkId__c).attr('baseobject', waypoint.BaseObject__c).attr('tooltips', waypoint.AdditionalData__c).prop('disabled', true).addClass('DisabledWaypoint');
                                        $row.find('[data-for="name"]').addClass('clickable').attr('onclick', "window.open('/"+waypoint.LinkId__c+"')");
                                    }


                                }catch(err){
                                    console.warn(err);
                                }

                            });

                        }

                        // get plotted query info

                        if(queryArray.length > 0) {
                            // show load image
                            if(MA.isMobile) {
                                // $mobileLoading = MAToastMessages.showLoading({message:'Processing Route',subMessage:'Grabbing waypoint information.'});
                            }
                            else {
                                showForm($('#mapdiv'), '<img style="display:block;width:120px;margin:0 auto;" src="' + MASystem.Images.MALoaddingGIFUrl + '"/>', false, null, true);
                            }
                            $routingTable.data('plottedQueries', {});
                            arrIndex = 0;
                            MARoutes.getQueryDataFromWaypoints(queryArray,$routingTable);
                        }

                        $routingTable.data('renderInterval', setInterval( function () {
                            var done = true;
                            $.each($routingTable.data('queriesToRequest'), function (index, queryObj) {
                                if (!queryObj.done) {
                                    done = false;
                                    return false;
                                }
                            });

                            if (done) {
                                clearInterval($routingTable.data('renderInterval'));
                                // lock waypoints if needed
                                $('#Routing-Table .waypoints .waypoint-row.startend').last().remove();
                                Waypoint_Lock($('#Routing-Table .waypoints .waypoint-row.startend'), 'Both');
                                Waypoint_Lock($('#Routing-Table .waypoints .waypoint-row.start'), 'Start');
                                Waypoint_Lock($('#Routing-Table .waypoints .waypoint-row.end'), 'End');
                                if(MA.isMobile) {
                                    // MAToastMessages.hideMessage($mobileLoading);
                                }
                                else {
                                    hideMessage($('#mapdiv'));
                                }

                                OrderNumbersOnWaypoints();

                                if(MA.isMobile) {
                                    $mobileLoading.find('.toast-message').text(MASystem.Labels.MA_GETTING_DIRECTIONS);
                                }

                                // MERGE ROUTING UPDATE
                                if(MA.isMobile) {
                                    MARoutes.mobile.routeInProgress = false;
                                }
                                MARoutes.getDirections({hasLoading:true, isMultiDayRoute:isMultiDayRoute}).then(function() {
                                    MAToastMessages.showSuccess({message:'Routing complete'});
                                    $('#routesWrap').addClass('isVisible');
                                    $('#r9044').prop('checked', true);
                                    // toggle the route in the list active
                                    $('.ma-route-item[id="'+routeId+'"]').find('.route-toggle input').prop('checked',true);
                                    MARoutes.mobile.activeRoute = routeId;
                                }).fail(function(err) {
                                    $('#routeIndividualTopBar').find('.ma-toggle').prop('checked',false);
                                    MAToastMessages.showError({
                                        message: MASystem.Labels.MA_ROUTING_ISSUE + '!',
                                        subMessage: err || MASystem.Labels.MA_UNKNOWN_ERROR + '...',
                                        timeOut: 0, 
                                        closeButton: true
                                    });
                                }).always(function() {
                                    MARoutes.mobile.routeInProgress = false;
                                    MAToastMessages.hideMessage($mobileLoading);
                                    $('#routeOptimizeMask').removeClass('in');
                                });

                            }
                        },500));
                    }
                    else {
                        // there was a problem so just show an error message
                        dfd.reject({success:false})
                    }
                }
                else { 
                    // there was a problem so just show an error message
                    dfd.reject({success:false})
                }
            },{escape:false}
        );

        return dfd.promise();
    },

    getQueryDataFromWaypoints : function (arr, $routingTable, queryDataCallback) {
        queryDataCallback = queryDataCallback || function(){};
        //create temp plottedQuery
        var queriesToRequest = $routingTable.data('queriesToRequest') || {};
        var savedQueryId = arr[arrIndex] || '';
        var queryObj = queriesToRequest[savedQueryId] || {};
        var $plottedQuery = $('#templates .PlottedRowUnit').clone().addClass('loading').data({ id: savedQueryId, savedQueryId: savedQueryId, rendered: true });
        $plottedQuery.hide();
        $routingTable.data('plottedQueries')[savedQueryId] = $plottedQuery;
        //get general info for query
        var requestData;
        var getTooltipInfoDone = true;
        if(savedQueryId.indexOf('Guide--') == 0 || savedQueryId.indexOf('mapit--') == 0) {
            var tempQueryName = savedQueryId.indexOf('mapit--') == 0 ? 'MapIt' : 'GENERATED BY GUIDE';
            getTooltipInfoDone = false;
            //loop over our query object to get our recordIds
            var waypoints = queryObj.waypoints || [];

            var _savedQueryId;
            if (waypoints.length) _savedQueryId = waypoints[0].MASavedQry__c;

            var recordIdArr = [];
            $.each(waypoints || [], function (i,wp) {
                if(wp.LinkId__c != undefined) {
                    recordIdArr.push(wp.LinkId__c);
                }
            });
            var baseobjectIdParts = savedQueryId.split('--');
            var baseobjectId = baseobjectIdParts[1] || '';
            //grab our tooltips for this baseobject
            Visualforce.remoting.Manager.invokeAction(MARemoting.validateMABaseObjectTooltips,
                (_savedQueryId || baseobjectId),
                function(res, event){
                    if(event.status) {
                        if(res && res.success) {
                            var tooltips = res.tooltips || [];
                            requestData = {
                                BaseObjectId        : baseobjectId,
                                recordIds           : recordIdArr.join(','),
                                markerColor         : '#000000:Marker',
                                tooltipFieldsString : tooltips.join(','),
                                name                : tempQueryName,
                                action              : 'phase_1Mapit'
                            };
                            getTooltipInfoDone = true;
                        }
                        else {
                            MAToastMessages.showWarning({
                                message:'Route Warning',
                                subMessage:res.errMsgs.join(','),
                                timeOut:15000,
                                closeButton:true
                            });

                            MA.log(event,res);
                            requestData = {
                                BaseObjectId        : baseobjectId,
                                recordIds           : [],
                                markerColor         : '#000000:Marker',
                                tooltipFieldsString : [],
                                name                : 'Map It',
                                action              : 'phase_1Mapit'
                            };
                            getTooltipInfoDone = true;
                        }
                    }
                    else {
                        requestData = {
                            BaseObjectId        : baseobjectId,
                            recordIds           : [],
                            markerColor         : '#000000:Marker',
                            tooltipFieldsString : [],
                            name                : 'Map It',
                            action              : 'phase_1Mapit'
                        };
                        getTooltipInfoDone = true;
                        MA.log(event,res);
                    }
                },{escape:false,buffer:false,timeout:120000}
            );
        }
        else {
            //get general info for query
            requestData = {
                savedQueryId : savedQueryId,
                action : 'phase_1',
                dynamicOverride : true
            };
        }

        var tooltipInt = setInterval(function() {
            if(getTooltipInfoDone) {

                clearInterval(tooltipInt);
                $.extend(requestData,{
                    ajaxResource : 'MASavedQueryAJAXResources',

                });
                var getRecords = true;
                if(requestData.action == 'phase_1Mapit') {
                    if(requestData.recordIds && requestData.recordIds.length == 0) {
                        getRecords = false;
                    }
                }

                if(getRecords) {
                    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequestReadOnly,
                        requestData,
                        function(response, event){
                            if(event.status) {
                                if(response.success) {
                                    var queryData = MA.Util.removeNamespace(response.data,'sma__');
                                    //$plottedQuery.data() = queryData;
                                    $plottedQuery.data('records',{});
                                    //update the $plottedQuery with metadata
                                    $plottedQuery.data('tooltips',queryData.tooltips || []);
                                    $plottedQuery.data('addressFields',queryData.addressFields || []);
                                    var advancedOptions = queryData.advancedOptions || {};
                                    $plottedQuery.data('advancedOptions',advancedOptions);
                                    $plottedQuery.data('proximityOptions',queryData.proximityOptions || {});
                                    $plottedQuery.data('options',queryData.options || {});
                                    $plottedQuery.data('clusterMarkers',[]);
                                    $plottedQuery.data('needsGeocoding', []);
                                    $plottedQuery.data('badAddressArray', []);
                                    $plottedQuery.data('workers',{});
                                    $plottedQuery.prependTo($('#PlottedQueriesTable'));
                                    var queryType = getProperty(queryData.savedQueryRecord, 'BaseObject__r.Type__c');
                                    var workerObject = $plottedQuery.data('workers');

                                    var latField = getProperty(queryData,'addressFields.latitude') || '';
                                    var lngField = getProperty(queryData,'addressFields.longitude') || '';

                                    if(queryData.markerAssignmentType != 'dynamicQuery') {
                                        //grab the ids from the queryObj to get more info
                                        var recordIds = [];
                                        var waypoints = queryObj.waypoints || [];
                                        var liveQuickFind = {};
                                        for(var r = 0, len = waypoints.length; r < len; r++) {
                                            var wp = waypoints[r];
                                            var rId = wp.LinkId__c || '';
                                            if(rId != '') {
                                                recordIds.push(rId);
                                                liveQuickFind[rId] = wp;
                                            }
                                        }
                                        queryData.savedQueryRecord.qid = 'routeQuery_' + arr[arrIndex] + new Date().getTime();
                                        $plottedQuery.attr({'qid':queryData.savedQueryRecord.qid});
                                        $plottedQuery.addClass('routeQuery');
                                        var queryString = queryData.queryString;
                                        var sobjects = [];
                                        var routeRecordList = [];
                                        Visualforce.remoting.Manager.invokeAction(MARemoting.phase_4,
                                            escape(queryData.queryString),
                                            recordIds,
                                            function(result, event){
                                                if (window.Worker) {
                                                    //create a new worker to process the records
                                                    workerObject['worker1'] = new Worker(MA.resources.MAWorker);
                                                    var processOptions = {
                                                        cmd:'updateRecords',
                                                        records:JSON.stringify(result.records),
                                                        queryRecord:JSON.stringify(queryData.savedQueryRecord),
                                                        addressFields:JSON.stringify(queryData.addressFields),
                                                        externalScripts: JSON.stringify(MASystem.WorkerResources),
                                                        isIE:MA.Util.isIE(),
                                                        recordList : JSON.stringify(recordIds),
                                                        tooltips : JSON.stringify(queryData.tooltips),
                                                        FiscalYearSettings: JSON.stringify( MA.getProperty(MASystem, ['Organization', 'FiscalYearSettings']))
                                                    }
                                                    workerObject['worker1'].postMessage(processOptions);
                                                    workerObject['worker1'].onmessage = function(e) {
                                                        var data = e.data;
                                                        if(data.success) {
                                                            //get the records
                                                            var processedRecords = JSON.parse(data.records);
                                                            var recLength = processedRecords.length;
                                                            for(var i = 0; i < recLength; i++){
                                                                var processRecord = processedRecords[i];
                                                                routeRecordList.push(processRecord.Id);
                                                                processRecord.isRouteMarker = true;
                                                                
                                                                try
                                                                {
                                                                    //Case Number 00025068, if no lat lng, validation fails on marker click
                                                                    var wpObj = liveQuickFind[processRecord.Id];
                                                                    //force a lat/lng for tooltips
                                                                    updateValue(processRecord, 'location.coordinates.lat', wpObj.Latitude__c);
                                                                    updateValue(processRecord, 'location.coordinates.lng', wpObj.Longitude__c);
                                                                }
                                                                catch(e)
                                                                {
                                                                    //this will appear as manual waypoint, fails on validation if no lat lng
                                                                }

                                                                //if this is a live marker, we need to update the lat lng with the waypoint info
                                                                if(queryType === 'Live') {
                                                                    try
                                                                    {
                                                                        var wapo = liveQuickFind[processRecord.Id];
                                                                        var lat = getProperty(wapo || {}, 'Latitude__c');
                                                                        var lng = getProperty(wapo || {}, 'Longitude__c');
                                                                        processRecord.location.coordinates.lat = lat;
                                                                        processRecord.location.coordinates.lng = lng;
                                                                    }
                                                                    catch(e) {
                                                                        MA.log(e);
                                                                    }
                                                                }
                                                                sobjects.push(processRecord);
                                                            }

                                                            $plottedQuery.data('recordList',routeRecordList)
                                                            MAPlotting.processWorkerRecords($plottedQuery, {forceWaypoints:true, modes:[], records : sobjects, automaticAssign : false}, function() {
                                                                queryObj.done = true;
                                                                arrIndex++;

                                                                if(arrIndex < arr.length) {
                                                                    MARoutes.getQueryDataFromWaypoints(arr,$routingTable);
                                                                }
                                                                else {
                                                                    queryDataCallback({success:true});
                                                                }
                                                            });
                                                            //callback({success:true,recTotal:recLength});
                                                        }
                                                        else {
                                                            queryObj.done = true;
                                                            arrIndex++;

                                                            if(arrIndex < arr.length) {
                                                                MARoutes.getQueryDataFromWaypoints(arr,$routingTable);
                                                            }
                                                            else {
                                                                queryDataCallback({success:true});
                                                            }
                                                        }
                                                        workerObject['worker1'].terminate();
                                                    };
                                                }
                                                else {
                                                    var processData = {
                                                        records:result.records,
                                                        queryRecord:queryData.savedQueryRecord,
                                                        addressFields:queryData.addressFields,
                                                        isIE:MA.Util.isIE(),
                                                        recordList : queryData.recordList,
                                                        tooltips : queryData.tooltips,
                                                        FiscalYearSettings: MA.getProperty(MASystem, ['Organization', 'FiscalYearSettings'])
                                                    }
                                                    processRecords(processData,function(res) {
                                                        for(var i = 0; i < res.records.length; i++){
                                                            //workerTesting.push(result.records[i]);
                                                            sobjects.push(res.records[i]);
                                                        }

                                                        MAPlotting.processWorkerRecords($plottedQuery, {forceWaypoints:true, modes:[], records : sobjects, automaticAssign : false}, function() {
                                                            queryObj.done = true;
                                                            arrIndex++;

                                                            if(arrIndex < arr.length) {
                                                                MARoutes.getQueryDataFromWaypoints(arr,$routingTable);
                                                            }
                                                            else {
                                                                queryDataCallback({success:true});
                                                            }
                                                        });
                                                    });
                                                }
                                            },
                                            {escape: true,
                                            buffer: false}
                                        );
                                    }
                                    else {
                                        //this is a dynamic query, just make it a manually added waypoint
                                        queryObj.done = true;
                                        arrIndex++;

                                        if(arrIndex < arr.length) {
                                            MARoutes.getQueryDataFromWaypoints(arr,$routingTable);
                                        }
                                        else {
                                            queryDataCallback({success:true});
                                        }
                                    }
                                }
                                else {
                                    queryObj.done = true;
                                    arrIndex++;

                                    if(arrIndex < arr.length) {
                                        MARoutes.getQueryDataFromWaypoints(arr,$routingTable);
                                    }
                                    else {
                                        queryDataCallback({success:true});
                                    }
                                }
                            }
                            else {
                                queryObj.done = true;
                                arrIndex++;

                                if(arrIndex < arr.length) {
                                    MARoutes.getQueryDataFromWaypoints(arr,$routingTable);
                                }
                                else {
                                    queryDataCallback({success:true});
                                }
                            }
                        },{buffer:false,escape:false}
                    );
                }
                else {
                    //these will just appear as manually added waypoints
                    queryObj.done = true;
                    arrIndex++;

                    if(arrIndex < arr.length) {
                        MARoutes.getQueryDataFromWaypoints(arr,$routingTable);
                    }
                    else {
                        queryDataCallback({success:true});
                    }
                }
            }
        },500);
    },
    getDirections : function (options) {

        options = $.extend({
            hasLoading : false,
            optimize : false,
            pHighlight : true,
            isMobileRecall : false,
            mobileInProgress : false,
            isMultiDayRoute : false,
            success  : function () {}
        }, options);
        var dfd = jQuery.Deferred();
        
        if($('#waypoint-loading-wrap').css('display') !== 'none') {
            dfd.reject('Route in progress.');
            return dfd.promise();
        }

        if(options.optimize) {
            trackUsage('MapAnything',{action: 'Optimize Route'});
        }
        else {
            trackUsage('MapAnything',{action: 'Routing'});
        }

        // loadmask
        $('#tab-routes').append('<div class="loadmask"></div>');

        // clear directions and reset sidebar
        ClearDirectionsFromMap();
        var $routingTable;
        var tableRows;
        if(MA.isMobile) {
            if(MARoutes.mobile.routeInProgress) {
                MAToastMessages.showWarning({
                    message: MASystem.Labels.MA_ROUTE_WARNING,
                    subMessage: MASystem.Labels.MA_PLEASE_WAIT_FOR_PREVIOUS_REQUEST_TO_FINISH + '...',
                    timeOut: 8000,
                    closeButton: true
                });
                dfd.resolve({success:true});
                return dfd.promise();
            }
            MARoutes.mobile.routeInProgress = true;
            $routingTable = $('#routeSingleListView');
            tableRows = $routingTable.find('.waypoint-row');
            $routingTable.find('.waypoint-row .text-warning').remove();
            $routingTable.find('.waypoint-row .routeInfo').remove();
        }
        else {
            $routingTable = $('#Routing-Table');
            tableRows = notPrintEmailPage ? $('#Routing-Table .waypoint-row') : $( window.opener.document.getElementById('Routing-Table') ).find('.waypoint-row');
        }

        var is_guide_class_flag = $routingTable.hasClass('js-guideRoute');
        var isMultiDayRoute = is_guide_class_flag || false;

        $routingTable.find('.waypoint-row').removeClass('invalid').removeAttr('title');
        var RequiresGeoCoding = false;
        var WayPointArray = [];
        var waypointError = false;

        if(tableRows.length > 150) {
            $('#tab-routes .loadmask').remove();
            MAToastMessages.showError({
                message: MASystem.Labels.MA_ROUTING_ERROR,
                subMessage: MASystem.Labels.MA_120_STOPS_MAY_BE_USED,
                timeOut: 10000,
                extendedTimeOut:0,
                closeButton:true
            });
            hideMessage($('#mapdiv'));
            dfd.reject(MASystem.Labels.MA_120_STOPS_MAY_BE_USED);
            return dfd.promise();
        }

        // create waypoint array
        var hasEmptyAddressRows = false;
        for(var tR = 0; tR < tableRows.length; tR++) {
            var $row = $(tableRows[tR]);
            $row.find('.address, [data-for="address"]').removeClass('BadGeocodeForWaypoint');
            var WayPoint = {};
            var wpAddress = MA.isMobile == true ? $row.find('.address').text() : $row.find('.address').val();
            //clean the address from commas and make sure not empty
            var cleanAddress = String(wpAddress).replace(/,/g,'').trim();
            if (!!$row.attr('Lat') && !!$row.attr('Long'))
            {
                //this does not need to be geocoded
                WayPoint['Done'] = true;
                WayPoint['WayPointTitle'] = MA.isMobile ? $row.find('.name').text() : $row.find('.name').val();
                WayPoint['lat'] = $row.attr('Lat');
                WayPoint['long'] = $row.attr('Long');
                WayPoint['Address'] = wpAddress;
                WayPoint['Index'] = MA.isMobile ? $row.find('.time-block-counter').text() : $row.find('.rownumber').text();
                WayPoint['Row'] = $row;
                WayPointArray.push(WayPoint);
            }
            else if (cleanAddress != '')
            {
                RequiresGeoCoding = true;

                WayPoint['Done'] = false;
                WayPoint['WayPointTitle'] = MA.isMobile ? $row.find('.name').text() : $row.find('.name').val();
                WayPoint['Address'] = wpAddress;
                WayPoint['Index'] = MA.isMobile ? $row.find('.time-block-counter').text() : $row.find('.rownumber').text();
                WayPoint['Row'] = $row;
                WayPointArray.push(WayPoint);
            }
            else
            {
                //report as bad address
                $row.find('.address, [data-for="address"]').removeClass('GoodGeocodeForWaypoint').addClass('BadGeocodeForWaypoint');
                hasEmptyAddressRows = true;
            }

        }

        if(hasEmptyAddressRows) {
            dfd.reject(MASystem.Labels.MA_SOME_OF_YOUR_ROUTE_STOPS_ARE_MISSING_ADDRESSES);
            $('#tab-routes .loadmask').remove();
            ClearDirectionsFromMap();
            return dfd.promise();
        }

        var WPIndex = WayPointArray.length;
        var doneGeocoding = true;
        if (WPIndex < 2)
        {
            dfd.reject(MASystem.Labels.MA_ATLEAST_2_POINTS_ARE_REQUIRED_FOR_DIRECTIONS );
            $('#tab-routes .loadmask').remove();
            ClearDirectionsFromMap();
            return dfd.promise();
        }
        else if (RequiresGeoCoding)
        {
            var waypointGeoIndex = WayPointArray.length || 0;
            doneGeocoding = false;
            $.each(WayPointArray, function (index, waypoint) {
                if (!waypoint.Done) {
                    geocode({
                        address: waypoint.Address,
                        complete: function(response) {
                            waypointGeoIndex--;
                            if (response.success) {
                                waypoint.Done = true;
                                waypoint.lat = response.results.Latitude;
                                waypoint.long = response.results.Longitude;
                                waypoint.Row.attr({ Lat: response.results.Latitude, Long: response.results.Longitude }).find('.address, [data-for="address"]').addClass('GoodGeocodeForWaypoint');
                                waypoint.address = response.results.FormattedAddress;
                            }
                            else {
                                waypoint.Done = true;
                                waypoint.Row.find('.address, [data-for="address"]').addClass('BadGeocodeForWaypoint');
                                waypoint.error = true;
                                waypointError = true;
                            }

                            if(waypointGeoIndex == 0) {
                                doneGeocoding = true;
                            }
                        }
                    });
                }
                else {
                    waypointGeoIndex--;
                }

                if(waypointGeoIndex == 0) {
                    doneGeocoding = true;
                }
            });
        }

        // wait until done geocoding
        var geoInt = setInterval(function() {
            if(doneGeocoding) {
                clearInterval(geoInt);
                if (waypointError) {
                    $('#tab-routes .loadmask').remove();
                }
                else {
                    MARoutes.MAIODirections.processRoute(options).then(function(res) {
                        MARoutes.mobile.routeInProgress = false;
                        dfd.resolve({success:true});
                    }).fail(function(routeErr) {
                        console.warn(routeErr);
                        var errMsg = routeErr.message || 'Unknown Error';
                        if (typeof routeErr === 'string') {
                            errMsg = routeErr;
                        }
                        dfd.reject(errMsg);
                    });
                }
            }
        },500);

        return dfd.promise();
    },

    MAIODirections: {
        buildRouteOptions: function (options) {
            options = $.extend({
                optimize: false,
                forceroute: false
            }, options || {});
            var routeDefaults = getProperty(userSettings || {}, 'RouteDefaults', false) || {};
            var isTimeBased = $('#tab-routes-route').is('.timebased');
            // var drivingMode = MARoutes.getTravelMode();
            var requestData = {
                tiles: true,
                driveProfile: $('#routeTypeModal .ma-route-type').val() || 'driving',
                forceroute: true,
                directions: false,
                optimized: options.optimize,
                timebased: false,
                waypoints: [],
                timebasedlegacy: isTimeBased
            };

            if(isTimeBased) {
                var routeStart = $('#timeoptions-routestart').val() || routeDefaults.start || '9:00 am';
                var momentStart = moment(routeStart,'hh:mm a');
                var unixStart;
                if(momentStart.isValid()) {
                    unixStart = momentStart.format('X');
                    unixStart = parseFloat(unixStart);
                }
                else {

                }
                var routeEnd = $('#timeoptions-routeend').val() || routeDefaults.end ||  '5:00 pm';
                var momentEnd = moment(routeEnd,'hh:mm a');
                var unixEnd;
                if(momentStart.isValid()) {
                    unixEnd = momentEnd.format('X');
                    unixEnd = parseFloat(unixEnd);
                }
            
                requestData.routestart = unixStart;
                requestData.routeend = unixEnd;
            }

            return requestData;
        },
        buildFirstStop: function () {
            var $row = $('#routesIndividualWrap .waypoint-row.start');
            var routeData = $row.data('waypoint') || {};
            // var isTimeBased = $('#updateRouteTimeBased').prop('checked');
            var isTimeBased = $('#tab-routes-route').is('.timebased');
            var routeDefaults = getProperty(userSettings || {}, 'RouteDefaults', false) || {};
            var start = $('#timeoptions-routestart').val() || routeDefaults.start || '9:00 am';
            var duration = 0;
            var unixStart;
            var firstWaypoint = {
                lat: parseFloat($row.attr('lat')),
                lng: parseFloat($row.attr('long')),
                id: $row.attr('uid'),
                flexible: false,
                duration: 0
            };
            if (isTimeBased) {
                var momentStart = moment(start, 'hh:mm a');
                unixStart = momentStart.format('X');
                unixStart = parseFloat(unixStart);
                firstWaypoint.start = unixStart;
            }
            return firstWaypoint;
        },
        buildLastStop: function () {
            var $row = $('#routesIndividualWrap .waypoint-row.end');
            var routeData = $row.data('waypoint') || {};
            // var isTimeBased = $('#updateRouteTimeBased').prop('checked');
            var isTimeBased = $('#tab-routes-route').is('.timebased');
            var routeDefaults = getProperty(userSettings || {}, 'RouteDefaults', false) || {};
            var end = $('#timeoptions-routeend').val() || routeDefaults.end || '5:00 pm';
            var duration = 0;
            var unixStart;
            var lastWaypoint = {
                lat: parseFloat($row.attr('lat')),
                lng: parseFloat($row.attr('long')),
                id: $row.attr('uid'),
                flexible: false,
                duration: 0
            };
            if (isTimeBased) {
                var momentEnd = moment(end, 'hh:mm a');
                unixStart = momentEnd.format('X');
                unixEnd = parseFloat(unixStart);
                lastWaypoint.start = unixStart;
            }
            return lastWaypoint;
        },
        buildWaypoints: function () {
            var $routingTable = $('#routeSingleListView');
            var tableRows = $routingTable.find('.waypoint-row').not('.start, .end');
            var waypoints = [];
            // var isTimeBased = $('#updateRouteTimeBased').prop('checked');
            var isTimeBased = $('#tab-routes-route').is('.timebased');
            for(var i = 0; i < tableRows.length; i++) {
                var $row = $(tableRows[i]);
                var wpObj = {
                    lat: parseFloat($row.attr('lat')),
                    lng: parseFloat($row.attr('long')),
                    id: String($row.attr('uid')),
                };
                if(isTimeBased) {
                    var startTime = $row.find('.timeoptions-waypointstart').val() || 'Set start time...';
                    var duration = $row.find('.timeoptions-waypointduration').val() || '0 hr, 0 min';
                    var durationParts = duration.split(',');
                    var hours = durationParts[0] || 0;
                    var mins = durationParts[1] || 0;
                    var totalMinutes = (parseInt(hours) * 60) + parseInt(mins);
                    wpObj.duration = totalMinutes;
                    if (startTime === 'Set start time...') {
                        wpObj.flexible = true;
                    }
                    else {
                        var momentStart = moment(startTime, 'hh:mm a');
                        unixStart = momentStart.format('X');
                        unixStart = parseFloat(unixStart);
                        wpObj.start = unixStart;
                    }
                }
                waypoints.push(wpObj);
            }
            return waypoints;
        },
        processRoute: function (options) {
            var dfd = $.Deferred();
            options = $.extend({
                optimize: false
            }, options || {});
            // init route
            var requestData = MARoutes.MAIODirections.buildRouteOptions(options);

            // build start and end
            if ($('#routesIndividualWrap .waypoint-row.start').length > 0) {
                requestData.first = MARoutes.MAIODirections.buildFirstStop();
            }
            if ($('#routesIndividualWrap .waypoint-row.end').length > 0) {
                requestData.last = MARoutes.MAIODirections.buildLastStop();
            }

            // build waypoints
            requestData.waypoints = MARoutes.MAIODirections.buildWaypoints()
            
            // get route
            MARoutes.MAIODirections.sendRouteRequest(requestData).then(function(routeData) {
                MARoutes.drawRoute.processResults(routeData).then(function() {
                    dfd.resolve();
                }).fail(function (err) {
                    dfd.reject(err);
                });
            }).fail(function(routeErr) {
                dfd.reject(routeErr);
            })
            
            return dfd.promise();
        },
        handleRouteError: function (errData) {
            var dfd = $.Deferred();
            var errDetails = getProperty(errData || {}, 'details', false) || [];
            var $routingTable = $('#routeSingleListView');
            if (typeof errData !== 'object') {
                // generic error
                dfd.resolve('Unable to build route.');
            }
            else if (errDetails.length === 0) {
                var errMsg = errData.message || 'Unable to build route.';
                dfd.resolve(errMsg);
            }
            else {
                // loop over details
                for (var d = 0; d < errDetails.length; d++) {
                    var error = errDetails[d];
                    var uid = error.id;
                    var $row = $routingTable.find('.waypoint-row[uid="'+uid+'"]');
                    if(!error.success) {
                        // append error to row
                        var errorSeconds = error.erroramount || 0;
                        var errTimeObj = MA.Util.secondsToTime(errorSeconds);
                        var timeString = errTimeObj.string + ' late for appoinment ';
                        $row.find('.time-block-text').append('<div class="time-block-address text-warning"><span class="ma-icon ma-icon-warning"></span> '+timeString+'</div>');
                        dfd.resolve('You may be late to 1 or more appointments.');
                        break;
                    }
                }
            }

            return dfd.promise();
        },
        sendRouteRequest: function (requestData) {
            var dfd = $.Deferred();
    
            Visualforce.remoting.Manager.invokeAction(MARemoting.getRouteV2,
                JSON.stringify(requestData),
                function(res, event){
                    if(event.status) {
                        if(res && res.success) {
                            var routeData = res.response || {};
                            dfd.resolve(routeData);
                        }
                        else {
                            var errData = getProperty(res || {}, 'response.error', false) || {};
                            MARoutes.MAIODirections.handleRouteError(errData).then(function(err) {
                                dfd.reject({success:false, message: err || 'Unable to build route.'});
                            });
                        }
                    }
                    else {
                        dfd.reject({success:false, message: event.message});
                    }
                }, {buffer:false, timeout:50000}
            );

            return dfd.promise();
        }
    }, 
    drawRoute: {
        processResults: function (routeData) {
            var dfd = $.Deferred();
            // order the waypoints
            MARoutes.drawRoute.orderWaypoints(routeData).then(function() {
                // create markers, check for errors
                MARoutes.drawRoute.createMarkers(routeData).then(function() {
                    // fit bounds
                    MARoutes.drawRoute.fitBounds(routeData);
                    // create polyline
                    MARoutes.drawRoute.drawPolyline(routeData);
                    // update dom
                    MARoutes.drawRoute.updateDomDirections(routeData);
                    dfd.resolve();
                }).fail(function(err) {
                    // remove markers
                    dfd.reject(err.message);
                }).always(function() {
                    // clean up
                    MARoutes.drawRoute.drawFinished(routeData);
                });
            });
            return dfd.promise();
        },
        orderWaypoints: function (routeData) {
            var dfd = $.Deferred();
            var waypoints = routeData.waypoints || [];
            var $routingTable = $('#routeSingleListView');
            var offset = $routingTable.find('.start').length > 0 ? 1 : 0;
            // update index
            for (var w = 0; w < waypoints.length; w++) {
                var wpInfo = waypoints[w];
                var uid = wpInfo.id;
                var $row = $routingTable.find('.waypoint-row[uid="'+uid+'"]');
                $row.attr('index', w);
                $row.insertAfter($routingTable.find('.waypoint-row').eq(w));
            }
            OrderNumbersOnWaypoints();
            dfd.resolve();
            return dfd.promise();
        },
        createMarkers: function(routeData) {
            var dfd = $.Deferred();
            var waypoints = routeData.waypoints || [];
            var $routingTable = $('#routeSingleListView');
            var MAIO_URL = getProperty(MASystem, 'Organization.MAIO_URL', false) || 'https://api.mapanything.io';
            var lockOffset = $routingTable.find('.waypoint-row.start, .waypoint-row.startend').length > 0 ? 1 : 0;
            // loop over waypoints and check for errors, create markers
            var wpErrors = false;
            var guideOverwrite = $('#routeSingleListView').hasClass('js-guideRoute');
            for (var w = 0; w < waypoints.length; w++) {
                var wpInfo = waypoints[w];
                var uid = wpInfo.id;
                var textLabel = w + 1 - lockOffset;
                var $row = $routingTable.find('.waypoint-row[uid="'+uid+'"]');

                // if error, show warning
                if (wpInfo.success === false) {
                    var $row = $routingTable.find('.waypoint-row[uid="'+uid+'"]');
                    var errorSeconds = wpInfo.erroramount || 0;
                    var errTimeObj = MA.Util.secondsToTime(errorSeconds);
                    var timeString = errTimeObj.string + ' late for appoinment ';
                    $row.find('.time-block-text').append('<div class="time-block-address text-warning"><span class="ma-icon ma-icon-warning"></span> '+timeString+'</div>');
                    // if guide, don't fail route
                    wpErrors = guideOverwrite ? false : true;
                }

                var iconOptions;
                if($row.is('.start, .end, .startend')) {
                    if($row.is('.start')) {
                        iconOptions = {
                            url: 'data:image/svg+xml;base64,' + CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse($('#templates #svgMarkerWaypointFirst').clone().wrap('<div/>').parent().html())),
                            anchor: new google.maps.Point(14, 35),
                            scaledSize : {height: 35, width : 28}
                        }
                    }
                    else if($row.is('.startend')) {
                        iconOptions = {
                            url: 'data:image/svg+xml;base64,' + CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse($('#templates #svgMarkerWaypointCombo').clone().wrap('<div/>').parent().html())),
                            anchor: new google.maps.Point(21, 35),
                            scaledSize : {height: 35, width : 42}
                        }
                    }
                    else {
                        iconOptions = {
                            url: 'data:image/svg+xml;base64,' + CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse($('#templates #svgMarkerWaypointLast').clone().wrap('<div/>').parent().html())),
                            anchor: new google.maps.Point(14, 35),
                            scaledSize : {height: 35, width : 28}
                        };
                    }
                }
                else {
                    iconOptions = {
                        url: MAIO_URL + '/services/images/marker?color=1589ee&forlegend=false&icon=markerWaypoint&text=' + textLabel,
                        anchor: new google.maps.Point(14, 35),
                        scaledSize : {height: 35, width : 28}
                    };
                }
                var waypointMarker;
                if($row.attr('savedqueryid')) {
                    // find the correct record from the plotted queries
                    var savedQueryId = $row.attr('savedqueryid') || '';
                    var routeQueriesData = $routingTable.data('plottedQueries') || {};
                    var $savedQuery = routeQueriesData[savedQueryId];
                    var savedQueryData = $savedQuery == undefined ? {} : ($savedQuery.data() || {});
                    var recData = savedQueryData.records || {};
                    // create a clickable record
                    try {
                        // combine these options with extra info
                        var waypointOptions = {
                            'markerType':'Waypoint',
                            index: textLabel,
                            uid : $row.attr('uid'),
                            type : 'waypointQuery',
                            iconOptions : iconOptions
                        };
    
                        var recordId = $row.attr('data-id');
                        var record = recData[recordId];
                        record.savedQueryId = $row.attr('savedqueryid');
                        if(record === undefined) {
                            // loop over keys and see if we are comparing 15 to 18 char id (guide intergration)
                            var keys = Object.keys(recData) || [];
    
                            for(var i = 0; i < keys.length; i++) {
                                var key = keys[i];
                                if(key.indexOf(recordId) > -1) {
                                    record = recData[key];
                                    record.savedQueryId = $row.attr('savedqueryid');
                                    break;
                                }
                            }
                        }
    
                        waypointMarker = MAPlotting.createWaypointFromRecord(record,waypointOptions);
                        waypointMarker.notes = $row.attr('Notes') || '';
                    }
                    catch (e) {
                        waypointMarker = new google.maps.Marker({
                            map: MA.map,
                            position: new google.maps.LatLng($row.attr('Lat'), $row.attr('Long')),
                            uid : $row.attr('uid'),
                            type : 'waypoint',
                            icon: iconOptions,
                            notes : $row.attr('Notes') || '',
                            optimized : MA.Util.isIE() ? false : true,
                            layerType: 'waypoint-marker',
                            dataName : $row.find('.editable[data-for="name"]').text(),
                            dataAddress : $row.find('.editable[data-for="address"]').text(),
                            zIndex:99999999
                        });
                    }
                }
                else {
                    // store a waypoint marker for this waypoint
                    waypointMarker = new google.maps.Marker({
                        map: MA.map,
                        position: new google.maps.LatLng($row.attr('Lat'), $row.attr('Long')),
                        uid : $row.attr('uid'),
                        type : 'waypoint',
                        notes : $row.attr('Notes') || '',
                        icon: iconOptions,
                        optimized : MA.Util.isIE() ? false : true,
                        layerType: 'waypoint-marker',
                        dataName : MA.isMobile ? $row.find('.name').text() : $row.find('.editable[data-for="name"]').text(),
                        dataAddress : MA.isMobile ? $row.find('.address').text() :  $row.find('.editable[data-for="address"]').text(),
                        zIndex:99999999,
                        markerLocation : {lat : $row.attr('Lat'), lng : $row.attr('Long')} // adding this since spiderfy changes the getPostion coords, use this to get actual lat lng
                    });
                }
                MARoutes.waypointMarkers.addMarker(waypointMarker);
    
                // handle events
                google.maps.event.addListener(waypointMarker, 'rightclick', marker_Context);
            }

            if (wpErrors) {
                // remove markers
                removeHighlights();
                dfd.reject({success:false, message:'You may be late to 1 or more appointments.'});
            }
            else {
                dfd.resolve();
            }

            return dfd.promise();
        },
        drawFinished: function(options) {
            options = $.extend({
                routeId: '',
                success: true
            }, options || {});

            $('#routeOptimizeMask').removeClass('in');
            MARoutes.routeInProgress = false;
            MARoutes.mobile.activeRoute = options.routeId;

            if (options.success) {
                $('#r9044').prop('checked', true);
                //toggle the route in the list active
                $('.ma-route-item[id="'+options.routeId+'"]').find('.route-toggle input').prop('checked',true);
                $('#routesWrap').addClass('isVisible');
            }
        },
        fitBounds: function(routeData) {
            if(routeData === undefined) {
                return;
            }
            var latlngbounds = new google.maps.LatLngBounds();
            var boundingBoxLeft = getProperty(routeData,'boundingbox.northeast',false) || {};
            var boundingBoxRight = getProperty(routeData,'boundingbox.southwest',false) || {};
            var topLeftLat = boundingBoxLeft.lat;
            var topLeftLng = boundingBoxLeft.lng;
            var bottomRightLat = boundingBoxRight.lat;
            var bottomRightLng = boundingBoxRight.lng;

            if(bottomRightLat != undefined && bottomRightLat != undefined) {
                latlngbounds.extend({"lat":bottomRightLat,"lng":bottomRightLng});
            }
            if(topLeftLat != undefined && topLeftLng != undefined) {
                latlngbounds.extend({"lat":topLeftLat,"lng":topLeftLng});

            }
            MA.map.fitBounds(latlngbounds);
        },
        drawPolyline: function(routeData) {
            // create a paddedbounding box
            try {
                var boundingBox = routeData.boundingbox;
                var tileBoundingBox = MARoutes.getTileBoundingBox(boundingBox);
                MA.Map.removeOverlay('RoutingTiles');
                var tileURL = routeData.url || '';
                RoutingOverlay = new google.maps.ImageMapType({
                    name: 'RoutingTiles',
                    maxZoom: 18,
                    tileSize: new google.maps.Size(256, 256),
                    opacity: 0.8,
                    getTileUrl: function(coord, zoom) {
                        if (coord.x > tileBoundingBox[zoom].ne.x || coord.x < tileBoundingBox[zoom].sw.x ||
                            coord.y < tileBoundingBox[zoom].ne.y || coord.y > tileBoundingBox[zoom].sw.y) {
                            return null;
                        }
                        var routeURL = tileURL.replace('{X}',coord.x).replace('{Y}',coord.y).replace('{Z}',zoom);
                        return [routeURL + '?strokecolor=0070d2&strokeopacity=0.9' ];
                    }
                });
                MA.map.overlayMapTypes.push(RoutingOverlay);
            }
            catch(routingErr){
                MA.Map.removeOverlay('RoutingTiles');
                console.warn(routingErr);
            }
        },
        updateDomDirections: function(routeData) {
            OrderNumbersOnWaypoints();
            var waypoints = routeData.waypoints || [];
            var $routingTable = $('#routeSingleListView');
            var unitMeasure = getProperty(userSettings || {}, 'RouteDefaults.unit') || 'mi';
            var routeIcon = MARoutes.getRouteIcon();
            for (var i = 0; i < waypoints.length; i++) {
                var wpInfo = waypoints[i];
                var uid = wpInfo.id;
                var $row = $routingTable.find('.waypoint-row[uid="'+uid+'"]');
                
                // calc distance
                var distAtStop;
                var totalNormalTime;
                var stopInMeterts = wpInfo.distance || 0;
                if(unitMeasure == 'mi') {
                    var conversionFact = unitFactors['METERS']['MILES'];
                    distAtStop = stopInMeterts * conversionFact;
                }
                else {
                    // km
                    distAtStop = stopInMeterts/1000;
                }

                // calc time
                var timeInHours = 0;
                var timeInMins = 0;
                // check if > 1 hour
                var totalTimeInSeconds = wpInfo.totaltraveltime;
                if(totalTimeInSeconds > 3600) {
                    var totalMinutes =  Math.round(totalTimeInSeconds/60);
                    timeInHours = totalMinutes/60;
                    timeInMins = totalMinutes - (timeInHours * 60);
                }
                else{
                    timeInMins =  Math.round(totalTimeInSeconds/60);
                }

                var hoursAtStop = Math.round(timeInHours);
                var minAtStop = Math.round(timeInMins);
                totalNormalTime = hoursAtStop === 0 ? minAtStop + ' min(s) ' : hoursAtStop + ' hour' + (hoursAtStop === 1 ? '' : 's') + ' ' + minAtStop + ' min(s) ';
                var distanceStr = unitMeasure === 'mi' ? (distAtStop.toFixed(1)) + ' mi' : (distAtStop.toFixed(1)) + ' km';

                var mDistanceTime = totalNormalTime+ ' • ' + distanceStr;
                var rowHTML = '<div uid="'+$row.attr("uid")+'" class="routeInfo route-drive-row in"><div class="route-drive-text"><div class="ma-icon '+routeIcon+'"></div>'+mDistanceTime+'</div></div>';
                if(i !== (waypoints.length - 1)) {
                    $row.after(rowHTML);
                }
            }
        }
    },
    getRouteIcon: function() {
        var $routingTable;
        if(MA.isMobile) {
            $routingTable = $('#routeSingleListView');
        }
        else {
            $routingTable = $('#Routing-Table');
        }
        //is this guide route?
        var isGuideRoute = $routingTable.hasClass('js-guideRoute') || false;
        // var driveType = $routingTable.attr('data-type') || 'driving';
        // set the route type from settings, dif from desktop
        var driveType = $('#routeTypeModal .ma-route-type').val() || getProperty(userSettings || {}, 'RouteDefaults.mode') || 'driving';
        if(isGuideRoute) {
            driveType = 'driving';
        }
        var routeIcon;
        
        switch(driveType) {
            case 'driving':
                routeIcon = 'ma-icon-custom31';
                break;
            case 'walking':
                routeIcon = 'ma-icon-walk';
                break;
            case 'bicycling':
                routeIcon = 'ma-icon-bicycle';
                break;
            case 'custom':
                routeIcon = ' ma-icon-new-custom98';
                break;
            default:
                // if not one of above, good chance it's custom
                routeIcon = ' ma-icon-new-custom98';
        }

        return routeIcon;
    },
    getTravelMode: function () {
        var $routingTable = $('#routeSingleListView');

        var routeType;
        var isGuideRoute = $routingTable.hasClass('js-guideRoute') || false;
        if(isGuideRoute) {
            routeType = MARoutes.mobile.getRouteType();
        }
        else {
            routeType = $('#RouteMode').val();
        }

        return routeType;
    },

    getMARoutes : function (options) {
        var today = new Date();
        options = $.extend({
            month : (today.getMonth()+1),
            year : today.getFullYear(),
            userId : MASystem.User.Id
        }, options || {});

        //create deferred callback
        var dfd = jQuery.Deferred();

        //make ajax call to get routes
        var processData = {
            ajaxResource : 'MAWaypointAJAXResources',

            action : 'getRoutes',
            month   : options.month,
            year    : options.year,
            lookupField  : 'sma__User__c',
            lookupId : MASystem.User.Id
        };

        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
            processData,
            function(response, event){

                if(event.status) {
                    dfd.resolve({success:true,data:response.routes});
                }
                else
                {
                    //there was a problem, handle error on return
                    dfd.resolve({success:false,message:response.error});
                }
            },{escape:false}
        );

        return dfd.promise();
    },

    getTileBoundingBox: function(boundingBox) {
        var maxZoomLevel = 22;
        var minZoomLevel = 0;
        var tileBoundingBox = {};
        var paddedBoundingBox = MARoutes.getPaddedBoundingBox(boundingBox);
        var northeast = paddedBoundingBox.northeast;
        var southwest = paddedBoundingBox.southwest;

        // convert lat lng to map tile
        function toxy(lat, lng, zoom) {
            var lngNumber = Number(lng);
            var xTile = Math.floor(((lngNumber + 180) / 360) * (Math.pow(2, zoom)));
            // eslint-disable-next-line
            var yTile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * (Math.pow(2, zoom)));
            return {
                x: xTile,
                y: yTile
            };
        }

        for (var i = minZoomLevel; i <= maxZoomLevel; i++) {
            var NETile = toxy(northeast.lat, northeast.lng, i);
            var SWTile = toxy(southwest.lat, southwest.lng, i);
            tileBoundingBox[i] = {
                ne: NETile,
                sw: SWTile
            };
        }

        return tileBoundingBox;
    },

    getPaddedBoundingBox: function(boundingBox) {
        // setting this aggressive to be more padding
        // negative number actually adds padding in pixels
        var npad = -50;
        var spad = -50;
        var epad = -50;
        var wpad = -50;
        var northeast = boundingBox.northeast;
        var southwest = boundingBox.southwest;
        var SW = new window.google.maps.LatLng(southwest);
        var NE = new window.google.maps.LatLng(northeast);
        var topRight = MA.map.getProjection().fromLatLngToPoint(NE);
        var bottomLeft = MA.map.getProjection().fromLatLngToPoint(SW);
        var scale = Math.pow(2, MA.map.getZoom());

        var SWtopoint = MA.map.getProjection().fromLatLngToPoint(SW);
        var SWpoint = new window.google.maps.Point(((SWtopoint.x - bottomLeft.x) * scale) + wpad, ((SWtopoint.y - topRight.y) * scale) - spad);
        // eslint-disable-next-line
        var SWworld = new window.google.maps.Point(SWpoint.x / scale + bottomLeft.x, SWpoint.y / scale + topRight.y);
        var pt1 = MA.map.getProjection().fromPointToLatLng(SWworld);

        var NEtopoint = MA.map.getProjection().fromLatLngToPoint(NE);
        var NEpoint = new window.google.maps.Point(((NEtopoint.x - bottomLeft.x) * scale) - epad, ((NEtopoint.y - topRight.y) * scale) + npad);
        // eslint-disable-next-line
        var NEworld = new window.google.maps.Point(NEpoint.x / scale + bottomLeft.x, NEpoint.y / scale + topRight.y);
        var pt2 = MA.map.getProjection().fromPointToLatLng(NEworld);

        return {
            southwest: {
                lat: pt1.lat(),
                lng: pt1.lng()
            },
            northeast: {
                lat: pt2.lat(),
                lng: pt2.lng()
            }
        };
    },

    mobile : {
        routesLoaded : false,
        routeInProgress : false,
        getRouteType: function () {
            var $modal = $('#routeTypeModal');
            var routeType = $modal.find('.ma-route-type').val() || 'driving';
            return routeType;
        },
        setRouteType: function (routeType) {
            var $modal = $('#routeTypeModal');
            routeType = routeType || $modal.find('.ma-route-type').val() || 'driving';            
            $modal.find('.ma-route-type').val(routeType);
            var routeIcon = MARoutes.getRouteIcon(routeType);
            var $icon = $('#routesIndividualWrap #routeEditBottomBar').find('.mobile-drive-button > .ma-icon').eq(0);
            $icon.removeAttr('class').addClass('ma-icon ' + routeIcon );
            MALayers.hideModal('routeTypeModal');
            // if route is plotted and new value, replot route
            // check if we have markers, then route plotted
            var routeMakrers = MARoutes.waypointMarkers.getMarkers() || [];
            if (routeMakrers.length > 0) {
                var currentRoute = MARoutes.mobile.activeRoute || $('#routename').attr('data-id');
                // not optimized
                MARoutes.getDirections().then(function(res) {
                    MARoutes.mobile.routeInProgress = false;
                    $('#routeIndividualTopBar').find('.ma-toggle').prop('checked',true);
                    $('#routesWrap').addClass('isVisible');
                    $('#routeOptimizeMask').removeClass('in');
                    if(res.success) {
                        MAToastMessages.showSuccess({message:'Success'});
                        MARoutes.mobile.activeRoute = currentRoute;
                    }
                    else {
                        $('#routeIndividualTopBar').find('.ma-toggle').prop('checked',false);
                        MAToastMessages.showError({message:'Route issue!',subMessage:res.message || 'Unable to optimize route.',timeOut:0,closeButton:true});
                    }
                });
            }
        },
        showRemoveRoutes :function (hide) {
            if(hide) {
                $('#routesBody').removeClass('removeRoutes');
            }
            else {
                $('#routesBody').addClass('removeRoutes');
            }
        },
        removeRoute : function (button) {
            MA.Map.removeOverlay('RoutingTiles');

            var $button = $(button);
            var $row = $button.closest('.ma-route-item');

            var routeId = $row.attr('id');
            var $loadingMess = MAToastMessages.showLoading({message:'Removing Route...',timeOut:0,extendedTimeOut:0});
            var processData = {
                ajaxResource : 'MAWaypointAJAXResources',

                action : 'deleteroute',
                routeId : routeId
            };

            Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                processData,
                function(response, event){
                    MAToastMessages.hideMessage($loadingMess);
                    if(event.status) {
                        MAToastMessages.showSuccess({message:'Success'});
                        $row.remove();
                    }
                    else
                    {
                        //there was a problem so just show an error message
                        MAToastMessages.showError({message:'Unabled to delete route.'});
                    }
                }
            );

        },
        showTimeModal : function (row) {
            var $row = $(row).closest('.route-list-row');

            if($row.is('.start, .end, .startend')) {
                return;
            }

            //check if a time is already set
            var startTime = $row.find('.timeoptions-waypointstart').val() || 'Set start time...';
            var duration = $row.find('.timeoptions-waypointduration').val();

            MALayers.showModal('routeTimeModal');
            var $routeTimeModal = $('#routeTimeModal');
            $routeTimeModal.removeData();
            $routeTimeModal.data('row',$row);

            //build time options
            MARoutes.mobile.buildTimeOptions($('#routeTimeModal .startTime'),15);
            MARoutes.mobile.buildDurationOptions($('#routeTimeModal .endTime'),15);

            if($routeTimeModal.find(".endTime option[value='"+duration+"']").length === 0) {
                //add it
                $routeTimeModal.find('.endTime').append('<option class="customOption" value="'+duration+'">'+duration+'</option>');
            }
            if($routeTimeModal.find('.startTime option[value="'+startTime+'"]').length === 0) {
                $routeTimeModal.find('.startTime').append('<option value="'+startTime+'">'+startTime+'</option>');
            }

            //reset the times
            // if(startTime === 'Set start time...') {
            //     //get st
            //     startTime = getProperty(userSettings || {},'RouteDefaults.start') || 'Set start time...';
            // }
            $routeTimeModal.find('.startTime').val(startTime);
            $routeTimeModal.find('.endTime').val(duration);
        },
        showAddStopPopup : function () {
            MALayers.showModal('addStopModal');
            //clear inputs
            $('#newWaypointName').val('');
            $('#newWaypointAddress').val('');
        },
        validateWaypoint : function () {
            if($('#addStopModal').hasClass('validating')) {
                return;
            }

            //do we have a name?
            var wpName = $('#newWaypointName').val();
            if(wpName.trim() === '') {
                MAToastMessages.showError({message:'Waypoint Error',subMessage:MASystem.Labels.MA_A_NAME_IS_REQUIRED_TO_CONTINUE});
                return;
            }

            var wpAddress = $('#newWaypointAddress').val();
            if(wpAddress.trim() === '') {
                MAToastMessages.showError({message:'Waypoint Error',subMessage:'An address is required to continue.'});
                return;
            }
            $('#addStopModal').addClass('validating');
            //attempt to geocode the address
            var $waypointLoading = MAToastMessages.showLoading({message:'Validating Waypoint...',timeOut:0,extendedTimeOut:0});
            MA.Geocoding.geocode({address:wpAddress},function(res){
                MAToastMessages.hideMessage($waypointLoading);
                if(res.success) {
                    var geoResult = res.result;
                    if(geoResult.IsBadAddress) {
                        MAToastMessages.showError({message:'Waypoint Error',subMessage:'Could not locate address.'});
                        $('#addStopModal').removeClass('validating');
                    }
                    else {
                        //good geo!
                        var rowOptions = {
                            name : wpName,
                            address : wpAddress,
                            latitude : geoResult.Latitude,
                            longitude : geoResult.Longitude
                        }
                        //add a waypoint row to mobile
                        MARoutes.mobile.addWaypointRow(rowOptions);
                        setTimeout(function () {
                            $('#addStopModal').removeClass('validating');
                        },1000);
                    }
                }
                else {
                    $('#addStopModal').removeClass('validating');
                    MAToastMessages.showError({message:'Waypoint Error',subMessage:'Unable to geocode address.'});
                }
            });
        },
        addWaypointRow : function (options) {
            options = $.extend({
                name : '',
                address : '',
                latitude : undefined,
                longitude : undefined
            }, options || {});
            //if no lat lng, try to geocode
            var geoDone = true;
            var geoFailed = false;
            if(options.latitude === undefined || options .longitude === undefined) {
                geoDone = false;
                var $waypointLoading = MAToastMessages.showLoading({message:'Validating Waypoint...',timeOut:0,extendedTimeOut:0});
                MA.Geocoding.geocode({address:options.address},function(res){
                    MAToastMessages.hideMessage($waypointLoading);
                    geoDone = true;
                    if(res.success) {
                        //good geo!
                        var geoResult = res.result;
                        options = $.extend({
                            latitude : geoResult.Latitude,
                            longitude : geoResult.Longitude
                        }, options);
                    }
                    else {
                        geoFailed = true;
                    }
                });
            }

            var geoInterval = setInterval(function() {
                if(geoDone) {
                    clearInterval(geoInterval);
                    if(geoFailed) {
                        MAToastMessages.showError({message:'Waypoint Error',subMessage:'Unable to geocode address.'});
                        return;
                    }
                    //grab the waypoint table
                    var $waypoints = $('#routeListView .waypoint-row');
                    var uidDate = new Date();
                    var uid = uidDate.getTime();

                    //add the row in the proper place
                    var $row = $('#templates .route-list-row').clone();
                    //fill out name and address
                    $row.find('.name').text(options.name)
                    $row.find('.address').text(options.address);
                    $row.attr({'uid':uid, 'lat':options.latitude, 'long':options.longitude});

                    $('#routeListView .waypoint-row.end, #routeListView .waypoint-row.startend').length > 0 ? $row.insertBefore($('#routeListView .waypoint-row.end, #routeListView .waypoint-row.startend').last()) : $row.appendTo('#routeListView');

                    //check if timebased
                    var isTimeBased = $('#updateRouteTimeBased').prop('checked');
                    MARoutes.mobile.buildDurationOptions($row.find('.timeoptions-waypointduration'));
                    var wpOptions = getProperty(userSettings || {}, 'RouteDefaults');
                    var startTime = getProperty(wpOptions, 'start');
                    var duration = getProperty(wpOptions, 'duration');
                    var wpTime = 'Set start time...' + ' - ' + duration;
                    var noTimeHTML = '<div onclick="MARoutes.mobile.showTimeModal(this);" class="time-label-text">'+ wpTime +'</div>';
                    $row.find('.time-label').html(noTimeHTML);
                    $row.find('.timeoptions-waypointstart').val('Set start time...');
                    $row.find('.timeoptions-waypointduration').val(duration);

                    $row.data({
                        address: options.address || 'N/A',
                        waypointId: '',
                        name: options.name || 'N/A',
                        options: {"TimeBasedOptions":{"Start":startTime,"Duration":duration},"LockType":"unlocked"},
                        order: '',
                        savedQueryId: '',
                        linkId: '',
                        latitude: options.latitude,
                        longitude: options.longitude,
                        baseObjectId: '',
                        notes: '',
                        uid: uid
                    });

                    //update numbers
                    OrderNumbersOnWaypoints();

                    ClearDirectionsFromMap();

                    MALayers.hideModal();
                }
            },500);
        },
        updateRouteInfo : function () {
            //update our route info
            var $wrap = $('#routeSingleListView');
            var isTimeBased = $('#updateRouteTimeBased').prop('checked');
            var routeName = $('#updateRouteName').val();
            var routeDate = $('#updateRouteDate').val();
            var routeStart = $('#updateRouteStartTime').val();
            var routeEnd = $('#updateRouteEndTime').val();

            //update with new values
            $('#routename').text(routeName);
            $('#mobileDate').val(routeDate);
            //handle date and time
            var routeSubTextHTML = '<div class="ma-top-bar-subtext"><span><span class="ma-icon ma-icon-event"></span> '+routeDate+'</span>'
            if(isTimeBased) {
                $('#routesWrap').addClass('isTimeBased');
                var timeString = routeStart + ' - ' + routeEnd;
                routeSubTextHTML += '<span><span class="ma-icon ma-icon-clock"></span> '+ timeString +'</span>';
                $('#tab-routes-route').addClass('timebased');
                $('#timeoptions-routestart').val(routeStart);
                $('#timeoptions-routeend').val(routeEnd);
            }
            else {
                $('#routesWrap').removeClass('isTimeBased');
                $('#tab-routes-route').removeClass('timebased');
            }
            routeSubTextHTML += '</div>';
            $('#routenameWrapper .ma-top-bar-subtext').empty().html(routeSubTextHTML);

            // if we have a start end, update times
            var $start = $wrap.find('.waypoint-row.start');
            var $end = $wrap.find('.waypoint-row.end');

            // update times
            if($start.length > 0) {
                $start.find('.timeoptions-waypointstart').val(routeStart);
                $start.find('.timeoptions-waypointduration').val('0 hr, 0 min');
                var formattedStartTime = moment(routeStart,'hh:mm a').format(MASystem.User.timeFormat).replace(':00','');
                $start.find('.time-label-text').text(formattedStartTime);
            }
            if($end.length > 0) {
                $end.find('.timeoptions-waypointstart').val(routeEnd);
                $end.find('.timeoptions-waypointduration').val('0 hr, 0 min');
                var formattedEndTime = moment(routeEnd,'hh:mm a').format(MASystem.User.timeFormat).replace(':00','');
                $end.find('.time-label-text').text(formattedEndTime);
            }

            MALayers.hideModal();
        },
        changeRouteInfo : function () {
            //set some default values
            $('#updateRouteName').val($('#routename').text());
            $('#updateRouteDate').datepicker('setDate', $('#mobileDate').val());

            //get default time settings
            var routeDefaultStart = getProperty(userSettings || {}, 'RouteDefaults.start') || '8:00 am';
            var routeDefaultEnd = getProperty(userSettings || {}, 'RouteDefaults.end') || '5:00 pm';
            //build time options
            MARoutes.mobile.buildTimeOptions($('#updateRouteStartTime'),15);
            MARoutes.mobile.buildTimeOptions($('#updateRouteEndTime'),15);
            $('#updateRouteStartTime').val(routeDefaultStart);
            $('#updateRouteEndTime').val(routeDefaultEnd);

            if($('#tab-routes-route').is('.timebased')) {
                //check time based
                $('#updateRouteTimeBased').prop('checked',true).change()
                //show options
                $('#updateRouteStartTime').val($('#timeoptions-routestart').val());
                $('#updateRouteEndTime').val($('#timeoptions-routeend').val());
            }
            else {
                $('#updateRouteTimeBased').prop('checked',false).change()
            }

            MALayers.showModal('changeRouteInfo');
        },
        updateTimeBased : function (checkbox) {
            var $checkbox = $(checkbox);
            var checked = $checkbox.prop('checked');

            //Verify if Multiday
            var multiday = JSON.stringify( $('#tab-routes-route').data() ).includes('Multiday_Route__c');
            if(multiday && !checked)
            {
                //Multiday
                MAToastMessages.showWarning({message:'Time Based Locked.',subMessage:'Time Based Settings are locked for Guide Generated Routes.'});
                $checkbox.prop('checked', true);
                return;
            }

            if(checked) {
                $('#changeRouteInfo .timeOption').show();
            }
            else {
                $('#changeRouteInfo .timeOption').hide();
            }
        },
        updateTime : function () {
            var $row = $('#routeTimeModal').data('row');
            var startTime = $('#routeTimeModal .startTime').val();
            var duration = $('#routeTimeModal .endTime').val();

            //update our hidden inputs to match desktop
            $row.find('.timeoptions-waypointstart').val(startTime);
            $row.find('.timeoptions-waypointduration').val(duration);
            var wpTime;
            if(startTime === 'Set start time...') {
                wpTime = startTime + ' - ' + duration;
            }
            else {
                var mTime = moment(startTime,'hh:mm a');
                var durationParts = duration.split(',');
                var hours = durationParts[0] || 0;
                var mins = durationParts[1] || 0;
                var totalAddition = parseInt(hours) + (parseInt(mins)/60);
                var formattedStartTime = moment(startTime,'hh:mm a').format(MASystem.User.timeFormat).replace(':00','');

                try {
                    var maddition = mTime.add(totalAddition,'hours').format(MASystem.User.timeFormat).replace(':00','');
                    if(formattedStartTime == maddition) {
                        wpTime = formattedStartTime
                    }
                    else {
                        wpTime = formattedStartTime + ' - ' + maddition;
                    }
                }
                catch (e) {
                    wpTime = formattedStartTime + ' - ' + duration;
                }
            }
            $row.find('.time-label-text').text(wpTime);
            MALayers.hideModal();
        },
        openSaveRoutePopup : function () {

            var routeData = $('#tab-routes-route').data('route') || {};
            var routeType = getProperty(routeData, 'attributes.type');
            // if( routeData != undefined && routeType == 'mamd__Multiday_Route__c' )
            // {
            //     MAToastMessages.showError({message:'Save Error',subMessage:'Modifying guide routes is not currently supported.',timeOut:5000});
            //     return;
            // }


            MALayers.showModal('saveRoutePopup');

            var oldRoute = $('#tab-routes-route').data('route');

            var routeDate = moment();
            var formattedName = 'Route ' + MARoutes.routeCount++;
            try {
                formattedName = formattedName + ' (' + routeDate.format(MASystem.User.dateFormat.toUpperCase()) + ')';
            }
            catch(e) {
                formattedName = formattedName + ' (' + routeDate.format('MM-DD-YYYY') + ')';
            }

            var routeName = oldRoute ? oldRoute.Name : formattedName;

            //grab the date
            var routeDate = $('#mobileDate').val();
            //auto populate with date and name
            $('#saveRouteName').val($('#routename').text());
            $('#saveRouteDate').val(routeDate);
        },
        saveRoute : function (perform) {
            /*************
             * perform - string (insert || update)
             *
             **************/
            perform = perform || 'insert';
            var routeName = $('#saveRouteName').val();

            if(routeName == null || routeName.trim() == '')
            {
                MAToastMessages.showError({message:'Save Error',subMessage:MASystem.Labels.MA_A_NAME_IS_REQUIRED_TO_CONTINUE,timeOut:5000});
                return;
            }

            //CHECK FOR MULTIDAY ROUTE
            var multiday = JSON.stringify( $('#tab-routes-route').data() ).includes('Multiday_Route__c');
        
            if(multiday && perform == 'insert')
            {
                var popupOptions = {
                    message : '"Save As" unavailable',
                    subMessage : 'Guide-generated routes cannot be reassigned or rescheduled.',
                    timeOut : 2000, //number of ms to show message, set to 0 to keep visible
                    extendedTimeout : 1000, //how long to show the message if the user mouses over, set to 0 to ignore
                    position : 'toast-bottom-right', //where the notification appears on the page, other options are below
                    closeButton : false //show a close button
                };
                MAToastMessages.showError(popupOptions);
                return;
            }

            //create an array of waypoint data
            waypoints = [];
            $('#routeSingleListView .waypoint-row').each(function(i, row) {
                waypoints.push({
                    name        : $(this).find('.name').text().length <= 80 ? $(this).find('.name').text() : $(this).find('.name').text().substring(0, 77) + '...',
                    address     : $(this).find('.address').text(),
                    notes       : $(this).find('.notes').val() || '',
                    sortOrder   : i + 1,
                    linkId      : $(this).find('.name').attr('data-id'),
                    baseObject  : $(this).find('.name').attr('baseObject'),
                    baseObjectId: $(this).find('.name').attr('baseObjectId'),
                    tooltips    : $(this).find('.name').attr('tooltips'),
                    latitude    : $(this).attr('lat'),
                    longitude   : $(this).attr('long'),
                    savedQueryId: ($(this).attr('savedQueryId') || '').indexOf('OptionsLayer') == 0 ? null : $(this).attr('savedQueryId'),
                    options     : JSON.stringify({
                        TimeBasedOptions    : { Start: $(this).find('.timeoptions-waypointstart').val(), Duration: $(this).find('.timeoptions-waypointduration').val() },
                        LockType            : $(this).is('.startend') ? 'startend' : $(this).is('.start') ? 'start' : $(this).is('.end') ? 'end' : 'unlocked',
                        DraggablePoint      : $(this).attr('draggablePoint') || false
                    })
                });
            });

            //stringify route options
            var options = JSON.stringify({
                TimeBasedOptions: {
                    Enabled : $('#tab-routes-route').is('.timebased'),
                    Start   : $('#timeoptions-routestart').val(),
                    End     : $('#timeoptions-routeend').val()
                }
            });

            var routeFieldVal = $('#saveactiveusers-value').val();
            var routeFieldInfo = routeFieldVal.split(':');
            var lookupId = '';
            var lookupField = '';
            if(routeFieldInfo.length === 2) {
                lookupId = routeFieldInfo[1];
                lookupField = routeFieldInfo[0];
            }
            else {
                //fallback to owner
                lookupId = MASystem.User.Id;
                lookupField = 'ownerid';
            }

            var processData = {
                ajaxResource : 'MAWaypointAJAXResources',

                action : 'saveRoute',
                perform             : perform,
                routeId             : $('#routename').attr('data-id'),
                day                 : $('#savename').closest('.full-calendar-cell').find('.calendar-date').text(),
                month               : $('#savemonth').val(),
                year                : $('#saveyear').val(),
                lookupId            : lookupId,
                lookupField         : lookupField,
                name                : $('#savename').val(),
                options             : options,
                serializedWaypoints : JSON.stringify(waypoints)
            };

            Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                processData,
                function(response, event){
                    if(event.status) {
                        /*$('#routename').val($('#savename').val()).change();
                            $('#routename').attr('data-id', response.routeId);
                            $('#routeyear').change();*/
                        MALayers.hideModal();
                    }
                    else
                    {
                        //there was a problem so just show an error message
                        var errorMsg = 'Unable to save: Unknown error.'
                        if(response.error) {
                            errorMsg = 'Unable to save route. <br></br>' + response.error;
                        }
                        if(MA.isMobile) {
                            MAToastMessages.showErrshowError({subMessage:errorMsg,timeOut:8000});
                        }
                        else {
                            showError($('#SaveRoutesPopup'),errorMsg,8000)
                        }
                    }
                },{escape:false}
            );
        },
        activeRoute : '',
        toggleRoute : function(toggle) {
            var $toggle = $(toggle);
            var isListToggle = $toggle.hasClass('listToggle');
            var removeRoute = !$toggle.prop('checked');

            if(MARoutes.mobile.routeInProgress) {
                MAToastMessages.showWarning({message:'Route Warning',subMessage:'Please wait for previous request to finish...',timeOut:8000,closeButton:true});
                $toggle.prop('checked',removeRoute);
                return;
            }

            if(removeRoute) {
                //remove directiond
                ClearDirectionsFromMap();

                //Prevent toggled route from saving in mobile state
                $('#routename').attr('data-id','');
                //hide route view
                //MALayers.moveToTab('hideSingleRoute');
            }
            else {
                if(isListToggle) {
                    var $row = $toggle.closest('.ma-route-item');
                    MARoutes.displayRoute($row.eq(0)).then(function(res){
                        //finish route
                        MARoutes.mobile.routeInProgress = false;
                    });
                }
                else {
                    var $routeLoading = MAToastMessages.showLoading({message:MASystem.Labels.MA_PROCESSING_ROUTE,subMessage:MASystem.Labels.MA_UPDATING_WAYPOINT_INFORMATION,timeOut:0,extendedTimeOut:0});
                    $('#routeOptimizeMask').addClass('in');
                    var currentRoute = MARoutes.mobile.activeRoute;

                    if(MA.isMobile) {
                        $routingTable = $('#routeSingleListView');
                        MARoutes.mobile.routeInProgress = false;
                    } else {
                        $routingTable = notPrintEmailPage ? $('#Routing-Table') : $(window.opener.document.getElementById('Routing-Table'));
                    }
                    var isMultiDayRoute = $routingTable.data('isMultiDayRoute') || false;
                    MARoutes.getDirections({isMultiDayRoute : isMultiDayRoute}).then(function(res) {
                        MAToastMessages.showSuccess({message:'Success'});
                        MARoutes.mobile.activeRoute = currentRoute;
                    }).fail(function(err) {
                        $('#routeIndividualTopBar').find('.ma-toggle').prop('checked',false);
                        MAToastMessages.showError({message:'Route issue!',subMessage:err || 'Unable to optimize route.',timeOut:0,closeButton:true});
                    }).always(function() {
                        MARoutes.mobile.routeInProgress = false;
                        $('#routeIndividualTopBar').find('.ma-toggle').prop('checked',true);
                        $('#routesWrap').addClass('isVisible');
                        $('#routeOptimizeMask').removeClass('in');
                        MAToastMessages.hideMessage($routeLoading);
                    });
                }
            }
        },
        toggleRouteList :function (row) {
            var $row = $(row).closest('.ma-route-item');
            if(MARoutes.mobile.routeInProgress) {
                var currentPlottingRouteId = $('#routename').attr('data-id');
                var clickedRowRouteId = $row.attr('id');

                if(currentPlottingRouteId == clickedRowRouteId) {
                    MALayers.moveToTab('routeSingleView');
                }
                else {
                    MAToastMessages.showWarning({message:'Route Warning',subMessage:'Please wait for previous request to finish...',timeOut:8000,closeButton:true});
                }
                return;
            }

            var $toggle = $row.find('.route-toggle input');
            var currentPos = $toggle.prop('checked');

            //if in remove route mode, hide this mode
            if ($('#routesBody').hasClass('removeRoutes')) {
                $('#routesBody').removeClass('removeRoutes');
            }

            //var newPosition = currentPos ? false : true;
            //var removeRoute = !$toggle.prop('checked');
            if(currentPos) {
                //show route
                MALayers.moveToTab('routeSingleView');
            }
            else {
                MARoutes.displayRoute($row.eq(0)).then(function(res){
                    //done with route
                    MARoutes.mobile.routeInProgress = false;
                    setMobileState();
                }).fail(function(err) {
                    console.warn(err);  
                });
            }
        },
        buildTimeOptions : function($select,minInterval) {
            $select.empty();
            minInterval = minInterval || 30;
            var currentMoment = moment().startOf('day');
            var currentDay = currentMoment.day();
            $('<option/>').attr('value', 'Set start time...').text('N/A').appendTo($select);
            while (currentMoment.day() == currentDay) {
                $('<option/>').attr('value', currentMoment.format('h:mm a')).text(currentMoment.format('h:mm a')).appendTo($select);
                currentMoment.add(minInterval,'m');
            }
        },
        buildDurationOptions : function($select) {
            $select.empty();
            var currentMinutes = 5;
            while (currentMinutes < 360) {
                var duration = Math.floor(currentMinutes / 60) + ' hr, ' + (currentMinutes % 60) + ' min';
                $('<option/>').attr('value', duration).text(duration).appendTo($select);
                currentMinutes += 5;
            }
        },
        newRoute : function (options) {
            options = $.extend({
                loadDefaultLocations: true
            }, options);

            var confirmPopup = MA.Popup.showMAConfirm({
                title: 'MapAnything&trade;',
                template: '<div style="text-align: center;line-height: 22px;">' + MASystem.Labels.MA_THIS_WILL_REMOVE_YOUR_PREVIOUS_ROUTE_QUESTION + '</div>',
                cancelText : 'No',
                cancelType : 'slds-button_neutral',
                okText : 'Yes',
                okType : 'slds-button_brand'
            });

            confirmPopup.then(function(res) {
                if(res) {
                    ClearDirections(options);

                    MALayers.moveToTab('routeSingleView');
                }
            });
        },
        resetAddressElements : function (options) {
            options = $.extend({
                loadDefaultLocations: true
            }, options);
            var routeDefaults = getProperty(userSettings || {}, 'RouteDefaults');
            routeDefaults = $.extend({type : '', start : '', end : '' },routeDefaults);

            //Reset Address Elements
            var routeDate = moment();
            var formattedName = 'Route ' + MARoutes.routeCount++;
            try {
                formattedName = formattedName + ' (' + routeDate.format(MASystem.User.dateFormat.toUpperCase()) + ')';
            }
            catch(e) {
                formattedName = formattedName + ' (' + routeDate.format('MM-DD-YYYY') + ')';
            }

            $('#routenameWrapper').html('<span id="routename">'+formattedName+'</span><span class="ma-icon ma-icon-edit" style="font-size: 12px;margin-left: 5px;color: #fff;"></span>');
            $('#tab-routes-route .toggle.timebased').toggleClass('active', routeDefaults.type == 'TimeBased');
            $('#tab-routes-route').toggleClass('timebased', routeDefaults.type == 'TimeBased');
            $('#timeoptions-routestart').val(routeDefaults.start).change();
            $('#timeoptions-routeend').val(routeDefaults.end).change();
            $('#routesIndividualWrap .ma-toggle').prop('checked',false);

            //update time options for display purposes
            var routeDate = moment(new Date()).format(MASystem.User.dateFormat.toUpperCase());
            $('#mobileDate').val(routeDate);
            var routeSubTextHTML = '<div class="ma-top-bar-subtext"><span><span class="ma-icon ma-icon-event"></span> '+routeDate+'</span>'
            if(routeDefaults.type == 'TimeBased') {
                var timeStart = $('#settings-tabs .timedefaults-routestart').val() || '9:00 am';
                var timeEnd = $('#settings-tabs .timedefaults-routeend').val() || '5:00 pm';
                var timeString = timeStart + ' - ' + timeEnd;
                routeSubTextHTML += '<span><span class="ma-icon ma-icon-clock"></span> '+ timeString +'</span>';
                $('#tab-routes-route .toggle.timebased').toggleClass('active', true);
                $('#tab-routes-route').toggleClass('timebased', true);
                $('#routesWrap').addClass('isTimeBased');
            }
            else {
                $('#tab-routes-route .toggle.timebased').toggleClass('active', false);
                $('#tab-routes-route').toggleClass('timebased', false);
                $('#routesWrap').removeClass('isTimeBased');
            }
            routeSubTextHTML += '</div>';
            $('#routenameWrapper').append(routeSubTextHTML);

            //populate default start/end locations
            if (options.loadDefaultLocations) {
                var startLocationId = $('.timedefaults-startlocation').attr('data-id');
                var endLocationId = $('.timedefaults-endlocation').attr('data-id');
                if (startLocationId) {
                    var processData = {

                        action : 'getLocationInfo',
                        ajaxResource : 'MAFavoriteLocationsAJAXResources',
                        folderId: startLocationId
                    };

                    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                        processData,
                        function(response, event){
                            if(event.status) {
                                if(response.data != undefined) {
                                    if (response.data.locations.length > 0)
                                    {
                                        AddFavoriteToTrip(removeNamespace(MASystem.MergeFields.NameSpace, response.data.locations[0]), { lockType: startLocationId == endLocationId ? 'Both' : 'Start' });
                                    }
                                }
                            }
                        },{escape:false}
                    );
                }
                if (endLocationId && endLocationId != startLocationId) {
                    var processData = {

                        action : 'getLocationInfo',
                        ajaxResource : 'MAFavoriteLocationsAJAXResources',
                        folderId: endLocationId
                    };

                    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                        processData,
                        function(response, event){
                            if(event.status) {
                                if(response.data != undefined) {
                                    if (response.data.locations.length > 0)
                                    {
                                        AddFavoriteToTrip(removeNamespace(MASystem.MergeFields.NameSpace, response.data.locations[0]), { lockType: 'End' });
                                    }
                                }
                            }
                        },{escape:false}
                    );
                }
            }

            OrderNumbersOnWaypoints();
        },
        optimizeRoute : function () {
            var $routeLoading = MAToastMessages.showLoading({message:MASystem.Labels.MA_PROCESSING_ROUTE,subMessage:MASystem.Labels.MA_UPDATING_WAYPOINT_INFORMATION,timeOut:0,extendedTimeOut:0});
            $('#routeOptimizeMask').addClass('in');
            var currentRoute = MARoutes.mobile.activeRoute || $('#routename').attr('data-id');
            if(MA.isMobile) {
                $routingTable = $('#routeSingleListView');
                MARoutes.mobile.routeInProgress = false;
            } else {
                $routingTable = notPrintEmailPage ? $('#Routing-Table') : $(window.opener.document.getElementById('Routing-Table'));
            }
            var isMultiDayRoute = $routingTable.data('isMultiDayRoute') || false;
            MARoutes.getDirections({optimize:true,isMultiDayRoute:isMultiDayRoute}).then(function(res) {
                MAToastMessages.showSuccess({message:MASystem.Labels.MA_ROUTE_OPTIMIZED});
                $('#routeIndividualTopBar').find('.ma-toggle').prop('checked',true);
                //toggle the route in the list active
                $('.ma-route-item[id="'+currentRoute+'"]').find('.route-toggle input').prop('checked',true);
            }).fail(function(err) {
                $('#routeIndividualTopBar').find('.ma-toggle').prop('checked',false);
                MAToastMessages.showError({message:'Route issue!',subMessage:err || 'Unable to optimize route.',timeOut:0,closeButton:true});
            }).always(function() {
                $('#routeOptimizeMask').removeClass('in');
                MARoutes.mobile.routeInProgress = false;
                MAToastMessages.hideMessage($routeLoading);
            });
        },
        waypointRowClick : function (row) {
            //if in edit mode just return
            if($('#routesIndividualWrap').hasClass('edit-mode')) {
                return false;
            }

            var $row = $(row).closest('.route-list-row');
            var markerId = $row.attr('uid');
            var markers = MARoutes.waypointMarkers.getMarkers();
            var mI = markers.length;
            while(mI--) {
                var marker = markers[mI];
                var markerUID = marker.uid || '';
                if(markerId === markerUID) {
                    google.maps.event.trigger(marker, 'click');
                }
            }
        }
    }
}
     
    /******************************
    *   Support Methods
    ******************************/
    function removeHighlights(dontUpdateHighlightFlag)
    {
        try {
            var markers = MARoutes.waypointMarkers.getMarkers();
            var mI = markers.length;
            while (mI--)
            {
                var marker = markers[mI];
                marker.setMap(null);
            }
            MARoutes.waypointMarkers.clearMarkers();
            if (!dontUpdateHighlightFlag) { highlightOnOff = false; }
        }
        catch(e){}
    }
    
    function highlightWaypoints(toggle)
    {
        removeHighlights(true);
        var MAIO_URL = getProperty(MASystem, 'Organization.MAIO_URL', false) || 'https://api.mapanything.io';
        var show = true;
        if(toggle) { show = !highlightOnOff; }
    
        if(!show) {
            highlightOnOff = false;
            $('.highlightwaypoints').css('opacity', 0.32);
        }
        else
        {
            highlightOnOff = true;
            $('.highlightwaypoints').css('opacity', 1);
    
            var $routingTable;
            if(MA.isMobile) {
                $routingTable = $('#routeSingleListView');
            }
            else {
                $routingTable = $routingTable = notPrintEmailPage ? $('#Routing-Table') : $(window.opener.document.getElementById('Routing-Table'));
            }
            $routingTable.data('waypointMarkers', $routingTable.data('waypointMarkers') || []);
    
            var lockOffset = $routingTable.find('.waypoint-row.start, .waypoint-row.startend').length > 0 ? 1 : 0;
            $routingTable.find('.waypoint-row').each(function(index, waypoint) {
                var textLabel = index + 1 - lockOffset;
    
                //test this waypoint to make sure it has a valid lat/lng
                if (!MA.Util.testLatLng($(this).attr('Lat'), $(this).attr('Long'))) {
                    return;
                }

                var iconOptions;
                if($(this).is('.start, .end, .startend')) {
                    if($(this).is('.start')) {
                        iconOptions = {
                            url: 'data:image/svg+xml;base64,' + CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse($('#templates #svgMarkerWaypointFirst').clone().wrap('<div/>').parent().html())),
                            anchor: new google.maps.Point(14, 35),
                            scaledSize : {height: 35, width : 28}
                        }
                    }
                    else if($(this).is('.startend')) {
                        iconOptions = {
                            url: 'data:image/svg+xml;base64,' + CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse($('#templates #svgMarkerWaypointCombo').clone().wrap('<div/>').parent().html())),
                            anchor: new google.maps.Point(21, 35),
                            scaledSize : {height: 35, width : 42}
                        }
                    }
                    else {
                        iconOptions = {
                            url: 'data:image/svg+xml;base64,' + CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse($('#templates #svgMarkerWaypointLast').clone().wrap('<div/>').parent().html())),
                            anchor: new google.maps.Point(14, 35),
                            scaledSize : {height: 35, width : 28}
                        };
                    }
                }
                else {
                    iconOptions = {
                        url: MAIO_URL + '/services/images/marker?color=1589ee&forlegend=false&icon=markerWaypoint&text=' + textLabel,
                        anchor: new google.maps.Point(14, 35),
                        scaledSize : {height: 35, width : 28}
                    };
                }
    
                var waypointMarker;
                if($(this).attr('savedqueryid')) {
                    //find the correct record from the plotted queries
                    var savedQueryId = $(this).attr('savedqueryid') || '';
                    var routeQueriesData = $routingTable.data('plottedQueries') || {};
                    var $savedQuery = routeQueriesData[savedQueryId];
                    var savedQueryData = $savedQuery == undefined ? {} : ($savedQuery.data() || {});
                    var recData = savedQueryData.records || {};
                    //create a clickable record
                    try {
                        //combine these options with extra info
                        var waypointOptions = {
                            'markerType':'Waypoint',
                            index: textLabel,
                            uid : $(this).attr('uid'),
                            type : 'waypointQuery',
                            iconOptions : iconOptions
                        };
    
                        var recordId = $(this).attr('data-id');
                        var record = recData[recordId];
                        record.savedQueryId = $(this).attr('savedqueryid');
                        /******************
                            START changes
    
                        ********************/
                        if(record == undefined) {
                            //loop over keys and see if we are comparing 15 to 18 char id (guide intergration)
                            var keys = Object.keys(recData) || [];
    
                            for(var i = 0; i < keys.length; i++) {
                                var key = keys[i];
                                if(key.indexOf(recordId) > -1) {
                                    record = recData[key];
                                    record.savedQueryId = $(this).attr('savedqueryid');
                                    break;
                                }
                            }
                        }
    
                        waypointMarker = MAPlotting.createWaypointFromRecordMobile(record,waypointOptions);
                        waypointMarker.notes = $(this).attr('Notes') || '';
    
                        /******************
                            END changes
    
                        ********************/
                    }
                    catch (e) {
                        waypointMarker = new google.maps.Marker({
                            map: MA.map,
                            position: new google.maps.LatLng($(this).attr('Lat'), $(this).attr('Long')),
                            uid : $(this).attr('uid'),
                            type : 'waypoint',
                            icon: iconOptions,
                            notes : $(this).attr('Notes') || '',
                            optimized : MA.Util.isIE() ? false : true,
                            layerType: 'waypoint-marker',
                            dataName : $(this).find('.editable[data-for="name"]').text(),
                            dataAddress : $(this).find('.editable[data-for="address"]').text(),
                            zIndex:99999999
                        });
                        //handled by spiderfy now
                        //google.maps.event.addListener(waypointMarker, 'click', function (e) { waypoint_Click.call(this); });
                    }
                }
                else {
                    //store a waypoint marker for this waypoint
                    waypointMarker = new google.maps.Marker({
                        map: MA.map,
                        position: new google.maps.LatLng($(this).attr('Lat'), $(this).attr('Long')),
                        uid : $(this).attr('uid'),
                        type : 'waypoint',
                        notes : $(this).attr('Notes') || '',
                        icon: iconOptions,
                        optimized : MA.Util.isIE() ? false : true,
                        layerType: 'waypoint-marker',
                        dataName : MA.isMobile ? $(this).find('.name').text() : $(this).find('.editable[data-for="name"]').text(),
                        dataAddress : MA.isMobile ? $(this).find('.address').text() :  $(this).find('.editable[data-for="address"]').text(),
                        zIndex:99999999,
                        markerLocation : {lat : $(this).attr('Lat'), lng : $(this).attr('Long')} //adding this since spiderfy changes the getPostion coords, use this to get actual lat lng
                    });
                }
                MARoutes.waypointMarkers.addMarker(waypointMarker);
    
                //handle events
                google.maps.event.addListener(waypointMarker, 'rightclick', marker_Context);
            });
        }
    }
    
    function ClearDirectionsFromMap()
    {
        MA.Map.removeOverlay('RoutingTiles');
    
        if (MA.Routing.mapComponents.polyline != null)
        {
            MA.Routing.mapComponents.polyline.setMap(null);
            MA.Routing.mapComponents.polyline = null;
        }
        if (MA.Routing.mapComponents.displayRoute != null)
        {
            MA.Routing.mapComponents.displayRoute.setMap(null);
            $('#Routing-Table').removeData('dragRoute');
        }
        removeHighlights();
        $('#routeListView .route-drive-row').remove();
        if (MA.isMobile)
        {
            MARoutes.mobile.activeRoute = '';
            $('#routeIndividualTopBar .ma-toggle').prop('checked', false);
            $('#routesBody .route-toggle input').prop('checked', false);
            $('#routesWrap').removeClass('isVisible');
            setTimeout(function() {
                setMobileState();
            }, 500);
        }
    }
    
    function ClearDirections(options) {
        MA.Map.removeOverlay('RoutingTiles');
    
        options = $.extend({
            loadDefaultLocations: true
        }, options);
    
        $('#tab-routes-route').removeData('route');
        if (MA.Routing.mapComponents.polyline != null) {
            MA.Routing.mapComponents.polyline.setMap(null);
            MA.Routing.mapComponents.polyline = null;
        }
        if (MA.Routing.mapComponents.displayRoute != null) {
            MA.Routing.mapComponents.displayRoute.setMap(null);
            $('#Routing-Table').removeData('dragRoute');
        }
        removeHighlights();
    
        //try to reset the drive move
        $('#DriveProfile').val($('#RouteMode').val());
    
        if (MA.isMobile) {
            $('#routeListView .route-list-row').remove();
            $('#routeListView .route-drive-row').remove();
            $('#routeSingleListView').removeData();
            $('#routeOptimizeMask').removeClass('in');
            MARoutes.mobile.activeRoute = '';
            MARoutes.mobile.resetAddressElements(options);
            $('#routesBody .route-toggle input').prop('checked', false);
            $('#routesWrap').removeClass('isVisible');
            
            //if time based, toggle on or off
            var isTimeBased = $('#Routing-Settings .timedefaults-routetype').val() === 'TimeBased' ? true : false
            $('#updateRouteTimeBased').prop('checked',isTimeBased);
            //MARoutes.mobile.updateRouteInfo();
        }
        else {
            MA.Map.InfoBubble.hide();
            $('#DirectionsOutput').empty();
            $('#DirectionControls').hide();
            $('#tab-routes-route .guide-route-header').addClass('hidden');
            //remove any route plotted queries
            $('#PlottedQueriesTable .PlottedRowUnit.routeQuery').remove();
    
            //Reset Address Elements
            resetAddressElements(options);
            var $routingTable = notPrintEmailPage ? $('#Routing-Table') : $(window.opener.document.getElementById('Routing-Table'));
            $routingTable.removeData();
        }
    
    }
    
    function ShowDirectionsTab()
    {
        if (!$('#tabs-nav-routes').parent().is('.ui-state-active'))
        {
            $('#tabs-nav-routes').click();
        }
        showSingleRoute();
    }
    
    function OrderNumbersOnWaypoints(options)
    {
        options = $.extend({
            mobile : MA.isMobile || false
        }, options || {});
    
        var $routingTable;
        if(MA.isMobile) {
            $routingTable = $('#routeSingleListView');
        }
        else {
            $routingTable = $('#Routing-Table');
        }
    
        var $tableRows = $routingTable.find('.waypoint-row');
        var $firstRow = $tableRows.first();
        var $lastRow = $tableRows.last();
        var $notFirstLast = $tableRows.not(':first').not(':last');
    
        //fix any locked waypoints that were moved
        $tableRows.not(':first').removeClass('start');
        $tableRows.not(':last').removeClass('end');
        $tableRows.not(':first').not(':last').removeClass('startend');
    
        if ($routingTable.find('.waypoint-row.startend').length === 1) {
            if($tableRows.not(':first').hasClass('startend')) {
                //this is the end update class
                $tableRows.last().removeClass('startend').addClass('end');
                //$routingTable.find('.waypoint-row.startend:not(:first-child)').removeClass('startend').addClass('end');
            }
            else {
                $tableRows.first().removeClass('startend').addClass('end');
                //$routingTable.find('.waypoint-row.startend:not(:last-child)').removeClass('startend').addClass('start');
            }
        }
    
        //relabel
        var lockOffset;
        if(MA.isMobile) {
            $('#routeListView').find('.routeInfo').remove();
            lockOffset = $firstRow.hasClass('start') || $firstRow.hasClass('startend') ? 1 : 0;
            //lockOffset = $('#routeSingleListView .waypoint-row.start, #routeSingleListView .waypoint-row.startend:not(:last-child)').length > 0 ? 1 : 0;
            //var $tableRows = $('#routeSingleListView .waypoint-row');
            $tableRows.removeClass('start-location');
            $tableRows.removeClass('end-location');
            $tableRows.removeAttr('index')
            $tableRows.each(function(key, value) {
                var $row = $(this);
                var rowOrder = key;
                if(lockOffset > 0) {
                    rowOrder = (key-1);
                }
                $row.attr('index',rowOrder);
                if(key === 0) {
                    $row.addClass('start-location');
                }
                else if (key === $tableRows.length-1) {
                    $row.addClass('end-location')
                }
    
                if (!$row.hasClass('startend') && !$row.hasClass('start') && !$row.hasClass('end')) {
                    $row.find('.time-block-counter').text(key + 1 - lockOffset);
                }
    
    
            });
        }
        else {
            lockOffset = $('#Routing-Table .waypoint-row.start, #Routing-Table .waypoint-row.startend:not(:last-child)').length > 0 ? 1 : 0;
            $('#Routing-Table .waypoint-row').each(function(key, value) {
                $(this).find('.svg-marker-waypoint text').text(key + 1 - lockOffset);
            });
        }
    
    
        //update summary data
        $('#tab-routes-route .waypoints-count').text($('#Routing-Table .waypoint-row').length + ' stops');
        $('#Routing-Table .waypoint-row .distance').text('');
        $('#drivingDistance, #totalTime').text('');
    }
    function AddAddressRow(options)
    {
        options = $.extend({
        }, options);
        var $row = $('#routing-templates .waypoint-row').clone();
        if(options.index) {
            tableRows = $('#Routing-Table .waypoint-row');
            //$row.hide();
            $row.insertBefore(tableRows.eq(options.index));
        }
        else {
            $('#Routing-Table .waypoint-row.end, #Routing-Table .waypoint-row.startend').length > 0 ? $row.insertBefore($('#Routing-Table .waypoint-row.end, #Routing-Table .waypoint-row.startend').last()) : $row.appendTo('#Routing-Table .waypoints');
        }
        $row.find('.index').append($('#templates .svg-marker-waypoint').clone().wrap('<div/>').parent().html().replace(/__INDEX__/g, MA.componentIndex++ + '_table').replace(/__TEXT__/g, ''));
        $row.find('.name').val('').change();
        $row.find('.address').val('').change();
        $row.find('.timeoptions-waypointstart').html($('.timedefaults-routestart').html()).prepend(
            $('<option/>').attr('value', 'Set start time...').text('Set start time...')
        ).val('Set start time...').change();
        $row.find('.timeoptions-waypointduration').html($('.timedefaults-appointmentduration').html()).val($('.timedefaults-appointmentduration').val()).change();
        $row.find('.notes').val('').change();
        var uidDate = new Date();
        var uid = uidDate.getTime();
        $row.attr('uid',uid);
        if(!options.waypoint) {
            OrderNumbersOnWaypoints();
        }
    
        if(options.waypoint) {
            //update fields
            $row.attr('data-placeid',options.waypoint.place_id);
    
            //get waypoint info from placeId
            MA.Geocoding.reverseGeocode({place_id : options.waypoint.place_id}, function(res) {
                if(res.success) {
                    var result = res.result;
                    //update the waypoint row
                    $row.find('.name').val(result.CompleteStreetAddress + '*').change();
                    $row.find('.address').val(result.FormattedAddress).change();
                    $row.attr('lat',result.Latitude);
                    $row.attr('long',result.Longitude);
                    $row.attr('draggablePoint',true);
                    $row.find('.svg-marker-waypoint text').text('*');
                    $row.find('.notes').val('*Custom waypoint created by manually modifying the route path.').change();
                }
            });
        }
    
        $('#Routing-Table').slimScroll({ scrollBy: $row.position().top });
    }
    
    function RemoveAddressRow($row)
    {
        $row.remove();
        OrderNumbersOnWaypoints();
        ClearDirectionsFromMap();
    }
    
    function resetAddressElements(options)
    {
        options = $.extend({
           loadDefaultLocations: true
        }, options);
    
        //Reset Address Elements
        $('#Routing-Table .waypoints').empty();
    
        //change default route name
        var routeDate = moment();
        var formattedName = 'Route ' + MARoutes.routeCount++;
        try {
            formattedName = formattedName + ' (' + routeDate.format(MASystem.User.dateFormat.toUpperCase()) + ')';
        }
        catch(e) {
            formattedName = formattedName + ' (' + routeDate.format('MM-DD-YYYY') + ')';
        }
        $('#routename').val(formattedName).change().attr('data-id', null);
        $('#tab-routes-route .toggle.timebased').toggleClass('active', $('.timedefaults-routetype').val() == 'TimeBased');
        $('#tab-routes-route').toggleClass('timebased', $('.timedefaults-routetype').val() == 'TimeBased');
        $('#timeoptions-routestart').val($('.timedefaults-routestart').val()).change();
        $('#timeoptions-routeend').val($('.timedefaults-routeend').val()).change();
    
        //populate default start/end locations
        if (options.loadDefaultLocations) {
            var startLocationId = $('.timedefaults-startlocation').attr('data-id');
            var endLocationId = $('.timedefaults-endlocation').attr('data-id');
            if (startLocationId) {
                var processData = {
    
                    action : 'getLocationInfo',
                    ajaxResource : 'MAFavoriteLocationsAJAXResources',
                    folderId: startLocationId
                };
    
                Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                    processData,
                    function(response, event){
                        if(event.status) {
                            if(response.data != undefined) {
                                if (response.data.locations.length > 0)
                                {
                                    AddFavoriteToTrip(removeNamespace(MASystem.MergeFields.NameSpace, response.data.locations[0]), { lockType: startLocationId == endLocationId ? 'Both' : 'Start' });
                                }
                            }
                        }
                    },{escape:false}
                );
            }
            if (endLocationId && endLocationId != startLocationId) {
               var processData = {
    
                    action : 'getLocationInfo',
                    ajaxResource : 'MAFavoriteLocationsAJAXResources',
                    folderId: endLocationId
                };
    
                Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                    processData,
                    function(response, event){
                        if(event.status) {
                            if(response.data != undefined) {
                                if (response.data.locations.length > 0)
                                {
                                    AddFavoriteToTrip(removeNamespace(MASystem.MergeFields.NameSpace, response.data.locations[0]), { lockType: 'End' });
                                }
                            }
                        }
                    },{escape:false}
                );
            }
        }
    
        OrderNumbersOnWaypoints();
    }
    
    /***********************
    * Routing Settings
    ***********************/
    function ShowRoutingSettings()
    {
        $('#Routing-Settings').dialog({
            draggable: false,
            resizable: false,
            modal: true
        });
    }
    function CloseRoutingSettings()
    {
        try { $('#Routing-Settings').dialog('close'); }
        catch(err) {}
    }
    
    /***********************
    * Event Integration
    ***********************/
    function ImportEvents()
    {
        trackUsage('MapAnything',{action: 'Import Events for Directions'});
    
        //remove existing dialogs
        $('[id$="importevents-wrapper"]').dialog('destroy').remove();
    
        //DONE Verify if Multiday
        var multiday = JSON.stringify( $('#tab-routes-route').data() ).includes('Multiday_Route__c');
        if(multiday)
        {
            //Multiday
            MAToastMessages.showWarning({message:'Unable to import events.',subMessage:'Events cannot be imported to Guide-generated routes.'});
            return;
        }
    
        //launch new dialog
        var $dialog = $("<div id='importevents-wrapper' class='loadmask-wrapper'></div>")
            .append("<h2>"+MASystem.Labels.MA_IMPORT_EVENTS+"</h2>")
            .append("<div id='importevents-date' style='margin: 10px 0;' />")
            .append("<span id='importevents-close' class='link' style='font-size: 10px; line-height: 22px;'>"+MASystem.Labels.MA_Cancel+"</span>")
            .on('click', '#importevents-close', function () {
                $dialog.dialog('close');
            })
        ;
        $dialog.find('#importevents-date').datepicker({
            onSelect: function (textVal, el) {
                showLoading($('#importevents-wrapper'), 'Importing...');
    
                var processData = {
                    ajaxResource : 'RouteCalendarAJAXResources',
    
                    action: 'getEvents',
                    start: moment(textVal,'MM/DD/YYYY').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
                    end: moment(textVal,'MM/DD/YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss')
                };
    
                Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                    processData,
                    function(response, event){
                        if(event.status) {
                            var resEvents = response.data.events || {};
                            if($.isEmptyObject(resEvents)) {
                                showWarning($('#mapdiv'),'No events to import for this day.',2000);
                                $dialog.dialog('close');
                                return;
                            }
                            $.each(response.data.events, function (eventId, e) {
                                var opts = {};
    
                                //event base object options
                                if (response.data.eventBaseObject) {
                                    removeNamespace(MA.Namespace, response.data.eventBaseObject);
                                    $.extend(opts, {
                                        title: e.event.Subject,
                                        latitude: extractValue(e.event, response.data.eventBaseObject.Latitude__c),
                                        longitude: extractValue(e.event, response.data.eventBaseObject.Longitude__c),
                                        verifiedLatitude: extractValue(e.event, response.data.eventBaseObject.VerifiedLatitude__c),
                                        verifiedLongitude: extractValue(e.event, response.data.eventBaseObject.VerifiedLongitude__c),
                                        markerAddress: extractValue(e.event, response.data.eventBaseObject.Street__c) + "," + extractValue(e.event, response.data.eventBaseObject.City__c) + " " + extractValue(e.event, response.data.eventBaseObject.State__c) + "," + extractValue(e.event, response.data.eventBaseObject.PostalCode__c) + (extractValue(e.event, response.data.eventBaseObject.Country__c) == ', ,' ? '' : ','+extractValue(e.event, response.data.eventBaseObject.Country__c))
                                    });
                                    opts.markerLatitude = (opts.verifiedLatitude || opts.latitude);
                                    opts.markerLongitude = (opts.verifiedLongitude || opts.longitude);
                                }
    
                                //related record options
                                if (e.record) {
                                    var baseObj = removeNamespace(MA.Namespace, response.data.baseObjects[(e.event.What || e.event.Who).Type]);
    
                                    //extend the title
                                    if (e.record.Name) {
                                        if(opts.title == null) {
                                            opts.title = e.event.Subject == null ? '' : e.event.Subject;
                                        }
    
                                        opts.title += ' (' +e.record.Name+ ')';
                                    }
    
                                    //extend with coordinate and address information from the record if we haven't already gotten them from the event
                                    if (!MA.Util.testLatLng(opts.markerLatitude, opts.markerLongitude)) {
    
                                        var addressString = extractValue(e.record, baseObj.Street__c) + "," + extractValue(e.record, baseObj.City__c) + " " + extractValue(e.record, baseObj.State__c) + "," + extractValue(e.record, baseObj.PostalCode__c) + (extractValue(e.record, baseObj.Country__c) == '' ? '' : ','+extractValue(e.record, baseObj.Country__c));
                                        if(addressString.lenth <= 4)
                                            addressString = "";
    
                                        $.extend(opts, {
                                            latitude: extractValue(e.record, baseObj.Latitude__c),
                                            longitude: extractValue(e.record, baseObj.Longitude__c),
                                            verifiedLatitude: extractValue(e.record, baseObj.VerifiedLatitude__c),
                                            verifiedLongitude: extractValue(e.record, baseObj.VerifiedLongitude__c),
                                            markerAddress: addressString
                                        });
                                        opts.markerLatitude = (opts.verifiedLatitude || opts.latitude);
                                        opts.markerLongitude = (opts.verifiedLongitude || opts.longitude);
                                    }
                                }
    
                                //add waypoint
                                var $row = $('#routing-templates .waypoint-row').clone().attr({
                                    Lat             : opts.markerLatitude,
                                    Long            : opts.markerLongitude,
                                    Address         : opts.markerAddress,
                                    WayPointTitle   : opts.title || opts.markerAddress,
                                    savedQueryId    : ''
                                });
                                $('#Routing-Table .waypoint-row.end, #Routing-Table .waypoint-row.startend').length > 0 ? $row.insertBefore($('#Routing-Table .waypoint-row.end, #Routing-Table .waypoint-row.startend').last()) : $row.appendTo('#Routing-Table .waypoints');
                                $row.find('.index').append($('#templates .svg-marker-waypoint').clone().wrap('<div/>').parent().html().replace(/__INDEX__/g, (MA.componentIndex++)+'_row').replace(/__TEXT__/g, ''));
                                $row.find('.address').attr('markerposition', JSON.stringify({ latitude: opts.markerLatitude, longitude: opts.markerLongitude }));
                                $row.find('.name').val(opts.title || opts.markerAddress).change().prop('readonly', true).addClass('DisabledWaypoint').prev().attr('onclick', "window.open('/"+eventId+"');").css('cursor', 'pointer').attr('title', opts.title || opts.markerAddress);
                                $row.find('.address').val(opts.markerAddress).prop('disabled', true).addClass('DisabledWaypoint').prev().text(opts.markerAddress);
                                $row.find('.timeoptions-waypointstart').html($('.timedefaults-routestart').html()).prepend(
                                    $('<option/>').attr('value', 'Set start time...').text('Set start time...')
                                ).val('Set start time...').change();
                                $row.find('.timeoptions-waypointduration').html($('.timedefaults-appointmentduration').html()).val($('.timedefaults-appointmentduration').val()).change();
                                $row.find('.notes').val('').change();
    
    
                                //add time-based values
                                var durationMinutes = e.event.DurationInMinutes;
                                var eventMinutes = durationMinutes%60;
                                var eventHrs = Math.floor(durationMinutes/60);
                                var $wpDuration = $row.find('.timeoptions-waypointduration');
                                var $wpStart = $row.find('.timeoptions-waypointstart');
                                //no longer rounding, just appening custom times, MAP-3691 
                                if(durationMinutes % 15 !== 0 || durationMinutes > 345) {
                                    //we need to create an option for this custom time.
                                    var customValue = eventHrs + ' hr, ' + eventMinutes + ' min';
                                    $wpDuration.append('<option value="'+customValue+'">'+customValue+'</option>');
                                }
    
                                //case 9483
                                var startDateTime = MA.Util.normalizeDateTime(e.event.StartDateTime);
                                //convet to moment
                                var momentTime = moment(startDateTime);
                                startDateTime = momentTime.format('h:mm a');
                                var startMin = momentTime.minutes();
                                if(startMin % 15 !== 0) {
                                    //need a custom time
                                    $wpStart.append('<option value="'+startDateTime+'">'+startDateTime+'</option>');
                                } 
                                
                                $wpStart.val(startDateTime).change();
                                $wpDuration.val(eventHrs + ' hr, ' + eventMinutes + ' min').change();
                                //if (!$('#tab-routes-route').is('.timebased')) {
                                    //$('#tab-routes-route .toggle.timebased').click();
                                //}
    
                                OrderNumbersOnWaypoints();
                                $('#Routing-Table').slimScroll({ scrollBy: $row.position().top });
                            });
                            $dialog.dialog('close');
                        }
                    },{escape:false}
                );
            }
        }).find('.ui-datepicker-inline').css('font-size', '16px');
        $dialog.dialog({ draggable: false, resizable: false, modal: true });
    }
    
    
    /***********************
    * Calendar Test
    ******************/
    function createCalendar(options) {
    
        //standard options
        var todayDate = new Date();
        var month = options.month;
        var year = options.year;
        var routes = options.routes;
    
        //setup initial month layout
        var d = new Date( year, month, 0 );
        var monthLength = d.getDate();
        var firstDay = new Date( year, month - 1, 1 );
    
        // day of the week to start for each month
        var startingDay = firstDay.getDay();
    
        //create calendar
        var $calendar = $('<div/>').addClass('calendar-wrapper');
    
        //add first week
        var $week = $('<div/>').addClass('calendar-row').appendTo($calendar);
    
        //start at day1
        var day = 1;
    
        //create rows (weeks), just stop at 7
        for ( var i = 0; i < 7; i++ ) {
    
            //create days inside rows
            for ( var j = 0; j <= 6; j++ ) {
    
                var $cell = $('<div/>').addClass('full-calendar-cell');
    
                //set starting position for the selected month
                //number of blank cells at beginning
                var pos = startingDay - 1;
                var p = pos < 0 ? 6 + pos + 1 : pos;
    
                //if day in month create info and increase day count else inner content is empty
                if ( day <= monthLength && ( i > 0 || j >= p ) )
                {
                    $cell.attr('onClick','selectSaveDay(this); return false;');
                    var $calDate = $('<span/>').addClass('calendar-date').text(day);
                    $calDate.appendTo($cell);
    
                    if(routes[day])
                    {
                        $.each(routes[day], function(index, routeObj) {
                            var route = routeObj.route;
                            //select 'save as'
                            if(saveId != route.Id) {
                                var $routeInfo = $('<div/>').addClass('route').attr('id', route.Id).attr('data-name', route.Name).text(route.Name).appendTo($cell);
                            }
                            //select 'save', update selection
                            else {
                                //create div
                                var $updateInfo = $('<div/>').addClass('route').attr('id', 'newRoute');
                                var $textinfo = $('<input/>').attr('id', 'savename').val($('#routename').val()).appendTo($updateInfo);
                                $updateInfo.appendTo($cell);
                            }
                        });
    
                        $cell.addClass('saved').appendTo($week);
                    }
                    else
                    {
                        $cell.attr('onClick','selectSaveDay(this); return false;').appendTo($week);
                    }
                    day++;
                }
                else
                {
                    $cell.addClass('disabled').appendTo($week);
                }
            }
    
            // stop making rows if we've run out of days
            if (day > monthLength) {
                break;
            }
            //create another row
            else {
                var $week = $('<div/>').addClass('calendar-row').appendTo($calendar);
            }
    
        }
    
        return $calendar;
    }
    
    //this function will return the total number of days in a month
    function daysInMonth(month, year) {
        return new Date(year, month, 0).getDate();
    }
    
    function selectSaveDay(selectedRow)
    {
        //remove selected class
        $('.full-calendar .full-calendar-cell').each(function (index, row) {
          $(row).removeClass('selected');
        });
    
        //store entered value and highlight row
        var newRouteName = $('#routename').val();
        $(selectedRow).addClass('selected');
    
        //text entry template
        var newRoute = '<div id="newRoute" class="route"><input type="text" id="savename" /></div>';
    
        //remove previous selection
        if($('#SaveRoutesPopup #newRoute').length != 0)
        {
            newRouteName = $('#SaveRoutesPopup #newRoute #savename').val();
            $('#SaveRoutesPopup #newRoute').remove();
        }
    
        $(selectedRow).append(newRoute);
        $(selectedRow).find('#savename').val(newRouteName).focus().select();
        $('#newRoute').click( function(e) {
            e.stopPropagation();
            return true;
        });
    }
    
    function PrepareSaveRoutePopup(perform)
    {
        trackUsage('MapAnything',{action: 'Save Route'});
    
        //CHECK FOR MULTIDAY ROUTE
        var multiday = JSON.stringify( $('#tab-routes-route').data() ).includes('Multiday_Route__c');
    
        // if(multiday && perform == 'insert')
        // {
        //    var popupOptions = {
        //         message : '"Save As" unavailable',
        //         subMessage : 'Guide-generated routes cannot be reassigned or rescheduled.',
        //         timeOut : 2000, //number of ms to show message, set to 0 to keep visible
        //         extendedTimeout : 1000, //how long to show the message if the user mouses over, set to 0 to ignore
        //         position : 'toast-bottom-right', //where the notification appears on the page, other options are below
        //         closeButton : false //show a close button
        //     };
        //     MAToastMessages.showError(popupOptions);
        //     return;
        // }
    
        //remove any waypoints that don't have a name and find those that need to be geocoded
        //no longer removing, showing errors instead...
        var waypointsToGeocode = [];
        var needToReorder = false;
        var waypointsNeedName = false;
        $.each($('#Routing-Table .waypoint-row'), function(index, row) {
            var waypointName = $(row).find('.name').val();
            if(waypointName == null || waypointName.trim() == '') { waypointsNeedName = true; }
            else if (!(!!$(row).attr('Lat') || !!$(row).attr('Long'))) {
                waypointsToGeocode.push({
                    waypoint: $(row),
                    geocoded: false,
                    error: false
                });
            }
        });
    
        if(waypointsNeedName) {
            MAToastMessages.showWarning({message:'Route Warning',subMessage:'Please enter a name for all waypoints before continuing.',timeOut:8000,closeButton:true});
            return;
        }
    
        //renumber the waypoints if needed
        if (needToReorder) {
            OrderNumbersOnWaypoints();
        }
    
        //geocode waypoints
        $.each(waypointsToGeocode, function (index, waypointToGeocode) {
            geocode({
                address: waypointToGeocode.waypoint.find('.address').val(),
                complete: function (response) {
                    waypointToGeocode.geocoded = true;
                    if (response.success) {
                        waypointToGeocode.waypoint.attr({
                            Lat: response.results.Latitude,
                            Long: response.results.Longitude
                        });
                        waypointToGeocode.waypoint.find('.address, .editable[data-for="address"]').addClass('GoodGeocodeForWaypoint').val(response.results.FormattedAddress);
                    }
                    else {
                        waypointToGeocode.error = true;
                        waypointToGeocode.waypoint.find('.address, .editable[data-for="address"]').addClass('BadGeocodeForWaypoint');
                    }
                }
            });
        });
    
        //poller for geocode completion
        var geocodeInterval = setInterval(function () {
            var done = true;
            var error = false;
            $.each(waypointsToGeocode, function (index, waypointToGeocode) {
                if (!waypointToGeocode.geocoded) { done = false; }
                if (waypointToGeocode.error) { error = true; }
            });
    
            if (error && done) {
                clearInterval(geocodeInterval);
            }
            else if (done) {
                clearInterval(geocodeInterval);
    
                if(perform != null) {
                    $('#saveRouteType').val(perform);
                }
    
                if(perform == 'update') {
                    saveId = $('#routename').attr('data-id');
    
                    if($('#tab-routes-route').data()) {
                        var routeData = $('#tab-routes-route').data();
                        var getRoute = routeData.route || {};
                        var dateNow = new Date();
                        var saveDate = getRoute.Date__c || dateNow.getFullYear() + '-' + (dateNow.getMonth()+1) + '-' + dateNow.getDate();
                        var dateParts = saveDate.split('-');
                        //set month and year to selected option
                        $('#SaveRoutesPopup').find('#savemonth').val(parseInt(dateParts[1])).next().find('input').val($('#SaveRoutesPopup').find('#savemonth option:selected').text());
                        $('#SaveRoutesPopup').find('#saveyear').val(parseInt(dateParts[0])).next().find('input').val($('#SaveRoutesPopup').find('#saveyear option:selected').text());
                    }
                    else {
                        //set month and year to selected option
                        $('#SaveRoutesPopup').find('#savemonth').val($('#tab-routes-routes #routemonth').val()).next().find('input').val($('#SaveRoutesPopup').find('#savemonth option:selected').text());
                        $('#SaveRoutesPopup').find('#saveyear').val($('#tab-routes-routes #routeyear').val()).next().find('input').val($('#SaveRoutesPopup').find('#saveyear option:selected').text());
                    }
                }
                $('#saveyear').change();
    
                //added this check condition to avoid calendar from showing up after user hit save.
                if(perform == 'update' && $('#routename').attr('data-id') != undefined){
                    saveRoute('update');
                }
                else {
                    LaunchPopupWindow($('#SaveRoutesPopup'), 750);
                }
            }
        }, 300);
    }
    
    function CloseMessageWindow()
    {
        if( $('#routeMessage').html() == 'You must select a day and give the route a name before saving.') { PrepareSaveRoutePopup(); }
        else { ClosePopupWindow(); }
    }
    
    function saveRoute(perform)
    {
        //make sure the route has a name
        var routeName = MA.isMobile ? $('#saveRouteName').val() : ( $('#savename').val() || $('#routename').val() );
        var previousRoute = $('#tab-routes-route').data('route');
        if(perform == 'update' && previousRoute != undefined && !MA.isMobile) {
            routeName = $('#routename').val();
        }
    
        if(routeName == null || routeName.trim() == '')
        {
            MAToastMessages.showError({message:'Save Error',subMessage:MASystem.Labels.MA_A_NAME_IS_REQUIRED_TO_CONTINUE,timeOut:5000});
            return;
        }

        //CHECK FOR MULTIDAY ROUTE
        var multiday = JSON.stringify( $('#tab-routes-route').data() ).includes('Multiday_Route__c');
            
        if(multiday && perform == 'insert')
        {
           var popupOptions = {
                message : '"Save As" unavailable',
                subMessage : 'Guide-generated routes cannot be reassigned or rescheduled.',
                timeOut : 2000, //number of ms to show message, set to 0 to keep visible
                extendedTimeout : 1000, //how long to show the message if the user mouses over, set to 0 to ignore
                position : 'toast-bottom-right', //where the notification appears on the page, other options are below
                closeButton : false //show a close button
            };
            MAToastMessages.showError(popupOptions);
            return;
        }
    
        //create an array of waypoint data
        waypoints = [];
        var name;
        var address;
        var $waypointsTable = MA.isMobile ? $('#routeSingleListView .waypoint-row') : $('#Routing-Table .waypoint-row') ;
    
        $waypointsTable.each(function(i, row) {
            if(MA.isMobile) {
                name = $(this).find('.name').text().length <= 80 ? $(this).find('.name').text() : $(this).find('.name').text().substring(0, 77) + '...';
                address = $(this).find('.address').text();
            }
            else {
    
                name = $(this).find('.name').val().length <= 80 ? htmlDecode($(this).find('.name').val()) : htmlDecode($(this).find('.name').val().substring(0, 77)) + '...';
                address = $(this).find('.address').val();
            }
    
    
            waypoints.push({
                name        : name,
                address     : address,
                notes       : $(this).find('.notes').val() || '',
                sortOrder   : i + 1,
                linkId      : $(this).find('.name').attr('data-id'),
                baseObject  : $(this).find('.name').attr('baseObject'),
                baseObjectId: $(this).find('.name').attr('baseObjectId'),
                tooltips    : $(this).find('.name').attr('tooltips'),
                latitude    : $(this).attr('lat'),
                longitude   : $(this).attr('long'),
                savedQueryId: ($(this).attr('savedQueryId') || '').indexOf('OptionsLayer') == 0 || ($(this).attr('savedqueryid') || '').indexOf('mapit') > -1 ? null : $(this).attr('savedQueryId'),
                recordId    : ($(this).attr('waypoint-id') || ''),
                isLocked    : $(this).find('.js-toggle-guide-waypoint-lock').hasClass("is-locked"),
                options     : JSON.stringify({
                    TimeBasedOptions    : { Start: $(this).find('.timeoptions-waypointstart').val(), Duration: $(this).find('.timeoptions-waypointduration').val() },
                    LockType            : $(this).is('.startend') ? 'startend' : $(this).is('.start') ? 'start' : $(this).is('.end') ? 'end' : 'unlocked',
                    DraggablePoint      : $(this).attr('draggablePoint') || false
                })
            });
        });
    
        //MULTIDAY SAVE ROUTE UPDATE
    
        if(waypoints.length < 2) {
            if(MA.isMobile) {
                MAToastMessages.showError({message:'Save Error', subMessage:MASystem.Labels.MA_ATLEAST_2_POINTS_ARE_REQUIRED_FOR_DIRECTIONS ,timeOut:5000});
                return;
            }
        }
        var $loading = MAToastMessages.showLoading({message:MASystem.Labels.MA_Saving_Route,subMessage:MASystem.Labels.MA_Loading+'...',timeOut:0,extendedTimeOut:0});
        //stringify route options
        var driveProfile = MA.isMobile ? MARoutes.mobile.getRouteType() : $('#DriveProfile').val()
        var options = JSON.stringify({
            TimeBasedOptions: {
                Enabled : $('#tab-routes-route').is('.timebased'),
                Start   : $('#timeoptions-routestart').val(),
                End     : $('#timeoptions-routeend').val()
            },
            DriveProfile : driveProfile
        });
    
        var esriRouteInfo = null;
        if(getProperty(MASystem || {}, 'Organization.StoreRouteGeometry') == true) {
            //check if we have data
            var routeInfo = $('#Routing-Table').data('esriRouteInfo')
            if(routeInfo != undefined && typeof routeInfo == 'object') {
                esriRouteInfo = JSON.stringify(routeInfo);
            }
        }
    
    
        var saveData;
        var momentDate;
    
        if(MA.isMobile) {
            var saveDate = $('#saveRouteDate').val();
            momentDate = moment($('#saveRouteDate').val(),MASystem.User.dateFormat.toUpperCase());
            saveData = {
                perform             : perform,
                routeId             : $('#routename').attr('data-id'),
                day                 : momentDate.format('D'),
                month               : momentDate.format('M'),
                year                : momentDate.format('YYYY'),
                lookupId            : MASystem.User.Id,
                lookupField         : 'sma__User__c',
                name                : $('#saveRouteName').val(),
                options             : options,
                serializedWaypoints : JSON.stringify(waypoints),
                ajaxResource : 'MAWaypointAJAXResources',
                action : 'saveRoute',
            };
        }
        else {
            var routeDay = $('#savename').closest('.full-calendar-cell').find('.calendar-date').text();
            var routeMonth = $('#savemonth').val();
            var routeYear = $('#saveyear').val();
    
            //var userId = $('#saveactiveusers-value').val();
            var routeFieldVal = $('#saveactiveusers-value').val();
            var routeFieldInfo = routeFieldVal.split(':');
            var lookupId = '';
            var lookupField = '';
            if(routeFieldInfo.length === 2) {
                lookupId = routeFieldInfo[1];
                lookupField = routeFieldInfo[0];
            }
            else {
                //fallback to owner
                lookupId = MASystem.User.Id;
                lookupField = 'ownerid';
            }
            if(perform == 'update') {
    
                if(previousRoute != undefined) {
                    var routeFieldVal = $('#routeactiveusers-value').val();
                    var routeFieldInfo = routeFieldVal.split(':');
                    var lookupId = '';
                    var lookupField = '';
                    if(routeFieldInfo.length === 2) {
                        lookupId = routeFieldInfo[1];
                        lookupField = routeFieldInfo[0];
                    }
                    else {
                        //fallback to owner
                        lookupId = MASystem.User.Id;
                        lookupField = 'ownerid';
                    }
                    momentDate = moment(previousRoute.Date__c,'YYYY-MM-DD');
                    routeDay = String(momentDate.date());
                    routeMonth = String(momentDate.month()+1);
                    routeYear = String(momentDate.year());
                }
            }
            else {
                if(routeDay == '') {
                    MAToastMessages.showError({message:'Save Error',subMessage:'Please select a day for this route.',timeOut:5000});
                    MAToastMessages.hideMessage($loading);
                    return;
                }
            }
    
            saveData = {
                perform             : perform,
                routeId             : $('#routename').attr('data-id'),
                day                 : routeDay,
                month               : routeMonth,
                year                : routeYear,
                lookupId            : lookupId,
                lookupField         : lookupField,
                name                : routeName,
                options             : options,
                serializedWaypoints : JSON.stringify(waypoints),
                ajaxResource : 'MAWaypointAJAXResources',
                action : 'saveRoute',
            };
    
            if(esriRouteInfo != null) {
                saveData.esriRouteInfo = esriRouteInfo
            }
        }
    
        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
            saveData,
            function(response, event){
                MAToastMessages.hideMessage($loading);
                if(event.status) {
                    if(response.success) {
    
                        if($('#savename').val())
                            $('#routename').val( ($('#savename').val() || $('#routename').val() ) ).change();
    
                        $('#routename').attr('data-id', response.routeId);
                        $('#routeyear').change();
    
                        // if( perform != 'Update')
                        ClosePopupWindow();
                        MAToastMessages.showSuccess({message:MASystem.Labels.MA_Success});
                        if(MA.isMobile) {
                            // highlight the plotted route, remove previous
                            MARoutes.mobile.activeRoute = response.routeId;

                            //reload the view
                            MAMobileRoutes.setDateFromPopup({month:$('#monthText').attr('data-month'),year:$('#monthText').attr('data-year')});

                            //update name and date
                            $('#routename').text($('#saveRouteName').val());
                            var dateTimeHTML = '<div class="ma-top-bar-subtext"><span><span class="ma-icon ma-icon-event"></span> '+$('#saveRouteDate').val()+'</span>';
    
                            if($('#updateRouteTimeBased').prop('checked')) {
                                dateTimeHTML += '<span><span class="ma-icon ma-icon-clock"></span> '+$('#timeoptions-routestart').val()+' - '+$('#timeoptions-routeend').val()+'</span>';
                            }
                            dateTimeHTML += '</div>';
    
                            $('#routenameWrapper .ma-top-bar-subtext').html(dateTimeHTML);
                        }
                    }
                    else {
                        //there was a problem so just show an error message
                        var errorMsg = 'Unable to save: Unknown error.'
                        if(response.error) {
                            errorMsg = 'Unable to save route. <br></br>' + response.error;
                        }
                        MAToastMessages.showError({message:errorMsg,timeOut:8000});
                    }
                }
                else
                {
                    //there was a problem so just show an error message
                    var errorMsg = 'Unable to save: Unknown error.'
                    if(response.error) {
                        errorMsg = 'Unable to save route. <br></br>' + response.error;
                    }
                    MAToastMessages.showError({message:errorMsg,timeOut:8000});
                }
            },{escape:false}
        );
    }

    function Waypoint_Lock($waypointRow, type)
    {
        if ($waypointRow.length == 0) { return; }
    
        var waypointTableId = MA.isMobile ? 'routeListView' : 'Routing-Table';
        switch (type)
        {
            case 'Start':
    
                //clear existing locks
                if ($('#'+waypointTableId+' .waypoint-row.startend').length > 1) {
                    $('#'+waypointTableId+' .waypoint-row.startend').last().remove();
                }
                $waypointRow.removeClass('start end startend');
                $('#'+waypointTableId+' .waypoint-row.start').removeClass('start');
                $('#'+waypointTableId+' .waypoint-row.startend').removeClass('startend').addClass('end').insertAfter($('#'+waypointTableId+' .waypoint-row').last());
    
                //lock this one
                if ($waypointRow.prev().length != 0) {
                    $waypointRow.insertBefore($('#'+waypointTableId+' .waypoint-row').first());
                }
                $waypointRow.addClass('start');
                OrderNumbersOnWaypoints();
    
                if(MA.isMobile) {
                    $waypointRow.find('.time-block-counter').html('<span class="ma-icon ma-icon-custom26"></span>');
                }
    
                //update the duration for this waypoint to be 0 (we are assuming this is home...)
                $waypointRow.find('.timeoptions-waypointduration').val('0 hr, 0 min').change();
    
            break;
    
            case 'End':
    
                //clear existing locks
                if ($('#'+waypointTableId+' .waypoint-row.startend').length > 1) {
                    $('#'+waypointTableId+' .waypoint-row.startend').last().remove();
                }
                $waypointRow.removeClass('start end startend');
                $('#'+waypointTableId+' .waypoint-row.end').removeClass('end');
                $('#'+waypointTableId+' .waypoint-row.startend').removeClass('startend').addClass('start').remove().insertBefore($('#'+waypointTableId+' .waypoint-row').first());
    
                //lock this one
                if ($waypointRow.next().length != 0) {
                    $waypointRow.insertAfter($('#'+waypointTableId+' .waypoint-row').last());
                }
                if(MA.isMobile) {
                    $waypointRow.find('.time-block-counter').html('<span class="ma-icon ma-icon-goal"></span>');
                }
                $waypointRow.addClass('end');
                OrderNumbersOnWaypoints();
    
            break;
    
            case 'Both':
    
                //clear existing locks
                if ($('#'+waypointTableId+' .waypoint-row.startend').length > 1) {
                    $('#'+waypointTableId+' .waypoint-row.startend').last().remove();
                }
                $('#'+waypointTableId+' .waypoint-row').removeClass('start end startend');
    
                //update uid
                var uidDate = new Date();
                var uid = uidDate.getTime();
    
                //lock this one
                if ($waypointRow.prev().length != 0) {
                    $waypointRow.insertBefore($('#'+waypointTableId+' .waypoint-row').first());
                }
                var $lastRow = $waypointRow.addClass('startend').clone().removeClass('context-menu-active');
                $lastRow.attr('uid',uid);
                $lastRow.insertAfter($('#'+waypointTableId+' .waypoint-row').last());
                if(MA.isMobile) {
                    $waypointRow.find('.time-block-counter').html('<span class="ma-icon ma-icon-custom26"></span>');
                    $lastRow.find('.time-block-counter').html('<span class="ma-icon ma-icon-goal"></span>');
                }
                OrderNumbersOnWaypoints();
    
                //update the duration for this waypoint to be 0 (we are assuming this is home...)
                $('#'+waypointTableId+' .waypoint-row:first-child, #'+waypointTableId+' .waypoint-row:last-child').find('.timeoptions-waypointduration').val('0 hr, 0 min').change();
    
            break;
        }
    }
    
    function deleteRouteConfirm(route) {
        $('#deleteRouteConfirmationModal').removeData();
        $('#deleteRouteConfirmationModal').addClass('slds-fade-in-open');
        $('#sldsModalBackDrop').addClass('slds-backdrop--open');
    
        var $route = $(route).parent();
        if($route.hasClass('deleting')) {
            return;
        }
    
        var routeId = $(route).parent().attr('id');
        $('#deleteRouteConfirmationModal').data('routeId',routeId);
    }
    
    function deleteRouteV2(routeId) {
        //can pass route it or grab from modal
        if(routeId == undefined) {
            routeId = $('#deleteRouteConfirmationModal').data('routeId');
        }
    
        //check again to see if routeId
        if(routeId == undefined) {
            MAToastMessages.showError({message:'Route Error',subMessage:'Unable to delete route, no route Id found,'})
            return;
        }
    
        var $route = $('#'+routeId+'').addClass('deleting');
    
        //we have an id, delete the route
        var processData = {
            ajaxResource : 'MAWaypointAJAXResources',
            action: 'deleteroute',
            routeId             : routeId
        };
        var $loading = MAToastMessages.showLoading({message:MASystem.Labels.MA_Loading+'...'});
    
        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
            processData,
            function(response, event){
                MAToastMessages.hideMessage($loading);
                if(event.status) {
                    if(response.success) {
                        if($('#routename').attr('data-id') == routeId) { $('#routename').attr('data-id', null); }
                        $('#routeyear').change();
                    }
                    else {
                        $route.removeClass('deleting');
                        var errMsg = response.error || 'Unknown Error.'
                        MAToastMessages.showWarning({message:'Unable to delete route.',subMessage:errMsg});
                    }
                }
                else
                {
                    $route.removeClass('deleting');
                    var errMsg = event.message || 'Unknown Error.'
                    MAToastMessages.showWarning({message:'Unable to delete route.',subMessage:errMsg})
                }
            },{escape:false}
        );
    }
    
    function deleteRoute(route)
    {
        var routeId = $(route).parent().attr('id');
    
        var processData = {
            ajaxResource : 'MAWaypointAJAXResources',
            action: 'deleteroute',
            routeId : routeId
        };
    
        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
            processData,
            function(response, event){
                if(event.status) {
                    if(response.success) {
                        if($('#routename').attr('data-id') == routeId) { $('#routename').attr('data-id', null); }
                        $('#routeyear').change();
                    }
                    else {
                        var errMsg = response.error || 'Unknown Error.'
                        MAToastMessages.showWarning({message:'Unable to delete route.',subMessage:errMsg})
                    }
                }
                else
                {
                    //there was a problem so just show an error message
    
                }
            },{escape:false}
        );
    
    }
    
    //PRINT UPDATE START (3)
    function distance(lat1, lon1, lat2, lon2, unit) {
        var radlat1 = Math.PI * lat1/180;
        var radlat2 = Math.PI * lat2/180;
        var theta = lon1-lon2;
        var radtheta = Math.PI * theta/180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit=="K") { dist = dist * 1.609344 };
        if (unit=="N") { dist = dist * 0.8684 };
        return dist;
    }
    //PRINT UPDATE END (3)
    
    /******************************
    *	On Ready
    ******************************/
    $(function () {
    
        /****************************************
        *	Init
        ****************************************/
        //set up route waypoint spiderfy
        var loadInt = setInterval(function() {
            if(typeof(MARoutes) == 'object') {
                clearInterval(loadInt); 
                MARoutes.waypointMarkers = new OverlappingMarkerSpiderfier(MA.map, { keepSpiderfied: true });
                MARoutes.waypointMarkers.addListener('click', function (marker, e) {
                    if (marker.spiderfied || MARoutes.waypointMarkers.markersNearMarker(marker, true).length == 0) {
                        if(!marker.savedQueryId) {
                            waypoint_Click.call(marker, { markerType: 'waypoint' });
                        }
                    }
                });
                MARoutes.waypointMarkers.addListener('spiderfy', function (markersAffected, markersNotAffected) {
                    $.each(markersAffected, function (i, marker) {
                        marker.spiderfied = true;
                    });
                });
                MARoutes.waypointMarkers.addListener('unspiderfy', function (markersAffected, markersNotAffected) {
                    $.each(markersAffected, function (i, marker) {
                        marker.spiderfied = false;
                    });
                });
                
                //clear directions to init everything
                setTimeout(function() {
                    ClearDirections();
                },1000);
                
            }
        },500);
    
    });
    
    function showSingleRoute() {
        $('#tab-routes-route').removeClass('hidden');
        $('#tab-routes-routes').addClass('hidden');
    }
    function hideSingleRoute() {
        $('#tab-routes-route').addClass('hidden');
        $('#tab-routes-routes').removeClass('hidden');
    }
    
    //show past routes
    function showPastRoutes() {
        $('#routesOptions').find('.js-show-past-routes').hide().removeClass('active');
        $('#routesOptions').find('.js-hide-past-routes').show().addClass('active');
    
        ////////////////////////
        $('.routes-row').each(function(){
            $(this).show();
        });
        ////////////////////////
    }
    
    // hide past routes
    function hidePastRoutes() {
        $('#routesOptions').find('.js-show-past-routes').show().addClass('active');
        $('#routesOptions').find('.js-hide-past-routes').hide().removeClass('active');
    
        ////////////////
        $('#routeCalendarTable .routes-row').each(function(){
            var dateString = $(this).attr('data-date');
            var inputTime = moment(dateString, 'YYYY-MM-DD');
            inputTime.set({ hour: 23, minute: 59 });
            var currentDate = moment();
            if( inputTime.isBefore(currentDate)){
                $(this).hide();
            }
        });
        ///////////////
    }
    
    $( document ).ready(function() {
        // show past routes button class click
        $('#routesOptions').on('click', '.js-show-past-routes', function () {
            showPastRoutes();
        });
    
        // hide past routes button class click
        $('#routesOptions').on('click', '.js-hide-past-routes', function () {
            hidePastRoutes();
        });
    
        // blur inline editable input on enter key
        $('#tab-routes-route').on('keyup', '.slds-inline-editable-input', function (e) {
             if (e.keyCode == 13) {
                $(this).blur();
            }
        });
    
        $(document).on('mousedown', '.js-routename-input', function () {
            var routename = $('#routename');
            $(routename).val('').focus();
            //Bagley I'm not sure where the input value is for this, it's not showing in the DOM
        });
    
        $(document).on('click', '.js-toggle-guide-waypoint-lock', function () {
            $(this).toggleClass('is-locked');
        });
    });
    