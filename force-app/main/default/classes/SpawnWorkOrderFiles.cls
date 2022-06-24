global class SpawnWorkOrderFiles implements Database.Batchable<SObject>, Schedulable {
    
    public String queryString { get; set; }
    public Field_Service_Settings__c custSetting;
    public Boolean isOrderId { get; set; }
    
    global SpawnWorkOrderFiles() {
        isOrderId = false;
        custSetting = Field_Service_Settings__c.getOrgDefaults();
    }
    
    global SpawnWorkOrderFiles(String s) {
        isOrderId = false;
        queryString = 'SELECT Id FROM WorkOrder WHERE Id=\'' + s + '\'';
        custSetting = Field_Service_Settings__c.getOrgDefaults();
    }
    
    global SpawnWorkOrderFiles(String s, Boolean isOrderId) {
        this.isOrderId = isOrderId;
        custSetting = Field_Service_Settings__c.getOrgDefaults();
        if(isOrderId) {
            queryString = 'SELECT Id, Order__c FROM WorkOrder WHERE Order__c=\'' + s + '\' AND isValid__c=TRUE';
        } else {
            queryString = 'SELECT Id FROM WorkOrder WHERE Id=\'' + s + '\'';
        }
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc) {
        if (queryString == null) {
            return Database.getQueryLocator([SELECT Id FROM WorkOrder where (StatusCategory='New' OR StatusCategory='In Progress' OR StatusCategory='Dispatched')]);
        } else {
            System.debug('executing custom query: ' + queryString);
            return Database.getQueryLocator(queryString);
        }
    }

    global void execute(Database.BatchableContext bc, List<SObject> batch) {
        Set<Id> workOrderIds = new Set<Id>();
        for(WorkOrder o : (List<WorkOrder>) batch){
            workOrderIds.add(o.Id);
        }
        processWorkOrderFiles(workOrderIds);
    }
    
    global void processWorkOrderFiles(Set<Id> ids) {
        
        System.debug('SpawnWorkOrderFiles.processWorkOrderFiles(): ' + ids);
        
        Set<Id> workOrderIds = new Set<Id>();
        
        System.debug(' isOrder ' + isOrderId);
        if(isOrderId) {
            for(WorkOrder wo : [SELECT Id, Order__c , CreatedDate FROM WorkOrder WHERE Order__c IN:ids AND isValid__c=TRUE]) {
                workOrderIds.add(wo.Id);
            }
        } else {
            workOrderIds.addAll(ids);
        }
        
        Map<String, FeedItem> feedMap = new Map<String, FeedItem>();
        Map<Id, WorkOrder> workOrderMap = new Map<Id, WorkOrder>([Select Id, CreatedDate, Type__c, Site_Survey__c, Order__r.OpportunityId, (Select ContentDocumentId from ContentDocumentLinks) from WorkOrder where Id in: workOrderIds]);
        
        Map<Id, List<ContentDocumentLink>> contentLinkMap = new Map<Id, List<ContentDocumentLink>>();
        
        List<FeedItem> newContentLinksToAdd = new List<FeedItem>();
        
        Set<Id> oppIds = new Set<Id>();
        Set<Id> surveyIds = new Set<Id>();
        Set<String> existingWorkOrderFiles = new Set<String>();
        
        String oppPrefix = Opportunity.sobjecttype.getDescribe().getKeyPrefix();
        String siteSurveyPrefix = Site_Survey__c.sobjecttype.getDescribe().getKeyPrefix();
        
        System.debug('workOrderMap: ' + workOrderMap);
        
        for(WorkOrder w : workOrderMap.values()) {
            if(w.Type__c=='Installation') {
                oppIds.add(w.Order__r.OpportunityId);
            }
            surveyIds.add(w.Site_Survey__c);
            
            for(ContentDocumentLink c : w.ContentDocumentLinks) {
                existingWorkOrderFiles.add(w.Id+'-'+c.ContentDocumentId);
            }
        }
        oppIds.remove(null);
        surveyIds.remove(null);
        
        System.debug('Opp IDs: ' + oppIds);
        System.debug('Survey IDs: ' + surveyIds);
        System.debug('existingWorkOrderFiles: ' + existingWorkOrderFiles);
        
        if(!oppIds.isEmpty() || !surveyIds.isEmpty()) {
            
            Boolean includeAllFileTypes = custSetting==null||custSetting.Work_Order_Chatter_File_Extensions__c==null||custSetting.Work_Order_Chatter_File_Extensions__c==''||custSetting.Work_Order_Chatter_File_Extensions__c.contains('All');
            
            Set<String> fileExtensionsToInclude = new Set<String>();
            if(!includeAllFileTypes && custSetting.Work_Order_Chatter_File_Extensions__c!=null) {
                fileExtensionsToInclude.addAll(custSetting.Work_Order_Chatter_File_Extensions__c.split(',')); 
            }
            
            for(ContentDocumentLink c : Database.query('SELECT SystemModStamp, LinkedEntityId, ContentDocumentId, ContentDocument.LatestPublishedVersionId FROM ContentDocumentLink WHERE (LinkedEntityId in: oppIds OR LinkedEntityId in: surveyIds) '+(includeAllFileTypes?'':' AND ContentDocument.FileExtension in: fileExtensionsToInclude ')+' ORDER BY SystemModStamp ASC')) {
                
                if(contentLinkMap.containsKey(c.LinkedEntityId)) {
                    contentLinkMap.get(c.LinkedEntityId).add(c);
                } else {
                    contentLinkMap.put(c.LinkedEntityId, new List<ContentDocumentLink>{c});
                }
            }
            
            System.debug('contentLinkMap: ' + contentLinkMap);
            
            for(WorkOrder w : workOrderMap.values()) {
                List<ContentDocumentLink> temp = new List<ContentDocumentLink>();
                
                if(w.Type__c=='Installation' && w.Order__r.OpportunityId!=null && contentLinkMap.containsKey(w.Order__r.OpportunityId)) {
                    temp.addAll(contentLinkMap.get(w.Order__r.OpportunityId));
                }
                if(w.Site_Survey__c!=null && contentLinkMap.containsKey(w.Site_Survey__c)) {
                    temp.addAll(contentLinkMap.get(w.Site_Survey__c));
                }
                if(!temp.isEmpty()) {
                    for(ContentDocumentLink c : temp) {
                        
                        String key = w.Id+'-'+c.ContentDocumentId;
                        System.debug('ContentDocumentLink ('+key+'): ' + c);

                        if(
                            existingWorkOrderFiles.contains(key) || //If file already added to Work Order, then skip
                            c.SystemModStamp>w.CreatedDate //If file was created after work order, then skip
                        ) { 
                            continue; 
                        }
                        Boolean isOppFile = String.valueOf(c.LinkedEntityId).startsWithIgnoreCase(oppPrefix);
                        
                        newContentLinksToAdd.add(new FeedItem(
                            Body = ('File posted on related '+(isOppFile?'Opportunity':'Survey')), 
                            ParentId = w.Id, 
                            RelatedRecordId = c.ContentDocument.LatestPublishedVersionId, 
                            Type = 'ContentPost'
                        ));
                    }
                }
            }
            
            System.debug('newContentLinksToAdd: ' + newContentLinksToAdd);
            
            if(!newContentLinksToAdd.isEmpty()) {
                Database.insert(newContentLinksToAdd);
            }
        }
    }

    global void finish(Database.BatchableContext bc){
        if(!Test.isRunningTest()){
        	Database.executeBatch(new ClearBatchErrors());
        }
    }

    global void execute(SchedulableContext ctx) {
        Database.executeBatch(new SpawnWorkOrderFiles());
    }
}