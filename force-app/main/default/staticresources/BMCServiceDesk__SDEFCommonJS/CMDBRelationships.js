var InRGrid,CiParentWindow=window.parent,_CiRelValues=CiParentWindow._ServerValues,InstancesGrid,relationshipWin,isCISelected=false;var callFromPagination=false;var inprogress=false;var sort;var dir;var pagingBar={};var Paging_PageSize=Ext.util.Cookies.get("RelationshipPageListPageSize")?Ext.util.Cookies.get("RelationshipPageListPageSize"):25;var Paging_PageNumber=1;var MarkasDeleted=Ext.util.Cookies.get(userId+"RelMarkAsDeleted");MarkasDeleted=(MarkasDeleted&&MarkasDeleted.toUpperCase()=="TRUE")?true:false;var WinMsg;var isFirstLoad=true;function moveNext(){Paging_PageNumber++;callFromPagination=true;showWaitMsgBar();getRelationListStore()}function movePrevious(){Paging_PageNumber--;callFromPagination=true;showWaitMsgBar();getRelationListStore()}function moveFirst(){Paging_PageNumber=1;callFromPagination=true;showWaitMsgBar();getRelationListStore()}function moveLast(){var a=pagingBar.getPageData();Paging_PageNumber=a.pageCount;showWaitMsgBar();getRelationListStore()}function doRefresh(){showWaitMsgBar();getRelationListStore()}function getPagingToolbar(){var a=new Ext.PagingToolbar({id:"pagingToolbarId",dock:"bottom",padding:"0 0 0 10",moveNext:moveNext,movePrevious:movePrevious,moveFirst:moveFirst,moveLast:moveLast,doRefresh:doRefresh,displayInfo:true,emptyMsg:_ServerLabels.NoRecordFoundMsg,refreshText:_ServerLabels.PageRefresh,nextText:_ServerLabels.PageNext,firstText:_ServerLabels.PageFirst,lastText:_ServerLabels.PageLast,prevText:_ServerLabels.PagePrevious,beforePageText:_ServerLabels.Page,afterPageText:_ServerLabels.Of,inputItemWidth:40,cls:"PagingToolbarClass",listeners:{beforechange:function(f,d,c){var b=a.getPageData();var e=parseInt(a.child("#inputItem").getActionEl().dom.value);if(e>b.pageCount){e=b.pageCount}else{if(e<=0){e=1}}Paging_PageNumber=e;showWaitMsgBar();getRelationListStore();return false},afterrender:function(b){b.items.get(2).el.setStyle("margin","0px 15px 0px 5px");b.items.get(6).el.setStyle("margin","0px 5px 0px 15px");b.child("#first").el.setStyle("margin-right","15px");b.child("#last").el.setStyle("margin-left","15px")}}});a.child("#first").setIconCls("d-icon-angles_left");a.child("#prev").setIconCls("d-icon-angle_left");a.child("#next").setIconCls("d-icon-angle_right");a.child("#last").setIconCls("d-icon-angles_right");a.child("#refresh").setIconCls("d-icon-restart");a.child("#first").setWidth(15);a.child("#prev").setWidth(15);a.child("#next").setWidth(15);a.child("#last").setWidth(15);a.child("#refresh").setWidth(30);a.child("#refresh").addCls("bmc-btn-refresh");a.setLoading(false,[]);return a}function getGridFields(){var a=[];for(var b=0;b<colGridforBR.length;b++){if(colGridforBR[b].objectName==objNames.BMC_BaseElements__c){a[b]=colGridforBR[b].dataIndex+skywalkerConstant+"BaseElement"}else{a[b]=colGridforBR[b].dataIndex+skywalkerConstant+"BaseRelationship"}}return a}function getRelationListStore(){var c="/apex/CMDBJSONGenerator?type=instancelistforgridcirelationship&ClassName="+InstanceID;if(typeof(InRGrid)!="undefined"){if(callFromPagination&&sort&&dir){c+="&Pagesort="+sort+"&Pagesortdir="+dir}}if(typeof(Paging_PageNumber)!="undefined"){c+="&PageNumber="+Paging_PageNumber}if(typeof(Paging_PageSize)!="undefined"){c+="&PageSize="+Paging_PageSize}c+="&MarkasDeleted="+MarkasDeleted;var b=new Ext.data.proxy.Ajax({simpleSortMode:true,url:c,reader:{type:"json",root:"records"}});var a=new Ext.data.JsonStore({proxy:b,remoteSort:true,root:"records",sorters:[{property:sort,direction:dir,root:"records"}],fields:getGridFields()});a.load();a.on("load",function(){var d=a.proxy.reader.jsonData;var e=Math.ceil(d.resultSize/Paging_PageSize);pagingBar.bindStore(a,false);if(d.pageNumber>e){d.pageNumber=e;Paging_PageNumber=e}pagingBar.getPageData=function(){var f={currentPage:d.pageNumber,total:d.resultSize,pageCount:e,fromRecord:d.startIndex};return f};pagingBar.displayMsg=_ServerLabels.Records+" "+d.startIndex+" - "+d.endIndex+" "+_ServerLabels.LabelOf+" "+d.resultSize;pagingBar.onLoad();if(isFirstLoad){InRGrid.reconfigure(a);isFirstLoad=false}else{InRGrid.reconfigure(a,InRGrid.initialConfig.columns);InRGrid.getView().refresh()}hideWaitMsgBar()}.createDelegate(this));return a}function MarkAsDeletedClicked(b,a){if(a){MarkasDeleted=a}else{MarkasDeleted=false}Paging_PageNumber=1;getRelationListStore();createCookie()}function createCookie(){var a=new Date();var b=new Date(a.getTime()+365*24*60*60*1000);document.cookie=userId+"RelMarkAsDeleted="+MarkasDeleted+";path=/;SameSite=None;Secure;expires="+b.toUTCString()}window.parent.parent.getRelationListStoreRef=getRelationListStore;function showRelationshipEditor(url,panelTitle,relationshipInstanceID){var BackIcon='<button id="back_button" type="button" role="button" title="'+backLabel+'" onclick="CMDBManagerNamespace.instance.CloseFormPanel();"><span>&lt; '+backLabel+"</span></button>";panelTitle='<span class="instance_editor_title" style="margin-left: 3px;">'+Ext.util.Format.htmlEncode(classNameTitle)+" / "+panelTitle+"</span >";if(typeof(relationshipInstanceID)=="undefined"||relationshipInstanceID==null||relationshipInstanceID.trim()==""){window.parent.parent.relEditorPanel=CiParentWindow.parent.CMDBManagerNamespace.instance.ShowFormPanel(url,BackIcon+panelTitle)}else{if(orgNamespace!=""&&orgNamespace!=null&&orgNamespace!="undefined"&&orgNamespace!="null"){eval(orgNamespace).CMDBGenericRemoting.isInstanceReadable(relationshipInstanceID,function(result,event){if(event.status){if(result){window.parent.parent.relEditorPanel=CiParentWindow.parent.CMDBManagerNamespace.instance.ShowFormPanel(url,BackIcon+panelTitle)}else{GetMessageBox("bmc-message").alert("",_CiRelValues.MsgNoAccessPerm).setPosition(undefined,dialogTop)}}else{if(event.type==="exception"){GetMessageBox("bmc-message").alert("",event.message).setPosition(undefined,dialogTop)}}},{escape:true})}else{CMDBGenericRemoting.getclassaccess(relationshipInstanceID,function(result,event){if(event.status){if(result){window.parent.parent.relEditorPanel=CiParentWindow.parent.CMDBManagerNamespace.instance.ShowFormPanel(url,BackIcon+title_info+panelTitle)}else{GetMessageBox("bmc-message").alert("",_CiRelValues.MsgNoAccessPerm).setPosition(undefined,dialogTop)}}else{if(event.type==="exception"){GetMessageBox("bmc-message").alert("",event.message).setPosition(undefined,dialogTop)}}},{escape:true})}}}function newRelationship(){var a="/apex/CMDBEditRelationship?contextCiInstId="+_CiRelValues.InstanceID+"&tabName="+tabName+"&instanceType="+instanceType+"&classNameTitle="+urlencode(classNameTitle);showRelationshipEditor(a,RelationshipEditor+": "+_ServerLabels.New,"")}function urlencode(a){return encodeURIComponent(a).replace(/!/g,"%21").replace(/'/g,"%27").replace(/\(/g,"%28").replace(/\)/g,"%29").replace(/\*/g,"%2A").replace(/%20/g,"+")}function openCI(b,a,c,d){if(c!="undefined"&&c!=null){CiParentWindow.parent.CMDBManagerNamespace.instance.ShowInstancePanel(b,a,null,null,c)}else{CiParentWindow.parent.CMDBManagerNamespace.instance.ShowInstancePanel(b,null,null,null,null)}}function openEditor(b,a,c){if(isBREditable){showRelationshipEditor(b,a,c)}else{GetMessageBox("bmc-message").show({msg:noEditPerm,icon:Ext.MessageBox.INFO,buttons:Ext.MessageBox.OK}).setPosition(undefined,dialogTop)}}function editAction(a){if(isBREditable){var b=InRGrid.getSelectionModel().getSelection();if(b.length==1){var a="/apex/CMDBEditRelationship?RelationshipInstanceID="+b[0].data.InstanceID__cфBaseRelationship+"&contextCiInstId="+_CiRelValues.InstanceID+"&tabName="+tabName+"&instanceType="+instanceType+"&classNameTitle="+urlencode(classNameTitle);showRelationshipEditor(a,RelationshipEditor+": "+b[0].data.Name__cфBaseRelationship,b[0].data.InstanceID__cфBaseRelationship)}}else{GetMessageBox("bmc-message").show({msg:noEditPerm,icon:Ext.MessageBox.INFO,buttons:Ext.MessageBox.OK}).setPosition(undefined,dialogTop)}}function deleteAction(){GetMessageBox("bmc-message").confirm(_CiRelValues.Delete,_ServerLabels.Delete,function(a){if(a.toUpperCase()=="YES"){showWaitMsgBar();var c=InRGrid.getSelectionModel().getSelection();if(c.length>0){var b="";for(i=0;i<c.length;i++){b+=c[i].data.InstanceID__cфBaseRelationship+","}deletecirelationships(b)}}}).setPosition(undefined,dialogTop)}function getRelGridToolBar(){var b=[{xtype:"tbspacer",width:5},{scale:"medium",tooltipType:"title",tooltip:_CiRelValues.New,id:"newRelInstanceBtn",baseCls:"bmc-btn-primary",disabledCls:"bmc-btn-primary-disabled",focusCls:"bmc-btn-primary-focus",overCls:"bmc-btn-primary-over",pressedCls:"bmc-btn-primary-pressed",disabled:!isBRCreatable,text:_CiRelValues.New,listeners:{mouseover:function(){this.setIconCls("bmcNewOn")},mouseout:function(){this.setIconCls("bmcNew")},disable:function(){this.setIconCls("bmcNewDisable")},enable:function(){this.setIconCls("bmcNew")},afterrender:function(){if(!isBRCreatable){this.setIconCls("bmcNewDisable")}}},handler:newRelationship},{xtype:"tbspacer",width:5},{scale:"medium",tooltipType:"title",tooltip:_CiRelValues.Edit,id:"editInstanceBtn",baseCls:"bmc-btn-small",disabledCls:"bmc-btn-disabled",focusCls:"bmc-btn-focus",overCls:"bmc-btn-over",pressedCls:"bmc-btn-pressed",disabled:true,text:_CiRelValues.Edit,listeners:{mouseover:function(){this.setIconCls("bmcEditRelationshipOn")},mouseout:function(){this.setIconCls("bmcEditRelationship")},disable:function(){this.setIconCls("bmcEditRelationshipDisable")},enable:function(){this.setIconCls("bmcEditRelationship")},afterrender:function(){this.disable()}},handler:editAction},{xtype:"tbspacer",width:5},{scale:"medium",tooltipType:"title",tooltip:_CiRelValues.Delete,id:"deleteInstanceBtn",disabled:true,baseCls:"bmc-btn-small",disabledCls:"bmc-btn-disabled",focusCls:"bmc-btn-focus",overCls:"bmc-btn-over",pressedCls:"bmc-btn-pressed",text:_CiRelValues.Delete,listeners:{mouseover:function(){this.setIconCls("bmcDeleteOn")},mouseout:function(){this.setIconCls("bmcDelete")},disable:function(){this.setIconCls("bmcDeleteDisable")},enable:function(){this.setIconCls("bmcDelete")},afterrender:function(){this.disable()}},handler:deleteAction},{xtype:"tbspacer",width:5},"-",{xtype:"tbspacer",width:5},{xtype:"checkbox",id:"MarkasDeleted",baseCls:"bmc-menu-item",overCls:"bmc-menu-item-over",text:MarkAsDeletedLabel,boxLabel:MarkAsDeletedLabel,boxLabelAlign:"after",checked:MarkasDeleted,autoWidth:true,handler:MarkAsDeletedClicked},"->"];if(userlocale=="iw"){b.reverse()}var a=new Ext.Toolbar({id:"relationshipToolBarId",border:false,autoWidth:true,height:44,items:b});return a}String.prototype.htmlEscape=function(){return this.replace(/&/g,"&amp;").replace(/>/g,"&gt;").replace(/</g,"&lt;").replace(/\\/g,"\\\\").replace(/"/g,"&quot;").replace(/'/g,"\\'")};function columnList(){columns=[];for(var a in colGridforBR){var c=colGridforBR[a].objectName;var b=colGridforBR[a].dataIndex;if(c!=undefined&&c!=null){if(c==objNames.BMC_BaseElements__c){b=b+skywalkerConstant+"BaseElement"}else{b=b+skywalkerConstant+"BaseRelationship"}if(b=="Name__cфBaseElement"){columns[a]={header:Ext.util.Format.htmlEncode(colGridforBR[a].header),width:colGridforBR[a].width,dataIndex:b,sortable:colGridforBR[a].sortable,menuDisabled:true,locked:true,lockable:true,hidden:colGridforBR[a].hidden,renderer:function(f,e,d){return'<a href="#" onclick="openCI(\''+d.data.Class__cфBaseElement.htmlEscape()+"','"+d.data.InstanceID__cфBaseElement.htmlEscape()+"','"+d.data.Name__cфBaseElement.htmlEscape()+"','"+d.data.IdфBaseElement.htmlEscape()+"')\">"+f+"</a>"}}}else{if(b=="Name__cфBaseRelationship"){columns[a]={header:Ext.util.Format.htmlEncode(colGridforBR[a].header),width:colGridforBR[a].width,dataIndex:b,sortable:colGridforBR[a].sortable,menuDisabled:true,locked:true,lockable:true,hidden:colGridforBR[a].hidden,renderer:function(g,f,d){var e="/apex/CMDBEditRelationship?RelationshipInstanceID="+d.data.InstanceID__cфBaseRelationship+"&contextCiInstId="+_CiRelValues.InstanceID+"&tabName="+tabName+"&instanceType="+instanceType+"&classNameTitle="+urlencode(classNameTitle);return'<a href="#" onclick="openEditor(\''+e+"','"+RelationshipEditor+": "+d.data.Name__cфBaseRelationship.htmlEscape()+"','"+d.data.InstanceID__cфBaseRelationship+"');return false;\">"+g+"</a>"}}}else{columns[a]={header:Ext.util.Format.htmlEncode(colGridforBR[a].header),width:colGridforBR[a].width,dataIndex:b,lockable:true,sortable:colGridforBR[a].sortable,menuDisabled:true,hidden:colGridforBR[a].hidden,}}}}}if(userlocale=="iw"){columns=columns.reverse()}return columns}function renderGrid(){loadColumns(InstanceID)}function loadgrid(){var b=Ext.getBody().getViewSize().height-35;if(screen.availHeight){dialogTop=(screen.availHeight-420)/2;dialogTop=dialogTop>0?dialogTop:100}pagingBar=getPagingToolbar();Ext.QuickTips.init();var a=new Ext.grid.GridPanel({id:"relationship",renderTo:"ciRelationsGrid",tbar:getRelGridToolBar(),store:getRelationListStore(),dockedItems:[pagingBar],columns:columnList(),enableLocking:true,enableColumnHide:false,enableColumnMove:false,forceFit:false,normalGridConfig:{emptyText:_ServerLabels.NoRecordFoundMsg,},viewConfig:{forceFit:false,scrollOffset:50,stripeRows:false,},onNormalViewScroll:function(){var e=this,c=e.normalGrid.getView(),g=c.el.dom,d=e.lockedGrid.getView(),f=d.el.dom;f.scrollTop=g.scrollTop;delete d.scrolledByNormal},onLockedViewScroll:function(){var d=this,c=d.lockedGrid.getView();if(!c.scrolledByNormal){c.scrolledByNormal=true;return false}},border:false,selModel:Ext.create("Ext.selection.CheckboxModel",{checkOnly:true,headerChkBoxEnabled:true}),height:b,listeners:{reconfigure:function(e,c,d){autoFitLastColumn(e,"relationship");enableDisableButton()},sortchange:function(d,e,f,c){sort=e.dataIndex;dir=f},afterrender:function(c){changeRelGridDirectionForRTL()}}});a.child("[dock=bottom]").add(["->",{text:_ServerLabels.RecordsPerPage,xtype:"label"},Ext.create("Ext.form.ComboBox",{store:Ext.create("Ext.data.Store",{fields:["value","label"],data:[{value:10,label:"10"},{value:25,label:"25"},{value:50,label:"50"},{value:100,label:"100"},{value:200,label:"200"}]}),queryMode:"local",displayField:"label",valueField:"value",margin:"4 15 4 8",editable:false,forceSelection:true,typeAhead:true,width:60,listeners:{click:{element:"el",fn:function(d){var c=Ext.getCmp(this.id).getPicker();c.alignTo(this,"t",[-40,-108])}},afterrender:function(){var e=Ext.util.Cookies.get("RelationshipPageListPageSize");if(e){this.setValue(parseInt(e))}else{var c=new Date();var d=new Date(c.getTime()+10*365*24*60*60*1000);document.cookie="RelationshipPageListPageSize="+Paging_PageSize+";path=/;SameSite=None;Secure;expires="+d.toUTCString();this.setValue(Paging_PageSize)}},change:function(h,g,d,f){if(typeof(d)!="undefined"&&d!=null){var c=new Date();var e=new Date(c.getTime()+365*24*60*60*1000);document.cookie="RelationshipPageListPageSize="+g+";path=/;SameSite=None;Secure;expires="+e.toUTCString();Paging_PageSize=g;Paging_PageNumber=1;showWaitMsgBar();getRelationListStore()}}}})]);a.getSelectionModel().on("selectionchange",function(c,f,d){isCISelected=true;enableDisableButton()});a.on("itemdblclick",function(c,g,f,d){c.getSelectionModel().deselectAll();c.getSelectionModel().select(d);editAction()});InRGrid=a;return a}function enableDisableButton(){var a=InRGrid.getSelectionModel().getSelection();var d=Ext.getCmp("newRelInstanceBtn");var c=Ext.getCmp("editInstanceBtn");var b=Ext.getCmp("deleteInstanceBtn");var e=window.parent;if(e&&(e.isCMDBClassPermissionsEnable||(typeof(e.fallBackToFresh)!="undefined"&&e.fallBackToFresh))){if(isBRCreatable){d.setDisabled(false)}else{d.setDisabled(true)}if(isBREditable&&a.length==1){c.setDisabled(false)}else{c.setDisabled(true)}if(isBRDeletable&&a.length>0){b.setDisabled(false)}else{b.setDisabled(true)}return}if(flattenedCMDB){if(isBRCreatable){if(isAssetManagementEnabled&&isCIManagementEnabled){if(instanceType.toLowerCase()=="ci"){if(updateCI){d.setDisabled(false)}else{d.setDisabled(true)}}else{if(instanceType.toLowerCase()=="asset"){if(updateAsset){d.setDisabled(false)}else{d.setDisabled(true)}}else{if(tabName.toLowerCase()=="ci"){if(updateCI){d.setDisabled(false)}else{d.setDisabled(true)}}else{if(tabName.toLowerCase()=="asset"){if(updateAsset){d.setDisabled(false)}else{d.setDisabled(true)}}else{if(updateCI&&updateAsset){d.setDisabled(false)}else{d.setDisabled(true)}}}}}}else{if(!isAssetManagementEnabled&&isCIManagementEnabled){if(updateCI){d.setDisabled(false)}else{d.setDisabled(true)}}else{if(isAssetManagementEnabled&&!isCIManagementEnabled){if(updateAsset){d.setDisabled(false)}else{d.setDisabled(true)}}}}}else{d.setDisabled(true)}}if(a.length>0){if(flattenedCMDB){if(isBRDeletable){if(isAssetManagementEnabled&&isCIManagementEnabled){if(instanceType.toLowerCase()=="ci"){if(deleteCI){b.setDisabled(false)}else{b.setDisabled(true)}}else{if(instanceType.toLowerCase()=="asset"){if(deleteAsset){b.setDisabled(false)}else{b.setDisabled(true)}}else{if(tabName.toLowerCase()=="ci"){if(deleteCI){b.setDisabled(false)}else{b.setDisabled(true)}}else{if(tabName.toLowerCase()=="asset"){if(deleteAsset){b.setDisabled(false)}else{b.setDisabled(true)}}else{if(deleteCI&&deleteAsset){b.setDisabled(false)}else{b.setDisabled(true)}}}}}}else{if(!isAssetManagementEnabled&&isCIManagementEnabled){if(deleteCI){b.setDisabled(false)}else{b.setDisabled(true)}}else{if(isAssetManagementEnabled&&!isCIManagementEnabled){if(deleteAsset){b.setDisabled(false)}else{b.setDisabled(true)}}}}}else{b.setDisabled(true)}}else{d.setDisabled(!isBRCreatable);b.setDisabled(!isBRDeletable)}if(isBREditable&&a.length==1){c.setDisabled(false)}else{c.setDisabled(true)}}else{c.setDisabled(true);b.setDisabled(true)}}function DeleteDone(){if(success_message=="success"){getRelationListStore();window.parent.clearLocation()}else{GetMessageBox("bmc-message").show({title:error,msg:success_message,icon:Ext.MessageBox.ERROR,buttons:Ext.MessageBox.OK}).setPosition(undefined,dialogTop)}}function GetMessageBox(a){if(WinMsg==null){WinMsg=Ext.create("Ext.window.MessageBox")}WinMsg.baseCls=a;return WinMsg}function changeRelGridDirectionForRTL(){var a=document.getElementById("relationship-body");if(userlocale=="iw"&&a!=null&&a!=undefined){a.dir="ltr"}else{return}}Ext.onReady(renderGrid);function setSizeOnWindowResize(){try{var a=Ext.getBody().getViewSize().height-35;var c=Ext.getCmp("relationship");if(c){c.setHeight(a)}}catch(b){console.log(b)}}Ext.EventManager.onWindowResize(function(){setSizeOnWindowResize()});