/**
* Name: EDW_InputLookup
* Author: PwC
* Date Created: January 7, 2019
* Purpose: To act as the controller for the EDW_InputLookup lightning component
*/ 
public with sharing class EDW_InputLookup {
    static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    private static final Integer LIMIT_SIZE = 10;
    private static final String QUERY_SEPARATOR = ',';
    
    /**
     * Finds and returns the record selected
     *
     * @param id  the Id of the record to be returned
     * @param sObjectType  the API name of the object to be queried
     */
    @AuraEnabled
    public static SObject loadDefault(String id, String sObjectType) {
        //selecting the record
        try {
            String query = 'SELECT Id, ';
            
            if (sObjectType == 'Account') {
                query += 'Name, AccPac_Account__c, Site_Survey__r.Name, Site_Survey__c, PO_Required_on_Line_Item__c, Is_Multi_Res__c FROM {1} WHERE Id={0}';
            } else if (sObjectType == 'Contact') {
                //sObjectType = 'AccountContactRelation';
                //query += 'Contact.Name FROM {1} WHERE Id={0}';
            	query += 'Name FROM {1} WHERE Id={0}';
			} else if (sObjectType == 'Case') {
                query += 'CaseNumber, Account.Is_Multi_Res__c, Status FROM {1} WHERE Id={0}';
            } else if (sObjectType == 'Survey_Location__c') {
                return Database.query(QueryGenerator.querySurveyLocations('Id = :id'));
            }
            
            return Database.query(String.format(query, new List<String> { '\'' + id + '\'', sObjectType }));
        } catch (Exception e) {
            System.debug(e);
        }     
        return null;
    }
    
    /**
     * Searches for all records on the specified object that match a search criteria
     *
     * @param filterCriteria  the search text used to filter results
     * @param sObjectType  the API name of the object to be queried
     * @param filterId  the Id of a relationship to further filter results
     * @param numberOfRoomsFilter  a filter on Survey_Location__c for Number of Rooms
     */
    @AuraEnabled
    public static List<SObject> searchLookup(String filterCriteria, String sObjectType, String filterId, String numberOfRoomsFilter) {
        //listing out records to select
        String query = 'SELECT Id, ';
        
        if (sObjectType == 'Account') {
            query += 'Name FROM ' + sObjectType + ' WHERE Name LIKE \'' + filterCriteria + '%\' AND RecordTypeId=\'' + dataSets.Account_Ship_To_Record_Type_Id__c + '\'';
        } else if (sObjectType == 'Contact') {
            //query += 'Contact.Name, ContactId FROM AccountContactRelation WHERE Contact.Name LIKE \'' + s + '%\' AND AccountId=\'' + filterId + '\'';
        	query += 'Name FROM ' + sObjectType + ' WHERE Name LIKE \'' + filterCriteria + '%\' AND AccountId=\'' + filterId + '\'';
        } else if (sObjectType == 'Case') {
            query += 'CaseNumber FROM ' + sObjectType + ' WHERE CaseNumber LIKE \'' + filterCriteria + '%\' AND AccountId=\'' + filterId + '\' AND RecordTypeId=\'' + dataSets.Ticket_Emergency_Record_Type__c + '\' AND Status != \'' + dataSets.Ticket_Closed_Status__c + '\'';
        } else if (sObjectType == 'Survey_Location__c') {
            query += 'Name FROM ' + sObjectType + ' WHERE Name LIKE \'%' + filterCriteria + '%\' AND Site_Survey__c=\'' + filterId + '\'';
                
            //if (!String.isBlank(numberOfRoomsFilter)) {
            //    query += ' AND Number_of_Rooms__c =\'' + numberOfRoomsFilter + '\'';
            //}
        }
        
        query += ' LIMIT ' + LIMIT_SIZE;
        
        System.debug(query);
        
        return Database.query(query);
    }
}