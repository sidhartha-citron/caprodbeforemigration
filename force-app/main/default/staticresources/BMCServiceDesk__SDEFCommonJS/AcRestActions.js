var tb,tabs,tabExistId,tabId,noLinkedCiLbl,mapDeviceIdVsActionsMenu={};var cntxAssemblyId="",cntxBeId="";var ciListGrid,AdvActionPanel;var tabCount=0,parentWindow=window.parent;var truncatedName="",strInstanceName="";var waitMsgBar="",deviceId="",reqContexId="";function stopWaitMsgBar(){if(typeof(waitMsgBar)!="undefined"&&waitMsgBar!=null&&waitMsgBar!=""){waitMsgBar.hide()}}function startWaitMsgBar(){waitMsgBar=new Ext.LoadMask(Ext.getBody(),{floating:{shadow:false},msgCls:"d-loader-container",msg:'<ul class="d-loading"><li class="d-loading__stick d-loading__stick_1"></li><li class="d-loading__stick d-loading__stick_2"></li><li class="d-loading__stick d-loading__stick_3"></li><li class="d-loading__stick d-loading__stick_4"></li><li class="d-loading__stick d-loading__stick_5"></li><li class="d-loading__stick d-loading__stick_6"></li><li class="d-loading__stick d-loading__stick_7"></li><li class="d-loading__stick d-loading__stick_8"></li><li class="d-loading__stick d-loading__stick_9"></li><li class="d-loading__stick d-loading__stick_10"></li><li class="d-loading__stick d-loading__stick_11"></li><li class="d-loading__stick d-loading__stick_12"></li></ul><div>'+pleasewait+"</div>"});if(typeof(waitMsgBar)!="undefined"&&waitMsgBar!=null&&waitMsgBar!=""){waitMsgBar.show()}}var resizetreepanel;function setTreePanelHeight(a){resizetreepanel=a}Ext.EventManager.onWindowResize(function(){if(resizetreepanel!=null&&resizetreepanel!="undefined"){resizetreepanel()}});function OpenHelppage(){if(isNewContextpage()&&wikiUrl!=""&&typeof(wikiUrl)!="undefined"){window.open(wikiUrl,false,"width="+screen.width+",height="+screen.height+",resizable = 1,scrollbars=yes,status=1,top=0,left=0",false)}else{if(incidentId!=""&&incidentId!="undefined"){if(showJapaneseHelp=="true"){openStdHelp_Jap()}else{openStdHelp()}}else{if(useStdHelp=="true"){if(showJapaneseHelp=="true"){openStdHelp_Jap()}else{openStdHelp()}}}}}function openStdHelp(){window.open(stdHelpResource+"/ci_actions_ac.htm",false,"width="+screen.width+",height="+screen.height+",resizable = 1,scrollbars=no,status=1,top=0,left=0",false)}function openStdHelp_Jap(){window.open(stdHelpJapResource+"/ci_actions_ac.htm",false,"width="+screen.width+",height="+screen.height+",resizable = 1,scrollbars=no,status=1,top=0,left=0",false)}function beforeCloseTabEvent(a){tabCount--}function addActionTab(e,c,b){tabId=e+"-"+c;var a=checkTabExists(tabId);if(a){tabs.setActiveTab(tabId)}else{if(tabCount>=maxTabLimit){Ext.MessageBox.show({msg:TabLimitCrossed,width:300,height:"auto",buttons:Ext.MessageBox.OK})}else{setTitle(c,e);link=getLinkForAction(e,c,b);var d=tabs.add({title:tabTitle,closable:true,html:'<iframe frameborder="0" src ="/apex/'+link+'" style="width:100%;height:100%;border:none"/>',id:tabId,tooltip:tabToolTip,tooltipType:"title",tabAssemblyId:c,tabBEid:b,listeners:{beforeclose:beforeCloseTabEvent,show:function(f){cntxAssemblyId=f.tabAssemblyId;cntxBeId=f.tabBEid}}});tabs.setActiveTab(d);tabCount++}}}function getLinkForAction(d,c,b){var a="";if(d=="Services"||d=="Events"||d=="Processes"||d=="ConfigSummary"){startWaitMsgBar()}if(d=="Services"){a="AcDeviceServices?assemblyId="+c+"&actionContext="+d+"&incidentId="+incidentOrBEId+"&IsMenurequired=true&isPaginationRequired=true&gridHeight=370&selectedBEId="+b+"&isActionMenuMapAlreadyFilled=true"}else{if(d=="Events"){a="AcDeviceEvents?assemblyId="+c+"&actionContext="+d+"&incidentId="+incidentOrBEId+"&IsMenurequired=true&isPaginationRequired=true&gridHeight=270&selectedBEId="+b+"&isActionMenuMapAlreadyFilled=true"}else{if(d=="Processes"){a="AcDeviceProcesses?assemblyId="+c+"&actionContext="+d+"&incidentId="+incidentOrBEId+"&IsMenurequired=true&isPaginationRequired=false&selectedBEId="+b+"&isActionMenuMapAlreadyFilled=true"}else{if(d=="Registry"){a="ACDeviceRegistryPage?assemblyId="+c+"&actionContext="+d+"&incidentId="+incidentOrBEId+"&IsMenurequired=true&isPaginationRequired=false&gridHeight=600&selectedBEId="+b+"&isActionMenuMapAlreadyFilled=true"}else{if(d=="ConfigSummary"){a="ACDeviceSummaryPage?assemblyId="+c+"&actionContext="+d+"&incidentId="+incidentOrBEId+"&IsMenurequired=true&isPaginationRequired=false&gridHeight=600&selectedBEId="+b+"&isActionMenuMapAlreadyFilled=true"}}}}}return a}function checkTabExists(c){var b=false;var a=tabs.items;var e="";for(var d=0;d<a.length;d++){e=a.items[d].id;if(e==c){b=true;break}}return b}function setTitle(a,c){strInstanceName=mapDeviceIdVsInstanceName[a];if(strInstanceName!=null&&strInstanceName!=""&&strInstanceName.length>15){truncatedName=strInstanceName.substring(0,15)+"..."}var b="";if(c=="Services"){b=Services}else{if(c=="Events"){b=Event}else{if(c=="Processes"){b=processes}else{if(c=="ConfigSummary"){b=assetSummary}else{if(c=="Registry"){b=registry}}}}}tabTitle=b+": "+truncatedName;tabToolTip=b+": "+strInstanceName}function ShowConfirmationMessageBox(a){var b="";if(a=="WakeUp"){b=ACConfimMessageForWakeupDevice}else{if(a=="Reboot"){b=ACConfimMessageForRebootDevice}else{if(a=="Shutdown"){b=ACConfimMessageForShutdownDevice}}}if(b!=""){Ext.Msg.show({msg:b,width:300,buttons:Ext.MessageBox.YESNO,buttonText:{yes:LabelYes,no:LabelNo},fn:function(c){if(c=="yes"){if(cntxAssemblyId!=""&&cntxBeId!=""){parentdirectConnectHandler(a)}else{parentdirectConnectHandler(a)}}}})}}Ext.onReady(function(){Ext.QuickTips.init();tabCount++;if(actionContext!=null&&actionContext!=""&&actionContext!="undefined"){if(actionContext=="Services"||actionContext=="Events"||actionContext=="Processes"||actionContext=="ConfigSummary"){startWaitMsgBar()}if(actionContext=="Services"){link="AcDeviceServices?assemblyId="+assemblyIdParam+"&actionContext="+actionContext+"&incidentId="+incidentOrBEId+"&IsMenurequired=true&isPaginationRequired=true&gridHeight=370&selectedBEId="+PageBEId}else{if(actionContext=="Events"){link="AcDeviceEvents?assemblyId="+assemblyIdParam+"&actionContext="+actionContext+"&incidentId="+incidentOrBEId+"&IsMenurequired=true&isPaginationRequired=true&gridHeight=270&selectedBEId="+PageBEId}else{if(actionContext=="Processes"){link="AcDeviceProcesses?assemblyId="+assemblyIdParam+"&actionContext="+actionContext+"&incidentId="+incidentOrBEId+"&IsMenurequired=true&isPaginationRequired=false&selectedBEId="+PageBEId}else{if(actionContext=="ConfigSummary"){link="ACDeviceSummaryPage?assemblyId="+assemblyIdParam+"&actionContext="+actionContext+"&incidentId="+incidentOrBEId+"&IsMenurequired=false&isPaginationRequired=false&selectedBEId="+PageBEId}else{if(actionContext=="Registry"){link="ACDeviceRegistryPage?assemblyId="+assemblyIdParam+"&actionContext="+actionContext+"&incidentId="+incidentOrBEId+"&IsMenurequired=true&isPaginationRequired=false&gridHeight=600&selectedBEId="+PageBEId}}}}}tabId=actionContext+"-"+assemblyIdParam;setTitle(assemblyIdParam,actionContext)}Ext.tip.QuickTipManager.init();tabs=Ext.create("Ext.tab.Panel",{resizeTabs:true,id:"tabPanel",enableTabScroll:true,border:false,region:"center",style:"overflow:hidden",defaults:{autoScroll:true,hideMode:"offsets"},plain:true,activeTab:0,cls:"rf-tab-div",tabBar:{height:30,defaults:{height:29}},items:[{title:ConfigurationItems,html:'<iframe frameborder="0" src ="/apex/'+CIPagelink+'" style="width:100%;height:100%;border:none"/>',id:"ciListTabId",tooltip:ConfigurationItems,listeners:{show:function(c){if(ciListGrid!=null&&ciListGrid!="undefined"){var b=ciListGrid.getSelectionModel().selected.items[0];if(b!=null&&b!=""&&b!="undefined"){cntxAssemblyId=b.get("AssemblyId__c");cntxBeId=b.get("Id")}}}}}]});if(link!=""&&link!=null&&link!="undefined"){var a=tabs.add({title:tabTitle,html:'<iframe frameborder="0" src ="/apex/'+link+'" style="width:100%;height:100%;border:none"/>',closable:true,id:tabId,tooltip:tabToolTip,tabAssemblyId:assemblyIdParam,tabBEid:PageBEId,listeners:{beforeclose:beforeCloseTabEvent,show:function(b){cntxAssemblyId=b.tabAssemblyId;cntxBeId=b.tabBEid}}});tabs.setActiveTab(a)}Ext.create("Ext.container.Viewport",{layout:"border",items:[tabs]})});function parentdirectConnectHandler(a){startWaitMsgBar();if(a==="RemoteControl"){var b=cntxBeId;if(incidentOrBEId!=null&&incidentOrBEId!=""){b=incidentOrBEId}Visualforce.remoting.Manager.invokeAction(_RemotingActions.getWebConsoleUrl,cntxAssemblyId,a,b,null,function(c,d){if(c&&!c.acErrorCode&&c.responseBody&&c.responseBody!=""){var e=1000;var f=600;window.open(encodeURI(c.responseBody),"_blank","status = 1,height ="+f+",width ="+e+",left="+setScreenLeft(e)+",top="+setScreenTop(f)+", resizable = yes, scrollbars=yes");stopWaitMsgBar()}else{getAppropriateBCMConsole(a,cntxAssemblyId,incidentOrBEId)}},{escape:false})}else{getAppropriateBCMConsole(a,cntxAssemblyId,incidentOrBEId)}}function getAppropriateBCMConsole(a,c,b){if(!makeAPICallsFromServer&&(isDiscoveryEnabled||isACEnabled)&&a!="PerformAudit"){getBinaryBCMConsole(c,a,"CMDBAction",b,null)}else{if(a=="PerformAudit"){directConnectDevice(a,c,b)}}}function showACError(){if(errorStr!=null&&errorStr!=""){this.GetMessageBox("bmc-message").show({msg:errorStr,title:Message,width:300,height:"auto",buttons:Ext.MessageBox.OK,fn:function(a){if(errorStr==noLinkedCiLbl){window.close()}}})}else{launchConsole()}}acActionHandler=function(a,b){if(a.id!="RemoteControl"&&a.id!="FileSystem"&&a.id!="FileTransfer"&&a.id!="PerformAudit"&&a.id!="Ping"&&a.id!="Reboot"&&a.id!="Shutdown"&&a.id!="WakeUp"&&a.id!="AdvAction"){if(cntxAssemblyId!=""&&cntxBeId!=""){addActionTab(a.id,cntxAssemblyId,cntxBeId)}}else{if(a.id=="AdvAction"){if(typeof(AdvActionPanel)!="undefined"){AdvActionPanel.expand()}}else{if(a.id=="RemoteControl"||a.id=="FileSystem"||a.id=="FileTransfer"){var c="";if(a.id=="RemoteControl"){c="rcd"}else{if(a.id=="FileSystem"){c="FileSystem"}else{c="FileTransfer"}}if(a.id=="RemoteControl"){var d="RemoteControl";Visualforce.remoting.Manager.invokeAction(_RemotingActions.getWebConsoleUrl,cntxAssemblyId,d,incidentOrBEId,null,function(e,f){if(e&&!e.acErrorCode&&e.responseBody&&e.responseBody!=""){var g=1000;var h=600;window.open(encodeURI(e.responseBody),"_blank","status = 1,height ="+h+",width ="+g+",left="+setScreenLeft(g)+",top="+setScreenTop(h)+", resizable = yes, scrollbars=yes")}else{if(!makeAPICallsFromServer&&(isDiscoveryEnabled||(isACEnabled&&isACCertified))){makeBCMActionAPIRequest(cntxAssemblyId,c,incidentOrBEId,a)}else{getBinaryBCMConsole(cntxAssemblyId,c,"CMDBAction",incidentOrBEId,a)}}},{escape:false})}else{if(!makeAPICallsFromServer&&(isDiscoveryEnabled||(isACEnabled&&isACCertified))){makeBCMActionAPIRequest(cntxAssemblyId,c,incidentOrBEId,a)}else{getBinaryBCMConsole(cntxAssemblyId,c,"CMDBAction",incidentOrBEId,a)}}}else{directConnectHandler(a)}}}};function getCurrentMachinesOS(){var b="";var a=window.navigator.platform.toLowerCase();if(a.indexOf("mac")>-1){b="macos"}else{if(a.indexOf("win")>-1){b="windows"}else{if(a.indexOf("linux")>-1){b="linux"}}}return b}getBinaryBCMConsole=function(f,e,b,g,c){startWaitMsgBar();var a="AC:CS:-";if(f.indexOf(a)!=-1){f=f.substring(a.length,f.length)}var d="";if(makeAPICallsFromServer||(isACEnabled&&!isACCertified)){d=getCurrentMachinesOS()}if(isManualOSSelectionEnabled&&osCookieVal&&osCookieVal!="undefined"){if(osCookieVal.toLowerCase()=="windows32"||osCookieVal.toLowerCase()=="windows64"){d="windows"}else{if(osCookieVal.toLowerCase()=="linux32"||osCookieVal.toLowerCase()=="linux64"){d="linux"}else{if(osCookieVal.toLowerCase()=="macos"){d="macos"}}}}Visualforce.remoting.Manager.invokeAction(_RemotingActions.getBinaryFileFromBCM,f,e,b,d,g,function(h,j){if(j.status){if(h.indexOf("ERROR:404")!=-1){if(c){directConnectHandler(c)}else{if(g){directConnectDevice(e,f,g)}}}else{if(h.indexOf("ERROR:")!=-1){this.GetMessageBox("bmc-message").show({title:warningtitle,msg:h,width:300,closable:true,buttons:Ext.MessageBox.OK,fn:function(l,m,k){if(l=="ok"){}},icon:Ext.MessageBox.WARNING});stopWaitMsgBar()}else{var i=document.createElement("a");i.href="/sfc/servlet.shepherd/version/download/"+h;document.body.appendChild(i);i.click();document.body.removeChild(i);stopWaitMsgBar()}}}},{escape:false})};var ajaxPreRequisiteDone=false;function prerequisiteForAPIRequest(){$.ajaxTransport("+binary",function(a,c,b){if(window.FormData&&((a.dataType&&(a.dataType=="binary"))||(a.data&&((window.ArrayBuffer&&a.data instanceof ArrayBuffer)||(window.Blob&&a.data instanceof Blob))))){return{send:function(e,n){var o=new XMLHttpRequest(),d=a.url,k=a.type,f=a.async||true,l=a.responseType||"blob",j=a.data||null,h=a.username||null,m=a.password||null;o.addEventListener("load",function(){var i={};i[a.dataType]=o.response;n(o.status,o.statusText,i,o.getAllResponseHeaders())});o.open(k,d,f,h,m);for(var g in e){o.setRequestHeader(g,e[g])}o.responseType=l;o.send(j);ajaxPreRequisiteDone=true},abort:function(){b.abort()}}}})}makeBCMActionAPIRequest=function(g,f,h,c){startWaitMsgBar();var b="AC:CS:-";if(g.indexOf(b)!=-1){g=g.substring(b.length,g.length)}var a="SessionId";var d=baseURL+"/ws/1/console/webstart";var e="";if(isManualOSSelectionEnabled&&osCookieVal&&osCookieVal!="undefined"){if(osCookieVal.toLowerCase()=="windows32"||osCookieVal.toLowerCase()=="windows64"){e="windows"}else{if(osCookieVal.toLowerCase()=="linux32"||osCookieVal.toLowerCase()=="linux64"){e="linux"}else{if(osCookieVal.toLowerCase()=="macos"){e="macos"}}}}if(e&&e!=""){d=d+"?os="+e}Visualforce.remoting.Manager.invokeAction(_RemotingActions.getBinaryFileFromBCM,g,f,a,e,h,function(i,j){if(j.status){if(i.indexOf("ERROR:404")!=-1){if(c){directConnectHandler(c)}else{if(h){parentdirectConnectHandler(h)}}}else{if(i.indexOf("ERROR:")!=-1){this.GetMessageBox("bmc-message").show({title:warningtitle,msg:i,width:300,closable:true,buttons:Ext.MessageBox.OK,fn:function(m,n,l){if(m=="ok"){}},icon:Ext.MessageBox.WARNING});stopWaitMsgBar()}else{if(!ajaxPreRequisiteDone){prerequisiteForAPIRequest()}var k={type:"GET",url:d,responseType:"arraybuffer",dataType:"binary",processData:false,beforeSend:function(l){l.setRequestHeader("Session-Id",i)},error:function(m,n,l){alert("Error : "+l);stopWaitMsgBar()},success:function(q,p,v){var r=document.createElement("a");var m=v.getResponseHeader("content-disposition");var l="";if(m&&m.indexOf("attachment")!==-1){var n=/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;var s=n.exec(m);if(s!=null&&s[1]){l=s[1].replace(/['"]/g,"")}}var t=new Blob([q],{type:"application/octet-stream"});const o=window.URL.createObjectURL(t);var u=document.createElement("a");u.href=o;u.download=l;document.body.appendChild(u);u.click();document.body.removeChild(u);stopWaitMsgBar()}};$.ajax(k)}}}},{escape:false})};function directConnectHandler(c){var a=c.id;var b="";if(a=="WakeUp"||a=="Reboot"||a=="Shutdown"){ShowConfirmationMessageBox(a)}else{if(cntxAssemblyId!=""&&cntxBeId!=""){parentdirectConnectHandler(a)}}}function GetMessageBox(a){if(typeof(WinMsg)=="undefined"||WinMsg==null){WinMsg=Ext.create("Ext.window.MessageBox")}WinMsg.baseCls=a;return WinMsg};