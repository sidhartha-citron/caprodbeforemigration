var isfromSavefunction=false;var resultSetCategory;var isCustomLookup=false;var ownerElVal="";var staffElVal="";var ownerIdVal="";var staffIdVal="";var isFromLookup=false;function doSave(){save()}var isSRDSelected=false;function doOnLoadActivity(){window.parent.Ext.getCmp("LockRecord").getEl().on("click",function(){window.parent.getRecordLockedValue("recordLock")});window.parent.Ext.getCmp("UnlockRecord").getEl().on("click",function(){window.parent.getRecordLockedValue("clearLock");window.parent.closebar()});var a=window.location.href;if(a.indexOf("isNew")!=-1){window.parent.afterSaveSucceed();ShowInlineSaveMessage()}showDueDatePopup();isRTFEnabled=window.parent.RTFEnabledPage()}function loadProblemDetails(a){window.parent.loadProblemDetail(a);if(!isfromSavefunction){window.parent.isNeedToRefreshProblemList=true;window.parent.refreshProblemListTimeOut()}isfromSavefunction=false}function startWaitMsgBar(){window.parent.startWaitMsgBar()}function stopWaitMsgBar(){window.parent.stopWaitMsgBar()}var resultSetCategory;var addEvent=(function(){if(document.addEventListener){return function(a,c,b){a.addEventListener(c,b,false)}}else{return function(a,c,b){a.attachEvent("on"+c,b)}}}());function showDueDatePopup(){isRTFEnabled=window.parent.RTFEnabledPage();if(showPopUp!=""&&showPopUp!="null"&&showPopUp=="true"){if(window.showModalDialog){window.showModalDialog("/apex/RecalculateDueDate?problemId="+problemId+"&stdLayout=true&isRTFEnabled="+isRTFEnabled,this,"dialogWidth:400px; dialogHeight:150px; dialogLeft:400px; dialogTop:300px; resizable:no; scroll:no; status:no; center:yes")}else{window.open("/apex/RecalculateDueDate?problemId="+problemId+"&stdLayout=true&isRTFEnabled="+isRTFEnabled,"_blank","width=300,height=150,left=400,top=300,status=no,,modal=yes")}}}function createFilterFieldMap(){for(var a=0;a<filterStr.length;a++){var b=new Object();b.key=filterStr[a].key;b.value=filterStr[a].value;b.filterId=filterStr[a].filterId;filterFieldsMap[filterStr[a].key]=b}}function getHTMLInputID(b){var a=lookupFilterIDMap[b];if((typeof(a)!="undefined"&&a!=null&&a.length!=0)){return a}b=b.replace(orgNamespace,"");a=lookupFilterIDMap[b];return a}function getHTMLInputValue(k,h){var j=getHTMLInputID(orgNamespace+k);var i="";var l;if(h!=null&&h!=""&&h.indexOf("reference")!=-1){if(k=="FKStatus__c"){l=statusLookupId}else{if(k=="FKImpact__c"){l=impactLookupId}else{if(k=="FKUrgency__c"){l=urgencyLookupId}else{l=j+"_lkid"}}}}else{if(k=="FKCategory__c"||k=="fkcategory__c"){l=categoryName}else{if(k=="FKStatus__c"){var a=document.getElementById("statusSelectId").options[document.getElementById("statusSelectId").selectedIndex].text;return a}else{if(k=="FKImpact__c"){var d=document.getElementById("impactSelectId").options[document.getElementById("impactSelectId").selectedIndex].text;return d}else{if(k=="FKUrgency__c"){var g=document.getElementById("urgencySelectId").options[document.getElementById("urgencySelectId").selectedIndex].text;return g}else{l=j}}}}}var e=document.getElementById(l);if(e!=null&&e!=undefined){if(e.value==undefined||e.value=="undefined"){var f=readOnlyFieldMap[l];if(f){i=f}}else{i=e.value}}else{e=document.getElementById(j);if(e!=null&&e!=undefined){if(e.value==undefined||e.value=="undefined"){var f=readOnlyFieldMap[j];if(f){i=f}}else{i=e.value}}}if(h!=null&&h.indexOf("boolean")!=-1&&i.trim()==""){i="null"}else{if(h.indexOf("datetime")!=-1){var b=new Date();try{b=DateUtil.getDateTimeFromUserLocale(i)}catch(c){b=new Date(i)}i=getSOQLDateTimeString(b)}else{if(h.indexOf("date")!=-1){var b=new Date();try{b=DateUtil.getDateFromUserLocale(i)}catch(c){b=new Date(i)}i=getSOQLDateString(b)}else{if(h.indexOf("number")!=-1||h.indexOf("currency")!=-1||h.indexOf("percent")!=-1){var b;if(i==null||i=="null"||i.trim()==""){i=0}}}}}return i}function getSOQLDateTimeString(a){return a.getUTCFullYear()+"-"+pad(a.getUTCMonth()+1)+"-"+pad(a.getUTCDate())+"T"+pad(a.getUTCHours())+":"+pad(a.getUTCMinutes())+":"+pad(a.getUTCSeconds())+"Z"}function getSOQLDateString(a){return a.getFullYear()+"-"+pad(a.getMonth()+1)+"-"+pad(a.getDate())}function pad(a){return a<10?"0"+a:a}function getFilterQueryString(b){var h="";var d=filterFieldsMap[b];if(d!=null&&d!=undefined){h=d.filterId+"«";var g=d.value;if(g!=null&&g!=""){var e=g.split(PE);for(var c=0;c<e.length;c++){if(e[c]!=null&&e[c]!=""){var f=e[c].split(NONPRINT);h=h+f[0]+NONPRINT+getHTMLInputValue(f[1],f[2])+"«"}}}}var a=h.length;if(a>0){h=h.substring(0,a-1)}h=encodeURIComponent(h);return h}if(window.parent.assignRFLookupFilter!=undefined){window.parent.assignRFLookupFilter(getFilterQueryString)}function setFieldAPIName(a){fieldApiName=a}if(parent.isServiceCloudConsole=="true"){var clientHeight=document.body.clientHeight;if(parent.Ext.isIE){clientHeight+=60}else{clientHeight+=40}parent.resizeServiceCloudConsole(clientHeight)}function retainStaticFieldValueBeforeSave(){if(document.getElementById("owner_Name")!=null&&document.getElementById("owner_Name")!=undefined){ownerElVal=document.getElementById("owner_Name").value}if(document.getElementById(staffId)!=null&&document.getElementById(staffId)!=undefined){staffElVal=document.getElementById(staffId).value}if(document.getElementById(ownerOpenById)!=null&&document.getElementById(ownerOpenById)!=undefined){staffIdVal=document.getElementById(ownerOpenById).value}if(document.getElementById(ownerId)!=null&&document.getElementById(ownerId)!=undefined){ownerIdVal=document.getElementById(ownerId).value}}function setUrgencyValue(c){var b=document.getElementById(getHTMLInputID(orgNamespace+"FKUrgency__c"));if(document.getElementById(c).options[document.getElementById(c).selectedIndex].text==window.parent._ServerLabels.None1){document.getElementById(urgencyLookupId).value="";b.value="";document.getElementById(b.id+"_lkid").value="";document.getElementById(b.id+"_lkold").value=""}else{document.getElementById(urgencyLookupId).value=document.getElementById(c).value;var a=document.getElementById(c).options[document.getElementById(c).selectedIndex].text;b.value=a;document.getElementById(b.id+"_lkid").value=document.getElementById(c).value;document.getElementById(b.id+"_lkold").value=a}}function setImpactValue(c){var a=document.getElementById(getHTMLInputID(orgNamespace+"FKImpact__c"));if(document.getElementById(c).options[document.getElementById(c).selectedIndex].text==window.parent._ServerLabels.None1){document.getElementById(impactLookupId).value="";a.value="";document.getElementById(a.id+"_lkid").value="";document.getElementById(a.id+"_lkold").value=""}else{document.getElementById(impactLookupId).value=document.getElementById(c).value;var b=document.getElementById(c).options[document.getElementById(c).selectedIndex].text;a.value=b;document.getElementById(a.id+"_lkid").value=document.getElementById(c).value;document.getElementById(a.id+"_lkold").value=b}}function setStatusValue(c){document.getElementById(statusLookupId).value=document.getElementById(c).value;var b=document.getElementById(getHTMLInputID(orgNamespace+"FKStatus__c"));var a=document.getElementById(c).options[document.getElementById(c).selectedIndex].text;b.value=a;document.getElementById(b.id+"_lkid").value=document.getElementById(c).value;document.getElementById(b.id+"_lkold").value=a};