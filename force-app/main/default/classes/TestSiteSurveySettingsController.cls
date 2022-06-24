@IsTest
public class TestSiteSurveySettingsController {

    @TestSetup static void setup() {
        Field_Service_Settings__c dataSets =  new Field_Service_Settings__c(Default_Skill_Level__c=1.0/*, Site_Survey_Skill_Requirement_Tab_Access__c=UserInfo.getProfileId()*/);
        Date todaysDate = System.today();
        List<Account> accounts = new List<Account>();
        List<Site_Survey__c> siteSurveys = new List<Site_Survey__c>();
        
        TestDataFactory.crtBillToAcctContact(3, 1);
        
        integer n = 1; 
        For(Account acct: TestDataFactory.accounts){
            acct.name = 'TestAccount'+n;
            n++; 
            accounts.add(acct);
        }
        update accounts; 
        
        System.debug(accounts);
        for(Integer i=1; i<3; i++) {
            siteSurveys.add(
                new Site_Survey__c(
                    Account__c=accounts.get(i).Id, 
                    Survey_Date__c = System.today(),
                    Status__c = 'Draft'
                )
            );
        }
        insert siteSurveys;
        
        Account a1 = accounts.get(1);
        Account a2 = accounts.get(2);
		a1.Site_Survey__c = siteSurveys.get(0).Id;
        a2.Site_Survey__c = siteSurveys.get(1).Id;
        update new List<Account>{a1, a2};
        
        Opportunity op = new Opportunity(
        	Name=accounts.get(0).Name+' Opportunity',
            AccountId=accounts.get(0).Id,
            StageName='Presentation', 
            CloseDate=System.today().addDays(30),
            Amount=0.0, 
            Type='Retention', 
            Opportunity_Type__c='Consumables', 
            LeadSource='Call In'
        ); 
        insert op;

        OpportunityContactRole oppRole = new OpportunityContactRole(
            OpportunityId=op.Id,
            ContactId=TestDataFactory.contacts[0].Id, 
            Role='Decision Maker',
            isPrimary=TRUE
        );
        insert oppRole;
        
        Order o = new Order(
        	AccountId=accounts.get(0).Id, 
            Status='Draft', 
            EffectiveDate=System.today()
        ); 
        insert o;
        
        List<SiteSurvey_RequiredSkills__c> skillRecords = new List<SiteSurvey_RequiredSkills__c>();
        for(Integer i=0; i<3; i++) {
            skillRecords.add(
                new SiteSurvey_RequiredSkills__c(
                    Site_Survey__c = a2.Site_Survey__c,  
                    Skill_Level__c = 1.0,
                    Skill_Name__c = 'TestSkill'+i,
                    Name = 'TestSkill'+i,
                    Skill_Record_Id__c = 'TestSkillId'+i,
                    EID__c = a2.Site_Survey__c +'.' + 'TestSkillId'+i, 
                    Line_of_Business__c = i==0 ? 'Chemical' : ''
                )
            );
        }
        insert skillRecords; 
    }
    
