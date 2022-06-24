@isTest
private class TestOrderProductHistoryCntl {
    
    @TestSetup 
    static void dataSetup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        TestDataFactory.crtCPQSettings();
        TestDataFactory.crtBillToAcctContact(1, 0); 
        Account a = TestDataFactory.accounts[0];

        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        insert ss;
        
        Survey_Location__c location = new Survey_Location__c(
            Site_Survey__c=ss.Id, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Name='Location'
        );
        insert location;
        
        a.Site_Survey__c = ss.Id;
        update a;
        
        Test.startTest();
        
        Order o = new Order(
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
            RecordTypeId=devRecordTypeId
        ); 
        insert o;
        system.debug('Test order id:' + o.Id);
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==0) ? 'Hygiene' : 'Pest Control', 
                    Item_Type__c= (i==0) ? 'Consumables' : 'Service',
                    ExternalId__c = '3-55-7-02-1' + i
                )       
            );
        }
        
        insert products;
        
        for(Integer i=0; i<5; i++) {
            pEntries.add(
                new PricebookEntry(
                    Pricebook2Id=pBook, 
                    Product2Id=products.get(i).Id, 
                    UnitPrice=1.0, 
                    IsActive=TRUE
                )
            );
        }
        insert pEntries; 
        
        for(Integer i=0; i<3; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=TRUE
                )
            );
        } 
        
        orderItems.add(
            new OrderItem(
                Product2Id=pEntries.get(2).Id,  
                Frequency__c=frequencies.get(0), 
                UnitPrice=1.0, 
                Purchase_Price__c=1.0, 
                Quantity=1, 
                OrderId=o.Id
            )
        );
        
        insert orderItems;
        
        Test.stopTest();
        
        for(Integer i=0; i<3; i++) {
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=o.Id,  
                    Originating_Record_ID__c=orderItems.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=o.Site_Survey__c, 
                    Service_Frequency__c=orderItems.get(i).Frequency__c, 
                    Survey_Location__c = location.Id
                )
            );
        } 
        insert surveyAssetLocations;
        
        for(Integer i=0; i<3; i++) {
            orderItems.get(i).HasSurveyAssets__c=true;
            orderItemLocations.add(
                new Order_Item_Location__c(
                    Order__c=o.Id,  
                    Order_Product__c=orderItems.get(i).Id, 
                    Survey_Asset_Location__c=surveyAssetLocations.get(i).Id
                )
            );
        }
        
        insert orderItemLocations;
        
        for(OrderItem oi : orderItems) {
            oi.quantity = 2;
        }
        update orderItems; 
    }
    
    @isTest 
    static void test_getOrderProductHistory() { 
        Test.startTest();
        
        Order o = [select Id from Order where EffectiveDate = :system.today()  and Status='Draft' limit 1];
        system.debug('Retreived order id:' + o.Id);
        
        List<OrderItem> listOrderItem  = [select Id, quantity, UnitPrice from OrderItem where OrderId = :o.Id];
        List<OrderItem> itemsToUpdate = new List<OrderItem>();
        List<OrderItemHistory> forcingHistoryToWork = new List<OrderItemHistory>();
        system.debug('listOrderItem>>>' + listOrderItem);

        for(OrderItem oi : listOrderItem) {
            OrderItem item = new OrderItem(Id=oi.id);
            item.UnitPrice = 999.99;
            itemsToUpdate.add(item);
            
            OrderItemHistory things = new OrderItemHistory();
            things.OrderItemId = oi.Id;
            things.Field = 'UnitPrice';
            forcingHistoryToWork.add(things);
        }
        
        update itemsToUpdate;
        
        insert forcingHistoryToWork;
        
        List<OrderProductHistoryCntl.OPHistory> listOPHistory = OrderProductHistoryCntl.getOrderProductHistory(o.id,false);
        
        Test.stopTest();
        
        system.debug('listOPHistory: ' + listOPHistory);
        system.assert(listOPHistory.size() > 0);
    }
    
    @isTest 
    static void test_getOrderProductHistoryDeactivated() { 
        Test.startTest();
        
        Order o = [select Id from Order where EffectiveDate = :system.today()  and Status='Draft' limit 1];
        system.debug('Retreived order id:' + o.Id);
        
        List<OrderItem> listOrderItem  = [select Id, quantity, UnitPrice from OrderItem where OrderId = :o.Id];
        List<OrderItem> itemsToUpdate = new List<OrderItem>();
        List<OrderItemHistory> forcingHistoryToWork = new List<OrderItemHistory>();
        system.debug('listOrderItem>>>' + listOrderItem);
        
        for(OrderItem oi : listOrderItem) {
            OrderItem item = new OrderItem(Id=oi.id);
            item.UnitPrice = 999.99;
            itemsToUpdate.add(item);
            
            OrderItemHistory things = new OrderItemHistory();
            things.OrderItemId = oi.Id;
            things.Field = 'UnitPrice';
            forcingHistoryToWork.add(things);
        }
        
        update itemsToUpdate;
        
        insert forcingHistoryToWork;
        
        OrderProductHistoryCntl.OrderId = o.Id;
        List<OrderProductHistoryCntl.OPHistory> listOPHistory = OrderProductHistoryCntl.getOrderProductHistory(o.id,true);
        
        Test.stopTest();
        
        system.debug('listOPHistory: ' + listOPHistory);
        system.assert(listOPHistory.size() > 0);
        System.assert(OrderProductHistoryCntl.OrderId == o.Id);
    }
}