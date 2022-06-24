 var win;
 var dynamicInputMap=[];
 var parentTableList=new Array();
 var inputComponentMap=[];
 var dynamicInputList= new Array();
 var dateTimePostFixMap=[];
const conditionallyHiddenElements = new Set();
 var inputDataToRemote;
 var NONPRINT='¬';
 var PE='П';
function stack() {
    this.arraayStack = Array();
}
 
stack.prototype.pop = function() {
    var popedEle=this.arraayStack[this.arraayStack.length-1];
	this.arraayStack.length-=1;
    return popedEle;
};

stack.prototype.push = function(inputElement) {
	this.arraayStack.push(inputElement);    
}; 
 
 function setDate(dateId){
            var dateFieldEle = document.getElementById('date_'+dateId);
            var divEle = document.getElementById(dateId);
            divEle.previousSibling.previousSibling.value = dateFieldEle.value;
       }
       
       function validateNumber(inpTxt,flag){
           var re = new RegExp('^[1-9]*\\d*(\\'+localeDecimalSeparator+'\\d+)?$');
           if( !inpTxt.value.match(re) ){
               msg = numberErrorMsg ;
               Ext.MessageBox.show({ msg: msg, buttons: Ext.MessageBox.OK,width:300,height:'auto'});
                  
           }else{
               if(flag == 'true'){
                   checkVisibility(flag);
               }
           }
       }
	   
	   function validateMaxLength(txtElem){
           var txtVal = txtElem.value;
           if(txtVal!= null && txtVal.length > 32000){
                txtElem.value = txtVal.substr(0,32000);					
           }
         }	   
      var popupId;
      function setPopupId(id){
           popupId = id;
      }
	  function openSALPopup(obj,lookupFilterId)
       {
			var x = screen.width/2 - 671/2;
			var y = screen.height/2 - 480/2;
			filterClause='';
			var accountId ='',clientId='';
			var userId = window.parent.document.getElementById(window.parent.userId) ? window.parent.document.getElementById(window.parent.userId).value : '';
			if (window.parent.accountFieldId!=null && window.parent.accountFieldId != ''&& window.parent.accountFieldId != '000000000000000'){
				accountId = window.parent.accountFieldId;
			}
			if (userId!=null && userId!='undefined'&& userId != ''&& userId != '000000000000000'){
				clientId = userId; 
			}
			if(lookupWin != undefined){
				lookupWin.close();
			}
			var lookupFilterClause='';
			if(lookupFilterId){
				lookupFilterClause = '&idValstr='+lookupFilterId;
			}
			
			if(obj== 'Category__c'){
				var filter = 'SSINC';
				if(isStdLayout == 'true')
					filter ='SR&serviceRequest=true';
				lookupWin=window.open(SSCategorySearchPage+"?popupId=incident&objectName=Incident__c&frm=true&state=true&filter="+filter+"&forSR=true"+lookupFilterClause,"lookup","status = 1,height =480, width = 671,left="+x+",top="+y+", resizable = 0,scrollbars=no","true");
			}else{
				if(obj== 'Account' || obj== 'Action__c' || obj == 'Impact__c' || obj == 'Urgency__c' || obj == 'Status__c' || obj =='Priority__c' ){
					filterClause = escape('active_custom');
				}else if(obj == 'Change_Request__c' ||obj =='Broadcasts__c' ||obj == 'Task__c' || obj == 'Release__c' || obj == 'Problem__c' || obj =='Incident__c'){
					filterClause = escape('active_custom');
				}else if(obj == 'User'){
					filterClause = escape('active_standard');
				}else if(obj == 'BMC_BaseElement__c'){
					filterClause = escape('active_be');
				}
				lookupWin=window.open(searchAndLinkPage+"?txt=SRLookup&parentName=Incident__c&childName="+obj+"&clientId="+clientId+"&accountId="+accountId+"&filterId="+filterClause+lookupFilterClause,"lookup","status = 1,height =600, width = 1000,left="+x+",top="+y+", resizable = 0,scrollbars=no","true");				
				
         	}
      }
      function lookupValue(idname){
           var EF =inputValuesInfoSeperator; //(separator)
           var referenceId;
           var referenceName;
           if(idname.indexOf(EF) > 0){
            referenceId = RFSplit(idname,EF)[0]; // Id of the record
            referenceName = RFSplit(idname,EF)[1]; // Name of the record.
           }
           if(isSS3Deployed && typeof(idname) != 'undefined' && idname.substring(0,3) == '005' && RFSplit(idname,EF).length > 2){
        	   referenceName = RFSplit(idname,EF)[2]; //Defect: 82818 Populate full name in SR user lookup input if deployed version is SS3.0
			}
           var inpRef = document.getElementById('lookup_'+popupId);
           if(inpRef != null && idname!=null && idname!='' ){
               inpRef.value = idname;
                if(referenceName != undefined){
                   inpRef.previousSibling.previousSibling.value = decodeSpecialChar(referenceName);
                   inpRef.previousSibling.previousSibling.previousSibling.value = decodeSpecialChar(referenceName) ;
                   inpRef.previousSibling.previousSibling.previousSibling.previousSibling.value = referenceId ;
                   inpRef.previousSibling.previousSibling.previousSibling.onchange();
                }
           }
       }
       function setRefName(referenceName ){
          var inpRef = document.getElementById('lookup_'+popupId);
          if(inpRef != null){
             if(referenceName != undefined){
                inpRef.previousSibling.previousSibling.value = decodeSpecialChar(referenceName);
                inpRef.previousSibling.previousSibling.previousSibling.value = decodeSpecialChar(referenceName) ;
             }
          }
       }
	   function addExistingValuesToMap(){	
				inputDataToRemote= new Array();				
	            for(var i=0;i<dateTimePostFixList.length;i++){
					var tokens=RFSplit(dateTimePostFixList[i],PE);
					inputCmp=document.getElementById(inputComponentMap[tokens[1]]);
					if(inputCmp!=null && typeof(inputCmp)!='undefined'){
						var val = inputCmp.value;
						inputDataToRemote.push(dateTimePostFixList[i]+getNewOrOldSeparator(dateTimePostFixList[i], PE)+val);
					}	
				}
                			
	   }
        function checkVisibility(isCheckRequire){
            if(isCheckRequire == true || isCheckRequire =='true'){
		
			    showLoadingIcon();
			    if(typeof(isServiceRequestForSS1) != 'undefined' && isServiceRequestForSS1 == true){
					checkConditionsAtServer();
				}
				else {
					if(isDateTimeDispCondExist)	{ //id date or date/time comparison exists
						//add current values to the map
						addExistingValuesToMap();
						//make remote call for date comparison then call check condition
						Visualforce.remoting.Manager.invokeAction(
									_RemotingActions.getDateComparisonResults,	
									inputDataToRemote,
								function(result, event){
									dateTimePostFixMap=result;
									checkCondition();	
								},{escape: false}
							);	
					}else{//Normal scenario
						checkCondition();
					}	
				}	
            }
		}	
		
		//below function sets default values of picklist/multi-picklist/radio button or clears all assignments when no default is mentioned. 
		function setDefaultValue(dynamiInpArr){
		    var type=dynamiInpArr[2];
			
			if(type=='picklist'){//for picklist as well as multipicklist
				var fieldEle=document.getElementById('selectOption_'+dynamiInpArr[0]);
				var addInfo=0;				
				var val;
				val=dynamiInpArr[8];
				val=RFSplit(val,inputValuesInfoSeperator);
				addInfo=parseInt(dynamiInpArr[9]);

				if(val==''){//when default value is not present
						val=inputValuesInfoSeperator;
						if(addInfo==0)
							fieldEle.selectedIndex=0;   //None selection picklist
						else
							fieldEle.selectedIndex=-1;	//No selection multipicklist
				}else{//to set default value
					for(var j=0;j<fieldEle.options.length;j++){	
						var storedVal=RFSplit(fieldEle.options[j].value,inputValuesInfoSeperator);	 			
						var compVal = unescape(val[0]);
						var compStoredVal = unescape(storedVal[0]);
						if(compStoredVal==compVal){
							fieldEle.selectedIndex=j;
							val=fieldEle.options[j].value;
							break;
						}
					}
				}
				var resArray = RFSplit(val,inputValuesInfoSeperator);
				var divEle = document.getElementById(dynamiInpArr[0]);
				if(resArray !=null && resArray.length==2 && typeof(divEle) != 'undefined' && divEle != null){
					divEle.previousSibling.previousSibling.value = unescape(resArray[0]);
					divEle.previousSibling.previousSibling.previousSibling.value = unescape(resArray[1]);
				}
			}else if(type=='lookup'){
				popupId=dynamiInpArr[0];
				setRefName('');								
			}else if(type=='radiobutton'){
				var readioDiv=document.getElementById(dynamiInpArr[0]);
				var val;
				if(dynamiInpArr.length>8){//when default value is present
					val=dynamiInpArr[8];
					val=RFSplit(val,inputValuesInfoSeperator);
				}else 
					val='';		//when no default value
					
				for(var i=0;i<readioDiv.childNodes.length;i++){
					if(readioDiv.childNodes[i].type=='radio'){
						var storedVal=RFSplit(readioDiv.childNodes[i].value,inputValuesInfoSeperator);
						var compVal = unescape(val[0]);
						var compStoredVal = unescape(storedVal[0]);
						if(compStoredVal==compVal){
							readioDiv.childNodes[i].checked=true;//check default radio option
							val=readioDiv.childNodes[i].value;		
						}else{
							readioDiv.childNodes[i].checked=false;
						}
					}
				}
				
				 if(val=='')
					val=inputValuesInfoSeperator;
				 var resArray = RFSplit(val,inputValuesInfoSeperator);
				 var tableId = readioDiv.parentNode.parentNode.parentNode.parentNode; 
				 if(resArray !=null && resArray.length==2){
					tableId.previousSibling.previousSibling.value = unescape(resArray[0]);
					tableId.previousSibling.previousSibling.previousSibling.value = unescape(resArray[1]);
				 }
				
				
			}
		
		}
		var isArrayOrdered = false;
		function checkCondition(){
				if (!isArrayOrdered) {
					var tempAry1 = new Array();
					for(var i=0;i<dynamicInputList.length;i++){
						var orderNo = dynamicInputMap[dynamicInputList[i]][7] - 1;
						if(tempAry1[orderNo])
							tempAry1[orderNo].push(dynamicInputList[i]);
						else
							tempAry1[orderNo] = [dynamicInputList[i]];
					}
					dynamicInputList = new Array();
					for(var i=0;i<tempAry1.length;i++){
						dynamicInputList=dynamicInputList.concat(tempAry1[i]);
					}
					isArrayOrdered = true;
				}
				for(i=0;i<dynamicInputList.length;i++){
					var dynamiInpArr=dynamicInputMap[dynamicInputList[i]];
					var postFixExpr='';
					if(dynamiInpArr!=null && dynamiInpArr!='undefined'){
						postFixExpr=dynamiInpArr[1];
						var type = dynamiInpArr[2];
						var prevVal=dynamiInpArr[3]+'';
						dynamiInpArr[3]=evaluatePostfix(postFixExpr);//process condition for isconditionTrue.
						dynamicInputMap[dynamicInputList[i]]=dynamiInpArr;//update the value in map.
						
						var element;						
						if(type=='header section')
							element=document.getElementById(dynamicInputList[i]);
						else 
							element=document.getElementById('ful_'+dynamiInpArr[0]);

						if(element!=null && element!='undefined'){
							var isConditionTrue=dynamiInpArr[3];							
							var parentTableId=dynamiInpArr[4];
							var consoleSRIframe=window.parent.document.getElementById('srdFrameId');
							if(isConditionTrue){//unhide
							    var isHiddenFld=false;
							    if(element.style.display=='none'){
									isHiddenFld=true;
								}
								if(dynamiInpArr[6] == false){
								element.style.display='';
								   conditionallyHiddenElements.delete(dynamiInpArr[0]);
								}
								
								if(isFromSS) {
									element.style.marginTop='8px';
									element.style.paddingLeft='0px';
								}
								
								//unhide the parent table 
								var parentEle= document.getElementById(parentTableId);								
								if(parentEle!=null && typeof(parentEle)!='undefined'){
										parentEle.style.display='';
										if(isHiddenFld && consoleSRIframe!=null && consoleSRIframe!=undefined){
										 var frmHeight=parseInt(consoleSRIframe.height);
										 consoleSRIframe.height=frmHeight+parseInt(parentEle.clientHeight);//setting console SR frame
										 isHiddenFld=false;
										}
								}
								
							}else {//hide								
								var isHiddenFld=false;
								var htOfhiddenEle=0;
							    if(element.style.display==''){
									var parentEle= document.getElementById(parentTableId);
									htOfhiddenEle=parseInt(parentEle.clientHeight);
									if(dynamicInputList[i]=='fullspanrichTextArea') {
									parentEle.style.display = 'none';
									}
									isHiddenFld=true;
								}
								
								element.style.display='none';
								if(isFromSS) {
									element.style.marginTop='';
									element.style.paddingLeft='';
								}
								
								//Parent table id example : ful_a3Do0000000PIFuEAO.a3Do0000000PIttEAG
								//hide the row if elements in the row are hidden
								if(parentTableId != '' && parentTableId != null && dynamicInputList[i] !='fullspanrichTextArea'){
								  var parentEle= document.getElementById(parentTableId);
								  var elementId = parentTableId.split('.');
								  elementId[1] = 'ful_' +elementId[1];
								  var leftElement='',rightElement='',leftElementStyle='',rightElementStyle='';
								  if(elementId[0] != 'ful_')
									leftElement =  document.getElementById(elementId[0]);
								  if(elementId[1] != 'ful_')
									 rightElement =  document.getElementById(elementId[1]);
								  if(leftElement != null && leftElement != undefined && leftElement != '')
									leftElementStyle = document.getElementById(elementId[0]).style.display;
								  if(rightElement != null && rightElement !=undefined && rightElement != '')
									rightElementStyle = document.getElementById(elementId[1]).style.display;
								  
								  if( (elementId[0] != 'ful_' && leftElementStyle == 'none' && elementId[1] == 'ful_' ) || (elementId[1] != 'ful_' && rightElementStyle == 'none' && elementId[0] == 'ful_' ) || (elementId[0] != 'ful_' && leftElementStyle == 'none' && elementId[1] != 'ful_' && rightElementStyle =='none')){
									         parentEle.style.display = 'none';
								         }
								  }
								
								//clear the input value 
							   /*if(dynamicInputList[i]=='richTextArea' || dynamicInputList[i]=='fullspanrichTextArea'){
									if(richBodyComponent!=null && typeof(richBodyComponent)!='undefined') {
										RemedyForceHTMLProcessor.clearHTML(richBodyComponent);
									}
								}else{
									var comp=document.getElementById(dynamicInputList[i]);
									if(comp!=null && typeof(comp)!='undefined') {
										if (type=='checkbox') {
											comp.checked=false;
										} else if (type == 'date' || type == 'date/time') {
											comp.value='';
											comp.defaultValue = '';
											var dateInput = document.getElementById('date_' + dynamiInpArr[0]);
											if (dateInput) {
												dateInput.value = '';
											}
										} else {
											comp.value='';
										}
									}
							   }*/  

							   conditionallyHiddenElements.add(dynamiInpArr[0]);
								
								
								//check if other element in the row is hidden, if yes then hide the parent table
								if(dynamiInpArr[4]!=''){
									var otherEleArray=dynamicInputMap[dynamiInpArr[4]];
									if(otherEleArray!=null && otherEleArray!='undefined'){
									    var isCondTrueForOthEle=otherEleArray[3];
										if(!isCondTrueForOthEle){
											var parentEle= document.getElementById(parentTableId);											
											if(parentEle!=null && typeof(parentEle)!='undefined'){
												element.style.display='none';
											}
										}
									}	
								}else{
										var parentEle= document.getElementById(parentTableId);										
										if(parentEle!=null && typeof(parentEle)!='undefined'){
											element.style.display='none';
           							 }
      							}
								if(isHiddenFld && consoleSRIframe!=null && consoleSRIframe!=undefined){
								  var frmHeight=parseInt(consoleSRIframe.height);
								  consoleSRIframe.height=frmHeight-htOfhiddenEle;
								  isHiddenFld=false;
								}
							}						
						}
					}					
                }
				dynamicAssignApexErrorMessage();//oncomplete functions
				win.hide();
				if (typeof SDF != 'undefined')
					SDF.util.hideWaitbox();
			
			if (typeof(isForSROnly) != 'undefined' && isForSROnly != null && isForSROnly && serviceDetailFormId!=undefined && serviceDetailFormId!=null){
			    var SRDetailForm= document.getElementById(serviceDetailFormId);
				if(window.parent!=null && SRDetailForm !=null)
					window.parent.AdjustIframeHeight(SRDetailForm.scrollHeight);
			}
        }		
		
        function setTextArea(id){
             var areaEle = document.getElementById(id);
             areaEle.previousSibling.previousSibling.value= areaEle.value;
        } 
        function getSelectedOptions(id,containerId){
            var fieldEle = document.getElementsByName(id);
            var val='';
            for( i = 0; i < fieldEle.length; i++ ){
                if(fieldEle[i].checked == true ){
                       val = fieldEle[i].value;
                     break;
                }   
            }
            var resArray = RFSplit(val,inputValuesInfoSeperator);
            var divEle = document.getElementById(containerId);
            var tableId = divEle.parentNode.parentNode.parentNode.parentNode; 
            if(resArray !=null && resArray.length==2){
                tableId.previousSibling.previousSibling.value = unescape(resArray[0]);
                tableId.previousSibling.previousSibling.previousSibling.value = unescape(resArray[1]);
            }
       }
	    function dynamicAssignApexErrorMessage(){
            if(msg == null || msg == ''){ // Condition if there is no error message to display from server side.
            	var elem = document.getElementById('dynamicApexMessageErrorPanelDiv');
            	if(typeof elem != 'undefined' && typeof elem.firstChild != 'undefined'){
                    var ulList = elem.firstChild;
                    if ( ulList != null && typeof ulList.firstChild != 'undefined' && ulList.firstChild != null ) {
                    	msg = RemedyForceHTMLProcessor.getText(ulList.firstChild);
                        if(msg!=null && msg!=''){
    	                    Ext.MessageBox.show({ msg: msg, buttons: Ext.MessageBox.OK,width:300,height:'auto'});
    	                    return; 
    	                }
                    }
                }
            }
        }
		function getSelectedPicklistOption(id, containerId, additionalInfo) {
			var fieldEle = document.getElementById(id);
			if(!fieldEle) return; 
			var divEle = document.getElementById(containerId);
			AdditionalInfo = parseInt(additionalInfo);
			if( AdditionalInfo == 1){
				var storedValue = '';
				var value = '';
				var resArray;
				for(j = 0; j < fieldEle.options.length; j++) { 
					if(fieldEle.options[j].selected) { 
						var val= fieldEle.options[j].value;
			            resArray = RFSplit(val,inputValuesInfoSeperator);
			            if(resArray !=null && resArray.length==2 && typeof(divEle) != 'undefined' && divEle != null){
				            //storedValue.push(resArray[0]);
							//value.push(resArray[1]);
			            	if(storedValue == null || storedValue == ''){
			            		storedValue = resArray[0] ;
			            	}else{
			            		storedValue = storedValue + ';' + resArray[0];
			            	}
			            	if(value == null || value == ''){
			            		value = resArray[1];
			            	}else{
			            		value = value  + ';' + resArray[1];
			            	}
			            }
					}
				}
                divEle.previousSibling.previousSibling.value = unescape(storedValue);
                divEle.previousSibling.previousSibling.previousSibling.value = unescape(value);
			}else{
				var sIndex = fieldEle.selectedIndex;
				var val= fieldEle.options[sIndex].value;
				var resArray = RFSplit(val,inputValuesInfoSeperator);
				if(resArray !=null && resArray.length==2 && typeof(divEle) != 'undefined' && divEle != null){
					divEle.previousSibling.previousSibling.value = unescape(resArray[0]);
					divEle.previousSibling.previousSibling.previousSibling.value = unescape(resArray[1]);
				}
			}
  
		}
  
     function createRadioInput(inpValues,resValue,id,isChangeNeedRefresh){
        	  var valArray='';
              if(inpValues != null && inpValues !=''){
                 valArray = RFSplit(inpValues,inputValuesSeperator);
              }
              var selectedFlag = false;
			  
              for(var i = 0 ; i < valArray.length ; i++){
                    selectedFlag = false;
                    var inputInfo = RFSplit(valArray[i],inputValuesInfoSeperator);
                    if(inputInfo[2] == true || inputInfo[2] =='true' ){
                    	var dynamiInpArr=dynamicInputMap[inputComponentMap[id]];
						dynamiInpArr.push(valArray[i]);
                    }
                    if(resValue==null || resValue==''){
                    	selectedFlag = inputInfo[2];
					}
					if(inputInfo[1]!=null && resValue!=null && resValue.trim()==inputInfo[0].trim()){
                        selectedFlag = true;
                    }
                    var radioElem = document.createElement('input');
		              radioElem.id = "selectRadio_"+id+"_"+i;
					  radioElem.setAttribute("type", "radio");
		              radioElem.className = "radioBtnCls";
		              radioElem.name = "selectRadio_"+id;
		              radioElem.value = escape(inputInfo[0])+inputValuesInfoSeperator+escape(inputInfo[1]);
		              var radioClickFn = function() {
		            	  getSelectedOptions('selectRadio_'+id,id);
			              checkVisibility(isChangeNeedRefresh);
		              }
		              
		              if (radioElem.addEventListener) {
		            	  radioElem.addEventListener('click', radioClickFn);
		              } else if (radioElem.attachEvent) {
		            	  radioElem.attachEvent("onclick", radioClickFn);
		              }

                    if(selectedFlag == true || selectedFlag =='true' ) 
                    	radioElem.checked = true;
                    if(isViewMode==true || isViewMode=='true'){
                    	radioElem.disabled = true;
                    }

                    var radioLabel = document.createElement('label');
                    radioLabel.className = "clsPanelCheckBoxLabel radioBtnLblCls";
                    radioLabel.htmlFor = "selectRadio_"+id+"_"+i;
                    radioLabel.appendChild(document.createTextNode(inputInfo[0]));
                    var parentElem = document.getElementById(id);
                    if (typeof parentElem != 'undefined') {
                    	parentElem.appendChild(radioElem);
		              	parentElem.appendChild(radioLabel);
		              	parentElem.appendChild(document.createElement("br"));
                    }
               }
              getSelectedOptions('selectRadio_'+id,id);
        }
        
        function createPickListInput(inpValues,resValue,id,isChangeNeedRefresh,additionalInfo, isRequired, isSelfService){
    	     var valArray='';
             if(inpValues != null && inpValues !=''){
                valArray = RFSplit(inpValues,inputValuesSeperator);
               }
          
             var selectedFlag = false;

            var customrequiredInputSpan = document.createElement('span');
			customrequiredInputSpan.className = "customrequiredInput";
			if(isSelfService) {
				var customrequiredBlockSpan = document.createElement('span');
				customrequiredBlockSpan.className = "customrequiredBlock";
				customrequiredInputSpan.appendChild(customrequiredBlockSpan);
			}
			
             var picklistElement = document.createElement('select');
			 picklistElement.id = 'selectOption_' + id;	  
			 var picklistClass = "rf-single-line-field ";
			 if(isSelfService) {
				 if (Ext.isIE8) 
					 picklistClass += " picklistInputClsIE8 ";
				 else
					 picklistClass += " picklistInputCls ";
			 }
             picklistElement.className = picklistClass;
             var picklistBlurFn = function() {
            	 getSelectedPicklistOption('selectOption_'+id, id, additionalInfo);
				 checkVisibility(isChangeNeedRefresh);
             }
             if(additionalInfo==1){
            	 //create multi picklist
            	 picklistElement.multiple = true;
            	 picklistElement.style.cssText = "height: 70px;";
            	 if (picklistElement.addEventListener) {
            		 picklistElement.addEventListener('blur', picklistBlurFn);
	             } else if (picklistElement.attachEvent) {
	            	 picklistElement.attachEvent("onblur", picklistBlurFn);
	             }
             }else{
            	 if (picklistElement.addEventListener) {
            		 picklistElement.addEventListener('change', picklistBlurFn);
	             } else if (picklistElement.attachEvent) {
	            	 picklistElement.attachEvent("onchange", picklistBlurFn);
	             }
             }
			 
             var resValueArry = resValue.split(';');
			 var defaultValue = '';
			
	             var isDefaultPresent = false;
	             for(var i=0; i<valArray.length; i++){
	                 var inputInfo = RFSplit(valArray[i],inputValuesInfoSeperator);
	                 if(inputInfo[2]=='true'){
	                 	isDefaultPresent=true;
						defaultValue = valArray[i];
	                 	break;
					 }
	            }
             if(additionalInfo==0){     
				if(!isDefaultPresent){
					var noneOption = document.createElement("option");
					noneOption.text = noneValue;
					noneOption.value = inputValuesInfoSeperator;
					noneOption.selected = true;
					noneOption.title = noneLabel;
					picklistElement.options.add(noneOption, 0);
				}
			}
			// add the default value in dynamic array. Only the default value should be added and not the stored one, as this method is called only on page load and stored values are to be retained only on page load. When the picklist is rendered based on input of some other element, stored value should not be retained.
			var dynamiInpArr=dynamicInputMap[inputComponentMap[id]]; 					   
			dynamiInpArr.push(defaultValue);//default value for picklist element
			dynamiInpArr.push(additionalInfo);	
             for(var i = 0 ; i < valArray.length ; i++){
                   selectedFlag = false;
                   var inputInfo = RFSplit(valArray[i],inputValuesInfoSeperator);
                   if(resValueArry != null && resValueArry.length > 0){
	                   for(var j = 0 ; j < valArray.length ; j++){
		                   if(inputInfo[1]!=null && resValueArry[j]!=null && resValueArry[j].trim()==inputInfo[0].trim()){
								selectedFlag = true; 
							}
	             	   }
             	   }
         	   var opt = document.createElement("option");
				opt.text = inputInfo[0];
				opt.value = escape(inputInfo[0])+inputValuesInfoSeperator+escape(inputInfo[1]);
				opt.title = inputInfo[0];
				if(selectedFlag == true || selectedFlag =='true' ){ 
					opt.selected = true;
			    }
				picklistElement.options.add(opt);
            }
             var parentElem = document.getElementById(id);
             if (typeof parentElem != 'undefined') {
             	if (isRequired) {
	             	parentElem.appendChild(customrequiredInputSpan);
	             	customrequiredInputSpan.appendChild(picklistElement);
	             } else {
	             	parentElem.appendChild(picklistElement);
	             }
             }
             getSelectedPicklistOption('selectOption_'+id,id,additionalInfo);
        }
		
	  A4J.AJAX.XMLHttpRequest.prototype._copyAttribute = function (src, dst, attr) {
			var value = src.getAttribute(attr);
			if (value) {
				try {
					dst.setAttribute(attr, value);
				} catch (err) {
					//alert('Error with Salesforce: ' + err.description + '\nattr: ' + attr + '\n');
				}
			}
		};
	
       function showLoadingIcon(){ 
	   
       win = new Ext.Window({
       		id:'SRloadingIcon',
         	height:100, 
	      	width:200,
         	preventBodyReset : true, 
            bodyStyle:'background-color:transparent;border:none;',
            cls:'msgBoxCls',
         	closable : false,
         	resizable:false,
         	header:false,
         	frame:false,
         	shadow :false,
         	modal:true,
         	items:[{
                 xtype:'panel',
                 header : false,
                 border:false,
				 height:100,
               	 width:200,
	   			 bodyStyle:'background-color:transparent;border:none;',     
	             html: '<div align="center"><img src="'+ext4Resource+'/resources/themes/images/default/shared/blue-loading.gif"/></div>'
         	}]
		});
		win.show();
   }
   
        function displayIfhandlerforRTF(RTFid,RTFInputType)
        {
        	for (var i in CKEDITOR.instances){
				if(CKEDITOR.instances[i].name == RTFid+':textAreaDelegate_'+'Richtext_Response__c' || CKEDITOR.instances[i].name ==RTFid+':textAreaDelegate_'+nameSpacePrefix+'Richtext_Response__c' ){
					CKEDITOR.instances[i].on('blur', function() {
					checkVisibility(RTFInputType);});
				}
			}
        }  
   
