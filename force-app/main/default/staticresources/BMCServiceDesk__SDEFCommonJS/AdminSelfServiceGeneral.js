var csvAccountListparam="";var AccountWindow;waitbox=new Ext.Window({height:100,width:200,resizable:false,closable:false,header:false,frame:false,shadow:false,modal:true,items:[{xtype:"panel",height:100,width:200,bodyStyle:"background-color:transparent;border:none;",html:'<div align="center"><img src="'+waitImg+'" /></div>'}]});Ext.onReady(function(){var g=new Ext.Panel({id:"mainHeaderPanel",border:false,tbar:[" ",{scale:"medium",iconCls:"saveCls",tooltipType:"title",tooltip:saveLabel,id:"saveBtn",handler:function(h,j){if(beforeSave()){selectedTaskFieldset=document.getElementById("taskFieldName").value;Confirm()}}}," ","-"," ",{scale:"medium",iconCls:"refreshCls",tooltipType:"title",tooltip:undoDefaultSettingPageLabel,id:"undoId",handler:function(h,j){waitbox.show();reset()}}],autoWidth:true,renderTo:"btnToolbar"});disableChild(EnableChatCheckbox,PreChatCheckbox);showComboBox();disableTaskFieldSet();DisableOtherOnBehalfOfSettings(AllUserCheckbox);AvailableStatusStore=new Ext.data.ArrayStore({data:AvailableStatus,fields:["value","text"]});SelectedStatusStore=new Ext.data.ArrayStore({data:SelectedStatustodisplay,fields:["value","text"]});var f=new Ext.form.Label({id:"CustomObjAvailableFields",cls:"clsInputBoldLabelTDI multi-picklist-label",text:avaliableStatusValuesLbl});var a=new Ext.form.Label({id:"CustomObjButtonFields",style:"width:7px;display:inline-block;"});var d=new Ext.form.Label({id:"CustomObjSelectedFields",cls:"clsInputBoldLabelTDI multi-picklist-label",text:selectedStatusValuesLbl});var c=new Ext.Panel({id:"CustomObjFieldsSelectionLabels",border:false,renderTo:"MultipicklistLabels",layout:"table",items:[f,a,d]});var e=new Ext.form.FormPanel({id:"AutoAssignMultiPicklist",width:550,height:200,border:false,style:"padding-right:15px;padding-left:10px;",layout:"column",items:[{xtype:"itemselector",id:"itemselectorDiv",name:"itemselector",fieldLabel:"ItemSelector",drawLeftIcon:true,drawRightIcon:true,drawUpIcon:false,drawDownIcon:false,width:430,iconLeft:"b_darrow_L_disable_custom.gif",iconRight:"b_darrow_R_disable_custom.gif",imagePath:SDEFStylesPath+"/SDEFbuttons/",multiselects:[{id:"AvailLabelStatusList",legend:false,width:200,height:146,store:AvailableStatusStore,displayField:"text",valueField:"value",listeners:{click:function(h){document.getElementById("iconRightId").src=SDEFStylesPath+"/SDEFbuttons/b_darrow_R_new.gif";document.getElementById("iconLeftId").src=SDEFStylesPath+"/SDEFbuttons/b_darrow_L_disable_custom.gif"}}},{id:"selectedFieldList",legend:false,width:200,height:146,store:SelectedStatusStore,displayField:"text",valueField:"value",listeners:{click:function(k){var h=0;for(var j=0;j<k.store.data.length;j++){if(k.store.getAt(j).get("value")==k.getValue()){h=j;break}}if(h==0){document.getElementById("iconRightId").src=SDEFStylesPath+"/SDEFbuttons/b_darrow_R_disable_custom.gif";document.getElementById("iconLeftId").src=SDEFStylesPath+"/SDEFbuttons/b_darrow_L_new.gif"}else{if(h==k.store.data.length-1){document.getElementById("iconRightId").src=SDEFStylesPath+"/SDEFbuttons/b_darrow_R_disable_custom.gif";document.getElementById("iconLeftId").src=SDEFStylesPath+"/SDEFbuttons/b_darrow_L_new.gif"}else{document.getElementById("iconRightId").src=SDEFStylesPath+"/SDEFbuttons/b_darrow_R_disable_custom.gif";document.getElementById("iconLeftId").src=SDEFStylesPath+"/SDEFbuttons/b_darrow_L_new.gif"}}}}}]}]});var b=new Ext.Panel({id:"comboBoxStatus",border:false,renderTo:"Multipicklist",layout:"table",items:[e]})});function DisableOtherOnBehalfOfSettings(b){var a;if(document.getElementById(b)!=null){a=document.getElementById(b).checked;if(a==true){document.getElementById(SameAccountCheckbox).checked=false;document.getElementById(BelowHierarchyCheckbox).checked=false;document.getElementById(SameAccountCheckbox).disabled=true;document.getElementById(BelowHierarchyCheckbox).disabled=true}else{document.getElementById(SameAccountCheckbox).disabled=false;document.getElementById(BelowHierarchyCheckbox).disabled=false}}}function showComboBox(){eval(taskFieldsets);var taskStore=new Ext.data.ArrayStore({id:"taskStore",fields:["label","value"]});taskStore.loadData(taskFieldSetsData);var taskFieldsCombo=new Ext.form.ComboBox({id:"taskFieldsSet",width:400,hiddenName:"taskFieldName",store:taskStore,valueField:"value",editable:false,typeAhead:false,mode:"local",editable:false,triggerAction:"all",forceSelection:true,selectOnFocus:true,value:selectedTaskFieldset,displayField:"label",renderTo:"taskfields"});if(selectedTaskFieldset=="undefined"||selectedTaskFieldset==""||selectedTaskFieldset==null){Ext.getCmp("taskFieldsSet").setValue("LinkRecords")}}function showErrorMsg(){if(message!=null&&message!=""){Ext.MessageBox.show({title:SaveMsgHeader,msg:message,width:300,buttons:Ext.MessageBox.OK})}}function beforeSave(){var a=document.getElementById(txtSSURLvar).value;if(a!=""){a=httpIntranetUrlCheck(a);if(!a){Ext.Msg.show({msg:invalidSSURLLabel,buttons:Ext.Msg.OK});return false}}return true}function Confirm(){if(document.getElementById(newSelfServiceUI)!=null&&document.getElementById(newSelfServiceUI).checked){Ext.MessageBox.confirm(confirmLabel,confirmNewSSUILabel+' <a href="#" onClick="openHelp();">'+helpLabel+"</a>",showResult)}else{waitbox.show();SelectedStatus="";if(Ext.getCmp("selectedFieldList")){var a=Ext.getCmp("selectedFieldList").store;var b=a.data.length;var d=0;while(b>d){var c=a.getAt(d);d++;if(b==d){SelectedStatus=SelectedStatus+c.get("value")}else{SelectedStatus=SelectedStatus+c.get("value")+";"}}}save(csvAccountListparam,selectedTaskFieldset,SelectedStatus)}}function showResult(a){if(a!="no"){waitbox.show();save()}else{document.getElementById(newSelfServiceUI).checked=false}}function openHelp(){window.open(helpLink)}parent.addHelpOnPage(document.getElementById("helpDiv"),"general_SS_settings.htm",wikiUrl);function disableChild(c,a){var b;if(document.getElementById(c)!=null){b=document.getElementById(c).checked;if(b==true){document.getElementById(PreChatCheckbox).disabled=false;document.getElementById(PreChatCategoryCheckbox).disabled=false}else{document.getElementById(PreChatCheckbox).disabled=true;document.getElementById(PreChatCategoryCheckbox).disabled=true}}ChangePreChatCategoryCheckbox(a)}function ChangeValueOfChild(e){var a;var g;var f;var c=document.getElementById("RFChatAcc:1");var b=document.getElementById("RFChatAcc:2");var h=document.getElementById("SelectedAccountId");var d=document.getElementById("selectAccountLookupId");if(e==EnableChatCheckbox){f=EnableChatforMobile}else{f=EnableChatCheckbox}if(document.getElementById(e)!=null&&document.getElementById(f)!=null){a=document.getElementById(e).checked;g=document.getElementById(f).checked;if(a==true||g==true){document.getElementById(PreChatCheckbox).disabled=false;document.getElementById(PreChatCategoryCheckbox).disabled=false;document.getElementById(PreChatCheckbox).checked=true;if(AllAccountForChat==false&&listData.length==0){document.getElementById("RFChatAcc:1").checked=true}c.disabled=false;b.disabled=false;if(b.checked){h.disabled=false;h.className="clsAccountTextareaEnable";d.style.cursor="pointer";d.style.opacity="1";d.style.filter="alpha(opacity=100)"}}else{if(a==false&&g==false){document.getElementById(PreChatCheckbox).disabled=true;document.getElementById(PreChatCategoryCheckbox).disabled=true;document.getElementById(PreChatCheckbox).checked=false;c.disabled=true;b.disabled=true;if(b.checked){h.disabled=true;h.className="clsAccountTextareaDisable";d.style.cursor="initial";d.style.opacity="0.4";d.style.filter="alpha(opacity=40)"}}}}}function ChangePreChatCategoryCheckbox(b){var a;if(document.getElementById(b)!=null){a=document.getElementById(b).checked;if(a==true){document.getElementById(PreChatCategoryCheckbox).disabled=false}else{document.getElementById(PreChatCategoryCheckbox).disabled=true}}}function initAccountList(){if(EnableChat==true){ChatEnabled()}else{chatDisabled()}var d=document.getElementById("SelectedAccountId");if(AllAccountForChat==false&&listData.length==0){document.getElementById("RFChatAcc:1").checked=false;document.getElementById("RFChatAcc:2").checked=false;d.disabled=true;d.className="clsAccountTextareaDisable";var b=document.getElementById("selectAccountLookupId");b.style.cursor="initial";b.style.opacity="0.4";b.style.filter="alpha(opacity=40)"}if(d!=null&&d!="undefined"&&d!=""){while(d.options.length){d.remove(0)}csvAccountListparam="";var c;for(i=0;i<listData.length;i++){c=listData[i][0];if(c.length>30){c=c.substr(0,30)+"..."}var a=new Option(c,listData[i][1]);a.title=listData[i][0];csvAccountListparam+=listData[i][1]+";";d.options[d.options.length]=a}}}function openAccountSelector(c){if(c!=null){var f=c.data;var a;var e=document.getElementById("SelectedAccountId");listData=[];if(e!=null&&e!="undefined"&&e!=""){while(e.options.length){e.remove(0)}csvAccountListparam="";var d;for(i=0;i<f.length;i++){a=new Array(2);a[0]=c.getAt(i).get("Name");a[0]=Ext.util.Format.htmlDecode(a[0]);d=a[0];if(a[0].length>30){a[0]=a[0].substr(0,30)+"..."}a[1]=c.getAt(i).get("elID");listData.push(a);csvAccountListparam+=a[1]+";";var b=new Option(a[0],a[1]);b.title=d;e.options[e.options.length]=b}}}}function openAccountSelectWindow(){if(document.getElementById("RFChatAcc:2").checked&&document.getElementById(EnableChatCheckbox).checked){var d=500;var e=500;var c=parseInt((screen.availWidth/2)-(d/2));var b=parseInt((screen.availHeight/2)-(e/2));var a="width="+d+",height="+e+",status,resizable,scrollbars,left="+c+",top="+b;if(AccountWindow){AccountWindow.close()}AccountWindow=window.open(AccountSelectorPage+"?stdForm=true&isFromConsole=true","_blank",a)}}var AccCSv="";function radioSelectedAccounts(){var b=document.getElementById("SelectedAccountId");b.disabled=false;b.className="clsAccountTextareaEnable";var a=document.getElementById("selectAccountLookupId");a.style.cursor="pointer";a.style.opacity="1";a.style.filter="alpha(opacity=100)";if(AccCSv!=""){csvAccountListparam=AccCSv}}function AllAccountsChat(){var b=document.getElementById("SelectedAccountId");b.disabled=true;b.className="clsAccountTextareaDisable";if(csvAccountListparam!=""&&csvAccountListparam!="AllAccounts"){AccCSv=csvAccountListparam}csvAccountListparam="EnableAllAccount";var a=document.getElementById("selectAccountLookupId");a.style.cursor="initial";a.style.opacity="0.4";a.style.filter="alpha(opacity=40)"}function disableTaskFieldSet(){if(!document.getElementById("pg:form:showTasks").checked){Ext.getCmp("taskFieldsSet").setDisabled(true)}else{Ext.getCmp("taskFieldsSet").setDisabled(false)}}function chatDisabled(){var b=document.getElementById("RFChatAcc:1");var a=document.getElementById("RFChatAcc:2");if(AllAccountForChat==true){b.checked=true;a.checked=false}else{b.checked=false;a.checked=true}b.disabled=true;a.disabled=true;var d=document.getElementById("SelectedAccountId");d.disabled=true;d.className="clsAccountTextareaDisable";var c=document.getElementById("selectAccountLookupId");c.style.cursor="initial";c.style.opacity="0.4";c.style.filter="alpha(opacity=40)"}function ChatEnabled(){var b=document.getElementById("RFChatAcc:1");var a=document.getElementById("RFChatAcc:2");if(AllAccountForChat==true){b.checked=true;a.checked=false}else{b.checked=false;a.checked=true;var d=document.getElementById("SelectedAccountId");d.disabled=false;d.className="clsAccountTextareaEnable";var c=document.getElementById("selectAccountLookupId");c.style.cursor="pointer";c.style.opacity="1";c.style.filter="alpha(opacity=100)"}b.disabled=false;a.disabled=false};