({
    initialize: function(component, event, helper){

        //read json string 
        var obj_json;
        var getJSONString = component.get("c.getJSONString");                
        getJSONString.setCallback(this, function(data) {
            if(component.isValid() && data.getState() === "SUCCESS")
            {
                var a = data.getReturnValue();
                obj_json = JSON.parse(a);
                component.set("v.locationDependencyPicklists", obj_json );

                helper.getLocationSubTypes(component,helper); 
                helper.getRoomSubTypes(component,helper);
                helper.getNumberOfRooms(component, helper);

            } else {
                console.log('Something went wrong while getting getJSONString. ' + data.getReturnValue()); 
            }    
        });
        $A.enqueueAction(getJSONString); 
    },

    handleSubmit: function(component, event, helper) {		
        console.log('-- the object rendered is --!!');
        var s = component.get("v.surveyLocation");
        console.log(s.Location_SubType__c);
        console.log('ROOM: ' + s.Floor__c);
        //if all 3 of these are undefined, throw it away and show an error - 21530
        if (($A.util.isUndefinedOrNull(s.Building__c) || s.Building__c=='') && ($A.util.isUndefinedOrNull(s.Unit_Number__c) || s.Unit_Number__c=='') && ($A.util.isUndefinedOrNull(s.Floor__c) || s.Floor__c=='')) {
            var toastEvent = $A.get("e.force:showToast");
            toastEvent.setParams({
                title : 'Cannot Save',
                message: $A.get("$Label.c.Site_Survey_Room_Fields_Fill_In"),
                duration:'2500',
                key: 'info_alt',
                type: 'error',
                mode: 'pester'
            });
            toastEvent.fire();
            return;
        }
        
        if ($A.util.isUndefinedOrNull(s.Floor__c) || s.Floor__c == '') {
            var toastEvent = $A.get("e.force:showToast");
            toastEvent.setParams({
                title : 'Cannot Save',
                message: $A.get("$Label.c.Site_Survey_Floor_Required"),
                duration:'2500',
                key: 'info_alt',
                type: 'error',
                mode: 'pester'
            });
            toastEvent.fire();
            return;
        }
        
        
        // set the site survey id
        var siteSurveyId = component.get("v.surveyLocation.Site_Survey__c");
        console.log('Site Survey Id of the room being saved/changed : ' + siteSurveyId);
        if($A.util.isUndefinedOrNull(siteSurveyId)) {
           component.set("v.surveyLocation.Site_Survey__c", component.get("v.siteSurveyId")); 
           console.log('site survey id inb handle submit' + component.get("v.siteSurveyId") );
        }
        
        //21530
        //s.Service_Order__c = $A.util.isUndefinedOrNull(s.Service_Order__c) ? s.Floor__c : s.Service_Order__c; -> removed to be put in a trigger
        s.Building__c = $A.util.isUndefinedOrNull(s.Building__c) ? "" : s.Building__c;
        s.Unit_Number__c = $A.util.isUndefinedOrNull(s.Unit_Number__c) ? "" : s.Unit_Number__c;
        s.Floor__c = $A.util.isUndefinedOrNull(s.Floor__c) ? "" : s.Floor__c;
        s.Location_Type__c = $A.util.isUndefinedOrNull(s.Location_Type__c) ? "" : s.Location_Type__c;
        s.Location_SubType__c = $A.util.isUndefinedOrNull(s.Location_SubType__c) ? "" : s.Location_SubType__c;
        
        var languageCode = component.get("v.languageCode");
        var locationType = helper.translatePickList(component.get("v.locationTypes"), s.Location_Type__c, languageCode);
        var locationSubType = helper.translatePickList(component.get("v.locationSubTypes"), s.Location_SubType__c, languageCode);

        var floorLabel = '';
        var unitLabel = '';
        if (languageCode == 'fr'){
            floorLabel = $A.get("$Label.c.Site_Survey_Floor_FR");
            unitLabel = $A.get("$Label.c.Unit_FR");
        } else {
            floorLabel = $A.get("$Label.c.Site_Survey_Floor_EN")
            unitLabel = $A.get("$Label.c.Unit_EN");
        }

        if ($A.util.isUndefinedOrNull(s.Name) || s.Name == "") {
            var locationConcat = "";
                        
            if (s.Building__c != "") { 
                locationConcat += s.Building__c;
                
                if (s.Floor__c != "" || s.Unit_Number__c != "" || s.Location_Type__c != "" || s.Location_SubType__c != "") { locationConcat += ", "; }
            }
            if (s.Floor__c != "") { 
                locationConcat += floorLabel + ": " + s.Floor__c;
                
                if (s.Unit_Number__c != "" || s.Location_Type__c != "" || s.Location_SubType__c != "") { locationConcat += ", "; }
            }
            if (s.Unit_Number__c != "") { 
                locationConcat += unitLabel + ": " + s.Unit_Number__c; 
                
                if (s.Location_Type__c != "" || s.Location_SubType__c != "") { locationConcat += ", "; }
            }
            if (s.Location_SubType__c != "") { 
                locationConcat += locationSubType; 
                
                if (s.Location_Type__c != "" ) { locationConcat += " "; }
            }
            if (s.Location_Type__c != "") { 
                locationConcat += locationType; 
            }
            
            s.Name = locationConcat;
            
            if(s.Name.length>80) {
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    title : 'Cannot Save',
                    message: $A.get("$Label.c.Site_Survey_Room_Name_Error"),
                    duration:'2500',
                    key: 'info_alt',
                    type: 'error',
                    mode: 'pester'
                });
                toastEvent.fire();
                return;
            }
            
            component.set("v.surveyLocation", s);
        }
        //end 21530
        
        console.log('saving ' + component.get("v.surveyLocation"));
        helper.saveEditSurveyLocation(component, event,helper);
	},
    
    setSiteSurveyId: function(component, event, helper) {
        console.log('site survey id 1!!' + component.get("v.siteSurveyId"));
        
        //Initializing the attribute to store a room. 
        component.set("v.surveyLocation",{'sobjectType':'Survey_Location__c', 'Name':'','Location_Type__c': 'Washroom', 'Location_SubType__c': '', 'Installation_Notes__c': '', 'Service_Notes__c': ''});
		helper.getRoomSubTypesOnChange(component);
        
        var startValue = component.get("v.locationSubTypes[0]");
        console.log(' adding new room ' + startValue);
        if(startValue != null && typeof startValue != "undefined") {
            component.set("v.surveyLocation.Location_SubType__c", startValue); 
        }
        
        var surveyId = event.getParam('arguments').surveyid;
        console.log('Add room component method argument : ' + surveyId);       
        component.set("v.siteSurveyId",surveyId);
        console.log('Add room component method argument : ' + component.get("v.siteSurveyId"));  
        
        component.set("v.surveyLocation.Site_Survey__c", component.get("v.siteSurveyId"));

        console.log('A new survey room initialized with default values: '); 
        console.log(component.get("v.surveyLocation")); 
        
    },
    
    setLocationId: function(component, event, helper) {
        console.log('setLocationId - Edit existing Survey Location');

        component.set("v.surveyLocation",{'sobjectType':'Survey_Location__c', 'Name':'','Location_Type__c': 'Washroom', 'Location_SubType__c': '', 'Installation_Notes__c': '', 'Service_Notes__c': ''});
		
        var locationSubTypes = component.get("v.locationSubTypes")
        component.set("v.locationSubTypesFiltered",locationSubTypes);
        helper.getRoomSubTypesOnChange(component);
       
        var surveyRecord = event.getParam('arguments').surveyRecord;
        var startTypeValue = surveyRecord['Location_Type__c'];
        var startSubTypeValue = surveyRecord['Location_SubType__c'];

        console.log('Starting TypeValue ' + startTypeValue);
        console.log('Starting SubTypeValue ' + startSubTypeValue);
        
        component.set("v.surveyLocation", surveyRecord); 

        helper.getRoomSubTypesOnChange(component);
        component.set("v.surveyLocation.Location_SubType__c", startSubTypeValue);

        component.set("v.surveyLocation", surveyRecord); 
        
    },
    
    ///---currently in use for this component---///
    handleRoomTypeChange: function(component, event, helper) {  

        helper.getRoomSubTypesOnChange(component);
        
        var startValue = component.get("v.locationSubTypesFiltered[0]");
        console.log('handleRoomTypeChange startValue' + startValue);
        if(startValue != null && typeof startValue != "undefined") {
            component.set("v.surveyLocation.Location_SubType__c", startValue); 
        } else {
             component.set("v.surveyLocation.Location_SubType__c", ""); 
        }
        console.log(component.get("v.surveyLocation")); 
    },
    
    closeModal: function(component, event, helper){
        // fire the event
        var modalCloseEvt = component.getEvent("ModalCloseEvent"); 
        modalCloseEvt.setParams({"modalComponentId":"modalAddSurveyRoom"});
        modalCloseEvt.fire(); 
    }
})