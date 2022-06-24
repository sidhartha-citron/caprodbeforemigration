({
	handleInit : function(component, event, helper) {
        let spinner = component.find("theSpinner");
        
        let initAction = component.get("c.initializeSelectCustomer");
        
        document.title = "Emergency Dispatch Wizard";
        
        let isInitDataRecordIdBlank = $A.util.isUndefinedOrNull(component.get("v.initData.recordId"));
        
        initAction.setParams({ 
            recordId: component.get("v.recordId")
        });
        
        initAction.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == 'SUCCESS') {
                let data = response.getReturnValue();
                
                if (data != null && data.contact != null) {
                	data.contact.Name = data.contact.FirstName + ' ' + data.contact.LastName;//prevent unnecessary query
            	}
                               
                component.set("v.initData", data);
        		component.set("v.isCommunity", data.isCommunity);
            }

			$A.util.toggleClass(spinner, "slds-hide");
        });

        if (isInitDataRecordIdBlank) {
			$A.enqueueAction(initAction);
        }
	},
        
    goToNextSection: function(component, event, helper) {
        let poNumber = component.find("poNumber").get("v.value"),
            isCommunity = component.get("v.isCommunity");
        
        if (!$A.util.isUndefinedOrNull(poNumber)) {
            component.set("v.initData.poNumber", poNumber);
        }
        
        let navEvent = $A.get("e.c:EDW_NavigateEvent");
        
        if (isCommunity) {
            //TODO configure how you want to handle community navigation
            console.log("entered community navigation");
        } else {
            //not community, handle internally
            navEvent.setParams({
                navForward: true,
                context: "EDW_SelectCustomerComponent",
                allData: JSON.stringify(component.get("v.initData"))
            })
            .fire();
            
        	component.destroy();
        }
    },
        
    retrieveData: function(component, event, helper) {
        let recordJSON = event.getParam("record"),
            objectType = event.getParam("objectType");
        
        let parsedRecord;
        
        if (recordJSON) {
			parsedRecord = JSON.parse(recordJSON);
        }
        
        switch (objectType) {
            case "Account":
        		component.set("v.initData.account", parsedRecord);
                
                if ($A.util.isUndefinedOrNull(parsedRecord)) {
        			component.set("v.initData.contact", null);
                    component.find("contactLookup").set("v.searchString", null);
                    component.find("contactLookup").set("v.searchResults", []);
                    
        			component.set("v.initData.ticket", null);
                    component.find("ticketLookup").set("v.searchString", null);
                    component.find("ticketLookup").set("v.searchResults", []);
                }
                
                break;
            case "Contact":
        		component.set("v.initData.contact", parsedRecord);
                break;
            case "Case":
        		component.set("v.initData.ticket", parsedRecord);
                break;
            default:
                console.log("something broke");
        }
    }
})