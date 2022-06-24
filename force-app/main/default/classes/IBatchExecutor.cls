/**
 * Defines interface for classes that implement batch processing logic. These classes
 * would be invoked from a Batchable class' execute() method.
 * 
 * @author Ahsan Butt
 */
public interface IBatchExecutor {
	void execute(List<sObject> scope, Map<String, String> params);
    String getNotes();
    Integer getTotalRecords();
    Integer getNumErrors();
}