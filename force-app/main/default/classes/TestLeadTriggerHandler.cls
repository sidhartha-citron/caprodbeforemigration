@isTest
public class TestLeadTriggerHandler {
    
    static testMethod void testFSALeadassignmentOnInsert(){ 
 
        Test.startTest();
        TestDataFactory.crtTestLeads(1, True);
        Test.stopTest(); 
  		
        
} 
    
    static testMethod void testFSALeadassignmentOnUpdate(){ 
 		List<Lead> leadsToUpdate = new List<Lead>(); 
        
        TestDataFactory.crtTestLeads(4, False); 
        leadsToUpdate = TestDataFactory.newLeads; 
        
        for(Lead L : leadsToUpdate){ 
        	L.FSA_Lead_Assignment__c = True; 
        }

        Test.startTest();
        update leadsToUpdate;
        Test.stopTest(); 
    } 

    
    
}