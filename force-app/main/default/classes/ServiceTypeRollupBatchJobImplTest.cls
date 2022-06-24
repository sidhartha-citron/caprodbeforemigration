/**
 * Test for Service Type Rollups.
 * 
 * @author Ahsan Butt
 */
@isTest
public class ServiceTypeRollupBatchJobImplTest {
	
    @TestSetup static void setup() {
        Field_Service_Settings__c fss = new Field_Service_Settings__c();
        fss.Order_Active_Stage__c = 'Activated';
        fss.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        insert fss;
        
        /*OperatingHours oh = new OperatingHours(
          Name='TestHours', 
            Operating_Hours_Type__c='Account Operating Hours', 
            TimeZone='America/New_York'
        );
        
        OperatingHours territoryHours = new OperatingHours(
            Name='TestHoursTerritory', 
            Operating_Hours_Type__c='Territory Operating Hours', 
            TimeZone='America/New_York'
        );
        
        insert new List<OperatingHours>{oh, territoryHours};
        
        ServiceTerritory st1 = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios1'
            
        );
        insert st1;
        ServiceTerritory st = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios',
            ParentTerritoryId = st1.Id
            
        );
        insert st;*/
        
        
        // Insert test records
        TestDataFactory.crtBillToAcctContact(1, 1);
        
        // Create order
        List<Product2> products = new List<Product2>();
        Id pBook = Test.getStandardPricebookId();
        
        // Need to create product(s) first
		for(Integer i=0; i < 2; i++){
            products.add(
                new Product2(
                    Name = 'TEST_PROD' + i,
					ProductCode = Math.mod(i, 2) == 0 ? '1-03' : '1-04',
                    ExternalId__c = '3-55-7-02-1' + i
                )       
            );
        }
        
        insert products;
        
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        
        for(Integer i=0; i < 2; i++) {
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
        
        // Create Order
        Order o = new Order(
        	AccountId = TestDataFactory.accounts[0].Id, 
            Status = 'Draft', 
            EffectiveDate = System.today(), 
            Pricebook2Id = pEntries.get(0).Pricebook2Id
        ); 
        
        insert o;
        
        // Create order line items
        List<OrderItem> orderItems = new List<OrderItem>();
        
        for(Integer i = 0; i < pEntries.size(); i++) {
            orderItems.add(
                new OrderItem(
                    Description='',
                    Product2Id=pEntries.get(i).Id,  
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id
                )
            );
        }
        
		insert orderItems;
    }
    
    static testMethod void testRollup() {
        Field_Service_Settings__c fss = Field_Service_Settings__c.getOrgDefaults();
        fss.Order_Active_Stage__c = 'Draft'; // Hack
        fss.Integration_User_Profile__c = userinfo.getProfileId();
        update fss;
        
        List<Order> orders = [SELECT Id FROM Order];
        
        OrderServiceTypeRollupBatchJobImpl orderRollup = new OrderServiceTypeRollupBatchJobImpl('test', 10);
        orderRollup.start(null);
        orderRollup.execute(null, orders);
        orderRollup.finish(null);
        
        Set<Id> acctIds = new Set<Id>();
        Map<Id, Account> accts = new Map<Id,Account>([SELECT Id FROM Account]);
        
        AccountServiceTypeRollupBatchJobImpl acctRollup = new AccountServiceTypeRollupBatchJobImpl('test', accts.keySet());
        acctRollup.start(null);
        acctRollup.execute(null, accts.values());
        acctRollup.finish(null);
    }
}