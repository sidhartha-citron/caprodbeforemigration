@isTest
public class TestVMIReport {
    
     Static testMethod void testVMIWithData() {
    	FSL.GlobalAPIS.addStatusTransition('New','Scheduled');
        FSL.GlobalAPIS.addStatusTransition('Scheduled','Dispatched');
    
        TestDataFactory.crtFieldSettings();
        TestDataFactory.crtAcctContact(1,0);
        TestDataFactory.accounts[0].OperatingHoursId = TestDataFactory.opthours[1].Id;
        TestDataFactory.accounts[0].Service_Territory__c = TestDataFactory.srvTers[1].Id;
        update TestDataFactory.accounts[0]; 
         
    	TestDataFactory.crtTestUsers(1);
        TestDataFactory.crtSiteSurvey(1);
        TestDataFactory.crtProdWithPE(5);
        TestDataFactory.crtWrkOrdersLines(1, 2);
        TestDataFactory.crtServiceAppts(1);
      	TestDataFactory.crtServiceResource(1);
        TestDataFactory.crtServiceTerMem(1);
        TestDataFactory.crtVMIProducts(2);
        TestDataFactory.crtAssignedResource();
        TestDataFactory.lSAs[0].Status = 'Dispatched';
        update TestDataFactory.lSAs[0];
                
        System.runAs(TestDataFactory.lUsers.get(0)){
            VMIReport.PayLoad pLoad = VMIReport.getWorkOrderItems('This_Week', DateTime.now(),DateTime.now(),
                                                'VMI Vendor Managed Inventory Service','','','Dispatched');
        }
        
        VMIReport vmiR = new VMIReport();
        
        System.runAs(TestDataFactory.lUsers.get(0)){
            ApexPages.currentPage().getParameters().put('fltr','This_Week');
            ApexPages.currentPage().getParameters().put('dtStart',String.valueOf(Datetime.now()));
        	ApexPages.currentPage().getParameters().put('dtEnd',String.valueOf(Datetime.now()));
       		ApexPages.currentPage().getParameters().put('Woli','VMI Vendor Managed Inventory Service');
        	ApexPages.currentPage().getParameters().put('Ter','');
        	ApexPages.currentPage().getParameters().put('Res','');
        	ApexPages.currentPage().getParameters().put('Status','Dispatched');
            ApexPages.currentPage().getParameters().put('isDtls','true');
            List<VMIReport.LineItem[]> llItem = vmiR.getVMIPDF();
        }
    }
}