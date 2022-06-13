
var storeindex , cIndex, uncheckIndex;
var gridData= [];
var grid;
var cols = new Array(3);  
var optionsSpinner;
cols[0]='displayValue'; 
cols[1]='storedValue';
cols[2]='defaultValue';
var gridDataChanged = false;
var isMultiSelectPickList=false;
var SelectedVal;
var isRTFField = false;
function sortBtnHandler(){ 
			var dataArray = getListData();
			if(doAscending == true){
				dataArray.sort();
				doAscending =false;
			} else{
				dataArray.reverse();
				doAscending =true;
			} 
			gridDataChanged = true;
			store.removeAll();
			Ext.getCmp('grid').getView().refresh();
			store.loadData(dataArray);
			Ext.getCmp('grid').getView().refresh();
			setSelectedRows();
   
};
window.addEventListener('click', function (e) {
	if (!document.getElementById('toolbarMenu').contains(e.target)) {
		// hide toolbar menu if clicked outside the menu box
		toggleToolbarMenu('hide');
	}
});
function toggleToolbarMenu(action){
	var toolbarMenuElement = document.getElementById('toolbarMenu');
	if(action == 'show'){
		toolbarMenuElement.classList.add('slds-is-open');
	}
	else{
		toolbarMenuElement.classList.remove('slds-is-open');
	}
}
function enableDisableAdvancedEditing(value){
	var isChecked = document.getElementById('advanceEditing').checked;
	if(!validateGridRow()){
		document.getElementById('advanceEditing').checked = false;
		return;
	}
	if(isChecked){
		var advanceEditingDisabled = document.getElementsByClassName("clsAdvancedEditingDisabled");
		document.getElementById(InputPageComp.ComponentVars.displayValue).value = '';
		var elementLenght = advanceEditingDisabled.length;
		for (i = 0; i < elementLenght; i++) {
			var DisabledEditing = advanceEditingDisabled[0];
			if (DisabledEditing.classList.contains('clsAdvancedEditingDisabled')) {
				DisabledEditing.classList.remove('clsAdvancedEditingDisabled');
				DisabledEditing.classList.add('clsAdvancedEditingEnabled');
			}
		}
	
		var addEditAllButtons = document.getElementById('addEditAllButtons');
		addEditAllButtons.setAttribute('style','display:""');
		var sortAddButtons = document.getElementById('sortAddButtons');
		sortAddButtons.setAttribute('style','display:none');
		document.getElementById('calcelBtn_id').style.display= 'none';
		document.getElementById('addbtn_id').style.display= 'block';
		
		}else{
		var advanceEditingEnabled = document.getElementsByClassName("clsAdvancedEditingEnabled");
		var elementLenght = advanceEditingEnabled.length;
		for (i = 0; i < elementLenght; i++) {
			var EnabledEditing = advanceEditingEnabled[0];
			if (EnabledEditing.classList.contains('clsAdvancedEditingEnabled')) {
				EnabledEditing.classList.remove('clsAdvancedEditingEnabled');
				EnabledEditing.classList.add('clsAdvancedEditingDisabled');
			}
		}
		
		var addEditAllButtons = document.getElementById('addEditAllButtons');
		addEditAllButtons.setAttribute('style','display:none');
		var sortAddButtons = document.getElementById('sortAddButtons');
		sortAddButtons.setAttribute('style','display:""');
		
	}
	
}
var lkFilterCombo,lookupId;
function validateNumber(event, objInput, allowDecimal, allowNegative) {
    var key = window.event ? event.keyCode : event.which;

	if((allowDecimal && key == 46 && objInput.value.indexOf('.') > -1 ) || (allowNegative && key == 45 && objInput.value.indexOf('-') > -1))
		return false;
		
	if (event.keyCode == 8 || event.keyCode == 46 || event.keyCode == 37 || event.keyCode == 39 || 
		(allowDecimal && key == 46) || (allowNegative && key == 45) ) {
        return true;
    }
    else if ( key < 48 || key > 57 ) {
        return false;
    }
    else return true;
}

function validateDate(event) {
    var key = window.event ? event.keyCode : event.which;

    if (event.keyCode == 8 || event.keyCode == 46 || event.keyCode == 37 || event.keyCode == 39)  { 
        return true;
    }

	return false;
}

function handlesecondColumnInput(){
	if(document.getElementById(InputPageComp.ComponentVars.responseType).value.toLowerCase() == 'text area (rich)'){
		if(document.getElementById(InputPageComp.ComponentVars.secondColumnInput).checked == true)
			document.getElementById(InputPageComp.ComponentVars.fullSpanDisplay).checked = false;
	}	
}
			
function handlefullSpanDisplay(){
	if(document.getElementById(InputPageComp.ComponentVars.responseType).value.toLowerCase() == 'text area (rich)'){
		if(document.getElementById(InputPageComp.ComponentVars.fullSpanDisplay).checked == true)
			document.getElementById(InputPageComp.ComponentVars.secondColumnInput).checked = false;
	}	
}

