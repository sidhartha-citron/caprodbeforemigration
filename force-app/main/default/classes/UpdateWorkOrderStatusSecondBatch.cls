global class UpdateWorkOrderStatusSecondBatch implements Database.Batchable<SObject>, Database.Stateful{
    
    List<Id> listUnmatchedWOLIs = new List<ID>() ;
    global UpdateWorkOrderStatusSecondBatch(List<Id> listUnmatchedWOLIIds){
        this.listUnmatchedWOLIs = listUnmatchedWOLIIds;
    }
    
    global Database.QueryLocator Start(Database.BatchableContext bc){
        List<Id> listUnmatchedWOLIs2 = new List<ID>() ;
        listUnmatchedWOLIs2.addAll(listUnmatchedWOLIs);
        return Database.getQueryLocator([Select Id,WorkOrderId,StartDate,Order_Product__c,WorkOrder.StartDate,WorkOrder.WorkOrderNumber,WorkOrder.Work_Order_Generation_Status__c from WorkOrderLineItem where Id in: listUnmatchedWOLIs2 ]);
    }
           
    global void execute(Database.BatchableContext BC, List<SObject> scope) {
        Set<Id> setWOLIds = new Set<Id>();
        Map<Id,Id> mapWOToOP = new Map<Id,Id>();
        Map<Id,List<WorkOrderLineItem>> mapOrderProductToWoliStartDate = new Map<Id,List<WorkOrderLineItem>>();
        
        for(SObject woli: scope){
            setWOLIds.add(woli.Id);
        }
        for(WorkOrderLineItem woli : [Select Id,OrderId,WorkOrderId,StartDate,EndDate,Order_Product__c,WorkOrder.StartDate,WorkOrder.WorkOrderNumber from WorkOrderLineItem where Id in: setWOLIds ]){
            if(mapOrderProductToWoliStartDate.containsKey(woli.Order_Product__c)){ 
                mapOrderProductToWoliStartDate.get(woli.Order_Product__c).add(new WorkOrderLineItem(Id = woli.Id,StartDate = woli.StartDate));
            }else{    
                mapOrderProductToWoliStartDate.put(woli.Order_Product__c,new List<WorkOrderLineItem>{new WorkOrderLineItem(Id = woli.Id,StartDate = woli.StartDate)});
            }
            mapWOToOP.put(woli.Id,woli.Order_Product__c);
        }

        Map<Id,List<Work_Order_Generation_Status__c>> mapOrderProductToWogslRecord = new map<Id,List<Work_Order_Generation_Status__c>>();
        
         for(Work_Order_Generation_Status__c wogsl : [Select Id,Work_Order_Line_Item__c,WOLI_Start_Date__c,Work_Order__c,Order_Product__c,Work_Order_Line_Item_End_Date_Stamp__c,Expected_WO_Start_Date__c,Expected_WO_End_Date__c,Status__c,Work_Order_Id__c,Work_Order_Start_Date__c from Work_Order_Generation_Status__c 
                                                        where Order_Product__c in: mapOrderProductToWoliStartDate.keyset() AND Status__c = ''] ){ 
            if(mapOrderProductToWogslRecord.containsKey(wogsl.Order_Product__c)){ 
                mapOrderProductToWogslRecord.get(wogsl.Order_Product__c).add(wogsl);   
            }else{
                mapOrderProductToWogslRecord.put(wogsl.Order_Product__c,new List<Work_Order_Generation_Status__c>{wogsl});
            }
        }
        Map<Id,List<String>> mapWOGSLStatus = new Map<Id,List<String>>();
        Set<Id> woliIds = new Set<Id>();
        for(OrderItem oItem : [Select Id from OrderItem where id in: mapOrderProductToWoliStartDate.keyset()]){
            
            List<Work_Order_Generation_Status__c> listWOGSL = new List<Work_Order_Generation_Status__c>();
            if( mapOrderProductToWogslRecord.get(oItem.Id) != null){
                listWOGSL = mapOrderProductToWogslRecord.get(oItem.Id);
            }

            for(WorkOrderLineItem woli : mapOrderProductToWoliStartDate.get(oItem.Id)){
                    if(listWOGSL.size() >0){
                        String WOLIDate = String.valueOf(woli.StartDate);
                        String WOLIEndDate = String.valueOf(woli.EndDate);
                        
                         if(listWOGSL[0].Status__c == '' || listWOGSL[0].Status__c == null){
                                    mapWOGSLStatus.put(listWOGSL[0].Id,new List<String>{'APPROXIMATE MATCH INSIDE GENERATION WINDOW (GREATER THAN +/- 3)',woli.Id,WOLIDate,woli.WorkOrderId,WOLIEndDate,''}); 
                                }
                                else if(listWOGSL.size() > 1 && (listWOGSL[1].Status__c == '' || listWOGSL[1].Status__c == null)){
                                    mapWOGSLStatus.put(listWOGSL[1].Id,new List<String>{'APPROXIMATE MATCH INSIDE GENERATION WINDOW (GREATER THAN +/- 3)',woli.Id,WOLIDate,woli.WorkOrderId,WOLIEndDate,''}); 
                                }
                                else if(listWOGSL.size() > 2 && (listWOGSL[2].Status__c == '' || listWOGSL[2].Status__c == null)){
                                    mapWOGSLStatus.put(listWOGSL[2].Id,new List<String>{'APPROXIMATE MATCH INSIDE GENERATION WINDOW (GREATER THAN +/- 3)',woli.Id,WOLIDate,woli.WorkOrderId,WOLIEndDate,''}); 
                                }
                    }else{
                        woliIds.add(woli.id);
                    }
            }
        }
        List<Work_Order_Generation_Status__c> listUpdateWOGSL = new List<Work_Order_Generation_Status__c>();
        for(Work_Order_Generation_Status__c wogsl : [Select Id,Work_Order__c,Work_Order_Line_Item_End_Date_Stamp__c,Work_Order_Line_Item__c,WOLI_Start_Date__c,Status__c,Work_Order_Id__c,Work_Order_Start_Date__c from Work_Order_Generation_Status__c where id in : mapWOGSLStatus.keySet()]){
                
                wogsl.Status__c = mapWOGSLStatus.get(wogsl.Id)[0];
                wogsl.Work_Order_Line_Item__c = mapWOGSLStatus.get(wogsl.Id)[1];
                wogsl.WOLI_Start_Date__c = mapWOGSLStatus.get(wogsl.Id)[2];
                wogsl.Work_Order__c = mapWOGSLStatus.get(wogsl.Id)[3];
                wogsl.Work_Order_Line_Item_End_Date_Stamp__c = mapWOGSLStatus.get(wogsl.Id)[4];
                listUpdateWOGSL.add(wogsl);

        }    
        database.update(listUpdateWOGSL,false);
                   
        List<Work_Order_Generation_Status__c> listWOGSLCreated = new List<Work_Order_Generation_Status__c>();
        for(WorkOrderLineItem woli: [Select Id,WorkOrderId,StartDate,EndDate,Order_Product__c,OrderId,Order_Product__r.Last_InFlight_WO_Date__c,Order_Product__r.Last_Automation_Created_Date__c from WorkOrderLineItem where Id in: woliIds ]){
            
            String WOLIDate = String.valueOf(woli.StartDate);
            String WOLIEndDate = String.valueOf(woli.EndDate);
            
            listWOGSLCreated.add(new Work_Order_Generation_Status__c( 
                                                                        Status__c = 'EXTRA WO INSIDE GENERATION WINDOW',
                                                                        Work_Order_Line_Item__c = woli.Id,
                                                                        Order_Product__c = mapWOToOP.get(woli.id),
                                                                        WOLI_Start_Date__c = WOLIDate,
                                                                        Work_Order__c = woli.WorkOrderId,
                                                                        Order__c = woli.OrderId,
                                                                        Work_Order_Line_Item_End_Date_Stamp__c = WOLIEndDate,
                                                                        Last_InFlight_WO_Date_stamp__c = String.valueOf(woli.Order_Product__r.Last_InFlight_WO_Date__c),
                                                                        Last_Automation_Created_Date_stamp__c = String.valueOf(woli.Order_Product__r.Last_Automation_Created_Date__c)
                                                                        //Order__c = OrderId
                                                                    ));
        }       
        if(listWOGSLCreated.size() > 0){
            Database.insert(listWOGSLCreated,false);
        }
        
    }
    global void finish(Database.BatchableContext bc){
     UpdateWorkOrderGenerationBatchFinal uwogbf = new UpdateWorkOrderGenerationBatchFinal();
     database.executebatch(uwogbf,200);
    }
}