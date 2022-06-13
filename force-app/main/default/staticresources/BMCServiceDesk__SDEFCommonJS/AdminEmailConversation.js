
Ext.onReady(function() {

	dsprofilesList = new Ext.data.ArrayStore({
	data: profilesList,
	fields: ['ProfileId','profileLabel'],
	sortInfo: {
		field: 'profileLabel',
		direction: 'ASC'
	}
});

dsselectedProfilesList = new Ext.data.ArrayStore({
	data: selectedProfilesList,
	fields: ['ProfileId','profileLabel'],
	sortInfo: {
		field: 'profileLabel',
		direction: 'ASC'
	}
});

/*
 * Ext.ux.form.ItemSelector Example Code
*/
var lblAvailableProfiles = new Ext.form.Label({
	id:'lblAvailableProfilesId',
	text:AvailableProfile

});

var lblSelectedProfiles = new Ext.form.Label({
	id:'lblSelectedProfilesId',
	text: SelectedProfile
});

var assignEmailLabelPanel = new Ext.Panel({
	id: 'assignEmailLabelPanelId',
	border:false,
	layout:'table',
	items:[lblAvailableProfiles, lblSelectedProfiles]
});


var RadioButtonPanel = new Ext.Panel({
	id: 'radiobtnPanelId',
	border:false,
	layout:'column',
	items:[{
		columns: 1,
		style: 'width: 770px;height:75px',
		border:false,
		id:'radiob',
		items:[{
			id:'radioone',
			xtype:'radio',
			boxLabel: ByAllProfiles,
			name: 'rbauto', 
			inputValue: 1,
			style:'vertical-align:middle;',
			checked:isSetToAllProfiles,
			handler: function(item,checked)
				{
					isDataChanged=true;
					if(checked){
						isSetToAllProfiles=true;
						Ext.getCmp('defaultchbx').setDisabled(false); 
						Ext.getCmp('selectedProfileCmpId').setDisabled(true); 
						Ext.getCmp('profileCmpId').setDisabled(true); 
						document.getElementById('iconRightId').src = imgDisableRight;
						document.getElementById('iconLeftId').src = imgLeftArrow;
					}else{
						isSetToAllProfiles=false;	
											
					}
				
				}
			},
			{
				id:'defaultchbx',
				xtype:'checkbox',
				style:'margin-left:15px;vertical-align:middle;',
				disabled:true,
				checked:isSetEmailAsDefault,
				boxLabel: SetAsDefault,
				handler: function() {
					isDataChanged=true;
					isSetEmailAsDefault = this.getValue();
				}
			},
			{ 
				id:'radiotwo',
				xtype:'radio',
				style:'vertical-align:middle;',
				boxLabel: BySelectedProfiles,
				name: 'rbauto', 
				height:30,
				inputValue: 2,
				listeners:{
					focus: function(radio, evtObj, eOpts){
						isDataChanged=true;
						Ext.getCmp('selectedProfileCmpId').setDisabled(false);
						Ext.getDom('defaultchbx').checked=false;							
						Ext.getCmp('defaultchbx').setDisabled(true);											
						Ext.getCmp('profileCmpId').setDisabled(false); 			
						document.getElementById('iconRightId').src = imgRightArrow;
						document.getElementById('iconLeftId').src = imgDownArrowLeftNew;									
					}
				} 
			}
		
		
		],
	}]
});   






var EmailAssignToProfile = new Ext.Panel({
	id: 'EmailAssignToProfileId',
	title: '',
	width:600,
	height:270,
	bodyStyle: 'padding:5px;',
	border:false,
	layout:'column',
	style:'margin-top:5px;',
	items:[{
		xtype: 'itemselector',
		fieldLabel: '',
		imagePath: path1,
		iconLeft:'b_darrow_L_disable_custom.gif',
		iconRight:'b_darrow_R_disable_custom.gif',
		drawUpIcon:false,
		drawDownIcon:false,
		drawLeftIcon:true,
		drawRightIcon:true,
		drawTopIcon:false,
		drawBotIcon:false,
		multiselects: [{
			id :'profileCmpId',
			width: 200,
			legend:false,
			disabled : true,
			height: 250,
			store: dsprofilesList ,
			displayField: 'profileLabel',
			valueField: 'ProfileId',
			listeners: {
			click:function(c){
					isDataChanged=true;
					document.getElementById('iconRightId').src = imgRightArrow;
					document.getElementById('iconLeftId').src = imgDownArrowLeftNew;
				}
			
			}
			
		},{
			width: 200,
			height: 250,
			id :'selectedProfileCmpId',
			store: dsselectedProfilesList,
			legend:false,
			disabled : true,
			displayField: 'profileLabel',
			valueField: 'ProfileId',
			listeners: {
				click:function(c){
					isDataChanged=true;
					document.getElementById('iconRightId').src = imgRightArrow;
					document.getElementById('iconLeftId').src = imgDownArrowLeftNew;
				}
			}
			
		}]
	}]

	
});

var formPanel = new Ext.Panel({
   border:false,
   style:'padding-top:10px;',
   layout:'auto',
   items:[RadioButtonPanel,assignEmailLabelPanel,EmailAssignToProfile]
});


	var emailConversationlabel = new Ext.form.Label({
		id:'emailConversationlabel',
		text:AdminEmailAvailableProfiles 
	});
	emailConversationlabelPanel = new Ext.Panel({
		id:'emailConversationlabelPanelID',
		border:false	        
	});
	parent.addHelpComponent(emailConversationlabelPanel,'email_conversation_settings.htm',wikiUrl);
	emailConversationlabelPanel.add([emailConversationlabel]);
	
	var OrgWideEmailDesc = new Ext.form.Label({
		id:'OrgWideEmailDesc',
		text:EmailFromAddress,
		style:'font:9pt arial;margin-top:10px;'
	});
	 
	eval(OrgWideEmailString);
	 
	var OrgWideEmailStore = new Ext.data.ArrayStore({
		id:'OrgWideEmailStore',
		fields:[
			{name:'Id'},
			{name:'displayNameEmailAdd'}
		]
	});
	OrgWideEmailStore.loadData(OrgWideEmailData);
		
	OrgWideEmailStore.sort('displayNameEmailAdd');
	var oldVal;
	var NewVal;
	var EmailAddressCombo = new Ext.form.ComboBox({
		id:'orgemailAddress',
		fieldLabel: 'displayNameEmailAdd',
		hiddenName:'OrgWideEmail',
		store: OrgWideEmailStore,
		
		valueField:'Id',
		tooltipType : 'title',
		tpl: '<tpl for="."><div class="x-combo-list-item" ext:qtip="{displayNameEmailAdd:htmlEncode}">{displayNameEmailAdd:htmlEncode}</div></tpl>',
		displayField:'displayNameEmailAdd',
		typeAhead: false,
		mode: 'local',
		width:350,
		editable:false,
		value : existingOrgWideId,
		triggerAction: 'all',
		forceSelection:true,
		selectOnFocus:true,
		listeners : {
		
			beforeselect : function(combo, record, index){
			
				oldVal=combo.getValue();
			}
		}
			
		});
		EmailAddressCombo.on('select', function(){
		var selectedAddress = EmailAddressCombo.getValue();
		if(isDataChanged==true && oldVal!='-1')
		{
			Ext.Msg.show({
			title:emailConversationText , 
			msg: DataNotSavedMsg,
			buttons: Ext.Msg.YESNO,
			icon: Ext.MessageBox.WARNING,
			fn: function(btn){
				isDataChanged=false;
				if (btn == 'yes'){
		setDataSourceName(selectedAddress);
				}else
				{
					EmailAddressCombo.setValue(oldVal);
					isDataChanged=true;
				}
				return false;
			}
		});
		}else
		{
			setDataSourceName(selectedAddress);
		}
		});
		
	var OrgWideEmailPanel = new Ext.Panel({
		id:'OrgWideEmailPanel',
		border:false,
		width:600,
		layout:'table',
		layoutConfig:{ columns: 2},     
		items:[OrgWideEmailDesc,EmailAddressCombo]
	});
	
	var emailConversationLabel = new Ext.form.Label({
	id:'emailConversationLabelId',
	style:'color: #004376;font-family: arial !important;font-size: 10pt;font-weight: bold;margin-top:25px;',
	margin:'25 0 0 0',
	text:emailConversationText
	});
	
	var checkboxPanel = new Ext.Panel({
		id: 'checkboxPanel',
		border:false,
		style: 'margin-top:15px;',
		items:[{
			xtype:'checkbox',
		 id:'enableEmailToFieldChk',
		 cls:'checkboxClass' ,
			bodyStyle:'margin-top:10px;',
			padding:'10 10 0 0',
		 boxLabel: enableEmailToFieldLabel,
		 checked:  enableEmailToField,
		 style: 'width:13px;',
		 handler: function() {
			enableEmailToField = this.getValue();
		 }
		},{
			xtype:'checkbox',
		 id:'enableEmailBccFieldChk',
		 cls:'checkboxClass' ,
		 boxLabel: enableEmailBccFieldLabel,
		 checked:  enableEmailBccField,
		 style: 'width:13px;',
		 handler: function() {
			enableEmailBccField = this.getValue();
		 }
		},{
			xtype:'checkbox',
			 id:'enableConvEmailSignatureOnlyInActivityFeedFldChk',
			 cls:'checkboxClass' ,
			 boxLabel: enableEmailSignatureLabel + '&nbsp;&nbsp;' + '<img src="'+ resourcePath +'/SSDefaultTheme/SDEFicons/status-16-information.png" alt="' + enableEmailSignatureTooltipLabel + '" height="13" width="13" title="' + enableEmailSignatureTooltipLabel + '"></img>',
			 checked:  enableEmailSignatureField,
			 style: 'width:13px;',
			 handler: function() {
				 enableEmailSignatureField = this.getValue();
			 }
		},{
			xtype:'checkbox',
		 id:'enableEmailTemplatePreview',
		 cls:'checkboxClass',
		 boxLabel: enableEmailTemplatePreviewLabel,
		 checked:  enableEmailTemplatePreview,
		 style: 'width:13px;',
		 handler: function() {
			enableEmailTemplatePreview = this.getValue();
		 }
		},{
			xtype:'checkbox',
		 id:'enableEmailTemplateFieldChk',
		 cls:'checkboxClass',
		 boxLabel: enableEmailTemplateFieldLabel,
		 checked:  enableEmailTemplateField,
		 style: 'width:13px;',
		 handler: function() {
			enableEmailTemplateField = this.getValue();
		 },
	listeners: {
		 check: function(cb, checked) {
			 var enableEmailTemplatePreviewChk =document.getElementById('enableEmailTemplatePreview');
			if(enableEmailTemplatePreviewChk != null && enableEmailTemplatePreviewChk != 'undefined'){
				enableEmailTemplatePreviewChk.disabled = !checked;
			}
	 }
	 }
		},{
			xtype:'checkbox',
		 id:'enableEmailBodyForTemplateCheckBox',
		 cls:'checkboxClass',
		 boxLabel: enableEmailBodyForTemplateLabel,
		 checked:  enableEmailBodyForTemplate,
		 tooltip: EmailAdditionalInfoCheckboxTooltip,
		 style: 'width:13px;',
		 handler: function() {
			enableEmailBodyForTemplate = this.getValue();
		 }
		}		
	]
	});
	
	//Changes for email template folder - START
	var emailTemplateFolderDesc = new Ext.form.Label({
		id:'emailTemplateFolderDesc',
		text:selectEmailTemplateFolder,
		cls: 'emailTemplateFolderDescClass'
	});

	var parsedEmailTemplateFoldersData = JSON.parse(EmailTemplateFoldersListJson);

	var emailTemplateFolderStore = new Ext.data.JsonStore({
		id: 'emailTemplateFolderStore',
		data: parsedEmailTemplateFoldersData,
		fields: [
			{name:'Id'},
			{name:'Name'},
			{name:'attributes'}
		],
	});

	var emailTemplateFolderCombo = new Ext.form.ComboBox({
		id:'emailTemplateFolder',
		fieldLabel:'Name',
		hiddenName:'emailTemplateFolderId',
		store: emailTemplateFolderStore,
		valueField:'Id',
		tooltipType:'title',
		tpl: '<tpl for="."><div class="x-combo-list-item" ext:qtip="{Name}">{Name}</div></tpl>',
		displayField:'Name',
		typeAhead:false,
		mode:'local',
		width:350,
		editable: false,
		value:selectedEmailFolder,
		triggerAction: 'all',
		forceSelection:true,
		selectOnFocus:true
	});

	var emailTemplateFolderPanel = new Ext.Panel({
		id:'emailTemplateFolderPanel',
		border:false,
		width:600,
		layout:'table',
		layoutConfig:{ columns: 2},
		items:[emailTemplateFolderDesc,emailTemplateFolderCombo]
	});

	//Changes for email template folder - END
	
	////Changes for Email Record Link
	
	var EmailRecordLinkLabel = new Ext.form.Label({
		id:'EmailRecordLinkLabel',
		text:strEmailRecordLinkLabel,
		cls: 'emailTemplateFolderDescClass'
	});
	
	var parsedEmailRecordLinkListJson = JSON.parse(EmailRecordLinkListJson);
	
	var EmailRecordLinkStore = new Ext.data.JsonStore({
		id: 'EmailRecordLink',
		data: parsedEmailRecordLinkListJson,
		fields: [
			{name:'Id'},
			{name:'Name'},
			{name:'attributes'}
		],
	});
	
	var EmailRecordLinkComboBox = new Ext.form.ComboBox({
		id:'EmailRecordLinkComboBox',
		fieldLabel:'Name',
		hiddenName:'EmailRecordLinkComboBoxId',
		store: EmailRecordLinkStore,
		valueField:'Id',
		tooltipType:'title',
		tpl: '<tpl for="."><div class="x-combo-list-item" ext:qtip="{Name}">{Name}</div></tpl>',
		displayField:'Name',
		typeAhead:false,
		mode:'local',
		width:350,
		editable: false,
		value:selectedEmailRecordLinkFor,
		triggerAction: 'all',
		forceSelection:true,
		selectOnFocus:true
	});
	
	var EmailRecordLinkPanel = new Ext.Panel({
		id:'EmailRecordLinkPanel',
		border:false,
		style: 'margin-top:10px;',
		width:600,
		layout:'table',
		layoutConfig:{ columns: 2},
		items:[EmailRecordLinkLabel,EmailRecordLinkComboBox]
	});

	var emailAttachmentFilteringHeaderLabel = new Ext.form.Label({
		id:'emailAttachmentFilteringHeaderLabel',
		style:'color: #004376;font-family: arial !important;font-size: 10pt;font-weight: bold;margin-top:25px;',
		margin:'25 0 0 0',
		html:SignatureFilterRuleHeaderLabel 
	});
	emailAttachmentFilteringPanel = new Ext.Panel({
		id:'emailAttachmentFilteringPanelID',
		style:'margin-top: 25px;margin-bottom: 10px;',
		border:false	        
	});
	emailAttachmentFilteringPanel.add([emailAttachmentFilteringHeaderLabel]);

	var emailAttachmentFilteringLabel = new Ext.form.Label({
		id:'emailAttachmentFilteringLabel',
		text:SignatureFilterRuleLabel,
		cls: 'emailTemplateFolderDescClass'
	});
	
	var  SignatureImageFileCheckBox = new Ext.form.Checkbox({
		id:'SignatureImageFileCheckBoxId',
		cls:'checkboxClass' ,
		bodyStyle:'margin-top:10px;',
		padding:'10 10 0 0',
		boxLabel: String.format(SignatureFileSizeCheckBoxLabel,emailAttachmentTypesToIgnore) + '&nbsp;&nbsp;',
		checked:  isEmailAttachmentSizeToIgnore,
		style: 'width:13px;',
		labelStyle: 'padding-top:4px;',
		handler: function() {
			isEmailAttachmentSizeToIgnore = this.getValue();
		}
   });

   var  SignatureFileNameCheckBox = new Ext.form.Checkbox({
		id:'SignatureFileNameCheckBoxId',
		 cls:'checkboxClass' ,
		bodyStyle:'margin-top:10px;',
		padding:'10 10 0 0',
		boxLabel: SignatureFileNameCheckBoxLabel + '&nbsp;&nbsp',
		checked:  isEmailAttachmentNamesToIgnore,
		style: 'width:13px;',
		labelStyle: 'padding-top:4px;',
		handler: function() {
			isEmailAttachmentNamesToIgnore = this.getValue();
		}
	});

	var SignatureImageFileTextBox= new Ext.form.NumberField({
		name: "SignatureImageFileTextBoxId",
		cls: 'clsInputTextBox',
		allowNegative : false,
		height:22,
		width:30,
		minValue: 0,
		style:'margin-bottom:5px;',
		id:'SignatureImageFileTextBoxId',
		value:emailAttachmentSizeToIgnore,
		listeners:{
			change:function(obj, newValue, oldValue, eOpts){
				if(newValue < 0 || newValue == null || newValue == ''){
					obj.setValue(0);
				}
			}
		}	
	});
	
	var SignatureFileNameTextBox= new Ext.form.TextArea({
		cls: 'clsInputTextBox',
		height:30,
		width:350,
		emptyText:emailAttachmentIgnoreFileNamesPlaceholder,
		emptyClass: 'empty-attachment-file-name-placeholder',
		value:emailAttachmentNamesToIgnore,
		id:'SignatureFileNameTextBoxId',
		style:'margin-top:8px;',
		listeners:{
			afterrender:function(){
				 var textBoxElement = document.getElementById('SignatureFileNameTextBoxId');
				 if(textBoxElement) {
					textBoxElement.title = SignatureFilterRuletooltipLabel;
				 }
			}          
	   }
	});

	var SignatureImageFileKBLabel = new Ext.form.Label({
		id:'SignatureImageFileKBLabel',
		text:SignatureImageFileSizeKBLabel,
		cls: 'x-form-cb-label',
		style: 'padding-left:2px;'
	});

	var SignatureFileNamePanel = new Ext.Panel({
		id:'SignatureFileNamePanel',
		border:false,
		style: 'margin-top:5px;',
		layout:'table',
		layoutConfig:{ columns: 2},
		items:[SignatureFileNameCheckBox,SignatureFileNameTextBox]   
	});

	var SignatureImageFilePanel = new Ext.Panel({
		id:'SignatureImageFilePanel',
		border:false,
		style: 'margin-top:10px;',
		layout:'table',
		layoutConfig:{ columns: 4},
		items:[SignatureImageFileCheckBox,SignatureImageFileTextBox,SignatureImageFileKBLabel]
	});
	
	var emailSubjectLabel = new Ext.form.Label({
		id:'emailSubjectLabelId',
		style:'color: #004376;font-family: arial !important;font-size: 10pt;font-weight: bold;margin-top:25px;',
		margin:'25 0 0 0',
		text:emailSubLabel
	});
	
	emailSubjectlinePanel = new Ext.Panel({
		id:'emailSubjectlinePanelID',
		style:'margin-top: 25px;margin-bottom: 10px;',
		border:false	        
	});
	emailSubjectlinePanel.add([emailSubjectLabel]);
	
	var EmailSelectObjectLabel = new Ext.form.Label({
		id:'EmailSelectObjectLabel',
		text:selectObjectLabel,
		cls: 'emailTemplateFolderDescClass'
	});
	
	var EmailSelectObjectStore = new Ext.data.ArrayStore({
        id: 'EmailSelectObjectStore',
        fields:['name','label'],
        data: supportedobjectsForSubjectLine
    });
	
	var oldObjectVal;
	var EmailSelectObjectComboBox = new Ext.form.ComboBox({
		id:'EmailSelectObjectComboBox',
		store: EmailSelectObjectStore,
		fieldLabel:'label',
		hiddenName:'EmailSelectObjectComboBoxId',
		valueField:'name',
		tooltipType:'title',
		tpl: '<tpl for="."><div class="x-combo-list-item" ext:qtip="{label}">{label}</div></tpl>',
		displayField:'label',
		typeAhead:false,
		mode:'local',
		width:350,
		editable: false,
		value:'Incident__c',
		triggerAction: 'all',
		forceSelection:true,
		selectOnFocus:true,
		listeners: {
			beforeselect : function(combo, record, index){
			
				oldObjectVal=combo.getValue();
			}
        }
	});
	EmailSelectObjectComboBox.on('select', function(){
		var selectedObject = EmailSelectObjectComboBox.getValue();
		OnObjectChange(oldObjectVal,selectedObject);
	});
	var mergeFieldButton = new Ext.Button({
			id: 'mergeFieldButton',
			name: 'mergeFieldButton',
			iconCls: 'insertFieldImage',
			tooltipType : 'title',
			tooltip: insertLabel+' '+fieldLbl,
			border:false,
			handler: function() {
				showFieldCombo();
			}
        });

	var EmailSelectObjectPanel = new Ext.Panel({
		id:'EmailSelectObjectPanel',
		border:false,
		style: 'margin-top:10px;',
		width:600,
		layout:'table',
		layoutConfig:{ columns: 3},
		items:[EmailSelectObjectLabel,EmailSelectObjectComboBox,mergeFieldButton]
	});
	
	var EmailSelectFieldLabel = new Ext.form.Label({
		id:'EmailSelectFieldLabel',
		text:insertLabel+' '+fieldLbl,
		cls: 'emailTemplateFolderDescClass'
	});
	
	EmailSelectFieldStore = new Ext.data.ArrayStore({
        id: 'EmailSelectFieldStore',
        fields:['label','name','fieldType','relationshipName','refereceObjName'],
		data: fieldList,
		sortInfo: {
			field: 'label',
			direction: 'ASC'
		}
    });
	
	var EmailSelectFieldComboBox = new Ext.form.ComboBox({
		id:'EmailSelectFieldComboBox',
		fieldLabel:'label',
		hiddenName:'EmailSelectFieldComboBoxId',
		store: EmailSelectFieldStore,
		valueField:'name',
		tooltipType:'title',
		tpl: '<tpl for="."><div class="x-combo-list-item" ext:qtip="{label}">{label}</div></tpl>',
		displayField:'label',
		typeAhead:false,
		mode:'local',
		width:350,
		editable: false,
		value:'',
		triggerAction: 'all',
		forceSelection:true,
		selectOnFocus:true
	}); 
	EmailSelectFieldComboBox.on('select', function(){
		generateMergeField();
	});
	
	var EmailSelectFieldPanel = new Ext.Panel({
		id:'EmailSelectFieldPanel',
		border:false,
		style: 'margin-top:10px;',
		width:600,
		layout:'table',
		layoutConfig:{ columns: 2},
		hidden: true,
		items:[EmailSelectFieldLabel,EmailSelectFieldComboBox]
	});
	
	var EmailSubjectLabel = new Ext.form.Label({
		id:'EmailSubjectLabel',
		text:subjectLabel,
		cls: 'emailTemplateFolderDescClass'
	});
	
	var subjectTextBox= new Ext.form.TextArea({
		cls: 'clsInputTextBox',
		style:'width:546px;height:44px',
		value:Ext.util.Format.htmlDecode(subjectLineForSelectedModule),
		id:'subjectTextBox',
		enableKeyEvents:true,
		listeners:{
			 'keyup':function(txt,e){
					isDataChanged = true;
				}
			}
	});

	var EmailSubjectPanel = new Ext.Panel({
		id:'EmailSubjectPanel',
		border:false,
		style: 'margin-top:10px;',
		width:685,
		layout:'table',
		layoutConfig:{ columns: 2},
		items:[EmailSubjectLabel,subjectTextBox]
	});

	var EmailConversationPanel = new Ext.Panel({
		id: 'EmailConversationPanel',
		border:false,
		height:1100,
		tbar:[{
						scale: 'medium',
						iconCls: 'saveCls',
						id: 'save',
						tooltipType : 'title',
						tooltip: savelabel, 
						id:'saveBtn',
						handler:save
			}],
		autoWidth:true,
		 bodyStyle: ' margin-left: 15px;margin-top: 10px;',
		items:[emailConversationlabelPanel,OrgWideEmailPanel,formPanel,emailConversationLabel,checkboxPanel,checkboxPanel,
			emailTemplateFolderPanel,EmailRecordLinkPanel,emailAttachmentFilteringPanel,emailAttachmentFilteringLabel,SignatureFileNamePanel,SignatureImageFilePanel,emailSubjectlinePanel,EmailSelectObjectPanel,EmailSelectFieldPanel,EmailSubjectPanel],
		renderTo:'mainDiv'
	});

	var enableEmailTemplateChkBox = document.getElementById('enableEmailTemplateFieldChk');
	if(enableEmailTemplateChkBox != null && enableEmailTemplateChkBox != 'undefined'){
		var checkBoxVal = enableEmailTemplateChkBox.checked;
		var enableEmailTemplatePreviewChk = document.getElementById('enableEmailTemplatePreview');
			if(enableEmailTemplatePreviewChk != null && enableEmailTemplatePreviewChk != 'undefined'){
					enableEmailTemplatePreviewChk.disabled = !checkBoxVal;
			}
	}
	if(document.getElementById('EmailSelectObjectLabel') != null){
	document.getElementById('EmailSelectObjectLabel').parentNode.style.width = "100px";}
	if(document.getElementById('EmailSubjectLabel') != null){
	document.getElementById('EmailSubjectLabel').parentNode.style.width = "100px";}

})

