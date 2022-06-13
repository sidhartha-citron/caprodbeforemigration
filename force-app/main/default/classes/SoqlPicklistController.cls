/**
 * Controller for the lookup picklist lightning component
 *
 * @author Tim Chiang
 * @date Feb 2020
 *
 **/
public with sharing class SoqlPicklistController {

    /**
    * Wrapper class for picklist options
    *
    * @author Tim Chiang
    * @date Feb 2020
    *
    **/
    public class PicklistOption {

        @AuraEnabled
        public String label { get; set; }

        @AuraEnabled
        public String value { get; set; }

        public PicklistOption( String label, String value ) {
            this.label = label;
            this.value = value;
        }
    }

    /**
     * Get picklist values
     *
     * @param   objectName          target Sobject
     * @param   targetColumnValue   target Target field as value
     * @param   targetColumnLabel   target Target field as label
     * @param   whereClause         where clause for lookup query
     * @param   orderBy             sort order for lookup query
     * @return                      return lookup results
     **/
    @AuraEnabled(cacheable=true)
     public static List<PicklistOption> getPicklistOptions(String objectName,
                                                         String targetColumnValue,
                                                         String targetColumnLabel,
                                                         String whereClause,
                                                         String orderBy) {


        String queryString = 'SELECT ' + targetColumnValue;
        if(!String.isEmpty(targetColumnLabel)){
            queryString = queryString + ', ' + targetColumnLabel;
        }
        queryString = queryString + ' FROM ' + objectName;

         if(!String.isEmpty(whereClause)){
             queryString = queryString + ' WHERE ' + whereClause;
         }
         if(!String.isEmpty(orderBy)){
             queryString = queryString + ' ORDER BY ' + orderBy;
         }

        List<SObject> results = Database.query(queryString);
        List<PicklistOption> options = new List<PicklistOption>();

        for(SObject o: results){
            if(!String.isEmpty(targetColumnLabel)){
                options.add(new PicklistOption(String.valueOf(o.get(targetColumnLabel)), String.valueOf(o.get(targetColumnValue))));
            } else {
                options.add(new PicklistOption(String.valueOf(o.get(targetColumnValue)), String.valueOf(o.get(targetColumnValue))));
            }
        }

        return options;
    }
}