function setData(){
         store.removeAll();
         Ext.getCmp('grid').getView().refresh();
		 store.loadData(getListData());
         
         Ext.getCmp('grid').getView().refresh();
     }
        /*For Display grid*/
    function showTable(){
   
	    store = new Ext.data.Store({
	        fields: cols, data: gridData
	    });
              	
		 var i=0;
         grid = new Ext.grid.GridPanel({
		        id:'grid',
		        width:770,
				border:true,
				editing :true,
		        store: store,
				plugins: [
					Ext.create('Ext.grid.plugin.CellEditing', {
						clicksToEdit : 1,
						listeners: {
							'beforeedit': function(e) {
								var me = this;
								var isChecked = document.getElementById('advanceEditing').checked;
								var allowed = true;
								if(!isChecked){
								me.isEditAllowed = true;
								}else{
									me.isEditAllowed = false;
									 allowed = false;
								}
								return allowed;
							},
							'edit':function(editor, e, eOpts) {
								if(e.colIdx == 0){
									var position = store.data.items.length;
								
									grid.plugins[0].startEditByPosition({
										row: position,
										column: 1
									});
								}
								var displayValue = grid.store.getAt(e.rowIdx).data['displayValue'];
								var storedValue = grid.store.getAt(e.rowIdx).data['storedValue'];
								
								var inputvalueArray = new Array(3);
								var pushPicklistValues = [];
								inputvalueArray[0]= displayValue;
								inputvalueArray[1]= storedValue;
								inputvalueArray[2]= 'false';								
								pushPicklistValues.push(inputvalueArray);
								for(var i = 0;i < pushPicklistValues.length;i++){
									if(isPicklistInput()) {
										//if adding new inline value the picklistData value will be undefined so setting the default value to false
										if(typeof(picklistData[e.rowIdx]) != 'undefined' || picklistData[e.rowIdx] != null){
											pushPicklistValues[i][2] = picklistData[e.rowIdx][2];
											picklistData[e.rowIdx] = pushPicklistValues[i];
										}else{
											picklistData[e.rowIdx] = pushPicklistValues[i];
										}
									} else {
										//if adding new inline value the listdata value will be undefined
										if(typeof(listData[e.rowIdx]) != 'undefined' || listData[e.rowIdx] != null){
											pushPicklistValues[i][2] = listData[e.rowIdx][2];
											listData[e.rowIdx] =  pushPicklistValues[i];
										}else{
											listData[e.rowIdx] =  pushPicklistValues[i];
										}									
									}
								}	
								setDirty(true);								
							}
						}
					}),
				],
		        columns : [
					{   id:'FieldLabel',
						header: FulfillmentInputDisplayedValue, 
						menuDisabled: true,
						sortable: false, 
						flex:2, 
						dataIndex: cols[0],
						editor : {
							xtype: 'textfield',
							allowBlank:false,
							listeners:{
								focus:function(textField,event){
									textField.setValue(Ext.util.Format.htmlDecode(textField.value));
								},
								blur:function(textField,event){
									textField.setValue(Ext.util.Format.htmlEncode(textField.value));
								}
							}
						}
					},
					{   header: FulfillmentInputStoredValue,  
						//renderer: renderTooltip, 
						id:'ValueField',
						menuDisabled: true,
						sortable: false, 
						flex:2, 
						dataIndex: cols[1],
						editor : {
							xtype: 'textfield',
							allowBlank:false,
							listeners:{
								focus:function(textField,event){
									textField.setValue(Ext.util.Format.htmlDecode(textField.value));
								},
								blur:function(textField,event){
									textField.setValue(Ext.util.Format.htmlEncode(textField.value));
								}
							}
						}},
					{	header: defaultVal, dataIndex:cols[2], checkOnly: true,menuDisabled: true, sortable: false, 
						width:100, 
						renderer: function (value, meta, record,index){
							var defaultValue;
							if(value == 'true'){								
								defaultValue =  '<div class="slds-form-element">'+
												'  <div class="slds-form-element__control">'+
												'    <div class="slds-checkbox">'+
												'      <input onclick="SetDefaultCheckbox(this);" type="checkbox" name="ChkBoxGrp" id="defaultValue'+i+'" checked=""/>'+
												'      <label class="slds-checkbox__label" for="defaultValue'+i+'">'+
												'        <span class="slds-checkbox_faux"></span>'+
												'      </label>'+
												'    </div>'+
												'  </div>'+
												'</div>';
							}
							else{
								defaultValue =  '<div class="slds-form-element">'+
												'  <div class="slds-form-element__control">'+
												'    <div class="slds-checkbox">'+
												'      <input onclick="SetDefaultCheckbox(this);" type="checkbox" name="ChkBoxGrp" id="defaultValue'+i+'" />'+
												'      <label class="slds-checkbox__label" for="defaultValue'+i+'">'+
												'        <span class="slds-checkbox_faux"></span>'+
												'      </label>'+
												'    </div>'+
												'  </div>'+
												'</div>';
							}
							i = i+1;
							return defaultValue ;
						}
					},{
						width:45, 
						menuDisabled: true,
						renderer: function (value, meta, record,index){
							
							value = '<div type="button" onclick="toggleToolbarGridMenu(\'myDropdown'+i+'\');return false;" class="menuBackgroundImage dropbtn slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small" aria-haspopup="true" tabindex="0" title="'+labelMoreAction+'">'+
									'          <svg class="slds-button__icon" aria-hidden="true">'+
									'            <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+URlDown+'"></use>'+
									'          </svg>'+
									'          <span class="slds-assistive-text">'+labelMoreAction+'</span>'+
									'        </div>'+
									'	 	<div id="myDropdown'+i+'" class="dropdown-content slds-dropdown__item">'+
									'   	 <a href="javascript:void(0);" onclick="editBtnHandler();">'+
									'			<span class="slds-truncate" >'+labelEdit+'</span>'+
									'	 	 </a>'+
									'    	 <a href="javascript:void(0);" onclick="delPicklistOptionHandler();">'+
									'			<span class="slds-truncate" >'+RemoveIconTooltip+'</span>'+	
									'	 	  </a>'+
									'  		</div>';
								
							return value;
						}
					}
						],
		        height:185,
		        layout: 'fit',
		        autoScroll:true,
		        listeners: {
		            afterrender: function() {
			         	setSelectedRows();			         	
			      	},delay: 1000,
					keydown :function(e){
						if((e.UP == e.getKey()) || (e.DOWN == e.getKey())){
							var record = this.getSelectionModel().getSelected();
							var dValue=record.get('displayValue');
		                    var sValue=record.get('storedValue');
						    document.getElementById(InputPageComp.ComponentVars.displayValue).value= "\"" + dValue + "\"," + "\"" + sValue + "\"";
						}
					}
		                
		         }        
		 });
		 grid.render('extGridPanel');
	}
	
	function delPicklistOptionHandler(){
		var record = grid.getSelectionModel().getSelection();
	
		if(record && record.length >0 ) {
			storeindex = grid.store.indexOf(record[0]);
			deleteData();
		}
	}
	function editBtnHandler(){
		let store = grid.getStore();
		var picklistGrid = grid.getSelectionModel().getSelection();
		storeindex = grid.store.indexOf(picklistGrid[0]);
		grid.plugins[0].startEditByPosition({
			row: storeindex,
			column: 0
		});
	}
	/* When the user clicks on the button,
		toggle between hiding and showing the dropdown content */
		var previourMenuId;
		function toggleToolbarGridMenu(id) {
			
			document.getElementById(id).classList.toggle("show");
			if(previourMenuId && previourMenuId != id){
				var menuIdElement = document.getElementById(previourMenuId);
				if(menuIdElement && menuIdElement.classList)
					menuIdElement.classList.remove("show");
			}
			previourMenuId = id;
		}
		// Close the dropdown menu if the user clicks outside of it
		window.onclick = function(event) {
			var matches = event.target.matches ? event.target.matches('.dropbtn') : event.target.msMatchesSelector('.dropbtn');
			if (!matches) {
			var dropdowns = document.getElementsByClassName("dropdown-content");
			var i;
			for (i = 0; i < dropdowns.length; i++) {
				var openDropdown = dropdowns[i];
				if (openDropdown.classList.contains('show')) {
				openDropdown.classList.remove('show');
				}
			}
			}
		}

	function SetDefaultCheckbox(CurrentChkbox){
		var ChangedinputvalueArray = new Array();
		 if(!validateGridRow()){
			CurrentChkbox.checked = false;
			 return;
		 }
		 if(gridDataChanged){
			ChangedinputvalueArray = getChangedInputArray();
		 }
		 var CheckBoxGrp = document.getElementsByName('ChkBoxGrp');
		 var DefaultCheckBox = false;
		 var tempcheckbox = '';
		 var counter;
		 
		 for (i = 0; i < CheckBoxGrp.length; i++){
				if(CheckBoxGrp[i].checked == true)
					tempcheckbox = CheckBoxGrp[i];
				CheckBoxGrp[i].checked  = false;
				if((tempcheckbox != null && tempcheckbox != '') && tempcheckbox.checked == CurrentChkbox.checked == true && DefaultCheckBox == false){
					tempcheckbox.checked  = true;
					counter = i;
					DefaultCheckBox = true;
				}else
					CheckBoxGrp[i].checked  = false;
				if(CheckBoxGrp[i].checked == CurrentChkbox.checked){
					DefaultCheckBox = true;
				}
				if(DefaultCheckBox == true ){
					var inputvalueArray = new Array(3);
					var tempLstData = gridDataChanged == true ? ChangedinputvalueArray : getListData();
					if(isPicklistInput()) 
						picklistData=[];
					else 
						listData=[];
					for(var j=0; j<tempLstData.length ; j++){
						tempLstData[j][2] = 'false';
						inputvalueArray = tempLstData[j];
						if(counter==j){
							inputvalueArray[2] = 'true';
							storeindex = j;
						}
						else
							inputvalueArray[2] = 'false';
						if(isPicklistInput()) 
							picklistData.push(inputvalueArray);
						else 
							listData.push(inputvalueArray);
					}
					setData();
				}
		 }
	}
	
	function getChangedInputArray(){
		var ChangedinputvalueArray = new Array();
		var store = grid.getStore();				
		for (var i=0 ; i< store.data.length ;i++){
			ChangedinputvalueArray[i]= new Array();
			ChangedinputvalueArray[i][0]=store.getAt(i).get('displayValue') ;
			ChangedinputvalueArray[i][1]=store.getAt(i).get('storedValue') ;
			if(i == storeindex )
				ChangedinputvalueArray[i][2]= 'true' ;
			else
				ChangedinputvalueArray[i][2]= 'false' ;						
		}
		return ChangedinputvalueArray; 
	}

	function setSelectedRows(){
		    var selectedRecs="";        
		    var str = grid.getStore();
			var dataArray = getListData();
		    for (var i = 0; i < dataArray.length; i++) {        
		       if(dataArray[i][2]== 'true'){
		            grid.getSelectionModel().select(i, true);
		            storeindex = i;
		       }
		    }
		}
	function hideUnhidePanel(){
		document.getElementById('addbtn_id').style.display= 'block'; 
		document.getElementById('editallBtn_id').style.display= 'block'
		document.getElementById('updatebtn_id').style.display= 'none';
		document.getElementById('calcelBtn_id').style.display= 'none';
        document.getElementById('multiSelectInput').style.display= 'none';
        document.getElementById('scrollableInput').style.display= 'none';
        document.getElementById('fullSpanDisplaydiv').style.display = 'none';
        document.getElementById('conditionalstyle').style['padding-top'] = '0px';
		document.getElementById(InputPageComp.ComponentVars.inputDisplayValue).value='';
		var requiredInput = document.getElementById(InputPageComp.ComponentVars.requiredInput);
		requiredInput.disabled = false;
        var str=document.getElementById(InputPageComp.ComponentVars.responseType).value;
		if(str.toLowerCase() != 'lookup'){
			showLookupFilterCombo(false);
			setEditLKFilterStyle('none');
		}
		if(str.toLowerCase()=='radio button' || str.toLowerCase()=='picklist'){
			document.getElementById('gridDiv').style.display= 'block';
			document.getElementById('rediodetaildiv').style.display= 'block';
			document.getElementById('separatorLabel').style.display = 'none';
			document.getElementById('separatorInput').style.display = 'none';	
			document.getElementById('reorderPicklist').style.visibility = 'visible';
			document.getElementById('reorderPicklist').style.display = 'block';
			Ext.getCmp('grid').setVisible(true); 
			document.getElementById(InputPageComp.ComponentVars.referenceType).style.display= 'none'; 
			document.getElementById(InputPageComp.ComponentVars.referenceBtn).style.display= 'none'; 
			document.getElementById(InputPageComp.ComponentVars.referenceLabel).style.display= 'none';
			document.getElementById('lookupRow').style.display= 'none';
			requiredInput.disabled = false;
			document.getElementById(InputPageComp.ComponentVars.hiddenInput).disabled = false;
			if(str.toLowerCase()=='radio button') {
			   document.getElementById(InputPageComp.ComponentVars.radioInputSection).style.display= 'block'; 
			   document.getElementById(InputPageComp.ComponentVars.picklistInputSection).style.display= 'none';
				disableValidationInput(true);
				document.getElementById(InputPageComp.ComponentVars.cbMultiSelectInput).checked = false;
			} else {
				document.getElementById(InputPageComp.ComponentVars.picklistInputSection).style.display= 'block'; 
				document.getElementById(InputPageComp.ComponentVars.radioInputSection).style.display= 'none';
				document.getElementById('multiSelectInput').style.display= 'block';
				
				//multiple picklist
				checkPickListValidationRule();
			}
		
			setData();
		}else{
			document.getElementById('gridDiv').style.display= 'none';
			document.getElementById('rediodetaildiv').style.display= 'none'; 
			document.getElementById(InputPageComp.ComponentVars.cbMultiSelectInput).checked = false;
			document.getElementById('reorderPicklist').style.visibility = 'hidden';
			document.getElementById('reorderPicklist').style.display = 'none';
			Ext.getCmp('grid').hide(); 
			if(str.toLowerCase()=='lookup' ){
				document.getElementById(InputPageComp.ComponentVars.referenceType).style.display= 'inline';
				document.getElementById(InputPageComp.ComponentVars.referenceBtn).style.display= 'inline';
				document.getElementById(InputPageComp.ComponentVars.referenceLabel).style.display= 'inline';
			document.getElementById('lookupRow').style.display = 'table-row';
				var refObjVal = document.getElementById(InputPageComp.ComponentVars.referenceType).value;
				requiredInput.disabled = false;
				if(refObjVal){
					showLookupFilterCombo(true);
				}
			}else{
				document.getElementById(InputPageComp.ComponentVars.referenceType).style.display= 'none';
				document.getElementById(InputPageComp.ComponentVars.referenceBtn).style.display= 'none';
				document.getElementById(InputPageComp.ComponentVars.referenceLabel).style.display= 'none';
				document.getElementById('lookupRow').style.display= 'none';
				if(str.toLowerCase()=='check box' || str.toLowerCase() == 'header section'){
					requiredInput.disabled = true;
					requiredInput.checked = false;
				}else{
					requiredInput.disabled = false;
			}
			}
			
			if(str.toLowerCase() == 'header section'){
				document.getElementById(InputPageComp.ComponentVars.hiddenInput).checked = false;
				document.getElementById(InputPageComp.ComponentVars.hiddenInput).disabled = true;
				document.getElementById(InputPageComp.ComponentVars.groupInput).disabled =false;
				document.getElementById(InputPageComp.ComponentVars.secondColumnInput).checked = false;
				document.getElementById(InputPageComp.ComponentVars.secondColumnInput).disabled = true;
				document.getElementById(InputPageComp.ComponentVars.secondColumnInput).disabled = true;
				document.getElementById('separatorLabel').style.display = 'block';
				document.getElementById('separatorInput').style.display = 'block';
				document.getElementById('scrollableInput').style.display = 'block';
				document.getElementById('URLField').style.display = 'none';
				document.getElementById('tooltipDiv').classList.remove("tooltipDiv");

				var separatorValue = document.getElementById(InputPageComp.ComponentVars.separatorValue);
				var headerSectionSeparator = document.getElementsByName('headerSectionSeparator');
				if(headerSectionSeparator && headerSectionSeparator.length > 0){
					if(separatorValue && separatorValue.value){
						headerSectionSeparator[parseInt(separatorValue.value)].checked=true;
					}else{
						headerSectionSeparator[0].checked=true;
					}
				}
			}else{
				document.getElementById(InputPageComp.ComponentVars.hiddenInput).disabled = false;
				document.getElementById(InputPageComp.ComponentVars.groupInput).disabled =true;
				document.getElementById(InputPageComp.ComponentVars.groupInput).checked = false;
				document.getElementById(InputPageComp.ComponentVars.secondColumnInput).disabled = false;
				document.getElementById('separatorLabel').style.display = 'none';
				document.getElementById('separatorInput').style.display = 'none';
				document.getElementById('URLField').style.display = '';	
				document.getElementById('tooltipDiv').classList.add("tooltipDiv");			
			}

			if(str.toLowerCase() == 'hyperlink'){
				document.getElementById(InputPageComp.ComponentVars.hiddenInput).checked = false;
				document.getElementById(InputPageComp.ComponentVars.hiddenInput).disabled = true;
				document.getElementById(InputPageComp.ComponentVars.groupInput).disabled = true;
				document.getElementById(InputPageComp.ComponentVars.secondColumnInput).disabled = false;
				document.getElementById(InputPageComp.ComponentVars.requiredInput).disabled = true;
				document.getElementById(InputPageComp.ComponentVars.validationInput).disabled = true;
				document.getElementById(InputPageComp.ComponentVars.controlProcess).disabled = true;
				document.getElementById('separatorLabel').style.display = 'none';
				document.getElementById('separatorInput').style.display = 'none';
			}
				
			if(str.toLowerCase() == 'text area (rich)'){
				if(parent.isrichTextAreapresent&&document.getElementById(InputPageComp.ComponentVars.responseType).disabled==false){
					Ext.create('Ext.window.MessageBox').show({ msg:InputPageComp.ComponentVars.richTextAreaValidation, width: 300,title:InputPageComp.ComponentVars.errorboxtitle, buttons: Ext.MessageBox.OK, fn: function(buttonId){document.getElementById(InputPageComp.ComponentVars.responseType).value=""; hideUnhidePanel();}});					
					
				}	
				document.getElementById('VisibleLinesField').style.display = 'table-row';
					document.getElementById('fullSpanDisplaydiv').style.display = 'block';
					if(visibleLinesFlag==null || visibleLinesFlag==0)
						document.getElementById(InputPageComp.ComponentVars.visibleLinesvalue).value=15;
					
			}else{
				document.getElementById('VisibleLinesField').style.display = 'none';
				document.getElementById('fullSpanDisplaydiv').style.display = 'none';
				document.getElementById('conditionalstyle').style['padding-top'] = '0px';
			}
			
			if((document.getElementById(InputPageComp.ComponentVars.responseType).selectedIndex == 0) || (str.toLowerCase() == 'text area') || (str.toLowerCase()=='lookup' ) || (str.toLowerCase() == 'header section') || (str.toLowerCase() == 'check box') || (str.toLowerCase() == 'text area (rich)') || (str.toLowerCase() == 'hyperlink'))
				disableValidationInput(true);
			else			
				disableValidationInput(false);
		}

		if(str.toLowerCase() == 'hyperlink'){
			createLightningTooltip('URLInfoIcon', tooltipContent, 300);
			document.getElementById('URLRequiredIcon').style.display = 'initial';
			document.getElementById('URLInfoIcon').style.display = 'initial';
			
		}else{
			if(document.getElementById('URLRequiredIcon') )
				document.getElementById('URLRequiredIcon').style.display = 'none';
			if(document.getElementById('URLInfoIcon'))
				document.getElementById('URLInfoIcon').style.display = 'none';
		}
	}
	function disableValidationInput(bDisabled)
	{
		document.getElementById(InputPageComp.ComponentVars.validationInput).disabled= bDisabled;
		if(bDisabled) document.getElementById(InputPageComp.ComponentVars.validationInput).checked = !bDisabled;
		
		displayValidationRule();
	}

	function displayValidationRule(){
		var validationRuleSection = document.getElementById('validationRuleSection');
		if(validationRuleSection != null && validationRuleSection != 'undefined')
		{
			var str=document.getElementById(InputPageComp.ComponentVars.responseType).value;
	
			document.getElementById('validationRuleNumber').style.display = 'none';
			document.getElementById('validationRuleDate').style.display = 'none';
			document.getElementById('validationRulePickList').style.display = 'none';
			document.getElementById('validationRuleText').style.display = 'none';
				
			if(document.getElementById(InputPageComp.ComponentVars.validationInput).checked)
			{
				validationRuleSection.style.display = 'block';
				
				var validationstr = document.getElementById(InputPageComp.ComponentVars.validationRule).value;
				
				if(str.toLowerCase()=='number')
				 	document.getElementById('validationRuleNumber').style.display = 'block';
				else if((str.toLowerCase()=='date') || (str.toLowerCase()=='date/time'))
					document.getElementById('validationRuleDate').style.display = 'block';
				else if( (str.toLowerCase()=='picklist') && (isMultiSelectPickList) )
					document.getElementById('validationRulePickList').style.display = 'block';
				else if(str.toLowerCase()=='text field')
					document.getElementById('validationRuleText').style.display = 'block';
				
				if(validationstr != '' && validationstr != 'undefined' && validationstr.length > 0) bindValidationRuleData(str.toLowerCase(),validationstr);
						
				if((str.toLowerCase()=='date') || (str.toLowerCase()=='date/time'))
				 	validationRuleDateTypeChange();
			}
			else
			{
				validationRuleSection.style.display = 'none';
			}
		}	
	}
	
	function bindValidationRuleData(datatype, validationstr)
	{
		if(datatype == 'number')
		{
			arrValidationRule = RFSplit(validationstr,PE);
			if (arrValidationRule.length > 0)
			{
				arrMin=arrValidationRule[0].split('=');
				arrMax=arrValidationRule[1].split('=');
				document.getElementById('numberMinimum').value = arrMin[1];
				document.getElementById('numberMaximum').value = arrMax[1];
			}
		}
		else if((datatype=='date') || (datatype=='date/time'))
		{
			arrValidationRule = RFSplit(validationstr,PE);
			if (arrValidationRule.length > 0)
			{
				strDateType=arrValidationRule[0];
				strDateOperator=arrValidationRule[1];
				
				var ddl = document.getElementById(InputPageComp.ComponentVars.dateType);
				var opts = ddl.options.length;
				for (var i=0; i<opts; i++){
				    if (ddl.options[i].value == strDateType){
				        ddl.options[i].selected = true;
				        break;
				    }
				}
				
				ddl = document.getElementById('dateOperator');
				opts = ddl.options.length;
				for (var i=0; i<opts; i++){
				    if (ddl.options[i].value == strDateOperator){
				        ddl.options[i].selected = true;
				        break;
				    }
				}
				
				if(strDateType == '1') 
					document.getElementById('dateSpecificDate').value=arrValidationRule[2];
				else 
					document.getElementById('dateDays').value=arrValidationRule[2];

			}
			
		}
		else if(datatype=='picklist')
		{
			arrMinOptions=validationstr.split('=');
			optionsSpinner.setValue(arrMinOptions[1]);
		}
		else if(datatype=='text field')
		{ 
			arrMinChar=validationstr.split('=');
			document.getElementById('textMinimumCharacters').value = arrMinChar[1];
		}
	}
	
	function checkPickListValidationRule()
	{
		isMultiSelectPickList = document.getElementById(InputPageComp.ComponentVars.cbMultiSelectInput).checked;
		
		if (isMultiSelectPickList)
			disableValidationInput(false);
		else
			disableValidationInput(true);
	}

	function validationRuleDateTypeChange(){
		var objRuleDateType = document.getElementById(InputPageComp.ComponentVars.dateType);
		if(objRuleDateType != null && objRuleDateType != 'undefined')
		{
			var str =  objRuleDateType.value;
			var validationRuleDateDays = document.getElementById('validationRuleDateDays');
			var validationRuleDateSpecific = document.getElementById('validationRuleDateSpecific');
	
			if(str.toLowerCase() == '1'){
				validationRuleDateDays.style.display = 'none';	
				validationRuleDateSpecific.style.display = 'block';
			}
			else
			{
			 	validationRuleDateSpecific.style.display = 'none';	
				validationRuleDateDays.style.display = 'block';
			}
		}
	}
	function clearValidationRule(){
		document.getElementById(InputPageComp.ComponentVars.validationInput).checked = false;
		document.getElementById(InputPageComp.ComponentVars.validationRule).value = '';
		document.getElementById('textMinimumCharacters').value = '';
		document.getElementById('dateDays').value = '';
		document.getElementById('dateSpecificDate').value = '';
		document.getElementById('numberMinimum').value  = '';
		document.getElementById('numberMaximum').value  = '';
	}
	function handleResponseTypeChange(element){
		clearValidationRule();
		hideUnhidePanel();	
	}
	var isMultipleEdit = false;
	function addDataJs(){
		
		var multipleValueInputArray = [];
		var oldPickListData;
		var oldListData;
		if(!validateGridRow()){
			return;
		}
		
		var dValue = document.getElementById(InputPageComp.ComponentVars.displayValue).value.trim();
		multipleValueInputArray = dValue.split("\n");
		
		var pushPicklistValues = [];
		if(isMultipleEdit){
			if(isPicklistInput()) {
				oldPickListData = picklistData;
				picklistData = [];
			} else {
				oldListData = listData;
				listData = [];
			}
			setData();
		}
		for(var i = 0; i < multipleValueInputArray.length; i++){
			var multipleValueInput = multipleValueInputArray[i].trim();
			//if(multipleValueInputArray[i][0] != '"' || multipleValueInputArray[i][multipleValueInputArray[i].length-1] != '"'){
			if(multipleValueInput[0] != '"' || multipleValueInput[multipleValueInput.length-1] != '"'){
				if(oldPickListData != null || oldListData!= null){
					if(isPicklistInput()) {
						picklistData = oldPickListData;
						
					} else {
						listData = oldListData;
					}
					setData();
				}
				parent.showLightningPopup('prompt','Error',picklistRadioButtonInputErrorMessage,'OK','','','','error');
				return;
			}
			if(/"\s+,\s+"/g.test(multipleValueInput))
				multipleValueInput=multipleValueInput.replace(/"\s+,\s+"/g,'","');
			var gridArray = multipleValueInput.split('","');
			
			if(gridArray == null || gridArray.length != 2){
				if(oldPickListData != null || oldListData!= null){
					if(isPicklistInput()) {
						picklistData = oldPickListData;
						
					} else {
						listData = oldListData;
					}
					setData();
				}
				parent.showLightningPopup('prompt','Error',picklistRadioButtonInputErrorMessage,'OK','','','','error');
				return;
			}
			var inputvalueArray = new Array(3);
			var displayVal = Ext.util.Format.htmlEncode(gridArray[0].substring(1,gridArray[0].length));
			var storedVal = Ext.util.Format.htmlEncode(gridArray[1].substring(0,gridArray[1].length-1));
			if(!/\S/.test(displayVal) || !/\S/.test(storedVal)) {
				if(oldPickListData != null || oldListData!= null){
					if(isPicklistInput()) {
						picklistData = oldPickListData;
						
					} else {
						listData = oldListData;
					}
					setData();
				}
				parent.showLightningPopup('prompt','Error',picklistRadioButtonInputErrorMessage,'OK','','','','error');
				return;
			}
			inputvalueArray[0]= displayVal;
			inputvalueArray[1]= storedVal;
			inputvalueArray[2]='false';
			pushPicklistValues.push(inputvalueArray);
		}
		for(var i = 0;i < pushPicklistValues.length;i++){
			if(isPicklistInput()) {
				picklistData.push(pushPicklistValues[i]);
			} else {
				listData.push(pushPicklistValues[i]);
			}
			setData();
		}	
		var store=grid.getStore();
	
        document.getElementById(InputPageComp.ComponentVars.displayValue).value='';
		document.getElementById('addbtn_id').style.display= 'block'; 
		document.getElementById('editallBtn_id').style.display= 'block'
		document.getElementById('updatebtn_id').style.display= 'none';
		document.getElementById('calcelBtn_id').style.display= 'none';
		setSelectedRows();
		setTimeout("", 1000);
		isMultipleEdit = false;
		setDirty(true);	
	}
		
	function cancelMultiEdit(){
		document.getElementById(InputPageComp.ComponentVars.displayValue).value='';
		document.getElementById('addbtn_id').style.display= 'block'; 
		document.getElementById('editallBtn_id').style.display= 'block'
		document.getElementById('updatebtn_id').style.display= 'none';
		document.getElementById('calcelBtn_id').style.display= 'none';
	}
	function updateData(){
			if(isMultipleEdit){
				addDataJs();
				return;
			}
			var inputvalueArray = new Array(3);
			if(isPicklistInput())
				inputvalueArray= picklistData[storeindex];
			else
			inputvalueArray= listData[storeindex];
       		var dValue = document.getElementById(InputPageComp.ComponentVars.displayValue).value.trim();
			if(dValue.split("\n").length > 1){
				parent.showLightningPopup('prompt','Error',picklistRadioButtonUpdateErrorMessage,'OK','','','','error');
				return;
			}
			if(dValue[0] != '"' || dValue[dValue.length-1] != '"'){
				parent.showLightningPopup('prompt','Error',picklistRadioButtonInputErrorMessage,'OK','','','','error');
				return;
			}
			if(/"\s+,\s+"/g.test(dValue))
				dValue=dValue.replace(/"\s+,\s+"/g,'","');
				
			var gridArray = dValue.split('","');
			if(gridArray == null || gridArray.length != 2){
				parent.showLightningPopup('prompt','Error',picklistRadioButtonInputErrorMessage,'OK','','','','error');
				return;
			}
			var displayVal = Ext.util.Format.htmlEncode(gridArray[0].substring(1,gridArray[0].length));
			var storedVal = Ext.util.Format.htmlEncode(gridArray[1].substring(0,gridArray[1].length-1));
			if(!/\S/.test(displayVal) || !/\S/.test(storedVal)) {
				parent.showLightningPopup('prompt','Error',picklistRadioButtonInputErrorMessage,'OK','','','','error');
				return;
			}
			inputvalueArray[0]= displayVal;
			inputvalueArray[1]= storedVal;
			if(isPicklistInput())
				picklistData[storeindex] =inputvalueArray;
			else 
	        listData[storeindex] =inputvalueArray;
			setData();
        	document.getElementById(InputPageComp.ComponentVars.displayValue).value='';
			document.getElementById('addbtn_id').style.display= 'block'; 
			document.getElementById('editallBtn_id').style.display= 'block'
			document.getElementById('updatebtn_id').style.display= 'none'; 
			document.getElementById('calcelBtn_id').style.display= 'none';
			setSelectedRows();
			setTimeout("", 1000);
			setDirty(true);	
	}
	function multiUpdateData(){
		document.getElementById('addbtn_id').style.display= 'none'; 
		document.getElementById('editallBtn_id').style.display= 'none'
		document.getElementById('updatebtn_id').style.display= 'block';
		document.getElementById('calcelBtn_id').style.display= 'block';
		document.getElementById(InputPageComp.ComponentVars.displayValue).value='';	
		
		isMultipleEdit = true;
		grid.getSelectionModel().deselectAll();
		for(var row = 0; row < getListData().length; row++){
			var record = grid.store.getAt(row);
			var dValue=record.get('displayValue');
			var sValue=record.get('storedValue');
			var dataArray = getListData();
			if(dataArray && dataArray.length>0){
				sValue=dataArray[row][1];
				sValue = Ext.util.Format.htmlDecode(sValue);
				dValue = Ext.util.Format.htmlDecode(dValue);
				if(dValue != null && dValue != "")
				document.getElementById(InputPageComp.ComponentVars.displayValue).value += "\"" + dValue + "\"," + "\"" + sValue + "\"\n";
			}
		}
		document.getElementById('addbtn_id').style.display= 'none'; 
		document.getElementById('editallBtn_id').style.display= 'none'
		document.getElementById('updatebtn_id').style.display= 'block';
		document.getElementById('calcelBtn_id').style.display= 'block';
		}
	function deleteData(){
	    if(isPicklistInput()) 
			var removed = picklistData.splice(storeindex,1);
		else 
		var removed = listData.splice(storeindex,1);
		setData();
		
		var store=grid.getStore();
		
		//document.getElementById(InputPageComp.ComponentVars.storedValue).value='';
        document.getElementById(InputPageComp.ComponentVars.displayValue).value='';
		document.getElementById('addbtn_id').style.display= 'block'; 
		document.getElementById('editallBtn_id').style.display= 'block'
		document.getElementById('updatebtn_id').style.display= 'none'; 
		document.getElementById('calcelBtn_id').style.display= 'none';
		setSelectedRows();
		setTimeout("", 1000);
		
	}
	function beforeSave(){
		if(document.getElementById(InputPageComp.ComponentVars.responseType).value == 'Text Area (Rich)'){
			    isRTFField = true;
				parent.showLoadingMask();
				checkRTFField(inputId);
				return;
		}
		if(!validateGridRow()){
			return;
		}
		beforeSaveHandler();
	}

	function beforeSaveRTF(){
		if(isRTFField){
			parent.isRichTextboxExist = true;
		}
		if(!allowRTF){
			return;
		}else{
			beforeSaveHandler();
		}
	}
	function Trimspaces(StrVal) {
    	return StrVal.replace(/^\s+|\s+$/gm,'');
	}
	function beforeSaveHandler(){
		if(isPicklistInput() || isRadioButtonInput()){
			var inputvalue = '';
			var dataArray;
			if (gridDataChanged == true) { 
			   	dataArray = getChangedInputArray();
			   	gridDataChanged = false;
			} else {
			    dataArray = getListData();
			}
			for(var i= 0; i< dataArray.length;i++){
				if(inputvalue !=null && inputvalue != '')
					inputvalue+= getSeparatorByCustomSetting(PE);
				inputvalue+= Ext.util.Format.htmlDecode(Trimspaces(dataArray[i][0]));
				inputvalue+= getSeparatorByCustomSetting(EF);
				inputvalue+= Ext.util.Format.htmlDecode(Trimspaces(dataArray[i][1]));
				inputvalue+= getSeparatorByCustomSetting(EF);
				inputvalue+= Ext.util.Format.htmlDecode(dataArray[i][2]);
			}
			if(isPicklistInput()) {
			    if(dataArray.length == 0) {
					parent.showLightningPopup('prompt','Error',fulfillmentInputEmptyPicklistValidationMsg,'OK','','','','error');
					return;
				}
				document.getElementById(InputPageComp.ComponentVars.picklistValue).value =inputvalue ;	
			} else {
			document.getElementById(InputPageComp.ComponentVars.inputValue).value =inputvalue ;
			}
		}
		if (!saveValidationRuleData())
			return;
		
		if(!saveValidationForDefaultValue())
			return;
			
		var visiblelines;
		
		if(document.getElementById('VisibleLinesField').style.display == 'none')
			visiblelines = null;
		else
			visiblelines = document.getElementById('j_id0:inputDetailForm:input_id_visiblelines__c').value;
		
		if( visiblelines=='' || visiblelines==null || VisibleLinesCheck(visiblelines) ){
			parent.showLoadingMask();
			save();
		}else {
			Ext.create('Ext.window.MessageBox').show({ msg:InputPageComp.ComponentVars.invalidVisibleLinesinput, width: 300,title:InputPageComp.ComponentVars.errorboxtitle, buttons: Ext.MessageBox.OK});
		}
		
	}
	
	function VisibleLinesCheck(num){
	var n = new RegExp();
        n.compile("^(0?[1-9]|[1-9][0-9])$");
		if (!n.test(num)) {
            return false;
        }
        return true;
}

 	function saveValidationRuleData()
	{
		var retVal= true;
		var str=document.getElementById(InputPageComp.ComponentVars.responseType).value;
		var validationstr = '';
		var error='';
		
		if(document.getElementById(InputPageComp.ComponentVars.validationInput).checked)
		{
			if(str.toLowerCase()=='number')
			{
				numberMinimum = document.getElementById('numberMinimum').value;
				numberMaximum = document.getElementById('numberMaximum').value;
				
				if ((numberMinimum.length > 0) && (numberMaximum.length > 0) && (Number(numberMinimum) > Number(numberMaximum)))
				{
					error=srValidationRuleNumberErrorMsg;
					retVal=false;
				}
				
				validationstr='MIN='+numberMinimum+getSeparatorByCustomSetting(PE)+'MAX='+numberMaximum;
			}
			else if((str.toLowerCase()=='date') || (str.toLowerCase()=='date/time'))
			{
				var ddldatatype = document.getElementById(InputPageComp.ComponentVars.dateType);
				strDateType = ddldatatype.options[ddldatatype.selectedIndex].value;
				
				var ddldateOperator = document.getElementById('dateOperator');
				strDateOperator = ddldateOperator.options[ddldateOperator.selectedIndex].value;
			 
			 	var strOffSet='';
				if(strDateType == '1') 
					strOffSet = document.getElementById('dateSpecificDate').value;
				else
					strOffSet = document.getElementById('dateDays').value;

				validationstr=strDateType+getSeparatorByCustomSetting(PE)+strDateOperator+getSeparatorByCustomSetting(PE)+strOffSet;
			}
			else if( (str.toLowerCase()=='picklist') && (isMultiSelectPickList) )
			{
				minOptions=optionsSpinner.getValue();

				if (minOptions >= maxNumberOfOptions)
				{
					error=srValidationRulePicklistErrorMsg;
					retVal=false;
				}
				validationstr='MIN='+minOptions;
			}
			else if(str.toLowerCase()=='text field')
			{
				minChar=document.getElementById('textMinimumCharacters').value;

				validationstr='MIN='+minChar;
			}
		}
		
		if (!retVal){
		
			parent.showLightningPopup('prompt','Error',error,'OK','','','','error');
		}
		document.getElementById(InputPageComp.ComponentVars.validationRule).value=validationstr;
		
		return retVal;
	}
		
	function saveValidationForDefaultValue()
	{
		var retVal= true;
		var error=defaultValueErrorMsg+' '+ defaultValuelabel;

		var inputIdDefaultValueEle= document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValue);
		var inputIdDefaultValueTxtEle= document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValueTxt);
		var inputIdDefaultValueDateEle=	document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValueDate);
		var inputIdDefaultValueDateTimeEle=	document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValueDateTime);
		var userFieldSelectIdEle=	document.getElementById(InputPageComp.ComponentVars.userFieldSelectId);
		var defaultValueSelectListEle=	document.getElementById(InputPageComp.ComponentVars.defaultValueSelectListId);

		if(defaultValueSelectListEle.value=='userFieldSelected' && userFieldSelectIdEle.value==''){	
				retVal= false;
		}else if(defaultValueSelectListEle.value=='defaultValueEntered' &&	
				((inputDataTypeForDatePicker=='Date' && inputIdDefaultValueDateEle.value=='')
					|| (inputDataTypeForDatePicker=='Date/Time'  && inputIdDefaultValueDateTimeEle.value=='')
					|| (inputDataTypeForDatePicker=='Text Area'  && inputIdDefaultValueEle.value=='')
					|| ((inputDataTypeForDatePicker=='Text Field' || inputDataTypeForDatePicker=='Number') && inputIdDefaultValueTxtEle.value=='')
				)){
					retVal= false;
				
		}else if(defaultValueSelectListEle.value!='userFieldSelected' && defaultValueSelectListEle.value!='defaultValueEntered'){
			userFieldSelectIdEle.value='';
			inputIdDefaultValueDateEle.value='';
			inputIdDefaultValueDateTimeEle.value='';
			inputIdDefaultValueEle.value='';
			inputIdDefaultValueTxtEle.value='';
		}

		if(retVal && defaultValueSelectListEle.value=='defaultValueEntered' && 
				inputDataTypeForDatePicker=='Number'){
				
					if(isNaN(inputIdDefaultValueTxtEle.value)){
						error=defaultValuelabel+' '+InvalidNumberErrorMsg; 
						retVal=false; 
					}
		}

		if (!retVal){		
			parent.showLightningPopup('prompt','Error',error,'OK','','','','error');
		}		
		return retVal;
	}
		

	function createRedioStore(inputValue){
		if(inputValue != null && inputValue != '' ){
			if(inputValue.indexOf(PE) > -1){
				var strLst = RFSplit(inputValue,PE);
				if(strLst.length > 0){
					var i=0;
					while(i<strLst.length){
						var sLst = RFSplit(strLst[i],EF);
						if(sLst.length > 0){
							var inputvalueArray = new Array(3);
							inputvalueArray[0] = sLst[0];
							inputvalueArray[1] = sLst[1];
							inputvalueArray[2] = sLst[2];
							if(isPicklistInput())
								picklistData.push(inputvalueArray);
							else 
							listData.push(inputvalueArray);
						}
						
						i++;
					}
				}
			}else if(inputValue.length > 0){
				if(inputValue.indexOf(EF) > -1){
					var strLst = RFSplit(inputValue,EF);
					if(strLst.length > 0){
						
						var inputvalueArray = new Array(3);
						inputvalueArray[0] = strLst[0];
						inputvalueArray[1] = strLst[1];
						inputvalueArray[2] = strLst[2];
						if(isPicklistInput())
							picklistData.push(inputvalueArray);
						else 
						listData.push(inputvalueArray);
						
						i++;
						
					}
				}
			}
		}
	}
	
	function setConditionStr( rValue){
		if(rValue != null ){
			document.getElementById(InputPageComp.ComponentVars.condition_id).value= rValue[0];
			window.parent.infixCondition =rValue[0];
			document.getElementById(InputPageComp.ComponentVars.conditionPostfix_id).value=rValue[1];
			window.parent.postfixCondition =rValue[1];
		}
	}

	function openConditionPage(){
		var url= 'FulfillmentInputConditionalPage?isCopy='+isCopy+'&Id='+inputId+'&requestId='+reqId;
		parent.showLightningPopup('vfModalPage',FulfillmentInputConditionHeader,url,450,950);
		parent.onCompleteFunction = setConditionStr;
		window.parent.conditionWinObj=parent.popUpWindow;
		if(parent.parent && parent.parent.parent && parent.parent.parent.parent)
			parent.parent.parent.parent.scrollTo(0,0);
	}
	var conditionInvokeHandler = function (){
		
		var url= 'ControllProcessPage?inputId='+inputId+'&requestId='+reqId+'&isMultiSelect='+isMultiSelectPickList;
		parent.showLightningPopup('vfModalPage',lblTitle,url,515,800);
		parent.conditionWinObj=parent.popUpWindow;
		if(parent.parent && parent.parent.parent && parent.parent.parent.parent)
			parent.parent.parent.parent.scrollTo(0,0);
	};

	function displayConditionLink(conditional, controlProcess){
		if(conditional.checked){
			document.getElementById("conditionalLink_id").style.display= 'inline-block';
		}else{
			document.getElementById("conditionalLink_id").style.display= 'none';
		}
	}

	function displayCPLink(controlProcess){
		if(controlProcess.checked){
			document.getElementById("ControlProcessLink").style.display= 'inline-block';
		}else{
			document.getElementById("ControlProcessLink").style.display= 'none';
		}
	}

	function enableDisableLink(inputId, conditional, cp){
		var str=document.getElementById(InputPageComp.ComponentVars.responseType).value;
		if(isCopy!=null && isCopy=='true'){
		document.getElementById(InputPageComp.ComponentVars.controlProcess).disabled =true;
		document.getElementById(InputPageComp.ComponentVars.controlProcess).checked =false;
		document.getElementById("ControlProcessLink").style.display= 'none';
		
		}
		else if(inputId != null && inputId != '' && str.toLowerCase() != 'header section' && str.toLowerCase() != 'hyperlink'){

			document.getElementById(InputPageComp.ComponentVars.controlProcess).disabled =false;
			if(cp){
				document.getElementById('ControlProcessLink').style.display= 'inline'; 
			}else{
				document.getElementById('ControlProcessLink').style.display= 'none'; 
			}
		}else{
			document.getElementById(InputPageComp.ComponentVars.controlProcess).disabled =true;
			document.getElementById('ControlProcessLink').style.display= 'none'; 
		}
		
		if(conditional){
			document.getElementById("conditionalLink_id").style.display= 'inline';
		}else{
			document.getElementById("conditionalLink_id").style.display= 'none';
		}
	
	}
	function enabledisablescroll()
	{
		var str=document.getElementById(InputPageComp.ComponentVars.responseType).value;
		if(str.toLowerCase() == 'header section'){
			document.getElementById(InputPageComp.ComponentVars.groupInput).disabled =false;
		}else{
			document.getElementById(InputPageComp.ComponentVars.groupInput).disabled =true;
			
		}
	}
	function clearParentVar(){
		window.parent.infixCondition ='';
		window.parent.postfixCondition = '';
	}
	function getResponseType() {
	    var inputResType = document.getElementById(InputPageComp.ComponentVars.responseType).value;
		return inputResType.toLowerCase();
	}
	function isPicklistInput() {
		return (getResponseType() == 'picklist');
	}
	function isRadioButtonInput() {
		return (getResponseType() == 'radio button');
	}
	
	function getListData() {
	    var gridPanelData = [];
		if(isPicklistInput()) {
			gridPanelData = picklistData;
		} else if(isRadioButtonInput()) {
			gridPanelData = listData;
		}
		
		maxNumberOfOptions = gridPanelData.length;
        return gridPanelData;
	}
	Ext.onReady(function(){
		Ext.QuickTips.init();
		/*hide for existing record*/
		var backButton = document.getElementById('backButton');
		var separator = document.getElementById('separator');
		if (isNewField == 'true' && inputDataType) {
			backButton.style.display = 'inline-block';
			separator.style.display = 'inline-block';
		}else{
			backButton.style.display='none';
			separator.style.display = 'none';
		}
		setCProcessVisbility();
		enabledisablescroll();
			updateWinTitle();
		if(inputId != null && inputId != '' ){
		
			if(rType.toLowerCase()=='radio button'){
				if(radioInputValues != null && radioInputValues != ''){
					createRedioStore(radioInputValues);
				}
			} else if(rType.toLowerCase()=='picklist'){
				if(picklistInputValues != null && picklistInputValues != ''){
					createRedioStore(picklistInputValues);
				}
			}
		}
		showTable();       
		setData();
		picklistMinimumNumberSpinner();
		renderLookupFilterCombo();
		hideUnhidePanel();
		buttonValidator();
		window.parent.infixCondition ='';
		window.parent.postfixCondition = '';
		if(isCopy != null && isCopy=='true'){
		selectText();
		}
		window.parent.assignLookupCriteriaID(setLookupCriteriaID);
	});
	function createLightningTooltip(qtipTarget,qtipContent,qtipWidth){
		return new Ext.ToolTip({
			target: qtipTarget,
			floating: false,
			baseCls: 'slds-popover slds-popover_tooltip slds-nubbin_bottom-left',
			bodyCls: 'slds-popover__body',
			defaultAlign:'br-tl',
			html: qtipContent,
			dismissDelay: 0,
			maxWidth: qtipWidth
		});			  				
	
	}
	var lkfData = [['No', InputPageComp.ComponentVars.NoLookupFilter],['New',InputPageComp.ComponentVars.NewLookupFilter],['Existing',InputPageComp.ComponentVars.ExistingLookupFilter]];
	var defaultLkfData = [['No', InputPageComp.ComponentVars.NoLookupFilter],['New',InputPageComp.ComponentVars.NewLookupFilter],['Existing',InputPageComp.ComponentVars.ExistingLookupFilter]];
	function renderLookupFilterCombo(){
		var lkFilterStore = new Ext.data.ArrayStore({
								id:'lkFilterStore',
								fields: [{
									name: 'lkFilterVal',
									type: 'string'
								},{
									name: 'lkFilterLbl',
									type: 'string'
								}],
								data: lkfData
							});
		lkFilterCombo = new Ext.form.ComboBox({
								id:'lkFilterCombo',
						        store: lkFilterStore,
						        mode: 'local',
						        triggerAction: 'all',
						        valueField: 'lkFilterVal',
						        displayField: 'lkFilterLbl',
						        selectOnFocus: true,
						        renderTo:'lkFilterDiv',
						        editable: false,
								width:200,
								listWidth:200,
								height:25,
								display:'block',
								hidden:true,
								value:'No',
								style: {               
									fontSize: '12px' 
								},  
								//tpl:'<tpl for="."><div ext:qtip="{lkFilterLbl}" class="x-combo-list-item" style="font-family: Tahoma, MS Sans Serif; font-size: 11px;">{lkFilterLbl}</div></tpl>',
								listeners:{
									collapse: function( combo ){
										var newValue = combo.getValue();
										if(newValue == 'New'){
											openLookupFilterPage(true);
											setEditLKFilterStyle('none');
										}else if(newValue == 'Existing'){
											openLookupFilterPopUp(false);
											setEditLKFilterStyle('none');
										}else if(newValue == 'No'){
											setEditLKFilterStyle('none');
											document.getElementById(InputPageComp.ComponentVars.lookupFilterId).value = '';
										}else if(newValue != 'No'){
											setEditLKFilterStyle('block');
											document.getElementById(InputPageComp.ComponentVars.lookupFilterId).value = newValue;
										}
	
									}
								}
						    });
	
		var lkfId = document.getElementById(InputPageComp.ComponentVars.lookupFilterId).value;
		if(inputId && lkfId){
			var lkfName = document.getElementById(InputPageComp.ComponentVars.lookupFilterName).value;
			addAndSelectEntryInLKFcombo(lkfId,lkfName);
		}
	}
	function resetLkfCombo(){
		var lkfCombo = Ext.getCmp('lkFilterCombo');
		if(lkfCombo){
			lkfCombo.getStore().loadData(defaultLkfData);
			lkfCombo.setValue('No');
			setEditLKFilterStyle('none');
			document.getElementById(InputPageComp.ComponentVars.lookupFilterId).value = '';
		}
	}
	function picklistMinimumNumberSpinner()
	{
		RemedyForceHTMLProcessor.clearHTML(document.getElementById('options-ct'));
		optionsSpinner=null;
		optionsSpinner=new Ext.form.field.Spinner({
                id:'daysSpinner',
                value:numberOfOptions,
                minValue: 0,
                maxValue: 999,
                width:70,
				maxLength:3,
				allowDecimals: false,
				allowNegative: false,
				autoCreate: {tag: 'input', type: 'text', autocomplete: 'off', maxlength: '3'},
                renderTo:'options-ct',
			   enableKeyEvents : true,
			   listeners: {
					keydown :function( obj, e) {
					if((e.getKey()==109) || (e.getKey()==173) || (e.getKey()==189))
					 	e.stopEvent();
					},
					keyup :function( obj, e) {
					validateSpinnerField(obj, e);
					},
					spinup:function (){
						var me = this;
						var val = parseInt(me.getValue());
						if(val < 999)
						me.setValue(val +1);
					},
					spindown: function() {
						var me = this;
						val = parseInt(me.getValue());
						if(val > 0)			
							me.setValue((val - 1));
						
					}
				}	
		});
	}
	
	function showErrorMsg(){
		var message = [];
		message= errorStr;
		var copyBtn = document.getElementById('copyButton');
		var errorMsgFromPage=	document.getElementById(InputPageComp.ComponentVars.errorMsgFromPage);
		if(message == saveMessage){
			parent.showLightningPopup('toast','',message,'','','','','success');
		  if(saveandNewClicked){
		   resetForm();
			   document.getElementById('copyBtnInputTab').setAttribute("aria-disabled",true);
			   copyBtn.style.color='grey';
			   copyBtn.style.cursor='default';
			   parent.nextPrevInputStep(-1);
		   }
		   else{
			   if(document.getElementById(InputPageComp.ComponentVars.responseType).value.toLowerCase()=='text area (rich)'){
					document.getElementById('copyBtnInputTab').setAttribute("aria-disabled",true);
					copyBtn.style.color='grey';
					copyBtn.style.cursor='default';
			   }	
			   else{
				   document.getElementById('copyBtnInputTab').setAttribute("aria-disabled",false);
				   copyBtn.style.cursor='pointer';
				   copyBtn.style.color='unset';

			   }
			   parent.nextPrevInputStep(-2);
		   }
		}else if(!errorStr && errorMsgFromPage && errorMsgFromPage.textContent){
			parent.showLightningPopup('prompt','',errorMsgFromPage.textContent,'OK','','','','');
		}		
		else{
			var copyBtn = document.getElementById('copyButton');
			parent.showLightningPopup('prompt','',message,'OK','','','','');		
		}
    }
    
    function resetValidationRuleData()
	{
		var txtValidationRule = document.getElementById(InputPageComp.ComponentVars.validationRule);
		if(txtValidationRule != null && txtValidationRule != 'undefined')
			txtValidationRule.value = '';
		
		var ddlDateType = document.getElementById(InputPageComp.ComponentVars.dateType);
		if(ddlDateType != null && ddlDateType != 'undefined')
		{
			ddlDateType.value = '1';
			ddlDateType.selectedIndex = 0;
		}
	}
	
    function buttonValidator(){
		
		var copyBtn = document.getElementById('copyButton');
		
		if(isInputCreateable == 'false' || isInputUpdateable == 'false'){
			var saveBtn = document.getElementById('saveBtn');
			saveBtn.disabled =true;
			var saveandnewBtn = document.getElementById('saveandnewBtn');
			saveandnewBtn.disabled =true;
		}
		if(isInputUpdateable == 'true' && saveandNewClicked==false){
			if(document.getElementById(InputPageComp.ComponentVars.responseType).value.toLowerCase()=='text area (rich)'){
				document.getElementById('copyBtnInputTab').setAttribute("aria-disabled",true);
			}	
			else{
				document.getElementById('copyBtnInputTab').setAttribute("aria-disabled",false);
			}
		}
		
		if(isCopy!=null && isCopy=='true'){
			document.getElementById(InputPageComp.ComponentVars.responseType).disabled=false;
			document.getElementById('selectedResType').style.display= 'none';
			document.getElementById('resTypeInput').style.display= 'block';
			document.getElementById('headerSection').style.height = 'Auto';
		}
	}
	function setCProcessVisbility(){
		enableDisableLink(inputId,isConditinal,isControlProcess );
	}
	function updateWinTitle(){
		var newTitle = fulfillmentInputLabel +' - '+newLabel;
		var fulfillmentHeaderElem = document.getElementById(fulfillmentHeader);
		if(isCopy!=null && isCopy=='true'){
			fulfillmentHeaderElem.textContent = newTitle;
			fulfillmentHeaderElem.innerText = newTitle;
		}
		else if(inputId != null && inputId != '') {// && parent.fulfillmentWinObj!= null && parent.fulfillmentWinObj!= 'undefined'){
			document.getElementById(InputPageComp.ComponentVars.responseType).disabled=true;
			if(document.getElementById(InputPageComp.ComponentVars.cbMultiSelectInput).checked==true)
				document.getElementById(InputPageComp.ComponentVars.cbMultiSelectInput).disabled=true;
            var title = fulfillmentInputLabel +' - '+Ext.util.Format.htmlDecode(inputPrompt);
			title = Ext.util.Format.ellipsis(title,80);
            fulfillmentHeaderElem.textContent = title;
			fulfillmentHeaderElem.innerText = title;
        }else{
        	fulfillmentHeaderElem.textContent = newTitle;
			fulfillmentHeaderElem.innerText = newTitle;
        } 
	}
	
	
