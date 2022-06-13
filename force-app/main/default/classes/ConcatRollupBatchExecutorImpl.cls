/**
 * Implements the IRollupBatchExecutor interface for the "Concat" function. Will concatenate the source field values of source records (with delimiter) for rollup
 * on a target record. Bulk of functionality handled by abstract base class,
 * 
 * @author Ahsan Butt
 */
public class ConcatRollupBatchExecutorImpl extends AbstractRollupExecutor implements IRollupBatchExecutor {
    
    public Object rollup(List<sObject> records, String field, Schema.DisplayType fieldType) {
        String concatenatedStr = '';
        String delimiter = ';'; 
        
        Set<String> uniqueVals = new Set<String>();
        
        for (sObject record : records) {
            if (record.get(field) == null) continue;
            String val = (String) record.get(field);
            uniqueVals.addAll(val.split(delimiter));
        }
        
        return String.join(new List<String>(uniqueVals), delimiter);
    }

}