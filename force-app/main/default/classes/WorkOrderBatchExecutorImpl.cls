/**
 * Batch Executor implementation for Work Order merge.
 * 
 * @author Ahsan Butt
 */
public class WorkOrderBatchExecutorImpl implements IBatchExecutor {
	private String notes = '';
    private Integer totalRecords = 0;
    private Integer numErrors = 0;
    
    public void execute(List<sObject> scope, Map<String, String> params) {
        Savepoint rollAllBackSavepoint = Database.setSavepoint();
        
        try {
            totalRecords += scope.size();
            
            // Get Work Orders
            List<WorkOrder> wos = (List<WorkOrder>) scope;

            // Merge all
            WorkOrderMerger.doMerges(wos);

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