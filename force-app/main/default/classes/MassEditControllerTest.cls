/**
 * Test class for MassEditController class.
 * @author Ahsan Butt
 */

@isTest
public class MassEditControllerTest {
    private static String TEST_FIELD_SET_EDITABLE = 'test_editable';
    private static String TEST_FIELD_SET_READ_ONLY = 'test_read_only';

    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    // HELPER METHODS
    static void setupHelper() {
        // Create custom settings
        List<Mass_Edit_Settings__c> settings = getMassEditCustomSettings();
        settings.get(0).Search_Field__c = 'Product_Name__c'; // OrderItem field that will be searched
        insert settings;

        Id pBook = Test.getStandardPricebookId();

        List<WorkType> workTypesToInsert = new List<WorkType>();
        WorkType workType1 = new WorkType(
            Name='TestWorkType1',
            DurationType='Minutes',
            EstimatedDuration=1.7
        );

        WorkType workType2 = new WorkType(
            Name='TestWorkType2',
            DurationType='Minutes',
            EstimatedDuration=1
        );

        WorkType workType3 = new WorkType(
            Name='TestWorkType3',
            DurationType='Minutes',
            EstimatedDuration=0.11
        );
        workTypesToInsert.add(workType1);
        workTypesToInsert.add(workType2);
        workTypesToInsert.add(workType3);
        insert workTypesToInsert;

        Product2 product1 = new Product2(
            Name='TestProduct1',
            Allowable_Frequencies__c='One-Time;Monthly;Weekly;Annually',
            IsActive=true,
            Family='Hygiene',
            ExternalID__c = 'TestProduct1',
            CPQ_Price_Model__c = 'Hygiene Pricing Model',
            Item_Type__c = 'Service',
            Service_Work_Type__c = workType1.Id,
            CPQ_Cost__c = 0.93,
            CPQ_Amortization__c = 4,
            CPQ_Capital_Cost__c = 0
        );

        Product2 product2 = new Product2(
            Name='TestProduct2',
            Allowable_Frequencies__c='One-Time;Monthly;Weekly;Annually',
            IsActive=true,
            Family='Hygiene',
            Item_Type__c = 'Service',
            ExternalID__c = 'TestProduct2',
            CPQ_Price_Model__c = 'Hygiene Pricing Model',
            Service_Work_Type__c = workType2.Id,
            CPQ_Cost__c =  57.33,
            CPQ_Amortization__c = 4,
            CPQ_Capital_Cost__c = 0
        );

        Product2 product3 = new Product2(
            Name='TestProduct3',
            Allowable_Frequencies__c='One-Time;Monthly;Weekly;Annually',
            IsActive=true,
            Family='Hygiene',
            ExternalID__c = 'TestProduct3',
            Item_Type__c = 'Service',
            CPQ_Price_Model__c = 'Hygiene Pricing Model',
            Service_Work_Type__c = workType3.Id,
            CPQ_Cost__c = 0.97,
            CPQ_Amortization__c = 4,
            CPQ_Capital_Cost__c = 0
        );

        TestDataFactory.products.add(product1);
        TestDataFactory.products.add(product2);
        TestDataFactory.products.add(product3);
        insert TestDataFactory.products;

        PricebookEntry pbe1 = new PricebookEntry(
            Pricebook2Id = pBook,
            Product2Id = product1.Id,
            UnitPrice = 1.0,
            IsActive = true
        );

        PricebookEntry pbe2 = new PricebookEntry(
            Pricebook2Id = pBook,
            Product2Id = product2.Id,
            UnitPrice = 1.0,
            IsActive = true
        );

        PricebookEntry pbe3 = new PricebookEntry(
            Pricebook2Id = pBook,
            Product2Id = product3.Id,
            UnitPrice = 1.0,
            IsActive = true
        );
        TestDataFactory.pEntries.add(pbe1);
        TestDataFactory.pEntries.add(pbe2);
        TestDataFactory.pEntries.add(pbe3);
        insert TestDataFactory.pEntries;

        TestDataFactory.crtCPQSettings();
        TestDataFactory.crtFieldSettings();
        
        TestDataFactory.crtAcctContact(2, 1);
        
        ID billToRecordType = [select Id from recordType where name = 'Customer Bill To'].id; 
        Id shipToRecordType = [select Id from recordType where name = 'Customer Ship To'].id; 
        List<Account> accounts = TestDataFactory.accounts;
        accounts[0].RecordTypeId = billToRecordType;
        accounts[1].RecordTypeId = shipToRecordType;
        accounts[1].ParentId = accounts[0].Id;
        
        update accounts[0];
		update accounts[1];
        
        
        TestDataFactory.crtSiteSurvey(1);

        List<Order> orders = (List<Order>) TestUtils.createSObjectList(new Order(
            AccountId = accounts[1].Id
        ), 2);

        // I had to do this because there is a duplicate Id exception being thrown on OrderTriggerHandler Line 635. There seems to be a bug
        // on this.
        insert orders[0];
        insert orders[1];

        List<OrderItem> orderItems = (List<OrderItem>)TestUtils.createSObjectList(new OrderItem(), 3);

        List<OrderItem> orderItemsBatch1 = new List<OrderItem>();

        // Order Products for Order 1
        orderItems[0].Product2Id = pbe1.Id;
        orderItems[0].PriceBookEntryId = pbe1.Id;
        orderItems[0].Frequency__c = 'Monthly';
        orderItems[0].Product_Type__c = 'Service';
        //orderItems[0].CPQ2_Number_Of_Visits_Per_Year__c = 12;
        orderItems[0].UnitPrice = 11.0;
        orderItems[0].Service_Price_Per_Unit__c = 9.0;
        orderItems[0].Quantity = 1;
        orderItems[0].OrderId = orders[0].Id;
        orderItems[0].SurveyAssetCountChecker__c = 1;
        orderItemsBatch1.add(orderItems[0]);

        orderItems[1].Product2Id = pbe2.Id;
        orderItems[1].PriceBookEntryId = pbe2.Id;
        orderItems[1].Frequency__c = 'Annually';
        orderItems[1].Product_Type__c = 'Service';
		//orderItems[1].CPQ2_Number_Of_Visits_Per_Year__c = 1;
		orderItems[1].UnitPrice = 40;
		orderItems[1].Service_Price_Per_Unit__c = 38.0;
		orderItems[1].Quantity = 1;
		orderItems[1].OrderId = orders[0].Id;
		orderItems[1].SurveyAssetCountChecker__c = 1;
		orderItemsBatch1.add(orderItems[1]);

		// Order Products for Order 2
        orderItems[2].Product2Id = pbe3.Id;
        orderItems[2].PriceBookEntryId = pbe3.Id;
        orderItems[2].Frequency__c = 'Annually';
        orderItems[2].Product_Type__c = 'Service';
		//orderItems[2].CPQ2_Number_Of_Visits_Per_Year__c = 1;
		orderItems[2].UnitPrice = 3;
		orderItems[2].Service_Price_Per_Unit__c = 2.0;
		orderItems[2].Quantity = 1;
		orderItems[2].OrderId = orders[1].Id;
		orderItems[2].SurveyAssetCountChecker__c = 1;
		orderItemsBatch1.add(orderItems[2]);

        insert orderItemsBatch1;
    }

