/**
 * @FileName: ServicePlanCtrlHelper
 * @Description: Helper methods for ServicePlanCtrl
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/22/2019      Created
 *-----------------------------------------------------------  
 */
public inherited sharing class ServicePlanCtrlHelper {

    /*
     * @Name        checkPermissions
     * @Description Check that the user has permission to use the Service Plan Manager
     * @Author      Graeme Ward
     * @Params      N/A
     * @Return      String: Service Plan Manager permission level
     */
    public static String checkPermissions() {
        String permissionLevel = 'None';

        if(FeatureManagement.checkPermission('Service_Plan_Manager_Read_Write')) {
            permissionLevel = 'Read/Write';
        }
        else if(FeatureManagement.checkPermission('Service_Plan_Manager_Read_Only')) {
            permissionLevel = 'Read Only';
        }

        return permissionLevel;
    }

    /*
     * @Name        getAccountData
     * @Description Get all relevant Order Items and Service Plans for this Account
     * @Author      Graeme Ward
     * @Params      accountId: Id of the Account record
     * @Return      String: Serialized data wrapper with Account details
     */
    public static String getAccountData(String accountId) {
        return JSON.serialize(new DataWrapper(accountId));
    }

    public static String getServicePlan() {
        return JSON.serialize(new Service_Plan__c());
    }

    /*
     * @Name        getOrderItems
     * @Description Get a list of order items based on search criteria and add them to an asset wrapper class
     * @Author      Graeme Ward
     * @Params      criteriaJSON: serialized filter parameters passed from lightning component
     * @Return      String: Serialized wrapper with order items that matched the search criteria
     */
    public static String getOrderItems(String criteriaJSON) {
        FilterWrapper filters = (FilterWrapper) JSON.deserialize(criteriaJSON, FilterWrapper.class);
        List<OrderItem> items = Database.query(constructItemQuery(filters));

        Map<String,ServicePlanAssetWrapper> assetMap = new Map<String,ServicePlanAssetWrapper>();
        //FXR-517
        for(OrderItem item : items) {
            
            String assetId;
            if(filters.variety == 'Auto Assign' || filters.variety == 'Unassigned'){
                assetId = item.Product2.ExternalID__c +'-' + item.Order_Number__c +'-' + item.Frequency__c +'-' + item.Last_Service_Plan_Name__c;
            }
            else{
            	assetId = item.Product2.ExternalID__c +'-' + item.Order_Number__c +'-' + item.Frequency__c;
            }

            ServicePlanAssetWrapper asset = assetMap.get(assetId);

            // create a new asset wrapper
            if(asset == null) {
                asset = new ServicePlanAssetWrapper(item);
                asset.assetId = assetId;
                System.debug('--NEW--' + item);
                System.debug('--ASSET--' + asset.item);
            }
            // add this item to an existing asset wrapper
            else {
                asset.items.add(new ServicePlanAssetWrapper.ItemWrapper(item));
                asset.item.Quantity += item.Quantity;
                System.debug('--EXT--' + item);
                System.debug('--ASSET--' + asset.item);
            }

            // if any items associated to this asset have a service plan, the asset is marked as selected
            if(String.isNotBlank(item.Service_Plan__c)) {
                if(!asset.selected) asset.selected = true;
                asset.selectedQuantity += item.Quantity;
            }
			
            assetMap.put(assetId, asset);
        }

        assetMap.values().sort();

        return JSON.serialize(filterAssets(assetMap, filters));
    }

    /*
     * @Name        checkForDuplicateServicePlans
     * @Description Check if similar service plans already exist
     * @Author      Graeme Ward
     * @Params      criteriaJSON: serialized service plan
     * @Return      String: serialized list of possible duplicate service plans
     */
    public static String checkForDuplicateServicePlans(String criteriaJSON) {
        ServicePlanWrapper wrapper = (ServicePlanWrapper) JSON.deserialize(criteriaJSON, ServicePlanWrapper.class);

        Route__c route = [SELECT Id, Service_Resource__c FROM Route__c WHERE Id = :wrapper.servicePlan.Route__c];

        List<Service_Plan__c> plans = [
                SELECT Id, Name
                FROM Service_Plan__c
                WHERE Account__c = :wrapper.servicePlan.Account__c
                AND Route__r.Service_Resource__c = :route.Service_Resource__c
                AND Job_Type__c = :wrapper.servicePlan.Job_Type__c
                AND Line_of_Business__c = :wrapper.servicePlan.Line_of_Business__c
                AND Frequency__c = :wrapper.servicePlan.Frequency__c
                AND Schedule_Type__c = :wrapper.servicePlan.Schedule_Type__c
                AND Id != :wrapper.servicePlan.Id
                ORDER BY Name ASC
        ];

        return JSON.serialize(plans);
    }

    /*
     * @Name        assignOrderItems
     * @Description assign order items to their suggested service plan
     * @Author      Graeme Ward
     * @Params      criteriaJSON: serialized service plan and assets for upsert
     * @Return      void
     */
    public static void upsertServicePlan(String criteriaJSON) {
        ServicePlanWrapper wrapper = (ServicePlanWrapper) JSON.deserialize(criteriaJSON, ServicePlanWrapper.class);

        upsert wrapper.servicePlan;

        List<OrderItem> items = new List<OrderItem>();

        for(ServicePlanAssetWrapper asset : wrapper.assets) {
            for(ServicePlanAssetWrapper.ItemWrapper itemWrapper : asset.items) {
                OrderItem item = new OrderItem(Id = itemWrapper.id);

                if(itemWrapper.selected) {
                    item.Service_Plan__c = wrapper.servicePlan.Id;
                } else {
                    item.Service_Plan__c = null;
                }

                items.add(item);
            }
        }

        // if key fields were changed while managing a service plan items that no longer match
        // previous items on the service plan must be disassociated from the service plan
        if(wrapper.keyFieldChange) {
            List<OrderItem> oldItems = [
                    SELECT Id
                    FROM OrderItem
                    WHERE Service_Plan__c = :wrapper.servicePlan.Id
                    AND Id NOT IN :items
            ];

            for(OrderItem item : oldItems) {
                item.Service_Plan__c = null;
                items.add(item);
            }
        }

        ServicePlanUtils.allowActiveOrderUpdates = true;
        update items;
        ServicePlanUtils.allowActiveOrderUpdates = false;
    }

    /*
     * @Name        assignOrderItems
     * @Description assign order items to their suggested service plan
     * @Author      Graeme Ward
     * @Params      criteriaJSON: serialized assets to be assigned to service plans
     * @Return      void
     */
    public static void assignOrderItems(String criteriaJSON) {
        List<ServicePlanAssetWrapper> assets = (List<ServicePlanAssetWrapper>)
                JSON.deserialize(criteriaJSON, List<ServicePlanAssetWrapper>.class);

        List<OrderItem> items = new List<OrderItem>();

        for(ServicePlanAssetWrapper asset : assets) {
            for(ServicePlanAssetWrapper.ItemWrapper itemWrapper : asset.items) {
                items.add(new OrderItem(
                        Id = itemWrapper.id,
                        Service_Plan__c = itemWrapper.servicePlanId
                ));
            }
        }

        ServicePlanUtils.allowActiveOrderUpdates = true;
        update items;
        ServicePlanUtils.allowActiveOrderUpdates = false;
    }

    /*
     * @Name        constructItemQuery
     * @Description Construct query for fetching Order Items
     * @Author      Graeme Ward
     * @Params      filters: filter parameters passed from the service plan manager component
     * @Return      String: query string
     */
    private static String constructItemQuery(FilterWrapper filters) {
        String query = 'SELECT Id, Product_Name__c, Product2.Item_Type__c, Product2.ProductCode, ' +
                            'Product2.ExternalID__c, Quantity, Account_Id__c, Order_Number__c, Service_Plan__c, ' +
                            'Service_Plan_Name__c, Item_Type__c, Line_of_Business__c, Frequency__c, ' +
                            'Survey_Locations__c, Last_Service_Plan_Name__c ' +
                        'FROM OrderItem ' +
                        'WHERE Account_Id__c = \'' + filters.accountId + '\' ' +
                        'AND Frequency__c != \'One-Time\' ' +
                        'AND Active__c = ' + true + ' ' +
                        'AND Is_Never_Generate_Work_Order__c = ' + false;

        //String q1 = query;
        //System.debug('~~Q1:' + query);
        
        if(String.isNotBlank(filters.jobType)) {
            if(filters.jobType == 'Recurring Delivery') {
                query += ' AND Product2.Item_Type__c = \'Consumables\'';
            }
            else if(filters.jobType == 'Recurring Service') {
                query += ' AND Product2.Item_Type__c = \'Service\'';

                if(filters.lineOfBusiness == 'Hygiene/Life Safety') {
                    query += ' AND (Line_of_Business__c = \'Hygiene\' OR Line_of_Business__c = \'Life Safety\')';
                } else {
                    query += ' AND Line_Of_Business__c = \'' + filters.lineOfBusiness + '\'';
                }
            }
        }
        else {
            query += ' AND (Product2.Item_Type__c = \'Consumables\' OR Product2.Item_Type__c = \'Service\')';
        }

        if(String.isNotBlank(filters.frequency)) {
            query += ' AND Frequency__c = \'' + filters.frequency + '\'';
        }

        if(String.isNotBlank(filters.variety) && filters.variety != 'Manage') {
            query += ' AND Service_Plan__c = ' + null;
        }

        if(filters.variety == 'Manage') {
            query += ' AND (Service_Plan__c = ' + null + ' OR Service_Plan__c = \'' + filters.servicePlanId + '\')';
        }

        query += ' ORDER BY Survey_Locations__c ASC NULLS LAST, Product_Name__c ASC';
        
        //String q2 = query.replace(q1, '');
        //System.debug('~~Q2:' + q2);
        //System.debug('~~Q3:' + query);

        return query;
    }

    /*
     * @Name        filterAssets
     * @Description filter assets returned from the query based on the filter parameters
     * @Author      Graeme Ward
     * @Params      assetMap: map of assets returned by the order item query
     *              filters: filter parameters passed from the service plan manager component
     * @Return      Map<String,ServicePlanAssetWrapper>: filtered asset map
     */
    private static Map<String,ServicePlanAssetWrapper> filterAssets(Map<String,ServicePlanAssetWrapper> assetMap, FilterWrapper filters) {
        Map<String,ServicePlanAssetWrapper> filteredAssets = new Map<String,ServicePlanAssetWrapper>();

        if(filters.variety == 'Auto Assign') {
            for(String assetId : assetMap.keySet()) {
                ServicePlanAssetWrapper asset = assetMap.get(assetId);
                List<Service_Plan__c> servicePlans = new List<Service_Plan__c>();

                for(Service_Plan__c plan : filters.dataWrapper.servicePlans) {
                    if(plan.Frequency__c != asset.item.Frequency__c) continue;

                    Boolean match = false;

                    if(plan.Job_Type__c == 'Recurring Service' && asset.item.Item_Type__c == 'Service') {
                        if(plan.Line_of_Business__c == asset.item.Line_of_Business__c
                                || (plan.Line_of_Business__c == 'Hygiene/Life Safety'
                                    && (asset.item.Line_of_Business__c == 'Hygiene'
                                        || asset.item.Line_of_Business__c == 'Life Safety')))
                        {
                            match = true;
                        }
                    } else if(plan.Job_Type__c == 'Recurring Delivery' && asset.item.Item_Type__c == 'Consumables') {
                        match = true;
                    }

                    if(match) {
                        servicePlans.add(plan);
                    }
                }

                if(servicePlans.size() == 1) {
                    asset.item.Service_Plan__c = servicePlans[0].Id;
                    asset.suggestedServicePlanName = servicePlans[0].Name;
                    filteredAssets.put(assetId,asset);
                }
            }
        } else {
            filteredAssets = assetMap;
        }

        return filteredAssets;
    }

    // WRAPPER CLASSES

    /*
     * @Name        DataWrapper
     * @Description Wrapper class to contain Order Products and their associated Service Plans
     * @Author      Graeme Ward
     */
    public class DataWrapper{
        public List<Service_Plan__c> servicePlans;
        public PicklistWrapper picklistOptions;

        /*
         * @Name        DataWrapper
         * @Description Constructor to fetch all Service Plan information related to a list of Order Products
         * @Author      Graeme Ward
         * @Params      items: List of Order Products
         */
        public DataWrapper(Id accountId) {
            this.servicePlans = getServicePlans(accountId);
            this.picklistOptions = new PicklistWrapper();
        }

        /*
         * @Name        getServicePlans
         * @Description Get the Service Plans associated to an account
         * @Author      Graeme Ward
         * @Params      items: List of Order Products
         * @Return      List<Service_Plan__c>: List of Service Plans
         */
        private List<Service_Plan__c> getServicePlans(Id accountId) {
            List<Service_Plan__c> servPlanList = [
                    SELECT Id, Name,Account__c,Route__r.Service_Resource__c,Route__r.Service_Resource__r.Name,Count__c,
                            Job_Type__c, Line_of_Business__c, Frequency__c, Schedule_Type__c, Schedule_Type__r.Name, Effective_Date__c
                    FROM Service_Plan__c
                    WHERE Account__c = :accountId
                    ORDER BY Route__r.Service_Resource__r.Name, Name ASC
            ];
            
            Map<Id,Service_Plan__c> mapSPlans = new Map<Id,Service_Plan__c>();
            for(Service_Plan__c sp:servPlanList){
                sp.Count__c=0;
                mapSPlans.put(sp.Id,sp);
            }
            
            List<OrderItem> ordItemList = [
                	SELECT Id,Service_Plan__c FROM OrderItem WHERE Service_Plan__c in: mapSPlans.keySet()
            ];
            
            for(OrderItem OI:ordItemList){
                if(mapSPlans.containsKey(OI.Service_Plan__c)){
                    Service_Plan__c sp_l = mapSPlans.get(OI.Service_Plan__c);
                    sp_l.Count__c++;
                } 
            }
            
            List<ListSorter> orderedSP = new List<ListSorter>();
            for(Service_Plan__c sp:mapSPlans.values()){orderedSP.add(new ListSorter(sp));}
            orderedSP.sort();
            
            List<Service_Plan__c> finalSPList = new List<Service_Plan__c>();
            for(ListSorter osp:orderedSP){finalSPList.add(osp.priSP);}
            
            return finalSPList;
        }
    }

    /*
     * @Name        PicklistWrapper
     * @Description Wrapper class to contain picklist values for an object and its picklist fields
     * @Author      Graeme Ward
     */
    public class PicklistWrapper {
        public List<ApexUtils.OptionWrapper> jobTypes;
        public List<ApexUtils.OptionWrapper> linesOfBusiness;
        public List<ApexUtils.OptionWrapper> frequencies;

        /*
         * @Name        PicklistWrapper
         * @Description Constructor to fetch picklist values for an object and its picklist fields
         * @Author      Graeme Ward
         */
        public PicklistWrapper() {
            this.jobTypes = ApexUtils.getFieldPicklistValues('Service_Plan__c', 'Job_Type__c', true);
            this.linesOfBusiness = ApexUtils.getFieldPicklistValues('Service_Plan__c', 'Line_of_Business__c', true);
            this.frequencies = new List<ApexUtils.OptionWrapper>();

            for(ApexUtils.OptionWrapper option : ApexUtils.getFieldPicklistValues('Service_Plan__c', 'Frequency__c', true)) {
                if(option.key != 'One-Time') this.frequencies.add(option);
            }
        }
    }

    public class FilterWrapper {
        public DataWrapper dataWrapper;
        public String variety;
        public String accountId;
        public String servicePlanId;
        public String jobType;
        public String lineOfBusiness;
        public String frequency;
    }

    public class ServicePlanWrapper {
        public Service_Plan__c servicePlan;
        public List<ServicePlanAssetWrapper> assets;
        public Boolean keyFieldChange;
    }

    public class ServicePlanException extends Exception {}
    
    public class ListSorter implements Comparable {
    	public Service_Plan__c priSP;
	    public ListSorter(Service_Plan__c sp){priSP = sp;}
    
	    public Integer compareTo(Object compareTo) {
        	ListSorter compareToSP = (ListSorter)compareTo;
	        Integer returnValue = 0;
            if (priSP.Count__c > compareToSP.priSP.Count__c) {returnValue = -1;} 
            else if (priSP.Count__c  < compareToSP.priSP.Count__c) {returnValue = 1;}
            return returnValue;       
    	}
	}
}