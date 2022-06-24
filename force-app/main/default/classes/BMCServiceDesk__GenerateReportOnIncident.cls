/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class GenerateReportOnIncident implements Database.Batchable<SObject>, Database.Stateful {
    global String excelData;
    global Map<String,Map<Long,BMCServiceDesk__Incident__History>> lastBatchIncidentHistroy;
    global String lastIncIdOfBatch;
    global String query;
    global String UserMailAddr;
    global GenerateReportOnIncident(Map<String,String> parameterValMap) {

    }
    global void execute(Database.BatchableContext BC, List<BMCServiceDesk__Incident__History> scope) {

    }
    global void finish(Database.BatchableContext BC) {

    }
    global Database.QueryLocator start(Database.BatchableContext BC) {
        return null;
    }
}
