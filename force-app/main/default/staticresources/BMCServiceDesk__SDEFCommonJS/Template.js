var selectedField;function createChatterHelp(){var b=[["{!chatter_link}",chatterLinkLabel],["{!chatter_body}",chatterBodyLabel],["{!chatter_createdby}",chatterAuthorLabel]];var c=new Ext.data.ArrayStore({data:b,fields:["chatterField","description"]});c.loadData(b);var a=new Ext.grid.ColumnModel([{header:chatterLbl,dataIndex:"chatterField",width:120},{header:descriptionLbl,dataIndex:"description",width:460}]);var e=new Ext.grid.EditorGridPanel({store:c,cls:"gridPanel",id:"helpPanelCollapsible",colModel:a,width:465,height:120,collapseFirst:true,stripeRows:true,enableHdMenu:false,sm:new Ext.grid.RowSelectionModel(),copy:"true",frame:false});enableTextSelection(e);var f=new Ext.form.Label({id:"ChatterHelpLabel",text:labelForChatterHelpDescription});var d=new Ext.Panel({title:chatterHelpLabelText,id:"chatterHelpMainPanel",width:600,height:400,collapsed:true,items:[f,e],collapsible:true,renderTo:"chatterHelpCollapsiblediv",cls:"chatterHelpGrid",copy:"true",listeners:{beforeexpand:function(){var g=document.getElementById("chatterHelpCollapsiblediv");g.style.cssText="height: 160px; *height : 165px;";this.doLayout()},expand:function(){enableTextSelection(e)},collapse:function(){var g=document.getElementById("chatterHelpCollapsiblediv");g.style.cssText="height: 10px; *height : 10px;"}}})}function enableTextSelection(a){if(Ext.isIE){var b=Ext.DomQuery.select("div[unselectable=on]",a.dom);for(i=0;i<b.length;i++){b[i].unselectable="off"}}}function showChatterHelpSectionDiv(){document.getElementById("chatterHelpCollapsiblediv").style.display="block";var a=Ext.getCmp("chatterHelpMainPanel");a.show();a.doLayout();Ext.getCmp("viewportId").doLayout()}function setMaxInputLength(a){if(a!=null&&a!=""&&a!="undefined"){selectedField=a.value}}function LimitText(a){if(a!=null&&TemplateForValue=="Request Detail"&&selectedField=="Quantity__c"&&a.value.length>3){a.value=a.value.substring(0,3)}}function loadSRDUIonPageInit(){var a=document.getElementById("panelDivId");var b=document.getElementById("templateForTDId");if(a){a.style.display="none"}if(b){b.style.width="96%";b.style.paddingRight="3px"}};