//___For disabling Rich text Areas on Read mode (SelfServiceIncidentcustom.page)____

    var disableModedelayCounter=0;
    var disableModerichBodyId,disableModevisibleLines;
	function delayFuncFordisablingRichText(){
	   var disableModerichBodyComponent,disableModedoc,disableModeFulfillmentRTFiframe;
       var iframeList=document.getElementsByTagName('iframe');
		//loop through available iframes on the page	
        for(i=0;i<iframeList.length;i++){
		    var ifrm=iframeList[i];		
			if(ifrm!=null && typeof(ifrm)!='undefined'){			
				if(checkIsIEEleBrowser()){
					disableModedoc=ifrm.contentDocument;
				}else if(Ext.isIE){
					disableModedoc = ifrm.contentWindow.document;
				}else{
					disableModedoc=ifrm.contentDocument;
				} 	
					if(disableModedoc!=null && typeof(disableModedoc)!='undefined' ){
						disableModerichBodyComponent=disableModedoc.getElementById(disableModerichBodyId+':textAreaDelegate_Richtext_Response__c_rta_body');	
						if(disableModerichBodyComponent==null || typeof(disableModerichBodyComponent)=='undefined' ){	//for package orgs
							disableModerichBodyComponent=disableModedoc.getElementById(disableModerichBodyId+':textAreaDelegate_'+nameSpacePrefix+'Richtext_Response__c_rta_body');
						}	
					}				
						if(disableModerichBodyComponent!=null && typeof(disableModerichBodyComponent)!='undefined'){
							disableModeFulfillmentRTFiframe = iframeList[i].parentNode;
							break;
						}
			} 
		}	
		if(disableModerichBodyComponent==null || typeof(disableModerichBodyComponent)=='undefined' ){  		  
			disableModedelayCounter++;
			if(disableModedelayCounter>50)//200*50= 10sec, break if took 10 sec
				return;	
			
			setTimeout(delayFuncFordisablingRichText,200); 
		}else{ 			    
           	setVisibleLines(disableModevisibleLines, disableModeFulfillmentRTFiframe);				
			disableRichText(disableModerichBodyComponent,'true');
			disableModeFulfillmentRTFiframe.style.height = String(parseInt(disableModeFulfillmentRTFiframe.style.height, 10) + 10) + 'px';
			disableModeFulfillmentRTFiframe.style.padding='10px';
		}
	    }


