function NewLayerNavigationEnabled()
{
    return (typeof MALayers != "undefined");
}

function initFavLocationPopup() {
    jscolor.init()
    
    $('#FavoriteCreateLocation').off('click', '.location-markertype-selector img');
    
    //empty marker options on load for populate
    $('#FavoriteCreateLocation').find('select.location-markertype-image').empty();
    //populate marker image options
    var processData = {
        
        action : 'getImageOptions',
        ajaxResource : 'MAFavoriteLocationsAJAXResources'
    };
        
    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
        processData,
        function(response, event){
            if(event.status) {
                var $markerImageFields = $('#FavoriteCreateLocation select.location-markertype-image');
                $.each(response.data, function (index, option) {
                    $('<option></option>').attr('value', option.itemValue).text(option.itemLabel).appendTo($markerImageFields);
                });
                $markerImageFields.removeAttr('disabled');
            }
        }
    );
    
    $('#FavoriteCreateLocation').on('click', '.location-markertype-selector img', function () {
                         
        //only show the markertype selector that matches the selected type
        if ($(this).is('.location-markertype-selector-color')) {
            $(this).closest('.location-markertype-wrapper').find('.location-markertype-image').hide();
            $(this).closest('.location-markertype-wrapper').find('.location-markertype-color').show();
        }
        else {
            $(this).closest('.location-markertype-wrapper').find('.location-markertype-color').hide();
            $(this).closest('.location-markertype-wrapper').find('.location-markertype-image').show();
        }
                            
    });

    // attach select 2 search
    try {
        $('#FavoriteCreateLocation .fav-location-address').select2('destroy');
    } catch (e) {}
    $('#FavoriteCreateLocation .fav-location-address').select2({
        ajax: {
            delay: 250,
            transport: function (params, success, failure) {
                var paramData = params.data || {};
                var searchTerm = paramData.term || '';
                var request = autoCompleteSearch(searchTerm).then(function (res) {
                    var results = [];
                   
                    if (res.success) {
                        var searchData = getProperty(res, 'data.predictions', false) || [];
                        for (var i = 0; i < searchData.length; i++) {
                            var item = searchData[i];
                            results.push({
                                id: item.place_id,
                                text: item.description
                            });
                        }
                    }
                    success(results);
                });
                return request;
            },
            processResults: function(resp,page){
                return {
                    results : resp
                }
            }
        },
        placeholder: "Search...",
        minimumInputLength: 2
        // templateResult: function(result, container) {
        //     if (!result.id) {
        //         return result.text;
        //     }
        //     container.className += ' needsclick';
        //     return result.text;
        // }
    });
}

//get info for territory edit
function getLocationInfo (options)
{
    //show Loading
    showLoading($('#FavoriteCreateLocation .loadmask-wrapper'), 'Loading...');

    var locationId = options.locationId;
    var processData = {
        
        action : 'getLocationInfo',
        ajaxResource : 'MAFavoriteLocationsAJAXResources',
        folderId: locationId
    };
        
    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
        processData,
        function(response, event){
            if(event.status) {
                var location = removeNamespace(MASystem.MergeFields.NameSpace, response.data.locations[0]);
                var $FavWrapper = $('#FavoriteCreateLocation');
                $FavWrapper.find('.fav-location-name').val(htmlDecode(location.Name));
                // fav address is select2 
                var selectOption = new Option(location.Address__c, location.Address__c, true, true);
                $FavWrapper.find('.fav-location-address').append(selectOption).trigger('change');
                $FavWrapper.find('.fav-location-description').val(location.Description__c);
                $FavWrapper.find('.system-data').text('***Created By ' + location.CreatedBy.Name + ' on ' + moment(location.CreatedDate).format(formatUserLocaleDate({ moment: true })) + ', Modified By ' + location.LastModifiedBy.Name + ' on ' + moment(location.LastModifiedDate).format(formatUserLocaleDate({ moment: true })));
                if (location.FavoriteMarker__c.indexOf('#') == 0)
                {
                    $FavWrapper.find('.location-markertype-wrapper .location-markertype-selector-color').click();
                    $FavWrapper.find('.location-markertype-color')[0].color.fromString(location.FavoriteMarker__c);
                }
                else
                {
                    $FavWrapper.find('.location-markertype-wrapper .location-markertype-selector-image').click();
                    $FavWrapper.find('.location-markertype-wrapper .location-markertype-image').val(location.FavoriteMarker__c.split('image:')[1])
                }
                hideMessage($FavWrapper.find('.loadmask-wrapper'));
            }
        },{buffer:false,escape:true}
    );
}

