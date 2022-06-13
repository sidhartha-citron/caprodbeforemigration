/**
 * Test class for MassEditOrderController class.
 * @author Ahsan Butt
 */

@isTest
public class MassEditOrderControllerTest {
    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    // HELPER METHODS
    static void setupHelper() {
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
        //TestDataFactory.crtFieldServiceSetting();

        //TestDataFactory.crtAcctContact(1, 1);
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
        ), 1);

        // I had to do this because there is a duplicate Id exception being thrown on OrderTriggerHandler Line 635. There seems to be a bug
        // on this.
        insert orders[0];

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
		orderItems[2].OrderId = orders[0].Id;
		orderItems[2].SurveyAssetCountChecker__c = 1;
		orderItemsBatch1.add(orderItems[2]);

        insert orderItemsBatch1;
    }

    static testMethod void testGetOLIs() {
    	// // Create necessary FSS custom settings
        // MassEditOrderTestUtils.createFSSCustomSettings();
        
        // // Create account
        // TestDataFactory.crtAcctContact(1, 1);
        
        // // Create price book entries / products
        // List<PricebookEntry> pbookEntries = MassEditOrderTestUtils.createPricebookEntries(2, '111');
        
        // // Create Order
        // List<OrderItem> expectedOrderItems = MassEditOrderTestUtils.createOrder(TestDataFactory.accounts[0], pbookEntries);

        Order order = [SELECT Id FROM Order][0];
        
        // Get olis from controller
        List<Id> actualOrderItems = MassEditOrderController.getOLIs(order.Id);
        
        System.assertEquals(3, actualOrderItems.size(), 'OLIs list should have equal sizes.');
        
    }
}