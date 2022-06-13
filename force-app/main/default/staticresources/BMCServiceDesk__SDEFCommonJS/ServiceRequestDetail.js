var NumberFormatter =  new Ext.form.NumberField({
						allowNegative : false
					});
var isRefreshEvent = false;	
var	inputHistoryStore;
var isSRPanelExpanded=true;
var frameHeight=0;					
var inputHistory=[];
var gridPanel,serviceDetailFormId='',isForSROnly=false;

function renderGrid(){
	gridPanel.render('inputHistoryGrid');
}


function closeIt() {  //this
			
			if(isRefreshEvent){
				isRefreshEvent =false;
				return;
			}else{
				return "Please save your data before you leave this page.";
			}
			
		}

        function initiateSelfClosing() {//this
		    if(IncidentSegregationEnabled && inctype=='ServiceRequest')
				return;
            if(standardLayout== 'true'){
              if (requestDetailId == null || requestDetailId== '' || typeof(requestDetailId) == 'undefined'){
              
                  window.onbeforeunload = closeIt;    
                                                                                                                                                                                      
              }else{
                window.onbeforeunload = null;
              } 
            }
        }
	 function getUrlParameter( param ){
        param = param.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var r1 = "[\\?&]"+param+"=([^&#]*)";
        var r2 = new RegExp( r1 );
        var r3 = r2.exec( window.location.href );
        if( r3 == null ){return ""}
        else {return r3[1]};
    }  	
    function buttonValidator() { //this 
        	if(isConsole == 'true'){
				window.onbeforeunload = null;
				if((requestDetailId != null && requestDetailId != '')&&(errormsg == null||errormsg ==''||errormsg==succesvar)){ 
					if((isEdit != null && isEdit != 'true')){
						Ext.getCmp('saveId').setDisabled(true);
						Ext.getCmp('resetId').setDisabled(true);
					}
					
						window.opener.setIsNeedToRefreshRelatedList(true);
						window.opener.loadIncidentDetails(incidentId);
					
					window.close();
				}
			}else{
				if( standardLayout == 'true' ){
					if((requestDetailId != null && requestDetailId != '')&&(errormsg == null||errormsg ==''||errormsg==succesvar)){   
						if((isEdit != null && isEdit != 'true')){
							Ext.getCmp('saveId').setDisabled(true);
							Ext.getCmp('resetId').setDisabled(true);
						}
						
							if( standardLayout == 'true' ){
								window.onbeforeunload = null;
								window.parent.opener.saveIncidentWithRequestDtl(requestDetailId);
								window.close();
						   }
					}
			   }
		   }
     } 	

