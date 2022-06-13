({
    handleExpandContractSection: function(component, event, helper) {
        let selectedItem = event.currentTarget;
        let dataTarget = selectedItem.dataset.collapsetarget;
        
        let target = component.find(dataTarget);
        
        $A.util.toggleClass(selectedItem, "section-icon-collapsed");
        $A.util.toggleClass(target, "rolledup");
    },
    
 	handleAddRows: function(component, event, helper, isAddWithSurveyLocation) {
        let objArray = [],
            numOfRowsToGenerate = component.find("txtNumberOfUnits").get("v.value"),
            initData = component.get("v.initData"),
            orderItemTable = component.find("orderItemTable"),
            isMultiRes = component.get("v.isMultiRes");
        
        let obj = {};
        
        if (isMultiRes) {
            obj = {
                treatmentType: component.find("selTreatmentType").get("v.value"),
                infestationLevel: component.find("selInfestationLevel").get("v.value"),
                numberOfUnits: component.find("txtNumberOfUnits").get("v.value"),
                numberOfRooms: component.find("selNumberOfRooms").get("v.value")
            };
        } else {
            obj = {
                treatmentType: component.find("selTreatmentType").get("v.value"),
                infestationLevel: component.find("selInfestationLevel").get("v.value"),
                numberOfUnits: component.find("txtNumberOfUnits").get("v.value")
            };
        }
        
        let objJson = JSON.stringify(obj);
        
        let newRowsRequest = $A.get("e.c:EDW_SendNewTableRowsRequestEvent");
        
        newRowsRequest.setParams({
            requestJson: objJson,
            isAddWithSurveyLocation: isAddWithSurveyLocation
        })
        .fire();
        
        component.find("selTreatmentType").set("v.value", "");
       	component.find("selInfestationLevel").set("v.value", "");
        component.find("txtNumberOfUnits").set("v.value", "");
        component.find("selInfestationLevel").set("v.disabled", true);
        
        if (isMultiRes) {
        	component.find("selNumberOfRooms").set("v.value", "");
            component.find("selNumberOfRooms").set("v.disabled", true);
        }
        
        this.handleValidateForm(component, event, helper);
	},
    
    //Begin:Shashi:0-4-2019:Populate related infestation and rooms
    onChangeTreatmentType: function(component, event, helper){
        let isMultiRes = component.get("v.isMultiRes");
        let treatType = component.find("selTreatmentType").get("v.value");
        //console.log('onChangeTreatmentType~~' + treatType);
        let infLevel = component.find("selInfestationLevel").get("v.value");
        //console.log('onChangeTreatmentType~~' + infLevel);
        let action = component.get("c.getLocationRooms");
        
        action.setParams({
            TreatmentType: treatType,
            InfestationLevel: infLevel,
            strField: "INFLVL"
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            //console.log("onChangeTreatmentType~~CALL:" + state);
            if (state == "SUCCESS") {
                var data = response.getReturnValue();
            	component.find("selInfestationLevel").set("v.disabled", false);
                component.set("v.infestationLevels", data);
            	component.find("selInfestationLevel").set("v.value", "");
            	if(isMultiRes){component.find("selNumberOfRooms").set("v.disabled", true);}
                //console.log("onChangeTreatmentType~~RESP:" + data);
        	}
        });
        
        $A.enqueueAction(action);
    },
    
    onChangeInfestationLevel: function(component, event, helper){
        let isMultiRes = component.get("v.isMultiRes");
        console.log('onChangeInfestationLevel~~' + isMultiRes);
        
        if (isMultiRes) {
            let treatType = component.find("selTreatmentType").get("v.value");
            console.log('onChangeInfestationLevel~~' + treatType);
            let infLevel = component.find("selInfestationLevel").get("v.value");
            console.log('onChangeInfestationLevel~~' + infLevel);
            let action = component.get("c.getLocationRooms");
            
            action.setParams({
                TreatmentType: treatType,
                InfestationLevel: infLevel,
                strField: "ROOMS"
            });
            
            action.setCallback(this, (response) => {
                let state = response.getState();
                //console.log("onChangeInfestationLevel~~CALL:" + state);
                if (state == "SUCCESS") {
                	var data = response.getReturnValue();
                    component.find("selNumberOfRooms").set("v.disabled", false);
                    component.set("v.numberOfRooms", data);
                	component.find("selNumberOfRooms").set("v.value", "");
                	//console.log("onChangeInfestationLevel~~RESP:" + data);
                }
            });
        
        	$A.enqueueAction(action);
        } 
    },
    //End
    
    handleValidateForm: function(component, event, helper) {
        let isMultiRes = component.get("v.isMultiRes");
        let obj = {};
        
        if (isMultiRes) {
            obj = {
                treatmentType: component.find("selTreatmentType").get("v.value"),
                infestationLevel: component.find("selInfestationLevel").get("v.value"),
                numberOfUnits: component.find("txtNumberOfUnits").get("v.value"),
                numberOfRooms: component.find("selNumberOfRooms").get("v.value"),
                isComplete: function() {
                    return !$A.util.isEmpty(this.treatmentType) && !$A.util.isEmpty(this.infestationLevel) && !$A.util.isEmpty(this.numberOfUnits)// && !$A.util.isEmpty(this.numberOfRooms)
                },
                hasAtleastOneComplete: function() {
                    return !$A.util.isEmpty(this.treatmentType) || !$A.util.isEmpty(this.infestationLevel) || !$A.util.isEmpty(this.numberOfRooms)
                }
            };
        } else {
            obj = {
                treatmentType: component.find("selTreatmentType").get("v.value"),
                infestationLevel: component.find("selInfestationLevel").get("v.value"),
                numberOfUnits: component.find("txtNumberOfUnits").get("v.value"),
                isComplete: function() {
                    return !$A.util.isEmpty(this.treatmentType) && !$A.util.isEmpty(this.infestationLevel) && !$A.util.isEmpty(this.numberOfUnits)
                },
                hasAtleastOneComplete: function() {
                    return !$A.util.isEmpty(this.treatmentType) || !$A.util.isEmpty(this.infestationLevel)
                }
            };
        }
        
        component.set("v.isValidForAddingRows", obj.isComplete());
        
        let areRowsSelectedForEditing = component.get("v.areRowsSelectedForEditing");
        
        component.set("v.isValidForUpdatingRows", obj.hasAtleastOneComplete() && areRowsSelectedForEditing);
    },
    
    handleUpdateSelectedOrderItems: function(component, event, helper) {
        let isMultiRes = component.get("v.isMultiRes");
        
        let obj = {};
        
        if (isMultiRes) {
            obj = {
                treatmentType: component.find("selTreatmentType").get("v.value"),
                infestationLevel: component.find("selInfestationLevel").get("v.value"),
                numberOfUnits: component.find("txtNumberOfUnits").get("v.value"),
                numberOfRooms: component.find("selNumberOfRooms").get("v.value")
            };
        } else {
            obj = {
                treatmentType: component.find("selTreatmentType").get("v.value"),
                infestationLevel: component.find("selInfestationLevel").get("v.value"),
                numberOfUnits: component.find("txtNumberOfUnits").get("v.value")
            };
        }
        
        let newRowsRequest = $A.get("e.c:EDW_MassEditEvent");
        
        newRowsRequest.setParams({
            editRequestJson: JSON.stringify(obj)
        })
        .fire();
        
        component.find("selTreatmentType").set("v.value", "");
       	component.find("selInfestationLevel").set("v.value", "");
        component.find("txtNumberOfUnits").set("v.value", "");
        component.find("selInfestationLevel").set("v.disabled", true);
        
        if (isMultiRes) {
        	component.find("selNumberOfRooms").set("v.value", "");
            component.find("selNumberOfRooms").set("v.disabled", true);
        }
        
        component.set("v.isValidForAddingRows", false);
    },
    
    handleRowsSelectedListener: function(component, event, helper) {        
        let areRowsSelectedForEditing = component.get("v.areRowsSelectedForEditing");
        
        component.set("v.isValidForUpdatingRows", areRowsSelectedForEditing);
    }
})