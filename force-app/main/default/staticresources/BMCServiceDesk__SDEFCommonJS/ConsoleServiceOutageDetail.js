var addNoteHandler;
var newActionHandler;
var viewActionHistoryBtnHandler;
var isBlackoutCreatable;
var alreadySelectedRecordId = '000000000000000';
var userTooltipData;
var WinMsg;
var isWrongValueSelected;
var isCorrectLookUpValueSelected;
var clickedOnceSO=false;
var resultSetCategory;
var psoIdOnload;
var userLanguage;

Ext.onReady(function(){    
	
	var topMenuBar = [
		{	
			xtype: 'tbspacer',
			width : 10
		},{
		id:'newId',
		baseCls: 'bmc-btn-small',
		disabledCls: 'bmc-btn-disabled',    
		focusCls: 'bmc-btn-focus',
		overCls: 'bmc-btn-over',
		pressedCls:'bmc-btn-pressed',
		tooltipType : 'title',
		tooltip: returnLabel(ConsoleServiceOutageDetail.Labels.New,'N'),
		text: ConsoleServiceOutageDetail.Labels.New,
		handler:NewBtnHandler
	},{	
		xtype: 'tbspacer',
		width : 5
	},{
		id:'refreshId',
		baseCls: 'bmc-btn-small',
		disabledCls: 'bmc-btn-disabled',    
		focusCls: 'bmc-btn-focus',
		overCls: 'bmc-btn-over',
		pressedCls:'bmc-btn-pressed',
		tooltipType : 'title',
		text: ConsoleServiceOutageDetail.Labels.Reload,
		tooltip: ConsoleServiceOutageDetail.Labels.Reload,
		handler:ReloadBtnHandler
	},{	
		xtype: 'tbspacer',
		width : 5
	},{
		id:'saveId',
		baseCls: 'bmc-btn-primary',
		disabledCls: 'bmc-btn-disabled',    
		focusCls: 'bmc-btn-focus',
		overCls: 'bmc-btn-over',
		pressedCls:'bmc-btn-pressed',
		tooltipType : 'title',
		tooltip: returnLabel(ConsoleServiceOutageDetail.Labels.Save,'S'),
		text: ConsoleServiceOutageDetail.Labels.Save,
		handler:SaveBtnHandler
	},{	
		xtype: 'tbspacer',
		width : 5
	},'-',{
		id: 'actionButton',
		baseCls: 'bmc-btn-dropdown',
		disabledCls: 'bmc-btn-dropdown-disabled',    
		focusCls: 'focus',
		overCls: 'over',
		pressedCls:'pressed',
		tooltipType : 'title',
		tooltip:returnLabel(ConsoleServiceOutageDetail.Labels.Actions,'A'),
		text: ConsoleServiceOutageDetail.Labels.Actions,
		menu:  getDetailViewActionMenu() 
	},'->',{
			  xtype: 'fieldcontainer',
		   width  : 50,
		   style:'margin-right:10px;',
		   checked: false,               
		   cls:'chkStyle',
		   tooltip:ConsoleServiceOutageDetail.Labels.Inactive,
		   html:'<label class="rf-filter-checkbox"><input type="checkbox" id="idInactive" value="false" onclick="return toggleBox(this);"/><span class="rf-checkmark"></span><span class="inactiveLabel">'+ConsoleServiceOutageDetail.Labels.Inactive+'</span></label>'
	},{
		xtype: 'tbspacer',
		width :15
	},'-' ,{
		xtype: 'tbspacer',
		width :5
	},{
		xtype: 'label',
		html: '<span class="d-icon-question_circle" style="font-size:19px;color:black;cursor:pointer" title="'+ ConsoleServiceOutageDetail.Labels.Help +'" id="helpConsoleList" onclick="OpenHelppage();"></span>'
	},{	
		xtype: 'tbspacer',
		width : 15
	}];

	if( userLanguage && userLanguage == 'iw' ) {
		topMenuBar.reverse();
	}
	
	
	Ext.create('Ext.toolbar.Toolbar', {
		id:'detailViewToolbarId',
		height:31,
		renderTo: 'btnToolbar',
		border:false,
		items: topMenuBar
	});
	changeMenuHandler();
	makeServStatusReq();
    makeEndDateReq();
	var isInactive=getBlackoutInactive();
	if(isInactive){     	     	
		document.getElementById('idInactive').checked=true;
	}
	updateInactive();
	handleElemEvent();
	if(copyId)
		setTabUnsavedChanges();
	setTabsavedChanges();
	psoIdOnload = getblackoutId();
});

function toggleBox(cb){
	if(cb.value=='true')
		cb.value=false;
	else
		cb.value=true;
}

function makeServStatusReq(){
	var affSerComp = document.getElementById(BlackoutPageComp.ComponentVars.ProjectedServiceOutageBaseElement);
	if(affSerComp==null || typeof(affSerComp)=='undefined'){
		affSerComp = document.getElementById(BlackoutPageComp.ComponentVars.ProjectedServiceOutageBusinessService);
	}
	if(affSerComp!=null && typeof(affSerComp) !='undefined'){
		var blkOutBox = document.getElementById(BlackoutPageComp.ComponentVars.ProjectedServiceOutageCID5);
		if(blkOutBox!=null && typeof(blkOutBox) !='undefined'){
			var servStatReqdComp = document.getElementById('statusReqd');
			if(servStatReqdComp!=null && typeof(servStatReqdComp) !='undefined'){
				if(affSerComp.value!=null && affSerComp.value!=''){
					if(blkOutBox.checked==false){
						servStatReqdComp.style.display = '';
					}
					else{
						servStatReqdComp.style.display = 'none';
					}
				}
				else{
					servStatReqdComp.style.display = 'none';
				}
			}
		}
	}
}

