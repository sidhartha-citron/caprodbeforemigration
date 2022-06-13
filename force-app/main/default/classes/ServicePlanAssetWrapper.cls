/**
 * @FileName: ServicePlanAssetWrapper
 * @Description: Wrapper class for service plan asset details
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/28/2019      Created
 *-----------------------------------------------------------  
 */
public inherited sharing class ServicePlanAssetWrapper implements Comparable {
    public String assetId;
    public OrderItem item;
    public List<ItemWrapper> items;
    public String schedule;
    public String suggestedServicePlanName;
    public Boolean selected;
    public Double selectedQuantity;

    public ServicePlanAssetWrapper(OrderItem item) {
        this.item = item.clone(false);
        this.items = new List<ItemWrapper>{new ItemWrapper(item)};
        this.selected = false;
        this.selectedQuantity = 0;
    }

    public ServicePlanAssetWrapper(OrderItem item, String schedule) {
        this.item = item.clone(false);
        this.schedule = schedule;
    }

    public Integer compareTo(Object compareTo) {
        ServicePlanAssetWrapper compareItem = (ServicePlanAssetWrapper) compareTo;

        if(item.Product2.Item_Type__c > compareItem.item.Product2.Item_Type__c) return 1;
        if(item.Product2.Item_Type__c < compareItem.item.Product2.Item_Type__c) return -1;

        Frequency__c itemFrequency = QueryUtils.yearlyFrequencies.get(item.Frequency__c);
        Frequency__c compareFrequency = QueryUtils.yearlyFrequencies.get(compareItem.item.Frequency__c);

        if(itemFrequency != null && compareFrequency != null) {
            if(itemFrequency.Occurrences_In_Year__c > compareFrequency.Occurrences_In_Year__c) return -1;
            if(itemFrequency.Occurrences_In_Year__c < compareFrequency.Occurrences_In_Year__c) return 1;
        }

        if(item.Product2.ExternalID__c > compareItem.item.Product2.ExternalID__c) return 1;
        if(item.Product2.ExternalID__c < compareItem.item.Product2.ExternalID__c) return -1;

        return 0;
    }

    // only wrap required fields to accommodate lightning message character limits
    public class ItemWrapper {
        public Id id;
        public Id servicePlanId;
        public String surveyLocations;
        public Double quantity;
        public Boolean selected;
        public String LastSPName;
        

        public ItemWrapper(OrderItem item) {
            this.id = item.Id;
            this.servicePlanId = item.Service_Plan__c;
            this.surveyLocations = item.Survey_Locations__c;
            this.quantity = item.Quantity;
            this.LastSPName = item.Last_Service_Plan_Name__c;
            selected = String.isNotBlank(item.Service_Plan__c);
        }
    }
}