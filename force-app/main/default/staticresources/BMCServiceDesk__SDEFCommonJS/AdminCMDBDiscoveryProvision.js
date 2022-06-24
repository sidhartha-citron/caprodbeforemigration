var ProvisionButton, waitMaskvar;
var midTableEle;
var waitMask;
var msg;
var ProvisionMask;

var configPageLoaded = false;
var importPageLoaded = false;
var freqTypeCombo;
var monDayInstCombo;
var monDayOfWeekCombo;
var TimeFrameCombo;
var HourSpiner;
var MinSpiner;
var ScanCounter;
var StartDurationCombo;
var DurationListCombo;
var pleaseWaitBox,WaitBox_OP;
var activeBtnId = 'CMDBDiscovery_Provsion';
var isIE8 = Ext.isIE8;
var picklistAlign = '';

Ext.onReady(function() {
    
	let dateAnchors = document.querySelectorAll('.dateFormat a');

	if(dateAnchors && dateAnchors.length > 0){
		for(let i=0;i<dateAnchors.length;i++){
			dateAnchors[i].addEventListener('click',function (event){
				event.stopPropagation();
			});
		}
	}
    
  if(userLanguage == 'iw'){
    picklistAlign = 'tr-br';
  }
  
  var modalFooter = document.getElementById('modalFooter');
  var scannerAccordianHeaders = document.querySelectorAll('.scannerAccordianCls .slds-accordion__summary');
  
  if(modalFooter && modalFooter.style.display != 'none'){
    modalFooter.style.display = 'none';
  }
  
  window.onclick = function(element){
    
    let selectedHeaderIndex = -1;
    if(scannerAccordianHeaders && scannerAccordianHeaders.length > 0){
      for(let j=0;j<scannerAccordianHeaders.length;j++){
        if(scannerAccordianHeaders[j].contains(element.target)){
          selectedHeaderIndex = j;
          break;
        }
      }
    }
    
    if(selectedHeaderIndex > -1){
      openCloseScannerAccordians(scannerAccordianHeaders[selectedHeaderIndex].getAttribute('data-rf-accordianId'));
      return false;
    }

  }
  
  createLightningTooltip('primClientInfo', primClientToolTip, 300);

    midTableEle = document.getElementById('midTable');
    createProvisioningButton();
    disableMidPanel(isDiscoveryServicesEnabled);
  var CMDBDiscSettings = document.getElementById("CMDBDisc_Settings");
  if(typeof(CMDBDiscSettings)!='undefined' && CMDBDiscSettings != null )
    pleaseWaitBox = new Ext.LoadMask(CMDBDiscSettings, {msg: PleaseWait});
    
  var CMDBDiscOpRule = document.getElementById("CMDBDisc_OPRule");
  if(typeof(CMDBDiscOpRule)!='undefined' && CMDBDiscOpRule != null )
    WaitBox_OP=new Ext.LoadMask(CMDBDiscOpRule, {msg: PleaseWait});
  
  if(ProvisioningServerCalloutMsg != ''){
    waitMask = Ext.getBody().mask();
    waitMask.show();
    RemoteSiteCreationMsg();
  }else{
      showReprovisionWarning();
    
    if(SyncPassword){
        popUpWindow = new Ext.Window({
        height: Ext.isIE?384:360,
        width: 495,
        title: msgHeader,
        x: 10,
        y: 5,
        modal:true,
        resizable:false,
        frame:false,
        style:{
        borderRadius:0
        },
        cls:'popUpWindowClass',
        constrain : true,
        viewConfig: {forceFit: true},
        html:'<iframe frameborder="0" scrolling="no" src =\"\/apex\/ACFPUserCredentialPage?SyncPassword=true\" style=\"width:100%;height:100%;border:none;\"/>'
        
      });
      popUpWindow.show();
      popUpWindow.center();
    }else
      UpdateLicenseDetails();
  }
});

