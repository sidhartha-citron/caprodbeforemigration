global class UpdateVMIProductQuantities implements Database.Batchable<SObject>, Schedulable{
    
    public class VMIRecord {
        public Decimal consumedQuantity {get;set;}
        public String key {get;set;}
        public Integer nofwo {get;set;}
    }
	public String queryString { get; set; }
    
    public UpdateVMIProductQuantities(){
        //Shashi [2019-07-10] : Added 3 months filter on the query
        queryString = 'SELECT Id, endDate, AccountId FROM WorkOrder WHERE endDate = LAST_N_DAYS:90 ORDER BY endDate ASC';
    } 
    
    public Database.QueryLocator start(Database.BatchableContext bc){
    	System.debug('executing custom query: ' + queryString);
    	return Database.getQueryLocator(queryString);
    }
    
    public void execute(Database.BatchableContext bc, List<WorkOrder> batch){
        calculateVMIS(batch);
    }
    
    public void calculateVMIS(List<WorkOrder> allWorkOrders) {
        Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
        
        Set<Id> actIds = new Set<Id>(); //Collect accounts and re-query work orders: required due to batch chunking
        Set<Id> relaventWorkOrders = new Set<Id>(); //Collect all Work Orders with VMI Service
        Map<Id,WorkOrder> qryWorkOrders = new Map<Id,WorkOrder>(); //All the queried Work Orders
        Map<Id,Set<Id>> ActToWO = new Map<Id,Set<Id>>(); //Account with work orders containing VMI Service
        
        System.debug('~~ALL~~' + allWorkOrders.size());
        
        for (WorkOrder wo:allWorkOrders){if(!actIds.contains(wo.AccountId)){actIds.add(wo.AccountId);}}
        System.debug('~~ACTS~~' + actIds);
        
        List<WorkOrder> ssWorkOrds = [SELECT Id,endDate,AccountId FROM WorkOrder WHERE endDate=LAST_N_DAYS:90 AND AccountId IN:actIds];
        for (WorkOrder wo:ssWorkOrds){qryWorkOrders.put(wo.Id,wo);}
        System.debug('~~SUB~~' + ssWorkOrds.size());
        
        List<WorkOrderLineItem> wolis = [SELECT Id, WorkOrderId, Product_Name__c, PricebookEntry.Product2.VMI_Product__c, 
                                         Quantity FROM workOrderLineItem WHERE WorkOrderId IN:qryWorkOrders.keySet()];
        
        for (WorkOrderLineItem woli:wolis){
            if (woli.Product_Name__c.contains(dataSets.VMI_Product_Name__c)){
                if(!relaventWorkOrders.contains(woli.WorkOrderId)){relaventWorkOrders.add(woli.WorkOrderId);}
                
                workOrder wo = qryWorkOrders.get(woli.WorkOrderId);
                Set<Id> sWOs = new Set<Id>();
                if(actToWO.containsKey(wo.AccountId)){
                    sWOs = actToWO.get(wo.AccountId);
                    if(!sWOs.contains(wo.Id)){sWOs.add(wo.Id);}
                } else {
                    sWOs.add(wo.Id);
                    actTOWO.put(wo.AccountId,sWOs);
                }
            }
        }
        
        System.debug('~~REL~~' + relaventWorkOrders);
        System.debug('~~ACTWO~~' + actTOWO);
        
        List<productConsumed> prdConsL = [SELECT Id,WorkOrder.AccountId,WorkOrderId,PricebookEntry.Product2Id,QuantityConsumed,
                                          PricebookEntry.Product2.VMI_Product__c FROM productConsumed 
                                          WHERE WorkOrderId IN:relaventWorkOrders];
        
        System.debug('~~PRDCONS~~' + prdConsL.size());
        Map<String,VMIRecord> kyToVMI = new Map<String,VMIRecord>();
        for(productConsumed pc:prdConsL) {
            if (pc.PricebookEntry.Product2.VMI_Product__c){
                String key = pc.WorkOrder.AccountId + ',' + pc.PricebookEntry.Product2Id;
                VMIRecord vmi = new VMIRecord();
                Set<Id> wos = ActToWO.get(pc.WorkOrder.AccountId);
                if(kyToVMI.containsKey(key)){
                    vmi = kyToVMI.get(key);
                    vmi.consumedQuantity += pc.QuantityConsumed;
                } else {
                    vmi.key = key;
                    if(pc.QuantityConsumed==null){vmi.consumedQuantity=0;}
                    else{vmi.consumedQuantity=pc.QuantityConsumed;}
                    vmi.nofwo = wos.size();
                    kytoVMI.put(key,vmi);
                }
            }
        }
        
        System.debug('~~KEYVMI~~' + kyToVMI.size());
        
        List<VMI_Product__c> vmiProdL = [SELECT Id,Account__c,Product__c,Par_Level__c,Quantity_Per_Visit__c 
                                         FROM VMI_Product__c WHERE Account__c IN:ActToWO.KeySet()];
        for (VMI_Product__c vmiProd:vmiProdL) {
            String key =  vmiProd.Account__c + ',' + vmiProd.Product__c;
            VMIRecord vmi = kyToVMI.get(key);
            if(vmi==null){
                vmiProd.Quantity_Per_Visit__c = 0;
            } else {
                Decimal qty = vmi.consumedQuantity/vmi.nofwo;
                vmiProd.Quantity_Per_Visit__c = qty.setScale(2,RoundingMode.HALF_UP);
            }
            System.debug('~~UPDATE KEY~~' + key + '~~' + vmiProd);
        }
        update vmiProdL;
    }
    
    public void finish(Database.BatchableContext bc){
        System.debug('FINISH');
    }
    
    global void execute(SchedulableContext ctx) {
        Database.executeBatch(new UpdateVMIProductQuantities());
    }
}