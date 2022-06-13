var IsCorporateAdmin = true;
//testing modify 3
var BaseObjectsForSubMenu = [{ label: 'Loading...' }];

var UserId = MASystem.MergeFields.UserId;
var OrgId = MASystem.MergeFields.OrganizationId;

//TomTom Routing Images
var routingImages = MASystem.Images.routingImages;

var LoadingGIFUrl = MASystem.Images.LoadingGIFUrl;
var MALoaddingGIFUrl = MASystem.Images.MALoaddingGIFUrl;

var VisibleQueries = []; //Used to Determine Which Queries are Visible (List of Ids)
var SavedQueriesObjectIdArray = []; //Used to Store Information about Processed Saved Queries

var ProcessedSavedQueries = [];

var UserEmailAddress = MASystem.MergeFields.User_Email;

//var map = null;
var ProximityCircle = null;
var DOMNode = null;
var router = null;
var RouterResponse = null;

//Position Vars
var PositionMarker;
var WatchPositionMarker = null;
var PositionEnabled = false;

//Home Vars
var CenterLat;
var CenterLong;
var DefaultZoomLevel;
var DefaultMapType;

var DebugMode = false;

var GeoCodePointsIsRunning = false; //No Longer Needed

var CallBackFunction;

//New Permission Var(s)
var pageSize = 10;
var campaignsPageSize = 10;
var changeownerPageSize = 10;

var RoutingGeoCodeIsRunning;
var WayPointArray = [];
var skippedWaypointsArray;
var HasRoutingErrors = false;

var AddressesToBeGeoCoded = [];

var PlottedLegendSavedQryId = "";

var slider1;
var slider2;

var defaultQueries = [];
var userSettings = $.extend({}, MA.defaults.userSettings);
/**************************************
*  Keyboard Shortcuts for MapAnything
***************************************/
//main shortcuts
//causing issues so removing
/*$(document).bind('keydown', 'Shift+z',function (evt){ ZoomToFit(); });
$(document).bind('keyup', 'Shift+s',function (evt){ $('#search-wrapper .search-box ').focus(); });
$(document).bind('keyup', 'Shift+h',function (evt){ GoToHomePosition(); });
$(document).bind('keyup', 'Shift+p',function (evt){ ShowHidePosition(); });
$(document).bind('keyup', 'Shift+t',function (evt){ $('#ShowTrafficButton').click(); });*/

var notPrintEmailPage = document.URL.indexOf('PrintEmailRoute') == -1;

//toggle highlight variables
var highlightOnOff = false;
var highlight;



// function openShapeLayerBuilder() {
//     $('#shapeBuilderModalPositioner').addClass('in');
//     $('#shapeBuilderBackdropPositioner').addClass('in');
//     setTimeout(function() {
//         $('#CreateTerritoryPopup').addClass('slds-fade-in-open');
//         $('#CreateTerritoryPopupBackdrop').addClass('slds-modal-backdrop--open');
//         $('#shapeBuilderNavDetails').click();
//         $('#shapeBuilderDetailsName').focus();
//     }, 001);
// }

$(function()
{
    // if(notPrintEmailPage) { document.getElementById("exportedTable").style.height =(screen.height-460) + "px"; }
    sforce.connection.sessionId = MASystem.MergeFields.Session_Id;

    $('body').on('keyup','input.numberVal',function(event) {
        // skip for arrow keys
        if (event.which >= 37 && event.which <= 40) {
            event.preventDefault();
        }

        var currentVal = $(this).val();
        var testDecimal = testDecimals(currentVal);
        if($(this).hasClass('js-whole-number') && testDecimal > 0) {
            $(this).val(replaceCommas(currentVal));
        }
        else if (testDecimal.length > 1) {
            console.warn("You cannot enter more than one decimal point");
            currentVal = currentVal.slice(0, -1);
        }
        
        
        $(this).val(replaceCommas(currentVal));
    });

    toastr.options = {
        "positionClass": "toast-bottom-right",
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "3000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut",
        "iconClasses" : {
            "success" : "toast-success",
            "error"   : "toast-error",
            "warning" : "toast-warning",
            "info"    : "toast-info"
        }
    }

    /*****************
     *  Add to Campaign
     *****************/

    //campaign filter handlers
    $('#addtocampaign-select-filters span.link.showadvancedfilters').click(function () {
        if ($(this).text() == 'Show Advanced Filters')
        {
            $(this).text('Hide Advanced Filters');
            $('#addtocampaign-select-advanced-filters').slideDown();
        }
        else
        {
            $(this).text('Show Advanced Filters');
            $('#addtocampaign-select-advanced-filters').slideUp();
        }
    });
    $('#addtocampaign-select-filters span.link.clearfilters').click(function () {
        $('#addtocampaign-select-advanced-filters').find('.filter-text, .filter-calendar, .filter-number').val('');
    });

    //handle clearing selected campaigns
    $('#addtocampaign-select-selectiondetails span.link.clearselections').click(function () {

        //uncheck all visible rows
        $('.campaign-row .campaign-checkbox').prop('checked', false);

        //update records in memory
        $('#addtocampaign-select-grid').data('records', {});

        //update the selections counter
        $('#addtocampaign-select-selectiondetails').data('numSelected', 0);
        $('#addtocampaign-select-selectiondetails span').first().text('0');

    });

    /*****************
     *  Change Owner
     *****************/

    //init grid data
    $('#changeowner-select-grid').data({
        pageSize: 10,
        rowTemplate: $('#templates .changeowner-row'),
        populateRow: function ($row) {

            //populate basic record data
            var record = $row.data('record');
            $row.find('.user-name').text(record.Name);

            //return the row
            return $row;
        }
    });

    //handle clicking a new owner
    $('#changeowner-select-grid-wrapper').on('click', '.changeowner-row td', function () {
        //keep track of which user was clicked
        $('#changeowner-select-grid').data('selectedRecord', $(this).closest('.changeowner-row').data('record'));

        //show step 2
        $('#changeowner-select-wrapper').css('min-height', 'auto').slideUp(300, function () { $(this).css('min-height', ''); });
        $('#changeowner-options-wrapper').css('min-height', 'auto').slideDown(300, function () { $(this).css('min-height', ''); });
    });

    //handle when a user checks or unchecks the show subordinates only option
    $('#ChangeOwnerPopup .show-only-subordinate').on('change',function(){
        //show a loading message on the popup
        $('#changeowner-options-wrapper').hide();
        $('#changeowner-select-wrapper').show();
        $('#changeowner-filter-name').val('');
        $('#changeowner-options-wrapper input[type="checkbox"]').prop('checked', true);
        showLoading($('#changeowner-select-grid-wrapper'), 'Loading Users...');
        var subordinatesOnly = $('#ChangeOwnerPopup .show-only-subordinate').is(':checked');
        //send a request to get the available users
        var processData = {
        	ajaxResource : 'MATooltipAJAXResources',
            subordinatesOnly : subordinatesOnly,
        	action			: 'get_users'
        };

        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
        	processData,
        	function(response, event){
                if (response.success)
                {
                    var users = {};
                    $.each(response.users, function (index, user) {
                        users[user.Id] = user;
                    });
                    $('#changeowner-select-grid').data('records', users);

                    grid_Search.call($('#changeowner-select-grid'));
                    
                }
        	},{escape:false}
        );
    });
    /*****************
     *  New Task
     *****************/
    //handle clicking an assignment type
    $('[name="newtask-assignto-type"]').click(function () {
        $('.newtask-assignto-type').hide().filter('.' + $(this).attr('value')).show();
    });



    /*****************
     *  New Event
     *****************/

    //handle clicking an assignment type
    $('[name="newevent-assignto-type"]').click(function () {
        $('.newevent-assignto-type').hide().filter('.' + $(this).attr('value')).show();
    });

    /***********************
    *   Plotted Layers
    ***********************/

    //change visibility toggle on prox layers
    $('#PlottedQueriesTable').on('change', '.affectvisibility', function() {
        //adding option to not remove related shapes from a query
        if(this.getAttribute('id') === 'limit-within-shape' || this.getAttribute('id') === 'limit-within-prox'){
            $('.PlottedRowUnit.savedQuery').each(function(){
                var data = $(this).data();
                var columnSort = getProperty(data.listViewSettings || {},'currentSort.columnToSort',false) || '';
                var sort = getProperty(data.listViewSettings || {},'currentSort.sort',false) || '';
                var qid = getProperty(data || {},'qid',false) || '';
                $('div#'+qid+' th[colid="' + columnSort + '"]').removeClass('asc').removeClass('desc').removeClass(sort);
                $(this).data().listViewSettings.currentSort.sort = '';

                $('#'+ qid +' .listview-col-sort-asc').removeClass('listview-col-sort-asc');
                $('#'+ qid +' .listview-col-sort-desc').removeClass('listview-col-sort-desc');
            });
        }
        
        ChangeVisibilityWhenCircleIsAdded({force:true,keepRelatedShapes:true});
    });

    /**************************
    *
    **************************/

    /*if (LicenseType == 'bronze')
    {
        $('#ShowTrafficButton').hide();
    }*/

    //Remove Copyright Link
    $("#nm_crimg a").attr('disabled','disabled');


    StartUpJS();
    InitializeTree();

    //preload images
    var images = [];
    var preloaders = [MASystem.Images.chatterLoader];
    for (i = 0; i < preloaders.length; i++) {
        images[i] = new Image();
        images[i].src = preloaders[i];
    }

    // default to first tab
    $('#sidebar-content .side-nav-block').slideUp();
    $('#sidebar-content .side-nav-block').eq(0).slideDown();

}); //end onready

// switch to given context on the left side navigation
function setSideNavigationContext(options) {
    /**
        options = {
            tabName: STRING
        }
    **/
    if(options && typeof options == 'object')
    {
        var idMap = {
            'layers': 'tab-plotted',
            'routes': 'tab-routes',
            'schedule': 'tab-schedule'
        };

        $('#sidebar-content .side-nav-block').slideUp();
        $('#sidebar-content .side-nav-block#'+ idMap[options.tabName]).slideDown();
    }
}


function NewLayerNavigationEnabled()
{
    return (typeof MALayers != "undefined");
}


/////////////////////////
//  SavedQueryTree.js  //

function InitializeTree()
{
    /*

        Folder
            Type~~Id

        Saved Query
            Type~~Id~~Custom~~Type

    */

    $("#SQTree").bind("create.jstree", function (event, data)
    {
        try
        {
            Debug("create.jstree");

            /*
                data.rslt.obj[0] - the node created
                Array Breakdown

                0 - NodeType (PersonalRoot, CorporateRoot, RoleRoot, CorporateFolder, PersonalFolder, RoleNameFolder, RoleFolder, RoleUserFolder, CorporateSavedQuery, PersonalSavedQuery, RoleSavedQuery)
                1 - Id (Id of Folder or Saved Query)
                2 - Custom (Custom, NotCustom)
                3 - Type (LegendSavedQuery, SavedQuery)
            */
            if (data.rslt.obj.attr("Id") === undefined || data.rslt.obj.attr("Id") === "")
            {
                 Debug("create.jstree - Folder");
                 Debug("ParentId: " + data.rslt.parent.attr("Id"));
                 Debug("Name: " + data.rslt["name"]);

                 var ParentNodeType = data.rslt.parent.attr("NodeType");
                 Debug('Parent is ' + ParentNodeType);

                 var personUser = '0';
                 if (ParentNodeType === "PersonalFolder" || ParentNodeType === "PersonalRoot" || ParentNodeType === "RoleUserFolder")
                 {
                    data.rslt.obj.attr("NodeType", "PersonalFolder");

                    if(data.rslt.obj.closest('[NodeType = PersonalRoot]')[0] != null)
                    {
                        personUser = 'user';
                    }
                    else if(data.rslt.obj.closest('[NodeType = RoleUserFolder]')[0] != null)
                    {
                        personUser = data.rslt.obj.closest('[NodeType = RoleUserFolder]').attr("id");
                    }
                 }
                 else if (ParentNodeType == "CorporateFolder" || ParentNodeType == "CorporateRoot")
                 {
                    data.rslt.obj.attr("NodeType", "CorporateFolder");
                    data.rslt.obj.attr("create",data.rslt.parent.attr("create"));
                    data.rslt.obj.attr("modify",data.rslt.parent.attr("modify"));
                    data.rslt.obj.attr("delete",data.rslt.parent.attr("delete"));
                    data.rslt.obj.attr("setperm",data.rslt.parent.attr("setperm"));
                 }
                 else if (ParentNodeType == "RoleFolder" || ParentNodeType == "RoleRoot" || ParentNodeType == "RoleNameFolder")
                 {
                    data.rslt.obj.attr("NodeType", "RoleFolder");
                 }

                var processData = {
        			ajaxResource : 'MATreeAJAXResources',

        			action: 'new_folder',
        			pid          : data.rslt.parent.attr("Id"),
                    name       : encodeURIComponent(data.rslt["name"]),
                    pos       : data.rslt["position"],
                    NodeType : data.rslt.parent.attr("NodeType"),
                    personUser : 'personUser'
        		};

        	    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
        			processData,
        			function(json, event){
                        if(json.success)
                        {
                            var newnode = data.rslt.obj;
                            newnode.attr("id", json.FolderId);
                            Debug("Node Created in Database! " + json.FolderId);
                        }
                        else
                        {
                            //REMOVE CREATED FOLDER DUE TO ERROR HERE
                            NotifyError("Error Creating Node in Database",json.error);
                            Debug("Error Creating Node in Database " + json.error);
                        }
                    }
                );
            }
        }
        catch(err)
        {
            Debug("Error, create.jstree");
            DisplayPropertiesOfObject(err,0);
        }
    }); //End create.jstree

    $("#SQTree").bind("create_node.jstree", function (event, data)
    {
        //update icons
        $('#SQTree li[rel="SavedQuery"], #SQTree li[rel="SavedTerritory"], #SQTree li[rel="SavedLocation"]').each(function () {
            updateIcon($(this));
        });

    }); //End create_node.jstree

    $("#SQTree").bind("rename.jstree", function (event, data)
    {
        Debug("rename.jstree");
        Debug("Id: " + data.rslt.obj.attr('ID'));

        var NodeType = data.rslt.obj.attr("NodeType");

        if(NodeType == "RoleNameFolder" || NodeType == "RoleUserFolder" || NodeType.indexOf('Root') != -1)
        {
            Debug("Cannot Rename "+NodeType+" Folder");
            return;
        }

        var processData = {
			ajaxResource : 'MATreeAJAXResources',

			action: 'rename_folder',
			id          : data.rslt.obj.attr("Id"),
            name       : data.rslt["new_name"]
		};

	    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
			processData,
			function(json, event){
                if(json.success)
                {
                    Debug("Updated Node " + json.id);
                }
                else
                {
                    NotifyError("Error Updating Node",json.error);
                    Debug("Error Updating Node " + json.error);
                }
            }
        );
    }); //End rename.jstree


    $("#SQTree").bind("remove.jstree", function (event, data)
    {
        Debug("remove.jstree");
        Debug("Id: " + data.rslt.obj.attr("Id"));

        var NodeType = data.rslt.obj.attr("NodeType");

        if (NodeType == "RoleNameFolder" || NodeType == "RoleUserFolder" || NodeType.indexOf('Root') != -1)
        {
            Debug("Cannot Remove "+NodeType+" Folder");
            return;
        }

        if (NodeType == "CorporateFolder" || NodeType == "PersonalFolder" || NodeType == "RoleFolder")
        {
            Debug("Removing Folder");
        }
        else if (NodeType == "CorporateSavedQuery" || NodeType == "PersonalSavedQuery" || NodeType == "RoleSavedQuery")
        {
            Debug("Removing Saved Query");
        }

        var processData = {
			ajaxResource : 'MATreeAJAXResources',

			action: 'delete_node',
			id          : data.rslt.obj.attr("Id")
		};

	    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
			processData,
			function(json, event){
			    if(event.status) {
                    if(json.success)
                    {
                        Debug("Deleted Node " + json.id);
                    }
                    else
                    {
                        NotifyError("Error Deleting Node",json.error);
                        Debug("Error Deleting Node " + json.error);
                    }
			    }
            }
        );
    }); //End remove.jstree



   $("#SQTree").bind("move_node.jstree", function (event, data)
        {
            /*
                .o - the node being moved (m.o[0])
                .np - the new parent (m.np[0])
                .op - the former parent (m.op[0])
            */

            var NewParentNodeType = data.rslt.np.attr("NodeType");

            var NewParentId = data.rslt.np.attr("Id");
            var OldParentId = data.rslt.op.attr("Id");

            var SavedQueryParam = '';
            var TerritoryParam = '';
            var FavoriteParam = '';
            var FolderParam = '';

            //Populate URL Params for children
            $.each($.jstree._reference('#SQTree')._get_children('#' + data.rslt.np.attr("Id")), function(index, value) {

                var NodeType = $(value).attr("NodeType");

                //Set attribute on node for parent NodeType
                if (NodeType == 'PersonalSavedQuery' || NodeType == 'CorporateSavedQuery' || NodeType == 'RoleSavedQuery')
                {
                    if (NewParentNodeType == 'CorporateRoot' || NewParentNodeType == 'CorporateFolder' )
                    {
                        $(value).attr("NodeType","CorporateSavedQuery");
                    }
                    else if (NewParentNodeType == 'PersonalRoot' || NewParentNodeType == 'PersonalFolder' || NewParentNodeType == 'RoleUserFolder' )
                    {
                        $(value).attr("NodeType","PersonalSavedQuery");
                    }
                    else if (NewParentNodeType == 'RoleRoot' || NewParentNodeType == 'RoleNameFolder' || NewParentNodeType == 'RoleFolder' )
                    {
                        $(value).attr("NodeType","RoleSavedQuery");
                    }

                    SavedQueryParam += $(value).attr("Id") + " " + NodeType + ",";
                }
                else if (NodeType == 'PersonalTerritory')
                {
                    TerritoryParam += $(value).attr("Id") + " " + NodeType + ",";
                }
                else if (NodeType == 'PersonalLocation')
                {
                    FavoriteParam += $(value).attr("Id") + " " + NodeType + ",";
                }
                else
                {
                    FolderParam += $(value).attr("Id") + " " + NodeType + ",";
                }
            });

            //Remove last comma
            SavedQueryParam = SavedQueryParam.slice(0, -1);
            TerritoryParam = TerritoryParam.slice(0, -1);
            FavoriteParam = FavoriteParam.slice(0, -1);
            FolderParam = FolderParam.slice(0, -1);

            var processData = {
    			ajaxResource : 'MATreeAJAXResources',

    			action: 'move_node',
    			sqry : encodeURIComponent(SavedQueryParam),
    			territories : encodeURIComponent(TerritoryParam),
    			favorites : encodeURIComponent(FavoriteParam),
    			folders : encodeURIComponent(FolderParam),
    			npid: 'NewParentId',
    			npnt :'NewParentNodeType'
    		};

    	    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
    			processData,
    			function(json, event){
                    if(json.success) {
                        //Success
                    }
                    else {
                        //This is showing errors even though it's working.  No time to look into it now so just commenting it out
                        //NotifyError("Error Ordering Node(s)",json.error);
                    }
                }
            );
        }
    ); //End move_node.jstree

    $("#SQTree").bind("load_node.jstree", function (event, data)
    {
        //update icons
        $('#SQTree li[rel="SavedQuery"], #SQTree li[rel="SavedTerritory"], #SQTree li[rel="SavedLocation"]').each(function () {
            updateIcon($(this));
        });

        //find scroll dimensions  and calculate if need to scroll down
        if(data.rslt.obj[0] != undefined)
        {
            //store nodeHeigth
            var nodeHeight = $(data.rslt.obj[0]).find('ul li').length * 33;
            $(data.rslt.obj[0]).data('nodeHeight',nodeHeight);

            //initial load of node, grab information and calculate dimensions
            var outerTop = $('#SQTree').scrollTop();
            var outerBottom = outerTop + nodeHeight;
            var innerTop = data.rslt.obj[0].offsetTop;
            var innerBottom = innerTop + nodeHeight;

            //if extending past page, scroll down
            if(innerBottom > outerBottom)
            {
                //add 33 for height of containing node
                var scroll = innerBottom - $('#SQTree').height() + 33;
                updateScroll(scroll,nodeHeight);
            }
            else
            {
                //reset height
                $('#SQTree >ul').height('auto');
            }
        }

    }); //End create_node.jstree
}

