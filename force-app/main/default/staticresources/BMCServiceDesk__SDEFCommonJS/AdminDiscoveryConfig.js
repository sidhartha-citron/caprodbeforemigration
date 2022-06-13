var browserZoomLevel = window.devicePixelRatio;
var warningIcon=Ext.MessageBox.WARNING;
var popUpWindow;
var bottomToolbar;
var ShowOrHide = 0;

var errorWhileFirstLoad = '';

var userCredsGridStore;
var userCredsGrid;
var userCredsGridDataModel;
var currentSelUserName;
var currentSelProtocol = '';
var editingUserCreds = false;

var memberGrid;
var memberGridStore;
var memberGridDataModel;
var currentSelIncMem = '';
var currentSelExcMem = '';
var editingMemberLst = false;

var snmpCredsGrid;
var snmpCredsGridStore;
var snmpCredsGridDataModel;

var protocolGridDataModel;
var protocolGridStore;
var protocolGrid;

var isSMBActive = true;
var isSSHActive = true;
var isSNMPActive = true;
var isVMWAREActive = true;
var isHYPERVActive = true;
var SMBProtocolArr = [];
var SSHProtocolArr = [];
var SNMPProtocolArr = [];
var VMWAREProtocolArr = [];
var HYPERVProtocolArr = [];
var scanWaitMask;
var scanWaitMaskForLaunchConsole;
var logInWindow;
var scannerDevicesGrid,lastSelectedIndex=0;

var membersToDelete = [];
var isDirty=false;

var tempMsg = '';

var previousValueOfToggle;

var userNameVal;
var psswrdVal;
var incMemberMaxLengthError = targetlistmemberlimitexceeded.replace("{0}", incMemberMaxLength);
var excMemberMaxLengthError = targetlistmemberlimitexceeded.replace("{0}", excMemberMaxLength);


function autoRefreshScanners(){
	if(typeof(scannerDevicesGridStore) != 'undefined' && scannerDevicesGridStore != null){
		var scannersArray = scannerDevicesGridStore.getRange();
		if(scannersArray != null && scannersArray.length > 0){
			var i = 0;
			var deviceList = [];
			for(i = 0; i < scannersArray.length; i++){
				deviceList.push(scannersArray[i].data);
			}
			if(typeof(deviceList) != 'undefined' && deviceList != null && deviceList.length > 0){
				ScannerDeviceListJSON = JSON.stringify(deviceList);
				autoRefreshScannerGrid(ScannerDeviceListJSON);
			}
			//Refreshing the components.
			Ext.getCmp('bottomtoolbarId').doLayout();
			Ext.getCmp('protocolsGridId').doLayout();
			Ext.getCmp('userCredsGridId').doLayout();
			Ext.getCmp('memberGridId').doLayout();
		}else{
			hideLoadingMask();
		}
	}else if(errorWhileFirstLoad != ''){
		hideLoadingMask();
		showLightningPopup('toast',lblErrorTitle,errorWhileFirstLoad,'','','','','error',errorWhileFirstLoad);
	}
	else {
		hideLoadingMask();
		document.getElementById('bottomDiv').style.display = 'none';
		showLightningPopup('toast',lblErrorTitle,ScannerNotFound,'','','','','error');
	}
}

function autoRefreshComplete(){
	hideLoadingMask();
	if(activeBtnId == 'CMDBDiscovery_Settings'){
		if(typeof(ScannerDeviceListJSON) != 'undefined' && ScannerDeviceListJSON != null && ScannerDeviceListJSON !=''){
			pushDataInScannerGrid();
			if(typeof(lastSelectedIndex) != 'undefined' && lastSelectedIndex != null){
				scannerDevicesGrid.getView().select(lastSelectedIndex);
			}
		}
	}
}


function createScannerDetailsObject(){
	var currentSelScanner = scannerDevicesGrid.getSelectionModel().getSelection();
	var scannerDetailsObj = {};
	if(typeof(currentSelScanner) != 'undefined' && currentSelScanner != null){
		scannerDetailsObj = currentSelScanner[0].data;
	}
	return scannerDetailsObj;
}

function createProtocolNCredsJSON(){
	var smbChbx = document.getElementById('SMBChkbxId');
	var sshChbx = document.getElementById('SSHChkbxId');
	var snmpChbx = document.getElementById('SNMPChkbxId');
	var vmwareChbx = document.getElementById('VMWAREChkbxId');
	var hypervChbx = document.getElementById('HYPERVChkbxId');
	
	var protocolNCredsJSON;
	if(typeof(smbChbx) != 'undefined' && smbChbx != null && typeof(sshChbx) != 'undefined' && smbChbx != null
			&& typeof(snmpChbx) != 'undefined' && smbChbx != null && typeof(vmwareChbx) != 'undefined' && smbChbx != null
			&& typeof(hypervChbx) != 'undefined' && smbChbx != null)
	{
		protocolNCredsJSON = {
									SMB: {activated: (smbChbx.checked == true? '1' : '0'), credentials: getCredsArr('smb')},
									SSH: {activated: (sshChbx.checked == true? '1' : '0'), credentials: getCredsArr('ssh')},
									SNMP: {activated: (snmpChbx.checked == true? '1' : '0'), credentials: getSNMPCredsArr()},
									VMWARE: {activated: (vmwareChbx.checked == true? '1' : '0'), credentials: getCredsArr('vmware')},
									HYPERV: {activated: (hypervChbx.checked == true? '1' : '0'), credentials: getCredsArr('hyperv')}
								};
	}
	
	return protocolNCredsJSON;
}

function getSNMPCredsArr(){
	var credsArrtoReturn = [];
	var i = 0;
	if(typeof(SNMPProtocolArr) != 'undefined' && SNMPProtocolArr != null && SNMPProtocolArr.length > 0){
		for(i = 0; i < SNMPProtocolArr.length; i++){
			var credsObj = {community: SNMPProtocolArr[i].community, user: SNMPProtocolArr[i].user, authalgo: SNMPProtocolArr[i].authalgo, authpass: SNMPProtocolArr[i].authpass, privacyalgo: SNMPProtocolArr[i].privacyalgo, privacypass: SNMPProtocolArr[i].privacypass,snmpmapkey: SNMPProtocolArr[i].snmpmapkey};
			credsArrtoReturn.push(credsObj);
		}
	}
	return credsArrtoReturn;
}

function getCredsArr(protocolName){
	var credsArrtoReturn = [];
	var credsStoreArr;
	if(protocolName == 'smb'){
		credsStoreArr = SMBProtocolArr;
	}else if(protocolName == 'ssh'){
		credsStoreArr = SSHProtocolArr;
	}else if(protocolName == 'vmware'){
		credsStoreArr = VMWAREProtocolArr;
	}else if(protocolName == 'hyperv'){
		credsStoreArr = HYPERVProtocolArr;
	}
	var i = 0;
	if(typeof(credsStoreArr) != 'undefined' && credsStoreArr != null && credsStoreArr.length > 0){
		for(i = 0; i < credsStoreArr.length; i++){
			var credsObj = {login: credsStoreArr[i].userName, password: credsStoreArr[i].password};
			credsArrtoReturn.push(credsObj);
		}
	}
	return credsArrtoReturn;
}

function backToScannerListHandler(){
	if(isDirty){						
		showLightningPopup('modal',lblwarningTitle,lblUnSavedDataMsg,lblNo,lblYes,'backToScannerListAction','backToScannerListAction');
	}else{
		ShowhideScannerGrid(true);
	}
}

function CreateToolbar(){
	
	try {

	var bottomtoolbarItems = [ {xtype: 'tbspacer',width :5},
	{xtype:'label' ,cls: 'scannerRolloutCls', html: '<a id="scannerListLink" href="javascript:void(0)"  title="" value="'+scannerRollout+'"'+' onclick="backToScannerListHandler();" >'+ scannerListLabel+'</a>&nbsp;><label id="lblscannerdevice" style= \'top: 0px !important;font-size: 16px;font-weight: bold;color: #1b1a1a;margin-left: 5px;\'></label>',cls : 'helix-label'},
	{xtype: 'tbspacer',width :50},
	{xtype: 'component',flex: 1},
	'->',
	{
		xtype: 'button',
		text: backToScannerLabel,
		height:34,
		tooltipType : 'title',
		tooltip: backToScannerLabel,
		cls: 'rfButtonCls helix-paddingForBtn slds-button  slds-button_neutral',
		disabledCls : 'helix-slds-button-disabled',
		handler: function(){
			backToScannerListHandler();			
		}
	},{xtype: 'tbspacer',width :5},
		{
			xtype: 'button',
			id:'configSaveBtn',
			text: lblSave,
			height:34,
			tooltipType : 'title',
			tooltip: saveToolTip,
			cls: 'rfButtonCls helix-paddingForBtn slds-button  slds-button_neutral',
			disabledCls : 'helix-slds-button-disabled',
			disabled: true,
			handler:function() {
				currentScannerDetails = JSON.stringify(createScannerDetailsObject());
				currentScannerProtocolsNCreds = JSON.stringify(createProtocolNCredsJSON());
				currentScannerTargetList = createTargetListJSON();
				var membersGridDataArr = memberGridStore.getRange();
				if(membersGridDataArr != null && membersGridDataArr.length > 0){
					if(validateSchedule()){
						showLoadingMask();
						enableOrDisableSaveNRefresh(false);
						previousValueOfToggle = toggleInteger;
						isException16820 = false;
						saveScanners(currentScannerDetails, currentScannerProtocolsNCreds, currentScannerTargetList,StartType,StopType,scanCount,frequencyType,dayOfWeekSchedule,scheduleInstanceDayOfMonth,frqTimeHrs,frqTimeMin,frqTimeFrame,ScheduleType,false);
					}
				}else{
					hideLoadingMask();										
					showLightningPopup('modal',lblwarningTitle,targetListEmptyWrng,lblNo,lblYes,'targetListEmptyAction','targetListEmptyAction');
				}
			}
		},
		{xtype: 'tbspacer',width :10}
	];	

	if(userLanguage == 'iw'){
		bottomtoolbarItems.reverse();
	}

	bottomToolbar = Ext.create('Ext.toolbar.Toolbar', {
		renderTo: 'tbar',
		title: '',
		height:32,
	    id:'bottomtoolbarId',
		items: bottomtoolbarItems
				
		});
	}catch(e){
		console.log('exception ',e);
	}		
}


function RefreshHandler(){
	showLoadingMask();
	enableOrDisableSaveNRefresh(false);
	clearGridDataNLabels();
	previousValueOfToggle = toggleInteger;
	resetScanForm();
	getscannerStatusNLastStatusUpdate();	
}


function saveComplete(){
	if(isAllowBCMDomainUserPwdUpdate){
		saveComplete_SafeGuardSettingOn();
	}else{
		saveComplete_SafeGuardSettingOff();
	}
}

//This is copy of saveComplete() to be called when SafeGuard_BCMDomainUserPwdUpdate is false/off 
function saveComplete_SafeGuardSettingOff(){
	hideLoadingMask();
	enableOrDisableSaveNRefresh(true);
	if(previousValueOfToggle != toggleInteger){
		if(typeof(scannerInfoToFetchScan) != 'undefined' && scannerInfoToFetchScan != null && scannerInfoToFetchScan != ''){
			updateScannerInfoInScannerGrid();
		}
		var currentSelectedScanner = scannerDevicesGrid.getSelectionModel().getSelection();
		var currentScannerScanId = currentSelectedScanner[0].data.scanId;
		if(typeof(exceptionMsg) != 'undefined' && exceptionMsg != null && exceptionMsg == '-1111' ){
			showMultipleScanConfigurationMsg ();
		}
		else if(typeof(exceptionMsg) != 'undefined' && (exceptionMsg == null || exceptionMsg == '') && typeof(currentScannerScanId) != 'undefined' && currentScannerScanId != null && currentScannerScanId != ''){
			saveScannerInfoInRF();
			showScannerConfigdata();
		}else{
			saveScannerInfoInRF();
			showScannerConfigdata();
			tempMsg = exceptionMsg;
		}
	}else{
		showMessage(invalidStartOrEndDateMsg);
	}
}
		
//This is copy of saveComplete() to be called when SafeGuard_BCMDomainUserPwdUpdate is missing or enabled  
function saveComplete_SafeGuardSettingOn(){
	hideLoadingMask();
	enableOrDisableSaveNRefresh(true);
	if(previousValueOfToggle != toggleInteger){
		if(typeof(scannerInfoToFetchScan) != 'undefined' && scannerInfoToFetchScan != null && scannerInfoToFetchScan != ''){
			updateScannerInfoInScannerGrid();
		}
		var currentSelectedScanner = scannerDevicesGrid.getSelectionModel().getSelection();
		var currentScannerScanId = currentSelectedScanner[0].data.scanId;

		if(typeof(exceptionMsg) != 'undefined' && exceptionMsg != null && exceptionMsg == '-1111'){
			showMultipleScanConfigurationMsg ();
		}
		else if(typeof(exceptionMsg) != 'undefined' && (exceptionMsg == null || exceptionMsg == '') && typeof(currentScannerScanId) != 'undefined' && currentScannerScanId != null && currentScannerScanId != ''){
			saveScannerInfoInRF();
			showScannerConfigdata();
		}else{
			saveScannerInfoInRF();
			showScannerConfigdata();
			tempMsg = exceptionMsg;
		}
	}else{
		mapScanConfigErrors.forEach(function(value, key) {
			if(key == '16820' && value == 'true' ) 
				isException16820 = true;
		})
		
		if( isAllowBCMDomainUserPwdUpdate && exceptionMsg.indexOf('Error code: 16820') > -1 ){
			if (isException16820){
				duplicateDomainUserErrorHandler ();
			}else{
				showProtocolsNCreds();
				currentScannerProtocolsNCreds = JSON.stringify(createProtocolNCredsJSON());
				showScannerConfigdata();
			}
		}
		else if (exceptionMsg){
			showMessage(exceptionMsg);
			return false;
		}
		else if(previousValueOfToggle == toggleInteger){
			showMessage(invalidStartOrEndDateMsg);
		}
	}
}

function duplicateDomainUserErrorHandler(){
	showLightningPopup('modal','',lblACDuplicateUserErrorMsg,lblNo,lblYes,'error16820Handler','error16820Handler');
}

function showMultipleScanConfigurationMsg(){
		
	if(document.getElementById('ScannerAccordians') != null && document.getElementById('ScannerAccordians') != undefined )
	{	
		document.getElementById('ScannerAccordians').style.display ='none';
		var LaunchConsoleDiv = document.getElementById('LaunchConsoleDiv');
		
		if(LaunchConsoleDiv != null && LaunchConsoleDiv != undefined )
		{
			while (LaunchConsoleDiv.hasChildNodes()) {
				LaunchConsoleDiv.removeChild(LaunchConsoleDiv.lastChild);
			}
			
			document.getElementById('WarningSection').style.display='block';
			document.getElementById('WarningSection').className = "WarningSectionStyle";
			document.getElementById('LaunchConsoleDiv').style.display='block';
			var lbl = document.createElement("LABEL");
			var text = document.createTextNode(ACMultipleScanConfigMsg);
			lbl.appendChild(text);
			var dNodeBR = document.createElement('br');
			lbl.appendChild(dNodeBR);
			text = document.createTextNode(toViewGoto);
			lbl.appendChild(text);
			var a = document.createElement('a');
			var linkText = document.createTextNode(ACLaunchConsole);
			a.appendChild(linkText);
			a.href = "#";
			a.setAttribute('onclick', "validateAndLaunchConsole();");
			document.getElementById('LaunchConsoleDiv').appendChild(lbl);
			document.getElementById('LaunchConsoleDiv').appendChild(a);
			document.getElementById('LaunchConsoleDiv').className = "launchConsoleStyle";
			Ext.getCmp('configSaveBtn').setDisabled(true);
			isDirty = false;
		}
	}
}

function error16820Handler(){
	isException16820 = false;
	mapScanConfigErrors.clear();
	showLoadingMask();
	saveScanners(currentScannerDetails, currentScannerProtocolsNCreds, currentScannerTargetList,StartType,StopType,scanCount,frequencyType,dayOfWeekSchedule,scheduleInstanceDayOfMonth,frqTimeHrs,frqTimeMin,frqTimeFrame,ScheduleType,true);
}

function saveScannerInfoInRF(){
	var currentSelScanner = scannerDevicesGrid.getSelectionModel().getSelection();
	currentScannerDetails = JSON.stringify(createScannerDetailsObject());
	if(typeof(currentSelScanner) != 'undefined' && currentSelScanner != null && typeof(currentSelScanner[0].data.scanId) != 'undefined' && currentSelScanner[0].data.scanId != null && currentSelScanner[0].data.scanId != ''){
		showLoadingMask();
		enableOrDisableSaveNRefresh(false);
		saveConfigurationInRF();
	}
}