var initialCost =0; 
	var officialNamespace='';
	
	
	var SaveBtnHandler = function(button,event) {
		Ext.getCmp('editId').setDisabled(false);
		isEdit='false';
		if(richInputHidden!=null && typeof(richInputHidden)!='undefined' && richBodyComponent!=null && typeof(richBodyComponent)!='undefined')	
			document.getElementById(richInputHidden).value = RemedyForceHTMLProcessor.getElementHTML(richBodyComponent);
		
        var dynamicInputMapJSON=formJason();		
		save(dynamicInputMapJSON); 		
	};
	var editServiceRequests = function(button,event) {
		Ext.getCmp('saveId').setDisabled(false);
		Ext.getCmp('editId').setDisabled(true);
		editServiceRequest();
	};
    var ResetBtnHandler = function(button,event) {  
		
		isRefreshEvent = true;
		replaceUrl();
		
        
     };
	 var displaybuttonhandler = function(button,event)
	 {
		window.open(srd);
	 };
	 var PreviuosBtnHandler = function (button,event) {previous();};
	 var NextBtnHandler = function (button,event) {next();};
     var quantitySpinner;
     var currencyDecimal=0;
	 
	function setInputDataStore(listData) {
		if (listData == null)
			return;
		if(inputHistoryStore != null && typeof(inputHistoryStore) != 'undefined'){
			inputHistoryStore.removeAll();
			inputHistoryStore.loadData(listData);
		}
	}
	function setUnitPrice(){
		if(initialCost != undefined && initialCost != null) {
			if(!isNaN(initialCost)) {
				NumberFormatter.setValue(initialCost);
				var unitPriceEle= document.getElementById('unitPrice');
				if(unitPriceEle!=undefined && unitPriceEle!=null){
				 var unitPriceValue= NumberFormatter.getRawValue();
				 unitPriceEle.innerText=unitPriceValue;
				 if(enableLocaleNumberFormat && unitPriceValue && unitPriceValue!=''){
					 unitPriceEle.innerText= unitPriceValue.trim().replace(".",localeDecimalSeparator);
				 }
				}
			}
		}
    }
	function convertInitialCostToInt(){
		if(initialCost!=undefined && initialCost!=''){
			initialCost = parseInt(initialCost);
		}else{
			initialCost = 0;
		}
	} 
     Ext.onReady(function(){
    	initialCost = getInitialCost();
		var detailQuantity = getDetailQuantity();
		setUnitPrice();
		if(detailQuantity == 0)
			detailQuantity = 1; 

		var tBar= new Ext.Toolbar({
        //renderTo: 'toolBar',
         cls:'toolSpCls',
		id:'SLToolbar',
         items: [
                {
                    scale: 'medium',
                    iconCls: 'bmcSave',
                    tooltipType : 'title',
                    tooltip: ServiceRequestPage.Labels.Save,
                    id:'saveId' ,
                    handler:SaveBtnHandler   
                 },'',
                 {
                    scale: 'medium',
                    iconCls: 'bmcEdit',
                    tooltipType :'Edit',
                    tooltip: 'Edit', 
                    id:'editId',
					handler:editServiceRequests
                },'',
                 {
                    scale: 'medium',
                    iconCls: 'bmcResetOn',
                    tooltipType : 'title',
                    tooltip: ServiceRequestPage.Labels.Reset, 
                    id:'resetId',
					handler:ResetBtnHandler
                },'',
				
				 {
                    scale: 'medium',
                    iconCls: 'bmcMoreInfo',
                    tooltipType : 'title',
                    tooltip: ServiceRequestPage.Labels.MoreInfo,
					hidden:(srd!='')?false:true,
                    id:'dispinfo' ,
                    handler:displaybuttonhandler   
                 
                },
				{
                    scale: 'medium',
                    iconCls: 'bmcPdficon',
                    tooltipType : 'title',
                    tooltip: ServiceRequestPage.Labels.Print, 
                    id:'printId',
					handler:printPage
                }
         ]
    });
    if( (IncidentSegregationEnabled && inctype!='ServiceRequest') || !IncidentSegregationEnabled )
		tBar.render('toolBar');
	if(isConsole =='true'){
    if(editSR == null || editSR != true || window.opener.isRfconsole != 'true'){
		Ext.getCmp('editId').setVisible(false);
	}
	}	
	else
	 	Ext.getCmp('editId').setVisible(false);
	
	if(editDisableFlag == null || editDisableFlag == true)
	Ext.getCmp('editId').setDisabled(true);
	else
	Ext.getCmp('editId').setDisabled(false);
	
	inputHistoryStore = new Ext.data.ArrayStore({
							data : inputHistory,
							fields : ['Id', 'Input__c', 'LastModifiedDate', 'Response__c', 'NewResponse__c','LastModifiedById']
					});                 
	var colModel = new Ext.grid.ColumnModel([
												{
													header : 'Id',
													dataIndex : 'Id',
													hidden:true
												},
												{
													header : ServiceRequestPage.Labels.Input,
													dataIndex : 'Input__c',
													sortable:true
												},
												{
													header : ServiceRequestPage.Labels.ValueBefore,
													dataIndex : 'Response__c',
													sortable:true
												},
												{
													header : ServiceRequestPage.Labels.ValueAfter,
													dataIndex : 'NewResponse__c',
													sortable:true
												},
												{
													header : ServiceRequestPage.Labels.Date,
													dataIndex : 'LastModifiedDate',
													sortable:true
												},
												{
													header : ServiceRequestPage.Labels.User,
													dataIndex : 'LastModifiedById',
													sortable:true
												}
									]);     
	var gridView = new Ext.grid.GridView({forceFit:true, scrollOffset: 0}); 
	var selModel = new Ext.grid.RowSelectionModel({ 
						singleSelect : true
					})
	var historyGrid = new Ext.grid.GridPanel({
										id:'inputHistoryGridId',
										store : inputHistoryStore, 
									    view : gridView,
										columnLines:true,
										border: true,
										stripeRows:false,
										//autoScroll: true,
										colModel : colModel,
										enableHdMenu:false,
										selModel : selModel,
										layout:'fit',
										autoExpandColumn:true,
									    autoHeight:true,
										autoWidth:true
							}); 

	gridPanel = new Ext.Panel ({
									layout:'fit',
									items:[historyGrid]
	});
	Ext.EventManager.onWindowResize(gridPanel.doLayout, gridPanel);

    var setQuantity =  function(){
            var quantityEle = fetchQuantityText();
			var quantity = quantitySpinner.getValue();
            quantityEle.value = quantity;
			var totalCostEle = document.getElementById('totalCost');
			if(initialCost != undefined && initialCost !=null &&
				totalCostEle != undefined && totalCostEle!=null
				) {
					var total = 0;
					if(!isNaN(initialCost)) {
						total = initialCost * quantity;
					} 
					NumberFormatter.setValue(total);
					var totalPriceValue= NumberFormatter.getRawValue();
					totalCostEle.innerText=totalPriceValue;
					if(enableLocaleNumberFormat && totalPriceValue && totalPriceValue!=''){
						totalCostEle.innerText= totalPriceValue.trim().replace(".",localeDecimalSeparator);
					}					
				}
				var quantityView= getQuantityViewId();
				if(enableLocaleNumberFormat && quantityView){
					if(enableLocaleNumberFormat){
						quantityView.innerText= quantity;
					}
				}
        } 
           quantitySpinner= new Ext.ux.form.SpinnerField({
                id:'quantitySpinner',
                value:detailQuantity,
                minValue: 1,
                maxValue: 999,
                width:100,
                maxLength:3,
                allowDecimals: false,
				readOnly:quantitySpinnerState,
                autoCreate: {tag: 'input', type: 'text', autocomplete: 'off', maxlength: '3'},
                enableKeyEvents : true,
                listeners: {
                spin:  function(){
                     setQuantity(); 
                }
                        ,
                keyup:  function(obj, e){
                            validateSpinnerField(obj, e);
							setQuantity();
                }
                       ,
                keydown:    function( obj, e) {
                                if(e.getKey()==109)
                                e.stopEvent();
                            }
                }   
            });
				if(showQuantity)
					quantitySpinner.render('quantity');
	   setQuantity();
		if(incidentWithRequest){ 
			if((isEdit != null && isEdit != 'true')){
				Ext.getCmp('saveId').setDisabled(true);
				Ext.getCmp('resetId').setDisabled(true);
			}
			//Ext.getCmp('saveId').setDisabled(true);
			//Ext.getCmp('resetId').setDisabled(true);
		}
		setTimeout(renderGrid,5000);
		renderGrid();
	}); 
	
	function validateSpinnerField(obj,e){
		var val=obj.getValue();
		val=val.toString();
		if(val!='' && val< obj.minValue){
		  obj.setValue('');  
		} 
	}

