/*
    Description :  Test Class related for Account Utility class
    Author : Aieleeta
*/

@isTest
private class AccountUtilTest{
    static testmethod void TEST_VALIDATE_ACCOUNT_FOR_PARENT(){
        Boolean isError = False;
        Account[] account = TestingUtils.createAccounts(2,TestingUtils.rType);
        insert account;
        
        account[1].ParentId = account[0].Id;
        Account account2 = account[1];
        update account2;
        
        Account account3 = TestingUtils.createAccounts(1,TestingUtils.rType)[0];
        insert account3;
        
        Account account4 = TestingUtils.createAccounts(1,TestingUtils.rType)[0];
        insert account4;
        
        Account account5 = TestingUtils.createAccounts(1,TestingUtils.rType)[0];
        insert account5;
        
        Account account1 = account[0];
        
        Test.startTest();
            account1.ParentId = account3.Id;
            Database.SaveResult accErrorList = Database.update(account1,false);
            for(Database.Error e : accErrorList.errors){
                if(e.getMessage() != null || e.getMessage() != ''){
                    isError = true;
                }
            }
            System.assertEquals(true,isError);
            
            account4.ParentId = account2.Id;
            Database.SaveResult accErrorList2 = Database.update(account4,false);
            for(Database.Error e : accErrorList2.errors){
                if(e.getMessage() != null || e.getMessage() != ''){
                    isError = true;
                }
            }
            System.assertEquals(true,isError);
            
            account5.ParentId = account1.id;
            update account5;
            Account acc = [Select isParent__c from Account where id =: account1.Id];
            System.assertEquals(account5.ParentId,account1.Id); 
        Test.stopTest();
    }
    
    static testmethod void TEST_UPDATE_ISPARENT_ON_ACCOUNT(){
        Account[] account = TestingUtils.createAccounts(2,TestingUtils.rType);
        insert account;
                
        Account account3 = TestingUtils.createAccounts(1,TestingUtils.rType)[0];
        insert account3;
        
        Account account4 = TestingUtils.createAccounts(1,TestingUtils.rType)[0];
        insert account4;
        
        Account account5 = TestingUtils.createAccounts(1,TestingUtils.rType)[0];
        insert account5;
        
        Account account1 = account[0];
        
        account[1].ParentId = account[0].Id;
            Account account2 = account[1];
            update account2;
        
            account5.ParentId = account1.id;
            update account5;

            List<Account> parentAccount = new List<Account>();
            parentAccount = [Select Id,isParent__c, Parent.id,parent.isParent__c from Account where ParentId =: account1.id];
            System.assertEquals(parentAccount.size() ,2 );

        Test.startTest();

            delete account2;
            Account acc = [select IsParent__c from Account where id =:  account1.Id];
            System.assertEquals(acc.IsParent__c ,true );
            
            account5.ParentId = null;
            update account5;
                
            System.assertEquals(account1.IsParent__c ,false );
            
        Test.stoptest();
        
    }
    
    
}