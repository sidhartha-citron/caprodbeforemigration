({	
    getRoomSubTypes: function(component, helper) {
        //these are not sub types: Location_Type__c 
        
        console.log(' Helper to fetch room types');

            var action=component.get("c.getRoomSubTypes");
                     
            action.setCallback(this, function(response){
                if(component.isValid() && response.getState() === "SUCCESS")
                {

                    // store the map of types and sub types
                    component.set("v.locationTypes", response.getReturnValue());

                    helper.getRoomSubTypesOnChange(component);
 
                } else {
                    console.log('Something went wrong while getting subtypes. ' + response.getReturnValue()); 
                }                
            });
            $A.enqueueAction(action);      
    }, 

    getLocationSubTypes: function(component, helper) {
        var siteSurveyId = component.get("v.surveyLocation.Site_Survey__c");
        
        var action=component.get("c.getLocationSubTypes");
        
        action.setCallback(this, function(response){
            if(component.isValid() && response.getState() === "SUCCESS")
            {
                
                component.set("v.locationSubTypes",response.getReturnValue());
                
            } else {
                console.log('Something went wrong while getting locationSubTypes. ' + response.getReturnValue()); 
            }                
        });
        $A.enqueueAction(action);      
    }, 

    getNumberOfRooms: function(component,helper) {
        var action=component.get("c.getNumberOfRooms");
        action.setCallback(this, function(response){
            if(component.isValid() && response.getState() === "SUCCESS")
            {
                // store the map of types and sub types
                component.set("v.numberOfRooms",response.getReturnValue());
                
            } else {
                //console.log('Something went wrong while getting numberOfRooms. ' + response.getReturnValue()); 
            }                
        });
        $A.enqueueAction(action);      
    }, 
    
    ///---currently in use for this component---///
    getRoomSubTypesOnChange: function(component, event,helper) {
        var room = component.find("locationType").get("v.value");
               
        var picklistObj = component.get("v.locationDependencyPicklists");
        var locationSubTypes = component.get("v.locationSubTypes");
        
        var subTypes = picklistObj[room];
        console.log(subTypes);
 
        //build array of subtype labels and values for the selected main type
        var filteredSubTypes = [];
        
        for(var i in locationSubTypes){
            for(var j in subTypes){
                if (subTypes[j] == locationSubTypes[i]['pickListValue']) {
                    filteredSubTypes.push(locationSubTypes[i]);
                }
            }
        }

        if (filteredSubTypes.length > 0) {
            component.set("v.locationSubTypesFiltered",filteredSubTypes);
            component.find("roomSubType").set("v.disabled",false);
        }else{
            component.set("v.locationSubTypesFiltered",undefined);
            component.find("roomSubType").set("v.disabled",true);
        }
       
    },
    
    saveEditSurveyLocation: function(component, event,helper) { //locationRecord
     	var stopSave = helper.validateSave(component);
        //console.log('Stop Save is ' + stopSave);
        
        if (!stopSave) {        
            let action = component.get("c.saveSurveyLocation");
            
            console.log(JSON.stringify(component.get("v.surveyLocation")));
            
            action.setParams({
                locationJson: JSON.stringify(component.get("v.surveyLocation"))
            });
            
            action.setCallback(this, function(response) {
                let state = response.getState();
                
                if (state === "SUCCESS") {
                    let surveyRecord = response.getReturnValue();
                    
                    if (surveyRecord !== null) {
                        let roomCreatedEvent = component.getEvent("NewSurveyLocationEvent");
                        //modified for 21618
                        roomCreatedEvent.setParams({ 
                            "locationCreated": true, 
                            "locationId":  surveyRecord.Id
                        })
                        .fire();
                    }
                } else {
                    //console.log(response.getError());
                } 
            });
            
            $A.enqueueAction(action);
        }
    },
    
    validateSave : function(component) {
		        		
        /*var name = component.get("v.surveyLocation.Name");
        var location = component.get("v.surveyLocation.Location_Type__c"); */
        
        
       var name = component.find("roomName").get("v.value");
       var location = component.find("locationType").get("v.value");
        
       console.log('value of name is: ' + name + 'value of location is: ' + location );

       var stopSave = false;
   
       if(name!=undefined){
        	if( name.replace(/\s/g,'') == ''){
             component.find("roomName").set('v.errors', [{message: $A.get("$Label.c.Site_Survey_Fill_In_Field")}]);
             stopSave = true;
            }else{
           		component.find("roomName").set('v.errors',null);
            }
        }
        else{ 
            console.log('im here');
            component.find("roomName").set('v.errors', [{message: $A.get("$Label.c.Site_Survey_Fill_In_Field")}]);
            stopSave = true;
        }
        
        if( location  == '' || location == undefined){
           		component.find("locationType").set('v.errors', [{message: $A.get("$Label.c.Site_Survey_Fill_In_Field")}]);
            	//$A.util.removeClass(component.find("errorLocationType"), 'slds-hide');
                stopSave = true;     
        }else{
            	 //$A.util.addClass(component.find("errorLocationType"), 'slds-hide');
            	component.find("locationType").set('v.errors', null);
        }  
       
        return stopSave;
	},
    
    translatePickList : function(pickListObj, pickListValue, languageCode) {
        if (languageCode != 'fr') { return pickListValue;}
        if(pickListObj != null && typeof pickListObj != "undefined") {
            for(var i in pickListObj)  {
                if(pickListObj[i]['pickListValue'] == pickListValue){
                    return pickListObj[i]['pickListTranslation']; 
                }
            }
        }else{
            return pickListValue;
        }
    }
})