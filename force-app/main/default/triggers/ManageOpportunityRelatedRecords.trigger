trigger ManageOpportunityRelatedRecords on Opportunity (after insert, after update) { 

    Field_Service_Settings__c custSetting = Field_Service_Settings__c.getOrgDefaults();
    
    List<Case> cases = new List<Case>();
    List<Order> orders = new List<Order>();
    List<OrderItem> orderItems = new List<OrderItem>();
    List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>(); 
    List<Opportunity> updateOppsWithoutSurvey = new List<Opportunity>();
    List<Account> updateAccountWithSiteSurvey = new List<Account>();
    List<Id> oppCaseCreated = new List<Id>();
    List<Opportunity> updOpp = new List<Opportunity>();
    
    Set<Id> oppIds = new Set<Id>();
    Set<Id> opportunitiesForPriceAdjustment = new Set<Id>();
    Set<Order> existingOrders = new Set<Order>();
    Set<Order> existingActiveOrders = new Set<Order>();
    Set<Order> deactivateOrders = new Set<Order>();
    Set<Opportunity> convertedOpsSet = new Set<Opportunity>();
    
    Map<Id, List<Id>> oppSurveyAssetMap = new Map<Id, List<Id>>();   
    Map<Id, List<OrderItem>> oppOrderItemMap = new Map<Id, List<OrderItem>>(); 
    Map<Id,User> userMap = new Map<Id,User>();
    Map<Id,Contact> contactMap = new Map<Id,Contact>();
    Map<Id, Map<Id, Id>> pbe_pb_p2Map = new Map<Id, Map<Id, Id>>();
    Map<Id, Set<String>> prodFamiliesMap = new Map<Id, Set<String>>();
    Map<Id, Case> oppCaseMap = new Map<Id, Case>();
    Map<Id, Site_Survey__c> accountSiteSurveyMap = new Map<Id, Site_Survey__c>();
    
    for (Opportunity op : Trigger.new) {
        Opportunity oldRec = (Trigger.isInsert ? new Opportunity() : Trigger.oldMap.get(op.Id));
        
        if(Trigger.isInsert && op.Site_Survey__c==null && !accountSiteSurveyMap.containsKey(op.AccountId)){
            Site_Survey__c ss = new Site_Survey__c(
                Account__c=op.AccountId, 
                Survey_Date__c = System.Today(),
                Status__c = 'Draft'
            );
            accountSiteSurveyMap.put(op.AccountId, ss);
        }
        
        Boolean isFrequencyChange = op.RecordTypeId==custSetting.Opportunity_RecordType_Frequency_Change__c;
        if(!TriggerHelper.hasRun) {
            TriggerHelper.hasRun = TRUE;
            if(!isFrequencyChange) {
                if (op.StageName == custSetting.Opportunity_To_Order_Creation_Stage_Name__c && op.StageName != oldRec.StageName && !op.IsConverted__c) {
                    oppIds.add(op.Id);
                    convertedOpsSet.add(new Opportunity(Id=op.Id, IsConverted__c = true));
                }
                
                if (op.Case_Created__c && op.StageName == custSetting.Opportunity_Case_Creation_Stage_Name__c && op.StageName != oldRec.StageName){
                    oppCaseCreated.add(op.Id);
                }
            } else if(op.StageName == custSetting.Opportunity_To_Order_Creation_Stage_Name__c && op.StageName != oldRec.StageName && !op.IsConverted__c){
                convertedOpsSet.add(new Opportunity(Id=op.Id, IsConverted__c = true));
            }
            
            Boolean validforCaseCreation = (op.StageName == custSetting.Opportunity_Frequency_Change_Stage_Name__c || op.StageName == custSetting.Opportunity_Case_Creation_Stage_Name__c) && op.StageName != oldRec.StageName && !op.IsConverted__c && !op.Case_Created__c;
            System.debug('-->Opportuntiy: ' + op.Name + ' RType ' + op.RecordTypeId + ' Valid ' + validforCaseCreation);
            if(validforCaseCreation) 
            {
                oppCaseMap.put(op.Id, new Case(
                    Subject =  isFrequencyChange ? op.Name + ' - Awaiting Frequency Change' :  op.Name + ' - Awaiting Survey Approval',
                    RecordTypeId = custSetting.Internal_Data_Review_Case_Record_Type_ID__c,
                    AccountId = op.AccountId,
                    Opportunity__c = op.Id,
                    Site_Survey__c = op.Site_Survey__c, 
                    Type=custSetting.Case_Type_for_Internal_Data_Review__c, 
                    Modify_Existing_Order__c = op.RecordTypeId==custSetting.Opportunity_RecordType_Additional__c, 
                    Modify_Seasonal_Order__c = op.Seasonal_Requirements__c
                ));
                
                updOpp.add(new Opportunity(Case_Created__c = true, Id = op.Id));  
                
            }
        }
    }
   
    
    if(!accountSiteSurveyMap.isEmpty()) {
        upsert accountSiteSurveyMap.values();
        
        for(Opportunity op : Trigger.new){
            Site_Survey__c ss = accountSiteSurveyMap.get(op.AccountId);
            if(ss!=null) {
                updateOppsWithoutSurvey.add(new Opportunity(Id=op.Id, Site_Survey__c=ss.Id));
                updateAccountWithSiteSurvey.add(new Account(Id=op.AccountId, Site_Survey__c=ss.Id));
            }
        }
        upsert updateOppsWithoutSurvey;
        upsert updateAccountWithSiteSurvey;
    }
    
    System.debug('>> Opportunities with Existing Cases: ' + oppCaseCreated);
    
    for (Case c : [Select Id, Status, OwnerId, Opportunity__c From Case Where Opportunity__c=:oppCaseCreated]){
        oppCaseMap.put(c.Opportunity__c, c);
    }  

    Map<Id, Opportunity> oppMapForCase = new Map<Id,Opportunity>([SELECT Id, Name, SyncedQuoteId, SyncedQuote.ContactId, RecordTypeId,
                                                                  (SELECT ContactId FROM OpportunityContactRoles WHERE IsPrimary=TRUE),
                                                                  (SELECT Id, Line_Of_Business__c FROM OpportunityLineItems), 
                                                                  (SELECT Id, ContactId FROM Quotes WHERE Status IN ('Accepted') ORDER BY QuoteNumber DESC LIMIT 1)
                                                                  FROM Opportunity WHERE Id IN :oppCaseMap.keySet()]);
    
    Map<Id,Opportunity> oppMap = new Map<Id,Opportunity>([SELECT Id, Name, AccountId, OwnerId, SyncedQuoteId, SyncedQuote.ContactId, CloseDate, Site_Survey__c, PO_Number__c, PO_Expiry_Date__c, 
                                                          Seasonal_Requirements__c, Description, Community_Contact__c, Community_Contact__r.Email, Community_Contact__r.FirstName,
                                                          Community_Contact__r.LastName, Account.OperatingHours.Timezone, Account.ServicePriceBookId__c, RecordTypeId, Is_Order_to_be_Emergency__c,
                                                          Order__c, Order__r.Id, Order__r.EffectiveDate, Order__r.EndDate, Order__r.Status, Order__r.RecordTypeId, Order__r.OpportunityId,
                                                          (SELECT ContactId FROM OpportunityContactRoles WHERE IsPrimary=TRUE),
                                                          (SELECT Id, Product2Id, PricebookEntryId, Quantity, UnitPrice, Service_Frequency__c, Service_Price_Per_Unit__c, 
                                                           Opportunity.Account.ServicePricebookId__c, OpportunityId, Installation_Price__c, Purchase_Price__c, Description, Category_Description__c, 
                                                           isPurchaseOnly__c, Installation_Status__c, Installation_Notes__c, Service_Notes__c,Related_Product__c FROM OpportunityLineItems), 
                                                          (SELECT Id, ContactId FROM Quotes WHERE Status IN ('Accepted') ORDER BY QuoteNumber DESC LIMIT 1)
                                                           FROM Opportunity WHERE Id IN :oppIds]);
    
    for(Opportunity o : oppMap.values()) {
        Quote oppQuote = (!o.Quotes.isEmpty() ? o.Quotes.get(0) : null);
        
        Id billToContact = (o.OpportunityContactRoles.isEmpty() ? (o.SyncedQuoteId == null ? ((oppQuote == null ? null : oppQuote.ContactId)) : o.SyncedQuote.ContactId) : o.OpportunityContactRoles[0].ContactId);

        if(o.Order__c==null && (o.RecordTypeId==custSetting.Opportunity_RecordType_New__c || o.RecordTypeId==null)) {
            orders.add(new Order(
                Status = 'Draft', 
                OwnerId = o.OwnerId,
                AccountId = o.AccountId,
                Site_Survey__c = o.Site_Survey__c,
                OpportunityId = o.Id,
                Description = o.Description,
                QuoteId = (o.SyncedQuoteId == null ? ((oppQuote == null ? null : oppQuote.Id)) : o.SyncedQuoteId),
                BillToContactId = billToContact,
                ShipToContactId = billToContact,
                Pricebook2Id = (ID)o.Account.ServicePricebookId__c,            
                PoNumber = o.PO_Number__c,
                PoDate = o.PO_Expiry_Date__c,
                Emergency__c = o.Is_Order_to_be_Emergency__c,//21618
                EffectiveDate = o.CloseDate.addDays(Integer.valueOf(custSetting.Order_Start__c))
            ));
        } else if (o.Order__c!=null && o.RecordTypeId==custSetting.Opportunity_RecordType_Additional__c) {
            o.Order__r.OpportunityId = o.Id;
            existingOrders.add(o.Order__r);
            if(o.Order__r.Status==custSetting.Order_Active_Stage__c) {
                
                existingActiveOrders.add(new Order(
                    Id = o.Order__c,
                    Status = custSetting.Order_Active_Stage__c
                ));
                
                deactivateOrders.add(new Order(
                    Id = o.Order__c,
                    Status = o.Order__r.RecordTypeId==custSetting.Regular_Order_Record_Type_Id__c ? custSetting.Regular_Order_Draft_Stage__c : custSetting.Shopping_Cart_Order_Draft_Stage__c
                ));
            }
        }
        
        for(OpportunityLineItem ol : o.OpportunityLineItems) {
            pbe_pb_p2Map.put( ol.Product2Id, new Map<Id,Id>{ (ID)ol.Opportunity.Account.ServicePricebookId__c => null});
            oppSurveyAssetMap.put(ol.Id, null); 
        }
    }
        
    for (Opportunity op : oppMapForCase.values()) {
        Boolean isFrequencyChange = op.RecordTypeId==custSetting.Opportunity_RecordType_Frequency_Change__c;
        
        Quote oppQuote = (!op.Quotes.isEmpty() ? op.Quotes.get(0) : null);
        Id contactId = (op.OpportunityContactRoles.isEmpty() ? (op.SyncedQuoteId == null ? ((oppQuote == null ? null : oppQuote.ContactId)) : op.SyncedQuote.ContactId) : op.OpportunityContactRoles[0].ContactId);
        Set<String> prodFamilies = new Set<String>(); 
        for(OpportunityLineItem ol : op.OpportunityLineItems) {
            prodFamilies.add(ol.Line_of_Business__c);
        }
        Boolean hasPest = prodFamilies.contains('Pest Control');
        System.debug(' Opportunity --> ' + op.Name + ' ProdFamilies --> ' + prodFamilies + ' hasPest --> ' + hasPest);
        List<String> lobList = new List<String>(prodFamilies); 
        Case newCase = oppCaseMap.get(op.Id);
        
        
        newCase.OwnerId = isFrequencyChange ? custSetting.Customer_Service_Queue__c : (hasPest ? custSetting.Pest_Site_Survey_Approval_Queue__c : custSetting.Hygiene_Site_Survey_Approval_Queue__c);        
        newCase.Lines_of_Business__c = String.join(lobList, ';');
        newCase.ContactId = contactId;
        newCase.Status = 'New';
    }
    
    if(!convertedOpsSet.isEmpty()) {
        System.debug('Updating Opportunity with Converted Flag');
        System.debug(convertedOpsSet);
        update new List<Opportunity>(convertedOpsSet);
    }
    
    if (!orders.isEmpty()) {
        insert orders;  
    }
  
    if(!pbe_pb_p2Map.isEmpty()) {
        for(PricebookEntry p : [SELECT Id, Product2Id, Pricebook2Id FROM PricebookEntry WHERE Product2Id IN:pbe_pb_p2Map.keySet()]) {
            pbe_pb_p2Map.get( p.Product2Id).put( p.Pricebook2Id, p.Id);
        }
    }       
    
    if(!oppSurveyAssetMap.isEmpty()){
        for(Survey_Asset_Location__c sa : [SELECT Id, Originating_Record_ID__c FROM Survey_Asset_Location__c WHERE Originating_Record_ID__c IN:oppSurveyAssetMap.keySet()]) {
            if(oppSurveyAssetMap.get(sa.Originating_Record_ID__c) == null) {
                oppSurveyAssetMap.put(sa.Originating_Record_ID__c, new List<Id>{sa.Id});
            } else {
                oppSurveyAssetMap.get(sa.Originating_Record_ID__c).add(sa.Id);
            }
        }
    }
    System.debug(oppSurveyAssetMap);
    
    for(Order record : orders) {
        Opportunity op = oppMap.get(record.OpportunityId);
        if (op != null && op.Seasonal_Requirements__c && op.Order__c==null && (op.RecordTypeId==custSetting.Opportunity_RecordType_New__c || op.RecordTypeId==null)) { 
            cases.add(new Case(
                Subject = op.Name + ' - Create Seasonality',
                OwnerId = custSetting.Internal_Data_Review_Case_Owner__c,
                RecordTypeId = custSetting.Internal_Data_Review_Case_Record_Type_ID__c,
                AccountId = op.AccountId,
                Opportunity__c = op.Id,
                Order__c = record.Id,
                Site_Survey__c = op.Site_Survey__c
            ));
        }
        //record.Status = custSetting.Order_Active_Stage__c; 
        //21618 - before went to active all the time, emergency pest specials need to stay in "Draft"
        record.Status = record.Emergency__c 
            ? custSetting.Regular_Order_Draft_Stage__c 
            : custSetting.Order_Active_Stage__c; 
        
        //Begin:Shashi:10-15-2019:Invoice ticket adjustment:Signal non-creation of ticket
        if(record.Status==custSetting.Order_Active_Stage__c){record.Updated_By__c=BillingTicketData.ISOPP;}
        //End
    }
    
    existingOrders.addAll(orders);
    for(Order record : existingOrders) {
        Opportunity op = oppMap.get(record.OpportunityId);
        for(OpportunityLineItem oli: op.OpportunityLineItems) {
            for(Integer i=0; i<oli.Quantity; i++) {
                OrderItem newItem = new OrderItem(
                    OrderId = record.Id,
                    Active__c = true,
                    Description = oli.Description,
                    PricebookEntryId = pbe_pb_p2Map.get( oli.Product2Id).get( (ID)oli.Opportunity.Account.ServicePricebookId__c),
                    Quantity = 1, 
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
                if(oli.Related_Product__c!=null){newItem.Related_Product__c = oli.Related_Product__c;}
                //End
                
                //custom setting to control if pre-approved or not
                if (custSetting.Activate_Pre_Approved_Pricing_Logic__c && (oli.Service_Price_Per_Unit__c != null || oli.Purchase_Price__c != null)) {
                    newItem.Requested_Price_Approved__c = true;
                    newItem.Requested_Price__c = newItem.Service_Price_Per_Unit__c == null ? oli.Purchase_Price__c : oli.Service_Price_Per_Unit__c;
                }
                
                orderItems.add(newItem); 
                if(!oli.isPurchaseOnly__c){
                    if(oppOrderItemMap.get(oli.Id) == null) {
                        oppOrderItemMap.put(oli.Id, new List<OrderItem>{newItem}); 
                    }else {
                        oppOrderItemMap.get(oli.Id).add(newItem); 
                    }
                } 
            }     
        } 
    }
    
    
    if (!oppCaseMap.values().isEmpty()) {
        cases.addAll(oppCaseMap.values());
    }
    
    if(!cases.isEmpty()) {
       upsert cases;
       System.debug('Case Created/Updated : ' + cases); 
    }
    
    
    if(!updOpp.isEmpty()){
        System.debug('>> Updating Opportunities with Case Indicator ');
        System.debug(updOpp);
        upsert updOpp;
    }
    
    if(!deactivateOrders.isEmpty()) {
        System.debug('Deactivating existing Active Orders');
        upsert new List<Order>(deactivateOrders);
    }
    
    if(!orderItems.isEmpty()) {
        System.debug('orderitems size -- ' + orderItems.size());        
        insert orderItems;
        
        for(Id opItemId : oppOrderItemMap.keySet()) {
            List<OrderItem> orderLines = oppOrderItemMap.get(opItemId);
            List<Id> assetLocations = oppSurveyAssetMap.get(opItemId);
            Integer i = 0;
            if(!assetLocations.isEmpty() && assetLocations!=null) {
                for(OrderItem oi : orderLines) {
                    orderItemLocations.add(new Order_Item_Location__c(
                        Survey_Asset_Location__c = assetLocations[i], 
                        Order_Product__c = oi.Id, 
                        Order__c = oi.OrderId
                    ));
                    System.debug(assetLocations[i]);
                    i++;
                }
            } 
        }
        
        if (!orderItemLocations.isEmpty()) {
            System.debug(' order item locations ' + orderItemLocations);
            insert orderItemLocations; 
        }
        
        if(!existingActiveOrders.isEmpty()) {
            orders.addAll(existingActiveOrders);
        }
        
        if (!orders.isEmpty()) {
            update orders; 
        }
    }
}