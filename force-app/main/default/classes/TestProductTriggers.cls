@isTest
public class TestProductTriggers {
    @isTest
    static void testCreateAndUpdateProduct() {
        Product2 product = new Product2();
        product.Allowable_Frequencies__c = 'One-Time';
        product.Family = 'Pest Control';
        product.Item_Type__c = 'Service';
        product.Treatment_Type__c = 'Bed Bug';
        product.Number_of_Rooms__c = '3';
        product.IsActive = true;
        product.Infestation_Level__c = 'Medium';
        product.Name = 'Test Product';
        
        Test.startTest();
        
        insert product;
        
        product.Number_of_Rooms__c = '4';
        
        update product;
        
        Test.stopTest();
    }
    
    @isTest
    static void testCreateNonPEstProduct() {
        Product2 product = new Product2();
        product.Allowable_Frequencies__c = 'One-Time';
        product.Family = 'Hygiene';
        product.Item_Type__c = 'Service';
        product.Treatment_Type__c = 'Bed Bug';
        product.Number_of_Rooms__c = '3';
        product.IsActive = true;
        product.Infestation_Level__c = 'Medium';
        product.Name = 'Test Product';
        
        Test.startTest();
        
        insert product;
        
        product.Number_of_Rooms__c = '4';
        
        update product;
        
        Test.stopTest();
    }
}