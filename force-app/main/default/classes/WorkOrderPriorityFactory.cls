public class WorkOrderPriorityFactory {
    private static final Integer MINUTES_IN_HOUR = 60;
    private static final Date CURR_DATE = System.Today();
    private static final String YES_VALUE = 'Yes';
    private static final String DELIMITER = '>';

    public void executePriorityLogicV2() {
        if (!TriggerHelper.hasRun) {
            TriggerHelper.hasRun = true;
            
            Map<Id, WorkOrder> wos = new Map<Id, WorkOrder>();
            Map<Integer, Set<Work_Order_Priority_Weights__c>> unsortedWeights = new Map<Integer, Set<Work_Order_Priority_Weights__c>>();
            Map<Integer, Set<Work_Order_Priority_Weights__c>> sortedWeights = new Map<Integer, Set<Work_Order_Priority_Weights__c>>();
            Map<String, Work_Order_Priority_Weights__c> weights = new Map<String, Work_Order_Priority_Weights__c>();
            List<Integer> wopwNumbers = new List<Integer>();
            
            for (Work_Order_Priority_Weights__c pw : Work_Order_Priority_Weights__c.getAll().values()) {
                Integer priority = Integer.valueOf(pw.Priority_Ranking__c);
                
                if (!unsortedWeights.containsKey(priority)) {
                    unsortedWeights.put(priority, new Set<Work_Order_Priority_Weights__c>());
                }
                unsortedWeights.get(priority).add(pw);
                wopwNumbers.add(priority);
            }
            wopwNumbers.sort();
            
            for (Integer pNum : wopwNumbers) {
                for (Work_Order_Priority_Weights__c weight : unsortedWeights.get(pNum)) {
                    String key = weight.Customer_Tier__c + DELIMITER + weight.At_Risk__c + DELIMITER + weight.Due_Date__c + DELIMITER + weight.Duration_1_Hour__c;
                    weights.put(key, weight);
                }
            }
            
            //Debugging loop
            //for (String t : weights.keyset()) {
            //    System.debug('Weight Table: ' + t + ' --> ' + weights.get(t).Priority_Ranking__c);
            //}
            
            List<WorkOrder> wosToUpdate = new List<WorkOrder>();
            for (WorkOrder wo : (List<WorkOrder>)Trigger.New) {
                if (wo.Id == null) {
                    continue;
                }
                //System.debug('>>WorkOrder Tier: ' + wo.Customer_Tier__c);
                WorkOrder woToUpdate = new WorkOrder(Id=wo.Id, Priority_Derived__c=null);
                
                String apptOverHour = wo.Service_Appointment_Duration__c > MINUTES_IN_HOUR ? YES_VALUE : 'null';
                String tierCheck = String.isBlank(wo.Customer_Tier__c) ? '*' : wo.Customer_Tier__c;
                String daysCheck = wo.Days_Until_Service_Appointment_Due_Date__c > 13 ? '14+' : String.valueOf(wo.Days_Until_Service_Appointment_Due_Date__c);
                String workOrderKey = tierCheck + DELIMITER + wo.Account_at_Risk__c + DELIMITER + daysCheck + DELIMITER + apptOverHour;
                
                List<String> keys = workOrderKey.split(DELIMITER);
                //System.debug('WO Key: ' + workOrderKey + ' --> ' + keys);

                for (String key : weights.keySet()) {
                    String[] index = key.split(DELIMITER);
                    //System.debug('WEIGHT: ' + index + ' --> ' + Integer.ValueOf(weights.get(key).Priority_Ranking__c));
                    
                    try {
                        if (index[0] == keys[0] || String.isBlank(index[0]) || index[0] == 'null') {
                            if (index[1] == keys[1] || String.isBlank(index[1]) || index[1] == 'null') {// || index[1] == 'null'
                                if (index[2] == keys[2] || String.isBlank(index[2]) || index[2] == 'null') {
                                    if (index[3] == keys[3] || String.isBlank(index[3]) || index[3] == 'null') {// || index[3] == 'null'
                                        //System.debug('Match');
                                        woToUpdate.Priority_Derived__c = Integer.ValueOf(weights.get(key).Priority_Ranking__c);
                                        //System.debug(woToUpdate.Priority_Derived__c);
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        //breaking because if something happens, just give it a 99 instead of potentially giving it the wrong priority
                        break;
                    }
                }
                
                if (woToUpdate.Priority_Derived__c == null) {
                    woToUpdate.Priority_Derived__c = 99;
                }
                
                wosToUpdate.add(woToUpdate);
                //System.debug('Final Priority: ' + workOrderKey + ' --> ' + woToUpdate.Priority_Derived__c);
            }
            
            update wosToUpdate;
        }
    }
}