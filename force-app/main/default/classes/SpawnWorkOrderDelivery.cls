global class SpawnWorkOrderDelivery implements Database.Batchable<SObject>, Schedulable {
    public String queryString { get; set; }
    public Boolean executeFinish { get; set; }
    public Boolean singleOrder = false;
    public DateTime startTime,endTime;
    public SpawnWorkOrdersUtility spawnWOUtil=new SpawnWorkOrdersUtility();

    global SpawnWorkOrderDelivery(){
        executeFinish = true; 
        startTime = DateTime.now();
    }

    global SpawnWorkOrderDelivery(String s) {
        this(s,true);
    }

    global SpawnWorkOrderDelivery(String s, Boolean executeFinish) {
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
                spawnWOUtil.CONTROL_WO_TYPE = 1; 
            }
        } else {
            for(Order o : (List<Order>) batch){
                spawnWOUtil.fltaccntIds.add(o.AccountId);
                spawnWOUtil.fltOrderIds.add(o.Id);
                spawnWOUtil.CONTROL_WO_TYPE = 1;
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
        endTime=DateTime.now();
        if (!Test.isRunningTest() && executeFinish) {
            System.debug('--PASS TIME FRAME--' + startTime + '--' + endTime);
            Database.executeBatch(new SpawnWorkOrderRooms(startTime,endTime), 30);
        }
    }

    global void execute(SchedulableContext ctx) {
        Database.executeBatch(new SpawnWorkOrderDelivery(), 10);
    }
}