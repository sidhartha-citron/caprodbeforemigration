({
    doInit : function(component, event, helper) {
        console.log('INIT SPINNER');
        //$A.util.addClass(component.find("theSpinner"), "slds-hide");
        
        var action = component.get("c.initSiteSurvey");
        action.setParams({
            "parentRecordId":component.get("v.recordId")
        });
        action.setCallback(this, function(response){
            if(component.isValid() && response.getState() === "SUCCESS") {
                
                var response = response.getReturnValue();
                component.set("v.siteSurveyId", response);
                console.log(' Site Survey Id coming from apex init ' + component.get("v.siteSurveyId"));
                console.log('HELPER CALLED');
                
                var actionForLocation = component.get("c.getLocationsPerPage");
                
                actionForLocation.setCallback(this, function(locationCount){
                    if(component.isValid() && locationCount.getState() === "SUCCESS") {
                        var locationsPerPage = locationCount.getReturnValue();
                    	component.set("v.locationsPerPage", locationsPerPage);
                         helper.initSiteSurvey(component);
                    }
                    
                });
                $A.enqueueAction(actionForLocation);  
               
            }
            
        });
        
        $A.enqueueAction(action);
        console.log('-- In Site Survey Allocation Component -- '); 
        console.log(' RecordId ' + component.get("v.recordId"));
    },
    
    updatePageNum : function(component, event, helper){ //Case 21530 Part 5 - MD
        helper.renderPage(component);
    },
    
    preSearchLocations : function(component, event, helper){//Case 21530 - MD
        console.log(event.which);
		if (event.which == 13){
			helper.searchLocations(component, event, helper);
        }
    },
    
    searchLocations: function(component, event, helper){ // 21530 part 5 - MD
		helper.searchLocations(component, event, helper);
    },
    
    handleSave: function(component, event, helper)
    {
        helper.saveAllocations(component);
    },
    
    onDragStart: function(component, event, helper) {    
        var viewData = component.get("v.viewData");
        //var surveyLocations = viewData.surveyLocations;
        var surveyLocations = component.get("v.displayedSurveyLocations");
        //console.log('surveyLocations ' + surveyLocations);
        //console.log('Boolean ' + event.srcElement && (surveyLocations!==null && typeof surveyLocations!=="undefined" && surveyLocations!==""));
        if(event.srcElement) {
            console.log(' suppressing Child events controller : ' +component.find("draggableTo"));
            // supress events of child elements under draggableTo
            helper.supressChildEvents(component,"draggableTo",true);
            
            event.dataTransfer.effectAllowed = "move"; 
            
            // get product data from unallocatedProducts
            var productName='';
            var frequency = event.srcElement.dataset.frequency;
            var relatedProdValue=event.srcElement.dataset.relatedprod; //event.srcElement.dataset.availableqtyevent.srcElement.dataset.relatedProd;
            var sourceParentId = '';
            var sourceRecordId = '';
            var productId = event.srcElement.dataset.productid;
            var availableQty = event.srcElement.dataset.availableqty;
            //var viewData = component.get("v.viewData");
            console.log('On Drag Start ' + relatedProdValue + ' ' + event.srcElement.dataset);
            console.log('On Drag Start Frequency ' + frequency + ' ' + event.srcElement.dataset.frequency);
            
            var hasProduct = relatedProdValue !== null && typeof relatedProdValue !== "undefined";
            var hasFrequency = frequency !== null && typeof frequency !== "undefined";
            
            if(viewData) {
                // get product data from unallocatedProducts
                for(var i = 0; i < viewData.unAllocatedAssets.length;i++)
                {
                    console.log(' prd Name ' + viewData.unAllocatedAssets[i].name + ' related ' + viewData.unAllocatedAssets[i].relatedProdId);
                    console.log(' frequency ' + viewData.unAllocatedAssets[i].serviceFrequency + ' ' + hasFrequency);
                    
                    if(hasProduct || hasFrequency) {
                        if(hasProduct && hasFrequency) {
                            console.log(' with freq and related prod ');
                            if(productId == viewData.unAllocatedAssets[i].productid && relatedProdValue === viewData.unAllocatedAssets[i].relatedProdId
                               && frequency === viewData.unAllocatedAssets[i].serviceFrequency) 
                            {
                                productName =  viewData.unAllocatedAssets[i].name;
                                sourceParentId = viewData.unAllocatedAssets[i].sourceParentId;
                                sourceRecordId = viewData.unAllocatedAssets[i].sourceRecordId;  
                                relatedProdValue = viewData.unAllocatedAssets[i].relatedProdId;
                                frequency = viewData.unAllocatedAssets[i].serviceFrequency;
                                break;
                            }
                        } else if(hasProduct) {
                            console.log(' only related prod ');
                            if(productId == viewData.unAllocatedAssets[i].productid && relatedProdValue === viewData.unAllocatedAssets[i].relatedProdId) 
                            {
                                productName =  viewData.unAllocatedAssets[i].name;
                                sourceParentId = viewData.unAllocatedAssets[i].sourceParentId;
                                sourceRecordId = viewData.unAllocatedAssets[i].sourceRecordId;  
                                relatedProdValue = viewData.unAllocatedAssets[i].relatedProdId;
                                break;
                            }
                        }else if(hasFrequency) {
                            console.log(' with freq only ');
                            if(productId == viewData.unAllocatedAssets[i].productid && frequency === viewData.unAllocatedAssets[i].serviceFrequency) 
                            {
                                productName =  viewData.unAllocatedAssets[i].name;
                                sourceParentId = viewData.unAllocatedAssets[i].sourceParentId;
                                sourceRecordId = viewData.unAllocatedAssets[i].sourceRecordId;  
                                frequency = viewData.unAllocatedAssets[i].serviceFrequency;
                                break;
                            }
                        }
                    } else {
                        console.log(' no related attributes');
                        if(productId == viewData.unAllocatedAssets[i].productid) {
                            productName =  viewData.unAllocatedAssets[i].name;
                            sourceParentId = viewData.unAllocatedAssets[i].sourceParentId;
                            sourceRecordId = viewData.unAllocatedAssets[i].sourceRecordId;  
                            break;
                        } 
                    }
                }
            }
            
            var data = {
                productid:productId, 
                relatedProdId:relatedProdValue, 
                availqty: availableQty,
                name:productName,
                sourceParentId: sourceParentId,
                sourceRecordId: sourceRecordId, 
                serviceFrequency:frequency
            };
            
            event.dataTransfer.setData('text/plain',JSON.stringify(data));
        }        
    },  
    
    onDragOver: function(component, event) {
        //var viewData = component.get("v.viewData");
        //var surveyLocations = viewData.surveyLocations;
        
        //if(surveyLocations!==null && typeof surveyLocations!=="undefined") {
            event.stopPropagation();
        	event.preventDefault();
       // }
    },
    
    onDragEnter: function(component, event, helper) {                
        //TODO - remove this method 
        // show the "drag to" elements
        //var viewData = component.get("v.viewData");
        //var surveyLocations = viewData.surveyLocations;
        
        //if(surveyLocations!==null && typeof surveyLocations!=="undefined") {
            helper.highlightDragToElements(component, event);     
        	console.log('entering:' + event.toElement + event.srcElement);
        //}
    }, 
    
    onDragLeave: function(component, event, helper)
    {
        // remove the border
        helper.hideDragToElements(component, event);
        
        
    },
    
    onDragEnd: function(component, event, helper)
    {
        // remove the border
        //var viewData = component.get("v.viewData");
        //var surveyLocations = viewData.surveyLocations;
        
        //if(surveyLocations!==null && typeof surveyLocations!=="undefined") {
            helper.hideDragToElements(component,event);  
        	helper.supressChildEvents(component,"draggableTo",false);
        //}
    },
    
    onDrop: function(component, event, helper) {
        
        // remove the border
        helper.hideDragToElements(component, event);
        
        event.dataTransfer.dropEffect = "move"; 
        
        // find the product being dragged
        var data = JSON.parse(event.dataTransfer.getData("text/plain"));      
        var roomId = event.srcElement.dataset.roomid;			// location id from the target element        
        
        // loop over all the locations and find the record 
        // corresonding to roomid
        var viewData = component.get("v.viewData");
        //var surveyLocations = viewData.surveyLocations;
        var surveyLocations = component.get("v.displayedSurveyLocations");
        var allocatedLocation='';
        
        //if(surveyLocations!==null && typeof surveyLocations!=="undefined") {
            for(var index in surveyLocations)
            {
                var locationId = surveyLocations[index].Id;
                if(locationId === roomId)
                {
                    allocatedLocation = surveyLocations[index];
                    break;
                }
            }      
            
            // set the params in the allocate quantity component
            var allocationComponent = component.find("addAllocation");
            allocationComponent.setAllocationDetails(data, allocatedLocation, component.get("v.recordId")/*, component.get("v.viewData").isOrderSeasonal*/);
            
            // show the popup
            helper.showPopup(component, 'modalAllocateProduct');       
            
            event.stopPropagation();
            event.preventDefault();
        //}
    },
    
    hidePopupAllocateProduct: function(component, event, helper) {
        helper.hidePopup(component, 'modalAllocateProduct');        
    },
    
    hidePopupAddSurveyRoom: function(component, event, helper){
        helper.hidePopup(component, 'modalAddSurveyRoom'); 
    }, 
    
    removeAllocation: function(component, event, helper) {   
        //helper.removeAllocation(component, event); 
        var btnValue = event.getSource().get("v.value"); 
        var btnName = event.getSource().get("v.name");
        console.log('Button Name on Remove Controller ' + btnName);
        
        var prompt = component.find("promptComponent"); 
        
        if(prompt !== null && typeof prompt !== "undefined"){
            prompt.setPromptAssetDetails(btnValue, btnName);
        }
    },
    
    removeSurveyLocation: function(component, event, helper) {        
        var prompt = component.find("promptComponent"); 
        var surveyLocationId = event.getSource().get("v.value");
        component.set("v.surveyLocationIdToDelete", surveyLocationId);
        
        if(prompt !== null && typeof prompt !== "undefined"){
            prompt.setPromptLocationDetails(surveyLocationId);
        }
    },

	handlePromptEvent: function(component, event, helper) {        
        console.log(' Handling Reinitiating after deleting room/asset Event '); 
        var status = event.getParam("actionStatus"); 
        var isRoom = event.getParam("isRoom");
        var locationId = event.getParam("recordId");
        var value = event.getParam("value");
        var name = event.getParam("quantity");
        
        if(status) {
            if(isRoom) {
                if(locationId !== null && typeof locationId !== "undefined") {
                    console.log('Deleting Room, Re-initiating Site Survey Component ');
                    helper.removeSurveyLocation(component, event, locationId);
                    //helper.initSiteSurvey(component);
                }
            } else {
                var validValue = value !== null && typeof value !== "undefined"; 
                var validName = name !== null && typeof name !== "undefined"; 
                
                if(validValue && validName) {
                    helper.removeAllocation(component, event, value, name); 
                }
            }
        }
        //helper.removeSurveyLocation(component, event); handlePromptEvent
    },
    
    
    handleAddSurveyLocation: function(component, event, helper) {
        console.log(' Site Survey Id set by init helper ' + component.get("v.siteSurveyId"));
        helper.showPopup(component, 'modalAddSurveyRoom');        
        var addSurveyRoomCmp = component.find("addSurveyRoom");
        if(addSurveyRoomCmp)
        {
            addSurveyRoomCmp.setSurveyId(component.get("v.siteSurveyId"));
        }
    },
    
    editSurveyLocation: function(component, event, helper) {
        // id of the location being edited
        var surveyLocation = event.getSource().get("v.value");
        console.log('edit ' + surveyLocation.Service_Order__c);
        
        // show the add location modal
        helper.showPopup(component, 'modalAddSurveyRoom');        
        var addSurveyRoomCmp = component.find("addSurveyRoom");
        if(addSurveyRoomCmp)
        {            
            addSurveyRoomCmp.setLocationId(surveyLocation);
            //addSurveyRoomCmp.setLocationId(locationId, locationId);
        }
    },
    
    handleModalClose: function(component, event, helper) {
        var modalId = event.getParam("modalComponentId");
        helper.hidePopup(component, modalId);
    },
    
    handleNewSurveyLocationCreated: function(component, event, helper) {        
        console.log('event name:' + event.getName());
        // get the allocation param from New Survey Room component
        if(event.getParam("locationCreated") === true)
        {
            // reload view data
            //helper.getViewData(component);      
            helper.initSiteSurvey(component); 
            
            /* changed by aleena using OOB toast */
            var resultsToast = $A.get("e.force:showToast");
            resultsToast.setParams({
                "title" : $A.get("$Label.c.Site_Survey_Save_Success_Title"),
                "type" : 'success',
                "message" :$A.get("$Label.c.Site_Survey_Save_Success_Message")
            }); 
            resultsToast.fire();
            
            helper.renderPage(component);
            // show success toast                
            /*var customToast = component.find("customToast"); 
            customToast.setCloseType(true);
            customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Success_Title"), 
                                    $A.get("$Label.c.Site_Survey_Save_Success_Message"), 'SUCCESS');*/
            
            helper.hidePopup(component, 'modalAddSurveyRoom');
        }
    },
    
    handleNewAllocationCreated: function(component, event, helper) {
        // hide the modal dialog
        helper.hidePopup(component, 'modalAllocateProduct');
        
        // reload view data
        helper.getViewData(component);
    },
    //cloning survey allocations
    cloneAllocations: function(component, event, helper) {
        var target  = event.getSource(); 
        var record = target.get("v.value");
        console.log("Clone Controller"); 
        console.log(record);
        if(record !== null && typeof record !== "undefined") {
            var container = component.find("cloneComponent"); 
            container.setLocationDetails(record);
        }
    },
    /* Case 21530 Auto Allocate and Clone */
    handleCloneEvent: function(component, event, helper) {
        console.log(' Handling Reinitiating Event '); 
        var status = event.getParam("actionStatus");
        if(status) {
            console.log('Clone Success / Auto Allocate, Re-initiating Site Survey Component ');
            helper.initSiteSurvey(component);
            helper.renderPage(component);
        }

    },
    /* Case 21530 Auto Allocate */
    openAutoAllocate : function(component, event, helper) {
        var target  = event.getSource(); 
        var record = target.get("v.value");
        var autoAllocate = component.find("autoAllocateComponent");
        if(autoAllocate && !$A.util.isUndefinedOrNull(record))
        {            
            autoAllocate.setProductDetails(record);
        }
    },
    
    closeParentModal: function(component, event, helper) {
        $A.get("e.force:closeQuickAction").fire();
        $A.get('e.force:refreshView').fire();
    },
    
    sort : function(component, event, helper) {
        //helper.showSpinner(component, event, helper);
        
        //var selectedValue = component.find("selectSort").get("v.value");
        helper.renderPage(component);
        //helper.sortBy(component, selectedValue);
        
        //helper.hideSpinner(component, event, helper);
    },
    
    /*showSpinner: function(component, event, helper) {
        component.set("v.spinner", true);
    },
    
    hideSpinner: function(component, event, helper) {
        component.set("v.spinner", false);
    },*/
    
    resetSearchFilters: function(component, event, helper) {
        //var defaultValue = component.get("v.defaultSortValue");
        component.set("v.searchString", "");
        component.set("v.querySearchString", "");
        component.find("selectSort").set("v.value", "Name");
        component.find("sortDesc").set("v.value", false);
        
        helper.searchLocations(component, event, helper);
    }
})