@isTest
public class TestCasePicklistValue {
    static testMethod void testGetPicklistValues() {
        Test.startTest();
        Test.setMock(WebServiceMock.class, new TestMetadataClasses());
        CasePicklistValue.getPicklistValues();
        Test.stopTest();
    }
}