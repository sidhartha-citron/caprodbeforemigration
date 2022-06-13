({
	setDeleteLocationRecord : function(component, event, helper) {
        
        console.log('Aura method of Prompt component');
        $A.util.removeClass(component.find("promptSection"), "slds-hide");
        
        component.set("v.surveyLocation",{'sobjectType':'Survey_Location__c'});
        component.set("v.isRoom",true);
        component.set("v.isSkillSave",false);
        
        var record = event.getParam('arguments').recordId;
        console.log(record);
        component.set("v.locationId", record);
        
        component.set("v.value", "");
        component.set("v.quantity", "");
        component.set("v.prodName", "");
        
	}, 
    
    setDeleteAssetRecord : function(component, event, helper) {
        
        console.log('Aura method of Prompt component');
        $A.util.removeClass(component.find("promptSection"), "slds-hide");
        
        component.set("v.surveyLocation",{'sobjectType':'Survey_Location__c'});
        component.set("v.isRoom",false);
        component.set("v.isSkillSave",false);
        
        var value = event.getParam('arguments').value;
        var name = event.getParam('arguments').quantity;
        
        var actionParams = [];
        actionParams = value.split('|');
        component.set("v.prodName", actionParams[0]);
        
        console.log('Value --> ' + value + ' name --> ' + name + ' isRoom --> ' + component.get("v.isRoom") + ' prodName--> ' + actionParams);
        component.set("v.value", value);
        component.set("v.quantity", name);
        component.set("v.quantityChosen", name);
        
        component.set("v.locationId", "");
        
	},
    
    setDeleteSkillRecord : function(component, event, helper) {
        
        console.log('Skill Aura method of Prompt component');
        $A.util.removeClass(component.find("promptSection"), "slds-hide");
        
        component.set("v.surveyLocation",{'sobjectType':'Survey_Location__c'});
        component.set("v.isRoom",false);
        component.set("v.isSkill",true);
        component.set("v.isSkillSave",false);
        
        var value = event.getParam('arguments').skillId;
        var message = event.getParam('arguments').skillMessage;
        console.log('Value --> ' + value);
        component.set("v.skillId", value);
        component.set("v.skillMessage", message);
	},
    
    setDeleteSkillRecordBySave : function(component, event, helper) {
        
        console.log('Save Skill Aura method of Prompt component');
        $A.util.removeClass(component.find("promptSection"), "slds-hide");
        
        component.set("v.surveyLocation",{'sobjectType':'Survey_Location__c'});
        component.set("v.isRoom",false);
        component.set("v.isSkill",true);
        component.set("v.isSkillSave",true);
        
        var value = event.getParam('arguments').notSavedRecords;
        var message = event.getParam('arguments').notSavedSkillMessage;
        console.log('Value --> ' + value);
        component.set("v.notSavedRecords", value);
        component.set("v.notSavedSkillMessage", message);
	},
    
    handleDelete : function(component, event, helper) {
        console.log(' Selected Delete in Prompt Modal ');
        
        $A.util.addClass(component.find("promptSection"), "slds-hide");
        var promptEvent = component.getEvent("promptEvent");
        
        var isSkill = component.get("v.isSkill"); 
        var isSkillSave = component.get("v.isSkillSave"); 
        
        if(isSkill) {
            if(!isSkillSave) {
                console.log(' Selected Delete in Prompt Modal ' + component.get("v.skillId"));
                promptEvent.setParams({
                    "actionStatus" : true, 
                    "isSkill" : isSkill, 
                    "skillId":component.get("v.skillId")
                });
                console.log(promptEvent);
                promptEvent.fire();
                
            } 
        } else {
            console.log(' Selected Delete in Prompt Modal ' + component.get("v.locationId"));
            promptEvent.setParams({
                "actionStatus" : true, 
                "recordId" : component.get("v.locationId"), 
                "isRoom":component.get("v.isRoom"), 
                "value":component.get("v.value"), 
                "quantity":component.get("v.quantity")
            });
            console.log(promptEvent);
            promptEvent.fire();
        }
        
    }, 
    
    /*validate : function(component, event, helper) {
        var quantityChosen = component.get("v.quantityChosen");
        var quantity = component.get("v.quantity");
        
        component.set("v.isDisabled", false);
        
        if(!$A.util.isUndefinedOrNull(quantityChosen) && !$A.util.isUndefinedOrNull(quantity)) {
            if(quantityChosen>quantity) {
                var resultsToast = $A.get("e.force:showToast");
                resultsToast.setParams({
                    "title" : "Error",
                    "type" : "error",
                    "message" : "You only have " + quantity + " items in this Location"
                }); 
                resultsToast.fire();
                component.set("v.quantityChosen", quantity);
                component.set("v.isDisabled", false);
            } else if (quantityChosen<=0){
                var resultsToast = $A.get("e.force:showToast");
                resultsToast.setParams({
                    "title" : "Error",
                    "type" : "error",
                    "message" : "Quantity should be atleast 1 to proceed."
                }); 
                resultsToast.fire();
                component.set("v.isDisabled", true);
            }
        }
    },*/
    
    closeModal : function(component, event, helper) {
        //helper.resetValues(component);
        $A.util.addClass(component.find("promptSection"), "slds-hide");
    }
})