function displayPopup(operationParameter,popUpHeightIE,popUpHeightAll)
{
    var midTableEle = document.getElementById('midTable');
    createProvisioningButton();
    disableMidPanel(isDiscoveryServicesEnabled);
    var pleaseWaitBox = new Ext.LoadMask(document.getElementById("CMDBDisc_Settings"), {msg: PleaseWait});


    popUpWindow = new Ext.Window({
      height: Ext.isIE?popUpHeightIE:popUpHeightAll,
      width: 495,
      title: msgHeader,
      x: 10,
      y: 5,
      modal:true,
      resizable:false,
      frame:false,
      style:{
      borderRadius:0
      },
      cls:'popUpWindowClass',
      constrain : true,
      viewConfig: {forceFit: true},
      html:'<iframe frameborder="0" scrolling="no" src =\"\/apex\/ACFPUserCredentialPage?'+operationParameter+'\" style=\"width:100%;height:100%;border:none;\"/>'
      
    });
    popUpWindow.show();
    popUpWindow.center();
}

function changePasswordPopup()
{
  displayPopup('changepassword=true',460,Ext.isGecko?500:510);
}

function resetPasswordPopup()
{
  displayPopup('resetpassword=true',185,190);
}

function createProvisioningButton(){
  midTableEle = document.getElementById('midTable');
  renderParameterizedLabels();
  if(typeof(midTableEle) != undefined && midTableEle != null)
      ProvisionButton = Ext.create('Ext.Button', {
      id: 'ProvisionButton',
      text: ProvisionButtonTxt,
      renderTo:'ProvisionButtonTD',
      width:200,
	  baseCls: 'slds-button slds-button_brand',
	  disabledCls: 'helix-slds-button-disabled',
      handler:handleProvision,
      disabled:true
    });
}
function saveBtnHandler() {
  showLoadingMask();
  if(activeBtnId == 'CMDBDiscovery_Provsion' || activeBtnId == 'CMDBDiscovery_Settings'){
    enableOrDisableSaveNRefresh(false);
    save();
  }else if(activeBtnId == 'CMDBDiscovery_Import'){
    if(CalculateInterval())
      SaveImportJobDetails(ScheduleIntervalData,'',false,'');
    else
      hideLoadingMask();
    }else if(activeBtnId == 'CMDBDiscovery_OPRule'){
    var opStatus= getGridData();
    var opInterval= getOPIntervalData();
    var enableLogChkBox = document.getElementById(enableLogChkId);
    var LogsEnabled;
    ScheduleIntervalData = '';
    if(enableLogChkBox)
      LogsEnabled = enableLogChkBox.checked;
    else
      LogsEnabled = false;
    if(opInterval !== false)
      SaveImportJobDetails(ScheduleIntervalData,opStatus,LogsEnabled,opInterval);
    else
      hideLoadingMask();
  }
}


function showSavingMask(){
  waitMask = new Ext.LoadMask(Ext.getBody(), {msg:Saving});
  if( typeof(waitMask) != 'undefined' && waitMask != null && waitMask != '' )
    waitMask.show();
}

function hideMask(){
  if( typeof(waitMask) != 'undefined' && waitMask != null && waitMask != '' )
    waitMask.hide();
}

function showMsg(){
  if(msg != ''){
    Ext.Msg.show({
          title:msgHeader,
          msg: msg,
          icon: Ext.MessageBox.ERROR,
          width: 300,
          frame:false,
          buttons: Ext.Msg.OK
      });
    resetCMDBProvision();
  }else{
    var ProvisionSuccessfulMsg = document.getElementById('CMDBProvisionsuccessful');
    if(typeof(ProvisionSuccessfulMsg)!= undefined && ProvisionSuccessfulMsg != null){
      showLightningPopup('toast','',savedsuccessfullyLabel,'','','','','success');
      ProvisionSuccessfulMsg.style.display='none';
    }else{
      
      showLightningPopup('toast','',savedsuccessfullyLabel,'','','','','success');
    } 
  }
}

