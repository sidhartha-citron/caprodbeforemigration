/**
 * Class was introduced to aid in completing case 21618
 * Authored by PwC
 * Test class -> WorkOrderUtilTest
 */
public abstract class WorkOrderUtil {
    static Set<String> cannotCompleteLinesOfBusiness = activeLinesOfBusinessForCannotComplete();

    /**
     * Sets the Work Order Line Items to Cannot Complete, and updates the related OrderItem records to 
     * become Inactive and set their price to $0
     * @param lineItemIds  the ids of the WorkOrderLineItems to be set to Cannot Complete
     */
    public static void updateWorkOrderLineItemsCannotComplete(Set<Id> lineItemIds) {
        Map<Id, OrderItem> cannotCompleteOrderItemsDeactivated = new Map<Id, OrderItem>();
        Map<Id, Order> ordersToShiftStatus = new Map<Id, Order>();

        //Begin:Shashi:10-4-2019:Follow-up Work Orders:Query WorkOrder Type
        String query = 'SELECT Id, OrderId, Order_Product__c, Order.Status, ' +
                'Order.Pest_Emergency_Not_Invoicing__c, WorkOrder.Type__c ' +
                'FROM WorkOrderLineItem ' +
                'WHERE Id IN :lineItemIds AND ';
        //End

        if (QueryUtils.emergencyDispatchSettings.Activate_Emergency_Only_Cannot_Complete__c) {
            query += 'WorkOrder.Emergency__c = TRUE AND ';
        }

        query += 'WorkOrder.Line_of_Business__c IN :cannotCompleteLinesOfBusiness';

        if (lineItemIds != null && !lineItemIds.isEmpty()) {
            for (WorkOrderLineItem woli : (List<WorkOrderLineItem>) Database.query(query)) {
                //Begin:Shashi:10-4-2019:Follow-up Work Orders:De-activate Order Product if not Follow-up
                if (woli.WorkOrder.Type__c != QueryUtils.fieldServiceSettings.Type_Value_for_FollowUp_WorkOrder__c) {
                    cannotCompleteOrderItemsDeactivated.put(
                            woli.Order_Product__c, 
                            new OrderItem(
                                    Id = woli.Order_Product__c, 
                                    Active__c = false,
                                    Service_Price_Per_Unit__c = 0, 
                                    Bypass_Standing_Order_Price_Engine__c = QueryUtils.fieldServiceSettings.Activate_Override_SO_Price_Engine__c
                            )
                    );
                }
                //End

                //don't shift status for Orders that are Pest Emergency Not Invoicing so they remain in Draft as intended
                if (!woli.Order.Pest_Emergency_Not_Invoicing__c) {
                    ordersToShiftStatus.put(
                            woli.OrderId,
                            new Order(
                                    Id = woli.OrderId,
                                    Status = woli.Order.Status
                            )
                    );
                }
            }
        }

        cannotCompleteOrderItemsDeactivated.remove(null);
        ordersToShiftStatus.remove(null);

        if (!cannotCompleteOrderItemsDeactivated.isEmpty()) {
            shiftOrderStatus(
                    ordersToShiftStatus,
                    QueryUtils.fieldServiceSettings.Order_Active_Stage__c,
                    QueryUtils.fieldServiceSettings.Regular_Order_Draft_Stage__c
            );

            update cannotCompleteOrderItemsDeactivated.values();

            shiftOrderStatus(
                    ordersToShiftStatus,
                    QueryUtils.fieldServiceSettings.Regular_Order_Draft_Stage__c,
                    QueryUtils.fieldServiceSettings.Order_Active_Stage__c
            );
        }
    }

    /**
     * Sets the Work Order Locations to Cannot Complete
     *
     * @param roomIds  the ids of the Work_Order_Room__c records to be set to Cannot Complete
     */
    public static void updateWorkOrderRoomsCannotComplete(Set<Id> roomIds) {
        Map<Id, WorkOrderLineItem> cannotCompleteWorkOrderLineItems = new Map<Id, WorkOrderLineItem>();

        String query = 'SELECT Id, Status FROM WorkOrderLineItem WHERE Work_Order_Location__c IN :roomIds AND ';

        if (QueryUtils.emergencyDispatchSettings.Activate_Emergency_Only_Cannot_Complete__c) {
            query += 'WorkOrder.Emergency__c = TRUE AND ';
        }

        query += 'WorkOrder.Line_of_Business__c IN :cannotCompleteLinesOfBusiness';

        if (roomIds != null && !roomIds.isEmpty()) {
            for (WorkOrderLineItem woli : (List<WorkOrderLineItem>) Database.query(query)) {
                cannotCompleteWorkOrderLineItems.put(
                        woli.Id,
                        new WorkOrderLineItem(
                                Id = woli.Id,
                                Status = QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c
                        )
                );
            }
        }

        cannotCompleteWorkOrderLineItems.remove(null);

        if (!cannotCompleteWorkOrderLineItems.isEmpty()) {
            update cannotCompleteWorkOrderLineItems.values();
        }
    }

