/**
 * Abstract base class for IRollupBatchExecutor implementations. Performs the bulk of processing and delegates to
 * child classes for roll-up calculation.
 * 
 * @author: Ahsan Butt
 */
public abstract class AbstractRollupExecutor {
    private String notes = '';
    private Integer totalRecords = 0;
    private Integer numErrors = 0;
    
    // IRollupBatchExecutor impls must implement this
    abstract Object rollup(List<sObject> records, String sourceField, Schema.DisplayType fieldType);
    
    public RollupState executeGivenSourceRecords(RollupState existingState, List<sObject> scope, String sourceObj, String sourceField, String mergeField, String targetObj, String targetField, String filter) {
        List<Id> targetIds = getTargetsToProcess(existingState.processedIds, scope, mergeField);
        
        return execute(existingState, targetIds, sourceObj, sourceField, mergeField, targetObj, targetField, filter); 
    }
    
    public RollupState executeGivenTargetRecords(RollupState existingState, List<sObject> scope, String sourceObj, String sourceField, String mergeField, String targetObj, String targetField, String filter) {
        List<Id> targetIds = new List<Id>();
		
        for (sObject rec : scope) {
            Id targetId = rec.Id;
            if (!existingState.processedIds.contains(targetId)) {
                targetIds.add(targetId);
            }
        }
        
        return execute(existingState, targetIds, sourceObj, sourceField, mergeField, targetObj, targetField, filter);
    }
    
    private RollupState execute(RollupState existingState, List<Id> targetIds, String sourceObj, String sourceField, String mergeField, String targetObj, String targetField, String filter) {
        // If targets all already processed, nothing to do
        if (targetIds.size() == 0) return existingState;
        
        // Update total records
        totalRecords += targetIds.size();
        
        // Generate query string
        String query = getQuery(sourceObj, sourceField, mergeField, filter);
        
        // Execute query
        List<sObject> records = Database.query(query);
        
        // Get target id to list of source records map
        Map<Id, List<sObject>> targetToSourceRecords = getTargetToSourceRecords(targetIds, records, mergeField);
        
        // Iterate over target ids and roll-up source records
        List<sObject> targetsToUpdate = new List<sObject>();
        
        for (Id targetId : targetToSourceRecords.keyset()) {
            Object rollupVal = rollup(targetToSourceRecords.get(targetId), sourceField, getFieldType(sourceObj, sourceField));
            
            // Create a target record populated with the rollup value (do casting etc.)
            sObject targetRecord = getPopulatedRecord(targetObj, targetField, targetId, rollupVal);

            targetsToUpdate.add(targetRecord);
        }
        
        // Update targets
        List<Database.SaveResult> targetsUpdated = Database.update(targetsToUpdate, false);
        
        for (Database.SaveResult sr : targetsUpdated) {
            if (!sr.isSuccess()) {
                numErrors++;
                for(Database.Error err : sr.getErrors()) {         
            		notes += err.getMessage();
        		}
            }
        }
        
        // Update state
        existingState.addProcessed(targetToSourceRecords.keyset());
        
        return existingState; 
    }
    
    public String getNotes() {
        return notes;
    }
    
    public Integer getTotalRecords() {
        return totalRecords;
    }
    
    public Integer getNumErrors() {
        return numErrors;
    }
    
    private List<Id> getTargetsToProcess(Set<Id> alreadyProcessed, List<sObject> records, String mergeField) {
        List<Id> ids = new List<Id>();
        
        // Get target ids from source records (via mergeField) and filter out those already processed
        for (sObject rec : records) {
            Id targetId = (Id) rec.get(mergeField);
            if (!alreadyProcessed.contains(targetId)) {
                ids.add(targetId);
            }
        }
        
        return ids;
    }
    
    private String getQuery(String sourceObject, String sourceField, String mergeField, String filter) {
        // Create where clause
        String whereClause = 'WHERE ';
        
        // Generate ids in condition (e.g., "AccountId IN :targetIds")
        String idsInCondition = mergeField + ' IN :targetIds';
        
        whereClause += String.isNotBlank(filter) ? filter + ' AND (' + idsInCondition + ')' : idsInCondition;
        
        // Format query
        String query = String.format('SELECT {0}, {1} FROM {2} {3}', new List<String>{sourceField, mergeField, sourceObject, whereClause});
        return query;
    }
    
    private Map<Id, List<sObject>> getTargetToSourceRecords(List<Id> targetIds, List<sObject> records, String mergeField) {
        Map<Id, List<sObject>> targetToSource = new Map<Id, List<sObject>>();
        
        // To handle case where no source records are returned for a target, populate an empty list for all initially
        for (Id targetId : targetIds) {
            targetToSource.put(targetId, new List<sObject>());
        }
        
        // Iterate over source records, get related target id, and add record to list of sources for that target
        for (sObject record : records) {
            Id targetId = (Id) record.get(mergeField);
            
            if (targetToSource.containsKey(targetId)) {
                targetToSource.get(targetId).add(record);
            } else {
                targetToSource.put(targetId, new List<sObject>{record});
            }
        }
        
        return targetToSource;
    }
    
    private sObject getPopulatedRecord(String targetObj, String targetField, Id targetId, Object val) {
        sObject targetRecord = Schema.getGlobalDescribe().get(targetObj).newSObject() ;
        targetRecord.Id = targetId;
        
        // Cast roll-up value to appropriate target field type
        Schema.DisplayType targetFieldType = getFieldType(targetObj, targetField);
        System.debug(targetFieldType);
        if (targetFieldType == Schema.DisplayType.DOUBLE) {
            targetRecord.put(targetField, (Double) val);
        } else if (targetFieldType == Schema.DisplayType.INTEGER) {
            targetRecord.put(targetField, (Integer) val);
        } else if (targetFieldType == Schema.DisplayType.DATE) {
            targetRecord.put(targetField, (Date) val);
        } else if (targetFieldType == Schema.DisplayType.DATETIME) {
            targetRecord.put(targetField, (DateTime) val);
        } else if (targetFieldType == Schema.DisplayType.CURRENCY) {
            targetRecord.put(targetField, (Double) val);
        } else if (targetFieldType == Schema.DisplayType.PERCENT) {
            targetRecord.put(targetField, (Double) val);
        } else if (targetFieldType == Schema.DisplayType.STRING || targetFieldType == Schema.DisplayType.MULTIPICKLIST || targetFieldType == Schema.DisplayType.PICKLIST) {
            targetRecord.put(targetField, (String) val);
        } else {
            throw new RollupException('Unsupported target field type -- ' + targetFieldType);
        }
        
        return targetRecord;
    }
    
    private Schema.DisplayType getFieldType(String obj, String field) {
        Schema.SObjectType objType = Schema.getGlobalDescribe().get(obj);
        return objType.getDescribe().fields.getMap().get(field).getDescribe().getType();
    }
    
    public class RollupException extends Exception {}
}