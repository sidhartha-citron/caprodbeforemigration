global class CreateOrderProductsBatch implements Database.Batchable<OrderItem> {
    
    private List<OrderItem> items;
    
    global CreateOrderProductsBatch(List<OrderItem> items) {
        this.items = items;
    }
    
	global List<OrderItem> start(Database.BatchableContext bc) {
        // collect the batches of records or objects to be passed to execute
        return items;
    }
    
    global void execute(Database.BatchableContext bc, List<OrderItem> records) {
        // process each batch of records
    	processRecords(records);
    }
    
    global void processRecords(List<OrderItem> records) {
        if (!records.isEmpty()) {
            insert records;
        }
    }
    
    global void finish(Database.BatchableContext bc) {
        // execute any post-processing operations
    }
}