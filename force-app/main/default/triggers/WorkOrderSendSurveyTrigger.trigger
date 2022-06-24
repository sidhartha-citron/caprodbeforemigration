/**
 * Sets survey-related fields on completion of a first installation work order.
 * @author Ahsan Butt
 */
trigger WorkOrderSendSurveyTrigger on WorkOrder (before insert, before update) {
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    String FREQUENCY_ONE_TIME = dataSets.Non_Recurring_Frequency_Value__c;
    String INSTALLATION_STATUS_INSTALL  = 'Install';
    
    // To set survey-related fields, Work Order must be:
    // 1. Completed and of type 'Installation' work order for the Order
    // 2. All other 'Installation' work orders for this order must be complete
    // 3. related Order must be first Activated Order that has at least one recurring Order Item for that Acct
    // 4. related Order's OIs all must have LACD
    
    // Get all newly completed Work Orders of type Installation (also get related order ids)
    List<WorkOrder> installationCompleteWos = new List<WorkOrder>();
    Set<Id> acctIds = new Set<Id>();
    Set<Id> orderIds = new Set<Id>();
    Set<Id> woIds = new Set<Id>();
    for (WorkOrder wo : trigger.new) {
        WorkOrder oldWorkOrder = Trigger.isInsert ? new WorkOrder() : Trigger.OldMap.get(wo.Id);
        
        if (wo.Type__c == 'Installation' && wo.Status == dataSets.Work_Order_Completion_Status__c && oldWorkOrder.Status != dataSets.Work_Order_Completion_Status__c) {
           installationCompleteWos.add(wo); 
           acctIds.add(wo.AccountId);
           orderIds.add(wo.Order__c);
           woIds.add(wo.Id);
        }
    }
    
    // Get first Order for each account
    // Also, query for any related Order Items that have blank LACDs and installation work orders that are not complete
    List<Order> orders = [SELECT Id, AccountId, CreatedDate, ShipToContactId, Ship_To_Contact_Email__c, 
                          (SELECT Id, Last_Automation_Created_Date__c, Frequency__c, Installation_Status__c FROM OrderItems WHERE Active__c = true),
                          (SELECT Id FROM Work_Orders__r WHERE Type__c = 'Installation' AND Status != :dataSets.Work_Order_Completion_Status__c AND Id NOT IN :woIds)
                          FROM ORDER 
                          WHERE AccountId IN :acctIds AND Status = 'Activated' order by EffectiveDate ASC];
    
    Map<Id, Order> acctToFirstOrderMap = new Map<Id, Order>();
    for (Order o : orders) {
        if (!acctToFirstOrderMap.containsKey(o.AccountId)) {
            
            for (OrderItem oi : o.OrderItems) {
                // To be counted as the *first*, must also have at least one active (filtered in query) recurring product
                if (oi.Frequency__c != FREQUENCY_ONE_TIME) {
                    acctToFirstOrderMap.put(o.AccountId, o);
                    break;
                }
            }
        }
    }
    
    // Compare trigger wos against list of first work orders and stamp fields as necessary
    for (WorkOrder wo: installationCompleteWos) {
        Order firstOrder = acctToFirstOrderMap.get(wo.AccountId);
        
        // Check that Work Order is associated to first Order on Acct
        // and list of installation work orders that are not complete is empty
        if (firstOrder == null || firstOrder.Id != wo.Order__c || (firstOrder.Work_Orders__r != null && firstOrder.Work_Orders__r.size() > 0)) continue;
        
        
        // Check to see if all 'install' Order Items have LACD
        Boolean allHaveLACD = true;
        for (OrderItem oi : firstOrder.OrderItems) {
            if (oi.Installation_Status__c == INSTALLATION_STATUS_INSTALL && oi.Last_Automation_Created_Date__c == null) {
                allHaveLACD = false;
                break;
            }
        }
        
        if (allHaveLACD) {
            wo.Send_Post_Installation_Survey__c = true;
            system.debug('$*$*$*$ Send Post Install was set to True');
            wo.Survey_Recipient__c = firstOrder.ShipToContactId;
            wo.Survey_Recipient_Email__c = firstOrder.Ship_To_Contact_Email__c;
        }
    }
}