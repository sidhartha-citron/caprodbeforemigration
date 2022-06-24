({
    initSiteSurvey : function(component) {
        $A.util.removeClass(component.find("theSpinner"), "slds-hide");
        var recordId= component.get("v.recordId");
        //console.log('recordId:' + recordId);
        var recordsPerPage = component.get("v.locationsPerPage");
        
        var action = component.get("c.loadViewData");
        action.setParams({
            "parentRecordId": component.get("v.recordId"), 
            "siteSurveyId":component.get("v.siteSurveyId")
        });
        
        action.setCallback(this, function(response) {
            if(component.isValid() && response.getState() === "SUCCESS")
            {
                component.set("v.viewData", response.getReturnValue());
                component.set("v.displayedSurveyLocations", response.getReturnValue().surveyLocations.slice(0, recordsPerPage));
                console.log('DISABLESTUFF: ' + response.getReturnValue().surveyLocations.length);
                if (response.getReturnValue().surveyLocations.length < recordsPerPage + 1){
                    component.set("v.disableNext", true);
                }
                else {
                    component.set("v.disableNext", false);
                }
                console.log('The Helper for Allocation Component ');
                console.log(' site survey id from viewdata after setting attribute ' + component.get("v.siteSurveyId"));
                //this.renderPage(component);
                console.log('HELPER COMPLETED');
                $A.util.addClass(component.find("theSpinner"), "slds-hide");
            }
        });
        $A.enqueueAction(action);
        //
    },
    
    renderPage : function(component){
         //records = component.get("v.tempSurveyLocations"),
        var pageNumber = component.get("v.pageNumber");
           var selectedValue = component.find("selectSort").get("v.value");
            var sortAsc = !component.find("sortDesc").get("v.value");
            console.log(component.get("v.locationsPerPage"));
            if (pageNumber != -1){
                //this.showSpinner(component
                
                var recordsPerPage = component.get("v.locationsPerPage");
                var offset = pageNumber*recordsPerPage - recordsPerPage;
                var searchString = component.get("v.querySearchString");
                console.log ('OFFSET: ' + offset);
                
                $A.util.removeClass(component.find("theSpinner"), "slds-hide");

                var action2 = component.get("c.reQuerySurveyLocations");
                action2.setParams({
                    "siteSurveyId":component.get("v.siteSurveyId"),
                    "offsetAmount":offset,
                    "searchString":searchString,
                    "filterVal":selectedValue,
                    "ascSort":sortAsc
                });
                action2.setCallback(this, function(response) { 
                    if(component.isValid() && response.getState() === "SUCCESS") {
                        console.log('NEW RECORDS: ' + response.getReturnValue());
                        if (response.getReturnValue().length > 0){
                            component.set("v.displayedSurveyLocations", response.getReturnValue().slice(0, recordsPerPage));
                            if (response.getReturnValue().length < recordsPerPage + 1){
                                component.set("v.disableNext", true);
                            }
                            else{
                                component.set("v.disableNext", false);
                            }
                        }
                        $A.util.addClass(component.find("theSpinner"), "slds-hide");
                    }
                });
                $A.enqueueAction(action2);
                /*var newMaxPage = Math.floor((records.length+recordsPerPage-1)/recordsPerPage);
                if (newMaxPage == 0) {
                    newMaxPage = 1;
                }
                component.set("v.maxPage", newMaxPage);
                if (pageNumber > newMaxPage) {
                    pageNumber = newMaxPage;
                    component.set("v.pageNumber", pageNumber);
                }
                var pageRecords = records.slice((pageNumber-1)*recordsPerPage, pageNumber*recordsPerPage);
                console.log("RECORDSPERPAGE: " + recordsPerPage);
                component.set("v.displayedSurveyLocations", pageRecords);*/
        	}
        //this.hideSpinner(component);
        
    	},
    
    searchLocations: function(component, event, helper){
        var searchString = component.get("v.searchString").trim().toLowerCase(),
            sortAsc = !component.find("sortDesc").get("v.value");
        console.log('SEARCHSTRING: ' + searchString);
        component.set("v.querySearchString", searchString);
    
        var action = component.get("c.reQuerySurveyLocations");
       	action.setParams({
            "siteSurveyId":component.get("v.siteSurveyId"),
            "offsetAmount":0,
            "searchString":searchString,
            "filterVal":component.find("selectSort").get("v.value"),
            "ascSort":sortAsc
        });
        action.setCallback(this, function(response) { 
            if(component.isValid() && response.getState() === "SUCCESS") {
                if (response.getReturnValue().length == 0){
                    component.set("v.displayedSurveyLocations", response.getReturnValue()); 
                    component.set("v.pageNumber", -1);
                }
                else{
                    component.set("v.pageNumber", -1);
                    component.set("v.pageNumber", 1);
                }
            }
        });
    
        $A.enqueueAction(action);
        //component.set("v.pageNumber", 1);
      // if (!$A.util.isEmpty(searchString)) {
      /*
            var records = component.get("v.displayedSurveyLocations"),
            tempRecords = [];
            
            for (var i = 0; i < records.length; i++) {
                var record = records[i];
                
                for (var key in records[i]) {
                    if (records[i][key].toString().toLowerCase().indexOf(searchString) > -1) {
                        tempRecords.push(record);
                        break;
                    }
                }
            }
            
            component.set("v.displayedSurveyLocations", tempRecords);
            
            var selectedValue = component.find("selectSort").get("v.value");
            helper.sortBy(component, selectedValue);
            helper.renderPage(component);*/
     //   }
    },
    
	getViewData : function(component) {
        console.log(' site survey id from getviewdata after setting attribute ' + component.get("v.siteSurveyId"))
		var action = component.get("c.loadViewData");
        action.setParams({
            "parentRecordId": component.get("v.recordId"), 
            "siteSurveyId":component.get("v.siteSurveyId")
        });
        
        action.setCallback(this, function(response) {
            if(component.isValid() && response.getState() === "SUCCESS")
            {
                //console.log('OP: ' + response.getReturnValue());
                component.set("v.viewData", response.getReturnValue());                
            }
            
        });
        $A.enqueueAction(action);
	},
    
    saveAllocations: function(component) {
        $A.util.removeClass(component.find("theSpinner"), "slds-hide");
        
        var action = component.get("c.saveAllocations");
        action.setParams({"allocationJSON": JSON.stringify(component.get("v.viewData").assetAllocation)});
        
                
        action.setCallback(this, function(response){           
            if(response.getState() === "SUCCESS")
            {
                /* show success toast                
                var customToast = component.find("customToast");   
                customToast.setCloseType(true);
                customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Success_Title"), 
                                        $A.get("$Label.c.Site_Survey_Save_Success_Message"), 'SUCCESS');*/
                
                /* changed by aleena using OOB toast */
                $A.util.addClass(component.find("theSpinner"), "slds-hide");
                var resultsToast = $A.get("e.force:showToast");
                resultsToast.setParams({
                    "title" : $A.get("$Label.c.Site_Survey_Save_Success_Title"),
                    "type" : 'success',
                    "message" :$A.get("$Label.c.Site_Survey_Save_Success_Message")
                }); 
                resultsToast.fire();
                
            } else {
                /* show error toast                
                var customToast = component.find("customToast"); 
                customToast.setCloseType(true);
                customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Error_Title"), 
                                        $A.get("$Label.c.Site_Survey_Save_Error_Message"), 'ERROR');*/
                
                /* changed by aleena using OOB toast */
                $A.util.addClass(component.find("theSpinner"), "slds-hide");
                var resultsToast = $A.get("e.force:showToast");
                resultsToast.setParams({
                    "title" : $A.get("$Label.c.Site_Survey_Save_Error_Title"),
                    "type" : 'error',
                    "message" :$A.get("$Label.c.Site_Survey_Save_Error_Message")
                }); 
                resultsToast.fire();
            }
        });
        $A.enqueueAction(action);
    },
    
    showPopupHelper: function(component, componentId, className){
        var modal = component.find(componentId);
        $A.util.removeClass(modal, className + 'hide');
        $A.util.addClass(modal, className + 'open');
    },
    
    hidePopupHelper: function(component, componentId, className){
        var modal = component.find(componentId);
        $A.util.addClass(modal, className+'hide');
        $A.util.removeClass(modal, className+'open');
        
    },
    
    showPopup: function(component,componentId)
    {
       this.showPopupHelper(component, componentId, 'slds-fade-in-');
	   this.showPopupHelper(component,'backdrop','slds-backdrop--'); 
    },
    
    hidePopup: function(component, componentId)
    {
        this.hidePopupHelper(component, componentId, 'slds-fade-in-');
        this.hidePopupHelper(component, 'backdrop', 'slds-backdrop--');
    },
    
    findParentLI: function(el, tag)
    {
        while(el != undefined && el.parentNode) {
            el = el.parentNode;
            if(el.tagName === tag)
                return el;
        }
        return null;
    },
    
    supressChildEvents: function(component, componentId, suppressEvent)
    {
        // supress events of child elements under draggableTo
        var dropzones = component.find(componentId);
        var arrayLength = dropzones.length;
        console.log(' suppressing Child events helper : ' + dropzones);
        console.log(' suppressing Child events helper size : ' + arrayLength);
        console.log(' suppressing Child events helper first and only value using for loop and not for each : ' + dropzones[0]);
        try {
            //for(var i in dropzones)
            if(arrayLength === null || typeof arrayLength === "undefined") {
                if(suppressEvent)
                    dropzones.getElement().classList.add("noevent-child");
                else
                    dropzones.getElement().classList.remove("noevent-child");  
            } else {
                for (var i = 0; i < dropzones.length; i++)
                {
                    console.log("value of i : " + i);
                    if(dropzones[i])
                        if(suppressEvent)
                            dropzones[i].getElement().classList.add("noevent-child");
                        else
                            dropzones[i].getElement().classList.remove("noevent-child");  
                }
            }
        }catch(ex){
            console.log("Caught JS Exception : " + ex);
        }
    },
    
    highlightDragToElements: function(component, event)
    {        
        if(event.srcElement)
        {          
            //event.srcElement.style.border = "2px dashed rgb(216, 221, 230)";
            event.srcElement.style.background = "rgba(200, 200, 200, 0.75)";
        }
    },
    
    hideDragToElements: function(component, event)
    {
        if(event.srcElement)
        {
            //event.srcElement.classList.remove("over");
            //event.srcElement.style.border = '';
            event.srcElement.style.background = "";
        }
    },
    
    removeSurveyLocation: function(component, event, locationId)
    {       
        var removedSurveyLocation;
        //var surveyLocationId = event.getSource().get("v.value");
        console.log('Delete surveyLocationId:' + locationId);        
        
        // call the apex method to delete the survey location record in Salesforce
        $A.util.removeClass(component.find("theSpinner"), "slds-hide");
        var action = component.get("c.deleteSurveyLocation");
        action.setParams({"surveyLocationId": locationId});
        
        action.setCallback(this, function(response) {
            if(response.getState() === "SUCCESS")
            {      
                if(response.getReturnValue() === true) {
                    // reinitialize page data
                    this.initSiteSurvey(component);                    
                    this.renderPage(component);
                    /* show success toast                
                    var customToast = component.find("customToast"); 
                    customToast.setCloseType(true);
                    customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Success_Title"), 
                                            $A.get("$Label.c.Site_Survey_Save_Success_Message"), 'SUCCESS'); */
                    
                    /* changed by aleena using OOB toast */
                    var resultsToast = $A.get("e.force:showToast");
                    resultsToast.setParams({
                        "title" : $A.get("$Label.c.Site_Survey_Save_Success_Title"),
                        "type" : 'success',
                        "message" :$A.get("$Label.c.Site_Survey_Save_Success_Message")
                    }); 
                    resultsToast.fire();
                    
                } else {
                    /* show error toast                
                    var customToast = component.find("customToast"); 
                    customToast.setCloseType(false);
                    customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Error_Title"), 
                                            $A.get("$Label.c.Site_Survey_Save_Error_Message"), 'ERROR');*/
                    
                    /* changed by aleena using OOB toast */
                    var resultsToast = $A.get("e.force:showToast");
                    resultsToast.setParams({
                        "title" : $A.get("$Label.c.Site_Survey_Save_Error_Title"),
                        "type" : 'error',
                        "message" :$A.get("$Label.c.Site_Survey_Save_Error_Message")
                    }); 
                    resultsToast.fire();
                }
            } else {
                /* show error toast                
                var customToast = component.find("customToast");  
                customToast.setCloseType(false);
                customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Error_Title"), 
                                        $A.get("$Label.c.Site_Survey_Save_Error_Message"), 'ERROR');*/
                
                /* changed by aleena using OOB toast */
                var resultsToast = $A.get("e.force:showToast");
                resultsToast.setParams({
                    "title" : $A.get("$Label.c.Site_Survey_Save_Error_Title"),
                    "type" : 'error',
                    "message" :$A.get("$Label.c.Site_Survey_Save_Error_Message")
                }); 
                resultsToast.fire();
            }
            
        });
        
       $A.enqueueAction(action);

    },
    
    removeAllocation: function(component, event, btnValue, btnName)
    {        
        //var btnValue = event.getSource().get("v.value"); 
        //var btnName = event.getSource().get("v.name");
        console.log('Button Value on Remove Helper ' + btnValue);
        console.log('Button Name on Remove Helper ' + btnName);
        var actionParams = [];
        actionParams = btnValue.split('|');
        console.log('in delete ' + actionParams);
        var locationId = actionParams[1];
        var removeProductId = actionParams[2];
        var removeRelatedProd;
        var frequency;
        if(actionParams.length > 3 ) {
            removeRelatedProd = actionParams[3];
            console.log(' related Prod Id ' + removeRelatedProd);
        }
        if(actionParams.length > 4 ) {
            frequency = actionParams[4];
            console.log(' frequency ' + frequency);
        }
        //console.log('locationId: ' + locationId);
        //console.log('Product to remove: ' + removeProductId);
        var recordId = component.get("v.recordId");
        
        // call the apex method to delete the survey asset location record in Salesforce
        $A.util.removeClass(component.find("theSpinner"), "slds-hide");
        var action = component.get("c.deleteSurveyAssetLocation");
        action.setParams({"productId": removeProductId,
                          "locationId":locationId,
                          "parentRecordId":recordId,
                          "relatedProdId": removeRelatedProd, 
                          "frequency":frequency, 
                          "quantity":btnName
                         });
        
        action.setCallback(this, function(response) {
            if(response.getState() === "SUCCESS")
            { 
                if(response.getReturnValue() === true) {
                    // reinitialize page data
                    this.initSiteSurvey(component); 
                    this.renderPage(component);
                    //$A.util.addClass(component.find("theSpinner"), "slds-hide");
                    /* show success toast                
                    var customToast = component.find("customToast");  
                    customToast.setCloseType(true);
                    customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Success_Title"), 
                                            $A.get("$Label.c.Site_Survey_Save_Success_Message"), 'SUCCESS');  */
                    
                    /* changed by aleena using OOB toast */
                    var resultsToast = $A.get("e.force:showToast");
                    resultsToast.setParams({
                        "title" : $A.get("$Label.c.Site_Survey_Save_Success_Title"),
                        "type" : 'success',
                        "message" :$A.get("$Label.c.Site_Survey_Save_Success_Message")
                    }); 
                    resultsToast.fire();
                } else {
                    /* show error toast                
                    var customToast = component.find("customToast"); 
                    customToast.setCloseType(false);
                    customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Error_Title"), 
                                            $A.get("$Label.c.Site_Survey_Save_Error_Message"), 'ERROR'); */
                    
                    /* changed by aleena using OOB toast */
                    var resultsToast = $A.get("e.force:showToast");
                    resultsToast.setParams({
                        "title" : $A.get("$Label.c.Site_Survey_Save_Error_Title"),
                        "type" : 'error',
                        "message" :$A.get("$Label.c.Site_Survey_Save_Error_Message")
                    }); 
                    resultsToast.fire();
                    
                }                
            } else {
                /* show error toast                
                var customToast = component.find("customToast"); 
                customToast.setCloseType(false);
                customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Error_Title"), 
                                        $A.get("$Label.c.Site_Survey_Save_Error_Message"), 'ERROR'); */
                
                /* changed by aleena using OOB toast */
                var resultsToast = $A.get("e.force:showToast");
                resultsToast.setParams({
                    "title" : $A.get("$Label.c.Site_Survey_Save_Error_Title"),
                    "type" : 'error',
                    "message" :$A.get("$Label.c.Site_Survey_Save_Error_Message")
                }); 
                resultsToast.fire();
            }
        });
        $A.enqueueAction(action);
    },
    
   /* sortBy : function(component, field) {        
        var initrecords = component.get("v.viewData"),
        records = initrecords.surveyLocations,
        tempRecords = [],
        tempSurveyLocations = component.get("v.tempSurveyLocations"),
        searchString = component.get("v.searchString").toLowerCase();
        
        var sortAsc = !component.find("sortDesc").get("v.value");
        
        var reA = /[^a-zA-Z]/g;
        var reN = /[^0-9]/g;
        
        tempSurveyLocations.sort(function(a, b) {
            var aField = $A.util.isUndefinedOrNull(a[field]) ? "" : a[field];
            var bField = $A.util.isUndefinedOrNull(b[field]) ? "" : b[field];
            
            var AInt = parseInt(aField, 10);
            var BInt = parseInt(bField, 10);
            
            if (isNaN(AInt) && isNaN(BInt)) {
                var aA = aField.replace(reA, "");
                var bA = bField.replace(reA, "");
                if (aA === bA) {
                    var aN = parseInt(aField.replace(reN, ""), 10);
                    var bN = parseInt(bField.replace(reN, ""), 10);
                    
                    if (sortAsc) { return aN === bN ? 0 : aN > bN ? 1 : -1; }
                    return aN === bN ? 0 : aN > bN ? -1 : 1;//desc
                }
                
                if (sortAsc) { return aA > bA ? 1 : -1; }
                return aA > bA ? -1 : 1;//desc
            } else if(isNaN(AInt)) {//A is not an Int
                return sortAsc ? 1 : -1;//to make alphanumeric sort first return -1 here
            } else if(isNaN(BInt)) {//B is not an Int
                return sortAsc ? -1 : 1;//to make alphanumeric sort first return 1 here
            }
            if (sortAsc) { return AInt > BInt ? 1 : -1; }
            return AInt > BInt ? -1 : 1;//desc
        });
        
        component.set("v.tempSurveyLocations", tempSurveyLocations);
        this.renderPage(component);
    },*/
    
    /*showSpinner: function(component, event, helper)
    {
        component.set("v.spinner", true);
    },
    
    hideSpinner: function(component, event, helper)
    {
        component.set("v.spinner", false);
    }*/
})