function updateScroll (scroll,nodeHeight)
{
    //update height of container
    $('#SQTree >ul').height( $('#SQTree >ul').height() + nodeHeight )

    //scroll down if needed
    $('#SQTree').animate({ scrollTop: scroll });
}

function updateIcon($node)
{
    try
    {
        if ($node.attr('rel') == 'SavedQuery' && $node.attr('IconColor'))
        {
            var iconColor = $node.attr('IconColor');
            if (iconColor.indexOf('#') == 0)
            {
                $node.find('a .jstree-icon, a img').replaceWith($("<ins class='jstree-icon'>&nbsp;</ins>").attr('style', 'background-color: '+iconColor.split(':')[0]+' !important;'));
            }
            else if (iconColor.indexOf('image:') == 0)
            {
                var imageURL = MA.SitePrefix+"/servlet/servlet.FileDownload?file="+iconColor.split(':')[1];
                $node.find('a .jstree-icon, a img').replaceWith($("<img style='width: 19px; height: 19px; margin-right: 3px; vertical-align: middle;' />").attr('src', imageURL));
            }
        }
        else if ($node.attr('rel') == 'LegendSavedQuery')
        {
            $node.find('a .jstree-icon, a img').replaceWith($("<ins class='jstree-icon'>&nbsp;</ins>"));
        }
        else if ($node.attr('rel') == 'SavedTerritory')
        {
            var iconColor = $node.attr('iconcolor');
            var rgb = hexToRgb(iconColor);
            $node.find('a .jstree-icon').replaceWith($("<ins class='jstree-icon'>&nbsp;</ins>").attr('style', 'background-color: rgba('+rgb.r+', '+rgb.g+', '+rgb.b+', 0.2) !important;'));
        }
        else if ($node.attr('rel') == 'SavedLocation')
        {
            var iconColor = $node.attr('iconcolor');
            if (iconColor.indexOf('#') == 0)
            {
                $node.find('a .jstree-icon, a img').replaceWith($("<ins class='jstree-icon'>&nbsp;</ins>").attr('style', 'background-color: '+iconColor+' !important;'));
            }
            else if (iconColor.indexOf('image:') == 0)
            {
                $node.find('a .jstree-icon, a img').replaceWith($("<ins class='jstree-icon'>&nbsp;</ins>").attr('style', 'background-color: transparent !important;'));
                //var imageURL = MA.SitePrefix+"/servlet/servlet.FileDownload?file="+iconColor.split('image:')[1];
                //$node.find('a .jstree-icon, a img').replaceWith($("<img style='width: 19px; height: 19px; margin-right: 3px; vertical-align: middle;' />").attr('src', imageURL));
            }
        }
    } catch (err) { MALog(err); }
}

function SubmitCopyTo()
{
    var SelectedFolders = new Array();
    $('#CopyToTree').jstree("get_checked",null,true).each(
        function(index,element) {
            if (!$(element).is('.disabled')) {
                SelectedFolders.push($(element).attr("id") + "~" + $(element).attr("NodeType"));
            }
        }
    );

    //Copy To
    $.each(SelectedFolders, function(index, Folder)
    {
        var FolderSplit = Folder.split("~");
        var SavedQueryParam = $('#copynode').attr('copyid');
        if (FolderSplit[0] == 'CorporateRoot' && !MASystem.User.IsCorporateAdmin) {
            return; //can't copy to corporate if not folder admin
        }

        var processData = {
			ajaxResource : 'MATreeAJAXResources',

			action: 'copy_node',
			copyid : encodeURIComponent(SavedQueryParam),
			copynodetype : $('#copynode').attr("copynodetype"),
			folderid : FolderSplit[0],
			foldernodetype : FolderSplit[1]
        };

	    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
			processData,
			function(json, event){
			    if(event.status)
			    {
                    if(json.success)
                    {  
                        if (NewLayerNavigationEnabled())
                        {
                            if (MALayers.currentFolder == FolderSplit[0])
                            {
                                MALayers.refreshFolder();
                            }
                            showSuccess($('#mapdiv'), 'Successfully copied this layer.');
                            
                        }
                        else
                        {
                            if(json.nodes.length > 0)
                            {
                                $.each(json.nodes, function(index, node)
                                {
                                    var $ParentNode = $('li[id=\'' + FolderSplit[0] + '\']');
                                    
                                    if($.jstree._reference('#SQTree')._is_loaded($ParentNode))
                                    {
                                        addNodeToTree(node,$ParentNode);
                                        showSuccess($('#mapdiv'), 'Successfully copied this layer.');
                                    }
                                }); 
                            }   
                        }
                        
                            
                    }
                    else
                    {
                        //NotifyError("Error Copying Node",json.error);
                        Debug("Error Copying Node " + json.error);
                        if (json.error)
                            NotifyError("Error Copying Node",json.error);
                        else
                            NotifyError("Error Copying Node",json.message);
                    }
			    } else {
			        var errorMessage = getProperty(event,'message',false) || 'Unknown Error';
			       
			        if(errorMessage.indexOf('Too many SOQL queries: 101') > -1 || errorMessage.indexOf('Too many DML statements') > -1)
			        {
			            errorMessage = 'The amount of layers and subfolders is too large to handle in one operation. Please reduce the number and try again.'
			        } 
			 
			        
			        showError($('#mapdiv'), errorMessage,4000);
			        Debug("Error Copying Node " + event);
			    }
            }
        );
    });

    ClosePopupWindow();
}

function SubmitMoveTo()
{
    var SelectedFolders = new Array();
    $('#CopyToTree').jstree("get_checked",null,true).each(
        function(index,element) {
            if (!$(element).is('.disabled')) {
                SelectedFolders.push($(element).attr("id") + "~" + $(element).attr("NodeType"));
            }
        }
    );

    //Copy To
    $.each(SelectedFolders, function(index, Folder)
    {
        var FolderSplit = Folder.split("~");
        if (FolderSplit[0] == 'CorporateRoot' && !MASystem.User.IsCorporateAdmin) {
            return; //can't copy to corporate if not folder admin
        }

        var movetype = $('#copynode').attr("movetype");
        var moveidtype = $('#copynode').attr("copyid") + " " + $('#copynode').attr("copynodetype");

        var moveparam = 'sqry';

        if(movetype === 'folder') {
            moveparam = 'folders';
        } else if(movetype === 'marker') {
            moveparam = 'sqry';
        } else if(movetype === 'shape') {
            moveparam = 'territories';
        } else if(movetype === 'favorite') {
            moveparam = 'favorites';
        } else if(movetype === 'datalayer') {
            moveparam = 'datalayers';
        } else if (movetype === 'territory') {
            moveparam = 'territory-layer';
        }

        //show loading
        var $moveLoading = MAToastMessages.showLoading({message:MASystem.Labels.MA_Loading+'...',timeOut:0,extendedTimeOut:0});

        var processData = {
			ajaxResource : 'MATreeAJAXResources',

			action: 'move_node',
			npid : FolderSplit[0],
			npnt : FolderSplit[1]
		};
		processData[moveparam] = moveidtype

	    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
			processData,
			function(json, event){
			    MAToastMessages.hideMessage($moveLoading);
                if(json.success)
                {
                    if (NewLayerNavigationEnabled())
                    {
                        // if (MALayers.currentFolder == FolderSplit[0])
                        // {
                            MALayers.refreshFolder();
                        // }

                    }
                    else
                    {
                        if(json.nodes.length > 0)
                        {
                            $.each(json.nodes, function(index, node)
                            {
                                var $ParentNode = $('li[id=\'' + FolderSplit[0] + '\']');

                                if($.jstree._reference('#SQTree')._is_loaded($ParentNode))
                                {
                                    addNodeToTree(node,$ParentNode);
                                }
                            });
                        }
                    }
                }
                else
                {
                    //NotifyError("Error Copying Node",json.error);
                    Debug("Error Copying Node " + json.error);
                }
            }
        );
    });

    ClosePopupWindow();
}

function addNodeToTree(node, parentNode)
{
    if(node.NodeType == 'PersonalFolder')
    {
        $('#SQTree').jstree('create_node', parentNode, 'inside', {
            attr: {
                id: node.Id,
                rel: node.rel,
                CopyName: node.CopyName,
                NodeType: node.NodeType
            },
            data: node.title
        });
    }
    else if(node.NodeType == 'CorporateFolder')
    {
         $('#SQTree').jstree('create_node', parentNode, 'inside', {
            attr: {
                id: node.Id,
                rel: node.rel,
                CopyName: node.CopyName,
                NodeType: node.NodeType,
                create: node.create,
                modify: node.modify,
                'delete': node['delete'],
                setperm: node.setperm
            },
            data: node.title
        });
    }
    else  if(node.NodeType == 'CorporateSavedQuery')
    {
        $('#SQTree').jstree('create_node', parentNode, 'inside', {
            attr: {
                id: node.Id,
                rel: node.rel,
                CopyName: node.CopyName,
                NodeType: node.NodeType,
                QueryType: node.QueryType,
                IsCustom: node.IsCustom,
                IconColor: node.IconColor,
                modify: node.modify,
                'delete': node['delete']
            },
            data: node.title
        });
    }
    else
    {
        $('#SQTree').jstree('create_node', parentNode, 'inside', {
            attr: {
                id: node.Id,
                rel: node.rel,
                CopyName: node.CopyName,
                NodeType: node.NodeType,
                QueryType: node.QueryType,
                IsCustom: node.IsCustom,
                IconColor: node.IconColor
            },
            data: node.title
        });
    }

    if(node.Children.length > 0)
    {
        $.each(node.Children, function(index, child)
        {
            addNodeToTree(child, $('li[id=\'' + node.Id + '\']'));
        });
    }
}



function CopyNode(node)
{
    if ($('#CopyToTree').data('jstree_instance_id')) {
        $('#CopyToTree').jstree('destroy').empty();
    }

    //Initialize Folder tree for Copy To
    $("#CopyToTree")

        .on('load_node.jstree load_node_json.jstree', function () {
            $('#CopyToTree li').each(function () {
                if (!MASystem.User.IsCorporateAdmin && ($(this).attr('nodetype') == 'CorporateRoot' || ($(this).attr('nodetype') == 'CorporateFolder' && $(this).attr('create') != 'true'))) {
                    $(this).addClass('disabled').find('> a > .jstree-checkbox').addClass('copyto-disabled');
                }
                else if ($(this).attr('nodetype') == 'RoleRoot' || $(this).attr('nodetype') == 'RoleNameFolder') {
                    $(this).addClass('disabled').find('> a > .jstree-checkbox').addClass('copyto-disabled');
                }
            });
        })

        .jstree({
            "json_data" : {
                "data": "",
                "ajax" : {
                    "url" : MA.resources.TreeXML,
                    "data" : function (n) {
                        return {
                            id : n.attr ? n.attr("id") : 0,
                            rand : new Date().getTime(),
                            type: n.attr ? n.attr("NodeType") : 0,
                            types: 'Folder'
                        };
                    }
                }
            },
            "checkbox": {
              real_checkboxes: true,
              real_checkboxes_names: function (n) {
                 var nid = 0;
                 $(n).each(function (data) {
                    nid = $(this).attr("nodeid");
                 });
                 return (["check_" + nid, nid]);
              },
              two_state: true
           },
            "core": {
                "animation" : 10,
                "strings":
                    {
                        "loading" : "Loading...",
                        "new_node" : "New Folder"
                    }

            },
            "plugins" : ["themes","json_data","ui","crrm","types","checkbox"]

        })

    ; //End jstree

    $('#copynode').attr("copyid", node.attr("id"));
    $('#copynode').attr("copynodetype", node.attr("NodeType"));
    $('#copynode').attr("IconColor", node.attr("IconColor"));
    $('#copynode').html('<b>' + htmlEncode(node.attr("copyname")) + '</b>');
    LaunchPopupWindow($('#CopyToPopup'), 300);
}

function EditPermissions(NodeId,CopyName)
{
    VueEventBus.$bus.$emit('open-modal', {
        modal: 'EditPermissionsModal',
        options: {
            nodeId: NodeId,
            folderName: CopyName
        }
    });
}

function createNewFolder () {
    if($('#CreateFolderPopupV2 .folderName').val() == '') {
        $('#CreateFolderPopupV2 .folderName').addClass('error');
        return;
    }
    $('#CreateFolderPopupV2 .saving-wrapper').show();
    var folderObj = $('#CreateFolderPopupV2').data('FolderObj');
    var ParentId = $(folderObj).attr('id')
    var ParentNodeType = $(folderObj).attr('nodetype');
    var FolderName = $('#CreateFolderPopupV2 .folderName').val();

    var personUser = '0';

    if (ParentNodeType == "PersonalFolder" || ParentNodeType == "PersonalRoot" || ParentNodeType == "RoleUserFolder")
    {
        //data.rslt.obj.attr("NodeType", "PersonalFolder");

        if(folderObj.closest('[NodeType = PersonalRoot]')[0] != null)
        {
            personUser = 'user';
        }
        else if(folderObj.closest('[NodeType = RoleUserFolder]')[0] != null)
        {
            personUser = folderObj.closest('[NodeType = RoleUserFolder]').attr("id");
        }
    }

    //append to the end
    var folderPosition = folderObj.find('ul li').length;

    //try to create the folder
    var processData = {
		ajaxResource : 'MATreeAJAXResources',

		action: 'new_folder',
		pid : ParentId,
		name : encodeURIComponent(FolderName),
		pos : folderPosition,
		NodeType: ParentNodeType,
		personUser : personUser
	};

    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
		processData,
		function(json, event){
            if(json.success)
            {
                var $li = $("#SQTree").jstree("create","#" + ParentId,"last",{attr : {id: json.FolderId, NodeType: ParentNodeType, title: FolderName}, data: FolderName},null,true);

                //add other attributes as needed (this is old code, just reproducing what was already there. May not be needed)
                if (ParentNodeType == "PersonalFolder" || ParentNodeType == "PersonalRoot" || ParentNodeType == "RoleUserFolder")
                {
                    $li.attr("NodeType", "PersonalFolder");
                }
                else if (ParentNodeType == "CorporateFolder" || ParentNodeType == "CorporateRoot")
                {
                    $li.attr("NodeType", "CorporateFolder");
                    $li.attr("create",$(folderObj).attr("create"));
                    $li.attr("modify",$(folderObj).attr("modify"));
                    $li.attr("delete",$(folderObj).attr("delete"));
                    $li.attr("setperm",$(folderObj).attr("setperm"));
                }
                else if (ParentNodeType == "RoleFolder" || ParentNodeType == "RoleRoot" || ParentNodeType == "RoleNameFolder")
                {
                    $li.attr("NodeType", "RoleFolder");
                }

                //close the popup window
                ClosePopupWindow();
                var popup = $('#CreateFolderPopupV2').data('popup');
                popup.close();
                $('#CreateFolderPopupV2 .saving-wrapper').hide();

                //scroll to favorite
                $li.effect("highlight", {}, 3000);
            }
            else
            {
                //REMOVE CREATED FOLDER DUE TO ERROR HERE
                $('#CreateFolderPopupV2 .saving-wrapper').hide();
                NotifyError("Error Creating Node in Database",json.error);
                Debug("Error Creating Node in Database " + json.error);
            }
        }
    );
}

function search()
{
    //clear any existing search timeouts
    try { clearTimeout($('#permissions-filters').data('searchTimeout')); } catch (err) { }

    //set a loadmask over the permissions grid
    $('#permissions-grid-wrapper').addClass('permissions-grid-loading');
    $('#permissions-grid-status .status span').text('Searching...');

    //set a search timeout to perform the search when the user is done setting filters
    $('#permissions-filters').data(
        'searchTimeout',
        setTimeout(function () {

            //remove existing data for matching records
            var $permissionsGrid = $('#permissions-grid');
            $permissionsGrid.data('matchingRecords', {});

            //perform the search
            var matchCount = 0;
            var matchingRecords = $permissionsGrid.data('matchingRecords');
            $.each($permissionsGrid.data('records'), function (recordId, record) {

                //remove namespace
                removeNamespace(namespace, record);

                var match = false;

                //Match all results based on filters
                if ($('#permissionsfilter-searchtype').val() == 'Both')
                {
                    if($('#permissionsfilter-searchtext').val() == ''){ match = true; }
                    else if(record.User__c != '' && record.User__c != null)
                    {
                        if(record.User__r.Name.toLowerCase().indexOf($('#permissionsfilter-searchtext').val().toLowerCase()) != -1) { match = true; }
                    }
                    else if(record.ProfileId__c != '' && record.ProfileId__c != null)
                    {
                        if($permissionsGrid.data('profiles')[record.ProfileId__c].name.toLowerCase().indexOf($('#permissionsfilter-searchtext').val().toLowerCase()) != -1) { match = true; }
                    }

                }
                //Match only User results
                else if($('#permissionsfilter-searchtype').val() == 'User' && record.User__c != '' && record.User__c != null)
                {
                    if(record.User__r.Name.toLowerCase().indexOf($('#permissionsfilter-searchtext').val().toLowerCase()) != -1 || $('#permissionsfilter-searchtext').val() == '') { match = true; }
                }
                else if($('#permissionsfilter-searchtype').val() == 'Profile' && record.ProfileId__c != '' && record.ProfileId__c != null)
                {
                    if ($permissionsGrid.data('profiles')[record.ProfileId__c].name.toLowerCase().indexOf($('#permissionsfilter-searchtext').val().toLowerCase()) != -1 || $('#permissionsfilter-searchtext').val() == '' ) { match = true; }
                }

                if(match)
                {
                    //add a record in memory for this match
                    matchingRecords[recordId] = record;
                    matchCount++;
                }
            });

            //hold on to the match count for user later
            $permissionsGrid.data('matchingRecordsCount', matchCount);

            //show page options
            $('#permissions-page option').remove();
            for (var i = 1; i <= Math.ceil(matchCount / pageSize); i++)
            {
                $('#permissions-page').append("<option value='"+i+"'>"+i+"</option>");
            }

            //remove the loadmask
            $('#permissions-grid-wrapper').removeClass('permissions-grid-loading');

            //load the first page of data
            $('#permissions-page').change();

        }, 800)
    );
}

