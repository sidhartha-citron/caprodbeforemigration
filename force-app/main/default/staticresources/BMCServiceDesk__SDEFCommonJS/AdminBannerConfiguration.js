function showErrorMsg(){if(errormsg!=null&&errormsg!=""){Ext.MessageBox.show({title:messageTitle,msg:errormsg,width:300,buttons:Ext.MessageBox.OK})}}var SaveBtnHandler=function(a,b){waitbox(0);if(disableSS2Settings=="true"){if(MessageScrollIntervalField.getValue()<2){document.getElementById(broadcastIntervalValue).value=2;MessageScrollIntervalField.setValue(2)}else{document.getElementById(broadcastIntervalValue).value=MessageScrollIntervalField.getValue()}document.getElementById(showMsgorTextUIValue).value=showMsgorTextUI}save()};var ResetBtnHandler=function(a,b){reset()};function createSlider(a){if(a.length==0){a=0}broadcastSpeedsavevar=a;broadcastSpeedsavevar=2*broadcastSpeedsavevar;mySlider=new Ext.Slider({id:"silderid",renderTo:"basic-slider",width:189,cls:"clsSlider",value:parseInt(a),increment:1,minValue:1,maxValue:10,disabled:showMsgorTextUI&&(disableSS2Settings=="true"?true:false),plugins:new Ext.ux.SliderTip(),listeners:{change:setBroadcastSpeed}})}function setBroadcastSpeed(){if(document.getElementById("silderid")!=null&&typeof(document.getElementById("silderid"))!="undefined"&&document.getElementById("silderid").value==""){document.getElementById("silderid").value=0}if(document.getElementById("silderid")!=null&&typeof(document.getElementById("silderid"))!="undefined"){document.getElementById(broadcastSpeedValue).value=Ext.getCmp("silderid").getValue()}broadcastSpeedsavevar=document.getElementById(broadcastSpeedValue).value;broadcastSpeedsavevar=2*broadcastSpeedsavevar}function setScrollType(){if(document.getElementsByClassName("MsgScrollCls")[0].checked){showMsgorTextUI=document.getElementsByClassName("MsgScrollCls")[0].value}else{if(document.getElementsByClassName("TextScrollCls")[0].checked){showMsgorTextUI=document.getElementsByClassName("TextScrollCls")[0].value}}var a=showMsgorTextUI=="true"?true:false;MessageScrollIntervalField.setDisabled(!a);mySlider.setDisabled(a)}function enableAllowUserFunction(){var a=document.getElementById(shwprofile);if(a!=undefined&&!a.checked&&document.getElementById(shwBroadcast)){document.getElementById(shwBroadcast).checked=false;document.getElementById(shwBroadcast).disabled=true}else{if(document.getElementById(shwBroadcast)&&disableSS2Settings=="false"){document.getElementById(shwBroadcast).disabled=false}}}var SamplePanel=Ext.extend(Ext.Panel,{renderTo:"btnToolbar",defaults:{bodyStyle:"border:0px;padding:0px;margin:0px;zoom:0px;"}});new SamplePanel({title:"",cls:"toolSpCls",bodyStyle:"border:0px;padding:0px;margin:0px;zoom:0px;",tbar:[{scale:"medium",iconCls:"bmcSave",tooltipType:"title",tooltip:saveLabel,id:"saveId",listeners:{mouseover:function(){this.setIconClass("bmcSaveOn")},mouseout:function(){this.setIconClass("bmcSave")}},handler:SaveBtnHandler}," ","-"," ",{scale:"medium",iconCls:"bmcRefresh",tooltipType:"title",tooltip:undoDefaultSettingPageLabel,id:"undoId",listeners:{mouseover:function(){this.setIconClass("bmcRefresh")},mouseout:function(){this.setIconClass("bmcRefresh")}},handler:ResetBtnHandler}]});if(disableSS2Settings=="true"){Ext.QuickTips.init();createSpinner()}function createSpinner(){MessageScrollIntervalField=new Ext.ux.form.SpinnerField({id:"MessageScrollIntervalId",xtype:"spinnerfield",name:"MessageScrollIntervalId",minValue:2,maxValue:99,maxLength:2,autoCreate:{tag:"input",type:"text",autocomplete:"off",maxlength:"2"},value:bannerInterval,cls:"spinnerFieldClass",allowDecimals:false,incrementValue:1,width:55,disabled:!showMsgorTextUI,enableKeyEvents:false,renderTo:"MessageScrollIntervalTD",listeners:{keydown:function(b,a){if(a.getKey()==109){a.stopEvent()}},keyup:function(b,a){validateSpinnerField(b,a)}}})}Ext.onReady(function(){enableAllowUserFunction();defaultbroadcastSpeedValue=document.getElementById(broadcastSpeedValue).value;Ext.override(Ext.Slider,{getRatio:function(){var a=this.innerEl.getComputedWidth();var b=this.maxValue-this.minValue;return b==0?a:(a/b)}});createSlider(defaultbroadcastSpeedValue)});