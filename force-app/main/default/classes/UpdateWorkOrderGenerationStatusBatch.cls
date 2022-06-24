global class UpdateWorkOrderGenerationStatusBatch implements Database.Batchable<SObject>,Database.Stateful{
    
    List<Id> listUnmatchedWOLIIds;
    
    global UpdateWorkOrderGenerationStatusBatch(){
        listUnmatchedWOLIIds = new List<Id>();
    }

    global Database.QueryLocator Start(Database.BatchableContext bc){                     
        return Database.getQueryLocator([Select Id,Status,Type__c,StartDate,EndDate,Work_Order_Generation_Status__c from WorkOrder where  Type__c = 'Service' AND (StartDate >= : System.Today() AND StartDate <: System.Today().addDays(20))] );                                           
    }
    
    global void execute(Database.BatchableContext BC, List<SObject> scope) {
        Set<Id> setWOIds = new Set<Id>();
        //Map<Id,List<WorkOrder>> mapOrderProductToWOStartDate = new Map<Id,List<WorkOrder>>();
        Map<Id,List<WorkOrderLineItem>> mapOrderProductToWoliStartDate = new Map<Id,List<WorkOrderLineItem>>();
        
        
        for(SObject wo: scope){
            setWOIds.add(wo.Id);  
        }
        for(WorkOrderLineItem woli : [Select Id,WorkOrderId,StartDate,EndDate,Order_Product__c,WorkOrder.StartDate,WorkOrder.WorkOrderNumber,WorkOrder.Work_Order_Generation_Status__c from WorkOrderLineItem where WorkOrderId in: setWOIds ]){
            if(mapOrderProductToWoliStartDate.containsKey(woli.Order_Product__c)){
                //mapOrderProductToWOStartDate.get(woli.Order_Product__c).add(new WorkOrder(Id = woli.WorkOrderId,StartDate = woli.WorkOrder.StartDate,Work_Order_Generation_Status__c = woli.WorkOrder.Work_Order_Generation_Status__c));
                mapOrderProductToWoliStartDate.get(woli.Order_Product__c).add(new WorkOrderLineItem(Id = woli.Id,StartDate = woli.StartDate));
            }else{
                //mapOrderProductToWOStartDate.put(woli.Order_Product__c,new List<WorkOrder>{new WorkOrder(Id = woli.WorkOrderId,StartDate = woli.WorkOrder.StartDate,Work_Order_Generation_Status__c = woli.WorkOrder.Work_Order_Generation_Status__c)});
                mapOrderProductToWoliStartDate.put(woli.Order_Product__c,new List<WorkOrderLineItem>{new WorkOrderLineItem(Id = woli.Id,StartDate = woli.StartDate)});
            }   
        }
        Map<Id,Set<Date>> mapOrderProductToWOGSLStartDate = new Map<Id,Set<Date>>();//to hold Order product Id and the list of the corresponding WOGSL's start date 
        Map<Id,List<Work_Order_Generation_Status__c>> mapOrderProductToWogslRecord = new map<Id,List<Work_Order_Generation_Status__c>>();
        
        /**Querying all the inserted WOGSL for the incoming Order products**/
        for(Work_Order_Generation_Status__c wogsl : [Select Id,Order_Product__c,Expected_WO_Start_Date__c,Expected_WO_End_Date__c,Status__c,Work_Order_Id__c from Work_Order_Generation_Status__c 
                                                        where Order_Product__c in: mapOrderProductToWoliStartDate.keyset() AND Status__c != 'EXACT MATCH INSIDE GENERATION WINDOW'] ){ 
            if(mapOrderProductToWOGSLStartDate.containsKey(wogsl.Order_Product__c)){
                
                mapOrderProductToWOGSLStartDate.get(wogsl.Order_Product__c).add(wogsl.Expected_WO_Start_Date__c);  
                mapOrderProductToWogslRecord.get(wogsl.Order_Product__c).add(wogsl);         
            }else{
                mapOrderProductToWOGSLStartDate.put(wogsl.Order_Product__c,new Set<Date>{wogsl.Expected_WO_Start_Date__c});
                mapOrderProductToWogslRecord.put(wogsl.Order_Product__c,new List<Work_Order_Generation_Status__c>{wogsl});
            }
        }
       
        Map<Id,List<String>> mapWOGSLStatus = new Map<Id,List<String>>();
        Map<Id,String> mapWoToWOGS = new map<Id,String>();
        /** Querying through all the Order Products ofthe WOLIs***/
        for(OrderItem oItem : [Select Id from OrderItem where id in: mapOrderProductToWoliStartDate.keyset()]){

                List<Work_Order_Generation_Status__c> listWOGSL = new List<Work_Order_Generation_Status__c>();
                Set<Date> setWOGSLDates = new Set<Date>();
                if(mapOrderProductToWogslRecord.get(oItem.Id) != null){
                    listWOGSL = mapOrderProductToWogslRecord.get(oItem.Id);
                }
                if(mapOrderProductToWOGSLStartDate.get(oItem.Id) != null){
                    setWOGSLDates = mapOrderProductToWOGSLStartDate.get(oItem.Id);
                }
                  for(WorkOrderLineItem woli : mapOrderProductToWoliStartDate.get(oItem.Id)){
                        if(woli.StartDate != null){
                        Date d = woli.StartDate.Date();
                        Date dMinus3 = d.addDays(-3); Date dMinus2 = d.addDays(-2); Date dMinus1 = d.addDays(-1);
                        Date dPlus3 = d.addDays(3); Date dPlus2 = d.addDays(2); Date dPlus1 = d.addDays(1);

                    // Multiple if conditons instead of FOR loop because only 3 wogsl can be created at the most.Also want to avoid nested for loop
                    if(setWOGSLDates.size() > 0 && setWOGSLDates.size() != null ){
                        String WOLIDate = String.valueOf(woli.StartDate);
                        String WOLIEndDate = String.valueOf(woli.EndDate);

                        if(mapOrderProductToWOGSLStartDate.get(oItem.Id).contains(d)){

                            if(listWOGSL[0].Expected_WO_Start_Date__c == d && listWOGSL[0] != null){
                                mapWOGSLStatus.put(listWOGSL[0].Id,new List<String>{'EXACT MATCH INSIDE GENERATION WINDOW',woli.Id,WOLIDate,woli.WorkOrderId,WOLIEndDate,''}); 
                            }
                            if(listWOGSL.size() > 1 && listWOGSL[1] != null && listWOGSL[1].Expected_WO_Start_Date__c == d){    
                                mapWOGSLStatus.put(listWOGSL[1].Id,new List<String>{'EXACT MATCH INSIDE GENERATION WINDOW',woli.Id,WOLIDate,woli.WorkOrderId,WOLIEndDate,''});
                            }
                            if(listWOGSL.size() > 2 && listWOGSL[2] != null && listWOGSL[2].Expected_WO_Start_Date__c == d){
                                mapWOGSLStatus.put(listWOGSL[2].Id,new List<String>{'EXACT MATCH INSIDE GENERATION WINDOW',woli.Id,WOLIDate,woli.WorkOrderId,WOLIEndDate,''});
                            }
                        } else if(!mapOrderProductToWOGSLStartDate.get(oItem.Id).contains(d) && (mapOrderProductToWOGSLStartDate.get(oItem.Id).contains(dPlus3) || mapOrderProductToWOGSLStartDate.get(oItem.Id).contains(dPlus2)
                                    || mapOrderProductToWOGSLStartDate.get(oItem.Id).contains(dPlus1) || mapOrderProductToWOGSLStartDate.get(oItem.Id).contains(dMinus3) || mapOrderProductToWOGSLStartDate.get(oItem.Id).contains(dMinus2) ||
                                    mapOrderProductToWOGSLStartDate.get(oItem.Id).contains(dMinus1))){

                                    if(listWOGSL[0] != null && listWOGSL[0].Expected_WO_Start_Date__c >= dMinus3 && listWOGSL[0].Expected_WO_Start_Date__c <= dPlus3 && listWOGSL[0].Status__c != 'APPROXIMATE MATCH INSIDE GENERATION WINDOW (+/- 3)'){
                                        mapWOGSLStatus.put(listWOGSL[0].Id,new List<String>{'APPROXIMATE MATCH INSIDE GENERATION WINDOW (+/- 3)',woli.Id,WOLIDate,woli.WorkOrderId,WOLIEndDate,''});   
                                    }
                                    if( listWOGSL.size() > 1 && listWOGSL[1].Expected_WO_Start_Date__c >= dMinus3 && listWOGSL[1].Expected_WO_Start_Date__c <= dPlus3  && listWOGSL[1].Status__c != 'APPROXIMATE MATCH INSIDE GENERATION WINDOW (+/- 3)'){
                                        mapWOGSLStatus.put(listWOGSL[1].Id,new List<String>{'APPROXIMATE MATCH INSIDE GENERATION WINDOW (+/- 3)',woli.Id,WOLIDate,woli.WorkOrderId,WOLIEndDate,''});
                                    }
                                    if( listWOGSL.size() > 2 && listWOGSL[2].Expected_WO_Start_Date__c >= dMinus3 && listWOGSL[2].Expected_WO_Start_Date__c <= dPlus3 && listWOGSL[2].Status__c != 'APPROXIMATE MATCH INSIDE GENERATION WINDOW (+/- 3)'){
                                        mapWOGSLStatus.put(listWOGSL[2].Id,new List<String>{'APPROXIMATE MATCH INSIDE GENERATION WINDOW (+/- 3)',woli.Id,WOLIDate,woli.WorkOrderId,WOLIEndDate,''});
                                    }                                        
                        }else{
                            listUnmatchedWOLIIds.add(woli.Id);
                        }
                    }else{listUnmatchedWOLIIds.add(woli.Id);}
                }  
            }   
        }   
                /*** PART 3: UPDATING THE WOGSL***/
            List<Work_Order_Generation_Status__c> listUpdateWOGSL = new List<Work_Order_Generation_Status__c>();
            for(Work_Order_Generation_Status__c wogsl : [Select Id,Expected_WO_Start_Date__c,Status__c,Work_Order_Id__c from Work_Order_Generation_Status__c where id in : mapWOGSLStatus.keySet()]){
                wogsl.Status__c = mapWOGSLStatus.get(wogsl.Id)[0];
                //wogsl.WOLI_Id__c = mapWOGSLStatus.get(wogsl.Id)[1];
                wogsl.Work_Order_Line_Item__c = mapWOGSLStatus.get(wogsl.Id)[1];
                wogsl.WOLI_Start_Date__c = mapWOGSLStatus.get(wogsl.Id)[2];
                wogsl.Work_Order__c = mapWOGSLStatus.get(wogsl.Id)[3];
                wogsl.Work_Order_Line_Item_End_Date_Stamp__c = mapWOGSLStatus.get(wogsl.Id)[4];
                listUpdateWOGSL.add(wogsl);
            }    
            database.update(listUpdateWOGSL,false);
    }
    global void finish(Database.BatchableContext bc){
        if(!listUnmatchedWOLIIds.isEmpty()){
            UpdateWorkOrderStatusSecondBatch uwogsb = new UpdateWorkOrderStatusSecondBatch(listUnmatchedWOLIIds);
            database.executebatch(uwogsb,50);
        }
        
    }
}