//___for DynamicInputComponent.component___
   
   var delayCounter=0;     
   var richBodyId,richInputHidden,richBodyComponent,richContent,title,isDisabled,visibleLines,doc,FulfillmentRTFiframe;   
   
function delayFuncForRichText(){	
		var iframeList=document.getElementsByTagName('iframe');
		//loop through available iframes on the page	
        for(i=0;i<iframeList.length;i++){
		    var ifrm=iframeList[i];		
			if(ifrm!=null && typeof(ifrm)!='undefined'){			
				if(checkIsIEEleBrowser()){
					doc=ifrm.contentDocument;
				}else if(Ext.isIE){
					doc = ifrm.contentWindow.document;
				}else{
					doc=ifrm.contentDocument;
				} 	
					if(doc!=null && typeof(doc)!='undefined' ){
						richBodyComponent=doc.getElementById(richBodyId+':textAreaDelegate_Richtext_Response__c_rta_body');	
						if(richBodyComponent==null || typeof(richBodyComponent)=='undefined' ){	//for package orgs
							richBodyComponent=doc.getElementById(richBodyId+':textAreaDelegate_'+nameSpacePrefix+'Richtext_Response__c_rta_body');
						}	
					}				
						if(richBodyComponent!=null && typeof(richBodyComponent)!='undefined'){
							FulfillmentRTFiframe = iframeList[i].parentNode;
							break;
						}
			} 
		}	
		if(richBodyComponent==null || typeof(richBodyComponent)=='undefined' ){  		  
			delayCounter++;
			if(delayCounter>50)//200*50= 10sec, break if took 10 sec
				return;	
			
			setTimeout(delayFuncForRichText,200); 
		}else{ 	
			setVisibleLines(visibleLines, FulfillmentRTFiframe);			
			RemedyForceHTMLProcessor.parseHTML(richBodyComponent, richContent);
			richBodyComponent.title=title;				
			disableRichText(richBodyComponent,isDisabled);
			if (typeof(isForSROnly) != 'undefined' && isForSROnly != null && isForSROnly && serviceDetailFormId!=undefined && serviceDetailFormId!=null){
			    var SRDetailForm= document.getElementById(serviceDetailFormId);
				if(window.parent!=null && SRDetailForm !=null)
					window.parent.AdjustIframeHeight(SRDetailForm.scrollHeight);
			}
		}
}	
function setVisibleLines(noOfLines, FulfillmentRTFiframeParentdiv){    
    if(noOfLines!=null && typeof(noOfLines)!='undefined' && !isNaN(noOfLines)){	
		var richDiv=FulfillmentRTFiframeParentdiv;		
		if(richDiv!=null && typeof(richDiv)!='undefined'){
			var pixels=parseInt(noOfLines)*220/10;
			richDiv.style.height=pixels+'px'; //220px==10 visible lines for font 10	
		}	
	}
}
function disableRichText(richBodycomp,disable){	
		if(disable){
			richBodycomp.setAttribute("contentEditable", false);
			richBodycomp.setAttribute("background-color",'#D4D0C8'); 
			var SFDCTolbar=document.getElementById('cke_1_top');
			if(SFDCTolbar!=null && SFDCTolbar!='undefined')
				SFDCTolbar.style.display='none';	
		}else{
			richBodycomp.setAttribute("contentEditable", true);
			richBodycomp.setAttribute("background-color",'#D4D0C8'); 
			var SFDCTolbar=document.getElementById('cke_1_top');
			if(SFDCTolbar!=null && SFDCTolbar!='undefined')
				SFDCTolbar.style.display='block';
		
		}	
}


