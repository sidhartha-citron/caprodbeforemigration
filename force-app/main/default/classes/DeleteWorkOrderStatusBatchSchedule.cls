global class DeleteWorkOrderStatusBatchSchedule implements Schedulable{
    global void execute(SchedulableContext sc){
        DeleteWorkOrderStatusBatch dwosb = new DeleteWorkOrderStatusBatch();
        database.executebatch(dwosb,200);
    }
}