function visibleAreaBatch (options,callback) {
    if(options.rI === options.vI) {
        callback({success:true});
    }
    else {
        if(options.pq.hasClass('DataLayer'))
        {
            var dlOptions = {};
            MADemographicLayer.refreshDataLayer($plottedLayer,dlOptions,function(res) {
                options.pq.removeClass('visibleLoading');
                //let's refresh the next query
                options.rI++;
                options.pq = $('#PlottedQueriesContainer .visibleOnly').eq(options.rI);
                visibleAreaBatch(options,function (res) {
                    //check if all done
                    if(res.success) {
                        if($('#visibleAreaRefeshMap').hasClass('update')) {
                            $('#visibleAreaRefeshMap').removeClass('refreshing update').addClass('ready');
                            $('.visibleAreaRefreshMapText').text('Refresh in this area');
                        }
                        else {
                            //map has not moved show finished
                            $('#visibleAreaRefeshMap').removeClass('refreshing').addClass('finished');
                            $('.visibleAreaRefreshMapText').text('Done');

                            //wait 3 seconds then hide button
                            setTimeout(function() {
                                //if map has moved since we started this process just show the normal button
                                if($('#visibleAreaRefeshMap').hasClass('finished')) {
                                    $('#visibleAreaRefeshMap').removeClass('visible update finished').addClass('ready');
                                }
                            },3000);
                        }
                    }
                });
            });
        }
        else {
            refreshQuery(options.pq).then(function(res) {
                options.pq.removeClass('visibleLoading');
                //let's refresh the next query
                options.rI++;
                options.pq = $('#PlottedQueriesContainer .visibleOnly').eq(options.rI);
                visibleAreaBatch(options,function (res) {
                    //check if all done
                    if(res.success) {
                        if($('#visibleAreaRefeshMap').hasClass('update')) {
                            $('#visibleAreaRefeshMap').removeClass('refreshing update').addClass('ready');
                            $('.visibleAreaRefreshMapText').text('Refresh in this area');
                        }
                        else {
                            //map has not moved show finished
                            $('#visibleAreaRefeshMap').removeClass('refreshing').addClass('finished');
                            $('.visibleAreaRefreshMapText').text('Done');

                            //wait 3 seconds then hide button
                            setTimeout(function() {
                                //if map has moved since we started this process just show the normal button
                                if($('#visibleAreaRefeshMap').hasClass('finished')) {
                                    $('#visibleAreaRefeshMap').removeClass('visible update finished').addClass('ready');
                                }
                            },3000);
                        }
                    }
                });
            });
        }
    }
}

function hideVisibleAreaButton () {
    //loop over queries and see if we need to hide the visibe area button
    var qIndex = $('#PlottedQueriesTable .visibleOnly').length;

    if(qIndex >= 1){
        $('#visibleAreaRefeshMap').addClass('visible');
    }
    else {
        $('#visibleAreaRefeshMap').removeClass('visible');
    }
}

function HideSingleRow(obj)
{
    var isShown = $(obj).find('input').prop('checked');
    var $layer = $(obj.closest('.PlottedRowUnit'));
    var records = $layer.data('records');

    var newMap = null;
    var total = 0;

    if(isShown) {
        newMap = MA.map;
        total = $(obj).find('.totalmarkers-new').text();
    }

    $.each(records, function(index, value) {
        if( value.hasOwnProperty('marker') ) {
            value.marker.setMap(newMap);
        }
    });

    $(obj).find('.visiblemarkers-new').html(total);
}

//options: { id: obj.attr('id'), visibleAreaOnly: false }
function PlotFolder(options)
{
    //send a request to get the ids of all saved queries in this folder
    var processData = {
		ajaxResource : 'MATreeAJAXResources',
		action: 'get_folder_queries',
		id: options.id
	};
	var liveErrorDisplayed = false;

    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
		processData,
		function(response, event) {
            //case 7742
            var data = response.data || [];

            //dynamic que
            var q = async.queue(function (queryOptions, callback) {
                //plot
                MA.Util.plotFolderOptions.continue = false;
                MA.Util.plotFolderOptions.popupVisible = false;
                queryOptions.permissions.showLayers = false;

                // If this Folder to be plotted has any Live Layer, don't plot it for the visible area all option
                if( String(queryOptions.layerType).match(/live/i) && queryOptions.action == 'plot-visible-all')
                {
                    if(!liveErrorDisplayed)
                    {
                        var message = 'Live layers can not be plotted for visible area only.';
                        MAToastMessages.showError({'message':message,timeOut:6000});;
                        liveErrorDisplayed = true;
                    }
                }
                else
                {
                    queryOptions.renderAs = [queryOptions.defaultRenderMode];
                    MAPlotting.analyzeQuery(queryOptions);
                }

                //wait for the user to hit continue or cancel then continue next query
                var plotInt = setInterval(function() {

                    if(MA.Util.plotFolderOptions.continue) {
                        clearInterval(plotInt);
                        clearTimeout(tOut);
                        callback();
                    }

                    if(MA.Util.plotFolderOptions.popupVisible) {
                        clearTimeout(tOut);
                    }

                },500);

                //set a timeout to clear the interval if an unknown error occurs after 15 sec
                var tOut = setTimeout(function(){
                    clearInterval(plotInt);
                    callback();
                },15000);
            });

            //update options if this is corp folder
            options.nodetype = options.nodetype == "CorporateFolder" ? "CorporateSavedQuery" : "PersonalSavedQuery";

            //loop over queries
            var renderAs = options.renderAs;
            for(var i = 0; i < data.length; i++) {
                var query = data[i];
                query = removeNamespace('sma', query);

                //fix for tab names in listview.
                options.name = query.Name;
                options.layerType = getProperty(query, 'BaseObject__r.Type__c');

                var queryOptions = {
                    defaultRenderMode : renderAs,
                    visibleAreaOnly : options.visibleAreaOnly,
                    id : query.Id,
                    permissions : options,
                    layerType: options.layerType,
                    action: options.action,
                    name : options.name
                }
                //get the default render mode for this query
                if(options.renderAs == 'Default') {
                    //plot the saved maker method
                    if(query.AdvancedOptions__c != null) {
                        try {
                            var advOpt = JSON.parse( htmlDecode(query.AdvancedOptions__c) );
                            queryOptions.defaultRenderMode = advOpt.defaultRenderMode || 'Default';
                        }
                        catch (e) {
                            //just plot markers
                            MA.log('Unable to parse advanced options for query id: ' + query.Id);
                        }
                    }
                }

                queryOptions.layerType = getProperty(query, 'BaseObject__r.Type__c');

                // If this Folder to be plotted has any Live Layer, don't plot it for the visible area all option
                if(String(queryOptions.layerType).match(/live/i) && options.action == 'plot-visible-all')
                {
                    if(!liveErrorDisplayed)
                    {
                        var message = 'Live layers can not be plotted for visible area only.';
                        MAToastMessages.showError({'message':message,timeOut:6000});
                        liveErrorDisplayed = true;
                    }
                }
                else
                {
                    //if dynamic do one at a time
                    if(query.Query__c.indexOf(':Dynamic') >= 0) {
                        q.push(queryOptions);
                    }
                    else {
                        options.showLayers = false;
                        options.renderAs = [renderAs];
                        options.id = query.Id;
                        MAPlotting.analyzeQuery(options);
                    }
                }
            }

            //show the layers pane
            if(options.doClick !== undefined) {
                if(options.doClick === true) {
                    $('#tabs-nav-plotted').click();
                }
            } else {
                $('#tabs-nav-plotted').click();
            }
        }
    );

    //send a request to get the ids of all saved territories in this folder
    var processData = {
		ajaxResource : 'MATreeAJAXResources',
		action: 'get_folder_territories',
		id: options.id
	};

    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
		processData,
		function(response, event){
            if(event.status) {
                if(response && response.success) {
        		    var data = response.data || [];

                    var s = async.queue(function (shapeOptions, callback) {
                        if(shapeOptions.sma__CustomGeometry__c) {
                            MACustomShapes.drawV2({ id: shapeOptions.Id }).always(function() {
                                callback();
                            });
                        }
                        else {
                            MA_DrawShapes.init({ id: shapeOptions.Id }).always(function () {
                                callback();
                            });
                        }
                    });

                    s.concurrency = 5;

                    //plot each query
                    $.each(response.data || [], function (index, territory) {
                        s.push(territory);
                        /*if(territory.sma__CustomGeometry__c) {
                            MACustomShapes.drawV2({ id: territory.Id })
                        }
                        else {
                            MA_DrawShapes.init({ id: territory.Id });
                        }*/
                    });
                }
            }
        },{buffer:false,timeout:120000,escape:false}
    );

    //send a request to get the ids of all saved favorites in this folder
    var processData = {
		ajaxResource : 'MATreeAJAXResources',
		action: 'get_folder_favorites',
		id: options.id
	};

    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
		processData,
		function(response, event){
            //plot each query
            $.each(response.data || [], function (index, favorite) {
                PlotFavoriteLocation({ id: favorite.Id, name: favorite.Name });
            });
        }
    );

    //send a request to get the ids of all data layers in this folder
    var processData = {
		ajaxResource : 'MATreeAJAXResources',
		action: 'get_folder_datalayers',
		id: options.id
	};

    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
		processData,
		function(response, event){
            //plot each query
            $.each(response.data || [], function (index, layerData) {
                removeNamespace(namespace, layerData);
                var layerOptions = {
                    action: options.action,
                    id: layerData.Id,
                    type: 'datalayer',
                    name: layerData.Name,
                    description: layerData.Description__c || 'No Description',
                    baseObjectLabel: 'Data Layer',
                    modifiedInfo: layerData.LastModifiedDate,
                    createdInfo: layerData.CreatedDate,
                    nodetype: options.nodetype,
                    create: options.create,
                    delete: options.delete,
                    export: options.export,
                    modify: options.modify,
                    read: options.read,
                    setpermissions: options.setpermissions,
                    folderPath: options.folderPath
                };
                MADemographicLayer.analyzeDataLayer(layerOptions);
            });
        }
    );

    //send a request to get the ids of all ArcGIS layers in this folder
    var processData = {
        ajaxResource: 'MAArcGISAPI',
        securityToken: MASystem.MergeFields.Security_Token,
        action: 'getLayers',
        folderId: options.id
    };
    ArcGIS.ajaxRequest(processData).then(function(response) {
        if (response.success) {
            response.records.forEach(function(record) {
                ArcGIS.plotLayer({
                    id: record.Id,
                    modify: options.modify
                });
            });
        }
    });
}

function ReturnSubMenu()
{
    return BaseObjectsForSubMenu;
}

// returns true if num is an integer or float. Makes up for JavaScript's parseFloat, Number and isNaN shortcomings. trims the input.
function isNum(num) {
    return /^[+-]?\d+(.\d+)?$/.test(num);
}

function DoOnCompleteNewForSavedQry(NodeName,NodeId,baseObjectLabel,ParentNodeId,pNodeType,pIsCustom,pQueryType,pRel,pIsDynamic,advancedOptions)
{
    //Make New Node
    Debug("DoOnCompleteNewForSavedQry");
    if (NewLayerNavigationEnabled())
    {
        MALayers.refreshFolder();
    }
    else
    {
        $("#SQTree").jstree("create","#" + ParentNodeId,"last",{attr : {id: NodeId, advanced: advancedOptions,NodeType: pNodeType, rel: pRel, IsCustom: pIsCustom, title: baseObjectLabel, querytype: pQueryType+(pIsDynamic ? '-Dynamic' : '')}, data: NodeName, QueryType:pQueryType+(pIsDynamic ? '-Dynamic' : '')},null,true);
    }

    //Hide Popup
    ClosePopupWindow();
}

function DoOnCompleteEditSavedQry(NodeName,NodeId,colorAssignmentType,isDynamic,advancedOptions)
{
    //Edit Existing Node
    if (NewLayerNavigationEnabled())
    {
        MALayers.refreshFolder({ moveToSavedTab: false });
    }
    else
    {
        $("#SQTree").jstree('rename_node', '#' + NodeId , NodeName);
        $("#SQTree #"+NodeId)
            .attr('rel', colorAssignmentType == 'Static' ? 'SavedQuery' : 'LegendSavedQuery')
            .attr('advanced',advancedOptions)
            .attr('querytype', (colorAssignmentType == 'Static' ? 'Standard' : 'Legend') + (isDynamic ? '-Dynamic' : ''));

    }


    //Hide Popup
    ClosePopupWindow();
}

/////////////////////////
/////////////////////////



       function ToggleMissingAddressContent(obj)
       {
           /* Deprecate Function*/
            if ($(obj).html() == MASystem.Labels.MAShow)
            {
                $(obj).html(MASystem.Labels.MA_Hide);
            }
            else
            {
                $(obj).html(MASystem.Labels.MA_Show);
            }

            $(obj).parent().next().slideToggle('slow', function() {
                // Animation complete.
            });
       }

        function ExportMissingAddresses(exportAll)
        {
            /* Deprecate Function*/
            //get the list of addresses we need to export depending on whether or not we're exporting all
            var $addressesToExport = exportAll
                ? $('#MissingAddressesContent .missingaddress')
                : $('#MissingAddressesContent .missingaddress-checkbox:checked').closest('.missingaddress');

            //loop through the addresses and compile a clean list to send
            var missingAddresses = [];
            var uniqueMissingAddressesMap = {};
            $addressesToExport.each(function () {

                //make sure we haven't already added this record
                if (uniqueMissingAddressesMap[$(this).data('exportData').recordId]) { return; }

                //add this record
                uniqueMissingAddressesMap[$(this).data('exportData').recordId] = true;
                missingAddresses.push($(this).data('exportData'));

            });


            //create an export form and post it
            $("<form method='POST' action='"+MA.resources.MissingAddressExport+"' target='_blank'></form>").append(
                $("<input type='hidden' name='serializedMissingAddresses' />").attr('value', JSON.stringify(missingAddresses))
            ).appendTo('body').submit().remove();
        }

        function UpdateAddToCampaignButton()
        {
            Debug("Running UpdateAddToCampaignButton");

            var showButton = false;
            $('#PlottedQueriesContainer .PlottedRowUnit').each(function() {

                if ($(this).data('baseObjectName') == 'Contact' || $(this).data('baseObjectName') == 'Lead')
                {
                    showButton = true;
                }
            });

            if (showButton) { $('#AddToCampaignButton').show(400); }
            else { $('#AddToCampaignButton').hide(400); }
        }


var MaxExportSize;
var MaxQuerySize = 2000;

