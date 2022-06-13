({
    doInit: function(component, event, helper) {
        
        component.set("v.newVMIProduct",{'sobjectType':'VMI_Product__c'});
        // Getting Column API Names
        var initColumns = component.get("c.getColumns");
        initColumns.setParams({
            "columnAPINames": component.get("v.columnAPINames")
        });   
        initColumns.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS"){
                component.set("v.columns", response.getReturnValue());
            } else {
                console.log("Failed with state: " + state);
            }
        });
        $A.enqueueAction(initColumns);
        
        helper.fetchExistingVMIProducts(component);
        
    },
    
    handleSkillEvent : function(component, event, helper) {
        helper.setInitialDetails(component); 
        
        var status = event.getParam("skillSelected");

        if(status) {
            var lobComponent = component.find("lobSelector");
            var record = component.get("v.newVMIProduct");
            //var recordList = component.get("v.existingSkills");
        	lobComponent.setRecordDetails(record, false); 
        }
    }, 
    
    handleSkillSaveEvent : function(component, event, helper) { 
        
        var status = event.getParam("recordSaved");
        var closed = event.getParams("modalClosed");
        
        console.log(' Handler of Skill Saved Event ' + status);
        if(status) {

            component.set("v.searchString", null);
            component.set("v.selectedSkill", null);
            component.set("v.searchResults", null);
            
            helper.fetchExistingVMIProducts(component);
        }
        if(closed) {

            component.set("v.searchString", null);
            component.set("v.selectedSkill", null);
            component.set("v.searchResults", null);
        }
    }, 
    
    editVMI : function(component, event, helper){
        console.log('Edit an existing Skill'); 
        var target = event.getSource(); 
        var record = target.get("v.value");
        console.log(record);
        var lobComponent = component.find("lobSelector");
        lobComponent.setRecordDetails(record, true); 
    }, 
    
    deleteVMI : function(component, event, helper){ 
        var record = component.get("v.VMIToDelete");
        var allRecords = component.get("v.existingVMIProducts");
        var action = component.get("c.deleteSingleVMI");
        action.setParams({
            "record": record
        });   
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS"){
                $A.util.addClass(component.find("deleteModal"), "slds-hide");
                var index = allRecords.findIndex(function(item){
                if(item.Id === record.Id){
                    return item;
                }                                  
            	});
            	allRecords.splice(index, 1); 
            	component.set("v.existingVMIProducts", allRecords);
                helper.fetchExistingVMIProducts(component);
            }
        });
        $A.enqueueAction(action);
    },
    
    handleAddVMIProds : function(component, event, helper){
        $A.util.removeClass(component.find("theModal"), "slds-hide");
    },
    
    removeVMIProd : function(component, event, helper){
        var target = event.getSource();
        var record = target.get("v.name");
        var allRecords = component.get("v.AllVMIFlaggedProducts");
        
        if(record !== null && typeof record !== "undefined") {
            record.isChecked=false;
            record.parLevel = null;
            record.notes = '';
            var index = allRecords.findIndex(function(item){
                if(item.prodId === record.prodId){
                    return item;
                }                                  
            });
            allRecords.splice(index, 1, record); 
            component.set("v.AllVMIFlaggedProducts", allRecords);
        }
    },
    
    addVMIProd : function(component, event, helper){
        var target = event.getSource();
        var record = target.get("v.name");
        var allRecords = component.get("v.AllVMIFlaggedProducts");
        
        if(record !== null && typeof record !== "undefined") {
            record.isChecked=true;
            var index = allRecords.findIndex(function(item){
                if(item.prodId === record.prodId){
                    return item;
                }                                  
            });
            allRecords.splice(index, 1, record); 
            component.set("v.AllVMIFlaggedProducts", allRecords);
        }
    },
    
    closeModal : function(component, event, helper){
        helper.closeTheModal(component, event, helper);
    },
    
    closeConfirmModal : function(component, event, helper){
         $A.util.addClass(component.find("confirmModal"), "slds-hide");
    },
    
    closeDeleteModal : function(component, event, helper){
        $A.util.addClass(component.find("deleteModal"), "slds-hide");
    },
    
    showDeleteModal : function(component, event, helper){
        $A.util.removeClass(component.find("deleteModal"), "slds-hide");
        var target = event.getSource(); 
        var record = target.get("v.value");
        component.set("v.VMIToDelete", record);
    },
    
    saveProduct : function(component, event, helper){
        var action = component.get("c.saveNewVMIProduct");
        var records = JSON.stringify(component.get("v.AllVMIFlaggedProducts"));
        var existingVMIs = component.get("v.existingVMIProducts");
        var SSID = component.get("v.siteSurveyId");
        action.setParams({
            "records": records, "existingVMIs": existingVMIs, "siteSurveyId": SSID
        });   
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS"){
                component.set("v.existingVMIProducts", response.getReturnValue());
                helper.closeTheModal(component, event, helper);
                $A.util.addClass(component.find("confirmModal"), "slds-hide");
                console.log(component.get("v.existingVMIProducts"));
                var resultsToast = $A.get("e.force:showToast");
                resultsToast.setParams({
                    "title" : $A.get("$Label.c.Site_Survey_Save_Success_Title"),
                    "type" : 'success',
                    "message" :$A.get("$Label.c.Site_Survey_VMI_Save_Success_Message")
                }); 
                resultsToast.fire();
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
    
    toggleSaveProductModal : function(component, event, helper){
        $A.util.removeClass(component.find("confirmModal"), "slds-hide");
    },
    
    closeParentModal: function(component, event, helper){
        $A.get("e.force:closeQuickAction").fire();
        $A.get('e.force:refreshView').fire();
    }
     
})