    /**
     * Sets the Work Orders to Cannot Complete
     *
     * @param workOrderIds  the ids of the WorkOrder records to be set to Cannot Complete
     */
    public static void updateWorkOrderCannotComplete(Set<Id> workOrderIds) {
        Map<Id, Work_Order_Room__c> cannotCompleteWorkOrderRooms = new Map<Id, Work_Order_Room__c>();
		
        //CR21-40 2021-04-07 Darcy: also updating the cannot complete reason on work order location to match work order  
        String query = 'SELECT Id, Status__c, Cannot_Complete_Reason__c, Work_Order__r.Cannot_Complete_Reason__c FROM Work_Order_Room__c WHERE Work_Order__c IN :workOrderIds AND ';

        if (QueryUtils.emergencyDispatchSettings.Activate_Emergency_Only_Cannot_Complete__c) {
            query += 'Work_Order__r.Emergency__c = TRUE AND ';
        }

        query += 'Work_Order__r.Line_of_Business__c IN :cannotCompleteLinesOfBusiness';

        if (workOrderIds != null && !workOrderIds.isEmpty()) {
            for (Work_Order_Room__c wor : (List<Work_Order_Room__c>) Database.query(query)) {
                cannotCompleteWorkOrderRooms.put(
                        wor.Id,
                        new Work_Order_Room__c(
                                Id = wor.Id,
                                Status__c = QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c,
                            	Cannot_Complete_Reason__c = wor.Work_Order__r.Cannot_Complete_Reason__c
                        )
                );
            }
        }

        cannotCompleteWorkOrderRooms.remove(null);

        if (!cannotCompleteWorkOrderRooms.isEmpty()) {
            update cannotCompleteWorkOrderRooms.values();
        }
    }

    /**
     * Sets the Work Orders' related Order records to Activated. **Only for Pest Special Emergency Orders and Work Orders**.
     *
     * @param workOrderIds  the ids of the WorkOrder records to have their related Orders become Activated
     */
    public static Map<Id, WorkOrder> updateOrderStatusToActiveFromNotInvoicing(Set<Id> workOrderIds) {
        final String completedStatus = QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c,
                     pestControl = QueryUtils.fieldServiceSettings.Pest_LOB__c;
        Map<Id, Order> ordersToUpdate = new Map<Id, Order>();
        Map<Id, WorkOrder> workOrdersWithError = new Map<Id, WorkOrder>();

        String query = 'SELECT Id, Order__c, Order__r.Status, Order__r.PoNumber, Order__r.Number_of_Order_Products_without_PO__c, Order__r.Pest_Emergency_Not_Invoicing__c, Account.PO_Required_for_Orders__c, Account.PO_Required_on_Line_Item__c FROM WorkOrder WHERE Id IN :workOrderIds AND Emergency__c = TRUE AND ' + 
            'Status = :completedStatus AND Order__r.Pest_Emergency_Not_Invoicing__c = TRUE AND Line_of_Business__c = :pestControl';
        
        for (WorkOrder wo : (List<WorkOrder>)Database.query(query)) {
            /**
            * Logic split up into multiple if statements to prevent unintended results
            */
            
            if (String.isBlank(wo.Account.PO_Required_for_Orders__c)) {
                ordersToUpdate.put(wo.Order__c, 
                                   new Order(Id = wo.Order__c, 
                                             Status = QueryUtils.fieldServiceSettings.Order_Active_Stage__c, 
                                             Pest_Emergency_Not_Invoicing__c = false)
                                  );
                continue;
            }
            
            if (wo.Account.PO_Required_for_Orders__c == QueryUtils.fieldServiceSettings.PO_Required_Before_Label__c && 
                wo.Account.PO_Required_on_Line_Item__c) {
                if (wo.Order__r.Number_of_Order_Products_without_PO__c > 0) {
                    workOrdersWithError.put(wo.Id, wo);
                    continue;
                }
                
                ordersToUpdate.put(wo.Order__c, 
                                   new Order(Id = wo.Order__c, 
                                             Status = QueryUtils.fieldServiceSettings.Order_Active_Stage__c, 
                                             Pest_Emergency_Not_Invoicing__c = false)
                                  );
                continue;
            }
            
            if (wo.Account.PO_Required_for_Orders__c == QueryUtils.fieldServiceSettings.PO_Required_Before_Label__c && 
                !String.isEmpty(wo.Order__r.PoNumber)) {
                ordersToUpdate.put(wo.Order__c, 
                                   new Order(Id = wo.Order__c, 
                                             Status = QueryUtils.fieldServiceSettings.Order_Active_Stage__c, 
                                             Pest_Emergency_Not_Invoicing__c = false)
                                  );
                continue;
            }
        }
        
        ordersToUpdate.remove(null);
        
        if (!ordersToUpdate.isEmpty()) {
            update ordersToUpdate.values();
        }
        
        workOrdersWithError.remove(null);
        
        return workOrdersWithError;
    }