function StartUpJS()
{
    //if lightning experience remove padding
    // if(MASystem.MergeFields.SForceTheme == 'Theme4d') {
    //     //$('body').css('cssText','background-color: #16325c !important; padding: 0px !important;');
    //     $('#mapcontainer').css('left', '15px');
    //     $('#mapcontainer').css('width', 'calc(100% - 15px)');
    // }

    //handle resizing the window
    $(window).resize(function () {
        function doResize() {
            var mapHeight = $('#mapdiv').height();
            var sidebarHeight = $('div#sidebar-content').height();
            //check if lightning theme
            var LightningOffset = 0;
            var offsetHeight = $('#mapdiv').length > 0 ? $('#mapdiv').offset().top : 0;
            if(MASystem.MergeFields.SForceTheme != 'Theme4d') {
                var mapHeight = $('#mapdiv').height() + 23;
                var sidebarHeight = $('div#sidebar-content').height() + 23;
                var offsetHeight = offsetHeight - 24;
            }
            $("#mapdiv, #mapdiv #right-shadow, #mapcontainer, .bodyDiv, .MALoading, .noSidebarCell, .oRight, .sidebarCell").css('height', Math.max(485, $(window).height() - offsetHeight - LightningOffset) + "px");
            $('#sidebarCell').css('maxHeight', Math.max(485, $(window).height() - offsetHeight - LightningOffset) + "px");
            $('#SQTree, #PlottedQueriesTable, #routesCalendar, #Routing-Table, #poiResults').css('height', 'auto');
            $('#SQTree').css('max-height', mapHeight - 135);
            // $('#PlottedQueriesTable').css('max-height', mapHeight - 165);
            $('#routesCalendar').css('max-height', mapHeight - 205);
            $('#Routing-Table').css('max-height', mapHeight - 250);
            $('#searchPlacesQueryOutputBody').css('max-height', mapHeight - 100); //fix firefox scrolling 
            $('div#foldersearch-results-contents').css('min-height', sidebarHeight - 80);
            $('div#foldersearch-results-contents').css('max-height', mapHeight - 110);
            try { routesTabSlider.redrawSlider() } catch (err) {};
        }
        doResize();
        setTimeout(doResize, 200);  //resize again later because sometimes it doesn't take
    }).resize();

    //create map
    MA.map = new google.maps.Map(document.getElementById('mapdiv'), {
        center: { lat: 36.98500309285596, lng: -97.8662109375},
        zoom: 5,
        tilt: 0,
        rotateControl: false,
        panControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
        fullscreenControl: true,
        fullscreenControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
        mapTypeControl: false,
        gestureHandling : 'greedy',
        scaleControl: true
    });

    //remove standard POI functionality
    MA.map.setOptions({
        styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'landscape', elementType: 'labels', stylers: [{ visibility: 'off' }] }
        ],
        draggableCursor : "url("+MASystem.Images.cursors.hand+"), auto"
    });

    MA.map.data.setStyle(function(feature) {
        //check if we have any styling options
        var defaultStyles = {fillColor : '#000000', strokeColor: '#000000', strokeWeight : 3, fillOpacity : 0.2, strokeOpacity: 1};
        var styleOptions = feature.getProperty('styleOptions');

        if(styleOptions) {
            $.extend(defaultStyles,styleOptions);
        }

        return defaultStyles;
    });

    MA.map.data.addListener('click', function(event) {
        if( event.feature.getProperty('parcel') !== undefined ) {
            //could use options.mode for the isMobile
            var clickOptions = {
                isMobile : false
            }
           proximityLayer_Click({ position: event.latLng, type: 'data', feature: event.feature });
        }
    });
    MA.map.data.addListener('rightclick', function(event) {
        if( event.feature.getProperty('parcel') !== undefined ) {
            //could use options.mode for the isMobile
            var clickOptions = {
                isMobile : false
            }
           Shape_Context.call(event.feature, event);
        }
    });
    MA.map.data.addListener('mouseover', function(event) {
        if( event.feature.getProperty('parcel') !== undefined ) {
           this.overrideStyle(event.feature, {fillColor : '#000'});
        }
    });
    MA.map.data.addListener('mouseout', function(event) {
        if( event.feature.getProperty('parcel') !== undefined ) {
           this.revertStyle(event.feature);
        }
    });

    //handle streetview controls
    MA.map.getStreetView().setOptions({
        addressControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
        panControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER }
    });

    //handle bounds changing (various purposes)
    google.maps.event.addListener(MA.map, 'bounds_changed', function (e) {
        //MA.Map.Search.autocomplete.setBounds(MA.map.getBounds());
        MAShapeLayer.ZoomOrDragEvent(e);

        //remove finished class from button and add update class
        $('#visibleAreaRefeshMap').removeClass('finished').addClass('update');

        //if not refreshing change text
        if(!$('#visibleAreaRefeshMap').hasClass('refreshing')) {
            $('.visibleAreaRefreshMapText').text('Refresh layers in this area');
        }

        //check if any visible area queries and button is not already visible or refreshing
        if(!$('#visibleAreaRefeshMap').hasClass('visible') && ($('#PlottedQueriesContainer .visibleOnly').length > 0 || $('#PlottedQueriesContainer .ArcGISLayer').length > 0)) {
            //show the button
            $('#visibleAreaRefeshMap').addClass('visible');
        }
    });


    //add keydragzoom functionality
    MA.map.enableKeyDragZoom();

    //create canvas overlay that will be used for position support
    MA.Map.offsetOverlay = new google.maps.OverlayView();
    MA.Map.offsetOverlay.draw = function() {};
    MA.Map.offsetOverlay.setMap(MA.map);

    //spiderfier to hold markers
    MA.Map.spiderfier = new OverlappingMarkerSpiderfier(MA.map, { keepSpiderfied: true });
    MA.Map.spiderfier.addListener('click', function (marker, e) {
        if (marker.spiderfied || MA.Map.spiderfier.markersNearMarker(marker, true).length == 0) {
            if(marker.type && marker.type === 'dataLayer') {
                MADemographicLayer.getDataLayerMarkerInfo.call(marker , {isMobile: false, layerName: marker.layerName, type: 'marker', key: marker.key});
            }
            else {
                MAPlotting.marker_Click.call(marker, { markerType: 'Marker' });
            }
        }
    });
    MA.Map.spiderfier.addListener('spiderfy', function (markersAffected, markersNotAffected) {
        $.each(markersAffected, function (i, marker) {
            marker.spiderfied = true;
        });
    });
    MA.Map.spiderfier.addListener('unspiderfy', function (markersAffected, markersNotAffected) {
        $.each(markersAffected, function (i, marker) {
            marker.spiderfied = false;
        });
    });

    //add drawing controls to the map
    MA.Map.Drawing.manager = new google.maps.drawing.DrawingManager({
        drawingControl: false,
        drawingControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
            drawingModes: [
                google.maps.drawing.OverlayType.POLYGON,
                google.maps.drawing.OverlayType.CIRCLE,
                google.maps.drawing.OverlayType.RECTANGLE
            ]
        },
        polygonOptions: {
            fillColor: '#22CC22',
            fillOpacity: 0.6,
            strokeColor: '#000000',
            strokeWeight: 4,
            editable: false
        },
        circleOptions: {
            fillColor: '#3083d3',
            fillOpacity: 0.6,
            strokeColor: '#16325C',
            strokeWeight: 4,
            editable: false
        },
        rectangleOptions: {
            fillColor: '#FFC96B',
            fillOpacity: 0.6,
            strokeColor: '#000000',
            strokeWeight: 4,
            editable: false
        }
    });
    MA.Map.Drawing.manager.setMap(MA.map);

    //handle drawing a shape
    google.maps.event.addListener(MA.Map.Drawing.manager, 'overlaycomplete', function (overlayCompleteEvent)
    {
        try {
            MALayers.moveToTab('Plotted');
        }
        catch(e){}
        switch (overlayCompleteEvent.type) {
            case google.maps.drawing.OverlayType.POLYLINE:

                //alert('POLYLINE!!!');

            break;
            case google.maps.drawing.OverlayType.POLYGON:
                addProximityLayer().then(function(proxPolyGonRef) {
                    var $proxLayer = proxPolyGonRef;
                    overlayCompleteEvent.overlay.qid = $proxLayer.data('qid');
                    $proxLayer.data('proxObject', overlayCompleteEvent.overlay);
                    $proxLayer.find('.proximitytype').val('Polygon').change(); // attr('disabled','disabled');
                    $proxLayer.find('.link.showoptions').click();
                    //hide address
                    $proxLayer.find('.js-address-wrapper').addClass('hidden');
                    ChangeVisibilityWhenCircleIsAdded();

                    //handle shape-specific events
                    overlayCompleteEvent.overlay.getPaths().forEach(function (path) {
                        google.maps.event.addListener(path, 'insert_at', ChangeVisibilityWhenCircleIsAdded);
                        google.maps.event.addListener(path, 'set_at', ChangeVisibilityWhenCircleIsAdded);
                        google.maps.event.addListener(path, 'remove_at', ChangeVisibilityWhenCircleIsAdded);
                    });
                    $proxLayer.find('.js-proxOpacity').val('0.6');
                    trackUsage('MapAnything',{action: 'Draw Boundary (Polygon)'});
                });
            break;
            case google.maps.drawing.OverlayType.CIRCLE:

                addProximityLayer().then(function(proxRef) {
                    var $proxLayer = proxRef;
                    overlayCompleteEvent.overlay.qid = $proxLayer.data('qid');
                    $proxLayer.data('proxObject', overlayCompleteEvent.overlay);

                    var circleRadius = overlayCompleteEvent.overlay.getRadius();
                    var circleUnit = 'METERS';
                    //convert drawing to defaults
                    try {
                        circleUnit = getProperty(userSettings,'defaultProximitySettings.unit') || 'MILES';
                        
                        circleRadius = Math.round(circleRadius * unitFactors['METERS'][circleUnit]);
                    }
                    catch(e) {
                        MA.log(e);
                        //just us meters
                    }

                    $proxLayer.find('.prox-option').hide();

                    setTimeout(function() {
                        $proxLayer.find('.js-radiusDistance').val(circleRadius);
                        $proxLayer.find('.js-radiusUnit').val(circleUnit);
                    },100);
                    $proxLayer.find('.js-address-input').val('Lat: '+overlayCompleteEvent.overlay.getCenter().lat()+'\nLong: '+overlayCompleteEvent.overlay.getCenter().lng());
                    $proxLayer.find('.link.showoptions').click();
                    $proxLayer.find('.proximitytype').val('Cirlce');
                    $proxLayer.find('.proximitytype').change(); // attr('disabled','disabled');

                    //handle shape-specific events
                    google.maps.event.addListener(overlayCompleteEvent.overlay, 'center_changed', ChangeVisibilityWhenCircleIsAdded);
                    google.maps.event.addListener(overlayCompleteEvent.overlay, 'radius_changed', ChangeVisibilityWhenCircleIsAdded);
                    $proxLayer.find('.js-proxOpacity').val('0.6');
                    trackUsage('MapAnything',{action: 'Draw Boundary (Circle)'});                     
                });

            break;
            case google.maps.drawing.OverlayType.RECTANGLE:
                addProximityLayer({ fillColor: '#FFC96B', borderColor: '#000000' }).then(function(proxRectangleRef) {
                    var $proxLayer = proxRectangleRef;
                    overlayCompleteEvent.overlay.qid = $proxLayer.data('qid');
                    $proxLayer.find('.proximitytype').val('Polygon').change(); // attr('disabled','disabled');
                    $proxLayer.data('proxObject', overlayCompleteEvent.overlay);
                    $proxLayer.find('.js-address-wrapper').addClass('hidden');
                    $proxLayer.find('.link.showoptions').click();
                    ChangeVisibilityWhenCircleIsAdded();

                    //quick fix for polygon color defaults
                    $proxLayer.find('.color-wrapper .fillcolor')[0].color.fromString('#FFCC66');
                    $proxLayer.find('.color-wrapper .bordercolor')[0].color.fromString('#000000');

                    //handle shape-specific events
                    google.maps.event.addListener(overlayCompleteEvent.overlay, 'bounds_changed', ChangeVisibilityWhenCircleIsAdded);
                    $proxLayer.find('.js-proxOpacity').val('0.6');
                    trackUsage('MapAnything',{action: 'Draw Boundary (Rectangle)'});
                });
            break;
        }

        //handle events
        google.maps.event.addListener(overlayCompleteEvent.overlay, 'click', function (e) {
            proximityLayer_Click({ position: e.latLng, type: overlayCompleteEvent.type, shape: this });
        });
        google.maps.event.addListener(overlayCompleteEvent.overlay, 'rightclick', function (e) {
            Shape_Context.call(this, e);
        });

        if($('#sidebar-content #tabs-nav-plotted').hasClass('tab-open'))
         {
          //do nothing tab already selected
         }
         else
         {
          //click tab to show results
               $('a[href="#tab-plotted"]').click();
         }

        // reset drawing mode
        MA.Map.Drawing.manager.setDrawingMode(null);

        // emit event to change drawing mode to the navBar Vue app. This will make necessary updates to DOM
        window.VueEventBus.$emit('drawing-mode-update', MA.Map.Drawing.manager.getDrawingMode());
    });

    /*****************************************************************
    * Map event listeners
    *****************************************************************/
    // Map Context Menu
    if(!MA.IsMobile) {
        // Hide open context menu
        google.maps.event.addListener(MA.map, 'zoom_changed', function() { try { $('#mapdiv').contextMenu('hide'); window.ContextMenuClick = {}; } catch (err) {} });
        google.maps.event.addListener(MA.map, 'bounds_changed', function() { try { $('#mapdiv').contextMenu('hide'); window.ContextMenuClick = {}; } catch (err) {} });
        google.maps.event.addListener(MA.map, 'mousedown', function() { try { $('#mapdiv').contextMenu('hide'); window.ContextMenuClick = {}; } catch (err) {} });
        // Show map context
        google.maps.event.addListener(MA.map,'rightclick',function(e) { Map_Context.call(this, e); });
    }
    //handle clicking the map
    google.maps.event.addListener(MA.map, 'click', function (e)
    {
        //check for nextclick handlers
        if (MA.events['nextclick'].length > 0) {
            MA.fire('nextclick', e);
            return;
        }

        //remove info bubble
        MA.Map.InfoBubble.hide();

        try { $.vakata.context.hide(); } catch (err) {}
    });
    /*****************************************************************/

    //modify the street view close button
    var streetView = MA.map.getStreetView();
    //disable the original close button
    streetView.setOptions({ enableCloseButton: false });
    //append new close button
    var closeButton = document.querySelector('#closeStreetView');
    streetView.controls[ google.maps.ControlPosition.RIGHT_TOP ].push( closeButton );
    //add new listener
    google.maps.event.addDomListener(closeButton, 'click', function(){
        streetView.setVisible(false);
    });


    //stop propagation of right clicks in the sidebar to avoid the map context menu displaying (unless another context menu target is clicked)
    // $('#sidebar').on('contextmenu', function (e) {
    //     if ($(e.target).closest('.svg-marker-waypoint, .flag').length == 0) {
    //         e.stopPropagation();
    //     }
    // });

    //map is now available for use so fire the mapready event
    MA.fire('mapready');

    /*Initialize Tabs*/
    // $('#tabs-nav').tabs({
    //     remote:true,
    //     activate: function (event, ui)
    //     {
    //         //resize the window to make sure dimensions are correct
    //         $(window).resize();
    //     }
    // });
    // $('#tabs-SavedQry').tabs({remote:true});

    // $('#Routing-Table .waypoints').sortable({
    //     placeholder: 'ui-state-placeholder',
    //     forcePlaceholderSize: true,
    //     cursor: 'move',
    //     items: '.waypoint-row',
    //     handle: '.index',
    //     update: function(ev,ui) {

    //         //relabel
    //         OrderNumbersOnWaypoints();
    //         ClearDirectionsFromMap();
    //     }
    // });


    // $('#TreeTab').click(function(){
    //     SlideToTree();
    // });

    // $('#PlottedQueriesTab').click(function(){
    //     SlideToPlottedQueries();
    // });

    // $('#DirectionsInputTab').click(function(){
    //     SlideToLocations();
    // });

    // $('#DirectionsOutputTab').click(function(){
    //     SlideToDirectionsOutput();
    // });

    // $('#DirectionsOptionsTab').click(function(){
    //     SlideToDirectionsOptions();
    // });

    // $('#SQTree ul').children().css('font-weight', 'bold').find('li').css('font-weight','normal');

    // $.ajaxSetup ({
    //     cache: false
    // });

    // $('#AddressesNotFoundButton').click(function() {
    //     ShowAddressNotFoundPopup();
    // });
    // $('#FavoriteLocationsButton').click(function() {
    //     FavoriteLocationsPopup();
    //     $('#FavTree').jstree('refresh')
    //     $('.favtree li:first a .jstree-icon').click();
    //     $('#FavoriteLocationsPopup .allfav-check').prop('checked', false);
    // });

    /*Initialize Notification Container*/
    $("#container").notify({
        speed: 200,
        expires: false
    });


    /*Initialize Sidebar Actions*/
    // $('#sidebar-button').click(function()
    //     {
    //         $('#sidebar').animate(
    //             {width:'toggle'},
    //             100,
    //             function() {
    //             }
    //         );
    //     }
    // );

    //Get Base Object for Sub Menu
    var processData = {
		ajaxResource : 'MATreeAJAXResources',
		action: 'populate_base_objects'
	};

    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
		processData,
		function(json, event){
            if(json.success)
            {
                BaseObjectsForSubMenu = [];
                $.each(json.records, function (i, record) {

                    //remove namespace
                    removeNamespace(namespace, record);

                    var SubMenuItem = new Object();
                    SubMenuItem["label"] = record.Name__c;
                    SubMenuItem["action"] =  (function(value) {

                        return function(obj) {
                            launchQueryEditor(
                                MA.resources.QueryBuilder+pageSuffix+'?b=::baseObjectId::&f=::folderId::&ft=::folderType::'
                                    .replace('::baseObjectId::', value.Id)
                                    .replace('::folderId::', obj.attr('Id'))
                                    .replace('::folderType::', obj.attr('NodeType'))
                            );
                        }
                    })(record);

                    BaseObjectsForSubMenu.push(SubMenuItem);
                });

                //if we dont have any base objects, display a message for the user
                if (BaseObjectsForSubMenu.length == 0)
                {
                    BaseObjectsForSubMenu = [{ label: 'No base objects available' }];
                }

                //check on loading screen
                $('.MALoading .base-object-loading').addClass('success');
            }
            else
            {
                //NotifyError("Error Populating Context Menu:Base Object List",json.error);
                Debug("Error Populating Context Menu:Base Object List" + json.error);
                BaseObjectsForSubMenu = [{ label: 'Unknown Error' }];
            }
        }
    );

    /**************************
     *
     * Moving this a function to match
     * mobile with desktop, moving to
     * jsHelperFunctions -> getUserSettings()
     *
    ****************************/
    getUserSettings();
    // $.getJSON(MA.resources.User,"action=get_user_prefs&id=" + UserId,function(json)...

    processMapIt();

    //check on loading screen
    $('.MALoading .map-loading').addClass('success');
}


function ChangeDrawingManagerMode(options)
{
    /**
        options = {
            element: DOMElement Object, // DOM element that may have been clicked to get to this point
            mode: STRING, // drawing tool mode,
            drawingToolsButtonsClassName: STRING // class name of drawing tools buttons so they can be easily selected and manipulated if needed
        }
    **/
    options = options || {};

    switch(options.mode)
    {
        case 'hand':
            MA.Map.Drawing.manager.setDrawingMode(null);
            break;
        case 'polygon':
            MA.Map.Drawing.manager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
            break;
        case 'circle':
            MA.Map.Drawing.manager.setDrawingMode(google.maps.drawing.OverlayType.CIRCLE);
            break;
        case 'rectangle':

            MA.Map.Drawing.manager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
            break;
        default:
            MA.Map.Drawing.manager.setDrawingMode(null);
    }
}


// JavaScript Document
function ClearExport()
{
    if (confirm('You are about to delete all exports, do you which to continue?'))
    {
        DeleteExportsAF();
    }
}

function DoExport()
{
    if (userSettings.maxExportSize > 0)
    {
        if ($('#ExportName').val() == '')
        {
            showError($('#mapdiv').parent(), 'Please enter an export name');
        }
        else
        {
            if ($('#PlottedQueriesContainer .PlottedRowUnit').length > 0)
            {
                window.setTimeout(function() { LaunchPopupWindow($('#LoadingPopup'), 300); }, 0);

                //Pause while loading window opens
                window.setTimeout(function(){  StartExport(); }, 100);
            }
            else
            {
                showError($('#mapdiv').parent(), 'No visible markers');
            }
        }
    }
    else
    {
        showError($('#mapdiv').parent(), 'You do not have permission to export');
    }
}

