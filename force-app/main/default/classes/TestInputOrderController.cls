@isTest
public class TestInputOrderController {
    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    // HELPER METHODS
    static void setupHelper() {
        //TestDataFactory.crtCPQSettings();
		TestDataFactory.crtFieldSettings();
		//TestDataFactory.crtFieldServiceSetting();

		//TestDataFactory.crtProdWithPE(4);
        TestDataFactory.crtAcctContact(2, 1);
        ID billToRecordType = [select Id from recordType where name = 'Customer Bill To'].id; 
        Id shipToRecordType = [select Id from recordType where name = 'Customer Ship To'].id; 
        List<Account> accounts = TestDataFactory.accounts;
        accounts[0].RecordTypeId = billToRecordType;
        accounts[1].RecordTypeId = shipToRecordType;
        accounts[1].ParentId = accounts[0].Id;
        
        update accounts[0];
		update accounts[1];        
        
        Order ord = (Order) TestUtils.createSObject(new Order(AccountId = accounts[1].Id));
        insert ord;

    }

    
    static testmethod void testLoadDefault() {
        InputOrderController.loadDefault(UserInfo.getUserId(), 'User');
    }
    
    static testmethod void testLoadDefaultException() {
        String Id;
        InputOrderController.loadDefault(Id, 'Skill');
    }
    
    static testmethod void testSearchLookup() {
        Order ord = [SELECT Id FROM Order][0];
        InputOrderController.searchLookup('001', 'Order', ord.Id);
    }
    

    
    static testmethod void testSearchLookupException() {
        Order ord = [SELECT Id FROM Order][0];
        InputOrderController.searchLookup('Stuff', 'TestObject', ord.Id);
    }


}