function makeEndDateReq(){
	var blkOutBox = document.getElementById(BlackoutPageComp.ComponentVars.ProjectedServiceOutageCID5);
	if(blkOutBox!=null && typeof(blkOutBox) !='undefined'){
		var endDateComp = document.getElementById('endDateReqd');
		if(endDateComp!=null && typeof(endDateComp) !='undefined'){
			if(blkOutBox.checked==true){
				endDateComp.style.display = '';
			}
			else{
	var servStatComp = document.getElementById(BlackoutPageComp.ComponentVars.ProjectedServiceOutageServStatus);
	if(servStatComp!=null && typeof(servStatComp) !='undefined'){
		var opt = servStatComp.options[servStatComp.selectedIndex].value;
			if(opt!='Maintenance'){
				endDateComp.style.display = 'none';
			}
			else{
				endDateComp.style.display = '';
		}
		}
			}
		}
	}
}


function getDetailViewActionMenu(){
return Ext.create('Ext.menu.Menu', {
        id: 'mainMenu',
        baseCls: 'bmc-menu',
        shadow: false,
        items: [ 
			{text:ConsoleServiceOutageDetail.Labels.AddNote, id:'addNoteId' , handler:addNoteHandler},
			{text:ConsoleServiceOutageDetail.Labels.NewAction, id:'newActionId' , handler:newActionHandler},
			{text:ConsoleServiceOutageDetail.Labels.ViewActionHistory,id:'viewActionHistoryId' , handler:viewActionHistoryBtnHandler}, 
			'-',
			{text:ConsoleServiceOutageDetail.Labels.Clone,id:'copyId' , handler:copyBtnHandler}
		]
    });
}

NewBtnHandler = function(button,event){
	openPage('new');
}

copyBtnHandler = function(button,event){
	openPage('clone');
	setTabUnsavedChanges();
}

function openPage(action){
	if(action=='new'){
		window.parent.addTab(null,'','Projected_Service_Outage__c', false,'','','', '');
	}else if(action=='clone'){
		window.parent.addTab(getblackoutId(),'','Projected_Service_Outage__c', true,'','','', '');
	}
}

var addNoteBtnHandlerWindow;
addNoteHandler = function(button,event) {
	var psoId=getblackoutId();
	psoId = psoId.substring(0, psoId.length - 3);
	if (!addNoteBtnHandlerWindow || addNoteBtnHandlerWindow.closed){              
		addNoteBtnHandlerWindow = window.open('/apex/ServiceUnavailabilityAddNotePage?id=' + psoId + '&fromconsole=false',null,'width=600,height=400,resizable = 0,scrollbars=no,status=1,top=350,left=350');
		}
		if (addNoteBtnHandlerWindow.focus) {addNoteBtnHandlerWindow.focus() ;}		
};

var newActionHandlerWindow;
newActionHandler = function(button,event) { 
			var psoId=getblackoutId();
			psoId = psoId.substring(0, psoId.length - 3);
   			newActionHandlerWindow=window.open('/apex/searchPage?popupId=Action&isLookup=true&objectType=Unavailability_Action_History__c&isCalledFromConsole=false&enableSelfClosing=false&standardLayout=true&parentId='+ psoId +'&filterClause=appliesToServiceUnavailability__c%3Dtrue%20and%20system__c%3Dfalse',null,"status = 1,height ="+'400'+",width ="+ '600'+",left="+screenLeft('600')+",top="+screenTop('400')+", resizable = 0,scrollbars=no");
   			if (newActionHandlerWindow.focus) {newActionHandlerWindow.focus() ;}   		
   			   			
};

var viewActionHistoryHandlerWindow;
viewActionHistoryBtnHandler = function(button,event) { 
	screenWidth = 671;
	screenHeight = 400;
	var psoId=getblackoutId();
	psoId = psoId.substring(0, psoId.length - 3);
	var psoName = document.getElementById(BlackoutPageComp.ComponentVars.ProjectedServiceOutageName).value;            
		viewActionHistoryHandlerWindow=window.open('/apex/ViewAllActions?ObjectId='+psoId+'&objectName=Projected_Service_Outage&recordState='+''+'&recordName='+psoName,null,"status = 1,height ="+screenHeight+",width ="+ screenWidth+",left="+screenLeft(screenWidth)+",top="+screenTop(screenHeight)+", resizable = 0,scrollbars=yes");
   		if (viewActionHistoryHandlerWindow.focus) {viewActionHistoryHandlerWindow.focus() ;}  			
};

var screenHeight = 400;
var screenWidth = 1087;	

function screenLeft(sWidth){
	return parseInt((screen.availWidth/2) - (sWidth/2));
}

function screenTop(sHeight){
	if(Ext.isChrome){
		var chromeHeight = parseInt((screen.availHeight/2) - (screenHeight/2));
		return (chromeHeight- 25);
	}else
		return parseInt((screen.availHeight/2) - (screenHeight/2));
	
}

var SaveBtnHandler = function(button,event){
	getTextlengthFilter();
}