var checkforsearch = false;
	
	function openLookupObject(){
       opentWindow();
    }
   
    var storedata =[];
    
    
    function opentWindow(){
    
	    storedata.sort();
	    
	    var tbvalue='';
		var Label='';
		SelectedVal ='';
	    /*
	     * Changes for multiselect 
	     */
		var SearchCmp = new Ext.Component({ 
			html: '<span class="searchtext-input-wrapper"><a title="'+ InputPageComp.ComponentVars.SearchLabel +'"class="rf-icon-search" onclick="searchFuncCall('+'false'+');" ></a> <input type="text" id="SearchField" class="searchfield-input" autocomplete="off" size="20" placeholder="'+ InputPageComp.ComponentVars.SearchLabel +'" /><a title="'+clear+'"  class="rf-icon-cross" onclick="searchFuncCall('+'true'+');" id="clearLink"></a></span>'
		});
		var objectDataCols = new Array(2);  
		objectDataCols[0]='ID'; 
		objectDataCols[1]='Name';
		objectData = new Ext.data.Store({
			data: storedata,
			fields:objectDataCols
        });
		var ObjLkpSelect = new Ext.grid.GridPanel({
			store: objectData,
			name: 'ObjLookupselect',
			id:'ObjLkpSelect',
			border:false,
			stateful: true,
			columns:[
				{   id:objectDataCols[1],
					sortable: false,
					flex:1,
					menuDisabled: true,
					dataIndex:objectDataCols[1]
				}],
			height: 275,
			hideHeaders: true,
			stateful: true,
			stateId: 'ObjLkpSelect',
			selModel: new Ext.selection.RowModel({mode:"SINGLE" }),
			viewConfig: {
				forceFit:false,
				scrollOffset:0,
				columnLines: false,
				stripeRows: false
			},listeners: {
				itemclick :function(grid,record,b){
					
					SelectedVal =record.get('ID');//value of the selected element
					var MultiStore=Ext.getCmp('ObjLkpSelect').getStore();
					var index = MultiStore.indexOf(record);

					Label= record.get('Name');
					Ext.getCmp('OkBtn').setDisabled(false);
					document.getElementById('lkFilterDiv').style.display = 'block';
				  },
				  itemdblclick :function (grid, record, item, rowIndex, e, eOpts ) {
					SelectedVal =record.get('ID');//value of the selected element
					 var MultiStore=Ext.getCmp('ObjLkpSelect').getStore();
					 var index = MultiStore.indexOf(record);              
					 var Label=record.get('Name');                          
					document.getElementById(InputPageComp.ComponentVars.referenceType).value=Label;
					var prevSelectedVal = document.getElementById(InputPageComp.ComponentVars.referenceValue_id).value;
					document.getElementById(InputPageComp.ComponentVars.referenceValue_id).value=SelectedVal;  //selected val set to input hidden field
					document.getElementById('lkFilterDiv').style.display = 'block';
					if(prevSelectedVal != SelectedVal){
						resetLkfCombo();
					}
					 newpopUpWindow.close();
					 showLookupFilterCombo(true);	
			  }
			 }     
			
	});
		Ext.getCmp('ObjLkpSelect').store.loadData(storedata,false);
	    var msForm = new Ext.form.FormPanel({
	        width: 285,
			height:375,
			bodyStyle:'padding-left:10px; padding-right:8px; border:none;',
	        viewConfig: {forceFit: true},
			tbar:[SearchCmp],
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
				height:40,
				margin:'10 0 0 0',
				padding:'0 0 0 0',
				items: [
					 {
						xtype: 'tbfill'
						},{
					   text: InputPageComp.ComponentVars.OkLabel,
					   id:'OkBtn',
					   cls:'slds-button slds-button_brand',
					   minWidth:40,
					   height:32,
					   disabled : true,
					   handler: function(){
						
						   document.getElementById(InputPageComp.ComponentVars.referenceType).value=Label;
						   var prevSelectedVal = document.getElementById(InputPageComp.ComponentVars.referenceValue_id).value;
						   document.getElementById(InputPageComp.ComponentVars.referenceValue_id).value=SelectedVal; //selected val set to input hidden field
						   if(prevSelectedVal != SelectedVal){
								resetLkfCombo();
						   }
						   newpopUpWindow.close();
						   showLookupFilterCombo(true);	
					   }
				   },{
					   text: InputPageComp.ComponentVars.CancelLabel,
					   id:'CancelBtn',
					   cls:'slds-button slds-button_neutral',
					   minWidth:45,
					   height:32,
					   handler: function(){
						newpopUpWindow.close();
					   }
				  }
				]
			}],
         	items:[ObjLkpSelect], 
				
				listeners:{
					render:function(panel){
						panel.el.on('keypress',PanelKeyHandler);
					  }
			    }
                    
    });
    
   
        var newpopUpWindow = new Ext.Window({
                            xtype:'window',
                            height: 420,
                            width: 290,
                            title: InputPageComp.ComponentVars.LookupWindowTitle,
                            modal:true,
                            id:'popUpWindow',
                            resizable:false,
                            bodyStyle:'background-color:#FFFFFF;',
                            constrain : true,
							viewConfig: {forceFit: true},
							cls:'RFAdminWindow whiteBackgroud padding0Class',
							closable: false,
							items:[msForm],
							tools:[{
								id:'rfclose',
								handler: function (event, toolEl, panelHeader) {
									newpopUpWindow.close();
								}
							}]
                          });
                        
      newpopUpWindow.show();  
	  document.getElementById(InputPageComp.ComponentVars.referenceBtn).disabled =false;
    }
	function searchFuncCall(isClear)
    {
		var searchstring = document.getElementById("SearchField").value;
		if(isClear == 'true' || isClear == true) {
			document.getElementById("SearchField").value = '';
			searchstring = '';
			if(document.getElementById("clearLink"))
				document.getElementById("clearLink").style.visibility="hidden";
			parent.showLoadingMask();
			doSearch(searchstring);
		} else {
			if(document.getElementById("clearLink"))
				document.getElementById("clearLink").style.visibility="visible";
	    	if(checkforsearch){
				searchstring = searchstring.replace("\"","");
		    	searchstring = searchstring.replace("*","");
			   if(2>searchstring.trim().length || searchstring==InputPageComp.ComponentVars.SearchLabel) {
				  showMessage();
				  checkforsearch = false;
				return;
			   }
			}else{
				if(2>searchstring.trim().length)
				{
				   showMessage();
				   checkforsearch = false;
				   return;
			   }
			}
			parent.showLoadingMask();
			doSearch(searchstring);
		}
	}	
  function PanelKeyHandler(panel)
  {
		var key = panel.getKey();
		if(key === panel.ENTER ){
			   searchFuncCall('false');
		}
   }
  function showMessage(){
	  parent.GetMessageBox( 'bmc-message' ).show({
		title:InputPageComp.ComponentVars.warningTitle,
		msg:InputPageComp.ComponentVars.SearchCharErrormSG,
		width:300, 
		icon: Ext.MessageBox.WARNING,
		buttons: Ext.Msg.OK            
	});
  }
  function disableButton(){
    parent.showLoadingMask();
	document.getElementById(InputPageComp.ComponentVars.referenceBtn).disabled = true;
	fetchObjectList();
}

  function scrollPickListOptions(direction){	
	if(!validateGridRow()){
		return;
	}
	var selectedRowIndexes = [];
	var tempSelectedRowIndexes = [];
	var selectedRecordsRows = grid.getSelectionModel().getSelection(); 
	var selectedRecords = [];
	var top = 0;
	var bottom = grid.getStore().data.length -1;
	var selectedRecordArray = [];
	Ext.iterate(selectedRecordsRows, function(record, index) {		
		selectedRowIndexes.push(grid.getStore().indexOf(record)); 
	});  	
	
	selectedRowIndexes.sort( function(a,b) { return a - b; } );
	for(var i=0;i<selectedRecordsRows.length;i++)
		tempSelectedRowIndexes[i] =selectedRowIndexes[i];
		
	selectedFirstElement = tempSelectedRowIndexes[0];
	selectedLastElement = tempSelectedRowIndexes.length-1;
	if(direction == 'down' || direction == 'bottom')
		selectedRowIndexes.reverse();	
	for(var i=0;i<selectedRecordsRows.length;i++){	
		selectedRecords[i]  = grid.getStore().getAt(selectedRowIndexes[i]);		
		if(direction == 'up' && tempSelectedRowIndexes[selectedFirstElement]!= top){		
			store.remove(selectedRecords[i]);
			store.insert(selectedRowIndexes[i]-1,selectedRecords[i]);
			selectedRecordArray[i] = selectedRowIndexes[i]-1;
		}else if(direction == 'down' &&  tempSelectedRowIndexes[selectedLastElement]!= bottom){				
			store.remove(selectedRecords[i]);
			store.insert(selectedRowIndexes[i]+1,selectedRecords[i]);
			selectedRecordArray[i] = selectedRowIndexes[i]+1;
		}else if(direction == 'top'){		
			store.remove(selectedRecords[i]);
			store.insert(top,selectedRecords[i]);
			selectedRecordArray[i] = top;
			top++;		
		}else if(direction == 'bottom'){		
			store.remove(selectedRecords[i]);
			store.insert(bottom,selectedRecords[i]);
			selectedRecordArray[i] = bottom;
			bottom--;
}
	}  
		for (var i= 0; i<selectedRecordArray.length; i++){
			grid.getSelectionModel().select(selectedRecordArray[i],true);
		}
		//setting the default index after moving rows up and down 
		var dataArray = grid.getStore().data.items;
		for (var i = 0; i < dataArray.length; i++) {        
			if(dataArray[i].data.defaultValue == 'true'){
				storeindex = i;
				
			}
		}
		gridDataChanged = true;
}
function openLookupFilterPopUp(){
	var filterFor = document.getElementById(InputPageComp.ComponentVars.referenceValue_id).value;
	if(filterFor){
		var filterClause = filterFor;
		parent.onCompleteFunction = null;
		window.parent.showLightningPopup('vfModalPage',lkfPopupTitle,'SearchAndLink?txt=changelookupValues&parentName=SRM_RequestDefinition__c&childName=LookupFilter__c&isLookUp=true&filterId=temp_lkf&isCustomLookup=false&isSRD=true&isELKF=true&lightningUI=true&modalType=rfModalVFPage&param1='+filterFor,500,895);	
	}
}
function setLookUpFilterId(lkfId){
	if(lkfId){
		var strLst = RFSplit(lkfId,EF);
		if(strLst.length > 0){
			document.getElementById(InputPageComp.ComponentVars.lookupFilterId).value = strLst[0];
			addAndSelectEntryInLKFcombo(strLst[0], strLst[1]);
		}	
	}
}