    /**
     * Cancels the Work Orders and related Service Appointments.
     *
     * @param workOrderIds  the ids of the WorkOrder records to become Cancelled
     */
    public static void cancelWorkOrderAndServiceAppointments(Set<Id> workOrderIds) {
        Map<Id, ServiceAppointment> serviceAppointments = new Map<Id, ServiceAppointment>();

        Map<Id, WorkOrder> workOrdersToCancel = new Map<Id, WorkOrder>([
                SELECT Id, Status,
                        (SELECT Id, Status
                        FROM ServiceAppointments
                        WHERE Status != :QueryUtils.fieldServiceSettings.Work_Order_Cancelled_Status__c)
                FROM WorkOrder
                WHERE Id IN :workOrderIds
                AND Status != :QueryUtils.fieldServiceSettings.Work_Order_Cancelled_Status__c
        ]);

        for (WorkOrder wo : workOrdersToCancel.values()) {
            wo.Status = QueryUtils.fieldServiceSettings.Work_Order_Cancelled_Status__c;

            serviceAppointments.putAll(wo.ServiceAppointments);
        }

        serviceAppointments.remove(null);

        for (ServiceAppointment sa : serviceAppointments.values()) {
            sa.Status = QueryUtils.fieldServiceSettings.Work_Order_Cancelled_Status__c;
        }

        if (!serviceAppointments.isEmpty()) {
            update serviceAppointments.values();
        }

        if (!workOrdersToCancel.isEmpty()) {
            update workOrdersToCancel.values();
        }
    }

    /**
     * Cancels the Work Orders and related Service Appointments.
     *
     * @param workOrderIds  the ids of the WorkOrder records to become Cancelled
     */
    public static void createOrderProductsOnCompletedWorkOrders(Set<Id> workOrderIds) {
        //TODO check if multi res or commercial. if multi res, use price engine. if commercial, use woli product SPPU field unless not populated

        Map<Id, WorkOrderLineItem> workOrderLineItems = new Map<Id, WorkOrderLineItem>([
                SELECT Id, WorkOrder.Account.Is_Multi_Res__c, Product_Service_Price_Per_Unit__c,
                        PO_Number_for_Order_Product__c, Service_Notes__c, Product2Id, PricebookEntryId, OrderId,
                        WorkOrder.Account.PO_Required_for_Orders__c, Work_Order_Location__r.Survey_Location__c
                FROM WorkOrderLineItem
                WHERE Requires_Order_Product_to_be_Created__c = TRUE
                AND WorkOrderId IN :workOrderIds
                AND WorkOrder.Line_of_Business__c = :QueryUtils.fieldServiceSettings.Pest_LOB__c
                AND WorkOrder.Emergency__c = TRUE
                AND Order_Product__c = NULL
        ]);

        Map<Id, OrderItem> orderItemsToInsert = new Map<Id, OrderItem>();

        for (WorkOrderLineItem woli : workOrderLineItems.values()) {
            OrderItem oi = new OrderItem(
                    OrderId = woli.OrderId,
                    Product2Id = woli.Product2Id,
                    PricebookEntryId = woli.PricebookEntryId,
                    Frequency__c = QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c,
                    Active__c = true,
                    Product_Type__c = QueryUtils.fieldServiceSettings.Label_for_Service_Work_Order_Type__c,
                    PO_Number__c = woli.PO_Number_for_Order_Product__c,
                    Survey_Location__c = woli.Work_Order_Location__r.Survey_Location__c,
                    Quantity = 1,
                    Service_Notes__c = woli.Service_Notes__c
            );

            if (woli.WorkOrder.Account.Is_Multi_Res__c) {
                oi.Service_Price_Per_Unit__c = 0;
            } else {
                //specified price needs to stick
                oi.Service_Price_Per_Unit__c = woli.Product_Service_Price_Per_Unit__c;
                oi.Bypass_Standing_Order_Price_Engine__c = oi.Service_Price_Per_Unit__c != null && oi.Service_Price_Per_Unit__c > -1;
            }

            orderItemsToInsert.put(woli.Id, oi);
        }

        if (!orderItemsToInsert.isEmpty()) {
            insert orderItemsToInsert.values();

            for (Id woliId : orderItemsToInsert.keySet()) {
                WorkOrderLineItem woli = workOrderLineItems.get(woliId);

                woli.Order_Product__c = orderItemsToInsert.get(woliId).Id;
            }

            update workOrderLineItems.values();
        }
    }