var ReloadBtnHandler = function(button,event){
	var psoId=getblackoutId();
	psoId = psoId.substring(0, psoId.length - 3);
	if(clickedOnceSO){
		showCloseWarning(ConsoleServiceOutageDetail.Labels.CloseWindowLabel);
	}else{
		if(window.parent && window.parent.TabPanel){
			var currentTab = window.parent.TabPanel.getActiveTab() ;
			window.parent.changeTabTitle( tabId, ConsoleServiceOutageDetail.Labels.ServiceOutageRecordPrefix + ': '+ applyEllipsis(getName()));
			reloadPageFields();
		}
	}
}

function reloadOnComplete(){
	window.scrollTo(0, 0); 
	updateDateIcon();
	changePageSectionIcons();
	clickedOnceSO=false;
	CloseSavePopUp();
	CloseErrorPopUp();
	Ext.getCmp('saveId').setDisabled(false);
	buttonValidator();
	changeMenuHandler();
	setTabsavedChanges();
	makeServStatusReq();
	makeEndDateReq();
	handleElemEvent();
	
}

function getTextlengthFilter(){
	var psoDescription = document.getElementById(BlackoutPageComp.ComponentVars.ProjectedServiceOutageDescription).value;
	var psoName = document.getElementById(BlackoutPageComp.ComponentVars.ProjectedServiceOutageName).value;            
	var psoRootCause = document.getElementById(BlackoutPageComp.ComponentVars.ProjectedServiceOutageRootCause).value;
	var rootCauseLengthErr = ConsoleServiceOutageDetail.Labels.TextAreaOverflow.replace("255", "1000");
	CloseErrorPopUp();
	var beValueLength;
	if(isFlattenedCmdb)
		beValueLength = affectedServiceFlattenDOM.value.length;
	else
		beValueLength = affectedServiceNotFlattenDOM.value.length;
	if(beValueLength>0){	
		if(isWrongValueSelected){
			ShowInlineErrorMessage(getAffectedServiceLabel() + ' : ' +ConsoleServiceOutageDetail.Labels.invalidLookupString);
			return false;
		}
		if(typeof(isCorrectLookUpValueSelected)!=='undefined' && !isCorrectLookUpValueSelected){
			ShowInlineErrorMessage(getAffectedServiceLabel() + ' : ' +ConsoleServiceOutageDetail.Labels.lookUpStringwithMultiRecord);
			return false;
		}
	}
	if(psoDescription.length <= 255){
		if(psoRootCause.length <= 1000){
			getSave();
		}
		else{
			if(psoRootCause.length > 1000){
				ShowInlineErrorMessage(getRootCauseLabel() + ' : ' + rootCauseLengthErr);
			}
		}
	}else{
		if(psoDescription.length > 255){
			ShowInlineErrorMessage(getDescriptionLabel() + ': ' + ConsoleServiceOutageDetail.Labels.TextAreaOverflow);                          
		}
	}
}

function getSave(){
	var chkBoxValue=false;
	chkBoxValue=document.getElementById('idInactive').checked;
	Ext.getCmp('saveId').setDisabled(true);
	save(chkBoxValue);
}

function updateDateIcon() {
	try {
		var allDateInputs = getElementsByClassName('dateInput');
		if (allDateInputs.length > 0) {
		    var dateInput, allDateFormats;
		    var isDateOnly;
		    for (var j = 0; j < allDateInputs.length; j++) {
		        dateInput = allDateInputs[j];
		        if (dateInput.className.indexOf('dateOnlyInput') > -1) {
		            isDateOnly = true;
		        } else {
		            isDateOnly = false;
		        }
		        allDateFormats = dateInput.getElementsByClassName('dateFormat');
		        for(var i = 0 ; i< allDateFormats.length; i++) {
		            if(allDateFormats[i] != null && typeof(allDateFormats[i]) != 'undefined') {
		                var allchildren = allDateFormats[i].childNodes ;
		                if(allchildren != null && typeof(allchildren) != 'undefined' && allchildren.length > 0) {
		                    if(allchildren.length >= 2 && allchildren[1] != null && typeof(allchildren[1]) != 'undefined') {
		                        var tooltip = RemedyForceHTMLProcessor.getText(allchildren[1]);                     
		                        RemedyForceHTMLProcessor.clearHTML(allchildren[1]);
		                        
		                        allchildren[1].title = ConsoleServiceOutageDetail.Labels.Insert+ ': '+tooltip;
		                        var sapnIcon = document.createElement("SPAN") ;
		                        if (isDateOnly) {
									if( userLanguage && userLanguage == 'iw' )
										sapnIcon.className = 'd-icon-calendar rfdplIconFontSize rf-float-right marginTop5px marginRight5px' ;
									else
										sapnIcon.className = 'd-icon-calendar rfdplIconFontSize' ;
		                        } else {
									if( userLanguage && userLanguage == 'iw' )
										sapnIcon.className = 'd-icon-calendar_clock_o rfdplIconFontSize  rf-float-right marginTop5px marginRight5px' ;
									else
										sapnIcon.className = 'd-icon-calendar_clock_o rfdplIconFontSize' ;
		                        }
		                        sapnIcon.id = 'DateIcon-'+j+'-serviceOutage' ;
		                        allchildren[1].appendChild(sapnIcon) ;
		                        allchildren[1].style.textDecoration = 'none';
		                    }
		                    if(allchildren.length >= 3 && allchildren[2] != null && typeof(allchildren[2]) != 'undefined')
		                        allDateFormats[i].removeChild(allchildren[2]);
		                    if(allchildren.length > 0 && allchildren[0] != null && typeof(allchildren[0]) != 'undefined')
		                        allDateFormats[i].removeChild(allchildren[0]);
		                }
		            }
		        }
		    }
		}
	} catch (err) {
		console.log(err);
	} 
}

