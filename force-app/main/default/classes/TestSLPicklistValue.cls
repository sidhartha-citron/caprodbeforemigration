@isTest
public class TestSLPicklistValue {
    static testMethod void testGetDependantValues() {
        Test.startTest();
        Test.setMock(WebServiceMock.class, new TestMetadataClasses());
        SLPicklistValue.getDependantValues();
        Test.stopTest();
    }
}