@istest
public class Test_DeleteComplexReports {
    
static List<complexReports__c> listcr = new List<ComplexREports__c>();

    @testSetup 
    static void setup() {
       
       
        for (Integer i=0;i<10;i++) {
            listcr.add(new complexReports__c(AccountName__c='Account '+i));
        }
        insert listcr;
        
    }
    static testmethod void test() {        
        Test.startTest();
       Delete_Complex_Report dcr = new Delete_Complex_Report();
        Id batchId = Database.executeBatch(dcr);
        Test.stopTest();
        // after the testing stops, assert records were updated properly
        System.assertEquals(0, listcr.size());
    }
    
}