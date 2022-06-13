/*
 * Version		Date			Developer		Comments	
 * 1.0			15/09/2021		Sidhartha		Code Created
 * 
*/
public class SaniCertificatesAsFileController implements Queueable, Database.AllowsCallouts{
    
    public static ContentVersion[] lstCV = new List<ContentVersion>();  
    public Map<String, String> mapOfEmailTemplate = new Map<String, String>();
    public List<string> lstsenderEmail  = new List<String>();
    public List<WorkOrderLineItem> lstwOLI ; 
    public Set<Id> wkIds = new Set<Id>();
    public List<WorkOrder> lstWrkOrder = new List<WorkOrder>();
    public List<Contact> lstcont;
    public map<String, WorkOrderLineItem> mapOfpCodeWLI = new map<String, WorkOrderLineItem>();
    public map<String, String> mapOfPIdToENEmailTemplate = new map<String, String>();
    public map<String, String> mapOfPIdToFileName = new map<String, String>();
    public map<String, String> mapOfPIdToFREmailTemplate = new map<String, String>();
    public map<String, String> mapOfPCodeToPCode = new map<String, String>();
    
    public SaniCertificatesAsFileController(List<WorkOrder> lstwk) {
        system.debug('lstwk ' + lstwk);
        Set<Id> accId = new Set<Id>();
        Set<Id> contId = new Set<Id>();
        Set<String> pdfNames = new Set<String>();
        for(WorkOrder wks: lstwk) {
            wkIds.add(wks.Id);
            lstWrkOrder.add(wks);
            if(wks.ContactId !=null) {
                contId.add(wks.ContactId);
            }else{
                accId.add(wks.AccountId);
            }
        }
        if(contId.size() > 0) {
            lstcont = [SELECT Id, Email FROM Contact WHERE Id IN:contId];
        }else if(accId.size() > 0) {
            lstcont = [SELECT Id, Email FROM Contact WHERE AccountId IN:accId AND Main_Site_Contact__c = true];
        }
        system.debug('lstcont ' + lstcont);
        for(Contact con: lstcont) {
            lstsenderEmail.add(con.Email);
        }
        List<Sani_Certificates__mdt> lstsaniCert = Sani_Certificates__mdt.getAll().values();
        for(Sani_Certificates__mdt sniC : lstsaniCert) {
            pdfNames.add(sniC.Pdfname__c);
            mapOfPCodeToPCode.put(sniC.Product_Code__c, sniC.Product_Code__c);
            mapOfPIdToENEmailTemplate.put(sniC.Product_Code__c, sniC.Template_Name__c);
            mapOfPIdToFileName.put(sniC.Product_Code__c, sniC.Pdfname__c);
            mapOfPIdToFREmailTemplate.put(sniC.Product_Code__c, sniC.Template_Name_FR__c);
        }
        
        lstwOLI = [SELECT Id,  WorkOrder.ServiceReportLanguage, Product2.ProductCode, WorkOrderId, WorkOrder.AccountId, WorkOrder.Account.Name, WorkOrder.Account.ShippingCountry, WorkOrder.Account.ShippingState, 
                   WorkOrder.Account.ShippingStreet, WorkOrder.Account.ShippingPostalCode, WorkOrder.LastModifiedDate 
                   FROM WorkOrderLineItem WHERE WorkOrderId IN: wkIds AND Product2.ProductCode IN:mapOfPIdToENEmailTemplate.keySet()];
        for(WorkOrderLineItem wkli: lstwOLI) {      
            mapOfpCodeWLI.put(wkli.Product2.ProductCode,wkli );         
        }
        
        
    }
    public void execute(QueueableContext context) {
        for(WorkOrderLineItem wkli: mapOfpCodeWLI.values()) {
            if(wkli.Product2.ProductCode == mapOfPCodeToPCode.get(wkli.Product2.ProductCode)) {
                PageReference pdf =  Page.sani_vf_certificates;
                pdf.getParameters().put('Id',wkli.Id);
                pdf.setRedirect(true);
                Blob body;
                if(Test.isRunningTest()) { 
                    body = blob.valueOf('Unit.Test');
                }else{
                    body = pdf.getContentAsPDF();   
                }
                if(wkli.WorkOrder.ServiceReportLanguage == 'fr') {
                    mapOfEmailTemplate.put(mapOfPIdToFileName.get(wkli.Product2.ProductCode), mapOfPIdToFREmailTemplate.get(wkli.Product2.ProductCode));
                }else{
                    mapOfEmailTemplate.put(mapOfPIdToFileName.get(wkli.Product2.ProductCode), mapOfPIdToENEmailTemplate.get(wkli.Product2.ProductCode));
                }
                ContentVersion cv = createContentVersion(mapOfPIdToFileName.get(wkli.Product2.ProductCode), body);
                lstCV.add(cv); 
            }
            
        }
        try{
            insert lstCV;
            List<ContentDocumentLink> contentDocumentLinks = new List<ContentDocumentLink>();
            lstCV = [SELECT Id, Title, FileType, versiondata, ContentDocumentId FROM ContentVersion WHERE Id IN :lstCV];
            
            for(Id wkId: wkIds) {
                for(ContentVersion contentVersion : lstCV){
                    ContentDocumentLink contentDocumentLink = createContentDocumentLink(contentVersion.ContentDocumentId, wkId);
                    contentDocumentLinks.add(contentDocumentLink);   
                }
            }
            insert contentDocumentLinks;
            system.debug('senderEmail ' + lstsenderEmail);
            sendEmail(lstCV, lstsenderEmail, lstWrkOrder, mapOfEmailTemplate);
        }catch(exception e){
            system.debug(e);
        }
    }
    
