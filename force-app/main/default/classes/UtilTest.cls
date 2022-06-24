@IsTest
public with sharing class UtilTest {
    static testMethod void testDeveloperIdPostive() {  
        RecordType rt = [SELECT Id FROM RecordType WHERE SobjectType='Account' AND DeveloperName='Account'];

        System.assertEquals(rt.Id, Util.getRecordTypeIdByDevName('Account', 'Account'));
    }
}