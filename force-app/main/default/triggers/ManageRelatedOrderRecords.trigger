trigger ManageRelatedOrderRecords on Order (after insert, after update) {
    Field_Service_Settings__c custSetting = Field_Service_Settings__c.getOrgDefaults();
    
    List<Case> billingCases = new List<Case>();
    
    Map<Id, Order> orderMap = new Map<Id, Order>();
    Map<Id, Site_Survey__c> accountSiteSurveyMap = new Map<Id,Site_Survey__c>();
    List<Order> updateOrdersWithoutSurvey = new List<Order>();
    List<Account> updateAccountWithSiteSurvey = new List<Account>();
    
    for(Order o : Trigger.new) {
        if (Trigger.isInsert) {
            if (o.Site_Survey__c==null && !accountSiteSurveyMap.containsKey(o.AccountId)) {
                Site_Survey__c ss = new Site_Survey__c(
                    Account__c=o.AccountId, 
                    Survey_Date__c = System.Today(),
                    Status__c = 'Draft'
                );
                accountSiteSurveyMap.put(o.AccountId, ss);
            }
        } else if (Trigger.isUpdate) {
            Order oldRec = Trigger.oldMap.get(o.Id);
            System.debug('**After Update Trigger Order** ' + o.OrderNumber + ' HasBeenDeactivatedFlag: ' + o.HasBeenDeactivated__c + ' Status: ' + o.Status);
            
            System.debug('**Old Active Order Items Count: **' + oldRec.Active_Order_Items__c + '**Current Active Order Items Count: **' + o.Active_Order_Items__c);
            
            System.debug('**Old Total Monthly Service Price: **' + oldRec.Total_Service_Price__c + '** Current Total Monthly Service Price: **' + o.Total_Service_Price__c);
            System.debug('**Old Total Monthly Installation Price: **' + oldRec.Total_Installation_Price__c + '** Current Total Monthly Installation Price: **' + o.Total_Installation_Price__c);
            System.debug('**Old Total Monthly Purchase Price: **' + oldRec.Total_Purchase_Price__c + '** Current Total Monthly Purchase Price: **' + o.Total_Purchase_Price__c);
            System.debug('**OldTotal Active Items Count: **' + oldRec.Active_Order_Items__c + '** Current Total Active Items Count: **' + o.Active_Order_Items__c);
            
            System.debug('**Old Cached Total Service Price: **' + oldRec.Cached_Total_Service_Price__c + '** Current Cached Total Service Price: **' + o.Cached_Total_Service_Price__c);
            System.debug('**Old Cached Total Installation Price: **' + oldRec.Cached_Total_Installation_Price__c + '** Current Cached Total Installation Price: **' + o.Cached_Total_Installation_Price__c);
            System.debug('**Old Cached Total Purchase Price: **' + oldRec.Cached_Total_Purchase_Price__c + '** Current Cached Total Purchase Price: **' + o.Cached_Total_Purchase_Price__c);
            System.debug('**Old Cached Total Active Items Count: **' + oldRec.Cached_Active_Order_Items_Count__c + '** Current Cached Total Active Items Count: **' + o.Cached_Active_Order_Items_Count__c);
            
            System.debug('**Old Cached Total Monthly Revenue: **' + oldRec.Cached_Total_Monthly_Revenue__c + '**Current Cached Total Monthly Revenue: **' + o.Cached_Total_Monthly_Revenue__c);
            
            Boolean servicePriceChange = o.Cached_Total_Service_Price__c!=o.Total_Service_Price__c /*&& o.Status==custSetting.Order_Active_Stage__c*/ && o.Cached_Total_Service_Price__c!=null;
            Boolean installationPriceChange = o.Cached_Total_Installation_Price__c!=o.Total_Installation_Price__c /*&& o.Status==custSetting.Order_Active_Stage__c*/ && o.Cached_Total_Installation_Price__c!=null;
            Boolean purchasePriceChange = o.Cached_Total_Purchase_Price__c!=o.Total_Purchase_Price__c /*&& o.Status==custSetting.Order_Active_Stage__c*/ && o.Cached_Total_Purchase_Price__c!=null;
            Boolean monthlyRevenueChange = o.Cached_Total_Monthly_Revenue__c!=o.Total_Monthly_Revenue__c /*&& o.Status==custSetting.Order_Active_Stage__c*/ && o.Cached_Total_Monthly_Revenue__c!=null;
            Boolean activeCountChange = o.Cached_Active_Order_Items_Count__c!=o.Active_Order_Items__c /*&& o.Status==custSetting.Order_Active_Stage__c*/ && o.Cached_Active_Order_Items_Count__c!=null;
        
            Boolean duringOrderMerge = o.Prevent_Invoice_Change_Ticket__c || oldRec.Prevent_Invoice_Change_Ticket__c;
            
            if((servicePriceChange || installationPriceChange || purchasePriceChange || activeCountChange || monthlyRevenueChange) && o.Status==custSetting.Order_Active_Stage__c && !o.Emergency__c && !duringOrderMerge) {
                billingCases.add(
                    new Case(
                        Subject = 'Invoice Change for Order: ' + o.OrderNumber, 
                        Type = 'Invoice Adjustment',
                        RecordTypeId = custSetting.Invoice_Information_Case_RecordTypeId__c, 
                        AccountId = o.AccountId, 
                        OwnerId = custSetting.Billing_Team__c,
                        ContactId = o.ShipToContactId == null ? o.BillToContactId : o.ShipToContactId, 
                        Status = 'New', 
                        Order__c = o.Id
                    )
                );
                orderMap.put(o.Id, null);
            }
        }
    }    
    
    if(!billingCases.isEmpty()){
        if (Trigger.isUpdate) {
            System.debug('>>Billing Cases for Order Change');
            System.debug(billingCases);
            upsert billingCases;
            System.debug(orderMap.keySet());
            orderMap = new Map<Id, Order>([SELECT Id, Total_Monthly_Revenue__c, Cached_Total_Monthly_Revenue__c, Status, Cached_Total_Service_Price__c, Total_Service_Price__c, Cached_Total_Installation_Price__c, 
                                           Total_Installation_Price__c, Cached_Total_Purchase_Price__c, Total_Purchase_Price__c, Cached_Active_Order_Items_Count__c, Active_Order_Items__c, RecordTypeId 
                                           FROM Order WHERE Id IN:orderMap.keySet()]);
            for(Order o : orderMap.values()) {
                o.Cached_Total_Service_Price__c = o.Total_Service_Price__c;
                o.Cached_Total_Installation_Price__c = o.Total_Installation_Price__c;
                o.Cached_Total_Purchase_Price__c = o.Total_Purchase_Price__c;
                o.Cached_Active_Order_Items_Count__c = o.Active_Order_Items__c;
                o.Cached_Total_Monthly_Revenue__c = o.Total_Monthly_Revenue__c;
                o.Status = o.RecordTypeId==custSetting.Regular_Order_Record_Type_Id__c ? custSetting.Regular_Order_Draft_Stage__c : custSetting.Shopping_Cart_Order_Draft_Stage__c;
            }
            System.debug(orderMap.values());
            update orderMap.values();
            
            for(Order o : orderMap.values()) {
                o.Status = custSetting.Order_Active_Stage__c;
            }
            System.debug(orderMap.values());
            update orderMap.values();
        }
    }
    
    if(!accountSiteSurveyMap.isEmpty()) {
        upsert accountSiteSurveyMap.values();
        
        for(Order o : Trigger.New){
            Site_Survey__c ss = accountSiteSurveyMap.get(o.AccountId);
            if(ss!=null) {
                updateOrdersWithoutSurvey.add(new Order(Id=o.Id, Site_Survey__c=ss.Id));
                updateAccountWithSiteSurvey.add(new Account(Id=o.AccountId, Site_Survey__c=ss.Id));
            }
        }
        upsert updateOrdersWithoutSurvey;
        upsert updateAccountWithSiteSurvey;
    }
}