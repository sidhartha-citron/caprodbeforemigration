/**
 * Implements the IRollupBatchExecutor interface for the "Last" function. Will return the last (or most recent) source field value of given source records for rollup
 * on a target record. Bulk of functionality handled by abstract base class,
 * 
 * @author Ahsan Butt
 */
public class LastRollupBatchExecutorImpl extends AbstractRollupExecutor implements IRollupBatchExecutor {
    
    public Object rollup(List<sObject> records, String field, Schema.DisplayType fieldType) {
        if (fieldType == Schema.DisplayType.DATE) {
            return rollupDate(records, field);
        }
        
        return rollupDateTime(records, field);
    }
    
    private Date rollupDate(List<sObject> records, String field) {
        Date mostRecent = (Date) records.get(0).get(field);
        
        for (sObject record : records) {
            Date d = (Date) record.get(field);
            if (d > mostRecent) {
                mostRecent = d;
            }
        }
        
        return mostRecent;
    }
    
    private DateTime rollupDateTime(List<sObject> records, String field) {
        DateTime mostRecent = (DateTime) records.get(0).get(field);
        
        for (sObject record : records) {
            DateTime d = (DateTime) record.get(field);
            if (d > mostRecent) {
                mostRecent = d;
            }
        }
        
        return mostRecent;
    }
}