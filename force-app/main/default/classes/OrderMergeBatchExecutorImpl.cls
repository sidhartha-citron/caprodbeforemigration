/**
 * Batch Executor implementation for Order merge.
 * 
 * @author Ahsan Butt
 */
public class OrderMergeBatchExecutorImpl implements IBatchExecutor {
	private String notes = '';
    private Integer totalRecords = 0;
    private Integer numErrors = 0;
    
    public static String PARAM_OI_FILTERS = 'OrderItemFilters';
    public static String PARAM_OI_FIELD_SET = 'OrderItemFieldSet';
    private static String FILTERS_DELIMITER = ',';
    public static String PARAM_OI_FILTER_PRODUCT_CODES = 'OrderItemFilterProductCodes';
    
    public void execute(List<sObject> scope, Map<String, String> params) {
        Savepoint rollAllBackSavepoint = Database.setSavepoint();
        
        try {
            totalRecords += scope.size();
            
            // Get orders and params
            List<Order> srcOrders = (List<Order>) scope;
            List<String> filters =  String.isNotBlank(params.get(PARAM_OI_FILTERS)) ? params.get(PARAM_OI_FILTERS).split(FILTERS_DELIMITER) :  new List<String>(); 
			List<String> filterProductCodes = String.isNotBlank(params.get(PARAM_OI_FILTER_PRODUCT_CODES)) ? params.get(PARAM_OI_FILTER_PRODUCT_CODES).split(FILTERS_DELIMITER) : new List<String>();
            String oiFS = params.get(PARAM_OI_FIELD_SET);
            
            // Merge all
			OrderMerger.doMerges(srcOrders, oiFS, filters, filterProductCodes);

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