function changeMenuHandler(){
	var psoID=getblackoutId();
	if(psoID == null || psoID == ''){
		Ext.getCmp('copyId').setDisabled(true);
		Ext.getCmp('addNoteId').setDisabled(true);
		Ext.getCmp('newActionId').setDisabled(true);
		Ext.getCmp('viewActionHistoryId').setDisabled(true);
		if(isBlackoutCreatable != null &&  isBlackoutCreatable == false){
			Ext.getCmp('newId').setDisabled(true);
			Ext.getCmp('saveId').setDisabled(true);
		}
	}else{
		Ext.getCmp('copyId').setDisabled(false);
		Ext.getCmp('addNoteId').setDisabled(false);
		Ext.getCmp('newActionId').setDisabled(false);
		Ext.getCmp('viewActionHistoryId').setDisabled(false);
						
		if(isBlackoutCreatable != null &&  isBlackoutCreatable == false){
			Ext.getCmp('newId').setDisabled(false);
			Ext.getCmp('saveId').setDisabled(false);
		}				
	}

}

function buttonValidator() {
	if((getName() != null && getName() != '')&&(errormsg==ConsoleServiceOutageDetail.Labels.savedMsg)){    
		Ext.getCmp('copyId').setDisabled(false);
		Ext.getCmp('refreshId').setDisabled(false); 			  
	  }  
}

function saveOnComplete(){
	window.scrollTo(0, 0); 
	updateDateIcon();
	changePageSectionIcons();
	Ext.getCmp('saveId').setDisabled(false);
	buttonValidator();
	showMessage();
	changeMenuHandler();
	setTabsavedChanges();
	makeServStatusReq();
	makeEndDateReq();
	handleElemEvent();
	
}
function showMessage(){
	if(errorMsgList==ConsoleServiceOutageDetail.Labels.savedMsg){
		clickedOnceSO=false;
		ShowInlineSaveMessage();
		setTimeout(function(){					
			window.parent.refreshListView('Projected_Service_Outage__c');
		},2000); // load the related list frame async
	}else if(errorMsgList==ConsoleServiceOutageDetail.Labels.BlackOutDuplicateDates){
		clickedOnceSO=true;
		ShowInlineErrorMessage(errorMsgList);
	}else if(errorMsgList == ConsoleServiceOutageDetail.Labels.NewBlackoutwithCROverlapMessage1){
		clickedOnceSO=true;
		openChangeScheduleForCR();
	}else{
		clickedOnceSO=true;
		ShowInlineErrorMessage(errorMsgList);
	}
	
}

function openChangeScheduleForCR(){
	var msg = new Array();
	msg = errorMsgList;
	var message= msg; 
	if(isToAskConfirmation) {
		message = message.replace(/\n/g, '<br/>');
		message = message + ' <a href="#" onclick="loadChangeschTab(\''+urlParams+'\')">'+ConsoleServiceOutageDetail.Labels.ClickHere+'</a>.<br/><br/>'+ConsoleServiceOutageDetail.Labels.NewBlackoutwithCROverlapMessage1;
		message= RemedyForceHTMLProcessor.htmlDecoder(message);
		showCloseWarning(message);
	}
}

function loadChangeschTab(urlParameters) {
	var screenHeight = 650;
	var screenWidth = 1100;
	var screenLeft = (screen.width - screenWidth)/2;
	var screenTop = parseInt((screen.height/2)-(screenHeight/2))-50;
	var ChangeScheduleBtnHandlerWindow = window.open('/apex/ChangeSchedule?'+urlParameters,'viewChangeschedule',"status = 1,height ="+screenHeight+",width ="+ screenWidth+",left="+screenLeft+",top="+screenTop+", resizable = 0,scrollbars=no");
	if (ChangeScheduleBtnHandlerWindow.focus) {ChangeScheduleBtnHandlerWindow.focus() ;}
};

function ShowInlineSaveMessage(){
	CloseSavePopUp();
	var SaveMessageDiv=document.getElementById('SaveMessageDiv');
	if(SaveMessageDiv!=null && SaveMessageDiv!='undefined'){
		 var PanelWidth,divWidth,leftAlign;
		 PanelWidth=document.getElementById('btnToolbar').clientWidth;
		 SaveMessageDiv.style.display = "table";
		 divWidth = SaveMessageDiv.clientWidth;
		 SaveMessageDiv.style.display = "none";
		 
		 if(PanelWidth!=null && PanelWidth!='undefined' && divWidth!=null && divWidth!='undefined' )
			 leftAlign = parseInt((PanelWidth/2)-(divWidth/2)-35);
		 SaveMessageDiv.setAttribute('style','display: table; position: absolute; left: '+ leftAlign +'px;margin-top: 25px;z-index:5;');
		 ChangeVisibilityVar = setTimeout(function(){
			 CloseSavePopUp();
		 }, 3000);
	}
}

function CloseSavePopUp(){
	document.getElementById('SaveMessageDiv').setAttribute('style','display:none;');
}