function handleProvision(){
  waitMask = new Ext.LoadMask(Ext.getBody(), {msg: PleaseWait});
  showLoadingMask();
  if(document.getElementById(ServerPwdConfirmDiv).value != "" && document.getElementById(ServerPwdDiv).value != ""){
    PasswordValidation();
    validatePassword(true);
  }
  
  if(PwdValidationmsg == ""){
	Ext.getCmp('ProvisionButton').disable();	  
    ProvisionCMDBDiscoveryServer();
  }
    
}

function handleAfterProvision(){
  if(msgStr != ''){
    showLightningPopup('toast',msgHeader,msgStr,'','','','','error');
    document.getElementById('ProvisionButtonMask').style.display='none';
  }else{
    showLightningPopup('toast','',provisionSuccessMsg,'','','','','success');
    EnableDisableImportConfig();
  }
  hideLoadingMask();	
  Ext.getCmp('ProvisionButton').enable();
}
function disableMidPanel(isDiscoveryServicesEnabled){
  var DiscServiceCheckbox = document.getElementById(isDiscoveryServicesEnabled);
  var chkNoEmail = document.getElementById(noExpiryNotification);
  var divNoExpiry = document.getElementById('noExpiryDiv'); 
  var divPwTable = document.getElementById('PwTable'); 
  
  if(typeof(DiscServiceCheckbox) !='undefined' && DiscServiceCheckbox != null && DiscServiceCheckbox.checked){
    if(typeof(chkNoEmail) !='undefined' && chkNoEmail != null){
      chkNoEmail.checked = false;
      chkNoEmail.disabled = true;
      divNoExpiry.style.display ='none';
      if(typeof(divPwTable) !='undefined' && divPwTable != null && divPwTable.style != null){
        divPwTable.style.display ='block';
      }
    }
  }else{
    if(isServerProvisioned){
      if(typeof(divNoExpiry) !='undefined' && divNoExpiry != null && divNoExpiry.style != null){
        divNoExpiry.style.display ='flex';
        divNoExpiry.style.overflow ='visible';
      }
      if(typeof(divPwTable) !='undefined' && divPwTable != null && divPwTable.style != null){
        divPwTable.style.display ='none';
      }
    }
    else{
      divNoExpiry.style.display ='none';  
    }


    chkNoEmail.disabled = false;
  }
  
  if( typeof(midTableEle) != undefined && midTableEle != null ){
    if(DiscServiceCheckbox.checked){
      midTableEle.style.opacity="1";
      midTableEle.style.pointerEvents = "auto";
      if(isIE8)
        DisableDiv('midTable',false);
      //Ext.getCmp('ProvisionButton').enable();
    }else{
      if(!DiscServiceCheckbox.checked){
        midTableEle.style.opacity="0.45";
        midTableEle.style.pointerEvents = "none";
        if(isIE8)
          DisableDiv('midTable',true);
        //Ext.getCmp('ProvisionButton').disable();
      }
    }
  }
  
  var tabLayout = document.getElementById(TabLayoutPanelId);
  var mainContentRow = document.getElementById("mainContentRow");
  
  if(typeof(tabLayout) != undefined && tabLayout != null){
    var tabDisplayArray = new Array(3);
    
    if(showOPRuleTab)
      tabDisplayArray= new Array(4);
    else
      tabDisplayArray= new Array(3);
    tabDisplayArray[0]={TabbtnId:'CMDBDiscovery_Provsion', TabDiplayAreaId:'CMDBDisc_Provision', TabDiplayAreaClass:'clsProvisionTab'};
    tabDisplayArray[1]={TabbtnId:'CMDBDiscovery_Settings', TabDiplayAreaId:'CMDBDisc_Settings', TabDiplayAreaClass:'clsProvisionTab'};
    tabDisplayArray[2]={TabbtnId:'CMDBDiscovery_Import', TabDiplayAreaId:'CMDBDisc_Import', TabDiplayAreaClass:'clsProvisionTab'};
    if(showOPRuleTab)
      tabDisplayArray[3]={TabbtnId:'CMDBDiscovery_OPRule', TabDiplayAreaId:'CMDBDisc_Settings', TabDiplayAreaClass:'clsProvisionTab'};
      
    for(var i = 0; i < tabDisplayArray.length; i++){
      
      var ActiveTab = document.getElementById(tabDisplayArray[i].TabbtnId).className.search('slds-is-active');
      
      if(DiscServiceCheckbox.checked){
        if(ActiveTab != -1){
          document.getElementById(tabDisplayArray[i].TabbtnId).className = 'slds-tabs_default__link anchorCls slds-is-active';
          document.getElementById(tabDisplayArray[i].TabbtnId).parentElement.className = "slds-tabs_default__item slds-is-active";
        }
        else{
          document.getElementById(tabDisplayArray[i].TabbtnId).className = 'slds-tabs_default__link anchorCls';
          document.getElementById(tabDisplayArray[i].TabbtnId).parentElement.className = "slds-tabs_default__item";
        }
        document.getElementById(tabDisplayArray[i].TabDiplayAreaId).className = tabDisplayArray[i].TabDiplayAreaClass;
        document.getElementById('TabButtons').setAttribute('onkeydown', '');
        document.getElementById(tabDisplayArray[i].TabDiplayAreaId).setAttribute('onkeydown', '');
        EnableDisableImportConfig();
        if(isIE8){
          DisableDiv(tabDisplayArray[i].TabDiplayAreaId,false);
        }

        if(typeof(mainContentRow) != 'undefined'){
          mainContentRow.className = '';
        }
        
      }else{
        if(ActiveTab != -1){
          document.getElementById(tabDisplayArray[i].TabbtnId).className = 'slds-tabs_default__link anchorCls slds-is-active ';
          document.getElementById(tabDisplayArray[i].TabbtnId).parentElement.className = "slds-tabs_default__item slds-is-active";
        }
        else{
          document.getElementById(tabDisplayArray[i].TabbtnId).className = 'slds-tabs_default__link anchorCls';
          document.getElementById(tabDisplayArray[i].TabbtnId).parentElement.className = "slds-tabs_default__item";
  
        }

        if(typeof(mainContentRow) != 'undefined'){
          mainContentRow.className = 'clsDisabledDiv';
        }
        
        document.getElementById(tabDisplayArray[i].TabDiplayAreaId).className = tabDisplayArray[i].TabDiplayAreaClass+' clsDisabledDiv';
        document.getElementById('TabButtons').setAttribute('onkeydown', 'return false');
        document.getElementById(tabDisplayArray[i].TabDiplayAreaId).setAttribute('onkeydown', 'return false');
        
        if(isIE8){
          DisableDiv(tabDisplayArray[i].TabDiplayAreaId,true);
        }
      }
    }
  } 
}

