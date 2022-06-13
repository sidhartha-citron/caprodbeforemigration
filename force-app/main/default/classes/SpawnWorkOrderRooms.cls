global class SpawnWorkOrderRooms implements Database.Batchable<SObject> {
    public Boolean IS_ORDER_ID = false;
    public Boolean IS_DATE_FILTER = false;
    public Boolean EXECUTE_WORK_ORDER_LOCATION_CLEANUP = false;
    public String queryString;
    public Set<Id> workOrderIds = new Set<Id>();
    public DateTime startDT, endDT;
    
    global SpawnWorkOrderRooms() {
        this('', false);
    }

    global SpawnWorkOrderRooms(String s) {
        this(s, false);
    }
    
    global SpawnWorkOrderRooms(DateTime startTime, DateTime endTime){
        IS_DATE_FILTER = true;
        this.startDT = startTime;
        this.endDT = endTime;
        System.debug('--START TIME FRAME--' + startDT + '--' + endDT);
    }

    global SpawnWorkOrderRooms(String s, Boolean isOrderId) {
        this.IS_ORDER_ID = isOrderId;
		if(isOrderId) {
            queryString = 'SELECT Id, WorkOrder__c FROM Related_Work_Order__c WHERE Order__c = \'' + s + '\' AND WorkOrder__r.isValid__c = TRUE';
        } else if (String.isNotBlank(s)) {
            queryString = 'SELECT Id FROM WorkOrder WHERE Id = \'' + s + '\'';
        }
    }

    global SpawnWorkOrderRooms(Set<Id> workOrderIds) {
        this(workOrderIds, false);
    }
    
    global SpawnWorkOrderRooms(Set<Id> workOrderIds, Boolean executeWorkOrderLocationCleanup) {
        this.IS_ORDER_ID = false;
        this.EXECUTE_WORK_ORDER_LOCATION_CLEANUP = executeWorkOrderLocationCleanup;
        this.workOrderIds = workOrderIds;
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc) {
        if (!workOrderIds.isEmpty()) {
            System.debug('--WorkOrderIds--');
            return Database.getQueryLocator([
                    SELECT Id, WorkOrderNumber
                    FROM WorkOrder
                    WHERE Id IN :workOrderIds
                    ORDER BY WorkOrderNumber
            ]);
        } 
        else if(queryString == null && IS_DATE_FILTER){
            System.debug('--DF Query--' + EXECUTE_WORK_ORDER_LOCATION_CLEANUP);
            return Database.getQueryLocator([
                    SELECT Id, WorkOrderNumber 
                    FROM WorkOrder 
                    WHERE isValid__c=TRUE AND Account.isValid__c=TRUE AND 
                         (CREATEDDATE >=:startDT AND CREATEDDATE <=:endDT)
                    ORDER BY WorkOrderNumber
            ]);
        } 
        else if(queryString == null && !IS_DATE_FILTER) {
            System.debug('--NDF Query--' + EXECUTE_WORK_ORDER_LOCATION_CLEANUP);
            return Database.getQueryLocator([
                    SELECT Id, WorkOrderNumber 
                    FROM WorkOrder 
                    WHERE isValid__c=TRUE AND Account.isValid__c=TRUE 
                    ORDER BY WorkOrderNumber
            ]);
        } 
        else {
            System.debug('--Query String--');
            return Database.getQueryLocator(queryString);
        }
    }
    
    global void execute(Database.BatchableContext bc, List<SObject> batch) {
        Set<Id> workOrders = new Set<Id>();

        for (SObject o : batch){
            Id workOrderId;

            if(IS_ORDER_ID) {
                workOrderId = (Id) o.get('WorkOrder__c');
            } else {
                workOrderId = (Id) o.get('Id');
            }

            workOrders.add(workOrderId);
        }
        //System.debug('--Execute:' + workOrders);
        processWorkOrders(workOrders);
    }
    
    global void processWorkOrders(Set<Id> prsworkOrderIds) {
        Map<Id, WorkOrderLineItem> woliMap = new Map<Id, WorkOrderLineItem>();
        Map<String, Work_Order_Room__c> woRoomMap = new Map<String, Work_Order_Room__c>();
        Map<Id, Order_Item_Location__c> locMap = new Map<Id, Order_Item_Location__c>();
        Map<Id, Order_Item_Location__c> queriedLocation = new Map<Id, Order_Item_Location__c>();
        Map<Id, List<WorkOrderLineItem>> ordProdToWOLines = new Map<Id, List<WorkOrderLineItem>>();

        List<WorkOrderLineItem> wolis = [
                SELECT Id, WorkOrderId, WorkOrder.Site_Survey__c, WorkOrder.Type__c, Product__c, Related_Product__c,
                Order_Product__c, Order_Product__r.Parent_Order_Product__c, AssetId, Status, OrderId
                FROM WorkOrderLineItem
                WHERE WorkOrderId IN :prsworkOrderIds
        ];

        //System.debug('--WorkOrderLineItems--' + prsworkOrderIds);
        for (WorkOrderLineItem woli : wolis) {
            Id orderProductId = (woli.Order_Product__r.Parent_Order_Product__c != null ? woli.Order_Product__r.Parent_Order_Product__c : woli.Order_Product__c);
            woliMap.put(woli.Id, woli);
            locMap.put(orderProductId,null);
            
            if (ordProdToWOLines.get(orderProductId) == null) {
                ordProdToWOLines.put(orderProductId, new List<WorkOrderLineItem>());
            } 
            List<WorkOrderLineItem> temp = ordProdToWOLines.get(orderProductId);
            temp.add(woli);
            ordProdToWOLines.put(orderProductId,temp);
        }
        
        if (!locMap.isEmpty()) {
            List<Order_Item_Location__c> oils = [
                    SELECT Id, Order_Product__c, Survey_Asset_Location__c, Survey_Asset_Location__r.Survey_Location__c,
                            Survey_Asset_Location__r.Survey_Location__r.Service_Order__c,
                            Survey_Asset_Location__r.Survey_Location__r.Number_of_Rooms__c,
                            Survey_Asset_Location__r.Survey_Location__r.Name,
                            Survey_Asset_Location__r.Survey_Location__r.Floor__c,
                            Survey_Asset_Location__r.Survey_Location__r.Location__c,
                            Survey_Asset_Location__r.Survey_Location__r.Location_SubType__c,
                            Survey_Asset_Location__r.Survey_Location__r.Location_Type__c,
                            Survey_Asset_Location__r.Survey_Location__r.Building__c,
                            Survey_Asset_Location__r.Survey_Location__r.Suite_Number__c,
                            Survey_Asset_Location__r.Survey_Location__r.Notes__c,
                            Survey_Asset_Location__r.Survey_Location__r.Installation_Notes__c,
                            Survey_Asset_Location__r.Survey_Location__r.Service_Notes__c, Survey_Asset_Location__r.Name,
                            Survey_Asset_Location__r.Product__c, Survey_Asset_Location__r.Quantity__c,
                            Survey_Asset_Location__r.Status__c, Survey_Asset_Location__r.Survey_Location__r.Unit_Number__c
                    FROM Order_Item_Location__c
                    WHERE Order_Product__c IN :locMap.keySet()
                    ORDER BY Survey_Asset_Location__r.Survey_Location__c
            ];
            
            //System.debug('--OrderItemLocations--' + oils);

            for(Order_Item_Location__c oil : oils) {
                if(String.isNotBlank(oil.Order_Product__c)) {
                    queriedLocation.put(oil.Order_Product__c, oil);
                }

                for (WorkOrderLineItem woli : ordProdToWOLines.get(oil.Order_Product__c)) {
                    String key = woli.WorkOrder.Id + '-' + oil.Survey_Asset_Location__r.Survey_Location__c;
                    Work_Order_Room__c wRoom = woRoomMap.get(key);

                    if (oil.Survey_Asset_Location__r.Survey_Location__c != null && wRoom != null) { //21530 - MD
                        if (woli.Status == QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c){
                            wRoom.Number_of_Products_Serviced__c = wRoom.Number_of_Products_Serviced__c == null ? 1 : wRoom.Number_of_Products_Serviced__c + 1;
                        }
                        wRoom.Number_of_Products_to_be_Serviced__c = wRoom.Number_of_Products_to_be_Serviced__c == null ? 1 : wRoom.Number_of_Products_to_be_Serviced__c + 1;
                    }

                    if (oil.Survey_Asset_Location__r.Survey_Location__c != null && wRoom == null) {
                        wRoom = new Work_Order_Room__c(
                            EID__c = key,
                            Site_Survey__c = woli.WorkOrder.Site_Survey__c,
                            Survey_Location__c = oil.Survey_Asset_Location__r.Survey_Location__c,
                            Work_Order__c = woli.WorkOrder.Id,
                            Building__c = oil.Survey_Asset_Location__r.Survey_Location__r.Building__c,
                            Name = oil.Survey_Asset_Location__r.Survey_Location__r.Name,
                            Floor__c = oil.Survey_Asset_Location__r.Survey_Location__r.Floor__c,
                            Location__c = oil.Survey_Asset_Location__r.Survey_Location__r.Location__c,
                            Location_SubType__c = oil.Survey_Asset_Location__r.Survey_Location__r.Location_SubType__c,
                            Location_Type__c = oil.Survey_Asset_Location__r.Survey_Location__r.Location_Type__c,
                            Suite_Number__c = oil.Survey_Asset_Location__r.Survey_Location__r.Suite_Number__c,
                            Location_Notes__c = oil.Survey_Asset_Location__r.Survey_Location__r.Notes__c,
                            Unit_Number__c = oil.Survey_Asset_Location__r.Survey_Location__r.Unit_Number__c, //case 21530
                            Service_Order__c = oil.Survey_Asset_Location__r.Survey_Location__r.Service_Order__c, //case 21530
                            Status__c='In Progress',
                            Number_of_Rooms__c = oil.Survey_Asset_Location__r.Survey_Location__r.Number_of_Rooms__c //case 21618 [dk]
                        );

                        if (woli.WorkOrder.Type__c == QueryUtils.fieldServiceSettings.Label_for_Install_Work_Order_Type__c
                                || woli.WorkOrder.Type__c == QueryUtils.fieldServiceSettings.Label_for_Replace_Work_Order_Type__c
                                || woli.WorkOrder.Type__c == QueryUtils.fieldServiceSettings.DeInstall_Work_Order_Type__c)
                        {
                            wRoom.Installation_Notes__c = oil.Survey_Asset_Location__r.Survey_Location__r.Installation_Notes__c;
                        }

                        if (woli.WorkOrder.Type__c == QueryUtils.fieldServiceSettings.Label_for_Service_Work_Order_Type__c) {
                            wRoom.Service_Notes__c = oil.Survey_Asset_Location__r.Survey_Location__r.Service_Notes__c;
                        }

                        if (woli.Status == QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c) { //21530 - MD
                            wRoom.Number_of_Products_Serviced__c = wRoom.Number_of_Products_Serviced__c == null ? 1 : wRoom.Number_of_Products_Serviced__c + 1;
                        }

                        wRoom.Number_of_Products_to_be_Serviced__c = wRoom.Number_of_Products_to_be_Serviced__c == null ? 1 : wRoom.Number_of_Products_to_be_Serviced__c + 1;
                        woRoomMap.put(key, wRoom);
                    }
                }
            }

            List<Batch_Errors__c> tErrorsList = new List<Batch_Errors__c>();
            
            System.debug('--WoRoom--' + woRoomMap.size());
            if (!woRoomMap.isEmpty()) {
                for (String t : woRoomMap.keySet()) {
                    if (woRoomMap.get(t).Survey_Location__c == null) {
                        woRoomMap.remove(t);
                    }
                }
                
                Schema.DescribeFieldResult EID = Work_Order_Room__c.EID__c.getDescribe();
				Schema.sObjectField TEID = EID.getSObjectField();
                
                Database.upsertResult[] upsertRooms = Database.upsert(woRoomMap.values(),TEID,false);
                for(Integer i=0;i<upsertRooms.size();i++){
                    if(!upsertRooms[i].isSuccess()){
                        String errors = '';
                        for(Database.Error err : upsertRooms[i].getErrors()) {
                            errors = errors + err.getMessage();
                        }
                        System.debug('#FAILED ROOM UPSERTS#' + errors);
                        
                        Work_Order_Room__c wor = woRoomMap.values()[i];
                        
                        tErrorsList.add(new Batch_Errors__c(
                            Name = String.valueOf(System.today()) + '-' + wor.Work_Order__c,
                            Error_Messages__c = errors,
                            Failed_Batch__c = 'SpawnWorkOrderRooms'
                        ));
                    }
                }
            }
            System.debug('--Upsert Complete--' + woRoomMap.size());
            
            //brought back to link the WOLI to the WOL - Drew Jan 3, 2019
            for (Order_Item_Location__c oil : queriedLocation.values()) {
                for (WorkOrderLineItem woli : ordProdToWOLines.get(oil.Order_Product__c)) {
                    String key = woli.WorkOrder.Id + '-' + oil.Survey_Asset_Location__r.Survey_Location__c;
                    Work_Order_Room__c wRoom = woRoomMap.get(key);
                    
                    if (wRoom != null) {
                        woliMap.get(woli.Id).Work_Order_Location__c = wRoom.Id;
                    }
                }
            }
            
            Database.SaveResult[] updateWOLISR = Database.update(woliMap.values(), false);

            for (Integer i = 0; i < updateWOLISR.size(); i++) {
                if (!updateWOLISR[i].isSuccess()) { //only look at failures, or NOT Successes
                    String errors = '';

                    for (Database.Error err : updateWOLISR[i].getErrors()) {
                        errors = errors + err.getMessage();
                    }

                    WorkOrderLineItem woli = woliMap.values()[i];

                    tErrorsList.add(new Batch_Errors__c(
                        Name = String.valueOf(System.today()),
                        Error_Messages__c = errors,
                        OrderId__c = woli.OrderId, 
                        OrderProductId__c = woli.Order_Product__c, 
                        Failed_Batch__c = 'SpawnWorkOrderRooms'
                    ));
                }
            }

            insert tErrorsList;
        }
        
        if (EXECUTE_WORK_ORDER_LOCATION_CLEANUP) {
            System.debug('--Clear Locations--');
            cleanWorkOrderLocations(prsworkOrderIds);
        }
    }
    
    global void finish(Database.BatchableContext bc) {
        //if EXECUTE_WORK_ORDER_LOCATION_CLEANUP is true, this is executed from multi-res app so don't execute the next batch in the chain
        if (!Test.isRunningTest() && !EXECUTE_WORK_ORDER_LOCATION_CLEANUP) {
            System.debug('--PASS TIME FRAME--' + startDT + '--' + endDT);
            if(!IS_DATE_FILTER){Database.executeBatch(new SpawnServiceAppointments(),50);}
            if(IS_DATE_FILTER){Database.executeBatch(new SpawnServiceAppointments(startDT,endDT),50);}
        }
    }
    
    /**
     * Finds any Work_Order_Room__c records that have no Work Order Line Items and deletes the records
     * 
     * @param workOrderIds  the Work Order Id's to filter the query
     */ 
    private static void cleanWorkOrderLocations(Set<Id> cleanworkOrderIds) {
        List<Work_Order_Room__c> wolsToDelete = new List<Work_Order_Room__c>();

        List<Work_Order_Room__c> wols = [
                SELECT Id,
                        (SELECT Id FROM Work_Order_Line_Items__r)
                FROM Work_Order_Room__c
                WHERE Work_Order__c IN :cleanworkOrderIds
        ];

        for (Work_Order_Room__c wol : wols) {
            if(wol.Work_Order_Line_Items__r.isEmpty()) {
                wolsToDelete.add(wol);
            }
        }
        
        delete wolsToDelete;
    }
}