var objectName="";if(formulaFieldName.indexOf("IncidentHistory")!==-1||formulaFieldName.indexOf("Incident")!==-1){objectName="Incident__c"}else{if(formulaFieldName.indexOf("TaskHistory")!==-1||formulaFieldName.indexOf("Task")!==-1){objectName="Task__c"}else{if(formulaFieldName.indexOf("ProblemHistory")!==-1||formulaFieldName.indexOf("Problem")!==-1){objectName="Problem__c"}else{if(formulaFieldName.indexOf("ChangeHistory")!==-1||formulaFieldName.indexOf("ChangeRequest")!==-1){objectName="Change_Request__c"}else{if(formulaFieldName.indexOf("Broadcast")!==-1){objectName="Broadcasts__c"}else{if(formulaFieldName.indexOf("Release")!==-1){objectName="Release__c"}}}}}}var redirectReplyUrl="/apex/"+CurrentNamespacePrefix+"ComposeEmailPage?recordId="+recordId+"&HistoryId="+historyId+"&isNew=false&objectName="+objectName+"&enableSelfClosing=false&actionType="+actionType;if(formulaFieldName.indexOf("HistoryReply")!==-1){if(window.parent.isFocusOnRelatedList){redirectReplyUrl+="&isConsolePage=true&standardLayout=false"}else{redirectReplyUrl+="&isConsolePage=false&standardLayout=true&isCalledFromConsole=false&stdform=true"}window.location.href=redirectReplyUrl}else{if(formulaFieldName.indexOf("HistoryConsole")!==-1){if(window.parent.isFocusOnRelatedList){redirectReplyUrl+="&isConsolePage=true&isCalledFromConsole=true&stdform=false"}else{redirectReplyUrl+="&isConsolePage=false&standardLayout=true&isCalledFromConsole=false&stdform=true"}window.location.href=redirectReplyUrl}else{if(formulaFieldName=="collision"){window.location.href=changeCollisionsPageURL+"&CurrentChangeID="+recordId}else{if(formulaFieldName=="Instance_Editor_URL"){window.location.href="/apex/"+CurrentNamespacePrefix+"CMDBManager?cmdbRecordId="+recordId+"&instNameFromCIExplorer="+InstanceName}else{if(formulaFieldName.indexOf("LaunchConsole")!==-1){var referrerPage="";var isFromRFConsoleDetailPage=false;var isFromStandaloneConsole=false;if(document.referrer){referrerPage=document.referrer.toLowerCase();if(referrerPage.indexOf("consoleincidentrelatedlist")!=-1||referrerPage.indexOf("consoleproblemrelatedlist")!=-1||referrerPage.indexOf("consoletaskrelatedlist")!=-1||referrerPage.indexOf("consolereleaserelatedlist")!=-1||referrerPage.indexOf("consolebroadcastrelatedlist")!=-1||referrerPage.indexOf("consolechangerelatedlist")!=-1){isFromRFConsoleDetailPage=true}}try{var parentLocation=window.parent.location.href;if(parentLocation&&parentLocation.toLowerCase().indexOf("isrfconsoledetailform=true")==-1&&(parentLocation.toLowerCase().indexOf("incidentconsole")!=-1||parentLocation.toLowerCase().indexOf("taskconsole")!=-1)){isFromStandaloneConsole=true}}catch(err){}if(isFromRFConsoleDetailPage&&!isFromStandaloneConsole){if(typeof window.parent.parent.addTab==="function"){window.parent.parent.addTab(recordId,recordName,objectName,null,null,null,incType,formLayoutId)}if(typeof window.parent.loadIncidentRelatedList==="function"){window.parent.loadIncidentRelatedList(window.parent.recordId)}else{if(typeof window.parent.loadChangeRelatedList==="function"){window.parent.loadChangeRelatedList(window.parent.recordId)}else{if(typeof window.parent.loadProblemRelatedList==="function"){window.parent.loadProblemRelatedList(window.parent.recordId)}else{if(typeof window.parent.loadReleaseRelatedList==="function"){window.parent.loadReleaseRelatedList(window.parent.recordId)}else{if(typeof window.parent.loadBroadcastRelatedList==="function"){window.parent.loadBroadcastRelatedList(window.parent.recordId)}}}}}}else{isLightningExperience=isLightningTheme();if(isLightningExperience){var win=openRFTab("/one/one.app#/alohaRedirect/apex/"+CurrentNamespacePrefix+"RemedyforceConsole?record_id="+recordId+"&objectName="+objectName)}else{var win=openRFTab("/apex/"+CurrentNamespacePrefix+"RemedyforceConsole?record_id="+recordId+"&objectName="+objectName)}window.history.back()}}}}}}function openRFTab(a){if(isLightningExperience!=undefined&&isLightningExperience){window.open("/one/one.app#/alohaRedirect"+a)}else{window.open(a)}}function isLightningTheme(){var a;var b=document.cookie.split(";");for(a=0;a<b.length;a++){if(b[a].indexOf("apex__rfInLightning=true")>=0){return true}}return false};