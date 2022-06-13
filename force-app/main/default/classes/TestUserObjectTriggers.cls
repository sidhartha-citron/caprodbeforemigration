@isTest
public class TestUserObjectTriggers {
    
    @testSetup static void setupmethod() {
        TestDataFactory.crtAcctContact(1, 1); 
        Account acc = TestDataFactory.accounts[0]; 
        Contact cont = TestDataFactory.contacts[0];
    }

    static testMethod void insertUpdateUser(){
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        system.debug('portalRole is ' + portalRole);
        
        Profile communityProfile = [SELECT Id FROM Profile WHERE Usertype='PowerCustomerSuccess' LIMIT 1]; 
        Profile profile1 = [Select Id from Profile where name = 'System Administrator'];
        User portalAccountOwner1 = new User(
            UserRoleId = portalRole.Id,
            ProfileId = profile1.Id,
            Username = System.now().millisecond() + 'test2@test.com',
            Alias = 'batman',
            Email='bruce.wayne@wayneenterprises.com',
            EmailEncodingKey='UTF-8',
            Firstname='Bruce',
            Lastname='Wayne',
            LanguageLocaleKey='en_US',
            LocaleSidKey='en_US',
            TimeZoneSidKey='America/Chicago',
            Employee_Number__c = 'ABCD123TESTCOMMUNITY1'
        );
        Database.insert(portalAccountOwner1);
        
        //User u1 = [Select ID From User Where Id =: portalAccountOwner1.Id];
        
        System.runAs ( portalAccountOwner1 ) {
                    
            Contact contact1 = [SELECT Id, Email, FirstName, LastName from Contact LIMIT 1]; 
            //Create user
            Profile portalProfile = [SELECT Id FROM Profile Where name = 'Citron Hygiene Community User' Limit 1];
            
            Account acct1 = [SELECT Id, Name FROM Account LIMIT 1];
            acct1.OwnerId = portalAccountOwner1.Id;
            Database.update(acct1);
            
            contact1.OwnerId = portalAccountOwner1.Id;
            Database.update(contact1);
            
            portalRole = [Select Id, Name From UserRole Where PortalType = 'CustomerPortal' LIMIT 1];
        	system.debug('portalRole is ' + portalRole.name);
            //UserRoleId = portalRole.Id,
            User user1 = new User(
                Username = System.now().millisecond() + 'test12345@test.com',
                ContactId = contact1.Id,
                ProfileId = portalProfile.Id,
                Alias = 'test123',
                Email = 'test12345@test.com',
                EmailEncodingKey = 'UTF-8',
                LastName = 'McTesty',
                CommunityNickname = 'test12345',
                TimeZoneSidKey = 'America/Los_Angeles',
                LocaleSidKey = 'en_US',
                LanguageLocaleKey = 'en_US',
                Employee_Number__c = 'ABCD123TESTCOMMUNITY1111'
            );
            Database.insert(user1);
        }  
    }
}