function displayActiveTab(btnObj){
  
  var btnArray = new Array(4);
  btnArray[0]={btnId:'CMDBDiscovery_Provsion', textAreaCompId:'CMDBDisc_Provision'};
  btnArray[1]={btnId:'CMDBDiscovery_Settings', textAreaCompId:'CMDBDisc_Settings'};
  btnArray[2]={btnId:'CMDBDiscovery_Import', textAreaCompId:'CMDBDisc_Import'};
  btnArray[3]={btnId:'CMDBDiscovery_OPRule', textAreaCompId:'CMDBDisc_OPRule'};
  activeBtnId = btnObj.id;
  for(var i = 0; i < btnArray.length; i++){
    if(activeBtnId == btnArray[i].btnId){
      document.getElementById(btnArray[i].btnId).className  = 'slds-tabs_default__link anchorCls slds-is-active';
      document.getElementById(btnArray[i].btnId).parentElement.className = "slds-tabs_default__item slds-is-active";
      document.getElementById(btnArray[i].textAreaCompId).style.display = 'block';
      if(activeBtnId == 'CMDBDiscovery_Settings'){
        if(configPageLoaded == false){
          configPageLoaded = true;
          showLoadingMask();
          getScanners();
        }else{
          showLoadingMask();
          autoRefreshScanners();
        }
      }else if(activeBtnId == 'CMDBDiscovery_OPRule' && isOPRuleLoaded == false){
        isOPRuleLoaded=true;
        showLoadingMask();
        populateOPRuleData();
      
      }else if(activeBtnId == 'CMDBDiscovery_Import' && importPageLoaded == false){
        importPageLoaded = true;
        renderImportPageElements();
      }
    }else{  
	if(typeof(document.getElementById(btnArray[i].btnId)!='undefined') && document.getElementById(btnArray[i].btnId) != null){
        document.getElementById(btnArray[i].btnId).className = 'slds-tabs_default__link anchorCls';
        document.getElementById(btnArray[i].btnId).parentElement.className = 'slds-tabs_default__item';
      } 
      if(typeof(document.getElementById(btnArray[i].textAreaCompId)!='undefined') && document.getElementById(btnArray[i].textAreaCompId) != null) 
      document.getElementById(btnArray[i].textAreaCompId).style.display = 'none';

      if(btnArray[i].btnId == 'CMDBDiscovery_Import' && !EnableImport)
        continue;	
    }
  }
}
function DisableDiv(div,disable){
  var nodes = document.getElementById(div).getElementsByTagName('*');
    for(var k = 0; k < nodes.length; k++)
      nodes[k].disabled = disable;
}

