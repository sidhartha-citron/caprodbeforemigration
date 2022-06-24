global class SpawnWorkOrders implements Database.Batchable<SObject>, Schedulable {
    public String queryString {get; set;}
    public Boolean executeFinish {get; set;}
    public Boolean singleOrder = false;
    public SpawnWorkOrdersUtility spawnWOUtil=new SpawnWorkOrdersUtility();

    global SpawnWorkOrders(){ 
        executeFinish = true;
    }

    global SpawnWorkOrders(String s){
        this(s,true); 
    }

    global SpawnWorkOrders(String s, Boolean executeFinish) {
        queryString = 'SELECT Id,AccountId FROM Order WHERE Id = \'' + s + '\'';
        this.executeFinish = executeFinish; 
        this.singleOrder = true;
    }

    global Database.QueryLocator start(Database.BatchableContext bc) {
        if (queryString == null) {
            return Database.getQueryLocator([SELECT Id FROM Account WHERE isValid__c = TRUE]);
        } else {
            return Database.getQueryLocator(queryString); 
        }
    }

    global void execute(Database.BatchableContext bc, List<SObject> batch) {
        System.debug('--isSingleOrder--' + this.singleOrder);
        if(this.singleOrder==false){
            for(Account a : (List<Account>) batch){
                spawnWOUtil.fltaccntIds.add(a.Id);
            }
         } else {
            for(Order o : (List<Order>) batch){
                spawnWOUtil.fltaccntIds.add(o.AccountId);
                spawnWOUtil.fltOrderIds.add(o.Id);
            }
        }
        processOrders(); 
    }
    
    global void processOrders() {
        spawnWOUtil.getOrdersWOByAccount(); 
        spawnWOUtil.mergeOrSplitWO();
        spawnWOUtil.generateWOs(false);
    }

    global void finish(Database.BatchableContext bc) {
        if (!Test.isRunningTest() && executeFinish) {
            Database.executeBatch(new SpawnFollowUpWorkOrders(), 10);
        }
    }

    global void execute(SchedulableContext ctx) {
        Database.executeBatch(new SpawnWorkOrders(), 10);
    }
}