function saveCompleteInRF(){
	if(typeof(exceptionMsg) != 'undefined' && exceptionMsg != null && (exceptionMsg == '' || scanSavedInRF == true)){
		hideLoadingMask();
		enableOrDisableSaveNRefresh(true);
		if(tempMsg != ''){
			showLightningPopup('toast',lblErrorTitle,exceptionMsg,'','','','','error');
			tempMsg = '';
		}else{
			showLightningPopup('toast',successTitle,savedsuccessfullyLabel,'','','','','success');
		}
		isDirty = false;
		EnableDisableImportConfig();
		getscannerStatusNLastStatusUpdate();
	}else{
		var currentSelectedScanner = scannerDevicesGrid.getSelectionModel().getSelection();
		ScanId = currentSelectedScanner[0].data.scanId;
		deleteCreatedScan(ScanId);
		clearScannerInfoFromGrid();
		if(tempMsg != ''){
			showLightningPopup('toast',lblErrorTitle,tempMsg+'\n'+exceptionMsg,'','','','','error');
		}else{
			showLightningPopup('toast',lblErrorTitle,exceptionMsg,'','','','','error');
		}
		
	}
}

function clearScannerInfoFromGrid(){
	var currentSelScanner = scannerDevicesGrid.getSelectionModel().getSelection();
	if(typeof(currentSelScanner) != 'undefined' && typeof(currentSelScanner) != 'undefined' && currentSelScanner != null
			&& currentSelScanner != '' && currentSelScanner.length > 0){
		currentSelScanner[0].set('scanExecutionStatus',NotConfigured);
		currentSelScanner[0].set('lastScanDate','');
		currentSelScanner[0].set('scanId','');
		currentSelScanner[0].set('scanName','');
		currentSelScanner[0].set('statusKeyword','');
		currentSelScanner[0].set('configurationId','');
		currentSelScanner[0].set('configurationName','');
		currentSelScanner[0].set('targetListId','');
		currentSelScanner[0].set('targetListName','');
		currentSelScanner[0].set('scheduleId','');
		currentSelScanner[0].set('AssignmentId','');
	}
}
	
