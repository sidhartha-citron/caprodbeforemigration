global class GenerateWOBatch implements Database.Batchable<SObject>{
	public SpawnWorkOrdersUtility spawnWOUtil=new SpawnWorkOrdersUtility();
    public String passActId;
    public String queryString;

    global GenerateWOBatch(String s) {
        queryString = 'SELECT Id,AccountId FROM Order WHERE AccountId = \'' + s + '\'';
        passActId=s;
    }

    global Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(queryString);
    }

    global void execute(Database.BatchableContext bc, List<SObject> batch) {
        spawnWOUtil.onDemandWOs(passActId, null);
    }
    
    global void finish(Database.BatchableContext bc) {

    }

    global void execute(SchedulableContext ctx) {
        
    }
}