    /**
     * Validates the PO Numbers on the WorkOrder's Order being returned if required when the Service Appointment is being dispatched.
     *
     * @param workOrderIds  the ids of the WorkOrder records to have their Service Appointments be validated
     * @param pestEmergencyServiceAppointmentsValidated  the ServiceAppointment records that are being checked against
     */
    public static Map<Id, ServiceAppointment> validateServiceAppointmentPOReturnedStatus(
            Set<Id> workOrderIds,
            Map<Id, ServiceAppointment> pestEmergencyServiceAppointmentsValidated
    ) {
        Map<Id, ServiceAppointment> allServiceAppointments = new Map<Id, ServiceAppointment>(),
            appointmentsToBeReturned = new Map<Id, ServiceAppointment>(); 
        
        if (!workOrderIds.isEmpty()) {
            for (WorkOrder wo : [SELECT Id, (SELECT Id FROM ServiceAppointments) 
                                 FROM WorkOrder 
                                 WHERE Id IN :workOrderIds AND Order__r.Is_PO_Provided_by_Customer__c = FALSE AND 
                                 Account.PO_Required_for_Orders__c = :QueryUtils.fieldServiceSettings.PO_Required_Before_Label__c]) {
                allServiceAppointments.putAll(wo.ServiceAppointments);
            }
        }
        
        for (Id saId : allServiceAppointments.keySet()) {
            ServiceAppointment appointment = pestEmergencyServiceAppointmentsValidated.get(saId);
            
            if (appointment != null) {
                appointmentsToBeReturned.put(appointment.Id, appointment);
            }
        }
        
        appointmentsToBeReturned.remove(null);
        
        return appointmentsToBeReturned;
    }

    /**
     * Sends DocuSign envelopes to customers if the Account's PO Required on Orders is PO Required After. **Only for Pest Special Emergency Orders and Work Orders**.
     *
     * @param workOrderIds  the ids of the WorkOrder records to send DocuSign envelopes
     */
    public static void sendDocuSignForPONumberAfterCompletion(Set<Id> workOrderIds) {
        Set<Id> orderIds = new Set<Id>();
        
        if (!workOrderIds.isEmpty()) {
            for (WorkOrder wo : [SELECT Order__c FROM WorkOrder 
                                 WHERE Id IN :workOrderIds AND 
                                       Order__r.Is_PO_Provided_by_Customer__c = FALSE AND 
                                       Account.PO_Required_for_Orders__c = :QueryUtils.fieldServiceSettings.PO_Required_After_Label__c AND 
                                       Emergency__c = TRUE AND Line_of_Business__c = :QueryUtils.fieldServiceSettings.Pest_LOB__c]) {
                orderIds.add(wo.Order__c);
            }
        }
        
        orderIds.remove(null);
        
        if (!orderIds.isEmpty()) {
        	SendDocuSignOnDemandController.fireEmail(new List<Id>(orderIds));
        }
    }

    /**
     * Builds set of Lines of Business that can have Work Orders and all child records become Cannot Complete
     */
    public static Set<String> activeLinesOfBusinessForCannotComplete() {
        Map<String, Work_Order_Cannot_Complete_LoBs__c> lobs = Work_Order_Cannot_Complete_LoBs__c.getAll();

        Set<String> returnedLobs = new Set<String>();

        for (Work_Order_Cannot_Complete_LoBs__c lob : lobs.values()) {
            if (lob.IsActive__c) {
                returnedLobs.add(lob.Name);
            }
        }

        return returnedLobs;
    }