// Scanner grid functions

	function pushDataInScannerGrid(){
		var scannerDevices;
		var arrScannerDevices = [];
		if(typeof(ScannerDeviceListJSON) != 'undefined' && ScannerDeviceListJSON != null && ScannerDeviceListJSON !=''){
			scannerDevices = JSON.parse(ScannerDeviceListJSON);
			//arrScannerDevices = scannerDevices.Values;
			arrScannerDevices = scannerDevices;
		}
		scannerDevicesGridStore.loadData(arrScannerDevices);
	}
	
	function addstatusImage(data, metadata, record, rowIndex, columnIndex, store){
		if(typeof(record.data.ObjectLargeIcon) != 'undefined' && record.data.ObjectLargeIcon != null )
		{
			ObjectLargeIcon = record.data.ObjectLargeIcon;
			if(ObjectLargeIcon.indexOf('red') > -1)
				return  '<div><div class="rf-grid-cell statusIconCls" title="'+record.data.ObjectName +'">'+'<a href="javascript:void(0)">'+record.data.ObjectName+'</a></div><div title="'+statusInfo +'" class="ScannerStatusOrange"></div></div>';
			else
				return  '<div><div class="rf-grid-cell statusIconCls" title="'+record.data.ObjectName +'">'+'<a href="javascript:void(0)">'+record.data.ObjectName+'</a></div><div class="ScannerStatusGreen" ></div></div>';
		}
	}
	function addRemoveLink(data, metadata, record, rowIndex, columnIndex, store){
		var ObjectLargeIcon = '';
		
		
		if(typeof(record.data.ObjectLargeIcon) != 'undefined' && record.data.ObjectLargeIcon != null )
		{
			ObjectLargeIcon = record.data.ObjectLargeIcon;
			if(ObjectLargeIcon.indexOf('red') > -1)
				return '<div  class="enabledBin" onclick="event.stopPropagation();confirm(\''+record.data.ObjectId+'\');">  </div>';
			else
				return '<div class="disabledBin"> </div>';
		}
	}
	function deleteScannerAction(){
		enableOrDisableSaveNRefresh(false);
		showLoadingMask();		
		var currentSelectedScanner = scannerDevicesGrid.getSelectionModel().getSelection();
		scannerInfoToFetchScan = JSON.stringify(currentSelectedScanner[0].data);
		DeleteScanner(scannerInfoToFetchScan);
	}

	function confirm(ObjectId){
		showLightningPopup('modal','',DeleteConfirmMessage,lblNo,lblYes,'scannerDeleteAction','scannerDeleteAction');
		
	}
	function addLink(data, metadata, record, rowIndex, columnIndex, store){
		var scanStatus = '';
		if(typeof(record.data.scanExecutionStatus) != 'undefined' && record.data.scanExecutionStatus != null )
			scanStatus = record.data.scanExecutionStatus;
		if(scanStatus != NotConfigured )
	 		return '<a class="ViewDetailsLinkCls" id="detailsLink'+ record.data.ObjectId + '" onclick="event.stopPropagation();sendRecord(\''+record.data.ObjectId+'\','+'\''+scanStatus+'\','+'\''+record.data.ObjectName+'\')">'+lblViewDetails+'</a>';
		else
			return '<a class="labelCls" id="detailsLink'+ record.data.ObjectId + '"  onclick="return false;">'+lblViewDetails+'</a>';
	}
	function sendRecord(ObjectId,scanStatus,ObjectName){
		var width, height;
		width = 1100;
		height = 600;
		var width = window.innerWidth || document.documentElement.clientWidth|| document.body.clientWidth;
		var height = window.innerHeight|| document.documentElement.clientHeight|| document.body.clientHeight;
		width = width * 0.95;
		height = height * 0.75;
		var winTitle= ACScandetailsfor + ' : ' + ObjectName;
		if(typeof(showLightningPopup) != 'undefined'){
			showLightningPopup('vfModalPage',winTitle,'AdminDiscoveryDeviceLogs?ObjectId='+ObjectId+'&scanStatus='+scanStatus+'&ObjectName='+ObjectName,height,width);
		}
	}
	var onCompleteFunction;
	function openPopup(link, height,width,winTitle,onComplete) {
		onCompleteFunction = onComplete;
		if (height!=null && width!=null){
			popUpWindow = Ext.create('Ext.Window', {
				height: height,
				width: width,
				title: winTitle,
				x: 10,
				y: 10,
				modal:true,
				resizable:true,
				bodyStyle:'background-color:#FFFFFF;',
				constrain : true,
				viewConfig: {forceFit: true},
				html:'<iframe frameborder="0" src =\"\/apex\/'+link+'\" style=\"width:100%;height:100%;border:none;background-color:#ffffff\"/>'
				
			});
			popUpWindow.show();
		} 
	} 
	
	function getscannerStatusNLastStatusUpdate(){
		var scannersArray = scannerDevicesGridStore.getRange();
		if(scannersArray != null && scannersArray.length > 0){
			var i = 0;
			var deviceIdList = [];
			for(i = 0; i < scannersArray.length; i++){
				deviceIdList.push(scannersArray[i].data);
			}
			if(typeof(deviceIdList) != 'undefined' && deviceIdList != null && deviceIdList.length > 0){
				ScannerListToUpdate = JSON.stringify(deviceIdList);
				saveLatestStatusNUpdateTime(ScannerListToUpdate);
			}
		}
	}
	
	function CreateScanDeviceGrid(){
		
		var columnHeaders = [
			{ text: lblObjectId,  dataIndex: 'ObjectId', hidden: true, flex:0, hideable: false, menuDisabled : true,sortable: false},
			{ text: '<span class="scannerHeaderCls">'+lblScanner+'</span>', dataIndex: 'ObjectName', hidden: false,renderer:addstatusImage,flex:1.5, hideable: false, menuDisabled : true},
			{ text: lblOperatingSystemName, dataIndex: 'OperatingSystemName', hidden: false,renderer:renderToolTip,flex:2.4, hideable: false, menuDisabled : true},
			{ text: lblIPAddress, dataIndex: 'IPAddress', hidden: true,renderer:renderToolTip,flex:1.2, hideable: false, menuDisabled : true},
			{ text: lblLocation, dataIndex: 'FAMLocation', hidden: true,renderer:renderToolTip,flex:1, hideable: false, menuDisabled : true}, //hide location field
			{ text: lblExecutionStatus, dataIndex: 'scanExecutionStatus', hidden: false,renderer:renderToolTip,flex:1.2, hideable: false, menuDisabled : true},
			{ text: lblLastScanDate, dataIndex: 'lastScanDate', hidden: false ,renderer:renderToolTip,flex:1.3, hideable: false, menuDisabled : true},
			{ text: 'ScanId', dataIndex: 'scanId', hidden: true,renderer:renderToolTip,flex:0, hideable: false, menuDisabled : true},
			{ text: 'ScanName', dataIndex: 'scanName', hidden: true ,renderer:renderToolTip,flex:0, hideable: false, menuDisabled : true},
			{ text: 'statusKeyword', dataIndex: 'statusKeyword', hidden: true,renderer:renderToolTip,flex:0, hideable: false, menuDisabled : true},
			{ text: 'ConfigurationId', dataIndex: 'configurationId', hidden: true ,renderer:renderToolTip,flex:0, hideable: false, menuDisabled : true},
			{ text: 'ConfigurationName', dataIndex: 'configurationName', hidden: true ,renderer:renderToolTip,flex:0, hideable: false, menuDisabled : true},
			{ text: 'TargetListId', dataIndex: 'targetListId', hidden: true ,renderer:renderToolTip,flex:0, hideable: false, menuDisabled : true},
			{ text: 'TargetListName', dataIndex: 'targetListName', hidden: true ,renderer:renderToolTip,flex:0, hideable: false, menuDisabled : true},
			{ text: 'ScheduleId', dataIndex: 'scheduleId', hidden: true ,renderer:renderToolTip,flex:0, hideable: false, menuDisabled : true},
			{ text: 'AssignmentId', dataIndex: 'AssignmentId', hidden: true ,renderer:renderToolTip,flex:0, hideable: false, menuDisabled : true},
			{ text: lblScanDetails, dataIndex: 'LinkScanDetail', hidden: false,renderer:addLink,flex:1, hideable: false, menuDisabled : true},
			{ text: '',  dataIndex: 'ObjectLargeIcon', hidden: false,renderer:addRemoveLink,width: 30, hideable: false, menuDisabled : true}
		];

		var fieldsArray = ['ObjectLargeIcon','ObjectId', 'ObjectName', 'OperatingSystemName', 'IPAddress','FAMLocation','scanExecutionStatus','lastScanDate','scanId','scanName', 'statusKeyword', 'configurationId','configurationName','targetListId','targetListName','scheduleId' , 'AssignmentId', 'LinkScanDetail'];

		if(userLanguage == 'iw'){
			columnHeaders.reverse();
			fieldsArray.reverse();
		}
		
		scannerDevicesGridStore = Ext.create('Ext.data.Store', {
			storeId:'ScannerDeviceStore',
			fields:fieldsArray
		});
		
		scannerDevicesGrid = Ext.create('Ext.grid.Panel', {
			store: scannerDevicesGridStore,
			columns: columnHeaders,
			id: 'scannerDevicesGridId',
			autoHeight : true,
			style: 'overflow-x: hidden;',
			border: false,
			renderTo: 'ScannerDevice',
			forceFit : true,
			layout: 'fit',
			autoScroll:false,
			cls: 'panelBorder',
            emptyText: lblNoScannersRolled,
			viewConfig: {
				forceFit:true,
				markDirty:false
			},      
				   
			listeners: {
				afterrender: function() {
					changeGridDirectionForRTL('scannerDevicesGridId-body');
				},
				cellclick: function(view, td, cellIndex, record, tr, rowIndex, e, eOpts) {
					var clickedColumnHeader = view.panel.headerCt.getHeaderAtIndex(cellIndex).dataIndex; 

					if(clickedColumnHeader == 'ObjectName'){
						ShowhideScannerGrid(false);
					fetchScannerInfoHandler(record, rowIndex);
					if(rowIndex != lastSelectedIndex){
						if(isDirty){	
							Ext.MessageBox.show({
								id:'warningMsgbox',
								title: lblwarningTitle,
								width: 300,
								msg: lblUnSavedDataMsg,
								buttons: Ext.MessageBox.YESNO,
								icon: Ext.MessageBox.WARNING,
								buttonText: { yes: lblYes, no: lblNo },
								fn: function(btn) {
									if(btn == 'yes') { // confirmed to fetch the scanner info
										ShowhideScannerGrid(false);
										fetchScannerInfoHandler(record, rowIndex);
									}else{
										if(typeof(lastSelectedIndex) != 'undefined' && lastSelectedIndex != null){
											scannerDevicesGrid.getView().select(lastSelectedIndex);
										}
									}
								}
							});
						}else{
							ShowhideScannerGrid(false);
							fetchScannerInfoHandler(record, index);
						}
					}	

					}
				}

			}
			
		});
	
	}
	
	function fetchScannerInfoHandler(record, index){
		enableOrDisableSaveNRefresh(false);
		lastSelectedIndex = index;
		if(typeof(document.getElementById(scannerNameCmp)) != 'undefined' && document.getElementById(scannerNameCmp) != null){
			if(record != null && record.data != null){
				if(document.getElementById(scannerNameCmp).innerText){
					document.getElementById(scannerNameCmp).innerText = record.data.ObjectName;	
				}else{
					document.getElementById(scannerNameCmp).textContent = record.data.ObjectName;
				}
			}
		}
		scannerInfoToFetchScan = JSON.stringify(record.data);
		var currentScannerDeviceId = record.data.ObjectId;
		
		if(typeof(currentScannerDeviceId) != 'undefined' && currentScannerDeviceId != null && currentScannerDeviceId != ''){
			clearGridDataNLabels();
			showLoadingMask();
			getScannerInfo(scannerInfoToFetchScan);
		}
	}
	
	function clearGridDataNLabels(){
		SMBProtocolArr = [];
		SSHProtocolArr = [];
		SNMPProtocolArr = [];
		VMWAREProtocolArr = [];
		HYPERVProtocolArr = [];
		isSMBActive = true;
		isSSHActive = true;
		isSNMPActive = true;
		isVMWAREActive = true;
		isHYPERVActive = true;
		
		//disable the grid buttons.
		Ext.getCmp('addUserCredsBtnId').setDisabled(true);
		Ext.getCmp('editUserCredsBtnId').setDisabled(true);
		Ext.getCmp('deleteUserCredsBtnId').setDisabled(true);
		Ext.getCmp('addSNMPCredsBtnId').setDisabled(true);
		Ext.getCmp('deleteSNMPCredsBtnId').setDisabled(true);
		Ext.getCmp('editMemberBtnId').setDisabled(true);
		Ext.getCmp('deleteMemberBtnId').setDisabled(true);
		
		protocolGridStore.reload();
		setGridsWithEmptyDataStore();
		membersToDelete = [];
		
		currentSelProtocol = '';
		createUserCredsLstLbl();
		
		frequencyType = "DAILY";
		scheduleInstance="1";
		scheduleInstanceDayOfMonth="1";
		frqTimeFrame = "AM";
		frqTimeHrs = 3;
		frqTimeMin = 0;
		scanCount = 1;
	}
	
	function showScannerInfo(){
		enableOrDisableSaveNRefresh(true);
		try{
			if(typeof(exceptionMsg) != 'undefined' && exceptionMsg != null && exceptionMsg == '-1111' )
			{
				showMultipleScanConfigurationMsg ();
			}
			else if(typeof(exceptionMsg) != 'undefined' && (exceptionMsg == null || exceptionMsg == '')){
				if(typeof(scannerInfoToFetchScan) != 'undefined' && scannerInfoToFetchScan != null && scannerInfoToFetchScan != ''){
					updateScannerInfoInScannerGrid();
				}
				var currentSelectedScanner = scannerDevicesGrid.getSelectionModel().getSelection();
				var currentScannerScanId = currentSelectedScanner[0].data.scanId;
				if(typeof(currentScannerScanId) != 'undefined' && currentScannerScanId != null && currentScannerScanId != '' && typeof(exceptionMsg) != 'undefined' && exceptionMsg != null && exceptionMsg == ''){
					if(typeof(protocolConfigJSON) != 'undefined' && protocolConfigJSON != null && protocolConfigJSON != ''){
						showProtocolsNCreds();
						if(ScannerDeviceListJSON != undefined && ScannerDeviceListJSON != null && ScannerDeviceListJSON != ''){
							var lastSelectedRow=scannerDevicesGrid.getSelectionModel().getLastSelected();
							if(lastSelectedRow!=undefined && lastSelectedRow!=null){
								checkActiveProtocol();
							}
						}
					}
					if(typeof(memberListJSON) != 'undefined' && memberListJSON != null && memberListJSON != ''){
						showTargetList();
					}
							document.getElementById('WarningSection').style.display='none';
							document.getElementById('WarningSection').className = "hideWarningSectionStyle";
							document.getElementById('LaunchConsoleDiv').style.display='none';
							document.getElementById('LaunchConsoleDiv').className = "hideLaunchConsoleStyle";
					
							showScannerConfigdata();
					syncScanConfigInfo();//save fetched scan config info in the RF objects.
					
				}else if(typeof(currentScannerScanId) != 'undefined' && currentScannerScanId != null && currentScannerScanId == '' && typeof(exceptionMsg) != 'undefined' && exceptionMsg != null && exceptionMsg != ''){
					showLightningPopup('toast',lblErrorTitle,exceptionMsg,'','','','','error');
				}else{
					document.getElementById('WarningSection').style.display='none';
					document.getElementById('WarningSection').className = "hideWarningSectionStyle";
					document.getElementById('LaunchConsoleDiv').style.display='none';
					document.getElementById('LaunchConsoleDiv').className = "hideLaunchConsoleStyle";
					
					showScannerConfigdata();
					showNewScanConfig();
					if(typeof(currentScannerScanId) != 'undefined' && currentScannerScanId != null && currentScannerScanId == '' && typeof(exceptionMsg) != 'undefined' && (exceptionMsg == null || exceptionMsg == '')){
						syncScanConfigInfo();
					}
				}
				
				updateSchedulerUI();
				isDirty = false;
			}
		}catch(e){
			isDirty = false;
			console.log(e.message);
			hideLoadingMask();
		}	
	}
	
	function updateScannerInfoInScannerGrid(){
		var latestScannerInfo = JSON.parse(scannerInfoToFetchScan);
		var currentSelScanner = scannerDevicesGrid.getSelectionModel().getSelection();
		
		if(typeof(currentSelScanner) != 'undefined' && typeof(currentSelScanner) != 'undefined' && currentSelScanner != null
				&& currentSelScanner != '' && currentSelScanner.length > 0){
			currentSelScanner[0].set('scanExecutionStatus',latestScannerInfo.scanExecutionStatus);
			currentSelScanner[0].set('lastScanDate',latestScannerInfo.lastScanDate);
			currentSelScanner[0].set('scanId',latestScannerInfo.scanId);
			currentSelScanner[0].set('scanName',latestScannerInfo.scanName);
			currentSelScanner[0].set('statusKeyword',latestScannerInfo.statusKeyword);
			currentSelScanner[0].set('configurationId',latestScannerInfo.configurationId);
			currentSelScanner[0].set('configurationName',latestScannerInfo.configurationName);
			currentSelScanner[0].set('targetListId',latestScannerInfo.targetListId);
			currentSelScanner[0].set('targetListName',latestScannerInfo.targetListName);
			currentSelScanner[0].set('scheduleId',latestScannerInfo.scheduleId);
			currentSelScanner[0].set('AssignmentId',latestScannerInfo.AssignmentId);
		}
	}
	
	function syncScanConfigInfo(){
		var currentSelScanner = scannerDevicesGrid.getSelectionModel().getSelection();
		currentScannerDetails = JSON.stringify(createScannerDetailsObject());
		if(typeof(currentSelScanner) != 'undefined' && currentSelScanner != null && typeof(currentSelScanner[0].data.scanId) != 'undefined' && currentSelScanner[0].data.scanId != null && currentSelScanner[0].data.scanId != ''){
			currentScannerProtocolsNCreds = JSON.stringify(createProtocolNCredsJSON());
			currentScannerTargetList = createTargetListJSON();
			syncScanInfo(currentScannerDetails, currentScannerProtocolsNCreds, currentScannerTargetList, IdsOfRFRecords);
		}else{
			syncScanInfo(currentScannerDetails, '', '', IdsOfRFRecords);
		}
	}
	
	function showNewScanConfig(){
		checkActiveProtocol();
		setGridsWithEmptyDataStore();
	}
	
	function setGridsWithEmptyDataStore(){
		var tempArr = [];
		userCredsGridStore.loadData(tempArr);
		snmpCredsGridStore.loadData(tempArr);
		memberGridStore.loadData(tempArr);
	}
	
	function checkActiveProtocol(){
		if(isSMBActive == true){
			document.getElementById("SMBChkbxId").checked = true;
		}else{
			document.getElementById("SMBChkbxId").checked = false;
		}
		if(isSSHActive == true){
			document.getElementById("SSHChkbxId").checked = true;
		}else{
			document.getElementById("SSHChkbxId").checked = false;
		}
		if(isSNMPActive == true){
			document.getElementById("SNMPChkbxId").checked = true;
		}else{
			document.getElementById("SNMPChkbxId").checked = false;
		}
		if(isVMWAREActive == true){
			document.getElementById("VMWAREChkbxId").checked = true;
		}else{
			document.getElementById("VMWAREChkbxId").checked = false;
		}
		if(isHYPERVActive == true){
			document.getElementById("HYPERVChkbxId").checked = true;
		}else{
			document.getElementById("HYPERVChkbxId").checked = false;
		}
	}
	
	function showProtocolsNCreds(){
		try{
			if(typeof(protocolConfigJSON) != 'undefined' && protocolConfigJSON != null && protocolConfigJSON != ''){
				protocolConfigJSON = protocolConfigJSON.replace(/\\/gi, '\\\\');
				var protocolObj = JSON.parse(protocolConfigJSON);
				if(typeof(protocolObj.Values) != 'undefined' && protocolObj.Values != null ){
					var protocolLen = protocolObj.Values.length;
					var i = 0;
					for(i = 0; i < protocolLen; i++){
						separateCredsNProtocol(protocolObj.Values[i]);
					}
				}
			}
		}catch (e){}
	}
	
	function separateCredsNProtocol(protObj){
		if(typeof(protObj) != 'undefined' && protObj != null){
			if(typeof(protObj.EnumValue) != 'undefined' && protObj.EnumValue != null && protObj.EnumValue != ''){
				if(protObj.EnumValue == 'SMB'){
					if(protObj.IsActive == true){
						isSMBActive = true;
					}else{
						isSMBActive = false;
					}
					SMBProtocolArr = JSON.parse(createCredsArr(protObj.AdminLogin));
					
				}else if(protObj.EnumValue == 'SSH'){
					if(protObj.IsActive == true){
						isSSHActive = true;
					}else{
						isSSHActive = false;
					}
					SSHProtocolArr = JSON.parse(createCredsArr(protObj.AdminLogin));
					
				}else if(protObj.EnumValue == 'SNMP'){
					if(protObj.IsActive == true){
						isSNMPActive = true;
					}else{
						isSNMPActive = false;
					}
					SNMPProtocolArr = JSON.parse(CreateSNMPCredsArr(protObj.AdminLogin));
					snmpCredsGridStore.loadData(SNMPProtocolArr);
				}else if(protObj.EnumValue == 'VMWARE'){
					if(protObj.IsActive == true){
						isVMWAREActive = true;
					}else{
						isVMWAREActive = false;
					}
					VMWAREProtocolArr = JSON.parse(createCredsArr(protObj.AdminLogin));
					
				}else if(protObj.EnumValue == 'HYPERV'){
					if(protObj.IsActive == true){
						isHYPERVActive = true;
					}else{
						isHYPERVActive = false;
					}
					HYPERVProtocolArr = JSON.parse(createCredsArr(protObj.AdminLogin));
					
				}
			}
		}
	}
	
	function createCredsArr(credsString){
		var separateCreds = credsString.split(';');
		var credsArr = '[';
		var i;
		if(typeof(separateCreds) != 'undefined' && separateCreds != null && separateCreds.length > 0){
			for(i = 0; i < (separateCreds.length - 1); i++){
				var userNameNPass = separateCreds[i].split(':');
				if(typeof(userNameNPass) != 'undefined' && userNameNPass != null && userNameNPass.length > 0){
					credsArr = credsArr + '{"userName": ' + '"' + userNameNPass[0] + '", "splChars": "********", "password": ' + '"' + userNameNPass[1] + '"}';
				}
				if(i < (separateCreds.length - 2)){
					credsArr = credsArr + ','
				}
			}
		}
		credsArr = credsArr + ']';
		return credsArr;
	}
	
	function CreateSNMPCredsArr(credsString){
		var separateCreds = credsString.split(';');
		var CredsArr = '[';
		var i;
		if(typeof(separateCreds) != 'undefined' && separateCreds != null && separateCreds.length > 0){
			for(i = 0; i < (separateCreds.length); i++){
				if(separateCreds[i] != ""){
					CredsArr = CredsArr + '{';
					var creds = separateCreds[i].split('~');
					var j;
					if(typeof(creds) != 'undefined' && creds != null && creds.length > 0){
						for(j = 0; j < creds.length; j++){
							var credsComp = creds[j].split(SNMP_ATTR_SEPERATOR_PE);
							if(typeof(credsComp) != 'undefined' && credsComp != null && credsComp.length > 0){
								CredsArr = CredsArr + '"' + credsComp[0] + '": "' + credsComp[1] + '"';
							}
							if(j < (creds.length - 1)){
								CredsArr = CredsArr + ',';
							}
						}
					}
					CredsArr = CredsArr + ', "splChars": "********"}';
					if(i < (separateCreds.length - 1)){
						CredsArr = CredsArr + ',';
					}
				}
			}
		}
		CredsArr = CredsArr + ']';
		return CredsArr;
	}
	
	function showTargetList(){
		if(typeof(memberListJSON) != 'undefined' && memberListJSON != null && memberListJSON != ''){
			var memberLstJson = JSON.parse(memberListJSON);
			if(typeof(memberLstJson.Values) != 'undefined' && memberLstJson.Values != null )
				memberGridStore.loadData(memberLstJson.Values);
		}
	}
	
	function initializeScanConfigPage(){
		hideLoadingMask();
		if(exceptionMsg == '' || exceptionMsg == '-1111'){
			CreateToolbar();
			EnableFrequency(ScheduleType);
			OnStopChange(StopType);
			// Create Schedule UI
			CreateScanSchedule ();
			// Create and render Scanner Device Grid
			createRefreshDiv();
			CreateScanDeviceGrid();
			pushDataInScannerGrid();

			// Create and protocal Grid
			createProtocolGrid();

			// Create and Protocol users credentails Grid
			createUserCredsLstLbl();
			createUserCredsGrid();
			createSNMPCredsGrid();
			
			// Create and render Target Grid
			createTargetLstLbl();
			createMemberGrid() ;
			updateDateIcon();
			hideSNMPgrid();
			var scannerListArr = scannerDevicesGridStore.getRange();
			//add check for scanner array size.
			if(typeof(scannerListArr) != 'undefined' && scannerListArr != null && scannerListArr.length > 0 && typeof(lastSelectedIndex) != 'undefined' && lastSelectedIndex != null){
				scannerDevicesGrid.getView().select(lastSelectedIndex);
				//call fetch scanner info.
				var currentSelScanner = scannerDevicesGrid.getSelectionModel().getSelection();
				if(typeof(currentSelScanner) != 'undefined' && currentSelScanner != null){
					scannerInfoToFetchScan = JSON.stringify(currentSelScanner[0].data);
					clearGridDataNLabels();
					showLoadingMask();
					enableOrDisableSaveNRefresh(false);
					getScannerInfo(scannerInfoToFetchScan);
				}
				
			}
			
			if(ScannerDeviceListJSON == undefined || ScannerDeviceListJSON == null || ScannerDeviceListJSON == ''){
				var scanDiv = document.getElementById("bottomDiv");
				if(scanDiv != undefined && scanDiv != null){
					scanDiv.style.visibility ='hidden';
					var CMDBDisc_Settings = document.getElementById("CMDBDisc_Settings");
					if(CMDBDisc_Settings)
						CMDBDisc_Settings.style.overflowY='hidden';
					
				}

			}
			getscannerStatusNLastStatusUpdate();
			setTimeout(function(){
				var intervalID = setInterval(function(){autoRefreshScanners();}, 300000);
				autoRefreshScanners();
			}, 60000);
		}else{
			errorWhileFirstLoad = exceptionMsg;
			document.getElementById('step1').style.display = 'none';
			document.getElementById('bottomDiv').style.display = 'none';
			showLightningPopup('toast',lblErrorTitle,exceptionMsg,'','','','','error',exceptionMsg);
		}
		isDirty = false;
		document.getElementById('bottomDiv').style.display = 'none';
		
		
	}

	
	// Protocol grid functions
		
	function createProtocolGrid(){
		
		var protocolFields = ['checkBoxFld', 'protocols'];
		var protocolColumns = [
			{text: lblProtocolChbxHdr,  dataIndex: 'checkBoxFld', hidden: false, sortable: false, hideable: false, width: '60',flex: 1},
			{text: lblProtocolHdr, dataIndex: 'protocols', hidden: false, sortable: false, hideable: false, flex: 8}
		];


		if(userLanguage == 'iw'){
			protocolFields.reverse();
			protocolColumns.reverse();
		}

		var WMICHBX = '<div class="slds-form-element"><div class="slds-form-element__control"><div class="slds-checkbox"><input type="checkbox" id="SMBChkbxId" value="SMB" checked="" onclick="event.stopPropagation();setDirtyFlag();"/><label class="slds-checkbox__label" for="SMBChkbxId"><span class="slds-checkbox_faux" onclick="event.stopPropagation();"></span><span class="slds-form-element__label"></span></label></div></div></div>';
		var UNIXCHBX = '<div class="slds-form-element"><div class="slds-form-element__control"><div class="slds-checkbox"><input type="checkbox" id="SSHChkbxId" value="SSH" checked="" onclick="event.stopPropagation();setDirtyFlag();"/><label class="slds-checkbox__label" for="SSHChkbxId"><span class="slds-checkbox_faux" onclick="event.stopPropagation();"></span><span class="slds-form-element__label"></span></label></div></div></div>';
		var SNMPCHBX = '<div class="slds-form-element"><div class="slds-form-element__control"><div class="slds-checkbox"><input type="checkbox" id="SNMPChkbxId" value="SNMP" checked="" onclick="event.stopPropagation();setDirtyFlag();"/><label class="slds-checkbox__label" for="SNMPChkbxId"><span class="slds-checkbox_faux" onclick="event.stopPropagation();"></span><span class="slds-form-element__label"></span></label></div></div></div>';
		var SoapCHBX = '<div class="slds-form-element"><div class="slds-form-element__control"><div class="slds-checkbox"><input type="checkbox" id="VMWAREChkbxId" value="VMWARE" checked="" onclick="event.stopPropagation();setDirtyFlag();"/><label class="slds-checkbox__label" for="VMWAREChkbxId"><span class="slds-checkbox_faux" onclick="event.stopPropagation();"></span><span class="slds-form-element__label"></span></label></div></div></div>';
		var VVMCHBX = '<div class="slds-form-element"><div class="slds-form-element__control"><div class="slds-checkbox"><input type="checkbox" id="HYPERVChkbxId" value="HYPERV" checked="" onclick="event.stopPropagation();setDirtyFlag();"/><label class="slds-checkbox__label" for="HYPERVChkbxId"><span class="slds-checkbox_faux" onclick="event.stopPropagation();"></span><span class="slds-form-element__label"></span></label></div></div></div>';

		
		protocolGridDataModel = Ext.define('protocolLst', {
			extend: 'Ext.data.Model',
			fields: [
				{name: 'checkBoxFld',  type: 'string'},
				{name: 'protocols',   type: 'string'}
			]
		});
		
		protocolGridStore = Ext.create('Ext.data.Store', {
			storeId:'protocolsGridStoreId',
			fields: protocolFields,
			data: [
				   {'checkBoxFld': WMICHBX,   'protocols': lblSMBProtocol},
				   {'checkBoxFld': UNIXCHBX,  'protocols': lblSSHProtocol},
				   {'checkBoxFld': SNMPCHBX,  'protocols': lblSNMPProtocol},
				   {'checkBoxFld': SoapCHBX,  'protocols': lblVMWAREProtocol},
				   {'checkBoxFld': VVMCHBX,   'protocols': lblHyperVProtocol}
			]
		});
		
		protocolGrid = Ext.create('Ext.grid.Panel', {
			store: protocolGridStore,
			columns: protocolColumns,
			id: 'protocolsGridId',
			height: 180,
			scroll: false,
			header: false,
			renderTo: protocolGridDiv,
			forceFit : true,
			emptyText : lblMsgNoRecordFound,
			listeners: {
				afterrender : function(){
					changeGridDirectionForRTL('protocolsGridId-body');
				},
				itemclick: function(dv, record, item, index, e){
					var currentSelectedProtocol = record.data.protocols;
					if(typeof(currentSelectedProtocol) != 'undefined' && currentSelectedProtocol != null && currentSelectedProtocol != ''){
						var addUserCredsBtn = Ext.getCmp('addUserCredsBtnId');
						var addSNMPCredsBtn = Ext.getCmp('addSNMPCredsBtnId');
						Ext.getCmp('editUserCredsBtnId').setDisabled(true);
						Ext.getCmp('deleteUserCredsBtnId').setDisabled(true); 
						Ext.getCmp('deleteSNMPCredsBtnId').setDisabled(true);
						var snmpCredsToolbar=Ext.getCmp('snmpCredsToolbarId');
						var userCredsToolbar=Ext.getCmp('userCredsToolbarId');
						if(currentSelectedProtocol.indexOf(lblSMBProtocol) != -1){
							snmpCredsGrid.hide();
							snmpCredsToolbar.hide();
							userCredsGrid.show();
							userCredsToolbar.show();
							currentSelProtocol = currentSelectedProtocol;
							createUserCredsLstLbl();
							userCredsGridStore.loadData(SMBProtocolArr);
							var wmiChbx = document.getElementById('SMBChkbxId');
							if(typeof(wmiChbx) != 'undefined' && wmiChbx != null && wmiChbx.checked == true){
								addUserCredsBtn.setDisabled(false);
							}else{
								addUserCredsBtn.setDisabled(true);
							}
						}else if(currentSelectedProtocol.indexOf(lblSSHProtocol) != -1){
							snmpCredsGrid.hide();
							snmpCredsToolbar.hide();
							userCredsGrid.show();
							userCredsToolbar.show();
							currentSelProtocol = currentSelectedProtocol;
							createUserCredsLstLbl();
							userCredsGridStore.loadData(SSHProtocolArr);
							var unixChbx = document.getElementById('SSHChkbxId');
							if(typeof(unixChbx) != 'undefined' && unixChbx != null && unixChbx.checked == true){
								addUserCredsBtn.setDisabled(false);
							}else{
								addUserCredsBtn.setDisabled(true);
							}
						}else if(currentSelectedProtocol.indexOf(lblSNMPProtocol) != -1){
							userCredsGrid.hide();
							userCredsToolbar.hide();
							snmpCredsGrid.show();
							snmpCredsToolbar.show();
							currentSelProtocol = currentSelectedProtocol;
							createUserCredsLstLbl();
							snmpCredsGridStore.loadData(SNMPProtocolArr);
							var snmpChbx = document.getElementById('SNMPChkbxId');
							if(typeof(snmpChbx) != 'undefined' && snmpChbx != null && snmpChbx.checked == true){
								addSNMPCredsBtn.setDisabled(false);
							}else{
								addSNMPCredsBtn.setDisabled(true);
							}
						}else if(currentSelectedProtocol.indexOf(lblVMWAREProtocol) != -1){
							snmpCredsGrid.hide();
							snmpCredsToolbar.hide();
							userCredsGrid.show();
							userCredsToolbar.show();
							currentSelProtocol = currentSelectedProtocol;
							createUserCredsLstLbl();
							userCredsGridStore.loadData(VMWAREProtocolArr);
							var soapChbx = document.getElementById('VMWAREChkbxId');
							if(typeof(soapChbx) != 'undefined' && soapChbx != null && soapChbx.checked == true){
								addUserCredsBtn.setDisabled(false);
							}else{
								addUserCredsBtn.setDisabled(true);
							}
						}else if(currentSelectedProtocol.indexOf(lblHyperVProtocol) != -1){
							snmpCredsGrid.hide();
							snmpCredsToolbar.hide();
							userCredsGrid.show();
							userCredsToolbar.show();
							currentSelProtocol = currentSelectedProtocol;
							createUserCredsLstLbl();
							userCredsGridStore.loadData(HYPERVProtocolArr);
							var vvmChbx = document.getElementById('HYPERVChkbxId');
							if(typeof(vvmChbx) != 'undefined' && vvmChbx != null && vvmChbx.checked == true){
								addUserCredsBtn.setDisabled(false);
							}else{
								addUserCredsBtn.setDisabled(true);
							}
						}
					}
				},
				viewready: function(pGrid, l,e ){
					if(ScannerDeviceListJSON != undefined && ScannerDeviceListJSON != null && ScannerDeviceListJSON != ''){
						checkActiveProtocol();
						scannerDevicesGrid.getView().select(0);
						var firstRowData =scannerDevicesGrid.getStore().getAt(0);
						if(typeof(document.getElementById(scannerNameCmp)) != 'undefined' && document.getElementById(scannerNameCmp) != null){
							if(document.getElementById(scannerNameCmp).innerText){
								document.getElementById(scannerNameCmp).innerText = firstRowData.data.ObjectName;	
							}else{
								document.getElementById(scannerNameCmp).textContent = firstRowData.data.ObjectName;
							}
						}
					}
				}
			}
		});
	}
	
	
	// User credential grid functions 

	function createUserCredsLstLbl(){
		var userCredsHdrDiv = Ext.getCmp('userCredsHeaderDiv');
		var snmpCredsHeaderDiv = Ext.getCmp('snmpCredsHeaderDiv'); 


		if(userCredsHdrDiv){
			userCredsHdrDiv.setText(lblCredentialsFor + ': ' + currentSelProtocol);
		}

		if(snmpCredsHeaderDiv){
			snmpCredsHeaderDiv.setText(lblCredentialsFor + ': ' + currentSelProtocol);
		}
	}

	function createUserCredsGrid(){
		
		var useGridColumns = [
			{text: lblLogIn,  dataIndex: 'userName', hidden: false, sortable: false, hideable: false},
			{text: lblPassword, dataIndex: 'splChars', hidden: false, sortable: false, hideable: false},
			{text: 'ActualPassword', dataIndex: 'password', hidden: true, sortable: false, hideable: false}
		];
		var useGridfields = ['userName', 'splChars', 'password'];

		if(userLanguage == 'iw'){
			useGridColumns.reverse();
			useGridfields.reverse();
		}

		userCredsGridDataModel = Ext.define('userCredsLst', {
			extend: 'Ext.data.Model',
			fields: [
				{name: 'userName',  type: 'string'},
				{name: 'splChars',   type: 'string'},
				{name: 'password',   type: 'string'}
			]
		});
		
		userCredsGridStore = Ext.create('Ext.data.Store', {
			storeId:'userCredsGridStoreId',
			fields:useGridfields
		});

		var userCredsToolBar = [{
			xtype: 'label',
			id: 'userCredsHeaderDiv',
			text: lblCredentialsFor + ': ',
			width:browserZoomLevel > 1.25 ? 290:500,
			height: 'auto',
			style: 'overflow-wrap:break-word;',
			margin: '0 0 0 0'
		},'->',{
			xtype: 'button',
			id: 'addUserCredsBtnId',
			cls: 'rfButtonCls helix-paddingForBtn slds-button  slds-button_neutral',
			disabledCls : 'helix-slds-button-disabled',
			height:32,
			text:'+ '+lblAddtooltip,
			tooltip: lblAddtooltip,
			tooltipType : 'title',
			scale : 'medium',
			disabled : true,
			handler: function() {
				currentSelUserName = '';
				editingUserCreds = false;
				inputUserCreds();
			}
		   },{xtype: 'tbspacer',width :5},{
			   xtype: 'button',
			   id: 'editUserCredsBtnId',
			   cls: 'rfButtonCls helix-paddingForBtn slds-button  slds-button_neutral',
			   disabledCls : 'helix-slds-button-disabled',
			   height:32,
			   text:lblEdittooltip,
			   tooltip: lblEdittooltip,
			   tooltipType : 'title',
			   scale : 'medium',
			   tooltip: lblEdittooltip,
			   tooltipType : 'title',
			   disabled : true,
			   handler: function() {
				   var currentSelRow = Ext.getCmp('userCredsGridId').getSelectionModel().getSelection();
				   if(typeof(currentSelRow) != 'undefined' && currentSelRow != null){
						currentSelUserName = currentSelRow[0].data.userName;
						editingUserCreds = true;
						inputUserCreds();
				   }
			   }
		   },{
			   xtype: 'button',
			   id: 'deleteUserCredsBtnId',
			   cls: 'rfButtonCls helix-paddingForBtn slds-button  slds-button_neutral',
			   disabledCls : 'helix-slds-button-disabled',
			   height:32,
			   text:deleteToolTip,
			   tooltip: deleteToolTip,
			   tooltipType : 'title',
			   scale : 'medium',
			   tooltip: deleteToolTip,
			   tooltipType : 'title',
			   disabled : true,
			   handler: function() {
				   var currentSelRow = Ext.getCmp('userCredsGridId').getSelectionModel().getSelection();
				   var GridStore = Ext.getCmp('userCredsGridId').getStore();
				   GridStore.remove(currentSelRow);
				   Ext.getCmp('editUserCredsBtnId').setDisabled(true);
				   Ext.getCmp('deleteUserCredsBtnId').setDisabled(true);
				   setDirtyFlag();
				   if(mapScanConfigErrors)
						mapScanConfigErrors.clear();
						
				   updateTheCredsArray();
			   }
		}];

		if(userLanguage == 'iw'){
			userCredsToolBar.reverse();
		}

		 Ext.create('Ext.toolbar.Toolbar', {
			margins: '0 0 5 0',
			renderTo: 'userCredsToolbarDiv',
			id:'userCredsToolbarId',
			items: userCredsToolBar
		});
		userCredsGrid = Ext.create('Ext.grid.Panel', {
			store: userCredsGridStore,
			columns: useGridColumns,
			id: 'userCredsGridId',
			height: 180,
			margin:'0 0 0 0',
			renderTo: 'userCredsGridDiv',
			forceFit : true,
			layout: 'fit',
			emptyText : lblMsgNoRecordFound,
			viewConfig: {
				forceFit : true,
				markDirty:false
			},
			
			listeners: {
				itemclick: function(dv, record, item, index, e){
					var editBtn = Ext.getCmp('editUserCredsBtnId');
					var delBtn = Ext.getCmp('deleteUserCredsBtnId'); 
					if(typeof(editBtn) != 'undefined' && editBtn != null && typeof(delBtn) != 'undefined' && delBtn != null){
						var selectedProtocolRow = protocolGrid.getSelectionModel().getSelection();
						var selectedProtocol = selectedProtocolRow[0].data.protocols;
						if(typeof(selectedProtocol) != 'undefined' && selectedProtocol != null && selectedProtocol != ''){
							if(selectedProtocol.indexOf(lblSMBProtocol) != -1){	
								var wmiChbx = document.getElementById('SMBChkbxId');
								if(typeof(wmiChbx) != 'undefined' && wmiChbx != null && wmiChbx.checked == true){
									editBtn.setDisabled(false);
									delBtn.setDisabled(false);
								}
							}else if(selectedProtocol.indexOf(lblSSHProtocol) != -1){	
								var unixChbx = document.getElementById('SSHChkbxId');
								if(typeof(unixChbx) != 'undefined' && unixChbx != null && unixChbx.checked == true){
									editBtn.setDisabled(false);
									delBtn.setDisabled(false);
								}
							}else if(selectedProtocol.indexOf(lblVMWAREProtocol) != -1){	
								var soapChbx = document.getElementById('VMWAREChkbxId');
								if(typeof(soapChbx) != 'undefined' && soapChbx != null && soapChbx.checked == true){
									editBtn.setDisabled(false);
									delBtn.setDisabled(false);
								}
							}else if(selectedProtocol.indexOf(lblHyperVProtocol) != -1){	
								var vvmChbx = document.getElementById('HYPERVChkbxId');
								if(typeof(vvmChbx) != 'undefined' && vvmChbx != null && vvmChbx.checked == true){
									editBtn.setDisabled(false);
									delBtn.setDisabled(false);
								}
							}
						}
					}
				},
				itemdblclick: function(dv, record, item, index, e){
					var currentSelectedProtocolRow = protocolGrid.getSelectionModel().getSelection();
					var selectedProtocol = currentSelectedProtocolRow[0].data.protocols;
					if(typeof(selectedProtocol) != 'undefined' && selectedProtocol != null && selectedProtocol != ''){
						if(selectedProtocol.indexOf(lblSMBProtocol) != -1){	
							var wmiChbx = document.getElementById('SMBChkbxId');
							if(typeof(wmiChbx) != 'undefined' && wmiChbx != null && wmiChbx.checked == true){
								var currentSelRow = Ext.getCmp('userCredsGridId').getSelectionModel().getSelection();
								currentSelUserName = currentSelRow[0].data.userName;
								editingUserCreds = true;
								inputUserCreds();
							}
						}else if(selectedProtocol.indexOf(lblSSHProtocol) != -1){	
							var unixChbx = document.getElementById('SSHChkbxId');
							if(typeof(unixChbx) != 'undefined' && unixChbx != null && unixChbx.checked == true){
								var currentSelRow = Ext.getCmp('userCredsGridId').getSelectionModel().getSelection();
								currentSelUserName = currentSelRow[0].data.userName;
								editingUserCreds = true;
								inputUserCreds();
							}
						}else if(selectedProtocol.indexOf(lblVMWAREProtocol)!= -1){	
							var soapChbx = document.getElementById('VMWAREChkbxId');
							if(typeof(soapChbx) != 'undefined' && soapChbx != null && soapChbx.checked == true){
								var currentSelRow = Ext.getCmp('userCredsGridId').getSelectionModel().getSelection();
								currentSelUserName = currentSelRow[0].data.userName;
								editingUserCreds = true;
								inputUserCreds();
							}
						}else if(selectedProtocol.indexOf(lblHyperVProtocol) != -1){	
							var vvmChbx = document.getElementById('HYPERVChkbxId');
							if(typeof(vvmChbx) != 'undefined' && vvmChbx != null && vvmChbx.checked == true){
								var currentSelRow = Ext.getCmp('userCredsGridId').getSelectionModel().getSelection();
								currentSelUserName = currentSelRow[0].data.userName;
								editingUserCreds = true;
								inputUserCreds();
							}
						}
						
					}
				}
			}
		});
	}


	function inputUserCreds(){
		var userCredsInputWindow = Ext.getCmp('userCredsInpWinId');
		if(typeof(userCredsInputWindow) != 'undefined' && userCredsInputWindow != null){
			userCredsInputWindow.close();
		}
		Ext.create('Ext.window.Window',{
			title: lblAddUserCredentials,
			id: 'userCredsInpWinId',
			height: 380,
			width: 550,
			modal : true,
			bodyPadding : 20,
			layout: {
				type: 'vbox',
				align: 'center'
			},
			buttons: [{text: lblCancel,
			height: 30,
				baseCls : 'slds-button slds-button_neutral',
				handler: function(){
					Ext.getCmp('userCredsInpWinId').close();
				}
		},
		{text: lblSave,
			height: 30,
				tooltip: lblSave,
				tooltipType : 'title',
				baseCls : 'credsSaveCls slds-button slds-button_brand',
				handler: function(){
					userNameVal = Ext.getCmp('userNameFldId').getValue().trim();
					psswrdVal = Ext.getCmp('passwordFldId').getValue().trim();
					var confrmPsswrdVal = Ext.getCmp('cnfrmPasswordFldId').getValue().trim();
					if(typeof(userNameVal) != 'undefined' && userNameVal != null && userNameVal != ''){
						
						if(!isValidUserName(userNameVal)){
							showLightningPopup('toast',lblErrorTitle,lblErrorUsername,'','','','','error');
							return 0;							
						}						
						
						if((typeof(psswrdVal) != 'undefined' && psswrdVal != null && psswrdVal != '') && (typeof(confrmPsswrdVal) != 'undefined' && confrmPsswrdVal != null && confrmPsswrdVal != '')){
							if(psswrdVal == confrmPsswrdVal){
								setDirtyFlag();
								if(editingUserCreds == false){
									userCredsGridStore.add({userName: userNameVal, splChars: '********', password: psswrdVal});
									updateTheCredsArray();
								}else{
									var currentSelRow = Ext.getCmp('userCredsGridId').getSelectionModel().getSelection();
									currentSelRow[0].set('userName', userNameVal);
									currentSelRow[0].set('password', psswrdVal);
									updateTheCredsArray();
								}
								Ext.getCmp('userCredsInpWinId').close();
							}else{
								showLightningPopup('toast',lblErrorTitle,lblReenterSamePassword,'','','','','error');
							}
						}else if((typeof(psswrdVal) != 'undefined' && psswrdVal != null && psswrdVal != '' ) && (typeof(confrmPsswrdVal) == 'undefined' || confrmPsswrdVal == null || confrmPsswrdVal == '')){
							showLightningPopup('toast',lblErrorTitle,lblReenterSamePassword,'','','','','error');
						}else if((typeof(psswrdVal) == 'undefined' || psswrdVal == null || psswrdVal == '' ) && (typeof(confrmPsswrdVal) != 'undefined' && confrmPsswrdVal != null && confrmPsswrdVal != '' )){
							showLightningPopup('toast',lblErrorTitle,lblReenterSamePassword,'','','','','error');
						}else{
							
							showLightningPopup('modal',lblwarningTitle,lblNoPasswordConfirmation,lblNo,lblYes,'passwordConfirmAction','passwordConfirmAction');
						}
					}else{
						showLightningPopup('toast',lblErrorTitle,reqFieldMsg,'','','','','error');
				}
				}
			}],
			items: [{xtype: 'textfield',
				id: 'userNameFldId',
				height : 45,
				width : 510,
				name: 'userName',
				fieldLabel: lblLogIn,
				allowBlank: false,
				margin : '0 0 25 0',
				regex: /[a-zA-Z0-9]+/,
				fieldCls: 'slds-input',
				labelAlign:'top'
			},{xtype: 'textfield',
				id: 'passwordFldId',
				inputType: 'password',
				width: 510,
				height: 45,
				name: 'password',
				fieldLabel: lblPassword,
				allowBlank: true,
				margin : '10 0 25 0',
				fieldCls: 'slds-input',
				labelAlign:'top'
			},{xtype: 'textfield',
				id: 'cnfrmPasswordFldId',
				inputType: 'password',
				width: 510,
				height: 45,
				name: 'cnfrmPsswrd',
				fieldLabel: lblReenterPassword,
				allowBlank: true,
				margin : '5 0 25 0',
				fieldCls: 'slds-input',
				labelAlign:'top'
			}]
		}).show();
		
		if(currentSelUserName != '' && editingUserCreds == true){
			Ext.getCmp('userNameFldId').setValue(currentSelUserName);
		}
	}

	function isValidUserName(UserName){
		pattern = new RegExp();
		pattern.compile("^[^/:\"*?<>|]+$");

		var hasMatch = pattern.test(UserName); 
		return hasMatch;
	}

	function updateTheCredsArray(){
		var currentSelectedProtocolRow = protocolGrid.getSelectionModel().getSelection();
		var selectedProtocol = currentSelectedProtocolRow[0].data.protocols;
		if(typeof(selectedProtocol) != 'undefined' && selectedProtocol != null && selectedProtocol != ''){
			var credsModelArr = userCredsGridStore.getRange();
			var i = 0;
			if(selectedProtocol.indexOf(lblSMBProtocol) != -1){
				var wmiChbx = document.getElementById('SMBChkbxId');
				if(typeof(wmiChbx) != 'undefined' && wmiChbx != null && wmiChbx.checked == true){
					SMBProtocolArr = [];
					for(i = 0; i < (credsModelArr.length); i++){
						SMBProtocolArr.push(credsModelArr[i].data); 
					}
				}
			}else if(selectedProtocol.indexOf(lblSSHProtocol) != -1){
				var unixChbx = document.getElementById('SSHChkbxId');
				if(typeof(unixChbx) != 'undefined' && unixChbx != null && unixChbx.checked == true){
					SSHProtocolArr = [];
					for(i = 0; i < (credsModelArr.length); i++){
						SSHProtocolArr.push(credsModelArr[i].data); 
					}
				}
			}else if(selectedProtocol.indexOf(lblVMWAREProtocol) != -1){
				var soapChbx = document.getElementById('VMWAREChkbxId');
				if(typeof(soapChbx) != 'undefined' && soapChbx != null && soapChbx.checked == true){
					VMWAREProtocolArr = [];
					for(i = 0; i < (credsModelArr.length); i++){
						VMWAREProtocolArr.push(credsModelArr[i].data); 
					}
				}
			}else if(selectedProtocol.indexOf(lblHyperVProtocol) != -1){
				var vvmChbx = document.getElementById('HYPERVChkbxId');
				if(typeof(vvmChbx) != 'undefined' && vvmChbx != null && vvmChbx.checked == true){
					HYPERVProtocolArr = [];
					for(i = 0; i < (credsModelArr.length); i++){
						HYPERVProtocolArr.push(credsModelArr[i].data); 
					}
				}
			}
			
		}
	}

	//SNMP Credentials Grid Functions

	function createSNMPCredsGrid(){

		var snmpGridColumns=[
			{text: lblCommunity,  dataIndex: 'splChars', hidden: false, sortable: false, hideable: false},
			{text: lblCommunity,  dataIndex: 'community', hidden: true, sortable: false, hideable: false},
			{text: lblUSMUser, dataIndex: 'user', hidden: true, sortable: false, hideable: false},
			{text: lblAuthorizationAlgorithm, dataIndex: 'authalgo', hidden: true, sortable: false, hideable: false},
			{text: lblAuthorizationPassword,  dataIndex: 'authpass', hidden: true, sortable: false, hideable: false},
			{text: lblPrivacyAlgorithm, dataIndex: 'privacyalgo', hidden: true, sortable: false, hideable: false},
			{text: lblPrivacyPassword, dataIndex: 'privacypass', hidden: true, sortable: false, hideable: false},
			{text: 'snmpMapKey', dataIndex: 'snmpmapkey', hidden: true, sortable: false, hideable: false}
		];
		var snmpGridFields = ['splChars', 'community', 'user', 'authalgo', 'authpass', 'privacyalgo', 'privacypass','snmpmapkey'];

		if(userLanguage == 'iw'){
			snmpGridColumns.reverse();
			snmpGridFields.reverse();
		}

		snmpCredsGridDataModel = Ext.define('snmpCreds', {
			extend: 'Ext.data.Model',
			fields: [
			    {name: 'splChars',  type: 'string'},
				{name: 'community',  type: 'string'},
				{name: 'user',   type: 'string'},
				{name: 'authalgo',   type: 'string'},
				{name: 'authpass', type: 'string'},
				{name: 'privacyalgo', type: 'string'},
				{name: 'privacypass', type: 'string'},
				{name: 'snmpmapkey', type: 'string'}
			]
		});
		
		snmpCredsGridStore = Ext.create('Ext.data.Store', {
			storeId:'snmpCredsGridStoreId',
			fields: snmpGridFields 

		});
		

		var snmpToolbar = [
			{
				xtype: 'label',
				id: 'snmpCredsHeaderDiv',
				text: lblCredentialsFor + ': ',
				margin: '0 0 0 10',
				width: browserZoomLevel > 1.25 ? 340: 500,
			},'->', 
			{
				xtype: 'button',
				id: 'addSNMPCredsBtnId',
				text:'+ '+lblAddtooltip,
				baseCls: 'slds-button slds-button_neutral',
				height:32,
				scale : 'medium',
				tooltip: lblAddtooltip,
				tooltipType : 'title',
				disabled : true,
				handler: function() {
					inputSNMPCreds();
				}
			   },{
				   xtype: 'button',
				   id: 'deleteSNMPCredsBtnId',
				   iconCls: 'bmcDelete',
				   text:deleteToolTip,
				   baseCls: 'slds-button slds-button_neutral',
				   height:32,
				   tooltip: deleteToolTip,
				   tooltipType : 'title',
				   scale : 'medium',
				   disabled : true,
				   handler: function() {
					   var currentSelRow = Ext.getCmp('snmpCredsGridId').getSelectionModel().getSelection();
					   var GridStore = Ext.getCmp('snmpCredsGridId').getStore();
					   GridStore.remove(currentSelRow);
					   Ext.getCmp('deleteSNMPCredsBtnId').setDisabled(true);
					   setDirtyFlag();
					   updateTheSNMPCredsArray();
				   }
			   }
		];

		if(userLanguage == 'iw'){
			snmpToolbar.reverse();
		}

		Ext.create('Ext.toolbar.Toolbar', {
			margins: '0 0 5 0',
			autoWidth: true,
			renderTo: 'snmpCredsToolbarDiv',
			id:'snmpCredsToolbarId',
			items: snmpToolbar
		});
		snmpCredsGrid = Ext.create('Ext.grid.Panel', {
			store: snmpCredsGridStore,
			columns: snmpGridColumns,
			id: 'snmpCredsGridId',
			height: 180,
			renderTo: 'snmpCredsGridDiv',
			forceFit : true,
			emptyText : lblMsgNoRecordFound,
			viewConfig: {
				markDirty:false
			},
			
			listeners: {
				itemclick: function(dv, record, item, index, e){
					var snmpChbx = document.getElementById('SNMPChkbxId');
					if(typeof(snmpChbx) != 'undefined' && snmpChbx != null && snmpChbx.checked == true){
						Ext.getCmp('deleteSNMPCredsBtnId').setDisabled(false);
					}
				}
			}
		});
	}

	function inputSNMPCreds(){
		  var algoStore = Ext.create('Ext.data.Store', {
			  fields: ['value'],
			  data : [
				  {"value":""},
				  {"value":"MD5"},
				  {"value":"SHA1"}
			  ]
		  });
		  
		  var privacyAlgoStore = Ext.create('Ext.data.Store', {
			  fields: ['value'],
			  data : [
				  {"value":""},
				  {"value":"AES"},
				  {"value":"DES"}
			  ]
		  }); 
		  
		  var snmpCredsInputWindow = Ext.getCmp('snmpCredsInpWinId');
		  if(typeof(snmpCredsInputWindow) != 'undefined' && snmpCredsInputWindow != null){
			  snmpCredsInputWindow.close();
		  }
		  
		  Ext.create('Ext.window.Window',{
			  title: lblAddUserCredentials,
			  id: 'snmpCredsInpWinId',
			  height: 700,
			  width: 550,
			  modal : true,
			  layout: {
				  type: 'vbox',
				  align: 'center'
			  },
			  buttons: [{text: lblCancel,
			  height: 30,
			  baseCls : 'slds-button slds-button_neutral',
				handler: function(){
					  Ext.getCmp('snmpCredsInpWinId').close();
				}
			  },
			  {text: lblSave,
				height: 30,
				tooltip: lblSave,
				tooltipType : 'title',
				baseCls : 'slds-button slds-button_brand',
				handler: function(){
					  var communityVal = Ext.getCmp('communityFldId').getValue().trim();
					  var cnfrmCommVal = Ext.getCmp('cnfrmCommunityFldId').getValue().trim();
					  var userVal = Ext.getCmp('userFldId').getValue().trim();
					  var authAlgoVal = Ext.getCmp('authAlgoFldId').getValue();
					  var authPassVal = Ext.getCmp('authPassFldId').getValue().trim();
					  var privacyAlgoVal = Ext.getCmp('privacyAlgoFldId').getValue();
					  var privacyPassVal = Ext.getCmp('privacyPassFldId').getValue().trim();
					  if(typeof(communityVal) != 'undefined' && communityVal != null && communityVal != '' && typeof(cnfrmCommVal) != 'undefined' && cnfrmCommVal != null && cnfrmCommVal != ''){
						  if(communityVal  == cnfrmCommVal){
							  snmpCredsGridStore.add({splChars: '********', community: communityVal, user: userVal, authalgo: authAlgoVal, authpass: authPassVal, privacyalgo: privacyAlgoVal, privacypass: privacyPassVal});
							  Ext.getCmp('snmpCredsInpWinId').close();
							  setDirtyFlag();
							  updateTheSNMPCredsArray();
						  }else{
							showLightningPopup('toast',lblErrorTitle,lblCommunityConfirmationFailed,'','','','','error');
						  }
					  }else if((typeof(communityVal) != 'undefined' && communityVal != null && communityVal != '' ) && ( typeof(cnfrmCommVal) == 'undefined' || cnfrmCommVal == null || cnfrmCommVal == '')){
						showLightningPopup('toast',lblwarningTitle,lblConfirmCommunity,'','','','','warning');
					  }else if((typeof(communityVal) == 'undefined' || communityVal == null || communityVal == '' ) && (typeof(cnfrmCommVal) != 'undefined' && cnfrmCommVal != null)){
						showLightningPopup('toast',lblwarningTitle,lblEnterCommunityConfirm,'','','','','warning');
					  }else{
						showLightningPopup('toast',lblwarningTitle,lblEnterCommunity,'','','','','warning');
					  }
				}
			  }],
			  items: [{xtype: 'textfield',
				  id: 'communityFldId',
				  height : 45,
				  width : 510,
				  labelCls: 'snmplabelCls',
				  labelWidth : 180,
				  name: 'communityTxtFld',
				  fieldLabel: lblCommunity,
				  fieldCls: 'slds-input',
				  margin : '0 0 25 0',
				  allowBlank: false,
				  labelAlign:'top'
			  },{xtype: 'textfield',
				  id: 'cnfrmCommunityFldId',
				  height : 45,
				  width : 510,
				  labelCls: 'snmplabelCls',
				  labelWidth : 180,
				  name: 'cnfrmCommunityTxtFld',
				  fieldLabel: lblConfirmCommunity,
				  fieldCls: 'slds-input',
				  margin : '10 0 25 0',
				  allowBlank: false,
				  labelAlign:'top'
			  },{xtype: 'textfield',
				  id: 'userFldId',
				  width: 510,
				  height: 45,
				  labelCls: 'snmplabelCls',
				  labelWidth : 180,
				  name: 'userTxtFld',
				  fieldLabel: lblUSMUser,
				  fieldCls: 'slds-input',
				  margin : '10 0 25 0',
				  allowBlank: true,
				  labelAlign:'top'
			  },{xtype: 'combobox',
				  id: 'authAlgoFldId',
				  width: 510,
				  height: 45,
				  labelWidth : 180,
				  labelCls: 'snmplabelCls',
				  fieldLabel: lblAuthorizationAlgorithm,
				  margin : '10 0 25 0',
				  store: algoStore,
				  queryMode: 'local',
				  displayField: 'value',
				  valueField: 'value',
				  name: 'authAlgoTxtFld',
				  fieldCls: 'slds-input',
				  pickerAlign: picklistAlign,
				  editable: false,
				  labelAlign:'top'
			  },{xtype: 'textfield',
				  id: 'authPassFldId',
				  width: 510,
				  height: 45,
				  labelWidth : 180,
				  labelCls: 'snmplabelCls',
				  inputType: 'password',
				  fieldLabel: lblAuthorizationPassword,
				  fieldCls: 'slds-input',
				  margin : '10 0 25 0',
				  name: 'authPassTxtFld',
				  allowBlank: true,
				  labelAlign:'top'
			  },{xtype: 'combobox',
				  id: 'privacyAlgoFldId',
				  width: 510,
				  height: 45,
				  labelWidth : 180,
				  labelCls: 'snmplabelCls',
				  fieldLabel: lblPrivacyAlgorithm,
				  margin : '10 0 25 0',
				  name: 'privacyAlgoTxtFld',
				  store: privacyAlgoStore,
				  queryMode: 'local',
				  displayField: 'value',
				  valueField: 'value',
				  editable: false,
				  labelAlign:'top',
				  pickerAlign: picklistAlign,
			  },{xtype: 'textfield',
				  id: 'privacyPassFldId',
				  width: 510,
				  height: 45,
				  labelWidth : 180,
				  labelCls: 'snmplabelCls',
				  inputType: 'password',
				  fieldLabel: lblPrivacyPassword,
				  fieldCls: 'slds-input',
				  margin : '5 0 25 0',
				  name: 'privacyPassTxtFld',
				  allowBlank: true,
				  labelAlign:'top'
			  }]
		  }).show();
	}
	
	function updateTheSNMPCredsArray(){
		var credsModelArr = snmpCredsGridStore.getRange();
		var i = 0;
		SNMPProtocolArr = [];
		for(i = 0; i < (credsModelArr.length); i++){
			SNMPProtocolArr.push(credsModelArr[i].data); 
		}
	}

	// Target List Functions

	function createTargetLstLbl(){
		var targetLstLblDiv = document.getElementById("targetListLblDiv");
		
		if(typeof(targetLstLblDiv) == 'undefined' || targetLstLblDiv == null){
			return false;
		}
		
		if(targetLstLblDiv.hasChildNodes()){
			while (targetLstLblDiv.hasChildNodes()){
				targetLstLblDiv.removeChild(targetLstLblDiv.lastChild);
			}
		}
		var TargetLstLblEle = document.createElement('label');
		if(typeof(TargetLstLblEle) == 'undefined' || TargetLstLblEle == null){
			return false;
		}
		TargetLstLblEle.className="FieldLabels";
		TargetLstLblEle.style = 'font-weight: 500;color: #080707;font-size: 16px;';
		var TargetLstLblVal = document.createTextNode(lblTargetList);
		if(typeof(TargetLstLblVal) == 'undefined' || TargetLstLblVal == null){
			return false;
		}
		TargetLstLblEle.appendChild(TargetLstLblVal);
		targetLstLblDiv.appendChild(TargetLstLblEle);
		
		//Add target list description
		
		var targetLstDescLblDiv = document.getElementById("targetListDescLblDiv");
		if(typeof(targetLstDescLblDiv) == 'undefined' || targetLstDescLblDiv == null){
			return false;
		}
		if(targetLstDescLblDiv.hasChildNodes()){
			while (targetLstDescLblDiv.hasChildNodes()){
				targetLstDescLblDiv.removeChild(targetLstLblDiv.lastChild);
			}
		}
		var TargetLstDescLblEle = document.createElement('label');
		if(typeof(TargetLstDescLblEle) == 'undefined' || TargetLstDescLblEle == null){
			return false;
		}
		TargetLstDescLblEle.className="FieldInfoLabels";
		var TargetLstDescLblVal = document.createTextNode(lblTargetListDesc);
		if(typeof(TargetLstDescLblVal) == 'undefined' || TargetLstDescLblVal == null){
			return false;
		}
		TargetLstDescLblEle.appendChild(TargetLstDescLblVal);
		targetLstDescLblDiv.appendChild(TargetLstDescLblEle);
	}

	function createTargetListJSON(){
		var targetmembersLstObj = {};
		var membersGridDataArr = memberGridStore.getRange();
		var targetMembersArr = [];
		var i = 0;
		var targetMemberJSON;
		var currentSelScanner = scannerDevicesGrid.getSelectionModel().getSelection();
		
		if(membersGridDataArr.length == 0 && membersToDelete.length == 0){
			targetMemberJSON = '';
		}else{
			if(currentSelScanner[0].data.targetListId == ''){
				for(i = 0; i < membersGridDataArr.length; i++){
					var memberObj = {members: membersGridDataArr[i].data.ObjectName, excluded: membersGridDataArr[i].data.ExcludedMember};
					targetMembersArr.push(memberObj);
				}
				targetmembersLstObj = {targetMembers: targetMembersArr};
			}else{
				for(i = 0; i < membersGridDataArr.length; i++){
					var memberObj = {assignId: membersGridDataArr[i].data.AssignId, targetMembers:{members: membersGridDataArr[i].data.ObjectName, excluded: membersGridDataArr[i].data.ExcludedMember}};
					targetMembersArr.push(memberObj);
				}
				if(targetMembersArr.length == 0){
					targetmembersLstObj = {memberstoDeteleFromTL: membersToDelete};
				}else{
					targetmembersLstObj = {memberstoDeteleFromTL: membersToDelete, membersToAddInTL: {assignIds: targetMembersArr}};
				}
				
			}
			targetMemberJSON = JSON.stringify(targetmembersLstObj);
		}
		return targetMemberJSON;
	}
	
	
	function createMemberGrid(){
		
		var memberGridColumns = [
			{ text: 'AssignId',  dataIndex: 'AssignId', hidden: true, sortable: false, hideable: false},
			{ text: lblMembers, dataIndex: 'ObjectName', hidden: false, sortable: false, hideable: false},
			{ text: lblExcludedMembers, dataIndex: 'ExcludedMember', hidden: false, sortable: false, hideable: false},
			{ text: 'Is Group', dataIndex: 'IsGroup', hidden: true, sortable: false, hideable: false}
		];
		var memberGridFields = ['AssignId', 'ObjectName', 'ExcludedMember', 'IsGroup'];

		if(userLanguage == 'iw'){
			memberGridColumns.reverse();
			memberGridFields.reverse();
		}

		memberGridDataModel = Ext.define('memberLst', {
			extend: 'Ext.data.Model',
			fields: [
				{name: 'AssignId',  type: 'string'},
				{name: 'ObjectName',   type: 'string'},
				{name: 'ExcludedMember', type: 'string'},
				{name: 'IsGroup', type: 'boolean', defaultValue: false}
			]
		});
		
		memberGridStore = Ext.create('Ext.data.Store', {
			storeId:'memberGridStoreId',
			fields: memberGridFields,
			model: 'memberLst'
		});
		
		var memberGridToolBar = [{
			xtype: 'label',
			id:'lblTargetListId',
			text: lblTargetListDesc,
		},'->',{
			xtype: 'button',
			id: 'addMemberBtnId',
			iconCls: 'bmcAdd',
			text:'+ '+lblAddtooltip,
			cls: 'rfButtonCls slds-button  slds-button_neutral',
			disabledCls : 'helix-slds-button-disabled',
			height:32,
			tooltip: lblAddtooltip,
			tooltipType : 'title',
			scale : 'medium',
			handler: function() {
				currentSelIncMem = '';
				currentSelExcMem = '';
				editingMemberLst = false;
				inputMemberList();
			}
		   },{
			   xtype: 'button',
			   id: 'editMemberBtnId',
			   text:lblEdittooltip,
			   cls: 'rfButtonCls helix-paddingForBtn slds-button  slds-button_neutral',
			   disabledCls : 'helix-slds-button-disabled',
			   height:32,
			   tooltip: lblEdittooltip,
			   tooltipType : 'title',
			   scale : 'medium',
			   disabled : true,
			   handler: function() {
					var currentSelRow = Ext.getCmp('memberGridId').getSelectionModel().getSelection();
					if(typeof(currentSelRow) != 'undefined' && currentSelRow != null){
						currentSelIncMem = currentSelRow[0].data.ObjectName;
						currentSelExcMem = currentSelRow[0].data.ExcludedMember;
						editingMemberLst = true;
						inputMemberList();
					}

			   }
		   },{
			   xtype: 'button',
			   id: 'deleteMemberBtnId',
			   scale : 'medium',
			   text:deleteToolTip,
			   cls: 'rfButtonCls helix-paddingForBtn slds-button  slds-button_neutral',
			   disabledCls : 'helix-slds-button-disabled',
			   height:32,
			   tooltip: deleteToolTip,
			   tooltipType : 'title',
			   disabled : true,
			   handler: function() {
					var currentSelRow = Ext.getCmp('memberGridId').getSelectionModel().getSelection();
					if(typeof(currentSelRow) != 'undefined' && currentSelRow != null){
						if(currentSelRow[0].data.AssignId != ''){
							membersToDelete.push(currentSelRow[0].data.AssignId);
						}
						var GridStore = Ext.getCmp('memberGridId').getStore();
						GridStore.remove(currentSelRow);
						Ext.getCmp('editMemberBtnId').setDisabled(true);
						Ext.getCmp('deleteMemberBtnId').setDisabled(true);
						setDirtyFlag();
					}
				   
			   }
		   }];

		   if(userLanguage == 'iw'){
			memberGridToolBar.reverse();
		   }

		memberGrid = Ext.create('Ext.grid.Panel', {
			store: memberGridStore,
			columns: memberGridColumns,
			id: 'memberGridId',
			height: 200,
			renderTo: memeberGridDiv,
			forceFit : true,
			emptyText : lblMsgNoRecordFound,
			margin: '0 0 5 0',
			viewConfig: {
				markDirty:false
			},
			tbar: memberGridToolBar,
			listeners: {
				afterrender: function(){
					changeGridDirectionForRTL('memberGridId-body');
				},
				itemclick: function(dv, record, item, index, e){
					Ext.getCmp('editMemberBtnId').setDisabled(false);
					Ext.getCmp('deleteMemberBtnId').setDisabled(false);
				},
				itemdblclick: function(dv, record, item, index, e){
					var currentSelRow = Ext.getCmp('memberGridId').getSelectionModel().getSelection();
					if(typeof(currentSelRow) != 'undefined' && currentSelRow != null){
						currentSelIncMem = currentSelRow[0].data.ObjectName;
						currentSelExcMem = currentSelRow[0].data.ExcludedMember;
						editingMemberLst = true;
						inputMemberList();
					}
					
				}
			}
		});
	}

	function inputMemberList(){
		var targetListMembersInputWindow = Ext.getCmp('memberLstInpWinId');
		if(typeof(targetListMembersInputWindow) != 'undefined' && targetListMembersInputWindow != null){
			targetListMembersInputWindow.close();
		}
		
		Ext.create('Ext.window.Window', {
			title: lblAddTargetList,
			id: 'memberLstInpWinId',
			height: 400,
			width: 800,
			modal : true,
			bodyPadding : 10,			
			bbar: {height: 50,
				id: "targetListToolbar",
				border: false,
				items: ['->',{xtype: 'button',text: lblCancel,			
						height: 30,			
						baseCls :'memberListCancelCls slds-button slds-button_neutral',
							handler: function(){
								Ext.getCmp('memberLstInpWinId').close();
							}
						},
						{xtype: 'button',text: lblSave,
						height: 30,
							tooltip: lblSave,
							tooltipType : 'title',
							baseCls : 'memberListSaveCls slds-button slds-button_brand',
							handler: function(){
								inputMembersWindowSaveHandler();
							}
						}
					]
			},
			html: '<div id="instructionPanelParent" style="width:100%;height:15%;background-color: #f3f2f2;"><div id="instructionPanel" style="padding-top:1.5%"><span>'+instructionsLabel+'</span>&nbsp;&nbsp;&nbsp;<a id="showMoreLink" style="color: #006dcc;" src="" onclick="showhideInfoDiv()">'+showMoreLabel+'</a><img src="" class="MemberGridinfoIcon utilityIconClass" style="width: 20px;height: 20px;float: left;margin-right: 5px;"></div><div id="infoDiv" style="display: none; font-size:12px !important"><label>' + targetMembersGridInfoText + '</label></div><div  class="helpLinkDiv"><a id="hideLink" style="display:none;" src="" onclick="showhideInfoDiv()">'+hideLabel+'</a></div></div><table style="width: 100%;margin-top: 2%;"><tbody><tr style="width: 100%;"><td><label style="height: 100%;"> <span style="color:#c23934">*</span> '+ lblMembers +'</label></td></tr><tr style="width: 100%;height:75px"><td><textarea id="membersTextFld" title="'+ targetMembersTooltip +'" style="width: 100%;height: 100%;" onkeypress="pressEnter(event)" class="slds-input"></textarea></td></tr><tr ><td><div id="requiredWarningMsgDiv" style="height: 10%;display: none;"><label style="color: red">'+ reqFieldMsg +'</label></div></td></tr><tr><td><div id="incMemberMaxLengthDiv" style="height: 10%;display: none;"><label style="color: red">'+ incMemberMaxLengthError +'</label></div></td></tr><tr><td><div id="invalidIncludeMembers" style="display: none;"><label style="color: red">'+ invalidTargetMsg +'</label></div></td></tr><tr style="width: 100%;"><td><label style="height: 100%;">'+ lblExcludedMembers +'</label></td></tr><tr style="height:75px;width: 100%;"><td><textarea id="exclMembersTextFld" title="'+ excludedMembersTooltip +'" style="width: 100%;height: 100%;" onkeypress="pressEnter(event)" class="slds-input"></textarea></td></tr><tr style="height: 10%;"><td></td><td><div id="invalidExcludeMembers" style="display: none;"><label style="color: red">'+ invalidTargetMsg +'</label></div></td></tr><tr style="height: 10%;"></tr><tr><td><div id="execMemberMaxLengthDiv" style="height: 10%;display: none;"><label style="color: red">'+ excMemberMaxLengthError +'</label></div></td></tr></tbody></table>',
			overflowX : 'auto',
			overflowY : 'auto'
		}).show();
		
		if(currentSelIncMem != '' && editingMemberLst == true){
			document.getElementById('membersTextFld').value = currentSelIncMem;
		}
		if(currentSelExcMem != '' && editingMemberLst == true){
			document.getElementById('exclMembersTextFld').value = currentSelExcMem;
		}
		ShowOrHide = 0;
		
	}
	
	function inputMembersWindowSaveHandler(){
		var incMemberVal = '', excMemberVal = ''; 
		if(typeof(document.getElementById('membersTextFld')) != 'undefined' && document.getElementById('membersTextFld') != null ){
			incMemberVal = document.getElementById('membersTextFld').value.trim();
			if(incMemberVal.length > incMemberMaxLength){										
					document.getElementById("incMemberMaxLengthDiv").style.display="block";
					return 0;
			}
			else{
					document.getElementById("incMemberMaxLengthDiv").style.display="none";				
			}
			incMemberVal = incMemberVal.replace(/( )/gm,"");
			incMemberVal = incMemberVal.replace(/(\r\n|\n\r|\n|\r|\s)/gm,",");
			incMemberVal = incMemberVal.replace(/,*,/gm,",");
			
		}
		
		if(typeof(document.getElementById('exclMembersTextFld')) != 'undefined' && document.getElementById('exclMembersTextFld') != null ){
			excMemberVal = document.getElementById('exclMembersTextFld').value.trim();
			if(excMemberVal.length > excMemberMaxLength){				
					document.getElementById("execMemberMaxLengthDiv").style.display="block";
					return 0;
			}
			else{
					document.getElementById("execMemberMaxLengthDiv").style.display="none";				
			}			
			excMemberVal = excMemberVal.replace(/( )/gm,"");
			excMemberVal = excMemberVal.replace(/(\r\n|\n\r|\n|\r|\s)/gm,",");
			excMemberVal = excMemberVal.replace(/,*,/gm,",");
		}
		
		if(typeof(incMemberVal) != 'undefined' && incMemberVal != null && incMemberVal != ''){
			if(!isValidTargetList(incMemberVal)){
				document.getElementById("invalidIncludeMembers").style.display="block";
				return 0;
			}else{
				document.getElementById("invalidIncludeMembers").style.display="none";
			}
		
			if(typeof(excMemberVal) != 'undefined' && excMemberVal != null && excMemberVal != '' && !isValidTargetList(excMemberVal)){
				document.getElementById("invalidExcludeMembers").style.display="block";
				return 0;
			}else{
				document.getElementById("invalidExcludeMembers").style.display="none";
			}
		
			setDirtyFlag();
			if(editingMemberLst == false){
				memberGridStore.add({ObjectName: incMemberVal, ExcludedMember: excMemberVal, IsGroup: false});
			}else{
				var currentSelRow = Ext.getCmp('memberGridId').getSelectionModel().getSelection();
				currentSelRow[0].set('ObjectName', incMemberVal);
				currentSelRow[0].set('ExcludedMember', excMemberVal);
			}
			Ext.getCmp('memberLstInpWinId').close();
		}else{
			document.getElementById("requiredWarningMsgDiv").style.display="block";
		}
	}
	
	function pressEnter(e){
		if(e.keyCode == 13 || e.which == 13 || e.charCode == 13){
			inputMembersWindowSaveHandler();
		}
	}
	
	function showhideInfoDiv(){
		var infoDivElem = document.getElementById('infoDiv');
		var targetListInputWin = Ext.getCmp('memberLstInpWinId');
		var instructionPanelParentDiv = document.getElementById('instructionPanelParent');
		var showMoreLink = document.getElementById('showMoreLink');
		var hideLink = document.getElementById('hideLink');
		var winWidth = targetListInputWin.getWidth();
		var winHeight = targetListInputWin.getHeight();
		if(ShowOrHide == 0){
			targetListInputWin.setSize((winWidth), (winHeight+180));
			infoDivElem.style.display="block";
			instructionPanelParentDiv.style.height = '45%';
			showMoreLink.style.display = "none";
			hideLink.style.display = "inline";
			ShowOrHide = 1;
		}else if(ShowOrHide == 1){
			targetListInputWin.setSize((winWidth), (winHeight-180));
			infoDivElem.style.display="none";
			instructionPanelParentDiv.style.height = '15%';
			showMoreLink.style.display = "inline";
			hideLink.style.display = "none";
			ShowOrHide = 0;
		}
	}
	
	function showMessage(msg){
		if(msg.toLowerCase().indexOf("unexpected end of file from server") != -1) //Salesforce Callout Exception
			msg = DiscoveryServerDownMsg;
		showLightningPopup('toast',lblwarningTitle,msg,'','','','','warning'); 		
	}
	
	function hideSNMPgrid(){
		var snmpCredsToolbar=Ext.getCmp('snmpCredsToolbarId');
		var userCredsToolbar=Ext.getCmp('userCredsToolbarId');
		snmpCredsGrid.hide();
		snmpCredsToolbar.hide();
		userCredsGrid.show();
		userCredsToolbar.show();
}