//Delete Favorite Location
function deleteLocation(obj)
{
    var processData = {
        ajaxResource : 'MATerritoryAJAXResources',
        
        action: 'deleteFavoriteLocationMainTree',
        folderId : $(obj).attr('id')
    };
        
    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
        processData,
        function(response, event){
            if(event.status) {
                if(NewLayerNavigationEnabled()) {
                    MALayers.refreshFolder();
                }
            }
        }
    );
}

//Create Favorite Location
function CreateNewFavoriteLocation()
{
    //show Loading
    //showLoading($('#FavoriteCreateLocation .loadmask-wrapper'), 'Saving Favorite...');
    var $saveFav = MAToastMessages.showLoading({message:'Saving Location:',subMessage:'Validating inputs...',timeOut:0,extendedTimeOut:0});
    var $popup = $('#FavoriteCreateLocation');
    //manage folderId and userId
    var folderId;
    var userId;
    var locationId;
    var $favName = $popup.find('.fav-location-name').removeClass('error');
    var favName = $favName.val();
    
    if(favName.trim() == '') {
        $favName.addClass('error');
        MAToastMessages.hideMessage($saveFav);
        return;
    }
    $popup.find('footer .slds-button').attr('disabled',true);
    //is this an update?
    if ($('#FavoriteCreateLocation').data('locationId')) {
        locationId = $('#FavoriteCreateLocation').data('locationId');
    }
    //no, create new
    else {
        if($popup.data('folderId') == 'PersonalRoot' || $popup.data('folderId') == 'RoleUserFolder') {
            userId = MA.CurrentUser.Id;
        }
        else if ($popup.data('folderId') == 'CorporateRoot') {
            //send nothing for corporate root
        }
        else {
            folderId = $popup.data('folderId');
        }
    }
    
    //store info
    var marker = $popup.find('.location-markertype-color').css('display') == 'none' ? 'image:' + $popup.find('.location-markertype-image').val(): $popup.find('.location-markertype-color').val();
    $saveFav.find('.toast-message').text('Geocoding address...');
    $saveFav.find('.toast-message').text('Saving...');
    var request = {
        placeId: $popup.find('.fav-location-address').val(),
        fields: ['geometry']
    };
    var favLat = null;
    var favLng = null;
        service = new google.maps.places.PlacesService(MA.map);
        service.getDetails(request, callback);

    function callback(place, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            var geometry = getProperty(place,'geometry.location') || {}
            favLat = geometry.lat()
            favLng = geometry.lng()

            var processData = {
                        
                action : 'createFavoriteLocationMainTree',
                ajaxResource : 'MAFavoriteLocationsAJAXResources',
                serializedLocation : JSON.stringify(addNamespace(namespace, {
                    Name                    : favName,
                    User__c                 : userId,
                    MapAnythingFolder__c    : folderId,
                    Id                      : locationId,
                    Latitude__c             : favLat,
                    Longitude__c            : favLng,
                    Address__c              : $popup.find('.fav-location-address').text(),
                    Description__c          : $popup.find('.fav-location-description').val(),
                    FavoriteMarker__c       : marker
                }))
        };
                    
        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
            processData,
            function(response, event){
                if(event.status) {
                    if(response.success) {
                        removeNamespace(namespace, response.data);
                        
                        //add to tree or update
                        if ($popup.data('locationId'))
                        {
                            //update
                            var $node = $('#SQTree li[id="'+response.data.Id+'"]');
                            $node.attr('iconcolor', marker);
                            $("#SQTree").jstree('rename_node', '#' + locationId , response.data.Name);
                            updateIcon($node);
                        }
                        else
                        {
                            if ($popup.data('folderId') == 'RoleUserFolder') {
                                $("#SQTree").jstree("create","#" + $popup.data('folderIdActual'),"last",{attr : {id: response.data.Id, iconcolor: marker, NodeType: 'PersonalLocation', rel: 'SavedLocation', title: response.data.Name}, data: response.data.Name},null,true);
                            }
                            else {
                                $("#SQTree").jstree("create","#" + $popup.data('folderId'),"last",{attr : {id: response.data.Id, iconcolor: marker, NodeType: 'PersonalLocation', rel: 'SavedLocation', title: response.data.Name}, data: response.data.Name},null,true);
                            }
                        }
                        
                        //if successful, hide message
                        MAToastMessages.hideMessage($saveFav);
                        MAToastMessages.showSuccess({message:'Saving Location',subMessage:'Success'});
                        if(NewLayerNavigationEnabled()) {
                            MALayers.refreshFolder();
                        }
                        MA.Popup.closeMAPopup();
                        ClearFavoriteLocation();
                    }
                    else {
                        $popup.find('footer .slds-button').removeAttr('disabled');
                        var errMsg = response.message || 'Unable to create favorite.';
                        MAToastMessages.showError({message:'Favorite Location Error',subMessage:errMsg,timeOut:4000});
                    }
                }
            }
        );
        }
    }
}

