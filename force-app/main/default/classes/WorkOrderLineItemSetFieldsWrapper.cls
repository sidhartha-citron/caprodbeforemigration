/**
 * @FileName: WorkOrderLineItemSetFieldsWrapper
 * @Description: Wrapper class to set work order line item fields
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       2/9/2020         Created
 *-----------------------------------------------------------  
 */
public inherited sharing class WorkOrderLineItemSetFieldsWrapper {
    /**Before Insert, Update Variables**/
    private List<WorkOrderLineItem> lineItems;
    private Map<Id,WorkOrderLineItem> oldMap;
    private Map<Id, WorkOrder> woMap = new Map < Id, WorkOrder > ();
    private Map<Id, PricebookEntry> pricebookEntryMap = new Map < Id, PricebookEntry > ();
    private Map<String, Asset> existingBarCodeMap = new Map < String, Asset > ();
    private Map<Id, Asset> assetMap = new Map < Id, Asset > ();
    private Map<Id, OrderItem> orderItemMap = new Map < Id, OrderItem > ();
    
    /**After Insert, Update, Delete Variables**/
    public Integer conditionCheck = 0;
    
    public Set<Id> workOrderLocationIds = new Set<Id>();
    public Set<Id> woliAssetIds = new Set<Id>();
    public Set<Id> scannedOutAssetIds = new Set<Id>();
    private Set<Id> orderItemDeleteList = new Set<Id>();
    private Set<Id> orderIds = new Set<Id>();
    //21618 variables
    public Set<Id> cannotCompleteWOLIIds = new Set<Id>();
    public Set<Id> pestCommercialPriceChangeWOLIIds = new Set<Id>();
    
    private List<Order> orders = new List<Order>();
    private List<OrderItem> itemsToDeactivate = new List<OrderItem>();
    public List<Id> futureRooms = new List<Id>();
    public List<Id> futureWolis = new List<Id>();
    
    private Map<Id, Id> orderItemAssetMap = new Map<Id, Id>();
    
	public WorkOrderLineItemSetFieldsWrapper(){
        
    }
    
    public WorkOrderLineItemSetFieldsWrapper(List<WorkOrderLineItem> lineItems) {
        this(lineItems, null);
    }

    public WorkOrderLineItemSetFieldsWrapper(List<WorkOrderLineItem> lineItems, Map<Id,WorkOrderLineItem> oldMap) {
        this.lineItems = lineItems;
        this.oldMap = oldMap;
        this.woMap = new Map<Id, WorkOrder>();
        this.assetMap = new Map<Id, Asset>();
        this.existingBarCodeMap = new Map<String, Asset>();
        this.orderItemMap = new Map<Id, OrderItem>();
        this.pricebookEntryMap = new Map<Id, PricebookEntry>();
        
        setMapKeys();
        setMapValues();
        setLineItemFields();
    }

    private void setMapKeys() {
        for (WorkOrderLineItem li : lineItems) {
            WorkOrderLineItem oldRec;
            
            if(oldMap != null) {
                oldRec = oldMap.get(li.Id);
            }
            else {
                oldRec = new WorkOrderLineItem();
                //Set full exchange value
                li.isFullExchange__c = li.isFullExchangeProductCode__c;
            }
            
            //set values for Asset
            if (li.New_Asset_Bar_Code__c != null && li.New_Asset_Bar_Code__c != oldRec.New_Asset_Bar_Code__c) {
                existingBarCodeMap.put(li.New_Asset_Bar_Code__c, null);
                assetMap.put(li.Id, new Asset(
                    InstallDate = System.today(),
                    Status = QueryUtils.fieldServiceSettings.Scanned_In_Status__c,
                    Bar_Code__c = li.New_Asset_Bar_Code__c
                ));
            }
            
            //Add work order id to map if line item address is null
            if (li.Address == null) {
                woMap.put(li.WorkOrderId, null);
            }
            
            if ((li.Line_Item_Description__c == null || li.Product__c == null) && li.PricebookEntryId != null) {
                pricebookEntryMap.put(li.PricebookEntryId, null);
            }
            
            if (li.Order_Product__c != null) {
                orderItemMap.put(li.Order_Product__c, null);
            }
        }
    }

    private void setMapValues() {
        createPricebookEntryMap();
        createExistingBarCodeMap();
        createAssetMap();
        createOrderItemMap();
    }

    private void createPricebookEntryMap() {
        //Add Pricebook entries where map holds a value
        if (!pricebookEntryMap.isEmpty()) {
            pricebookEntryMap = new Map<Id,PricebookEntry>([
                    SELECT Id, Product2Id, Product2.Product_Description_Rich_Text__c
                    FROM PricebookEntry
                    WHERE Id IN :pricebookEntryMap.keySet()
            ]);
        }
    }

    private void createExistingBarCodeMap() {
        //Add Existing bar codes where map holds a value
        if (!existingBarCodeMap.isEmpty()) {
            List<Asset> assets = [SELECT Id, Bar_Code__c FROM Asset WHERE Bar_Code__c IN :existingBarCodeMap.keySet()];

            for (Asset a : assets) {
                existingBarCodeMap.put(a.Bar_Code__c, a);
            }
        }
    }

    private void createAssetMap() {
        if (!assetMap.isEmpty()) {
            List<WorkOrderLineItem> wolis = [
                    SELECT Id, WorkOrder.AccountId, PricebookEntry.Product2Id, PricebookEntry.Product2.Name,
                            WorkOrder.Site_Survey__c, Work_Order_Location__c, Work_Order_Location__r.Survey_Location__c
                    FROM WorkOrderLineItem
                    WHERE Id IN:assetMap.keySet()
            ];

            for (WorkOrderLineItem woli : wolis) {
                Asset ast = assetMap.remove(woli.Id);

                if (existingBarCodeMap.get(ast.Bar_Code__c) == null) {
                    ast.AccountId = woli.WorkOrder.AccountId;
                    ast.Name = woli.PricebookEntry.Product2.Name;
                    ast.Product2Id = woli.PricebookEntry.Product2Id;
                    ast.Site_Survey__c = woli.WorkOrder.Site_Survey__c;
                    ast.Survey_Location__c = woli.Work_Order_Location__r.Survey_Location__c;
                    ast.Work_Order_Location__c = woli.Work_Order_Location__c;
                    assetMap.put(woli.Id, ast);
                }
            }
        }

        if (!assetMap.isEmpty()) {
            System.debug('--Inserting Assets--');
            insert assetMap.values();
        }
    }

    private void createOrderItemMap() {
        if (!orderItemMap.isEmpty()) {
            List<OrderItem> items = [
                    SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id,
                            PricebookEntry.Product2.Product_Description_Rich_Text__c, Service_Price_Per_Unit__c,
                            Purchase_Price__c, Installation_Price__c
                    FROM OrderItem
                    WHERE Id IN :orderItemMap.keySet()
            ];

            for (OrderItem o : items) {
                orderItemMap.put(o.Id, o);
            }
        }
    }

    private void setLineItemFields() {
        List<WorkOrder> wos = [
                SELECT Id, Suite_Number__c, Street, City, State, PostalCode, Country
                FROM WorkOrder
                WHERE Id IN:woMap.keySet()
        ];

        for (WorkOrder wo : wos) {
            woMap.put(wo.Id, wo);
        }

        for (WorkOrderLineItem li : lineItems) {
            setFields(li);
        }
    }
    
    private void setFields(WorkOrderLineItem li) {
        WorkOrderLineItem oldRec;

        if(oldMap != null) {oldRec = oldMap.get(li.Id);}
        else{oldRec = new WorkOrderLineItem();}

        if (li.New_Asset_Bar_Code__c != null
                && li.New_Asset_Bar_Code__c == oldRec.New_Asset_Bar_Code__c
                && assetMap.get(li.Id) != null)
        {
            li.New_Asset_Bar_Code__c = null;
        }

        PricebookEntry p = pricebookEntryMap.get(li.PricebookEntryId);

        if ((li.Line_Item_Description__c == null || li.Product__c == null) && p != null) {
            li.Line_Item_Description__c = p.Product2.Product_Description_Rich_Text__c;
            li.Product__c = p.Product2Id;
        }

        OrderItem o = orderItemMap.get(li.Order_Product__c);

        if (oldMap == null && o != null) {
            li.Service_Price_Per_Unit__c = o.Service_Price_Per_Unit__c;
            li.Purchase_Price__c = o.Purchase_Price__c;
            li.Installation_Price__c = o.Installation_Price__c;
        }

        if (li.OrderId == null && li.Order_Product__c != null && o != null) {
            li.OrderId = o.OrderId;
        }

        if (li.Address == null) {
            WorkOrder wo = woMap.get(li.WorkOrderId);
            li.Suite_Number__c = wo.Suite_Number__c;
            li.Street = wo.Street;
            li.City = wo.City;
            li.State = wo.State;
            li.PostalCode = wo.PostalCode;
            li.Country = wo.Country;
        }
    }
    
    public void prepManageWOLI(List<WorkOrderLineItem> lineItems, Map<Id,WorkOrderLineItem> oldMap){
        for (WorkOrderLineItem woli : lineItems) {
            WorkOrderLineItem oldRec;
            
            if(oldMap == null) {oldRec = new WorkOrderLineItem();}
            else {oldRec = oldMap.get(woli.Id);}
            
            if (woli.Work_Order_Location__c != null) { //21530 - MD
                
                if (oldMap != null) {
                    if (woli.Status == 'Completed' && oldRec.Status != 'Completed') {
                        conditionCheck = 1;
                    } else if (woli.Status != 'Completed' && oldRec.Status == 'Completed') {
                        conditionCheck = 2;
                    }
                }
                
                futureRooms.add(woli.Work_Order_Location__c);
                futureWolis.add(woli.Id);
            }
            
            if (woli.Work_Order_Location__c != oldRec.Work_Order_Location__c) {
                workOrderLocationIds.add(woli.Work_Order_Location__c);
                workOrderLocationIds.add(oldRec.Work_Order_Location__c);
            } else if (woli.Related_Product__c != oldRec.Related_Product__c || 
                       woli.Product__c!=oldRec.Product__c || 
                       woli.Quantity != oldRec.Quantity) {
                           workOrderLocationIds.add(woli.Work_Order_Location__c);
            }
            
            //build map for deactivating order items on cannot complete, 21618 [dk], Feb 11, 2019
            if (woli.Status != oldRec.Status && 
                woli.Status == QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c) {
                    cannotCompleteWOLIIds.add(woli.Id);
            }
            //21618
            if (woli.Product_Service_Price_Per_Unit__c != null && 
                woli.Product_Service_Price_Per_Unit__c != oldRec.Product_Service_Price_Per_Unit__c) {
                    pestCommercialPriceChangeWOLIIds.add(woli.Id);
            }
            
            if(oldMap != null){
                orderItemAssetMap.put(woli.Order_Product__c, woli.AssetId);
                Boolean isOrderItemDelete = woli.Status==QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c && 
                                            woli.Type_of_Service__c==QueryUtils.fieldServiceSettings.DeInstall_Work_Order_Type__c && 
                                            oldRec.Status!=woli.Status;
                if (isOrderItemDelete) {woliAssetIds.add(woli.AssetId);} //AD : QUERY CLEANUP
            }
        }
        
        getScannedOutAssets();
    }
    
    private void getScannedOutAssets(){
        if(woliAssetIds.size()>0){
            for (Asset a : [SELECT Id, Status 
                            FROM Asset 
                            WHERE Id IN :woliAssetIds AND 
                                     Status=:QueryUtils.fieldServiceSettings.Scanned_Out_Status__c]) {
                scannedOutAssetIds.add(a.Id);
            } //AD : QUERY CLEANUP
        }
    }
    
    public void deactiveOrderItems(List<WorkOrderLineItem> lineItems, Map<Id,WorkOrderLineItem> oldMap){
        for (WorkOrderLineItem li : lineItems) {
             WorkOrderLineItem oldRec = oldMap.get(li.Id);
             Boolean isOrderItemDelete = li.Status==QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c && 
                                         li.Type_of_Service__c==QueryUtils.fieldServiceSettings.DeInstall_Work_Order_Type__c && 
                                         oldRec.Status!=li.Status;

            if (isOrderItemDelete && scannedOutAssetIds.contains(li.AssetId)) {
                System.debug('Deleting deinstall order products in work order line item trigger' + scannedOutAssetIds + isOrderItemDelete);
                orderItemDeleteList.add(li.Order_Product__c);
            }
         
            orderIds.add(li.OrderId);
        }
            
        for (Order o : [SELECT Id, Status, RecordTypeId FROM Order WHERE Id IN:orderIds AND Status=:QueryUtils.fieldServiceSettings.Order_Active_Stage__c]) {
            		o.Status = o.RecordTypeId==QueryUtils.fieldServiceSettings.Regular_Order_Record_Type_Id__c ? QueryUtils.fieldServiceSettings.Regular_Order_Draft_Stage__c : QueryUtils.fieldServiceSettings.Shopping_Cart_Order_Draft_Stage__c;
            orders.add(o);
        }
        
        //Shashi:03-24-2020: Do not set the status back on batch and integration runs
        if(UserInfo.getProfileId()!=QueryUtils.fieldServiceSettings.System_Administrator_Profile_Id__c && 
           UserInfo.getProfileId()!=QueryUtils.fieldServiceSettings.Integration_User_Profile__c){
            TriggerHandler.bypass('OrderTriggerHandler');
        	update orders;
            TriggerHandler.clearBypass('OrderTriggerHandler');
        }
        
        //20210809 Darcy: WorkOrderFutureCalls has this Active__c update too. Moving Asset_c update there
        //deactivating order items from a deinstallation
        // if (!orderItemDeleteList.isEmpty()) {
        //     for (OrderItem oi : [SELECT Id, Installation_Status__c, Order.Season_Start_Date__c, Order.Season_End_Date__c, Active__c FROM OrderItem WHERE Id IN :orderItemDeleteList 
        //                          AND Installation_Status__c=:QueryUtils.fieldServiceSettings.Scanned_Out_Status__c AND Order.Season_Start_Date__c=NULL AND Order.Season_End_Date__c=NULL]) 
        //     {
        //         oi.Active__c = false;
        //         oi.Asset__c = null;//case 21627
        //         itemsToDeactivate.add(oi);
        //     }
            
        //     System.debug('**Order Items to be Deactivated**');
        //     //System.debug(itemsToDeactivate);
        //     if(itemsToDeactivate.size()>0){update itemsToDeactivate;}
        // }
        
        //everything else
        if (!orderItemAssetMap.isEmpty()) {
            Map<Id, OrderItem> oisToUpdate = new Map<Id, OrderItem>();
            
            for (OrderItem oi : [SELECT Id, Last_Scanned_Date__c, Order.OrderNumber, Asset__c FROM OrderItem WHERE Id IN :orderItemAssetMap.keySet() AND Active__c=TRUE]) {
                oi.Asset__c = orderItemAssetMap.get(oi.Id);
                oi.Last_Scanned_Date__c = System.today();
                oisToUpdate.put(oi.Id, oi);
            }
            System.debug('**Order Items update Asset and Last Scanned Date**');
            if (!oisToUpdate.isEmpty()) {
                update oisToUpdate.values();
            }
        }
         
        for (Order o : orders) {
            o.Status = QueryUtils.fieldServiceSettings.Order_Active_Stage__c;
        }
        
        //Shashi:03-24-2020: Do not set the status back on batch and integration runs
        if(UserInfo.getProfileId()!=QueryUtils.fieldServiceSettings.System_Administrator_Profile_Id__c && 
           UserInfo.getProfileId()!=QueryUtils.fieldServiceSettings.Integration_User_Profile__c){
            TriggerHandler.bypass('OrderTriggerHandler');
        	update orders;
            TriggerHandler.clearBypass('OrderTriggerHandler');
        }
    }
    
    public void WORoomUpdates(){
        if (!workOrderLocationIds.isEmpty()) {
            List<Work_Order_Room__c> roomUpdates = new List<Work_Order_Room__c>();
            Map<Id, Work_Order_Room__c> workOrderRoomMap = new Map<Id, Work_Order_Room__c>([SELECT Id, Notes__c FROM Work_Order_Room__c WHERE Id IN :workOrderLocationIds]);
            Map<Id, Map<String, Map<String,Integer>>> workOrderNotes = new Map<Id, Map<String, Map<String,Integer>>>();
            
            for (WorkOrderLineItem woli : [SELECT Id, Product__r.Name, Related_Product__r.Name, Quantity, Work_Order_Location__c, Work_Order_Location__r.Notes__c, 
                                            Work_Order_Location__r.Id, Product_Description_Translated__c
                                           FROM WorkOrderLineItem WHERE Work_Order_Location__c!=NULL AND Work_Order_Location__c IN :workOrderLocationIds])
            {
                Map<String, Map<String,Integer>> relProdMap = workOrderNotes.get(woli.Work_Order_Location__c) == null ? new Map<String, Map<String,Integer>>() : workOrderNotes.get(woli.Work_Order_Location__c);
                Map<String, Integer> prodMap;
                
                Work_Order_Room__c wRoom = woli.Work_Order_Location__r;
                
                if (woli.Related_Product__r.Name!=null) {                  
                    prodMap = relProdMap.get(woli.Related_Product__r.Name)== null ? new Map<String,Integer>() : relProdMap.get(woli.Related_Product__r.Name);
                } else {
                    prodMap = relProdMap.get('NoRelatedProduct') == null ? new Map<String, Integer>() : relProdMap.get('NoRelatedProduct');
                }
                
                Integer quantity = woli.Quantity == null ? 0 : (Integer) ( woli.Quantity ) ; 
                    
                prodMap.put(woli.Product_Description_Translated__c, prodMap.get(woli.Product_Description_Translated__c) == null ? quantity : prodMap.get(woli.Product_Description_Translated__c) + quantity);

                relProdMap.put(woli.Related_Product__r.Name!=null ? woli.Related_Product__r.Name : 'NoRelatedProduct', prodMap);   
                
                workOrderNotes.put(woli.Work_Order_Location__c, relProdMap);
                workOrderRoomMap.put(woli.Work_Order_Location__c, wRoom);
            }
            
            for (Work_Order_Room__c wor : workOrderRoomMap.values()) {
                Map<String, Map<String,Integer>> relProdMap = workOrderNotes.get(wor.Id);
                String noteString = '';
                
                if (relProdMap!=null) {
                    for (String rp : relProdMap.keyset()) {
                        Map<String, Integer> prodMap = relProdMap.get(rp);
                        String relatedProductName = (rp == 'NoRelatedProduct' ? '' : ' ( ' + rp + ' )' );
                        
                        for (String p : prodMap.keySet()) {
                            noteString += '\n' + p + relatedProductName + ' x ' + prodMap.get(p);                    
                        }
                    }
                    
                    if (noteString.trim() != wor.Notes__c) {
                        roomUpdates.add(new Work_Order_Room__c(Id=wor.Id,Notes__c=noteString));
                    }
                }
            }
            
            if (!roomUpdates.isEmpty()) {
                System.debug('--WO Rooms to Update--');
                update roomUpdates;
            }
        }
    }
    
    public void getWOLOConDelete(List<WorkOrderLineItem> oldList){
        for (WorkOrderLineItem woli : oldList) {
             workOrderLocationIds.add(woli.Work_Order_Location__c);
        }
    }
}