function CreateScanSchedule(){
		Ext.define('ScheduleModel', {
		extend: 'Ext.data.Model',
		fields: [
			{ name:'value', type:'string'},
			{ name:'label',type:'string'}
		]
		});           
		createFrequencySection();
		createDurationSection();
		OnFrequencyChange(frequencyType); 
		OnStartChange(StartType); 
	}
	function createFrequencySection(){
		var FrequencyStore = Ext.create('Ext.data.Store', {
			model: 'ScheduleModel',
			data:  FrequencyTypeJSON 
		   
		});
		
		if(document.getElementById('frequencyDiv') != null)
			freqTypeCombo = Ext.create('Ext.form.ComboBox', {
				id:'freqTypeCombo',
				store: FrequencyStore,
				queryMode: 'local',
				displayField: 'label',
				valueField: 'value',
				value:frequencyType,
				renderTo:'frequencyDiv',
				style: 'font: 13px Salesforce Sans,Arial,sans-serif',
				editable: false,
				forceSelection: true,
				width:160,
				pickerAlign:picklistAlign,
				listeners:{
					select: function(combo, record, index) {
						setDirtyFlag();
						frequencyType = combo.getValue();  
						OnFrequencyChange(combo.getValue());                
					}
			   }
			 
			}); 
		
		 var monDayInstStore = Ext.create('Ext.data.Store', {
			model: 'ScheduleModel',
			data:  monDayInstanceJSON
		   
		});
		if(scheduleInstance == 'undefined')
			scheduleInstance="1";
		if(document.getElementById('recMonDayInstance') != null)
			monDayInstCombo = Ext.create('Ext.form.ComboBox', {
				id:'monDayInstCombo',
				store: monDayInstStore,
				queryMode: 'local',
				displayField: 'label',
				valueField: 'value',
				value:scheduleInstance,
				renderTo:'recMonDayInstance',
				style: 'font: 13px Salesforce Sans,Arial,sans-serif',
				editable: false,
				forceSelection: true,
				pickerAlign:picklistAlign,
				width:52,
				listConfig:{
					maxWidth: 51
				},
				listeners:{
					select: function(combo, record, index) {
						setDirtyFlag();
						scheduleInstance = combo.getValue(); 
					}
			   }
			});
		var monDayOfWeekStore = Ext.create('Ext.data.Store', {
			model: 'ScheduleModel',
			data:  DayOfWeekListJSON
		   
		});
		if(scheduleInstanceDayOfMonth == 'undefined')
			scheduleInstanceDayOfMonth="1";
		if(document.getElementById('recMonDayOfWeek') != null)
			monDayOfWeekCombo = Ext.create('Ext.form.ComboBox', {
				id:'monDayOfWeekCombo',
				store: monDayOfWeekStore,
				queryMode: 'local',
				displayField: 'label',
				valueField: 'value',
				value:scheduleInstanceDayOfMonth,
				renderTo:'recMonDayOfWeek',
				style: 'font: 13px Salesforce Sans,Arial,sans-serif',
				editable: false,
				forceSelection: true,
				pickerAlign:picklistAlign,
				width:103,
				listConfig:{
					minWidth: 101
				},
				listeners:{
					select: function(combo, record, index) {
						setDirtyFlag();
						scheduleInstanceDayOfMonth = combo.getValue(); 
					}
			   }
			});
		var TimeFrameStore = Ext.create('Ext.data.Store', {
			model: 'ScheduleModel',
			data: AMPMListJSON
		});
		if(document.getElementById('TimeFrameDiv') != null)
			TimeFrameCombo = Ext.create('Ext.form.ComboBox', {
				id:'TimeFrameCombo',
				store: TimeFrameStore,
				queryMode: 'local',
				displayField: 'label',
				valueField: 'value',
				value:frqTimeFrame,
				renderTo:'TimeFrameDiv',
				style: 'font: 13px Salesforce Sans,Arial,sans-serif',
				editable: false,
				forceSelection: true,
				pickerAlign:picklistAlign,
				width:59,
				listConfig : {
					minWidth :45
				}, 
				listeners:{
					select: function(combo, record, index) {
						setDirtyFlag();
						frqTimeFrame = combo.getValue(); 
						OnFrequencyChange(combo.getValue());                
					}
			   }
			}); 

		if(document.getElementById('hourSpiner') != null) 
			HourSpiner =  Ext.create('Ext.form.NumberField',{
				id:'HrSpiner',
				allowNegative : false,
				allowDecimals: false,
				minValue: 1,
				maxValue: 12,
				value:frqTimeHrs,
				width:40,
				renderTo : 'hourSpiner',
				listeners:{
					change:function(obj, newValue, oldValue, eOpts){
						if(newValue > 12){
							obj.setValue(12);
						}else if(newValue < 1){
							obj.setValue(1);
						}
					setDirtyFlag();	
					frqTimeHrs=newValue;
				   }
				}
			});
		if(document.getElementById('minSpiner') != null)
			MinSpiner =  Ext.create('Ext.form.NumberField',{
				id:'MinuteSpiner',
				allowNegative : false,
				allowDecimals: false,
				minValue: 0,
				maxValue: 59,
				value:frqTimeMin,
				width:40,
				renderTo : 'minSpiner',
				listeners:{
					change:function(obj, newValue, oldValue, eOpts){
						if(newValue > 59){
							obj.setValue(59);
						}else if(newValue < 0 || newValue == null){
							obj.setValue(0);
						}
					setDirtyFlag();
					frqTimeMin=newValue;
				   }
				}
			});
		if(document.getElementById('scanCounter') != null)
			ScanCounter =  Ext.create('Ext.form.NumberField',{
				id:'scancountSpiner',
				allowNegative : false,
				allowDecimals: false,
				minValue: 1,
				maxValue: 10,
				value:scanCount,
				width:50,
				renderTo : 'scanCounter',
				listeners:{
					change:function(obj, newValue, oldValue, eOpts){
					setDirtyFlag();
					scanCount=newValue;
				   }
				}
			});
	}
	function createDurationSection(){
		var StartDurationStore = Ext.create('Ext.data.Store', {
			model: 'ScheduleModel',
			data:  StartDurationJSON
		   
		});
		if(document.getElementById('StartDurationDiv') != null)
			StartDurationCombo = Ext.create('Ext.form.ComboBox', {
				id:'StartDurationId',
				store: StartDurationStore,
				queryMode: 'local',
				displayField: 'label',
				valueField: 'value',
				value:StartType,
				renderTo:'StartDurationDiv',
				style: 'font: 13px Salesforce Sans,Arial,sans-serif',
				editable: false,
				forceSelection: true,
				width:220,
				pickerAlign:picklistAlign,
				listeners:{
					select: function(combo, record, index) {
						setDirtyFlag();
						StartType=combo.getValue();
						OnStartChange(combo.getValue());
					}
			   }
			});
		var StopDurationStore = Ext.create('Ext.data.Store', {
			model: 'ScheduleModel',
			data:  StopDurationJSON
		   
		});
		if(document.getElementById('StopDurationDiv') != null)
			DurationListCombo = Ext.create('Ext.form.ComboBox', {
				id:'StopDurationId',
				store: StopDurationStore,
				queryMode: 'local',
				displayField: 'label',
				valueField: 'value',
				value:StopType,
				renderTo:'StopDurationDiv',
				style: 'font: 13px Salesforce Sans,Arial,sans-serif',
				editable: false,
				forceSelection: true,
				pickerAlign:picklistAlign,
				width:220,
				listeners:{
					select: function(combo, record, index) {
						setDirtyFlag();		
					  StopType=combo.getValue();
					  OnStopChange(combo.getValue());
					}
			   }
			});

	}

	function EnableFrequency(sType){
		var FreqencyTable = Ext.get("FreqencyTableId");
		var DurationTable = Ext.get("DurationTableId");
		if(FreqencyTable && DurationTable){
			FreqencyTable.unmask();			//to mask the schedule section properly as the height of the schedule section changes dynamically based on the type of recurrence selected.
			DurationTable.unmask();
			if(sType=='ONCE' || sType=='DISABLE'){
				FreqencyTable.mask();
				DurationTable.mask();
				var scanStartDateFldEle = document.getElementById(scanStartDateFld);
				var scanStopDateFldEle = document.getElementById(scanStopDateFld);
				if(scanStartDateFldEle)
						scanStartDateFldEle.value = '';
				if(scanStopDateFldEle)
						scanStopDateFldEle.value = '';
			}else{
				FreqencyTable.unmask();
				DurationTable.unmask();
			}
		}
	}
	 
	function onScheduleTypeClick(sTypeEle){
	   if(sTypeEle){
		ScheduleType = sTypeEle.value;

		if(document.getElementById('AdminCMDBDiscoveryProvision:mainform:hiddenScheduleField')){
			document.getElementById('AdminCMDBDiscoveryProvision:mainform:hiddenScheduleField').value = ScheduleType;
		}



		EnableFrequency(sTypeEle.value);
	   }
	}
	function OnFrequencyChange(fType){
		var weeklyTR = document.getElementById('weeklyTR');
		var weeklyTRLabel = document.getElementById('weeklyTRLabel');
		var monthlyTR=document.getElementById('monthlyTR');
		var monthlyTRLabel = document.getElementById('monthlyTRLabel');
		if(weeklyTR !=null && monthlyTR !=null){
			if(fType == 'DAILY'){
				weeklyTR.style.display="none";
				monthlyTR.style.display="none";
				weeklyTRLabel.style.display = "none";
				monthlyTRLabel.style.display = "none";
			}else if(fType == 'WEEKLY'){
				weeklyTR.style.display="table-cell";
				monthlyTR.style.display="none";
				weeklyTRLabel.style.display = "block";
				monthlyTRLabel.style.display = "none";
				setWeekDaysPanel ();
			}else if(fType == 'MONTHLY'){
				weeklyTR.style.display="none";
				monthlyTR.style.display="table-cell";
				weeklyTRLabel.style.display = "none";
				monthlyTRLabel.style.display = "block";
			}
		}
	}
	function OnStartChange(startItem){
	  var StartDate_Div =document.getElementById('StartDate_Div');
	  var EndDate_Div =document.getElementById('EndDate_Div');
	  var stopCombo=Ext.getCmp('DurationId');
	  if(StartDate_Div != null && EndDate_Div != null){
		if(startItem == 'NOW'){
			StartDate_Div.style.display="none";
			EndDate_Div.disabled =false;
			if(stopCombo)
				stopCombo.setDisabled(false);
		}else if( startItem == 'DISABLE'){
			StartDate_Div.style.display="none";
			EndDate_Div.disabled =true;
			if(stopCombo)
				stopCombo.setDisabled(true);
		}else if(startItem == 'SPECIFIEDDATE'){
			StartDate_Div.style.display="inline";
			EndDate_Div.disabled =false;
			if(stopCombo)
				stopCombo.setDisabled(false);
		}
	  }
	}
	function OnStopChange(stopItem){
	  var EndDate_Div =document.getElementById('EndDate_Div');
	  var ScanCount_Div =document.getElementById('ScanCount_Div');
	  if (EndDate_Div != null){
		if(stopItem == 'SPECIFIEDDATE' ){
			EndDate_Div.style.display="inline";
			ScanCount_Div.style.display="none";
		}else if(stopItem == 'NEVER'){
			EndDate_Div.style.display="none";
			ScanCount_Div.style.display="none";
		}else if(stopItem == 'RECURRENCECOUNT'){
			EndDate_Div.style.display="none";
			ScanCount_Div.style.display="inline";
		}
	   
	  }
	 
	}

	var dayOfWeekSchedule = '';
	
	function validateSchedule(){
		
		if(StartType != 'SPECIFIEDDATE'){
			if(typeof(document.getElementById(scanStartDateFld)) != 'undefined' && document.getElementById(scanStartDateFld) != null){
				document.getElementById(scanStartDateFld).value = '';
			}
		}
		
		if(StopType != 'SPECIFIEDDATE'){
			if(typeof(document.getElementById(scanStopDateFld)) != 'undefined' && document.getElementById(scanStopDateFld) != null){
				document.getElementById(scanStopDateFld).value = '';
			}
		}
		
		if(ScheduleType =='RECURRENCE' && frequencyType == 'WEEKLY'){
			setWeekDayVal ();
		
			if(scheduleDayOfWeek != ''){
					dayOfWeekSchedule = scheduleDayOfWeek.toString();
				}else{
					showLightningPopup('toast',lblErrorTitle,lblSelectDayOfWeek,'','','','','error');
					return false;
				}

		}else if(ScheduleType =='RECURRENCE' && frequencyType == 'MONTHLY'){
				scheduleDayOfWeek=[];
			
			var weekNoCombo = Ext.getCmp('monDayInstCombo')
			var weekNoComboSelected =  weekNoCombo.getValue();
			
			var monthDayCombo = Ext.getCmp('monDayOfWeekCombo')
			var dayOfMonthSelected = monthDayCombo.getValue();

			
			if(typeof(weekNoComboSelected) != 'undefined' && weekNoComboSelected != null && typeof(dayOfMonthSelected) != 'undefined' && dayOfMonthSelected != null && dayOfMonthSelected != ''){
				scheduleInstanceDayOfMonth = parseInt(weekNoComboSelected);
				dayOfWeekSchedule = dayOfMonthSelected;
				}
			else{
				showLightningPopup('toast',lblErrorTitle,lblSelectDayOfMonth,'','','','','error');
				return false;
			}
		}else{
			dayOfWeekSchedule = '';
			scheduleInstanceDayOfMonth = '';
		}

		return true;
	}
	
	
	function setWeekDayVal(objCheckbox){
		var daysSelected = '';
		var arrWeekDaysChkBox = document.getElementsByName("wd")
		if(typeof(arrWeekDaysChkBox) != 'undefined' && arrWeekDaysChkBox != null && arrWeekDaysChkBox.length >0){
			for (var i = 0; i < arrWeekDaysChkBox.length; i++) {
				var chkBxId = arrWeekDaysChkBox[i];
				if(chkBxId.checked){
					if(daysSelected == ''){
						daysSelected = chkBxId.id;
					}else{
						daysSelected = daysSelected + ',' + chkBxId.id;
					}
				}
			}
		}
		scheduleDayOfWeek = daysSelected;
	}

	// This method will update the scheduler UI with schedule info retreived when scanner is selected
    
	function setWeekDaysPanel(){
		for (var j = 0; j < 7; j++) {
			var chkBxId = j;
			var weekDayChkBox = document.getElementById(chkBxId);
			if(weekDayChkBox)
				weekDayChkBox.checked=false;
		}
	
		for (var i = 0; i < scheduleDayOfWeek.length; i++) {
			var chkBxId = scheduleDayOfWeek[i];
			var weekDayChkBox=document.getElementById(chkBxId);
			weekDayChkBox.parentElement.classList.add('checkboxBackgroundCls');
			let labelForCheckbox = document.querySelector('label[for="' + chkBxId + '"]');
			if(labelForCheckbox){
				labelForCheckbox.classList.add('checkboxBackgroundCls');
			}

			if(weekDayChkBox)
			weekDayChkBox.checked=true;
		}	
	}
	function updateSchedulerUI(){

	    EnableFrequency(ScheduleType);
		OnFrequencyChange(frequencyType); 
		OnStartChange(StartType);
		OnStopChange(StopType);
				
		//Get reference of global object variables
		
		freqTypeCombo.setValue(frequencyType);
		if(typeof(scheduleInstance) != 'undefined' && scheduleInstance != null && scheduleInstance != ''){
			if(scheduleInstance == 'undefined'){
				scheduleInstance = "1";
			}
			monDayInstCombo.setValue(scheduleInstance);
		}
		if(typeof(scheduleInstanceDayOfMonth) != 'undefined' && scheduleInstanceDayOfMonth != null && scheduleInstanceDayOfMonth != ''){
			if(scheduleInstanceDayOfMonth == 'undefined'){
				scheduleInstanceDayOfMonth = "1";
			}
			monDayOfWeekCombo.setValue(scheduleInstanceDayOfMonth);
		}
		TimeFrameCombo.setValue(frqTimeFrame);
		HourSpiner.setValue(frqTimeHrs);
		MinSpiner.setValue(frqTimeMin);
		ScanCounter.setValue(scanCount);
		StartDurationCombo.setValue(StartType);
		DurationListCombo.setValue(StopType);
		if(frequencyType && frequencyType == 'WEEKLY')
			setWeekDaysPanel();	
		hideLoadingMask();
		


	}
	function refreshScanConfig(){
		hideLoadingMask();
		enableOrDisableSaveNRefresh(true);
		//Refresh Scanner grid
		if(typeof(exceptionMsg) != 'undefined' && (exceptionMsg == null || exceptionMsg == '')){
			pushDataInScannerGrid();
			EnableDisableImportConfig();
			  
			if(ScannerDeviceListJSON != undefined && ScannerDeviceListJSON != null && ScannerDeviceListJSON != ''){
				var scanDiv = document.getElementById("bottomDiv");
				if(scanDiv != undefined && scanDiv != null){
					scanDiv.style.visibility='visible';
					var CMDBDisc_Settings = document.getElementById("CMDBDisc_Settings");
					if(CMDBDisc_Settings)
						CMDBDisc_Settings.style.overflowY='auto';
				}
			}
		}
		isDirty = false;

	}
	
