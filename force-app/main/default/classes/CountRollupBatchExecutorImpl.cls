/**
 * Implements the IRollupBatchExecutor interface for the "Count" function. Will count the source records for rollup
 * on a target record. Bulk of functionality handled by abstract base class,
 * 
 * @author Ahsan Butt
 */
public class CountRollupBatchExecutorImpl extends AbstractRollupExecutor implements IRollupBatchExecutor {

    public Object rollup(List<sObject> records, String field, Schema.DisplayType fieldType) {
        return records.size();
    }
}