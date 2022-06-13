/**
 * Class : ContentVersionTriggerHandler
 * Description: (1) Creates a Ticket everytime a file named 'Invoicing and Payment..' gets uploaded 
 * 					to document status record. 
 * SOQL COUNT: 2
 * @author Shashi
 * @version 1.0 
 * @since 2019-07-04
 **/
public class ContentVersionTriggerHandler extends TriggerHandler {
    //Collections
    List<Id> listIds = new List<Id>();
    List<ContentVersion> listNContVers = new List<ContentVersion>();
    List<ContentDocumentLink> listDocLinks = new List<ContentDocumentLink>();
    List<dsfs__DocuSign_Status__c> listDocuSignStatus = new List<dsfs__DocuSign_Status__c>();
    List<Case> listCases = new List<Case>();
    
    Map<Id,Id> mapIdtoId = new Map<Id,Id>();
    Map<Id,dsfs__DocuSign_Status__c> mapIdtoDocuSign = new Map<Id,dsfs__DocuSign_Status__c>();
    
    /**
     * Constructor
     **/
    public ContentVersionTriggerHandler(){
        //Set loop limit to prevent trigger recursion
        this.setMaxLoopCount(20);
        listNContVers = Trigger.new;
    }
    
    /**
     * After Insert trigger handler
     * For Manual file upload
     **/
    protected override void afterInsert(){
        System.debug('ContentVersionTriggerHandler|AfterInsert|createTickets:Ticket -> DocuSign|Begin');
        createTickets();
        System.debug('ContentVersionTriggerHandler|AfterInsert|createTickets:Ticket -> DocuSign|End');
    }
    
    /**
     * Before Update trigger handler
     * For DocuSign file upload
     */
    protected override void beforeUpdate(){
        System.debug('ContentVersionTriggerHandler|BeforeUpdate|createTickets:Ticket -> DocuSign|Begin');
        createTickets();
        System.debug('ContentVersionTriggerHandler|BeforeUpdate|createTickets:Ticket -> DocuSign|End');
    }
    
    /**
     * Description: Checks for file upload name and creates a Ticket if the file is associated to 
     * 				Document Status record.
     **/
    private void createTickets(){
        System.debug('createTickets|~~');
        //Load all the configuration values to search 
        DocuSign_Status_Ticket__c dst = DocuSign_Status_Ticket__c.getValues('FILEUPLOAD');
        System.debug('createTickets|~+');
        //Collect all the ContentDocumentId's which matches the file name
        for(ContentVersion contVer: listNContVers){
            System.debug('createTickets|Title~' + contVer.Title + '~PATH~' + contVer.PathOnClient);
            if(contVer.Title!=null){
                if(dst!=null && dst.File_Name__c!=null && contVer.Title.contains(dst.File_Name__c)){
                    listIds.add(contVer.ContentDocumentId);
                }
            }
        }
        
        if(listIds.size()>0){
            System.debug('createTickets|DocuSign Files~' + listIds);
            //Filter documents that are related to a specific object
            listDocLinks = [Select Id,LinkedEntityId,LinkedEntity.Type,ContentDocumentId From ContentDocumentLink Where ContentDocumentId=:listIds];
            //Go through documents associated to object and create a Map
            for(ContentDocumentLink docLink:listDocLinks){
                if(dst.Associated_Object__c!=null && docLink.LinkedEntity.Type==dst.Associated_Object__c){
                    //Create Map<ContentDocumentId,DocuSignStatus.Id>
                    if(!mapIdtoId.containsKey(docLink.ContentDocumentId)){
                        mapIdtoId.put(docLink.ContentDocumentId,docLink.LinkedEntityId);
                    }
                }
            }
            
            //Fetch all Document status records associated with the file
            List<Id> lstDsignStatusId = mapIdtoId.values();
            if(lstDsignStatusId.size()>0){
                System.debug('createTickets|DocuSign Records~' + lstDsignStatusId);
                listDocuSignStatus = [Select id,Quote__r.Id,Quote__r.OpportunityId,Quote__r.ContactId,Quote__r.Opportunity.AccountId,
                                      Quote__r.Opportunity.Account.Id,Quote__r.contact.Id,Quote__r.contact.name,Quote__r.contact.AccountId,
                                      Quote__r.Opportunity.Account.Name,Quote__r.Opportunity.Account.ParentId,
                                      Quote__r.Opportunity.Account.Parent.Name from dsfs__DocuSign_Status__c WHERE id =:lstDsignStatusId];
                
                //Create a Map<DocuSignStatus.Id,DocuSignStatus>
                for(dsfs__DocuSign_Status__c dss:listDocuSignStatus){
                    if(!mapIdtoDocuSign.containsKey(dss.Id)){
                    	mapIdtoDocuSign.put(dss.Id,dss);
                    }
                }
                
                //Create ticket for each document
                for(Id cDocId:mapIdtoId.keySet()){
                    Id dssId = mapIdtoId.get(cDocId);
                    //If the docusign status record is available create a ticket
                    if(mapIdtoDocuSign.containsKey(dssId)){
                        dsfs__DocuSign_Status__c dsfs = mapIdtoDocuSign.get(dssId);
                        Quote qt = null;
                        Account cust = null;
                        Contact cntc = null;
                        
                        //Collect the Account and Contact details
                        if(dsfs.Quote__c!=null){
                            qt = dsfs.Quote__r;
                            if(qt.ContactId!=null){cntc = qt.contact;}
                            if(qt.OpportunityId!=null){
                                if(qt.Opportunity.AccountId!=null){cust = qt.Opportunity.Account;}
                            }
                        }
                        
                        //Prepare Case object
                        if(cust!=null && cntc!=null){
                            Case tkt = new Case();
                            tkt.AccountId = cust.Id;
                            //Populate contact only if it belong to the account 
                            if(cust.Id==cntc.AccountId){tkt.ContactId = cntc.Id;}
                            tkt.OwnerId = dst.Ticket_Owner__c;
                            tkt.DocuSign_Status__c = dssId;
                            tkt.Subject = dst.Ticket_Subject__c;
                            tkt.Status = dst.Ticket_Status__c;
                            tkt.RecordTypeId = dst.Ticket_Record_Type__c;
                            tkt.Type = dst.Ticket_Type__c;
                            tkt.Description = cntc.Name + ' has provided invoicing and payment options on behalf of ' +
                            				  cust.Name + '.  Please review the requested payment option.';
                            listCases.add(tkt);
                        }
                    }
                }
                
                System.debug('createTickets|TICKETS~' + listCases);
                //Push the Cases to Database
                if(listCases.size()>0){
                    insert listCases;
                }
            }
        }
    }
}