function ShowInlineErrorMessage(errorMsgList){
	var  theDiv =  document.getElementById('errorDescId');
 	RemedyForceHTMLProcessor.clearHTML(theDiv);		
	var text1 = document.createElement("div");
	text1.appendChild(document.createTextNode(errorMsgList));
	text1.setAttribute('style', 'padding-top: 5px;');
	theDiv.appendChild(text1);	

	document.getElementById('jsscripterrorId').setAttribute('style','display:block;margin-top:80px;');

}

function CloseErrorPopUp(){
	document.getElementById('jsscripterrorId').setAttribute('style','display:none;');
}

function openPopRF(txtId,childObj,parentObj){
	var filterId='active_be_parent';
	var txtValue; 
	var leftMargin= parseInt((screen.availWidth/2) - (1000/2));
	var topMargin = parseInt((screen.availHeight/2) - (600/2));
	
	txtValue = encodeURIComponent(document.getElementById(txtId).value);
	

	var baseURL = "SearchAndLink?txt="+txtId+"&parentName="+parentObj+"&childName="+childObj+"&isLookUp="+childObj+"&filterId="+filterId+"&searchLookUpStr="+txtValue+"&isFromQV=true";
	window.open(baseURL ,"lookup","status = 1,height =600, width = 1000,left= "+leftMargin+",top="+ topMargin+", resizable = yes,scrollbars=no");
}


function setLookUpField(elmId,lkpId,lkpName){
	try{
		document.getElementById(elmId).value=lkpName;
		if(elmId && elmId.indexOf('name__c') != -1){
			document.getElementById(affectedServiceHidden).value=lkpId;
			if(affectedServiceId){
				var rfTooltipIcon = document.getElementById('rf-tooltip'+affectedServiceId);
				rfTooltipIcon.setAttribute('id', 'tooltip');
			}
			createTooltipSpan(lkpId,orgNamespace+'BMC_BaseElement__c');
			affectedServiceId = lkpId;
			isWrongValueSelected=false;
			isCorrectLookUpValueSelected=true;
			makeServStatusReq();
    		setTabUnsavedChanges();
		}
	}catch(err){}
}
function setMandatoryFieldValue(customField, id) {}
function getHTMLInputID(key){}
function callTypeAhead( object, selectedObjName, event, selectedFieldAPIName ) {
	referencedObjName = selectedObjName;
	isCorrectLookUpValueSelected=false;
	isWrongValueSelected=false;
	currentConsole = 'serviceOutage';
	if(object && object.value.length==0)
		document.getElementById(affectedServiceHidden).value='';

	if(selectedObjName == 'BMC_BaseElement__c'){
		queryData(object, selectedObjName , event,  '', selectedFieldAPIName );
	}
}

function getFilterCondition(isForLookup, lkpObject, lookupType, tempVar, txtId) {
	if(lkpObject == 'BMC_BaseElement__c' || lkpObject == 'BMC_BusinessService__c'){
		return escape('Class__c = \'BMC_BusinessService\' AND MarkAsDeleted__c=false');
	}
}
function setDivPosition(obj){ 
	var rtn=[obj.offsetLeft,obj.offsetTop];
	var topOffset;
	while(obj.offsetParent!=null){
		var objp=obj.offsetParent; 
		rtn[0]+=objp.offsetLeft-objp.scrollLeft; 
		topOffset = objp.offsetTop-objp.scrollTop;
		if(topOffset < 0)
			topOffset = 0; 
		rtn[1]+=topOffset;
		obj=objp;
	}
 return rtn;
}
function displayNone(tooltip){
	if(tooltip && tooltip.style.display=='inline'){
		tooltip.style.display='none';
	}
}
function hideTooltip(tooltipDom){
	var tooltip = document.getElementById('rf-tooltip'+affectedServiceId);
	if(tooltipDom && tooltipDom.value!=''){
		setAutoValueForServiceOutage('autocompleteDiv');
		if(isWrongValueSelected){
			displayNone(tooltip);
		}
		if(!isCorrectLookUpValueSelected){
			displayNone(tooltip);
		}
	}else if(tooltipDom && tooltipDom.value==''){
		displayNone(tooltip);
		isWrongValueSelected=false;
	}
}
var userTooltip;
function createTooltipSpan(elmId,referenceTo){
	try{
		var rfTooltipIcon;
		
		rfTooltipIcon = document.getElementById('tooltip');
		rfTooltipIcon.setAttribute('id', 'rf-tooltip' + elmId);
		rfTooltipIcon.setAttribute('rf-referenceId', elmId + '_lkid');
		rfTooltipIcon.setAttribute('rf-referenceTo', referenceTo);
		if( userLanguage && userLanguage == 'iw' ) {
			rfTooltipIcon.setAttribute('class','d-icon-comment_text rfDPL-glyph-flipped rfDPLNextIcon rfDefaultCursor rf-float-right marginTop5px');
		}else{
			rfTooltipIcon.setAttribute('class','d-icon-comment_text rfDPL-glyph-flipped rfDPLNextIcon rfDefaultCursor');
		}
		rfTooltipIcon.setAttribute('style','display:inline');

		rfTooltipIcon.addEventListener('mouseover', function(ev) {
			var refElem = document.getElementById('rf-tooltip'+elmId);
			var spanTarget = ev.target;
			var refId = spanTarget.getAttribute('rf-referenceId');
			var refTo = spanTarget.getAttribute('rf-referenceTo');
			var recId = elmId;
			if (typeof recId != 'undefined' && recId !== '' && recId !== '000000000000000') {
				if (typeof userTooltip === 'undefined') {
					userTooltip = Ext.create('Ext.tip.ToolTip', {
							target: spanTarget.id,
						anchor: 'left',
						shadow: false,
						autoWidth: true,
						autoHide: false,
						baseCls: 'rfDPL-tooltip-container',
						bodyCls: 'rfDPL-tooltip-body',
						html: null
						//renderTo: parentContainerId
					});
					userTooltip.on('show', function(){
						var timeout;
						userTooltip.getEl().on('mouseout', function(){
							timeout = window.setTimeout(function(){
								userTooltip.hide();
							}, 500);
						});
						userTooltip.getEl().on('mouseover', function(){
							window.clearTimeout(timeout);
						});
						Ext.get(userTooltip.target).on('mouseover', function(){
							window.clearTimeout(timeout);
						});
						Ext.get(userTooltip.target).on('wheel', function(){
							userTooltip.hide();
						});
						Ext.get(userTooltip.target).on('mouseout', function(){
							timeout = window.setTimeout(function(){
								userTooltip.hide();
							}, 500);
						});
					});
				}else {
					userTooltip.setTarget(spanTarget.id);
				}
				if(refTo.indexOf('BMC_BaseElement__c') != -1){
					alreadySelectedRecordId = recId;
					eval(orgNamespace.replace("__","")).ConsoleRemoteActions.getObjectBubbleInfo( recId,'BMC_BaseElement__c','ConsoleCILookup',function(result, event){
					if(event.status) {
						if (result != null && result != '') {
							var pageName = 'CMDBManager';
							result['recId'] = recId;
							result['pageName'] = pageName;
							userTooltipData = result;
							userTooltip.update(getTooltipHtml(userTooltipData));
							userTooltip.show();
						}
					} else if (event.type === 'exception') {
						alert(event.message);
					}
				}, {escape:true});
				}
			}
		});
	}catch(err){
		console.log(err);
	}
}

