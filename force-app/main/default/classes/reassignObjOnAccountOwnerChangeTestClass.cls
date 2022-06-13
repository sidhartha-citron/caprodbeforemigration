@isTest
public class reassignObjOnAccountOwnerChangeTestClass {
    static testMethod void testAccountOwnerChange() {        
        test.StartTest();
        // Setup test data
        // This code runs as the system user
        Profile p = [SELECT Id FROM Profile WHERE Name='Standard User']; 
        User dcf = [SELECT Id FROM User WHERE Id='005j000000C24pMAAR']; 
        User u = new User(Alias = 'standt', Email='standarduser1@cannonservices.ca', 
            EmailEncodingKey='UTF-8', LastName='Testing', LanguageLocaleKey='en_US', 
            LocaleSidKey='en_US', ProfileId = p.Id, 
            TimeZoneSidKey='America/Los_Angeles', UserName='standarduser1@cannonservices.ca', Employee_Number__c = 'ABCD123TEST');
        
        insert u;
        System.debug('User u: ' + u.Id);
        
		Field_Service_Settings__c fss = new Field_Service_Settings__c();
       	fss.Integration_User_Id__c = dcf.Id;
        
        insert fss;
        
        System.runAs(dcf) {
            // The following code runs as user 'u' 
            System.debug('Current User: ' + UserInfo.getUserName());
            System.debug('Current Profile: ' + UserInfo.getProfileId()); 
            
            /*
            Account a = new Account(Name='Test Account',OwnerId=dcf.Id);
            a.Lead_Source__c='Blitz Day';
            a.BillingCountry='CA';
            a.BillingState='ON';
            a.BillingCity='Toronto';
            a.Phone = '9051231234';
            insert a;
			*/
            TestDataFactory.crtAcctContact(1, 0); 
            Account a = TestDataFactory.accounts[0];
            a.Name='Test Account'; 
            a.OwnerId=dcf.Id;
            a.Lead_Source__c='Blitz Day';
            a.BillingCountry='CA';
            a.BillingState='ON';
            a.BillingCity='Toronto';
            a.Phone = '9051231234';
            update a;
            
        
            Opportunity o = new Opportunity(Name=a.Name + ' Opportunity ', 
                                StageName='Presentation', CloseDate=System.today().addMonths(1),
                                AccountId=a.Id, OwnerId=dcf.Id);
            insert o;
                        
            System.debug('Created Account Owner: ' + a.OwnerId);
            System.debug('Created Opportunity Owner: ' + o.OwnerId);
            System.debug('Changing to User: ' + u.Id);
            
            a.OwnerId = u.Id;
            update a;
            
            //fetch updated version
            Opportunity oUp = [SELECT Id, OwnerId FROM Opportunity WHERE Id=:o.Id];
            
            System.debug('Updated Account Owner: ' + a.OwnerId);
            System.debug('Updated Opportunity Owner: ' + oUp.OwnerId);
            
            System.assertEquals(oUp.OwnerId, u.Id);
            test.StopTest();
        }
     
     
    }
}