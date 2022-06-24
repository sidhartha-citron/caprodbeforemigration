@isTest
public class TestContactObjectTriggers {
    
    static testMethod void insertUpdateContact(){
        
        TestDataFactory.crtAcctContact(1,1);
        Account a = TestDataFactory.accounts[0];
        Contact c = TestDataFactory.contacts[0];
        /*
        Contact c = new Contact(
            FirstName = 'TestFirstName', 
            LastName = 'TestLastName', 
            Email = 'testUser@UserCommunity.com', 
            AccountId = a.Id, 
            Title = 'title',
            Phone = '12345678',
            Fax = '12345678',
            MobilePhone = '12345678',
            Customer_Satisfaction_eSurveys__c = FALSE,
            Customer_Opinion_eSurveys__c = TRUE,
            Customer_eNewsletters__c = FALSE,
            Promotional_Offer_Emails__c = TRUE,
            Promotional_Mailings__c = FALSE
            
        );
        insert c;
*/
        
        User newUser = getCommunityUser(c); 
        c.Customer_Opinion_eSurveys__c = FALSE;
        update c;
    }
    
    public static User getCommunityUser(Contact newContact) {
        
        Profile communityProfile = [SELECT Id FROM Profile WHERE Usertype='PowerCustomerSuccess' LIMIT 1]; 
        User newUser = new User(
            Alias = 'testA', 
            Email = newContact.Email, 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = newContact.FirstName,
            LastName = newContact.LastName, 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = UserInfo.getProfileId(),
            TimeZoneSidKey = 'America/New_York', 
            UserName = newContact.Email, 
            //ContactId=newContact.Id, 
            CommunityNickname=newContact.FirstName, 
            Contact_Login__c=newContact.Email, 
            Employee_Number__c = 'ABCD123TESTCOMMUNITY'
        );
        insert newUser;
        
        return newUser;
    }
}