@isTest
public class TestSiteSurveySkillsObjectTriggers {
    
     @TestSetup static void setup() {
        
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
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        insert ss;
         
        a.Site_Survey__c = ss.Id;
        update a;
    }
    
    static testMethod void testTrigger() {
        Account a = [SELECT Id, Site_Survey__c FROM Account WHERE Name='TestAccount'];
        
        SiteSurvey_RequiredSkills__c testSkill = new SiteSurvey_RequiredSkills__c(
        	Site_Survey__c=a.Site_Survey__c, 
            Name='TestSkill', 
            Skill_Level__c=1,
            Skill_Name__c='TestSkill', 
            Skill_Record_Id__c='TestSkillId', 
            Line_of_Business__c='Chemical'
        );
        
        insert testSkill;
    }

}