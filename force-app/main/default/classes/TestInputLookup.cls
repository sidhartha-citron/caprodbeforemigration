@isTest
public class TestInputLookup {
    
    static testmethod void testLoadDefault() {
        InputLookup.loadDefault(UserInfo.getUserId(), 'User');
    }
    
    static testmethod void testLoadDefaultException() {
        String Id;
        InputLookup.loadDefault(Id, 'Skill');
    }
    
    static testmethod void testSearchLookup() {
        InputLookup.searchLookup('Stuff', 'Account');
    }
    
    static testmethod void testSearchLookupSkill() {
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Site_Survey_Skills_Prefix__c = 'SSRS';
        insert fssetting;
        InputLookup.searchLookup('Stuff', 'Skill');
    }
    
    static testmethod void testSearchLookupException() {
        InputLookup.searchLookup('Stuff', 'TestObject');
    }
}