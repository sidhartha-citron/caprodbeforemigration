/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class BatchCategoryTreeUpdate implements Database.Batchable<BMCServiceDesk__Category__c>, Database.Stateful {
    global Map<Id,BMCServiceDesk__Category__c> allCatsMap;
    global String delimiter;
    global String dmlOperation;
    global Map<String,String> idNameMap;
    global List<BMCServiceDesk__Category__c> lstForCateogry;
    global BatchCategoryTreeUpdate(List<BMCServiceDesk__Category__c> lstOfCateogry, Map<String,String> mapOfIdName, String operation) {

    }
    global void execute(Database.BatchableContext BC, List<BMCServiceDesk__Category__c> scope) {

    }
    global void finish(Database.BatchableContext BC) {

    }
    global System.Iterable start(Database.BatchableContext BC) {
        return null;
    }
}