function StartExport()
{
    //Debug("VisibleQueries: " + $('#PlottedQueriesContainer .PlottedRowUnit').length);

    var ExportName = $('#ExportName').val();

    //Debug("Export Name: " + ExportName);
    var ExportRows = new Array();

    var TotalExportSize = 1;

    $('#PlottedQueriesContainer .PlottedRowUnit').each(function() {

        var $plottedQuery = $(this);
        var addressFields = $plottedQuery.data('addressFields');
        var queryData =$plottedQuery.data();
        //Enter Headers Row
        var ExportHeaderRow = new Object();

        $.each($(this).data('tooltips'), function (index, tooltip) {
            if ( (/tooltip/i).test(tooltip.TooltipType) ) {
                ExportHeaderRow['Tooltip'+(index + 1)+'__c'] = tooltip.FieldLabel;
            }
        });

        ExportRows.push(addNamespace(namespace, ExportHeaderRow));
        var queryName = $plottedQuery.data('savedQueryName') || $plottedQuery.find('.basicinfo-name').text();
        var queryObj = $plottedQuery.data('baseObjectLabel') || $plottedQuery.find('.basicinfo-baseobjectname').text();;
        $.each($(this).data('records'), function(index, record) {

            if (!(record.isVisible || record.isClustered || record.isScattered))
            {
                //this record is not currently visible so skip it
                return;
            }
            else if (TotalExportSize <= userSettings.maxExportSize)
            {
                ExportRows.push(
                    addNamespace(namespace, {
                        RecordId__c          : record.Id,
                        SavedQueryName__c    : queryName,
                        Latitude__c          : getProperty(record,'location.coordinates.lat'),
                        Longitude__c         : getProperty(record,'location.coordinates.lng'),
                        ObjectType__c        : queryObj,
                        Street__c            : getProperty(record, addressFields.street),
                        City__c              : getProperty(record, addressFields.city),
                        State__c             : getProperty(record, addressFields.state),
                        Zip__c               : getProperty(record, addressFields.zip),
                        Country__c           : getProperty(record, addressFields.country),
                        Tooltip1__c          : queryData.tooltips[0] == undefined ? '' : formatTooltip(record,queryData.tooltips[0]).toString().substring(0, 255),
                        Tooltip2__c          : queryData.tooltips[1] == undefined ? '' : formatTooltip(record,queryData.tooltips[1]).toString().substring(0, 255),
                        Tooltip3__c          : queryData.tooltips[2] == undefined ? '' : formatTooltip(record,queryData.tooltips[2]).toString().substring(0, 255),
                        Tooltip4__c          : queryData.tooltips[3] == undefined ? '' : formatTooltip(record,queryData.tooltips[3]).toString().substring(0, 255),
                        Tooltip5__c          : queryData.tooltips[4] == undefined ? '' : formatTooltip(record,queryData.tooltips[4]).toString().substring(0, 255),
                        Tooltip6__c          : queryData.tooltips[5] == undefined ? '' : formatTooltip(record,queryData.tooltips[5]).toString().substring(0, 255),
                        Tooltip7__c          : queryData.tooltips[6] == undefined ? '' : formatTooltip(record,queryData.tooltips[6]).toString().substring(0, 255),
                        Tooltip8__c          : queryData.tooltips[7] == undefined ? '' : formatTooltip(record,queryData.tooltips[7]).toString().substring(0, 255),
                        Tooltip9__c          : queryData.tooltips[8] == undefined ? '' : formatTooltip(record,queryData.tooltips[8]).toString().substring(0, 255),
                        Tooltip10__c         : queryData.tooltips[9] == undefined ? '' : formatTooltip(record,queryData.tooltips[9]).toString().substring(0, 255),
                        Tooltip11__c         : queryData.tooltips[10] == undefined ? '' : formatTooltip(record,queryData.tooltips[10]).toString().substring(0, 255),
                        Tooltip12__c         : queryData.tooltips[11] == undefined ? '' : formatTooltip(record,queryData.tooltips[11]).toString().substring(0, 255),
                        Tooltip13__c         : queryData.tooltips[12] == undefined ? '' : formatTooltip(record,queryData.tooltips[12]).toString().substring(0, 255),
                        Tooltip14__c         : queryData.tooltips[13] == undefined ? '' : formatTooltip(record,queryData.tooltips[13]).toString().substring(0, 255),
                        Tooltip15__c         : queryData.tooltips[14] == undefined ? '' : formatTooltip(record,queryData.tooltips[14]).toString().substring(0, 255)
                    })
                );

                TotalExportSize++;
            }
            else
            {
                Debug("Above MaxExportSize");
                MAToastMessages.showWarning({message:'Export Warning',subMessage:'The total number of rows to be exported is above the max allowed, Only '+userSettings.maxExportSize+' rows will be exported.',timeOut:6000});
                return false;
            }
        });
    });

    //start by creating an export, then add rows
    var processData = {
        ajaxResource : 'MAExportAJAXResources',
        action: 'create_export',
        exportName: ExportName
    };

    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
        processData,
        function(res, event){
            if(event.status) {
                if(res.success) {
                    //now let's add some rows
                    var data = res.data || {};
                    var exportId = data.id;
                    if(exportId != '' && exportId != null) {
                        var batchableRows = MA.Util.createBatchable(ExportRows,200);

                        //do to size restraints, batch out our rows
                        var eq = async.queue(function (options, callback) {


                            Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                                options,
                                function(res, event){
                                    callback();
                                    if(event.status) {
                                        if(!res.success) {
                                            //just log the error and continue adding rows
                                            MA.log(res);
                                        }
                                    }
                                },{buffer:false,timeout:12000,escape:false}
                            );
                        });

                        //add to que
                        for(var i = 0; i < batchableRows.length; i++) {
                            var rows = batchableRows[i];

                            var MyJSObject = {
                                ExportName: ExportName,
                                ExportRows: rows
                            };

                            var opt = {
                                exportId : exportId,
                                MyJSObject: JSON.stringify(MyJSObject),
                                action: 'add_export_rows',
                                ajaxResource : 'MAExportAJAXResources'
                            }
                            eq.push(opt,function(res){});
                        }

                        eq.concurrency = 5;

                        eq.drain = function () {
                            ClosePopupWindow();
                            PopulateMAExportsAF();
                        };
                    }
                    else {
                        ClosePopupWindow();
                        NotifyError("Error Exporting!", 'Unable to create the export.');
                    }
                }
                else {
                    ClosePopupWindow();
                    NotifyError("Error Exporting!", res.error);
                }
            }
            else {
                ClosePopupWindow();
                NotifyError("Error Exporting!", 'The export may be too large');
                MA.log(res);
            }
        },{buffer:false,timeout:12000,escape:false}
    );

}

function DoGenericExport(options) {

    /*
    var options = {
        name: string,
        type: 'bad address' || 'listview',
        queryId: string,
        recordIds: array
    };
    */


    if (userSettings.maxExportSize > 0)
    {
        if ($('#PlottedQueriesContainer .PlottedRowUnit').length > 0)
        {
            window.setTimeout(function() { LaunchPopupWindow($('#LoadingPopup'), 300); }, 0);

            //Pause while loading window opens
            window.setTimeout(function(){  StartExport(); }, 100);
        }
        else
        {
            showError($('#mapdiv').parent(), 'No visible markers');
        }
    }
    else
    {
        showError($('#mapdiv').parent(), 'You do not have permission to export');
    }
}

function FormatPicklistFieldValue(str)
{
    return  ((str == null) ? null : str.replace(/\s/g,""));
}

function RemoveMarker(pMarker, options)
{
    options = $.extend({ updateQueryInfo: true }, options);

    //keep track of record info
    var record = pMarker.record;
    var $plottedQuery = record.plottedQuery;

    //delete record
    delete $plottedQuery.data('records')[record.record.Id];

    //remove any markers from the map
    if ($plottedQuery.find('.renderButtons-button.markers').is('.on') && record.marker && record.isVisible) {
        record.marker.setMap(null);
    }
    if ($plottedQuery.find('.renderButtons-button.cluster').is('.on') && record.clusterMarker && record.isClustered) {
        $plottedQuery.data('macluster_clusterGroup').removeMarker(record.clusterMarker);
    }
    if ($plottedQuery.find('.renderButtons-button.scatter').is('.on') && record.scatterMarker && record.isScattered) {
        record.scatterMarker.setMap(null);
    }

    if (options.updateQueryInfo) {
        updateQueryInfo($plottedQuery);
    }

    //listview stuff
    if( $plottedQuery.data().hasOwnProperty('recordList') ) {
        var popIndexes = [];

        $.each($plottedQuery.data('recordList'), function(i,v) {
            if(v.recordId === record.record.Id) {
                //can have multiples
                popIndexes.push(i);
            }
        });

        if(popIndexes.length > 0) {
            var len = popIndexes.length;

            for(var ii=0; ii<len; ii++) {
                var popIndex = popIndexes[ii];
                $plottedQuery.data('recordList').pop(popIndex);
            }
        }
    }

    //refresh the data in the listview
    MAListView.DrawTab({ layerId: pMarker.qid, isSelectedTab: false, isExport: false });
}

//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
function ToggleLegendContent(Obj)
{
     $(Obj).parent().parent().find('#LegendDiv_Content').toggle();

     if ($(Obj).html() == '-- '+MASystem.Labels.MA_Hide_Legend+' --')
     {
         $(Obj).html('-- '+MASystem.Labels.MA_Show_Legend+' --');
     }
     else
     {
         $(Obj).html('-- '+MASystem.Labels.MA_Hide_Legend+' --');
     }
}

function ShowMoreOrLessOnLegendDiv(Obj)
{
    //MoreOrLessLink


    var $ContentDiv = $(Obj).parent().parent();

    if ($(Obj).html() == '-- '+MASystem.Labels.MA_More+' --')
    {
        $(Obj).html('-- '+MASystem.Labels.MA_Less+' --');
    }
    else
    {
        $(Obj).html('-- '+MASystem.Labels.MA_More+' --');
    }

    $ContentDiv.find('table').find('#CountIsZero').toggle();
}


function LegenedCheckboxClicked(ElementObj)
{
    try
    {
        Debug("Running checkboxClicked");
        var QryIdArray = ElementObj.value.split("_");


        if (ProcessedSavedQueries[QryIdArray[0]] != null)
        {
            if (ElementObj.checked)
            {
                ProcessedSavedQueries[QryIdArray[0]].AddLegendMarkers(QryIdArray[1]);
            }
            else
            {
                ProcessedSavedQueries[QryIdArray[0]].RemoveLegendMarkers(QryIdArray[1]);
            }
        }
    }
    catch (e)
    {
        Debug("Error1 :" + e.message);
        HideLoadingDialog();
    }
}

function GoToHomePosition()
{
    if (userSettings.defaultMapSettings.latitude == undefined && userSettings.defaultMapSettings.longitude == undefined && userSettings.defaultMapSettings.zoomLevel == undefined && userSettings.defaultMapSettings.mapType == undefined)
    {
        NotifyError(MASystem.MergeFields.MAHomeSetInfoLabel);
    }
    else
    {

        if (userSettings.defaultMapSettings.latitude != undefined && userSettings.defaultMapSettings.longitude != undefined) {
            MA.map.setCenter(new google.maps.LatLng(userSettings.defaultMapSettings.latitude, userSettings.defaultMapSettings.longitude));
            MA.map.setZoom(userSettings.defaultMapSettings.zoomLevel || MA.map.getZoom());

        }
    }
}

