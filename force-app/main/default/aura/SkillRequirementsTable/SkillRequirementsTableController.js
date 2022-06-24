({
    doInit : function(component, event, helper) {
        var action = component.get("c.initSkills");
        var siteSurveyId = component.get("v.siteSurveyId");
        //component.set("v.siteSurveyId", siteSurveyId);
        
        action.setParams({
            "siteSurveyId": siteSurveyId
        });
        
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                console.log(response.getReturnValue());
                console.log("Successful with state: " + state);
                component.set("v.records", response.getReturnValue());
                helper.fetchColumns(component);
            } else {
                console.log("Failed with state: " + state);
            }
        });
        
        $A.enqueueAction(action);
    },
    
    addSkill : function(component, event, helper) {
        console.log(">> Add Skill");
        var target = event.getSource();
        var record = target.get("v.name");
        var siteSurveyId = component.get("v.siteSurveyId");
        
        console.log(">>Record: " + record);
        
        var allSkills = component.get("v.records");
        console.log(allSkills.length);
        
        if(record !== null && typeof record !== "undefined") {
            record.skillExists=true;
            record.skillLevel=record.defaultSkillLevel;
            
            var index = allSkills.findIndex(function(item){
                if(item.skillId === record.skillId){
                    return item;
                }                                  
            });
            allSkills.splice(index, 1, record); 
            component.set("v.records", allSkills);
            //helper.saveSkillHelper(component, record, siteSurveyId);
        }
        console.log(allSkills.length);
	}, 
    
    removeSkill : function(component, event, helper) {
        console.log(">> Remove Skill");
        var target = event.getSource();
        var record = target.get("v.name");
        console.log(">>Record: " + record);
        console.log(">>Record: " + record.recordId);
        
        if(record !== null && typeof record !== "undefined") {
            var prompt = component.find("promptComponent"); 
            var externalId = record.externalId;
            
            if(!$A.util.isUndefinedOrNull(prompt) && !$A.util.isUndefinedOrNull(record.recordId) && !$A.util.isEmpty(record.recordId)){
                prompt.setPromptSkillDetails(externalId, $A.get("$Label.c.Site_Survey_Delete_Skill"));
            } else if($A.util.isUndefinedOrNull(record.recordId) || $A.util.isEmpty(record.recordId)) {
                helper.deleteSkillCleanRecord(component, externalId);
            }
        }
    },
    
    handlePromptEvent : function(component, event, helper) {
        console.log(' Handling Reinitiating for deleting skill Event '); 
        var status = event.getParam("actionStatus"); 
        var isSkill = event.getParam("isSkill");
        var externalId = event.getParam("skillId");
        
        if(status && isSkill) {
            console.log(">>Id: " + externalId);
            helper.deleteSkillCleanRecord(component, externalId);
            helper.deleteSkillHelper(component, externalId, component.get("v.siteSurveyId"));
        }
    },
    
    updateSkillLevel : function(component, event, helper) {
        console.log(">> Update Skill");
        var target = event.getSource();
        var record = target.get("v.name");
        
        console.log(">>Record: " + record);
        
        if(!$A.util.isUndefinedOrNull(record)){
           if (isNaN(record.skillLevel) || record.skillLevel <= 0) {
            var resultsToast = $A.get("e.force:showToast");
            resultsToast.setParams({
                "title" : "Error",
                "type" : "error",
                "message" : $A.get("$Label.c.Site_Survey_Skill_Level_Error")
            }); 
            resultsToast.fire();
            } else if (!$A.util.isUndefinedOrNull(record.recordId) && !$A.util.isEmpty(record.recordId)) {
                helper.updateSkillHelper(component, record);
            }
        }
    }, 
    
    updatelob : function(component, event, helper) {
        console.log(">> Update Skill");
        var target = event.getSource();
        var record = target.get("v.name");
        var label = target.get("v.label");
        
        var allSkills = component.get("v.records");
        console.log(allSkills.length);
        
        if(record !== null && typeof record !== "undefined") {
            var theItemIndex = record.lineOfBusinesses.findIndex(function(item){
                if(item.label === label){
                    item.isChosen=!item.isChosen;
                    return item;
                }                                  
            });
            var x;
            var hasLOB=false;
            for (x in record.lineOfBusinesses) {
                console.log(">> x " + record.lineOfBusinesses[x]);
                if(record.lineOfBusinesses[x].isChosen)
                {
                    hasLOB=true;
                    break;
                }
            } 
            
            if(hasLOB) {
                console.log(">> Changed: " + record.lineOfBusinesses);
                component.set("v.records", allSkills);
                helper.updateSkillHelper(component, record); 
            } else {
                var prompt = component.find("promptComponent");
                if(!$A.util.isUndefinedOrNull(prompt) && !$A.util.isUndefinedOrNull(record.recordId) && !$A.util.isEmpty(record.recordId)){
            		var externalId = record.externalId;
                    prompt.setPromptSkillDetails(externalId, $A.get("$Label.c.Site_Survey_LOB_Deletes_Skill"));
                }
            }
        }
        //component.set("v.records", allSkills);
    }, 
    
    handleSave : function (component, event, helper) {
        console.log('Handle Save Action');
        var allSkills = component.get("v.records");
        component.set("v.notSavedRecords", "");
        //var newArray = [];
        var skillNameArray = [];
        var skillNames = "";
        
        var x;
        for(x in allSkills) {
            if(allSkills[x].skillExists && ($A.util.isUndefinedOrNull(allSkills[x].recordId) || $A.util.isEmpty(allSkills[x].recordId) )) {
                console.log("X: " + allSkills[x]);
                //newArray.push(allSkills[x]);
                skillNameArray.push(allSkills[x].skillName);
            }
        }
        //skillNames = skillNameArray.join();
        //component.set("v.notSavedRecords", skillNames);
        
        if(skillNameArray && skillNameArray.length > 0) {
            component.set("v.notSavedRecords", skillNameArray.join());
            console.log(">>Skill Names: " + skillNameArray.join());
            var prompt = component.find("promptComponent");
            if(!$A.util.isUndefinedOrNull(prompt)){
                prompt.setPromptSkillDetailsForSave(component.get("v.notSavedRecords"), $A.get("$Label.c.Site_Survey_Skill_Save_Error"));
            }
        } else {
            var resultsToast = $A.get("e.force:showToast");
            resultsToast.setParams({
                "title" : $A.get("$Label.c.Site_Survey_Save_Success_Title"),
                "type" : 'success',
                "message" :$A.get("$Label.c.Site_Survey_Save_Success_Message")
            }); 
            resultsToast.fire();
        }
    }
})