global class SurveyLocationsBatchable implements Database.Batchable<SObject>, Schedulable{
    
    public String queryString { get; set; }
    
    global SurveyLocationsBatchable() {
        queryString = 'SELECT Id FROM Survey_Location__c WHERE UpdateQuantity__c = TRUE';
    }
    
    global SurveyLocationsBatchable(String s) {
        queryString = 'SELECT Id FROM Survey_Location__c WHERE Id = \'' + s + '\'';
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc){
        System.debug(queryString);
        return Database.getQueryLocator(queryString);
    }
    
    global void execute(Database.BatchableContext bc, List<SObject> batch){
        Set<Id> locationIds = new Set<Id>();
        
        for(Survey_Location__c sl : (List<Survey_Location__c>) batch){
            locationIds.add(sl.Id);
        }
        
        processLocations(locationIds);
    }
    
    global void processLocations(Set<Id> locationIds) {
        
        List<Survey_Location__c> surveyLocations = new List<Survey_Location__c>();
        Map<Id, Integer> locationQuantityMap = new Map<Id, Integer>();
        Map<Id, Survey_Location__c> locationMap = new Map<Id, Survey_Location__c>([SELECT Id, Quantity_of_Allocated_Products__c, UpdateQuantity__c FROM Survey_Location__c 
                                                                                 WHERE Id IN :locationIds]);
        
        for(Survey_Asset_Location__c sal : [SELECT Id, Survey_Location__c FROM Survey_Asset_Location__c WHERE Survey_Location__c<>NULL AND Survey_Location__c IN :locationIds
                                           ORDER BY Survey_Location__c])
        {
            if(!locationQuantityMap.containsKey(sal.Survey_Location__c)) {
                locationQuantityMap.put(sal.Survey_Location__c, 1);
            } else {
                Integer count = locationQuantityMap.get(sal.Survey_Location__c);
                locationQuantityMap.put(sal.Survey_Location__c, count + 1);
                System.debug('>>Count: ' + count);
            }
        }
        
        for(Id locationId : locationQuantityMap.keySet()) {
            Integer count = locationQuantityMap.get(locationId);
            if(count!=null) {
                System.debug('>>Id: ' + locationId + ' count: ' + count);
                surveyLocations.add(
                    new Survey_Location__c (
                        Id = locationId, 
                        Quantity_of_Allocated_Products__c = count,
                        UpdateQuantity__c = FALSE
                    )
                );
            }
        }
        
        System.debug(surveyLocations);
        update surveyLocations;
    }
    
    global void finish(Database.BatchableContext bc){
        
    } 
        
    global void execute(SchedulableContext ctx) {
        Database.executeBatch(new SurveyLocationsBatchable(), 100);
    }

}