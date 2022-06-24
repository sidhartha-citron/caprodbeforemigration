Ext.ns('CMDBManagerNamespace'); 
CMDBManagerNamespace.instance = null;
var wikiUrlforCiEdit;
//var	ServiceInstanceGridColumns =[];
var	ServiceInstanceArrayStore =[];
var colInstanceGrid = [];
var searchstring = '';
var sdeHome = window.parent.parent;
var isCustomPage = true;
var actionContext = '';
var iPageSize = 27;
var ciHelp='';
var ciHelpInst='';
var assetHelpInstance='';
var isfirst = true;
var ViewSearchText = '';
var updatedJson;
var viewNM = '';
var setFocusOnSearchText = false;

var updatedStore;
var viewType = '';
var pattern = /[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18}/;
var currentPage='';
var PrevFieldType='';
var cmdbCISaveBtn = false;
var cmdbCIDirtyFlag;
var isDerivedClassUpdateble = true;
var CIJson = [];
var classRecord;
var AssetJson = [];
var selectedClsType='CI', selectedclass='BMC_BaseElement', RuleClass = '';
var filterWindowOpened=false;
var AdvancedFilterPopUp;
var isRBAClass = false;
var backFromDetailPage=false;
var instanceEditorTitleForCIClass,instanceEditorTitleForAssetClass;
var FilterIconTooltip='';
var waitingMask;
var isTreeViewLoaded = false;
var selectedIds = '';
var className = '';
var ClassNameArr = [];
var param = '';
var ObjId;
var openerWin;
var instanceType = 'All';
var LKFId;
var sURL = '';
var tabChanged = false;
var pagingBar = {};
var FilterColList='',prevClass='';
var newSortDirection = 'ASC';
var newSortColumn = 'CreatedDate';
var loadCount = 0;
var imgPathAsc = '<img style="vertical-align: middle;" src="'+getSDFStylesResPath() + '/SDEFimages/sort_asc.gif'+'"/>';
var imgPathDesc = '<img style="vertical-align: middle;" src="'+getSDFStylesResPath() + '/SDEFimages/sort_desc.gif'+'"/>';
var MarkasDeletedCookieVal = Ext.util.Cookies.get(userId + 'MarkAsDeleted');
var classAccessMap = {};
var readAccessClassIdsArr = [];
var readAccessClassIds='';
var readAccessRBAClassIdsArr=[];
var readAccessRBAClassIds='';
var WinMsg;
var isMultiColumnSortingEnabled=false;
var randomNumber;
MarkasDeletedCookieVal = (MarkasDeletedCookieVal && MarkasDeletedCookieVal.toUpperCase() == 'TRUE') ? true : false;

var SelectedRecordIDCookieVal = Ext.util.Cookies.get(userId + 'SelectedRecordID');
SelectedRecordIDCookieVal = ((SelectedRecordIDCookieVal != 'BMC_BusinessService') && (SelectedRecordIDCookieVal != 'BMC_BaseElement')) ? 'BMC_BaseElement' : SelectedRecordIDCookieVal;

var ShowDerivedCIsCookieVal = Ext.util.Cookies.get(userId + 'ShowDerivedCIs');
ShowDerivedCIsCookieVal = (ShowDerivedCIsCookieVal && ShowDerivedCIsCookieVal.toUpperCase() == 'FALSE') ? false : true;

if(isAssetManagementEnabled && isCIManagementEnabled && selectedTabFromCookie){
	if((showCI && selectedTabFromCookie=='CI' ) || (showAsset && selectedTabFromCookie=='Asset') || (showCI && showAsset)){
		selectedTab = selectedTabFromCookie;
	}
} 

var selModelCheckBox = Ext.create('Ext.selection.CheckboxModel',{
		checkOnly:true,
		headerChkBoxEnabled:true,
		onHeaderClick :function (headerCt, header, e) {
			if (header.isCheckerHd) {
	            e.stopEvent();
	            var isChecked = header.el.hasCls(Ext.baseCSSPrefix + 'grid-hd-checker-on');
	            if (isChecked) {                
	                this.deselectAll(true);
	                Ext.getCmp('selectedInstancesCountLabel').setText(' '+_ServerLabels.SelectedInstances+' '+0);
	            } else {                
	                this.selectAll(true);
	                Ext.getCmp('selectedInstancesCountLabel').setText(' '+_ServerLabels.SelectedInstances+' '+(this.getCount( )));
	            }
	        }
		},
		listeners:{
			beforeselect: function(selModel, record, index) {
				Ext.getCmp('selectedInstancesCountLabel').setText(' '+_ServerLabels.SelectedInstances+' '+(selModel.getCount( ) + 1));
			},
			beforedeselect: function(selModel, record, index) {
				Ext.getCmp('selectedInstancesCountLabel').setText(' '+_ServerLabels.SelectedInstances+' '+(selModel.getCount() - 1));

			}
		}
	});
function isWikiUrlBlank(wikiTempUrl){
	if (wikiTempUrl != '' && wikiTempUrl !=null && typeof(wikiTempUrl) != undefined && isNewContextpage())
		return true;
	else
		return false;
 }	
function urlencode(str){ 
		return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
	}
if(isStdForm){
   
   var topMarginStyle = ''	; var tempCI=''; var tempAsset='';
  if(Ext.isIE7){topMarginStyle = 'margin-top:-15px;'; }else{topMarginStyle = '';}
  var rightMarginStyle = '';
 //ciHelp='<a href="#" onclick="if(isWikiUrlBlank(wikiUrlForList)){window.open(wikiUrlForList )}else{window.open(helpResource+\'/ci_list.htm\',false,\'width=\'+screen.width+\',height=\'+screen.height+\',resizable = 1,scrollbars=no,status=1,top=0,left=0\',false)};"><img style="float:right;'+topMarginStyle+'" title='+_ServerValues.TooltipHelp+' height="17" width="17" id="helpId" src="'+imageHelp+'/SDEFbuttons/b_help.png"></a>';
 ciHelp='<a href="#" onclick="if(isWikiUrlBlank(wikiUrlForList)){window.open(wikiUrlForList )}else{window.open(helpResource+\'/ci_list.htm\',false,\'width=\'+screen.width+\',height=\'+screen.height+\',resizable = 1,scrollbars=no,status=1,top=0,left=0\',false)};"><span style="float:right;'+topMarginStyle+'; font-size: 16px;color:white; margin-top: 0px; cursor:pointer" title='+_ServerValues.TooltipHelp+' id="helpId" class="d-icon-question_circle"></span></a>';
 ciHelpInst='<a href="#" onclick="if(classRecord==\'BMC_BusinessService\'){tempCI=wikiUrlForCIForm;wikiUrlForCIForm=wikiUrlForBusinessService}if(isWikiUrlBlank(wikiUrlForCIForm)){window.open(wikiUrlForCIForm)}else{window.open(helpResource+\'/creating_ci.htm\',false,\'width=\'+screen.width+\',height=\'+screen.height+\',resizable = 1,scrollbars=no,status=1,top=0,left=0\',false)};if(tempCI != \'\'){wikiUrlForCIForm=tempCI};"><span style="float:right;'+rightMarginStyle+topMarginStyle+'; font-size: 16px;color:white; margin-top: 1px; cursor:pointer" title='+_ServerValues.TooltipHelp+'  id="helpIdInstance" class="d-icon-question_circle"></span></a>';
assetHelpInstance = '<a href="#" onclick="if(classRecord==\'BMC_BusinessService\'){tempAsset=wikiUrlForAssetForm;wikiUrlForAssetForm=wikiUrlForBusinessService}if(isWikiUrlBlank(wikiUrlForAssetForm)){window.open(wikiUrlForAssetForm)}else{window.open(helpResource+\'/creating_asset.htm\',false,\'width=\'+screen.width+\',height=\'+screen.height+\',resizable = 1,scrollbars=no,status=1,top=0,left=0\',false)}if(tempAsset != \'\'){wikiUrlForAssetForm=tempAsset};"><span style="float:right;'+rightMarginStyle+topMarginStyle+' font-size: 16px;color:white; margin-top: 1px; cursor:pointer" title='+_ServerValues.TooltipHelp+' id="helpIdInstance"  class="d-icon-question_circle"></span></a>';

_ServerValues.InstanceGridTitle=_ServerValues.InstanceGridTitle+ciHelp;
instanceEditorTitleForCIClass = '<span class="instance_editor_title" style="margin-left: 3px;">' + _ServerValues.InstanceEditorTitle+ '</span >' +ciHelpInst;
instanceEditorTitleForAssetClass = '<span class="instance_editor_title" style="margin-left: 3px;">'+ _ServerValues.InstanceEditorTitle+'</span >' +assetHelpInstance;

if((isAssetManagementEnabled && isCIManagementEnabled && selectedTab != 'Asset'))
	_ServerValues.InstanceEditorTitle = instanceEditorTitleForCIClass;
else if(isAssetManagementEnabled)
	_ServerValues.InstanceEditorTitle = instanceEditorTitleForAssetClass;
else
	_ServerValues.InstanceEditorTitle = instanceEditorTitleForCIClass;


iPageSize = Ext.util.Cookies.get('ListPageSize') ? parseInt(Ext.util.Cookies.get('ListPageSize')) : 25;
}
function unloadPage()
{	
	if(sdeHome != null)
		sdeHome.CMDBManagerWin = null;
}
window.onunload = unloadPage;

Ext.tree.TreeFilter = function(tree, config){
	this.tree = tree;
	this.filtered = {};
	Ext.apply(this, config);
};

Ext.tree.TreeFilter.prototype = {  
	filter: function( value, attr, startNode ) {
		attr = attr || 'text';
		startNode = startNode || this.tree.getRootNode();
		value = value.toLowerCase();
		
		this.clear();
		
		var f = function(n){
					var ind = n.data[attr].toString().toLowerCase().indexOf(value.toLowerCase());
					if(ind == -1)
					   return false;
					else
					   return true;
				};
		this.filterBy(f, null, startNode,value);
		
	},
	filterBy: function( fn, scope, startNode,value ) {
		var matches = [];	
		
		var view 			= this.tree.getView();
		var tree 			= this.tree;
		var visibleNodes = [];
		
		
		startNode.cascadeBy(function( record ) {
			var node = this;
			if( node == startNode){
				return true;
			}
			var m = fn.call(scope || node, node);
			   if(m && (node.data.disabled== false || node.data.disabled == undefined || node.data.disabled == null)){
					matches.push(node);
					var uiNode = view.getNode(node );
					if( uiNode )
						Ext.get(uiNode).addCls('HighlightMatchedClass');
					
			   }
			
		});
		Ext.each(matches, function (item, i, arr) {                         
			startNode.cascadeBy(function (record) { 
				if (this.contains(item) == true) {
					visibleNodes.push(this);                               
				}
			});
				
			if (!item.isLeaf()) {        												
				item.cascadeBy(function (record) {                            
					visibleNodes.push(this);
				});
			}
			visibleNodes.push(item);                                       
		});
		startNode.cascadeBy(function (node) {                                    
			if(visibleNodes.indexOf(this,0) == -1) {
				var uiNode = view.getNode(this);

				if(uiNode)
					Ext.get(uiNode).setDisplayed('none');
			}
				
			if(isTreeViewLoaded)
				tree.expandPath( this.getPath() );
		});	
		
	},
	clear: function() {
		var view = this.tree.getView();
		var tree = this.tree;
		this.tree.getRootNode().cascadeBy( function( record ) {
			var uiNode = view.getNode(this );
			if( uiNode ) {
				Ext.get(uiNode).setDisplayed( 'table-row' );
				Ext.get(uiNode).removeCls('HighlightMatchedClass');
			}
			
		})
	}

	};

Ext.onReady(function() {
	if(isCMDBClassPermissionsEnable || fallBackToFresh){
		var baseElementObjectPermission = getBaseElementObjectPermission();
		if(baseElementObjectPermission){
			deleteCI = baseElementObjectPermission.isDeletable;
			deleteAsset = baseElementObjectPermission.isDeletable;
			updateCI = baseElementObjectPermission.isUpdateable;
			updateAsset== baseElementObjectPermission.isUpdateable;
			
		}
	}
    if(isTabAccessible  == false)
    	return;
	var selectedRowIndex = 0;
	var selectedRowIndexInstanceID = 0;
	
	ServiceInstanceArrayStore = encodeColumnHeader(incGridforBS);
	colInstanceGrid = encodeColumnHeader(incGridforBE); 
	
	//Performance Metrics
	windowloaddate = new Date();
    networklatencystart = windowloaddate.getTime();
    var networklatency = networklatencystart - etime;
	data += _ServerValues.NetwokLatencyLabel;
	data +=networklatency; 
	data += '<br>';
	if(isFromRelationship){
		document.title=_ServerLabels.SelectCIs;
	}
    Ext.QuickTips.init();
    ExtOnReady();
	
	if(isAdmin == 'false' || isAdmin == false){
		var countBtn = Ext.getCmp('ciCMDBCICountUpdateBtn');
		if(countBtn != null && countBtn != 'undefined' && countBtn != '')
			countBtn.disable(); 
	}
});
function enabledisablenewbuttonForClassPermissions(){
	var newBtn = Ext.getCmp('newInstanceBtn');
	if(newBtn != null && typeof(newBtn) != 'undefined'){
		if(isabstract || !iscreatable){
			newBtn.disable();
		}else if((selectedTab && selectedTab.toLowerCase() == 'asset') && ((typeof(selectedClsType) !='undefined' && selectedClsType !=null) && (selectedClsType.toLowerCase() == 'ci' || selectedClsType == ''))){
			newBtn.disable();
		}
		else{
			newBtn.enable();
		}
		
	}
	var reportBtn = Ext.getCmp('ciCMDBReportBtn');
	if(reportBtn !=null && reportBtn != 'undefined'){
		if(isabstract){
			reportBtn.disable();
		}else{
			reportBtn.enable();
		}
	}
}
function enabledisablenewbutton(){
	var newBtn = Ext.getCmp('newInstanceBtn');
	if(newBtn != null && typeof(newBtn) != 'undefined'){
		if(isabstract || !iscreatable){
			newBtn.disable();
		}else if(iscreatable){
			if(isFlattenedCmdb && typeof(selectedClsType) !='undefined' && selectedClsType !=null){											//nakul------------------
				if(isAssetManagementEnabled && isCIManagementEnabled){
					if(selectedTab.toLowerCase() == 'ci'){
						if(updateCI){
							newBtn.enable();
						}else{
							newBtn.disable();
						}
					}else if(selectedTab.toLowerCase() == 'asset'){
						if(selectedClsType.toLowerCase() == 'ci' || selectedClsType == ''){
							newBtn.disable();
						}else{
							if(updateAsset){
								newBtn.enable();
							}else{
								newBtn.disable();
							}
						}
					}else if(selectedTab.toLowerCase() == 'all'){
						if(selectedClsType.toLowerCase() == 'ci' || selectedClsType == ''){
							if(updateCI){
								newBtn.enable();
							}else{
								newBtn.disable();
							}
						}else if(selectedClsType.toLowerCase() == 'asset'){
							if(updateAsset){
								newBtn.enable();
							}else{
								newBtn.disable();
							}
						}else if(selectedClsType.toLowerCase() == 'ci and asset'){
							if(updateCI && updateAsset){
								newBtn.enable();
							}else{
								newBtn.disable();
							}
						}
					}
				}else if(!isAssetManagementEnabled && isCIManagementEnabled){
					if(updateCI){
						newBtn.enable();
					}else{
						newBtn.disable();
					}
				}else if(isAssetManagementEnabled && !isCIManagementEnabled){
					if(selectedClsType.toLowerCase() == 'ci' || selectedClsType.toLowerCase() == ''){
						newBtn.disable();
					}else{
						if(updateAsset){
							newBtn.enable();
						}else{
							newBtn.disable();
						}
					}
				}
			}else{															//nakul---------------------
				newBtn.enable();
			}
		}
	}
	var reportBtn = Ext.getCmp('ciCMDBReportBtn');
	if(reportBtn !=null && reportBtn != 'undefined'){
		if(isabstract)
			reportBtn.disable();
		else
			reportBtn.enable();
	}
	var multiEditBtn = Ext.getCmp('ciCMDBEditBtn');
	if(multiEditBtn != null && typeof(multiEditBtn) != 'undefined'){
		if( !isupdateable ) {
			multiEditBtn.disable();
			
		} else if(isDerivedClassUpdatable){
			if(isFlattenedCmdb && typeof(selectedClsType) !='undefined' && selectedClsType !=null){											//nakul----------------------
				if(isAssetManagementEnabled && isCIManagementEnabled){
					if(selectedTab.toLowerCase() == 'ci'){
						if(updateCI){
							multiEditBtn.enable();
							multiEditBtn.setIconCls('bmcCMDBEditCi');
						}else{
							multiEditBtn.disable();
							multiEditBtn.setIconCls('bmcCMDBEditCiDisabled');
						}
					}else if(selectedTab.toLowerCase() == 'asset'){
						if(updateAsset){
							multiEditBtn.enable();
							multiEditBtn.setIconCls('bmcCMDBEditCi');
						}else{
							multiEditBtn.disable();
							multiEditBtn.setIconCls('bmcCMDBEditCiDisabled');
						}
					}else if(selectedTab.toLowerCase() == 'all'){
						if(updateCI && updateAsset){
							multiEditBtn.enable();
							multiEditBtn.setIconCls('bmcCMDBEditCi');
						}else{
							multiEditBtn.disable();
							multiEditBtn.setIconCls('bmcCMDBEditCiDisabled');
						}
					}
				}else if(!isAssetManagementEnabled && isCIManagementEnabled){
					if(updateCI){
						multiEditBtn.enable();
						multiEditBtn.setIconCls('bmcCMDBEditCi');
					}else{
						multiEditBtn.disable();
						multiEditBtn.setIconCls('bmcCMDBEditCiDisabled');
					}
				}else if(isAssetManagementEnabled && !isCIManagementEnabled){
					if(updateAsset){
						multiEditBtn.enable();
						multiEditBtn.setIconCls('bmcCMDBEditCi');
					}else{
						multiEditBtn.disable();
						multiEditBtn.setIconCls('bmcCMDBEditCiDisabled');
					}
				}
			}else{															//nakul-----------------------
				multiEditBtn.enable();
				multiEditBtn.setIconCls('bmcCMDBEditCi');
			}
		}
		else{
			multiEditBtn.disable();
			multiEditBtn.setIconCls('bmcCMDBEditCiDisabled');
		}
	}
}
function ExtOnReady() {
    setTimeout("openMultiInstanceEditor();",100);
    CMDBManagerNamespace.instance = new CMDBManager();
    CMDBManagerNamespace.instance.getContent().render("contentDiv");
	if( (isACEnabled || isDiscoveryEnabled) && !isFromRelationship ){
		var ACMenu = getACMenu();
		var extToolbar = Ext.getCmp('toolBarId');
		if(typeof(extToolbar) != 'undefined' && extToolbar != null && extToolbar != 'undefined'){
			var Conditionaltooltip = acActionLabel;
			var tb_separator_index = 11;
			var action_item_index = 12;
			if( userLanguage == 'iw' ) {
				action_item_index = 30;
				tb_separator_index = 30;
			}
				
			
			if(isDiscoveryEnabled)
				Conditionaltooltip = CIAction;
			extToolbar.insert(tb_separator_index, {
				xtype: 'tbspacer',
				width: 5,
			});
			extToolbar.insert(action_item_index,{
				id:'actionsMenuId',
				baseCls: 'bmc-btn-dropdown',
				disabledCls: 'bmc-btn-dropdown-disabled',    
				focusCls: 'focus',
				overCls: 'over',
				pressedCls:'pressed',
	            text:_ServerLabels.Actions,
				disabled:true,
				menu:ACMenu,
				tooltipType : 'title',
				tooltip:Conditionaltooltip,
				listeners: {
					click: function(menu, item, e, eOpts) {
						Ext.getCmp('actionMenu').show();
					}
				}
			});
			extToolbar.doLayout(true,true);
		}
	}
    //Page-load time
    data += _ServerValues.PageLoadLabel;
    var pageloadstartdate = new Date() ;
    var time1 = pageloadstartdate.getTime();
    var time2 = windowloaddate.getTime();
    var pagerendertime =(time1 - renderingstartitme);
    data += pagerendertime;
	setTimeout("CheckAndOpenInstance();",300);
}

function getDistinctVal(ClassNameArr){
	var n ={},arr=[];
	for(var i = 0; i < ClassNameArr.length; i++) 
	{
		if (!n[ClassNameArr[i]]) 
		{
			n[ClassNameArr[i]] = true; 
			arr.push(ClassNameArr[i]); 
		}
	}
	return arr;
}

function openMultiInstanceEditor(){
	openerWin = window.opener;
	className = 'BMC_BaseElement';
	if (name != null && name != undefined && name == "MultiInstanceWindowFulfill") {
		var isIE11 = window.location.hash = !!window.MSInputMethodContext;
		if(Ext.isIE || isIE11){
			openerWin = window.open("","HandlerWindow");
		}
	}
	if(openerWin != null && typeof(openerWin) != 'undefined'){
		param = openerWin.selectedIds;
		ObjId = openerWin.filterObjectId;
		LKFId = openerWin.LKFId;
	}	
	if(param != null && param != ''){
		ClassNameArr = getDistinctVal(openerWin.selectedClass);
		InstanceTypeArr = getDistinctVal(openerWin.selectedInstanceTypes);
		if(InstanceTypeArr.length == 1)
			instanceType = InstanceTypeArr[0];
		else
			instanceType = 'All';
		if(ClassNameArr.length == 1){
			className = ClassNameArr[0];
			onCompleteCall();
		}	
		else if(ClassNameArr.indexOf('BMC_BaseElement') != -1){
			className = 'BMC_BaseElement';
			onCompleteCall();
		}	
		else{
			var parameters = ClassNameArr.toString();
			Visualforce.remoting.Manager.invokeAction(getSuperClassList,parameters,
			function(result, event){
				if(event.status){
					className = result;
					onCompleteCall();
				}	
				},{escape: false}
			);
		}
	}
	if(openerWin != null && typeof(openerWin) != 'undefined')
		openerWin.blur();	
}

function onCompleteCall(){
	if(param!=null && param!=''){
		var url = "/apex/CMDBCIEditPage?classname="+className+"&isRBAClass=false&selectedTab="+instanceType+"&selectedClsType=&searchStr=&&SortColumn=&PointerFirstRecordValue=&PointerLastRecordValue=&PageSize=19&PageSize=35&PageNumber=1&SortDirection=ASC&PageMoveDirection=NEXT&ShowDerivedCIs=true&AdvancedFilterName=&selectedIds="+param+"&ObjId="+ObjId+"&LKFId="+LKFId;
		CMDBManagerNamespace.instance.ShowFormPanel(url, "",'CMDBCIEditPage');		
	}
}