/********************************
*   Create Record Functions
*********************************/
function CreateRecord_Launch(options)
{
    $('#CreateRecordPopup .createrecord-step').hide().first().show();
    $('#createrecord-recordtype').closest('.createrecord-formitem').hide();
    $('#createrecord-fieldset-errors').hide();
    $('#CreateRecordPopup .createrecord-step').hide().first().show();
    $('#createrecord-loadmask').show();
    LaunchPopupWindow($('#CreateRecordPopup'), 400);

    var $objectPicklist = $('#createrecord-object').empty();

    var processData = {
    	ajaxResource : 'MATooltipAJAXResources',

    	action			: 'getClick2CreateSettings'
    };

    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
    	processData,
    	function(response, event){
            if (response.success) {
                userSettings.click2CreateSettings = $.extend({ settings: MA.Util.removeNamespace(response.settings) }, options);
                $.each(userSettings.click2CreateSettings.settings, function (objName, setting) {
                    if (setting.record[options.type+'Enabled__c']) {
                        $objectPicklist.append($('<option />').attr('value', objName).text(setting.objectLabel));
                    }
                });

                if ($objectPicklist.find('option').length == 0) {
                    CreateRecord_Cancel();
                    alert('Your organization has no Click2Create settings.  Please contact an admin for support.')
                }
                else {
                    $objectPicklist.change();
                }

                userSettings.click2CreateSettings.geoResponse = null;
                if (options.place) {
                    var resultMap = {};
                    $.each(options.place.address_components, function (i, component) {
                        $.each(component.types, function (j, type) {

                            //Add in the state code
                            if(type === 'administrative_area_level_1') {
                                resultMap['state_code'] = component['short_name'];
                            }

                            //Add in the country code
                            if(type === 'country') {
                                resultMap['country_code'] = component['short_name'];
                            }

                            resultMap[type] = component['long_name'];
                        });
                    });
                    userSettings.click2CreateSettings.geoResponse = {
                        result: {
                            IsBadAddress        : false,
                            Label               : 'ROOFTOP',
                            Relevance           : 100,
                            Latitude            : options.place.geometry.location.lat(),
                            Longitude           : options.place.geometry.location.lng(),
                            FormattedAddress    : options.place.formatted_address,
                            HouseNumber         : resultMap['street_number'] || '',
                            Street              : resultMap['route'] || '',
                            City                : resultMap['locality'] || '',
                            County              : resultMap['administrative_area_level_2'] || '',
                            State               : resultMap['administrative_area_level_1'] || '',
                            PostalCode          : resultMap['postal_code'] || '',
                            District            : resultMap['neighborhood'] || '',
                            Country             : resultMap['country'] || '',
                            StateCode           : resultMap['state_code'] || '',
                            CountryCode         : resultMap['country_code'] || ''
                        }
                    };
                    //complete street address (house number + route + subpremise)
                    var completeStreetAddressParts = [];
                    if (resultMap['street_number']) {
                        completeStreetAddressParts.push(resultMap['street_number']);
                    }
                    if (resultMap['route']) {
                        completeStreetAddressParts.push(resultMap['route']);
                    }
                    if (resultMap['subpremise']) {
                        completeStreetAddressParts.push('#' + resultMap['subpremise']);
                    }
                    userSettings.click2CreateSettings.geoResponse.result['CompleteStreetAddress'] = completeStreetAddressParts.join(' ');
                }
            }
        }
    );
}
function CreateRecord_Object_Change()
{
    $('#createrecord-loadmask').show();
    $('#createrecord-recordtype').closest('.createrecord-formitem').hide();

    var setting = userSettings.click2CreateSettings.settings[$('#createrecord-object').val()];
    var $recordTypePicklist = $('#createrecord-recordtype').empty();
    var totalType = 0;
    var masterInfo = {
        html : null,
        found : false
    };
    $.each(setting.recordTypes, function (i, recordType) {

        if (recordType.available)
        {
            totalType++;
            if (recordType.recordTypeId == '012000000000000AAA')
            {
                if (setting.recordTypes.length > 1)
                {
                    //not sure why we are not showing master... if nothing is avaiable from the total, nothing get shown
                    //addressing above with totalType count.
                    masterInfo.found = true;
                    masterInfo.html = $('<option />').attr('value', recordType.recordTypeId).text(recordType.name + ' (System Default)');
                }
                else
                {
                    $recordTypePicklist.append($('<option />').attr('value', recordType.recordTypeId).text(recordType.name + ' (System Default)'));
                }

            }
            else
            {
                $recordTypePicklist.append($('<option />').attr('value', recordType.recordTypeId).text(recordType.name));
            }

            if (recordType.defaultRecordTypeMapping)
            {
                $recordTypePicklist.val(recordType.recordTypeId);
            }
        }

        /*
        if (recordType.available && recordType.recordTypeId != '012000000000000AAA') {
            $recordTypePicklist.append($('<option />').attr('value', recordType.recordTypeId).text(recordType.name));
            if (recordType.defaultRecordTypeMapping) {
                $recordTypePicklist.val(recordType.recordTypeId);
            }
        }
        */
    });

    if(masterInfo.found && totalType == 1) {
        //we need to put in the master record
        if(masterInfo.html != null) {
            $recordTypePicklist.append(masterInfo.html);
        }
    }



    if ($recordTypePicklist.find('option').length > 1) {
        $recordTypePicklist.closest('.createrecord-formitem').show();
    }


    $('#createrecord-loadmask').hide();
}
function CreateRecord_Step1_Continue()
{


    var type = userSettings.click2CreateSettings.type;
    var setting = userSettings.click2CreateSettings.settings[$('#createrecord-object').val()];

    var recordTypeId = $('#createrecord-recordtype').val();

    var fieldSetName = 'missing';

    if (setting.record.FieldSetOptions__c != undefined)
    {
        var FieldSetOptionsArray = JSON.parse(setting.record.FieldSetOptions__c);

        $.each(FieldSetOptionsArray, function (i, recordType) {
            if (recordTypeId == recordType.RecordTypeId)
            {
                if (type == "MyPosition")
                {
                    fieldSetName = recordType.MyPositionFieldSetAPIName;
                }
                else if (type == "POI")
                {
                    fieldSetName = recordType.POIFieldSetAPIName;
                }
            }


        });

    }
    else
    {
        fieldSetName = userSettings.click2CreateSettings.settings[$('#createrecord-object').val()].record[userSettings.click2CreateSettings.type+'FieldSet__c'];
    }




    if (fieldSetName == 'missing')
    {
        alert('Unable to find Field Set, please contact your administrator');
    }
    else
    {

        $('#CreateRecordPopup .createrecord-step').hide();
        $('#createrecord-step2').show();
        $('#createrecord-loadmask').show();
        var platformOverride = true;
        if(MA.isMobile) {
            platformOverride = getProperty( (MASystem || {}), 'Organization.EnableMobileLookupFields') || false;
        }
        $("#createrecord-fieldset").html('Loading...').load(MA.resources.Click2Create, "sobject=" + $('#createrecord-object').val() + '&fieldset=' + fieldSetName + '&recordtypeid=' + (recordTypeId || '') + '&platform=' + (platformOverride ? 'desktop' : 'tablet'), function () {
            function reverseGeocodeComplete (geoResponse) {
                if (userSettings.click2CreateSettings.type == 'MyPosition') {
                    try { $('#createrecord-fieldset .fieldInput[data-field="'+setting.record['MyPositionName__c']+'"]').find('.get-input').val(userSettings.click2CreateSettings.name); } catch (err) {}
                    try { $('#createrecord-fieldset .fieldInput[data-field="'+setting.record['DefaultField__c']+'"]').find('.get-input').val(setting.record['MyPositionDefaultValue__c']); } catch (err) {}
                }
                else if (userSettings.click2CreateSettings.type == 'POI') {
                    try { $('#createrecord-fieldset .fieldInput[data-field="'+setting.record['POIName__c']+'"]').find('.get-input').val(userSettings.click2CreateSettings.name); } catch (err) {}
                    try { $('#createrecord-fieldset .fieldInput[data-field="'+setting.record['POIPhone__c']+'"]').find('.get-input').val(userSettings.click2CreateSettings.phone || ''); } catch (err) {}
                    try { $('#createrecord-fieldset .fieldInput[data-field="'+setting.record['POIWebsite__c']+'"]').find('.get-input').val(userSettings.click2CreateSettings.website || ''); } catch (err) {}
                    try { $('#createrecord-fieldset .fieldInput[data-field="'+setting.record['DefaultField__c']+'"]').find('.get-input').val(setting.record['POIDefaultValue__c']); } catch (err) {}
                }
                else if (userSettings.click2CreateSettings.type == 'MapClick') {

                }
                try { $('#createrecord-fieldset .fieldInput[data-field="'+setting.record[type+'Street__c']+'"]').find('.get-input').val(geoResponse.result.CompleteStreetAddress); } catch (err) {}
                try { $('#createrecord-fieldset .fieldInput[data-field="'+setting.record[type+'City__c']+'"]').find('.get-input').val(geoResponse.result.City); } catch (err) {}
                try { $('#createrecord-fieldset  .fieldInput[data-field="'+setting.record[type+'State__c']+'"]').find('.get-input').val(geoResponse.result.State); } catch (err) {}
                try { $('#createrecord-fieldset  .fieldInput[data-field="'+setting.record[type+'PostalCode__c']+'"]').find('.get-input').val(geoResponse.result.PostalCode); } catch (err) {}
                try { $('#createrecord-fieldset  .fieldInput[data-field="'+setting.record[type+'Country__c']+'"]').find('.get-input').val(geoResponse.result.Country); } catch (err) {}
                try { $('#createrecord-fieldset  .fieldInput[data-field="'+setting.record[type+'Latitude__c']+'"]').find('.get-input').val(userSettings.click2CreateSettings.position.lat()); } catch (err) {MA.log(err);}
                try { $('#createrecord-fieldset  .fieldInput[data-field="'+setting.record[type+'Longitude__c']+'"]').find('.get-input').val(userSettings.click2CreateSettings.position.lng()); } catch (err) {}
                $('#createrecord-loadmask').hide();
            }

            if (userSettings.click2CreateSettings.geoResponse) {
                reverseGeocodeComplete(userSettings.click2CreateSettings.geoResponse);
            }
            else {
                MA.Geocoding.reverseGeocode({ latLng: userSettings.click2CreateSettings.position }, function (geoResponse) {
                    userSettings.click2CreateSettings.geoResponse = geoResponse;
                    reverseGeocodeComplete(geoResponse);
                });
            }
        });
    }
}
function CreateRecord_Step2_Continue()
{
    $('#createrecord-loadmask').show();

    //start collecting field values starting with default fields
    var geoResponse = userSettings.click2CreateSettings.geoResponse;
    var setting = userSettings.click2CreateSettings.settings[$('#createrecord-object').val()];
    var type = userSettings.click2CreateSettings.type;
    var fields = {};

    var FieldsFoundArray = [];

    //now grab fields from the field set
    $('#createrecord-fieldset [class^="field::"]').each(function ()
    {
        var fieldName = $(this).attr('data-field');
        var fieldType = $(this).attr('data-type');

        FieldsFoundArray.push(fieldName);

        var value = '';
        if(fieldType == 'picklist') {
            //find the select value
            value = $(this).find('select').val();
        }
        else if (fieldType == 'reference')
        {
            if($(this).find('select').length == 0 && $(this).find('input').val() != '000000000000000')
            {
                value = $(this).find('input').val();
            }
            else if($(this).find('select').length == 1 && $(this).find('span.lookupInput').length == 1)
            {
                value = $(this).find('input').val();
            }
            else
            {
                value = $(this).find('select').val();
            }
        }
        else
        {
            value = $(this).find('.get-input').val();
        }

        //if(value != '' && value != undefined)
        if(value != undefined)
        {
            fields[fieldName] = value;
        }
    });


    //Add Default values if they aren't already present on the form

    if (!MA.Util.isBlank(setting.record.DefaultField__c) && !MA.Util.isBlank(setting.record[type+'DefaultValue__c']) && $.inArray(setting.record[type+'DefaultValue__c'],FieldsFoundArray) == -1) {
        fields[setting.record.DefaultField__c] = setting.record[type+'DefaultValue__c'];
    }


    if (userSettings.click2CreateSettings.type == 'MyPosition')
    {
        if (!MA.Util.isBlank(setting.record['MyPositionName__c']) && $.inArray(setting.record['MyPositionName__c'],FieldsFoundArray) == -1  ) { fields[setting.record['MyPositionName__c']] = userSettings.click2CreateSettings.name; }
        if (!MA.Util.isBlank(setting.record['DefaultField__c']) && !MA.Util.isBlank(setting.record['DefaultField__c'])) { fields[setting.record['DefaultField__c']] = setting.record['MyPositionDefaultValue__c']; }
    }
    else if (userSettings.click2CreateSettings.type == 'POI')
    {
        if (!MA.Util.isBlank(setting.record['POIName__c']) && $.inArray(setting.record['POIName__c'],FieldsFoundArray) == -1) { fields[setting.record['POIName__c']] = userSettings.click2CreateSettings.name; }
        if (!MA.Util.isBlank(setting.record['POIPhone__c']) && $.inArray(setting.record['POIPhone__c'],FieldsFoundArray) == -1) { fields[setting.record['POIPhone__c']] = userSettings.click2CreateSettings.phone || ''; }
        if (!MA.Util.isBlank(setting.record['POIWebsite__c']) && $.inArray(setting.record['POIWebsite__c'],FieldsFoundArray) == -1) { fields[setting.record['POIWebsite__c']] = userSettings.click2CreateSettings.website || ''; }
        if (!MA.Util.isBlank(setting.record['DefaultField__c']) && !MA.Util.isBlank(setting.record['DefaultField__c'])) { fields[setting.record['DefaultField__c']] = setting.record['POIDefaultValue__c']; }
        if (!MA.Util.isBlank(setting.record['POIStateShort__c']) && !MA.Util.isBlank(setting.record['POIStateShort__c'])) { fields[setting.record['POIStateShort__c']] = geoResponse.result.StateCode; }
        if (!MA.Util.isBlank(setting.record['POICountryShort__c']) && !MA.Util.isBlank(setting.record['POICountryShort__c'])) { fields[setting.record['POICountryShort__c']] = geoResponse.result.CountryCode; }
    }

    //add address fields
    if (setting.record[type+'Street__c'] && $.inArray(setting.record[type+'Street__c'],FieldsFoundArray) == -1) { fields[setting.record[type+'Street__c']] = geoResponse.result.CompleteStreetAddress; }
    if (setting.record[type+'City__c'] && $.inArray(setting.record[type+'City__c'],FieldsFoundArray) == -1) { fields[setting.record[type+'City__c']] = geoResponse.result.City; }
    if (setting.record[type+'State__c'] && $.inArray(setting.record[type+'State__c'],FieldsFoundArray) == -1) { fields[setting.record[type+'State__c']] = geoResponse.result.State; }
    if (setting.record[type+'PostalCode__c'] && $.inArray(setting.record[type+'PostalCode__c'],FieldsFoundArray) == -1) { fields[setting.record[type+'PostalCode__c']] = geoResponse.result.PostalCode; }
    if (setting.record[type+'Country__c'] && $.inArray(setting.record[type+'Country__c'],FieldsFoundArray) == -1) { fields[setting.record[type+'Country__c']] = geoResponse.result.Country; }
    if (setting.record[type+'Latitude__c'] && $.inArray(setting.record[type+'Latitude__c'],FieldsFoundArray) == -1) { fields[setting.record[type+'Latitude__c']] = userSettings.click2CreateSettings.position.lat(); }
    if (setting.record[type+'Longitude__c'] && $.inArray(setting.record[type+'Longitude__c'],FieldsFoundArray) == -1) { fields[setting.record[type+'Longitude__c']] = userSettings.click2CreateSettings.position.lng(); }




    //convert fields to an array (this used to be the structure so for now it's easier to just convert back)
    var fieldsArr = [];
    $.each(fields, function (name, val) {
        fieldsArr.push({ name: name, value: val });
    });
    fields = fieldsArr;

    var setting = userSettings.click2CreateSettings.settings[$('#createrecord-object').val()];
    var recordTypeId = $('#createrecord-recordtype').val();
    var type = userSettings.click2CreateSettings.type;

    var fieldSetName = 'missing';

    if (setting.record.FieldSetOptions__c != undefined)
    {
        var FieldSetOptionsArray = JSON.parse(setting.record.FieldSetOptions__c);

        $.each(FieldSetOptionsArray, function (i, recordType) {
            if (recordTypeId == recordType.RecordTypeId)
            {
                if (type == "MyPosition")
                {
                    fieldSetName = recordType.MyPositionFieldSetAPIName;
                }
                else if (type == "POI")
                {
                    fieldSetName = recordType.POIFieldSetAPIName;
                }
            }


        });

    }
    else
    {
        fieldSetName = userSettings.click2CreateSettings.settings[$('#createrecord-object').val()].record[userSettings.click2CreateSettings.type+'FieldSet__c'];
    }

    //create record
    var processData = {
    	ajaxResource : 'MATooltipAJAXResources',

    	action			: 'createRecord',
    	sobject: $('#createrecord-object').val(),
        recordTypeId: $('#createrecord-recordtype').val() || '',
        fieldSet: fieldSetName,
        fields: JSON.stringify(fields)
    };

    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
    	processData,
    	function(response, event){
            if (!response.success) {
                var $errorList = $('#createrecord-fieldset-errors').empty();
                if (response.errors.length > 0) {
                    $.each(response.errors, function (i, errMsg) {
                        $('<li/>').text(errMsg).appendTo($errorList);
                    });
                }
                else {
                    $('<li>Unknown Error</li>').appendTo($errorList);
                }
                $errorList.show();
                $('#createrecord-loadmask').hide();
            }
            else {
                userSettings.click2CreateSettings.record = response.record;

                var recordId = response.record.Id;
                var recordName = MA.Util.isBlank(setting.record[type+'Name__c']) ? userSettings.click2CreateSettings.name : $('#createrecord-fieldset .fieldInput[data-field="'+setting.record[type+'Name__c']+'"]').find('input').val();
                var markerShape = MA.Marker.shapes['Favorite'];
                var marker;
                if (!(window.ActiveXObject) && "ActiveXObject" in window) {
                    marker = new RichMarker({
                        map: MA.map,
                        position: userSettings.click2CreateSettings.position,
                        anchor: markerShape.anchor.Rich,
                        flat: true,
                        zIndex: 1000,
                        title: recordName,
                        record: { record: { Id: recordId } },
                        content: MAMarkerBuilder.createSVG({ type: 'Marker', color: '#FF8800:Favorite' })
                    });
                }
                else {
                    marker = new google.maps.Marker({
                        map: MA.map,
                        position: userSettings.click2CreateSettings.position,
                        icon: {
                            url: 'data:image/svg+xml;base64,'+CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(MAMarkerBuilder.createSVG({ type: 'Marker', color: '#FF8800:Favorite' }))),
                            anchor: markerShape.anchor
                        },
                        zIndex: 1000,
                        title: recordName,
                        record: { record: { Id: recordId } }
                    });
                }
                marker.record.marker = marker;
                MA.Map.click2CreateMarkers.push(marker);

                //handle marker click
                google.maps.event.addListener(marker, 'click', function ()
                {
                    //create tooltip content
                    var $tooltipContent = $([
                        '<div>',
                            '<div class="tooltip-header">',
                                '<div class="name"><a target="_blank" style="font-family: helvetica,arial,sans-serif;font-size: 12px;color: #2265BB;font-weight: bold;text-decoration: none;white-space: normal;" /></div>',
                                '<div class="address" style="margin: 3px 0 5px 0;padding: 0;font-family: helvetica,arial,sans-serif;font-size: 11px;font-weight: bold;text-decoration: none;color: #000;white-space: normal;" />',
                            '</div>',
                            '<div class="layout-tooltip">',
                                '<div class="buttonset-section-columns">',
                                    '<div class="buttoncolumn"><div class="actionbutton">Add to Route</div></div>' +
                                    '<div class="buttoncolumn"><div class="actionbutton">Take Me There</div></div>' +
                                    //'<div class="buttoncolumn"><div class="actionbutton checkin">Check In</div></div>' +
                                    '<div class="buttoncolumn"><div class="actionbutton">' + MASystem.Labels.MAContext_Remove_Marker + '</div></div>' +
                                '</div>',
                            '</div>',
                        '</div>'
                    ].join(''));

                    //populate values
                    if (sforce && sforce.one && !isDesktopPage) {
                        $tooltipContent.find('.name').html('<button style="padding:0px;" class="MAbutton button-small button-blue button-clear" onclick="sforce.one.navigateToSObject(\''+recordId+'\')">'+recordName+'</button>');
                        //$tooltipContent.find('.name').attr('href', '#').text(recordName).click(function () { sforce.one.navigateToSObject(recordId) });
                    }
                    else {
                        $tooltipContent.find('.name a').attr('href', MA.SitePrefix+'/'+recordId).text(recordName);
                    }
                    $tooltipContent.find('.address').text(geoResponse.result.FormattedAddress).click(function () { launchNativeGPS(marker.getPosition().lat(), marker.getPosition().lng()); });

                    //update check in button to check out if needed
                    if (marker.record.Tasks) {
                         $.each(marker.record.Tasks || [], function (index, task) {
                             if (!task.IsClosed) {
                                 $tooltipContent.find('.actionbutton.checkin').data('CheckInId', task.Id).text('Check Out');
                                 return false;
                             }
                         });
                    }
                    if (marker.record.Events) {
                        $.each(marker.record.Events || [], function (index, event) {
                            if (event.Subject.indexOf('Check In @') == 0) {
                                $tooltipContent.find('.actionbutton.checkin').data('CheckInId', event.Id).text('Check Out');
                                return false;
                            }
                        });
                    }


                    //launch infobubble
                    MA.Map.InfoBubble.show({
                        position: this.getPosition(),
                        anchor: marker,
                        minWidth: 420,
                        content: $tooltipContent.get(0)
                    });

                    //handle action button clicks
                    $tooltipContent.find('.actionbutton').click(function () {
                        switch ($(this).text())
                        {
                            case 'Add to Route':
                                var c2cRec = {
                                    id : recordId,
                                    baseObject : '{C2C}'+$('#createrecord-object').val()
                                }
                                MAActionFramework.standardActions['Add to Trip'].ActionValue({
                                    customMarkers: [{ type: type, title: recordName, latlng: marker.getPosition(), address: geoResponse.result.FormattedAddress, c2cRec : c2cRec }]
                                });

                            break;
                            case 'Take Me There':

                                MAActionFramework.standardActions['Take Me There'].ActionValue({
                                    customMarkers: [{ type: type, title: recordName, latlng: marker.getPosition(), address: geoResponse.result.FormattedAddress }]
                                });

                            break;
                            case 'Check In':

                                MAActionFramework.standardActions['Check In'].ActionValue({
                                    button: $(this),
                                    records: [marker.record]
                                });

                            break;

                            case 'Check Out':

                                MAActionFramework.standardActions['Check Out'].ActionValue({
                                    button: $(this),
                                    records: [marker.record]
                                });

                            break;
                            case 'Remove Marker':

                                marker.setMap(null);

                            break;
                        }
                        MA.Map.InfoBubble.hide();
                    });
                });

                $('#CreateRecordPopup').hide();
                MA.Popup.hideBackdrop();
                //$('#fade').fadeOut(function () { $('#fade').remove(); });
            }
        }
    );
}
function CreateRecord_GoToRecord()
{
    if (sforce && sforce.one) {
        sforce.one.navigateToSObject(userSettings.click2CreateSettings.record.Id);
    }
    else {
        window.open(MA.SitePrefix+'/'+userSettings.click2CreateSettings.record.Id);
    }
}
function CreateRecord_GPS()
{
    launchNativeGPS(userSettings.click2CreateSettings.position.lat(), userSettings.click2CreateSettings.position.lng());
}
function CreateRecord_Cancel()
{
    $('#CreateRecordPopup').hide();
    $('#fade').fadeOut(function () { $('#fade').remove(); });
    MA.Popup.hideBackdrop();
}

var visibilityUpdating = false;
var visibilityQueued = false;


function updateProximityLayer($proxLayer)
{

}


function refreshPopups(options)
{
    options = $.extend({ removeOnly: true }, options);

    try {
        if (MA.Map.InfoBubble._bubble.anchor instanceof google.maps.Marker) {
            if (MA.Map.InfoBubble._bubble.anchor.getMap() == null) {
                MA.Map.InfoBubble.hide();
            }
            else if (!options.removeOnly) {
                google.maps.event.trigger(MA.Map.InfoBubble._bubble.anchor, 'click');
            }
        }
        else if ($(MA.Map.InfoBubble._bubble.content).is('.standard-cluster-tooltip')) {
            MA.Map.InfoBubble.hide();
        }
    }
    catch (err) {}
}


//var WayPointLI = '<li class="ui-state-default"><div class="draggable"></div><span id="RowNumber"></span><input type="text" /><a class="button1-white" onclick="RemoveAddressRow(this);" style="float:right;color:#666;margin:-2px 0 0 0;">Remove</a></li>';
var WayPointHeader = '<tr>'
                        + '<th>Order</th>'
                        + '<th class="padLeft">Name</th>'
                        + '<th class="padLeft">Address</th>'
                        + '<th class="padLeft">Notes</th>'
                        + '<th>Distance/Time</th>'
                        + '<th style=\'width: 50px; text-align: center;\'>Remove</th>'
                    + '</tr>';
var WayPointLI = '<tr index="::indexNum::" class="draggable">'
                    + '<td id="RowNumber" class="rownumber">::rowNum::</td>'
                    + '<td class="name"><div><input type="text" id="name" maxlength="80" /></div></td>'
                    + '<td class="address"><textarea rows="3" id="address" /></td>'
                    + '<td class="notes"><textarea rows="3" id="notes" /></td>'
                    + '<td id="distance" class="notes">TBD</td>'
                    + '<td class="remove"><a class="button1-white" onclick="RemoveAddressRow($(this).parent());" style="float:right;color:#666;margin:-2px 2px 0 0;">Remove</a></td>'
                + '</tr>';


function printthis(which) {

    var directions = document.getElementById(which).innerHTML;

    var newwindow = window.open("","","height=500,width=320,location=0,scrollbars=1");
    directions += '<br><a href="http://www.cloudbilt.com" target="_blank"><img style="width: 100px; border:0;" src="http://cloudbilt.com/wp-content/uploads/Cloudbilt_logo_small-192x39.jpg" title="Cloudbilt" alt="Cloudbilt"/></a>';
    newwindow.document.write(directions);
    newwindow.focus();
    newwindow.print();
}
var RouteObj = {};
var RouteWaypoints = [];
function PrintEmailDirections() {
    trackUsage('MapAnything',{action: 'Print or Email Directions'});

    //remove blank rows
    var needToReorder = false;
    $('#Routing-Table .waypoint-row').each(function(key, value) {
         if (($(this).attr('Lat') === undefined || !$(this).find('.address').hasClass('DisabledWaypoint')) && $(this).find('.address').val() == '') {
            $(this).remove();
            needToReorder = true;
         }
    });

    //renumber the waypoints if needed
    if (needToReorder) {
        OrderNumbersOnWaypoints();
    }

    //get driving params
    var routeType = notPrintEmailPage ? $('#DriveProfile').val() : $( window.opener.document.getElementById('DriveProfile') ).val();

    var newwindow = window.open(MA.resources.PrintEmailRoute+pageSuffix+"?mode="+routeType+"&distance="+userSettings.RouteDefaults.unit,"","height=800,width=800,location=0,scrollbars=1");
    RouteObj = $('#Routing-Table').data('dragRoute');
    RouteWaypoints = MARoutes.waypointMarkers.getMarkers();
    newwindow.focus();
}

