var selectFilterCombo;var fieldCombo;var popUpWindow,PicklistReloadInterval;var NewFilterName="";var waitMask;var oncompleteVar,inputHidden;var onCompleteFunction;var DeletedRowArray="$";var ToolTipString="";var FromApply=false;var referencedObjName;var tableLenght=0;var isI8=false;var isDataChanged=false;var isValidFilter=true;var WinMsg;var isServiceLookup=false;var isServiceOffering=false;Ext.onReady(function(){isI8=Ext.isIE8;waitMask=new Ext.LoadMask(Ext.getBody(),{msg:waitMsg});if(isSearchAndLink&&(window.parent.addFilterName=="flat_offering_bsid"||window.parent.addFilterName=="flat_offering")){isServiceOffering=true}if(isSearchAndLink&&(window.parent.addFilterName=="service")){isServiceLookup=true}Ext.define("MappingModel",{extend:"Ext.data.Model",fields:[{name:"Id",type:"string"},{name:"name",type:"string"}]});if(AppliedFilterName!="undefined"&&AppliedFilterName!=null&&AppliedFilterName!=""&&selectedFilterStore.length>0){isValidFilter=false;for(index=0;index<selectedFilterStore.length;index++){if(AppliedFilterName==decodeValue(selectedFilterStore[index].name)){isValidFilter=true;break}}if(!isValidFilter){if(selectedFilterName.toLowerCase()!=("SystemGeneratedRecord_"+userId).toLowerCase()){selectedFilterName=savedCriteria}}}var a=Ext.create("Ext.data.Store",{model:"MappingModel",data:selectedFilterStore,proxy:{type:"memory",reader:{idProperty:"Id",type:"json",root:"attributes"}}});selectFilterCombo=Ext.create("Ext.form.ComboBox",{store:a,id:"selectedFilter",typeAhead:true,emptyText:savedCriteria,queryMode:"local",editable:false,displayField:"name",hidden:isSearchAndLink,valueField:"name",width:210,renderTo:"SelectedFilterDiv",triggerCls:"d-icon-triangle_down",listConfig:{getInnerTpl:function(){return'<div id="ListName-{Id}" title="{name}" style="width:85%;" Class="ElipseCls">{name}</div><div style="float:right;display: inline-block;" id="ListIcon-{Id}"><a id="ListEditlink-{Id}" onclick="deleteFilterRecord(\'{Id}\');" alt="'+lblDelete+'"><img src="'+sdefStylesResource+'/SDEFicons/cmdb_red_cross.svg"" alt="'+lblDelete+'" title="'+lblDelete+'" style="height: 14px;float: right;"/></a></div>'}},listeners:{select:function(e,c,d){isDataChanged=false;selectedFilterName=Ext.getCmp("selectedFilter").getValue();selectedFilterName=decodeValue(selectedFilterName);e.setValue(selectedFilterName);DeletedRowArray="$";ShowSavingNewFilterDiv(false);ConditionLimit=ServerConditionLimit;ClearTable();if(selectedFilterName==savedCriteria||selectedFilterName==NoneLabel){results="";LoadExistingData()}else{LoadExistingRecords(selectedFilterName)}}}});ReloadFilterNameStore();var b=new Ext.form.TextField({name:"txt-name",id:"FilterNameTextId",emptyText:CriteriaName,renderTo:"SelectedFiterNameDiv",width:157});compStore.text=[["=","="],["!=","!="],["LIKE","'"+like+"'"],["NOT LIKE","'"+notlike+"'"],["STARTS WITH","'"+startWith+"'"]];compStore.phone=[["=","="],["!=","!="]];compStore.currency=[["=","="],["!=","!="],[">",">"],[">=",">="],["<","<"],["<=","<="]];compStore.percent=[[">",">"],[">=",">="],["=","="],["!=","!="],["<","<"],["<=","<="]];compStore.number=[[">",">"],[">=",">="],["=","="],["!=","!="],["<","<"],["<=","<="]];compStore.booleanVar=[["=","="],["!=","!="]];compStore.email=[["=","="],["!=","!="],["LIKE","'"+like+"'"],["NOT LIKE","'"+notlike+"'"],["STARTS WITH","'"+startWith+"'"]];compStore.reference=[["=","="],["!=","!="]];compStore.dateTime=[[">",">"],[">=",">="],["=","="],["!=","!="],["<","<"],["<=","<="]];compStore.textArea=[["LIKE","'"+like+"'"],["NOT LIKE","'"+notlike+"'"],["STARTS WITH","'"+startWith+"'"]];compStore.picklist=[["=","="],["!=","!="]];compStore.none=[];LoadExistingRecords(selectedFilterName)});function decodeValue(a){var b=["&amp;","&lt;","&gt;","&quot;","&#39;","&nbsp;"];var c=["&","<",">",'"',"'"," "];if(a==null||a.length==0){return a}for(i=0;i<b.length;i++){i=i++;a=replaceAll(a,b[i],c[i])}return a}function deleteFilterRecord(a){DeleteAfterReplacement=false;showWaitMask();DeleteFilter(a);ClearTable();AddRow(false);setDefaultRow(1,className,orgNamespace.toUpperCase()+"CLASSNAME__C","=",classNameValue)}function escSpeChars(a){a=replaceAll(a,"\\","?");a=replaceAll(a,"?","\\");a=replaceAll(a,"?","?");a=replaceAll(a,"?","\\?");a=replaceAll(a,"^","?");a=replaceAll(a,"?","\\^");a=replaceAll(a,"$","?");a=replaceAll(a,"?","\\$");a=replaceAll(a,"(","?");a=replaceAll(a,"?","\\(");a=replaceAll(a,")","?");a=replaceAll(a,"?","\\)");a=replaceAll(a,"[","?");a=replaceAll(a,"?","\\[");a=replaceAll(a,"]","?");a=replaceAll(a,"?","\\]");a=replaceAll(a,"{","?");a=replaceAll(a,"?","\\}");a=replaceAll(a,"*","?");a=replaceAll(a,"?","\\*");a=replaceAll(a,"+","?");a=replaceAll(a,"?","\\+");a=replaceAll(a,"|","?");a=replaceAll(a,"?","\\|");return a}function replaceAll(e,c,d){var a=e;var b=a.indexOf(c);while(b!=-1){a=a.replace(c,d);b=a.indexOf(c)}return a}function ReloadFilterNameStore(){var selectedFilter=Ext.getCmp("selectedFilter").getStore();selectedFilter.removeAll();selectedFilterStore=eval(selectedFilterStore);selectedFilter.loadData(selectedFilterStore);if(NewFilterName!=""){selectedFilterName=NewFilterName;NewFilterName=""}else{if(AppliedFilterName!="undefined"&&AppliedFilterName!=null&&AppliedFilterName!=""&&isValidFilter){selectedFilterName=AppliedFilterName}}var SelectCombo=Ext.getCmp("selectedFilter");if(selectedFilterName!=""&&selectedFilterName.toLowerCase()!=("SystemGeneratedRecord_"+userId).toLowerCase()&&isValidFilter){SelectCombo.setValue(selectedFilterName)}else{SelectCombo.setValue("");SelectCombo.setRawValue(savedCriteria)}}function showHideFilterNameRow(){var b=document.getElementById("selectedFilterRow");var a=Ext.getCmp("FilterNameTextId");selectedFilterName=Ext.getCmp("selectedFilter").getValue();if(selectedFilterName!=null&&selectedFilterName!=savedCriteria&&selectedFilterName!=""&&selectedFilterName!=NoneLabel){if(selectedFilterName.toLowerCase()!=("SystemGeneratedRecord_"+userId).toLowerCase()){b.setAttribute("style","display:block;margin-bottom:5px;");if(Ext.isGecko){window.parent.AdvancedFilterPopUp.setHeight(355)}else{window.parent.AdvancedFilterPopUp.setHeight(350)}if(typeof(a)!="undefined"&&a!=null){a.setValue(selectedFilterName)}}else{b.setAttribute("style","display:none;");if(typeof(a)!="undefined"&&a!=null){a.setValue("")}}}else{b.setAttribute("style","display:none;");if(typeof(a)!="undefined"&&a!=null){a.setValue("")}}NewFilterName=""}function ShowHideAddLink(a){var b=document.getElementById("AddLink");if(a){if(typeof(b)!="undefined"&&b!=null){b.setAttribute("style","visibility:visible;height:10px;")}}else{if(typeof(b)!="undefined"&&b!=null){b.setAttribute("style","visibility:hidden;")}}}function setComparisonOperatorStore(b,d){var c="operatorId"+d;var a=Ext.getCmp(c);if(b=="reference"){a.store.loadData(compStore.reference)}else{if(b=="datetime"){a.store.loadData(compStore.dateTime)}else{if(b=="date"){a.store.loadData(compStore.dateTime)}else{if(b=="textarea"){a.store.loadData(compStore.textArea)}else{if(b=="text"){a.store.loadData(compStore.text)}else{if(b=="phone"){a.store.loadData(compStore.phone)}else{if(b=="currency"){a.store.loadData(compStore.currency)}else{if(b=="percent"){a.store.loadData(compStore.percent)}else{if(b=="number"){a.store.loadData(compStore.number)}else{if(b=="boolean"){a.store.loadData(compStore.booleanVar)}else{if(b=="email"){a.store.loadData(compStore.email)}else{if(b=="picklist"){a.store.loadData(compStore.picklist)}}}}}}}}}}}}a.reset()}function AddRow(m){var s=document.getElementById("FilterCriteria");rowCount=tableLenght;if(rowCount<ConditionLimit){rowCount=rowCount+1;var u=document.createElement("TR");u.setAttribute("id","RowId"+rowCount);s.appendChild(u);var o=document.createElement("TD");o.setAttribute("valign","top");o.setAttribute("style","width:10%");u.appendChild(o);var k=document.createElement("div");k.id="ANDDivId"+rowCount;if(rowCount>1){var r=document.createTextNode(ANDLabel);k.className="AndDivCls ";k.appendChild(r)}else{var q=document.createTextNode(ForLabel);k.setAttribute("style","padding: 6px 3px 3px 3px;");k.appendChild(q)}o.appendChild(k);var h=document.createElement("TD");h.setAttribute("valign","top");h.setAttribute("style","width:20%");u.appendChild(h);var g=document.createElement("div");g.setAttribute("style","padding:3px;");var j="FieldDivOfRow"+rowCount;g.id=j;h.appendChild(g);var b=document.createElement("TD");b.setAttribute("valign","top");b.setAttribute("style","width:20%");u.appendChild(b);var f=document.createElement("div");f.setAttribute("style","padding:3px;");var p="OperatorDivOfRow"+rowCount;f.id=p;b.appendChild(f);var c=createFieldCombox(rowCount);c.render(g);var t=createcomparisonOperator(rowCount);t.render(f);var n=document.createElement("TD");n.setAttribute("valign","top");n.setAttribute("style","width:20%");u.appendChild(n);var a=document.createElement("div");a.setAttribute("style","padding:3px;");var d="OperandDivOfRow"+rowCount;a.id=d;n.appendChild(a);LoadDefaultField(rowCount);var e=document.createElement("TD");e.setAttribute("style","width:7%");e.setAttribute("valign","middle");u.appendChild(e);if(rowCount>1){if(isServiceOffering||isServiceLookup){if(rowCount>2){e.id=rowCount;e.title=DeleteRowLabel;e.className="d-icon-minus_circle_o";e.setAttribute("onclick","DeleteThisRow(this.id);")}}else{e.id=rowCount;e.title=DeleteRowLabel;e.className="d-icon-minus_circle_o";e.setAttribute("onclick","DeleteThisRow(this.id);")}}tableLenght=tableLenght+1}if(rowCount>=ConditionLimit){ShowHideAddLink(false)}if(m){var l=document.getElementById("filterDiv");l.scrollTop=l.scrollHeight}}function createFieldCombox(a){var b=Ext.create("Ext.data.Store",{fields:["Name","Label","Type","SupportData","DefaultValue"],sorters:[{property:"Label",direction:"ASC"}],data:fieldsStoreData});fieldCombo=Ext.create("Ext.form.field.ComboBox",{store:b,editable:true,typeAhead:true,emptyText:labelField,queryMode:"local",displayField:"Label",forceSelection:true,valueField:"Name",id:"fieldsId"+a,triggerCls:"d-icon-triangle_down",disabledCls:"disabledComboTestCls",width:200,tpl:'<tpl for="."><div class="x-boundlist-item">{[fm.htmlEncode(values.Label)]}</div></tpl>',listeners:{select:function(f,e,d){var c=e[0].get("Type");setComparisonOperatorStore(c.toLowerCase(),a);ShowMatchingField(e[0].get("Name"),e[0].get("Label"),e[0].get("Type"),a,e[0].get("SupportData"),e[0].get("DefaultValue"),true);isDataChanged=true}}});return fieldCombo}function createcomparisonOperator(a){comparisonOperator=Ext.create("Ext.form.field.ComboBox",{store:compStore.none,queryMode:"local",valueField:"comOpeValue",displayField:"comOpeName",editable:false,minWidth:105,maxWidth:130,listWidth:85,disabledCls:"disabledComboTestCls",selectOnFocus:true,height:13,id:"operatorId"+a,triggerCls:"d-icon-triangle_down",emptyText:labelOperator,listeners:{select:function(d,c,b){isDataChanged=true}}});return comparisonOperator}function LoadDefaultField(b){if(b!=1){if((isServiceOffering||isServiceLookup)&&b==2){classpicklistStr=picklistValuesStr;createClasspicklist(b,"pickListFieldCombo")}else{var a=new Ext.form.TextField({name:"txt-name",id:"Default"+b,cls:"defaultBox",readOnly:true});a.render("OperandDivOfRow"+b)}}else{classpicklistStr=newClassNameListStr;createClasspicklist(b,"pickListFieldCombo")}}function createClasspicklist(b,a){PicklistfieldStore=Ext.create("Ext.data.Store",{fields:["Label","Value","Id"],sorters:[{property:"Label",direction:"ASC"}],data:classpicklistStr});var c=Ext.create("Ext.form.field.ComboBox",{id:a+b,triggerCls:"d-icon-triangle_down",queryMode:"local",emptyText:NoneLabel,store:PicklistfieldStore,valueField:"Value",displayField:"Label",tpl:new Ext.XTemplate('<tpl for="."><div title="{[fm.htmlEncode(values.Label)]}"  style="width:100%;" class="x-boundlist-item ElipseCls">{[fm.htmlEncode(values.Label)]}</div></tpl>'),disabledCls:"disabledComboTestCls",editable:true,forceSelection:true,listeners:{select:function(f,d,e){if(b==1){ClassNameinCriteria=d[0].get("Id");classNameValue=d[0].get("Value");refreshFields(classNameValue);isDataChanged=true}}},listWidth:165});c.render("OperandDivOfRow"+b)}function ShowMatchingField(APIName,Label,type,rowNum,SupportingData,DefaultValue,LoadingNewRow){var OperandDivs=document.getElementById("OperandDivOfRow"+rowNum);while(OperandDivs.hasChildNodes()){OperandDivs.removeChild(OperandDivs.lastChild)}var className=orgNamespace+"CLASSNAME__C";if(APIName.toUpperCase()==className.toUpperCase()){createClasspicklist(rowNum,"pickListFieldCombo")}else{if(type=="text"||type=="phone"||type=="currency"||type=="percent"||type=="email"||type=="number"){var textF=new Ext.form.TextField({name:"txt-name",id:"TextField"+rowNum,listeners:{keyup:function(val,e,eOpts){isDataChanged=true}}});textF.render("OperandDivOfRow"+rowNum)}else{if(type=="textarea"){var input=document.createElement("TEXTAREA");input.setAttribute("name","post");input.setAttribute("maxlength",255);input.setAttribute("rows",1);input.setAttribute("style","height:21px;width:99%;");input.setAttribute("id","TextAreaField"+rowNum);input.setAttribute("onchange","isDataChanged = true;");var MainDiv=document.getElementById("OperandDivOfRow"+rowNum);MainDiv.appendChild(input)}else{if(type=="reference"||type=="reference1"){APINameOfSelectedField=APIName;oncompleteVar="LookUpText"+rowNum;inputHidden="inputHidden"+rowNum;var MainDiv=document.getElementById("OperandDivOfRow"+rowNum);var inputHiddentTxt=document.createElement("input");inputHiddentTxt.setAttribute("id",inputHidden);inputHiddentTxt.setAttribute("style","display:none;");MainDiv.appendChild(inputHiddentTxt);var LookUpText=document.createElement("input");LookUpText.setAttribute("style","height:21px;width:99%");LookUpText.setAttribute("id","LookUpText"+rowNum);LookUpText.setAttribute("onchange","isDataChanged = true;");LookUpText.setAttribute("autocomplete","off");MainDiv.appendChild(LookUpText);var LookUpIcon=document.createElement("span");LookUpIcon.setAttribute("class","d-icon-triangle_down");LookUpIcon.setAttribute("id","LookUpIcon"+rowNum);LookUpIcon.setAttribute("style","margin-left:-15px;cursor:default");MainDiv.appendChild(LookUpIcon);if(!LoadingNewRow){var combo=Ext.getCmp("fieldsId"+rowNum);var record=combo.getStore().findRecord("Name",APINameOfSelectedField);SupportingData=record.data.SupportData}referencedObjName=SupportingData;LookUpText.setAttribute("onkeyup","callTypeAhead(this,'"+referencedObjName+"', event, '"+APINameOfSelectedField+"' );");LookUpIcon.setAttribute("onclick","isDataChanged = true;openLookup('"+referencedObjName+"','"+APINameOfSelectedField+"','"+oncompleteVar+"');")}else{if(type=="datetime"||type=="date"){var datePanel=Ext.create("Ext.form.Panel",{width:152,items:[{xtype:"datefield",id:"DateFieldId"+rowNum,triggerCls:"d-icon-calendar_clock_o",height:18,anchor:"80%",name:"from_date",format:SDEDateFormat,altFormats:"m,d,Y|m.d.Y",editable:false,listeners:{click:{element:"el",fn:function(element){var dtPicker=Ext.getCmp(this.id).getPicker();dtPicker.alignTo(this,"c-tl",[40,10])}},change:function(val,newValue,oldValue,eOpts){isDataChanged=true}}}]});datePanel.render("OperandDivOfRow"+rowNum)}else{if(type=="boolean"||type=="picklist"){APINameOfSelectedField=APIName;var picklistStr=[];if(type=="picklist"){if(!LoadingNewRow){var combo=Ext.getCmp("fieldsId"+rowNum);var record=combo.getStore().findRecord("Name",APINameOfSelectedField);SupportingData=record.data.SupportData;DefaultValue=record.data.DefaultValue}picklistStr=eval(SupportingData)}else{if(type=="boolean"){picklistStr=[{Label:noLbl,Value:"NO"},{Label:yesLbl,Value:"YES"}];DefaultValue="NO"}}PicklistfieldStore=Ext.create("Ext.data.Store",{fields:["Label","Value"],data:picklistStr});var pickListComboBx=Ext.create("Ext.form.field.ComboBox",{id:"pickListFieldCombo"+rowNum,triggerCls:"d-icon-triangle_down",queryMode:"local",store:PicklistfieldStore,valueField:"Value",displayField:"Label",forceSelection:true,editable:true,listWidth:165,tpl:'<tpl for="."><div class="x-boundlist-item">{[fm.htmlEncode(values.Label)]}</div></tpl>',listeners:{render:function(combo,eOpts){combo.setValue(DefaultValue)}}});pickListComboBx.render("OperandDivOfRow"+rowNum)}}}}}}}function openLookup(n,f,m){var b="";var a=parseInt((screen.availWidth/2)-(1000/2));var h=parseInt((screen.availHeight/2)-(600/2));if(n.toLowerCase()==("BusinessHours").toLowerCase()){b="/apex/SearchPage?moduleId="+orgNamespace+"service_hours__c&InstanceID=&isLookup=true&popupId=null&moduleName=BMC_BASEELEMENT__c&isFromSearchFilter=true";window.open(b,"lookup","status = 1,height =600, width = 1000,left= "+a+",top="+h+", resizable = 0,scrollbars=no")}else{var g="";var c="";oncompleteVar=m;b="SearchAndLink?txt=customLookup&parentName=BMC_BaseElement__c&childName="+n+"&isLookUp="+n+"&filterId=";if(n.toLowerCase()==("BMC_BaseElement__c").toLowerCase()){g="active_be";if(f.toLowerCase()==(orgNamespace+"fkbusinessservice__c").toLowerCase()){g="no_filter&citype=subservice";c=getUrlParameter("InstanceID")}if(f.toLowerCase()==(orgNamespace+"fklocation__c").toLowerCase()){g="no_filter&citype=location";c=getUrlParameter("InstanceID")}}if(n.toLowerCase()=="Model__c".toLowerCase()){g="active_custom&className="+encodeURI(classNameValue)}if(n.toLowerCase()=="User".toLowerCase()){g="active_standard"}var j;var e=document.getElementById(m);if(typeof(e)!="undefined"&&e!=null){j=e.value}if(j!=null){j=j.trim();j=encodeURIComponent(j);if(j!=""&&j.length<2){GetMessageBox("bmc-message").show({msg:searchErrorMsg,buttons:Ext.MessageBox.OK});return}else{b+=g+"&param1="+c+"&searchLookUpStr="+j+"&isCustomLookup=false&idValstr=";var k="";var d=(screen.width-1000)/2;var l=parseInt((screen.height/2)-(600/2))-50;lkpApiName=f;if(f=="PRIMARYCLIENT__C"||(!f.match("^primaryclient__c")&&f.match("primaryclient__c$"))){if(isSearchAndLink){window.open(b,"__blank","status = 1,height =600, width = 1000,left="+d+",top="+l+",resizable = 0,scrollbars=yes")}else{window.open(b,"lookup","status = 1,height =600, width = 1000,left="+d+",top="+l+",resizable = 0,scrollbars=yes")}}else{if(isSearchAndLink){window.open(b,"__blank","status = 1,height =600, width = 1000,left="+d+",top="+l+",resizable = 0,scrollbars=yes")}else{window.open(b,"lookup","status = 1,height =600, width = 1000,left="+d+",top="+l+",resizable = 0,scrollbars=yes")}}}}}}function getUrlParameter(d){d=d.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var c="[\\?&]"+d+"=([^&#]*)";var b=new RegExp(c);var a=b.exec(window.location.href);if(a==null){return""}else{return a[1]}}function clientfields(d,a){var b=document.getElementById(oncompleteVar);if(b!=null&&typeof(b)!="undefined"){b.value=a;var c=document.getElementById(inputHidden);if(c!=null&&typeof(c)!="undefined"){c.value=d}}isDataChanged=true}function ClearfieldofRow(j){var f=Ext.getCmp("fieldsId"+j);var e=Ext.getCmp("operatorId"+j);if(j!=1){if(f!=null&&f!=undefined&&f!="undefined"){f.setValue("")}if(e!=null&&e!=undefined&&e!="undefined"){e.setValue("")}var a=Ext.getCmp("TextField"+j);var g=document.getElementById("TextAreaField"+j);var h=Ext.getCmp("DateFieldId"+j);var b=document.getElementById("LookUpText"+j);var c=Ext.getCmp("pickListFieldCombo"+j);if(a!=null&&a!="undefined"&&a!=undefined){a.setValue("")}else{if(h!=null&&h!="undefined"&&h!=undefined){h.setValue("")}else{if(g!=null&&g!="undefined"&&g!=undefined){g.value=""}else{if(b!=null&&b!="undefined"&&b!=undefined){b.value=""}else{if(c!=null&&c!="undefined"&&c!=undefined){c.setValue("")}}}}}}else{if(classNameValue.toLowerCase()==("BMC_BaseElement").toLowerCase()){var d=Ext.getCmp("pickListFieldCombo1");if(d==null||typeof(d)=="undefined"||d==undefined){d=Ext.getCmp("pickListFieldCombo1")}if(d!=null&&d!="undefined"&&d!=undefined){d.setValue(classNameValue)}}}}function CancelFilter(){if(isSearchAndLink){window.parent.filterWindowOpened=false;window.parent.AdvancedFilterPopUp.hide()}else{window.parent.filterWindowOpened=false;window.parent.AdvancedFilterPopUp.close()}}function Save(b){FromApply=false;var d=Validate();isDataChanged=false;if(d==""){JsonConditionString=CollectCriterionData();if(selectedFilterName==null||selectedFilterName==""||selectedFilterName==savedCriteria||selectedFilterName==NoneLabel){var a=document.getElementById("NewFilterNameId");if(a!=null&&a.value!=null&&a.value!=""){NewFilterName=a.value.trim();selectedFilterName="";SaveFilterInController(JsonConditionString,selectedFilterName,NewFilterName,ClassNameinCriteria,b)}}else{NewFilterName=Ext.getCmp("FilterNameTextId").getValue();var c=NewFilterName.trim();SaveFilterInController(JsonConditionString,selectedFilterName,c,ClassNameinCriteria,b)}showWaitMask()}else{GetMessageBox("bmc-message").show({msg:d,buttons:Ext.Msg.OK,icon:Ext.Msg.ERROR})}}function SaveComplete(){var a=window.parent.document.getElementById("searchTextId");if(window.parent.searchFieldNew){var b=window.parent.document.getElementById(window.parent.searchFieldNew)}if(FromApply){if(selectedFilterName!=null&&selectedFilterName!=""){window.parent.FilterIconTooltip=ToolTipString;window.parent.AdvancedFilterName=selectedFilterName;if(isSearchAndLink){window.parent.advancedFilterApplied=true;if(a){a.value=""}else{if(b){b.value=""}}window.parent.callAdvancedSearch(JsonConditionString,ClassNameinCriteria);window.parent.AdvancedFilterPopUp.hide()}else{window.parent.document.getElementById("searchTxt").value="";window.parent.callAdvancedSearch();window.parent.filterWindowOpened=false;window.parent.searchstring="";window.parent.AdvancedFilterPopUp.close()}}}else{if(messageString==SaveSuceesMsg){ReloadFilterNameStore();showHideFilterNameRow();ShowSavingNewFilterDiv(false);NewFilterName="";GetMessageBox("bmc-message").show({msg:messageString,buttons:Ext.MessageBox.OK})}else{if(messageString==NameValidationMsg){GetMessageBox("bmc-message").show({title:ConfirmLabel,msg:NameValidationMsg,buttonText:{yes:yesLbl,no:noLbl},icon:Ext.MessageBox.WARNING,fn:function(c){if(c==="yes"){Save(true)}}})}else{GetMessageBox("bmc-message").show({msg:messageString,buttons:Ext.Msg.OK,icon:Ext.Msg.ERROR})}}}}function DeleteOnComplete(){if(DeleteAfterReplacement){var selectedFilter=Ext.getCmp("selectedFilter").getStore();selectedFilter.removeAll();selectedFilterStore=eval(selectedFilterStore);selectedFilter.loadData(selectedFilterStore);DeleteAfterReplacement=false;hideWaitMask()}else{hideWaitMask();selectedFilterName="";if(messageString==RecordDeletedLabel){ReloadFilterNameStore();ShowSavingNewFilterDiv(false);showHideFilterNameRow();NewFilterName="";GetMessageBox("bmc-message").show({msg:messageString,buttons:Ext.MessageBox.OK})}else{GetMessageBox("bmc-message").show({msg:messageString,buttons:Ext.Msg.OK,icon:Ext.Msg.ERROR})}}}function SaveFilter(){var a=Ext.getCmp("selectedFilter");if(a!=null){selectedFilterName=a.getValue()}if(selectedFilterName==null||selectedFilterName==""||selectedFilterName==savedCriteria||selectedFilterName==NoneLabel){ShowSavingNewFilterDiv(true)}else{Save(false)}if(Ext.isGecko){window.parent.AdvancedFilterPopUp.setHeight(335)}else{window.parent.AdvancedFilterPopUp.setHeight(332)}}function Validate(){var j=document.getElementById("FilterCriteria");var b=tableLenght;var g;for(rowCount=1;rowCount<=b;rowCount++){if(DeletedRowArray.indexOf("$"+rowCount+"$")==-1){var a=Ext.getCmp("fieldsId"+rowCount);var e=Ext.getCmp("operatorId"+rowCount);if((a.getValue()!=null&&a.getValue()!=undefined&&a.getValue()!="")&&(e.getValue()!=""&&e.getValue()!=null&&e.getValue()!=undefined)){g=""}else{if((a.getValue()==null||a.getValue()==undefined||a.getValue()=="")&&(e.getValue()==""||e.getValue()==null||e.getValue()==undefined)){g=""}else{g=SpecifyOperatorMsg;break}}}}if(g==""&&!FromApply){var h=document.getElementById("NewFilterNameId");var d=Ext.getCmp("FilterNameTextId");var f="";var c="";if(h!=null&&h!=undefined&&h.value!=null){f=h.value}if(d!=null&&d!=undefined&&d.value!=null){c=d.getValue()}f=f.trim();c=c.trim();if(f==""&&c==""){g=filterNameRequired}else{if(f.length>80||c.length>80){g=nameLengthValidation}}}return g}function Apply(){FromApply=true;var b=Validate();if(b==""){var a=Ext.getCmp("selectedFilter");if(a!=null){selectedFilterName=a.getValue()}if(selectedFilterName==null||selectedFilterName==""||selectedFilterName==savedCriteria||selectedFilterName==NoneLabel||isDataChanged){selectedFilterName="SystemGeneratedRecord_"+userId}JsonConditionString=CollectCriterionData();if(isSearchAndLink){SaveComplete()}else{SaveFilterInController(JsonConditionString,selectedFilterName,"",ClassNameinCriteria)}}else{GetMessageBox("bmc-message").show({msg:b,buttons:Ext.Msg.OK,icon:Ext.Msg.ERROR})}}function ClearSearch(){window.parent.AdvancedFilterName="";if(isSearchAndLink){window.parent.fromAdvancedFilter=true;window.parent.advancedFilterApplied=false;window.parent.callAdvancedSearch()}else{window.parent.callAdvancedSearch()}}function resetFilter(){selectedFilterName="";AppliedFilterName="";refreshFields(classNameValue);ReloadFilterNameStore();showHideFilterNameRow();window.parent.AdvancedFilterName="";if(isSearchAndLink){window.parent.fromAdvancedFilter=true;window.parent.advancedFilterApplied=false;window.parent.callAdvancedSearch()}else{window.parent.callAdvancedSearch()}results="";LoadExistingData();Visualforce.remoting.Manager.invokeAction(_SearchRemotingActions.ResetFilter,classNameValue,function(a,b){},{escape:false})}function CollectCriterionData(){var p=document.getElementById("FilterCriteria");var g=tableLenght;var l="";var h=1;ToolTipString="";for(rowCount=1;rowCount<=g;rowCount++){if(DeletedRowArray.indexOf("$"+rowCount+"$")==-1){var c=Ext.getCmp("fieldsId"+rowCount);var j=Ext.getCmp("operatorId"+rowCount);var d=Ext.getCmp("TextField"+rowCount);var m=document.getElementById("TextAreaField"+rowCount);var o=Ext.getCmp("DateFieldId"+rowCount);var f=document.getElementById("LookUpText"+rowCount);var e=Ext.getCmp("pickListFieldCombo"+rowCount);var n,b;if(c!=null&&c.getValue()!=null&&j!=null&&j.getValue()){var a;if(rowCount!=1){ToolTipString+=" "+ANDLabel+" ";a=c.getValue()}else{a=orgNamespace.toUpperCase()+"CLASSNAME__C"}l+=+h+CellSeperator+a+CellSeperator+j.getValue();ToolTipString+=c.getRawValue()+" "+j.getRawValue();if(d!=""&&d!=null&&typeof(d)!=undefined){n=d.getValue();l+=CellSeperator+n}else{if(m!=""&&m!=null&&typeof(m)!=undefined){n=m.value;l+=CellSeperator+n}else{if(f!=""&&f!=null&&typeof(f)!=undefined){var k=document.getElementById("inputHidden"+rowCount);if(k!=null&&typeof(k)!="undefined"){n=f.value;l+=CellSeperator+k.value+PE+n}}else{if(e!=""&&e!=null&&typeof(e)!=undefined){n=e.getValue();b=e.getRawValue();l+=CellSeperator+n}else{if(o!=""&&o!=null&&typeof(o)!=undefined){if(o.getValue()!=null&&o.getValue()!=""){n=Ext.Date.format(new Date(o.getValue()),SDEDateFormat)}else{n=""}l+=CellSeperator+n}}}}}if(n!=""){if(b!=null&&b!=""){ToolTipString+="  "+b+" "}else{ToolTipString+="  "+n+" "}b=""}else{ToolTipString+=" ' ' "}l=l+RowSeperator;h++}}}return l}function ShowSavingNewFilterDiv(b){var a=document.getElementById("SaveFilterTable");if(a!=null&&a!=undefined){if(!b){a.setAttribute("style","display:none");document.getElementById("NewFilterNameId").value=""}else{a.setAttribute("style","border-top: 1px solid #C4C0CE;width: 100%;");window.scrollTo(0,document.body.scrollHeight||document.documentElement.scrollHeight)}}}function LoadExistingData(){showHideFilterNameRow();if(AppliedFilterName!="undefined"&&AppliedFilterName!=null&&AppliedFilterName!=""&&isValidFilter){selectedFilterName=AppliedFilterName;AppliedFilterName=""}if(results!=null&&results!=""){try{Displaydata(results)}catch(a){alert(a)}}else{ClearTable();AddRow(false);setDefaultRow(1,className,orgNamespace.toUpperCase()+"CLASSNAME__C","=",classNameValue);if(isServiceOffering){isSkipValue=true;setDefaultRow(2,"Service Type",orgNamespace.toUpperCase()+"SERVICETYPE__C","=","Offering");isSkipValue=false}else{if(isServiceLookup){isSkipValue=true;setDefaultRow(2,"Service Type",orgNamespace.toUpperCase()+"SERVICETYPE__C","!=","Offering");isSkipValue=false}}ShowHideAddLink(true)}}function Displaydata(a){if(a.length>0){for(i=0;i<a.length;i++){AddRowWithData(i,a[i].Field,a[i].Operator,a[i].Operand,a[i].Type,a[i].FieldAPIName)}if(a.length<ConditionLimit){ShowHideAddLink(true)}else{ShowHideAddLink(false)}}}function ClearTable(){if(isI8){ClearTableForI8()}else{var d=document.getElementById("FilterCriteria");rowCount=d.rows.length;if(typeof(d)!="undefined"&&d!=null){for(var b=0;b<rowCount;b++){d.deleteRow(0);var a=b+1;var e=Ext.getCmp("TextField"+a);var c=Ext.getCmp("DateFieldId"+a);var f=Ext.getCmp("pickListFieldCombo"+a);if(e){e.destroy()}else{if(f){f.destroy()}else{if(c){c.destroy()}}}}}tableLenght=0}}function ClearTableForI8(){var o=document.getElementById("FilterCriteria");rowCount=tableLenght;if(typeof(o)!="undefined"&&o!=null){for(var h=0;h<rowCount;h++){o.deleteRow();var j=h+1;var a=Ext.getCmp("TextField"+j);var f=Ext.getCmp("DateFieldId"+j);var g=Ext.getCmp("pickListFieldCombo"+j);var k=Ext.getCmp("fieldsId"+j);var n=Ext.getCmp("operatorId"+j);var m=document.getElementById("FieldDivOfRow"+j);var l=document.getElementById("OperatorDivOfRow"+j);var c=document.getElementById("OperandDivOfRow"+j);var e=document.getElementById("ANDDivId"+j);var b=document.getElementById(j);var d=document.getElementById("ANDtext"+j);if(a){a.destroy()}else{if(g){g.destroy()}else{if(f){f.destroy()}}}if(k){k.destroy()}if(n){n.destroy()}if(typeof(m)!="undefined"&&m!=null){m.parentNode.removeChild(m)}if(typeof(l)!="undefined"&&l!=null){l.parentNode.removeChild(l)}if(typeof(c)!="undefined"&&c!=null){c.parentNode.removeChild(c)}if(typeof(e)!="undefined"&&e!=null){e.parentNode.removeChild(e)}if(typeof(b)!="undefined"&&b!=null){b.parentNode.removeChild(b)}tableLenght=tableLenght-1}}}function AddRowWithData(w,s,r,u,m,j){var v=document.getElementById("FilterCriteria");if(w==0){ClearTable()}w=w+1;var y=document.createElement("TR");y.setAttribute("id","RowId"+w);v.appendChild(y);var o=document.createElement("TD");o.setAttribute("valign","top");o.setAttribute("style","width:10%");y.appendChild(o);var l=document.createElement("div");l.id="ANDDivId"+w;if(w>1){var t=document.createTextNode(ANDLabel);l.className="AndDivCls ";l.appendChild(t)}else{var q=document.createTextNode(ForLabel+":");l.setAttribute("style","padding: 6px 3px 3px 3px;");l.appendChild(q)}o.appendChild(l);var h=document.createElement("TD");h.setAttribute("valign","top");h.setAttribute("style","width:20%");y.appendChild(h);var g=document.createElement("div");g.setAttribute("style","padding:3px;");var k="FieldDivOfRow"+w;g.id=k;h.appendChild(g);var c=document.createElement("TD");c.setAttribute("valign","top");c.setAttribute("style","width:20%");y.appendChild(c);var f=document.createElement("div");f.setAttribute("style","padding:3px;");var p="OperatorDivOfRow"+w;f.id=p;c.appendChild(f);var b=createFieldCombox(w);b.render(g);var x=createcomparisonOperator(w);x.render(f);setComparisonOperatorStore(m.toLowerCase(),w);var n=document.createElement("TD");n.setAttribute("valign","top");n.setAttribute("style","width:20%");y.appendChild(n);var a=document.createElement("div");a.setAttribute("style","padding:3px;");var d="OperandDivOfRow"+w;a.id=d;n.appendChild(a);ShowMatchingField(j,"",m,w,"",false);var e=document.createElement("TD");e.setAttribute("valign","middle");e.setAttribute("style","width:7%");y.appendChild(e);if(w>1){e.id=w;e.title=DeleteRowLabel;e.className="d-icon-minus_circle_o";e.setAttribute("onclick","DeleteThisRow(this.id);");e.setAttribute("style","margin-left: 5px")}tableLenght=tableLenght+1;SetRows(s,j,m,r,u,w)}function DeleteThisRow(a){a=parseInt(a);var b=document.getElementById("RowId"+a);if(((isServiceLookup||isServiceOffering)&&a>2)||!(isServiceLookup||isServiceOffering)){b.setAttribute("style","display:none");DeletedRowArray+=a+"$"}var c=document.getElementById("FilterCriteria");if(tableLenght==ConditionLimit){ShowHideAddLink(true)}ConditionLimit++;isDataChanged=true}function ReloadStoreAndConditions(){var d=document.getElementById("FilterCriteria");var f=tableLenght;var a;for(rowCount=2;rowCount<=f;rowCount++){if(DeletedRowArray.indexOf("$"+rowCount+"$")==-1){var e=Ext.getCmp("fieldsId"+rowCount);if(e!=null){e.store.removeAll();e.store.loadData(fieldsStoreData)}if(e!=null&&e.getValue()!=null){var c=e.getValue();a=true;for(var b=0;b<fieldsStoreData.length;b++){if((fieldsStoreData[b].Name).toLowerCase()==c.toLowerCase()){a=false;break}}if(a){DeleteThisRow(rowCount)}}}}}function SetRows(c,l,e,m,r,g){var j="operatorId"+g;var s=Ext.getCmp(j);s.setValue(m);var k="fieldsId"+g;var h=Ext.getCmp(k);h.setValue(l);h.setRawValue(c);var b=Ext.getCmp("TextField"+g);var d=document.getElementById("TextAreaField"+g);var p=Ext.getCmp("DateFieldId"+g);var f=document.getElementById("LookUpText"+g);var q=Ext.getCmp("pickListFieldCombo"+g);if(r==RowSeperator){r=""}if(b!=null&&b!="undefined"&&b!=undefined){b.setValue(r)}else{if(p!=null&&p!="undefined"&&p!=undefined){p.setValue(r)}else{if(d!=null&&d!="undefined"&&d!=undefined){d.value=r}else{if(f!=null&&f!="undefined"&&f!=undefined){var a=r.split(PE);var o=document.getElementById("inputHidden"+g);if(typeof(o)!="undefined"&&o!=null){if(a.length>1){o.value=a[0];f.value=a[1]}}}else{if(q!=null&&q!="undefined"&&q!=undefined){q.setValue(r)}}}}}if(g==1){h.setDisabled(true);s.setDisabled(true);for(var n=0;n<classpicklistStr.length;n++){if((classpicklistStr[n].Value).toLowerCase()==r.toLowerCase()){ClassNameinCriteria=classpicklistStr[n].Id;break}}if(classNameValue.toLowerCase()!=("BMC_BaseElement").toLowerCase()&&typeof(q)!="undefined"&&q!=null){q.setDisabled(true)}}}var isSkipValue=false;function setDefaultRow(l,f,h,c,j){var a="operatorId"+l;var k=Ext.getCmp(a);k.store.loadData(compStore.picklist);k.setValue(c);var e="fieldsId"+l;var b=Ext.getCmp(e);b.setValue(h);b.setRawValue(f);var d=Ext.getCmp("pickListFieldCombo"+l);if(d!=null&&d!="undefined"&&d!=undefined){d.setValue(j)}b.setDisabled(true);k.setDisabled(true);if(j!="BMC_BaseElement"){d.setDisabled(true)}else{if(d!=null&&d!="undefined"&&d!=undefined){d.setReadOnly(false)}}if(!isSkipValue){for(var g=1;g<5;g++){AddRow(false)}}}function showWaitMask(){waitMask.show()}function hideWaitMask(){waitMask.hide()}function setDivPosition1(){var b=document.getElementById(currentField.id);var d=b.getBoundingClientRect().top+20;var c=b.getBoundingClientRect().left;var a=document.getElementById("autocompleteDiv");if(typeof(a)!="undefined"&&a!=null){a.style.top=d+"px";a.style.left=c+"px";a.style.width="150px"}}function callTypeAhead(c,b,d,a){referencedObjName=b;queryData(c,b,d,"",a)}function GetMessageBox(a){if(WinMsg==null){WinMsg=Ext.create("Ext.window.MessageBox")}WinMsg.baseCls=a;return WinMsg};