function showLookupFilterCombo(show){
	lkFilterCombo.setVisible(show);
	if(show)
		document.getElementById('lkFilterDiv').style.display = 'block';
}
function addAndSelectEntryInLKFcombo(lkfValue,lkfLabel){
	var lkfCombo = Ext.getCmp('lkFilterCombo');
	if(lkfCombo){
		var index = lkfCombo.getStore().findExact('lkFilterVal',lkfValue);
		if(index == -1){
			lkfData.push([lkfValue,lkfLabel]);
			lkfCombo.getStore().loadData(lkfData);
			lkfCombo.setValue(lkfValue);
		}else{
			var labelEntryToUpdate, recordToRemove, recordIndex = -1, recordIndexToremove;
			lkfCombo.getStore().each(function(record){
				recordIndex +=1;
				if(record.data.lkFilterVal == lkfValue && record.data.lkFilterLbl != lkfLabel){
					labelEntryToUpdate = [record.data.lkFilterVal, lkfLabel];
					recordToRemove = record;
					recordIndexToremove = recordIndex;
				}
			});
			if(labelEntryToUpdate && recordToRemove){
					lkfData.splice(recordIndexToremove,1);
					lkfData.push(labelEntryToUpdate);
					lkfCombo.getStore().loadData(lkfData);
			}
			lkfCombo.setValue(lkfValue);
		}
		lkfCombo.collapse();
		setEditLKFilterStyle('block');
		SelectedVal = lkfValue;
		document.getElementById(InputPageComp.ComponentVars.lookupFilterId).value = lkfValue;
	}
}