function SendDirectionsEmail()
{
    var EmailAddresses = prompt("Please enter one or more email addresses separated by ;", UserEmailAddress);
    if (EmailAddresses != null && EmailAddresses != "")
    {
        //http://stackoverflow.com/questions/9382167/serializing-object-that-contains-cyclic-object-value

        var htmlBody = '';
        if(notPrintEmailPage)
        {
            htmlBody = $('#DirectionsOutput').clone().wrap('<div/>').parent().html();
        }
        else
        {
            var directionsHTML = '';
            var directionsClone = $('#directions').clone();
            directionsClone.find('img').remove();

            //remove the maneuvers if needed
            if(!$('#showDirectionsCheckbox').prop('checked'))
            {
                directionsClone.find('.directions-row').remove();
            }

            //remove the custom fields if needed
            if(!$('#showFieldsCheckbox').prop('checked')) { $(directionsClone).find('.waypointTooltips').text(''); }

            //build html body
            directionsHTML += $(directionsClone).html() + '<br /><br />';
            htmlBody = '<br /><br />' + $('#overview').html() + '<br /><br />' + directionsHTML
                        + '<a href="http://www.cloudbilt.com" target="_blank"><img id="logo" style="width: 100px; border:0; margin-left: -25px;" src="http://cloudbilt.com/wp-content/uploads/Cloudbilt_logo_small-192x39.jpg" title="Cloudbilt" alt="Cloudbilt"/></a>';
        }

        var MyJSObject = {
                action: 'email_directions',
                replyTo: UserEmailAddress,
                subject: 'Map Anything Directions',
                toAddresses: EmailAddresses.split(";"),
                htmlBody: htmlBody
        };

        var processData = {
        	ajaxResource : 'MAEmailAJAXResources',

        	MyJSObject: JSON.stringify(MyJSObject)
        };

        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
        	processData,
        	function(response, event){

                if(response.success)
                {
                    showSuccess($('#mapdiv').parent(), 'Your directions have been sent');
                }
                else
                {
                    NotifyError("Error Sending Directions Email",response.error);
                    Debug("Error Sending Directions Email " + response.error);
                }
            }
        );
    }
}

function SetDefaultMapLocation(options)
{
    /**
        // optional object to affect what gets saved as the map type
        options = {
            mapTypeId: STRING // a valid google.maps.MapTypeId
            customTileId: STRING // record id of custom tile
        }
    **/
    options = options || {};
    trackUsage('MapAnything',{action: 'Set Default View'});

    var processData = {
    	ajaxResource : 'MAUserAJAXResources',

    	action: 'set_default_map_location',
    	id: MASystem.User.Id,
    	zoomlvl : MA.map.getZoom(),
    	lat : MA.map.getCenter().lat(),
    	long : MA.map.getCenter().lng(),
    	type : options.customTileId ? (MA.map.getMapTypeId() + ':' + options.customTileId) : MA.map.getMapTypeId() // $('.MapViewTitle.Active').closest('td').attr('data-basemaptype')
    };

    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
    	processData,
    	function(json, event) {
            if(json.success) {
                $.extend(userSettings.defaultMapSettings, {
                    latitude    : MA.map.getCenter().lat(),
                    longitude   : MA.map.getCenter().lng(),
                    zoomLevel   : MA.map.getZoom(),
                    mapType     : MA.map.getMapTypeId() + ((typeof customTileId == 'string' && !customTileId.trim()) ? customTileId.trim() : '')
                });
                MAToastMessages.showSuccess({message:MASystem.Labels.MA_Default_View_Saved});
            }
            else {
                MAToastMessages.showError({message:MASystem.Labels.MA_Error_Updating_Default_Location, subMessage: json.error, timeOut: 0, closeButton:true, extendedTimeOut: 0});
                console.warn("Error Updating Default Location: " + json.error);
            }
        },{buffer:false,escape:false}
    );
}

function GetAddressFieldResults(record, FieldName)
{
    var rValue = "";

    if (FieldName != null)
    {
        //Debug("GetAddressFieldResults - FieldName: " + FieldName);
        //Debug("GetAddressFieldResults - record: " + record);

        if (FieldName.indexOf(".") > -1)
        {
            if (record[FieldName.split(".")[0]] != null)
            {
                rValue = (record[FieldName.split(".")[0]][FieldName.split(".")[1]]) ? record[FieldName.split(".")[0]][FieldName.split(".")[1]] : "";
            }
        }
        else
        {
            rValue  = (record[FieldName]) ? record[FieldName] : "";
        }
    }

    return rValue;
}

function GetFieldLabel(prdescribeSObj, FieldName)
{
    for (var i=0; i < prdescribeSObj.fields.length; i++)
    {
        var field = prdescribeSObj.fields[i];
        if (field.name == FieldName)
        {
            return field.label;
        }
    }
    return "";
}

function GetFieldType(prdescribeSObj, FieldName)
{
    for (var i=0; i < prdescribeSObj.fields.length; i++)
    {
        var field = prdescribeSObj.fields[i];
        if (field.name == FieldName)
        {
            return field.type;
        }
    }
    return "";
}

function GetFieldReferenceTo(prdescribeSObj, FieldName)
{
    if (FieldName.indexOf(".") > -1)
    {
        FieldName = FieldName.split(".")[0];
    }

    for (var i=0; i < prdescribeSObj.fields.length; i++)
    {
        var field = prdescribeSObj.fields[i];
        if (field.relationshipName == FieldName)
        {
            return field.referenceTo;
        }
    }
    return "";
}

function GetRelationshipName(prdescribeSObj, FieldName)
{
    if (FieldName.indexOf(".") > -1)
    {
        FieldName = FieldName.split(".")[0];
    }

    for (var i=0; i < prdescribeSObj.fields.length; i++)
    {
        var field = prdescribeSObj.fields[i];
        if (field.name == FieldName)
        {
            return field.relationshipName;
        }
    }
    return "";
}

function unique(arrayName)
{
    //Return Unique Array
    var ReturnArray = new Array();
    $.each(arrayName,
        function(index, value)
        {
            if ($.inArray(value, ReturnArray) < 0)
            {
                ReturnArray.push(value);
            }
        }
    );

    return ReturnArray;
}

////////////////////  Format Tooltip Types  /////////////////////////////////////
var sforce = sforce || { internal: {}, connection: {} };
if(!sforce.internal) {
    sforce.internal = {};
}
if(!sforce.connection) {
    sforce.connection = {};
}
sforce.internal.stringToDateTime = function(source) {
    var bc = false;
    if (source === null || source.length === 0) {
        throw "Unable to parse dateTime1";
    }

    if (source.charAt(0) == '+') {
        source = source.substring(1);
    }
    if (source.charAt(0) == '-') {
        source = source.substring(1);
        bc = true;
    }

    if (source.length < 19) {
        throw ("Unable to parse dateTime2");
    }

    if (source.charAt(4) != '-' || source.charAt(7) != '-' ||
        source.charAt(10) != 'T') {
        throw ("Unable to parse dateTime3");
    }

    if (source.charAt(13) != ':' || source.charAt(16) != ':') {
        throw ("Unable to parse dateTime4");
    }

    var year = source.substring(0, 4);
    var month = source.substring(5, 7);
    var day = source.substring(8, 10);
    var hour = source.substring(11, 13);
    var min = source.substring(14, 16);
    var sec = source.substring(17, 19);

    var date = new Date(year, month-1, day, hour, min, sec);

    var pos = 19;

    // parse optional milliseconds
    if (pos < source.length && source.charAt(pos) == '.') {
        var milliseconds = 0;
        var start = ++pos;
        while (pos < source.length && sforce.internal.isDigit(source.charAt(pos))) {
            pos++;
        }
        var decimal = source.substring(start, pos);
        if (decimal.length == 3) {
            milliseconds = decimal;
        } else if (decimal.length < 3) {
            milliseconds = (decimal + "000").substring(0, 3);
        } else {
            milliseconds = decimal.substring(0, 3);
            if (decimal.charAt(3) >= '5') {
                ++milliseconds;
            }
        }

        date.setMilliseconds(milliseconds);
    }

    var offset = date.getTimezoneOffset() * 60000;
    //offset in milli;

    // parse optional timezone
    if (pos + 4 < source.length &&
    (source.charAt(pos) == '+' || (source.charAt(pos) == '-'))) {

        var hours = (source.charAt(pos + 1) - '0') * 10 + source.charAt(pos + 2) - '0';
        var mins = 0;
        if(source.charAt(pos + 3) == ':' )
        {
            mins = (source.charAt(pos + 4) - '0') * 10 + source.charAt(pos + 5) - '0';
            pos += 6;
        }
        else
        {
            mins = (source.charAt(pos + 3) - '0') * 10 + source.charAt(pos + 4) - '0';
            pos += 5;
        }
        var mseconds = (hours * 60 + mins) * 60 * 1000;

        // subtract milliseconds from current date to obtain GMT
        if (source.charAt(pos) == '+') {
            mseconds = -mseconds;
        }

        date = new Date(date.getTime() - offset + mseconds);
    }

    if (pos < source.length && source.charAt(pos) == 'Z') {
        pos++;
        date = new Date(date.getTime() - offset);
    }

    if (pos < source.length) {
        throw ("Unable to parse dateTime " + pos + " " + source.length);
    }

    return date;
};

function FormatsObjectValue(v, type, RefId, options)
{
    options = options || {};

    if(v == null) v = "";
    if(v != "")
    {
        type = type.toLowerCase();
        if(type == "boolean")
        {
            //this might be boolean or it might be a string
            if (typeof v == 'string') {
                v = v.toUpperCase();
            }
            else {
                v = (!v) ? "FALSE" : "TRUE";
            }
        }
        else if(type == "double")
        {
            v = isNaN(v) || v === '' || v === null ? 0 : v;
            var a = parseFloat(v).toString().split(".");
            //var a = parseFloat(v).toFixed(2).toString().split(".");
            var b = a[0].split("").reverse().join("").replace(/.{3,3}/g, "$&,").replace(/\,$/, "").split("").reverse().join("");

            if(parseFloat(a[1]) > 0)
            {
                v = (b + "." + a[1]);
            }
            else
            {
                v = b;
            }
        }
        else if (type == 'location')
        {
            //create string from object
            v = 'latitude: ' + v.latitude + ', <br>longitude: ' + v.longitude;
        }
        else if(type == "currency")
        {
            v = isNaN(v) || v === '' || v === null ? 0.00 : v;
            var userCurrency = '';

            //show user currency in parentheses
            if(options.conversionRate) {
                userCurrency = v/options.conversionRate;
                var c = parseFloat(userCurrency).toFixed(2).toString().split(".");
                var d = c[0].split("").reverse().join("").replace(/.{3,3}/g, "$&,").replace(/\,$/, "").split("").reverse().join("");

                userCurrency = ' (' + userSettings.userCurrency + ' ' + d + "." + c[1] + ')';
            }

            //var n = v < 0 ? true : false;
            var parts = parseFloat(v).toFixed(options.precision || 2).toString().split(".");
            var integerPartWithCommas = parts[0].split("").reverse().join("").replace(/.{3,3}/g, "$&,").replace(/\,$/, "").split("").reverse().join("");

            v = (options.currency + " " + integerPartWithCommas + "." + parts[1] + userCurrency);
        }
        else if(type == "date")
        {
            try {
                var formatedDate = formatUserLocaleDate({datepicker: true}).replace('mm','MM').replace('dd','DD').replace('yy','YYYY');
                v = moment(v).format(formatedDate);
            }
            catch (e)
            {
                v = sforce.internal.stringToDate(v).toLocaleDateString();
            }
        }
        else if(type == "datetime")
        {
            try {
                //format date to display correct user locale
                var formatedDate = formatUserLocaleDate({moment: true});
                v = moment(v).format(formatedDate);
            }
            catch (e)
            {
                //should not get in here but just in case (no user locale set)
                v = sforce.internal.stringToDateTime(v);
                v = v.toLocaleDateString() + " " + v.toLocaleTimeString().replace(/([^:]*):([^:]*):00(.*)/, '$1:$2$3'); //remove the seconds portion of the datetime
            }
        }
        else if (type == "percent")
        {
            v = (v != "") ? v + "%" : "";
        }
        else if (type == "url")
        {
            if (v.indexOf("http://") > -1 || v.indexOf("https://") > -1)
            {
                v = '<a href="' + v + '" target=_blank>' + v + "</a>";
            }
            else
            {
                v = '<a href="http://' + v + '" target=_blank>' + v + "</a>";
            }
        }
        else if(type == "reference")
        {
            v = '<a href="/' + RefId + '" target=_blank>' + v + "</a>";
        }
        else if (type == "textarea")
        {
            v = v.replace(/\n/g, '<br />');
        }
        /*
        else
        {
            v = type;
        }
        */
    }

    return v;
}

function launchQueryEditor(url)
{
    //scroll to top
    $("html, body").animate({ scrollTop: 0 }, "slow");

    try {
        // are we in debug mode from main page?
        if (window.location.href.indexOf("debug") > -1) {
            // append debug but does the passed url have params?
            var urlTest = (url.indexOf('?') > -1) ? '&' : '?';
            // append our debug param
            url = url + urlTest + 'debug=true';
        }
    } catch (e) {
        console.warn('debug mode failed', e);
    }

    //launch editor
    var $dialog = $('#queryeditor-modal');

    $dialog.find('.query-editor-modal-loader').show();
    $dialog.find('.query-editor-modal-content').hide().html('');
    //backdrop v2
    MA.Popup.showBackdrop();
    $dialog.dialog({resizable: false, closeOnEscape: false}).css('min-height', '0').dialog('widget').css({
        'width': 'auto',
        'top': '30px'
    });

    //get the query info
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'HTML'
    })
    .done(function(x, textStatus, res){
        if(res) {
            var getHTML = res.responseText || '';
            //remove CDATA (MAP-3816), causing page refresh in lightning
            //sf injecting script tags and reloading page if top and locaiton don't match... remove all references
            getHTML = getHTML.replace(/top.location=location/g,'');
            $dialog.find('.query-editor-modal-content').html(getHTML);
            $dialog.dialog('widget').fadeOut(200, function () {
                $dialog.find('.query-editor-modal-loader').hide();
                $dialog.find('.query-editor-modal-content').show();
                $dialog.dialog('widget').fadeIn(200);
                $('#queryeditor-modal').dialog('widget').css({
                    left: ($(window).width()/2) - 400,//($('#queryeditor-modal').width()/2),
                    top: '30px'
                });
            });
        }
        else {
            queryEditorClose();
            MA.Popup.hideBackdrop()
            //show error
            NotifyError('Unable to edit query:',res.statusText || 'Unknown Error.');
        }
    })
    .fail(function(res) {
        MA.log(res);
        //remove the query editor
        queryEditorClose();
        MA.Popup.hideBackdrop()
        //show error
        NotifyError('Unable to edit query:',res.statusText || 'Unknown Error.');
    });

}

function CreatePopupWindow(popID,popWidth,noBackground)
{
    //Fade in the Popup and add close button
    $('#' + popID).fadeIn().css({ 'width': Number( popWidth ) });

    //Define margin for center alignment (vertical + horizontal) - we add 80 to the height/width to accomodate for the padding + border width defined in the css
    //var popMargTop = ($('#' + popID).height() + 100) / 2;
    var popMargTop = 50;
    var popMargLeft = ($('#' + popID).width() + 80) / 2;

    //Apply Margin to Popup
    $('#' + popID).css({
        'top' : popMargTop,
        'margin-left' : -popMargLeft
    });

    //Fade in Background
    /*if (typeof noBackground == 'undefined') {
        $('body').append('<div id="fade"></div>'); //Add the fade layer to bottom of the body tag.
        $('#fade').css({'filter' : 'alpha(opacity=80)'}).fadeIn(); //Fade in the fade layer
    }*/

    //backdrop v2
    MA.Popup.showBackdrop();
}

function LaunchAlert (options) {
    /*
    options = {
        title : 'your title',
        subTitle : 'appear under title',
        template : 'html or text for main body',
        button : {
            color : 'button-blue',
            text : 'Save',
            function : 'doSomething() || $('.select')...
        }
    }
    */
    //grab the popup
    var $popup = $('#AlertPopup');

    //clear the popup
    $popup.find('.popup-head .popup-title').text('');
    $popup.find('.popup-head .popup-sub-title').text('');
    $popup.find('.popup-body').html('');

    //add the new values
    $popup.find('.popup-head .popup-title').text(options.title || 'Attention');
    $popup.find('.popup-head .popup-sub-title').text(options.subTitle || '');
    $popup.find('.popup-body').html(options.template || '');

    //show the popup
    $popup.addClass('active');
}

function LaunchPopupWindow($popup, width, skipAppend)
{
    //scroll to top
    $('body').animate({ scrollTop: 0 }, "slow");

    //add the popup
    if (skipAppend) {   //quick fix for broken comboboxes due to dom manipulation
        $popup.fadeIn().css({
            width: width + 'px',
            position: 'absolute',
            top: '15px',
            left: Math.floor(($('body').width() - width) / 2) + 'px'
        });
    }
    else {
        $popup.appendTo('body').fadeIn().css({
            width: width + 'px',
            position: 'absolute',
            top: '15px',
            left: Math.floor(($('body').width() - width) / 2) + 'px'
        });
    }

    //add the fade layer
    //$('body').append('<div id="fade"></div>');
    //$('#fade').css({'filter' : 'alpha(opacity=80)'}).fadeIn();
    MA.Popup.showBackdrop();
    $popup.trigger('blah');

    //backdrop v2


    //try to focus on input
    setTimeout(function(){
        $popup.find('input[type=text]').eq(0).focus();
    });
}

function ClosePopupWindow()
{
    $('#fade , .popup_block').fadeOut(function() {
            $('#fade, a.close').remove();
    }); //fade them both out

    //backdrop v2
    MA.Popup.hideBackdrop();

}

function CreateFavoriteFolder(options)
{
    options = options || {};

    if(options.node || $('#FavTree').jstree('get_selected').attr('rel') == 'root' || $('#FavTree').jstree('get_selected').attr('rel') == 'folder')
    {
        //show the create folder form
        showForm($('#FavoriteLocationsPopup .loadmask-wrapper'), $('#FavoriteLocations_CreateFolder').clone().wrap('<div/>').parent().html());

        //get the selected node
        var selectedNode = options.node || $('#FavTree').jstree('get_selected');
        $('#FavoriteLocations_CreateFolder .new-folder-location')
            .text(selectedNode.find('a:first').text())
            .data('node', selectedNode);
    }
    else
    {
        alert('You must select a folder before continuing.');
    }
}

