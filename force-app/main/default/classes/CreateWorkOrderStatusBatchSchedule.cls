global class CreateWorkOrderStatusBatchSchedule implements Schedulable{
    global void execute(SchedulableContext sc){
        CreateWorkOrderStatusBatch cwosb = new CreateWorkOrderStatusBatch();
        database.executebatch(cwosb,200);
    }
}