// Added for time being. To be taken out when code is merged in other JS file
function showMessage(msg){
  Ext.Msg.show({
    msg: msg,
    buttons: Ext.Msg.OK,
    minWidth: 300,
    maxWidth : 360,
    minHeight : 110,
    icon: warningIcon
  });
}

function EnableDisableImportConfig(){
  var ImportBtn = document.getElementById('CMDBDiscovery_Import');
  var scannerCount = 0;
  if(typeof(scannerDevicesGridStore) != 'undefined' && scannerDevicesGridStore != null){
    var scannerData = scannerDevicesGridStore.data;
    if(scannerData)
      scannerCount = scannerData.length;
  }
  if(ImportBtn){
    if(EnableImport || scannerCount > 0){
        EnableImport = true;
        ImportBtn.className = 'slds-tabs_default__link anchorCls';
        ImportBtn.style.display = 'block';
        ImportBtn.disabled = false;
    }else{
        ImportBtn.className = 'slds-tabs_default__link anchorCls clsDisabledTabs clsDisabledTabsText';
        ImportBtn.style.display = 'none';
      ImportBtn.disabled = true;
    }
  }
}

function RemoteSiteCreationMsg(){
    if(ProvisioningServerCalloutMsg != ''){
      showLightningPopup('prompt',msgHeader,ProvisioningServerCalloutMsg,'OK','','','remoteSiteCreation','warning');
    }
      
}
  
function remoteSiteCreationHandler(){

  showLoadingMask();
              createRemoteSite('BCM_Provisioning_Server_New','Metadata API Remote Site Setting for BCM Provisioning server',BCMProvisioningServerUrl);
              window.location.reload(true);
            }
  
function showReprovisionWarning(){
  if(isServerReprovisioningNeeded){
    showLightningPopup('prompt',reprovisionWarningTitle,reprovisionWarning,'OK','','','reprovision','warning');
  }
}

function clearDOMbyID(elmID){
  var elem = document.getElementById(elmID);
  while(elem.firstChild){
    elem.removeChild(elem.firstChild);
  }
}