function setIdToParent(){
	if(requestDetailId != null && typeof(requestDetailId) != 'undefined'){
	if( standardLayout != 'true' ){
		window.parent.RequestDetailId(requestDetailId); 
	}
else{
if(window.parent&&window.parent.opener&&window.parent.opener.requestDetail){
	window.parent.opener.requestDetail= requestDetailId;
}
}	
}
}	

function openPopUpForSR(obj,localName){
	openLookupPopup(obj,localName,'SRM_RequestDetail__c',null,null,officialNamespace+'SearchPage');
	return false;
}

function assignApexErrorMessage(){			
	var elem = document.getElementById('apexMessageErrorPanelDiv');
	if(elem != null && elem.firstChild != null){
		var ulList = elem.firstChild;
		var msgvalue = RemedyForceHTMLProcessor.getText(ulList.firstChild);
if(IncidentSegregationEnabled && inctype=='ServiceRequest'){
	if(msgvalue!=null && msgvalue!=''){
		window.parent.isErrorMessage=true;
		window.parent.showPageMsg(msgvalue);
	}	
}
else{
		Ext.MessageBox.show({ msg: msgvalue, buttons: Ext.MessageBox.OK});
	}
}
}

function showErrorMessage(){

    if(IncidentSegregationEnabled && inctype=='ServiceRequest'){
		 var parentWin=window.parent;
	     parentWin.stopWaitMsgBar();
	 	if(succesvar == errormsg){
		 if(parentWin){
			  parentWin.document.getElementById(parentWin.reqDetail_Id).value =  requestDetailId;
			  if(parentWin.parent.saveIncAfterSR!=undefined){
					parentWin.parent.saveIncAfterSR();
			  }
		  }
		}else if(errormsg!=null && errormsg !=''){
			window.parent.isErrorMessage=true;
			window.parent.showPageMsg(errormsg);
		}
	}else{
		var msgTitle;
		if(succesvar == errormsg)
			msgTitle = '';
		else
			msgTitle = ServiceRequestPage.Labels.Error; 
		
		if(isConsole == 'true' && succesvar == errormsg && window.opener && window.opener.parent && window.opener.parent.parent && window.opener.parent.parent.doRefresh){
					window.opener.parent.parent.doRefresh();	
		}
		if(errormsg!=null && errormsg !=''){
			Ext.MessageBox.show({                                
				title: msgTitle,
				msg: errormsg,
				minWidth:300,
				cls : 'removeDotFromList',
				buttons: Ext.MessageBox.OK
			});
		}
	}
}
 //Open PDF format page in new window   
  function printPage(){
  	window.print();
  }