function CreateFavoriteLocation(options)
{
    var options = options || {};

    if(options.node || $('#FavTree').jstree('get_selected').attr('rel') == 'root' || $('#FavTree').jstree('get_selected').attr('rel') == 'folder')
    {
        //show the create location form
        showForm($('#FavoriteLocationsPopup .loadmask-wrapper'), $('#FavoriteLocations_CreateLocation').clone().wrap('<div/>').parent().html());

        //get the selected node
        var selectedNode = options.node || $('#FavTree').jstree('get_selected');
        $('#FavoriteLocations_CreateLocation .fav-folder-location')
            .text(selectedNode.find('a:first').text())
            .data('node', selectedNode);

        //handle selecting a different marker type
        $('#FavoriteLocations_CreateLocation .fav-markertype-selector').on('click', '.fav-markertype-selector img', function () {

            //only show the markertype selector that matches the selected type
            if ($(this).is('.fav-markertype-selector-color')) {
                $(this).closest('.fav-markertype-wrapper').find('.fav-markertype-image').hide();
                $(this).closest('.fav-markertype-wrapper').find('.fav-markertype-color').show();
            }
            else {
                $(this).closest('.fav-markertype-wrapper').find('.fav-markertype-color').hide();
                $(this).closest('.fav-markertype-wrapper').find('.fav-markertype-image').show();
            }

        });

        //init colorpickers
        jscolor.init();

        //empty marker options on load for populate
        $('#FavoriteLocations_CreateLocation').find('select.fav-markertype-image').empty();

        //populate marker image options
        var processData = {
            action : 'getImageOptions',
            ajaxResource : 'MAFavoriteLocationsAJAXResources'
        };

        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
            processData,
            function(response, event){
                if(event.status) {
                    var $markerImageFields = $('#FavoriteLocations_CreateLocation select.fav-markertype-image');
                    $.each(response.data, function (index, option) {
                        $('<option></option>').attr('value', option.itemValue).text(option.itemLabel).appendTo($markerImageFields);
                    });
                    $markerImageFields.removeAttr('disabled');
                }
            },{buffer:false,escape:false}
        );
    }
    else
    {
        alert('A folder must be selected before continuing.');
    }
}

function DisplayPropertiesOfObject(obj,LevelsDeep)
{
    for(var key in obj)
    {
        Debug(GenDash(LevelsDeep) + '<b>' + key + '</b>: ' + obj[key]);

        if (typeof(obj[key]) == "object")
        {
            //DisplayPropertiesOfObject(obj[key],LevelsDeep+1);
        }
    }
}

function GenDash(LevelsDeep)
{
    if (LevelsDeep == 0)
        return '';
    else if (LevelsDeep == 1)
        return "-";
    else if (LevelsDeep == 2)
        return "--";
    else if (LevelsDeep == 3)
        return "---";
    else if (LevelsDeep == 4)
        return "----";
    else if (LevelsDeep == 5)
        return "-----";
    else if (LevelsDeep == 6)
        return "------";
    else if (LevelsDeep == 7)
        return "-------";
    else
        return "--------";
}

function Debug(str)
{
    $('#DebugOut').append("<br/>" + str);
}

function ClearDebugWindow()
{
    $('#DebugOut').html("<b>Log Cleared</b>");
}

function ShowSavedQryPopup()
{

    $('#tabs-SavedQry').tabs({remote:true});
    jscolor.init();

    $('#LoadingPopup').fadeOut();

    $('body').append('<div id="fade"></div>'); //Add the fade layer to bottom of the body tag.
    $('#fade').css({'filter' : 'alpha(opacity=80)'}); //Fade in the fade layer
    MA.Popup.showBackdrop();

    $('#SavedQueryPopup').fadeIn().css({ 'width': Number( 700 ) });


    var popMargLeft = ($('#SavedQueryPopup').width() + 80) / 2;

    //Apply Margin to Popup
    $('#SavedQueryPopup').css({
        'margin-left' : -popMargLeft,
        'max-height': '550px'
    });

    //$('#SavedQueryPopup').css("top", (($(window).height() - $('#SavedQueryPopup').outerHeight()) / 2) + $(window).scrollTop() + "px");
    $('#SavedQueryPopup').css("top", "150px");
}

function OpenMenuIfOpen(MenuId)
{
    if($('#' + MenuId).is(":hidden"))
    {
        //Menu is Visible, Hide Menu
        $('#' + MenuId).slideToggle('normal', function() {
            // Animation complete.
        });
    }
}

function CloseMenuIfOpen(MenuId)
{
    if($('#' + MenuId).is(":visible"))
    {
        //Menu is Visible, Hide Menu
        $('#' + MenuId).slideToggle('normal', function() {
            // Animation complete.
        });
    }
}

function DisplayMapViewPopup()
{
    CloseMenuIfOpen('ProximityPopup');
    CloseMenuIfOpen('MapToolsPopup');

    $('#MapViewPopup').slideToggle('normal', function() {
        // Animation complete.
    });
}

function DisplayMapToolsPopup()
{
    CloseMenuIfOpen('ProximityPopup');
    CloseMenuIfOpen('MapViewPopup');

    $('#MapToolsPopup').slideToggle('normal', function() {
        // Animation complete.
    });
}

function DisplayProximityPopup()
{
    CloseMenuIfOpen('MapToolsPopup');
    CloseMenuIfOpen('MapViewPopup');

    $('#ProximityPopup').slideToggle('normal', function() {
        // Animation complete.
    });
}

function PreparePickListEntry(str)
{
    return str.replace(/\s/g,"");
}

function ChangeDivStatus(DivId,str)
{
    document.getElementById(DivId).innerHTML = str;
}

function ShowLoadingDialog()
{
    Debug("ShowLoadingDialog");
}

function HideLoadingDialog()
{
    $('#modalPage123').hide();
}

function StringtoXML(text)
{
    if (window.ActiveXObject)
    {
        var doc=new ActiveXObject('Microsoft.XMLDOM');
        doc.async='false';
        doc.loadXML(text);
    }
    else
    {
        var parser=new DOMParser();
        var doc=parser.parseFromString(text,'text/xml');
    }
    return doc;
}

function ShowAddressNotFoundPopup()
{
    LaunchPopupWindow($('#AddressNotFoundPopup'), 600);
}

function FavoriteLocationsPopup()
{
    LaunchPopupWindow($('#FavoriteLocationsPopup'), 700);
}

function SlideToTree()
{
    slider1.goToFirstSlide();
    $('#TreeTab').removeClass('TreeTab-Inactive');
    $('#TreeTab').addClass('TreeTab-Active');
    $('#PlottedQueriesTab').removeClass('PlottedQueriesTab-Active');
    $('#PlottedQueriesTab').addClass('PlottedQueriesTab-Inactive');
}

function SlideToPlottedQueries()
{
    if (NewLayerNavigationEnabled())
    {
        MALayers.moveToTab('plotted');
    }
    else
    {
        //slider1.goToSlide(1);
        if (!$('a[href="#tab-plotted"]').is('.tab-open')) {
            $('a[href="#tab-plotted"]').click();
        }
        $('#TreeTab').removeClass('TreeTab-Active');
        $('#TreeTab').addClass('TreeTab-Inactive');
        $('#PlottedQueriesTab').removeClass('PlottedQueriesTab-Inactive');
        $('#PlottedQueriesTab').addClass('PlottedQueriesTab-Active');
    }



}

//DirectionsInputTab
function SlideToLocations()
{
    slider2.goToFirstSlide();
    $('#DirectionsInputTab,#DirectionsOptionsTab,#DirectionsOutputTab').removeClass();
    $('#DirectionsOptionsTab').addClass('TreeTab-Inactive');
    $('#DirectionsOutputTab').addClass('PlottedQueriesTab-Inactive');
    $('#DirectionsInputTab').addClass('TreeTab-Active');
}

//DirectionsOutputTab
function SlideToDirectionsOutput()
{
    slider2.goToSlide(1);

    $('#DirectionsInputTab,#DirectionsOptionsTab,#DirectionsOutputTab').removeClass();
    $('#DirectionsInputTab,#DirectionsOptionsTab').addClass('TreeTab-Inactive');
    $('#DirectionsOutputTab').addClass('PlottedQueriesTab-Active');
}

//DirectionsOptionsTab
function SlideToDirectionsOptions()
{
    slider2.goToSlide(1);

    $('#DirectionsInputTab,#DirectionsOptionsTab,#DirectionsOutputTab').removeClass();
    $('#DirectionsInputTab').addClass('TreeTab-Inactive');
    $('#DirectionsOutputTab').addClass('PlottedQueriesTab-Inactive');
    $('#DirectionsOptionsTab').addClass('TreeTab-Active');
}

function MakeActiveSliderTab(id)
{
    $('#' + id).removeClass('PlottedQueriesTab-Inactive');
    $('#' + id).addClass('PlottedQueriesTab-Active');
}

function MakeInactiveSliderTab(id)
{
    $('#' + id).removeClass('TreeTab-Active');
    $('#' + id).addClass('TreeTab-Inactive');
}

function CloseDebugWindow()
{
    ClosePopupWindow();
}

function EmailDebugLog()
{
    var DebugLogComments = prompt("Comments:","");
    var EmailDebugLogArray = new Array();
    EmailDebugLogArray.push('bbrantly@cloudbilt.com');
    EmailDebugLogArray.push('dkraun@cloudbilt.com');

    var MyJSObject = {
            action: 'email_debug_log',
            replyTo: UserEmailAddress,
            subject: 'Map Anything Debug Log',
            htmlBody: '<b>Comments: </b>' + DebugLogComments + '<br /><br />' + $('#DebugOut').html(),
            toAddresses: EmailDebugLogArray
    };

    var processData = {
    	ajaxResource : 'MAEmailAJAXResources',

    	MyJSObject: JSON.stringify(MyJSObject)
    };

    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
    	processData,
        	function(response, event){

                if(response.success)
            {
                showSuccess($('#mapdiv').parent(), 'Debug Log Sent');
            }
            else
            {
                NotifyError("Error Sending Debug Log Email",obj.error);
                Debug("Error Sending Debug Log Email " + obj.error);
            }
        }
    );
}

    /************************
    *   Query Editor
    ************************/

    function queryEditorClose ()
    {
        $('#queryeditor-modal').dialog('destroy');
        /*$('#fade').fadeOut(function() {
            $('#fade').remove();
        });*/

        //backdrop v2
        MA.Popup.hideBackdrop();
    }
    function queryEditorSaveComplete (queryId, baseObjectLabel, query, plotQueryOnComplete, queryIndex)
    {
        //determine if this query has a dynamic filter
        var isDynamic = false;
        $.each(query.filters || [], function (i, filter) {
            if (filter.value == ':Dynamic' || filter.value2 == ':Dynamic') {
                isDynamic = true;
            }
        });

        if (query.id)
        {
            //grab advancedOptions
            var advancedOptions;
            try {
                advancedOptions = JSON.stringify(query.advancedOptions);
            }
            catch (e) {
                advancedOptions = JSON.stringify({});
            }

            //this was an edit
            DoOnCompleteEditSavedQry(query.name, queryId, query.colorAssignmentType, isDynamic, advancedOptions);
        }
        else
        {
            //grab advancedOptions
            var advancedOptions;
            try {
                advancedOptions = JSON.stringify(query.advancedOptions);
            }
            catch (e) {
                advancedOptions = JSON.stringify({});
            }

            //this was new
            DoOnCompleteNewForSavedQry(
                query.name,
                queryId,
                baseObjectLabel,
                query.folderId,
                query.folderType.indexOf('Personal') == -1 ? 'CorporateSavedQuery' : 'PersonalSavedQuery',
                "false",
                query.colorAssignmentType == 'Static' ? 'Standard' : 'Legend',
                query.colorAssignmentType == 'Static' ? 'SavedQuery' : 'LegendSavedQuery',
                isDynamic,
                advancedOptions
            );
        }

        //update the icon color
        try
        {
            updateIcon($("#SQTree #"+queryId).attr('IconColor', query.iconColor));
        }
        catch (err) { }

        queryEditorClose();

        if (plotQueryOnComplete) {
            //determine if this is a visible area only query
            var visibleOnly = false;
            if(query.advancedOptions && query.advancedOptions.defaultRenderArea == 'VisibleArea') {
                visibleOnly = true;
            }
            if(query.advancedOptions && query.advancedOptions.defaultRenderMode) {
                renderMode = query.advancedOptions.defaultRenderMode;
                $('#PlottedQueriesTable').children().eq(queryIndex).data('renderMode', renderMode);
            }

            if (queryIndex) {
                //check if visible area has changed
                if(visibleOnly) {
                    $('#PlottedQueriesTable').children().eq(queryIndex).data('visibleAreaOnly', true).addClass('visibleOnly');
                }
                else {
                    $('#PlottedQueriesTable').children().eq(queryIndex).data('visibleAreaOnly',false).removeClass('visibleOnly');
                }
                MAPlotting.refreshQuery($('#PlottedQueriesTable').children().eq(queryIndex),null,{force:true});
            }
            else {
                var hoverInfo = (getProperty(MASystem, 'User.FullName', false) || '') + ' ' + new moment().format(formatUserLocaleDate({moment:true}));
                var queryDesc = query.description === '' ? 'No Description' : query.description;
                var plotOptions = {
                    id: (query.id || queryId),
                    renderAs: [renderMode],
                    visibleAreaOnly : visibleOnly || false,
                    name : query.name || query.Name || '',
                    modify : true, //if user is creating a query, they should be able to edit it so hardcoding true here
                    layerType: query.layerType,
                    type: query.layerType || 'marker',
                    description: queryDesc || 'No Description',
                    modifiedInfo: hoverInfo,
                    createdInfo: hoverInfo,
                    baseObjectLabel: query.baseObject || 'N/A'
                }
                MAPlotting.analyzeQuery(plotOptions);
            }

            try {
                //BEGIN MA ANALYTICS
                var processData = {
        			ajaxResource : 'MATreeAJAXResources',

        			action: 'store_layer_analytics',
        			track : 'true',
        			subtype : 'Marker Layer',
        			id : queryId
        		};

        	    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
        			processData,
        			function(res, event){
                        if( NewLayerNavigationEnabled() ) {
                            MALayers.loadRecent();
                        }
                    }
                );
                //END MA ANALYTICS
            } catch (err) {
                MA.log(err);
            }
        }
    }

    /**********************
    *   Helper Methods
    ***********************/

    //helper method for extracting nested objects using a dot notation field name
    function extractValue(obj, field)
    {
        try {
            var fieldParts = field.split('.');
            var currentObj = obj;
            for (var i = 0; i < fieldParts.length; i++)
            {
                currentObj = currentObj[fieldParts[i]];
            }
            return (typeof currentObj == 'undefined' || currentObj == null) ? '' : currentObj;
        }
        catch (err) { }

        return '';
    }

    function handleDynamicMultifieldClick($plottedQuery,$button) {
        if ($button.find('.moreless-text').text() == "Show All") {
            $button.find('.moreless-text').text("Show Less");
            $button.find('.MAIcon').removeClass('glyphicon-collapse-down').addClass('glyphicon-collapse-up');
            $plottedQuery.find('.legend-row').show();
            $plottedQuery.find('.legend-row-header').show();
            $plottedQuery.find('.legend-row-header').addClass('sectionOpen').removeClass('sectionClosed');
            $plottedQuery.find('.legend-row-header .rowDropIcon').addClass('ion-android-arrow-dropdown').removeClass('ion-android-arrow-dropup');
        }
        else if ($button.find('.moreless-text').text() == "Show More") {
            $button.find('.moreless-text').text("Show All");
            $button.find('.MAIcon').removeClass('glyphicon-collapse-up').addClass('glyphicon-collapse-down');
            $plottedQuery.find('.legend-row:not(.empty)').show()
            $plottedQuery.find('.legend-row-header:not(.empty)').show()
            $plottedQuery.find('.legend-row-header:not(.empty)').removeClass('sectionOpen').addClass('sectionClosed');
            $plottedQuery.find('.legend-row-header:not(.empty) .rowDropIcon').addClass('ion-android-arrow-dropdown').removeClass('ion-android-arrow-dropup');
        }
        else {
            //show less
            $button.find('.moreless-text').text("Show More");
            $button.find('.MAIcon').removeClass('glyphicon-collapse-up').addClass('glyphicon-expand');
            $plottedQuery.find('.legend-row').hide();
            $plottedQuery.find('.legend-row-header.empty').hide();
            $plottedQuery.find('.legend-row-header').removeClass('sectionOpen').addClass('sectionClosed');
            $plottedQuery.find('.legend-row-header .rowDropIcon').removeClass('ion-android-arrow-dropdown').addClass('ion-android-arrow-dropup');
        }
    }

    /**********************
    *   Stress Test Methods
    ***********************/
    function Stress_Markers(num, type)
    {
        if (type == 'rich') {
            for (var i = 0; i < num; i++) {
                new RichMarker({
                    position: new google.maps.LatLng(Math.floor(Math.random()*90), Math.floor(Math.random()*180)),
                    anchor: RichMarkerPosition.BOTTOM,
                    map: MA.map,
                    flat: true,
                    content: MAMarkerBuilder.createSVG()
                });
            }
        }
        else if (type == 'svg') {

            var svg = [
                '<svg class="svg-marker" width="28" height="42" preserveAspectRatio="xMidYMid meet" viewBox="0 0 28 42" xmlns="http://www.w3.org/2000/svg">',
                    '<circle cx="13.5" cy="14" fill="#001a00" r="4.5" stroke="#00bf00" stroke-dasharray="null" stroke-linecap="null" stroke-linejoin="null" stroke-width="2"></circle>',
                '</svg>'
            ].join('');

            for (var i = 0; i < num; i++) {
                new google.maps.Marker({ map: MA.map, position: new google.maps.LatLng(Math.floor(Math.random()*90), Math.floor(Math.random()*180)), icon: 'data:image/svg+xml;base64,'+CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(svg)) });
            }
        }
        else {
            for (var i = 0; i < num; i++) {
                new google.maps.Marker({ map: MA.map, position: new google.maps.LatLng(Math.floor(Math.random()*90), Math.floor(Math.random()*180)) });
            }
        }
    }

    /*KW - progress on Print Map*/
    // function printMap(leaveOpen) {
    //     MA.map.setOptions({
    //       mapTypeControl: false,
    //       zoomControl: false,
    //       streetViewControl: false,
    //       panControl: false
    //     });
      
    //     var popUpAndPrint = function() {
    //         dataUrl = [];
    //         var mapNode = MA.map.getDiv();
      
    //         // $('#mapdiv canvas').filter(function() {
    //         //     dataUrl.push(this.toDataURL("image/png"));
    //         // });

    //         var width = container.clientWidth;
    //         var height = container.clientHeight;
      
    //         // $(mapNode).find('canvas').each(function(i, item) {
    //         //     $(item).replaceWith(
    //         //         $('<img>')
    //         //             .attr('src', dataUrl[i]))
    //         //             .css('position', 'absolute')
    //         //             .css('left', '0')
    //         //             .css('top', '0')
    //         //             .css('width', width + 'px')
    //         //             .css('height', height + 'px');
    //         // });
      
    //         var printWindow = window.open('', 'PrintMap',
    //             'width=' + width + ',height=' + height);
    //         printWindow.document.writeln($(mapNode).html());
    //         printWindow.document.close();
    //         printWindow.focus();

    //         printWindow.onload = function() {
    //             printWindow.print();
    //             if (!leaveOpen) {
    //                 printWindow.close();
    //             }
    //         }
      
    //         MA.map.setOptions({
    //             mapTypeControl: true,
    //             zoomControl: true,
    //             streetViewControl: true,
    //             panControl: true
    //         });
    //     };
      
    //     setTimeout(popUpAndPrint, 500);
    // }