function createHTMLElement(elemText,elemType,elemLink,elemOnClick){
  var newElem;
  if(elemType == 'anchor'){
    newElem = document.createElement("a");
    var linkText = document.createTextNode(elemText);
    newElem.appendChild(linkText);
    newElem.title = elemText;
    newElem.target='_blank';
    newElem.className = 'rfFontCls';
    if(elemLink != '')
      newElem.href = elemLink;
    if(elemOnClick != ''){
      newElem.setAttribute('onclick', elemOnClick);
      newElem.setAttribute('style', 'cursor: pointer; text-decoration: underline');
    }else{
      newElem.setAttribute('style', '');
    }
  }else if(elemType == 'bold'){
    newElem = document.createElement("b");
    newElem.innerText = elemText;
  }
  return newElem;
}

function renderParameterizedLabels(){
  var label,span;
  var labelSplitArray = [];
  
  if(document.getElementById('ProvisionClientManagementDetail')){
    clearDOMbyID('ProvisionClientManagementDetail');
    
    lblProvisionClientManagementDetail = lblProvisionClientManagementDetail.replace(/{[0-9]}/g,'#');
    var labelSplitArray = lblProvisionClientManagementDetail.split("#");
    
    var label = document.createElement('label');
    label.appendChild(document.createTextNode(labelSplitArray[0]));
    label.appendChild(createHTMLElement(BCMProvisioningServerUrl,'bold'));
    label.appendChild(document.createTextNode(labelSplitArray[1]));
    label.appendChild(createHTMLElement(lblSFRemoteSiteSetting,'anchor',remoteSitesUrl,''));
    label.appendChild(document.createTextNode(labelSplitArray[2]));
    label.appendChild(createHTMLElement(lblHere,'anchor','',onclickFuncProvServer));
    label.appendChild(document.createTextNode(labelSplitArray[3]));
    
    var span = document.getElementById('ProvisionClientManagementDetail');
    span.appendChild(label);
  }
  
  if(document.getElementById('RemoteSiteSettingWithBCMMaster')){
    clearDOMbyID('RemoteSiteSettingWithBCMMaster');
    
    lblRemoteSiteSettingWithBCMMaster = lblRemoteSiteSettingWithBCMMaster.replace(/{[0-9]}/g,'#');
    var labelSplitArray = lblRemoteSiteSettingWithBCMMaster.split("#");
    
    var label = document.createElement('label');
    label.appendChild(document.createTextNode(labelSplitArray[0]));
    label.appendChild(createHTMLElement(BCMMasterURL,'bold'));
    label.appendChild(document.createTextNode(labelSplitArray[1]));
    label.appendChild(createHTMLElement(lblSFRemoteSiteSetting,'anchor',remoteSitesUrl,''));
    label.appendChild(document.createTextNode(labelSplitArray[2]));
    label.appendChild(createHTMLElement(lblHere,'anchor','',onclickFuncDiscServer));
    label.appendChild(document.createTextNode(labelSplitArray[3]));
    
    var span = document.getElementById('RemoteSiteSettingWithBCMMaster');
    span.appendChild(label);
  }
  
  if(document.getElementById('SalesforceOrgID')){
    clearDOMbyID('SalesforceOrgID');
    
    lblSalesforceOrgID = lblSalesforceOrgID.replace(/{[0-9]}/g,'#');
    var labelSplitArray = lblSalesforceOrgID.split("#");
    
    var label = document.createElement('label');
    label.appendChild(document.createTextNode(labelSplitArray[0]));
    label.appendChild(createHTMLElement(OrgId,'bold'));
    label.appendChild(document.createTextNode(labelSplitArray[1]));
    var span = document.getElementById('SalesforceOrgID');
    span.appendChild(label);
  }
  
}


