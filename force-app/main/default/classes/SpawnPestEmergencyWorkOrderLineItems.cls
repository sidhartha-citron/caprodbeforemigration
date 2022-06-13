/**
* Name: SpawnPestEmergencyWorkOrders
* Author: PwC
* Date Created: April 23, 2019
* Purpose: To generate the Pest Emergency Work Order Line Items from the Emergency Dispatch Wizard app
*/
global class SpawnPestEmergencyWorkOrderLineItems implements Database.Batchable<SObject> {
    private Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    private Set<Id> workOrderIds;
    
    global SpawnPestEmergencyWorkOrderLineItems(Set<Id> workOrderIds) {
        this.workOrderIds = workOrderIds;
    }
    
	global Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([SELECT Id FROM WorkOrder WHERE Id IN :workOrderIds]);
    }
    
    global void execute(Database.BatchableContext bc, List<SObject> batch) {
        Set<Id> workOrderIds = new Set<Id>();
        
        for (WorkOrder wo : (List<WorkOrder>)batch) {
            workOrderIds.add(wo.Id);
        }
        
        processWorkOrderLineItems(workOrderIds);
    }
    
    global void finish(Database.BatchableContext bc) {
        Database.executeBatch(new SpawnWorkOrderRooms(workOrderIds, true), 50);
    }
    
    /**
     * Generates and sanitizes all Pest Emergency Work Order Line Items as specified
     * 
     * @param workOrderIds  the Ids representing the Work Orders to have their Line Items generated and sanitized
     */
    global void processWorkOrderLineItems(Set<Id> workOrderIds) {
        workOrderIds.remove(null);
        
        if (workOrderIds.isEmpty()) {
            System.debug('empty request');
            return;
        }
        
        Map<Id, WorkOrder> orderToWorkOrderMap = new Map<Id, WorkOrder>();
        Map<Id, List<WorkOrderLineItem>> workOrderLineItemsMap = new Map<Id, List<WorkOrderLineItem>>();
        List<WorkOrderLineItem> workOrderLineItemsToInsert = new List<WorkOrderLineItem>();
        Map<Id, WorkOrderLineItem> existingLineItems = new Map<Id, WorkOrderLineItem>();
        Map<Id, WorkOrderLineItem> existingLineItemsToDelete = new Map<Id, WorkOrderLineItem>();
        
        if (!workOrderIds.isEmpty()) {
            for (WorkOrder wo : [SELECT Id, Order__c, StartDate, EndDate, (SELECT Id, Order_Product__c, Order_Product__r.IsActive__c FROM WorkOrderLineItems) FROM WorkOrder WHERE Id IN :workOrderIds AND Emergency__c = TRUE AND Line_of_Business__c = :dataSets.Pest_LOB__c]) {
                orderToWorkOrderMap.put(wo.Order__c, wo);
                workOrderLineItemsMap.put(wo.Order__c, new List<WorkOrderLineItem>());
                
                if (!wo.WorkOrderLineItems.isEmpty()) {
                    for (WorkOrderLineItem woli : wo.WorkOrderLineItems) {
                        if (String.isBlank(woli.Order_Product__c) || !woli.Order_Product__r.IsActive__c) {
                            existingLineItemsToDelete.put(woli.Id, woli);
                        } else {
                            existingLineItems.put(woli.Order_Product__c, woli);
                        }
                    }
                }
            }
        }
        
        existingLineItemsToDelete.remove(null);
        existingLineItems.remove(null);
        
        if (!workOrderLineItemsMap.isEmpty()) {
            for (OrderItem oi : [SELECT Id, OrderId, Survey_Location__c, Product2Id, PricebookEntryId, Service_Work_Type__c, Service_Notes__c, Service_Price_Per_Unit__c FROM OrderItem WHERE OrderId IN :workOrderLineItemsMap.keySet()]) {
                WorkOrder wo = orderToWorkOrderMap.get(oi.OrderId);
                
                WorkOrderLineItem existingWOLI = existingLineItems.get(oi.Id);
                
                WorkOrderLineItem woli = new WorkOrderLineItem(
                    WorkOrderId = wo.Id,
                    OrderId = oi.OrderId,
                    Order_Product__c = oi.Id,
                    Product__c = oi.Product2Id,
                    Quantity = 1,
                    PricebookEntryId = oi.PricebookEntryId,
                    StartDate = wo.StartDate,
                    EndDate = wo.EndDate,
                    Type_of_Service__c = dataSets.Label_for_Service_Work_Order_Type__c,
                    Status = dataSets.Work_Order_New_Status__c,
                    WorkTypeId = oi.Service_Work_Type__c,
                    Service_Notes__c = oi.Service_Notes__c,
                    Product_Service_Price_Per_Unit__c = oi.Service_Price_Per_Unit__c//7.3 change request
                );
                
                if (existingWOLI != null) {
                    woli.Id = existingWOLI.Id;
                }
                
                workOrderLineItemsMap.get(oi.OrderId).add(woli);
            }
        }
        
        workOrderLineItemsMap.remove(null);
        
        for (Id orderId : workOrderLineItemsMap.keySet()) {
            workOrderLineItemsToInsert.addAll(workOrderLineItemsMap.get(orderId));
        }
        
        if (!workOrderLineItemsToInsert.isEmpty()) {
            upsert workOrderLineItemsToInsert;
        }
        
        if (!existingLineItemsToDelete.isEmpty()) {
            delete existingLineItemsToDelete.values();
        }
    }
}