global class DeleteResourcePreferenceBatch implements Database.Batchable<SObject>, Schedulable {
    private String queryString = 'SELECT Id FROM ResourcePreference WHERE ';
    private final String ACCOUNT_PREFIX = Account.SObjectType.getDescribe().getKeyPrefix();
    private final String WO_PREFIX = WorkOrder.SObjectType.getDescribe().getKeyPrefix();
    private Boolean isAccountId = false;
    
    public DeleteResourcePreferenceBatch() {
        queryString += 'ServiceResource.IsActive = FALSE OR ServiceResource.RelatedRecord.IsActive = FALSE';
    }
    
    public DeleteResourcePreferenceBatch(String id) {
        queryString += 'Id=\'' + id + '\' AND (ServiceResource.IsActive = FALSE OR ServiceResource.RelatedRecord.IsActive = FALSE)';
    }
    
    public DeleteResourcePreferenceBatch(Boolean isFromAccount) {
        isAccountId = isFromAccount;
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(queryString);
    }
    
    global void execute(Database.BatchableContext bc, List<SObject> batch) {
        Set<Id> ids = new Set<Id>();
        
        for (ResourcePreference rp : (List<ResourcePreference>)batch) {
            ids.add(rp.Id);
        }
        
        handleRecords(ids);
    }
    
    global void finish(Database.BatchableContext bc) {

    }
    
    global void execute(SchedulableContext sc) {
        Database.executeBatch(new DeleteResourcePreferenceBatch());
    }
    
    public void handleRecords(Set<Id> records) {
        if (!records.isEmpty()) {
            Map<Id, ResourcePreference> rpMap = new Map<Id, ResourcePreference>();
            
            if (isAccountId) {
                rpMap.putAll([SELECT Id, RelatedRecordId FROM ResourcePreference WHERE RelatedRecordId IN :records AND (ServiceResource.IsActive = FALSE OR ServiceResource.RelatedRecord.IsActive = FALSE)]);
            } else {
                rpMap.putAll([SELECT Id, RelatedRecordId FROM ResourcePreference WHERE Id IN :records]);
            }
        	
            rpMap.remove(null);
            
            for (ResourcePreference rp : rpMap.values()) {
                String rpId = rp.RelatedRecordId;
                //check if ResourcePreference is tied to an account - if not (tied to WorkOrder), then remove from the map so it's not deleted
                if (!rpId.startsWith(ACCOUNT_PREFIX) && rpMap.containsKey(rp.Id)) {
                    rpMap.remove(rp.Id);
                }
            }
        	
            delete rpMap.values();
        }
    }
}