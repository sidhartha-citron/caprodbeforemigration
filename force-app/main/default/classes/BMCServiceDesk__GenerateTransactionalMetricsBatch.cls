/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class GenerateTransactionalMetricsBatch implements Database.Batchable<SObject>, Database.Stateful {
    global Map<String,String> analytics;
    global static String COUNT_QUERY_LIMIT;
    global Integer counter;
    global Integer counterCode;
    global static String ITERATABLE_OBJECT_QUERY_LIMIT;
    global String queryCondition;
    global static String RF_USAGE_EXCEPTION;
    global static String RF_USAGE_STAT;
    global static String RF_USAGE_STAT_MID_MONTH;
    global List<BMCServiceDesk__BMCSYSProperties__c> tempRecordsToInsert;
    global GenerateTransactionalMetricsBatch(String queryCondition) {

    }
    global GenerateTransactionalMetricsBatch(String queryCondition, Integer counter) {

    }
    global void execute(Database.BatchableContext bc, List<BMCServiceDesk__BMCSYSProperties__c> scope) {

    }
    global void finish(Database.BatchableContext bc) {

    }
    global Database.QueryLocator start(Database.BatchableContext bc) {
        return null;
    }
}
