/**
 * Encapsulates mapping from a roll up function (e.g., 'avg', 'count' etc.) to a specific IRollupBatchExecutor implementation.
 * 
 * @author: Ahsan Butt
 */
public class RollupBatchExecutorFactory {
    // Map from function to appropriate Rollup Batch Executor Impl class name
    private static Map<String, String> funcToImpl = new Map<String, String> {
        'COUNT' => 'CountRollupBatchExecutorImpl',
        'AVG' => 'AvgRollupBatchExecutorImpl',
        'LAST' => 'LastRollupBatchExecutorImpl',
        'CONCAT' => 'ConcatRollupBatchExecutorImpl'
    };
    
    public static IRollupBatchExecutor createInstance(String func) {
        String function = func.toUpperCase(); 
        
        // Dynamically instantiate Rollup Batch Executor Impl based on function
        Type implType = Type.forName(funcToImpl.get(function));
        IRollupBatchExecutor executor = (IRollupBatchExecutor) implType.newInstance();
        
        return executor;
    }
}