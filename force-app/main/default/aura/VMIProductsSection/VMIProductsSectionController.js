({
    doInit: function(component, event, helper) {
        component.set("v.newVMIProduct",{'sobjectType':'VMI_Product__c'});        
    },
    
    setEditRecord : function(component, event, helper) {
        $A.util.removeClass(component.find("theModal"), "slds-hide");
        component.set("v.newVMIProduct",{'sobjectType':'VMI_Product__c'});
        
        var record = event.getParam('arguments').VMIProduct;
        var isEdit = event.getParam('arguments').isEdit;
        //var recordList = event.getParam('arguments').skills;
        component.set("v.newVMIProduct", record);
        //component.set("v.existingSkills", recordList);
        component.set("v.isEdit", isEdit);
        
        var existingVMIProducts = component.get("v.existingVMIProducts");
        if(existingVMIProducts !== null && typeof existingVMIProducts !== "undefined") {
            var existingRecord = helper.fetchExistingRecord(component, existingVMIProducts, record);
            if(existingRecord !== null && typeof existingRecord !== "undefined") {
                component.set("v.newVMIRecord", existingRecord);
            }
        }
    }, 
    
    saveProduct: function(component, event, helper) {
        var record = component.get("v.newVMIProduct"); 
        var action = component.get("c.saveNewProduct"); 
        action.setParams({
            "record": record
        });
        action.setCallback(this, function(response){        
            if(component.isValid() && response.getState() === "SUCCESS"){
                var skillEvent = component.getEvent("skillSavedEvent");
                skillEvent.setParams({
                    "recordSaved" : true, 
                    "modalClosed" : false
                });
                console.log(skillEvent);
                skillEvent.fire();
                
                var resultsToast = $A.get("e.force:showToast");
                resultsToast.setParams({
                    "title" : $A.get("$Label.c.Site_Survey_Save_Success_Title"),
                    "type" : 'success',
                    "message" :$A.get("$Label.c.Site_Survey_Save_Success_Message")
                }); 
                resultsToast.fire();
                
                $A.util.addClass(component.find("theModal"), "slds-hide");
            } else {
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    message: $A.get("$Label.c.ParLevelError"),
                    type: 'error'
                });
                toastEvent.fire();
            }                
        });    
        $A.enqueueAction(action);
    }, 
    
    closeModal : function(component, event, helper) {
        component.set("v.newVMIProduct",{'sobjectType':'VMI_Product__c'});
        //helper.resetValues(component);
        $A.util.addClass(component.find("theModal"), "slds-hide");
        
        var skillEvent = component.getEvent("skillSavedEvent");
        skillEvent.setParams({
            "recordSaved" : false, 
            "modalClosed" : true
        });
        console.log(skillEvent);
        skillEvent.fire();
    }
    
})