
if (window.addEventListener) // W3C standard
{
  window.addEventListener('load', AddTextareaEditorButton, false); // NB **not** 'onload'
  window.addEventListener('resize', adjustFSLinkDiv, false);
} 
else if (window.attachEvent) // Microsoft
{
  window.attachEvent('onload', AddTextareaEditorButton);
  window.attachEvent('onresize', adjustFSLinkDiv);
}
var incidentMatchOnImact = false;
var incidentMatchOnUrgency = false;
var incidentMatchOnStatus = false;
var isConsoleUI=true;
var staffField = getHTMLInputID(orgNamespace+customStaffApi);
if(staffField!=null && typeof(staffField)!='undefined' && staffField!='')
	staffId=staffField;
var isRfconsole=window.parent.isRFConsoleDetailForm;
var isByTemplate = false;
var isPageMessage = false;
var isErrorMessage = false;
var alreadySelectedRecordId = '000000000000000';
var userTooltipData;

var autoClassificationGridColumn;
var AutoClassificationGridStore;
var AutoClassificationWindowItems;

//current page form layout id is differ with parent page form layout id then need update parent page form layout if
if(typeof(formLayoutId) != 'undefined' && formLayoutId !== window.parent.formLayoutId)
{
	window.parent.formLayoutId = formLayoutId;
	window.parent.previousFormLayoutId = formLayoutId;
}
 //function for shortcuts
if(parent.location != window.location) {
	document.onkeydown = function(e) {
	if(typeof(e) == 'undefined')
		e = window.event;
	var rfConsoleWin, consoleWin, count;
	count = 0;
	if(isRfconsole == 'true') {
		rfConsoleWin = window.parent.parent ;
		count = window.parent.parent.count ;
	}
	consoleWin = window.parent ;
		if(!window.parent.isRFHotkeysDisabled){
			window.parent.handleShortcuts(e, rfConsoleWin, consoleWin, count,isRfconsole,'newId',document.activeElement);                   
		}
	};
}
var readAccessClassIds='',readAccessRBAClassIds='';
var parentWindow=window.parent;
if( parentWindow && parentWindow.parent && typeof(parentWindow.parent.readAccessClassIds)!='undefined'){
	readAccessClassIds=parentWindow.parent.readAccessClassIds;
}
if( parentWindow && parentWindow.parent && typeof(parentWindow.parent.readAccessRBAClassIds)!='undefined'){
	readAccessRBAClassIds=parentWindow.parent.readAccessRBAClassIds;
}
 var ChangeVisibilityVar;
   
function ShowInlineSaveMessage(){
   CloseSavePopUp();
   var SaveMessageDiv=document.getElementById('SaveMessageDiv');
   if(SaveMessageDiv!=null && SaveMessageDiv!='undefined'){
	    var PanelWidth,divWidth,leftAlign;
	    PanelWidth=window.parent.document.getElementById('detailViewChildPanelId').clientWidth;
	    SaveMessageDiv.style.display = "table";
		divWidth = SaveMessageDiv.clientWidth;
		SaveMessageDiv.style.display = "none";
		
	    if(PanelWidth!=null && PanelWidth!='undefined' && divWidth!=null && divWidth!='undefined' )
			leftAlign = parseInt((PanelWidth/2)-(divWidth/2)-35);
		SaveMessageDiv.setAttribute('style','display: table; position: absolute; left: '+ leftAlign +'px; margin-top: 50px;z-index:2;');
		ChangeVisibilityVar = setTimeout(function(){
			CloseSavePopUp();
		}, 3000);
   }
}

function CloseSavePopUp(){
	document.getElementById('SaveMessageDiv').setAttribute('style','display:none;');
}

 function setIsPopUpDisplayed(bVal)
{}
function renderAddNoteButton(){}

function AddTextareaEditorButton()
{	
	try {
	var txtAreas = document.getElementsByTagName("textarea");
  	var len = txtAreas.length;
  	for(i=0;i<len;i++){ 
		var obj = txtAreas[i];
		if (typeof window.parent.consoleTextareaVisibleLines !== 'undefined' && window.parent.consoleTextareaVisibleLines !== '') {
			obj.rows = window.parent.consoleTextareaVisibleLines;
		}
		obj.onkeyup = function(){LimitText(this);}; 
		if(obj.parentNode != null && obj.style.visibility != 'hidden'){
			var tr = null;
		var parentTd = obj.parentNode;
		tr = obj.parentNode;
		var parentTable = obj.parentNode;
		while (parentTable.nodeName != 'TABLE') {
		    if (parentTable.parentNode.nodeName == 'TD' && parentTd.nodeType != 'TD') {
		        parentTd = parentTable.parentNode;
		    }
		    if (parentTable.parentNode.nodeName == 'TR' && tr.nodeType != 'TR') {
                tr = parentTable.parentNode;
            }
			parentTable = parentTable.parentNode;
		}
		if (parentTd) {
            parentTd.className = 'rf-multiple-line-field';
        }
		if (parentTable) {
			var firstTr = parentTable.rows[0];
			if (firstTr && firstTr.children && firstTr.children.length > 0) {
				firstTr.children[0].colSpan = 2;
			}
		}

		if(tr != null) {
       	var btn = document.createElement('SPAN');
    		btn.type = "button";
  	   	btn.className = "d-icon-align_left rf-editor-icon rfdplIconFontSize";
		btn.title = window.parent._ServerLabels.ViewEditFieldValue;
        var editorpopup;
        var td = tr.insertCell(-1);
        var ScreenWidth = 670;
        var ScreenHeight = 480;
        var WinTop = parseInt((screen.height - ScreenHeight)/2);
        var WinLeft = parseInt((screen.width - ScreenWidth)/2);
        td.className = "textEditorTD";
  			btn.onclick = (function(id) { 
  				return function() { 
                editorpopup = window.open('/apex/'+orgNamespace+'AddNoteTextEditor?from=textarea&noteFldId='+id,'editorpopup','toolbar=no,directories=no,menubar=no,resizable=yes,scrollbars=yes,titlebar=no,Width='+ScreenWidth+'px,Height='+ScreenHeight+'px,left='+WinLeft+',top='+WinTop+',status=no');
      			 if (editorpopup)
                 editorpopup.focus();
				 }; 
  			}(txtAreas[i].id));
  			td.appendChild(btn);
    		}
    	}
    }
	} catch (ex) {
		console.log(ex);
	} 
    updateDateIcon();
}

