({
    init : function(component, event, helper) {
        var action = component.get("c.getSiteSurveyId");
        action.setParams({
            "recordId": component.get("v.recordId"),
            "queryParams": component.get("v.queryParams")
        });
        action.setCallback(this, function(response){
            if(component.isValid() && response.getState() === "SUCCESS") {
                //console.log('site survey Id:' + responseVal.Id); 
                var responseVal = response.getReturnValue();
                if(!$A.util.isEmpty(responseVal)) {
                    component.set("v.mainRecord", responseVal);
                    component.set("v.siteSurvey", responseVal.siteSurvey);
               		component.set("v.siteSurveyId", responseVal.siteSurvey.Id);
					console.log('Parent Component - ' + responseVal + ' site survey id ' + responseVal.siteSurvey.Id); 
                    console.log('Parent Component attribute holding site survey id - ' + component.get("v.siteSurveyId"));
                    console.log('Order - ' + responseVal + ' site survey id ' + responseVal.order);
                     console.log('Locations' + responseVal.locationsPerPage);
                    //console.log('Opp - ' + responseVal + ' site survey id ' + responseVal.opportunity.Name);
                    //console.log('isOpp - ' + responseVal + ' site survey id ' + responseVal.isOpportunity);
                    console.log("Response Val " + responseVal);
                    if(responseVal.isOpportunity) {
                        component.set("v.opportunity", responseVal.opportunity);
                    } else {
                        component.set("v.order", responseVal.order);
                    }
                    
        			document.title = "Site Survey | " + responseVal.siteSurvey.Name;
                    
                    //case 21530
                    var workspaceAPI = component.find("workspace");
                    workspaceAPI.getFocusedTabInfo().then(function(response) {
                        var focusedTabId = response.tabId;
                        workspaceAPI.setTabLabel({
                            tabId: focusedTabId,
                            label: "Site Survey App"
                        });
                        workspaceAPI.setTabIcon({
                            tabId: focusedTabId,
                            icon: "action:map",
                            iconAlt: "Map"
                        });
                    })
                    .catch(function(error) {
                        console.log(error);
                    });
                }                    
            }    
            
        });
        $A.enqueueAction(action);
    },
    //case 21530
    closeFocusedTab : function(component, event, helper) {
        var workspaceAPI = component.find("workspace");
        console.log(workspaceAPI.getFocusedTabInfo());
        
        workspaceAPI.getFocusedTabInfo().then(function(response) {
            var focusedTabId = response.tabId;
            workspaceAPI.closeTab({tabId: focusedTabId});
        })
        .catch(function(error) {
            console.log(error);
            var urlEvent = $A.get("e.force:navigateToURL");
            
            urlEvent.setParams({
                "url": "/" + component.get("v.recordId")
            });
            
            urlEvent.fire();
        });
    }, 
    
    handleSiteSurveySavedEvent : function (component, event, helper) {
        console.log(' Handling Saved Site Survey '); 
        var record = event.getParam("siteSurvey"); 
        
        if(!$A.util.isUndefinedOrNull(record)){
            component.set("v.siteSurvey", record);
        }
    }, 
    
    handleActive : function (component, event, helper) {
        var activeTab = event.getSource();
        
        switch (activeTab.get("v.id")) {
            case $A.get("$Label.c.Site_Survey_Tab_Allocate_products"): 
                helper.injectComponent('c:SurveyAssetAllocation', activeTab, component, false);
                break;
            case $A.get("$Label.c.Site_Survey_Skill_Requirements"): 
                helper.injectComponent('c:SkillRequirementsTable', activeTab, component, false);
                break;
            case $A.get("$Label.c.Site_Survey_Tab_Preferences"):
                helper.injectComponent('c:SiteSurveySettings', activeTab, component, true);
                break;
            case $A.get("$Label.c.Site_Survey_VMI_Products"):
                helper.injectComponent('c:SurveyVMIProducts', activeTab, component, false);
                break;
        }
    }, 
    
    handleBlur : function (component, event, helper) {
        console.log("Blurred");
    }
    
    /*fetchRecord : function (component, event, helper) {
        var record = component.get("v.siteSurvey");
        var navEvt = $A.get("e.force:navigateToSObject");
        navEvt.setParams({
            "recordId": record.Id,
            "slideDevName": "detail", 
            "isredirect":false
        });
        navEvt.fire();
}*/
})