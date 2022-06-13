trigger ManageRelatedDocuSignStatusRecords on dsfs__DocuSign_Status__c (after insert, after update) {
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    static Conga_and_DocuSign_Settings__c congaSettings = Conga_and_DocuSign_Settings__c.getOrgDefaults();
    
    Set<Id> quoteIds = new Set<Id>();
    Set<Id> orderIds = new Set<Id>();//21618

    for (dsfs__DocuSign_Status__c ds : Trigger.new) {
        dsfs__DocuSign_Status__c oldRec = (Trigger.isInsert ? new dsfs__DocuSign_Status__c() : Trigger.oldMap.get(ds.Id));
        if (ds.dsfs__Envelope_Status__c == congaSettings.DocuSign_Envelope_Completed_Status__c && ds.dsfs__Envelope_Status__c != oldRec.dsfs__Envelope_Status__c && ds.Quote__c != null) {
            quoteIds.add(ds.Quote__c);
        }
        //21618
        if (ds.dsfs__Envelope_Status__c == congaSettings.DocuSign_Envelope_Completed_Status__c && ds.dsfs__Envelope_Status__c != oldRec.dsfs__Envelope_Status__c && ds.Order__c != null) {
            orderIds.add(ds.Order__c);
        }
    }
    
    quoteIds.remove(null);
    orderIds.remove(null);
    
    if (!quoteIds.isEmpty()) {
        QuoteAutoSyncUtil.signedQuote(quoteIds);
    }
    
    //21618, set order status to Active, auto-dispatch work orders and service appointments, and close PO confirmation tickets
    if (!orderIds.isEmpty()) {
        Map<Id, Order> ordersToActivate = new Map<Id, Order>();
        Set<Id> workOrderIdsToUpdate = new Set<Id>();
        Map<Id, Case> ticketsToClose = new Map<Id, Case>();
        
        //po required after - po numbers returned, activate the order
        for (Order o : [SELECT Id, Status, Pest_Emergency_Not_Invoicing__c FROM Order WHERE Id IN :orderIds AND Pest_Emergency_Not_Invoicing__c = TRUE AND Order.Account.PO_Required_for_Orders__c = :dataSets.PO_Required_After_Label__c]) {
            ordersToActivate.put(o.Id, new Order(Id = o.Id, Status = dataSets.Order_Active_Stage__c, Pest_Emergency_Not_Invoicing__c = false));
        }
        
        //auto-dispatch work order and service appointments
        for (Order o : [SELECT Id, (SELECT Id FROM Work_Orders__r LIMIT 1), (SELECT Id, Status FROM Tickets__r WHERE Pest_Emergency_Order_Draft_Override__c = TRUE AND Status != :dataSets.Ticket_Closed_Status__c) FROM Order WHERE Id IN :orderIds AND Pest_Emergency_Not_Invoicing__c = TRUE AND Order.Account.PO_Required_for_Orders__c = :dataSets.PO_Required_Before_Label__c]) {
            if (!o.Work_Orders__r.isEmpty()) {
            	workOrderIdsToUpdate.add(o.Work_Orders__r[0].Id);
            }
            
            if (!o.Tickets__r.isEmpty()) {
                ticketsToClose.putAll(o.Tickets__r);
            }
        }
        
        ordersToActivate.remove(null);
        workOrderIdsToUpdate.remove(null);
        ticketsToClose.remove(null);
        
        if (!ordersToActivate.isEmpty()) {
            update ordersToActivate.values();
        }
        
        if (!workOrderIdsToUpdate.isEmpty()) {
            WorkOrderUtil.setAllServiceAppointmentsToSpecificStatus(workOrderIdsToUpdate, dataSets.Work_Order_Dispatched_Status__c);
            WorkOrderUtil.setWorkOrdersToSpecificStatus(workOrderIdsToUpdate, dataSets.Work_Order_Dispatched_Status__c);
        }
        
        if (!ticketsToClose.isEmpty()) {
            WorkOrderUtil.closePOConfirmationTickets(ticketsToClose);
        }
    }
}