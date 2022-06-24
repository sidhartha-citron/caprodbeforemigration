/**
 * @FileName: WorkOrderLocationLineItemsWrapper
 * @Description: Wrapper class to update work order line items with room data
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       2/9/2020         Created
 *-----------------------------------------------------------  
 */
public inherited sharing class WorkOrderLocationLineItemsWrapper {
    private List<Work_Order_Room__c> workOrderRooms;
    private Map<Id, Work_Order_Room__c> oldMap;
    private List<WorkOrderLineItem> cannotCompleteLineItems = new List<WorkOrderLineItem>();
    private Map<Id, Work_Order_Room__c> cannotCompleteWorkOrderRooms = new Map<Id, Work_Order_Room__c>();
    private Map<Id, Work_Order_Room__c> roomsToGenerateLineItem = new Map<Id, Work_Order_Room__c>();
    private Map<Id, Decimal> surveyLocationsAndServiceOrders = new Map<Id, Decimal>();


    public WorkOrderLocationLineItemsWrapper(
            List<Work_Order_Room__c> workOrderRooms,
            Map<Id, Work_Order_Room__c> oldMap)
    {
        this.workOrderRooms = workOrderRooms;
        this.oldMap = oldMap;
        this.cannotCompleteLineItems = new List<WorkOrderLineItem>();
        this.cannotCompleteWorkOrderRooms = new Map<Id, Work_Order_Room__c>();
        this.roomsToGenerateLineItem = new Map<Id, Work_Order_Room__c>();
        this.surveyLocationsAndServiceOrders = new Map<Id, Decimal>();

        updateWorkOrderLineItemsFromRoom();
    }

    private void updateWorkOrderLineItemsFromRoom() {
        for (Work_Order_Room__c wor : workOrderRooms) {
            Work_Order_Room__c oldRec = oldMap.get(wor.Id);

            if(String.isNotBlank(wor.Id)) {
                if (wor.Status__c == QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c
                        && wor.Cannot_Complete_Reason__c != null)
                {
                    cannotCompleteWorkOrderRooms.put(wor.Id, wor);
                }

                if (wor.Generate_Work_Order_Line_Item__c
                        && wor.Work_Order_Pricebook__c != null
                        && wor.Product__c != null)
                {
                    roomsToGenerateLineItem.put(wor.Id, wor);
                }
            }

            if (oldRec.Service_Order__c != wor.Service_Order__c
                    && String.isNotBlank(wor.Survey_Location__c))
            {
                surveyLocationsAndServiceOrders.put(wor.Survey_Location__c, wor.Service_Order__c);
            }
        }


        if (!cannotCompleteWorkOrderRooms.isEmpty()) {
            updateLineItems();
        }

        //case 21478 - generate a Work Order Line Item [dk]
        if (!roomsToGenerateLineItem.isEmpty() && !TriggerHelper.hasRun) {
            createProductConsumedRecords();
        }

        if (!surveyLocationsAndServiceOrders.isEmpty() && !TriggerHelper.isWorkOrderLocationFutureCalled && !System.isFuture() && !System.isBatch()) {
            TriggerHelper.isWorkOrderLocationFutureCalled = true;
            WorkOrderLocationFutureCalls.updateServiceOrder(surveyLocationsAndServiceOrders);
        }

    }

    private void updateLineItems() {
        List<WorkOrderLineItem> wolis = [
                SELECT Id, Cannot_Complete_Reason__c, Work_Order_Location__c
                FROM WorkOrderLineItem
                WHERE Work_Order_Location__c IN :cannotCompleteWorkOrderRooms.keySet()
                ORDER BY Work_Order_Location__c
        ]; //CR21-40 20210407 Darcy AND Cannot_Complete_Reason__c = NULL
		
        for (WorkOrderLineItem woli : wolis) {
            Work_Order_Room__c wor = cannotCompleteWorkOrderRooms.get(woli.Work_Order_Location__c);

            if(wor == null) continue;

            woli.Status = QueryUtils.fieldServiceSettings.Work_Order_Line_Item_CannotComp_Status__c; 
            woli.Cannot_Complete_Reason__c = wor.Cannot_Complete_Reason__c;
            cannotCompleteLineItems.add(woli);
        }

        update cannotCompleteLineItems;
    }

    private void createProductConsumedRecords() {
        TriggerHelper.hasRun = true;

        List<WorkOrderLineItem> items = new List<WorkOrderLineItem>();
        Set<Id> productIds = new Set<Id>();
        Map<Id, Map<Id, Id>> pbe_pb_p2Map = new Map<Id, Map<Id, Id>>();
        Set<Id> pricebookIds = new Set<Id>();
        List<ProductConsumed> pcs = new List<ProductConsumed>();

        for (Work_Order_Room__c wor : roomsToGenerateLineItem.values()) {
            if(String.isNotBlank(wor.Work_Order_Pricebook__c)) {
                pricebookIds.add(wor.Work_Order_Pricebook__c);
            }

            if(String.isNotBlank(wor.Product__c)) {
                productIds.add(wor.Product__c);

                pbe_pb_p2Map.put(
                        wor.Product__c,
                        new Map<Id, Id>{
                                wor.Work_Order_Pricebook__c => null
                        }
                );
            }
        }

        List<PricebookEntry> pbes =  [
                SELECT Id, Product2Id, Pricebook2Id
                FROM PricebookEntry
                WHERE Product2Id IN :pbe_pb_p2Map.keySet()
                AND Pricebook2Id IN :pricebookIds
                AND IsActive = TRUE
                AND Product2.IsActive = TRUE
        ];

        for (PricebookEntry pbe : pbes) {
            pbe_pb_p2Map.get(pbe.Product2Id).put(pbe.Pricebook2Id, pbe.Id);
        }

        for (Work_Order_Room__c wor : roomsToGenerateLineItem.values()) {
            Id pEntryId = pbe_pb_p2Map.get(wor.Product__c).get(wor.Work_Order_Pricebook__c);

            if (pEntryId != null) {
                items.add(new WorkOrderLineItem(
                        WorkOrderId = wor.Work_Order__c,
                        Work_Order_Location__c = wor.Id,
                        Product__c = wor.Product__c,
                        Quantity = 1,
                        PricebookEntryId = pEntryId
                ));
            }
        }

        insert items;

        for (WorkOrderLineItem item : items) {
            pcs.add(new ProductConsumed(
                    WorkOrderId = item.WorkOrderId,
                    PricebookEntryId = item.PricebookEntryId,
                    QuantityConsumed = item.Quantity,
                    WorkOrderLineItemId = item.Id
            ));
        }

        insert pcs;
    }
}