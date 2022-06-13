global class DeleteWOStatusBatchStagingSchedule implements Schedulable{
    global void execute(SchedulableContext sc){
        DeleteWorkOrderStatusBatchStaging dwosb = new DeleteWorkOrderStatusBatchStaging();
        database.executebatch(dwosb,200);
    }
}