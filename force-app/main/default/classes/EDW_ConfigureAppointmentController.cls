/**
* Name: EDW_ConfigureAppointmentController
* Author: PwC
* Date Created: April 24, 2019
* Purpose: To initialize and handle all logic of the Configure Appointment screen in the Emergency Dispatch Wizard
*/ 
public with sharing class EDW_ConfigureAppointmentController {
    private static Emergency_Dispatch_Wizard_Setttings__c edwSettings = Emergency_Dispatch_Wizard_Setttings__c.getOrgDefaults();
    private static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    private static final String NOT_APPLICABLE = 'N/A';
   
    /**
     * Loads all data for the Configure Appointment Screen when first initialized
     *
     * @param json  all data stringified 
     */
    @AuraEnabled
    public static String initializeConfigureAppointmentScreen(String json) {
        EDW_ViewModels.MainViewModel model = EDW_ViewModels.parseInitData(json);
        
        model.infestationLevels = EDW_UtilityClass.getInfestationLevelValues();
        model.treatmentTypes = EDW_UtilityClass.getTreatmentTypeValues();
        model.numberOfRooms = EDW_UtilityClass.getNumberOfRooms();
        model.resourcesRange = model.initializeResourcesRange();
        model.totalEstimatedDuration = 0;
        model.workTypeEstimatedDuration = 0;
        model.totalOrderAmount = 0;
        model.pageNumber = -1;
        model.disableNext = true;
        model.isValidToGenerateWorkOrder = true;
        model.numberOfResources = edwSettings.Default_Number_of_Resources_Value__c == null || edwSettings.Default_Number_of_Resources_Value__c < 1 
            ? 1 
            : Integer.valueOf(edwSettings.Default_Number_of_Resources_Value__c);
        
        try {
            if (model.mode == EDW_UtilityClass.NEW_MODE) {
            	System.debug('NEW MODE');
                
                if (model.order == null || String.isBlank(model.order.Id)) {
                    //doesn't insert into the system yet to prevent weird duplicate issue from happening
                    model.order = EDW_UtilityClass.createNewOrder(model.account, model.contact.Id, model.poNumber);
                    model.orderNumber = Label.Default_Order_Name;
                } else {
                    if (model.order.ShipToContactId != model.contact.Id || model.order.PoNumber != model.poNumber) {
                        model.order.ShipToContactId = model.contact.Id;
                    	model.order.PoNumber = model.poNumber;
                        
                        String savedOrderJson = saveOrder(System.JSON.serialize(model.order));
                        
                        model.order = (Order)System.JSON.deserialize(savedOrderJson, Order.class);
                    }
                    
                    model = refreshTableData(System.JSON.serialize(model));
                    
                    //model.order.PoNumber = model.poNumber;
                    model.defaultEstimatedDuration = model.totalEstimatedDuration == null || model.totalEstimatedDuration == 0 
                        ? model.workTypeEstimatedDuration 
                        : model.totalEstimatedDuration;
                    model.order.EffectiveDate = model.orderEffectiveDate;
                    model.poNumber = model.order.PoNumber;
                    model.order.Number_of_Resources__c = model.numberOfResources;
                }
                
                DateTimeRecord defaultOperatingHourTimes = EDW_UtilityClass.getDateTimeRecordFromAccount(new Map<Id, Account> { model.account.Id => model.account }, model.order);
                
                model.minOperatingHoursTime = String.valueOf(defaultOperatingHourTimes.startDate.time());
                model.maxOperatingHoursTime = String.valueOf(defaultOperatingHourTimes.endDate.time());
                
                System.debug(model.minOperatingHoursTime);
                System.debug(model.maxOperatingHoursTime);
                
                model.isCancelOrderButtonAccessible = model.isCancelOrderButtonAccessible == null ? false : model.isCancelOrderButtonAccessible;
                model.orderEffectiveDate = model.order.EffectiveDate;
                model.orderEffectiveTime = model.order.Service_Appointment_Scheduled_Start_Time__c;
            } else if (model.mode == EDW_UtilityClass.EDIT_MODE) {
                System.debug('EDIT MODE');
                
                model.tableRows = new List<EDW_ViewModels.TableOrderItem>();
                Order o = EDW_UtilityClass.getUpdatedOrderInformation(model.recordId);
                model.order = o;
                
                System.debug(model.order.Override_Account_Operating_Hours__c );
                
                model.contact = new Contact(Id = model.order.ShipToContactId, FirstName = model.order.ShipToContact.FirstName, LastName = model.order.ShipToContact.LastName);
                model.account = new Account(Id = model.order.AccountId, Site_Survey__c = model.order.Site_Survey__c, Is_Multi_Res__c = model.order.Account.Is_Multi_Res__c, PO_Required_for_Orders__c = model.order.Account.PO_Required_for_Orders__c, PO_Required_on_Line_Item__c = model.order.Account.PO_Required_on_Line_Item__c, AccPac_Account__c = model.order.Account.AccPac_Account__c, Name = model.order.Account.Name);

                model = refreshTableData(System.JSON.serialize(model));

                model.order.PoNumber = o.poNumber;
                model.defaultEstimatedDuration = model.totalEstimatedDuration == null || model.totalEstimatedDuration == 0 
                    ? model.workTypeEstimatedDuration 
                    : model.totalEstimatedDuration;
                model.order.EffectiveDate = model.orderEffectiveDate;
                model.poNumber = model.order.PoNumber;
                model.order.Number_of_Resources__c = model.numberOfResources;
                model.isCancelOrderButtonAccessible = true;
                model.mode = EDW_UtilityClass.NEW_MODE;
                model.orderNumber = model.order.OrderNumber;
                
                DateTimeRecord defaultOperatingHourTimes = EDW_UtilityClass.getDateTimeRecordFromAccount(new Map<Id, Account> { model.account.Id => model.account }, model.order);
                
                model.minOperatingHoursTime = String.valueOf(defaultOperatingHourTimes.startDate.time());
                model.maxOperatingHoursTime = String.valueOf(defaultOperatingHourTimes.endDate.time());
                
                model.orderEffectiveTime = model.order.Service_Appointment_Scheduled_Start_Time__c;
                System.debug(model.minOperatingHoursTime);
                System.debug(model.maxOperatingHoursTime);
            } else {
                System.debug('no mode selected');
                //error
            }
            
            return System.JSON.serialize(model);
        } catch (Exception e) {
            System.debug(e);
            System.debug(e.getMessage());
            System.debug(e.getLineNumber());
        }
        
        return null;
    }
    
    /**
     * Inserts the Order into the system to be leveraged on the Configure Appointment screen
     * 
     * @param jsonOrder  The Order to be inserted into the system
     */
    @AuraEnabled
    public static String insertOrder(String jsonOrder) {
        Order o = (Order)System.JSON.deserialize(jsonOrder, Order.class);
        
        //effort to remove duplicate order issue
        if (!EDW_UtilityClass.hasOrderBeenCreated) {
            System.debug('inserting the order');
            EDW_UtilityClass.hasOrderBeenCreated = true;
        	insert o;
            //get the updated information, including the order number
            o = EDW_UtilityClass.getUpdatedOrderInformation(o.Id);
            
        	return System.JSON.serialize(o);
        }
        
        throw new JSONException('The Order tried to insert twice and has been handled.');
    }
    
    /**
     * Retrieves the Order information to initialize the Customer Information component
     *
     * @param orderId  the Id of the current Order 
     */
    @AuraEnabled
    public static String loadCustomerInformationSection(String orderId) {
        return System.JSON.serialize(EDW_UtilityClass.getUpdatedOrderInformation(orderId));
    }
    
    /**
     * Updates the Order passed in
     *
     * @param orderJson  the current Order stringified 
     */
    @AuraEnabled
    public static String saveOrder(String orderJson) {
        orderJson = orderJson.replace('T00:00:00.000Z', '');        
        Order deserializedOrder = (Order)System.JSON.deserialize(orderJson, Order.class);
        
        update deserializedOrder;
        
        deserializedOrder = EDW_UtilityClass.getUpdatedOrderInformation(deserializedOrder.Id);
        
        return System.JSON.serialize(deserializedOrder);
    }
    
    /**
     * Updates the OrderItem passed in
     *
     * @param oi  The OrderItem to be updated 
     */
    @AuraEnabled
    public static String saveOrderProduct(String jsonOrderProduct) {
        OrderItem oi = (OrderItem)System.JSON.deserialize(jsonOrderProduct, OrderItem.class);
        
        update oi;
        return System.JSON.serialize(oi);
    }
    
    /**
     * Sets the Order's EffectiveDate, and all related OrderItem ServiceDates if applicable
     *
     * @param orderJson  the current Order stringified
     * @param effectiveDate  the date to set the Order's EffectiveDate to
     * @param previousEffectiveDate  the previous date of the Order to compare against
     * @param effectiveTime  The time specified by the user to update to
     * @param previousEffectiveTime  The previous (current) value of the effective time
     * @param isOperatingHoursOverridden  The flag that controls if the Account's Operating Hours is to be respected
     * @param isFromDateField  Controls how validation is to be fired
     */
    @AuraEnabled
    public static String saveOrderEffectiveDate(String orderDateTimeJson, Date effectiveDate, Date previousEffectiveDate, String effectiveTime, String previousEffectiveTime, Boolean isOperatingHoursOverridden, Boolean isFromDateField) {
        //removing timestamp because of a salesforce deserialization bug
        orderDateTimeJson = orderDateTimeJson.replace('T00:00:00.000Z', '');
        
        EDW_ViewModels.OrderDateTimeViewModel dateTimeModel = (EDW_ViewModels.OrderDateTimeViewModel)System.JSON.deserialize(orderDateTimeJson, EDW_ViewModels.OrderDateTimeViewModel.class);
        Order order = dateTimeModel.order;
        
        Date maxDateAllowed = System.today().addDays(Integer.valueOf(edwSettings.Work_Order_Multi_Res_Advance_Days__c));
        
        if (effectiveDate > maxDateAllowed) {
            dateTimeModel.response = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.Date_Invalid_Too_Far_Forward, order);
            
            return System.JSON.serialize(dateTimeModel);
        } else if (effectiveDate < System.today()) {
            dateTimeModel.response = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.Date_Invalid_Cannot_be_in_Past, order);
            
            return System.JSON.serialize(dateTimeModel);
        }
        
        Map<Id, OrderItem> orderItems = new Map<Id, OrderItem>([SELECT Id, ServiceDate FROM OrderItem WHERE OrderId = :order.Id]);
        
        for (OrderItem oi : orderItems.values()) {
            oi.ServiceDate = effectiveDate;
        }
        
        DateTimeRecord dtr = EDW_UtilityClass.getDateTimeRecordFromAccount(new Map<Id, Account> { order.AccountId => order.Account }, order);
        
        if (!isOperatingHoursOverridden) {
            //respect the account's operating hours
        	String[] timeValues = effectiveTime.split('\\:');
            
            DateTime dateTimeToValidate = DateTime.newInstance(order.EffectiveDate.year(), order.EffectiveDate.month(), order.EffectiveDate.day(), Integer.valueOf(timeValues[0]), Integer.valueOf(timeValues[1]), 0);
            
            System.debug(dateTimeToValidate.time());
            System.debug(dtr.startDate.time());
            
            if (dateTimeToValidate.time() < dtr.startDate.time()) {
                order.Service_Appointment_Scheduled_Start_Time__c = String.valueOf(dtr.startDate.time());
                
                if (!isFromDateField) {
                    dateTimeModel.response = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, 'The Account`s Operating Hours starts at ' + String.valueOf(dtr.startDate.time()) + ' for the selected day, and the time cannot be set into the past.', order);
                    
                    return System.JSON.serialize(dateTimeModel);                    
                }
            }
        }
        
        order.Override_Account_Operating_Hours__c = isOperatingHoursOverridden;
        
        System.debug(dtr.startDate.time());
        System.debug(effectiveTime);
        
        //deciding the order of the updates because of built in trigger validations for these scenarios
        if (orderItems.isEmpty()) {
            update order;
        } else if (effectiveDate < previousEffectiveDate) {
            update order;
            update orderItems.values();
        } else {
            update orderItems.values();
            update order;
        }
        
        dateTimeModel.minOperatingHoursTime = String.valueOf(dtr.startDate.time());
        dateTimeModel.maxOperatingHoursTime = String.valueOf(dtr.endDate.time());
        dateTimeModel.order = order;
        dateTimeModel.response = new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, Label.Order_Start_Date_Updated, order);
        
        return System.JSON.serialize(dateTimeModel);
    }
    
    /**
     * Creates OrderItem records as specified by the user, and returns them to the view
     *
     * @param json  the data provided to find the correct Product for the new OrderItems
     * @param initDataJson  all data stringified
     * @param isSurveyLocationRequested  notifies the logic whether to automatically assign Survey_Location__c records to each OrderItem
     */
    @AuraEnabled
    public static String generateOrderProducts(String json, String initDataJson, Boolean isSurveyLocationRequested) {
        //removing timestamp because of a salesforce deserialization bug
        initDataJson = initDataJson.replace('T00:00:00.000Z', '');
        
        EDW_ViewModels.OrderProductRequest request = EDW_ViewModels.parseOrderProductRequest(json);
        EDW_ViewModels.MainViewModel mainData = EDW_ViewModels.parseInitData(initDataJson);
        
        try {
            String numberOfRooms = mainData.account.Is_Multi_Res__c ? request.numberOfRooms : NOT_APPLICABLE;
            String productKey = EDW_UtilityClass.buildProductKey(request.treatmentType, request.infestationLevel, request.numberOfRooms, null);
            EDW_ViewModels.ProductWrapper selectedProduct = EDW_UtilityClass.getAllPestServiceProducts().get(productKey);
            
            if (selectedProduct == null) {
                mainData.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.No_Product_Found, null);
                
                return System.JSON.serialize(mainData);
            }
            
            Integer numOfUnits = Integer.valueOf(request.numberOfUnits);
            List<OrderItem> orderItemsToInsert = new List<OrderItem>();
            Decimal workTypeEstimatedDuration = mainData.workTypeEstimatedDuration;
            List<Survey_Location__c> locations;
            
            if (isSurveyLocationRequested) {
                String locationQuery = 'SELECT Id FROM Survey_Location__c WHERE Site_Survey__c = \'' + mainData.account.Site_Survey__c + '\' ';
                if (!String.isBlank(numberOfRooms)) { locationQuery += 'AND Number_of_Rooms__c = :numberOfRooms '; }
                locationQuery += 'ORDER BY Floor__c ASC LIMIT :numOfUnits';
                
                locations = Database.query(locationQuery);
            }
            
            Map<String, Warranty__c> allWarranties = EDW_UtilityClass.getAllActiveWarrantiesOnAccount(mainData.account.Id, mainData.order.EffectiveDate);
            Warranty__c warranty = allWarranties.get(productKey);
            
            if (String.isBlank(mainData.order.Id)) {
            	mainData.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, 'The Order ID was found to be null. If the Order Product was added to the row, it`s because the logic fired again as a backup and the Order ID was located.', null);
                
        		return System.JSON.serialize(mainData);
                //insert mainData.order;
            }
            
            for (Integer i = 0; i < numOfUnits; i++) {            
                orderItemsToInsert.add(new OrderItem(
                    Active__c = true,
                    OrderId = mainData.order.Id,
                    Frequency__c = dataSets.Non_Recurring_Frequency_Value__c,
                    Product2Id = selectedProduct.productId,
                    PricebookEntryId = selectedProduct.pricebookEntryId,
                    Requested_Price_Approved__c = false,
                    Service_Price_Per_Unit__c = 0,
                    Quantity = 1,
                    Has_Warranty__c = warranty != null,
                    Survey_Location__c = locations == null 
                    ? null 
                    : (locations.size() - 1) >= i 
                    ? locations[i].Id 
                    : null
                ));
            }
            
            if (!orderItemsToInsert.isEmpty()) {
                Double threshold = edwSettings.Order_Item_Batch_Threshold__c == null 
                    ? 0 
                    : edwSettings.Order_Item_Batch_Threshold__c;
                
                if (orderItemsToInsert.size() >= threshold) {
                    mainData.orderItemBatchJobId = Database.executeBatch(new CreateOrderProductsBatch(orderItemsToInsert));
                    mainData.auraResponse = new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, null, null);
                    
                    return System.JSON.serialize(mainData);
                } else {
                    insert orderItemsToInsert;
                }
                
                Map<Id, EDW_ViewModels.TableOrderItem> rows = new Map<Id, EDW_ViewModels.TableOrderItem>();
                Set<Id> oiIds = new Set<Id>();
                
                for (OrderItem oi : orderItemsToInsert) {
                    oiIds.add(oi.Id);
                }
                
                Integer pageLimit = edwSettings.Pagination_Limit__c == null ? 10 : Integer.valueOf(edwSettings.Pagination_Limit__c);
                
                for (OrderItem oi : Database.query(QueryGenerator.queryOrderItems('Id IN :oiIds AND Active__c = TRUE ORDER BY CreatedDate DESC LIMIT :pageLimit'))) {
                    Product2 product = new Product2(Id = oi.Product2Id, Treatment_Type__c = oi.Product2.Treatment_Type__c, Infestation_Level__c = oi.Product2.Infestation_Level__c, Number_of_Rooms__c = oi.Product2.Number_of_Rooms__c);
                    Survey_Location__c location = new Survey_Location__c(Id = oi.Survey_Location__c, Floor__c = oi.Survey_Location__r.Floor__c, Building__c = oi.Survey_Location__r.Building__c, Number_of_Rooms__c = oi.Survey_Location__r.Number_of_Rooms__c, Name = oi.Survey_Location__r.Name);
                   
                    rows.put(oi.Id, new EDW_ViewModels.TableOrderItem(oi.Survey_Location__c == null ? null : location, request.infestationLevel, product, request.numberOfRooms, selectedProduct, warranty, oi.Id, oi.Id, oi, request.treatmentType));
                }
                
                mainData.tableRows.addAll(rows.values());
                mainData = refreshTableData(System.JSON.serialize(mainData));
                
                String response = Label.Order_Product_Insert_Success_Part_One + EDW_UtilityClass.EMPTY_SPACE + orderItemsToInsert.size() + EDW_UtilityClass.EMPTY_SPACE + Label.Order_Product_Insert_Success_Part_Two;
                
                mainData.auraResponse = new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, response, null);
            } else {
                mainData.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, 'No Order Products were processed', null);
            }
            
            return System.JSON.serialize(mainData);
        } catch (Exception e) {
            mainData.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, e.getMessage(), null);
        }
        
        return System.JSON.serialize(mainData);
    }
    
    /**
     * Checks if a batch process is completed
     *
     * @param orderItemBatchJobId  the Id of the batch process to be checked
     */
    @AuraEnabled
    public static Boolean isOrderItemBatchJobCompleted(String orderItemBatchJobId) {
        for (AsyncApexJob a : [SELECT Status FROM AsyncApexJob WHERE Id = :orderItemBatchJobId AND Status = :edwSettings.Apex_Batch_Job_Completed_Status__c]) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Resets the Current Order table to its original state
     *
     * @param json  all data stringified
     */
    @AuraEnabled
    public static EDW_ViewModels.MainViewModel refreshTableData(String json) {
        EDW_ViewModels.MainViewModel mainData = EDW_ViewModels.parseInitData(json);
        
        Order o = EDW_UtilityClass.getUpdatedOrderInformation(mainData.order.Id);
        
        mainData.tableRows.clear();
        mainData.tableRows.addAll(EDW_UtilityClass.buildTableOrderItemMap(mainData).values());
        mainData.isValidToGenerateWorkOrder = isOrderValidForWorkOrderGeneration(mainData.order.Id);
        mainData.pageNumber = 1;
        mainData.totalOrderAmount = o.TotalAmount;
        mainData.orderItemCount = o.OrderItems.size();
        mainData.workTypeEstimatedDuration = EDW_UtilityClass.calculateWorkTypeDuration(o.OrderItems);
        mainData.orderItemBatchJobId = null;
        mainData.orderEffectiveDate = o.EffectiveDate;
        mainData.disableNext = EDW_UtilityClass.isNextDisabled(mainData);
        mainData.totalEstimatedDuration = o.User_Specified_Estimated_Duration__c;
        mainData.numberOfResources = Integer.valueOf(o.Number_of_Resources__c);
        mainData.orderNumber = o.OrderNumber;
        mainData.order = o;
        
        return mainData;
    }
    
    /**
     * Paginates the Current Order table as needed
     *
     * @param json  all data stringified
     */
    @AuraEnabled
    public static String paginateTable(String json) {
        EDW_ViewModels.MainViewModel mainData = EDW_ViewModels.parseInitData(json);
        
        mainData.tableRows.clear();
        mainData.tableRows.addAll(EDW_UtilityClass.buildTableOrderItemMap(mainData).values());
        mainData.orderItemBatchJobId = null;
        mainData.disableNext = EDW_UtilityClass.isNextDisabled(mainData);
        
        return System.JSON.serialize(mainData);
    }
    
    /**
     * Deletes an OrderItem from the Order
     *
     * @param json  all data stringified
     * @param orderItemId  used to delete the OrderItem 
     */
    @AuraEnabled
    public static String removeOrderItem(String json, String orderItemId) {
        EDW_ViewModels.MainViewModel mainData = EDW_ViewModels.parseInitData(json);
                
        Map<Id, EDW_ViewModels.TableOrderItem> tableMap = new Map<Id, EDW_ViewModels.TableOrderItem>();
        
        for (EDW_ViewModels.TableOrderItem item : mainData.tableRows) {
            tableMap.put(item.orderItemId, item);
        }
        
        if (tableMap.containsKey(orderItemId)) {
            tableMap.remove(orderItemId);
        }
        
        List<OrderItem> oiToDelete = [SELECT Id, Product_Name__c FROM OrderItem WHERE Id = :orderItemId];
        
        if (!oiToDelete.isEmpty()) {
            delete oiToDelete[0];
            EDW_UtilityClass.deleteSurveyAssetLocationRecords(new Set<String> { orderItemId });
        }
        
        mainData.tableRows = EDW_UtilityClass.buildTableOrderItemMap(mainData).values();
        
        Order o = EDW_UtilityClass.getUpdatedOrderInformation(mainData.order.Id);

        mainData.isValidToGenerateWorkOrder = isOrderValidForWorkOrderGeneration(mainData.order.Id);
        mainData.totalOrderAmount = o.TotalAmount;
        mainData.orderItemCount = o.OrderItems.size();
        mainData.workTypeEstimatedDuration = EDW_UtilityClass.calculateWorkTypeDuration(o.OrderItems);
        
        String response = Label.Order_Item_Deleted + EDW_UtilityClass.EMPTY_SPACE + oiToDelete[0].Product_Name__c + EDW_UtilityClass.EMPTY_SPACE + Label.Order_Item_Deleted_Part_Two;
        
        mainData.auraResponse = new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, response, null);
        
        return System.JSON.serialize(mainData);
    }
    
    /**
     * Updates the Survey_Location__c on the chosen OrderItem, and the related Survey_Asset_Location__c to keep the Site Survey up to date
     *
     * @param json  the current TableOrderItem stringified
     * @param surveyLocationJson  the selected Survey Location record stringified
     * @param accountId  the ID of the Account on the Order
     */
    @AuraEnabled
    public static String updateOrderItemSurveyLocation(String json, String surveyLocationJson, String accountId) {
        EDW_ViewModels.TableOrderItem row = EDW_ViewModels.parseTableOrderItem(json);
        Survey_Location__c selectedLocation = surveyLocationJson == null ? null : (Survey_Location__c)System.JSON.deserialize(surveyLocationJson, Survey_Location__c.class);

        OrderItem originalOrderProduct = row.orderItem;
        
        SavePoint sp = Database.setSavepoint();
        
        try {            
            if (selectedLocation != null && row.numberOfRooms != selectedLocation.Number_of_Rooms__c) {
                //ROOMS DON'T MATCH
                Boolean isNumberOfRoomsNotApplicable = new String[] { NOT_APPLICABLE, '', null }.contains(row.numberOfRooms);
                String numberOfRooms = isNumberOfRoomsNotApplicable //mainData.account.Is_Multi_Res__c ? request.numberOfRooms : NOT_APPLICABLE;
                						? '' //originalOrderProduct.Product2.Number_of_Rooms__c
                    					: selectedLocation.Number_of_Rooms__c;
                    
                System.debug(numberOfRooms);
                
                String productKey = EDW_UtilityClass.buildProductKey(row.treatmentType, row.infestationLevel, numberOfRooms, null);//selectedLocation.Number_of_Rooms__c
                EDW_ViewModels.ProductWrapper selectedProduct = EDW_UtilityClass.getAllPestServiceProducts().get(productKey);
        
                if (selectedProduct == null) {
                    row.surveyLocation = null;
                    row.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.No_Product_Found_on_Selected_Survey_Location, row.productRecord);
                    return System.JSON.serialize(row);
                }
                
                Map<String, Warranty__c> allWarranties = EDW_UtilityClass.getAllActiveWarrantiesOnAccount(accountId, originalOrderProduct.Order.EffectiveDate);
                Warranty__c warranty = allWarranties.get(productKey);
                
                //if the number of rooms on the product is N/A or is blank, it doesn't need to be respected. simply bind the selected survey location onto the order item and walk away.
                if (isNumberOfRoomsNotApplicable) {
                    originalOrderProduct.Survey_Location__c = selectedLocation.Id;
                    row.surveyLocation = selectedLocation;
                    
            		row.auraResponse = new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, Label.Request_Successfully_Received, null);
                    
                    update originalOrderProduct;
                    
                    EDW_UtilityClass.updateSurveyAssetLocationRecords(originalOrderProduct);
                    
        			return System.JSON.serialize(row);
                }
                
                OrderItem replacementOrderProduct = EDW_UtilityClass.cloneOrderItemRecord(false, false, false, false, originalOrderProduct, selectedProduct, warranty);//originalOrderProduct.clone(false, true, false, false);
                replacementOrderProduct.Survey_Location__c = selectedLocation.Id;
                
                EDW_UtilityClass.deleteSurveyAssetLocationRecords(new Set<String> { row.orderItemId });
                
                delete originalOrderProduct;
                
                insert replacementOrderProduct;
            
                for (OrderItem oi : [SELECT Service_Price_Per_Unit__c, Survey_Location__c FROM OrderItem WHERE Id = :replacementOrderProduct.Id]) {
                    replacementOrderProduct.Survey_Location__c = oi.Survey_Location__c;
                    replacementOrderProduct.Service_Price_Per_Unit__c = oi.Service_Price_Per_Unit__c;
                }
                
        		row.previousOrderItemId = originalOrderProduct.Id;
            	row.numberOfRooms = selectedLocation.Number_of_Rooms__c;
                row.selectedProduct = selectedProduct;
            	row.warranty = warranty;
            	row.orderItemId = replacementOrderProduct.Id;
                row.orderItem = replacementOrderProduct;
                row.surveyLocation = replacementOrderProduct.Survey_Location__c == null 
                                        ? null 
                                        : row.surveyLocation;
            } else {
                //ROOMS MATCH OR SURVEY LOCATION IS NULL
                originalOrderProduct.Survey_Location__c = selectedLocation == null 
                    ? null 
                    : selectedLocation.Id;
                
                update originalOrderProduct;
                
                row.orderItem = originalOrderProduct;

                EDW_UtilityClass.updateSurveyAssetLocationRecords(originalOrderProduct);
            }
            
            row.auraResponse = new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, Label.Request_Successfully_Received, null);
        } catch (Exception e) {
            System.debug(e);
            Database.rollback(sp);
            
            row.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, e.getMessage(), null);            
        }
        
        return System.JSON.serialize(row);
    }
    
    /**
     * Updates the Product on the requested OrderItem. Also resets the Survey_Location__c if the Number of Rooms is no longer in sync between the Product and chosen Survey Location
     *
     * @param json  the current TableOrderItem stringified
     * @param accountId  the Account Id related to the Order
     */
    @AuraEnabled
    public static String updateOrderItemProduct(String json, String accountId) {
        EDW_ViewModels.TableOrderItem row = EDW_ViewModels.parseTableOrderItem(json);
        
        OrderItem originalOrderProduct = row.orderItem;
        String productKey = EDW_UtilityClass.buildProductKey(row.treatmentType, row.infestationLevel, row.numberOfRooms, null);
        EDW_ViewModels.ProductWrapper selectedProduct = EDW_UtilityClass.getAllPestServiceProducts().get(productKey);
        
        row.previousOrderItemId = originalOrderProduct.Id;
        
        if (selectedProduct == null) {
            row.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.No_Product_Found, row.productRecord);
            return System.JSON.serialize(row);
        }
        
        Map<String, Warranty__c> allWarranties = EDW_UtilityClass.getAllActiveWarrantiesOnAccount(accountId, originalOrderProduct.Order.EffectiveDate);
        Warranty__c warranty = allWarranties.get(productKey);
        
        OrderItem replacementOrderProduct = EDW_UtilityClass.cloneOrderItemRecord(false, false, false, false, originalOrderProduct, selectedProduct, warranty);
        
        replacementOrderProduct.Survey_Location__c = selectedProduct.numberOfRooms == row.surveyLocation.Number_of_Rooms__c
            														? replacementOrderProduct.Survey_Location__c//leave alone as it's still valid
            														: null;//reset because the product number of rooms and survey location number of rooms no longer match, introducing bad data
        
        SavePoint sp = Database.setSavepoint();
        
        try {
            EDW_UtilityClass.deleteSurveyAssetLocationRecords(new Set<String> { row.orderItemId });
            
            delete originalOrderProduct;
            insert replacementOrderProduct;
            
            for (OrderItem oi : [SELECT Service_Price_Per_Unit__c, Survey_Location__c FROM OrderItem WHERE Id = :replacementOrderProduct.Id]) {
                //replacementOrderProduct.Survey_Location__c = oi.Survey_Location__c;
                replacementOrderProduct.Service_Price_Per_Unit__c = oi.Service_Price_Per_Unit__c;
            }
            
            row.numberOfRooms = selectedProduct.numberOfRooms;
            row.infestationLevel = selectedProduct.infestationLevel;
            row.warranty = warranty;
            row.orderItem = replacementOrderProduct;
            row.selectedProduct = selectedProduct;
            row.orderItemId = replacementOrderProduct.Id;
            row.surveyLocation = replacementOrderProduct.Survey_Location__c == null 
                                        ? null 
                                        : row.surveyLocation;
            
            row.auraResponse = new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, Label.Successfully_Replaced_Product, null);
        } catch (Exception e) {
            System.debug('Exception: ' + e);
            Database.rollback(sp);
            
            row.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, e.getMessage(), null);
        }
        
        return System.JSON.serialize(row);
    }
    
    /**
     * Updates the Product on all requested OrderItems. Also resets the Survey_Location__c if the Number of Rooms is no longer in sync between the Product and chosen Survey Location
     *
     * @param productRequestJson  the data provided to find the correct Product for the updated OrderItems
     * @param selectedOrderItemIds  the Ids of all OrderItems selected for update
     * @param initDataJson  all data stringified
     */
    @AuraEnabled
    public static String updateAllSelectedOrderItems(String productRequestJson, List<String> selectedOrderItemIds, String initDataJson) {
        //removing timestamp because of a salesforce deserialization bug
        initDataJson = initDataJson.replace('T00:00:00.000Z', '');
        
        EDW_ViewModels.OrderProductRequest request = EDW_ViewModels.parseOrderProductRequest(productRequestJson);
        EDW_ViewModels.MainViewModel mainData = EDW_ViewModels.parseInitData(initDataJson);
        
        Map<String, EDW_ViewModels.TableOrderItem> tableRowMap = new Map<String, EDW_ViewModels.TableOrderItem>();
        
        for (EDW_ViewModels.TableOrderItem toi : mainData.tableRows) {
            if (selectedOrderItemIds.contains(toi.orderItemId)) {
            	tableRowMap.put(toi.orderItemId, toi);
            }
        }
        
        tableRowMap.remove(null);
        
        Map<String, EDW_ViewModels.ProductWrapper> allProducts = EDW_UtilityClass.getAllPestServiceProducts();
        Map<String, Warranty__c> allWarranties = EDW_UtilityClass.getAllActiveWarrantiesOnAccount(mainData.account.Id, mainData.order.EffectiveDate);
        Map<String, OrderItem> orderItemsToInsert = new Map<String, OrderItem>();
        Map<String, OrderItem> orderItemsToDelete = new Map<String, OrderItem>();
        
        Integer numberOfProductsUnchanged = 0, numberOfProductsUpdated = 0;
        
        for (EDW_ViewModels.TableOrderItem toi : tableRowMap.values()) {
            String productKey = (String.isBlank(request.treatmentType) ? toi.orderItem.Product2.Treatment_Type__c : request.treatmentType) + EDW_UtilityClass.DELIMITER + 
                (String.isBlank(request.numberOfRooms) ? '' : request.numberOfRooms + EDW_UtilityClass.DELIMITER) + 
                //(String.isBlank(request.numberOfRooms) ? toi.orderItem.Product2.Number_of_Rooms__c : request.numberOfRooms) + EDW_UtilityClass.DELIMITER + 
                (String.isBlank(request.infestationLevel) ? toi.orderItem.Product2.Infestation_Level__c : request.infestationLevel);
            
            Warranty__c warranty = allWarranties.get(productKey);
            EDW_ViewModels.ProductWrapper selectedProduct = allProducts.get(productKey);
            
            if (selectedProduct == null || productKey == toi.orderItem.Product2.Product_Unique_Key__c) {
                numberOfProductsUnchanged++;
                continue;
            }
            
            OrderItem replacementOrderProduct = EDW_UtilityClass.cloneOrderItemRecord(false, true, false, false, toi.orderItem, selectedProduct, warranty);//toi.orderItem.clone(false, true, false, false);
        	replacementOrderProduct.Survey_Location__c = toi.numberOfRooms == selectedProduct.numberOfRooms//replacementOrderProduct.Survey_Location__r.Number_of_Rooms__c == selectedProduct.numberOfRooms
            														? replacementOrderProduct.Survey_Location__c//leave alone as it's still valid
            														: null;//reset because the product number of rooms and survey location number of rooms no longer match, introducing bad data
            
            orderItemsToInsert.put(toi.orderItemId, replacementOrderProduct);
            orderItemsToDelete.put(toi.orderItemId, toi.orderItem);
        }
        
        orderItemsToInsert.remove(null);
        orderItemsToDelete.remove(null);
        
        SavePoint sp = Database.setSavepoint();
        
        try {
            EDW_UtilityClass.deleteSurveyAssetLocationRecords(orderItemsToDelete.keySet());
            delete orderItemsToDelete.values();
            
            if (orderItemsToInsert.size() > edwSettings.Order_Item_Batch_Threshold__c) {
                //send response that records are being created by a batch and will appear when completed
                mainData.orderItemBatchJobId = Database.executeBatch(new CreateOrderProductsBatch(orderItemsToInsert.values()));
            } else {
            	insert orderItemsToInsert.values();
        		mainData = refreshTableData(System.JSON.serialize(mainData));
            }
            
            numberOfProductsUpdated = orderItemsToInsert.size();
            
            String response = Label.Mass_Update_Success_Part_One + EDW_UtilityClass.EMPTY_SPACE + numberOfProductsUpdated + EDW_UtilityClass.EMPTY_SPACE + Label.Mass_Update_Success_Part_Two + EDW_UtilityClass.EMPTY_SPACE + numberOfProductsUnchanged + EDW_UtilityClass.EMPTY_SPACE + Label.Mass_Update_Success_Part_Three;
            
            mainData.auraResponse = new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, response, null);
        } catch (Exception e) {
            System.debug(e);
            Database.rollback(sp);
            mainData.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, e.getMessage(), null);
        }
        
        return System.JSON.serialize(mainData);
    }
    
    /**
     * Keeps the MainViewModel up to date with all TableOrderItem records
     *
     * @param newTableRow  the new TableOrderItem record to be added to the list of rows
     * @param deleteOrderItemId  the Id of the OrderItem deleted
     * @param mainModel  all data stringified
     */
    @AuraEnabled
    public static String updateTableRowList(String newTableRow, String deleteOrderItemId, String mainModel) {
        //removing timestamp because of a salesforce deserialization bug
        mainModel = mainModel.replace('T00:00:00.000Z', '');
        
        EDW_ViewModels.MainViewModel mainData = EDW_ViewModels.parseInitData(mainModel);
        
        EDW_ViewModels.TableOrderItem newTableRowParsed = EDW_ViewModels.parseTableOrderItem(newTableRow);
        
        Map<Id, EDW_ViewModels.TableOrderItem> tableMap = new Map<Id, EDW_ViewModels.TableOrderItem>();
        
        for (EDW_ViewModels.TableOrderItem item : mainData.tableRows) {
            tableMap.put(item.orderItemId, item);
        }
        
        if (tableMap.containsKey(deleteOrderItemId)) {
            tableMap.remove(deleteOrderItemId);
        }
        
        tableMap.put(newTableRowParsed.orderItem.Id, newTableRowParsed);
        
        Order o = EDW_UtilityClass.getUpdatedOrderInformation(mainData.order.Id);
        
        mainData.tableRows = tableMap.values();
        mainData.totalOrderAmount = o.TotalAmount;
        mainData.workTypeEstimatedDuration = EDW_UtilityClass.calculateWorkTypeDuration(o.OrderItems);
        mainData.isValidToGenerateWorkOrder = isOrderValidForWorkOrderGeneration(o.Id);
        
        return System.JSON.serialize(mainData);
    }
    
    /**
     * Updates table rows to have the updated Survey Location data when a Survey Location is updated in the edit modal
     *
     * @param json  all data stringified
     * @param locationId  the Id of the Survey Location that was updated
     */
    @AuraEnabled
    public static String updateSurveyLocations(String json, String locationId) {
        EDW_ViewModels.MainViewModel mainData = EDW_ViewModels.parseInitData(json);
        
        Survey_Location__c locationToLeverage;
        
        List<Survey_Location__c> location = Database.query(QueryGenerator.querySurveyLocations('Id = :locationId'));
        
        if (location.isEmpty()) {
            mainData.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.Survey_Location_Not_Found, null);
            return System.JSON.serialize(mainData);
        }
        
        locationToLeverage = location[0];
        
        List<EDW_ViewModels.TableOrderItem> newList = new List<EDW_ViewModels.TableOrderItem>();
        
        for (EDW_ViewModels.TableOrderItem item : mainData.tableRows) {            
            if (item.surveyLocation == null) {
                continue;//is this needed? maybe.
            }
            
            if (item.surveyLocation.Id == locationToLeverage.Id) {
                item.surveyLocation = locationToLeverage;
            }
            
            newList.add(item);
        }
        
        String numberOfRoomsOnSurveyLocation = locationToLeverage.Number_of_Rooms__c, orderId = mainData.order.Id;
        Map<String, EDW_ViewModels.ProductWrapper> allPestSpecialProducts = EDW_UtilityClass.getAllPestServiceProducts();
        Map<String, Warranty__c> allWarranties = EDW_UtilityClass.getAllActiveWarrantiesOnAccount(mainData.account.Id, mainData.order.EffectiveDate);
        
        Map<String, OrderItem> orderItemsToInsert = new Map<String, OrderItem>();
        Map<String, OrderItem> orderItemsToDelete = new Map<String, OrderItem>();
        
        for (OrderItem oi : Database.query(QueryGenerator.queryOrderItems('OrderId = :orderId AND Active__c = TRUE AND Survey_Location__c = :locationId'))) {
            String productKey = EDW_UtilityClass.buildProductKey(oi.Product2.Treatment_Type__c, oi.Product2.Infestation_Level__c, numberOfRoomsOnSurveyLocation, oi.Product2.Number_of_Rooms_NA__c);
            
            EDW_ViewModels.ProductWrapper selectedProduct = allPestSpecialProducts.get(productKey);
            
            if (selectedProduct == null || selectedProduct.numberOfRooms == oi.Product2.Number_of_Rooms__c) {
                continue;
            }
            
        	Warranty__c warranty = allWarranties.get(productKey);
            
            OrderItem replacementOrderProduct = EDW_UtilityClass.cloneOrderItemRecord(false, true, false, false, oi, selectedProduct, warranty);// oi.clone(false, true, false, false);
            replacementOrderProduct.Survey_Location__c = locationToLeverage.Id;
            
            orderItemsToInsert.put(oi.Id, replacementOrderProduct);
            orderItemsToDelete.put(oi.Id, oi);
        }
        
        orderItemsToInsert.remove(null);
        orderItemsToDelete.remove(null);
        
        SavePoint sp = Database.setSavepoint();
        
        try {
            EDW_UtilityClass.deleteSurveyAssetLocationRecords(orderItemsToDelete.keySet());
            
            delete orderItemsToDelete.values();
                        
            Integer numberOfProductsUpdated = orderItemsToInsert.size();
            
            insert orderItemsToInsert.values();
            
            mainData = refreshTableData(System.JSON.serialize(mainData));
            mainData.auraResponse = new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, Label.Survey_Locations_Updated, null);
        } catch (Exception e) {
            System.debug('Error: ' + e.getMessage());
            Database.rollback(sp);
        	mainData.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, e.getMessage(), null);
        }
        
        return System.JSON.serialize(mainData);
    }
    
    /**
     * Checks if all OrderItem records have a Survey_Location__c record
     *
     * @param orderId  the Id of the current Order
     */
    @AuraEnabled
    public static Boolean isOrderValidForWorkOrderGeneration(String orderId) {
        return [SELECT COUNT() FROM OrderItem WHERE OrderId = :orderId AND Survey_Location__c = NULL] == 0;
    }
    
    /**
     * Starts the process of generating or updating the Pest Emergency Work Order and all related records
     *
     * @param orderJson  the current Order
     * @param totalDuration  the total duration of the Order in hours
     * @param totalNumberOfOrderItems  the total number of OrderItem records related to the Order
     * @param emergencyTicket  the related Emergency Ticket to be closed, if applicable
     */
    @AuraEnabled
    public static String generateWorkOrder(String orderJson, Decimal totalDuration, Integer totalNumberOfOrderItems, String caseJson) {
        orderJson = orderJson.replace('T00:00:00.000Z', '');
        Order order = (Order)System.JSON.deserialize(orderJson, Order.class);
        Case emergencyTicket = (Case)System.JSON.deserialize(caseJson, Case.class);
        Decimal adjustmentAmount, numOfLines, durationInflation = 0;
        
        order = EDW_UtilityClass.getUpdatedOrderInformation(order.Id);
        
        Boolean isValid = EDW_UtilityClass.isPORequiredBeforeInTimeWindowSatisfied(order) || order.Account.PO_Required_for_Orders__c == dataSets.PO_Required_After_Label__c || String.isBlank(order.Account.PO_Required_for_Orders__c);
        
        if (!isValid) {
            return '{"errorMessage":"' + Label.Work_Order_Requires_PO_Numbers_Error_Message + '"}';
        }
        
        for (Order o : [SELECT Id, Site_Survey__r.Min_Pest_Work_Order_Lines__c, Site_Survey__r.Pest_WorkOrder_Calculation_Adjustment__c FROM Order WHERE Id = :order.Id]) {
            adjustmentAmount = o.Site_Survey__r.Pest_WorkOrder_Calculation_Adjustment__c;
            numOfLines = o.Site_Survey__r.Min_Pest_Work_Order_Lines__c;
        }
        
        durationInflation += numOfLines != null && adjustmentAmount != null && totalNumberOfOrderItems >= numOfLines ? adjustmentAmount : 0;
        durationInflation = durationInflation / EDW_UtilityClass.MINUTES_IN_HOUR;
        totalDuration = totalDuration + durationInflation;
        //JIRA MULTIRES-63 - if the order on the ticket is null, set it to the order that is closing the ticket
        if (emergencyTicket != null) {
        	emergencyTicket.Order__c = emergencyTicket.Order__c == null ? order.Id : emergencyTicket.Order__c;
        }
        
        Set<Id> workOrderIds = SpawnPestEmergencyWorkOrders.generatePestEmergencyWorkOrders(new Set<String> { order.Id }, new List<Case> { emergencyTicket }, totalDuration);
        Set<Id> serviceAppointmentIds = SpawnPestEmergencyServiceAppointments.generatePestEmergencyServiceAppointments(workOrderIds, totalDuration);
        
        Database.executeBatch(new SpawnPestEmergencyWorkOrderLineItems(workOrderIds));
        
        String returnedString = '{"workOrderId":"' + new List<Id>(workOrderIds)[0] + '","orderId":"' + order.Id + '"}';
        
        return returnedString;
    }
    
    /**
     * Cancels the current Order, cancels the related Work Order, Service Appointments and deactivates all related Order Product records
     * 
     * @param orderJson  the current Order to be cancelled
     */
    @AuraEnabled
    public static void cancelOrder(String orderJson) {
        Order order = (Order)System.JSON.deserialize(orderJson, Order.class);
        SavePoint sp = Database.setSavepoint();
        
        try {
            order.Cancelled_By__c = UserInfo.getUserId();
            order.Order_Cancelled__c = true;
            
            update order;
            
            Map<Id, WorkOrder> workOrdersToCancel = new Map<Id, WorkOrder>([SELECT Id FROM WorkOrder WHERE Order__c = :order.Id]);
            
            WorkOrderUtil.cancelWorkOrderAndServiceAppointments(workOrdersToCancel.keySet());
            
            Map<Id, OrderItem> orderItemsToCancel = new Map<Id, OrderItem>([SELECT Id, Active__c, Service_Price_Per_Unit__c FROM OrderItem WHERE OrderId = :order.Id AND Active__c = TRUE]);
            
            for (OrderItem oi : orderItemsToCancel.values()) {
                oi.Service_Price_Per_Unit__c = 0;
                oi.Active__c = false;
                oi.Bypass_Standing_Order_Price_Engine__c = true;
            }
            
            update orderItemsToCancel.values();
        } catch (Exception e) {
            System.debug(e);
            Database.rollback(sp);
        }
    }
    
    //Begin:Shashi:10-4-2019:Populate related infestation and rooms
    /**
     * Get relatated Infestation Level and Rooms for a given Treatment type
     **/
    @AuraEnabled
    public static List<String> getLocationRooms(String TreatmentType,String InfestationLevel,String strField){
        return EDW_UtilityClass.getInfestationAndRooms(TreatmentType,InfestationLevel,strField);
    }
    //End
}