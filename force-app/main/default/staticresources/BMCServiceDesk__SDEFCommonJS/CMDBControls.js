Ext.namespace("CMDB.Controls");CMDB.Controls.Label=function(a){CMDB.Controls.Label.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.Label",{extend:"Ext.form.Label"});CMDB.Controls.TextField=function(a){CMDB.Controls.TextField.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.TextField",{extend:"Ext.form.TextField"});CMDB.Controls.Field=function(a){CMDB.Controls.Field.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.Field",{extend:"Ext.form.Field"});CMDB.Controls.TextArea=function(a){CMDB.Controls.TextArea.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.TextArea",{extend:"Ext.form.TextArea"});CMDB.Controls.DateTimeField=function(a){CMDB.Controls.DateTimeField.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.DateTimeField",{extend:"Ext.form.DateField",format:"m/d/Y h:i A"});CMDB.Controls.DropDownField=function(a){CMDB.Controls.DropDownField.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.DropDownField",{extend:"Ext.form.ComboBox"});CMDB.Controls.Checkbox=function(a){CMDB.Controls.Checkbox.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.Checkbox",{extend:"Ext.form.Checkbox"});CMDB.Controls.Panel=function(a){CMDB.Controls.Panel.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.Panel",{extend:"Ext.Panel"});CMDB.Controls.Button=function(a){CMDB.Controls.Button.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.Button",{extend:"Ext.Button"});CMDB.Controls.FormPanel=function(a){CMDB.Controls.FormPanel.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.FormPanel",{extend:"Ext.form.FormPanel"});CMDB.Controls.TabPanel=function(a){CMDB.Controls.TabPanel.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.TabPanel",{extend:"Ext.TabPanel"});CMDB.Controls.DatePicker=function(a){CMDB.Controls.DatePicker.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.DatePicker",{extend:"Ext.DatePicker"});CMDB.Controls.GridPanel=function(a){CMDB.Controls.GridPanel.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.GridPanel",{extend:"Ext.grid.Panel",onNormalViewScroll:function(){var c=this,a=c.normalGrid.getView(),e=a.el.dom,b=c.lockedGrid.getView(),d=b.el.dom;d.scrollTop=e.scrollTop;delete b.scrolledByNormal},onLockedViewScroll:function(){var b=this,a=b.lockedGrid.getView();if(!a.scrolledByNormal){a.scrolledByNormal=true;return false}}});CMDB.Controls.IFramePanel=function(a){CMDB.Controls.IFramePanel.superclass.constructor.call(this,a);var b=new Date();this.FrameElementID="framepanel_src"+b.getFullYear()+b.getMonth()+b.getDate()+b.getHours()+b.getMinutes()+b.getSeconds()+b.getTime();this.setSource=function(c){var d=document.getElementById(this.FrameElementID);if(typeof(d)=="undefined"||d==null){this.html='<iframe scrolling="no" src="'+c+'" frameborder="0" width="100%" height="100%"></iframe>'}else{d.src=c}}};Ext.define("CMDB.Controls.IFramePanel",{extend:"Ext.panel.Panel",setSource:function(a){var b=document.getElementById(this.FrameElementID);if(typeof(b)=="undefined"||b==null){this.html='<iframe scrolling="no" src="'+a+'" frameborder="0" width="100%" height="100%"></iframe>'}else{b.src=a}}});CMDB.Controls.AccordionPanel=function(a){a.split=true;a.cls="AccordionPanel";a.layout="accordion";a.border=false;CMDB.Controls.DatePicker.superclass.constructor.call(this,a)};Ext.define("CMDB.Controls.AccordionPanel",{extend:"Ext.Panel"});(function(){var a=Ext.Button.prototype.initButtonEl;Ext.override(Ext.Button,{initButtonEl:function(b,c){c.dom.id="BTN_CDM_"+this.id;a.apply(this,arguments)}})})();var instanceFramePanel,relEditorPanel,getRelationListStoreRef;