function rerenderRadiobtn()
{
	if(isSetEmailAsDefault)
	{
		Ext.getDom('radioone').checked = true;
		Ext.getDom('defaultchbx').checked = true;
		Ext.getCmp('defaultchbx').setDisabled (false);
		Ext.getDom('radiotwo').checked = false;
		Ext.getCmp('selectedProfileCmpId').setDisabled(true); 
		Ext.getCmp('profileCmpId').setDisabled(true); 
	}else{
		if(isSetToAllProfiles || selectedProfilesList==null || selectedProfilesList==''){
			if(isSetToAllProfiles)
			{
			Ext.getDom('radioone').checked = true;
			}else
			{
				Ext.getDom('radioone').checked = false;
			}
			Ext.getCmp('defaultchbx').setDisabled(false);
			Ext.getDom('radiotwo').checked = false;
			Ext.getCmp('selectedProfileCmpId').setDisabled(true); 
			Ext.getCmp('profileCmpId').setDisabled(true); 
		}else{
			Ext.getCmp('radioone').setValue(false);
			Ext.getCmp('defaultchbx').setDisabled (true);
			Ext.getDom('radiotwo').checked = true;
			Ext.getCmp('selectedProfileCmpId').setDisabled(false); 
			Ext.getCmp('profileCmpId').setDisabled(false); 
		}
		Ext.getDom('defaultchbx').checked = false;
	}

}

