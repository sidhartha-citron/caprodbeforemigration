/**
 * @FileName: ServicePlanManagerFormHelper.js
 * @Description: Helper methods for ServicePlanManagerForm
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       12/4/2019         Created
 *-----------------------------------------------------------  
 */

 // Hints to ensure labels are preloaded
 // $Label.c.Route
 // $Label.c.Job_Type
 // $Label.c.Line_of_Business
 // $Label.c.Frequency
 // $Label.c.Schedule_Type
 // $Label.c.Anchor_Date

({
    /*
     * @Name        initializeLookupFilters
     * @Description Set the filter criteria for the custom lookup fields
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    initializeLookupFilters : function(component) {
        let routeLookupFilter = {
            "Route__c" : "Id, Name, Service_Resource__r.Name"
        };

        component.set("v.routeLookupFilter", routeLookupFilter);
        component.set("v.routeQueryFilter", "AND Service_Resource__r.IsActive = TRUE");
        component.set("v.routeComparisonField", "Service_Resource__r.Name");
        component.set("v.routeDisplayFields", ["Service_resource__r.Name", "Name"]);

        let scheduleLookupFilter = {
            "Schedule_Type__c" : "Id, Name"
        };

        component.set("v.scheduleLookupFilter", scheduleLookupFilter);
        component.set("v.scheduleQueryFilter", "AND Frequency__c = \'" + component.get("v.servicePlanRecord.Frequency__c") + "\'");
        component.set("v.scheduleComparisonField", "Name");
    },

    refreshForm : function(component) {



    },

    /*
     * @Name        initializeServicePlan
     * @Description Set the passed in Service Plan (Manage) or instantiate a new Service Plan (Create)
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    initializeServicePlan : function(component) {
        let plan = component.get("v.servicePlanRecord");

        if(!plan) {
            component.set("v.routeSearchString", '');
            component.set("v.scheduleSearchString", '');
            component.set("v.assets", []);

            let action = component.get("c.getServicePlan");

            action.setCallback(this, function(response) {
                let success = LightningUtils.handleCalloutResponse(response, $A.get("$Label.c.SPM_Initialization_Error"));

                if(success === true) {
                    let record = JSON.parse(response.getReturnValue());
                    record.Account__c = component.get("v.accountId");
                    component.set("v.servicePlanRecord", record);
                    // dereference record from cached versions
                    component.set("v.servicePlanRecordCache", JSON.parse(JSON.stringify(record)));
                    component.set("v.servicePlanRecordCacheStart", JSON.parse(JSON.stringify(record)));
                    component.set("v.variety", "Create");
                }

            });
            $A.enqueueAction(action);
        }
        else if (plan.Id) {
            component.set("v.variety", "Manage");
            // dereference plan from cached versions
            component.set("v.servicePlanRecordCache", JSON.parse(JSON.stringify(plan)));
            component.set("v.servicePlanRecordCacheStart", JSON.parse(JSON.stringify(plan)));

            if(plan.Route__r && plan.Route__r.Service_Resource__r) {
                component.set("v.routeSearchString", plan.Route__r.Service_Resource__r.Name);
            }

            if(plan.Schedule_Type__r) {
                component.set("v.scheduleSearchString", plan.Schedule_Type__r.Name);
            }
			
            //Darcy 2021-06-02 Trello #899 Open Edit Access to Anchor Dates https://trello.com/c/hS7pcyjj
            /*
            let today = new Date().toISOString();

            if(plan.Effective_Date__c <= today) {
                component.set("v.anchorDatePassed", true);
            }
            */

            this.getOrderItems(component);
        }
    },

    /*
     * @Name        checkFields
     * @Description Validate field changes
     * @Author      Graeme Ward
     * @Params      component
     *              event
     * @Return      void
     */
    checkFields : function(component, event) {
        let field = event.getSource().get("v.label");
        let record = component.get("v.servicePlanRecord");

        // keyFieldChangeWarning must run first
        if(field === $A.get("$Label.c.Job_Type")
            || field === $A.get("$Label.c.Frequency")
            || field === $A.get("$Label.c.Line_of_Business"))
        {
            this.keyFieldChangeWarning(component, record, field);
        }

        if(field === "Frequency") {
            this.frequencyChange(component, record);
        }
    },

    /*
     * @Name        checkForShowItems
     * @Description Show a confirmation modal when key fields change that will result in deselecting items
     * @Author      Graeme Ward
     * @Params      component
     *              record
     *              field: field that changed
     * @Return      void
     */
    keyFieldChangeWarning : function(component, record, field) {
        let assets = component.get("v.assets");
        let confirmed = component.get("v.confirmed");

        if(!confirmed) {
            for(let asset of assets) {
                if(asset.selected) {
                     this.showKeyFieldChangeModal(component, field);
                     return;
                }
            }
        }

        this.resetItems(component, record);
    },

    /*
     * @Name        confirmation
     * @Description Handle confirmation event from a modal
     * @Author      Graeme Ward
     * @Params      component
     *              event
     * @Return      void
     */
    confirmation : function(component, event) {
        let confirmationType = event.getParam("confirmationType");
        let confirmationValue = event.getParam("confirmationValue");
        let record = component.get("v.servicePlanRecord");

        if(confirmationType === "keyFieldChange") {
            if(confirmationValue === $A.get("$Label.c.Confirmed")) {
                component.set("v.keyFieldChange", true);
                this.resetItems(component, record);
            } else {
                let cache = component.get("v.servicePlanRecordCache");

                component.set("v.servicePlanRecord", JSON.parse(JSON.stringify(cache)));
            }
        }

        if(confirmationType === "duplicateServicePlans") {
            if(confirmationValue === $A.get("$Label.c.Confirmed")) {
                this.upsertServicePlan(component, true);
            }
        }

    },

    /*
     * @Name        resetItems
     * @Description Requery items with new filter criteria
     * @Author      Graeme Ward
     * @Params      component
     *              record
     * @Return      void
     */
    resetItems : function(component, record) {
        if((record.Job_Type__c === "Recurring Service"
                && record.Frequency__c
                && record.Line_of_Business__c)
            || (record.Job_Type__c === "Recurring Delivery"
                && record.Frequency__c))
        {
            this.getOrderItems(component);
        }
        else {
            let itemList = component.find("itemList");

            if(itemList) {
                itemList.setMessage($A.get("$Label.c.SPM_Fill_Fields_Message"));
            }

            component.set("v.assets", []);
        }

        if(record.Job_Type__c === "Recurring Delivery" || !record.Job_Type__c) {
            record.Line_of_Business__c = "";
            component.set("v.servicePlanRecord", record);
        }

        component.set("v.servicePlanRecordCache", JSON.parse(JSON.stringify(record)));
    },

    /*
     * @Name        frequencyChange
     * @Description Clears the Schedule Type field and resets the Schedule Type search string when Frequency changes
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    frequencyChange : function(component, record) {
        component.set("v.scheduleQueryFilter", "AND Frequency__c = \'" + record.Frequency__c + "\'");
        component.set("v.servicePlanRecord.Schedule_Type__c", null);
        component.set("v.scheduleSearchString", '');
    },

    /*
     * @Name        getOrderItems
     * @Description Refreshes the Order Items list
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    getOrderItems : function(component) {
        let itemList = component.find("itemList");

        if(itemList) {
            itemList.getItems();
        }
    },

    /*
     * @Name        showKeyFieldChangeModal
     * @Description Constructs a modal to warn of key field changes
     * @Author      Graeme Ward
     * @Params      component
     *              field: key field that has been changed
     * @Return      void
     */
    showKeyFieldChangeModal : function(component, field) {
        $A.createComponent(
            "c:ServicePlanManagerFieldChangeModal",
            {
                "field" : field
            },
            function(confirmationModal, status, errorMessage){
                if(status === "SUCCESS") {
                    let body = component.get("v.body");
                    body.push(confirmationModal);
                    component.set("v.body", body);
                }
                else if(status === "INCOMPLETE") {
                    console.error("No response from server or client is offline.")
                }
                else if(status === "ERROR") {
                    console.error("Error: " + errorMessage);
                }
            }
        );
    },

    /*
     * @Name        upsertServicePlan
     * @Description Creates or updates a Service Plan and its related Order Items
     * @Author      Graeme Ward
     * @Params      component
     *              confirmed: form has been validated and duplicate check has been confirmed
     * @Return      void
     */
    upsertServicePlan : function(component, confirmed) {
        component.set("v.spinner", true);

        if(confirmed === true) {
            let action = component.get("c.upsertServicePlan");

            let plan = component.get("v.servicePlan");

            let criteria = {
                "servicePlan" : component.get("v.servicePlanRecord"),
                "assets" : component.get("v.assets"),
                "keyFieldChange" : component.get("v.keyFieldChange")
            };

            console.log(component.get("v.assets"));

            action.setParams({"criteriaJSON" : JSON.stringify(criteria)});

            action.setCallback(this, function(response) {
                let success = LightningUtils.handleCalloutResponse(response, $A.get("$Label.c.SPM_Update_Error"));

                if(success === true) {
                    LightningUtils.setToast($A.get("$Label.c.Success"), $A.get("$Label.c.SPM_Update_Success"), "success");
                    this.refresh(component);
                }

                component.set("v.spinner", false);
            });
            $A.enqueueAction(action);
        } else {
             this.validateServicePlan(component);
        }
    },

    /*
     * @Name        validateServicePlan
     * @Description Validates the form and checks for duplicate Service Plans
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    validateServicePlan : function(component) {
        let isValid = LightningUtils.checkFormValidity(component);
        
        if(isValid) {
            console.log(component.get("v.variety"));
            if(component.get("v.variety")=="Create"){
                var lstAssets = component.get("v.assets");
                var isPass = false;
                
                console.log(lstAssets);
                for(var i=0;i<lstAssets.length;i++){
                    console.log(lstAssets[i].selectedQuantity);
                    if(lstAssets[i].selectedQuantity>0){isPass=true;}
                }
                if(!isPass){
                    LightningUtils.setToast($A.get("$Label.c.Error"),"At least one item must be selected in order to create a service plan", "Error");
                    component.set("v.spinner", false);
                    return;
                }
            }
            
            if(this.checkForDuplicateFieldChange(component)) {
                let action = component.get("c.checkForDuplicateServicePlans");

                let plan = component.get("v.servicePlanRecord");

                let criteria = {
                    "servicePlan" : component.get("v.servicePlanRecord")
                };

                action.setParams({"criteriaJSON" : JSON.stringify(criteria)});

                action.setCallback(this, function(response) {
                    let success = LightningUtils.handleCalloutResponse(response, $A.get("$Label.c.SPM_Duplicate_Check_Error"));

                    if(success === true) {
                        let plans = JSON.parse(response.getReturnValue());

                        if(plans.length === 0) {
                            this.upsertServicePlan(component, true);
                        } else {
                            this.showConfirmationModal(component, plans);
                            component.set("v.spinner", false);
                        }
                    } else {
                        component.set("v.spinner", false);
                    }
                });
                $A.enqueueAction(action);
            }
            else {
                this.upsertServicePlan(component, true);
            }
        } else {
            component.set("v.spinner", false);
        }
    },

    /*
     * @Name        checkForDuplicateFieldChange
     * @Description Checks whether any of the duplicate check fields have been changed
     * @Author      Graeme Ward
     * @Params      component
     * @Return      Boolean: whether or not a duplicate check field has changed
     */
    checkForDuplicateFieldChange : function(component) {
        let fieldChanged = false;
        
        let plan = component.get("v.servicePlanRecord");
        let planStart = component.get("v.servicePlanRecordCacheStart");
        
        if(plan.Route__c !== planStart.Route__c
            || plan.Job_Type__c !== planStart.Job_Type__c
            || plan.Line_of_Business__c !== planStart.Line_of_Business__c
            || plan.Frequency__c !== planStart.Frequency__c
            || plan.Schedule_Type__c !== planStart.Schedule_Type__c)
        {
            fieldChanged = true;
        }
        
        return fieldChanged;
    },

    /*
     * @Name        showConfirmationModal
     * @Description Constructs a modal to warn of duplicate Service Plans
     * @Author      Graeme Ward
     * @Params      component
     *              plans: potential duplicate Service Plans
     * @Return      void
     */
    showConfirmationModal : function(component, plans) {
        $A.createComponent(
            "c:ServicePlanManagerConfirmationModal",
            {
                "servicePlans" : plans
            },
            function(confirmationModal, status, errorMessage){
                if(status === "SUCCESS") {
                    let body = component.get("v.body");
                    body.push(confirmationModal);
                    component.set("v.body", body);
                }
                else if(status === "INCOMPLETE") {
                    console.error($A.get("$Label.c.Error_No_Response_From_Server"));
                }
                else if(status === "ERROR") {
                    console.error("Error: " + errorMessage);
                }
            }
        );
    },

    /*
     * @Name        refresh
     * @Description Refreshes the service plan manager
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    refresh : function(component) {
        component.getEvent("ServicePlanManagerRefresh").fire();
        component.set("v.servicePlanRecord", null);
        component.set("v.assets", []);
    }
});