function getTooltipHtml(userDetail) {
	var htmlStr = '';
	if (typeof userDetail !== 'undefined' && typeof userDetail.oblectFieldLabels !== 'undefined' && userDetail.displayFieldLabels !== 'undefined') {
		var delimiter = String.fromCharCode(172);
		if(userDetail['pageName'] != null && userDetail['pageName'] == 'CMDBManager')
			delimiter = 'ф';
		var displayLabels = userDetail.displayFieldLabels.split(delimiter);
		var apiNames = userDetail.oblectFieldLabels.split(";");
		var isFormulaHTMLFormatted = userDetail.isFormulaHTMLFormatted.split(',');
		var contentHtml = '<table><tbody>';
		var isPhotoSelected = false;
		for (var i = 0; i < apiNames.length; i++) {
			var apiName = apiNames[i];
			if (apiName === 'SmallPhotoUrl') {
				isPhotoSelected = true;
			} else if (apiName !== '' && typeof userDetail[apiName] !== 'undefined' && userDetail[apiName] !== '') {
				if(isFormulaHTMLFormatted[i].toLowerCase() == 'true')
					userDetail[apiName] = RemedyForceHTMLProcessor.htmlDecoder(userDetail[apiName]);
				if(apiName == 'Name__c' || apiName == 'Name' || apiName.toLowerCase() == orgNamespace.toLowerCase()+'name__c'){
					let headerText = '<span>' + (userDetail[apiName]) + '</span>';
					if (typeof userDetail['pageName'] !== 'undefined') {
						var pageName;
						if(isLightningExperience == 'true'){
							pageName = '/one/one.app#/alohaRedirect/apex/' + orgNamespace + userDetail['pageName'];
						} else {
							pageName = userDetail['pageName'];
						}
						headerText = '<a href="#" class="CIlookupAnchorTag" onclick="window.open(\'' + pageName + '?cmdbRecordId=' + userDetail['recId'] + '&isReadOnly=true\',\'CMDB' + userDetail['recId'] + '\') " >' + (userDetail[apiName]) + '</a>';
					}
					contentHtml += '<tr><th>' + headerText + '</th></tr>';
					contentHtml += '<td colspan="2"><hr></td></tr>';
				} else{
					contentHtml += '<tr><td valign="top">' + displayLabels[i] + '</td><td class="rfDPL-tooltip-content-td rfDPL-tooltip-content-anchor-tag-td longNameEllipsis">' + ((userDetail[apiName]).replace(/\\n|\\r\\n|\\r/g, '<br/>')) + '</td></tr>';	
				  }
				}
		}
		contentHtml += '</tbody></table>';
		if (isPhotoSelected) {
			htmlStr += '<table class="rfDPL-tooltip-mainTable"><tbody><tr>';
			htmlStr += '<td class="rfDPL-tooltip-image-td"><img src="' + userDetail['SmallPhotoUrl'] + '" class="rfDPL-tooltip-icon" /> </td>';
			htmlStr += '<td class="rfDPL-tooltip-content-td">' + contentHtml + '</td>';
		} else {
			htmlStr += contentHtml;
		}
	}
	return htmlStr;
}

