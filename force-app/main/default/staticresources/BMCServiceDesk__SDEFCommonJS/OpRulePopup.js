var root;var tree;var OpRuleTreePopUpWindow;var height=490;var width=700;var forAcAction;var selectedNode;var CancleButton;var OkButton;var tabOutImg;var isPopupFromAcAction,selectedDevice;var closePopUpWindow=function(a,b){OpRuleTreePopUpWindow.close()};function initParentPageDetails(){var b=String(window.parent.parent);if(typeof(b)!="undefined"&&b!=""){b=window.parent.parent.location.pathname;var a=b.indexOf("apex/AcActions");if(a!=-1){isPopupFromAcAction=true}}}function handleOpRulesFromAcAction(b,a,c){selectedDevice=window.parent.parent.cntxAssemblyId;if(selectedDevice!=null&&selectedDevice!=""&&selectedDevice.indexOf("AC:CS:-")==0){window.parent.startWaitMask();applyAction(b,a,c,selectedDevice)}else{window.parent.msgStr=window.parent.AcInvalidDeviceMsg;window.parent.ShowMessageBox()}}function hideWaitMsg(){if(typeof(waitMsg)!="undefined"&&waitMsg!=null&&waitMsg!=""){waitMsg.hide()}}function waitbox(a){if(parseInt(a)>0){setTimeout("waitMsg.hide()",a)}waitMsg=new Ext.Window({height:100,width:200,resizable:false,closable:false,header:false,frame:false,modal:true,shadow:false,items:[{xtype:"panel",height:100,width:200,bodyStyle:"background-color:transparent;border:none;",html:'<div align="center"><img src="'+tabOutImg+'"/></div>'}]});waitMsg.show()}function openOpRuleLookup(){root=new Ext.tree.AsyncTreeNode({expanded:true,id:"0",loader:new Ext.tree.TreeLoader({url:page_CMDBJsonGenerator+"?type=getAssetCoreOpRules",requestMethod:"GET"}),listeners:{load:function(c){if(c.hasChildNodes()==true){for(var a=0;a<c.childNodes.length;a++){if(c.childNodes[a].attributes.error==true){var b=c.childNodes[a].attributes.text;c.childNodes[a].remove(true);Ext.MessageBox.show({msg:b,buttons:Ext.MessageBox.OK,fn:closePopUpWindow,title:errTitle})}}}}}});tree=new Ext.tree.TreePanel({id:"OpRuleTree",root:root,useArrows:true,autoScroll:true,animate:true,containerScroll:true,border:false,rootVisible:false,height:height-80,listeners:{beforeload:function(){if(isPopupFromAcAction){var a=window.parent.location.pathname;var b=a.indexOf("apex/ACDeviceSummaryPage");if(b==-1){this.setSize("auto",window.parent.AdvActionPanel.getHeight()-73)}else{this.setSize("auto",window.parent.ORPanelHeight-100)}}},afterrender:function(a){},dblclick:function(c,b){if(c.leaf){if(forAcAction==null||forAcAction==""||forAcAction!="true"){OpRuleTreePopUpWindow.close();window.SelectedOpRuleNode=c;selectedNode=c;preSetReferenceToText(c.attributes.id)}else{selectedNode=c;var a=selectedNode.attributes.text;if(selectedNode.attributes.notes!=null&&selectedNode.attributes.notes!=""){a+=":"+selectedNode.attributes.notes}if(isPopupFromAcAction){handleOpRulesFromAcAction(selectedNode.attributes.id,selectedNode.attributes.approval,a)}else{waitbox(0);applyAction(selectedNode.attributes.id,selectedNode.attributes.approval,a)}}}},click:function(a){if(a.leaf){if(forAcAction==null||forAcAction==""||forAcAction!="true"){window.SelectedOpRuleNode=a;selectedNode=a}else{selectedNode=a}}else{selectedNode=null}}}});OkButton=new Ext.Button({id:"OkBtn",text:okBtnLabel,xtype:"tbbutton",cls:"windowBtnCls",handler:function(){if(selectedNode!=null&&selectedNode!="undefined"){if(forAcAction==null||forAcAction==""||forAcAction!="true"){if(!isPopupFromAcAction){OpRuleTreePopUpWindow.close();preSetReferenceToText(selectedNode.attributes.id)}}else{if(selectedNode!=null&&typeof(selectedNode)!="undefined"){var a=selectedNode.attributes.text;if(selectedNode.attributes.notes!=null&&selectedNode.attributes.notes!=""){a+=":"+selectedNode.attributes.notes}if(isPopupFromAcAction){handleOpRulesFromAcAction(selectedNode.attributes.id,selectedNode.attributes.approval,a)}else{waitbox(0);applyAction(selectedNode.attributes.id,selectedNode.attributes.approval,a);this.disabled=true}}}}else{if(isPopupFromAcAction){window.parent.msgStr=selectORError;window.parent.ShowMessageBox()}else{Ext.MessageBox.show({msg:selectORError,buttons:Ext.MessageBox.OK})}}}});CancleButton=new Ext.Button({id:"CancleBtn",text:cancelBtnLabel,xtype:"tbbutton",cls:"windowBtnCls",handler:function(){if(isPopupFromAcAction){window.parent.AdvActionPanel.collapse()}else{if(forAcAction==null||forAcAction==""||forAcAction!="true"){OpRuleTreePopUpWindow.close()}else{window.close()}}}})}function showORWindow(){openOpRuleLookup();OpRuleTreePopUpWindow=new Ext.Window({title:label_SelectOpRule,height:height,width:width,x:10,y:5,modal:true,resizable:true,constrain:true,viewConfig:{forceFit:true},items:tree,buttonAlign:"right",cls:"TextEditorWindowCls",buttons:[OkButton,CancleButton]});OpRuleTreePopUpWindow.show();tree.getRootNode().expand();return false}function stopWaitMask(){window.parent.stopWaitMask()}function resizetree(){var a=window.parent.parent.Ext.getBody().getViewSize().height;tree.setSize("auto",a-135)}if(window.parent.parent.setTreePanelHeight!=undefined){window.parent.parent.setTreePanelHeight(resizetree)};