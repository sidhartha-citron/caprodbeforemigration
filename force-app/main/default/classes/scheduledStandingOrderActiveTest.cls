@isTest
private class scheduledStandingOrderActiveTest {
    
    // CRON expression: midnight on March 15.
    // Because this is a test, job executes
    // immediately after Test.stopTest().
    public static String CRON_EXP = '0 0 0 15 3 ? 2022';
    
    static testmethod void test() {
        System.runAs(new User(Id = UserInfo.getUserId())){
            Test.startTest();
            
            // Schedule the test job
            String jobId = System.schedule('ScheduleApexClassTest',
                                           CRON_EXP, 
                                           new scheduledStandingOrderActive());
            
            // Get the information from the CronTrigger API object
            CronTrigger ct = [SELECT Id, CronExpression, TimesTriggered, 
                              NextFireTime
                              FROM CronTrigger WHERE id = :jobId];
            
            // Verify the expressions are the same
            System.assertEquals(CRON_EXP, 
                                ct.CronExpression);
            
            // Verify the job has not run
            System.assertEquals(0, ct.TimesTriggered);
            
            // Verify the next time the job will run
            System.assertEquals('2022-03-15 00:00:00', 
                                String.valueOf(ct.NextFireTime));
            // Verify the scheduled job hasn't run yet
            
            TestDataFactory.crtAcctContact(1, 0); 
            Account a = TestDataFactory.accounts[0];
            
            System.debug('Value of New Account ' + a.Name + ' ' + a.Id);
            
            Standing_Order__c so = new Standing_Order__c(Name='S00000', Order_Number__c='S00000', Account__c=a.Id);
            insert so;
            
            so = [SELECT Active__c FROM Standing_Order__c WHERE Order_Number__c='S00000'];
            so.Active__c = FALSE;
            Update(so); 
            
            so = [SELECT Active__c FROM Standing_Order__c WHERE Order_Number__c='S00000'];
            System.debug('Value of Active before scheduled job runs() ' + so.Active__c);
            
            System.assertEquals(so.Active__c, FALSE);
            Test.stopTest();
            
            // Now that the scheduled job has executed after Test.stopTest(),
            //   fetch the new Active__c value.
            so = [SELECT Active__c FROM Standing_Order__c WHERE Order_Number__c='S00000'];
            System.debug('Value of Active after scheduled job runs() ' + so.Active__c);
            System.assertEquals(so.Active__c, FALSE);
            
        }
    }
}