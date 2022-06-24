/**
 * Test utility class for Merge functionality.
 * @author Ahsan Butt
 */

@isTest
public class MergeTestUtils {
    public static String PRODUCT_NAME_PREFIX = 'TestProduct';

    public static void createFSSCustomSettings() {
        // Necessary field to create OrderItem
        Field_Service_Settings__c fss = new Field_Service_Settings__c();
        fss.Service_Start__c = 10;
        fss.Non_Recurring_Frequency_Value__c = 'One-Time';
        fss.Fixed_Weekly_Service_Frequency_Value__c = 'Fixed Weekly';
        insert fss;
    }

    public static Account createAccount() {
       TestDataFactory.crtBillToAcctContact(1, 0); 
       Account acct= TestDataFactory.accounts[0];
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=acct.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        insert ss;
         
        acct.Site_Survey__c = ss.Id;
        
        update acct;
        
        return acct;
    }
    
    public static List<PricebookEntry> createPricebookEntries(Integer num) {
        List<Product2> products = new List<Product2>();
        Id pBook = Test.getStandardPricebookId();
        
        // Need to create product(s) first
		for(Integer i=0; i < num; i++){
            products.add(
                new Product2(
                    Name = PRODUCT_NAME_PREFIX + i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly;Fixed Weekly',
                    ExternalId__c = '1-55-7-02-1' + i
                )       
            );
        }
        
        insert products;
      	
        // Create price book entries
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        
        for(Integer i=0; i < num; i++) {
            pEntries.add(
                new PricebookEntry(
                    Pricebook2Id = pBook, 
                    Product2Id = products.get(i).Id, 
                    UnitPrice = 1.0, 
                    IsActive = true
                )
            );
        }
        
        insert pEntries; 
        
        return pEntries;
    }
    
    public static Order createOrder(Account acct, List<PricebookEntry> pbookEntries, boolean oneTime) {
        // Create Order
        Order o = new Order(
        	AccountId = acct.Id, 
            Status = 'Draft', 
            EffectiveDate = System.today(), 
            Pricebook2Id = Test.getStandardPricebookId()
        ); 
        
        insert o;
        
        // Create order line items
        List<OrderItem> orderItems = new List<OrderItem>();
        
        for(Integer i = 0; i < pbookEntries.size(); i++) {
            orderItems.add(
                new OrderItem(
                    Description='',
                    Product2Id=pbookEntries.get(i).Id,  
                    Frequency__c= oneTime ? 'Fixed Weekly' : 'Weekly', 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id
                )
            );
        }
        
        if (orderItems.size() > 0 ) {
        	insert orderItems;    
        }
		
        return o;
    }
    
    public static WorkOrder createWO(Order o, List<PricebookEntry> pbookEntries) {        
         WorkOrder testWorkOrder = new WorkOrder(
        	AccountId=o.AccountId,
            Order__c=o.Id,
            StartDate=System.today(), 
            Status='New',
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=Test.getStandardPricebookId(), 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            //ServiceTerritoryId=st.Id, 
            Next_Scheduled_Appointment__c = Datetime.newInstanceGmt(2018, 12, 31)
        );
        
        insert testWorkOrder;
         
        List<OrderItem> orderItems = [SELECT Id, Product2Id FROM OrderItem WHERE OrderId = :o.Id];
        
        List<WorkOrderLineItem> testWorkOrderLineItems = new List<WorkOrderLineItem>();
        Integer i = 0;
        for (OrderItem oItem : orderItems) {
            WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
                WorkOrderId=testWorkOrder.Id, 
                Order_Product__c=oItem.Id, 
                Type_of_Service__c='Service', 
                QUantity=1,
                PricebookEntryId=pbookEntries.get(i).Id, 
                Product__c= oItem.Product2Id, 
                Line_Item_Description__c='TestDescription'
            );
            i++;
            testWorkOrderLineItems.add(testWorkOrderItem);
        }
        
        insert testWorkOrderLineItems;
        
        return testWorkOrder;
    }
}