var locationMarkers = [];
var locationIndex = 0;
function createFavDomElement(options) {    
    var dfd = $.Deferred();
    
    options.component = 'FavoriteLayer';
    window.VueEventBus.$emit('add-layer', options, function(favLayerRef) {
        var $favLayer = $(favLayerRef);
        $favLayer.attr('qid', options.qid);
        dfd.resolve($favLayer);
    });
    return dfd.promise();
}
function PlotFavoriteLocation(options) {
    //BEGIN MA ANALYTICS
    var processData = { 
		ajaxResource : 'MATreeAJAXResources',
		action: 'store_layer_analytics',
		track : 'true',
		subtype : 'Favorite Location',
		id : options.id
	};
	
    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
		processData,
		function(res, event){
            if(NewLayerNavigationEnabled()) {
                MALayers.loadRecent();
            }
        }
    );
    //END MA ANALYTICS
    if (!options.qid) {
        options.qid = 'fav_' + moment().format('x');
    }

    // if desktop use vue
    options.component = 'FavoriteLayer';
    VueEventBus.$emit('add-layer', options, function () {
        // not needed...
    });
}


function removeFavLocaiton($favLayer)
{
    var dfd = $.Deferred();
    //unrender the fav layer
    $favLayer.data('marker').setMap(null);
    
    //remove the prox layer from the layers section
    if (MA.isMobile) {
        $favLayer.slideUp(300, function () {
            $favLayer.remove(); 
        });
    }
    //done
    dfd.resolve();
    return dfd.promise();
}

function ClearFavoriteLocation()
{
    jscolor.init();
    $('#FavoriteCreateLocation').removeData().removeAttr('folderId').removeAttr('folderIdActual');
    $('#FavoriteCreateLocation .fav-location-name').val('');
    $('#FavoriteCreateLocation .fav-location-address').val('');
    $('#FavoriteCreateLocation .fav-location-description').val('');
    $('#FavoriteCreateLocation .system-data').text('');
    $('#FavoriteCreateLocation .location-markertype-wrapper .location-markertype-selector-color').click();
    try {
        $('#FavoriteCreateLocation .location-markertype-color')[0].color.fromString('#00FF00');
    }
    catch(e){}
}

//Delete favorite folder
function DeleteFavLocation()
{
    var processData = {
        
        action : 'getDeleteMetadata',
        ajaxResource : 'MAFavoriteLocationsAJAXResources',
        folders : JSON.stringify(folders),
        locations   : JSON.stringify(locations)
    };
        
    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
        processData,
        function(response, event){
            if(event.status) {
                /*$('#FavTree').jstree('remove', $('#FavTree [data-id="'+checkedId+'"]'));
                $checkedRow.remove();*/
                //update only selected nodes
                var tree = jQuery.jstree._reference("#FavTree");
                var parentNode = $('#FavTree').jstree('get_selected');
                tree.refresh(parentNode);
                $('#FavTree').jstree('get_selected').closest('li').find('a ins').click()
                //manage extra options on success
                $('#FavoriteLocationsPopup .fav-extra-options').hide(400);
                $('#FavoriteLocationsPopup .allfav-check').prop('checked', false);
            }
        }
    );
}