function checkDiscoveryServerIsAlive(){
  var chkEnableDiscovery = document.getElementById(isDiscoveryServicesEnabled);
  if(typeof(chkEnableDiscovery)!= 'undefined' && chkEnableDiscovery != null && chkEnableDiscovery.checked && isServerProvisioned){
    checkServerAlive();
    }
}


function doOnLoadActivity(){
  var chkEnableDiscovery = document.getElementById(isDiscoveryServicesEnabled);
  var chkNoEmailNotification = document.getElementById(noExpiryNotification);

  if(typeof(chkEnableDiscovery)!= 'undefined' && chkEnableDiscovery != null && chkEnableDiscovery.checked){
    if(typeof(chkNoEmailNotification)!= 'undefined' && chkNoEmailNotification != null)
      chkNoEmailNotification.disabled = true;
  }
  
  renderParameterizedLabels();
  hideLicenseExpiryDate();
}

function clearPasswordCheck(){
  if(document.getElementById(ServerPwdDiv).value == ""){
    Ext.getCmp('ProvisionButton').disable();
    document.getElementById(ServerPwdConfirmDiv).value = "";
    PwdValidationmsg = "";
    document.getElementById("PwdValidationdiv").setAttribute('style', 'display: none');
	document.getElementById(DiscoveryPwdLabelId).setAttribute('style', 'color:#3e3e3c');
    document.getElementById(ServerPwdDiv).setAttribute('style', 'border-color:none; ');
    document.getElementById(ServerPwdConfirmDiv).setAttribute('style', 'border-color:none; ');
  }
  if(Ext.getCmp('ProvisionButton').disabled == false && (document.getElementById(ServerPwdDiv).value != document.getElementById(ServerPwdConfirmDiv).value))
    Ext.getCmp('ProvisionButton').disable();
}

//function to escape RegEx reserverd characters
function prefixEscapeChar(value){
  var chars = new Array('\\', '+', '?', '[', '^', ']', '$', '(', ')', '{', '}', '=', '*' ,'!', '<', '>', '|', ':', '-');
  for(var j = 0 ; j < chars.length; j++)
  {
    value = value.split(chars[j]).join('\\'+chars[j]);
  }  
  return value;   
}

function validatePassword(confirmbox, onblurEvent){
  var pwdMatched = false;
  var pwdValidated = false;
  if(confirmbox && PwdValidationmsg != "" && PwdValidationmsg.indexOf(PasswordMatchValidation) == -1){  //for IE and Moz
    document.getElementById(ServerPwdDiv).focus();
    document.getElementById(ServerPwdConfirmDiv).value = "";
    return;
  }
  PwdValidationmsg = "";
  document.getElementById(ServerPwdDiv).setAttribute('style', 'border-color:none; ');
  document.getElementById(ServerPwdConfirmDiv).setAttribute('style', 'border-color:none; ');
  if(document.getElementById(ServerPwdDiv).value != ''){
    if(confirmbox){
      pwdMatched = false;
      if(document.getElementById(ServerPwdConfirmDiv).value != ''){
        var str = document.getElementById(ServerPwdDiv).value;
        var matchstr = document.getElementById(ServerPwdConfirmDiv).value;
        matchstr = prefixEscapeChar(matchstr);
        var patt = new RegExp("^"+matchstr,"g");
        var matchResult = str.match(patt);
        if(str.indexOf(matchResult) != -1){
          if(onblurEvent){
            if(document.getElementById(ServerPwdConfirmDiv).value != document.getElementById(ServerPwdDiv).value){
              PwdValidationmsg = PasswordMatchValidation;
              document.getElementById(ServerPwdConfirmDiv).setAttribute('style', 'border-color:#c23934; ');
            }
          }else{
            pwdMatched=true;
            pwdValidated = PasswordValidation();
          }
        }else{
          PwdValidationmsg = PasswordMatchValidation;
          document.getElementById(ServerPwdConfirmDiv).setAttribute('style', 'border-color:#c23934; ');
        }
      }
    }else{
      pwdValidated = PasswordValidation();
    }
  }else{
    PwdValidationmsg = "";
    document.getElementById(ServerPwdConfirmDiv).value = "";
  }
  
  if(pwdMatched && pwdValidated){
    document.getElementById("PwdValidationdiv").setAttribute('style', 'display: none');
	document.getElementById(DiscoveryPwdLabelId).setAttribute('style', 'color:#3e3e3c');
	
    if(document.getElementById(ServerPwdConfirmDiv).value == document.getElementById(ServerPwdDiv).value)
      Ext.getCmp('ProvisionButton').enable();
    else
      Ext.getCmp('ProvisionButton').disable();
  }else{
    document.getElementById("PwdValidationdiv").setAttribute('style', 'display:block; font-weight:bold; color:#c23934;');
	document.getElementById(DiscoveryPwdLabelId).setAttribute('style', 'color:#c23934');
    if(document.getElementById(ServerPwdConfirmDiv).value != document.getElementById(ServerPwdDiv).value)
      Ext.getCmp('ProvisionButton').disable();
  }
  handleValidationMsgDiv();
}