    public static void  sendEmail(List<ContentVersion> lstCV, List<String> sEmail, List<WorkOrder> lstwk, Map<String, String> mapOfEmailTemplate) {
        
        String emailTemaplateName;
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        List<Messaging.EmailFileAttachment> fileAttachments = new List<Messaging.EmailFileAttachment>{};
            for(ContentVersion cversion : lstCV) {	
                blob WOCFbody = cversion.versiondata;
                Messaging.Emailfileattachment efa1 = new Messaging.Emailfileattachment();
                efa1.setFileName(cversion.title+'.'+cversion.FileType);
                efa1.setBody(WOCFbody);
                fileAttachments.add(efa1); 
                
                if(mapOfEmailTemplate.size() > 1) {
                    emailTemaplateName = 'Professional_Disinfection_Services_EN';
                }else{
                    emailTemaplateName = mapOfEmailTemplate.get(cversion.title);
                }
            }
        EmailTemplate et=[SELECT Id  FROM EmailTemplate WHERE DeveloperName =: emailTemaplateName];
        
        email.setToAddresses( sEmail );
        for(WorkOrder wk: lstwk) {
            email.setTemplateID(et.Id);
            email.setWhatId(wk.Id);
            email.setTargetObjectId(wk.ContactId);
        }
        if(lstCV.size() > 0){
            email.setFileAttachments(fileAttachments);
        }
        // Sends the email 
        Messaging.SendEmailResult [] r = Messaging.sendEmail(new Messaging.SingleEmailMessage[] {email});   
    }
    
    private ContentDocumentLink createContentDocumentLink(Id contentDocumentId, Id parentId){
        ContentDocumentLink contentDocumentLink = new ContentDocumentLink();
        contentDocumentLink.ContentDocumentId = contentDocumentId;
        contentDocumentLink.LinkedEntityId = parentId;
        contentDocumentLink.ShareType = 'I'; // Inferred permission
        contentDocumentLink.Visibility = 'InternalUsers';
        return contentDocumentLink;
    }
    
    private ContentVersion createContentVersion(String name, Blob body){
        ContentVersion contentVersion = new ContentVersion();
        contentVersion.ContentLocation = 'S'; // S = Stored in Salesforce
        contentVersion.PathOnClient = name+'.pdf';
        contentVersion.Title = name;
        contentVersion.VersionData = body;
        contentVersion.IsMajorVersion = true;
        return contentVersion;
    }
    
}