/**
 * Unit tests for all impls of IOrderItemFilter.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class OrderItemFilterTest {
     static testmethod void testActiveFilter() {
    	ActiveOrderItemFilter f = new ActiveOrderItemFilter();
        f.getFields();
        
        OrderItem oi = new OrderItem();
        
        Boolean actual = f.filter(oi);
        System.assertEquals(false, actual, 'Active Filter should have failed');
    }
    
    static testmethod void testFrequencyFilter() {
    	Field_Service_Settings__c fss = new Field_Service_Settings__c();
        fss.Fixed_Weekly_Service_Frequency_Value__c = 'Fixed Weekly';
        insert fss;
        
        FrequencyOrderItemFilter f = new FrequencyOrderItemFilter();
        f.getFields();
        
        OrderItem oi = new OrderItem();
        oi.Frequency__c = fss.Fixed_Weekly_Service_Frequency_Value__c;
        
        Boolean actual = f.filter(oi);
        System.assertEquals(false, actual, 'Frequency Filter should have failed (frequency is non-recurring)');
        
        oi.Frequency__c = 'Weekly';
        actual = f.filter(oi);
        System.assertEquals(true, actual, 'Frequency Filter should have passed');
    }
    
    static testmethod void testProductCodesOrderItemFilter() {
        OrderMerger.ORDER_ITEM_FILTER_PRODUCT_CODES = new List<String>{'123-12-123'};
    
        // Create underlying product and order
        Id pBook = Test.getStandardPricebookId();
        Product2 product = new Product2(
            Name = 'TEST',
            ExternalID__c = OrderMerger.ORDER_ITEM_FILTER_PRODUCT_CODES.get(0)
        );
        insert product;
      	
       	PricebookEntry pEntry =  new PricebookEntry(
                    Pricebook2Id = pBook, 
                    Product2Id = product.Id, 
                    UnitPrice = 1.0, 
                    IsActive = true
        ); 
        insert pEntry; 
        
        TestDataFactory.crtBillToAcctContact(1, 1);
                
        Order o = new Order(
        	AccountId = TestDataFactory.accounts[0].Id, 
            Status = 'Draft', 
            EffectiveDate = System.today(), 
            Pricebook2Id = pbook
        ); 
        insert o;
        
        // Create Order Item
        OrderItem oi = new OrderItem(
            Description='',
            Product2Id=pEntry.Id,  
            UnitPrice=1.0, 
            Service_Price_Per_Unit__c=1.0, 
            Quantity=1, 
            OrderId=o.Id,
            Last_Automation_Created_Date__c = Date.today()
        );
        
        insert oi;
        
        // Refresh from DB, such that Product's External Id is retrieved
        oi = [SELECT Id, Product2.ExternalID__c FROM OrderItem WHERE Id = :oi.Id LIMIT 1];
        
        ProductCodesOrderItemFilter f = new ProductCodesOrderItemFilter();
        f.getFields();
        
        
        Boolean actual = f.filter(oi);
        System.assertEquals(false, actual, 'Product code should be filtered out');
        
        // alter product code list
        OrderMerger.ORDER_ITEM_FILTER_PRODUCT_CODES = new List<String>{'FOO_BAR'};
        actual = f.filter(oi);
        System.assertEquals(true, actual, 'Product code filter should have passed');
    }
    
	static testmethod void testLACDFilter() {
    	LastAutomationCreatedDateOrderItemFilter f = new LastAutomationCreatedDateOrderItemFilter();
        f.getFields();
        
        OrderItem oi = new OrderItem();
        
        Boolean actual = f.filter(oi);
        System.assertEquals(false, actual, 'LACD Filter should have failed');
        
        oi.Last_Automation_Created_Date__c = Date.today();
        
        actual = f.filter(oi);
        System.assertEquals(true, actual, 'LACD Filter should have passed');
    }
    
    static testmethod void testLIFDFilter() {
    	LastInflightWODateOrderItemFilter f = new LastInflightWODateOrderItemFilter();
        f.getFields();
        
        OrderItem oi = new OrderItem();
        
        Boolean actual = f.filter(oi);
        System.assertEquals(false, actual, 'LIFD Filter should have failed');
        
        oi.Last_InFlight_WO_Date__c = Date.today();
        
        actual = f.filter(oi);
        System.assertEquals(true, actual, 'LIFD Filter should have passed');
    }
}