function checkIsIEEleBrowser()
{
	var ua = window.navigator.userAgent;
	var msie = ua.indexOf("MSIE ");
	if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))    
		return true;
	else           
		return false;
	
} 
 var isDateTimeDispCondExist=false;
//This method populates different maps with necessary values for processing
function setInputValuesMap(compId,FulInputId,postFixCondition,dataType,isConditionTrue,parentTableId,hidden,orderIndex){			
	  	  	  
	  var dynamiInpArr= new Array();
	  dynamiInpArr.push(FulInputId);
	  dynamiInpArr.push(postFixCondition);                
	  dynamiInpArr.push(dataType);
	  dynamiInpArr.push(isConditionTrue);
	  dynamiInpArr.push(parentTableId);
	  dynamiInpArr.push('');//populated later on ready
	  dynamiInpArr.push(hidden);
	  dynamiInpArr.push(orderIndex);
	  dynamicInputList.push(compId);//List of Component Ids
	  
	  inputComponentMap[FulInputId]=compId;//Map of fullfilment id vs dom component
      dynamicInputMap[compId]=dynamiInpArr;	//Map of dom component against all the necessary data
   
	  //create seperate map for Date and date/time with postfix expression to be called remotely.
	  if(postFixCondition.indexOf('Date') > -1 || postFixCondition.indexOf('Date/Time') > -1){
		  isDateTimeDispCondExist=true;
		  populateDateTimePostFixMap(postFixCondition); 	  
	  }
		
}   
var dateTimePostFixList= new Array();