function openLookupFilterPage(isNew){
	var lookupObj=document.getElementById(InputPageComp.ComponentVars.referenceValue_id).value;
	if(isNew == true){
		var url = 'FulfillmentInputLookupFilterPage?srmFiId='+inputId+'&requestId='+reqId+'&LookupObj='+lookupObj;
		parent.showLightningPopup('vfModalPage',InputPageComp.ComponentVars.fulfillmentInputFilterTitle,url,538,895);
		parent.onCompleteFunction = callBackForLKFilterPopUp;
	}else if(isNew == false){
		var LKfilterId = lkFilterCombo.getValue();
		var url = 'FulfillmentInputLookupFilterPage?srmFiId='+inputId+'&requestId='+reqId+'&LookupObj='+lookupObj+'&LKfilterId='+LKfilterId;
		parent.showLightningPopup('vfModalPage',InputPageComp.ComponentVars.fulfillmentInputFilterTitle,url,538,895);
		parent.onCompleteFunction = callBackForLKFilterPopUp;
	}
}
function setLookupCriteriaID(filterObjId,filterObjName){
	addAndSelectEntryInLKFcombo(filterObjId,filterObjName);
}
function setEditLKFilterStyle(style){
	var editLkfLink = document.getElementById(InputPageComp.ComponentVars.editLKFilterLink);
	if(editLkfLink){
		editLkfLink.style.display= style; 
	}	
}
function callBackForLKFilterPopUp(lkfId){
}
function selectHeaderSeparator(value){
	document.getElementById(InputPageComp.ComponentVars.separatorValue).value = value;
}
function backButtonJS(){
	if(isformDirty){
		parent.showLightningPopup('modal',InputPageComp.ComponentVars.warningTitle,InputPageComp.ComponentVars.UnsavedFulfillmentInput_Warning,labelYes,labelNo,'SRDForm','fulfillmentInputBackHandler&isNewField='+isNewField);
	}else{
		setDirty(false);
		if(isNewField == 'true'){
			parent.nextPrevInputStep(-1);
		}else{
			parent.nextPrevInputStep(-2);
		}
	}
}
function cancel(){
	if(isformDirty){
		parent.showLightningPopup('modal',InputPageComp.ComponentVars.warningTitle,InputPageComp.ComponentVars.UnsavedFulfillmentInput_Warning,labelYes,labelNo,'SRDForm','fulfillmentInputCancelHandler');
	}else{
		setDirty(false);
		parent.clearInputPage();
		parent.nextPrevInputStep(-2);
	}
}

