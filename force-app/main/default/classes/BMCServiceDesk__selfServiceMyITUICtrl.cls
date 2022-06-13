/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class selfServiceMyITUICtrl {
    @RemoteAction
    global static Boolean ApproveReject(String processID, String action, String comment, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Boolean approveRejectForMultipleRequests(String processIds, String action, String comment, Map<String,Object> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Boolean callReassignRecord(String recordID, String userId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static String copyIncident(String incidentId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static String createAttachment() {
        return null;
    }
    @RemoteAction
    global static String createChatBotUrl() {
        return null;
    }
    @RemoteAction
    global static void createClientNote(String userId, String ticketId, String textval, Map<String,String> additionalParam) {

    }
    @RemoteAction
    global static Object createIncident(String strAction, Id clientid, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static BMCServiceDesk__SelfServiceSearchHistory__c createSearchHistory(String searchText, Map<String,Integer> recordCountForTab, String searchGroup) {
        return null;
    }
    @RemoteAction
    global static Boolean deleteAttachment(String AttachmentId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Boolean deleteDraft(String draftId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> fecthOtherSRandIncident(String sAccName, Integer pageIndex, String filter, Map<String,String> params) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> fetchCMDBData(Map<String,String> params) {
        return null;
    }
    @RemoteAction
    global static Object fetchCategoryDescription(String catId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static List<Map<String,String>> fetchDrafts(Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static List<Map<String,Object>> fetchIncidentFormField(String tempId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static List<Object> fetchKACategories(String nodeId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> fetchRD(String reqDefId, String srID, String action, String calledFrom, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Object fetchSRD(String srdID) {
        return null;
    }
    @RemoteAction
    global static List<Object> getActionHistory(String recordId, String objectType, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Object getApprovalHistory(String recordID, Map<String,String> additionalParams) {
        return null;
    }
    @RemoteAction
    global static List<Object> getAttachmentlistForSS3(String IncidentId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static List<Object> getAttachmentlist(String IncidentId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Map<String,Map<String,String>> getBroadcastById(Map<String,String> param) {
        return null;
    }
    @RemoteAction
    global static List<Map<String,String>> getBroadcastMsgsList() {
        return null;
    }
    @RemoteAction
    global static Map<String,String> getBroadcastMsgs() {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> getCMDBDetails(String beId) {
        return null;
    }
    @RemoteAction
    global static String getCategoryInfo(String categoryId) {
        return null;
    }
    @RemoteAction
    global static List<Map<String,String>> getCategoryServiceRequestDefinationMap(String categoryId) {
        return null;
    }
    @RemoteAction
    global static List<Object> getCommonResults(Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static List<Map<String,Object>> getCustomChildrenTilesData(String tileName, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static List<Object> getDraftAttachmentlist(String draftId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static List<BMCServiceDesk.REST_KAListBean> getKAForCategory(String categoryId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Object getKnowledgeArticles(String id, Boolean isSSBeta, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> getLoggedInUserId() {
        return null;
    }
    @RemoteAction
    global static List<Object> getLogs(String id, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> getMyProfile(Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Object getNoteRecord(String id, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static String getObjectName(String fieldname, String inputId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static List<BMCServiceDesk.selfServiceMyITUICtrl.referenceData> getReferenceFieldData(Map<String,String> param) {
        return null;
    }
    @RemoteAction
    global static String getSRApprovals(String incidentId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static List<Object> getSRDCategories() {
        return null;
    }
    @RemoteAction
    global static Object getSRInputDefaultValues(String reqDefId, String requestForId, String isOpenSRFormFromCopy) {
        return null;
    }
    @RemoteAction
    global static String getSS3Categories(String searchText, String nodeId, String objectName, String filter, String forSR, String showAllRec, Map<String,String> additionalParam, String lookupFilterId) {
        return null;
    }
    @RemoteAction
    global static List<Object> getSSSections(Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> getSearchResultsMap(String searchText, String sectionType, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static List<Object> getSearchResults(String searchText, String sectionType, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Object getSelectedApproval(String id, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> getTaskDetails(String incId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static List<Map<String,Object>> getTemplateFields(String tempId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static String getTemplateIdFromIncident(String incidentId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> getTicketDetails(Id ticketId, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> getTicketsAndSRs(Integer pageIndex, String filter, Map<String,String> params) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> getTilesDataOrder(Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Map<String,Boolean> getTilesData(Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Object getUserProfileInfo() {
        return null;
    }
    @RemoteAction
    global static List<Object> getUsers() {
        return null;
    }
    @RemoteAction
    global static Boolean isActiveSRD(String srdID) {
        return null;
    }
    @RemoteAction
    global static String manageApprovals(Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Id performAttachmentActions(String actionType, Map<String,String> actionParams) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> performMassApproveReject(String processIds, String action, String comment, Map<String,Object> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Boolean reassignForMultipleRequests(List<String> processIdList, String userId, Map<String,Object> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Object save(String requestBody) {
        return null;
    }
    @RemoteAction
    global static String saveMyProfile(String strAction, Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static Map<String,Object> saveSRDData(Map<String,String> additionalParam) {
        return null;
    }
    @RemoteAction
    global static void updateSR(String srId, String strAction, String resolution, Map<String,String> additionalParam) {

    }
    @RemoteAction
    global static String uploadImage(String file, String fileName, String type) {
        return null;
    }
    @RemoteAction
    global static Object uploadUserProfilePhoto(String attachmentParentId, Map<String,String> additionalParam) {
        return null;
    }
global class referenceData {
}
}