function populateDateTimePostFixMap(postfixString){
	//String.fromCharCode(172) is same as NONPRINT
	if(postfixString.indexOf(String.fromCharCode(172)) > -1){//if there is And/Or Operators are involved.
		var splitAtNonPrint=RFSplit(postfixString,String.fromCharCode(172));
		if(splitAtNonPrint!=null && typeof(splitAtNonPrint)!='undefined'){
			for(var i=0;i<splitAtNonPrint.length;i++){
				if(splitAtNonPrint[i].indexOf('Date') > -1 || splitAtNonPrint[i].indexOf('Date/Time') > -1)				
					dateTimePostFixList.push(splitAtNonPrint[i]);														
			}				
		}
	
	}else{// no operator i.e for none operator
		dateTimePostFixList.push(postfixString);	
	} 


}
	

function evaluatePostfix(expr) {
        var result = false;
		if(expr==null || expr=='' || expr=='null') {
			return true;
		}
		var conditionLst = RFSplit(expr,String.fromCharCode(172));
		var postfix = '';
		for(var i=0;i<conditionLst.length;i++){            
			var condition=conditionLst[i];
			if(condition=='OR' || condition=='AND') {
				postfix = postfix + NONPRINT_NEW + condition;
				continue;
			}
			if(postfix=='') {
				postfix = evaluateCondition(condition)+'';
			}else {
				postfix = postfix + NONPRINT_NEW+ evaluateCondition(condition);
			}
		}           
        result = postfixEvaluation(postfix);
        return result;       
}
   
