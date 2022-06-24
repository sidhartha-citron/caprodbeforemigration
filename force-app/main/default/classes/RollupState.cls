/**
 * Encapsulates the state required in Rollup calculations.
 * 
 * @author Ahsan Butt
 */
public class RollupState {
	public Set<Id> processedIds = new Set<Id>();
    
    public void addProcessed(Set<Id> ids) {
        processedIds.addAll(ids);
    }
}