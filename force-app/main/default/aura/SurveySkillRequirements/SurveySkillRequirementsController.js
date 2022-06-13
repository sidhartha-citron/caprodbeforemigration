({
    doInit: function(component, event, helper) {
        
        component.set("v.newSkill",{'sobjectType':'SiteSurvey_RequiredSkills__c'});
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
        
        helper.fetchExistingSkills(component);
        
    },
    
    /*saveSkill: function(component, event, helper) {
        helper.setInitialDetails(component); 
        
        var action = component.get("c.saveNewSkill"); 
        action.setParams({
            "record": record
            //"siteSurveyId" : component.get("v.siteSurveyId")//component.get("v.skillsSelected")
        });
        action.setCallback(this, function(response){        
            if(component.isValid() && response.getState() === "SUCCESS"){
                component.set("v.searchString", null);
                component.set("v.selectedSkill", null);
            }                  
        });    
        $A.enqueueAction(action);
    }, */
    
    handleSkillEvent : function(component, event, helper) {
        helper.setInitialDetails(component); 
        
        var status = event.getParam("skillSelected");

        console.log(' Handler of Skill Selected Event ' + status);
        console.log(component.get("v.selectedSkill")); 
        if(status) {
            var lobComponent = component.find("lobSelector");
            var record = component.get("v.newSkill");
            //var recordList = component.get("v.existingSkills");
        	lobComponent.setRecordDetails(record, false); 
        }
    }, 
    
    handleSkillSaveEvent : function(component, event, helper) { 
        
        var status = event.getParam("recordSaved");
        var closed = event.getParams("modalClosed");
        
        console.log(' Handler of Skill Saved Event ' + status);
        if(status) {
            console.log('Skill Editor Popup is saving skills, clearing out values from SurveySkillRequirements');
            component.set("v.searchString", null);
            component.set("v.selectedSkill", null);
            component.set("v.searchResults", null);
            
            helper.fetchExistingSkills(component);
        }
        if(closed) {
            console.log('Skill Editor Popup was cancelled, clearing out values from SurveySkillRequirements');
            component.set("v.searchString", null);
            component.set("v.selectedSkill", null);
            component.set("v.searchResults", null);
        }
    }, 
    
    editSkill : function(component, event, helper){
        console.log('Edit an existing Skill'); 
        var target = event.getSource(); 
        var record = target.get("v.value");
        console.log(record);
        var lobComponent = component.find("lobSelector");
        lobComponent.setRecordDetails(record, true); 
        
    }, 
    
    removeSkill : function(component, event, helper) { 
        
        console.log('Delete an existing Skill'); 
        var target = event.getSource(); 
        var record = target.get("v.value");
        console.log(record);
        
        var action = component.get("c.deleteSkill"); 
        
        action.setParams({
            "record": record
        });
        action.setCallback(this, function(response){        
            if(component.isValid() && response.getState() === "SUCCESS"){
                console.log('Deleted Skill');
                helper.fetchExistingSkills(component);
            }                  
        });    
        $A.enqueueAction(action);
    }, 
    
    closeParentModal: function(component, event, helper){
        $A.get("e.force:closeQuickAction").fire();
        $A.get('e.force:refreshView').fire();
    }, 
    
    showSpinner: function(component, event, helper)
    {
        component.set("v.spinner", true);
    },
    
    hideSpinner: function(component, event, helper)
    {
        component.set("v.spinner", false);
    }
     
})