function rfPopUpClose(iframeId){
	parent.rfPopUpClose(iframeId);
}
function addNewPicklistValue(){
	
	if(!validateGridRow()){
		return;
	}
	var position = store.data.items.length;
	
	store.insert(position, {
		'displayValue': '',
		'storedValue': '',
		'defaultValue': ''
	})
	grid.plugins[0].startEditByPosition({
		row: position,
		column: 0
	});
}
function validateGridRow(){
	let store = grid.getStore();
	var position = store.data.items.length;
	if(position >1){
		position = position-1;
	}else{
		position = 0;
	}
	if(store.data.items.length>0){
		if(grid.store.getAt(position)){
			var displayValue = grid.store.getAt(position).data['displayValue'];
			var storedValue = grid.store.getAt(position).data['storedValue'];
			if(displayValue == null || displayValue==''){
				parent.showLightningPopup('prompt','Error',FulfillmentInputDisplayedValueValidationMsg,'OK','','SRDInputPage','InputPageAction','error');
				
				return false;
			}else if(storedValue == null || storedValue==''){
				parent.showLightningPopup('prompt','Error',FulfillmentInputStoredValueValidationMsg,'OK','','SRDInputPage','InputPageAction','error');
				
				return false;
			}
		}
	}	
	return true;
}
function performActionForSRDInput(action){
	var position = store.data.items.length;
	if(position >1){
		position = position-1;
	}else{
		position = 0;
	}
	if(action == 'InputPageAction'){
		grid.plugins[0].startEditByPosition({
			row: position,
			column: 0
		});
	}
}