function validateAndLaunchConsole()
{
	 if(isFPUserValidated){
		showLoadingMask();
			directConnectDevice('Full');
		}else{
			var conditionaltltp = 'Client Management Security';
			
			openPopupWithTitle('ACFPUserCredentialPage?isForBCM=true',oncompleteFPvalidateJS,conditionaltltp,Ext.isIE?400:386,495);
		}
}
function oncompleteFPvalidateJS(validated){

	if(validated){
		isFPUserValidated = true;
		showLoadingMask();
		directConnectDevice('Full');
	}
}
function openPopupWithTitle(link, onComplete, iTitle, iHeight, iWidth) {
	onCompleteFunction = onComplete;
	logInWindow = new Ext.create('Ext.window.Window', {
		height: iHeight,
		width: iWidth,
		title: iTitle,
		x: 10,
		y: 5,
		modal:true,
		resizable:false,
		bodyStyle:'background-color:#FFFFFF;',
		constrain : true,
		viewConfig: {forceFit: true},
		cls:'',
		frame:true,
		html:'<iframe frameborder="0" src =\"\/apex\/'+link+'\" style=\"width:100%;height:100%;border:none\"/>'		
	});
	logInWindow.show();
	logInWindow.center();
}

function setBCMPopUpVar(status){
	logInWindow.close();
	oncompleteFPvalidateJS(status);
}
function showACError(){
	if(exceptionMsg != null && exceptionMsg !=''){
		showLightningPopup('toast',lblErrorTitle,exceptionMsg,'','','','','error');

	}else {
		launchConsole();
	}
}
function renderToolTip(data, metadata, record, rowIndex, columnIndex, store){
	if(data != 'undefined' && data != ''){
		data = Ext.String.htmlEncode(data);
		metadata.tdAttr = 'title="' + Ext.String.htmlEncode(data) + '"';
	}
	return data;
}
function getRenderSize(){
	var retVal = {};	
	var sideDivWidth = 200;
	var diff = 280;
	try {
		sideDivWidth = Ext.get("sidebarDiv").getViewSize().width;
	} catch(e) {
		if(Ext.get("sidebarDiv") == null){
				diff = 70;
			}
	}
	if(sideDivWidth < 150) {
		diff = 70;
	}
	retVal.width = Ext.getBody().getViewSize().width - diff;
	
	return retVal;

}
function resizePanels(){
    var size= getRenderSize()
	var externalTLBARDiv=Ext.get("externalTLBARDiv");
	if(externalTLBARDiv)
		externalTLBARDiv.setWidth(size.width+40);
	if(bottomToolbar)	
		bottomToolbar.setWidth(size.width+40);
	if(scannerDevicesGrid)
		scannerDevicesGrid.setWidth(size.width+20);
	if(protocolGrid)
		protocolGrid.setWidth(size.width*40/100);
	if(userCredsGrid)
		userCredsGrid.setWidth(size.width*60/100-20);
	if(snmpCredsGrid)
		snmpCredsGrid.setWidth(size.width*60/100-20);
	if(memberGrid)
		memberGrid.setWidth(size.width);

}
Ext.EventManager.onWindowResize(function () {
	resizePanels();	
});

