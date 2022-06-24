var windowTitle,
	layout,
    idArray,
    doRefresh = false,
 	child1,child3,child5,child7,child8,
    groupID,
	impactData,
	urgencyData,
	categoryData,
	jsonValue = '',
    btn1 ='',
	mod,
	qvTabId='',   
    index=0,
    selectedNode='',
    selectedNodeRef='',
    jasonData,
    isQVNodeSelected,
    addedFolderId,
    folderNameVal,
    queryIdforCopy,
    sysQueryId,
    idForQuery,
    nameOfQuery,
    oewnerOfQuery,
    ownerOfPasteQuery,
	isQueryCut=false,
	isQueryCopy=false,
    selecteQueryText,
    newQueryTab=true,
    editQueryTab=true,
    linkArray = [],
    indexArray = [],
    errorMessge,
	userProfile,
    flagToDesableButton,
    QVQueryId,
    tabsList = [],
    functionsList = [],
    folderName,
    listViewTarget,
    isQueryNode=false,
    isFolderNode=false,
    nameOfFolderNode,
    QVWidgetViews = [],
	sep="___",
	selectedQueryNode,
	catLogTBar,
	incidentTabID,
    nodePageReferences = [],
	qvNameInvalid = false;
function arrowClick(){
	var autoSave = null;
	e = Ext.get('helpLinkButton');	
	var eXY = e.getXY();
	eXY[0] = eXY[0] - 170;
	eXY[1] = eXY[1] + 18;  
	helpMenu.showAt(eXY);
	if(autoSave == null){
		autoSave = new Ext.util.DelayedTask(function(){
			helpMenu.hide();
		});
	}
	autoSave.delay(3500);	
}	
function OpenBMCCommunityPage(){
	 var windowFeatures="resizable=1,scrollbars=1,fullscreen=1,toolbar=1,menubar=1,status=1,location=1";
	 window.open('http://communities.bmc.com/communities/docs/DOC-11298','mywindow',windowFeatures)
	
}
function getSDActiveTabId(){
	return Ext.getCmp('tabs').getActiveTab().getId();
}
function getDoRefresh(){
	return doRefresh;
}
function setDoRefresh(refreshPage){
	doRefresh = refreshPage;
}
function setIdArray(val){
	idArray = val;
}
function getIdArray(){
	return idArray ;
}
var myArray = [];

function refreshProblemOnIncident(parentId,moduleName,prbID,prbName){
	var prbFrame1 =document.getElementById('skyiframe'+moduleName).contentWindow;
	if(typeof(prbFrame1.frames['naviframe'+parentId]) != 'undefined'){
	var prbFrame2= prbFrame1.frames['naviframe'+parentId];
	if(typeof(prbFrame2.renderPrbId) =='function'){ 
			prbFrame2.renderPrbId(prbID,prbName);
	if(Ext.getCmp('navview').findById('tabs').findById(incidentTabID)!=null){
		Ext.getCmp('navview').findById('tabs').findById(incidentTabID).show();
				prbFrame1.highlightWindow(parentId);
	}
		} else return true;
		return false;	
	}else{
		return true;
	}
	
}
function refreshSupportingInformation(parentId,moduleName,childModuleName){ 
		moduleName = decodeURI(moduleName);                                  
        var frame1= window.frames['skyiframe'+moduleName]; // nav
        var frame2= frame1.frames['naviframe'+parentId];
		var activeTabTitle = Ext.getCmp('tabs').getActiveTab().title;
		var tabName = activeTabTitle.replace(/&nbsp;/g,'').trim();
		if(frame2 != null && frame2 != undefined){
			if(typeof(frame2.refreshDocs) =='function' && tabName == moduleName){
				frame2.refreshDocs();
			}else{
				myArray[moduleName] = frame2;
			}
		}
}      
function getParentSIIds(parentId,moduleName){
		var frame1= window.frames['skyiframe'+moduleName]; // nav
        var frame2= frame1.frames['naviframe'+parentId];
        if(typeof(frame2.SIIdsArray) =='function'){
			var tempArray = new Array(frame2.SIIdsArray());
			return tempArray.reverse();
		}
}
function refreshPortletBar(){
	var MyComp =Ext.getCmp('navview');
	MyComp.findById('portalContent').removeAll();
	MyComp.doLayout();                
	resetJsonString();
	closePopup();
}
function PortletBtnComplete(){
	var MyComp =Ext.getCmp('navview');
	MyComp.findById('portalContent').removeAll();
	MyComp.doLayout();
	addPortletComponent();            
} 
function setTabFunctionList(tab, fun) {
	tabsList.push(tab);
	functionsList.push(fun);
}
function getTabsList() {
	return tabsList;
}
function getFunctionsList() {
	return functionsList;
}
function setpageTarget(target) {
	listViewTarget = target;
}
function getPageTarget() {
	return listViewTarget;
}
function refreshPortlet(wid,page){
	var win = Ext.getCmp(wid);
	if(win != null){
		Ext.get(win.body.id).update('<iframe name = "skyiframe'+wid+'" src =\"\/apex\/'+ page  +'\" style=\"width:100%;height:100%;border:none\"/>');
	}
}
function refreshPortletByTitle(wid){
	if(document.getElementById(wid+'iFrame') != null && typeof(document.getElementById(wid+'iFrame')) != 'undefined'){
		document.getElementById(wid+'iFrame').src = document.getElementById(wid+'iFrame').src;
	}
	if(wid != null && typeof(wid) == 'undefined' && wid == 'WorldTime'){
		closePopup();
	}
}
function refreshDashBoard(){
	if(document.getElementById('dashboardIFrame') != null && typeof(document.getElementById('dashboardIFrame')) != 'undefined'){
		document.getElementById('dashboardIFrame').src = document.getElementById('dashboardIFrame').src;
	}
	if(document.getElementById('defaultDashboardIFrame') != null && typeof(document.getElementById('defaultDashboardIFrame')) != 'undefined'){
		document.getElementById('defaultDashboardIFrame').src = document.getElementById('defaultDashboardIFrame').src;
	}
}
function setQVWidgetViews(queryId, view) {
	QVWidgetViews[queryId] = view;
}
function getQVWidgetViews(queryId) {
	return QVWidgetViews[queryId];
}
function replaceAll(value,stringToFind,stringToReplace){
	var temp = value;
	var index = temp.indexOf(stringToFind);
	while(index != -1){
		temp = temp.replace(stringToFind,stringToReplace);
		index = temp.indexOf(stringToFind);
	}
	return temp;
}
function escapeHtmlCodes(headerVal){
	headerVal=replaceAll(headerVal,'%25','%');
	headerVal=replaceAll(headerVal,'%23','#');
	headerVal=replaceAll(headerVal,'%26','&');
	headerVal=replaceAll(headerVal,'%22','"');
	headerVal = replaceAll(headerVal,'%2B','+');
	return headerVal; 
}
function addGroupFeedTab(idVal, titleVal, grpId){
	groupID = grpId;
	if(Ext.getCmp('navview').findById('tabs').findById(grpId)!=null)
	{
		var sHtml = '<div class=\"iframe-enclave\"><iframe frameborder="0" id="dashboardIFrame" src ="'+pageGroupFeedPage+'?groupID=' + grpId + '" class=\"tab-iframe\"\/><\/div>';
		var win = Ext.getCmp(grpId);
		Ext.get(win.body.id).update(sHtml);
		Ext.getCmp('navview').findById('tabs').findById(grpId).show();
		return;
	}
	Ext.getCmp('navview').findById('tabs').add({
		title: '&nbsp;&nbsp;&nbsp;&nbsp;'+titleVal+'&nbsp;',
		width:'auto',
		id: grpId,
		domId:'GroupFeed',
		html: '<div class=\"iframe-enclave\"><iframe frameborder="0" id="dashboardIFrame" src ="'+pageGroupFeedPage+'?groupID=' + grpId + '" class=\"tab-iframe\"\/><\/div>',
		closable : true,
		listeners : {
			close : function() {
				   linkArray[indexArray[this.id]] =null;
				   removeTabFunction(this.id);
				   qvTabId='';
			}
		}
	}).show();
}
function addChatterFeedTab(){
	var isChatterEnabled = newsFeedVal;
	if(isChatterEnabled){
		if(Ext.getCmp('navview').findById('tabs').findById('chatterfeed')!=null){
			Ext.getCmp('navview').findById('tabs').findById('chatterfeed').show();
			return;
		}
		var chatterTabCmpt = {id:'chatterfeed', domId:'chatterfeed',title:'&nbsp;&nbsp;&nbsp;'+chatterFeedLabel, closable:true, html:'<div class=\"iframe-enclave1\" id=\"child5\"><\/div><div class=\"iframe-enclave\"><iframe frameborder="0" id="dashboardIFrame" src =\"\/apex\/NewsFeedPage\" class=\"tab-iframe chatterTabHeightCls\"\/><\/div>'};
		Ext.getCmp('tabs').add(chatterTabCmpt);
		Ext.getCmp('navview').findById('tabs').findById('chatterfeed').show();
		document.getElementById('child5').style.visibility='hidden';
	}
	else
		alert('Chatter settings are not enabled....');
}