function LimitText(limitField)
{                                      
	var maxlength = (limitField.getAttribute && limitField.getAttribute("maxLength")) || null;
	if(!maxlength) {
		var attrs = limitField.attributes;
		var length = attrs.length;
		for(var i = 0; i < length; i++) {
			if(attrs[i].nodeName == "maxLength") {
				maxlength = attrs[i].nodeValue;
				break;
			}
		}
	}
   if (limitField.value.length > maxlength) {
   limitField.value = limitField.value.substring(0, maxlength);
   }
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
		                        
		                        allchildren[1].title = window.parent._ServerLabels.Insert+ ': '+tooltip;
		                        var sapnIcon = document.createElement("SPAN") ;
		                        if (isDateOnly) {
		                            sapnIcon.className = 'd-icon-calendar rfdplIconFontSize' ;
		                        } else {
		                            sapnIcon.className = 'd-icon-calendar_clock_o rfdplIconFontSize' ;
		                        }
		                        sapnIcon.id = 'DateIcon-'+ window.parent._ServerVariables.ObjectName ;
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

function adjustFSLinkDiv() {
	var pageMsg = document.getElementById('thpage:theForm:pageMessage');
	var collisionMsg = document.getElementById('thpage:theForm:collisionMessage');
    var ispageMessagePresent = (pageMsg!=null && pageMsg!='undefined' && pageMsg.hasChildNodes()) || (collisionMsg!=null && collisionMsg!='undefined' && collisionMsg.hasChildNodes());
    var errorMsg = document.getElementById('errorDescId');
    isErrorMessage = (errorMsg!=null && errorMsg!='undefined' && errorMsg.hasChildNodes());
	
	if(ispageMessagePresent && !isErrorMessage){
			isPageMessage = true;
		}
		else{
			isPageMessage = false;
		}
	var calculatedMargin = document.getElementById('topmenu').clientHeight - 35;
	document.getElementById('thpage:theForm:thePAgeBlock').setAttribute("style","margin-top:" + calculatedMargin.toString() + "px");
	
	var calculatedTop = document.getElementById('topmenu').clientHeight;
	applyMarginToErrorMessage();
	for(var k in pageSectionIdMap) {
		if(pageSectionIdMap[k] != 'srdFrameDiv') /* Service Request Details section does not have this div */
		{document.getElementById('div'+pageSectionIdMap[k]).style.top = "-"+calculatedTop.toString()+"px";}
	}
}


// ConsoleCommonFunction.js Code has been moved here and This ConsoleCommonFunction.js file have been deleted

var lookupObject;
var NewLookUpType = '';
var filterClause = '';
// oldRecordId will available incase of clone request
var oldRecordId = '';
/**
 * This function check for various events of the components and set the dirty flag.
 **/
function handleElemEvent(){   			   
	var isCloneRequest = window.parent.isCloneRequest ;
	if(isCloneRequest != null && typeof(isCloneRequest) != 'undefined' && !isCloneRequest)
	{
		window.parent.clickedOnce= false;
	}	

	var allInputElems = document.getElementsByTagName("input") ;			
	for(var i = 0; i < allInputElems.length ; i++){				
		addEvent(allInputElems[i],'change',setTabUnsavedChanges);
	}
	
	var allTextAreaElems = document.getElementsByTagName("textarea") ;				
	for(var i = 0; i < allTextAreaElems.length ; i++){
		addEvent(allTextAreaElems[i],'change',setTabUnsavedChanges);
	}	
	
	var allPicklistElems = document.getElementsByTagName("select") ;			
	for(var i = 0; i < allPicklistElems.length ; i++){				
		if(allPicklistElems[i].id !== "layoutSelectID")
		{
			addEvent(allPicklistElems[i],'change',setTabUnsavedChanges);
		}
		else
		{
			// Multiple form layout picklist on change event.
			addEvent(allPicklistElems[i],'change', setTabUnsavedChangesForLayoutType);
		}
	}
	
	//Check & mark unsaved changes for SF Rich Text editor instances
	 if(typeof(CKEDITOR)!='undefined' && typeof(CKEDITOR)!=null )
	 {
		 for (var i in CKEDITOR.instances) {
				CKEDITOR.instances[i].on("instanceReady", function(){
					if(i.endsWith(firstElement) && isFirstElementRichTextArea)
					{
						CKEDITOR.instances[i].focus();
					}  
					this.document.on("keyup", function(e){
						if (window.parent.clickedOnce!=true && CKEDITOR.instances[i].checkDirty()) {
							setTabUnsavedChanges();
						}
					});
			   });
				
				CKEDITOR.instances[i].on("paste", function(e){  
					if (window.parent.clickedOnce!=true) {
						setTabUnsavedChanges();
					}
				});
				
		 }       
	 }
}
// IE 11 not support endsWith. So if startsWith not then need to create a prototype
if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(suffix) {
	    return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}
/**
 * if urgency lookup field is present on the form, convert it to picklist field
 **/
function createUrgencyPickList(isEditableFlag){
	if(isEditableFlag == 'false')
		return;
	else {
	try{
		var urgencyFieldName = getHTMLInputID(orgNamespace+'FKUrgency__c');
		
		if(urgencyFieldName!=null && urgencyFieldName!='undefined' && urgencyFieldName!=''){
			var urgencyLookupField  = document.getElementById(urgencyFieldName);
			
			if(urgencyLookupField!=null && urgencyLookupField!='undefined' && urgencyLookupField!=''){
				
				var urgencySelect = document.createElement("select");
				urgencySelect.setAttribute("name", "urgencySelectId");
				urgencySelect.setAttribute("id", "urgencySelectId");
				urgencySelect.setAttribute("title",urgencyHelpText);
				urgencySelect.className = "rf-single-line-field";
				//on change function
				urgencySelect.onchange = function() {
					setUrgencyValue("urgencySelectId");
					if (incidentMatchOnUrgency) 
						smartSuggestionsHandler();

					if(currentConsole == 'Incident' && typeof(dynamicFieldsHandler) != 'undefined'){
						dynamicFieldsHandler(orgNamespace+'FKUrgency__c','reference');						
					}	
				};
				
				// this function currently give error on changeRequest and release console but once disableDiv func move form console page to js it will be resolve.
				//onblur for checking mandatory field 
				urgencySelect.onblur = function() {disableDiv(typeAheadDivId, 'picklist', this);};
				
				urgencySelect.options[urgencySelect.options.length] = new Option(window.parent._ServerLabels.None1, '');
				var urgencySelectedIndex='';
				
				var urgencyObj =null;
				urgencyFieldVal = document.getElementById(urgencyLookupId).value;
				
				if((typeof window.parent.isRFConsoleDetailForm)!='undefined' && window.parent.isRFConsoleDetailForm=='true'){
					urgencyObj = window.parent.Ext.JSON.decode(window.parent.parent._RFServerValues.urgencyMap,true);
				}else{
					urgencyObj = window.parent.Ext.JSON.decode(window.parent._ServerVariables.urgencyMap,true);
				}
				
				
				// iterate urgency map and populate urgency piclist field select options
				for(var i=0; i<urgencyObj.Response.length;i++) {
					
					
					if(urgencyFieldVal!=null && urgencyFieldVal!='undefined'&& urgencyFieldVal!='' && urgencyFieldVal==urgencyObj.Response[i].id){
						
					
						urgencySelectedIndex = urgencySelect.options.length;
						
					  }
					 urgencySelect.options[urgencySelect.options.length] = new Option(decodeURIComponent(urgencyObj.Response[i].name.replace(/\+/g,  " ")), urgencyObj.Response[i].id);
				}
				
				if(urgencySelectedIndex!=''){
					urgencySelect.selectedIndex = urgencySelectedIndex;
				}
				
				
				var parentEl = urgencyLookupField.parentNode;
				
				if(parentEl!=null && parentEl!='undefined' && parentEl!=''){
					var list= urgencyLookupField.parentNode.childNodes;
					
					if(list!=null && list!='undefined' && list!=''){
						for(var i=0;i<list.length;i++){
							
							list[i].style.display = 'none';
						}
						
						parentEl.parentNode.appendChild(urgencySelect);
					}
				}
			}
		}
	}catch(err){
	}
	}
}

/**
 * if impact lookup field is present on the form, convert it to picklist field
 **/
function createImpactPickList(isEditableFlag){
	if(isEditableFlag == 'false')
		return;
	else {
	try{
		var impactFieldName = getHTMLInputID(orgNamespace+'FKImpact__c');
		
		if(impactFieldName!=null && impactFieldName!='undefined' && impactFieldName!=''){
		
			var impactLookupField  = document.getElementById(impactFieldName);
			
			if(impactLookupField!=null && impactLookupField!='undefined' && impactLookupField!=''){
				
				var impactSelect = document.createElement("select");
				impactSelect.setAttribute("name", "impactSelectId");
				impactSelect.className = "rf-single-line-field";
				impactSelect.setAttribute("id", "impactSelectId");
				impactSelect.setAttribute("title", impactHelpText);
				//on change function
				impactSelect.onchange = function() {
					setImpactValue("impactSelectId");
					if (incidentMatchOnImact) 
						smartSuggestionsHandler();

					if(currentConsole == 'Incident' && typeof(dynamicFieldsHandler) != 'undefined'){
						dynamicFieldsHandler(orgNamespace+'FKImpact__c','reference');						
					}	
				};
				
				// this function currently give error on changeRequest and release console but once disableDiv func move form console page to js it will be resolve.
				//onblur for checking mandatory field 
				impactSelect.onblur = function() {disableDiv(typeAheadDivId, 'picklist', this);};
				
				impactSelect.options[impactSelect.options.length] = new Option(window.parent._ServerLabels.None1, '');
				var impactSelectedIndex='';
				
				var impactObj =null;
				impactFieldVal = document.getElementById(impactLookupId).value;
				
				if((typeof window.parent.isRFConsoleDetailForm)!='undefined' && window.parent.isRFConsoleDetailForm=='true'){
					impactObj = window.parent.Ext.JSON.decode(window.parent.parent._RFServerValues.impactMap,true);
				}else{
					impactObj = window.parent.Ext.JSON.decode(window.parent._ServerVariables.impactMap,true);
				}
				
				// iterate impact map and populate impact piclist field select options
				for(var i=0; i<impactObj.Response.length;i++) {
				
					if(impactFieldVal!=null && impactFieldVal!='undefined'&& impactFieldVal!='' && impactFieldVal==impactObj.Response[i].id){
						
						impactSelectedIndex = impactSelect.options.length;
						
					  }
					 impactSelect.options[impactSelect.options.length] = new Option(decodeURIComponent(impactObj.Response[i].name.replace(/\+/g,  " ")), impactObj.Response[i].id);
				}
				
				if(impactSelectedIndex!=''){
					impactSelect.selectedIndex = impactSelectedIndex;
				}
				
				
				var parentEl = impactLookupField.parentNode;
				
				if(parentEl!=null && parentEl!='undefined' && parentEl!=''){
					var list= impactLookupField.parentNode.childNodes;
					
					if(list!=null && list!='undefined' && list!=''){
						for(var i=0;i<list.length;i++){
							list[i].style.display = 'none';
						}
						
						parentEl.parentNode.appendChild(impactSelect);
					}
				}
			}
		}
	}catch(err){
	}
	}
}

/**
 * if status lookup field is present on the form, convert it to picklist field
 **/

/**
 * method - createStatusPicklistForLayouts
   purpose - this method shows union of layout specific and default status values for a module.
 **/

 function createStatusPicklistForLayouts(statusObj){
	var result = [];		
	if(JSON.stringify(layoutStatusValues) != '{}' && (typeof(layoutStatusValues['showAllStatus']) == 'undefined' || layoutStatusValues['showAllStatus'] != true)){			
		window.parent.parent.layoutStatusMap[layoutSFId] = layoutStatusValues;				
		for(var i=0; i<statusObj.length ; i++){
			var stat = statusObj[i];
			if(stat.id == currentStatusValue && layoutStatusValues[stat.id] == undefined){
				result.push(stat);
			}else if((stat.isDefault || stat.id == '-') && layoutStatusValues[stat.id] == undefined){
				result.push(stat);		
			}else if(layoutStatusValues[stat.id]){
				result.push(stat);
			}								
		}		
		return result;
	}	
	return statusObj;
}

function createStatusPickList(objName, isEditableFlag){
	if(isEditableFlag == 'false')
		return;
	else {
	try{
		var statusFieldName = getHTMLInputID(orgNamespace+'FKStatus__c');
		
		if(statusFieldName!=null && statusFieldName!='undefined' && statusFieldName!=''){
		
			var statusLookupField  = document.getElementById(statusFieldName);
			
			if(statusLookupField!=null && statusLookupField!='undefined' && statusLookupField!=''){
				
				var statusSelect = document.createElement("select");
				statusSelect.setAttribute("name", "statusSelectId");
				statusSelect.setAttribute("id", "statusSelectId");
				statusSelect.setAttribute("title", statusHelpText);
				statusSelect.className = "rf-single-line-field";
				//on change function
				statusSelect.onchange = function() {
					setStatusValue("statusSelectId");
					if (incidentMatchOnStatus) 
						smartSuggestionsHandler();

					if(currentConsole == 'Incident' && typeof(dynamicFieldsHandler) != 'undefined'){
						dynamicFieldsHandler(orgNamespace+'FKStatus__c','reference');
					
					}	
				};
				
				// this function currently give error on changeRequest and release console but once disableDiv func move form console page to js it will be resolve.
				//onblur for checking mandatory field 
				statusSelect.onblur = function() {disableDiv(typeAheadDivId, 'picklist', this);};
				
				statusSelect.options[statusSelect.options.length] = new Option(window.parent._ServerLabels.None1, '');
				var statusSelectedIndex='';
				
				var statusObj =null;
				statusFieldVal = document.getElementById(statusLookupId).value;
				
				if((typeof window.parent.isRFConsoleDetailForm)!='undefined' && window.parent.isRFConsoleDetailForm=='true'){
					statusObj = window.parent.Ext.JSON.decode(window.parent.parent._RFServerValues.statusMap,true);
					if(objName=='Incident'){
						var incStatusObj = statusObj.Response[0].incidentStatuses;
						statusObj = [];	
						statusObj = createStatusPicklistForLayouts(incStatusObj);						
					}else if(objName=='Task'){
						var taskStatusObj = statusObj.Response[1].taskStatuses;										
						statusObj = [];	
						statusObj = createStatusPicklistForLayouts(taskStatusObj);																	
					}else if(objName=='Problem'){
						statusObj = statusObj.Response[3].problemStatuses;
					}else if(objName=='changeRequest'){						
						var crStatusObj = statusObj.Response[2].changeStatuses;										
						statusObj = [];	
						statusObj = createStatusPicklistForLayouts(crStatusObj);	
					}else if(objName=='Release'){
						statusObj = statusObj.Response[4].releaseStatuses;
					}else if(objName=='Broadcast'){
						statusObj = statusObj.Response[5].broadcastStatuses;
					}	
				}else{
					statusObj = window.parent.Ext.JSON.decode(window.parent._ServerVariables.statusMap,true);
					statusObj = statusObj.Response;
				}
				
				//iterate status map and populate status piclist field select options
				for(var i=0; i<statusObj.length;i++) {
				
					if(statusFieldVal!=null && statusFieldVal!='undefined' && statusFieldVal!='' && statusFieldVal==statusObj[i].id){
						
						statusSelectedIndex = statusSelect.options.length;
						
					}
					
					 var stOption = new Option(decodeURIComponent(statusObj[i].name.replace(/\+/g,  " ")), statusObj[i].id);
					 
					 if(stOption.text=='-'){
						stOption.disabled = true;
						stOption.text='--------------------';
					 }
					
					 statusSelect.options[statusSelect.options.length] = stOption;
				}
				
				if(statusSelectedIndex!=''){
					statusSelect.selectedIndex = statusSelectedIndex;
				}
				
				var parentEl = statusLookupField.parentNode;
				
				if(parentEl!=null && parentEl!='undefined' && parentEl!=''){
					var list= statusLookupField.parentNode.childNodes;
					
					if(list!=null && list!='undefined' && list!=''){
						for(var i=0;i<list.length;i++){
							list[i].style.display = 'none';
						}
						
						parentEl.parentNode.appendChild(statusSelect);
					}
				}
			}
		}
	}catch(err){
	}
	}
}
/**
 * standard client id lookup field has three components i.e. user selector, user input id and lookup icon.
 * this method will hid the user selector.
 **/
var userTooltip;
function applyCustomDPLIconForDPL(){
	try{
		var allLookups = document.getElementsByClassName("lookupInput");
		for(var i = 0;i<allLookups.length;i++){
			var defaultLookupImg = allLookups[i].getElementsByTagName('IMG');
			var lookupInput = allLookups[i].getElementsByTagName('INPUT');			
			if(defaultLookupImg[0]) { //&& lookupValue != ""
				var customLkUpAnchor = defaultLookupImg[0].parentElement;
				customLkUpAnchor.className =  customLkUpAnchor.className + " d-icon-search lookupIcon rfdplIconFontSize ";
				customLkUpAnchor.removeChild(defaultLookupImg[0]);
			}
			if (lookupInput[0]) {
				lookupInput[0].addEventListener('focusout', function(ev){					
					var lookupInputDom;
					if(ev.target && ev.target.id){
						lookupInputDom = ev.target.id;
					var tooltipDom;
					var lookupfieldApiName = ev.target.getAttribute('rf-fieldApiName');					
					var lookupRefDom = document.getElementById(lookupInputDom+'_lkid');
					
					if(lookupRefDom){
						var lookupRefDomVal = lookupRefDom.value;											
						tooltipDom = document.getElementById('rf-tooltip'+lookupfieldApiName);
						if(tooltipDom){
							if(lookupRefDomVal == "" || lookupRefDomVal == "000000000000000"){
									tooltipDom.setAttribute('style','display:none');							
							}else{
									tooltipDom.setAttribute('style','display:inline');
								}
							}
						}
					}					
				});
				var referenceTo = lookupInput[0].getAttribute('rf-referenceto');
				var fieldApiName = lookupInput[0].getAttribute('rf-fieldapiname');
				
				/**
				 * This if block is to dislpay Autoclassification icon on Remedyforce console page in OOTB Categpry field. 
				 */
				 
				try{
					if (isAutoClassificationEnable && currentConsole == 'Incident' && inctype.toLowerCase() == 'incident' && window.parent.incidentTypeafterSave == 'Incident' && fieldApiName === (orgNamespace + 'FKCategory__c') && referenceTo === '[' +orgNamespace +'Category__c]') {
						var rfCongnitiveIcon = document.createElement('DIV');
						rfCongnitiveIcon.setAttribute('Id','rfCongnitiveIconId');						
						if(isCategoryAppliedFromBatch) {
							rfCongnitiveIcon.setAttribute('class','applied_by_auto_classification rfDPL-glyph-flipped rfDPLNextIcon rfDefaultCursor');
							rfCongnitiveIcon.setAttribute('title',window.parent._ServerLabels.AutoFillTooltip);
						} else {
							rfCongnitiveIcon.setAttribute('class','auto_classification_enable rfDPL-glyph-flipped rfDPLNextIcon rfDefaultCursor');
							rfCongnitiveIcon.setAttribute('title',window.parent._ServerLabels.SuggestedTooltip);
						}
						rfCongnitiveIcon.addEventListener('click', function(event) {
							var descField = document.querySelector('[rf-fieldApiName="' + orgNamespace + 'incidentDescription__c"]');
							var incidentDescription = (descField) ? descField.value : "";
							if(incidentDescription) {
								var params = {};
								params.incidentId = incidentId;
								params.layoutId = layoutid;
								eval(orgNamespace.replace("__","")).ConsoleRemoteActions.getClassificationsForCategory(incidentDescription, params, function(result, event){
									if(event.status) {
										var AutoClassificationWindow = Ext.getCmp('AutoClassificationWindow');
										if(!AutoClassificationWindow) {
											populateAutoclassificationGridColumn();
											populateAutoclassificationGridStore(result);
											generateAutoclassificationWindowItems();
											generateAutoclassificationModal();
										}
									}
								},{escape:false});
							}
						});

						allLookups[i].appendChild(rfCongnitiveIcon);
					}
				}catch(err){
					//do nothing
				}
				/**************************************************************************************************************************************/

				if (referenceTo === '[User]' || (referenceTo === '[Contact]') || (referenceTo === '[' +orgNamespace +'BMC_BaseElement__c]')) {
					var rfTooltipIcon = document.createElement('SPAN');
					rfTooltipIcon.setAttribute('id', 'rf-tooltip' + fieldApiName);
					rfTooltipIcon.setAttribute('rf-referenceId', lookupInput[0].id + '_lkid');
					rfTooltipIcon.setAttribute('rf-referenceTo', referenceTo);
					rfTooltipIcon.setAttribute('class','d-icon-comment_text rfDPL-glyph-flipped rfDPLNextIcon rfDefaultCursor');
					var lookupValueDom = document.getElementById(lookupInput[0].id + '_lkid');
					var lookupValue;
					if(lookupValueDom){
						lookupValue = lookupValueDom.value;
					}
					if(lookupValue == "" || lookupValue == "000000000000000"){
						rfTooltipIcon.setAttribute('style','display:none');
					}
					
					
					rfTooltipIcon.addEventListener('mouseover', function(ev) {
						var spanTarget = ev.target;
		         		var refId = spanTarget.getAttribute('rf-referenceId');
						var refTo = spanTarget.getAttribute('rf-referenceTo');
		         		var refElem = document.getElementById(refId);
		         		if (typeof refElem.value != 'undefined' && refElem.value !== '' && refElem.value !== '000000000000000') {
		         			var recId = refElem.value
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
		         			} else {
		         				userTooltip.setTarget(spanTarget.id);
		         			}
		         			
		         			var clientType = 'User';
							if(new RegExp('^'+"003").test(recId)){
		         				clientType = 'Contact';
		         			}
							if (recId === alreadySelectedRecordId) {
		         				userTooltip.update(getTooltipHtml(userTooltipData));
		         				userTooltip.show();
		         			} else if(refTo.indexOf('BMC_BaseElement__c') != -1){
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
		         			}else {
		         				alreadySelectedRecordId = recId;
			         			eval(orgNamespace.replace("__","")).ConsoleRemoteActions.getClientInfo( recId, clientType, '', function(result, event) {
									if (event.status) {
										if (result != '' && result != null) {
											console.log(result);
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
					allLookups[i].appendChild(rfTooltipIcon);
				}
			}
		}
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

function hideClientTypeSelector(userType){
	try{
		var clientField = document.getElementById(getHTMLInputID(userType));
		if (clientField != undefined && clientField != 'undefined' && clientField != '') {
			var clientLookupField  = document.getElementById(clientField.id+'_mlktp');
			if (clientLookupField != undefined && clientLookupField != 'undefined' && clientLookupField != '')
			clientLookupField.style.display = 'none';
				var link = document.getElementById(clientField.id+'_lkwgt');
			if (link != undefined && link != 'undefined' && link != '')
				link.href = "javascript:setFieldAPIName('"+userType+"'); openLookupPopUP()";

			if(link.hasChildNodes()) {
				link.removeChild(link.firstChild);
			}
			link.className = link.className + " d-icon-search lookupIcon rfdplIconFontSize";

			var nameSpaceLen = orgNamespace.length;
			var fieldApiName=userType;
			if(fieldApiName.indexOf(orgNamespace) != -1){
				fieldApiName = fieldApiName.substring(nameSpaceLen,fieldApiName.length);
			}
			fieldApiName = fieldApiName.toLowerCase();
			//Add the onkeyup event for the client field
			setTypeAhead = true;
			var lookupObject = 'User';
			if (clientField.addEventListener){
				clientField.addEventListener( 'keyup', function(e){
					e.preventDefault();
					clientData = [];
					var LKFclause = getFilterQueryString(fieldApiName);
					queryData(this, lookupObject, e, LKFclause);
				}, 'false' );
			} else if (clientField.attachEvent){
					clientField.attachEvent( 'onkeyup', function(e){
	            	var LKFclause = getFilterQueryString(fieldApiName);
		            queryData(clientField, lookupObject, e, LKFclause);
				});
			}

			// Release console and CR does not have Client and contact ToolTip Icon
			if(fieldApiName !='fkreleasecoordinator__c' && fieldApiName !='fkinitiator__c') {
				createIcons('FKClient__c');
			}

			if (templateApplied && clientName != '') {
				selectedClientName = '';
				templateApplied = false;
			}

			if (clientField.value == '') {
				selectedClientName = '';
				clientField.value = '';
				document.getElementById(clientField.id+'_lkold').value = '';
				document.getElementById(userId).value = '';
			} else if (selectedClientName == '') {
				document.getElementById(clientField.id+'_lkid').value =clientId;
				setMandatoryFieldValue(clientField,clientField.value);
			}
			else {
				clientField.value = selectedClientName;
				document.getElementById(clientField.id+'_lkold').value = selectedClientName;
				setMandatoryFieldValue(clientField,clientField.value);
			}
		}
	}catch(err){
		console.log(err);
	}
}

function hideUserTypeSelector(userTypeReference){
	var referenceArray = userTypeReference.split(',');
	var apiName ;
	var clientField;
	var clientLookupField;
	for (var  ss = 0; ss< referenceArray.length; ss++ ){
		apiName = referenceArray[ss];
		clientField = document.getElementById(getHTMLInputID(apiName));
		if (clientField != null && clientField != undefined && clientField != 'undefined' && clientField != '') {
			clientLookupField  = document.getElementById(clientField.id+'_mlktp');
			if (clientLookupField != undefined && clientLookupField != 'undefined' && clientLookupField != ''){
				clientLookupField.style.display = 'none';
			}
			if(apiName.indexOf('FKClient__c')==-1){
				if(apiName.indexOf(orgNamespace) != -1){
					apiName = apiName.substring(orgNamespace.length,apiName.length);
				}
				apiName = apiName.toLowerCase(); 
				setTypeAhead = true;
				var lookupObject = 'User';
				if (clientField.addEventListener){
						clientField.addEventListener( 'keyup', function(e){
							e.preventDefault();
							var orgnamespace = fieldApiName.substring(0,fieldApiName.indexOf('__')+2);
							
						    if(orgnamespace.toLowerCase() == 'bmcservicedesk__'){
						    	ApiName= fieldApiName.replace(orgnamespace, '');
						    }else{
						    	ApiName = fieldApiName;
						    }
							
							
		            		var LKFclause = getFilterQueryString(ApiName.toLowerCase());
		            		
		                    queryData(this, lookupObject, e, LKFclause,true);
						}, 'false' );
				}else if (clientField.attachEvent){
					clientField.attachEvent( 'onkeyup', function(e){
								var orgnamespace = fieldApiName.substring(0,fieldApiName.indexOf('__')+2);
								if(orgnamespace.toLowerCase() == 'bmcservicedesk__'){
									ApiName= fieldApiName.replace(orgnamespace, '');
							    }else{
							    	ApiName = fieldApiName;
			            		}
								
			            		LKFclause = getFilterQueryString(ApiName.toLowerCase());
			            		
							
		                    queryData(this, lookupObject, e, LKFclause,true);
					});
				}
			}
		}
	} 
}
//Create the client and contact tooltip icon near client id and contact field on the form
function createIcons(iconFor) {
	try{
		var clientField = document.getElementById(getHTMLInputID(orgNamespace+iconFor));
		if (clientField != undefined && clientField != 'undefined' && clientField != '') {
			var parentSpanElem;
			if (clientField.type === 'text') {
			    parentSpanElem = clientField.parentNode;
			    while (parentSpanElem.nodeName != 'SPAN') {
	                parentSpanElem = parentSpanElem.parentNode;
	            }
			} else if (clientField.type === 'hidden') {
			    parentSpanElem = clientField.nextElementSibling;
                while (parentSpanElem.nodeName != 'SPAN') {
                    parentSpanElem = parentSpanElem.nextElementSibling;
                }
			}
			if (parentSpanElem != undefined) {
				var newSpanElem = document.createElement('span');
				newSpanElem.setAttribute('class',' rfDPLNextIcon');
				if(iconFor=='FKClient__c'){
					if(typeof(isNewIncident) != "undefined"){
						//Create new Client icon
						newSpanElem = document.createElement('span');
						newSpanElem.setAttribute('id','newClientIcon');
						if(isNewIncident == 'true' && createClient  == 'true')
						{
							newSpanElem.style.cursor = 'pointer';
						}
						else
						{
							newSpanElem.style.display = 'none';
						}

						newSpanElem.className = newSpanElem.className + " d-icon-user_plus rfDPLNextIcon";
						newSpanElem.setAttribute('title',createNewCilentToolTip);
						newSpanElem.setAttribute('onclick','createNewClient()');
						parentSpanElem.appendChild(newSpanElem);
					}
					//Add VIP Client icon
					newSpanElem = document.createElement('span');
					newSpanElem.setAttribute('id','VIPClientIcon');
					if(clientVIP == 'true') {
						newSpanElem.setAttribute('style','visibility:visible;');
					} else {
						newSpanElem.setAttribute('style','visibility:hidden;');
					}

					newSpanElem.className = newSpanElem.className +" d-icon-user_star rfDPLNextIcon rfdplIconFontSize rf-inactive";
					newSpanElem.setAttribute('title',VIPClientLabel);
					parentSpanElem.appendChild(newSpanElem);
				}

			}
		}
	}catch(err){
		console.log(err);
	}
}

/**
 * This method will create the section links for the form
 **/
function createSectionLinks(enabledForModule){
	try{
		var isTrue = false;
				
		if(typeof(enabledForModule)!= 'undefined'){
			var sectionLinksTD = document.getElementById('sectionLinksTD');
		}else{
			var sectionLinksTD = document.getElementById('topmenu');
		}
		if(typeof(sectionLinksTD) != 'undefined'){
			
			if(typeof(enabledForModule)!= 'undefined' && enabledForModule){
				if(typeof(inctype)!= 'undefined' ){
					if(inctype == 'Incident'){
						sectionLinksTD.setAttribute('class','sectionLinksTDCls');
					}else{
						sectionLinksTD.setAttribute('class','sectionLinksTDClsMultiLayoutDisable');
					}
				}else{
				sectionLinksTD.setAttribute('class','sectionLinksTDCls');
				}
			}else{
				sectionLinksTD.setAttribute('class','sectionLinksTDClsMultiLayoutDisable');
			}
		}
		for(var k in pageSectionIdMap) {
			var span = document.createElement('span');
			span.style.display = "inline-block"; 
			if(isTrue){
				var span1 = document.createElement('span');				
				span1.appendChild(document.createTextNode('|'));
				
				sectionLinksTD.appendChild(span1);
				var anchorElem = document.createElement('a');
				if(pageSectionIdMap[k] == 'srdFrameDiv') {
					anchorElem.setAttribute('href','#'+pageSectionIdMap[k]);
					anchorElem.setAttribute('id','srdFrameLink');
				} else 
					anchorElem.setAttribute('href','#div'+pageSectionIdMap[k]);
				anchorElem.setAttribute('class','toplink');
				anchorElem.appendChild(document.createTextNode(RemedyForceHTMLProcessor.htmlDecoder(k))); 
				
				span.appendChild(anchorElem);
			}else{
				var anchorElem = document.createElement('a');
				anchorElem.setAttribute('href','#thpage:theForm:tableOutputpanel');
				anchorElem.setAttribute('class','toplink');
				anchorElem.appendChild(document.createTextNode(RemedyForceHTMLProcessor.htmlDecoder(k))); 
				
				span.appendChild(anchorElem);
			}
			
			sectionLinksTD.appendChild(span);
			isTrue = true;
			
			if(k==AssignmentDetailSection){
				isAssignmentDetailSectionPresent = true;
				var adSection = document.getElementById(pageSectionIdMap[k]);
				if(adSection!=null && adSection!='undefined'){
					var staticAadSection = document.getElementById('section2');									
					RemedyForceHTMLProcessor.copyHTML(staticAadSection,adSection);					
					RemedyForceHTMLProcessor.clearHTML(staticAadSection);
				}
			}
			if(typeof(DisplayBroadcastSection)!= 'undefined' && typeof(DisplayBroadcastSection)!= undefined && k==DisplayBroadcastSection){	
				var adSection = document.getElementById(pageSectionIdMap[k]);
				if(adSection!=null && adSection!='undefined'){
					var staticAadSection = document.getElementById('section3');					
					RemedyForceHTMLProcessor.copyHTML(staticAadSection,adSection);						
					RemedyForceHTMLProcessor.clearHTML(staticAadSection);
				}
			}
		}
	}catch(err){
	}
}
function setMandatoryFieldValue(customField, id) {
	var mandatField = mandatoryFields[customField.id];
	if (mandatField != undefined && mandatField != 'undefined' && mandatField != '') {
		var fieldValue = mandatField.split(NONPRINT);
		fieldValue[1] = id;
		mandatoryFields[customField.id] = fieldValue[0] + NONPRINT + fieldValue[1];
	}
}
function getFilterCondition(isForLookup, lkpObject, lookupType, tempVar, txtId) {
	var accountId ='',clientId='';

	if(lkpObject == 'User' && txtId == staffId)
	{
		if(queueId != '' && queueId !=null){
			return ('groupmember'+ NONPRINT + NONPRINT +queueId);			   	
		}
		else{
			return('staffusers'+ NONPRINT +'active_standard');
		}
	}
	
	if (currentConsole == 'Incident') {
		var clientIdHTMLfieldId = getHTMLInputID(orgNamespace+'FKClient__c');
		if (!isAccountByClient  && typeof(accountFieldId) != 'undefined' && accountFieldId!=null && accountFieldId != ''&& accountFieldId != '000000000000000'){
			accountId = accountFieldId;
		}
		if (typeof(document.getElementById(userId)) != 'undefined' && document.getElementById(userId)!=null && document.getElementById(userId).value != ''&& document.getElementById(userId).value != '000000000000000'){
			clientId = document.getElementById(userId).value; 
		}
		if (clientIdHTMLfieldId!=null && clientIdHTMLfieldId!='undefined' && clientIdHTMLfieldId!='' && currentField.id == document.getElementById(clientIdHTMLfieldId).id) {
			if (accountId != '') {
				return 'active_standard'+ NONPRINT + 'acc_id'+ NONPRINT + accountId ;
			}
			else {
				return 'active_standard';
			}
		}
	}
	if((currentConsole == 'Task' || currentConsole == 'Change Request') && lkpObject == 'User'){		
			return 'active_standard';
	}
	if(lkpObject == 'User')
	{
		return 'active_standard';
	}
	if(lookupType == 'StandardUserLookup'){
		lookupObject = 'User';
		return 'active_standard';
		
	}
	if(lookupType == 'CustomerSuccessUserLookup'){
		lookupObject = 'User';
		return 'active_standard';
		
	}
	if(lkpObject == 'AllUser' )
	{
		lookupObject = 'User';
		return 'active_standard';
	}
	if(lkpObject == '' || lkpObject == 'undefined' || typeof(lkpObject) == 'undefined'){
		NewLookUpType = lookupType;
	}
	if(lkpObject == 'Account') {
		if (currentConsole == 'Incident')
			return 'active_custom' + (accountFilter == '' ? '' : (NONPRINT + 'acc_rf')) ;
		else
			return 'active_custom';
	}
	if(lkpObject == 'Impact__c' || lkpObject == 'Priority__c' || lkpObject == 'Urgency__c'){
		return 'active_custom';
	}
	if (lkpObject == 'Broadcasts__c' || lkpObject == 'Task__c' || lkpObject == 'Incident__c' || lkpObject == 'Release__c' || lkpObject == 'Change_Request__c' || lkpObject == 'Problem__c') {
		return 'active_custom';
	}
	if (lkpObject == 'Category__c') {
		if (currentConsole == 'Incident') {
		 			if(IncidentSegregationEnabled && inctype && inctype!= 'null'){
						if (inctype.toLowerCase() == 'incident'){
							return 'active_custom'+ NONPRINT +'cat_in_seg';
	              		}else if (inctype.toLowerCase() == 'servicerequest'){
							return 'active_custom' + NONPRINT + 'cat_sr_seg';
						}
					}
					return 'active_custom' + NONPRINT + 'cat_in';
		}else if (currentConsole == 'Task')
			return 'active_custom' + NONPRINT + 'cat_ta';
		else if (currentConsole == 'Problem')
			return 'active_custom' + NONPRINT + 'cat_pr';
		else if (currentConsole == 'Change Request')
			return 'active_custom' + NONPRINT + 'cat_cr';
		else if (currentConsole == 'Release')		
			return 'active_custom' + NONPRINT + 'cat_rm';
		else if (currentConsole == 'Broadcast')		
			return 'active_custom' + NONPRINT + 'cat_br';
		else
			return 'active_custom';
	}
	if(lkpObject == 'BMC_BaseElement__c'){
		if (currentConsole == 'Incident'){
			if(tempVar.indexOf('FKBusinessService__c') != -1 || tempVar.indexOf('FKServiceOffering__c') != -1){
				lookupObject = 'BMC_BusinessService__c';
				return getFilterClause(tempVar, isForLookup);
			}
			if (!isForLookup && tempVar.indexOf('FKBMC_BaseElement__c') != -1) {
				return 'active_be';
			}
		}
		if(!isForLookup){
			return 'active_be';
		}
	}
	if(lkpObject == 'SYSTemplate__c'){
		return 'active_custom' + NONPRINT  + getObjectCode(currentConsole);
	}
	else if(lkpObject == 'Status__c'){
		if (currentConsole == 'Incident')
			return 'active_custom' + NONPRINT + 'status_in';
		else if (currentConsole == 'Task')
			return 'active_custom' + NONPRINT + 'status_ta';
		else if (currentConsole == 'Problem')
			return 'active_custom' + NONPRINT + 'status_pr'; 
		else if (currentConsole == 'Change Console')
			return 'active_custom' + NONPRINT + 'status_ca'; 
		else if (currentConsole == 'Release')
			return 'active_custom' + NONPRINT + 'status_rm'; 
	}
	if(lkpObject=='Group'){
			var parentName = '';
		if (currentConsole == 'Incident') {
			parentName = 'obj_in';
		}
		else if (currentConsole == 'Task') {
			parentName = 'obj_ta';
		}
		else if (currentConsole == 'Problem') {
			parentName = 'obj_pr';
		}
		else if (currentConsole == 'Change Request') {
			parentName = 'obj_cr';
		}
		else if (currentConsole == 'Release') {
			parentName = 'obj_rm';
		}
		else if (currentConsole == 'Broadcast') {
			parentName = 'obj_br';
		}
		return parentName + NONPRINT + 'queues';
	}
	
	if (typeof(lkpObject) != 'undefined' && lkpObject != 'User' && lkpObject != 'Account' && lkpObject.indexOf('__c') < 0)
		return '';
	//If the request comes from typeahead then pass query params instead of url params
	if (currentConsole == 'Incident') {
		if(lkpObject == 'SRM_RequestDefinition__c'){
			if(!isForLookup){
				var tempFilter = 'Inactive__c = false AND FKBusinessService__r.MarkAsDeleted__c=false AND FKServiceOffering__r.MarkAsDeleted__c=false';
				var soqlDateTime = getSOQLDateTimeString(new Date());
				var onlineExpiredDateClause = '(startdate__c = null or startdate__c <=' + soqlDateTime + ')' + ' and Online__c = true and (enddate__c = null or enddate__c >=' + soqlDateTime + ') ';
				tempFilter += ' And ' + onlineExpiredDateClause;
				return escape(tempFilter);
			}
		}
	}	
}	
if(window.parent.assignLKFilterCondition!=undefined){
	window.parent.assignLKFilterCondition(getFilterCondition);
}
function getFilterId(isForLookup, lkpObject, lookupType, tempVar, txtId) {
	var accountId ='',clientId='';

	if(lkpObject == 'User' && txtId == staffId)
	{
		if(queueId != '' && queueId !=null){
			return escape('groupmember&param1\''+queueId+'\'');
		}
		else{
			return escape('staffusers')+'&addlFilterId=active_standard';
		}
	}
	
	if (currentConsole == 'Incident') {
		var clientIdHTMLfieldId = getHTMLInputID(orgNamespace+'FKClient__c');
		if (!isAccountByClient  && typeof(accountFieldId) != 'undefined' && accountFieldId!=null && accountFieldId != ''&& accountFieldId != '000000000000000'){
			accountId = accountFieldId;
		}
		if (typeof(document.getElementById(userId)) != 'undefined' && document.getElementById(userId)!=null && document.getElementById(userId).value != ''&& document.getElementById(userId).value != '000000000000000'){
			clientId = document.getElementById(userId).value; 
		}
		if (clientIdHTMLfieldId!=null && clientIdHTMLfieldId!='undefined' && clientIdHTMLfieldId!='' && currentField.id == document.getElementById(clientIdHTMLfieldId).id) {
			if (accountId != '') {
				return escape('active_standard')+'&addlFilterId=acc_id&param1\''+accountId+'\'';
			}
			else {
				return escape('active_standard');
			}
		}
	}
	if((currentConsole == 'Task' || currentConsole == 'Change Request') && lkpObject == 'User'){		
			return escape('active_standard');
	}
	if(lkpObject == 'User')
	{
		return escape('active_standard');
	}
	if(lookupType == 'StandardUserLookup'){
		lookupObject = 'User';
		return escape('active_standard');
		
	}
	if(lookupType == 'CustomerSuccessUserLookup'){
		lookupObject = 'User';
		return escape('active_standard');
		
	}
	if(lkpObject == 'AllUser' )
	{
		lookupObject = 'User';
		return escape('active_standard');
	}
	if(lkpObject == '' || lkpObject == 'undefined' || typeof(lkpObject) == 'undefined'){
		NewLookUpType = lookupType;
	}
	if(lkpObject == 'Account') {
		if (currentConsole == 'Incident')
			return 'active_custom' + ( (typeof(accountFilter) !== 'undefined' && accountFilter) ? '&addlFilterId=' + accountFilter : '' );
		else
			return escape('active_custom');
	}
	if(lkpObject == 'Impact__c' || lkpObject == 'Priority__c' || lkpObject == 'Urgency__c'){
		return escape('active_custom'); 
	}
	if (lkpObject == 'Broadcasts__c' || lkpObject == 'Task__c' || lkpObject == 'Incident__c' || lkpObject == 'Release__c' || lkpObject == 'Change_Request__c' || lkpObject == 'Problem__c') {
		return escape('active_custom'); 
	}
	if (lkpObject == 'Category__c') {
		if (currentConsole == 'Incident') 
			return escape('active_custom')+ '&addlFilterId=cat_in'; 
		else if (currentConsole == 'Task')
			return escape('active_custom')+ '&addlFilterId=cat_ta';  
		else if (currentConsole == 'Problem')
			return escape('active_custom')+ '&addlFilterId=cat_pr';  
		else if (currentConsole == 'Change Request')
			return escape('active_custom')+ '&addlFilterId=cat_cr'; 
		else if (currentConsole == 'Release')		
			return escape('active_custom')+ '&addlFilterId=cat_rm'; 
		else if (currentConsole == 'Broadcast')		
			return escape('active_custom')+ '&addlFilterId=cat_br';  		
		else
			return escape('active_custom');
	}
	if(lkpObject == 'BMC_BaseElement__c' && currentConsole == 'Incident'){
		if(tempVar.indexOf('FKBusinessService__c') != -1){
			lookupObject = 'BMC_BusinessService__c';
			//buisnessServiceId = txtId+'_lkid';
			return getBSFilterId(tempVar, isForLookup);
		}else if(tempVar.indexOf('FKServiceOffering__c') != -1 ){
			lookupObject = 'BMC_BusinessService__c';
			return getBSFilterId(tempVar, isForLookup);
		}
	}
	if(lkpObject == 'SYSTemplate__c'){
		return escape('active_custom')+'&addlFilterId='+getObjectCode(currentConsole); 
	}
	else if(lkpObject == 'Status__c'){
		if (currentConsole == 'Incident')
			return escape('active_custom')+'&addlFilterId=status_in'; 
		else if (currentConsole == 'Task')
			return escape('active_custom')+'&addlFilterId=status_ta';  
		else if (currentConsole == 'Problem')
			return escape('active_custom')+'&addlFilterId=status_pr';  
		else if (currentConsole == 'Change Console')
			return escape('active_custom')+'&addlFilterId=status_cr'; 
		else if (currentConsole == 'Release')
			return escape('active_custom')+'&addlFilterId=status_rm';  
	}
	if(lkpObject=='Group'){
			var parentName = '';
		if (currentConsole == 'Incident') {
			parentName = 'obj_in';
		}
		else if (currentConsole == 'Task') {
			parentName = 'obj_ta';
		}
		else if (currentConsole == 'Problem') {
			parentName = 'obj_pr';
		}
		else if (currentConsole == 'Change Request') {
			parentName = 'obj_cr';
		}
		else if (currentConsole == 'Release') {
			parentName = 'obj_rm';
		}
		else if (currentConsole == 'Broadcast') {
			parentName = 'obj_br';
		}
		return escape(parentName)+'&addlFilterId=queues';
	}
	
	if (typeof(lkpObject) != 'undefined' && lkpObject != 'User' && lkpObject != 'Account' && lkpObject.indexOf('__c') < 0)
		return '';
	//If the request comes from typeahead then pass query params instead of url params
	if (currentConsole == 'Incident') {
		
		if(lkpObject == 'SRM_RequestDefinition__c'){
			if(!isForLookup){
				var tempFilter = 'Inactive__c = false AND FKBusinessService__r.MarkAsDeleted__c=false AND FKServiceOffering__r.MarkAsDeleted__c=false';
				var soqlDateTime = getSOQLDateTimeString(new Date());
				var onlineExpiredDateClause = '(startdate__c = null or startdate__c <=' + soqlDateTime + ')' + ' and Online__c = true and (enddate__c = null or enddate__c >=' + soqlDateTime + ') ';
				tempFilter += ' And ' + onlineExpiredDateClause;
				return escape(tempFilter);
			}
		}
	}
}	 

function getObjectCode(currentConsole){
	if (currentConsole == 'Incident') 
		return 'temp_in'; 
	else if (currentConsole == 'Task')
		return 'temp_ta';  
	else if (currentConsole == 'Problem')
		return 'temp_pr';  
	else if (currentConsole == 'Change Request')
		return 'temp_cr';
	else if (currentConsole == 'Release')		
		return 'temp_rm';
	else if (currentConsole == 'Broadcast')		
		return 'temp_br';
}

function openLookup(baseURL, width, modified, searchParam){
	var originalbaseURL = baseURL; 
	var originalwidth = width;
	var originalmodified = modified;
	var originalsearchParam = searchParam;
	filterClause = ''; 
	lookupObject = '';
	NewLookUpType = '';
	var lookupType = baseURL.substr(baseURL.length-3, 3);
	//if (modified == '1') baseURL = baseURL + searchParam;
	baseURL = decodeURIComponent((baseURL + '').replace(/\+/g, '%20')); 
	searchParam = decodeURIComponent((searchParam + '').replace(/\+/g, '%20')); 
	
	var searchLookUpStr = ''; 
	var searchStrArray = searchParam.split("=");
	if(searchStrArray.length==2){
		searchLookUpStr = searchStrArray[1];
		if(searchLookUpStr !=null){
			searchLookUpStr = searchLookUpStr.trim();
			searchLookUpStr = encodeURIComponent(searchLookUpStr);
			if(searchLookUpStr!='' && searchLookUpStr.length <2){
				alert(searchErrorMsg);
				return;
			}
		}
		
	}
	
	var urlArr = baseURL.split("&");
	var txtId = '';
	if(urlArr.length > 2) {
		//defect: 71587 fixed
        var  urlArr1 = baseURL.search("lkpr=") > 0 ? urlArr[2].split('=') : urlArr[1].split('=');
		txtId = urlArr1[1];
		currentField = document.getElementById(txtId);
		isFromLookup = true;
	}
	var urlArr2;	
	var tempVar ='';
	isCustomLookup = false;
	var typeParam = '';
	if (currentConsole == 'Incident') {
		var baseElemId = txtId.substr(0,txtId.lastIndexOf('CIinputField'))+'HiddenCI';
		if(document.getElementById(baseElemId) !=null)
			tempVar= document.getElementById(baseElemId).title;
		for	(index = 0; index < ciIdArr.length; index++) {
			if(txtId==ciIdArr[index])
			tempVar = orgNamespace+'FKBMC_BaseElement__c';
		}
		if (txtId == ciId) 
			tempVar = orgNamespace+'FKBMC_BaseElement__c';
		else if (txtId == serviceId){
			tempVar = orgNamespace+'FKBusinessService__c'; typeParam = '&type=service';
		}
		else if (txtId == offeringId) 
			tempVar = orgNamespace+'FKServiceOffering__c';
		else if(tempVar == "")
			tempVar = document.getElementById(txtId).getAttribute("rf-fieldapiname");
		
		var arrayFieldApi = [];
		if(tempVar)
			 arrayFieldApi = tempVar.split("__");
		
		if(arrayFieldApi.length == 3){
			var currentOrgPrefix =arrayFieldApi[0] + '__';  
			if(currentOrgPrefix != orgNamespace){	
				isCustomLookup = true;	
			}
		} else if (arrayFieldApi.length == 2) {
			isCustomLookup = true;
		}
	}
	
	for(var i =0 ; i< urlArr.length; i++){
		if(urlArr[i] != undefined){
			urlArr2 = urlArr[i].split('=');
			if(urlArr2[0] == 'lktp' ){
				lookupType = urlArr2[1];
			}
		}
	 }
	 
	for(var i=0; i< prefixMap.length ; i++){
		if(lookupType == prefixMap[i][0]){
			lookupObject = prefixMap[i][1];
			break;
		}
	}	
	
	var nameSpaceLen = orgNamespace.length;
	if(fieldApiName.indexOf(orgNamespace) != -1){
		fieldApiName = fieldApiName.substring(nameSpaceLen,fieldApiName.length);
	}	
	fieldApiName = fieldApiName.toLowerCase(); 
	var LKFclause = getFilterQueryString(fieldApiName);
					
	if(lookupObject == 'SYSTemplate__c'){
		isByTemplate = true;
	}
	
	if(lookupObject == 'SYSTemplate__c' && currentConsole != 'Problem')
	{
		var tempRecordId, tempRecordCloseMsg;
		if (currentConsole == 'Incident') {
			tempRecordId = incidentId;
			tempRecordCloseMsg = IncidentIsClosed;
		}
		else if (currentConsole == 'Task') {
			tempRecordId = taskId;
			tempRecordCloseMsg = TaskIsClosed;
		}
		else if (currentConsole == 'Change Request') {
			tempRecordId = changeReqId;
			tempRecordCloseMsg = CrClosed;
		}
		else if (currentConsole == 'Release') {
			tempRecordId = releaseId;
			tempRecordCloseMsg = ReleaseIsClosed;
		}
		else if (currentConsole == 'Broadcast') {
			tempRecordId = broadcastId;
			tempRecordCloseMsg = BroadcastIsClosed;
		}
		if( (tempRecordId!='' && status=='false')){
			alert(tempRecordCloseMsg);
			return;
		}
		if(applytemplateToExistingRecord == 'false' && tempRecordId!=''){

			alert(TemplateValidationError);
			return;
		}
		if(overrideRecWithTemplateVal!=null && overrideRecWithTemplateVal=='true'){
			var confirmValue='';
			if(tempRecordId!=''){
				confirmValue=confirm(OverwriteWarning);
				if(confirmValue==false){
					return;
				}
			}else if(window.parent.clickedOnce){
				confirmValue=confirm(OverwriteWarning);
				if(confirmValue==false){
					return;
				}
			}
		}
	}
	
	filterClause = getFilterId(true, lookupObject, lookupType, tempVar, txtId);
	var clientForBaseElem = '';
	if (currentConsole == 'Incident') {
		if(lookupObject == 'SRM_RequestDefinition__c'){
			if(overrideRecWithTemplateVal.toString().toLowerCase() == 'true' && tempVar.toString().toLowerCase().indexOf('fkrequestdefinition__c')!= -1 && isNewIncident == 'false'){
				confirmValue=confirm(OverwriteWarningForRequestDef);
				if(confirmValue==false){
					return;
				}
				
			}
		}	
		if(userId!=null && userId!='undefined' && userId !='' ){
			if (typeof(document.getElementById(userId)) != 'undefined' && document.getElementById(userId)!=null && document.getElementById(userId).value != ''&& document.getElementById(userId).value != '000000000000000')
				clientForBaseElem = document.getElementById(userId).value;
			}
	}
	var parentName = '';
	if (currentConsole == 'Incident') {
		parentName = 'Incident__c';
	}
	else if (currentConsole == 'Task') {
		parentName = 'Task__c';
	}
	else if (currentConsole == 'Problem') {
		parentName = 'Problem__c';
	}
	else if (currentConsole == 'Change Request') {
		parentName = 'Change_Request__c';
	}
	else if (currentConsole == 'Release') {
		parentName = 'Release__c';
	}
	else if (currentConsole == 'Broadcast') {
		parentName = 'Broadcasts__c';
	}
		
	if(lookupObject == 'Category__c'){
		//Following is the url of Custom Lookup page. You need to change that accordingly
		if (currentConsole == 'Incident') {
			parentName = 'Incident__c';
			if(isServiceRequest == 'true' || inctype=='ServiceRequest' ){
				baseURL = "/apex/"+orgNamespace+"StdLayoutCategoryTree?txt=" + txtId+'&popupId=incident&objectName='+parentName+'&state=true&serviceRequest=true&stdForm=false&standardLayout=true&filterId='+filterClause + "&frm=" + escapeUTF("catDtlFrm") + "&idValstr=" + LKFclause + '&searchLookUpStr='+searchLookUpStr;
			}else{
				baseURL = "/apex/"+orgNamespace+"StdLayoutCategoryTree?txt=" + txtId+'&popupId=incident&objectName='+parentName+'&state=true&serviceRequest=false&stdForm=false&standardLayout=true&filterId='+filterClause + "&frm=" + escapeUTF("catDtlFrm") + "&idValstr=" + LKFclause + '&searchLookUpStr='+searchLookUpStr;
				if (window.parent != undefined && window.parent.isRFConsoleDetailForm && window.parent.parent != undefined && window.parent.parent.MultiPageLayout != undefined 
				&& window.parent.parent.MultiPageLayout.isEnabled != undefined && window.parent.parent.MultiPageLayout.isEnabled && window.parent.parent.MultiPageLayout['isEnabledForIN']) {
					baseURL =  baseURL +"&MultiPageLayoutEnabled=true&recType=" + formLayoutId;
				}
			}
		}
		else if (currentConsole == 'Task') {
			parentName = 'Task__c';
			baseURL = "/apex/"+orgNamespace+"StdLayoutCategoryTree?txt=" + txtId+'&popupId=task&objectName='+parentName+'&state=true&serviceRequest=false&stdForm=false&standardLayout=true&filterId='+filterClause + "&frm=" + escapeUTF("catDtlFrm") + "&idValstr=" + LKFclause + '&searchLookUpStr='+searchLookUpStr;
			if (window.parent != undefined && window.parent.isRFConsoleDetailForm &&  window.parent.parent != undefined && window.parent.parent.MultiPageLayout != undefined 
			&& window.parent.parent.MultiPageLayout.isEnabled != undefined && window.parent.parent.MultiPageLayout.isEnabled && window.parent.parent.MultiPageLayout['isEnabledForTS']) {
				baseURL =  baseURL +"&MultiPageLayoutEnabled=true&recType=" + formLayoutId;
			}
		}
		else if (currentConsole == 'Problem') {
			parentName = 'Problem__c';
			baseURL = "/apex/"+orgNamespace+"StdLayoutCategoryTree?txt=" + txtId+'&popupId=problem&objectName='+parentName+'&state=true&serviceRequest=false&stdForm=false&standardLayout=true&filterId='+filterClause + "&frm=" + escapeUTF("catDtlFrm") + "&idValstr=" + LKFclause + '&searchLookUpStr='+searchLookUpStr;
		}
		else if (currentConsole == 'Change Request') {
			parentName = 'Change_Request__c';
			baseURL = "/apex/"+orgNamespace+"StdLayoutCategoryTree?txt=" + txtId+'&popupId=changerequest&objectName='+parentName+'&state=true&serviceRequest=false&stdForm=false&standardLayout=true&filterId='+filterClause + "&frm=" + escapeUTF("catDtlFrm") + "&idValstr=" + LKFclause +'&searchLookUpStr='+searchLookUpStr;
			if (window.parent != undefined && window.parent.isRFConsoleDetailForm &&  window.parent.parent != undefined && window.parent.parent.MultiPageLayout != undefined 
				&& window.parent.parent.MultiPageLayout.isEnabled != undefined && window.parent.parent.MultiPageLayout.isEnabled && window.parent.parent.MultiPageLayout['isEnabledForCR']) {
				baseURL =  baseURL +"&MultiPageLayoutEnabled=true&recType=" + formLayoutId;
			}

		}
		else if (currentConsole == 'Release') {
			parentName = 'Release__c';
			baseURL = "/apex/"+orgNamespace+"StdLayoutCategoryTree?txt=" + txtId+'&popupId=release&objectName='+parentName+'&state=true&serviceRequest=false&stdForm=false&standardLayout=true&filterId='+filterClause + "&frm=" + escapeUTF("catDtlFrm") + "&idValstr=" + LKFclause + '&searchLookUpStr='+searchLookUpStr;
		}
		else if (currentConsole == 'Broadcast') {
			parentName = 'Broadcasts__c';
			baseURL = "/apex/"+orgNamespace+"StdLayoutCategoryTree?txt=" + txtId+'&popupId=broadcasts&objectName='+parentName+'&state=true&serviceRequest=false&stdForm=false&standardLayout=true&filterId='+filterClause + "&frm=" + escapeUTF("catDtlFrm") + "&idValstr=" + LKFclause + '&searchLookUpStr='+searchLookUpStr;
		}
		openLookupRF(baseURL, "480", width);
	 }else{
		if(tempVar.indexOf('FKBMC_BaseElement__c') != -1){
				var accountId ='',idval='',clientId='';
				 if (accountFieldId!=null && accountFieldId != ''&& accountFieldId != '000000000000000'){
					accountId = accountFieldId;
				 }
				 if (document.getElementById(userId)!=null && document.getElementById(userId)!='undefined'&& document.getElementById(userId).value != ''&& document.getElementById(userId).value != '000000000000000'){
					clientId = document.getElementById(userId).value; 
				 }
			if(window.parent._ServerVariables.assetCoreActive==true || window.parent._ServerVariables.discoveryActive == true){
				width = width + 450;
				baseURL = "/apex/"+orgNamespace+"SearchConfigItem?txt=" + txtId;
				baseURL = baseURL + "&frm=" + escapeUTF("{!$Component.theForm}"); 
				baseURL =  baseURL +"IncidentID="+incidentId+"&isCalledFromConsole=true&filterObjectId="+clientForBaseElem+'&searchLookUpStr='+searchLookUpStr + "&accountId=" + accountId + "&idValstr=" + LKFclause;
				openLookupRF(baseURL, "721", width);
		}else{
					baseURL = "/apex/"+orgNamespace+"SearchAndLink?txt=" + txtId;
				   baseURL = baseURL + "&frm=" + escapeUTF("{!$Component.theForm}");
					 baseURL =  baseURL +"&filterObjectId="+incidentId+"&parentName=Incident__c&childName="+lookupObject+"&isLookUp="+lookupObject+"&NewLookUpType="+NewLookUpType+"&filterId=active_be&FKBusinessService__c="+idval+"&clientId="+clientId+"&accountId="+accountId+typeParam +"&idValstr=" + LKFclause+'&searchLookUpStr='+searchLookUpStr;
					 openLookupRF(baseURL, "600", "1000");
			}	
				
		}
		
		
		else{
			//if(lookupObject == 'BMC_BusinessService__c')
				//width = 800;
			baseURL = "/apex/"+orgNamespace+"SearchAndLink?txt=" + txtId;
			baseURL = baseURL + "&frm=" + escapeUTF("{!$Component.theForm}");
			baseURL =  baseURL +"&filterObjectId=a1FA0000002p3Or&parentName="+parentName+"&childName="+lookupObject+"&isLookUp="+lookupObject+"&NewLookUpType="+NewLookUpType+"&filterId="+filterClause+'&searchLookUpStr='+searchLookUpStr+"&isCustomLookup="+isCustomLookup + typeParam + "&idValstr=" + LKFclause;
			if (window.parent != undefined && window.parent.isRFConsoleDetailForm && window.parent.parent != undefined && window.parent.parent.MultiPageLayout != undefined 
				&& window.parent.parent.MultiPageLayout.isEnabled != undefined && window.parent.parent.MultiPageLayout.isEnabled) {
					if (((currentConsole == 'Incident' && window.parent.parent.MultiPageLayout['isEnabledForIN']) || 
						(currentConsole == 'Task' && window.parent.parent.MultiPageLayout['isEnabledForTS']) || 
						(currentConsole == 'Change Request' && window.parent.parent.MultiPageLayout['isEnabledForCR'])) && lookupObject == 'SYSTemplate__c') {
						baseURL =  baseURL +"&recType=" + formLayoutId;
					}
			}
			openLookupRF(baseURL, "600", "1000");
		}
	 }     
 }
 
 // Used to assign the id and name of the category selected  by using look up.
function categoryfields(catId,catName, isCustom, textBox){
	categoryId =catId; 
	if(isCustom){
		var categoryField = document.getElementById(textBox);
		if(categoryField && categoryField.value != catName)
		{
				setTabUnsavedChanges();
        }
		categoryField.value = catName; 
		categoryLookupId = catId;
		document.getElementById(categoryField.id+'_lkid').value = categoryLookupId;
		document.getElementById(categoryField.id+'_lkold').value = catName;
		
		if(currentConsole=='Incident'){
			if(checkForListeners(orgNamespace+'FKCategory__c') && showSmartSuggestions)
				smartSuggestionsHandler();
			
			if(typeof(isEnableDynamicFields) != 'undefined' && isEnableDynamicFields && typeof(dynamicFieldsHandler) != 'undefined'){
				dynamicFieldsHandler(orgNamespace+'FKCategory__c','reference');
			}	
		}
		window.parent.selectedCategoryId = categoryId;
		if (currentConsole == 'Incident') ChangeStateOfParentButtons(false);
		isFromLookup = true;
		disableDiv(typeAheadDivId, 'reference', categoryField);
		
	}
}
// This methode is used to set the possition of the auto complete box just relative to the text box for which we are  supporting the auto complete functionality.	
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
/** staff & owner methods start here **/
// Open the look up Page for Owner , Queue and staff Field.
function openOwnerLookupPopUP(ownerTypeStr, queueId, onlyQParam, parentObjectName, parentObjectId){	
	ownerType = ownerTypeStr;
	var leftMargin= parseInt((screen.availWidth/2) - (1000/2));
	var topMargin = parseInt((screen.availHeight/2) - (600/2));
	var stdLayoutScreenWidth = 1000;
	var stdLayoutScreenHeight = 600;
    var windowFeatures = "width=" + stdLayoutScreenWidth + ",height=" + stdLayoutScreenHeight + ",status=1,resizable=1,scrollbars=yes,left=" + leftMargin + ",top=" + topMargin;
	
	var nameSpaceLen = orgNamespace.length;
	if(fieldApiName.indexOf(orgNamespace) != -1){
		fieldApiName = fieldApiName.substring(nameSpaceLen,fieldApiName.length);
	}
	fieldApiName = fieldApiName.toLowerCase(); 
	var LKFclause = getFilterQueryString(fieldApiName);
	if(parentObjectName=='Incident__c'&& inctype!=null && inctype!='' && typeof(inctype)!='undefined' ){
		window.open("/apex/SuggestionPage?queueId="+queueId+"&parentObjectId="+parentObjectId+"&parentObjectName="+parentObjectName+"&inctype="+inctype+"&fromInciOwnerLkup=true&ownerType="+ownerType + "&idValstr=" + LKFclause + onlyQParam,"lookup",windowFeatures);
	}else{
		window.open("/apex/SuggestionPage?queueId="+queueId+"&parentObjectId="+parentObjectId+"&parentObjectName="+parentObjectName+"&fromInciOwnerLkup=true&ownerType="+ownerType + "&idValstr=" + LKFclause + onlyQParam,"lookup",windowFeatures);
	}
	
}

// Assign the owner fields to the respective variables.
function assignOwnerfields(suggestedQueueId , suggestedQueueName,suggestedStaffId,suggestedStaffName, setDirtyFlag){ 
	var stdStaffField = document.getElementById(getHTMLInputID(orgNamespace+customStaffApi));
	var stdOwnerField = document.getElementById(getHTMLInputID('OwnerId'));
	var ownerNameId = 'owner_Name';
	
	if (stdStaffField!=null && stdStaffField!='undefined') {
		staffId = stdStaffField.id;
	}
	if (stdOwnerField!=null && stdOwnerField!='undefined') {
		ownerNameId = stdOwnerField.id;
	}
	
	if(enableQueueAndUserAssignment){
		if(ownerType != '' && ownerType == 'STAFF' && suggestedStaffId != null && suggestedStaffId.length > 0){
			if(document.getElementById(staffId).value != suggestedStaffName){
				if(typeof setDirtyFlag == 'undefined' || setDirtyFlag == false)
					setTabUnsavedChanges();
			}
			document.getElementById(ownerOpenById).value = suggestedStaffId;
			document.getElementById(staffId).value = suggestedStaffName;
			if (stdStaffField!=null && stdStaffField!='undefined') {
				document.getElementById(stdStaffField.id+'_lkid').value = suggestedStaffId;
				document.getElementById(stdStaffField.id+'_lkold').value = suggestedStaffName;
				setMandatoryFieldValue(stdStaffField, suggestedStaffId);
			}
		}else if(ownerType != '' && ownerType == 'QUEUE' && suggestedQueueId != null && suggestedQueueId.length > 0){
			
			if(queueId != suggestedQueueId){
				document.getElementById(ownerOpenById).value = '';  
				document.getElementById(staffId).value = '';
				if (stdStaffField!=null && stdStaffField!='undefined') {
					document.getElementById(stdStaffField.id+'_lkid').value = '';
					document.getElementById(stdStaffField.id+'_lkold').value = '';
					setMandatoryFieldValue(stdStaffField, '');
				}
			}
			if(document.getElementById(ownerNameId).value != suggestedQueueName){
				if(typeof setDirtyFlag == 'undefined' || setDirtyFlag == false)
					setTabUnsavedChanges();
			}
			document.getElementById(ownerNameId).value = suggestedQueueName ;
			if (stdOwnerField!=null && stdOwnerField!='undefined') {
				document.getElementById(stdOwnerField.id+'_lkid').value = suggestedQueueId;
				document.getElementById(stdOwnerField.id+'_lkold').value = suggestedQueueName;
				setMandatoryFieldValue(stdOwnerField, suggestedQueueId);
			}
			document.getElementById(ownerId).value = suggestedQueueId; 
			if(document.getElementById(strQueueId)!=null && document.getElementById(strQueueId)!=undefined)
				document.getElementById(strQueueId).value = suggestedQueueId; 
			if(suggestedStaffId != null && suggestedStaffId.length > 0){
				document.getElementById(ownerOpenById).value = suggestedStaffId;
				document.getElementById(staffId).value = suggestedStaffName;
				if (stdStaffField!=null && stdStaffField!='undefined') {
					document.getElementById(stdStaffField.id+'_lkid').value = suggestedStaffId;
					document.getElementById(stdStaffField.id+'_lkold').value = suggestedStaffName;
					setMandatoryFieldValue(stdStaffField, suggestedStaffId);
				}
			}
			
			queueId = suggestedQueueId;
		}
	}else if(ownerType != '' && ownerType == 'OWNER'){
		if(suggestedStaffId != null && suggestedStaffId.length > 0){
			if(document.getElementById(ownerNameId).value != suggestedStaffName){
				if(typeof setDirtyFlag == 'undefined' || setDirtyFlag == false)
					setTabUnsavedChanges();
			}
			document.getElementById(ownerNameId).value = suggestedStaffName ;
			if (stdOwnerField!=null && stdOwnerField!='undefined') {
				document.getElementById(stdOwnerField.id+'_lkid').value = suggestedStaffId;
				document.getElementById(stdOwnerField.id+'_lkold').value = suggestedStaffName;
				setMandatoryFieldValue(stdOwnerField, suggestedStaffId);
			}
			document.getElementById(ownerOpenById).value = suggestedStaffId;
			document.getElementById(ownerId).value = suggestedStaffId;
		}else if( suggestedQueueId != null && suggestedQueueId.length > 0){
			if(document.getElementById(ownerNameId).value != suggestedQueueName){
				if(typeof setDirtyFlag == 'undefined' || setDirtyFlag == false)
					setTabUnsavedChanges();
			}
			document.getElementById(ownerNameId).value = suggestedQueueName ;
			if (stdOwnerField!=null && stdOwnerField!='undefined') {
				document.getElementById(stdOwnerField.id+'_lkid').value = suggestedQueueId;
				document.getElementById(stdOwnerField.id+'_lkold').value = suggestedQueueName;
				setMandatoryFieldValue(stdOwnerField, suggestedQueueId);
			}
			document.getElementById(ownerId).value = suggestedQueueId; 
			if(document.getElementById(strQueueId)!=null && document.getElementById(strQueueId)!=undefined)
					document.getElementById(strQueueId).value = suggestedQueueId;
			document.getElementById(ownerOpenById).value = '';
			
		}
	}else if(ownerType != '' && ownerType == 'STAFF'){
		document.getElementById(ownerOpenById).value = suggestedStaffId;
		if(stdStaffField.value != suggestedStaffName){
			if(typeof setDirtyFlag == 'undefined' || setDirtyFlag == false)
				setTabUnsavedChanges();			
		}
		stdStaffField.value = suggestedStaffName;
		document.getElementById(stdStaffField.id+'_lkid').value = suggestedStaffId;
		document.getElementById(stdStaffField.id+'_lkold').value = suggestedStaffName;
		setMandatoryFieldValue(stdStaffField, suggestedStaffId);
	}
}

// clear Queue lookup text & reset queue id
function resetQueueText(){
	document.getElementById(strQueueId).value = '';
	var ownerField = document.getElementById(getHTMLInputID('OwnerId'));
	if (ownerField) {
		document.getElementById(ownerField.id+'_lkid').value = '';
		document.getElementById(ownerField.id+'_lkold').value = '';
		if(ownerField.value != '')
			setTabUnsavedChanges();
		ownerField.value = '';
		setMandatoryFieldValue(ownerField, '');
	}
	else {
		if(document.getElementById('owner_Name').value != '')
			setTabUnsavedChanges();
		document.getElementById('owner_Name').value ='';
	}
	document.getElementById(ownerId).value =''; 
	queueId = '';        
	
} 

// clear Staff lookup text & reset staff id
function resetStaffText(){
	if(enableQueueAndUserAssignment == true){
		if(document.getElementById(staffId).value != '')
			setTabUnsavedChanges();
		document.getElementById(ownerOpenById).value = '';
		document.getElementById(staffId).value = '';
		//resetStaffId();
	}
}


function headerSpaceHandler(){ 
	var errorComponentIDEl = document.getElementById(errorComponentID);
	if(errorComponentIDEl.childNodes && errorComponentIDEl.childNodes.length != 0){
		if(document.getElementById('messageSpace'))
			document.getElementById('messageSpace').className='message_space_off';
	}
}

/**
* in case of error, values for staff and queue doesn't retain. so we need to fill out them.
**/
function fillStaticValueAfterError(){
	try{
		var errorComponentIDEl = document.getElementById(errorComponentID);
		if(typeof(errorComponentIDEl)!='undefined' && typeof(errorComponentIDEl)!=null && errorComponentIDEl!=null && errorComponentIDEl!=undefined && errorComponentIDEl!='undefined' && errorComponentIDEl.hasChildNodes()){		
			if (document.getElementById('owner_Name') != null && document.getElementById('owner_Name') != undefined){
				document.getElementById('owner_Name').value = ownerElVal ;
			}
			if (document.getElementById(staffId) != null && document.getElementById(staffId) != undefined){
				document.getElementById(staffId).value = staffElVal;
			}
			if(document.getElementById(ownerOpenById)!= null && document.getElementById(ownerOpenById)!=undefined){
				document.getElementById(ownerOpenById).value = staffIdVal;
			}
			if(document.getElementById(ownerId)!= null && document.getElementById(ownerId)!=undefined){
				document.getElementById(ownerId).value = ownerIdVal;
			}
			
			if(typeof(isEnableDynamicFields) != 'undefined' && isEnableDynamicFields && typeof(reEvaluateDynamicFieldsConditions) != 'undefined'){
				reEvaluateDynamicFieldsConditions(fieldVisiblityMap);
			}
		}
	}catch(error){ }
}

function createStandardOwnerField(objectName, objectId) {
	try{
		var customField = document.getElementById(getHTMLInputID('OwnerId'));
		if (customField) {
			var customLookupField = document.getElementById(customField.id+'_mlktp');
			if (customLookupField != undefined && customLookupField != 'undefined' && customLookupField != '')
			customLookupField.style.display = 'none';
			var link = document.getElementById(customField.id+'_lkwgt');
			if (link)
				if (enableQueueAndUserAssignment)
					link.href = "javascript:setFieldAPIName('ownerid');openOwnerLookupPopUP('QUEUE','','&onlyQ=true','"+objectName+"', '"+objectId+"');";
				else
					link.href = "javascript:setFieldAPIName('ownerid');openOwnerLookupPopUP('OWNER','','&onlyQ=true', '"+objectName+"', '"+objectId+"');";
			if(typeof link.childNodes[0] != "undefined" && link.childNodes[0] !== '')
			link.childNodes[0].setAttribute("style", "margin-left:0px !important;");
			customField.disabled = 'disabled';
			customField.setAttribute("style", "cursor: default; color: #000 !important;");
		
			//Add clear icon 
			var clearIcon = document.createElement('img');
			clearIcon.setAttribute("class", "closeIconDis");
			clearIcon.setAttribute("src", "/s.gif");
			clearIcon.setAttribute("title", lblClear);
			clearIcon.setAttribute("alt", "Clear");
			clearIcon.setAttribute("style", "cursor: pointer;");
			clearIcon.onclick = function() {resetQueueText();};
			clearIcon.onmouseout = function() {this.className='closeIconDis';};
			clearIcon.onmouseover = function() {this.className=enableQueueAndUserAssignment?'closeIconEnable':'closeIconDis';};
			customField.parentNode.insertBefore(clearIcon, customField.nextSibling);
		}
	}catch(err){ }
}

function setStandardStaffFieldValue(staffField, suggestedStaffId,suggestedStaffName){
	if (staffField != undefined && staffField != 'undefined' && staffField != '') {
		document.getElementById(ownerOpenById).value = suggestedStaffId;
		if(staffField.value != suggestedStaffName)
			setTabUnsavedChanges() ;
		staffField.value = suggestedStaffName;
		document.getElementById(staffField.id+'_lkid').value = suggestedStaffId;
		document.getElementById(staffField.id+'_lkold').value = suggestedStaffName;
		setMandatoryFieldValue(staffField, suggestedStaffId);
	}
}

function createStandardStaffField(objectName, objectId){
	try{
		var staffField = document.getElementById(getHTMLInputID(orgNamespace+customStaffApi));
		
		if (staffField != undefined && staffField != 'undefined' && staffField != '') {
			
			var staffLookupField  = document.getElementById(staffField.id+'_mlktp');
			
			if (staffLookupField != undefined && staffLookupField != 'undefined' && staffLookupField != ''){
				staffLookupField.style.display = 'none';
			}
			var link = document.getElementById(staffField.id+'_lkwgt');
			
			if (link != undefined && link != 'undefined' && link != '') {
				if (enableQueueAndUserAssignment)
					link.href = "javascript:setFieldAPIName(orgNamespace+customStaffApi); openOwnerLookupPopUP('STAFF',queueId, '', '"+objectName+"', '"+objectId+"');";
				else
					link.href = "javascript:setFieldAPIName(orgNamespace+customStaffApi); openOwnerLookupPopUP('STAFF','', '', '"+objectName+"', '"+objectId+"');";
			}
			 
		}
		
		
	}catch(err){
	}
}
/** staff & owner methods end here **/


/**
 * to validate the field if it is mandatory or not. if yes then throw error.
 * Added for client side validation for mandatory field
 **/
function validateData() {
	var errorMessage = '';
	var mandatField;
	var currentMandatField;
	var fieldValue;
	
	for (var m in mandatoryFields) {
		mandatField = mandatoryFields[m];
		//Ignore RTF field: First get field using id and if null or undefined found then treat that RTF field is found and ignore it, 
		//because RTF field will not get using JS.
		currentMandatField = document.getElementById(m);
		if (currentMandatField != null && currentMandatField != 'null') {
			if(typeof(isEnableDynamicFields) == 'undefined' || (typeof(isEnableDynamicFields) != 'undefined' && (!isEnableDynamicFields || (isEnableDynamicFields && (hiddenFieldsList.length == 0 || ( hiddenFieldsList.indexOf(currentMandatField.getAttribute('fieldPath')) < 0)))))){
				fieldValue = mandatField.split(NONPRINT);
				//Setting the value of mandatory field for dependent picklist
				var mandatefieldvalue = currentMandatField.value;				
				if (typeof(clientFldLbl) != 'undefined' && fieldValue[0].trim() == clientFldLbl) {
					if (fieldValue[1].trim() == '' || mandatefieldvalue.trim() == '' || (fieldValue[1].trim() != mandatefieldvalue.trim())) {
						errorMessage += fieldValue[0] + ', ';
					}
				}
				else if (fieldValue[1].trim() == '' && mandatefieldvalue.trim() == '') {
					errorMessage += fieldValue[0] + ', ';
				}
			}
		}
	}
	if (errorMessage != '') {
	    errorMessage =  errorMessage.substring(0,errorMessage.length- 2);
		errorMessage = mandatoryFieldValueValidationMsg + ': \n' + errorMessage;
		window.parent.stopWaitMsgBar();
	}
	//when request definition value is manually copy pasted then while saving we need to check if it is entitled or not
	if(errorMessage == ''){					
		var requestDefFieldId = getHTMLInputID(orgNamespace+'FKRequestDefinition__c');
		var reqDefField = document.getElementById(requestDefFieldId);
	 	if(reqDefField && reqDefField.value){
			var reqDef_LkField = document.getElementById(requestDefFieldId+'_lkid');
			if((reqDef_LkField && reqDef_LkField.value == '') || (!incidentId && oldRecordId)){ // if lookup id is populated then no need to check as user will be able to select only entitled record while seleting through popup or typeahead but in case of clone request we need to validate so added (!incidentId && oldRecordId) to identify if it is clone request
				var entitledRequestDefList = window.parent.entitledReqDefList ? window.parent.entitledReqDefList : [];
				var entitledRD = false;
				for(var i=0; i< entitledRequestDefList.length; i++){
			    		if(reqDefField.value.toLowerCase() == entitledRequestDefList[i].toLowerCase()){
							entitledRD = true;
							break;
						}else if(!incidentId && oldRecordId && selectedReqDefTitle && selectedReqDefTitle.toLowerCase() == entitledRequestDefList[i].toLowerCase()){
							//While cloning the Service request, in value part of request definition field name of the RD comes. 
							//But in entitledReqDefList the service request title value comes which can be 255 character
							//So comparing the enitlement with Rd title
							entitledRD = true;
							break;
						}
				}
				if(!entitledRD){
					errorMessage = NonEntitledRequestDefinitionError;
					window.parent.stopWaitMsgBar();
				}
			}            
	    }
    }           
    		
	
	if(errorMessage != ''){		
		isErrorMessage = true;
		isPageMessage = false;
	}
	else{
		isPageMessage = true;
		isErrorMessage = false;
	}
	return errorMessage;
}

/**
 * to show the error message at page level. Added for client side validation
 * for mandatory field
 **/
function showPageMsg(errorMsges){
	var pageMsg = document.getElementById('thpage:theForm:pageMessage');
	if(pageMsg!=null && pageMsg!='undefined' && pageMsg.hasChildNodes()){
		document.getElementById('thpage:theForm:pageMessage').style.display='none';
	}
	var errDesc = document.getElementById('errorDescId');
	RemedyForceHTMLProcessor.parseHTML(errDesc,'<span>' + errorMsges+ '</span>');
	applyMarginToErrorMessage();
	window.scroll(0,0);
	var formoutputpanel = document.getElementById('formoutputpanel');
	if(formoutputpanel != null && formoutputpanel != 'undefined' && errorMsges !='')
		formoutputpanel.scrollTop=0;
}


/**
 * To show client/user field as mandatory on form
 **/
function showClientAsRequired(fName,isMandatory) {
	showFieldAsRequired(fName,isMandatory);
}

/**
 * To show client/user field as mandatory on form
 **/
function showCategoryAsRequired(fName,isMandatory) {
	showFieldAsRequired(fName,isMandatory);
}

/**
 * To show client/user field as mandatory on form
 **/
function showFieldAsRequired(fName, isMandatory) {
	try {
		if (isMandatory) {
			var clientField = document.getElementById(getHTMLInputID(fName));
			if (clientField) {
				var clientParentSpan = clientField.parentNode.parentNode;
				if (clientParentSpan != undefined) {
					var spanReqDivElem = document.createElement('div');					
					spanReqDivElem.setAttribute('class','requiredInput');	
					
					var allchildElem = clientParentSpan.childNodes ;
					if(allchildElem != null && typeof(allchildElem) != 'undefined' && allchildElem.length > 0) {		
						for(var i=0;i<allchildElem.length;i++){	
							var childNode=allchildElem[i].cloneNode(true);
							spanReqDivElem.appendChild(childNode);
						}				
					}
					RemedyForceHTMLProcessor.clearHTML(clientParentSpan);
					clientParentSpan.appendChild(spanReqDivElem); 
				}
			}
		}
	}catch(err){
	}
}

var selectedClientName = ''; 
// Assigns the initiator Id and name.
function clientfields(clientIdFld, clientname,accountId, clientAccountName){
			if(typeof(clientId) !='undefined' && typeof(clientId) !=undefined && typeof(clientId)!=null && typeof(clientId) !='')
				clientIdForCI = clientId;
			else
				clientIdForCI = clientIdFld;

	if(typeof(userId)!='undefined' && userId!=null && document.getElementById(userId)!=null && document.getElementById(userId)!='undefined'){
				document.getElementById(userId).value = clientIdFld;
	}
			if(typeof(ChangeStateOfParentButtons) == 'function'){
				ChangeStateOfParentButtons(false);
			}
			if(typeof(ClientFieldName)!='undefined' && ClientFieldName!=null)
				var clientField = document.getElementById(getHTMLInputID(orgNamespace+ClientFieldName));
			var accountField = document.getElementById(getHTMLInputID(orgNamespace+'FKAccount__c'));
if (clientField != undefined && clientField != 'undefined' && clientField != '') {
				if(clientField.value != clientname)
			setTabUnsavedChanges();
				clientField.value = clientname;
				clientName = clientname;
				selectedClientName = clientname;
		//Assign it to hidden id and name fields which Salesforce manages for standard lookup fields.
				document.getElementById(clientField.id+'_lkid').value = clientIdFld;
				document.getElementById(clientField.id+'_lkold').value = clientname;
				// Assign values to account filed based on client
				if (accountField != undefined && accountField != 'undefined' && accountField != '') {
					var lkId = document.getElementById(accountField.id+'_lkid');
					var lkold = document.getElementById(accountField.id+'_lkold');
					if((accountId !=null && accountId !='' && accountId !='undefined' && accountId !=undefined )&& ( clientAccountName != null && clientAccountName !='' && clientAccountName !=undefined && clientAccountName !='undefined')){
						if(isAccountByClient){
							accountField.value = clientAccountName;
							accountFieldId = accountId;
							lkId.value = accountId;
							lkold.value = clientAccountName;
						}else{
							if(lkId.value != null && lkId.value.trim() =='' && lkId.value !='undefined'){
								accountField.value = clientAccountName;
								accountFieldId = accountId;
								lkId.value = accountId;
								lkold.value = clientAccountName;
								isAccountByClient = true;
							}
						}
						
						if(typeof(isEnableDynamicFields) != 'undefined' && isEnableDynamicFields && typeof(reEvaluateDynamicFieldsConditions) != 'undefined'){
							reEvaluateDynamicFieldsConditions(fieldVisiblityMap);
						}	
						
					}	
				}
		
		 
		currentField = clientField;		
		if(currentField){
			var rfFieldApiName = currentField.getAttribute('rf-fieldApiName');
			if(rfFieldApiName){
				var tooltipDom = document.getElementById('rf-tooltip'+rfFieldApiName);
				if(tooltipDom){
					tooltipDom.setAttribute('style','display:inline');
				}
			}
		}		
		isFromLookup = true;
		//After populating client id and fields, call disableDiv function to set the mandatory field value
		disableDiv(typeAheadDivId, 'reference', currentField);
		if(currentConsole=='Incident'){ //added to solve Defect # 77861 18/12/2015
		if(checkSmartSuggestionHandler)
        	checkSmartSuggestionHandler('FKClient__c');
				clientIdForDefaultValue=clientIdFld;
			if(selectedReqDefID){
				
				var srdFrameId = document.getElementById('srdFrameId');
				if(srdFrameId){
					srdFrameId.contentWindow.refreshDynamicListDefaultWhenClientChanged(selectedReqDefID,clientIdFld);
				}
			}	

		}
}
}

/**
 * if apply template to existing record is false then disable template field.
 **/
function unableDisableTemplateField(consoleId){
	try{
		// disable template text field if applytemplateToExistingRecord setting is off.
		var templateFieldName = getHTMLInputID(orgNamespace+'FKTemplate__c');
		if(templateFieldName!=null && templateFieldName!='undefined' && templateFieldName!=''){
		
			var templateElementName = document.getElementById(templateFieldName);
			
			if(templateElementName!=null && templateElementName!='undefined' && templateElementName!=''){
				
				if(applytemplateToExistingRecord == 'false' && consoleId!=''){
					templateElementName.readOnly = 'readonly';
				}else if(consoleId!='' && status=='false'){
					templateElementName.readOnly = 'readonly';
				}
					 
			}
		}
	}catch(err){
	}
}

//we will call this function after loding template to update impact,urgance,and status
function RenderStatussection()
    {
      var selectedfield;
      if(urgancyvalue!= null && urgancyvalue != '')
      {
      	selectedfield=document.getElementById('urgencySelectId');
        if(selectedfield != null && selectedfield != 'undefined')
        	selectedfield.value=urgancyvalue;
        if(typeof(document.getElementById(getHTMLInputID(orgNamespace+'FKUrgency__c')))!= 'undefined' && document.getElementById(getHTMLInputID(orgNamespace+'FKUrgency__c')) != null)
			setUrgencyValue('urgencySelectId');
       }
     if(impactvalue!= null && impactvalue != ''){
         selectedfield=document.getElementById('impactSelectId');
         if(selectedfield != null && selectedfield != 'undefined')
             selectedfield.value=impactvalue;
         if(typeof(document.getElementById(getHTMLInputID(orgNamespace+'FKImpact__c')))!= 'undefined' && document.getElementById(getHTMLInputID(orgNamespace+'FKImpact__c')) != null)
			setImpactValue('impactSelectId');
     }
     if(statusvalue!= null && statusvalue != '')
     	{
          selectedfield=document.getElementById('statusSelectId');
           if(selectedfield != null && selectedfield != 'undefined')
            	selectedfield.value=statusvalue;
           if(typeof(document.getElementById(getHTMLInputID(orgNamespace+'FKStatus__c')))!= 'undefined' && document.getElementById(getHTMLInputID(orgNamespace+'FKStatus__c')) != null)
				setStatusValue('statusSelectId');
		}
	 if(UserIdvalue!= null && UserIdvalue != '')
      {
		selectedClientName = clientName;
       	clientfields(UserIdvalue,clientName);
      }                 
	  
	 if(typeof(isEnableDynamicFields) != 'undefined' && isEnableDynamicFields && typeof(reEvaluateDynamicFieldsConditions) != 'undefined'){
		reEvaluateDynamicFieldsConditions(fieldVisiblityMap);
	 }
 }




//set flag if the form contents are unsaved
function setTabUnsavedChanges()
{
   if(!window.parent.clickedOnce)
   {
		window.parent.clickedOnce= true;
		
		//template filed is not handled for Broadcast Console.

		window.parent.setTabUnsavedChanges();//for service could console tab
		
		//If the template is selected from type ahead before doing any changes into the form then set flag to 1 
		if (currentField && currentConsole != 'Problem' && currentConsole != 'Broadcast') {
			if (!isTemplateSelectedFromTypeAhead) {
				var templateField = document.getElementById(getHTMLInputID(orgNamespace+'FKTemplate__c'));
				if (templateField) {
					if (currentField!=null && currentField!=undefined && currentField.id == templateField.id) {
						isTemplateSelectedFromTypeAhead = true;
					}
				}
			}
		}
		
		
		window.parent.handleChange();
		
   }
}

//set flag if the form layoutType contents are unsaved
function setTabUnsavedChangesForLayoutType()
{
	if(!window.parent.layoutTypeClickedOnce)
	{
		window.parent.layoutTypeClickedOnce= true;
		window.parent.handleChange();
	}
}

function escSpeChars(speCharStr){
	speCharStr = replaceAll(speCharStr,'\\','?');
	speCharStr = replaceAll(speCharStr,'?','\\');
	speCharStr = replaceAll(speCharStr,'?','?');
	speCharStr = replaceAll(speCharStr,'?','\\?');
	speCharStr = replaceAll(speCharStr,'^','?');
	speCharStr = replaceAll(speCharStr,'?','\\^');
	speCharStr = replaceAll(speCharStr,'$','?');
	speCharStr = replaceAll(speCharStr,'?','\\$');
	speCharStr = replaceAll(speCharStr,'(','?');
	speCharStr = replaceAll(speCharStr,'?','\\(');
	speCharStr = replaceAll(speCharStr,')','?');
	speCharStr = replaceAll(speCharStr,'?','\\)');
	speCharStr = replaceAll(speCharStr,'[','?');
	speCharStr = replaceAll(speCharStr,'?','\\[');
	speCharStr = replaceAll(speCharStr,']','?');
	speCharStr = replaceAll(speCharStr,'?','\\]');
	speCharStr = replaceAll(speCharStr,'{','?');
	speCharStr = replaceAll(speCharStr,'?','\\}');
	speCharStr = replaceAll(speCharStr,'*','?');
	speCharStr = replaceAll(speCharStr,'?','\\*');
	speCharStr = replaceAll(speCharStr,'+','?');
	speCharStr = replaceAll(speCharStr,'?','\\+');
	speCharStr = replaceAll(speCharStr,'|','?');
	speCharStr = replaceAll(speCharStr,'?','\\|');
	return speCharStr; 
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
 function showapprovalsucesmsg(){
	var jsscriptsucessmsg=document.getElementById('jsscriptsucessmsg');
    if(jsscriptsucessmsg){
	    var PanelWidth,divWidth,leftAlign;
	    PanelWidth=window.parent.document.getElementById('detailViewChildPanelId').clientWidth;
	    jsscriptsucessmsg.style.display = "table";
		divWidth = jsscriptsucessmsg.clientWidth;
		jsscriptsucessmsg.style.display = "none";
		
	    if(PanelWidth && divWidth)
			leftAlign = parseInt((PanelWidth/2)-(divWidth/2)-35);
		jsscriptsucessmsg.setAttribute('style','display: table; position: absolute; left: '+ leftAlign +'px; margin-top: 50px;z-index:2;');
		ChangeVisibilityVar = setTimeout(function(){
			CloseApprovalPopUp();
		}, 3000);
    }
 }

 function CloseApprovalPopUp(){
	document.getElementById('jsscriptsucessmsg').setAttribute('style','display:none;');
}
 
function applyMarginToErrorMessage(){
   var calculatedMargin = document.getElementById('topmenu').clientHeight - 35;
   var calculatedMarginTop = document.getElementById('topmenu').clientHeight + 10;
   var calculatedMarginBottom = -(calculatedMargin - 9);
   if(document.getElementById('errorDescId') && document.getElementById('errorDescId').hasChildNodes()){
	document.getElementById('jsscripterrorId').setAttribute('style','display:block; margin-top :'+calculatedMarginTop.toString()+'px !important; margin-bottom : '+calculatedMarginBottom.toString()+'px !important; list-style-type: none');
   }      
   else if((document.getElementById('thpage:theForm:pageMessage') && document.getElementById('thpage:theForm:pageMessage').hasChildNodes()) || (document.getElementById('thpage:theForm:collisionMessage') && document.getElementById('thpage:theForm:collisionMessage').hasChildNodes())){
   	var pageMessage = document.getElementById('thpage:theForm:pageMessage');
   	if (pageMessage) {
   		pageMessage.setAttribute('style','display:block; margin-top :'+calculatedMarginTop.toString()+'px !important; margin-bottom : '+calculatedMarginBottom.toString()+'px !important;');
   	}
	var collisionMsg = document.getElementById('thpage:theForm:collisionMessage');
	if (collisionMsg) {
		collisionMsg.setAttribute('style','display:block; margin-top :'+calculatedMarginTop.toString()+'px !important; margin-bottom : '+calculatedMarginBottom.toString()+'px !important;');
	}
   }
 }

 //This listener updates the Has Attachment count when event is triggered after adding/removing attachment
 window.parent.document.addEventListener('activityFeedAttachFileChange',function(evnt){
	var idSelectorParam = "[rf-fieldapiname='"+orgNamespace + "RF_HasAttachments__c']";
	var inputElement = document.querySelector("input"+idSelectorParam);
	if(inputElement) {
		inputElement.value = evnt.detail;
	} else {
		var spanElement = document.querySelector("span" + idSelectorParam);
		if(spanElement) {
			spanElement.innerText = evnt.detail;
		}
	}
});

window.parent.document.addEventListener('ciChangeFromChild',function(evnt){
	var eventData = evnt.detail;
	var idSelectorParam = "[rf-fieldapiname='"+eventData.fieldAPIName+"']";
	var selectorElement = document.querySelector(idSelectorParam);
	if(selectorElement) {
		var elemntID = selectorElement.id;
		var nameElement = document.getElementById(elemntID);
		if(nameElement) {
			nameElement.value=eventData.recName;
		}
		var idElement = document.getElementById(elemntID+'_lkid');
		if(idElement) {
			idElement.value=eventData.recId;
		}
		var lkOldElement = document.getElementById(elemntID+'_lkold');
		if(lkOldElement) {
			lkOldElement.value=eventData.recName
		}
	}
	
	if(typeof(isEnableDynamicFields) != 'undefined' && isEnableDynamicFields && typeof(reEvaluateDynamicFieldsConditions) != 'undefined'){
		reEvaluateDynamicFieldsConditions(fieldVisiblityMap);
	}
	
});
 
window.parent.showReadOnlyMsg = function (message){
        	var pageMsg = document.getElementById('thpage:theForm:pageMessage');
			var  theDiv =  document.getElementById('errorDescId');
 			
			var text1 = document.createElement("div");
			text1.appendChild(document.createTextNode(message));
			text1.setAttribute('style', 'padding-top: 5px;');
			theDiv.appendChild(text1);	
			
			var calculatedMargin = document.getElementById('topmenu').clientHeight - 35;
  			var calculatedMarginTop = document.getElementById('topmenu').clientHeight + 15;
  			var calculatedMarginBottom = -(calculatedMargin - 4);
  			document.getElementById('jsscripterrorId').setAttribute('style','display:block; margin-top :'+calculatedMarginTop.toString()+'px !important; margin-bottom : '+calculatedMarginBottom.toString()+'px !important;');
  			window.scroll(0,0);
  			// if record locked then needs to disable layout type dropdown
  			var layoutType = document.getElementById('layoutSelectID');
  			if(layoutType !== null)
			{
  				layoutType.setAttribute("disabled","disabled");
			}
   };

	function onchangehandler(fieldApiName){
		if(fieldListeners.hasOwnProperty(fieldApiName) >= 0)
			smartSuggestionsHandler();
	}
        
	function addListenerforFields(fieldApiName){
		var el=document.getElementById(lookupFilterIDMap[fieldApiName]);
		var type = lookupFilterTypeMap[fieldApiName];
		var typingInterval=3000;	
		var typingTimer;
		if (fieldApiName.indexOf('FKImpact__c') > 0)
			incidentMatchOnImact = true;
		else if (fieldApiName.indexOf('FKUrgency__c') > 0)
			incidentMatchOnUrgency = true;
		else if (fieldApiName.indexOf('FKStatus__c') > 0)
			incidentMatchOnStatus = true;
		else {
			if (el!=null && el!=undefined && el.addEventListener){
				if ( type == 'reference' || type == 'boolean' || type == 'datetime' || type == 'date' || type == 'picklist') {
					el.addEventListener('change', function(e){
							e.preventDefault();
							clearTimeout(typingTimer);
							typingTimer = setTimeout(function(){
								if(fieldListeners.hasOwnProperty(fieldApiName) >= 0)
									smartSuggestionsHandler();
							},0);
					   }, 'false' );
					//For lookups other than client & category, adding inline onchange event to lkid component. This event will be manually fired from typeahead.   
					if(type == 'reference'){
						if(fieldApiName != orgNamespace + 'FKClient__c' && fieldApiName != orgNamespace + 'FKCategory__c'){
							var lkid = document.getElementById(el.id + '_lkid');
							if(lkid){
								if(fieldListeners.hasOwnProperty(fieldApiName) >= 0){							
									lkid.onchange=function(){
										smartSuggestionsHandler();
									};	
								}
							}
						}
					}
				}
				if(type == 'multipicklist'){
					el.onchange=function(){
						onchangehandler(fieldApiName);
					};
				}
				if ( type != 'boolean' && type != 'picklist' && type != 'multipicklist') { 
					el.addEventListener('input', function(e){
							e.preventDefault();
							clearTimeout(typingTimer);
							typingTimer = setTimeout(function(){
								if(fieldListeners.hasOwnProperty(fieldApiName) >= 0)
									smartSuggestionsHandler();
							},typingInterval);
					   }, 'false' );
				}
			}
		}
	}

	function VIPClientIcon(isVIP)
	{
	 var VipIcon = document.getElementById('VIPClientIcon') ;
	 if( VipIcon != null && VipIcon != undefined)
		{
			if(isVIP){
				VipIcon.style.visibility = 'visible';
			}else{
				VipIcon.style.visibility = 'hidden';
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

function replaceErrorMessages(pageMessageBlockId) {
    var messageBlock = document.getElementById(pageMessageBlockId);
    var errorTitle;
    var errorMessages = [];
    var messageTable = messageBlock.getElementsByClassName('messageTable');
	if (messageTable && messageTable.length > 0) {
		var messageText = messageTable[0].getElementsByClassName('messageText');
		if (messageText && messageText.length > 0 && messageText[0].hasChildNodes()) {
			for (var j = 0; j < messageText[0].childNodes.length; j++) {
				if (messageText[0].childNodes[j].nodeType == 3) {
					errorMessages.push(messageText[0].childNodes[j].nodeValue.replace(/(?:\\[rn]|[\r\n]+)+/g,''));
					break;
				}
			}
			var errorH4 = messageText[0].getElementsByTagName('H4');
			if (errorH4 && errorH4.length > 0) {
				errorTitle = errorH4[0].innerText;
			}
		}
		
		if (errorMessages.length == 0) {
			var errorMsgLis = messageTable[0].getElementsByTagName('LI');
			if (errorMsgLis.length > 0) {
				for (var k = 0; k < errorMsgLis.length; k++) {
					errorMessages.push(errorMsgLis[k].innerText.replace(/(?:\\[rn]|[\r\n]+)+/g,''));
				}
			}
		}
		
		var errorDiv = document.createElement('DIV');
		errorDiv.className = "d-notification d-notification_error d-notification_content";
		var errorIcon = document.createElement('DIV');
		errorIcon.className = "d-notification__icon d-icon-left-exclamation_triangle";
		var errorSupportingText = document.createElement('DIV');
		errorSupportingText.className = "d-notification__supporting-text maxWidthNone";

		if (errorTitle) {
			var errorNotificationTitle = document.createElement('H3');
			errorNotificationTitle.className = "d-notification__title";
			errorNotificationTitle.appendChild(document.createTextNode( errorTitle ));  
			errorSupportingText.appendChild( errorNotificationTitle );
		}
	   
		for (var i = 0; i < errorMessages.length; i++) {
			var errorMessageItem = document.createElement('P');
			errorMessageItem.className = "d-notification__item";
			errorMessageItem.appendChild(document.createTextNode( errorMessages[i] ));
			errorSupportingText.appendChild( errorMessageItem );
		}

		errorDiv.appendChild( errorIcon );
		errorDiv.appendChild( errorSupportingText );
		RemedyForceHTMLProcessor.clearHTML(messageBlock);
		messageBlock.appendChild( errorDiv );
	}
}

function alignTopbarWidth(mainDivID,topbarId) {
	var DivElement=document.getElementById(mainDivID);
	var tobBarElement = document.getElementById(topbarId);
	if(DivElement && tobBarElement) {
		var PanelhasScrollbar=hasScrollbar(DivElement);
	  	if(PanelhasScrollbar == true)
	    	tobBarElement.style.width="98.5%";
	  	else
		    tobBarElement.style.width="100%";
	}
}

function hasScrollbar(element) {
	var hasScrollbar =  element.scrollHeight > element.clientHeight;      
	return hasScrollbar
}

function setTitleForMultiPicklist() {
	var multiPicklistElements = Ext.query("select[multiple]");
	if(multiPicklistElements) {
		multiPicklistElements.forEach(function(pk){
			processMultiPicklistTitle(pk);
		});
	}
	
	if(typeof(isEnableDynamicFields) != 'undefined' && isEnableDynamicFields && typeof(reEvaluateDynamicFieldsConditions) != 'undefined'){
		reEvaluateDynamicFieldsConditions(fieldVisiblityMap);
	}
}
function processMultiPicklistTitle(pkElement) {
	var options = Ext.query("option", pkElement);
	if(options) {
		options.forEach(function(option) {
			option.title = option.text;
		});
	}
}
function resetTitleForMultiPicklist(hiddenPKElement) {
	if(hiddenPKElement.parentElement)
		processMultiPicklistTitle(hiddenPKElement.parentElement);
}

//This function is used to make the field which are rendered in readonly mode after saving or applying template 
//For ex. category field is showing as readonly with clear icon after applying incident
//For ex. category field is showing as readonly without clear icon after saving incident
//For ex. If you add any custom lookup field which type of controlling field
//So we hide clear icon and make the field as enabled
function setFieldEnabled() {
	try {
		var fields = getElementsByClassName("emptyDependentLookup");
		if (fields.length > 0) {
			for(var i=0;i<fields.length;i++) {
				var parentNode = fields[i].parentNode;
				parentNode.className = "lookupInput";

				var childNodes = parentNode.childNodes;
				var deleteChildNodes = [];
				if (childNodes.length > 2) {
					//Display the original field by removing readonly attribute and style 
					//#78193- we should remove style for status ,urgency and impact as we are converting picklist 
					for(var i=0; i<childNodes.length; i++) {
						if (childNodes[i].nodeName.toLowerCase() == 'input') {
							if(childNodes[i].className == "emptyDependentLookup readonly") {
								deleteChildNodes.push(i);
							} else {
								if(lookupFilterIDMap != null && (childNodes[i].id != lookupFilterIDMap[orgNamespace+'FKStatus__c'] && childNodes[i].id != lookupFilterIDMap[orgNamespace+'FKImpact__c'] && childNodes[i].id != lookupFilterIDMap[orgNamespace+'FKUrgency__c'])) {
									childNodes[i].removeAttribute("style");
								}
								childNodes[i].removeAttribute("readonly");
							}
						} else if(childNodes[i].nodeName.toLowerCase() == 'a') {
							childNodes[i].className += " d-icon-search lookupIcon rfdplIconFontSize ";
						} else if(childNodes[i].nodeName.toLowerCase() == 'img') {
							deleteChildNodes.push(i);
						}
					}
					
					for(var i = (deleteChildNodes.length -1); i >= 0; i--) {
						parentNode.removeChild(childNodes[deleteChildNodes[i]]);
					}
				}
			}
		}
	}
	catch (ex) {}
}

function getModuleLayoutDetails(moduleName){
	var layoutObj =[];
	var layoutDetailArray = [];
	if(window.parent.parent.MultiPageLayout.details != undefined){
		layoutObj = window.parent.parent.MultiPageLayout.details;
	}
	if(moduleName.toLowerCase() in layoutObj){
		layoutDetailArray = layoutObj[moduleName.toLowerCase()];
	}
	return layoutDetailArray;
}


function createLayoutTypePicklist(moduleName){
	try{
	var layoutDetails =[];
	if(moduleName != undefined && moduleName != '' && window.parent != undefined && window.parent.isServiceCloudConsole != 'true'
		 && window.parent.isRFConsoleDetailForm && window.parent.parent != undefined && window.parent.parent.MultiPageLayout != undefined 
		&& window.parent.parent.MultiPageLayout.isEnabled != undefined && window.parent.parent.MultiPageLayout.isEnabled){
		var isEditLayout = false;
		if(moduleName.toLowerCase() == 'in'){
			if((inctype != undefined && inctype == 'ServiceRequest') || isServiceRequest == 'true'){
				layoutDetails = [];
			} else {
				layoutDetails = getModuleLayoutDetails(moduleName.toLowerCase());
			}
		} else {
			layoutDetails = getModuleLayoutDetails(moduleName.toLowerCase());
		}
		if(window.parent.parent.MultiPageLayout.isEdit != undefined && window.parent.parent.MultiPageLayout.isEdit[moduleName.toUpperCase()]){
			isEditLayout = true;
		}
	}
	
	if(layoutDetails.length >0){
	
		var layoutSelectLabel = document.createTextNode(layoutTypeLabel);
		var layoutSelect = document.createElement("select");
		layoutSelect.setAttribute("name", "layoutSelect");
		layoutSelect.setAttribute("id", "layoutSelectID");
		layoutSelect.setAttribute("class", "layoutSelectCls");
		
		if((((typeof(incidentId) != 'undefined' && incidentId.trim() != '')|| (typeof(taskId) != 'undefined'  && taskId.trim() != '') || (typeof(changeReqId) != 'undefined' && changeReqId.trim() != ''))&& !isEditLayout && window.parent.previousFormLayoutId != '') || (oldRecordId !== '') || window.parent.isDeleted){
			layoutSelect.setAttribute("disabled","disabled");
		}
					
		//on change function
		layoutSelect.onchange = function(){
			layoutOnChangeHandler(this.value,moduleName,this,null);
		}
		layoutSelect.onfocus = function(){
			oldVal = this.value;
		}
		var layoutSelectedIndex = '';
		if(typeof(layoutid)!= 'undefined' && (layoutid == '' || layoutid == null))
		{
			layoutSelect.options[layoutSelect.options.length] = new Option(None, '');
			layoutSelect.selectedIndex = layoutSelect.options.length - 1;
		}
		// iterate layoutDetails array and populate layout picklist field select options
		var found = false;
		for(var layout=0; layout < layoutDetails.length; layout++ ){
			if(layoutDetails[layout].layoutDetailId && layoutid && layoutDetails[layout].layoutDetailId.substr(0,15) == layoutid.substr(0,15)){
				layoutSelectedIndex = layoutSelect.options.length;
				found = true;
			}else if(layoutDetails[layout].layoutName && layoutname && layoutDetails[layout].layoutName == layoutname) {
				layoutSelectedIndex = layoutSelect.options.length;
				found = true;
			}
		    layoutSelect.options[layoutSelect.options.length] = new Option(Ext.util.Format.htmlDecode(layoutDetails[layout].layoutName), layoutDetails[layout].layoutKey + NONPRINT + layoutDetails[layout].layoutDetailId);
		}
		
		if(found){
			layoutSelect.selectedIndex = layoutSelectedIndex;
			layoutSelect.setAttribute("title", Ext.util.Format.htmlDecode(layoutDetails[layoutSelectedIndex].layoutName));
		}
		if(!found && layoutid)
		{
			layoutSelect.options[layoutSelect.options.length] = new Option(layoutname, formLayoutId);
			layoutSelect.selectedIndex = layoutSelect.options.length - 1;
		}
		
		var selectedValue = layoutSelect.options[layoutSelect.selectedIndex].value;
		// Add form layout id to smart suggestion field listener.
		if(selectedValue != '' && selectedValue.indexOf(NONPRINT) > 0 && moduleName.toLowerCase() == 'in') {
			fieldListeners[orgNamespace+'RF_FKLayout__c'] = selectedValue.substr(selectedValue.indexOf(NONPRINT) + 1, 15);
			fieldListeners['formLayoutId'] = layoutSelect.options[layoutSelect.selectedIndex].value;
		}
		
		var layoutSelectTD = document.getElementById('layoutSelectTD');
		var layoutLabelTD = document.getElementById('layoutLabelTD');
		if(typeof(layoutSelectTD) != 'undefined' && typeof(layoutLabelTD)!= 'undefined'){
			layoutLabelTD.appendChild(layoutSelectLabel);
			layoutLabelTD.setAttribute("class", "layoutLabelTDCls");
			layoutLabelTD.setAttribute("title", layoutHelpText);
			layoutSelectTD.appendChild(layoutSelect);
			layoutSelectTD.setAttribute("class", "layoutSelectTDCls");
		}
	}
	} catch (ex) {
		console.log(ex);
	}
}

var oldVal = '';
function layoutOnChangeHandler(selectedVal,moduleName,el,templateId){
	if(selectedVal != undefined && selectedVal != '' && selectedVal.indexOf(NONPRINT)> -1){
		var splitValues = selectedVal.split(NONPRINT);
		if(splitValues.length > 1){
			var layoutKey = splitValues[0];
			var layoutId = splitValues[1];
			if(layoutKey && layoutId){
				if(window.parent.clickedOnce){ //form is dirty. Get user confirmation
					var layoutIfoMsg = LayoutTypeChangeWarning;
					if(templateId){
						layoutIfoMsg = LayoutTypeChangeThroughTemplateWarning;
					}
					window.parent.Ext.Msg.defaultButton = 2;
					window.parent.Ext.Msg.baseCls= 'bmc-message';
					window.parent.Ext.Msg.show({
						title: window.parent.ConsoleCommonLabels.Labels.ConfirmAction,
						msg: layoutIfoMsg,
						buttons:Ext.Msg.YESNO,
						buttonText: { yes: window.parent.ConsoleCommonLabels.Labels.Yes, no: window.parent.ConsoleCommonLabels.Labels.No },
						icon: Ext.MessageBox.WARNING,
						fn:  function(btn){								 
							if (btn == 'yes') {
								window.parent.changeLayout(selectedVal,templateId);
							}else{
								if(!templateId){
									el.value = oldVal;
								} else {
									clearTemplateValue();
								}
								window.parent.stopWaitMsgBar();
							}
						}
					});	
				}
				else{
					if(templateId){
						setTabUnsavedChanges(); //as user is not changing template directly, form won't get dirty by itself so calling this explicitely
					}
					window.parent.changeLayout(selectedVal,templateId);
				}
			}
		}
	}
	
}

/* This method will create a new TD and Span tag and append to row containing selected multipicklist select tag
The tooltip will be taken from parent Div tag 
*/
function applyIconandHelpTextToMultiSelectPicklist(){
	try{
		var allSelects = document.getElementsByTagName("select");
		for(var i = 0;i< allSelects.length; i++){
			var currentSelect = allSelects[i];
			if (currentSelect.getAttribute('rf-fieldapiname')){
				var picklistTable = currentSelect.nextSibling;
				if (picklistTable && picklistTable.nodeName == 'TABLE'){
					for( var r = 0; r < picklistTable.rows.length; r++) {
							if((picklistTable.rows[r].className.toLowerCase().indexOf('multiselectpicklistrow'))> -1)	
							{
								var rfTooltipIcon = document.createElement('SPAN');
								rfTooltipIcon.setAttribute('class','d-icon-comment_text rfDPL-glyph-flipped rfDPLNextIcon rfDefaultCursor');
							
								var td = picklistTable.rows[r].insertCell(-1);
								td.className = "textEditorTD";
								td.appendChild(rfTooltipIcon);
							}
						}
					}
				}
			}
	}catch(err){
	}
}


/**
 * This method is to apply selected suggested category on conosle form.
 */
function selectSuggestedCategory(recordId, recordName) {
	var catDomElement = document.querySelector('[rf-fieldapiname="' + orgNamespace + 'FKCategory__c"]');
	var oldCategoryVal = (catDomElement) ? catDomElement.value : "";
	if(recordName)
		modifiedCategorizationMode  = 'Suggested'+NONPRINT+recordName;
	if(catDomElement && recordName) {
		catDomElement.value = recordName;
		var rfCongnitiveIcon = document.getElementById('rfCongnitiveIconId');
		rfCongnitiveIcon.removeAttribute('class','applied_by_auto_classification rfDPL-glyph-flipped rfDPLNextIcon rfDefaultCursor');
		rfCongnitiveIcon.setAttribute('class','auto_classification_enable rfDPL-glyph-flipped rfDPLNextIcon rfDefaultCursor');					
	}
	var AutoClassificationWindow = Ext.getCmp('AutoClassificationWindow');
	if(AutoClassificationWindow) {
		AutoClassificationWindow.close();
	}
	
	if(oldCategoryVal != recordName){
		setTabUnsavedChanges();
	}
}

function populateAutoclassificationGridStore(result) {
	AutoClassificationGridStore = new Ext.data.Store({
		fields: ['recordId', 'categoryName', 'parentTree', 'confidenceScore'], 
		data: (result) ? result : {}
	})
}

function populateAutoclassificationGridColumn() {
	autoClassificationGridColumn = [
		{
			header : '',
			sortable : false, 
			dataIndex : 'recordId', 
			menuDisabled: true,
			draggable : false,
			hidden: true
		},
		{
			header : window.parent._ServerLabels.category,
			flex:2.8,
			sortable : false, 
			dataIndex : 'categoryName', 
			menuDisabled: true,
			draggable : false,
			hidden: false, 
			renderer: function(value, metaData, record){ 
				return Ext.String.format('<a href="#" onclick="selectSuggestedCategory(\''+record.data.recordId+'\',\''+record.data.categoryName+'\')">'+value+'</a>');
			}
		},
		{
			header : window.parent._ServerLabels.ParentTree,
			sortable : false,
			flex: 2.7,
			dataIndex : 'parentTree',
			menuDisabled: true,
			draggable : false,
			hidden: false
		},
		{
			header : window.parent._ServerLabels.ConfidenceScore, 
			sortable : false, 
			flex: 1.5, 
			dataIndex : 'confidenceScore', 
			menuDisabled: true,
			draggable : false,
			hidden: false, 
			renderer: function(value){ 
				return value+'%';
			}
		}
	]
}

function generateAutoclassificationWindowItems() {
	AutoClassificationWindowItems = [
		{
			xtype: 'gridpanel',
			autoScroll: true,
			stripeRows: true,
			width: 700,
			height: 350,
			columnLines: false,
			store: AutoClassificationGridStore,
			columns : autoClassificationGridColumn,
			viewConfig: {
				forceFit: true,
				deferEmptyText: false,
				emptyText: window.parent._ServerLabels.NoRecordFoundMsg
			},
			listeners : {
				itemdblclick : function(obj, record, item, index, e, eOpts) {
					var categoryName = record.data.categoryName;
					var recordId = record.data.recordId;
					selectSuggestedCategory(recordId, categoryName);
				}
			}
		}
	]
}

function generateAutoclassificationModal() {
	var AutoClassificationWindow = new Ext.Window({
		modal : true,
		layout: 'fit',
		title: window.parent._ServerLabels.SuggestedCategories,
		height: 350,
		width: 700,
		bodyStyle:'padding-top: 25px; padding-bottom:5px; background:#FFFFFF !important;',
		style: 'padding: 0; border-width: 0;background:#FFFFFF;',
		border:false,
		closable : false,
		modal:true,
		resizable:false,
		constrain : true,
		viewConfig: {
			forceFit: true
		},
		cls: 'Auto-Classification-Window',
		id: 'AutoClassificationWindow',
		tools:[{
			type:'rfAutoCalssificationClose',
			handler: function(event, toolEl, panelHeader) {
				Ext.getCmp('AutoClassificationWindow').close();
			}
		}],
		items: AutoClassificationWindowItems,
	}).show();
}
