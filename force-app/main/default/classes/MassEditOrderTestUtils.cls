/**
 * Test utility class for Mass Edit functionality.
 * @author Ahsan Butt
 */

@isTest
public class MassEditOrderTestUtils {
    public static String PRODUCT_NAME_PREFIX = 'TestProduct';

    public static void createFSSCustomSettings() {
        // Necessary field to create OrderItem
        Field_Service_Settings__c fss = new Field_Service_Settings__c();
        fss.Service_Start__c = 10;
        insert fss;
    }

    public static List<Account> getAccounts(Integer num) {
		List<Account> accounts = new List<Account>();
        
        for(Integer i=0; i < num; i++) {
            accounts.add(
                new Account(
                    Name = 'TestAccount'+i, 
                    
                    Industry = 'Institutions', 
                    Industry_Code_Accpac__c = '000-00 UNKNOWN',
                    Lead_Source__c = 'Other',
                    Phone='123456789',
                    Invoice_Preference__c='Email',
                    Invoicing_Email_Address__c='Test@test.com', 
                    Type='Customer'
                    
                    /*AccPac_Account__c='1234-'+i, 
                    A_P_Contact_Name__c='TestContactName', 
                    Credit_Check__c='Completed', 
                    LEED_Customer__c='No', 
                    On_Hold__c=FALSE,
                    OperatingHoursId = oh.Id,
                	Service_Territory__c = st.Id,
                    Billing_Suite_Number__c='1', 
                    BillingStreet='Street', 
                    BillingCity = 'City', 
                    BillingState = 'State', 
                    BillingPostalCode = 'PostalCode',
                    BillingCountry = 'Country',
                    Shipping_Suite_Number__c = '1',
                    ShippingStreet = 'Street', 
                    ShippingCity = 'City', 
                    ShippingState = 'State', 
                    ShippingPostalCode = 'PostalCode', 
                    ShippingCountry = 'Country'*/
                )
            );
        }
        
        return accounts;
    }
    
    public static List<PricebookEntry> createPricebookEntries(Integer num, String suffix) {
        List<Product2> products = new List<Product2>();
        Id pBook = Test.getStandardPricebookId();
        
        // Need to create product(s) first
		for(Integer i=0; i < num; i++){
            products.add(
                new Product2(
                    Name = PRODUCT_NAME_PREFIX + i,
                    ExternalId__c = '3-55-7-02-1' + i + suffix
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
    
    public static List<OrderItem> createOrder(Account acct, List<PricebookEntry> pbookEntries) {
        // Create Order
        Order o = new Order(
        	AccountId = acct.Id, 
            Status = 'Draft', 
            EffectiveDate = System.today(), 
            Pricebook2Id = pbookEntries.get(0).Pricebook2Id
        ); 
        
        insert o;
        
        // Create order line items
        List<OrderItem> orderItems = new List<OrderItem>();
        
        for(Integer i = 0; i < pbookEntries.size(); i++) {
            orderItems.add(
                new OrderItem(
                    Description='',
                    Product2Id=pbookEntries.get(i).Id,  
                    //Frequency__c=frequencies.get(0), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id
                )
            );
        }
        
		insert orderItems;
        
        return orderItems;
    }
}