Ext.onReady(function(){var c=function(e,f){reset()};var b=Ext.extend(Ext.Panel,{renderTo:"btnToolbar",defaults:{bodyStyle:"border:0px;padding:0px;margin:0px 0px 0px 2px;zoom:0px;"}});var b=Ext.extend(Ext.Panel,{renderTo:"btnToolbar",defaults:{bodyStyle:"border:0px;padding:0px;margin:0px 0px 0px 2px;zoom:0px;"}});var d=function(e,f){save();waitbox(0)};enableUrl();new b({title:"",cls:"toolSpCls",bodyStyle:"border:0px;padding:0px;margin:0px;zoom:0px;",tbar:[{scale:"medium",iconCls:"bmcSave",tooltipType:"title",tooltip:saveLabel,id:"saveId",listeners:{mouseover:function(){this.setIconClass("bmcSaveOn")},mouseout:function(){this.setIconClass("bmcSave")}},handler:d}," ","-"," ",{scale:"medium",iconCls:"bmcRefresh",tooltipType:"title",tooltip:undoDefaultSettingPageLabel,id:"undoId",listeners:{mouseover:function(){this.setIconClass("bmcRefresh")},mouseout:function(){this.setIconClass("bmcRefresh")}},handler:c}]});var a;a=new Ext.Button({id:"OptimizeBtn",name:"OptimizeBtn",text:OptimizeLabel,renderTo:"OptimizeButtonTD",autoWidth:true,handler:function(){this.setDisabled(true);if(progSecElm){progSecElm.style="display:block; visibility:visible;"}if(failDivElm){failDivElm.style="display:none;visibility:hidden"}optimize();intervalVar=setInterval(function(){pollingFunction()},5000)}});if(batchStatusVal&&(batchStatusVal=="Processing")){Ext.getCmp("OptimizeBtn").setDisabled(true);if(progSecElm){progSecElm.style="display:block; visibility:visible;"}if(failDivElm){failDivElm.style="display:none;visibility:hidden"}intervalVar=setInterval(function(){pollingFunction()},5000)}});function resetPolling(){if(batchStatusVal&&(batchStatusVal=="Completed"||batchStatusVal=="stopped")){clearInterval(intervalVar);if(progSecElm){progSecElm.style="display:none; visibility:hidden;"}if(isSuccessVal&&isSuccessVal==true){if(successDivElm){successDivElm.style="display:block;visibility:visible;"}}else{if(failDivElm){failDivElm.style="display:block;visibility:visible;"}if(logURLElm){logURLElm.href=logURL}if(countDivElm){countDivElm.innerText=failStat}Ext.getCmp("OptimizeBtn").setDisabled(false)}}};