/*------------------------------------------------------------
Save(): On click of save button this method executes and call's 
		SaveSettings() action function by passing parameters
------------------------------------------------------------*/
function save(){
	waitMsg.show();
	var selectedOrgWideEmailAddress= null, emailToFieldCheckBox= null, emailTemplateFieldCheckBox=null, selectedEmailTemplateFolder=null,selectedEmailRecordLink=null ;var errorFlag=0;
	selectedOrgWideEmailAddress = document.getElementById('OrgWideEmail').value;
	selectedEmailTemplateFolder = document.getElementById('emailTemplateFolderId').value;
	selectedEmailRecordLink = document.getElementById('EmailRecordLinkComboBoxId').value;
	var SignatureFileNameSetting= document.getElementById('SignatureFileNameTextBoxId').value;
	var SignatureImageFileSizeSetting= Ext.getCmp('SignatureImageFileTextBoxId').getValue();
	var SubjectLine = document.getElementById('subjectTextBox').value;
	
	selectedmailId=selectedOrgWideEmailAddress;
	isSetToAllProfiles=Ext.getDom('radioone').checked;
	isSetEmailAsDefault=Ext.getDom('defaultchbx').checked;
	var isSetToSelectedProfiles=Ext.getDom('radiotwo').checked;
	if(isSetToAllProfiles){
		isSetToAllProfiles='TRUE';
	}else{
		isSetToAllProfiles='FALSE';
	}
	if(isSetEmailAsDefault){
		setEmailAsDefault = 'TRUE';
	}else{
		setEmailAsDefault = 'FALSE';
	}
	  if(enableEmailToField){
		emailToFieldCheckBox = 'TRUE';
	} else {
		emailToFieldCheckBox = 'FALSE';        
	}

	if(enableEmailBccField){
		emailBccFieldCheckBox = 'TRUE';
	} else {
		emailBccFieldCheckBox = 'FALSE';        
	}
	if(enableEmailSignatureField){
		emailSignatureFieldCheckBox = 'TRUE';
	} else {
		emailSignatureFieldCheckBox = 'FALSE';
	}

	if(enableEmailTemplateField){
		emailTemplateFieldCheckBox = 'TRUE';
	} else {
		emailTemplateFieldCheckBox = 'FALSE';        
	}
	if(enableEmailBodyForTemplate){
		EmailBodyFieldCheckBox = 'TRUE';
	} else {
		EmailBodyFieldCheckBox = 'FALSE';        
	}


if(enableEmailTemplatePreview){
		enableEmailTemplatePreviewCheckBox = 'TRUE';
	} else {
		enableEmailTemplatePreviewCheckBox = 'FALSE';        
	}
	 var selctedProfiles = '';
	if (Ext.getCmp('selectedProfileCmpId')){
		var record = Ext.getCmp('selectedProfileCmpId').store;
		record.data.each(function(item, index, totalItems) { 
		selctedProfiles += item.get('ProfileId') + ',';
		});
	}else{
		for (var i=0; i<selectedProfilesList.length; i++){
			selctedProfiles += selectedProfilesList[i][0] + ',';
		}
	}
	if(selectedOrgWideEmailAddress=='-1'){
		errorFlag = 1;
		showMessage(emailRequiredMessage);
	}else if(!isSetToSelectedProfiles && isSetToAllProfiles=='FALSE') 
	{
		errorFlag = 1;
		showMessage(SelectOption);
	}else if (isSetToSelectedProfiles && (selctedProfiles=='' ||selctedProfiles==null))
	{
		errorFlag = 1;
		showMessage(profilesNotSelected);
	}else if(SignatureFileNameSetting && SignatureFileNameSetting.indexOf('*') >= 0)
	{
		errorFlag = 1;
		showMessage(emailAttachmentFileNameWildcardNotAllowed);
	}
	if(validateSubject() == 1){
		errorFlag = 1;
		showMessage(EmailSubjectValidation);
	}
   if(errorFlag==0)
   {
	isDataChanged=false;
	SaveSettings(selectedOrgWideEmailAddress,setEmailAsDefault,isSetToAllProfiles,emailToFieldCheckBox,
		emailBccFieldCheckBox,emailSignatureFieldCheckBox, emailTemplateFieldCheckBox,enableEmailBodyForTemplate,
		enableEmailTemplatePreview,selctedProfiles,selectedEmailTemplateFolder,selectedEmailRecordLink,
		isEmailAttachmentNamesToIgnore,SignatureFileNameSetting,isEmailAttachmentSizeToIgnore,SignatureImageFileSizeSetting,SubjectLine);
}
}

