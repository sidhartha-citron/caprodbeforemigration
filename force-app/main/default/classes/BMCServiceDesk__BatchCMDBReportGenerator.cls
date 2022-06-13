/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class BatchCMDBReportGenerator implements Database.Batchable<SObject>, Database.Stateful {
    global BatchCMDBReportGenerator(BMCServiceDesk.CMDBReportExporter pCMDBReportExporter) {

    }
    global void execute(Database.BatchableContext BC, List<SObject> scope) {

    }
    global void finish(Database.BatchableContext BC) {

    }
    global Database.QueryLocator start(Database.BatchableContext BC) {
        return null;
    }
global class CMDBReportFilter {
    global String AttributeAPIName {
        get;
        set;
    }
    global String AttributeValue {
        get;
        set;
    }
    global String ClassAPIName {
        get;
        set;
    }
    global CMDBReportFilter(String pClassAPIName, String pAttributeAPIName, String pAttributeValue) {

    }
}
}
