@isTest
public class StandingOrderUtilityClassTest {
    
    @testSetup
    static void setup() {
        PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'Standing_Order_Price_Override_Permission' LIMIT 1];
        
        PermissionSetAssignment psa = new PermissionSetAssignment();
        psa.AssigneeId = UserInfo.getUserId();
        psa.PermissionSetId = ps.Id;
        insert psa;
    }
    
	@isTest
    static void test() {
        Test.startTest();
        //doing the same query twice and inserting the settings here because of a Salesforce limitation: https://help.salesforce.com/articleView?id=000240364&type=1
        PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'Standing_Order_Price_Override_Permission' LIMIT 1];
        
        Field_Service_Settings__c settings = new Field_Service_Settings__c();
        settings.Standing_Order_Override_Permission_Id__c = ps.Id;
        
        insert settings;
        
        Boolean returnedValue = StandingOrderUtilityClass.isPriceOverrideAllowed();
        
        Test.stopTest();
    }
}