/**
 * @FileName: ApexUtilsTest
 * @Description: Test methods for Apex Utility class
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       1/10/2020         Created
 *-----------------------------------------------------------  
 */
@IsTest
private class ApexUtilsTest {

    @IsTest
    static void filterOnFieldChange() {
        Map<Id,SObject> objects1 = new Map<Id,SObject>(TestUtils.createSObjectList(new Account(), 2, true));
        Map<Id,SObject> objects2 = new Map<Id,SObject>(TestUtils.createSObjectList(new Account(), 2, true));

        Test.startTest();
        List<SObject> notChanged = ApexUtils.filterOnFieldChange(objects1.values(), objects1, 'Name');
        List<SObject> changed = ApexUtils.filterOnFieldChange(objects1.values(), objects2, 'Name');
        Test.stopTest();

        System.assert(notChanged.isEmpty(), 'Name fields should not be different');
        System.assert(!changed.isEmpty(), 'Name fields should be different');
    }

    @IsTest
    static void fieldChanged() {
        List<SObject> objects = TestUtils.createSObjectList(new Account(), 2);

        Boolean hasNotChanged;
        Boolean hasChanged;

        Test.startTest();
        hasNotChanged = ApexUtils.fieldChanged(objects[0], objects[0], 'Name');
        hasChanged = ApexUtils.fieldChanged(objects[0], objects[1], 'Name');
        Test.stopTest();

        System.assertEquals(false, hasNotChanged, 'Name field should not be different');
        System.assert(hasChanged, 'Name field should be different');
    }

    @IsTest
    static void writeToTargetRecord() {
        SObject acc = TestUtils.createSObject(new Account());
        SObject con = TestUtils.createSObject(new Contact());
        Map<String,String> fieldMapping = new Map<String,String>{'LastName' => 'Name'};

        Test.startTest();
        ApexUtils.writeToTargetRecord(acc, con, fieldMapping);
        Test.stopTest();

        System.assertEquals(acc.get('Name'), con.get('LastName'), 'Account name should equal Contact last name');
    }

    @IsTest
    static void convertListToMap() {
        List<SObject> objects = TestUtils.createSObjectList(new Account(), 2);

        Test.startTest();
        Map<String,SObject> objectsByName = (Map<String,SObject>) JSON.deserialize(
                ApexUtils.convertListToMap(objects, 'Name', false),
                Map<String,SObject>.class
        );
        Test.stopTest();

        System.assertNotEquals(null, objectsByName.get(String.valueOf(objects[0].get('Name'))), 'Name fields should be used as map keys');
    }

    @IsTest
    static void convertListToMapListValues() {
        List<SObject> objects = TestUtils.createSObjectList(new Account(), 2);

        Test.startTest();
        Map<String,List<SObject>> objectsByName = (Map<String,List<SObject>>) JSON.deserialize(
                ApexUtils.convertListToMap(objects, 'Name'),
                Map<String,List<SObject>>.class
        );
        Test.stopTest();

        System.assertNotEquals(null, objectsByName.get(String.valueOf(objects[0].get('Name'))), 'Name fields should be used as map keys');
    }

    @IsTest
    static void getFieldPicklistValues() {
        Test.startTest();
        List<ApexUtils.OptionWrapper> picklistValues = ApexUtils.getFieldPicklistValues('Account', 'Type', true);
        Test.stopTest();

        System.assert(!picklistValues.isEmpty());
    }

    @IsTest
    static void getFieldValue() {
        SObject object1 = TestUtils.createSObject(new Account(), true);
        System.debug('+++' + (String) object1.get('AccPac_Account__c'));
        SObject object2 = TestUtils.createSObject(new Account(
                RecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Customer_Ship_To').getRecordTypeId(),
                ParentId = (Id) object1.get('Id'),
                AccPac_Account__c = (String) object1.get('AccPac_Account__c') + '1'
        ), true);

        SObject object2After = [SELECT Id, Parent.Name FROM Account WHERE Id = :(Id) object2.get('Id')];

        Test.startTest();
        String fieldValue = (String) ApexUtils.getFieldValue(object2After, 'Parent.Name');
        Test.stopTest();

        System.assertEquals((String) object1.get('Name'), fieldValue);
    }

    @IsTest
    static void getIdsFromField() {
        List<SObject> objects = TestUtils.createSObjectList(new Account(), 25, true);

        Test.startTest();
        Set<Id> accountIds = ApexUtils.getIdsFromField(objects, 'Id');
        Test.stopTest();

        System.assertEquals(25, accountIds.size());
    }
}