    /**
     * Compares all specified Service Appointment records to see if they all share the same status
     * 
     * @param appointments  The Service Appointment records to validate
     * @param statusToCheck  The status value to validate against
     */
    public static Boolean doAllServiceAppointmentStatusesMatch(Map<Id, ServiceAppointment> appointments, String statusToCheck) {
        for (ServiceAppointment sa : appointments.values()) {
            if (sa.Status != statusToCheck) {
                return false;
            }
        }

        return true;
    }

    /**
     * Sets all specified Service Appointment records to the same status value
     * 
     * @param workOrderIds  The Work Order Id's to retrieve their Service Appointment records
     * @param toStatus  The status value to have the Service Appointments be set to
     */
    public static void setAllServiceAppointmentsToSpecificStatus(Set<Id> workOrderIds, String toStatus) {
        Map<Id, ServiceAppointment> appointments = new Map<Id, ServiceAppointment>();

        if (!workOrderIds.isEmpty()) {
            appointments.putAll([SELECT Id, Status FROM ServiceAppointment WHERE ParentRecordId IN:workOrderIds]);
        }

        for (ServiceAppointment sa : appointments.values()) {
            sa.Status = toStatus;

            if (toStatus == QueryUtils.fieldServiceSettings.Work_Order_New_Status__c) {
                sa.Has_Resource_Assigned__c = false;
            }
        }

        if (!appointments.isEmpty()) {
            update appointments.values();
        }
    }

    /**
     * Sets all specified Work Order records to the same status value
     * 
     * @param workOrderIds  The Work Order Id's to retrieve the Work Order records
     * @param toStatus  The status value to have the Work Orders be set to
     */
    public static Boolean setWorkOrdersToSpecificStatus(Set<Id> workOrderIds, String toStatus) {
        Map<Id, WorkOrder> workOrdersToUpdate = new Map<Id, WorkOrder>();

        if (!workOrderIds.isEmpty()) {
            workOrdersToUpdate.putAll([SELECT Id, Status FROM WorkOrder WHERE Id IN :workOrderIds]);

            for (WorkOrder wo : workOrdersToUpdate.values()) {
                wo.Status = toStatus;
            }
        }

        if (!workOrdersToUpdate.isEmpty()) {
            update workOrdersToUpdate.values();
            return true;
        }

        return false;
    }

    /**
     * Closes all specified Ticket records
     * 
     * @param ticketsToClose  The Ticket records to be closed
     */
    public static void closePOConfirmationTickets(Map<Id, Case> ticketsToClose) {
        for (Case c : ticketsToClose.values()) {
            c.Status = QueryUtils.fieldServiceSettings.Ticket_Closed_Status__c;
        }

        if (!ticketsToClose.isEmpty()) {
            update ticketsToClose.values();
        }
    }

    /**
     * Sets / Overrides the Service Price Per Unit field on the related OrderItem record from the WorkOrderLineItem record
     * 
     * @param workOrderLineItemIds  The WorkOrderLineItem records to have their companion OrderItem records have their Service Price Per Unit fields updated
     */
    public static void setOrderItemServicePricePerUnit(Set<Id> workOrderLineItemIds) {
        Map<Id, OrderItem> orderItemsToUpdatePrice = new Map<Id, OrderItem>();

        if (!workOrderLineItemIds.isEmpty()) {
            List<WorkOrderLineItem> wolis = [
                    SELECT Id, Order_Product__c, Product_Service_Price_Per_Unit__c
                    FROM WorkOrderLineItem
                    WHERE Id IN :workOrderLineItemIds
                    AND Order_Product__c != NULL
                    AND Order_Product__r.Active__c = TRUE
            ];

            for (WorkOrderLineItem woli : wolis) {
                orderItemsToUpdatePrice.put(
                        woli.Order_Product__c,
                        new OrderItem(
                                Id = woli.Order_Product__c,
                                Service_Price_Per_Unit__c = woli.Product_Service_Price_Per_Unit__c,
                                Bypass_Standing_Order_Price_Engine__c = true
                        )
                );
            }
        }

        orderItemsToUpdatePrice.remove(null);

        if (!orderItemsToUpdatePrice.isEmpty()) {
            update orderItemsToUpdatePrice.values();
        }
    }