function defaultValueComboChange(val) { 	
		
	var inputIdDefaultValueEle= document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValue);
	var inputIdDefaultValueTxtEle= document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValueTxt);
	var inputIdDefaultValueDateEle=	document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValueDate);
	var inputIdDefaultValueDateTimeEle=	document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValueDateTime);
	var readOnlyDefaultValCheckBoxEle=	document.getElementById(InputPageComp.ComponentVars.readOnlyDefaultValCheckBox);
	
	var userFieldSelectIdEle=	document.getElementById(InputPageComp.ComponentVars.userFieldSelectId);
	var valueFieldTD = document.getElementById('valueFieldTD');	
	var editableChangeTD = document.getElementById('editableChangeTD');	

	if(val){
		showArray=[valueFieldTD,editableChangeTD];
		hideArray=[];
		hideAllInputs(hideArray,showArray);
	}
	else{
		showArray=[];
		hideArray=[valueFieldTD,editableChangeTD];
		hideAllInputs(hideArray,showArray);
		return;
	}

	if(val=='userFieldSelected'){
			inputIdDefaultValueEle.value='';
			inputIdDefaultValueDateEle.value='';
			inputIdDefaultValueDateTimeEle.value='';
			inputIdDefaultValueTxtEle.value='';
			userFieldSelectIdEle.style.display='';
			showArray=[userFieldSelectIdEle];
			hideArray=[inputIdDefaultValueDateEle,inputIdDefaultValueEle,inputIdDefaultValueDateTimeEle,inputIdDefaultValueTxtEle];
			hideAllInputs(hideArray,showArray);
	}else if(val=='defaultValueEntered'){
		userFieldSelectIdEle.value='';
		if(inputDataTypeForDatePicker=='Date'){
			showArray=[editableChangeTD,valueFieldTD,inputIdDefaultValueDateEle];
			hideArray=[userFieldSelectIdEle,inputIdDefaultValueEle,inputIdDefaultValueDateTimeEle,inputIdDefaultValueTxtEle];
			hideAllInputs(hideArray,showArray);
		}else if(inputDataTypeForDatePicker=='Date/Time'){
			showArray=[editableChangeTD,valueFieldTD,inputIdDefaultValueDateTimeEle ];
			hideArray=[userFieldSelectIdEle,inputIdDefaultValueEle,inputIdDefaultValueDateEle,inputIdDefaultValueTxtEle];
			hideAllInputs(hideArray,showArray);
		}else if(inputDataTypeForDatePicker=='Text Area'){
			showArray=[editableChangeTD,valueFieldTD,inputIdDefaultValueEle];
			hideArray=[userFieldSelectIdEle,inputIdDefaultValueDateTimeEle,inputIdDefaultValueDateEle,inputIdDefaultValueTxtEle];
			hideAllInputs(hideArray,showArray);
		}else{
			showArray=[editableChangeTD,valueFieldTD,inputIdDefaultValueTxtEle];
			hideArray=[userFieldSelectIdEle,inputIdDefaultValueDateTimeEle,inputIdDefaultValueDateEle,inputIdDefaultValueEle];
			hideAllInputs(hideArray,showArray);
		}
	}
	if(readOnlyDefaultValCheckBoxEle){
		readOnlyDefaultValCheckBoxEle.disabled=false;
	}
}



