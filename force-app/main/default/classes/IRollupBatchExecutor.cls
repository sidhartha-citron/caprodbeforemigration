/**
 * Defines interface for classes that implement rollup batch processing logic. These classes
 * would be invoked from a Batchable class' execute() method.
 * 
 * @author Ahsan Butt
 */
public interface IRollupBatchExecutor {
	RollupState executeGivenSourceRecords(RollupState existingState, List<sObject> scope, String sourceObj, String sourceField, String mergeField, String targetObj, String targetField, String filter);
    RollupState executeGivenTargetRecords(RollupState existingState, List<sObject> scope, String sourceObj, String sourceField, String mergeField, String targetObj, String targetField, String filter);
    String getNotes();
    Integer getTotalRecords();
    Integer getNumErrors();
}