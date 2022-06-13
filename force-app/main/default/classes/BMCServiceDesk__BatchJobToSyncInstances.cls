/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class BatchJobToSyncInstances implements Database.Batchable<SObject>, Database.Stateful {
    global String baseelementobj;
    global String ClasssId;
    global String currentClsName;
    global String EF;
    global Map<String,List<String>> excMap;
    global String excp;
    global String orgNamespace;
    global Integer processedInstances;
    global String query;
    global List<String> RuleClsIds;
    global Integer RuleClsNo;
    global Integer unsuccessfulInstances;
    global BatchJobToSyncInstances(List<String> clsIds, Integer offset) {

    }
    global void execute(Database.BatchableContext BC, List<SObject> lst) {

    }
    global void finish(Database.BatchableContext BC) {

    }
    global void sendMail(Database.BatchableContext BC) {

    }
    global Database.QueryLocator start(Database.BatchableContext BC) {
        return null;
    }
}