function postfixEvaluation(inputString) {
		var result = false;
		var tokens = RFSplit(inputString,String.fromCharCode(172));			
		var stackInstance= new stack();
		for(var i=0;i<tokens.length;i++){   
		   var token=tokens[i];			
			if(token=='AND') {
				var val2 = (stackInstance.pop() == 'true');
				var val1 = (stackInstance.pop() == 'true');
				stackInstance.push(''+(val1 && val2));	
			}else if(token=='OR') {
				var val2 = (stackInstance.pop() == 'true');
				var val1 = (stackInstance.pop() == 'true');
				stackInstance.push(''+(val1 || val2));
			}else {
				stackInstance.push(token);
			}
		}
			
		result = (stackInstance.pop() == 'true');			
		return result;
}

//below function returns the prefached comparison result for Date and Date/time.
//e.g. map structure {a3Do0000000PMESEA4={'<'=true,'>'=false}} 
function returnCompResult(fulId,Op){
	var operatorMap=dateTimePostFixMap[fulId];
	var comparison;
	if(operatorMap!=null && typeof(operatorMap)!='undefined')
		comparison=operatorMap[Op];
	
	if(comparison==null || typeof(comparison)=='undefined')
		comparison=false;
		
	return 	comparison	
}

function evaluateCondition(condition) {
        var tokens = RFSplit(condition,PE);			
		if(inputComponentMap[tokens[1]]!=null && typeof(inputComponentMap[tokens[1]])!='undefined'){			
			var inputCmp;
			var firstVal;
			var isUserLookup=false;
			var userLookupValue='';
		    var type = tokens[5]; 
		   if(!conditionallyHiddenElements.has(tokens[1]) || (dynamicInputMap[inputComponentMap[tokens[1]]] && dynamicInputMap[inputComponentMap[tokens[1]]][6])){
			if(inputComponentMap[tokens[1]]=='richTextArea' || inputComponentMap[tokens[1]]=='fullspanrichTextArea'){
				 if(Ext.isIE){	
					firstVal=richBodyComponent.innerText;
				}else{
					firstVal=richBodyComponent.textContent;
				}	
				
			}else{
				inputCmp=document.getElementById(inputComponentMap[tokens[1]]);
				if(inputCmp!=null && typeof(inputCmp)!='undefined'){					
					if(type=='Check box')
						firstVal = inputCmp.checked+'';						
					else	
						firstVal = inputCmp.value;
					if(type == 'Lookup'){
						if(inputCmp.previousSibling.previousSibling && typeof(inputCmp.previousSibling.previousSibling.value) != 'undefined' && inputCmp.previousSibling.previousSibling.value.substring(0,3) == '005' && firstVal){
							//Defect 82818: Capture user from user lookup into local variable
							userLookupValue = inputCmp.previousSibling.previousSibling.value; 
							isUserLookup = true; 
						}
					}
				}		
            } 
		}
						
            var expectedValue = tokens[4];
            if(isUserLookup && expectedValue){ 
            	//Defect 82818: Evaluate condition on user lookup using user Id 
            	var expectedValueSplit =  RFSplit(expectedValue,String.fromCharCode(1092));
            	if(expectedValueSplit.length > 1){
            		expectedValue = expectedValueSplit[1];
            		firstVal = userLookupValue; 
            	}
            }
            var operator = tokens[3];
	            //	Example of condition: 1?a2dU00000004DDwIAM?Test Date?>?12/22/2011?Date?2?a2dU00000004DDrIAM?Test CheckBox?=?True?Checkboxes?AND
	            //	tokens[0] - order no.
	            //	tokens[1] - record Id
	            //	tokens[2] - name of input
	            //	tokens[3] - Operator
	            //	tokens[4] - value
	            //	tokens[5] - Data tyle   
		if(firstVal!=null && firstVal!='' && !(type.toLowerCase()=='picklist')){
			var expNumb,inputNumb;
			if(type && type.toLowerCase()=='number'){
				if(enableLocaleNumberFormat){
					firstVal= firstVal.replace(localeDecimalSeparator,".");
					if(expectedValue && expectedValue!=''){
						expectedValue= expectedValue.replace(localeDecimalSeparator,".");
					}
				}
				expNumb = parseFloat(expectedValue);
				inputNumb=parseFloat(firstVal );
			}
            if(operator =='=') {
                if((type.toLowerCase()=='date')) {
					return returnCompResult(tokens[1],operator);                       
                }else if((type.toLowerCase()=='date/time')) {							
						return returnCompResult(tokens[1],operator);                   
                }else {
                		if(firstVal.toLowerCase()==expectedValue.toLowerCase() ) {
							return true;
						}
                    }
           }else if(operator =='!=') {
                if((type.toLowerCase()=='date')) {
					return returnCompResult(tokens[1],operator);      
                }else if((type.toLowerCase()=='date/time')) {
					return returnCompResult(tokens[1],operator);
                }else{ 
                	if(firstVal.toLowerCase()!=expectedValue.toLowerCase() ) {
                        return true;
                    }
                }   
            }else if(operator =='<') {
                if((type.toLowerCase()=='date')) {
					return returnCompResult(tokens[1],operator);        
                }else if((type.toLowerCase()=='date/time')) {
					return returnCompResult(tokens[1],operator);
                }else if((type.toLowerCase()=='number')) {
                    if(!isNaN(expNumb) && !isNaN(inputNumb) && inputNumb<expNumb) {
                        return true;
                    }
                }
            }
            
            else if(operator =='>') {
                if((type.toLowerCase()=='date')) {
					return returnCompResult(tokens[1],operator);          
                }else if((type.toLowerCase()=='date/time')) {
					return returnCompResult(tokens[1],operator);   
                }else if((type.toLowerCase()=='number')) {
                    if(!isNaN(expNumb) && !isNaN(inputNumb) && inputNumb > expNumb) {
                        return true;
                    } 
                }
            }else if(operator =='<=') {
                if((type.toLowerCase()=='date')) {
					return returnCompResult(tokens[1],operator);          
                }else if((type.toLowerCase()=='date/time')) {
					return returnCompResult(tokens[1],operator);     
                }else if((type.toLowerCase()=='number')) {
                    if(!isNaN(expNumb) && !isNaN(inputNumb) && inputNumb <= expNumb) {
                        return true;
                    } 
                }
                
            }else if(operator =='>=') {
                if((type.toLowerCase()=='date')) {
					return returnCompResult(tokens[1],operator);          
                }else if((type.toLowerCase()=='date/time')) {
					return returnCompResult(tokens[1],operator);      
                }else if((type.toLowerCase()=='number')) {
                    if(!isNaN(expNumb) && !isNaN(inputNumb) && inputNumb >= expNumb) {
                        return true;
                    } 
                }
            }else if(operator.toLowerCase()=='like') {
	                if((firstVal.toLowerCase()).indexOf(expectedValue.toLowerCase())> -1) {
						return true;
                }
            }else if(operator.toLowerCase()=='not like') {
	                if((firstVal.toLowerCase()).indexOf(expectedValue.toLowerCase())<=-1) {
                    return true;
                }
            }
        }else if(firstVal!=null && firstVal!='' && (type.toLowerCase()=='picklist')){
			  	var firstValList = firstVal.split(';');
			    if(operator =='=') {
				  	for(var i=0;i<firstValList.length;i++){
						if(firstValList[i]==expectedValue ){
	                            return true;
				  		}
			  		}	
			  	}else if(operator =='!=') {
					var res = true;
			  		for(var i=0;i<firstValList.length;i++){
						if(firstValList[i]==expectedValue ){
	                            res = false;
				  		}
			  		}	
					return res;
			  	}         	
        }   
        }
        return false;
    }   

	