function showSRPanel(){
	var tdEle = document.getElementById('mainTD_Id');
	var srdFrameId = window.parent.document.getElementById('srdFrameId');
	if(frameHeight==0){
		frameHeight=srdFrameId.clientHeight;
	}
	var toggleSpan = document.getElementById('SRToggleSpan'); 
	
	if(isSRPanelExpanded){
	    isSRPanelExpanded=false;
	    tdEle.style.display = "none";
		srdFrameId.style.height='70px';
		toggleSpan.className = "d-icon-angle_right rfDPL-toggle-icon";
	}else{
		isSRPanelExpanded=true;
		tdEle.style.display = "block";
		srdFrameId.style.height=frameHeight+'px';
		toggleSpan.className = "d-icon-angle_down rfDPL-toggle-icon";
	}
}

var SRDetaildelayCounter=0;     
var SRDetailrichBodyId,SRDetailvisibleLines;   
   
function SRDetaildelayFuncForRichText(){	
		var SRDetailrichBodyComponent,SRDetaildoc,SRDetailFulfillmentRTFiframe;
		var SRDetailiframeList=document.getElementsByTagName('iframe');
		//loop through available iframes on the page
		for(i=0;i<SRDetailiframeList.length;i++){
		var SRDetailifrm=SRDetailiframeList[i];			

		if(SRDetailifrm!=null && typeof(SRDetailifrm)!='undefined'){			
			if(SRDetailcheckIsIEEleBrowser()){
				SRDetaildoc=SRDetailifrm.contentDocument;
			}else if(Ext.isIE){
				SRDetaildoc = SRDetailifrm.contentWindow.document;
			}else{
				SRDetaildoc=SRDetailifrm.contentDocument;
			} 	
				if(SRDetaildoc!=null && typeof(SRDetaildoc)!='undefined' ){
					SRDetailrichBodyComponent=SRDetaildoc.getElementById(SRDetailrichBodyId+':textAreaDelegate_Richtext_Response__c_rta_body');					
						if(SRDetailrichBodyComponent==null || typeof(SRDetailrichBodyComponent)=='undefined' ){	//for package orgs
							SRDetailrichBodyComponent=SRDetaildoc.getElementById(SRDetailrichBodyId+':textAreaDelegate_'+nameSpacePrefix+'Richtext_Response__c_rta_body');
						}					
				}				
			
			if(SRDetailrichBodyComponent!=null && typeof(SRDetailrichBodyComponent)!='undefined'){
							SRDetailFulfillmentRTFiframe = SRDetailiframeList[i].parentNode;
							break;
						}
		}
		} 
		if(SRDetailrichBodyComponent==null || typeof(SRDetailrichBodyComponent)=='undefined' ){  		  
			SRDetaildelayCounter++;
			
			if(SRDetaildelayCounter>50)//200*50= 10sec, break if took 10 sec
				return;	
			
			setTimeout(SRDetaildelayFuncForRichText,200); 
	
		}else{			
			SRDetailsetVisibleLines(SRDetailvisibleLines, SRDetailFulfillmentRTFiframe);				
			SRDetaildisableRichText(SRDetailrichBodyComponent,'true');
			SRDetailFulfillmentRTFiframe.style.padding='10px';
			if (isForSROnly && serviceDetailFormId!=undefined && serviceDetailFormId!=null){
			    var SRDetailForm= document.getElementById(serviceDetailFormId);
				if(window.parent!=null && SRDetailForm !=null)
					window.parent.AdjustIframeHeight(SRDetailForm.scrollHeight);
			}	
		}
}	

