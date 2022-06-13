/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class MALiveDailySummariesBatch implements Database.AllowsCallouts, Database.Batchable<SObject>, Database.Stateful {
    global MALiveDailySummariesBatch(malive__MALiveDailySummaryConfig__c dailySummaryConfig, Date selectedDate) {

    }
    global MALiveDailySummariesBatch(malive__MALiveDailySummaryConfig__c dailySummaryConfig, Date selectedDate, Boolean updateExisting) {

    }
    global MALiveDailySummariesBatch(String dailySummaryConfigId, Date selectedDate, Boolean updateExisting, Integer interval, String addlName) {

    }
    global void execute(Database.BatchableContext BC, List<SObject> scope) {

    }
    global void finish(Database.BatchableContext BC) {

    }
    global Database.QueryLocator start(Database.BatchableContext BC) {
        return null;
    }
}
