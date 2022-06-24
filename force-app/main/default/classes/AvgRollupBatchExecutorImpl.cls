/**
 * Implements the IRollupBatchExecutor interface for the "Average" function. Will average the source field values of source records for rollup
 * on a target record. Bulk of functionality handled by abstract base class,
 * 
 * @author Ahsan Butt
 */
public class AvgRollupBatchExecutorImpl extends AbstractRollupExecutor implements IRollupBatchExecutor {
    
    public Object rollup(List<sObject> records, String field, Schema.DisplayType fieldType) {
        Integer num = records.size();
        Double total = 0;
        
        for (sObject record : records) {
            total += (Double) record.get(field);
        }
        
        return num > 0 ? total/num : 0;
    }

}