function SRDetailsetVisibleLines(noOfLines, SRDetailFulfillmentRTFiframeParent){    
    if(noOfLines!=null && typeof(noOfLines)!='undefined' && !isNaN(noOfLines)){	
		var richDiv=SRDetailFulfillmentRTFiframeParent;		
		if(richDiv!=null && typeof(richDiv)!='undefined'){
			var pixels=parseInt(noOfLines)*220/10;
			richDiv.style.height=pixels+'px'; //220px==10 visible lines for font 10	
		}	
	}
}

function SRDetaildisableRichText(SRDetailrichBodycomp,disable){	
		if(disable){
			SRDetailrichBodycomp.setAttribute("contentEditable", false);
			SRDetailrichBodycomp.setAttribute("background-color",'#D4D0C8'); 
			var SRDetailSFDCTolbar=document.getElementById('cke_1_top');
			if(SRDetailSFDCTolbar!=null && SRDetailSFDCTolbar!='undefined')
				SRDetailSFDCTolbar.style.display='none';	
		}else{
			SRDetailrichBodycomp.setAttribute("contentEditable", true);
			SRDetailrichBodycomp.setAttribute("background-color",'#D4D0C8'); 
			var SRDetailSFDCTolbar=document.getElementById('cke_1_top');
			if(SRDetailSFDCTolbar!=null && SRDetailSFDCTolbar!='undefined')
				SRDetailSFDCTolbar.style.display='block';
		
		}	
}

function SRDetailcheckIsIEEleBrowser()
{
	var SRDetailua = window.navigator.userAgent;
	var SRDetailmsie = SRDetailua.indexOf("MSIE ");
	if (SRDetailmsie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))    
		return true;
	else           
		return false;
	
} 

/* This method will create a new Span tag and append to div containing selected multipicklist select tag
The tooltip will be taken from parent Div tag 
*/
function applyIconandHelpTextToMultiSelectPicklist_SRINPUTS(){
	try{
		var allSelects = document.getElementsByTagName("select");
		for(var i = 0;i< allSelects.length; i++){
			var currentSelect = allSelects[i];			
				if(currentSelect.multiple){		
					var parentDiv = currentSelect.parentNode;
					var parentTd = currentSelect.parentNode.parentNode;
					if (parentDiv && parentDiv.nodeName == 'DIV' && parentDiv.getAttribute("title") && parentDiv.getAttribute("title")!=''){
						currentSelect.style.float="left";
						var rfTooltipIcon = document.createElement('SPAN');
						rfTooltipIcon.setAttribute('class','d-icon-comment_text rfDPL-glyph-flipped rfDPLNextIcon rfDefaultCursor');
						parentDiv.appendChild(rfTooltipIcon);
					} else if(parentTd && parentTd.nodeName == 'TD' && parentTd.getAttribute("title") && parentTd.getAttribute("title") != ''){
						var rfTooltipIcon = document.createElement('TD');
						rfTooltipIcon.setAttribute("style","padding-left : 10px;");
						rfTooltipIcon.setAttribute('class','d-icon-comment_text rfDPL-glyph-flipped rfDPLNextIcon rfDefaultCursor');							
						rfTooltipIcon.setAttribute('title',parentTd.getAttribute("title"));
						parentTd.parentNode.appendChild(rfTooltipIcon);
					}				
				}
			}
	}catch(err){
	}
}

