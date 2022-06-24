/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class DeepViewController {
    global Boolean isEmbeddedMode {
        get;
        set;
    }
    global Boolean isTemplateEnabled {
        get;
        set;
    }
    global Attachment newAttachment {
        get;
        set;
    }
    global String pageLoadData {
        get;
        set;
    }
    global String selectNodeID {
        get;
        set;
    }
    global static String userTimeZone {
        get;
        set;
    }
    @RemoteAction
    global static Object addAction(String toEmails, String CCEmails, String historyType, String parentAPI, String parentID, String strObjAPIName, String strHistoryObjectRelated, String namespacePrefix) {
        return null;
    }
    @RemoteAction
    global static Object addAttachment(Attachment att, String recordID, String nodeAPI) {
        return null;
    }
    @RemoteAction
    global static void callApproveORRejectORRecall(String rootNodeId, String action, String comment) {

    }
    @RemoteAction
    global static void callReassignRecord(String rootNodeId, String reassignID) {

    }
    @RemoteAction
    global static Map<String,Boolean> checkApprovalPermissions(String rootNodeId) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> fetchEmailSettings(String objectName) {
        return null;
    }
    @RemoteAction
    global static String fetchObjectFieldData(String recordId, List<String> fieldInfo, String objectName) {
        return null;
    }
    @RemoteAction
    global static Object getActivity(String strObjAPIName, String recordID, String strHistoryObjectRelated) {
        return null;
    }
    @RemoteAction
    global static Object getActivityFeedItems(String objectName, String recordID, Map<String,Object> additionalParams) {
        return null;
    }
    @RemoteAction
    global static Object getActivityFeedsAttachments(String recordID, Map<String,String> additionalParams) {
        return null;
    }
    @RemoteAction
    global static Map<String,List<SObject>> getAllStatusesAndStages(Id selectNodeID) {
        return null;
    }
    @RemoteAction
    global static Object getApprovals(String recordID) {
        return null;
    }
    @RemoteAction
    global static Map<String,String> getBroadcastMsgs() {
        return null;
    }
    @RemoteAction
    global static String getClientDetails(String clientID) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> getEmailSettings(String objectName, String recordId) {
        return null;
    }
    @RemoteAction
    global static List<Object> getFieldInfo(String objectName, String recordId) {
        return null;
    }
    @RemoteAction
    global static List<SObject> getLookupData(String obj, String searchtext, String fieldName, String whereClause, String nodeAPI, String namespacePrefix, String IsMore) {
        return null;
    }
    @RemoteAction
    global static List<SObject> getLookupResult(Map<String,String> params) {
        return null;
    }
    @RemoteAction
    global static Map<String,BMCServiceDesk.DeepViewController.FieldMetaData> getReassignApproverMap() {
        return null;
    }
    @RemoteAction
    global static String getReplyEmailBody(String historyObject, String actvityId) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> getServiceTarget(String ObjName, String selectedView, String additionalParam, String orderby) {
        return null;
    }
    @RemoteAction
    global static String getSummary(Id recordId, Map<String,Object> params) {
        return null;
    }
    @RemoteAction
    global static String getsubjectLine(String moduleName, String defaultSubjectLine, String recordID) {
        return null;
    }
    @RemoteAction
    global static Boolean isAdminOrModifyAll(String rootNodeId) {
        return null;
    }
    @RemoteAction
    global static List<BMCServiceDesk__Action__c> listActions(String ModuleName) {
        return null;
    }
    @RemoteAction
    global static Id performAttachmentActions(String actionType, Map<String,String> actionParams) {
        return null;
    }
    @RemoteAction
    global static String performUserActions(String selectNodeID, String objectName, String action, Map<String,String> additionalParams) {
        return null;
    }
    @RemoteAction
    global static String queryAllData(Id paramID, String objConfig, String strNamespacePrefix) {
        return null;
    }
    @RemoteAction
    global static String queryRecord(String recordID, String APIName, String HistoryObjectRelated, String strNamespacePrefix) {
        return null;
    }
    @RemoteAction
    global static Object saveNotes(String strNamespacePrefix, String strObjAPIName, String recordID, String strNote, String strHistoryObjectRelated) {
        return null;
    }
    @RemoteAction
    global static String saveRecord(String strNodeID, String objType, String strRecordJSON, String namespacePrefix) {
        return null;
    }
    @RemoteAction
    global static String searchUser(String strSearchNameOrEmail) {
        return null;
    }
    @RemoteAction
    global static void sendEmailToReceps(String toEmails, String CCEmails, String emailSubject, String emailBody) {

    }
global class DeepViewException extends Exception {
}
global class FieldMetaData {
}
}
