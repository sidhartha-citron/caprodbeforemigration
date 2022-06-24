/**
* @FileName: OpportunityCreateRelatedDataWrapper
* @Description: Wrapper class to set fields on Opportunity records
* @Author: Graeme Ward
* @ModificationLog:
*-----------------------------------------------------------
* Author            Date            Modification
* Graeme Ward       3/19/2020       Created
*-----------------------------------------------------------  
*/
public inherited sharing class OpportunityCreateRelatedDataWrapper {
    // Trigger Data
    private List<Opportunity> opportunityRecords;
    private Map<Id, Opportunity> oldMap;
    private OpportunityTriggerDataWrapper dataWrapper;
    
    // DML Data
    private List<Order> orders;
    private Set<Order> deactivateOrders;
    private List<Case> cases;
    private List<OrderItem> orderItems;
    private List<Order_Item_Location__c> orderItemLocations;
    private Set<Order> existingOrders;
    private Set<Order> existingActiveOrders;
    private Map<Id, List<Id>> oppSurveyAssetMap;
    private Map<Id, List<OrderItem>> oppOrderItemMap;
    private Map<Id, Map<Id, Id>> pbe_pb_p2Map;
    
    public OpportunityCreateRelatedDataWrapper(List<Opportunity> opportunityRecords, Map<Id, Opportunity> oldMap, OpportunityTriggerDataWrapper dataWrapper) {
        this.opportunityRecords = opportunityRecords;
        this.oldMap = oldMap;
        this.dataWrapper = dataWrapper;
        
        this.orders = new List<Order>();
        this.cases = new List<Case>();
        this.orderItems = new List<OrderItem>();
        this.orderItemLocations = new List<Order_Item_Location__c>();
        this.existingOrders = new Set<Order>();
        this.existingActiveOrders = new Set<Order>();
        this.deactivateOrders = new Set<Order>();
        this.oppSurveyAssetMap = new Map<Id, List<Id>>();
        this.oppOrderItemMap = new Map<Id, List<OrderItem>>();
        this.pbe_pb_p2Map = new Map<Id, Map<Id, Id>>();
    }
    
    // Controller Methods
    
    public void createOLiOnLeadConversion(List<Opportunity> lstopp) {
        Id priceBkId;
        String oppBundleType = '';
        Id oppId;
        Set<String> pExtIds = new Set<String>();
        Set<String> rpExtIds = new Set<String>();
        map<String, String> mapPtoRp = new map<String, String>();
        map<String, Id> mapOfRptoId = new map<String, Id>();
        map<String, Id> mapOfPptoId = new map<String, Id>();
        Map<String, Decimal> maplprice = new Map<String, Decimal>();
        Map<String, Id> mappbeId = new Map<String, Id>();
        List<OpportunityLineItem> lstoli = new List<OpportunityLineItem>();
        
        for(Opportunity opp: lstopp) {
            priceBkId =  opp.PriceBook2Id;
            oppBundleType = opp.SE_Opportunity_Bundle_Type__c;
            oppId = opp.Id;
        }
        Map<String, BundleProductMap__mdt > mapProdExt = BundleProductMap__mdt.getAll();
        if(oppBundleType !=null && !String.ISBLANK(oppBundleType)) {
            for(String prodext : mapProdExt.keySet()){
                if(mapProdExt.get(prodext).Bundle_Name__c  == oppBundleType) {
                    pExtIds.add(mapProdExt.get(prodext).Product_Ex_Id__c);
                    if(mapProdExt.get(prodext).related_product_ext_id__c !=null) {
                        rpExtIds.add(mapProdExt.get(prodext).related_product_ext_id__c);
                    } 
                    mapPtoRp.put(mapProdExt.get(prodext).Product_Ex_Id__c, mapProdExt.get(prodext).related_product_ext_id__c);
                }
            }
            for(product2 pp: [SELECT Id , ExternalID__c from Product2 Where ExternalID__c IN: rpExtIds]) {
                mapOfRptoId.put(pp.ExternalID__c, pp.Id);
            }
            
            for(PriceBookEntry pd : [SELECT Id, ExternalID__c, UnitPrice , Product2.ExternalID__c, Product2Id, Product2.Id, Product2.Name 
                                     FROM PriceBookEntry WHERE Pricebook2Id =:priceBkId  
                                     AND Product2Id IN (SELECT Id from Product2 Where ExternalID__c IN: mapPtoRp.keyset()) AND isActive = true]) {
                                         mapOfPptoId.put(pd.Product2.ExternalID__c, pd.Product2Id);
                                         mappbeId.put(pd.Product2.ExternalID__c,pd.Id);
                                         maplprice.put(pd.Product2.ExternalID__c, pd.UnitPrice);
                                     }
            
            for(BundleProductMap__mdt mapProdExt1 : mapProdExt.values()) {
                if(mapProdExt1.Bundle_Name__c  == oppBundleType){
                    OpportunityLineItem oli = new OpportunityLineItem();
                    oli.Product2Id = mapOfPptoId.get(mapProdExt1.Product_Ex_Id__c);
                    oli.Quantity = mapProdExt1.Quantity__c;
                    oli.Installation_Price__c = Decimal.valueof(mapProdExt1.installation_price__c);
                    oli.Installation_Status__c = 'Install';
                    oli.Service_Price_Per_Unit__c = maplprice.get(mapProdExt1.Product_Ex_Id__c);
                    oli.PricebookEntryId = mappbeId.get(mapProdExt1.Product_Ex_Id__c);
                    if(mapPtoRp.get(mapProdExt1.Product_Ex_Id__c) != null) {
                        oli.Related_Product__c = mapOfRptoId.get(mapPtoRp.get(mapProdExt1.Product_Ex_Id__c));
                    }
                    oli.Service_Frequency__c = mapProdExt1.service_frequency__c;
                    oli.OpportunityId = oppId;
                    lstoli.add(oli);    
                }
            }
        } 
        try{
            if(lstoli.size() > 0) {
                database.insert(lstoli, false);
            }
        }catch(exception ex){
            system.debug(ex);
            throw new AuraHandledException(ex.getMessage() + ex.getStackTraceString());
        }
    }
    
    public void createRelatedDataAfterUpdate() {
        for (Opportunity opp : opportunityRecords) {
            Opportunity oldRec = oldMap.get(opp.Id);
            
            if (opp.StageName != oldRec.StageName) {
                createOrder(opp.Id);
            }
        }
        
        List<Order> allOrders = new List<Order>(deactivateOrders);
        allOrders.addAll(orders);
        
        TriggerHandler.bypass('ERPOrderPromoteSkip');
        if(allOrders!=null){
            upsert allOrders;    
        }        
        TriggerHandler.clearBypass('ERPOrderPromoteSkip');
        System.debug('Reached create part');
        createSurveyAssetMap();
        createSeasonalCases();
        createOrderItems();
        /*Ice Cube function -- comment out on Feb 22, 2021
queuePromote();
*/
    }
    
    // Helper Methods
    
    private void createOrder(Id oppId) {
        System.debug('In create order');
        Opportunity opp = dataWrapper.opportunityMap.get(oppId);
        
        if (opp.StageName != QueryUtils.fieldServiceSettings.Opportunity_To_Order_Creation_Stage_Name__c)
        {
            
            return;
        }
        
        if (opp.Order__c == null
            && (opp.RecordTypeId == null
                || opp.RecordTypeId == QueryUtils.fieldServiceSettings.Opportunity_RecordType_New__c))
        {
            createNewOrder(opp);
        }
        //Varun 06/22/2020 ICL-1536 : In case of RT opportunity_RecordType_Frequency_Change__c order products will be added to existing orders(3rd RT)
        else if (opp.Order__c != null
                 && (opp.RecordTypeId == QueryUtils.fieldServiceSettings.Opportunity_RecordType_Additional__c || opp.RecordTypeId == QueryUtils.fieldServiceSettings.Opportunity_RecordType_Frequency_Change__c))
        {
            System.debug('In update existing order');
            updateExistingOrders(opp);
        }
        
        for (OpportunityLineItem ol : opp.OpportunityLineItems) {
            pbe_pb_p2Map.put(
                ol.Product2Id,
                new Map<Id, Id>{
                    (Id) ol.Opportunity.Account.ServicePricebookId__c => null
                        }
            );
            
            oppSurveyAssetMap.put(ol.Id, null);
        }
    }
    
    private void createNewOrder(Opportunity opp) {
        Quote oppQuote = !opp.Quotes.isEmpty() ? opp.Quotes.get(0) : null;
        Id billToContactId = OpportunityTriggerHelper.getContactId(opp, oppQuote);
        
        orders.add(new Order(
            Status = 'Draft',
            OwnerId = opp.OwnerId,
            AccountId = opp.AccountId,
            Site_Survey__c = opp.Site_Survey__c,
            OpportunityId = opp.Id,
            Description = opp.Description,
            QuoteId = opp.SyncedQuoteId == null
            ? oppQuote == null
            ? null
            : oppQuote.Id
            : opp.SyncedQuoteId,
            BillToContactId = billToContactId,
            ShipToContactId = billToContactId,
            Pricebook2Id = (Id) opp.Account.ServicePricebookId__c,
            //Invoice_Frequency__c = opp.Account.Invoice_frequency__c, //Ice Cube only- Feb 22nd, 2021
            PoNumber = opp.PO_Number__c,
            PoDate = opp.PO_Expiry_Date__c,
            Emergency__c = opp.Is_Order_to_be_Emergency__c,
            EffectiveDate = opp.CloseDate.addDays(Integer.valueOf(QueryUtils.fieldServiceSettings.Order_Start__c)),
            CPQ2_HC__c = opp.CPQ2_HC__c//CPQCN:570
        ));
    }
    
    private void updateExistingOrders(Opportunity opp) {
        opp.Order__r.OpportunityId = opp.Id;
        
        existingOrders.add(opp.Order__r);
        
        if (opp.Order__r.Status == QueryUtils.fieldServiceSettings.Order_Active_Stage__c) {
            
            existingActiveOrders.add(new Order(
                Id = opp.Order__c,
                Status = QueryUtils.fieldServiceSettings.Order_Active_Stage__c
            ));
            
            deactivateOrders.add(new Order(
                Id = opp.Order__c,
                Status = opp.Order__r.RecordTypeId == QueryUtils.fieldServiceSettings.Regular_Order_Record_Type_Id__c
                ? QueryUtils.fieldServiceSettings.Regular_Order_Draft_Stage__c
                : QueryUtils.fieldServiceSettings.Shopping_Cart_Order_Draft_Stage__c
            ));
        }
    }
    
    private void createSurveyAssetMap() {
        if (!pbe_pb_p2Map.isEmpty()) {
            for (PricebookEntry p : [SELECT Id, Product2Id, Pricebook2Id FROM PricebookEntry WHERE Product2Id IN:pbe_pb_p2Map.keySet()]) {
                pbe_pb_p2Map.get(p.Product2Id).put(p.Pricebook2Id, p.Id);
            }
        }
        
        if (!oppSurveyAssetMap.isEmpty()) {
            for (Survey_Asset_Location__c sa : [SELECT Id, Originating_Record_ID__c FROM Survey_Asset_Location__c WHERE Originating_Record_ID__c IN:oppSurveyAssetMap.keySet()]) {
                if (oppSurveyAssetMap.get(sa.Originating_Record_ID__c) == null) {
                    oppSurveyAssetMap.put(sa.Originating_Record_ID__c, new List<Id>{
                        sa.Id
                            });
                } else {
                    oppSurveyAssetMap.get(sa.Originating_Record_ID__c).add(sa.Id);
                }
            }
        }
    }
    
    private void createSeasonalCases() {
        for (Order o : orders) {
            Opportunity opp = dataWrapper.opportunityMap.get(o.OpportunityId);
            
            if (opp != null
                && opp.Seasonal_Requirements__c
                && opp.Order__c == null
                && (opp.RecordTypeId == QueryUtils.fieldServiceSettings.Opportunity_RecordType_New__c
                    || opp.RecordTypeId == null))
            {
                cases.add(new Case(
                    Subject = opp.Name + ' - Create Seasonality',
                    OwnerId = QueryUtils.fieldServiceSettings.Internal_Data_Review_Case_Owner__c,
                    RecordTypeId = QueryUtils.fieldServiceSettings.Internal_Data_Review_Case_Record_Type_ID__c,
                    AccountId = opp.AccountId,
                    Opportunity__c = opp.Id,
                    Order__c = o.Id,
                    Site_Survey__c = opp.Site_Survey__c
                ));
            }
            
            //21618 - before went to active all the time, emergency pest specials need to stay in "Draft"
            o.Status = o.Emergency__c
                ? QueryUtils.fieldServiceSettings.Regular_Order_Draft_Stage__c
                : QueryUtils.fieldServiceSettings.Order_Active_Stage__c;
            existingOrders.add(o);
            //Begin:Shashi:10-15-2019:Invoice ticket adjustment:Signal non-creation of ticket
            if (o.Status == QueryUtils.fieldServiceSettings.Order_Active_Stage__c) {
                o.Updated_By__c = BillingTicketData.ISOPP;
            }
            //End
        }
        
        insert cases;
    }
    
    private void createOrderItems() {
        for (Order record : existingOrders) {
            createOrderItems(record);
        }
        
        insertLineItemData();
    }
    
    private void createOrderItems(Order record) {
        Opportunity opp = dataWrapper.opportunityMap.get(record.OpportunityId);
        
        for (OpportunityLineItem oli : opp.OpportunityLineItems) {
            if (oli.Product2.isConsumable__c) {
                createNewOrderItem(record, oli);
            }
            else {
                Integer qty = Integer.valueOf(oli.Quantity);
                
                for (Integer i = 0; i < qty; i++) {
                    createNewOrderItem(record, oli);
                }
            }
        }
    }
    
    private void createNewOrderItem(Order record, OpportunityLineItem oli) {
        OrderItem newItem = new OrderItem(
            OrderId = record.Id,
            Active__c = true,
            Description = oli.Description,
            PricebookEntryId = pbe_pb_p2Map.get(oli.Product2Id).get( (Id) oli.Opportunity.Account.ServicePricebookId__c),
            Quantity = oli.Product2.isConsumable__c ? oli.Quantity : 1,
            Frequency__c = oli.Service_Frequency__c,
            Service_Price_Per_Unit__c = oli.Service_Price_Per_Unit__c,
            Installation_Price__c = oli.Installation_Price__c,
            Purchase_Price__c = oli.Purchase_Price__c,
            UnitPrice = oli.UnitPrice,
            ServiceDate = record.EffectiveDate,
            EndDate = record.EndDate,
            HasSurveyAssets__c = true,
            Installation_Status__c = oli.Installation_Status__c,
            SurveyAssetCountChecker__c = 1,
            Installation_Notes__c = oli.Installation_Notes__c,
            Service_Notes__c = oli.Service_Notes__c
        );
        
        //Begin:Shashi:8-8-2019:Copy related produts from opportunity line item to order product
        //Included Related_Product__c field in opportunity line item query
        if (oli.Related_Product__c != null) {
            newItem.Related_Product__c = oli.Related_Product__c;
        }
        //End
        //custom setting to control if pre-approved or not
        /*if (QueryUtils.fieldServiceSettings.Activate_Pre_Approved_Pricing_Logic__c && (oli.Service_Price_Per_Unit__c != null || oli.Purchase_Price__c != null)) {
newItem.Requested_Price_Approved__c = true;
newItem.Requested_Price__c = newItem.Service_Price_Per_Unit__c == null ? oli.Purchase_Price__c : oli.Service_Price_Per_Unit__c;
}*/
        
        orderItems.add(newItem);
        
        if (!oli.isPurchaseOnly__c) {
            if (oppOrderItemMap.get(oli.Id) == null) {
                oppOrderItemMap.put(oli.Id, new List<OrderItem>{
                    newItem
                        });
            } else {
                oppOrderItemMap.get(oli.Id).add(newItem);
            }
        }
    }
    
    private void insertLineItemData() {
        if (orderItems.isEmpty()) return;
        
        TriggerHandler.bypass('ERPOrderPromoteSkip');
        insert orderItems;
        for (Id opItemId : oppOrderItemMap.keySet()) {
            List<Id> assetLocations = oppSurveyAssetMap.get(opItemId);
            if (assetLocations == null) continue;
            
            List<OrderItem> orderLines = oppOrderItemMap.get(opItemId);
            
            for (Integer i = 0; i < orderLines.size(); i++) {
                orderItemLocations.add(
                    new Order_Item_Location__c(
                        Survey_Asset_Location__c = assetLocations[i],
                        Order_Product__c = orderLines[i].Id,
                        Order__c = orderLines[i].OrderId
                    )
                );
            }
        }
        
        insert orderItemLocations;
        
        orders.addAll(existingActiveOrders);
        System.debug('OpportunityTriggerHandler before updateOrders soql limit : ' + Limits.getQueries());
        //Varun: 05/03/2020 ICL-1314
        //Shashi: Critical Piece of code removing this will cause SOQL LIMIT ERRORS
        TriggerHandler.bypass('OrderTriggerHandler');
        update orders;
        TriggerHandler.clearBypass('OrderTriggerHandler');
        TriggerHandler.clearBypass('ERPOrderPromoteSkip');
        
        System.debug('OpportunityTriggerHandler before updateOrders soql limit : ' + Limits.getQueries());
        
    }
    
    /*ICL-1337 - comment out on Feb 22nd, 2021
private void queuePromote(){
if(ApexUtils.shipToRecords.size()>0 && ApexUtils.billToRecords.size()>0){
System.enqueueJob(new PromoteCustomer(ApexUtils.billToRecords,ApexUtils.shipToRecords,ApexUtils.erprecords)); 
}
}*/
}