function getFormAssignment(pageRef)
{
	var arrFormAssignment = formAssignment.split(';');
	var pattern;
	for (var i=1; i<arrFormAssignment.length; i++)
	{
		if (arrFormAssignment[i] == '') continue;
		pattern = new RegExp(arrFormAssignment[i], 'ig');
		if (pageRef.match(pattern))
		{
			pageRef = pageRef.replace(pattern, arrFormAssignment[i] + 'custom');
			break;
		}
		
	}
	return(pageRef)
}

function addNewTab(idVal, titleVal, pageRef, isFromWidget){
	mod = titleVal;	
	pageRef = getFormAssignment(pageRef);
	pageRef = pageRef.substring(0,pageRef.indexOf('?')+1)+'tabName='+titleVal+spChar+idVal+'&'+pageRef.substring(pageRef.indexOf('?')+1);
	var decodedpageref = decodeURI(pageRef);
	var pageRefParams = decodedpageref.substring(decodedpageref.indexOf('?')+1);
	var pageRefParamsList = pageRefParams.split('&');
	var i=0;
	var foundTab=0;
		
	if(windowTitle == titleVal){
		foundTab = 1;
	}
	while(tabsList.length>i) {
		var tabRecord = tabsList[i];
		tabRecord = tabRecord.split(spChar);
		var tab = tabRecord[0];
		var tabId = tabRecord[1];
			
		var function1 = functionsList[i];
		if(tab == titleVal) {
				
			var j=0;
			var pageTarget;
			var title;
			var tabTitle='';
			while(pageRefParamsList.length>j) {
				if(pageRefParamsList[j].match('=')!=-1) {
				var key = pageRefParamsList[j].substring(0,pageRefParamsList[j].indexOf('='));
				if(key=='tabTitle'){
					tabTitle=pageRefParamsList[j].substring(pageRefParamsList[j].indexOf('=')+1);
					j++;
					continue;
				}
				if(key=='title'){
					title=pageRefParamsList[j].substring(pageRefParamsList[j].indexOf('=')+1);
					j++;
					continue;
				}
				if(key=='target' || key=='amp;target'){
					pageTarget=pageRefParamsList[j].substring(pageRefParamsList[j].indexOf('=')+1);
					j++;
					continue;
				}
				j++;
				}
			}
			
			Ext.getCmp('navview').findById('tabs').findById(tabId).show();
			if(tabTitle!='') {
				function1(pageTarget,tabTitle,title);
			}else {
				function1(pageTarget,title,title);
			}
			
			foundTab = 1;
			break;
		}
		i++;
	}
	
	if(foundTab == 0) {
	   
		var initialPageRef = nodePageReferences[titleVal];
		if(initialPageRef != null) {
		   var pageRefParams = initialPageRef.substring(initialPageRef.indexOf('?')+1);
		   
		   var pageRefParamsList = pageRefParams.split('&');
		   
		   var j=0;
		   var pageTarget;
		   var title;
		   while(pageRefParamsList.length>j) {
			   if(pageRefParamsList[j].match('=')!=-1) {
					
				   var key = pageRefParamsList[j].substring(0,pageRefParamsList[j].indexOf('='));
				   if(key=='target') {
					   pageTarget=pageRefParamsList[j].substring(pageRefParamsList[j].indexOf('=')+1);
					   j++;
					   continue;
				   }
				   if(key=='title') {
					   title=pageRefParamsList[j].substring(pageRefParamsList[j].indexOf('=')+1);
					   j++;
					   continue;
				   }
				   j++;
			   }
		   }
		   
		   setpageTarget(pageTarget+spChar+title);   
		   if(typeof(isFromWidget)=='undefined' || isFromWidget == null || isFromWidget == '' )              
		   pageRef = pageRef.substring(0,pageRef.indexOf('?')+1)+'useListViewTarget=true&'+pageRef.substring(pageRef.indexOf('?')+1);
		   
		   if(pageTarget == "KnowledgeSearch"){
				pageRef = pageRef.substring(0,pageRef.indexOf('?')+1)+'useListViewTarget=false&'+pageRef.substring(pageRef.indexOf('?')+1);					
		   }
	   }
	   
	   //if faqnewsfeedpage, incidentnewsfeedpage etc is already open, open the subsequest respective news feed on the same tab
	   if (idVal.match("NewsFeedPage") != -1 && idVal.match("NewsFeedPage") != null && typeof(Ext.getCmp(idVal)) != 'undefined' && Ext.getCmp(idVal) != null)
	   {
			var cmp = Ext.getCmp(idVal);
			pageRef = '\/apex\/' + pageRef;
			if (typeof(document.getElementById(idVal+'iframe')) != 'undefined' && document.getElementById(idVal+'iframe') != null)
			{
				document.getElementById(idVal+'iframe').src = pageRef;
				cmp.show();			
			}
	   }
	   else if((linkArray[pageRef]) == null){
		   
			if(qvTabId=='') qvTabId=idVal;
			var preSrc  = '';
			if(!pageRef.match(/\isCustomActionLink/)){
				preSrc = '\/apex\/';
			}
			
			var domId='';
			var targetPage ='';
			var targetObject = '';
			if(titleVal == labelQuickViewEditor){
			  domId='QVEditor';
			}else if(pageTarget !=null && pageTarget!='') {
				domId=pageTarget.substring(pageTarget.indexOf('=')+1,pageTarget.indexOf('%'));
				//targetPage = pageTarget.substring(0,pageTarget.indexOf('?'));
				//targetObject = pageTarget.substring(pageTarget.indexOf('popupId=')+8,pageTarget.indexOf('%'));
			}
			
			// Changes for std Layout ----		
			
			var targetPage = pageRef.substring(pageRef.indexOf('&target=')+8,pageRef.indexOf('?popupId'));
			var ObjectTitle = pageRef.substring(pageRef.indexOf('&title=')+7,pageRef.indexOf('&target='));
			//alert('pageRef -- '+pageRef);
			//alert('ObjectTitle -- '+ObjectTitle);
			/*if(targetPage == 'SearchPage'){
				getObjectPrefixForListView(targetObject);
				////recordIdPrefix = getPrefix();
				//alert('recordIdPrefix -- '+recordIdPrefix);
				//window.open('/'+recordIdPrefix);
			}*/
			// Quick view Editor -- New Query / Edit Query 
			if(titleVal == labelQuickViewEditor ){
				Ext.getCmp('navview').findById('tabs').add({
					title: ' &nbsp;&nbsp; '+titleVal,
					width:'auto',
					id: idVal,
					domId:domId,
					html: '<div class=\"iframe-enclave1\" id=\"divId'+idVal+'\"><\/div><div class=\"sky-iframe\"><iframe name = "skyiframe'+mod+'" id = \"'+ idVal +'iframe\" src =\"'+preSrc + pageRef+'\" class=\"tab-iframe\" style=\"width:100%;height:100%;border:none;background:white\"/></div>',
					closable : true,
					listeners : {
					    close : function() {
							linkArray[indexArray[this.id]] =null;
							removeTabFunction(this.id);
							qvTabId='';
					    }
					}
				}).show();
				linkArray[pageRef] = idVal;
			    indexArray[linkArray[pageRef]] = pageRef;
			    document.getElementById('divId'+idVal).style.visibility='hidden';
		    }
			// Search portlet
			else if(titleVal == labelGlobalSearch ){
				var searchIndex = pageRef.indexOf('?str=');
				if(searchIndex == -1){
					var searchIndex = pageRef.indexOf('&str=');
				}
				if(searchIndex != -1){
					var searchString = pageRef.substring(searchIndex+5);
					if((searchString != null) ||(searchString != '')){  
						window.open('/apex/KnowledgeSearch?calledFromForm=true&standardLayout=true&search='+searchString,null,"height=400,width=671");
					}
				}				
			}
			// Quick view Navigation
			else{				
				var foundIndex = pageRef.indexOf('&id=');
				if(foundIndex == -1){
					var foundIndex = pageRef.indexOf('?id=');
				}
				var copyId = pageRef.indexOf('?copyId=');
				var popupId = pageRef.indexOf('?popupId=');
				var portletTemplateId = pageRef.indexOf('?portletTemplateId=');
				
				// when click on link to open any Record - Standard Detail page
				if(foundIndex != -1){
					var recordId = pageRef.substring(foundIndex+4,foundIndex+22);
					window.open('/'+recordId);
				}
				//when click on Copy button - Standard Clone
				else if(copyId != -1){
					var recordId = pageRef.substring(copyId+8,copyId+26);
					window.open('/'+recordId+'/e?clone=1');
				}
				// New Record - Standard New Page
				else if((popupId == -1) && (portletTemplateId == -1)){
					var titleIndex = pageRef.indexOf('&ObjectAPIName=');
					var endIndex = pageRef.lastIndexOf('__c&');					
					var objectTitle = pageRef.substring(titleIndex+15,endIndex+3);
					//alert(objectTitle);
					getObjectPrefixJS(objectTitle);
				}else if(targetPage == 'SearchPage'){	
					if(ObjectTitle.indexOf(labelIncident) != -1){
						getObjectPrefixForListView('incident__c');
					}else if(ObjectTitle.indexOf(labelTask) != -1 ){
						getObjectPrefixForListView('task__c');
					}else if(ObjectTitle.indexOf(labelBroadcast) != -1 ){
						getObjectPrefixForListView('broadcasts__c');
					}else if(ObjectTitle.indexOf(labelChangeRequests) != -1){
						getObjectPrefixForListView('Change_Request__c');
					}else if(ObjectTitle.indexOf(labelProblem) != -1){
						getObjectPrefixForListView('problem__c');
					}
				}
			}
			// end ------ 
		}else{
			 var cmp = Ext.getCmp(linkArray[pageRef]+'');
			 if(cmp) cmp.show();
		}
	}
}
function setQVTabId(){
	linkArray[indexArray[qvTabId]] =null;
	removeTabFunction(qvTabId);
	Ext.getCmp('navview').findById('tabs').remove(qvTabId);
	Ext.getCmp('navview').findById('tabs').findById('mydashboard').show();
	qvTabId='';
}
Ext.ux.TabScrollerMenu =  Ext.extend(Object, {
    pageSize       : 10,
    maxText        : 15,
    menuPrefixText : 'Items',
    constructor    : function(config) {
        config = config || {};
        Ext.apply(this, config);
    },
    init : function(tabPanel) {
        Ext.apply(tabPanel, this.tabPanelMethods);
		tabPanel.tabScrollerMenu = this;
        var thisRef = this;
        tabPanel.on({
            render : {
                scope  : tabPanel,
                single : true,
                fn     : function() {
                    var newFn = tabPanel.createScrollers.createSequence(thisRef.createPanelsMenu, this);
                    tabPanel.createScrollers = newFn;
                }
            }
        });
    },
    createPanelsMenu : function() {
        var h = this.stripWrap.dom.offsetHeight;
        var rtScrBtn = this.header.dom.firstChild;
        Ext.fly(rtScrBtn).applyStyles({
            right : '18px'
        });

        var stripWrap = Ext.get(this.strip.dom.parentNode);
        stripWrap.applyStyles({
             'margin-right' : '36px'
        });

        // Add the new righthand menu
        var scrollMenu = this.header.insertFirst({
            cls:'x-tab-tabmenu-right'
        });
        scrollMenu.setHeight(h);
        scrollMenu.addClassOnOver('x-tab-tabmenu-over');
        scrollMenu.on('click', this.showTabsMenu, this);
		this.scrollLeft.dom.qtip = labelTabScrollerLeft;
		this.scrollRight.dom.qtip = labelTabScrollerRight;
        this.scrollLeft.show = this.scrollLeft.show.createSequence(function() {
            scrollMenu.show();
        });

        this.scrollLeft.hide = this.scrollLeft.hide.createSequence(function() {
            scrollMenu.hide();
        });

    },
    // public
    getPageSize : function() {
        return this.pageSize;
    },
    // public
    setPageSize : function(pageSize) {
        this.pageSize = pageSize;
    },
    // public
    getMaxText : function() {
        return this.maxText;
    },
    // public
    setMaxText : function(t) {
        this.maxText = t;
    },
    getMenuPrefixText : function() {
        return this.menuPrefixText;
    },
    setMenuPrefixText : function(t) {
        this.menuPrefixText = t;
    },
    // private && applied to the tab panel itself.
    tabPanelMethods : {
        // all execute within the scope of the tab panel
        // private
        showTabsMenu : function(e) {
            if (! this.tabsMenu) {
                this.tabsMenu =  new Ext.menu.Menu();
                this.on('beforedestroy', this.tabsMenu.destroy, this.tabsMenu);
            }

            this.tabsMenu.removeAll();

            this.generateTabMenuItems();

            var target = Ext.get(e.getTarget());
            var xy     = target.getXY();

            //Y param + 24 pixels
            xy[1] += 24;

            this.tabsMenu.showAt(xy);
        },
        // private
        generateTabMenuItems : function() {
            var curActive  = this.getActiveTab();
            var totalItems = this.items.getCount();
            var pageSize   = this.tabScrollerMenu.getPageSize();
            var i=0;
            while(totalItems>i){
                var item = this.items.get(i);
                this.tabsMenu.add(this.autoGenMenuItem(item));
                i++;
            }

        },
        // private
        autoGenMenuItem : function(item) {
            var maxText = this.tabScrollerMenu.getMaxText();
			var tabTitle=item.title.substring(13,item.title.length);
            var text    = Ext.util.Format.ellipsis(tabTitle, maxText);

            return {
                text      : text,
                handler   : this.showTabFromMenu,
                scope     : this,
                disabled  : item.disabled,
                tabToShow : item,
                iconCls   : item.iconCls
            }

        },
        // private
        showTabFromMenu : function(menuItem) {
            this.setActiveTab(menuItem.tabToShow);
        }
    }
});
initFunction = function(p) {
	if (p.collapsible) {
		var r = p.region;
		var textClass = 'x-collapsed-header-text';
	 if ((r == 'east') || (r == 'west')) textClass += '-rotated';
		p.on('render', function() {
			var ct = p.ownerCt;
		   ct.on('afterlayout', function() {
			   p.collapsedTitleEl = ct.layout[r].getCollapsedEl().createChild({
					tag: 'div',
					cls: textClass,
					html: '<img src='+resSDEFStylesPath+'"/SDEFicons/icon_workspaces_bar_closed.gif" style="padding-left:8px;height:25px;width:25px;"/><div class="sky-title" style="color:white">'+p.title+'</div>'
				});
				p.setTitle = Ext.Panel.prototype.setTitle.createSequence(function(t) {
					p.collapsedTitleEl.dom.appendChild((document.createTextNode(t));
				});
			}, false, {single:true});
		});
	}
};
clickFunction = function(n) {
   if(n.leaf){
		if(n.text== chatterFeedLabel)
		{
			addChatterFeedTab();
			return;
		}
		windowTitle =  n.text; 
		mod = n.text; 
		pageRef=n.attributes.pageRef;
		if(n.text == incidentLabel){
			incidentTabID=n.id;
		}
		
		if(windowTitle.indexOf(AlignabilityProcessModel) != -1)
		{
			windowTitle = AlignabilityProcessModel;
			n.text = windowTitle;
		}
		pageRef = pageRef.substring(0,pageRef.indexOf('?')+1)+'tabName='+n.text+spChar+n.id+'&'+pageRef.substring(pageRef.indexOf('?')+1);
		
		var pageRefParams = pageRef.substring(pageRef.indexOf('?')+1);
		
		var pageRefParamsList = pageRefParams.split('&');
		
		var i=0;
		var foundTab=0;
		while(tabsList.length>i) {
			var tabRecord = tabsList[i];
			tabRecord = tabRecord.split(spChar);
			var tab = tabRecord[0];
			var tabId = tabRecord[1];
			
			var function1 = functionsList[i];
			if(tab == n.text) {
				var j=0;
				var pageTarget;
				var title;
				while(pageRefParamsList.length>j) {
					if(pageRefParamsList[j].match('=')!=-1) {
					var key = pageRefParamsList[j].substring(0,pageRefParamsList[j].indexOf('='));
					
					if(key=='title') {
						title=pageRefParamsList[j].substring(pageRefParamsList[j].indexOf('=')+1);
						j++;
						continue;
					}
					if(key=='target') {
						pageTarget=pageRefParamsList[j].substring(pageRefParamsList[j].indexOf('=')+1);
						j++;
						continue;
					}
					j++;
					}
				}
				
				function1(pageTarget,title,title);
				Ext.getCmp('navview').findById('tabs').findById(tabId).show();
				foundTab = 1;
				break;
			}
			i++;
		}
	 
		if(foundTab==0) {
		 if((linkArray[n.attributes.pageRef]) == null ){
			 Ext.getCmp('navview').findById('tabs').add({
			 title: ' &nbsp;&nbsp; '+n.text,
			   id: n.id,
			   domId:n.attributes.domId,
				iframeName: 'skyiframe'+mod,
				html: '<div class=\"iframe-enclave1\" id=\"divId'+n.id+'\"><\/div><div class=\"iframe-enclave\"><iframe id="skyiframe'+mod+'" name="skyiframe'+mod+'" src =\"\/apex\/'+pageRef+'\" class=\"tab-iframe\"/></div>',
				closable : true,
				listeners : {
					beforeclose: beforeCloseTabEvent,
					close : function() {
					   linkArray[indexArray[this.id]] =null;
					   removeTabFunction(this.id);
					 }
				}
			}).show();
			linkArray[n.attributes.pageRef] = n.id;
			indexArray[n.id]=n.attributes.pageRef;
			document.getElementById('divId'+n.id).style.visibility='hidden';
		}else{
			 var cmp = Ext.getCmp(linkArray[n.attributes.pageRef]+'');
			 if(cmp) cmp.show();
		}
	   }
	}else{
		if(n.expanded){
			n.collapse();
		}else{
			n.expand();
		}
	}
};
function beforeCloseTabEvent (tab){
	var formUnsaved = false;
	if (typeof(window.frames[this.iframeName]) == "undefined") return;
	var changeArray;
	if (typeof(window.frames[this.iframeName].changeArray) != "undefined") 
		changeArray = window.frames[this.iframeName].changeArray;
	else if (typeof(document.getElementById(this.iframeName).contentWindow) != "undefined")
		changeArray = document.getElementById(this.iframeName).contentWindow.changeArray;
	else
		return false;
	if (changeArray.length > 0)
	{
		for (var i=0; i<changeArray.length; i++)
		{
			if (changeArray[i] == 1)
			{
				formUnsaved = true;
				break;
			}
		}
	}
	
	if (formUnsaved)
	{
		Ext.Msg.show({
			title:labelCloseTab, msg: labelCloseTabLabel,
			buttons: Ext.Msg.YESNO,
			icon: Ext.MessageBox.WARNING,
			fn: function(btn){
				if (btn == 'yes'){
					var tabToCloseFrom = Ext.getCmp('navview').findById('tabs')
					tabToCloseFrom.un('beforeclose', beforeCloseTabEvent);
					linkArray[indexArray[tab.id]] =null;
					removeTabFunction(tab.id);
					tabToCloseFrom.remove(tab);
					tabToCloseFrom.addListener('beforeclose', beforeCloseTabEvent, tabToCloseFrom);
				}
			}
		});
		return false;
	}
}
function removeTabFunction(id) {
	var i=0;
	var thisTabId=id
	thisTabId=escapeHtmlCodes(thisTabId);
	while(tabsList.length>i) {
		var tabRecord = tabsList[i];
		var tabInfo = tabRecord.split(spChar);
		if(tabInfo[0] == windowTitle){
			windowTitle=null;
		}
		if(tabInfo[1] == thisTabId) {
			tabsList.splice(i,1)
			functionsList.splice(i,1);
			break;
		}
		i++;
	}
}
function editDashboardHandler(){
	if(document.getElementById("qryPageRef").value!=''){
		var selPageRef=document.getElementById("qryPageRef").value;
		var args=selPageRef.split(sep);
		if(Ext.getCmp(args[0])!=null) {
			Ext.getCmp(args[0]).show();
		}
		else if(args.length==3){
			Ext.getCmp('navview').findById('tabs').add({
				title: ' &nbsp;&nbsp; '+args[0], id: args[0], closable : true,domId:'defaultdashboard',
				html: '<div class=\"iframe-enclave1\" id=\"child3\"><\/div><div class=\"drop-target\" id=\"child4\"><iframe id="defaultDashboardIFrame" src =\"\/apex\/'+
				args[2]+'?editDefaultDashboard=true'+'\" class=\"tab-iframe\"/></div>',
				
				afterRender:function() {
					Ext.Panel.prototype.afterRender.apply(this, arguments);
					this.dropTarget = this.body.child('div.iframe-enclave1');
					var dd = new Ext.dd.DropTarget(this.dropTarget, {
						ddGroup:'t2div',
						
						notifyDrop:function(dd, e, node) {
							if(node.node.attributes.pageRef=='' || node.node.attributes.pageRef == null || node.node.attributes.pageRef=='DashboardPage') {
								Ext.Msg.alert(labelInformation, labelQVDragToDashboard);
							}else {
								document.getElementById('defaultDashboardIFrame').contentWindow.dragQV(node.node.id);
								document.getElementById('child3').style.visibility='hidden';
								return true;
							}
						}// eo function notifyDrop
					});
					document.getElementById('child3').style.visibility='hidden';
				}                    
			}).show();
		}
	}
}
function editHandler(){
	if(isQueryNode==false && isFolderNode==true){
		Ext.Msg.show({
				   title: labelEditFolder,
				   msg: labelvalidateFolderNameSkyWalkerPage,
				   width: 250,
				   buttons: Ext.MessageBox.OKCANCEL,
				   value: nameOfFolderNode,
				   prompt: true,
				   fn : function(btn, text){
						if (btn == 'ok'){
							if(text.length>100) {
								Ext.Msg.alert(labelInformation, labelQVFolderLengthValidation);
								return;
							}
							folderName=text;
							document.getElementById("strFolderName").value=text;                                    
							if(text !=null && text.trim()!=''){
								editFolderName(selectedNode);  
								OnLoadDesableButtons();                                      
							}else{
								document.getElementById("strFolderName").value=''; 
								editHandler();
							}                        
						}} 
					});
	}else if(isQueryNode==true && isFolderNode==false){
		editQuery(sysQueryId);
	}
}
function editHandlerCall(){
	if(document.getElementById("qryPageRef").value!=''){
		var selPageRef=document.getElementById("qryPageRef").value;
		
		var args=selPageRef.split(sep);
		var nodeTextval=args[0];
		nodeTextval = replaceAll(nodeTextval,'%','?'); 
		nodeTextval = replaceAll(nodeTextval,'?','%25');
		nodeTextval = replaceAll(nodeTextval,'#','%23');
		nodeTextval = replaceAll(nodeTextval,'&','%26');
		nodeTextval = replaceAll(nodeTextval,'\'','?');
		nodeTextval = replaceAll(nodeTextval,'?','\\\'');
		nodeTextval = replaceAll(nodeTextval,'\"','%22');
		nodeTextval = replaceAll(nodeTextval,'+','%2B');
		if(args[2]!='DashboardPage'){
			args[2]=replaceAll(args[2],'\"','%22');
			args[2]=replaceAll(args[2],'+','%2B');
			
			// Std layout changes --------
			args[2] = args[2]+'&standardLayout=true';
			// End ----
			addNewTab(nodeTextval, labelQuickViewEditor , args[2]);  
		}                
	}
}
function doNotEditFunction(){
	Ext.Msg.alert(labelInformation, labelSelectedQueryDeletedMessage);    
	loadTreeAfterDeleteQuery();
}
function setQuickviewId(Id) {
	QVQueryId = Id;
}
function getQuiickviewId() {
	if(QVQueryId!=null && QVQueryId!='' && QVQueryId!='default dashboards') {
		return QVQueryId;
	}
}
clickFunction1 = function(n) {
	document.getElementById("qryPageRef").value="";
		isQVNodeSelected='true';
		if(n.leaf){

			if(n.attributes.pageRef != '' && n.attributes.pageRef !=null){
				if(n.attributes.pageRef=='DashboardPage'){
					OnLoadDesableButtons();
				}else{
				desableButtons();
				selectedNode=null;
				selectedNodeRef = n.attributes.pageRef;
				sysQueryId  = n.id;
				setQuickviewId(n.id);
				isQueryNode=true;
				isFolderNode=false;
				selecteQueryText=n.text;
				oewnerOfQuery=n.attributes.owner;
				var ownerId=document.getElementById("ownerId").value;                            
				if(n.attributes.systemValue==true){
					Ext.getCmp('deleteBtn').setDisabled(true);
						Ext.getCmp('cutBtn').setDisabled(true);
					}	                           
				}	                           
			}else{
				selectedNode=n.id;
				selectedNodeRef =null;
				isQueryNode=false;
				isFolderNode=true;
				nameOfFolderNode=n.text;	
				if( n.attributes.parent=='null' || n.attributes.parent=='' || n.attributes.systemValue==true ){
					OnLoadDesableButtons();
				}
			}
		   var tab = Ext.getCmp('tabs').findById(n.id);
		   if(tab){
			   //tab.show();
			}else {
				document.getElementById("qryPageRef").value=n.text+sep+n.id+sep+n.attributes.pageRef;
				if(n.id=='default dashboards')  editDashboardHandler();			
			}
		}else{
			selectedNodeRef=null;
			selectedNode=n.id;
			folderName=n.text;
			setQuickviewId(null);
			isQueryNode=false;
			isFolderNode=true;
			nameOfFolderNode=n.text;
			if( n.attributes.parent=='null' || n.attributes.parent=='' || n.attributes.systemValue==true ){
					OnLoadDesableButtons();
				 if((n.attributes.parent=='null' || n.attributes.parent=='') && n.attributes.systemValue==true){
				   Ext.getCmp('addFldrBtn').setDisabled(false);
				   } 
			}else{
			enableButtons();
			}
			if(n.expanded){
				n.collapse();
			}else{
				n.expand();
			}
		
		}
};
function editTreeForQuery(){
	refreshTree();
}
function addQueryNode(queryId, queryName){
	refreshTree();
}
function setFolderId(folderId){
	addedFolderId=folderId;
}
function loadTreeAfterAdd(val){
	var tree = Ext.getCmp('QVToolbar');
	var newNode = new Ext.tree.TreeNode({
		text: val,
		id  : addedFolderId,
		leaf: false,
		href: '#',
		expandable  : true
	});
	var selectednode = tree.getSelectionModel().getSelectedNode();
	selectednode.appendChild([newNode]);
  }
function loadTreeAfterDelete(){
	if(errorMessge !='' && errorMessge=='Do not delete'){
		Ext.Msg.alert(labelWarning, labeldeleteFolderHavingSystemQuery);
		
	}else{
		var tree = Ext.getCmp('QVToolbar');
		tree.getSelectionModel().getSelectedNode().remove();
		//selectednode.appendChild([pipponodo1]);
		OnLoadDesableButtons();
	}
  }
function loadTreeAfterDeleteQuery(){
	var tree = Ext.getCmp('QVToolbar');
	tree.getSelectionModel().getSelectedNode().remove();
	//selectednode.appendChild([pipponodo1]);
	OnLoadDesableButtons();
	var tbPanel = Ext.getCmp('tabs');
	if(tbPanel != null && typeof(tbPanel) != "undefined"){
		if((tbPanel.getActiveTab()).getId() == 'mydashboard')
			refreshDashBoard();
			setDoRefresh(false);
	}
   
  }
function loadTreeAfterPaste(val){
	refreshTree(); 
	idForQuery="";
	isQueryCut=false;
	isQueryCopy=false;
	Ext.getCmp('pasteBtn').setDisabled(true);
	//alert('owner of new node : '+newNode.attributes.owner);
  }
function showErrorMessage(){
		Ext.Msg.alert(labelWarning, labelQueryNameExisting);
		isQueryCopy=false;
		isQueryCut=false;
		refreshTree();
  }      
function desableButtons(){
		//alert('flagToDesableButton : '+flagToDesableButton);
		if(flagToDesableButton==true){
		Ext.getCmp('newBtn').setDisabled(true);
		Ext.getCmp('editBtn').setDisabled(false);
		Ext.getCmp('copyBtn').setDisabled(false);
		Ext.getCmp('pasteBtn').setDisabled(true);
		Ext.getCmp('deleteBtn').setDisabled(false);
		Ext.getCmp('cutBtn').setDisabled(false);
		//Ext.getCmp('exportQueryBtn').setDisabled(true);
		Ext.getCmp('addFldrBtn').setDisabled(true);
		Ext.getCmp('deleteFldrBtn').setDisabled(true);
  }
  }
function enableButtons(){
		//alert('flagToDesableButton : '+flagToDesableButton);
		if(flagToDesableButton==true){
		Ext.getCmp('newBtn').setDisabled(false);
		Ext.getCmp('editBtn').setDisabled(false);
		Ext.getCmp('copyBtn').setDisabled(true);
		if(isQueryCopy==true || isQueryCut==true){
			Ext.getCmp('pasteBtn').setDisabled(false);
		}else{
			Ext.getCmp('pasteBtn').setDisabled(true);
		}
		Ext.getCmp('deleteBtn').setDisabled(true);
		Ext.getCmp('cutBtn').setDisabled(true);
		//Ext.getCmp('exportQueryBtn').setDisabled(false);
		Ext.getCmp('addFldrBtn').setDisabled(false);
		Ext.getCmp('deleteFldrBtn').setDisabled(false);
  }
  }
function OnLoadDesableButtons(){
		Ext.getCmp('newBtn').setDisabled(true);
		Ext.getCmp('editBtn').setDisabled(true);
		Ext.getCmp('copyBtn').setDisabled(true);
		Ext.getCmp('pasteBtn').setDisabled(true);
		Ext.getCmp('deleteBtn').setDisabled(true);
		Ext.getCmp('cutBtn').setDisabled(true);
		//Ext.getCmp('exportQueryBtn').setDisabled(true);
		Ext.getCmp('addFldrBtn').setDisabled(true);
		Ext.getCmp('deleteFldrBtn').setDisabled(true);
  }
function addQVFolder(){
		if(isQVNodeSelected=='true'){
			if(selectedNodeRef == null){
				 Ext.Msg.prompt(labelAddFolder, labelvalidateFolderNameSkyWalkerPage, function(btn, text){
					if (btn == 'ok'){
						if(text.length>100) {
							Ext.Msg.alert(labelInformation, labelQVFolderLengthValidation);
							return;
						}
						folderNameVal=text;
						document.getElementById("strFolderName").value=text;                                    
						if(text !=null && text.trim()!=''){
							addFolder(selectedNode);                                        
						}else{
							document.getElementById("strFolderName").value='';
							addQVFolder();
						}                        
					}});
				//openPopupTitle('AddFolderPage?selectedNodeName='+selectedNode,loadTreeAfterAdd,130,350,'Add Folder');
			}
		}else{
			Ext.Msg.alert(labelWarning, labelvalidateSelectionOfFolderSkyWalkerPage);		
		}
  }
function deleteQVFolder(){
		   if(selectedNodeRef == null){
				Ext.MessageBox.confirm(labelDelete, labeldeleteSelectedFolderSkyWalkerPage, function(btn){
					if(btn === 'yes'){
						deleteFolder(selectedNode);
						//loadTreeAfterDelete(selectedNode);
						
					}
				});
			//openPopupTitle('DeleteFolderPage?selectedNodeName='+selectedNode,loadTreeAfterDelete,150,350,'Delete Floder');
			//loadTree();
		}
		else 
			Ext.Msg.alert(labelWarning, labelvalidateSelectionOfFolderSkyWalkerPage);
  }
function newQueryHandler(){
		if(selectedNodeRef == null){
			//addNewTab('QueryWizard', labelQuickViewEditor, 'NavigatorPage?title='+labelNewQuickView+'&target=QVWiz?qvfldr='+selectedNode+'%26x='+(index++));
			// std layout changes ----
			addNewTab('QueryWizard', labelQuickViewEditor, 'NavigatorPage?title='+labelNewQuickView+'&standardLayout=true&target=QVWiz?qvfldr='+selectedNode+'%26x='+(index++));
			// End ---
		}
   }
function deleteQueryHandler(){
	 Ext.MessageBox.confirm(labelDelete, labeldeleteSelectedQuerySkyWalkerPage, function(btn){
		if(btn === 'yes'){
			deleteQuery(sysQueryId);
			setDoRefresh(true);
		}
	 });
}
function removeQueryHandler(){                 
}
function cutQueryHandler(){   
	 //  Code for Cut query....           
	 queryIdforCopy=sysQueryId;
	 isQueryCut=true;
	 isQueryCopy=false;
	 var tree = Ext.getCmp('QVToolbar');
	 selectedQueryNode= tree.getSelectionModel().getSelectedNode();
	 
	 document.getElementById("queryIdforCut").value=sysQueryId;
	 Ext.Msg.alert(labelInformation, labelvalidateQueryPasteSkyWalkerPage);         
}
function copyQueryHandler(){	 
	 queryIdforCopy=sysQueryId;
	 isQueryCopy=true;
	 isQueryCut=false;
	 document.getElementById("queryIdforCopy").value=sysQueryId
	 document.getElementById("queryIdforCut").value='';
	 Ext.Msg.alert(labelInformation, labelvalidateQueryPasteSkyWalkerPage);
}
function confirm(e){
	var rightclick;
	if (!e) var e = window.event;
	if (e.button) rightclick = (e.button == 2);
	if(rightclick==true){
		document.getElementById("homelink").href = '/ui/setup/Setup';
	}else{
		document.getElementById("homelink").href = '#nogo';
		Ext.MessageBox.confirm(labelConfirmHomePage, labelHomeLink, function(btn){
			if(btn === 'yes'){
				window.location="/ui/setup/Setup";   
			}                  		 
		});										   
	}
}
function pasteQueryHandler(){
	if(queryIdforCopy!=null && queryIdforCopy!=''){
		if(isQueryCut==false){
			if(qvNameInvalid) {
				labelvalidateQueryNameSkyWalkerPage = labelReenterQVName;
				qvNameInvalid = false;
			}else {
				labelvalidateQueryNameSkyWalkerPage = labelEnterQVname;
			}
			Ext.Msg.prompt(labelAddQuery, labelvalidateQueryNameSkyWalkerPage, function(btn, text){
			if (btn == 'ok'){
				  if(text.length>80) {
					qvNameInvalid = true;
					pasteQueryHandler();
				  }
				  else {
					  nameOfQuery = text;  
					  document.getElementById("strQueryName").value=text;  
					  if(text !=null && text!=''){
						 pasteQuery(selectedNode);                                        
					  }
				  }
			}else{
				isQueryCopy=false;
			}
			if(btn=='cancel') {
				qvNameInvalid = false;
			}
			});    
		}else{		
			nameOfQuery = selecteQueryText;
			document.getElementById("strQueryName").value=selecteQueryText; 
			pasteQuery(selectedNode);
			isQueryCut==false;    
		}
	}
}
Ext.onReady(function() {
	// Create our instance of tabScrollerMenu

	var AddFolderHandler = function(button,event) {  addQVFolder(); };
	var DeleteFolderHandler = function(button,event) {  deleteQVFolder(); };
	var NewQueryHandler = function(button,event) {  newQueryHandler(); };
	var DeleteQueryHandler = function(button,event) {  deleteQueryHandler(); }; 
	var CopyQueryHandler= function(button,event) {  copyQueryHandler(); };
	var PasteQueryHandler= function(button,event) {  pasteQueryHandler(); };
	var RemoveQueryHandler=function(button,event) {  removeQueryHandler(); };
	var CutQueryHandler=function(button,event) {  cutQueryHandler(); };	
	var scrollerMenu = new Ext.ux.TabScrollerMenu({
		maxText  : 15,
		pageSize : 5
	});

	//Call action function to create user specific dashboard.
	//showDashboard();
	if(typeof(UpdatePropSysStage)=='undefined') 
	{ 
        return; 
	}
    var screenHeight=screen.height;
	UpdatePropSysStage(screenHeight);
	
	if(typeof(repeatNodePageReference)=='undefined') 
	{ 
        return; 
	}
	repeatNodePageReference();


	catLogTBar=new Ext.Toolbar({
	id: 'catLogToolBar',
	items:[
		{
			scale: 'medium', iconCls: 'bmcNew', hight: '20px', width: '20px',
			tooltipType : 'title', tooltip: labelnewQuery, id:'newBtn',
			
			listeners: {
				mouseover: function(){
					this.setIconClass('bmcNewOn');
				},
				mouseout: function(){
					this.setIconClass('bmcNew');
				}
			},
			handler:NewQueryHandler
		} ,{
			scale: 'medium', iconCls: 'bmcQueryEdit', hight: '20px',
			width: '20px', tooltipType : 'title', tooltip: labeleditQVQuery,  id:'editBtn',
			
			listeners: {
				mouseover: function(){
					this.setIconClass('bmcQueryEditOn');
				},
				mouseout: function(){
					this.setIconClass('bmcQueryEdit');
				}
			}, handler: editHandler
		},{
			scale: 'medium', iconCls: 'bmcQvCutQuery', id:'cutBtn',
			tooltipType : 'title', tooltip: labelcutQuery,
			
			listeners: {
				mouseover: function(){
					this.setIconClass('bmcQvCutQueryOn');
				 },
				 mouseout: function(){
					this.setIconClass('bmcQvCutQuery');
			}
			}, handler:CutQueryHandler
		},{
			scale: 'medium', iconCls: 'bmcCopy', id:'copyBtn',
			tooltipType : 'title', tooltip: labelcopyQuery,
			
			
			listeners: {
				mouseover: function(){
					this.setIconClass('bmcCopyOn');
				 },
				mouseout: function(){
					this.setIconClass('bmcCopy');
				}
			}, handler:CopyQueryHandler
		},{
				scale: 'medium', iconCls: 'bmcQvPaste', id:'pasteBtn',
				tooltipType : 'title', tooltip: labelpasteQuery,
				
				listeners: {
					mouseover: function(){
						this.setIconClass('bmcQvPasteOn');
					 },
					mouseout: function(){
						this.setIconClass('bmcQvPaste');
					}
				}, handler:PasteQueryHandler
		 },{
			scale: 'medium', iconCls: 'bmcQVDeleteQuery', id:'deleteBtn',
			tooltipType : 'title', tooltip: labeldeleteQuery,
			
			listeners: {
				mouseover: function(){
					this.setIconClass('bmcQVDeleteQueryOn');
				 },
				 mouseout: function(){
					this.setIconClass('bmcQVDeleteQuery');
				 }
			}, handler:DeleteQueryHandler
		},'-',{
			scale: 'medium', iconCls: 'bmcQvAddFolder', id:'addFldrBtn',
			tooltipType : 'title', tooltip: labelAddFolder,
			
			listeners: {
				mouseover: function(){
					this.setIconClass('bmcQvAddFolderOn');
				 },
				 mouseout: function(){
					this.setIconClass('bmcQvAddFolder');
				 }
			}, handler:AddFolderHandler
		},{
			scale: 'medium', iconCls: 'bmcQvDeleteFolder', id:'deleteFldrBtn',
			tooltipType : 'title', tooltip: labeldeleteFolder,
			
			listeners: {
				mouseover: function(){
					this.setIconClass('bmcQvDeleteFolderOn');
				 },
				 mouseout: function(){
					this.setIconClass('bmcQvDeleteFolder');
				 }
			}, handler:DeleteFolderHandler
		}
	 ]});  
	btn1=new Ext.Toolbar({
		cls:'btn1Cls',

			items:[{ xtype: 'tbtext', text: BMCVideoLinkLabel,id:'bmcCommunityLink', listeners: {render : function(c) {c.getEl().on('click', function() {OpenBMCCommunityPage();});} } },
				{html:'<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>'},
				{xtype: 'tbtext', text: labelHelp,id:'helpMenuLink',listeners: {render : function(c){var autoSave = null;c.getEl().on('click', function(e){var eXY = e.getXY();eXY[0] = eXY[0] - 170;	eXY[1] = eXY[1] + 18; helpMenu.showAt(eXY);if(autoSave == null){autoSave = new Ext.util.DelayedTask(function(){	helpMenu.hide();});	}autoSave.delay(3500);});} } },									
				new Ext.Button( {cls:'stdarrow',tooltipType: 'title',id:'helpLinkButton', tooltip:labelsidebarToolTip,handler :arrowClick}),
				'->',
				new Ext.Button( {cls:'Add',tooltipType: 'title',id:'portletAddBtn', tooltip:labelsidebarToolTip,handler :openPopUp}),
				new Ext.Button( {cls:'pre',tooltipType: 'title',id:'portletPrevBtn',tooltip:labelpreviousPortlet,handler :prePortel}),
				new Ext.Button( {cls:'next',tooltipType: 'title',id:'portletNextBtn',tooltip:labelnextPortlet,handler :nextPortel})
			]});
	
	new Ext.Viewport({
		layout: 'border',		
		id: 'navview',
		items: [
		{
			region: 'west',
			collapsible: true,
			collapseMode: 'mini',
			width: 280,
			autoScroll: true,
			id: 'navbar',
			useArrows: true,
			split: true,
			//margins: '2 5 0 0',
			//cmargins: '0 5 0 0',
			layout: 'accordion',
			titleCollapse: false,
			activeItem: 0,
			//collapseFirst: true,

			bodyStyle:{"background-color":"#334f67","border":"none"},
			footerCfg: {
				html: '<img src='+resSDEFStylesPath+'/SDEFimages/Salesforce_Logo.png width="280" height="67">'
			},
			footerStyle: 'border-top:1px solid #cbdeeb;',
			items: [{
				title: labelCatalog,
				id: 'QVToolbar',
				collapsible: true,
				titleCollapse:true,
				hideCollapseTool: true,
				margins: '0 10 0 0',
				autoScroll: true,
				cls:'bmcCatalogTreeCls',
				iconCls: 'bmcCatalog', scale: 'medium',
				useArrows: true,
				//cls:'catalogCls',
				margins: '0 5 0 0',
				cmargins: '0 5 0 0',
				xtype: 'treepanel',
				enableDD:true,
				ddGroup:'t2div',
				tbar: catLogTBar ,
				loader: new Ext.tree.TreeLoader(),
				root: new Ext.tree.AsyncTreeNode({
				expanded: true,
				children: quickViewJsonFeedRoot()
			   }),rootVisible: false,
				listeners: {
					click: clickFunction1,
					startdrag:function(tree, node, e) {
						child1 = document.getElementById('child1');
						child3 = document.getElementById('child3');
						child5 = document.getElementById('child5');
						child7 = document.getElementById('divId'+Ext.getCmp('tabs').getActiveTab().getId());
						child8 = document.getElementById('child8');
						
						if(child1!=null) {
							child1.style.visibility='visible';
						}
						if(child3!=null) {
							child3.style.visibility='visible';
						}
						if(child5!=null) {
							child5.style.visibility='visible';
						}
						if(child7!=null) {
							child7.style.visibility='visible';
						}
						if(child8!=null) {
							child8.style.visibility='visible';
						}
					},
					enddrag:function(tree, node, e) {
						clickFunction1(node)
						child1 = document.getElementById('child1');
						child3 = document.getElementById('child3');
						child5 = document.getElementById('child5');
						child7 = document.getElementById('divId'+Ext.getCmp('tabs').getActiveTab().getId());
						child8 = document.getElementById('child8');
						
						if(child1!=null) {
							child1.style.visibility='hidden';
						}
						if(child3!=null) {
							child3.style.visibility='hidden';
						}
						if(child5!=null) {
							child5.style.visibility='hidden';
						}
						if(child7!=null) {
							child7.style.visibility='hidden';
						}
						if(child8!=null) {
							child8.style.visibility='hidden';
						}
						
					},
					beforemovenode:function(tree, node, oldParent, newParent, index) {
						if(oldParent==newParent) {
							return true;
						}
						if(node.attributes.pageRef == '' || node.attributes.pageRef == null) {
							Ext.Msg.alert(labelInformation, labelQVDragToFolder);
							refreshTree();
						}else if(node.attributes.pageRef=='DashboardPage') {
							Ext.Msg.alert(labelInformation, labelQVDragToFolder);
							refreshTree();
						}else if(newParent.id=='dashboards') {
							Ext.Msg.alert(labelInformation, labelrestrictQVs);
							refreshTree();    
						}else if(newParent.attributes.systemValue) {
							Ext.Msg.alert(labelInformation, labelrestrictCustomQVs);
							refreshTree();    
						}else if(node.attributes.systemValue) {
							Ext.Msg.alert(labelInformation, labelrestrictSystemQVs);
							refreshTree();
						}else {
							isQueryCut=true;
							isQueryCopy=false;
							queryIdforCopy = node.id;
							selecteQueryText = node.text;
							selectedNode = newParent.id;
							document.getElementById("queryIdforCut").value=node.id;
							pasteQueryHandler()
						}
					}
				}
			}]
		}, {
			region: 'center',
			xtype: 'tabpanel',
			id: 'tabs',
			width:500,
			autoScroll:true,
			tabPosition:'top',
			cls:'centralTabPanelCls',
			enableTabScroll : true,
			autoScroll : false,
			plugins : [ scrollerMenu ],
			split:true,  
			items:[
				//With IFrame
				{id:'mydashboard', domId:'mydashboard', title:'&nbsp;&nbsp;&nbsp;'+labelMyDashboardTitle, html:'<div class=\"iframe-enclave1\" id=\"child1\"><\/div><div class=\"drop-target\" id=\"child2\"><iframe frameborder="0" id="dashboardIFrame" name="dashboardIFrame" src =\"\/apex\/DashboardPage\" class=\"tab-iframe\"\/><\/div>',
					
					afterRender:function() {
						Ext.Panel.prototype.afterRender.apply(this, arguments);
						this.dropTarget = this.body.child('div.iframe-enclave1');
						var dd = new Ext.dd.DropTarget(this.dropTarget, {
							ddGroup:'t2div',
							
							notifyDrop:function(dd, e, node) {
								if(node.node.attributes.pageRef=='' || node.node.attributes.pageRef == null || node.node.attributes.pageRef=='DashboardPage') {
									Ext.Msg.alert(labelInformation, labelQVDragToDashboard);
								}else {
									document.getElementById('dashboardIFrame').contentWindow.dragQV(node.node.id);
									document.getElementById('child1').style.visibility='hidden';
									return true;
								}
							}// eo function notifyDrop
						});
						document.getElementById('child1').style.visibility='hidden';
					}
					
				}

			],
			listeners: {
					tabchange: function (container,tab){
						var windowT = trim(tab.title.split(';')[tab.title.split(';').length-1]);
						var frame3 = myArray[windowT];
						if(frame3 != undefined){
							if(typeof(frame3.refreshDocs)!='function'){
							 if(windowT !='Configuration Items'){
							    //alert('in  if frame3.frames--');							
								frame3.frames.SIIframeID.refreshDocs();       
							} else{
							     //alert('in  else frame3.frames--');
							      var fram4 = frame3.frames;
								  fram4[0].frames.SIIframeID.refreshDocs();
								}
								delete myArray[windowT];  //to avoid refresh when we come to the parent tab again
							}else{
								frame3.refreshDocs();
							}
						}
						
						if(tab.id == 'mydashboard' && getDoRefresh()){
							refreshDashBoard();
							setDoRefresh(false);
						}
						var tabEl=container.getTabEl(tab);
						if(tabEl.childNodes[0]!=null && tabEl.childNodes[0]!=undefined){
						  var tabIdVar= tab.domId.replace(' ','_');
						  tabEl.childNodes[0].id=tabIdVar.toUpperCase()+'_TAB_CLOSE_BTN';
						  tabEl.childNodes[1].childNodes[0].childNodes[0].childNodes[0].id=tabIdVar.toUpperCase()+'_TAB';
					   }
						
					}
				}
		},{
			region: 'east',
		   
			//width:Ext.isIE7 ? 292 : 280,
			width:Ext.isIE7 ? 282 : Ext.isIE8 ? 280 :282,
			id:'rightbar',
			baseCls:'sky-widgetpanel-base',
			//bodyStyle:{"padding-left":"5px","padding-right":"2px"},
			collapsible: true,
			collapseMode: 'mini',
			animCollapse : Ext.isIE,
			animFloat : Ext.isIE,
			split:true,
			//cls:'eastRegionCls',
		   // constrain:true,
		   minWidth: Ext.isIE7 ? 282 : Ext.isIE8 ? 280 :282,               
		   maxWidth: Ext.isIE7 ? 282 : Ext.isIE8 ? 280 :282,    

			 margins:'-2 0 0 0',
			items:[{region:'north',id:'eastNorthBar',tbar: btn1, height:15,cls:'skyEastToolbarCls',bodyStyle:{"background-color":"#334f67","border":"none"}},{
			  xtype:'portal',
			  region:'center',
			  
			  //height:Ext.isIE7 ? 710 : Ext.isIE8 ? 680 : 680,
			   bodyStyle:{"background-color":"#334f67","border":"none"},
			   items:[ {
					id:'portalContent',
					columnWidth:0.99,
  
					items:[{xtype:'panel',height:5,bodyStyle:{"background-color":"#334f67","border":"none"}},[jsonStringVal]]
				  
				   }]
			 }]
		  }
	],
	listeners:{
		afterlayout: function(c){
			c.layout.east.miniSplitEl.dom.qtip = labelTooltipCollapseSidebar;
			c.layout.east.getCollapsedEl();
			c.layout.east.miniCollapsedEl.dom.qtip = labelTooltipExpandSidebar;

			c.layout.west.miniSplitEl.dom.qtip = labelTooltipCollapseNavigator;
			c.layout.west.getCollapsedEl();
			c.layout.west.miniCollapsedEl.dom.qtip = labelTooltipExpandNavigator;
		   setIdToTreeNode();
		}
	}
	});
	
	function setIdToTreeNode()
	{
		 /*var workspacesTree=Ext.getCmp('workspaces');
		    workspacesTree.getRootNode().cascade(function(n) {
				if(n!=null && n!=undefined && n.attributes.domId!=undefined &&n.attributes.domId!=null ){
				 var navIdVar= n.attributes.domId.replace(' ','_');
				  n.getUI().getTextEl().id=navIdVar.toUpperCase()+'_TREE_ID';
				  }
		   });*/
		   //workspacesTree.getEl().dom.childNodes[0].childNodes[1].id='WORKSPACE_ACCORD';
		   var QVTree=Ext.getCmp('QVToolbar');
		   QVTree.getEl().dom.childNodes[0].childNodes[1].id='CATALOG_ACCORD';
		   /*var configTree=Ext.getCmp('ConfigurationTree');
		    configTree.getRootNode().cascade(function(n) {
				if(n!=null && n!=undefined && n.attributes.domId!=undefined && n.attributes.domId!=null ){
				  var navIdVar= n.attributes.domId.replace(' ','_');
				  n.getUI().getTextEl().id=navIdVar.toUpperCase()+'_TREE_ID';
				}
		   });
		   configTree.getEl().dom.childNodes[0].childNodes[1].id='CONFIG_ACCORD';*/
		   	var count=0;
			  Ext.select('.x-tool').each(function(el){
			  el.dom.id = 'PANEL-TOOL-' +count++; 
		   }); 
	}
	function showHelp()
	{    
	    alert('Opening'); 
	   if(userLanguage =='ja'){
	     window.open(resSDEFHelpPath_JA+"/helpfile.htm","popUpWindow","height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes");
	   }
	   else{
	     window.open(resSDEFHelpPath+"/helpfile.htm","popUpWindow","height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes");
    	  }
     }
	
	function gettingStarted(){
		if(userLanguage =='ja'){
	     window.open(resSDEFStylesPath_JA+"/InstallationandConfigurationGuide.pdf","popUpWindow","height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes");
	   }
	   else{
	     window.open(resSDEFStylesPath+"/gettingstarted/GettingStarted.pdf","popUpWindow","height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes");
    	  }
		  
	}
	
	function releasenotes(){
		if(userLanguage =='ja'){
	     window.open(resSDEFStylesPath_JA+"/ReleaseNotes.pdf","popUpWindow","height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes");
	   }
	   else{
	     window.open(resSDEFStylesPath+"/releasenotes/ReleaseNotes.pdf","popUpWindow","height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes");
    	  }
		  
	}
	function showContactUs()
	{
		
		var win1;
		var location = '<iframe src =\"/apex/contactus\" style=\"width:100%;height:100%;border:none\"/>';
		
		if(!win1){
		win1 = new Ext.Window({
				width:600,
				height:300,
				closable: true,
				closeAction: 'close',
				layout:'fit',
				bodyStyle:'background-color:#d2d1d1',
				title:labelSSContactUs,
				resizable : false,
				html: location 
			});
			win1.show(this);
		}
	}
	function showAbout()
	{
		
		var win1;
		var location = '<iframe src =\"/apex/AboutUs\" style=\"width:100%;height:100%;border:none\" scrolling=\"no\" frameborder=\"0\"/>';
		
		if(!win1){
		win1 = new Ext.Window({
				width:513,
				height:500,
				closable: true,
				closeAction: 'close',
				layout:'fit',
				bodyStyle:'background-color:#d2d1d1',
				title:labelAboutServiceDeskExpressonForceCom,
				resizable : false,
				html: location 
			});
			win1.show(this);
		}
	}
	var isUserSA = isUserSAval;
	helpMenu = new Ext.menu.Menu({
	id: 'basicMenu',
	items: [{
			text: labelService_Desk_Express_on_Force_com_Help,
			handler:showHelp
		},
  {
			text: labelGettingStarted,
			handler:gettingStarted
		},
		
		{
			text: labelReleaseNotes,
			handler:releasenotes
		},
		{
			text: labelSSContactUs,
			handler:showContactUs,
			hidden:!isUserSA
		},
		'-',
		{
			text: labelAboutServiceDeskExpressonForceCom,
			handler:showAbout
			
		}]
});
var autoSave = null;
/*Ext.get('helpMenuLink').on('click', function(e)
{
	var eXY = e.getXY();
	eXY[0] = eXY[0] - 170;
	eXY[1] = eXY[1] + 18;  
  helpMenu.showAt(eXY);
	if(autoSave == null){
		autoSave = new Ext.util.DelayedTask(function(){
			helpMenu.hide();
		});
	}
	autoSave.delay(3500);
});*/

	Ext.getCmp('navview').findById('tabs').findById('mydashboard').show();
	if(flagToDesableButton==false){
		Ext.getCmp('catLogToolBar').hide();
	}
	OnLoadDesableButtons();
	Ext.QuickTips.init();
	if(document.getElementById('child8')!=null) {
		document.getElementById('child8').style.visibility='hidden';
	}
	var hasPreviousPort = portletHasPrevVal;
	var hasNextPort = portletHasNextval;
	if(Ext.getCmp('portletNextBtn') != null && typeof(Ext.getCmp('portletNextBtn')) != 'undefined')
		Ext.getCmp('portletNextBtn').setDisabled((hasNextPort=='false'));
	if(Ext.getCmp('portletPrevBtn') != null && typeof(Ext.getCmp('portletPrevBtn')) != 'undefined')
		Ext.getCmp('portletPrevBtn').setDisabled((hasPreviousPort=='false'));

	if(document.getElementById('bmcCommunityLink') != null && document.getElementById('bmcCommunityLink') != 'undefined')
		document.getElementById('bmcCommunityLink').title = BMCVideoLinkLabeltooltip;
});            
function prePortel(){
  backPortlet();
}
function nextPortel(){
  nextPortlet();
}
openPopUp = function(){
	var userConfigPortletHeight= Ext.isIE?405:401;
	openPopupWithTitle('UserConfigPortlet?stdlayout=true',refreshPortletBar,labelAddSidebarContentHeader,userConfigPortletHeight,460,true);     
 }
function addFolderJS(folderId){
	if(folderId!=""){
		setFolderId(folderId);
		loadTreeAfterAdd(folderNameVal);
	}
}
function editQueryJS(validQueryId){
	if(validQueryId!='' && validQueryId=='1'){
		editHandlerCall();
	}else if(validQueryId!='' && validQueryId=='0'){
		doNotEditFunction();
	}
}
function copyQueryJS(isToShowMsg,idForQuery,userProfileId){
	if(isToShowMsg=='true'){
		showErrorMessage();
		isToShowMsg='false'
	}else{
		if(isQueryCut==true){
			idForQuery=queryIdforCopy;
			loadTreeAfterPaste(nameOfQuery);
		}
		if(userProfileId=='true'){
			flagToDesableButton=true; 
		}else{
			flagToDesableButton=false;
		}
		if(idForQuery != ""){
			var splitId=idForQuery.split('----');
			if(splitId[0]!==""){
				idForQuery=splitId[0];  
				ownerOfPasteQuery=splitId[1];
				loadTreeAfterPaste(nameOfQuery);
			}
		}
	}
}
function trim(str, chars) {
	return ltrim(rtrim(str, chars), chars);
}

function ltrim(str, chars) {
	chars = chars || "\\s";
	return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
}
 
function rtrim(str, chars) {
	chars = chars || "\\s";
	return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
}
function CloseActiveTab() {
	var activeTab = Ext.getCmp('tabs').getActiveTab();
	var tabToCloseFrom = Ext.getCmp('navview').findById('tabs');
	tabToCloseFrom.un('beforeclose', beforeCloseTabEvent);
	linkArray[indexArray[activeTab.id]] =null;
	removeTabFunction(activeTab.id);
	tabToCloseFrom.remove(activeTab);
	tabToCloseFrom.addListener('beforeclose', beforeCloseTabEvent, tabToCloseFrom);
}