function refreshGridInfo()
{
	var currentSelScanner = scannerDevicesGrid.getSelectionModel().getSelection()[0];
	var currentScannerStatus = currentSelScanner.scanExecutionStatus;
	reloadProtocolGridData();
	if(typeof(currentScannerStatus) != 'undefined' && currentScannerStatus != null && currentScannerStatus != '' && currentScannerStatus != NotConfigured)
	{
		var linkId = 'detailsLink'+currentSelScanner.get("ObjectId");
		var link = document.getElementById(linkId);
		if(link != undefined && link != null)
		{
			if(link.hasAttribute("class"))
			{
				var className = link.getAttribute("class"); 
				if(className != undefined && className != null)
				{
					if(className != 'ViewDetailsLinkCls')
					{
						var ObjectIdVar = currentSelScanner.get('ObjectId');
						var scanExecutionStatusVar = currentSelScanner.get('scanExecutionStatus');
						var ObjectNameVar = currentSelScanner.get('ObjectName');
						link.setAttribute('onclick', "sendRecord(\'"+ObjectIdVar+"\',\'"+scanExecutionStatusVar+"\',\'"+ObjectNameVar+"\')");
						link.setAttribute("class", "ViewDetailsLinkCls"); 
					}
				}
			}
		}
	}
}	