function CheckAndOpenInstance() {
	var recid,ObjId;
	 if(getUrlParameter('cmdbRecordId')!=null && getUrlParameter('cmdbRecordId')!=''){
	    recid = getUrlParameter('cmdbRecordId');
		ObjId = getUrlParameter('ObjId');
	 }else{
		 
	 }	
	 var instName, assemblyId, reqContextId;
	 	 
	 if(typeof(recid)!='undefined' && recid!=null && recid!='') {
		if(instName !=null && instName != 'undefined' && instName != '' && 
			assemblyId !=null && assemblyId != 'undefined' && assemblyId != '' && assemblyId != '-' && 
			reqContextId !=null && reqContextId != 'undefined' && reqContextId != '' && reqContextId != '-'){
			var url = "/apex/cmdbgenericpage?BE_RecordID="+recid+"&assemblyId="+assemblyId+"&reqContextId="+ reqContextId+'&tabName='+selectedTab+'&wid='+getWID();
			instanceFramePanel = CMDBManagerNamespace.instance.ShowFormPanel(url, _ServerValues.InstanceEditorTitle + ': ' + instName,'cmdbgenericpage');
		}else{
			var url = "/apex/cmdbgenericpage?BE_RecordID="+recid+'&ObjId='+ObjId+'&tabName='+selectedTab+'&wid='+getWID();
			var instanceLinkTitle = '';
			if(typeof instName == 'undefined' && getUrlParameter('instNameFromCIExplorer')!=null && getUrlParameter('instNameFromCIExplorer')!='') {
				instanceLinkTitle = ': ' + decodeURI(getUrlParameter('instNameFromCIExplorer')).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
			}
			instanceFramePanel = CMDBManagerNamespace.instance.ShowFormPanel(url, _ServerValues.InstanceEditorTitle+instanceLinkTitle,'cmdbgenericpage');
		} 
		window.parent.parent.CMDB_RecordID = null;
	}
}
function getUrlParameter( param ){
	param = param.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");;
	var r1 = "[\\?&]"+param+"=([^&#]*)";
	var r2 = new RegExp( r1 );
	var r3 = r2.exec( window.location.href );
	if( r3 == null ){return ""}
	else {return r3[1]};
}
function SearchCI(){
	CMDBManagerNamespace.instance.searchBaseElement();
}
CMDBManager = function(){}
CMDBManager.prototype = {
	InstancesGrid : null,
	TypeListView : null,
	TypeTileView : null, 
	TypeTreeView : null,
	viewPanels : null,
	BrowserContainerPanel : null,
	MainTabPanel : null,
	SelectedRecordID  : '',
	BrowserContainerPanelHeight:900,
	isInstancesGridLocked:true,
	ExplorerItemClickHandler : function(recordID, forceReload) {
		classRecord = recordID;
		className = recordID;
		loadCount = 0;
		
		if((this.SelectedRecordID != recordID || forceReload==true)){
			if(!isfirst && isFlattenedCmdb)	// Case: Custom Views available for flattened CMDB only
			{	
				showWaitMsgBar();
				if(!backFromDetailPage){
					if(typeof(clearAllActiveFilters) == "function" ){
						clearAllActiveFilters();
					}
					if(typeof(ChangeFilterIcon) == "function" ){
						ChangeFilterIcon();
					}
					CMDBManagerNamespace.instance.InstancesGrid.hide();
					if(forceReload){
						isfirst = true;
					}
				}
				getCustomListView(recordID,selectedTab);
				var filterIcon= Ext.getCmp('FilterBtn');
				if(typeof(filterIcon) != 'undefined' && filterIcon != null && !backFromDetailPage){
					//filterIcon.setIconCls('Filter_Not_Applied');
					filterIcon.setIconCls('filterBtn');
					filterIcon.setTooltip(AdvancedSearch);
					AdvancedFilterName='';
				}
				//backFromDetailPage = false;
			}
			if(isfirst || !isFlattenedCmdb)	// Case: Custom Views feature unavailable for CMDB 1.0
			{	
				//isfirst = false;
				if(this.InstancesGrid!=null)
					{
						this.Paging_PageNumber=1;

                    if (recordID == "BMC_BaseElement" && selectedTab == 'CI' && SelectedRecordIDCookieVal == 'BMC_BusinessService')
                        this.getInstanceListStore(SelectedRecordIDCookieVal);
                    else
						this.getInstanceListStore(recordID);
					if(recordID == "BMC_BaseElement" && selectedTab == 'CI'){
						Ext.getCmp('ShowCIs').enable();
						Ext.getCmp('ShowBusinessServices').enable();	
                        if (SelectedRecordIDCookieVal == 'BMC_BusinessService') {
                            toggleCheckBoxes(Ext.getCmp('ShowCIs'), false);
                            toggleCheckBoxes(Ext.getCmp('ShowBusinessServices'), true);
                        } else {
							toggleCheckBoxes(Ext.getCmp('ShowCIs'), true);		
							toggleCheckBoxes(Ext.getCmp('ShowBusinessServices'), false);					
                        }

					}else{
						Ext.getCmp('ShowCIs').disable();
						Ext.getCmp('ShowBusinessServices').disable();	
					}
					}
						
					try{
						this.SelectedRecordID = recordID; // Sync up the record id to avoid recursive calls.
						this.syncTypeViews(recordID);
					}
					catch(e){
						console.log(e);
					}
				this.SelectedRecordID = recordID;
				if(this.TypeTreeView != null && this.TypeTreeView != 'undefined' && 
				this.TypeTreeView.getSelectionModel() != null && this.TypeTreeView.getSelectionModel() != 'undefined' && 
				this.TypeTreeView.getSelectionModel().getSelection() != null && this.TypeTreeView.getSelectionModel().getSelection() != 'undefined' &&  this.TypeTreeView.getSelectionModel().getSelection().length > 0 && 
				this.TypeTreeView.getSelectionModel().getSelection()[0].raw.abstract != null && this.TypeTreeView.getSelectionModel().getSelection()[0].raw.abstract != 'undefined' )
				{
					isabstract = this.TypeTreeView.getSelectionModel().getSelection()[0].raw.abstract;
				}
				if(isCMDBClassPermissionsEnable || fallBackToFresh){
					enabledisablenewbuttonForClassPermissions();
				}
				
			}
		}
	},
	
	syncTypeViews : function(recordID) {
		if( recordID != null && recordID != '') {
			try{
		        this.TypeListView.selModel.select(this.TypeListView.getStore().findExact('Name',recordID));
			}
			catch(e){console.log(e);
			}
			
			try{
		        //this.TypeTileView.selModel.select(this.TypeListView.getStore().findExact('Name',recordID));
		        this.TypeTileView.getSelectionModel().select(this.TypeListView.getStore().findExact('Name',recordID));
			}
			catch(e){console.log(e);
			}
			
			try{
		        this.TypeTreeView.selModel.select(this.TypeTreeView.getView().getTreeStore().getNodeById(recordID));
			}
			catch(e){console.log(e);
			}
		}
	},
	
	resizeTypeViews : function() {

        try{
			var ViewPanelComp = Ext.getCmp('ViewTabPanel');
            
			var i = ViewPanelComp.getWidth();
			ViewPanelComp.setWidth(i+1);
			ViewPanelComp.setWidth(i-1);
			
            this.TypeListView.setWidth(i);
            this.TypeListView.setHeight(this.explorerHeight);
        }catch(e){console.log(e);}

	},

	showHelp : function() {
                var tab = this.MainTabPanel.getActiveTab();
                var pagename = 'CMDBManager';
                var view = 'InstanceBrowser';
                if(typeof(tab.url)!='undefined' && typeof(tab.url)!=null)
                {
                    var url = tab.url.toLowerCase();
                    
                    if(url.indexOf("generic")>=0)
                    {
                        view='ConfigurationItem';
                    }
                    else if(url.indexOf("relationship")>=0)
                    {
                        view='CIRelationship';
                    }
					else if(url.indexOf("cmdbreport") >= 0){
						OpenHelppage('CIReport','module','form');
						return;
					}
                } 
                OpenHelppage(pagename,'page',view);
	},
	
	showMetrics : function() {
                var tab = this.MainTabPanel.getActiveTab();
                if(typeof(tab.url)!='undefined' && typeof(tab.url)!=null)
                {
                    var url = tab.url.toLowerCase();
                    
                    if(url.indexOf("generic")>=0)
                    {
                        var data1 = window.frames[0].senddata();
                        return data1;
                    }
                    else if(url.indexOf("relationship")>=0)
                    {
                        var data2 = window.frames[1].senddata();
                        return data2;
                    }
                } 
				return data;              
				
	},
	
	getContent : function() {
		var mainPanelHeight = Ext.getBody().getViewSize().height;
		
		if(typeof(mainPanelHeight)=='undefined' || mainPanelHeight==null || isNaN(mainPanelHeight))
		{
			if(isFromRelationship) {
				mainPanelHeight= window.innerHeight - 5;
			} else {
				mainPanelHeight= screen.availHeight - 200;
			}
		}else{
			if(isLightningExperience || isFromRelationship) {
				mainPanelHeight=mainPanelHeight-5;
			}else{
				if(mainPanelHeight <400){
					mainPanelHeight=400;
				}else{
					mainPanelHeight=mainPanelHeight-135;
				}
			}
		}
		
			browserContainerPanelHeight = mainPanelHeight;
	    var instanceBrowserPanelHeight = browserContainerPanelHeight - 6;
	    var explorerHeight = instanceBrowserPanelHeight-70;
	    this.explorerHeight = explorerHeight;	    
	    // create some portlet tools using built in Ext tool ids
        var btnTools = [{
            id:'help',
            handler: function() {
	                this.showHelp();
	            }.createDelegate(this)

        }];
        
	    var mainPanel = new CMDB.Controls.FormPanel({
			id:'mainPanel',
	        title: _ServerValues.mainPanelTitle,
			header:false,
	        tools: btnTools,
	        height: mainPanelHeight,
			//autoWidth:true,
	        border:false,
			listeners: {
				afterrender: function () {
					CMDBManagerNamespace.instance.RenderSearchClassesComponent();
				}
			}
	    });
	
	
		var browserContainerPanel = new CMDB.Controls.Panel({
			id:'browserContainerPanel',
	        height: browserContainerPanelHeight,
	        //autoWidth:true,
	        border:false
	    }); 
		this.BrowserContainerPanel = browserContainerPanel;	
		
	    var NameSpaceDropdown = new CMDB.Controls.DropDownField({
	        width: 200,
	        fieldLabel: _ServerValues.NameSpaceDropdownLabel,
	        store: this.getNameSpaceListStore(),
	        typeAhead: true,
	        queryMode: 'local',
	        valueField: 'Name',
	        displayField: 'DisplayName',
	        triggerAction: 'all',
	        editable: false,
	        forceSelection: true
	    });
	    NameSpaceDropdown.value = _ServerValues.DefaultInstanceDropDownValue;
	
	    var InstanceBrowserColumn1 = new CMDB.Controls.Panel({
	    	id:'InstanceBrowserColumn1',
	        layout: 'fit',
	        //autoWidth:true,
	        border: false
	    });
	
	    var InstanceBrowserColumn2 = new CMDB.Controls.Panel({
	    	id:'InstanceBrowserColumn2',
	        height: instanceBrowserPanelHeight,
	        //autoWidth:true,
	        //anchor: '100%',
	        border: false
	    });
		var region_left = 'west';
		
		if (userLanguage=='iw') {
			region_left = 'east';
		}
	    var InstanceBrowserPanel = new CMDB.Controls.Panel({
	    	id:'InstanceBrowserPanel',
	        //anchor: '100%',
	        bodyBorder: false,
	        height: instanceBrowserPanelHeight,
			
			defaults: {
				collapsible: true,
				split: true,
				
				//bodyPadding: 15
			},
	        //autoWidth:true,
	        layout: 'border',
			//monitorResize:true,
	        listeners: {
	                        afterlayout: function(c, layout, eOpts){ 
												
												/*c.layout.west.miniSplitEl.dom.qtip = labelTooltipCollapseNavigator;
												c.layout.west.getCollapsedEl();
												c.layout.west.miniCollapsedEl.dom.qtip = labelTooltipExpandNavigator;	*/
												
												var title;
												if( c.layout.centerRegion.container.dom.children[1].className.indexOf( 'collapsed' ) != -1 ) {
													title = labelTooltipExpandNavigator;
												} else {
													title = labelTooltipCollapseNavigator;
												}
												c.layout.centerRegion.container.dom.children[1].children[0].title = title;
												
	                                           // this.resizeTypeViews();												
	                                        }.createDelegate(this)
            },
	        
	        items: [
	            { collapsible: false,  layout:'fit', split: true, collapseMode: 'mini', animcollapse: true,minWidth:280, region: region_left, width: 280, items: [InstanceBrowserColumn1]},
	            { collapsible: false, region: 'center',  layout:'fit', items: [InstanceBrowserColumn2] }

	            ]
	    });
	
	
	    var ElementList = new CMDB.Controls.DropDownField({
	        store: this.getElementListStore(),
	        typeAhead: true,
	        queryMode: 'local',
	        valueField: 'Name',
	        displayField: 'DisplayName',
	        editable: false,
	        forceSelection: true,
			hidden: true
	    });
	    ElementList.value = _ServerValues.DefaultElementsDropDownValue;
		
	    var ClassTileView = this.getClassTileView('tile', explorerHeight);
	    var ClassListView = this.getClassListView(explorerHeight);
	    var ClassTreeView = this.getClassTreeView(explorerHeight);
	
	
	    var viewPanels = new CMDB.Controls.TabPanel({
			id:'ViewTabPanel',
	        border: false,
            cls: 'x-tab-hide',
			height: instanceBrowserPanelHeight,
	        bodyBorder: false
	    });
	
		this.viewPanels = viewPanels;
		
	
	    viewPanels.add(
	                        { title: '1', items: [ClassTileView] },
	                        { title: '2', items: [ClassListView] },
	                        { title: '3', items: [ClassTreeView] }
	                    );
		
		var ViewTypeButton = new Ext.button.Cycle({
						id		: 'CMDBTypeIcon',
						hidden 	: true,
						tooltipType : 'title',
						menu: {
							items: [{
								text:_ServerValues.TileViewLabel,
								tab : 'tile',
								icon: getSDFStylesResPath()+ '/SDEFimages/cmdb_tiles-view.svg'
							},{
								text:_ServerValues.ListViewLabel,
								tab : 'list',
								icon: getSDFStylesResPath()+ '/SDEFimages/cmdb_list-view.svg'
							},{
								text:_ServerValues.TreeViewLabel,
								tab : 'tree',
								icon: getSDFStylesResPath()+ '/SDEFimages/cmdb_tree-view.svg'
							}]
						}
						,
						changeHandler:function(btn, item){
							this.setIcon(item.icon);
							this.setTooltip(item.text);
							if(!isfirst){
								CMDBManagerNamespace.instance.viewTypeChanged(item.tab,1);
								var cmdbViewIcon = document.getElementById("BTN_CDM_CMDBTypeIcon");
								if (cmdbViewIcon){
									cmdbViewIcon.focus();
								}
							}
						}
					});
		
		var SearchClassesCmp = new Ext.Component({ 
			html: '<span class="searchtext-input-wrapper"><a title="'+ _ServerValues.srchTxtFldLabel +'"class="rf-icon-search"></a> <input type="text" id="SearchClasses" name="SearchClasses" class="searchfield-input" autocomplete="off" size="23" placeholder="'+ cmdbViewSearch +'" /><a title="'+ _ServerLabels.Clear +'"  class="rf-icon-cross" ></a></span>'
		});
		var SearchPanelItems = [{
				xtype: 'tbspacer',
				width : 4
			},SearchClassesCmp,
			{
				xtype: 'tbspacer',
				width : 1
			},
			{
				xtype	: 'tbseparator',
				id		: 'viewBtnSeparator',
				hidden	: true
			},
			{
				xtype: 'tbspacer',
				width : 2
			},
			ViewTypeButton,
			{
				xtype: 'tbspacer',
				width : 2
			}
		];
		if( userLanguage == 'iw' ) {
			SearchPanelItems.reverse();
		}
		
		var searchPanels = new CMDB.Controls.Panel({
	        border: false,
	        autoWidth:true,
			height: 30,
	        bodyBorder: false,
			id:'searchPanel',
			items: [{
				xtype: 'toolbar',
				items: SearchPanelItems
           }] });
		
		InstanceBrowserColumn1.add(ElementList);
		if(isAssetManagementEnabled && showAsset && isCIManagementEnabled && showCI){
			Ext.getCmp('viewBtnSeparator').setVisible(true);
			Ext.getCmp('CMDBTypeIcon').setVisible(true);
			this.viewTypeChanged('tree',2);
			InstanceBrowserColumn1.add(new CMDBTabChooser(this.CMDBTabChangeHandler.createDelegate(this)));
		}else{
			InstanceBrowserColumn1.add(new CMDBTypeIcons(this.viewTypeChanged.createDelegate(this)));
		}
		InstanceBrowserColumn1.add(searchPanels);
	    InstanceBrowserColumn1.add(viewPanels);
	
	    browserContainerPanel.add(InstanceBrowserPanel);

	    var mainTabPanel = new CMDB.Controls.TabPanel({
	        
	        height: mainPanelHeight,
	        border:false,
	        id:'mainTabPanel',
	        border: false,
			autoWidth:true,
	        activeItem: 0,
            cls: 'x-tab-hide',
	        
	        bodyBorder: false
	    });
	    this.MainTabPanel=mainTabPanel
	    
	    mainTabPanel.add(browserContainerPanel);
		
	    mainPanel.add(mainTabPanel);
		
	
	    InstanceBrowserColumn2.add(this.getGridDisplay(instanceBrowserPanelHeight));	    	    
	    
	    return mainPanel;
	},
	RenderSearchClassesComponent : function() {
		var textInput = document.getElementById('SearchClasses');
		var clearBtn = textInput.nextSibling;
		textInput.onkeyup = function(e) {
			clearBtn.style.visibility = (this.value.length) ? "visible" : "hidden";
			ViewSearchText = textInput.value;
			new Ext.tree.TreeFilter(Ext.getCmp('treeViewPanel')).filter(ViewSearchText);
			updatedStore = CMDBManagerNamespace.instance.getClassViewStore();
			CMDBManagerNamespace.instance.searchTileView();
			if(viewNM == "tile"){
				CMDBManagerNamespace.instance.viewTypeChanged('tile',0);
			}
			CMDBManagerNamespace.instance.searchListView();
			hideNode();
		};
		//reset the input value
		clearBtn.onclick = function() {
			textInput.value = "";
			this.style.visibility = "hidden";
			ViewSearchText = '';
			new Ext.tree.TreeFilter(Ext.getCmp('treeViewPanel')).filter(ViewSearchText);
			updatedStore = CMDBManagerNamespace.instance.getClassViewStore();
			CMDBManagerNamespace.instance.searchTileView();
			if(viewNM == "tile")
				CMDBManagerNamespace.instance.viewTypeChanged('tile',0);
			CMDBManagerNamespace.instance.searchListView();
			hideNode();
		};
	},
	searchListView : function(){
		Ext.getCmp('ListViewGrid').getStore().loadData(updatedJson);
		if(viewNM == 'list')
			Ext.getCmp('ListViewGrid').getView().refresh();
	},
	
	searchTileView : function(){
		var item2 = new CMDBClassChooser(
										'tile',
										updatedStore, 
										CMDBManagerNamespace.instance.ExplorerItemClickHandler.createDelegate(this));
							this.TypeTileView = item2;
							var panelcomp1 = Ext.getCmp('TileViewPanel');
							panelcomp1.removeAll();
							panelcomp1.add(item2,true);
	},
	
	viewTypeChanged : function(name, index)
	{	
		if(isfirst){
			name = '';
			viewType = Ext.util.Cookies.get(userId);
			if(viewType != null){
				name = viewType;
			}
			else{
				if(hasPreviousVersion == "true")
					name = "tree";
				else
				    name = "list";
			}
			if(isAssetManagementEnabled && showAsset && isCIManagementEnabled && showCI){
				var CMDBTypeIcon = Ext.getCmp('CMDBTypeIcon'); 
				if(name == "tile")
					CMDBTypeIcon.setActiveItem(0,true);
				else if(name == "list")
					CMDBTypeIcon.setActiveItem(1,true);
				else if(name == "tree")
					CMDBTypeIcon.setActiveItem(2,true);
			}
		}
		if(name == "tile")
			index = 0;
	    else if(name == "list")
		    index = 1;
		else if(name == "tree"){
		    index = 2;
			isTreeViewLoaded = true;
		}
		this.viewPanels.setActiveTab(index);
		//this.resizeTypeViews();
		if(!(isAssetManagementEnabled && showAsset && isCIManagementEnabled && showCI) && this.SelectedRecordID == '')
			this.syncTypeViews('BMC_BaseElement');
		else
			this.syncTypeViews(this.SelectedRecordID);

		hideNode();
		viewType = '';
		viewNM = name;
		var today = new Date();
		var expiry = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
		document.cookie = userId+'='+name+';path=/;SameSite=None;Secure;expires='+expiry.toUTCString();
	},
	
	getNameSpaceListStore : function() {
	    var strXML = _ServerValues.NamespaceListXML;
	    xmlObject = this.getXMLObjectFromString(strXML);
	
	    var dataStore = new Ext.data.XmlStore({
	        autoDestroy: false,
	        proxy: new Ext.data.MemoryProxy(xmlObject),
	        record: 'namespace',
	        idPath: 'Name',
	        fields: ['Name', 'DisplayName']
	    });
	    dataStore.load();
	
	    return dataStore;
	},
	
	getElementListStore : function() {
	    var strXML = _ServerValues.ElementsListXML;
	    xmlObject = this.getXMLObjectFromString(strXML);
	
	    var dataStore = new Ext.data.XmlStore({
	        autoDestroy: false,
	        proxy: new Ext.data.MemoryProxy(xmlObject),
	        record: 'element',
	        idPath: 'Name',
	        fields: ['Name', 'DisplayName']
	    });
	
	    dataStore.load();
	
	    return dataStore;
	},
	
	getXMLObjectFromString : function(strXML) {
	    var doc = null;
	
	    //load XML string code for IE
	    if (window.ActiveXObject) {
	        doc = new ActiveXObject("Microsoft.XMLDOM");
	        doc.async = "false";
	        doc.loadXML(strXML);
	    }
	    //load XML string code for Mozilla, Firefox, Opera, etc.
	    else {
	        var parser = new DOMParser();
	        doc = parser.parseFromString(strXML, "text/xml");
	    }
	
	    return doc.documentElement;
	},
	
	getClassViewStore : function() {
	    var json = _ServerValues.ClassViewListJSON;
		if(typeof(RuleClass) == 'undefined' || RuleClass == null || RuleClass == '')
			isRBAClass = false;
	    //json = [{ Name: "myname", DisplayName: "DispName", Image: "img",CMDBClassType: "CI", Abstract: false }, { Name: "myname", DisplayName: "DispName", Image: "img",CMDBClassType: "Asset", Abstract: true}]; 
		// For Base Element entry CMDBClassType will be '' blank
	    json = eval(Ext.util.Format.htmlDecode(json));
		readAccessClassIdsArr=[];
		if(isCMDBClassPermissionsEnable && _ServerValues.classAccessMap){
			classAccessMap = JSON.parse(_ServerValues.classAccessMap);
			readAccessRBAClassIdsArr=JSON.parse(_ServerValues.readAccessRBAClassIds);
			for(index=0; index<json.length; index++){		
				var cName = json[index].Name;
				if(cName){
					cName = cName.toLowerCase();
				}
				if(cName && classAccessMap[cName] && !classAccessMap[cName].Permissions.isAccessible && cName !='bmc_baseelement'){
					json.splice(index,1);
					index = index-1;					
				}
			}
			Object.keys(classAccessMap).forEach(function(key) {
				if(key && classAccessMap[key] && classAccessMap[key].Permissions.isAccessible){
					readAccessClassIdsArr.push(classAccessMap[key].recordId);
				}
			});	
		}
		if(json != null && typeof(json) != 'undefined' && json !=''){
			if(selectedTab == 'CI'){
				if(CIJson.length == 0){
					CIJson = [];
					for (var i in json) {
						var elem = json[i];
						if(elem.CMDBClassType == 'CI' || elem.CMDBClassType == 'CI and Asset'){
							CIJson.push(elem);
						}else if(elem.CMDBClassType == ''){
							elem.DisplayName = _ServerValues.CMDB_ALL_CIs;
							CIJson.push(elem);
						}
					}
				}else{
					CIJson[0].DisplayName = _ServerValues.CMDB_ALL_CIs;
				}
				json = CIJson;
			}else if(selectedTab == 'Asset'){
				if(AssetJson.length == 0){
					AssetJson = [];
					for (var i in json) {
						var elem = json[i];
						if(elem.CMDBClassType == 'Asset'  || elem.CMDBClassType == 'CI and Asset'){
							AssetJson.push(elem);
						}else if(elem.CMDBClassType == ''){
							elem.DisplayName = _ServerValues.CMDB_ALL_ASSETS;
							AssetJson.push(elem);
						}
					}
				}else{
					AssetJson[0].DisplayName = _ServerValues.CMDB_ALL_ASSETS;
				}
				AssetJson[0].abstract = true;
				json = AssetJson; 
			}else{
				json[0].DisplayName = _ServerValues.CMDB_ALL_INSTANCES;
			}
		}
	    if(ViewSearchText != ''){
			var tempJson = [];
			var j = 0;
			for (i = 0; i < json.length; i++) {
			    var tempString = json[i].DisplayName.toLowerCase();
				var pos = tempString.indexOf(ViewSearchText.toLowerCase());
				if(pos != -1){
					tempJson[j] = json[i];
					j++;
				}
			}
			json = '';
			json = tempJson;
		}else{
			/* Adding '!!' to Display Name of Base Element to make it appear first after sorting of store */
			if(json[0]){
			json[0].DisplayName = '!!'+json[0].DisplayName;
		}
		}
	    var dataStore = new Ext.data.JsonStore({
	        //proxy: new Ext.data.MemoryProxy(json),
			proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						},
						data: json
					},
	        idProperty: 'Name',
			fields: ['Name', {name:'DisplayName',sortType:Ext.data.SortTypes.asUCString}, 'Image', 'CMDBClassType','Abstract','Ruleclass'],
			sorters: [{property:'DisplayName', direction: 'ASC'}],
			sortOnLoad: true,
			//groupDir: 'ASC',
			//groupField: 'DisplayName',
			autoLoad: true,
			listeners:{
				datachanged : function( store ){
					
					//var BErecord = store.getById('BMC_BaseElement');
					var BErecord = store.getAt(0);
					
					if( typeof(BErecord) != 'undefined' && BErecord.data.Name.indexOf( 'BMC_BaseElement' ) != -1 && BErecord.data.DisplayName.indexOf('!!') != -1)
						BErecord.data.DisplayName = BErecord.data.DisplayName.split('!!')[1]; 
				},
				save : function(store, batch, data){
					//var BErecord = store.getById('BMC_BaseElement');
					var BErecord = store.getAt(0);
					
					if( typeof(BErecord) != 'undefined' && BErecord.data.Name.indexOf( 'BMC_BaseElement' ) != -1 && BErecord.data.DisplayName.indexOf('!!') != -1)
						BErecord.data.DisplayName = BErecord.data.DisplayName.split('!!')[1];
				}
			}
	    });
	
		updatedJson = json;
		dataStore.load();
	    
	    return dataStore;
	},
	
	getClassListView : function(newHeight) {
	
		var cvstore = this.getClassViewStore();
		
		
		var tpl_img = new Ext.XTemplate(
	                    '<tpl for=".">',
	                    '<tpl if="((Image.length == 15 || Image.length == 18) && pattern.test(Image))">',
	                    '<img class="thumb-img" id="{Name}Id" src="{[getSFDocumentURL(values.Image)]}" width="20" height="20" >',
						'</tpl>',
						'<tpl if="!((Image.length == 15 || Image.length == 18) && pattern.test(Image))">',
	                    '<img class="thumb-img" id="{Name}Id" src="'+CIFORCE_RES_PATH+'/images/ci/{Image}_32.svg" width="20" height="20" >',
	                    '</tpl>',
	                    '</tpl>'
	                ).compile();
	                
	
	    var listView = new CMDB.Controls.GridPanel({
		    id : 'ListViewGrid',
	        hideHeaders: true,
	        rowLines:false,
	        store: cvstore,
	        forceFit :true,
	        autoScroll: true,
			defaults: {sortable: true},
	        height: newHeight,
	        selModel: new Ext.selection.RowModel({mode:"SINGLE"}),
	        columns: [
	            new Ext.grid.TemplateColumn({ tpl: tpl_img, width: 30, dataIndex: 'Image', tpl: tpl_img }),
	            { id: 'DisplayName', dataIndex: 'DisplayName',width:143 , sortable:true },
				{ 	id: 'CMDBClassType',
					width : 80,  
					dataIndex: 'CMDBClassType' , 
					sortable:true,
					renderer: function(value, metaData, record, rowIndex, colIndex, store){
						if(value == 'CI')
							value = _ServerValues.CMDB_TAB_CIs;
						else if(value == 'CI and Asset')
							value = _ServerValues.CIAndAsset;
						else if(value == 'Asset')
							value = _ServerValues.CMDB_TAB_Assets;
						
						return value;
					}
				}
	            ],
           autoExpandColumn: 'DisplayName',
	        viewConfig: {
                sortAscText : strAscending,
                sortDescText : strDescending,
                columnsText : strSelectColumn,  
	            scrollOffset:0,
				stripeRows: false
	        },
			listeners: {
			        viewready : function(grid) {
			                this.syncTypeViews(this.SelectedRecordID);
							if(selectedTab != 'All'){
								grid.down('headercontainer').getGridColumns()[1].setWidth( 143 + 80 );
								grid.down('headercontainer').getGridColumns()[2].setVisible(false);
								//grid.getColumnModel().setHidden(2, true);
							}
							/*PENDING
							var rowCount=cvstore.data.length;
							 for (i=0; i<rowCount; i++) { 
							  var gridCell=grid.getView().getCell(i,1);
							   var cellRec = cvstore.getAt(i);
							    gridCell.firstChild.id =cellRec.get('Image')+'Id';
							  
							 }*/
			            }.createDelegate(this)
			    },
	        border: false
	    });
	
	    listView.on('itemclick', 
	    	function(grd, record, item, index, e, eOpts) {
				record = record;
				selectedClsType = record.data.CMDBClassType;
				RuleClass = record.data.Ruleclass;
				if(typeof(RuleClass) != 'undefined' && RuleClass !=null && RuleClass !=''){
					isRBAClass = true;
				}
				isabstract = record.data.Abstract;
				this.ExplorerItemClickHandler(record.data.Name);
		    }.createDelegate(this)	
	    );
		
		listView.getSelectionModel().on('selectionchange', function(selModel, selected, e){
				record = selected[0];
				if(typeof(record)!='undefined')
				{
					selectedClsType = record.data.CMDBClassType;
					RuleClass = record.data.Ruleclass;
					if(typeof(RuleClass) != 'undefined' && RuleClass !=null && RuleClass !=''){
						isRBAClass = true;
					}
					isabstract = record.data.Abstract;					
					this.ExplorerItemClickHandler(record.data.Name);					
				}
	    	}.createDelegate(this));
	
		this.TypeListView = listView;
	    return listView;
	
	},
		
	getClassTileView : function(displayStyle, newHeight) {
	
	    var item = new CMDBClassChooser(
	    				displayStyle,
    					this.getClassViewStore(), 
    					this.ExplorerItemClickHandler.createDelegate(this));
    					
	    this.TypeTileView = item;
	
	    return new CMDB.Controls.Panel({ id :'TileViewPanel',autoScroll: true, border: false, height: newHeight, items: item })
	},
	
	getClassTreeView : function(newHeight) {
	
	    var root = getRootForTreeView();
		var treeViewPanel;
	    var t = new Ext.tree.TreePanel({
			id:'treeViewPanel',
	        store: root,
			useArrows: true,
	        autoScroll: true,
	        border: false,
	        rootVisible: false,
	        height: newHeight,
			listeners: {
	            
	            afterrender: function(treeComp) {
	                this.syncTypeViews(this.SelectedRecordID);
					
					if(treeComp != null && treeComp.getRootNode() != null && treeComp.getRootNode().firstChild != null && 
						treeComp.getRootNode().firstChild.data != null && treeComp.getRootNode().firstChild.data.id != null)
					{
						selectedClsType = treeComp.getRootNode().firstChild.data.CMDBClassType;
						RuleClass = treeComp.getRootNode().firstChild.data.Ruleclass;
						if(typeof(RuleClass) != 'undefined' && RuleClass !=null && RuleClass !='')
							isRBAClass = true;
						treeComp.getSelectionModel().select(treeComp.getRootNode());
						if(isfirst){
							this.ExplorerItemClickHandler(treeComp.getRootNode().firstChild.data.id);
						}
					}
					
					
					treeViewPanel = document.getElementById('treeViewPanel');
					hideNode();						
				}.createDelegate(this),
					
				viewready: function() {
					if(ViewSearchText)
						new Ext.tree.TreeFilter(Ext.getCmp('treeViewPanel')).filter(ViewSearchText);
				},
					
				itemexpand : function(treeComp){
					if(treeViewPanel && ViewSearchText != '')
						treeViewPanel.setAttribute("style", "display: none");						
				}.createDelegate(this),
				
				afteritemexpand : function(treeComp){					
					var treePanelDom = Ext.getCmp('treeViewPanel');
					if(ViewSearchText != '' && treePanelDom){							
						new Ext.tree.TreeFilter(treePanelDom).filter(ViewSearchText);							
					}
					if(treeViewPanel && ViewSearchText != '')
							treeViewPanel.setAttribute("style", "display: block");
					hideNode();						
				}.createDelegate(this),
	            
	            itemclick: function( n, record, item, index, e, eOpts) {
						selectedClsType = record.raw.CMDBClassType;
						RuleClass = record.raw.Ruleclass;
						if(typeof(RuleClass) != 'undefined' && RuleClass !=null && RuleClass !='')
							isRBAClass = true;						
						this.ExplorerItemClickHandler(record.raw.id);						
	            }.createDelegate(this)
	        }
	    });
		
		t.expand();
		
	    this.TypeTreeView = t;
	    
	    return t;
	},
	
	/*GridRowClick : function(grd, rowIndex, e) {
	    record = grd.getStore().getAt(rowIndex);
	},*/
	
	
	getGridDisplay : function(containerPanelHeight) {
	
	    var toolBarHeight = 40;
	    var gridPanelHeight = containerPanelHeight - toolBarHeight -24;
		pagingBar = getPagingToolbar();		
	    var xmlGridPanel = new CMDB.Controls.GridPanel({
	        id: 'XMLGridPanel',
	        store: this.getInstanceListStore(),//this.getInstanceListStore(),
	        dockedItems: [pagingBar],
	        columns: this.getGridFieldsWithLockedProperty(incGridforBE),//GridColumns,
			selType: 'rowmodel',
			enableLocking:true,
			enableColumnHide:false,
			enableColumnMove: false,
			normalGridConfig : {
				emptyText: _ServerValues.NoRecordFoundMsg,
			},
	        viewConfig: {
                sortAscText : strAscending,
                sortDescText : strDescending,
                columnsText : strSelectColumn,  
	            forceFit: false,
				scrollOffset:50,
				stripeRows: false,
	        },
			border: false,
	       	selModel: isFromRelationship ? selModelCheckBox :  new Ext.selection.RowModel({	mode:"SINGLE" }),
	        height: gridPanelHeight,
			listeners: {
				afterrender : function(grid) {
					grid.view.getEl().on('scroll', function(e, t) { 
					   if(typeof HideActiveFilterComponent  == "function" ){
							HideActiveFilterComponent();
					   }       
					});	
					changeGridDirectionForRTL();
				},
				sortchange: function(ct, column, direction, eOpts) {
					showWaitMsgBar();
					newSortColumn = column.dataIndex;
					if(newSortDirection == 'ASC'){
						newSortDirection = 'DESC';
					}else{
						newSortDirection = 'ASC';
					}
					CMDBManagerNamespace.instance.getInstanceListStore();
				}
			}
	    });
	    xmlGridPanel.child('[dock=bottom]').add([
					'->',
					{
						text: _ServerLabels.RecordsPerPage,
						xtype:'label'
					},
					
					Ext.create('Ext.form.ComboBox', {
						store: Ext.create('Ext.data.Store', {
							fields: ['value', 'label'],
							data :  [
										{ value: 10, label: "10"},
										{ value: 25, label: "25"},
										{ value: 50, label: "50"},
										{ value: 100, label: "100"},
										{ value: 200, label: "200"}
									]
						}),
						queryMode: 'local',
						displayField: 'label',
						valueField: 'value',
						margin:'4 15 4 8',
						editable: false,
						forceSelection: true,
						typeAhead: true,
						width: 60,
						
						listeners: {
							afterrender: function () {
								var savedPageSize = Ext.util.Cookies.get('ListPageSize');
								if(savedPageSize){
									this.setValue(parseInt(savedPageSize));	
								}else{
									this.setValue(CMDBManagerNamespace.instance.Paging_PageSize);
								}	
								CMDBManagerNamespace.instance.RenderSearchComponent();
							},
							change: function(o, newValue, oldValue, opts) {
								if(typeof(oldValue)!='undefined' && oldValue!=null) {
									var today = new Date();
									var expiry = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
									document.cookie = 'ListPageSize='+newValue+';path=/;SameSite=None;Secure;expires='+expiry.toUTCString();
									CMDBManagerNamespace.instance.Paging_PageSize = newValue;
									CMDBManagerNamespace.instance.Paging_PageNumber = 1;
									showWaitMsgBar();
									CMDBManagerNamespace.instance.getInstanceListStore();
								}
							}
						}
						
					})
				
				]);
	    xmlGridPanel.on('itemdblclick', function(grd, record, item, index, e, eOpts){
			if(isFromRelationship){
					grd.getSelectionModel().deselectAll();
					grd.getSelectionModel().select(index);
				    this.SelectInstance();
						
			}else{
				this.LoadCI();
			}
		}.createDelegate(this));
		xmlGridPanel.on('itemclick', function(grd, record, item, index, e, eOpts){
			if(isFromRelationship){
				this.EnableSelectInstance();
			}else{
				this.OnRowSelect(grd, record, item, index, e, eOpts);
			}
		}.createDelegate(this));
	    this.InstancesGrid = xmlGridPanel;
		
		xmlGridPanel.getSelectionModel().on('selectionchange', function(grd, row, e){
			this.ChangeBtnStatus();
			if(isFromRelationship){
				this.EnableSelectInstance();
			}else{
				this.OnRowSelect(grd, row[0]);
			}
		}.createDelegate(this));
	    
	    xmlGridPanel.on('render', function(grd, row, e){
			this.ChangeHeaderTitle(selectedTab,selectedclass); 
			this.ChangeBtnStatus();
		}.createDelegate(this));
		
	
		xmlGridPanel.normalGrid.headerCt.on('headertriggerclick', function(ct, column, e, t, eOpts) {
			if(typeof HeaderTriggerClickHandler  == "function" ){
				HeaderTriggerClickHandler(ct, column, e, t, eOpts);
			}
			return false;
		}.createDelegate(this));
		xmlGridPanel.lockedGrid.headerCt.on('headertriggerclick', function(ct, column, e, t, eOpts) {
			if(typeof HeaderTriggerClickHandler  == "function" ){
				HeaderTriggerClickHandler(ct, column, e, t, eOpts);
			}
			return false;
		}.createDelegate(this));

	    var XMLGridActiveFilterPanel = new CMDB.Controls.Panel({
	        border: false,
	        id: 'XMLGridActiveFilterPanel',
	        html: 'This section is for advanced filters'
	    });
	    var XMLGridButtonsPanel = new CMDB.Controls.Panel({
	        id: 'XMLGridButtonsPanel',
	        border: false,
	        autoWidth:true,
	        items: this.generateToolbarButtons(toolBarHeight)
	    });
	
	
	    var XMLGridBrowserPanel = new CMDB.Controls.Panel({
	        id: 'XMLGridBrowserPanel',
	        height: containerPanelHeight,
	        layout: 'border',
	        border: false,
	        autoWidth:true,
			header:true,
			title: _ServerValues.InstanceGridTitle,
			items: [
	                { region: 'center',  layout:'fit', items: xmlGridPanel, border: false },
	                { region: 'north',  layout:'fit', height: 32, items: XMLGridButtonsPanel, border: false }
	            ]
	    });
	
	    return XMLGridBrowserPanel;
	},
	getGridFilterPanel: function() {
	    var pnl = new CMDB.Controls.Panel({
	        id: 'XMLGridFilterPanel',
	        border: false,
	        html: ''
	    });
	    return pnl;
	},
	SelectInstance: function() {
		var grid = Ext.getCmp("XMLGridPanel");
		var selRecords = grid.getSelectionModel().getSelection();
		var selRecordsIds = []
		for(var i=0;i<selRecords.length; i++){
			selRecordsIds.push(selRecords[i].data.InstanceID__c); 
		}

		if(selRecordsIds && selRecordsIds.length > 0){
			window.opener.valselected(selRecordsIds);
				window.close();
		}
		
	},
	EnableSelectInstance:function(){
		var grid = Ext.getCmp("XMLGridPanel"); 
		if(grid.getSelectionModel().getSelection().length > 0){
			Ext.getCmp('selectInstanceBtn').enable();
		}else{
			Ext.getCmp('selectInstanceBtn').disable();
		}
	},
	RenderSearchComponent : function() {
		var textInput = document.getElementById('searchTxt');
		var clearBtn = textInput.nextSibling;
		textInput.onkeyup = function(e) {
			clearBtn.style.visibility = (this.value.length) ? "visible" : "hidden";
			if (e.keyCode === 13) {
				SearchCI();
			}
			if(this.value == '' && searchstring != ''){
				setFocusOnSearchText = true;
				CMDBManagerNamespace.instance.pageRefresh(true);
			}
		};
		//reset the input value
		clearBtn.onclick = function() {
			textInput.value = "";
			this.style.visibility = "hidden";
			CMDBManagerNamespace.instance.pageRefresh(true);
		};
		var clearallfilterDom=document.getElementById('clearallfilter');
		if(clearallfilterDom){
			clearallfilterDom.style.opacity="0.5";
		}
	},
	generateToolbarButtons : function(toolBarHeight) {
		var SearchCmp = new Ext.Component({ 
			html: '<span class="searchtext-input-wrapper"><a title="'+ _ServerValues.srchTxtFldLabel +'"class="rf-icon-search" onclick="SearchCI();" ></a> <input type="text" id="searchTxt" name="searchTxt" class="searchfield-input" autocomplete="off" size="26" placeholder="'+ cmdbInstanceSearch +'" /><a title="'+ _ServerLabels.Clear +'"  class="rf-icon-cross" ></a></span>'
		});
		var ToolbarItems = [
						{
							xtype: 'tbspacer',
							width : 5
						},{
			                scale: 'medium',
			                //iconCls: 'bmcNew',
			                tooltipType : 'title',
			                tooltip: _ServerValues.New, 
			                id:'newInstanceBtn',
			                baseCls: 'bmc-btn-primary',
							disabledCls: 'bmc-btn-primary-disabled',    
							focusCls: 'bmc-btn-primary-focus',
							overCls: 'bmc-btn-primary-over',
							pressedCls:'bmc-btn-primary-pressed',
							text: _ServerValues.New,
			                hidden:isFromRelationship,
			              listeners: {
			                    mouseover: function(){
			                        this.setIconCls('bmcNewOn');    
			                    },
			                    mouseout: function(){
			                        this.setIconCls('bmcNew');          
			                    },
								disable: function(){
			                        this.setIconCls('bmcNewDisable');    
			                    },
			                    enable: function(){
			                        this.setIconCls('bmcNew');          
			                    }
			                },
	                        handler:this.NewCI.createDelegate(this)
			            }, {
							xtype: 'tbspacer',
							hidden:isFromRelationship,
							width : 5
						},
						{
			                scale: 'medium',
			                //iconCls: 'bmcEditCI',
			                tooltipType : 'title',
			                tooltip: _ServerValues.Edit,
			                id:'editInstanceBtn',
			                baseCls: 'bmc-btn-small',
			                disabledCls: 'bmc-btn-disabled',
			                focusCls: 'bmc-btn-focus',
			                overCls: 'bmc-btn-over',
							pressedCls:'bmc-btn-pressed',
							text:  _ServerValues.Edit,
			                hidden:isFromRelationship,
			                listeners: {
			                    mouseover: function(){
			                        this.setIconCls('bmcEditCIOn');    
			                    },
			                    mouseout: function(){
			                        this.setIconCls('bmcEditCI');          
			                    },
			                    disable: function(){
			                        this.setIconCls('bmcEditCIDisable');    
			                    },
			                    enable: function(){
			                        this.setIconCls('bmcEditCI');          
			                    }
			                },
	                        handler:this.LoadCI.createDelegate(this)
			            },{
			                scale: 'medium',
			                tooltipType : 'title',
			                tooltip: _ServerLabels.SelectCI, 
			                id:'selectInstanceBtn',
			                baseCls: 'bmc-btn-primary',
							disabledCls: 'bmc-btn-primary-disabled',    
							focusCls: 'bmc-btn-primary-focus',
							overCls: 'bmc-btn-primary-over',
							pressedCls:'bmc-btn-primary-pressed',
							text: _ServerLabels.Select,
			                hidden:!isFromRelationship,
							listeners: {
			                    mouseover: function(){
			                        this.setIconCls('bmcNewOn');    
			                    },
			                    mouseout: function(){
			                        this.setIconCls('bmcNew');          
			                    },
								disable: function(){
			                        this.setIconCls('bmcNewDisable');    
			                    },
			                    enable: function(){
			                        this.setIconCls('bmcNew');          
			                    }
			                },
	                        handler:this.SelectInstance.createDelegate(this)
			            }, {
							xtype: 'tbspacer',
							hidden: !isFromRelationship,
							width : 5
						},
						{
			                scale: 'medium',
			                tooltipType : 'title',
			                tooltip: _ServerLabels.Cancel,
			                id:'cancelInstanceBtn',
			                baseCls: 'bmc-btn-small',
			                disabledCls: 'bmc-btn-disabled',
			                focusCls: 'bmc-btn-focus',
			                overCls: 'bmc-btn-over',
							pressedCls:'bmc-btn-pressed',
							text: _ServerLabels.Cancel,
			                hidden:!isFromRelationship,
	                        handler:function (){window.close()}
			            },{
							xtype: 'tbspacer',
							hidden:isFromRelationship,
							width : 5
						},
						{
			                scale: 'medium',
			                //iconCls: 'bmcDelete',
			                tooltipType : 'title',
			                tooltip: _ServerValues.Delete, 
			                id:'deleteInstanceBtn',
			                baseCls: 'bmc-btn-small',
			                disabledCls: 'bmc-btn-disabled',
			                focusCls: 'bmc-btn-focus',
			                overCls: 'bmc-btn-over',
							pressedCls:'bmc-btn-pressed',
							text:  _ServerValues.Delete,
			                hidden:isFromRelationship,
			                listeners: {
			                    mouseover: function(){
			                        this.setIconCls('bmcDeleteOn');    
			                    },
			                    mouseout: function(){
			                        this.setIconCls('bmcDelete');          
			                    },
			                    disable: function(){
			                        this.setIconCls('bmcDeleteDisable ');    
			                    },
			                    enable: function(){
			                        this.setIconCls('bmcDelete');          
			                    }
			                },
	                        handler:this.DeleteCI.createDelegate(this)
	                    }, {
							xtype: 'tbspacer',
							hidden:isFromRelationship,
							width : 5
						},{ xtype: 'tbseparator',hidden:isFromRelationship },
	                    {
							xtype: 'tbspacer',
							hidden:isFromRelationship,
							width : 5
						},{
			                xtype: 'button',
							hidden:isFromRelationship,							
							autoEl: {
								'title': _ServerValues.LaunchCIExplorerLabel
								},				
			                scale: 'medium',
			                iconCls: 'bmcCIExplorer',
			                //tooltipType : 'title',
			                //tooltip: _ServerValues.LaunchCIExplorerLabel, 
			                id:'ciExplorerBtn',
			                //baseCls: 'd-icon-laptop_server_storage',
			                //cls: 'cmdbIconCls',
			                
			                listeners: {
			                    /*mouseover: function(){
			                        this.setIconCls('bmcCIExplorerOn');    
			                    },
			                    mouseout: function(){
			                        this.setIconCls('bmcCIExplorer');          
			                    },*/
			                    disable: function(){
			                        this.setIconCls('bmcCIExplorer disablecss');    
			                    },
			                    enable: function(){
			                        this.setIconCls('bmcCIExplorer');          
			                    }
			                },
	                        handler:this.ExploreCI.createDelegate(this)
			            }, { xtype: 'tbseparator',hidden:isFromRelationship },{
							xtype: 'tbspacer',
							hidden:isFromRelationship,
							width : 5
						},
						{            
			                xtype: 'button',
			                scale: 'medium',
			                id:'ciCMDBEditBtn',
			                autoEl: {
								'title': launchcieditor
								},
			                iconCls: 'bmcCMDBEditCi',			                
							hidden : (!isFlattenedCmdb ||isFromRelationship) ,
							border:false,
							disable: function(){
								this.setIconCls('bmcCMDBEditCi disablecss');    
							},
							enable: function(){
								this.setIconCls('bmcCMDBEditCi');          
							},
			                //baseCls: 'd-icon-app_pencil_circle',
			                //cls: 'cmdbIconCls',
	                        handler:this.CMDBCiEdit.createDelegate(this)
			            },{
							xtype: 'tbspacer',
							width : 5,
							hidden : (!isFlattenedCmdb ||isFromRelationship)
						},
						{
                            xtype: 'button',				
							scale: 'medium',
							iconCls:'aCLaunchFPBtn',
                            //cls:'cmdbIconCls',
							id:'ACLaunchFPBtn',
                            tooltipType : 'title',
							tooltip: _ServerValues.ACLaunchFPConsole,
							hidden : (!(isACEnabled || isDiscoveryEnabled) || isFromRelationship),
                            handler: this.ACLaunchFPConsole.createDelegate(this),
                            listeners: {
                                disable: function(){
                                    //this.setIconCls('bmcLaunchFPConsoleDisable'); 
                                    this.setIconCls('aCLaunchFPBtn disablecss');
                                },
                                enable: function(){
                                    //this.setIconCls('bmcLaunchFPConsole'); 
                                    this.setIconCls('aCLaunchFPBtn');
                                },
                                /*afterrender: function() {
                                	if(isDiscoveryEnabled){
                                		if(enableFPConsole != '' && enableFPConsole == 'true'){
	                                		this.enable();
	                                		this.setTooltip(_ServerValues.ACLaunchFPConsole);
	                                	}else{
	                                		this.disable();
	                                		if(isAdmin == 'true')
	                                			this.setTooltip(_ServerValues.AdminDisabledText);
	                                		else
	                                			this.setTooltip(_ServerValues.ContactSysAdmin);
	                                	}
                                	}
                                }*/
                            }
                        },{
							xtype: 'tbspacer',
							width : 5,
							hidden : (!(isACEnabled || isDiscoveryEnabled) || isFromRelationship)
						},
						{
                            xtype: 'button',				
							autoEl: {
								'title': _ServerValues.LaunchDellKace
								},
                            scale: 'medium',
                            //baseCls:'d-icon-pop_up',
                            iconCls: 'dKLaunchBtn',
                            //cls:'cmdbIconCls',
                            //tooltipType : 'title',
                            //tooltip: _ServerValues.LaunchDellKace, 
                            id:'DKLaunchBtn',
							hidden : (!isDKEnable || isFromRelationship),
                            handler: this.LaunchDKConsole.createDelegate(this),
                            listeners: {
                                disable: function(){
                                    //this.setIconCls('bmcLaunchDKConsoleDisable'); 
                                    this.setIconCls('dKLaunchBtn disablecss'); 
                                },
                                enable: function(){
                                    //this.setIconCls('bmcLaunchDKConsole');
                                    this.setIconCls('dKLaunchBtn');
                                }
                            }
                        },{
							xtype: 'tbspacer',
							width : 5,
							hidden : (!isDKEnable || isFromRelationship),
						},{ xtype: 'tbseparator',hidden:isFromRelationship },
						{
							xtype: 'tbspacer',
							hidden:isFromRelationship,
							width : 5
						},
						{
                            xtype: 'button',
							hidden:isFromRelationship,							
							autoEl: {
								'title': _ServerValues.APM
								},
                            scale: 'medium',
                            iconCls: 'bmcAPM',
                            //tooltipType : 'title',
                            //tooltip: _ServerValues.APM, 
                            id:'ciCMDBapmBtn',
                            //baseCls: 'd-icon-uml',
                            //cls: 'cmdbIconCls',
                            
                            /*listeners: {
                        		mouseover: function(){
                                    this.setIconCls('disablecss');    
                                },
                                mouseout: function(){
                                    this.setIconCls('bmcAPM');          
                                }
                            },*/
                            handler: this.OpenBMCAPM.createDelegate(this)
                        },{
							xtype: 'tbspacer',
							hidden:isFromRelationship,
							width : 5
						},
			            {
                            xtype: 'button',							
							autoEl: {
								'title': _ServerValues.Report
								},
                            scale: 'medium',
                            iconCls: 'bmcCMDBReport',
                            //baseCls:'d-icon-file_clock',
                            //cls:'cmdbIconCls',
                            //tooltipType : 'title',
                            //tooltip: _ServerValues.Report, 
                            id:'ciCMDBReportBtn',
							hidden : (hideReportButton || isFromRelationship),
                            listeners: {
                                disable: function(){
                                    this.setIconCls('bmcCMDBReport disablecss');    
                                },
                                enable: function(){
                                    this.setIconCls('bmcCMDBReport');          
                                }
                            },
                            handler: this.CMDBReport.createDelegate(this)
                        },{
							xtype: 'tbspacer',
							width : 5,
							hidden : (hideReportButton || isFromRelationship),
						},{
                            xtype: 'button',				
							autoEl: {
								'title': _ServerValues.UpdateCICount
								},
                            scale: 'medium',
                            iconCls: isAdmin ? 'bmcUpdateCICount' : 'bmcUpdateCICount disablecss',
                            hidden :isFromRelationship,
                            //tooltip: _ServerValues.UpdateCICount, 
                            id:'ciCMDBCICountUpdateBtn',
                            //baseCls: 'd-icon-file_chart',
                            //cls: 'cmdbIconCls',
                            listeners: {
                                disable: function(){
                                    this.setIconCls('bmcUpdateCICount disablecss');    
                                },
                                enable: function(){
                                    this.setIconCls('bmcUpdateCICount');          
                                }
                            },
                            handler: this.UpdateCICount.createDelegate(this)
                        },{
							xtype: 'tbspacer',
							hidden :isFromRelationship,
							width : 5
						},{
							xtype: 'button',						
							autoEl: {
								'title': _ServerValues.ChangeScheduleDesc
								},
							scale: 'medium',
			                iconCls: 'bmcChangeSchedule',
			                //tooltipType : 'title',
			                //tooltip: _ServerValues.ChangeScheduleDesc,							
			                id:'iconChngeSchedule',
			                //baseCls: 'd-icon-calendar',
			                //cls: 'cmdbIconCls',
							hidden: (_ServerValues.viewChangeSchedule=='false'?true:false || isFromRelationship),
	                        handler:this.ChangeScheduleHandler.createDelegate(this)
                        },{
							xtype: 'tbspacer',
							width : 5,
							hidden: (_ServerValues.viewChangeSchedule=='false'?true:false || isFromRelationship),
						},{ xtype: 'tbseparator',hidden:isFromRelationship },
						{
							xtype: 'tbspacer',
							width : 5
						},
						{
							xtype: 'button',							
							autoEl: {
								'title': _ServerValues.ViewsTitle
								},
							id:'viewMenu',
							scale: 'medium',
							//iconCls: 'd-icon-app_list_eye bmc-btn-dropdown',
							iconCls : 'viewMenu',
							//baseCls: 'd-icon-app_list_eye bmc-btn-dropdown',
							//baseCls: 'bmc-btn-dropdown',
							//cls: 'cmdbIconCls',
							//style:{transform: 'scaleX(-1)'},
			                listeners: {
			                    afterrender: function() {
			                        if (SelectedRecordIDCookieVal == 'BMC_BusinessService') {
			                            var showCIMenu = Ext.getCmp('ShowCIs');
			                            this.SelectedRecordID = 'BMC_BusinessService';
			                            toggleCheckBoxes(showCIMenu, false);
			                            toggleCheckBoxes(Ext.getCmp('ShowBusinessServices'), true);
			
			                        }
			                    }
			                },
							menu: new Ext.menu.Menu({
									autoWidth : true,
									showSeparator: false,
									plain: true,
									baseCls: 'bmc-menu',
									id: 'viewsDropDown',
									items: [{
										xtype: 'menucheckitem',
										id :'ShowDerivedCIsButton',
										baseCls:'bmc-menu-item',
										//baseCls: 'd-icon-square_o bmc-menu-item',
										//iconCls:'bmc-menu-item', 
										overCls:'bmc-menu-item-over',
										text : _ServerValues.ShowDerivedCIs,
										boxLabel:_ServerValues.ShowDerivedCIs,
                                        checked: ShowDerivedCIsCookieVal,
										//checkedCls: 'd-icon-check_square_o bmc-menu-item',
										autoWidth: true,
										handler:this.ShowDerivedCIsClicked.createDelegate(this),
										listeners: {
		                                    afterrender: function() {
		                                        if (ShowDerivedCIsCookieVal) {
		                                            this.ShowDerivedCIs = true;
		                                        }
		                                    }/*,
											'checkchange': function(ctrl, checked){
												if(Ext.isIE7 || Ext.isIE8){
													if(checked){
														this.ShowDerivedCIs = checked;
													}else{
														this.ShowDerivedCIs = false;
													}
													this.Paging_PageNumber=1;
													this.getInstanceListStore();
												}
											}.createDelegate(this)*/
										}
									},
									{
										//xtype: (Ext.isIE7 || Ext.isIE8)? 'menucheckitem':'checkbox',
										xtype: 'menucheckitem',
										id :'ShowCIs',
										baseCls:'bmc-menu-item', 
										overCls:'bmc-menu-item-over',
										text : _ServerValues.ConfigurationItems,
										boxLabel:_ServerValues.ConfigurationItems,
                                        checked: SelectedRecordIDCookieVal == 'BMC_BaseElement' ? true : false,
										autoWidth: true,
										handler: this.ShowCIsClicked.createDelegate(this)
									},
									{
										xtype: 'menucheckitem',
										id :'ShowBusinessServices',
										baseCls:'bmc-menu-item', 
										overCls:'bmc-menu-item-over',
										text : _ServerValues.BusinessServices,
										boxLabel:_ServerValues.BusinessServices,
                                        checked: SelectedRecordIDCookieVal == 'BMC_BusinessService' ? true : false,
										autoWidth: true,
										handler: this.ShowBusinessServicesClicked.createDelegate(this)
		                            },
		                            { xtype: 'menuseparator',hidden:isFromRelationship },
		                            {
		                                xtype: 'menucheckitem',
		                                id: 'MarkasDeleted',
		                                baseCls:'bmc-menu-item', 
										overCls:'bmc-menu-item-over',
		                                text: _ServerValues.MarkAsDeleted,
		                                boxLabel: _ServerValues.MarkAsDeleted,
		                                checked: MarkasDeletedCookieVal,
		                                autoWidth: true,
										hidden:isFromRelationship,
		                                handler: this.MarkAsDeletedClicked.createDelegate(this)
										}
									]
								})
						},
						{
							xtype: 'tbspacer',
							width : 5,
							hidden: !((isACEnabled || isDiscoveryEnabled) && isManualOSSelectionEnabled),
						},{ xtype: 'tbseparator',hidden: !((isACEnabled || isDiscoveryEnabled) && isManualOSSelectionEnabled) },
						{
							xtype: 'tbspacer',
							width : 5
						},{
							xtype: 'label',
							id:'selectedInstancesCountLabel',
							hidden:!isFromRelationship,
							text: ' '+_ServerLabels.SelectedInstances +' 0',
							baseCls:'d-icon-info_circle',
							style:'font-size: 13px !important;color: #3cb6ce !important;font-weight: 600;'
						},{
							xtype: 'button',							
							autoEl: {
								'title': osSelectTooltipLbl
								},
							id:'OSMenu',
							hidden: !((isACEnabled || isDiscoveryEnabled) && isManualOSSelectionEnabled),
							scale: 'medium',
							iconCls : 'viewMenu',
							menu: new Ext.menu.Menu({
									autoWidth : true,
									showSeparator: false,
									plain: true,
									baseCls: 'bmc-menu',
									id: 'OSDropDown',
									items: [{
											xtype: 'menucheckitem',
											id :'Windows64',
											baseCls:'bmc-menu-item', 
											overCls:'bmc-menu-item-over',
											text : windows64Lbl,
											boxLabel: windows64Lbl,
											checked: osCookieVal == 'Windows64' ? true : false,
											autoWidth: true,
											handler: this.CreateOSCookie.createDelegate(this)
										},
										{
											xtype: 'menucheckitem',
											id: 'Linux64',
											baseCls:'bmc-menu-item', 
											overCls:'bmc-menu-item-over',
											text: linux64Lbl,
											boxLabel: linux64Lbl,
											checked: osCookieVal == 'Linux64' ? true : false,
											autoWidth: true,
											handler: this.CreateOSCookie.createDelegate(this)
										},
										{
											xtype: 'menucheckitem',
											id: 'MacOS',
											baseCls:'bmc-menu-item', 
											overCls:'bmc-menu-item-over',
											text: macOSLbl,
											boxLabel: macOSLbl,
											checked: osCookieVal == 'MacOS' ? true : false,
											autoWidth: true,
											handler: this.CreateOSCookie.createDelegate(this)
										}
									]
								})
						},
						{
							xtype: 'tbfill'
						},SearchCmp,       
			            { 
							xtype: 'tbspacer',
							width : 0
						},{
							xtype: 'button',
							id:'FilterBtn',
							scale: 'medium',
							iconCls: 'filterBtn',
							cls: 'bmc-btn-search',
							//width: 22,
							tooltip: AdvancedSearch, 
							tooltipType: 'title',
							overflowText: AdvancedSearch,
							style:{top: '5px' , left: '5px'}, 
							handler: checkAccessOnFilter
						},{
							xtype: 'tbspacer',
							width : 0
						}            
			            
			            ,
						/*{
							scale: 'medium',
							xtype: 'button',
							//iconCls: 'bmcRefresh', 
							tooltip: ClearFilterLabel, 
							tooltipType: 'title',
							id:'refreshbtn',
							cls: 'cmdbIconCls',
							baseCls:'d-icon-undo',
							style:{align: 'left'}, 
							handler: this.pageRefresh.createDelegate(this)
						}*/
						
						{
							xtype: 'button', 
							scale: 'small',
							id:'clearallfilter',
							iconCls: 'rf-clear-filter-icon',
							baseCls: 'bmc-btn-search',		
							width: 22,
							disabled:true,
							tooltip: _ServerLabels.HasNoFilters, 
							tooltipType: 'title',
							overflowText: _ServerLabels.HasNoFilters,
							style:{align: 'left'}, 
							handler: this.pageRefresh.createDelegate(this)
						},
						{ xtype: 'tbspacer', width: 5 },
						//tbarOptions
	                ];
	    if( userLanguage =="iw" ) { 
			ToolbarItems.reverse();
		}
		var tb = new Ext.Toolbar({
			id:'toolBarId',
	        border: false,
	        height: toolBarHeight,
	        autoWidth:true,
			items:ToolbarItems
	        
	    });
		 return tb;
	},
		
	ShowInstancePanel : function(cname, instID, assemblyId, reqContextId, instName,pageName)
	{
		
		var classNameLabel = this.TypeTreeView.getView().getTreeStore().getNodeById(cname).raw.text;
		if(classNameLabel == _ServerValues.CMDB_ALL_INSTANCES || classNameLabel == _ServerValues.CMDB_ALL_ASSETS || classNameLabel == _ServerValues.CMDB_ALL_CIs){			
			var classNameLabel = classNameLabel.substring(classNameLabel.lastIndexOf("(") + 1, classNameLabel.lastIndexOf(")"));
		}
		var url = "/apex/cmdbgenericpage?className="+urlencode(cname)+"&InstanceID="+instID+"&wid="+getWID()+'&tabName='+selectedTab+"&assemblyId="+assemblyId+"&reqContextId="+reqContextId+'&classNameTitle='+urlencode(Ext.util.Format.htmlDecode(classNameLabel));
		
		var BackIcon = '<button id="back_button" type="button" role="button" title="'+_ServerValues.Back+'" onclick="CMDBManagerNamespace.instance.CloseFormPanel()"><span>&lt; '+_ServerValues.Back +'</span></button>';
		
		
		if(instName != 'undefined' && instName != null){
			instanceFramePanel = this.ShowFormPanel(url, BackIcon +'&nbsp;<span class="instance_editor_title">'+classNameLabel+' / </span> '+_ServerValues.InstanceEditorTitle + '<span class="instance_editor_title"> : '+instName + '</span>',pageName);
		}else{
			instanceFramePanel = this.ShowFormPanel(url, BackIcon +'&nbsp;<span class="instance_editor_title">'+classNameLabel+' / </span> '+_ServerValues.InstanceEditorTitle + '<span class="instance_editor_title"> : '+_ServerValues.New + '</span>',pageName);
		}
	},
	
	ShowFormPanel : function(url, panelTitle,pageName)
	{
	    var instanceContainerPanelHeight = browserContainerPanelHeight;
	    var instanceFramePanelHeight = instanceContainerPanelHeight-35;
	    var backToolbarHeight = 30;
		randomNumber=Math.random();
		if(pageName){
			pageName=pageName.toLowerCase();
		}else{
			pageName='anypage'+randomNumber;
		}
		var instanceContainerPanel = new CMDB.Controls.Panel({
	        height: instanceContainerPanelHeight,
			id:'instanceContainerPanel'+pageName,
	        autoWidth:true,
	        collapsed:false,
	        border:false
	    }); 

		var tab = this.MainTabPanel.add(instanceContainerPanel);
		 url=url+'&isStdForm='+isStdForm;
		tab.url = url;
		
		var InstanceCloseButton = new Ext.Toolbar({
	        border: false,
	        autoWidth:true,
	        height: backToolbarHeight,
	        style:'background-color:#DEE0E0',	        
	        items: [
						{
			                scale: 'medium',
			                iconCls: 'bmcBackCMDB',
			                //baseCls: 'd-icon-arrow_left_circle',
			                //cls: 'cmdbIconCls',
			                tooltipType : 'title',
			                tooltip: _ServerValues.Back, 
			                
			                listeners: {
			                    mouseover: function(){
			                        this.setIconCls('bmcBackCMDBOn');    
			                    },
			                    mouseout: function(){
			                        this.setIconCls('bmcBackCMDB');          
			                    }
			                },
	                        handler: this.CloseFormPanel.createDelegate(this)
			            },'->',{
			            	xtype:'component',	
			            	styleHTMLContent:true,			            	
			            	scale: 'medium',		            				            	
			            	id:'goBackId',
							style:{
			            		display:'none'
			            	},
			            	autoEl : {
			            		tag:'a',			            		
			            		onClick:'goBack()',
			            		html:MultiEditBacktoInline
			            	}
			            },'->'
	                ]
	    });
	
		if(currentPage == 'CMDBCIEditPage'){
			
			 // InstanceCloseButton.add('<a id="goBackId" style="margin-left:'+paddingright+'display: none; font-size:14px; color:#0e8a82;cusror:pointer;" onclick="goBack();">'+MultiEditBacktoInline+'</a>');
			InstanceCloseButton.add('<a href="#" onclick="window.open(CMDBManagerNamespace.instance.wikiUrlforCiEdit);"><img style="float:right;'+rightMarginStyle+topMarginStyle+'" title='+_ServerValues.TooltipHelp+' height="17" width="17" id="helpId" src="'+imageHelp+'/SDEFbuttons/b_help.png"></a>');
			instanceContainerPanel.add(InstanceCloseButton);
		}
	
		var tempPanel = new CMDB.Controls.IFramePanel({
	        height:browserContainerPanelHeight -5,
	        autoWidth:true,
			cls: 'instance_editor',
			anchor: '100',
			title: panelTitle,//_ServerValues.InstanceEditorTitle,
			id:'instanceEditorFrame'+pageName,
			src:"about:blank"
		});
		
		
		instanceContainerPanel.add(tempPanel);
	
		tempPanel.setSource(url);
		tab.show();
		return tempPanel;
	},
	
	LoadCI : function()
	{
		currentPage='cmdbgenericpage';
		var elements=this.InstancesGrid.getSelectionModel().getSelection();
		var record;
		var strClassName;
		var RBAClassName;
		if( elements != null && elements.length > 0 ) {
			record = elements[0];
			strClassName = record.get('Class__c');	
			RBAClassName = record.get('FKAssetRuleClass__c');
		}
		
		if(typeof(strClassName)=='undefined' || strClassName=='' || strClassName ==  null) {
			strClassName = this.SelectedRecordID;
		}
		
		if(selectedTab == 'Asset' && RBAClassName)
			strClassName = RBAClassName;
		else if((strClassName != this.SelectedRecordID && typeof(RuleClass) != 'undefined' && RuleClass != ''))
			strClassName = this.SelectedRecordID;
		
		if(elements.length==1)
		{
			var instanceName = elements[0].data.Name__c;
			if(strClassName.toUpperCase() == 'BMC_BUSINESSSERVICE'){
				if(typeof(instanceName)=='undefined' || instanceName =='undefined'){
					instanceName = elements[0].data.Instance_Name__c;
				}
			}
			
			this.ShowInstancePanel(strClassName,elements[0].data.InstanceID__c,elements[0].data.AssemblyId__c,elements[0].data.Id,instanceName,'cmdbgenericpage');
		}
	},
	OnRowSelect: function(grd, record, item, index, e, eOpts ){
		var elements =record;
		if( elements != null ) {
			var record = elements;
			selectedRowIndex = record;
			selectedRowIndexInstanceID = record.data.InstanceID__c;
			if(isACEnabled  || isDiscoveryEnabled){
				assemblyId = record.get('AssemblyId__c');
				reqContextId = record.get('Id');
				
			}
		}
		
	},
	ChangeBtnStatus : function()
	{
		var elements=this.InstancesGrid.getSelectionModel().getSelection();
		var strAssemblyId = '';
		var classPermisssionOfSelectedRecord;
		if(elements!= null && elements.length > 0){
			var record = elements[0];
			classPermisssionOfSelectedRecord= getClassPermissionsOfSelectedRecord(record);
			selectedRowIndex = record;
			selectedRowIndexInstanceID = record.data.InstanceID__c;
			strAssemblyId = record.get('AssemblyId__c');
		}
		if(elements.length==1){
			if(isCMDBClassPermissionsEnable || fallBackToFresh){
				if(classPermisssionOfSelectedRecord && classPermisssionOfSelectedRecord.Permissions.isUpdateable){
					Ext.getCmp('editInstanceBtn').enable();
					Ext.getCmp('ciExplorerBtn').enable();
				}else{
					Ext.getCmp('ciExplorerBtn').enable();
					Ext.getCmp('editInstanceBtn').disable();
				}
				
			}else{
				if(isupdateable){
					Ext.getCmp('editInstanceBtn').enable();
					Ext.getCmp('ciExplorerBtn').enable();
				}else{
					Ext.getCmp('ciExplorerBtn').enable();
				}
			}
		}else{
			Ext.getCmp('ciExplorerBtn').disable();
			Ext.getCmp('editInstanceBtn').disable();
		}
		var deleteBtn = Ext.getCmp('deleteInstanceBtn');
		if(isCMDBClassPermissionsEnable || fallBackToFresh){ // When class level permission is ON.Irrespective of fresh or upgrade
			if(elements.length>0 && (classPermisssionOfSelectedRecord && classPermisssionOfSelectedRecord.Permissions.isDeletable) && deleteBtn){
				deleteBtn.enable();
			}else{
				deleteBtn.disable();
			}
		}else{
			if(elements.length>0 && isdeletable && deleteBtn != null && typeof(deleteBtn) != 'undefined'){
				if(isFlattenedCmdb){													//nakul-------------
					if(isAssetManagementEnabled && isCIManagementEnabled){
						if(selectedTab.toLowerCase() == 'ci'){
							if(deleteCI){
								deleteBtn.enable();
							}else{
								deleteBtn.disable();
							}
						}else if(selectedTab.toLowerCase() == 'asset'){
							if(deleteAsset){
								deleteBtn.enable();
							}else{
								deleteBtn.disable();
							}
						}else if(selectedTab.toLowerCase() == 'all'){
							if(elements[0].data.InstanceType__c == instTypeCILbl){
								if(deleteCI){
									deleteBtn.enable();
								}else{
									deleteBtn.disable();
								}
							}else if(elements[0].data.InstanceType__c == instTypeAssetLbl){
								if(deleteAsset){
									deleteBtn.enable();
								}else{
									deleteBtn.disable();
								}
							}else if(elements[0].data.InstanceType__c == instTypeCIAssetLbl){
								if(deleteAsset || deleteCI){
									deleteBtn.enable();
								}else{
									deleteBtn.disable();
								}
							}
						}
					}else if(!isAssetManagementEnabled && isCIManagementEnabled){
						if(deleteCI){
							deleteBtn.enable();
						}else{
							deleteBtn.disable();
						}
					}else if(isAssetManagementEnabled && !isCIManagementEnabled){
						if(deleteAsset){
							deleteBtn.enable();
						}else{
							deleteBtn.disable();
						}
					}									//nakul------------
					
				}else{
					deleteBtn.enable();
				}
			}else{
				Ext.getCmp('deleteInstanceBtn').disable();
			}
		}
		var acMenu = Ext.getCmp('actionsMenuId');
		if(acMenu != null && typeof(acMenu) != 'undefined'){
			if(elements.length==1){
				acMenu.setDisabled(false);
				acMenu.setIconCls('acAction');
			}else{
				acMenu.setDisabled(true);
				acMenu.setIconCls('acActionDisabled');
			}
		}
		
		
		if(isDiscoveryEnabled){
    		var ACLaunchFPBtn = Ext.getCmp('ACLaunchFPBtn'); 
			if(enableFPConsole != '' && enableFPConsole == 'true'){
        		ACLaunchFPBtn.enable();
        		ACLaunchFPBtn.setTooltip(_ServerValues.ACLaunchFPConsole);
        	}else{
        		ACLaunchFPBtn.disable();
        		if(isAdmin == 'true')
        			ACLaunchFPBtn.setTooltip(_ServerValues.AdminDisabledText);
        		else
        			ACLaunchFPBtn.setTooltip(_ServerValues.ContactSysAdmin);
        	}
    	}
		
		if(isDKEnable){
			if(strAssemblyId != null && typeof(strAssemblyId) != 'undefined' && strAssemblyId != '' &&  strAssemblyId.toUpperCase().indexOf('DELLKACE') == 0)
				Ext.getCmp('DKLaunchBtn').enable();
			else
				Ext.getCmp('DKLaunchBtn').disable();
		}
			
	},
	
	ExploreCI : function()
	{
		currentPage='CIExplorerLauncher';
		var elements=this.InstancesGrid.getSelectionModel().getSelection();
		if(elements.length==1)
		{
			ShowCIExplorer(elements[0].data.InstanceID__c,elements[0].data.ClassName__c);
		}
	},
	CMDBReport: function()
	{
		currentPage='CMDBReport';
	    var url = "/apex/CMDBReport?classname=" +  this.SelectedRecordID ;
        CMDBManagerNamespace.instance.ShowFormPanel(url, "",'CMDBReport');
	},
	CMDBCiEdit: function()
	{
		if(fallBackToUpgrade){
			if(!isupdateable )return;
		}
		selectedclass = this.SelectedRecordID;
		if(typeof(RuleClass) == 'undefined' || RuleClass == null || RuleClass == '')
			isRBAClass = false;
		currentPage='CMDBCIEditPage';
		var DynamicFilterJSON = JSON.stringify(FilterJSON);
	    var url = "/apex/CMDBCIEditPage?classname=" +  selectedclass +"&isRBAClass="+isRBAClass+"&selectedTab="+selectedTab+"&selectedClsType="+selectedClsType+"&searchStr=" +urlencode(ValidateReserveCharactersForSOSL(searchstring))+'&'+this.getPagingParamStringCIEditMultiSelect()+'&FilterJSON='+urlencode(DynamicFilterJSON);
        CMDBManagerNamespace.instance.ShowFormPanel(url, "",'CMDBCIEditPage');
        PrevFieldType='';
	},
	UpdateCICount: function()
	{
	    updateCIRelationshipCountBatchJS();
	},
	
	ACLaunchFPConsole: function()
	{
	    if(isFPUserValidated){
			showWaitMsgBar();
			if(!makeConsoleAPICallFromServer && (isDiscoveryEnabled || (isACEnabled && isACCertified))){
				makeBCMConsoleAPIRequest();
			}else{
				getBinaryBCMConsole();
			}
		}else{
			var conditionaltltp = _ServerValues.ACFPLaunchWindowHeader;
			if(isDiscoveryEnabled)
				conditionaltltp = _ServerValues.DiscoveryFPLaunchWindowHeader;
			
			openPopupWithTitle('ACFPUserCredentialPage',oncompleteFPvalidateJS,conditionaltltp,Ext.isIE?242:228,495);
			popUpWindow.center();
		}
	},
	LaunchDKConsole: function()
	{
		var elements = this.InstancesGrid.getSelectionModel().getSelection();
		//if(this.InstancesGrid.getSelectionModel().getSelected()){
		if(elements != null && elements.length >0){
			//var record = this.InstancesGrid.getSelectionModel().getSelected();
			var record = elements[0];
			var strClassName = record.get('ClassName__c');
			if(strClassName.toUpperCase() == 'BMC_SOFTWARESERVER'){
					var id = parseInt(record.get('TokenId__c'));
					if(!isNaN(id)){
						if(isDKEnable){
							window.open(strDKServer + '/adminui/software.php?ID='+ id);
						}
					}
			}else {
				var strAssemblyId = record.get('AssemblyId__c');
				var id = '';
				if(isDKEnable && strAssemblyId != null && strAssemblyId != undefined &&  strAssemblyId.toUpperCase().indexOf('DELLKACE') == 0){
					id = parseInt(strAssemblyId.substr(strAssemblyId.indexOf('-') + 1,strAssemblyId.length - strAssemblyId.indexOf('-')));
				}
				if(!isNaN(id)){
					window.open(strDKServer + '/adminui/machine.php?ID='+ id );
				}
			}
		}
	},
	searchBaseElement : function()
	{
		var searchTxtObj= document.getElementById('searchTxt');
		searchstring = searchTxtObj.value;
		searchstring = searchstring.trim();
		if(searchstring == cmdbInstanceSearch)
			searchstring = '';
		//var tempSearchstring = RemoveReserveCharactersForSOSL(searchstring);
		if((searchstring.length < 2 && !isCJKChar(searchstring))|| searchstring == _ServerValues.srchTxtFldLabel){
			
			this.GetMessageBox( 'bmc-message' ).show({
				title: _ServerValues.WarningTitle,
				msg: _ServerValues.validateMinimumCharsSearchPage,
				width:300,
				closable:true,
				buttons: Ext.MessageBox.OK,
				fn: function(buttonId,text ,opt ){
					if(buttonId  == 'ok'){
						searchTxtObj.focus();
					}
				},
				animateTarget: 'searchTxt',
				icon: Ext.MessageBox.WARNING
			});
			return;
		}else{
			AdvancedFilterName = '';
			var filterIcon= Ext.getCmp('FilterBtn');
			if(typeof(filterIcon) != 'undefined' && filterIcon != null){
				//filterIcon.setIconCls('Filter_Not_Applied');
				filterIcon.setIconCls('filterBtn');
				filterIcon.setTooltip(AdvancedSearch);
			}
		}
		showWaitMsgBar();
		this.getInstanceListStore();
	},
	
	pageRefresh : function(isSearchReset)
	{
		
		if(isSearchReset == true) {
			var searchTxtObj= document.getElementById('searchTxt');
			searchTxtObj.value='';
			//document.getElementById("searchTxt").placeholder = cmdbInstanceSearch;
			searchstring = '';
		}else{
			
			if(typeof(clearAllActiveFilters) == "function" ){
				filterCleared = clearAllActiveFilters();
				if(typeof(ChangeFilterIcon) == "function" ){
					ChangeFilterIcon();
				}
			}
		}
		showWaitMsgBar();
		this.getInstanceListStore();
	},
	NewCI : function()
	{
		currentPage='cmdbgenericpage';
		if(this.SelectedRecordID!='')
		{
			this.ShowInstancePanel(this.SelectedRecordID,'','');
		}
	},
	
	DeleteCI : function()
	{
		var elements = this.InstancesGrid.getSelectionModel().getSelection();
		if(elements.length>0){
			if(isFlattenedCmdb){
				if(isAssetManagementEnabled && isCIManagementEnabled){
					if(elements[0].data.InstanceType__c == instTypeCIAssetLbl){
						this.GetMessageBox('bmc-message').show({
							title: _ServerValues.Delete,
							msg: getMsgFunc(),
							icon: Ext.MessageBox.WARNING,
							buttons: Ext.Msg.OKCANCEL,
							fn: function(btn) {
								if(btn == 'ok'){
									showWaitMsgBar();
									var assetChecked = document.getElementById('rdBtnAsset').checked;
									var ciChecked = document.getElementById('rdBtnCI').checked;
									var bothChecked = document.getElementById('rdBtnBoth').checked;
									if(assetChecked == true && ciChecked == false && bothChecked == false){
										//alert('Delete only Asset.');
										var instId = elements[0].data.InstanceID__c;
										deleteOnlyAsset(instId);
									}else if(ciChecked == true && assetChecked == false && bothChecked == false){
										//alert('Delete only CI.');
										var instId = elements[0].data.InstanceID__c;
										deleteOnlyCI(instId);
									}else if(bothChecked == true && assetChecked == false && ciChecked == false){
										//alert('Delete the record from database.');
										deletemethod(elements);
									}
								}
							}
						});
						
					}
					else{
						this.GetMessageBox( 'bmc-message' ).confirm(_ServerValues.Delete, _ServerValues.ConfirmDeleteCI, 
							function(btn){
								if(btn.toUpperCase()=="YES"){
									//var elements=this.InstancesGrid.getSelectionModel().getSelections();
									deletemethod(elements);
								}
							}.createDelegate(this));
					}
				}else{
					this.GetMessageBox( 'bmc-message' ).confirm(_ServerValues.Delete, _ServerValues.ConfirmDeleteCI, 
						function(btn){
							if(btn.toUpperCase()=="YES"){
								//var elements=this.InstancesGrid.getSelectionModel().getSelections();
								deletemethod(elements);
							}
						}.createDelegate(this));
				}
			}else{
				this.GetMessageBox( 'bmc-message' ).confirm(_ServerValues.Delete, _ServerValues.ConfirmDeleteCI, 
					function(btn){
						if(btn.toUpperCase()=="YES"){
							//var elements=this.InstancesGrid.getSelectionModel().getSelections();
							deletemethod(elements);
						}
					}.createDelegate(this));
			}
		}
	},

	CloseFormPanel : function()
	{
		var backbtntoolbar = this;
		var dataModifiedFlagTemp = 0;
		backFromDetailPage = true;//
		try{
    		if(window.ActiveInstanceReference != 'undefined'  && window.ActiveInstanceReference != null){
				if(typeof(window.ActiveInstanceReference.getDataModifiedFlag) == 'function'){
					dataModifiedFlagTemp = window.ActiveInstanceReference.getDataModifiedFlag();
				}
				
			}
			if(window.ActiveReleationInstanceReference != null && window.ActiveReleationInstanceReference != 'undefined'){
				if(window.ActiveReleationInstanceReference.parent && typeof(window.ActiveReleationInstanceReference.parent.getRelationListStoreRef) == 'function'){
					window.ActiveReleationInstanceReference.parent.getRelationListStoreRef();
				}
				if(typeof(window.ActiveReleationInstanceReference.getDataModifiedFlag) == 'function'){
					dataModifiedFlagTemp = window.ActiveReleationInstanceReference.getDataModifiedFlag();
				}
			}
		}catch(e){console.log(e);}
	    if(dataModifiedFlagTemp && currentPage!='CMDBCIEditPage'){
			this.GetMessageBox( 'bmc-message' ).show({
				title:_ServerValues.closeWindowTitle,
				msg: _ServerValues.closeWindowMessage,
				width:400,
				buttons: Ext.Msg.YESNO,
				fn:function(btn){
					if(btn == 'yes'){
						if(window.ActiveReleationInstanceReference != null && window.ActiveReleationInstanceReference != 'undefined'){
							if(window.ActiveReleationInstanceReference.parent != null && window.ActiveReleationInstanceReference.parent != undefined && typeof(window.ActiveReleationInstanceReference.parent.getRelationListStoreRef) == 'function'){
								window.ActiveReleationInstanceReference.parent.getRelationListStoreRef();
							}
						}
						backbtntoolbar.ExplorerItemClickHandler(backbtntoolbar.SelectedRecordID, true);
						backbtntoolbar.MainTabPanel.remove(backbtntoolbar.MainTabPanel.getActiveTab());
						showWaitMsgBar();
						//backbtntoolbar.resizeTypeViews();
					} 
				},
				icon: Ext.MessageBox.WARNING
			}); 
		}else {
				if(currentPage=='CMDBCIEditPage' && !cmdbCISaveBtn && cmdbCIDirtyFlag()){
					this.GetMessageBox( 'bmc-message' ).show({
						title:_ServerValues.closeWindowTitle ,
						msg: _ServerValues.closeWindowMessage,
						width:400,
						buttons: Ext.Msg.YESNO,
						renderTo: document.getElementById('contentDiv'),
						fn:function(btn){
							if(btn == 'yes'){ 
								backFromDetailPage = true;
							backbtntoolbar.ExplorerItemClickHandler(backbtntoolbar.SelectedRecordID, true);
							backbtntoolbar.MainTabPanel.remove(backbtntoolbar.MainTabPanel.getActiveTab());
							//backbtntoolbar.resizeTypeViews();
							}
					
						},
						icon: Ext.MessageBox.WARNING
						});	
				}else{	
					backbtntoolbar.ExplorerItemClickHandler(backbtntoolbar.SelectedRecordID, true);
					backbtntoolbar.MainTabPanel.remove(backbtntoolbar.MainTabPanel.getActiveTab());
					showWaitMsgBar();
					//backbtntoolbar.resizeTypeViews();	
				}
	   }
	},

    ShowDerivedCIs: ShowDerivedCIsCookieVal,
    MarkasDeleted: MarkasDeletedCookieVal,
    ShowDerivedCIsClicked: function(ctrl, checked) {
		if(ctrl.checked){
			this.ShowDerivedCIs = ctrl.checked;
			/*ctrl.baseCls.replace('d-icon-square_o','d-icon-check_square_o');
			ctrl.removeCls('d-icon-square_o');
			ctrl.baseCls= 'd-icon-check_square_o';*/
		}else{
			this.ShowDerivedCIs = false;
			/*ctrl.removeCls('d-icon-check_square_o');
			ctrl.baseCls= 'd-icon-square_o';
			ctrl.baseCls.replace('d-icon-check_square_o','d-icon-square_o');*/
		}
		this.Paging_PageNumber=1;
        ShowDerivedCIsCookieVal = this.ShowDerivedCIs;
        createCookie('ShowDerivedCIs', this.ShowDerivedCIs, true);
		this.getInstanceListStore();
	},
    MarkAsDeletedClicked: function(ctrl, checked) {
        if (ctrl.checked) {
            this.MarkasDeleted = ctrl.checked;
        } else {
            this.MarkasDeleted = false;
        }
        this.Paging_PageNumber = 1;
        MarkasDeletedCookieVal = this.MarkasDeleted;
        createCookie('MarkAsDeleted', MarkasDeletedCookieVal, true);
        var filterIcon = Ext.getCmp('FilterBtn');

        if (typeof(filterIcon) != 'undefined' && filterIcon != null) {
            //filterIcon.setIconCls('Filter_Not_Applied');
            filterIcon.setIconCls('filterBtn');
            filterIcon.setTooltip(AdvancedSearch);
            AdvancedFilterName = '';
        }
        this.getInstanceListStore();
    },
	CreateOSCookie: function(ctrl) {
		if(ctrl.checked){
			var osArr = ["Windows64", "Linux64", "MacOS"];
			var index = osArr.indexOf(ctrl.id);
			if(index > -1){
				osArr.splice(index, 1);
			}
			var i = 0;
			for(i = 0; i < osArr.length; i++){
				var osChkBx = Ext.getCmp(osArr[i]);
				osChkBx.setChecked(false,true);
			}
			var oneYr = new Date();
			oneYr.setYear(oneYr.getFullYear() + 1);
			document.cookie = 'apex__OSForBCMBinary='+ctrl.id+';path=/;SameSite=None;Secure;expires='+oneYr.toUTCString();
			osCookieVal = ctrl.id;
		}else{
			document.cookie="apex__OSForBCMBinary=;path=/;SameSite=None;Secure";
		}
    },
    ShowCIsClicked: function(ctrl, checked) {
        console.log('ShowCIsClicked');
		var showBusinessServices = Ext.getCmp('ShowBusinessServices');		
		SelectedRecordIDCookieVal = 'BMC_BaseElement'
		if(ctrl.checked)
		{
			toggleCheckBoxes(showBusinessServices,false);
		}
		else
		{
			toggleCheckBoxes(showBusinessServices,true);
			SelectedRecordIDCookieVal = 'BMC_BusinessService';
		}
		this.Paging_PageNumber=1;
        createCookie('SelectedRecordID', SelectedRecordIDCookieVal, true);		
		showWaitMsgBar();		
		if(typeof(clearAllActiveFilters) == "function" ){
			clearAllActiveFilters();
		}
		if(typeof(ChangeFilterIcon) == "function" ){
			ChangeFilterIcon();
		}
		this.InstancesGrid.hide();
		this.getInstanceListStore();	
	},
	ShowBusinessServicesClicked : function(ctrl, checked)
	{
		var showCIMenu = Ext.getCmp('ShowCIs');
		SelectedRecordIDCookieVal = 'BMC_BusinessService';        
		if(ctrl.checked)
		{
			toggleCheckBoxes(showCIMenu,false);
		}
		else
		{
			toggleCheckBoxes(showCIMenu,true);
			SelectedRecordIDCookieVal = 'BMC_BaseElement';
		}
		this.Paging_PageNumber=1;
        createCookie('SelectedRecordID', SelectedRecordIDCookieVal, true);		
		showWaitMsgBar();		
		if(typeof(clearAllActiveFilters) == "function" ){
			clearAllActiveFilters();
		}
		if(typeof(ChangeFilterIcon) == "function" ){
			ChangeFilterIcon();
		}
		this.InstancesGrid.hide();
		this.getInstanceListStore();
	},
	CMDBTabChangeHandler : function(name)
	{	selectedClsType = '';
		tabChanged = true;
		loadCount = 0;
		showWaitMsgBar();
		CMDBManagerNamespace.instance.InstancesGrid.hide();
		if(typeof(clearAllActiveFilters) == "function" ){
			clearAllActiveFilters();
		}
		if(typeof(ChangeFilterIcon) == "function" ){
			ChangeFilterIcon();
		}
		if(!isfirst){
			//if(selectedTab != name){
				prevTab = selectedTab;
				selectedTab = name;
				updatedStore = CMDBManagerNamespace.instance.getClassViewStore();
				var ListViewGrid = Ext.getCmp('ListViewGrid');
				ListViewGrid.getStore().loadData(updatedJson);
				if(selectedTab == 'All') {
					ListViewGrid.down('headercontainer').getGridColumns()[1].setWidth( 143 );
					ListViewGrid.down('headercontainer').getGridColumns()[2].setVisible(true);
				}else {
					ListViewGrid.down('headercontainer').getGridColumns()[1].setWidth( 143 + 80 );
					ListViewGrid.down('headercontainer').getGridColumns()[2].setVisible(false);
				}
				
					
				if(viewNM == 'list')
					ListViewGrid.getView().refresh();
				CMDBManagerNamespace.instance.searchTileView();
				if(viewNM == "tile")
					CMDBManagerNamespace.instance.viewTypeChanged('tile',0);
				var root = getRootForTreeView();
				Ext.getCmp('treeViewPanel').setRootNode(root.getRootNode());
				var SearchClassesObj=document.getElementById('SearchClasses');
				if(SearchClassesObj){
					ViewSearchText = SearchClassesObj.value;
				}
				if(ViewSearchText != '')
					new Ext.tree.TreeFilter(Ext.getCmp('treeViewPanel')).filter(ViewSearchText);
							
				createCookie();
				//Calling getCustomView since we have different OOTB for all views
				classRecord = 'BMC_BaseElement';
				getCustomListView(classRecord,selectedTab);
			/*} else {
				hideWaitMsgBar();
			}*/
		}else{
			CMDBManagerNamespace.instance.syncTypeViews('BMC_BaseElement');
		}
		
	},
	/* Paging code */
	
	InstanceGridColumns : incGridforBE, 

	getGridFieldsWithLockedProperty: function( GridColumns ) {
		for(var i =0;i<GridColumns.length;i++) {
			if ( GridColumns[i].dataIndex == 'Name__c') {
				GridColumns[i]['locked'] = true;
				this.isInstancesGridLocked=true;
				break;
			}
		}
		return GridColumns;
	},
	
	getGridFields : function(clsName){
		
		
		var arr = [];
		var GridColumns ;
		if(clsName && clsName == 'BMC_BusinessService'){
			GridColumns = this.getGridFieldsWithLockedProperty( incGridforBS);
		}else{
			GridColumns = this.getGridFieldsWithLockedProperty( this.InstanceGridColumns );
		}
		for(var i =0;i< GridColumns.length;i++)
		{
			arr[i] = GridColumns[i].dataIndex;
		}
		return arr;
	},
	getServiceGridFields : function(){
		var arr = [];
		var GridColumns = this.getGridFieldsWithLockedProperty( ServiceInstanceArrayStore );
		for(var i =0;i<GridColumns.length;i++)
		{
			arr[i] = GridColumns[i].dataIndex;
		}
		return arr;
	},
	
	
	Paging_PointerFirstRecordValue : '',
	Paging_PointerLastRecordValue : '',
	Paging_PageSize : iPageSize,
	Paging_PageNumber : 1,
	
	PageMoveDirection : 'NEXT',

	enableDisablePagingButtons : function()
	{
		
		/*if(this.InstancesGrid.store.proxy.reader.jsonData.hasPrevious) Ext.getCmp('PreviousPageButton').setDisabled(false);
		else Ext.getCmp('PreviousPageButton').setDisabled(true);

		if(this.InstancesGrid.store.proxy.reader.jsonData.hasNext) Ext.getCmp('NextPageButton').setDisabled(false);
		else Ext.getCmp('NextPageButton').setDisabled(true);
		*/
		this.Paging_PageNumber = this.InstancesGrid.store.proxy.reader.jsonData.pageNumber;
		inprogress = 0;

	},
	getPagingParamStringCIEditMultiSelect : function()
	{
		
		var s = '';
		s+='&SortColumn='+newSortColumn;
		s+='&PointerFirstRecordValue='+this.Paging_PointerFirstRecordValue;
		s+='&PointerLastRecordValue='+this.Paging_PointerLastRecordValue;
		s+='&PageSize=33';
		s+='&PageSize='+this.Paging_PageSize;
		s+='&PageNumber='+this.Paging_PageNumber;
		s+='&SortDirection='+newSortDirection;
		s+='&PageMoveDirection='+this.PageMoveDirection;
		s+='&ShowDerivedCIs='+this.ShowDerivedCIs;
        s += '&MarkAsDeleted=' + this.MarkasDeleted;
		s+='&AdvancedFilterName='+encodeURIComponent(AdvancedFilterName);
		return s;
	},
    getPagingParamString: function() {

        if (this.MarkasDeleted == undefined)
            this.MarkasDeleted = Ext.util.Cookies.get(userId + 'MarkAsDeleted');

		var s = '';
		s+='&SortColumn='+newSortColumn;
		s+='&PointerFirstRecordValue='+this.Paging_PointerFirstRecordValue;
		s+='&PointerLastRecordValue='+this.Paging_PointerLastRecordValue;
		s+='&PageSize='+this.Paging_PageSize;
		s+='&PageSize='+this.Paging_PageSize;
		s+='&PageNumber='+this.Paging_PageNumber;
		s+='&SortDirection='+newSortDirection;
		s+='&PageMoveDirection='+this.PageMoveDirection;
		s+='&ShowDerivedCIs='+this.ShowDerivedCIs;
        s += '&MarkAsDeleted=' + this.MarkasDeleted;
		s+='&AdvancedFilterName='+encodeURIComponent(AdvancedFilterName);
		return s;
	},
	getInstanceListStore : function(ClassName) {
		
		//selectedclass = ClassName;
		if(typeof(ClassName)=='undefined' || ClassName==null || ClassName.trim()=='') { 
			ClassName = this.SelectedRecordID; 
		}
	
        if (selectedTab == 'CI' && ClassName == 'BMC_BaseElement') {
            ClassName = SelectedRecordIDCookieVal;
        }

		var dataStore;
		if(ClassName == ''){
			dataStore = new Ext.data.JsonStore({
			});
		}else{
        if(isCMDBClassPermissionsEnable){ // When class level permission is ON.Irrespective of fresh or upgrade
			var classPermissions = getClassLevelPermissions(ClassName);
			if(classPermissions){
				iscreatable = classPermissions.Permissions.isCreateable;
				isdeletable = classPermissions.Permissions.isDeletable;
				isupdateable = classPermissions.Permissions.isUpdateable;
				isDerivedClassUpdatable = isupdateable;
		
				deleteCI = isdeletable;
				deleteAsset = isdeletable;
				updateCI = isupdateable;
				updateAsset== isupdateable;
			}
			enabledisablenewbuttonForClassPermissions();
		}else if(fallBackToFresh){ // For fresh install and CLS is OFF
			var baseElementObjectPermission = getBaseElementObjectPermission();
			if(baseElementObjectPermission){
				iscreatable = baseElementObjectPermission.isCreateable;
				isdeletable = baseElementObjectPermission.isDeletable;
				isupdateable = baseElementObjectPermission.isUpdateable;
				isDerivedClassUpdatable = isupdateable;
				
				deleteCI = isdeletable;
				deleteAsset = isdeletable;
				updateCI = isupdateable;
				updateAsset== isupdateable;
			}
			enabledisablenewbuttonForClassPermissions();
		}else{
			if(orgNameSpaceWithoutUnderScore != '' && orgNameSpaceWithoutUnderScore != null && orgNameSpaceWithoutUnderScore != 'undefined' && orgNameSpaceWithoutUnderScore != 'null'){
				eval(orgNameSpaceWithoutUnderScore).CMDBClassAccess.getclassaccess(ClassName, function(result, event){
						if(event.status) {
							if(result != '' && result != null){
								classaccess = result;
								//alert(classaccess[0]);
								iscreatable = classaccess[0];
								isdeletable = classaccess[1];
								isupdateable = classaccess[2];
								var showDerivecls;
								var showDerivedCIsComp = Ext.getCmp('ShowDerivedCIsButton');
								if(showDerivedCIsComp.xtype == "menucheckitem"){
									showDerivecls = showDerivedCIsComp.checked;
								}
								else{
									showDerivecls = showDerivedCIsComp.getValue();
								}
								if(showDerivecls != 'undefined' && typeof(showDerivecls) != undefined && showDerivecls !=null && showDerivecls == true)
									isDerivedClassUpdatable = classaccess[3];
								else
									isDerivedClassUpdatable = classaccess[2];
								enabledisablenewbutton();
							  }           			
						} else if (event.type === 'exception') {    
							CMDBManagerNamespace.instance.GetMessageBox( 'bmc-message' ).alert('', event.message);
							hideWaitMsgBar();
						}			
					}, {escape:true});		
			} else {
				CMDBClassAccess.getclassaccess(ClassName, function(result, event){
					if(event.status) {
						if(result != '' && result != null){
							classaccess = result;
							iscreatable = classaccess[0];
							isdeletable = classaccess[1];
							isupdateable = classaccess[2];
							enabledisablenewbutton();
						  }           			
					} else if (event.type === 'exception') {    
						this.GetMessageBox( 'bmc-message' ).alert('', event.message);
					}			
				}, {escape:true});
			}
		}
		if(viewNM == 'tree' && selectedTab == 'Asset' && ClassName!= '' && (selectedClsType == 'CI' || selectedClsType == '' || selectedClsType == 'CI and Asset'))
			ClassName = ClassName+'ф'+selectedClsType;
			if(isFlattenedCmdb){
				var clsName = ClassName;
				var CMDBTab = selectedTab;
				var searchStr = '';
				searchStr = ValidateReserveCharactersForSOSL(searchstring);
				
				var AdvancedFilterNameTemp = AdvancedFilterName;
				var SortColumn = this.Paging_SortColumn;
				var PageNumber = this.Paging_PageNumber;
				var PageSize = this.Paging_PageSize;
				var PageMoveDirection = this.PageMoveDirection;
				var SortDirection = this.Paging_SortDirection;
				var ShowDerivedCIs = this.ShowDerivedCIs;
				
				if (this.MarkasDeleted == undefined)
					this.MarkasDeleted = Ext.util.Cookies.get(userId + 'MarkAsDeleted');

				var MarkAsDeletedBoolean = this.MarkasDeleted;
				var DynamicFilterJSON = JSON.stringify(FilterJSON);
								
				var RemoteParams={};
				RemoteParams.cname=clsName;
				RemoteParams.FilterName=AdvancedFilterNameTemp;
				RemoteParams.searchStr=searchStr;
				RemoteParams.CMDBTab=CMDBTab;
				RemoteParams.Sortcolumn=newSortColumn;
				RemoteParams.PageNumber=PageNumber;
				RemoteParams.PageSize=PageSize;
				RemoteParams.PageMoveDirection=PageMoveDirection;
				RemoteParams.SortDirection=newSortDirection;
				RemoteParams.ShowDerivedCIs=ShowDerivedCIs;
				RemoteParams.markAsDeleted=MarkAsDeletedBoolean;
				if(isFromRelationship){
					RemoteParams.type='instancelistfornewcirelationship';
					RemoteParams.InstanceID=srcInstanceId;
				}
				RemoteParams.dynamicFilterJSON=DynamicFilterJSON;
				RemoteParams.readAccessClassIds = '';
				if(isCMDBClassPermissionsEnable && readAccessClassIdsArr){
					RemoteParams.readAccessClassIds=readAccessClassIdsArr.toString();
					readAccessClassIds=readAccessClassIdsArr.toString();
					RemoteParams.readAccessRBAClassIds=readAccessRBAClassIdsArr.toString();
				}									
				Visualforce.remoting.Manager.invokeAction(
					_RemotingActions.getClassInstances,RemoteParams,
					function(result,event){
						if(event.status){
							if(ClassName && ClassName.indexOf('ф')>0) {
								ClassName=ClassName.split('ф')[0];
							}
							loadCount++;
							var dataStoreFields = CMDBManagerNamespace.instance.getGridFields(clsName);
							if(dataStoreFields.indexOf(newSortColumn) == -1){
								loadCount++;
							}
							dataStore = new Ext.data.JsonStore({
								proxy: {
									type: 'memory',
									reader: {
										type: 'json',
										root: 'data'
									}
								},
								data: JSON.parse(result),
								fields: dataStoreFields
							});
							var serviceDataStore = null;
							if(ClassName == 'BMC_BusinessService'){
								dataStore= new Ext.data.JsonStore({
									proxy: {
										type: 'memory',
										reader: {
											type: 'json',
											root: 'data'
										}
									},
									data: JSON.parse(result),
									fields: dataStoreFields
								});
							}
							CMDBManagerNamespace.instance.dataStoreOnLoad(dataStore, ClassName);
							dataStore.load();
						}
					},{escape:false});
			}else{
				if((searchstring.length < 2 && !isCJKChar(searchstring)) || searchstring == _ServerValues.srchTxtFldLabel){
					sURL = '/apex/CMDBJsonGenerator?type=instancelistbyclass&CMDBTab='+selectedTab+'&ClassName='+urlencode(ClassName)+'&'+this.getPagingParamString();
				}else{
					sURL = '/apex/CMDBJsonGenerator?type=instancelistbyclass&CMDBTab='+selectedTab+'&searchStr='+urlencode(ValidateReserveCharactersForSOSL(searchstring))+'&ClassName='+urlencode(ClassName)+'&'+this.getPagingParamString();
				}
				var ajaxProxy = new Ext.data.proxy.Ajax({   		
					simpleSortMode : true,	
					url : sURL,
					reader: {
						type: 'json',
						root: 'data'
					}
				});		
				if(ClassName == 'BMC_BusinessService'){
				dataStore = new Ext.data.JsonStore({
					proxy: ajaxProxy,				
					remoteSort: true,						
						sorters: [{property:this.Paging_SortColumn, direction: this.Paging_SortDirection}],				
						fields: this.getServiceGridFields()
				});
				}else{
					dataStore= new Ext.data.JsonStore({
						proxy: ajaxProxy,	  			
						remoteSort: true,								
						sorters: [{property:this.Paging_SortColumn, direction: this.Paging_SortDirection,root:'data'}],									
						fields: this.getGridFields(ClassName)
					});	
				}
				var serviceDataStore = null;				
				this.dataStoreOnLoad(dataStore, ClassName);
				dataStore.load();
			}
		}
		return dataStore;
	},
	
	dataStoreOnLoad : function(dataStore, ClassName){
		dataStore.on('load', function(obj, records, options){				
			
				var instanceGridcm;
				if(!isFlattenedCmdb){
					FilterColList = this.getServiceGridFields();
					if(ClassName == 'BMC_BusinessService' ){
						instanceGridcm = this.getGridFieldsWithLockedProperty( ServiceInstanceArrayStore );
						
					}else{
						instanceGridcm = this.getGridFieldsWithLockedProperty( colInstanceGrid );
					}
					if(userLanguage=='iw'){
						ServiceInstanceArrayStore.reverse();	
					}
				}else{
					if(userLanguage=='iw'){
						colInstanceGrid.reverse();	
					}
					if(ClassName == 'BMC_BusinessService' ){
						instanceGridcm = this.getGridFieldsWithLockedProperty( ServiceInstanceArrayStore );
						
					}else{
						instanceGridcm = this.getGridFieldsWithLockedProperty( colInstanceGrid );
					}
					FilterColList=this.getGridFields(ClassName);
					
				}
				
				if( selectedTab != 'CI' ) {
					var index;
					for (index = 0; index < instanceGridcm.length; ++index) {
						if (instanceGridcm[index].dataIndex == 'ClassName__c') {
							instanceGridcm[index].renderer = classNameColumnRendrer;
							break;
						}
					}	
				} 
				
				if(!backFromDetailPage && (isfirst || tabChanged || (ClassName != prevClass))){
					this.InstancesGrid.reconfigure(dataStore, instanceGridcm);
					if(typeof LoadCMDBFilterComponent  == "function" ){
						LoadCMDBFilterComponent(FilterColList);
					}
					prevClass = ClassName;					
					isfirst = false;
				}else{
					this.InstancesGrid.reconfigure(dataStore);	
				}
			
				backFromDetailPage=false;
				tabChanged = false;
				isForAdvancedFilter=false;
				if(instanceGridcm && Ext.getCmp('XMLGridBrowserPanel')){
					
					var totalColWidth = 0;
					var allColumns = this.InstancesGrid.getView().getGridColumns();
					var lastColIndex;
					var imgPath='';
					if(newSortDirection == 'ASC'){
						imgPath = imgPathAsc;
					}else{
						imgPath = imgPathDesc;
					}
					var otherthanSortColumn,sortedColTitle;
					for( i = 0; i < allColumns.length; i++ ) {
						if( allColumns[i].hidden != true ) {
							lastColIndex = i;
							totalColWidth += allColumns[i].width;
						}
						otherthanSortColumn=this.InstancesGrid.getView().getGridColumns()[i].text;
						if(otherthanSortColumn){
							otherthanSortColumn=otherthanSortColumn.replace(imgPathAsc,"");
							otherthanSortColumn=otherthanSortColumn.replace(imgPathDesc,"");
							sortedColTitle=otherthanSortColumn+imgPath;
						}	
						if(this.InstancesGrid.getView().getGridColumns()[i].dataIndex==newSortColumn){
							this.InstancesGrid.getView().getGridColumns()[i].setText(sortedColTitle);
						}else{
							this.InstancesGrid.getView().getGridColumns()[i].setText(otherthanSortColumn);
							
						}
					}
					
					var totalAvailableWidth=Ext.getCmp('XMLGridBrowserPanel').getWidth();
					if(totalColWidth && totalAvailableWidth && totalAvailableWidth-totalColWidth > 0){
						var newWidth = this.InstancesGrid.getView().getGridColumns()[lastColIndex].width + ( totalAvailableWidth - totalColWidth ) + 1; 
						
						this.InstancesGrid.getView().getGridColumns()[lastColIndex].setWidth( newWidth );
					}
				}					
				try{
					//this.Paging_SortColumn = this.InstancesGrid.store.sortInfo.field;
					//this.Paging_SortDirection = this.InstancesGrid.store.sortInfo.direction;
					this.InstancesGrid.show();
					this.Paging_SortColumn = newSortColumn;
					this.Paging_SortDirection = newSortDirection;						
					var paginationSpecs = this.InstancesGrid.store.proxy.reader.jsonData;
					pagingBar.bindStore(this.InstancesGrid.store,false);
					if(paginationSpecs){
						var totalPages = Math.ceil(paginationSpecs.resultSize / this.Paging_PageSize);						
						this.Paging_PageNumber = paginationSpecs.pageNumber;
					pagingBar.getPageData = function (){
						var retVal = {
							currentPage : paginationSpecs.pageNumber,
							total:paginationSpecs.resultSize,
							pageCount:totalPages,
							fromRecord:paginationSpecs.startIndex
						}
						return retVal;
					};
					if(paginationSpecs.resultSize>9999){
						pagingBar.displayMsg = _ServerLabels.Records+' '+paginationSpecs.startIndex+' - '+paginationSpecs.endIndex+' '+_ServerLabels.LabelOf+' '+paginationSpecs.resultSize + '+ ';
					}else{
						pagingBar.displayMsg = _ServerLabels.Records+' '+paginationSpecs.startIndex+' - '+paginationSpecs.endIndex+' '+_ServerLabels.LabelOf+' '+paginationSpecs.resultSize;
					}
					if(this.InstancesGrid.store.proxy.reader.jsonData.ExceptionMsg!='None'){
						filterIcon=Ext.getCmp('FilterBtn');
						//filterIcon.setIconCls('Filter_Not_Applied');
						filterIcon.setIconCls('filterBtn');
						filterIcon.setTooltip(AdvancedSearch);
						AdvancedFilterName='';
						var msg= InvalidFilterCriteria+'\n'+ this.InstancesGrid.store.proxy.reader.jsonData.ExceptionMsg;
						this.InstancesGrid.store.proxy.reader.jsonData.ExceptionMsg='None';
						this.GetMessageBox( 'bmc-message' ).show({title: '',msg:msg ,buttons: Ext.MessageBox.OK,title: _ServerValues.WarningTitle,icon: Ext.MessageBox.ERROR});
					}
					}
					pagingBar.onLoad();
					var index = 0;
					for (index = 0; index < this.InstancesGrid.store.data.length; index++){	
						if(typeof selectedRowIndexInstanceID == 'undefined'){
							index = 0;
							break;
						}else if(this.InstancesGrid.store.getAt(index).get('InstanceID__c') == selectedRowIndexInstanceID){
							break;
						}
					}
					hideWaitMsgBar();
					if(this.InstancesGrid.getSelectionModel().getStore().data.length > 0) {
						this.InstancesGrid.getSelectionModel().select(index);
						if( index == 0 ) {
							this.OnRowSelect(this.InstancesGrid, this.InstancesGrid.getSelectionModel().getStore().getAt(0));
						}
					}
										
				}catch(e){console.log(e);}
				if(setFocusOnSearchText) {
					var textInputField = document.getElementById('searchTxt');
					textInputField.focus();
					setFocusOnSearchText = false;
				}

				if(isFromRelationship) {
					this.InstancesGrid.getSelectionModel().deselectAll();
					Ext.getCmp('selectedInstancesCountLabel').setText(' '+_ServerLabels.SelectedInstances+' 0');
				}

			}.createDelegate(this)
		 );
	},

	SetPointerRecords : function()
	{
		try{
		var storData = this.InstancesGrid.store.data;
		this.Paging_PointerFirstRecordValue = storData.items[0].data[this.Paging_SortColumn];
		this.Paging_PointerLastRecordValue = storData.items[storData.length-1].data[this.Paging_SortColumn];
		}catch(e){console.log(e);}
	},
	
	GoToNextPage : function()
	{
		showWaitMsgBar();
		this.SetPointerRecords();
		this.PageMoveDirection ='NEXT';
		this.Paging_PageNumber++;
		this.getInstanceListStore();
	},

	GoToPreviousPage : function()
	{
		showWaitMsgBar();
		this.SetPointerRecords();
		this.PageMoveDirection = 'PREVIOUS';
		this.Paging_PageNumber--;
		this.getInstanceListStore();
	},

   
    ChangeScheduleHandler : function() {
        var screenHeight = 650;
        var screenWidth = 1100;
        var screenLeft = (screen.width - screenWidth)/2;
        var screenTop = parseInt((screen.height/2)-(screenHeight/2))-50;
        var ChangeScheduleBtnHandlerWindow = window.open('/apex/ChangeSchedule?standardLayout=true','ChangeSchedule',"status = 1,height ="+screenHeight+",width ="+ screenWidth+",left="+screenLeft+",top="+screenTop+", resizable = 1,scrollbars=no");
        if (ChangeScheduleBtnHandlerWindow.focus) {ChangeScheduleBtnHandlerWindow.focus() ;}
    },

	OpenBMCAPM : function(){
		currentPage='CMDBProcMgmtPage';
		if(isStdForm){
			window.open( "/apex/CMDBProcMgmtPage",'_blank',"status = 1, height = 1000, width = 1000,left=100,right=200, resizable = 1,scrollbars=no");
		}else{
			var CMBDProcPage = 'NavigatorPage?title='+ _ServerValues.CMDBProcess +'&target=CMDBProcMgmtPage';
			window.parent.parent.addNewTab('CMDB Process', _ServerValues.AlignabilityProcessModel, CMBDProcPage, 'false');
		}
	},
	
	ChangeHeaderTitle : function( selected_tab, record_id) {
		var Node = this.TypeTreeView.getView().getTreeStore().getNodeById(record_id);
		//Ext.getCmp( 'XMLGridBrowserPanel' ).setTitle( '<span id="title_info">' +_ServerValues.InstanceGridTitle + '  >  ' + selected_tab + ' ' + ClassesLbl + ' >  </span>' + '<span id="title_record">' +  Node.raw.text + '</span>' );
		Ext.getCmp( 'XMLGridBrowserPanel' ).setTitle( '<span id="title_record">' + Node.raw.text + '  /  ' + _ServerValues.InstanceGridTitle+'</span>');
	},
	GetMessageBox: function( baseCls ) {
		if(WinMsg == null){
			WinMsg = Ext.create('Ext.window.MessageBox');
		}		
		WinMsg.baseCls = baseCls;
		return WinMsg;
	},
	
	/* End of paging code */

	empty:''
}
function isCJKChar(str) {
		var CJKpattern = /[\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;
		var m = CJKpattern.test(str)
		return(m);
}
function oncompleteFPvalidateJS(validated){
	if(validated){
		isFPUserValidated = true;
		showWaitMsgBar();
		if(!makeConsoleAPICallFromServer && (isDiscoveryEnabled || (isACEnabled && isACCertified))){
			makeBCMConsoleAPIRequest();
		}else{
			getBinaryBCMConsole();
		}
	}
}

function ReplaceAll(Source,stringToFind,stringToReplace){
				var reptemp = Source;
				var repindex = reptemp.indexOf(stringToFind);
				while(repindex != -1)
				{
					reptemp = reptemp.replace(stringToFind,stringToReplace);
					repindex = reptemp.indexOf(stringToFind);
				}
				return reptemp;
}

function RemoveReserveCharactersForSOSL(value)
{
	var chars = new Array('?', '&', '|', '!', '{', '}', '[', ']', '(', ')', '^', '~', '*', ':', '\\', '"', '+', '-', '\'');
	for(var j = 0 ; j < chars.length; j++)
	{
		value = ReplaceAll(value, chars[j],'');
	}
	return value
}

function toggleCheckBoxes(ImpactedItem, showHide)
{
	//if(Ext.isIE7 || Ext.isIE8)
	//{
		ImpactedItem.setChecked(showHide,true);
	/*}
	else
	{
		ImpactedItem.setValue(showHide,true);
	}*/
}

function getRootForTreeView(){
		var strJSON = _ServerValues.TreeViewJSON;
		var childjson = eval(Ext.util.Format.htmlDecode(strJSON));
		var isAbstract = false;
		if(childjson != null && typeof(childjson) != 'undefined' && childjson !=''){
			var allChildren = childjson[0].children;
			
			if(selectedTab == 'CI'){
				var CItree = [];
				childjson[0].text = _ServerValues.CMDB_ALL_CIs;
				childjson[0].qtip = _ServerValues.CMDB_ALL_CIs;
				CItree = getCIHierarchy(allChildren);
				allChildren = CItree;
				
			}else if(selectedTab == 'Asset'){
				var Assettree = [];
				childjson[0].text = _ServerValues.CMDB_ALL_ASSETS;
				childjson[0].qtip = _ServerValues.CMDB_ALL_ASSETS;
				childjson[0].abstract = true;
				Assettree = getAssetHierarchy(allChildren);
				allChildren = Assettree;
			}else{
				childjson[0].text = _ServerValues.CMDB_ALL_INSTANCES;
				childjson[0].qtip = _ServerValues.CMDB_ALL_INSTANCES;
				allChildren = setTreeTooltip(allChildren);
			}
			allChildren = disableAndRemoveNode(allChildren);
			childjson[0].children = allChildren;
		}
		
	    var root = new Ext.data.TreeStore({
			root: {
				expanded: true,
				children: childjson,
				
			},
			sorters: [{property:'text', direction: 'ASC'}]
			
		});
		
		
		return root;
}

function showCustomListView(){
	
	if(isAssetManagementEnabled && isCIManagementEnabled && typeof(selectedClsType) != 'undefined'){
		if((selectedClsType == 'CI' || selectedClsType == 'CI and Asset' || selectedClsType == '' ) && selectedTab != 'Asset')
			_ServerValues.InstanceEditorTitle = instanceEditorTitleForCIClass;
		else
			_ServerValues.InstanceEditorTitle = instanceEditorTitleForAssetClass;
	}

	CMDBManagerNamespace.instance.InstanceGridColumns = encodeColumnHeader(incGridforBE);
	colInstanceGrid = incGridforBE;

	if(CMDBManagerNamespace.instance.InstancesGrid!=null)
	{
		CMDBManagerNamespace.instance.Paging_PageNumber=1;
		CMDBManagerNamespace.instance.getInstanceListStore(classRecord);
		if(classRecord == "BMC_BaseElement" && selectedTab == 'CI'){
			Ext.getCmp('ShowCIs').enable();
			Ext.getCmp('ShowBusinessServices').enable();	
            if (SelectedRecordIDCookieVal == 'BMC_BusinessService') {
                toggleCheckBoxes(Ext.getCmp('ShowCIs'), false);
                toggleCheckBoxes(Ext.getCmp('ShowBusinessServices'), true);
            } else {
				toggleCheckBoxes(Ext.getCmp('ShowCIs'), true);		
				toggleCheckBoxes(Ext.getCmp('ShowBusinessServices'), false);					
            }

		}else{
			Ext.getCmp('ShowCIs').disable();
			Ext.getCmp('ShowBusinessServices').disable();	
		}
	}
		
	try{
		//prevClass = CMDBManagerNamespace.instance.SelectedRecordID;
		CMDBManagerNamespace.instance.SelectedRecordID = classRecord; // Sync up the record id to avoid recursive calls.
		CMDBManagerNamespace.instance.syncTypeViews(classRecord);
	}
	catch(e){console.log(e);
	}
		
	CMDBManagerNamespace.instance.SelectedRecordID = classRecord;
	if(CMDBManagerNamespace.instance.TypeTreeView != null && CMDBManagerNamespace.instance.TypeTreeView != 'undefined' && 
	CMDBManagerNamespace.instance.TypeTreeView.getSelectionModel() != null && CMDBManagerNamespace.instance.TypeTreeView.getSelectionModel() != 'undefined' && 
	CMDBManagerNamespace.instance.TypeTreeView.getSelectionModel().getSelection() != null && CMDBManagerNamespace.instance.TypeTreeView.getSelectionModel().getSelection() != 'undefined' && CMDBManagerNamespace.instance.TypeTreeView.getSelectionModel().getSelection().length > 0 &&  
	CMDBManagerNamespace.instance.TypeTreeView.getSelectionModel().getSelection()[0].raw.abstract != null && CMDBManagerNamespace.instance.TypeTreeView.getSelectionModel().getSelection()[0].raw.abstract!= 'undefined' )
	{
		isabstract = CMDBManagerNamespace.instance.TypeTreeView.getSelectionModel().getSelection()[0].raw.abstract;
	}
	if(isCMDBClassPermissionsEnable || fallBackToFresh){
		enabledisablenewbuttonForClassPermissions();
	}

}

function createCookie(cookieName, cookieValue, isSettings) {
	var today = new Date();
	var expiry = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
    
	if(isSettings)
		document.cookie = userId + cookieName+'='+cookieValue+';path=/;SameSite=None;Secure;expires='+expiry;
	else
		document.cookie ='apex__' + userId+'TabName'+'='+selectedTab+';path=/;SameSite=None;Secure;expires='+expiry;
}

function getPagingToolbar() {
	var pbar = new Ext.PagingToolbar({
		id:'pagingToolbarId',
		dock: 'bottom',	
		padding:'0 0 0 10',
		moveNext: moveNext,
		movePrevious: movePrevious,	
		moveFirst: moveFirst,
		moveLast: moveLast,		
		doRefresh: doRefresh,	
		displayInfo: true,
		emptyMsg: _ServerValues.NoRecordFoundMsg,		
		refreshText: _ServerLabels.PageRefresh,		
		nextText: _ServerLabels.PageNext,		
		firstText: _ServerLabels.PageFirst,		
		lastText: _ServerLabels.PageLast,		
		prevText: _ServerLabels.PagePrevious,		
		beforePageText: _ServerLabels.Page,		
		afterPageText: _ServerLabels.Of,		
		inputItemWidth: 40,
		cls: 'PagingToolbarClass',
		listeners: {	
			beforechange : function( that, pageData, eOpts) {				
				var pageBarData = pbar.getPageData();				
				var newPage = parseInt(pbar.child("#inputItem").getActionEl().dom.value);
				if(newPage>pageBarData.pageCount){
					newPage = pageBarData.pageCount;					
				}else if(newPage <= 0){
					newPage = 1;
				}
				CMDBManagerNamespace.instance.Paging_PageNumber = newPage;
				showWaitMsgBar();
				CMDBManagerNamespace.instance.getInstanceListStore();
				return false;						
			},				
			afterrender: function (thisBar){
				thisBar.items.get(2).el.setStyle('margin','0px 15px 0px 5px');
				thisBar.items.get(6).el.setStyle('margin','0px 5px 0px 15px');
				thisBar.child('#first').el.setStyle('margin-right','15px');
				thisBar.child('#last').el.setStyle('margin-left','15px');
			}
		}		
	});	
	pbar.child('#first').setIconCls('d-icon-angles_left');
	pbar.child('#prev').setIconCls('d-icon-angle_left');
	pbar.child('#next').setIconCls('d-icon-angle_right');
	pbar.child('#last').setIconCls('d-icon-angles_right');
	pbar.child('#refresh').setIconCls('d-icon-restart');
	
	pbar.child('#first').setWidth(15);
	pbar.child('#prev').setWidth(15);
	pbar.child('#next').setWidth(15);
	pbar.child('#last').setWidth(15);
	pbar.child('#refresh').setWidth(30);
	
	pbar.child('#refresh').addCls('bmc-btn-refresh');
	pbar.setLoading(false,[]);
    
	return pbar;
}

function moveNext(){		
	CMDBManagerNamespace.instance.Paging_PageNumber++;	
	showWaitMsgBar();
	CMDBManagerNamespace.instance.getInstanceListStore();
}

function movePrevious(){
	//pagingBar.setLoading(false,false);
	//showWaitMsgBar();
	//Ext.getCmp('XMLGridPanel').getStore().previousPage();		
	CMDBManagerNamespace.instance.Paging_PageNumber--;	
	showWaitMsgBar();
	CMDBManagerNamespace.instance.getInstanceListStore();
}

function moveFirst() {
	CMDBManagerNamespace.instance.Paging_PageNumber = 1
	showWaitMsgBar();
	CMDBManagerNamespace.instance.getInstanceListStore();
}

function moveLast() {
	var pagingBarData = pagingBar.getPageData();
	CMDBManagerNamespace.instance.Paging_PageNumber = pagingBarData.pageCount;
	showWaitMsgBar();
	CMDBManagerNamespace.instance.getInstanceListStore();
}

function doRefresh() {
	showWaitMsgBar();
	CMDBManagerNamespace.instance.getInstanceListStore();
}

function deletemethod(elements){
	if(elements.length>0)
    {
    	var s = '';
        var cname = elements[0].data.ClassName__c;
		if(cname){
			for(var i=0;i<elements.length;i++)
			{
				s+=elements[i].data.InstanceID__c+',';
			}
			
			deleteCIs(cname,s);
		}
    }
}

function getMsgFunc(){
	var msg = deleteMsgLbl + '<br/><br/>';
	if(selectedTab.toLowerCase() == 'ci'){
		if(deleteCI == true && deleteAsset == true){
			msg += '<input type="radio" id="rdBtnAsset" name="delOptions" value="Asset" />' +
	 	  	  	   '<label for="rdBtnAsset" style="margin-left: 5px; vertical-align: top;">' +
	 	  	  	   lblToDelOnlyAsset +
	 	  	  	   '</label><br/><br/>' +
	 	  	  	   '<input type="radio" id="rdBtnCI" name="delOptions" value="CI" checked=true/>' +
	 	  	  	   '<label for="rdBtnCI" style="margin-left: 5px; vertical-align: top;">' +
	 	  	  	   lblToDelOnlyCI +
	 	  	  	   '</label><br/><br/>' +
	 	  	  	   '<input type="radio" id="rdBtnBoth" name="delOptions" value="Both" />' +
	 	  	  	   '<label for="rdBtnBoth" style="margin-left: 5px; vertical-align: top;">' +
	 	  	  	   lblToDelBothCIAndAsset +
	 	  	  	   '</label>';
		}else if(deleteCI == true && deleteAsset == false){
			msg += '<input type="radio" id="rdBtnAsset" name="delOptions" value="Asset" disabled=true/>' +
		 	  	   '<label for="rdBtnAsset" style="margin-left: 5px; vertical-align: top; color: grey;">' +
		 	  	   lblToDelOnlyAsset +
		 	  	   '</label><br/><br/>' +
		 	  	   '<input type="radio" id="rdBtnCI" name="delOptions" value="CI" checked=true/>' +
		 	  	   '<label for="rdBtnCI" style="margin-left: 5px; vertical-align: top;">' +
		 	  	   lblToDelOnlyCI +
		 	  	   '</label><br/><br/>' +
		 	  	   '<input type="radio" id="rdBtnBoth" name="delOptions" value="Both" disabled=true/>' +
		 	  	   '<label for="rdBtnBoth" style="margin-left: 5px; vertical-align: top; color: grey;">' +
		 	  	   lblToDelBothCIAndAsset +
		 	  	   '</label>';
		}
	}else if(selectedTab.toLowerCase() == 'asset'){
		if(deleteCI == true && deleteAsset == true){
			msg += '<input type="radio" id="rdBtnAsset" name="delOptions" value="Asset" checked=true/>' +
	  	  	  	   '<label for="rdBtnAsset" style="margin-left: 5px; vertical-align: top;">' +
	  	  	  	   lblToDelOnlyAsset +
	  	  	  	   '</label><br/><br/>' +
	  	  	  	   '<input type="radio" id="rdBtnCI" name="delOptions" value="CI" />' +
	  	  	  	   '<label for="rdBtnCI" style="margin-left: 5px; vertical-align: top;">' +
	  	  	  	   lblToDelOnlyCI +
	  	  	  	   '</label><br/><br/>' +
	  	  	  	   '<input type="radio" id="rdBtnBoth" name="delOptions" value="Both" />' +
	  	  	  	   '<label for="rdBtnBoth" style="margin-left: 5px; vertical-align: top;">' +
	  	  	  	   lblToDelBothCIAndAsset +
	  	  	  	   '</label>';
		}else if(deleteCI == false && deleteAsset == true){
			msg += '<input type="radio" id="rdBtnAsset" name="delOptions" value="Asset" checked=true/>' +
	  	  	  	   '<label for="rdBtnAsset" style="margin-left: 5px; vertical-align: top;">' +
	  	  	  	   lblToDelOnlyAsset +
	  	  	  	   '</label><br/><br/>' +
	  	  	  	   '<input type="radio" id="rdBtnCI" name="delOptions" value="CI" disabled=true/>' +
	  	  	  	   '<label for="rdBtnCI" style="margin-left: 5px; vertical-align: top; color: grey">' +
	  	  	  	   lblToDelOnlyCI +
	  	  	  	   '</label><br/><br/>' +
	  	  	  	   '<input type="radio" id="rdBtnBoth" name="delOptions" value="Both" disabled=true/>' +
	  	  	  	   '<label for="rdBtnBoth" style="margin-left: 5px; vertical-align: top; color: grey">' +
	  	  	  	   lblToDelBothCIAndAsset +
	  	  	  	   '</label>';
		}
	}else if(selectedTab.toLowerCase() == 'all'){
		if(deleteCI == true && deleteAsset == true){
			msg += '<input type="radio" id="rdBtnAsset" name="delOptions" value="Asset" />' +
	  	  	  	   '<label for="rdBtnAsset" style="margin-left: 5px; vertical-align: top;">' +
	  	  	  	   lblToDelOnlyAsset +
	  	  	  	   '</label><br/><br/>' +
	  	  	  	   '<input type="radio" id="rdBtnCI" name="delOptions" value="CI" />' +
	  	  	  	   '<label for="rdBtnCI" style="margin-left: 5px; vertical-align: top;">' +
	  	  	  	   lblToDelOnlyCI +
	  	  	  	   '</label><br/><br/>' +
	  	  	  	   '<input type="radio" id="rdBtnBoth" name="delOptions" value="Both" checked=true/>' +
	  	  	  	   '<label for="rdBtnBoth" style="margin-left: 5px; vertical-align: top;">' +
	  	  	  	   lblToDelBothCIAndAsset +
	  	  	  	   '</label>';
		}else if(deleteCI == true && deleteAsset == false){
			msg += '<input type="radio" id="rdBtnAsset" name="delOptions" value="Asset" disabled=true/>' +
	 	  	  	   '<label for="rdBtnAsset" style="margin-left: 5px; vertical-align: top; color: grey;">' +
	 	  	  	   lblToDelOnlyAsset +
	 	  	  	   '</label><br/><br/>' +
	 	  	  	   '<input type="radio" id="rdBtnCI" name="delOptions" value="CI" checked=true/>' +
	 	  	  	   '<label for="rdBtnCI" style="margin-left: 5px; vertical-align: top;">' +
	 	  	  	   lblToDelOnlyCI +
	 	  	  	   '</label><br/><br/>' +
	 	  	  	   '<input type="radio" id="rdBtnBoth" name="delOptions" value="Both" disabled=true/>' +
	 	  	  	   '<label for="rdBtnBoth" style="margin-left: 5px; vertical-align: top; color: grey;">' +
	 	  	  	   lblToDelBothCIAndAsset +
	 	  	  	   '</label>';
		}else if(deleteCI == false && deleteAsset == true){
			msg += '<input type="radio" id="rdBtnAsset" name="delOptions" value="Asset" checked=true/>' +
	  	  	  	   '<label for="rdBtnAsset" style="margin-left: 5px; vertical-align: top;">' +
	  	  	  	   lblToDelOnlyAsset +
	  	  	  	   '</label><br/><br/>' +
	  	  	  	   '<input type="radio" id="rdBtnCI" name="delOptions" value="CI" disabled=true/>' +
	  	  	  	   '<label for="rdBtnCI" style="margin-left: 5px; vertical-align: top; color: grey;">' +
	  	  	  	   lblToDelOnlyCI +
	  	  	  	   '</label><br/><br/>' +
	  	  	  	   '<input type="radio" id="rdBtnBoth" name="delOptions" value="Both" disabled=true/>' +
	  	  	  	   '<label for="rdBtnBoth" style="margin-left: 5px; vertical-align: top; color: grey;">' +
	  	  	  	   lblToDelBothCIAndAsset +
	  	  	  	   '</label>';
		}
	}
	return msg;
}
var Xin,Yin;
function openWindow(){
  if(!filterWindowOpened){
	 filterWindowOpened =true;
     if(typeof(classRecord) == 'undefined' || classRecord == null){
		classRecord = 'BMC_BaseElement';
	 }
	 var MainPanel = document.getElementById('XMLGridPanel');
	 if(typeof('MainPanel')!='undefined' && MainPanel!=null){
	 		var GridWindow = MainPanel.getBoundingClientRect();
			Xin=GridWindow.right - 625;
	 }else{
	 		Xin=735
	 }
	 Yin=160;
	 if(uiTheme == 'Theme4d')
	  {
	   	Yin = 50;
	  }	

	 var url= 'AdvancedSearchFilter?className='+urlencode(classRecord)+'&classType='+urlencode(selectedClsType)+'&tabName='+urlencode(selectedTab)+'&AppliedFilter='+urlencode(AdvancedFilterName);
	 AdvancedFilterPopUp = new Ext.Window({
		width: 595,
		height:Ext.isGecko?297:292,
		//x:Xin,
		//y:Yin,
		closable:false,
		shadow :false,
		header: false,
		id:'win',
		resizable:false,
		bodyStyle:'background-color:#FFFFFF;',
		style: 'padding: 0; border-width: 0;',
		constrain : true,
		viewConfig: {forceFit: true},
		frame:false,
		html:'<iframe frameborder="0" src =\"\/apex\/'+url+'\" style=\"width:100%;height:100%;"/>'
		
	});
	AdvancedFilterPopUp.show();
	if( userLanguage == 'iw' ) {
		AdvancedFilterPopUp.alignTo('FilterBtn','tl-bl',[1,0]);
	} else {
		AdvancedFilterPopUp.alignTo('FilterBtn','tr-br',[1,0]);
	}
	
 }
}
document.onclick = closePopUp; 
function closePopUp(e){ 
	e = e || window.event;
    e = e.target || e.srcElement;
    if(e.id!='BTN_CDM_FilterBtn'){
		if(filterWindowOpened){
 			AdvancedFilterPopUp.close();
 			filterWindowOpened =false;
 		}
 	}
}
Ext.EventManager.onWindowResize(function () {
	if(AdvancedFilterPopUp!= undefined && AdvancedFilterPopUp!=null && filterWindowOpened)
	 AdvancedFilterPopUp.setPosition( Xin, Yin , true) ;
    setSizeOnWindowResize();
	 
});
function getAssetHierarchy(allChildren){
	var Assettree = [];
	for(var i in allChildren){
		var elem = allChildren[i];
		if(elem.CMDBClassType == 'Asset'  || elem.CMDBClassType == 'CI and Asset' || elem.HasAssetChild == true){
			if(elem.HasAssetChild == true){
				if(elem.CMDBClassType == 'CI')
					elem.abstract = true;
				var validChildrenList = [];
				var currentNodeChildren = [];
				for(i in elem.children){
					currentNodeChildren.push(elem.children[i]);
				}	
				var assetChildren = getAssetHierarchy(currentNodeChildren);
				if(assetChildren != '' && typeof(assetChildren) != 'undefined' && assetChildren != null){
					for(l in assetChildren){
						if(typeof(assetChildren[l]) == 'object')
							validChildrenList.push(assetChildren[l]);
					}
				}
				elem.children = validChildrenList;
			}
			if(elem.CMDBClassType == 'CI')
				elem.qtip = elem.qtip + ' ('+_ServerValues.CMDB_TAB_CIs+')';
			else if(elem.CMDBClassType == 'CI and Asset')
				elem.qtip = elem.qtip + ' ('+_ServerValues.CIAndAsset+')';
			if(elem.HasAssetChild != true){
				delete elem.children;
				delete elem.expandable;
				delete elem.expanded;
				elem.leaf = true;
			}
			Assettree.push(elem);
		}
	}
	return Assettree;
}

function getCIHierarchy(allChildren){
	var CItree = [];
	for(var i in allChildren){
		var elem = allChildren[i];
		if((typeof(elem) != 'undefined') && ((elem.CMDBClassType == 'CI'  || elem.CMDBClassType == 'CI and Asset') || (elem.CMDBClassType == 'Asset' && elem.leaf != true))){
			if(elem.CMDBClassType == 'Asset'){
				elem.abstract = true;
				elem.qtip = elem.qtip + ' ('+_ServerValues.CMDB_TAB_Assets+')';
			}
			if(elem.HasAssetChild == true){
				var validChildrenList = [];
				var currentNodeChildren = [];
				for(i in elem.children){
					currentNodeChildren.push(elem.children[i]);
				}	
				var CIChildren = getCIHierarchy(currentNodeChildren);
				if(CIChildren != '' && typeof(CIChildren) != 'undefined' && CIChildren != null){
					for(l in CIChildren){
						if(typeof(CIChildren[l]) == 'object')
							validChildrenList.push(CIChildren[l]);
					}
				}
				elem.children = validChildrenList;
				if(!(elem.CMDBClassType == 'Asset' && validChildrenList.length == 0))
					CItree.push(elem);
			}else{
				CItree.push(elem);
			}
		}
	}
	return CItree;
}

function setTreeTooltip(allChildren){
	var childrenList = allChildren;
	for(var i in childrenList){
		var elem = allChildren[i];
		if(elem.CMDBClassType == 'CI and Asset')
			elem.qtip = elem.qtip + ' ('+_ServerValues.CIAndAsset+')';
		if(elem.CMDBClassType == 'Asset')
			elem.qtip = elem.qtip + ' ('+_ServerValues.CMDB_TAB_Assets+')';
		if(elem.leaf != true)
			elem.children = setTreeTooltip(elem.children);
	}
	return childrenList;
}

function hideParentNode(pElem){
	var hideAllChildren = true;
	var childrenList = pElem.children;
	for(var i in childrenList){
		var elem = childrenList[i];
		var cName = childrenList[i].id;
		if(cName){
			cName = cName.toLowerCase();
		}
		if(classAccessMap[cName] && classAccessMap[cName].Permissions.isAccessible){
			hideAllChildren = false;
			return hideAllChildren;
		}
	}	
	return hideAllChildren;
}

function disableAndRemoveNode(allChildren){
	var childrenList = allChildren;
	for(var i in childrenList){
		var elem = allChildren[i];
		/*code for disabling/hiding classes as per CLS*/
		if(isCMDBClassPermissionsEnable && classAccessMap){
			var cName = allChildren[i].id;
			if(cName){
				cName = cName.toLowerCase();
			}
			if(allChildren[i].children)
				var hideParent = hideParentNode(elem);
			if(classAccessMap[cName] && !classAccessMap[cName].Permissions.isAccessible){
				allChildren[i].disabled = true;
				if(allChildren[i].leaf || hideParent){
					allChildren[i].hidden=true;
				}				
			}
		}
		/*---END----*/
		if(typeof(elem) != 'undefined' && elem.disabled == true){
			if(elem.leaf || elem.hidden == true)
				elem.cls = 'rf-hidden-node';
			else
				elem.cls = 'rf-disable-node';
		}
		
		if(elem.leaf != true)
			elem.children = disableAndRemoveNode(elem.children);
	}
	return childrenList;
}

function callAdvancedSearch(){
	if(AdvancedFilterName != null && AdvancedFilterName != ''){
		Ext.getCmp('FilterBtn').setIconCls('filterBtn-applied');
		Ext.getCmp('FilterBtn').setTooltip(FilterIconTooltip);
	}else{
		//Ext.getCmp('FilterBtn').setIconCls('Filter_Not_Applied');
		Ext.getCmp('FilterBtn').setIconCls('filterBtn');
		Ext.getCmp('FilterBtn').setTooltip(AdvancedSearch);
	}
	CMDBManagerNamespace.instance.getInstanceListStore();
}

var classNameColumnRendrer = function(value, metaData, record, rowIndex, colIndex, store) {
	var RBAClass = record.get('FKAssetRuleClass__c');
	if(RBAClass !=null && typeof(RBAClass) != 'undefined' && RBAClass != '')
		value = RBAClass+' ('+value+')';
	return value;
};

function hideWaitMsgBar(){
	if(typeof(waitingMask) !='undefined' && waitingMask != null && waitingMask !=''){
		waitingMask.hide();
	}
}
function showWaitMsgBar(){
	waitingMask = new Ext.LoadMask(
						document.getElementById('XMLGridBrowserPanel'), 
						{
						floating: {shadow: false},
						msgCls: "d-loader-container",
						msg:'<ul class="d-loading"><li class="d-loading__stick d-loading__stick_1"></li><li class="d-loading__stick d-loading__stick_2"></li><li class="d-loading__stick d-loading__stick_3"></li><li class="d-loading__stick d-loading__stick_4"></li><li class="d-loading__stick d-loading__stick_5"></li><li class="d-loading__stick d-loading__stick_6"></li><li class="d-loading__stick d-loading__stick_7"></li><li class="d-loading__stick d-loading__stick_8"></li><li class="d-loading__stick d-loading__stick_9"></li><li class="d-loading__stick d-loading__stick_10"></li><li class="d-loading__stick d-loading__stick_11"></li><li class="d-loading__stick d-loading__stick_12"></li></ul><div>'+ pleaseWaitMsg + '</div>'}
						);
	
	if(typeof(waitingMask) !='undefined' && waitingMask != null && waitingMask !=''){
		waitingMask.show();
	}
}	
function getCustomListView(recordID,selectedTab){
	var parameters = [];
	parameters.push(recordID);
	parameters.push(selectedTab);
	CMDBManagerNamespace.instance.ChangeHeaderTitle( selectedTab, recordID );
	Visualforce.remoting.Manager.invokeAction(
		remoteActionCustomView,parameters,
		function(result, event){
			if(event.status){
				result = JSON.parse(result);
				incGridforBE = result;
				if(!backFromDetailPage && (prevClass != SelectedRecordIDCookieVal)){ 
					CMDBManagerNamespace.instance.InstancesGrid.reconfigure(incGridforBE,[]);
				}
				showCustomListView();
			}	
		},{escape: false}
	);
}

function getBinaryBCMConsole(){
	var os = '';
	if(makeConsoleAPICallFromServer || (isACEnabled && !isACCertified)){
		os = getCurrentMachinesOS();
	}
	if((isManualOSSelectionEnabled && osCookieVal && osCookieVal != 'undefined')){
		if(osCookieVal.toLowerCase() == 'windows32' || osCookieVal.toLowerCase() == 'windows64'){
			os = 'windows';
		}else if(osCookieVal.toLowerCase() == 'linux32' || osCookieVal.toLowerCase() == 'linux64'){
			os = 'linux';
		}else if(osCookieVal.toLowerCase() == 'macos'){
			os = 'macos';
		}
	}
	Visualforce.remoting.Manager.invokeAction(
		_RemotingActions.getBinaryFileFromBCM,os,
		function(result,event){
			if(event.status){
				if(result.indexOf('ERROR:404') != -1){
					directConnectDevice('Full');
				}else if(result.indexOf('ERROR:') != -1){
						this.GetMessageBox( 'bmc-message' ).show({
						title: _ServerValues.WarningTitle,
						msg: result,
						width:300,
						closable:true,
						buttons: Ext.MessageBox.OK,
						fn: function(buttonId,text ,opt ){
							if(buttonId  == 'ok'){
								//searchTxtObj.focus();
							}
						},
						//animateTarget: 'searchTxt',
						icon: Ext.MessageBox.WARNING
					});
					hideWaitMsg();
					hideWaitMsgBar();
				}else{
					var a = document.createElement("a");
					a.href = '/sfc/servlet.shepherd/version/download/'+result;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					hideWaitMsg();
					hideWaitMsgBar();
				}
			}
		},{escape:false});
}

var ajaxPreRequisiteDone = false;

function prerequisiteForAPIRequest(){
	$.ajaxTransport("+binary", function(options, originalOptions, jqXHR){
		// check for conditions and support for blob / arraybuffer response type
		if (window.FormData && ((options.dataType && (options.dataType == 'binary')) || (options.data && ((window.ArrayBuffer && options.data instanceof ArrayBuffer) || (window.Blob && options.data instanceof Blob))))){
			return {
			// create new XMLHttpRequest
				send: function(headers, callback){
					// setup all variables
					var xhr = new XMLHttpRequest(),
					url = options.url,
					type = options.type,
					async = options.async || true,
					// blob or arraybuffer. Default is blob
					dataType = options.responseType || "blob",
					data = options.data || null,
					username = options.username || null,
					password = options.password || null;
					
					xhr.addEventListener('load', function(){
						var data = {};
						data[options.dataType] = xhr.response;
						// make callback and send data
						callback(xhr.status, xhr.statusText, data, xhr.getAllResponseHeaders());
					});
					
					xhr.open(type, url, async, username, password);
					
					// setup custom headers
					for (var i in headers ) {
						xhr.setRequestHeader(i, headers[i] );
					}
					
					xhr.responseType = dataType;
					xhr.send(data);
					ajaxPreRequisiteDone = true;
				},
				abort: function(){
					jqXHR.abort();
				}
			};
	}
	});

}

function makeBCMConsoleAPIRequest(){
	if(!ajaxPreRequisiteDone){
		prerequisiteForAPIRequest();
	}
	var bcmURL = baseURL + '/ws/1/console/webstart';
	var os = '';
	if(isManualOSSelectionEnabled && osCookieVal && osCookieVal != 'undefined'){
		if(osCookieVal.toLowerCase() == 'windows32' || osCookieVal.toLowerCase() == 'windows64'){
			os = 'windows';
		}else if(osCookieVal.toLowerCase() == 'linux32' || osCookieVal.toLowerCase() == 'linux64'){
			os = 'linux';
		}else if(osCookieVal.toLowerCase() == 'macos'){
			os = 'macos';
		}
	}
	if(os && os != ''){
		bcmURL = bcmURL + '?os=' + os;
	}
	var obj = {
					type: 'GET',
					url: bcmURL,
					responseType:'arraybuffer',
					dataType: 'binary',
					processData: false,
					error: function(xhr, textStatus, error) {
						if(xhr.status == 404){
							directConnectDevice('Full');
						}else{
							alert('Error : ' + error);
							hideWaitMsg();
							hideWaitMsgBar();
						}
					},
					success: function(data,status,xhr) {
						var element = document.createElement('a');
						var disposition =  xhr.getResponseHeader('content-disposition');
						var filename = '';
						if (disposition && disposition.indexOf('attachment') !== -1) {
							var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
							var matches = filenameRegex.exec(disposition);
							if (matches != null && matches[1]) { 
								filename = matches[1].replace(/['"]/g, '');
							}
						}
						var newBlob = new Blob([data], {type: 'application/octet-stream'});
						const data1 = window.URL.createObjectURL(newBlob);
						var link = document.createElement('a');
						link.href = data1;
						link.download=filename;
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
						
						hideWaitMsg();
						hideWaitMsgBar();
					}
				};
				
	$.ajax(obj);
	
}

function ValidateReserveCharactersForSOSL(value)
{
	var chars = new Array('\\', '?', '&', '|', '!', '{', '}', '[', ']', '(', ')', '^', '~', '*', ':', '"', '+', '-');//,'\''); commented: implemented on apex side
	for(var j = 0 ; j < chars.length; j++)
	{
		value = value.split(chars[j]).join('\\'+chars[j]);
	}	 
	return value;
}

function changeGridDirectionForRTL(){
	var dataRowsInGridBody=document.getElementById('XMLGridPanel-body');
	if(userLanguage=='iw' && dataRowsInGridBody!=null && dataRowsInGridBody!=undefined)
		dataRowsInGridBody.dir="ltr";	
	else
		return;
}

function hideNode(){
	var hiddenNodes = document.getElementsByClassName('rf-hidden-node');
	for(var hiddenNode=0; hiddenNode< hiddenNodes.length; hiddenNode++){
		var node = hiddenNodes[hiddenNode];
		if(node && node.parentElement){
			node.parentElement.setAttribute('style', 'display:none');
		}
	}
}
function getClassLevelPermissions(clsName){
	var classPermissions;
	if(classAccessMap && clsName){
		classPermissions = classAccessMap[clsName.toLowerCase()];
	}
	return classPermissions;
}
function getBaseElementObjectPermission(){
	if(_ServerValues.BaseElementObjectPermission){
		var BaseElementObjectPermission = JSON.parse(_ServerValues.BaseElementObjectPermission);
		if(BaseElementObjectPermission){
		   return BaseElementObjectPermission;
		}
	}
	return null;
}
function getClassPermissionsOfSelectedRecord(selectedInstance){
	if(selectedInstance){
		var classPermissions;
		var selectedClassName = selectedInstance.get('Class__c');
		
		if(selectedInstance.get('FKAssetRuleClass__c')){
			selectedClassName = selectedInstance.get('FKAssetRuleClass__c');
		}
		
		
		if(isCMDBClassPermissionsEnable){
			classPermissions=getClassLevelPermissions(selectedClassName);
			if(classPermissions){
				return classPermissions;
			}
		}else if (fallBackToFresh){
			classPermissions=getBaseElementObjectPermission();
			if(classPermissions){
				var bePermissions = {};
				var Permissions ={};
				Permissions.isAccessible =classPermissions.isAccessible;
				Permissions.isCreateable =classPermissions.isCreateable;
				Permissions.isUpdateable =classPermissions.isUpdateable;
				Permissions.isDeletable =classPermissions.isDeletable;	
				bePermissions.Permissions=	Permissions;			
				return bePermissions;
			}
		
		}
	}
	return null;
}
function setSizeOnWindowResize(){
	try{
		var width = Ext.getBody().getViewSize().width;
		browserContainerPanelHeight = Ext.getBody().getViewSize().height;
		if(isLightningExperience || isFromRelationship) {
			width=width-5;
			browserContainerPanelHeight=browserContainerPanelHeight-5;
		}else{
			width=width-55;
			if(browserContainerPanelHeight<400){
				browserContainerPanelHeight=400;
			}else{
				browserContainerPanelHeight=browserContainerPanelHeight-135;
			}
		}
		var instanceBrowserPanelHeight = browserContainerPanelHeight - 5;
		var explorerHeight = instanceBrowserPanelHeight - 70;
		var mainTabPanel=Ext.getCmp('mainTabPanel');
		if(mainTabPanel){
			mainTabPanel.setWidth(width);
			mainTabPanel.setHeight(browserContainerPanelHeight);
		}
		var mainPanel=Ext.getCmp('mainPanel');
		if(mainPanel){
			mainPanel.setWidth(width);
			mainPanel.setHeight(browserContainerPanelHeight);
		}
		var browserContainerPanel=Ext.getCmp('browserContainerPanel');
		if(browserContainerPanel){
			browserContainerPanel.setWidth(width);
			browserContainerPanel.setHeight(browserContainerPanelHeight);
		}
		
		var InstanceBrowserPanel=Ext.getCmp('InstanceBrowserPanel');
		if(InstanceBrowserPanel){
			InstanceBrowserPanel.setWidth(width);
			InstanceBrowserPanel.setHeight(instanceBrowserPanelHeight);
		}
		var InstanceBrowserColumn2=Ext.getCmp('InstanceBrowserColumn2');
		if(InstanceBrowserColumn2){
			InstanceBrowserColumn2.setHeight(instanceBrowserPanelHeight);
		}

		var instanceEditorFrame_cmdbgenericpage=Ext.getCmp('instanceEditorFramecmdbgenericpage');
		if(instanceEditorFrame_cmdbgenericpage){
			instanceEditorFrame_cmdbgenericpage.setWidth(width);
			instanceEditorFrame_cmdbgenericpage.setHeight(instanceBrowserPanelHeight);
		}
		var instanceContainerPanel_cmdbgenericpage=Ext.getCmp('instanceContainerPanelcmdbgenericpage');
		if(instanceContainerPanel_cmdbgenericpage){
			instanceContainerPanel_cmdbgenericpage.setWidth(width);
			instanceContainerPanel_cmdbgenericpage.setHeight(instanceBrowserPanelHeight-60);
		}
		var instanceEditorFrame_cmdbcieditpage=Ext.getCmp('instanceEditorFramecmdbcieditpage');
		if(instanceEditorFrame_cmdbcieditpage){
			instanceEditorFrame_cmdbcieditpage.setWidth(width);
			instanceEditorFrame_cmdbcieditpage.setHeight(instanceBrowserPanelHeight);
		}
		var instanceContainerPanel_cmdbcieditpage=Ext.getCmp('instanceContainerPanelcmdbcieditpage');
		if(instanceContainerPanel_cmdbcieditpage){
			instanceContainerPanel_cmdbcieditpage.setWidth(width);
			instanceContainerPanel_cmdbcieditpage.setHeight(instanceBrowserPanelHeight-60);
		}
		var instanceEditorFrame_cmdbcieditpage=Ext.getCmp('instanceEditorFramecmdbeditrelationship');
		if(instanceEditorFrame_cmdbcieditpage){
			instanceEditorFrame_cmdbcieditpage.setWidth(width);
			instanceEditorFrame_cmdbcieditpage.setHeight(instanceBrowserPanelHeight);
		}
		var instanceContainerPanel_cmdbeditrelationship=Ext.getCmp('instanceContainerPanelcmdbeditrelationship');
		if(instanceContainerPanel_cmdbeditrelationship){
			instanceContainerPanel_cmdbeditrelationship.setWidth(width);
			instanceContainerPanel_cmdbeditrelationship.setHeight(instanceBrowserPanelHeight);
		}
		
		var instanceEditorFrame_anypage=Ext.getCmp('instanceEditorFrameanypage'+randomNumber);
		if(instanceEditorFrame_anypage){
			instanceEditorFrame_anypage.setWidth(width);
			instanceEditorFrame_anypage.setHeight(instanceBrowserPanelHeight);
		}
		var instanceContainerPanel_anypage=Ext.getCmp('instanceContainerPanelanypage'+randomNumber);
		if(instanceContainerPanel_anypage){
			instanceContainerPanel_anypage.setWidth(width);
			instanceContainerPanel_anypage.setHeight(instanceBrowserPanelHeight);
		}
		
		var TileViewPanel=Ext.getCmp('TileViewPanel');
		if(TileViewPanel){
			TileViewPanel.setHeight(explorerHeight);
		}
		var treeViewPanel=Ext.getCmp('treeViewPanel');
		if(treeViewPanel){
			treeViewPanel.setHeight(explorerHeight);
		}
		var ListViewGrid=Ext.getCmp('ListViewGrid');
		if(ListViewGrid){
			ListViewGrid.setHeight(explorerHeight);
		}
		var XMLGridBrowserPanel=Ext.getCmp('XMLGridBrowserPanel');
		if(XMLGridBrowserPanel){
			XMLGridBrowserPanel.setHeight(instanceBrowserPanelHeight);
		}
	
	}catch(e){
		console.log(e);
	}
}