    static testMethod void testGetSiteSurveyIdOpportunityWithoutSSPart1() {
        List<String> queryParams = new List<String>{'Id, AccountId, Site_Survey__c, Account.Site_Survey__c'};
        Opportunity op = [SELECT Id, Name, AccountId, Site_Survey__c FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        Account acc = [SELECT Id, Site_Survey__c FROM Account WHERE Id =: op.AccountId];
        Account acc2 = [SELECT Id, Site_Survey__c FROM Account WHERE Name='TestAccount2'];
        acc.Site_Survey__c = null;
        update acc;
        SiteSurveySettingsController.getSiteSurveyId(op.Id, queryParams);
        acc.Site_Survey__c = acc2.Site_Survey__c;
        update acc;
        SiteSurveySettingsController.getSiteSurveyId(op.Id, queryParams);
    }
    
    static testMethod void testGetSiteSurveyIdOpportunityWithoutSSPart2() {
        List<String> queryParams = new List<String>{'Id, AccountId, Site_Survey__c, Account.Site_Survey__c'};
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        List<Site_Survey__c> siteSurveys = new List<Site_Survey__c>();
        for(Integer i=0; i<2; i++) {
            siteSurveys.add(
                new Site_Survey__c(
                    Account__c=op.AccountId, 
                    Survey_Date__c = System.today(),
                    Status__c = 'Draft'
                )
            );
        }
        insert siteSurveys;
        SiteSurveySettingsController.getSiteSurveyId(op.Id, queryParams);
    }
    
    static testMethod void testGetSiteSurveyIdOrderWithoutSSPart1() {
        List<String> queryParams = new List<String>{'Id, AccountId, Site_Survey__c, Account.Site_Survey__c'};
        Order o = [SELECT Id, Account.Name, AccountId FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        List<Site_Survey__c> siteSurveys = new List<Site_Survey__c>();
        for(Integer i=0; i<2; i++) {
            siteSurveys.add(
                new Site_Survey__c(
                    Account__c=o.AccountId, 
                    Survey_Date__c = System.today(),
                    Status__c = 'Draft'
                )
            );
        }
        insert siteSurveys;
        SiteSurveySettingsController.getSiteSurveyId(o.Id, queryParams);
    }
    
    static testMethod void testGetSiteSurveyIdOrderWithoutSSPart2() {
        List<String> queryParams = new List<String>{'Id, AccountId, Site_Survey__c, Account.Site_Survey__c'};
        Order o = [SELECT Id, Account.Name, Site_Survey__c, AccountId FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        SiteSurveySettingsController.getSiteSurveyId(o.Id, queryParams);
        Account acc = [SELECT Id, Site_Survey__c FROM Account WHERE Id =: o.AccountId];
        Account acc2 = [SELECT Id, Site_Survey__c FROM Account WHERE Name='TestAccount2'];
        acc.Site_Survey__c = null;
        update acc;
        SiteSurveySettingsController.getSiteSurveyId(o.Id, queryParams);
        acc.Site_Survey__c = acc2.Site_Survey__c;
        update acc;
        SiteSurveySettingsController.getSiteSurveyId(o.Id, queryParams);
    }
    
    static testMethod void testGetSiteSurveyIdOpportunityWithSS() {
        List<String> queryParams = new List<String>{'Id, AccountId, Site_Survey__c, Account.Site_Survey__c'};
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount2'];
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        op.AccountId=a.Id;
        update op;
        SiteSurveySettingsController.getSiteSurveyId(op.Id, queryParams);
    }
    
    static testMethod void testGetSiteSurveyIdOrderWithSS() {
        List<String> queryParams = new List<String>{'Id, AccountId, Site_Survey__c, Account.Site_Survey__c'};
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount2'];
        Order o = [SELECT Id, Account.Name, AccountId FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        o.AccountId=a.Id;
        update o;
        SiteSurveySettingsController.getSiteSurveyId(o.Id, queryParams);
    }
    
    static testMethod void testGetSiteSurveyIdOpportunityWithDifferentSS() {
        List<String> queryParams = new List<String>{'Id, AccountId, Site_Survey__c, Account.Site_Survey__c'};
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount2'];
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        Site_Survey__c ss = [SELECT Id, Account__c, Account__r.Name FROM Site_Survey__c WHERE Account__r.Name='TestAccount3' LIMIT 1].get(0);
        op.AccountId=a.Id;
        op.Site_Survey__c=ss.Id;
        update op;
        SiteSurveySettingsController.getSiteSurveyId(op.Id, queryParams);
    }
    
    static testMethod void testGetSiteSurveyIdOrderWithDifferentSS() {
        List<String> queryParams = new List<String>{'Id, AccountId, Site_Survey__c, Account.Site_Survey__c'};
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount2'];
        Order o = [SELECT Id, Account.Name, AccountId FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        Site_Survey__c ss = [SELECT Id, Account__c, Account__r.Name FROM Site_Survey__c WHERE Account__r.Name='TestAccount3' LIMIT 1].get(0);
        o.AccountId=a.Id;
        o.Site_Survey__c=ss.Id;
        update o;
        SiteSurveySettingsController.getSiteSurveyId(o.Id, queryParams);
    }
    
    static testMethod void testSaveSiteSurvey(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount1'];
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        insert ss; 
        SiteSurveySettingsController.saveSiteSurvey(ss);
        SiteSurveySettingsController.getlob();
    }
    
    static testMethod void testInitSkills() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Site_Survey__c ss = [SELECT Id, Account__c, Account__r.Name FROM Site_Survey__c WHERE Account__r.Name='TestAccount3' LIMIT 1].get(0);
        SiteSurveySettingsController.initSkills(ss.Id);
    }
    
    static testMethod void testUpdateSkills() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Site_Survey__c ss = [SELECT Id, Account__c, Account__r.Name FROM Site_Survey__c WHERE Account__r.Name='TestAccount3' LIMIT 1].get(0);
        List<SiteSurvey_RequiredSkills__c> skillRecords = [SELECT Id, Name, Site_Survey__c, Skill_Level__c, Skill_Record_Id__c, Skill_Name__c, Line_of_Business__c 
                                                                   FROM SiteSurvey_RequiredSkills__c WHERE Site_Survey__c =:ss.Id];
       
        
        SiteSurvey_RequiredSkills__c record = skillRecords.get(0);
        record.Skill_Level__c=20.0;  
        SiteSurveySettingsController.SkillRecord newRecord = new SiteSurveySettingsController.SkillRecord(record.Name, record.Skill_Name__c, record.Skill_Level__c, record.Skill_Record_Id__c, record.Id);
        SiteSurveySettingsController.Picklist newLob = new SiteSurveySettingsController.Picklist('Hygiene', true);
        newRecord.lineOfBusinesses = new Set<SiteSurveySettingsController.Picklist>{newLob};
        
        String skillString = JSON.serialize(newRecord);
        SiteSurveySettingsController.upsertSkill(skillString, ss.Id);
    }
    
    static testMethod void testSaveSkills() {
        Site_Survey__c ss = [SELECT Id, Account__c, Account__r.Name FROM Site_Survey__c WHERE Account__r.Name='TestAccount3' LIMIT 1].get(0);
        
        SiteSurveySettingsController.SkillRecord newRecord = new SiteSurveySettingsController.SkillRecord('TestSkillABC', 'TestSkillABC', true);
        newRecord.skillId = 'TestSkillRecordId';
        SiteSurveySettingsController.Picklist newLob = new SiteSurveySettingsController.Picklist('Chemical', true);
        newRecord.lineOfBusinesses = new Set<SiteSurveySettingsController.Picklist>{newLob};
        
        String skillString = JSON.serialize(newRecord);
        SiteSurveySettingsController.upsertSkill(skillString, ss.Id);
    }
    
    static testMethod void testDeleteSkills() {
        Site_Survey__c ss = [SELECT Id, Account__c, Account__r.Name FROM Site_Survey__c WHERE Account__r.Name='TestAccount3' LIMIT 1].get(0);
        List<SiteSurvey_RequiredSkills__c> skillRecords = [SELECT Id, Name, Site_Survey__c, Skill_Level__c, Skill_Record_Id__c, Skill_Name__c, Line_of_Business__c 
                                                                   FROM SiteSurvey_RequiredSkills__c WHERE Site_Survey__c =:ss.Id];
        SiteSurvey_RequiredSkills__c record = skillRecords.get(0);
        
        SiteSurveySettingsController.deleteSkill(record.Id, record.Site_Survey__c);
        
    }
    
    static testMethod void testGetColumns() {
        List<String> columnAPINames = new List<String>{'SiteSurvey_RequiredSkills__c.Name','SiteSurvey_RequiredSkills__c.Skill_Level__c','SiteSurvey_RequiredSkills__c.Line_of_Business__c'};
        SiteSurveySettingsController.getColumns(columnAPINames);
    }
    
    static testMethod void testExceptionsPart1() {
        List<String> queryParams = new List<String>{'Id, AccountId, Site_Survey__c, Account.Site_Survey__c, StageName, Status'};
        Order o = [SELECT Id, Account.Name FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        SiteSurveySettingsController.getSiteSurveyId(o.Id, queryParams);
        SiteSurveySettingsController.getSiteSurveyId(op.Id, queryParams);
    }
     
    static testMethod void testExceptionsPart3() {
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount2'];
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        try {
        	SiteSurveySettingsController.saveSiteSurvey(ss);
        } catch (Exception e) {
            //just for testing purposes, don't care here
        }
    }
    
    static testMethod void testExceptionsPart4() {
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount2'];
        Opportunity op = new Opportunity(
        	Name=a.Name+' Opportunity',
            AccountId=a.Id,
            StageName='Presentation', 
            CloseDate=System.today().addDays(30),
            Amount=0.0, 
            Type='Retention', 
            Opportunity_Type__c='Consumables', 
            LeadSource='Call In'
        ); 
        SiteSurveySettingsController.createSiteSurvey(a.Id, op, null);
    }
    
    static testMethod void testExceptionsPart5() {
        SiteSurveySettingsController.upsertSkill('', '');
    }
}