function collectParentTableIds(id){
	parentTableList.push(id);
}
function formJason(){
	var dynInMapJSON='{';
	if(dynamicInputList!=null && typeof(dynamicInputList)!='undefined' && dynamicInputMap!=null && typeof(dynamicInputMap)!='undefined'){
		for(var i=0;i<dynamicInputList.length;i++){
			var tempDynArr=dynamicInputMap[dynamicInputList[i]];
		    if(tempDynArr!=null && typeof(tempDynArr)!='undefined'){
			    var FulInputId=tempDynArr[0];
				var isConditionTrue=tempDynArr[3];
				if(i==(dynamicInputList.length-1))
					dynInMapJSON+='"'+FulInputId+'":"'+isConditionTrue+'"';
				else 
					dynInMapJSON+='"'+FulInputId+'":"'+isConditionTrue+'",';
			}
		}
	}
	dynInMapJSON+='}';
	return dynInMapJSON;
}
Ext.onReady(function() {
	// The below code splits the parent table id and assigns the value of leftinputid in the right input map and rightinput in the left.(required when we hide a parent table)
	//Parent table id example : ful_a3Do0000000PIFuEAO.a3Do0000000PIttEAG
	for(i=0;i<parentTableList.length;i++){
		var arr=parentTableList[i].split('.');
		if(arr[0]!='' && arr[1]!=''){
			var leftInputId=arr[0].split('_');
			var rightInputId=arr[1];
			
			var compId=inputComponentMap[leftInputId[1]];			
			var dynamiInpArr=dynamicInputMap[compId];
			if(dynamiInpArr!=null && dynamiInpArr!='undefined'){
				dynamiInpArr[5]=rightInputId;					
				dynamicInputMap[compId]=dynamiInpArr;
			}
						
			compId=inputComponentMap[arr[1]];			
			dynamiInpArr=dynamicInputMap[compId];
			if(dynamiInpArr!=null && dynamiInpArr!='undefined'){
				dynamiInpArr[5]=leftInputId;		
				dynamicInputMap[compId]=dynamiInpArr;
			}
      
		}
	}
	
	if( typeof(userLanguage) != 'undefined' && -1 == userLanguage.indexOf('en_') ) {
		var HTMLElements = document.querySelectorAll(".multiSelectPicklistTable .multiSelectPicklistRow .multiSelectPicklistCell img");
		for (var i = 0; i < HTMLElements.length; i++) {
			HTMLElements[i].style.width="17px";
		}
	}  
       
});