function showExpansionWindow(fieldId,headerText){
	var editorpopup;
	var ScreenWidth = 670;
	var ScreenHeight = 480;
	var WinTop = parseInt((screen.height - ScreenHeight)/2);
	var WinLeft = parseInt((screen.width - ScreenWidth)/2);
	
	editorpopup = window.open('/apex/'+orgNamespace+'AddNoteTextEditor?from=textarea&noteFldId='+fieldId,'editorpopup','toolbar=no,directories=no,menubar=no,resizable=yes,scrollbars=yes,titlebar=no,Width='+ScreenWidth+'px,Height='+ScreenHeight+'px,left='+WinLeft+',top='+WinTop+',status=no');
	if (editorpopup)
		editorpopup.focus();
}
function setIsPopUpDisplayed(bVal){}
function renderAddNoteButton(){}
function GetMessageBox( baseCls ) {
	if(WinMsg == null){
		WinMsg = Ext.create('Ext.window.MessageBox');
	}		
	WinMsg.baseCls = baseCls;
	return WinMsg;
}

function showCloseWarning(message) {
	Ext.Msg.defaultButton = 2;
	Ext.Msg.baseCls= 'bmc-message';
	Ext.Msg.show({
		title:ConsoleServiceOutageDetail.Labels.Confirm_Action,
		msg: message,
		buttons: Ext.Msg.YESNO,
		buttonText: { yes: ConsoleServiceOutageDetail.Labels.Yes, no: ConsoleServiceOutageDetail.Labels.No },
		fn:  function(btn){
			if (btn == 'yes'){
				if(clickedOnceSO){
					var psoId=getblackoutId();
					psoId = psoId.substring(0, psoId.length - 3);
					if(window.parent && window.parent.TabPanel){
					window.parent.changeTabTitle( tabId, ConsoleServiceOutageDetail.Labels.ServiceOutageRecordPrefix + ': '+ applyEllipsis(getName()));
						reloadPageFields();
					}
				}else if(isToAskConfirmation){
					document.getElementById(CnfrmSaveChkBxId).checked=true;
					getSave();
				}
			}
		},
		icon: Ext.MessageBox.WARNING
	});
	return false; //always return false
}
function handleElemEvent(){
	var allInputElems = document.getElementsByTagName("input") ;			
	for(var i = 0; i < allInputElems.length ; i++){				
		addEvent(allInputElems[i],'change',setTabUnsavedChanges);
	}
	
	var allTextAreaElems = document.getElementsByTagName("textarea") ;				
	for(var i = 0; i < allTextAreaElems.length ; i++){
		addEvent(allTextAreaElems[i],'change',setTabUnsavedChanges);
	}	
	
}

function setTabUnsavedChanges(){
	if(!clickedOnceSO){
		clickedOnceSO = true;
		if(window.parent.TabPanel && window.parent.TabPanel != null && typeof(window.parent.TabPanel) != 'undefined') {
			if(window.parent.TabPanel.getActiveTab() != null && typeof(window.parent.TabPanel.getActiveTab()) != 'undefined') {
				var currentTab = window.parent.TabPanel.getActiveTab() ;
				var dirtyTitle = currentTab.title;
				if(!dirtyTitle.startsWith('*'))
				{
					dirtyTitle = '*' + dirtyTitle;
				}
				if(dirtyTitle.length > 16){
							dirtyTitle = dirtyTitle.substring(0,13).replace(/^\s+|\s+$/g,"")+'...';
				}
				
				window.parent.changeTabTitle( currentTab.id, dirtyTitle);
				window.parent.updateDirtyFlag( currentTab.id, true);
			}
		}
	}
}

function setTabsavedChanges(){
	var psoId=getblackoutId();
	if(window.parent.TabPanel && window.parent.TabPanel != null && typeof(window.parent.TabPanel) != 'undefined') {
		if(window.parent.TabPanel.getActiveTab() != null && typeof(window.parent.TabPanel.getActiveTab()) != 'undefined') {
			if(!clickedOnceSO){
				window.parent.changeTabTitle( tabId, ConsoleServiceOutageDetail.Labels.ServiceOutageRecordPrefix + ': '+ applyEllipsis(getName()));
				window.parent.updateDirtyFlag( tabId, false);
				clickedOnceSO = false;
				if(psoIdOnload=='' && psoId != null && psoId != ''){
					window.parent.changeTabItemId(psoId,tabId);
				}
			}
		}
	}
}

function applyEllipsis( titleName){
	if(titleName != null && titleName != '' ){ 
		if(titleName.length > 11){
			return titleName.substring(0,8).replace(/^\s+|\s+$/g,"")+'...';
		}else{
			return titleName;
		}
	}
}

function setAutoValueForServiceOutage(divId){
	if(currentConsole =='serviceOutage'){
		if(resultSetCategory){
			if(resultSetCategory.length==1){
				nameValue = resultSetCategory[0].Name;
				setLookUpField(currentField["id"],resultSetCategory[0].Id,nameValue);
				document.getElementById(divId).style.visibility='hidden';
			}else if(resultSetCategory.length==0){
				isWrongValueSelected = true;
			}
		}else{
			isWrongValueSelected = true;
		}
	}
}

