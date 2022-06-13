/**
 * Batch Executor implementation for deactivating merged order items.
 * 
 * @author Ahsan Butt
 */
public class DeactivateMergedOIsBatchExecutorImpl implements IBatchExecutor {
	private String notes = '';
    private Integer totalRecords = 0;
    private Integer numErrors = 0;
    
    public void execute(List<sObject> scope, Map<String, String> params) {
        Savepoint rollAllBackSavepoint = Database.setSavepoint();
        
        try {
            totalRecords += scope.size();
            
            // Get Order Items
            List<OrderItem> ois = (List<OrderItem>) scope;

            // Set all to inactive
            for (OrderItem oi : ois) {
                oi.Active__c = false;
            }
            
            // Persist
            Database.update(ois, false);

        } catch (Exception e) {
            // Unexpected error -- roll back everything
            numErrors += totalRecords;
            notes += 'Rolling back everything due to: ' + e.getMessage();
            System.debug(e);
            Database.rollback(rollAllBackSavepoint);
        }  
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
}