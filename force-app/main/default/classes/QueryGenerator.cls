/**
* Name: QueryGenerator
* Author: PwC
* Date Created: April 11, 2019
* Purpose: A hub of all queries leveraging field sets
*/ 
public abstract with sharing class QueryGenerator {
    private static final String QUERY_SEPARATOR = ',';

    /**
     * Finds and returns all OrderItems as specified
     *
     * @param filter  the query WHERE clause
     */
    public static String queryOrderItems(String filter) {
        String query = 'SELECT ';
        
        for (Schema.FieldSetMember f : SObjectType.OrderItem.FieldSets.Order_Item_Query_Field_Set.getFields()) {
            query += f.getFieldPath() + QUERY_SEPARATOR;
        }
        
        query = query.substring(0, query.length() - 1);
        query += ' FROM OrderItem';
        
        if (!String.isBlank(filter)) {
            query += ' WHERE ' + filter;
        }
        
        return query;
    }
    
    // Varun 04/03/2020: Move to Order Functionality. Using a different fieldset Clone_Order_Products
        public static String queryCloneOrderItems(String filter) {
        String query = 'SELECT ';
        
        for (Schema.FieldSetMember f : SObjectType.OrderItem.FieldSets.Clone_Order_Products.getFields()) {
            query += f.getFieldPath() + QUERY_SEPARATOR;
        }
        
        query = query.substring(0, query.length() - 1);
        query += ' FROM OrderItem';
        
        if (!String.isBlank(filter)) {
            query += ' WHERE ' + filter;
        }
        
        return query;
    }
    /**
     * Finds and returns all PricebookEntries as specified
     *
     * @param filter  the query WHERE clause
     */
    public static String queryAllPestServiceProducts(String filter) {
        String query = 'SELECT ';
        
        for (Schema.FieldSetMember f : SObjectType.PricebookEntry.FieldSets.All_Pest_Service_Products_Field_Set.getFields()) {
            query += f.getFieldPath() + QUERY_SEPARATOR;
        }
        
        query += ' Product2.Service_Work_Type__r.EstimatedDuration, Product2.Service_Work_Type__r.DurationType';
        query += ' FROM PricebookEntry';
        
        if (!String.isBlank(filter)) {
            query += ' WHERE ' + filter;
        }
        
        return query;
    }

    /**
     * Finds and returns all ServiceResources as specified
     *
     * @param filter  the query WHERE clause
     */
    public static String queryResourcePreferences(String filter) {
        String query = 'SELECT ';

        for (Schema.FieldSetMember f : SObjectType.Technician_Preference__c.FieldSets.Technician_Preference_Table_Field_Set.getFields()) {
            query += f.getFieldPath() + QUERY_SEPARATOR;
        }

        query = query.substring(0, query.length() - 1);
        query += ' FROM Technician_Preference__c';

        if (!String.isBlank(filter)) {
            query += ' WHERE ' + filter;
        }

        return query;
    }
    
    /**
     * Finds and returns all Survey_Location__c records as specified
     *
     * @param filter  the query WHERE clause
     */
    public static String querySurveyLocations(String filter) {
        String query = 'SELECT ';
        
        for (Schema.FieldSetMember f : SObjectType.Survey_Location__c.FieldSets.EDW_Fieldset.getFields()) {
            query += f.getFieldPath() + QUERY_SEPARATOR;
        }
        
        query = query.substring(0, query.length() - 1);
        query += ' FROM Survey_Location__c';
        
        if (!String.isBlank(filter)) {
            query += ' WHERE ' + filter;
        }
        
        return query;
    }
}