/*----------------------------------------------------------------------
showMessage(): Used to hide wait message and Show success or fail Message
	Param:
		msg: Message
-----------------------------------------------------------------------*/
function showMessage(msg){
	waitMsg.hide();
	Ext.MessageBox.show({
				   width: 250,
				   title: lblMsgTitle, 
				   msg: msg,
				   buttons: Ext.MessageBox.OK
			   });
}

function OnObjectChange(oldObjectVal,selectedObject) {
	var selectFieldCombo = Ext.getCmp('EmailSelectFieldComboBox');
	var selectObjectCombo = Ext.getCmp('EmailSelectObjectComboBox');
		if(isDataChanged==true){
				Ext.Msg.show({
			title:emailSubLabel, 
			msg: DataNotSavedMsg,
			buttons: Ext.Msg.YESNO,
			icon: Ext.MessageBox.WARNING,
			fn: function(btn){
				if (btn == 'yes'){
					isDataChanged = false;
					selectObjectCombo.setValue(selectedObject);
					if(selectFieldCombo && typeof(EmailSelectFieldComboBox)!='undefined'){EmailSelectFieldComboBox.value = ''};
					getFieldList(EmailSelectObjectComboBoxId.value);
					EmailSelectFieldStore.loadData(fieldList);
					subjectTextBox.value = Ext.util.Format.htmlDecode(subjectLineForSelectedModule);
				}else
				{
					selectObjectCombo.setValue(oldObjectVal);
					isDataChanged=true;
				}
				return false;
			}
		});
		}else{
			if(selectFieldCombo && typeof(EmailSelectFieldComboBox)!='undefined'){EmailSelectFieldComboBox.value = ''};
			var selectFieldPanel = Ext.getCmp('EmailSelectFieldPanel');
			if(selectFieldPanel.hidden == false){selectFieldPanel.hide();} 
			getFieldList(EmailSelectObjectComboBoxId.value);
			EmailSelectFieldStore.loadData(fieldList);
			subjectTextBox.value = Ext.util.Format.htmlDecode(subjectLineForSelectedModule);
		}
}