function setDirtyFlag(){
	isDirty = true;
}
function updateGridAfterDeletion(){
	hideLoadingMask();
	enableOrDisableSaveNRefresh(true);
	if(typeof(scannerDevicesGrid) != 'undefined' &&  scannerDevicesGrid != null)
	{	
		var selectedRec = scannerDevicesGrid.getSelectionModel().getSelection();
		scannerDevicesGrid.getStore().remove(selectedRec);
		var scannersArray = scannerDevicesGridStore.getRange();
		if(typeof(scannersArray) != 'undefined' && scannersArray != null && scannersArray.length > 0){
			scannerDevicesGrid.getSelectionModel().select(0);
			var currentSelScanner = scannerDevicesGrid.getSelectionModel().getSelection();
			if(typeof(currentSelScanner) != 'undefined' &&  currentSelScanner != null)
			{
				showLoadingMask();
				var scannerInfoToFetchScan = JSON.stringify(currentSelScanner[0].data);
				enableOrDisableSaveNRefresh(false);
				clearGridDataNLabels();
				getScannerInfo(scannerInfoToFetchScan);
				document.getElementById(scannerNameCmp).textContent = currentSelScanner[0].data.ObjectName;	
			}
		}else{
			Ext.getCmp('configSaveBtn').setDisabled(true);
			var scanDiv = document.getElementById("bottomDiv");
			if(scanDiv != undefined && scanDiv != null){
				scanDiv.style.visibility ='hidden';
				var CMDBDisc_Settings = document.getElementById("CMDBDisc_Settings");
				if(CMDBDisc_Settings)
					CMDBDisc_Settings.style.overflowY='hidden';
			}
		}
	}
}