function handleValidationMsgDiv(){
  clearDOMbyID("PwdValidationdiv");
  if(PwdValidationmsg.length == 0){
	 document.getElementById(DiscoveryPwdLabelId).setAttribute('style', 'color:#3e3e3c');
  }else if (PwdValidationmsg == PasswordMatchValidation) {
	  document.getElementById(DiscoveryPwdLabelId).setAttribute('style', 'color:#c23934');
  var msgArray = PwdValidationmsg.split("#");
  for(var i=0;i<msgArray.length;i++){
    var para = document.createElement("p");
    var node = document.createTextNode(msgArray[i]);
    para.appendChild(node);
    var element = document.getElementById("PwdValidationdiv");
    element.appendChild(para);
  }
}

}
function PasswordValidation(){
  var Valid = true;
  if(document.getElementById(ServerPwdDiv).value.length < 8) {
      Valid = false;
      PwdValidationmsg +=  PasswordLengthValidation + "#";
    }
      
  re = /[0-9]/;
  if(!re.test(document.getElementById(ServerPwdDiv).value)) {
    Valid = false;
    PwdValidationmsg += PasswordNumberValidation + "#";
  }
  
  re = /[a-zA-Z]/;
  if(!re.test(document.getElementById(ServerPwdDiv).value)) {
        Valid = false;
        PwdValidationmsg += PasswordCharValidation;
    }
  
  if(!Valid){
    document.getElementById(ServerPwdDiv).focus();
    document.getElementById(ServerPwdDiv).setAttribute('style', 'border-color:#c23934; ');
  }
  
  return Valid;
}

function hideLicenseExpiryDate(){
	if(LicenseType =='Agentless'){
	thExpiryDate = document.getElementById('thExpiryDate');
		if(thExpiryDate){
			thExpiryDate.style.display='none';
	}
	tdExpiryDate =document.getElementById('tdExpiryDate');
		if(tdExpiryDate){
			tdExpiryDate.style.display='none';
		}
	}
}

function createLightningTooltip(qtipTarget,qtipContent,qtipWidth){

	let baseClsStr = 'slds-popover slds-popover_tooltip slds-nubbin_bottom-left';
	let offSetX = 0;

	if(userLanguage == 'iw'){
		baseClsStr = 'slds-popover slds-popover_tooltip slds-nubbin--left-top';
		offSetX = -350;
	}

	return new Ext.ToolTip({
		target: qtipTarget,
		floating: false,
		baseCls:baseClsStr,
		bodyCls: 'slds-popover__body',
		defaultAlign:'bl-tl',
		html: qtipContent,
		dismissDelay: 0,
		maxWidth: qtipWidth,
		mouseOffset:[offSetX,0]
	});			  				

}