    /**
     * Helper function to change the Order status from one to another
     *
     * @param orders  the Order records to have their status changed
     * @param fromStatus  The name of the status the Order is currently on
     * @param toStatus  The name of the status the Order is being set to
     */
    private static void shiftOrderStatus(Map<Id, Order> orders, String fromStatus, String toStatus) {
        if (!orders.isEmpty()) {
            for (Order o : orders.values()) {
                if (o.Status == fromStatus) {
                    o.Status = toStatus;
                }
            }
            /*Shashi:3-24-2020:Draft to Active required only for normal users*/
			if(UserInfo.getProfileId()!=QueryUtils.fieldServiceSettings.System_Administrator_Profile_Id__c && 
           	   UserInfo.getProfileId()!=QueryUtils.fieldServiceSettings.Integration_User_Profile__c){
            	update orders.values();
           }
        }
    }

    /*
     * @Name        getRelatedWorkOrders
     * @Description Get a list of Related Work Orders by order ids or work order ids
     * @Author      Graeme Ward
     * @Params      orderId: Id of the Order for which to find Related Work Orders
     * @Return      List<Related_Work_Order__c>: List of Related Work Orders
     */
    public static List<Related_Work_Order__c> getRelatedWorkOrders(Id recordId) {
        return getRelatedWorkOrders(recordId, true);
    }

    public static List<Related_Work_Order__c> getRelatedWorkOrders(Id recordId, Boolean workOrderId) {
        return getRelatedWorkOrders(new Set<Id>{recordId}, workOrderId);
    }

    public static List<Related_Work_Order__c> getRelatedWorkOrders(Set<Id> recordIds) {
        return getRelatedWorkOrders(recordIds, true);
    }

    public static List<Related_Work_Order__c> getRelatedWorkOrders(Set<Id> recordIds, Boolean workOrderIds) {
        if(workOrderIds) {
            return [
                    SELECT Id, WorkOrder__c, WorkOrder__r.Status, WorkOrder__r.Account.PO_Required_for_Orders__c,
                            Order__c, Order__r.Is_PO_Provided_by_Customer__c, Order__r.Pest_Emergency_Not_Invoicing__c
                    FROM Related_Work_Order__c
                    WHERE WorkOrder__c IN :recordIds
            ];
        } else {
            return [
                    SELECT Id, WorkOrder__c, WorkOrder__r.Status, WorkOrder__r.Account.PO_Required_for_Orders__c,
                            Order__c, Order__r.Is_PO_Provided_by_Customer__c, Order__r.Pest_Emergency_Not_Invoicing__c
                    FROM Related_Work_Order__c
                    WHERE Order__c IN :recordIds
            ];
        }
    }

    /*
     * @Name        getRelatedServiceAppointments
     * @Description Returns a map of Service Appointments by their Parent Record Id (based on Work Order Ids from a list
     *              of Related Work Orders)
     * @Author      Graeme Ward
     * @Params      relatedWorkOrders: List of Related Work Orders
     * @Return      Map<Id, List<ServiceAppointment>>: Service Appointments mapped by their Work Order Id
     */
    public static Map<Id, List<ServiceAppointment>> getRelatedServiceAppointments(List<Related_Work_Order__c> relatedWorkOrders) {
        Set<Id> workOrderIds = getWorkOrderIdsFromRelatedWorkOrders(relatedWorkOrders);

        List<ServiceAppointment> serviceAppointments = [
                SELECT Id, Status, ParentRecordId
                FROM ServiceAppointment
                WHERE ParentRecordId IN :workOrderIds
        ];

        return (Map<Id, List<ServiceAppointment>>) JSON.deserialize(
                ApexUtils.convertListToMap((List<SObject>) serviceAppointments, 'ParentRecordId'),
                Map<Id, List<ServiceAppointment>>.class
        );
    }

    /*
     * @Name        getWorkOrderIdsFromRelatedWorkOrders
     * @Description Returns a set of Work Order ids collected from a list of Related Work Order records
     * @Author      Graeme Ward
     * @Params      relatedWorkOrders: List of Related Work Orders
     * @Return      Set<Id>: Set of Work Order ids
     */
    public static Set<Id> getWorkOrderIdsFromRelatedWorkOrders(List<Related_Work_Order__c> relatedWorkOrders) {
        return ApexUtils.getIdsFromField((List<SObject>) relatedWorkOrders, 'WorkOrder__c');
    }
}