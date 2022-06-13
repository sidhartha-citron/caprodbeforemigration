var hourField,minField,ScheduleIntervalData;
var validateInterval = false;
function renderImportPageElements(){
	
	hourField = Ext.create('Ext.form.field.Number', {
		width: 55,
		maxValue: 10000,
		minValue: 0,
		maxLength:5,
		value: defaultHours,
		renderTo: 'hourFieldTD',
		enableKeyEvents: true,
		listeners: {
			keyup : function(hourField, e, obj) {
				validateSpinnerField(hourField, e);
			}
		}
	});
	
	minField = Ext.create('Ext.form.field.Number', {
		width: 55,
		minValue: 0,
		maxValue: 59,
		maxLength:2,
		enableKeyEvents: true,
		value: defaultMins,
		renderTo: 'minuteFieldTD',
		listeners: {
			keyup : function(minField, e, obj) {
				validateSpinnerField(minField, e);
			}
		} 
	});
	
	ImportJobBtn = Ext.create('Ext.Button', {
		id: 'ImportJobButton',
		text: StartLbl,
		renderTo:'ImportJobButtonTD',
		baseCls: 'slds-button slds-button_neutral',
		height:32,
		handler:function(){
			if(this.getText()==StartLbl){
				validateInterval = true;
				if(CalculateInterval()){
					this.setText(StopLbl);
					this.setDisabled(true);
					ScheduleJob(ScheduleIntervalData);
				}
			}else{
				this.setText(StartLbl);
				this.setDisabled(true);
				StopJob();
				validateInterval = false;
			}
		}
	});
	
	if(!jobstatusflag)
		Ext.getCmp('ImportJobButton').setText(StartLbl);
	else{
		Ext.getCmp('ImportJobButton').setText(StopLbl);
		validateInterval = true;
	}
	
	var ComputerSystemCheckBox = document.getElementById(importPageRepeatId+':0:CB');
	if(ComputerSystemCheckBox)
		ComputerSystemCheckBox.disabled = true;
}

function createMappingTable(){
	
	var MappingStore = Ext.create('Ext.data.JsonStore',{
		fields: [
				{name: 'MappedBaseElementField'},
				{name: 'DiscoveredField'}
		],
		data : MappingEntry,
		proxy: {
			type: 'memory',
			reader: {
				type: 'json'
			}
		},
		sorters: [{
			property: 'MappedBaseElementField',
			direction: 'ASC'
        }]
	});
	var ParentComtainer = Ext.create('Ext.grid.Panel', {
		width: browserZoomLevel > 1.25 ? 800 :1000,
		height: 200,
		columnLines : true,
		renderTo: ExpandedCMDBClass,
		id: ExpandedCMDBClass,	
		store : MappingStore,
		columns : [{
			header: TargetField,
			renderer: function(value, metadata){
				if(value){
					value = Ext.String.htmlEncode(value);
					metadata.tdAttr = 'title="' + value + '"';
				}
				return value;
			},
			flex: 1.5,
			dataIndex: 'MappedBaseElementField',
			sortable: true,
			menuDisabled: true
		},{
			header: SourceFields,
			flex: 2.5,
			dataIndex: 'DiscoveredField',
			sortable: true,
			menuDisabled: true,
			renderer: function(value, metadata){
				if(value){
					value = Ext.String.htmlEncode(value);
					metadata.tdAttr = 'title="' + value + '"';
				}
				return value;
			}
		}]
	});
}

function ExpandMappingTable(ExpandedCMDBClass,ExpandedCMDBClassCount){
	var MappingGridDiv = document.getElementById(ExpandedCMDBClass);
	// If mapping table is already created show div else fetch data and create new mapping table.
	if (MappingGridDiv.hasChildNodes())	
		MappingGridDiv.style.display = 'block';
	else
		FetchMappingTableData(ExpandedCMDBClass,ExpandedCMDBClassCount);
	
	
	var classesDiv = document.getElementById('ClassesToExclude');
	if(classesDiv!=null && classesDiv!=undefined){
		if(ExpandedCMDBClassCount == 1 ){
			classesDiv.style.display = 'block';	
		}
	}
}

function CollapseMappingTable(ExpandedCMDBClassId,ExpandedCMDBClassCount){
	var MappingGridDiv = document.getElementById(ExpandedCMDBClassId);
	MappingGridDiv.style.display = 'none';
	
	
	if(ExpandedCMDBClassCount ==1){
		var classesDiv = document.getElementById('ClassesToExclude');
		
		if(classesDiv!=null&&classesDiv!=undefined){
			classesDiv.style.display = 'none';
		}
	}
	
}

function CalculateInterval(){
	var hour;
	var mins;
	if(hourField && minField){
		if(validateInterval && !hourField.getValue() && !minField.getValue()){
			showLightningPopup('toast',lblErrorTitle,timeMandatoryError,'','','','','error');
			ScheduleIntervalData = 0;
			return false;
		}
		else{
			if(hourField.getValue() == null)
				hour = 0;
			else
				hour = hourField.getValue();
			if(minField.getValue() == null)
				mins = 0;
			else
				mins = minField.getValue();
		}
		ScheduleIntervalData  = (parseInt(hour)*60) + parseInt(mins);
	}
	return true;
}

function validateSpinnerField(obj,e){
	var val=obj.getValue();
	if(val != null){
		val=val.toString();
		var newVal = val.substring(0,val.length-1);
		if(val> obj.maxValue){
			obj.setValue(parseInt(newVal));
		}
	} 	
}

function openCloseAccordians(element,cmdbClassId){
    if(element && element.id){
        let sectionElem = document.getElementById('section'+element.id);
        if(sectionElem){
			
			sectionElem.classList.toggle("slds-is-open");

			if(sectionElem.className && sectionElem.className.indexOf('slds-is-open')>0){
				ExpandMappingTable(cmdbClassId,element.id);	
			}
			else{
				CollapseMappingTable(cmdbClassId,element.id);
			}
			
        }
    }
}