function changeInputDataType(){
	
	var defaultValueTRs= document.getElementsByClassName('defaultValueTR');
	var inputIdDefaultValueEle= document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValue);
	var inputIdDefaultValueTxtEle= document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValueTxt);
	var inputIdDefaultValueDateEle=	document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValueDate);
	var inputIdDefaultValueDateTimeEle=	document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValueDateTime);	
	var defaultValueSelectListEle=	document.getElementById(InputPageComp.ComponentVars.defaultValueSelectListId);
	var userFieldSelectIdEle=	document.getElementById(InputPageComp.ComponentVars.userFieldSelectId);
	var editableChangeTD = document.getElementById('editableChangeTD');	
	var valueFieldTD = document.getElementById('valueFieldTD');	
	if(showDefaultValueSection=="true"){
		for (var i = 0; i < defaultValueTRs.length; i++) {
			defaultValueTRs[i].style.display='';
		}		
		defaultValueSelectListEle.value='';
		showArray=[];
		hideArray=[editableChangeTD,valueFieldTD,userFieldSelectIdEle,inputIdDefaultValueEle,inputIdDefaultValueDateTimeEle,inputIdDefaultValueDateEle,inputIdDefaultValueTxtEle];
		hideAllInputs(hideArray,showArray);

	}else{
		defaultValueSelectListEle.value='';
		for (var i = 0; i < defaultValueTRs.length; i++) {
			defaultValueTRs[i].style.display='none';
		}
	}
}
			
function handleDefaultValueOnClone(){
	var defaultValueTRs= document.getElementsByClassName('defaultValueTR');
	var hideArray=[], showArray=[];
	if(showDefaultValueSection=="true"){
		for (var i = 0; i < defaultValueTRs.length; i++) {
			defaultValueTRs[i].style.display='';
		}
		var inputIdDefaultValueEle= document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValue);
		var inputIdDefaultValueTxtEle= document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValueTxt);
			var inputIdDefaultValueDateEle=	document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValueDate);
			var inputIdDefaultValueDateTimeEle=	document.getElementById(InputPageComp.ComponentVars.inputIdDefaultValueDateTime);
			var defaultValueSelectListEle=	document.getElementById(InputPageComp.ComponentVars.defaultValueSelectListId);
			var userFieldSelectIdEle=	document.getElementById(InputPageComp.ComponentVars.userFieldSelectId);
			var editableChangeTD = document.getElementById('editableChangeTD');	
			var valueFieldTD = document.getElementById('valueFieldTD');	
			if(defaultSelectedUserField){		
				defaultValueSelectListEle.value='userFieldSelected';
				showArray=[editableChangeTD,valueFieldTD,userFieldSelectIdEle];
				hideArray=[inputIdDefaultValueEle,inputIdDefaultValueDateTimeEle,inputIdDefaultValueDateEle,inputIdDefaultValueTxtEle];
				hideAllInputs(hideArray,showArray);

			}else if(defaultStaticValue || defaultStaticValueDate || defaultStaticValueDateTime){
				defaultValueSelectListEle.value='defaultValueEntered';
			if(inputDataTypeForDatePicker=='Date'){
					showArray=[editableChangeTD,valueFieldTD,inputIdDefaultValueDateEle];
					hideArray=[userFieldSelectIdEle,inputIdDefaultValueEle,inputIdDefaultValueDateTimeEle,inputIdDefaultValueTxtEle];
					hideAllInputs(hideArray,showArray);
			}else if(inputDataTypeForDatePicker=='Date/Time'){
					showArray=[editableChangeTD,valueFieldTD,inputIdDefaultValueDateTimeEle ];
					hideArray=[userFieldSelectIdEle,inputIdDefaultValueEle,inputIdDefaultValueDateEle,inputIdDefaultValueTxtEle];
					hideAllInputs(hideArray,showArray);
			}else if(inputDataTypeForDatePicker=='Text Area'){
					showArray=[editableChangeTD,valueFieldTD,inputIdDefaultValueEle];
					hideArray=[userFieldSelectIdEle,inputIdDefaultValueDateTimeEle,inputIdDefaultValueDateEle,inputIdDefaultValueTxtEle];
					hideAllInputs(hideArray,showArray);
				}else{
					showArray=[editableChangeTD,valueFieldTD,inputIdDefaultValueTxtEle];
					hideArray=[userFieldSelectIdEle,inputIdDefaultValueDateTimeEle,inputIdDefaultValueDateEle,inputIdDefaultValueEle];
					hideAllInputs(hideArray,showArray);
			}
			}
		}else{
			for (var i = 0; i < defaultValueTRs.length; i++) {
				defaultValueTRs[i].style.display='none';
			}
		}
}


	function hideAllInputs(hideArray, showArray){
		if(hideArray){
			for (var i = 0; i < hideArray.length; i++) {
				hideArray[i].style.display='none';
			}
		}

		if(showArray){
			for (var i = 0; i < showArray.length; i++) {
				showArray[i].style.display='';
			}
		}
	}


function handleResponseChange(val) {
	parent.showLoadingMask();
	changeResponseType(val); 
}

