({
    fetchExistingSkills : function(component) {
        var action = component.get("c.getSkills"); 
        action.setParams({
            "siteSurveyId": component.get("v.siteSurveyId")
            //"siteSurveyId" : component.get("v.siteSurveyId")//component.get("v.skillsSelected")
        });
        action.setCallback(this, function(response){        
            if(component.isValid() && response.getState() === "SUCCESS"){
                component.set("v.existingSkills", response.getReturnValue());
            }                  
        });    
        $A.enqueueAction(action);
    },
    
    setInitialDetails : function(component) {
       	var skill = component.get("v.selectedSkill");
        console.log('Add Skill Helper');
        console.log(skill);
        var record = component.get("v.newSkill");
        record.Site_Survey__c = component.get("v.siteSurveyId"); 
        record.Skill_Level__c = 1.0; 
        record.Skill_Name__c = component.get("v.selectedSkill.MasterLabel"); 
        record.Name = record.Skill_Name__c; 
        record.Skill_Record_Id__c = component.get("v.selectedSkill.Id"); 
        record.EID__c = record.Site_Survey__c +'.' + record.Skill_Record_Id__c;
        component.set("v.newSkill", record);
        console.log('selected skill'); 
        console.log(record);
        component.set("v.openSection", true);
    }
})