function generateMergeField(){
	isDataChanged=true;
	for (var i=0; i<EmailSelectFieldStore.data.length; i++)
	{
		if (EmailSelectFieldComboBoxId.value == EmailSelectFieldStore.getAt(i).get('name'))
		{
			if(EmailSelectFieldStore.getAt(i).get('fieldType') == 'DATE' || EmailSelectFieldStore.getAt(i).get('fieldType') == 'DATETIME'){
				subjectTextBox.value += ' {{FORMAT(' +EmailSelectFieldComboBoxId.value+ ')}} ';
			}else if(EmailSelectFieldStore.getAt(i).get('fieldType') == 'REFERENCE'){
					if(EmailSelectFieldStore.getAt(i).get('refereceObjName') == 'Case'){
					subjectTextBox.value +=  ' {{' +EmailSelectFieldStore.getAt(i).get('relationshipName')+ '.CaseNumber}} ';	
					}else if(EmailSelectFieldStore.getAt(i).get('refereceObjName') == 'Solution'){
						subjectTextBox.value +=  ' {{' +EmailSelectFieldStore.getAt(i).get('relationshipName')+ '.SolutionNumber }}';
					}else if(EmailSelectFieldStore.getAt(i).get('refereceObjName') == 'Idea'){
						subjectTextBox.value +=  ' {{' +EmailSelectFieldStore.getAt(i).get('relationshipName')+ '.Title}} ';
					}else if(EmailSelectFieldStore.getAt(i).get('refereceObjName') == 'Contract'){
						subjectTextBox.value +=  ' {{' +EmailSelectFieldStore.getAt(i).get('relationshipName')+ '.ContractNumber}} ';
					}else{
					subjectTextBox.value +=  ' {{' +EmailSelectFieldStore.getAt(i).get('relationshipName')+ '.name}} ';
					}
			}else{
				subjectTextBox.value += ' {{' +EmailSelectFieldComboBoxId.value+ '}} ';
			}
		}
	}	
}
function validateSubject(){
	var hasError = 0;
	var listFields = [];
	var pattern = "\\{\\{([^}]*)\\}\\}";
	 const array = [...subjectTextBox.value.matchAll(pattern)]; 
	 for(var i=0;i<array.length;i++){
		listFields.push(array[i][1]); 
	 }
	 var combobox = Ext.getCmp('EmailSelectFieldComboBox');
	 var fieldName;
	 var field;
	 for( var j=0;j<listFields.length;j++){
		if(listFields[j].includes('FORMAT(')){
			fieldName = listFields[j].substring(listFields[j].lastIndexOf('FORMAT(')+7,listFields[j].lastIndexOf(')'));
			field = combobox.findRecord('name',fieldName);
		}else if((listFields[j].includes('__r.') && listFields[j].includes('.name'))|| (!listFields[j].includes('__r.') && listFields[j].includes('.name'))){
			fieldName = listFields[j].split('.name')[0];
			field = combobox.findRecord('relationshipName',fieldName);
		}else{
			fieldName = listFields[j];
			field = combobox.findRecord('name',fieldName);
		}
		if(field == null && field == undefined){
			hasError = 1;
			return hasError;
		}			
	 }
	return hasError;
}

function showFieldCombo(){
	var selectFieldPanel = Ext.getCmp('EmailSelectFieldPanel');
	selectFieldPanel.hidden == true ? selectFieldPanel.show() : selectFieldPanel.hide();
	if(document.getElementById('EmailSelectFieldLabel') != null){
	document.getElementById('EmailSelectFieldLabel').parentNode.style.width = "100px";}
}