    static testMethod void cloneOrderItem_SuccessTest() {
        List<Order> orders = [SELECT Id FROM Order];

        List<OrderItem> orderItems = [SELECT Id, Product_Type__c, PriceBookEntryId FROM OrderItem where OrderId =: orders[0].Id];
        
        Test.startTest();
            MassEditController.cloneOrderItem(orderItems, String.valueOf(orders[1].Id));
            // Error will be thrown because the record will be inactive
            MassEditController.cloneOrderItem(orderItems, String.valueOf(orders[1].Id));
        Test.stopTest();
    }

    static testMethod void cloneOrderItem_FailTest1() {
        //List<Order> orders = [SELECT Id FROM Order];

        //List<OrderItem> orderItems = [SELECT Id, Product_Type__c, Frequency__c, PriceBookEntryId FROM OrderItem where OrderId =: orders[0].Id];
        //orderItems[0].Frequency__c = 'One-Time';
        //update orderItems[0];

        Test.startTest();
            List<Order> orders = [SELECT Id FROM Order];
    
            List<OrderItem> orderItems = [SELECT Id, Product_Type__c, Frequency__c, PriceBookEntryId FROM OrderItem where OrderId =: orders[0].Id];
            orderItems[0].Frequency__c = 'One-Time';
        	//update orderItems[0];
            MassEditController.cloneOrderItem(orderItems, String.valueOf(orders[1].Id));
        Test.stopTest();
    }

    static testMethod void cloneOrderItem_FailTest2() {
        List<Order> orders = [SELECT Id FROM Order];

        List<OrderItem> orderItems = [SELECT Id, Product_Type__c, Frequency__c, PriceBookEntryId FROM OrderItem where OrderId =: orders[0].Id];
        
        Test.startTest();
            orderItems[0].Product_Type__c = 'Equipment';
            update orderItems[0];

            MassEditController.cloneOrderItem(orderItems, String.valueOf(orders[1].Id));
        Test.stopTest();
    }
    
