/**
 * Sets survey-related fields on Order, if criteria is met.
 * @author Ahsan Butt
 */
trigger OrderSendSurveyTrigger on Order (before insert, before update) {
  Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    String ORDER_STATUS_ACTIVATED = dataSets.Order_Active_Stage__c; 
    String INSTALLATION_STATUS_INSTALL  = 'Install'; 
    Integer HOUR_IN_MILLIS = 60 * 60 * 1000;
    
    List<Order> activatedOrders = new List<Order>();  
    Set<Id> acctIds = new Set<Id>();
    Set<Id> activatedOrderIds = new Set<Id>();
    
    // Identify activated Order with recurring lines
    for (Order o : trigger.new) {
        Order oldO = Trigger.isInsert ? new Order() : Trigger.OldMap.get(o.Id);
        
        if (o.Status == ORDER_STATUS_ACTIVATED && oldO.Status != o.Status && o.Recurring_Lines__c > 0) {
            activatedOrders.add(o);
            activatedOrderIds.add(o.Id);
            acctIds.add(o.AccountId);
        }       
    }
 
    
    // Get first recurring, active Order for each account
    // Also, query for related Order Items so we can check LACDs etc.
    List<Order> orders = [SELECT Id, AccountId, CreatedDate, EffectiveDate,
                          (SELECT Id, Installation_Status__c, Last_Automation_Created_Date__c, LACD_Update_Date_Time__c FROM OrderItems WHERE Active__c = true AND Product2.Never_Generate_Work_Order__c = false)
                          FROM ORDER 
                          WHERE (AccountId IN :acctIds AND Status = :ORDER_STATUS_ACTIVATED AND Recurring_Lines__c > 0) OR Id IN :activatedOrderIds order by EffectiveDate ASC];
    
    Map<Id, Order> acctToFirstOrderMap = new Map<Id, Order>();
    for (Order o : orders) {
        Order firstOrder = acctToFirstOrderMap.get(o.AccountId);
        
        if (firstOrder == null) {
      acctToFirstOrderMap.put(o.AccountId, o);
        } else {
            // Check if there's a tie for Effective Date, if so tie-break with CreatedDate
            if (o.EffectiveDate == firstOrder.EffectiveDate && o.CreatedDate < firstOrder.CreatedDate) {
                acctToFirstOrderMap.put(o.accountId, o);
            }  
        }
    }  
    
    // Now iterate over trigger orders, check if it's the first order, then check rest of criteria
    for (Order o : activatedOrders) {
        Order firstOrder = acctToFirstOrderMap.get(o.AccountId);
        
        // Check if first order, and there is at least one related order items that is active
        if (firstOrder == null || firstOrder.Id != o.Id || firstOrder.OrderItems == null || firstOrder.OrderItems.size() == 0) continue;

        
        // Confirm that all active OIs have LACD and at least one is Install status
        boolean allHaveLACD = true;
        boolean atLeastOneInstall = false;
        boolean recentLACD = false;
        
        for (OrderItem firstOrderOI : firstOrder.OrderItems) {
            if (firstOrderOI.Last_Automation_Created_Date__c == null) allHaveLACD = false;
            if (firstOrderOI.Installation_Status__c == INSTALLATION_STATUS_INSTALL) atLeastOneInstall = true;
            if (firstOrderOI.LACD_Update_Date_Time__c != null) {
                // subtract millis from now and compare against number of millis in an hour
              if (DateTime.now().getTime() - firstOrderOI.LACD_Update_Date_Time__c.getTime() <= HOUR_IN_MILLIS) recentLACD = true;    
            }
        }
        
        if (allHaveLACD == false || atLeastOneInstall == false || recentLACD == false) continue;
        
        // Populate order's survey field
        o.Send_Post_Installation_Survey__c = true;
    }
}