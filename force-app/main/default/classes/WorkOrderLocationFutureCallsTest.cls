@isTest
public class WorkOrderLocationFutureCallsTest {
	@testSetup
    static void setup() {
        Site_Survey__c ss = new Site_Survey__c();
        insert ss;
        
        List<Survey_Location__c> locs = new List<Survey_Location__c>();
        
        for (Integer i = 0; i < 3; i++) {
            locs.add(new Survey_Location__c(Name='test'+i, Site_Survey__c=ss.Id));
        }
        
        insert locs;
    }
    
    @isTest
    static void testWorkOrderLocationFutureCalls() {
		Map<Id, Decimal> serviceOrders = new Map<Id, Decimal>();
        
        Integer iterator = 1;
        
        for (Survey_Location__c loc : [SELECT Id, Service_Order__c FROM Survey_Location__c]) {
            serviceOrders.put(loc.Id, iterator);
            iterator++;
        }
        
        WorkOrderLocationFutureCalls.updateServiceOrder(serviceOrders);
    }
}