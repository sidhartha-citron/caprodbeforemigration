@isTest
public class ResourcePreferenceTableControllerTest {
	@testSetup
    static void setup() {
        Account a = new Account(
            Name='TestAccount', 
            AccPac_Account__c='1234-', 
            A_P_Contact_Name__c='TestContactName', 
            Credit_Check__c='Completed', 
            Industry='Institutions', 
            Industry_Code_Accpac__c='000-00 UNKNOWN', 
            Invoice_Preference__c='Email',
            Invoicing_Email_Address__c='Test@test.com', 
            LEED_Customer__c='No', 
            On_Hold__c=FALSE, 
            Type='Customer', 
            Phone='123456789',
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
            ShippingCountry = 'Country',
            Is_Multi_Res__c = true
        );
        insert a;
        
        ServiceResource sr = new ServiceResource();
        sr.AccountId = a.Id;
        sr.IsActive = true;
        sr.Name = UserInfo.getName();
        sr.RelatedRecordId = UserInfo.getUserId();
        
        insert sr;
        
        ResourcePreference rp = new ResourcePreference();
        rp.Line_Of_Business__c = 'Pest Control';
        rp.RelatedRecordId = a.Id;
        rp.ServiceResourceId = sr.Id;
        
        insert rp;
        
        WorkOrder wo = new WorkOrder();
        wo.AccountId = a.Id;
        wo.StartDate = System.today().addDays(-1);
        wo.EndDate = System.today().addDays(1);
        wo.Status = 'New';
        
        insert wo;
    }
    
    @isTest
    static void testGetResourcePreferencesFromAccount() {
        Account a = [SELECT Id FROM Account LIMIT 1];
        
        Test.startTest();
        
        EDW_ResourcePreferenceTableController.getResourcePreferences(a.Id);
        
        Test.stopTest();
    }
    
    @isTest
    static void testGetResourcePreferencesFromWorkOrder() {
        WorkOrder wo = [SELECT Id,AccountId FROM WorkOrder LIMIT 1];
        
        Test.startTest();
        
        EDW_ResourcePreferenceTableController.getResourcePreferences(wo.AccountId);
        
        Test.stopTest();
    }
}