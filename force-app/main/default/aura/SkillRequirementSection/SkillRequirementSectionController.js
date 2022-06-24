({
    doInit: function(component, event, helper) {
        
        console.log('Init of Section component');
        console.log('Existing Skills ');
        console.log(component.get("v.existingSkills"));
        component.set("v.newSkill",{'sobjectType':'SiteSurvey_RequiredSkills__c'});
        var action = component.get("c.getlob");
        action.setCallback(this, function(response){        
            if(component.isValid() && response.getState() === "SUCCESS"){
                component.set("v.pickList", response.getReturnValue());
                //$A.util.addClass(spinner , 'slds-hide');
            }                  
        });    
        $A.enqueueAction(action);
        
    },
    
    setEditRecord : function(component, event, helper) {
        console.log('Aura method of Section component');
        console.log('Existing Skills ');
        console.log(component.get("v.existingSkills"));
        $A.util.removeClass(component.find("theModal"), "slds-hide");
        component.set("v.newSkill",{'sobjectType':'SiteSurvey_RequiredSkills__c', 'Line_of_Business__c':''});
        
        var record = event.getParam('arguments').skill;
        var isEdit = event.getParam('arguments').isEdit;
        //var recordList = event.getParam('arguments').skills;
        component.set("v.newSkill", record);
        //component.set("v.existingSkills", recordList);
        component.set("v.isEdit", isEdit);
        
        var existingSkills = component.get("v.existingSkills");
        if(existingSkills !== null && typeof existingSkills !== "undefined") {
            var existingRecord = helper.fetchExistingRecord(component, existingSkills, record);
            if(existingRecord !== null && typeof existingRecord !== "undefined") {
                console.log('Value from Helper for Existing Record ');
                console.log(existingRecord);
                component.set("v.newSkill", existingRecord);
            }
        }
        console.log(record);
        console.log(component.get("v.pickList"));
        var options = component.get("v.newSkill.Line_of_Business__c");
        //helper.resetValues(component);
        var listOptions = component.get("v.pickList");
        if(options !== null && typeof options !== "undefined") {
            var selectOptions = []; 
            selectOptions = options.split(";");
            console.log(selectOptions);
            
            for (var x in listOptions) {
                console.log(" marking selected x-- " + x );
                var theItem = selectOptions.find(function(item){
                    if(item === listOptions[x].label){
                        return item;
                    }                                  
                });
                if(theItem !== null && typeof theItem !== "undefined") {
                    var index = listOptions.findIndex(function(item){
                        if(item === theItem){
                            return item;
                        }                                  
                    });
                    listOptions[x].isChosen = true;
                } else {
                    listOptions[x].isChosen = false;
                }//listOptions.splice(index, 1, listOptions[x]); 
            }  
            component.set("v.pickList", listOptions);
        } else {
            for (var x in listOptions) {
                console.log(" marking selected x-- " + x ); 
                listOptions[x].isChosen = false;
            } 
            component.set("v.pickList", listOptions);
        }
    }, 
    
    onSelectChange: function(component, event, helper) {
        
        console.log('Change controller of Section component');
        var target = event.getSource();
        var label = target.get("v.label");
        var selected = target.get("v.checked");
        
        var options = component.get("v.newSkill.Line_of_Business__c");
        console.log('before');
        console.log(options);
        if(selected) {
            if(options !== null && typeof options !== "undefined") {
                options = options + ';' + label; 
            } else {
                options = label; 
            }
        } else {
            if(options !== null && typeof options !== 'undefined') {
                var selectOptions =[]; 
                selectOptions = options.split(";");
                
                var index = selectOptions.findIndex(function(item){
                    if(item === label) {
                        return item;
                    }
                });
                
                selectOptions.splice(index, 1);
                console.log('after splice ' + selectOptions);
                var text = "";
                var x;
                for (x in selectOptions) {
                    console.log("x-- " + x + " -- text " + text);
                    text = (x === "0") ? selectOptions[x] : text+";" + selectOptions[x];
                }
                options = text;
                console.log(options);
            }
        }
        
        component.set("v.newSkill.Line_of_Business__c", options); 
        console.log('after');
        console.log(component.get("v.newSkill"));
    }, 
    
    saveSkill: function(component, event, helper) {
        var record = component.get("v.newSkill"); 
        
        var action = component.get("c.saveNewSkill"); 
        action.setParams({
            "record": record
            //"siteSurveyId" : component.get("v.siteSurveyId")//component.get("v.skillsSelected")
        });
        action.setCallback(this, function(response){        
            if(component.isValid() && response.getState() === "SUCCESS"){
                console.log('After Save ');
                var skillEvent = component.getEvent("skillSavedEvent");
                skillEvent.setParams({
                    "recordSaved" : true, 
                    "modalClosed" : false
                });
                console.log(skillEvent);
                skillEvent.fire();
                $A.util.addClass(component.find("theModal"), "slds-hide");
            }                  
        });    
        $A.enqueueAction(action);
    }, 
    
    closeModal : function(component, event, helper) {
        component.set("v.newSkill",{'sobjectType':'SiteSurvey_RequiredSkills__c', 'Line_of_Business__c':''});
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