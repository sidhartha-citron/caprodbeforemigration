/**
 * Batch Executor implementation only used in unit tests.
 * 
 * @author Ahsan Butt
 */
public class TestBatchExecutorImpl implements IBatchExecutor {
	private String notes = '';
    private Integer totalRecords = 0;
    private Integer numErrors = 0;
    
    public static final String WHAT_CASE = 'WhatCase';
    public static final String CASE_HAPPY = 'Happy';   
    public static final String CASE_ERROR = 'Error';
    public static final String CASE_EXCEPTION = 'Exception';
    
    public static final String EXCEPTION_MSG = 'Test exception msg';
    
    public void execute(List<sObject> scope, Map<String, String> params) {
        totalRecords += scope.size();
        
        String whatCase = params.get(WHAT_CASE);
        
        if (whatCase == CASE_HAPPY) {
            return;
        } else if (whatCase == CASE_ERROR) {
            numErrors += scope.size();
            notes += 'Error';
        } else {
            throw new TestException(EXCEPTION_MSG);
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