function enableOrDisableSaveNRefresh(enable){
	var saveBtn = Ext.getCmp('configSaveBtn');
	var refreshBtn = Ext.getCmp('configRefreshBtn');
	if(typeof(saveBtn) != 'undefined' && saveBtn != null && typeof(refreshBtn) != 'undefined' && refreshBtn != null){
		if(enable == true){
			var scannersArray = scannerDevicesGridStore.getRange();
			if(typeof(scannersArray) != 'undefined' && scannersArray != null && scannersArray.length > 0){
				saveBtn.setDisabled(false);
			}else{
				saveBtn.setDisabled(true);
			}
			refreshBtn.setDisabled(false);
		}else{
			saveBtn.setDisabled(true);
			refreshBtn.setDisabled(true);
		}
	}
}

// Target list validations

function GetIpv4Regex (strComponent)
{
	return '(?:(?:' + strComponent + '\\.){3}' + strComponent + ')';
}

function GetIpv6Regex (strSeparator, strComponent)
{
	return '(?:(?:(?:' + strComponent + strSeparator + '){7}' + strComponent + ')|' + // all 8 groups filled
			  '(?:' + strSeparator + strSeparator + ')|' + // anycast
			  '(?:(?:' + strComponent + strSeparator + '){1,7}' + strSeparator + ')|' + // starting filled, and filler at the end
			  '(?:' + strSeparator + '(?:' + strSeparator + strComponent + '){1,7})|' + // starting with filler
			  '(?:(?:' + strComponent + strSeparator + '){1,6}' + strSeparator + strComponent + ')|' + // filler at one before end
			  '(?:(?:' + strComponent + strSeparator + '){1,5}(?:' + strSeparator + strComponent + '){2})|' + // filler at 2 before end
			  '(?:(?:' + strComponent + strSeparator + '){1,4}(?:' + strSeparator + strComponent + '){3})|' + // filler at 3 before end
			  '(?:(?:' + strComponent + strSeparator + '){1,3}(?:' + strSeparator + strComponent + '){4})|' + // filler at 4 before end
			  '(?:(?:' + strComponent + strSeparator + '){1,2}(?:' + strSeparator + strComponent + '){5})|' + // filler at 5 before end
			  '(?:' + strComponent + strSeparator + '(?:' + strSeparator + strComponent + '){6}))'; // filler at 6 before end
}

var REGEXIPV4COMPONENT = '(?:(?:\\d{1,2})|(?:1\\d{1,2})|(?:2[0-4]\\d)|(?:25[0-5]))';
var REGEXIPV4ADDRESS = GetIpv4Regex (REGEXIPV4COMPONENT);

var REGEXIPV6COMPONENT = '[\\da-fA-F]{1,4}';
var REGEXIPV6ADDRESS = GetIpv6Regex (':', REGEXIPV6COMPONENT);

var REGEXIPADDRESSFORSMB = '(?:' + REGEXIPV4ADDRESS + '|(?:' + GetIpv6Regex ('-', REGEXIPV6COMPONENT) + '\\.ipv6-literal\\.net))';

var REGEXIPADDRESS = '(?:' + REGEXIPV4ADDRESS + '|' + REGEXIPV6ADDRESS + ')';


var REGEXNETWORKPORT = '(?:(?:\\d{1,4})|(?:[1-5]\\d{1,4})|(?:6[0-4]\\d{3})|(?:65[0-4]\\d{2})|(?:655[0-2]\\d)|(?:6553[0-5]))';

var REGEXIPADDRESSANDPORT = '(?:(?:' + REGEXIPV4ADDRESS + '|(?:\\[' + REGEXIPV6ADDRESS + '\\])):' + REGEXNETWORKPORT + ')';
var REGEXIPADDRESSANDOPTIONNALPORT = '(?:(?:' + REGEXIPV4ADDRESS + '|(?:\\[' + REGEXIPV6ADDRESS + '\\]))(?::' + REGEXNETWORKPORT + ')?)';


var REGEXIPV4RANGECOMPONENT = '(?:' + REGEXIPV4COMPONENT + '(?:-' + REGEXIPV4COMPONENT + ')?)';
var REGEXIPV6RANGECOMPONENT = '(?:' + REGEXIPV6COMPONENT + '(?:-' + REGEXIPV6COMPONENT + ')?)';

var REGEXIPADDRESSRANGECOMPONENT = '(?:' + '(?:(?:[\\w-]+\\.)*[\\w-]+)|' + // dns alias
																  GetIpv4Regex (REGEXIPV4RANGECOMPONENT) + '|' + // ipv4 component range (matches also single ipv4 addresses)
																  '(?:' + REGEXIPV4ADDRESS + '-' + REGEXIPV4ADDRESS + ')|' + // ipv4 basic range
																  '(?:' + REGEXIPV4ADDRESS + '/(?:(?:\\d)|(?:[1-2]\\d)|(?:3[0-2])))|' + // ipv4 cidr range
																  GetIpv6Regex (':', REGEXIPV6RANGECOMPONENT) + '|' + // ipv6 component range (matches also single ipv6 addresses)
																  '(?:' + REGEXIPV6ADDRESS + '-' + REGEXIPV6ADDRESS + ')|' + // ipv6 basic range
																  '(?:' + REGEXIPV6ADDRESS + '/(?:(?:\\d\\d?)|(?:1[0-1]\\d)|(?:12[0-8]))))'; // ipv6 cidr range
var REGEXIPADDRESSRANGE = '(?:' + REGEXIPADDRESSRANGECOMPONENT + '(?:,' + REGEXIPADDRESSRANGECOMPONENT + ')*)';


	
	
function isValidTargetList(targetList){
	pattern = new RegExp();
	pattern.compile(REGEXIPADDRESSRANGE+"$");

	var hasMatch = pattern.test(targetList); 
	return hasMatch;
}

function ShowhideScannerGrid(show){

	let firstStepDiv = document.getElementById('step1');
	let scannerDevicesGridDiv = document.getElementById('scannerDevicesGridId');
	let bottomDiv = document.getElementById('bottomDiv');
	let refreshDiv = document.getElementById('refreshDiv');

	if(firstStepDiv){
		firstStepDiv.style.display = (show === true ? 'block':'none');
	}

	if(scannerDevicesGridDiv){
		scannerDevicesGridDiv.style.display = (show === true ? 'block':'none');
	}

	if(refreshDiv){
		refreshDiv.style.display = (show === true ? 'block':'none');
	}

	if(bottomDiv){
		bottomDiv.style.display = (show === true ? 'none':'block');
	}

	if(show === true){
		Ext.getCmp('scannerDevicesGridId').doLayout();
	}
	else{
		Ext.getCmp('protocolsGridId').doLayout();
		Ext.getCmp('userCredsGridId').doLayout();
		Ext.getCmp('memberGridId').doLayout();
		Ext.getCmp('bottomtoolbarId').doLayout();
	}
}

function openCloseScannerAccordians(element){
	if(element){
		let sectionElem = document.getElementById('section'+element);
        if(sectionElem){			
			sectionElem.classList.toggle("slds-is-open");
		}
	}
}

function passwordConfirmationHandler(isConfirmed){

	if(isConfirmed){
		if(editingUserCreds == false){
			userCredsGridStore.add({userName: userNameVal, splChars: '********', password: psswrdVal});
		}else{
			var currentSelRow = Ext.getCmp('userCredsGridId').getSelectionModel().getSelection();
			currentSelRow[0].set('userName', userNameVal);
			currentSelRow[0].set('password', psswrdVal);
		}
		updateTheCredsArray();
		
		Ext.getCmp('userCredsInpWinId').close();
	}

}

function targetListEmptyHandler(isConfirmed){
	if(isConfirmed){
		if(validateSchedule()){
			showLoadingMask();
			enableOrDisableSaveNRefresh(false);
			previousValueOfToggle = toggleInteger;
			isException16820 = false;
			saveScanners(currentScannerDetails, currentScannerProtocolsNCreds, currentScannerTargetList,StartType,StopType,scanCount,frequencyType,dayOfWeekSchedule,scheduleInstanceDayOfMonth,frqTimeHrs,frqTimeMin,frqTimeFrame,ScheduleType,false);
		}
	}

}

function updateDateIcon() {
	console.log('inside icon');
	try {
        var allDateInputs = getElementsByClassName('dateInput');
		if (allDateInputs.length > 0) {
		    var dateInput, allDateFormats;
		    var isDateOnly;
		    for (var j = 0; j < allDateInputs.length; j++) {
		        dateInput = allDateInputs[j];
		        if (dateInput.className.indexOf('dateOnlyInput') > -1) {
		            isDateOnly = true;
		        } else {
		            isDateOnly = false;
		        }
		        allDateFormats = dateInput.getElementsByClassName('dateFormat');
		        for(var i = 0 ; i< allDateFormats.length; i++) {
		            if(allDateFormats[i] != null && typeof(allDateFormats[i]) != 'undefined') {
		                var allchildren = allDateFormats[i].childNodes ;
		                if(allchildren != null && typeof(allchildren) != 'undefined' && allchildren.length > 0) {
		                    if(allchildren.length >= 2 && allchildren[1] != null && typeof(allchildren[1]) != 'undefined') {
		                        var tooltip = RemedyForceHTMLProcessor.getText(allchildren[1]);                     
		                        RemedyForceHTMLProcessor.clearHTML(allchildren[1]);
		                        
		                        allchildren[1].title = labelInsert+ ': '+tooltip;
		                        var sapnIcon = document.createElement("SPAN") ;
		                        sapnIcon.className = 'date-event-icon rfdplIconFontSize' ;
                                sapnIcon.id = 'DateIcon-'+ 'ScanConfig'+Math.random();
                                allchildren[1].appendChild(sapnIcon) ;
		                        allchildren[1].style.textDecoration = 'none';
		                    }
		                    if(allchildren.length >= 3 && allchildren[2] != null && typeof(allchildren[2]) != 'undefined')
		                        allDateFormats[i].removeChild(allchildren[2]);
		                    if(allchildren.length > 0 && allchildren[0] != null && typeof(allchildren[0]) != 'undefined')
		                        allDateFormats[i].removeChild(allchildren[0]);
		                }
		            }
		        }
		    }
		}
	} catch (err) {
		console.log(err);
	} 
}

function toggleWeeklyDayClass(elementId){
		
	if(elementId){
		document.getElementById(document.getElementById(elementId).htmlFor).checked = true;
		let val = document.getElementById(elementId).classList.toggle('checkboxBackgroundCls');

		document.getElementById(document.getElementById(elementId).htmlFor).checked = val;
		
		document.getElementById(elementId).parentNode.classList.toggle('checkboxBackgroundCls');

	}
}

function createRefreshDiv(){
	var refreshToolBarItems = [
		{xtype:'label' ,cls:'scannerListCls', html: scannerListLabel},
		{xtype: 'tbspacer',width :30},
		{xtype: 'component',flex: 1},
		'->',
		{xtype: 'tbspacer',width :10},
		{
				xtype: 'button',
				id:'configRefreshBtn',
				text: lblRefresh,
				height:34,
				tooltipType : 'title',
				tooltip: BCMRefreshTooltip,
				cls: 'refreshBtnCls rfButtonCls helix-paddingForBtn slds-button  slds-button_neutral',
				disabledCls : 'helix-slds-button-disabled',
				handler:function() {
						RefreshHandler();
				}
			}
		];


	if(userLanguage == 'iw'){
		refreshToolBarItems.reverse();
	}	

	Ext.create('Ext.toolbar.Toolbar', {
		renderTo: 'refreshDiv',
		title: '',
		height:55,
	    id:'refreshToolBar',
		items: refreshToolBarItems
				
});
}

function showScannerConfigdata(){
	let ScannerAccordians = document.getElementById("ScannerAccordians");
	if(ScannerAccordians && ScannerAccordians.style.display == 'none'){
		ScannerAccordians.style.display = 'block';

		Ext.getCmp('protocolsGridId').doLayout();
		Ext.getCmp('userCredsGridId').doLayout();
		Ext.getCmp('memberGridId').doLayout();
		Ext.getCmp('bottomtoolbarId').doLayout();
	}

}

function changeGridDirectionForRTL(divId){
	var dataRowsInGridBody=document.getElementById(divId);
	if(userLanguage=='iw' && dataRowsInGridBody!=null && dataRowsInGridBody!=undefined)
		dataRowsInGridBody.dir="ltr";	
	else
		return;
}

function reloadProtocolGridData(){
	var currentSelectedScanner = scannerDevicesGrid.getSelectionModel().getSelection();
	var currentScannerScanId = currentSelectedScanner[0].data.scanId;
	if(typeof(currentScannerScanId) != 'undefined' && currentScannerScanId != null && currentScannerScanId != '' && typeof(exceptionMsg) != 'undefined' && exceptionMsg != null && exceptionMsg == ''){
		if(typeof(protocolConfigJSON) != 'undefined' && protocolConfigJSON != null && protocolConfigJSON != ''){
			showProtocolsNCreds();
		}
	}
}

