@isTest
public class CreateOrderProductsBatchTest {
    @testSetup
    static void setup() {
        
        TestDataFactory.crtBillToAcctContact(1,1);
        Account a = TestDataFactory.accounts[0]; 
        Contact c = TestDataFactory.contacts[0]; 
        
        Order o = new Order();
        o.AccountId = a.Id;
        o.ShipToContactId = c.Id;
        o.Status = 'Draft';
        o.EffectiveDate = System.today();
        o.Pricebook2Id = Test.getStandardPricebookId();
        
        insert o;
        
        Product2 product = new Product2();
        product.Name = 'test product';
        product.Allowable_Frequencies__c = 'One-Time';
        product.Family = 'Pest Control';
        product.ExternalID__c = '01-10-10-01';
        product.Item_Type__c = 'Service';
        product.Infestation_Level__c = 'General';
        product.Treatment_Type__c = 'Bed Bug';
        product.Number_of_Rooms__c = '1';
        product.IsActive = true;
        
        insert product;
        
        PricebookEntry pbe = new PricebookEntry();
        pbe.UnitPrice = 5;
        pbe.Pricebook2Id = Test.getStandardPricebookId();
        pbe.ExternalID__c = 'fgds';
        pbe.Product2Id = product.Id;
        pbe.IsActive = true;
        
        insert pbe;
    }
    
    @isTest
    static void testBatch() {
        Order o = [SELECT Id FROM Order LIMIT 1];
        PricebookEntry pbe = [SELECT Id, Product2Id FROM PricebookEntry LIMIT 1];
        
        List<OrderItem> orderItemsToInsert = new List<OrderItem>();
        
        for (Integer i = 0; i < 200; i++) {
            orderItemsToInsert.add(new OrderItem(
            	Active__c = true,
                OrderId = o.Id,
                Frequency__c = 'One-Time',
                Product2Id = pbe.Product2Id,
                PricebookEntryId = pbe.Id,
                Service_Price_Per_Unit__c = 0,
                UnitPrice=10,
                Quantity = 1
            ));
        }

		Test.startTest();
        
        Database.executeBatch(new CreateOrderProductsBatch(orderItemsToInsert));
        
        Test.stopTest();
    }
}