function changePageSectionIcons() {
	try {
		var subHeaders = document.getElementsByClassName("pbSubheader tertiaryPalette");
	    if (subHeaders && subHeaders.length > 0) {
	    	var showHideSection = function(event) {
			    var elem = event.target;
			    var toggleSpan, h3Text;
			    var headerDiv = elem.parentNode;
			    if (headerDiv && headerDiv.children && headerDiv.children.length > 2) {
			    	if (elem.nodeName === 'SPAN') {
				    	toggleSpan = elem;
				    	h3Text = headerDiv.children[2];
				    } else if (elem.nodeName === 'H3') {
				    	toggleSpan = headerDiv.children[0];
				    	h3Text = elem;
				    }
				    if (toggleSpan.className.indexOf("d-icon-angle_right") > -1) {
				    	toggleSpan.className = "d-icon-angle_down rfDPL-toggle-icon";
			        } else {
			        	toggleSpan.className = "d-icon-angle_right rfDPL-toggle-icon";
			        }
		            var refImg = document.getElementById(toggleSpan.getAttribute('refImageId'));
		            twistSection(refImg);
		            toggleSpan.title = refImg.title;
		            h3Text.title = refImg.title;
			    }
			};
	    	var subHeader, toggleImg, newIcon, h3header, underlineDiv;
	        for (var index = 0; index < subHeaders.length; index++) {
	            subHeader = subHeaders[index];
	            toggleImg = subHeader.getElementsByTagName('IMG');
	            h3header = subHeader.getElementsByTagName('H3');
	            if (toggleImg && toggleImg.length > 0) {
	                newIcon = document.createElement('SPAN');
					newIcon.title =  toggleImg[0].title;
					newIcon.tabIndex = toggleImg[0].tabIndex;
					newIcon.id = 'span_' + toggleImg[0].id;
					newIcon.setAttribute('refImageId', toggleImg[0].id);
					newIcon.name = toggleImg[0].name;
					newIcon.addEventListener('click', showHideSection);
					newIcon.addEventListener('keypress', function(event) {
					    if (event.keyCode=='13') showHideSection(event);
					});
				    newIcon.className = "d-icon-angle_down rfDPL-toggle-icon";
					subHeader.insertBefore(newIcon, toggleImg[0]);
					toggleImg[0].style.display = "none";
					
					if (h3header && h3header.length > 0) {
						h3header[0].title =  toggleImg[0].title;
						h3header[0].setAttribute('refImageId', toggleImg[0].id);
						h3header[0].className += ' rfDPL-actionable ';
						h3header[0].addEventListener('click', showHideSection);
						h3header[0].addEventListener('keypress', function(event) {
						    if (event.keyCode=='13') showHideSection(event);
						});
		            }
	            }
	            underlineDiv = document.createElement('DIV'); 
	            underlineDiv.className = 'rfDPL-section-underline';
	            subHeader.appendChild(underlineDiv);
	        }
	    }
	}  catch (ex) {
		console.log(ex);
	} 
}

function OpenHelppage()
{
	if(wikiUrl != null && wikiUrl != undefined && wikiUrl !='')
		window.open(wikiUrl,false,'width='+screen.width+',height='+screen.height+',resizable = 1,scrollbars=yes,status=1,top=0,left=0',false);
}

function returnLabel(label,labelFor) {		
	if(!isRFHotkeysDisabled) {
		if(labelFor=='N')
			return label + ' (Ctrl+Alt+N)';
		else if(labelFor=='S')	
			return label + ' (Ctrl+Alt+S)';
		else if(labelFor=='A')	
			return label + ' (Ctrl+Alt+A)';	
	} else {
		return label ;	 			
	}
}

function makeAutoGenerateBlank(domValue){
	if(domValue && domValue.value==ConsoleServiceOutageDetail.Labels.Auto_Generate){
		domValue.value='';
	}
}

function makeAutoGenerate(domValue){
	var psoId=getblackoutId();
	if(!psoId && domValue && domValue.value==''){
		domValue.value=ConsoleServiceOutageDetail.Labels.Auto_Generate;
	}
}


//for shortcuts
document.onkeyup = function(e) {
	if(!isRFHotkeysDisabled){
		e = e || window.event; // because of Internet Explorer quirks...
		if(typeof(e) == 'undefined' || e == 'null')
			return;	
		k = e.which || e.charCode || e.keyCode; // because of browser differences...
		//only they key combinations are allowed rest are ignored
		if ((!(e.ctrlKey && e.altKey)) || ((k != 78) && (k != 83) && (k != 84) && (k != 65) && (k != 87) && (k != 76) && (k!=73) 
			&& (k!=85) && (k!=75) && (k!=80) && (k!=72) && (k!=82) && (k!=66) && (k!=67) && (k!=68) && (k!=97) 
			&& (k!=98) && (k!=99) && (k!=100) && (k!=101) && (k!=102) && (k!=103) && (k!=104) && (k!=105)
			&& ((k-48)>=count) && (!((k >47) && ((k <= count+48) || (k <= count+50 && Ext.isSafari)))))) 
			return; 
		if (k == 78 && e.altKey && e.ctrlKey){	//Ctrl+Alt+N - New
			var newbutton = document.getElementById('newId');
			if(typeof(newbutton) != 'undefined' && newbutton != null)
				newbutton.click();
			
			return;
		}
		if(k == 83 && e.altKey && e.ctrlKey){	//Ctrl+Alt+S - Save
			var savebutton =  document.getElementById('saveId');
			if(typeof(savebutton) != 'undefined' && savebutton != null)
				savebutton.click();
			return;
		}
		if (k == 65 && e.altKey && e.ctrlKey){	//Ctrl+Alt+A - Open Actions menu Tools
			var actionbutton = document.getElementById('actionButton');
			if(typeof(actionbutton) != 'undefined' && actionbutton != null)
				actionbutton.click();
			return;
		}
	}
}
