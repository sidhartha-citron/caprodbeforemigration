@isTest
private class StandingOrderTestClass {
    static testMethod void validateStandingOrder() {
    /*
        TestDataFactory.crtAcctContact(1, 1);
        
        System.debug('Value of New Account ' + TestDataFactory.accounts[0].Name + ' ' + TestDataFactory.accounts[0].Id);
        
        Standing_Order__c so = new Standing_Order__c(Name='S00000', Order_Number__c='S00000', Account__c=TestDataFactory.accounts[0].Id);
        insert so;
        
        so = [SELECT Active__c FROM Standing_Order__c WHERE Order_Number__c='S00000'];
        System.debug('Value of Active before running setInActive() ' + so.Active__c);
        
        StandingOrder.setInActive();
        
        so = [SELECT Active__c FROM Standing_Order__c WHERE Order_Number__c='S00000'];
        System.debug('Value of Active after running setInActive() ' + so.Active__c);
        so.Active__c = FALSE;
        Update(so);
        
        StandingOrder.setActive();
        
        so = [SELECT Active__c FROM Standing_Order__c WHERE Order_Number__c='S00000'];
        System.debug('Value of Active after running setActive() ' + so.Active__c);
        
        System.assertEquals(so.Active__c, FALSE);
	*/
    }
    static testMethod void validateStandingOrderLineItem() {
    /*
        TestDataFactory.crtAcctContact(1, 1);
        
        System.debug('Value of New Account ' + TestDataFactory.accounts[0].Name + ' ' + TestDataFactory.accounts[0].Id);
        
        Standing_Order__c so = new Standing_Order__c(Name='S00000', Order_Number__c='S00000', Account__c=TestDataFactory.accounts[0].Id);
        insert so;
        
        Standing_Order_Line_Item__c soli = new Standing_Order_Line_Item__c(Standing_Order__c=so.Id, Name='S00000-1', UniqueKey__c='S00000-1');
       	insert soli;
        
        soli = [SELECT Active__c FROM Standing_Order_Line_Item__c WHERE UniqueKey__c='S00000-1'];
        System.debug('Value of Active before running setInActive() ' + soli.Active__c);
        
        StandingOrderLineItem.setInActive();
        
        soli = [SELECT Active__c FROM Standing_Order_Line_Item__c WHERE UniqueKey__c='S00000-1'];
        System.debug('Value of Active after running setInActive() ' + soli.Active__c);
        soli.Active__c = FALSE;
        Update(soli);
        
        StandingOrderLineItem.setActive();
        
        soli = [SELECT Active__c FROM Standing_Order_Line_Item__c WHERE UniqueKey__c='S00000-1'];
        System.debug('Value of Active after running setActive() ' + soli.Active__c);
        
        System.assertEquals(soli.Active__c, FALSE);
	*/
    }
}