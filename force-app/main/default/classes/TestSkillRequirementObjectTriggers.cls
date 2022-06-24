@isTest(SeeAllData=TRUE)
public class TestSkillRequirementObjectTriggers {
    
    static testMethod void testTrigger(){
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
            ShippingCountry = 'Country'
        );
        insert a;
        
        WorkOrder wo = new WorkOrder(
        	AccountId=a.Id, 
            StartDate=System.today()
        );
        insert wo;
        
        Skill testSkill = [SELECT Id FROM Skill LIMIT 1].get(0);
        
        SkillRequirement testSkillReq = new SkillRequirement(
        	RelatedRecordId=wo.Id, 
            SkillId=testSkill.Id
        );
        insert testSkillReq;
    }

}