    static testMethod void testGetRecordEntries() {
    	// Create custom settings
        //List<Mass_Edit_Settings__c> settings = getMassEditCustomSettings();
        //insert settings;
        
        // Create necessary FSS custom settings
        //MassEditOrderTestUtils.createFSSCustomSettings();

        // Create account
        //TestDataFactory.crtAcctContact(1, 0); 
        //Account[] accts = TestDataFactory.accounts;
        
        
        // Create price book entries / products
        //List<PricebookEntry> pbookEntries = MassEditOrderTestUtils.createPricebookEntries(2, '111');
        //pbookEntries.addAll(MassEditOrderTestUtils.createPricebookEntries(2, '222')); // get 2 more (of the same) products
        
        // Create Order
        //List<OrderItem> expectedOrderItems = MassEditOrderTestUtils.createOrder(accts.get(0), pbookEntries);
        
        // Get Record Entries from controller

        List<Order> orders = [SELECT Id FROM Order];

        List<OrderItem> orderItems = [SELECT Id FROM OrderItem WHERE OrderId =: orders[0].Id];
        List<String> ids = new List<String>();
        for (OrderItem oi : orderItems) {
            ids.add(oi.Id);
        }
        
        RecordSet recordSet = MassEditController.getRecordEntries(ids, 'OrderItem', 'RecordEntryOrderItemSorter', 0, 100);
        
        // Check num records returned, and records themselves
		System.assertEquals(orderItems.size(), recordSet.records.size(), 'Number of records returned should match.');
        
        // Records should come back in different order, due to sort
        // So use map to compare against expected values
        Map<Id, OrderItem> expectedOrderItemMap = new Map<Id, OrderItem>();
        for (Integer i = 0; i < orderItems.size(); i++) {
            expectedOrderItemMap.put(orderItems.get(i).Id, orderItems.get(i));
        }
        
        for (Integer i = 0; i < orderItems.size(); i++) {
            OrderItem actualOi = (OrderItem) recordSet.records.get(i).record;
            OrderItem oi = expectedOrderItemMap.get(actualOi.Id);
            System.assertEquals(oi.Id, actualOi.Id, 'Record Ids should match.');
        }
        
        // Check fields returned against field sets
        // Schema.FieldSet readOnlyFields = FieldSetUtils.getFieldSet('OrderItem', settings.get(0).Field_Set_read_only__c);
        // Schema.FieldSet editFields = FieldSetUtils.getFieldSet('OrderItem', settings.get(0).Field_Set_editable__c);
        
        // List<String> fields = new List<String>();
        // for (Schema.FieldSetMember field : readOnlyFields.getFields()) {
        //     fields.add(field.getFieldPath());
        // }
        
        // for (Schema.FieldSetMember field : editFields.getFields()) {
        //     fields.add(field.getFieldPath());
        // }
        
        
        // Also run without a sort Impl provided, verify no exceptions
        recordSet = MassEditController.getRecordEntries(ids, 'OrderItem', '', 0, 100);
    }
    
    static testMethod void testSave() {
        // Test again null records (error case)
        MassEditSaveResults results = MassEditController.saveRecords(null);
        System.assertEquals(false, results.isSuccess, 'Save should have failed');
        
        // // Create account
      	// TestDataFactory.crtAcctContact(1, 0); 
        // List<Account> accts = TestDataFactory.accounts;
        
        // // Edit name
        // accts.get(0).Name = 'testSaveName__edited';

        List<Account> accts = [SELECT Id, Name FROM Account];
        accts[0].Name = 'testAveName__edited';
        
        // Call controller to save record
        results = MassEditController.saveRecords(accts);
        
        System.assertEquals(true, results.isSuccess, 'Save should have succeeded.');
        
        // Confirm updated name was saved
        List<Account> actualAccts = [SELECT Id, Name FROM ACCOUNT];
        
        System.assertEquals(accts.get(0).Name, actualAccts.get(0).Name, 'Controller should have saved updated name');
    }

    static testMethod void testSearch() {
        List<Order> orders = [SELECT Id FROM Order];
        Id orderId = orders[0].Id;

        String soqlQuery = QueryGenerator.queryCloneOrderItems('OrderId =: orderId');
        List<OrderItem> orderItems = database.query(soqlQuery);

        // Test search -- should fail
        Map<Id, Boolean> resultsMap = MassEditController.searchRecords('OrderItem', orderItems, 'failfailfail');
        
        System.assertEquals(0, resultsMap.keySet().size(), 'Search should have returned no results');

        // Update two orders to have expected description
        String searchTerm = 'test';
        
        // Test search -- should return two results
        resultsMap = MassEditController.searchRecords('OrderItem', orderItems, searchTerm);
        
        System.assertNotEquals(0, resultsMap.keySet().size(), 'Search should have returned results');
    }    
    
    private static List<Mass_Edit_Settings__c> getMassEditCustomSettings() {
        List<Mass_Edit_Settings__c> settings = new List<Mass_Edit_Settings__c>();
        
        Mass_Edit_Settings__c setting = new Mass_Edit_Settings__c();
        setting.Name = 'OrderItem';
        setting.Field_Set_editable__c = TEST_FIELD_SET_EDITABLE;
        setting.Field_Set_read_only__c = TEST_FIELD_SET_READ_ONLY;
        
        settings.add(setting);
        
        return settings;
    }     
}