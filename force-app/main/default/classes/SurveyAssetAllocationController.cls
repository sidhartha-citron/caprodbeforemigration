public with sharing class SurveyAssetAllocationController {
    private static String SAL_STATUS_ALLOCATED = 'Allocated';
    private static String SAL_STATUS_UNALLOCATED = 'Unallocated';
    private static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    
    public class ViewData {
        @AuraEnabled
        public Id siteSurveyId {get; set;}
        @AuraEnabled
        public Boolean isOrderSeasonal {get; set;}
        @AuraEnabled
        public String languageCode {get; set;}
        @AuraEnabled
        public List<SurveyProduct> unAllocatedAssets {get; set;}
        @AuraEnabled
        public List<SurveyProduct> allocatedAssets {get; set;}
        @AuraEnabled
        public List<SurveyLocationCounter> locationCounter {get; set;}
        @AuraEnabled
        public List<Survey_Location__c> surveyLocations {get; set;}
        @AuraEnabled
        public List<Site_Survey_Sorting_Setting__mdt> sortFields {get; set;}
    }
    
    public class SurveyLocationCounter {
        @AuraEnabled
        public String locationId {get; set;}
        @AuraEnabled
        public Boolean hasAssets {get; set;}
        
        SurveyLocationCounter(String locationId, Boolean hasAssets) {
            this.locationId = locationId;
            this.hasAssets = hasAssets;
        }
    }
    
    public class SurveyProduct {
        @AuraEnabled
        public String productid {get; set;}
        @AuraEnabled
        public String name {get; set;}
        @AuraEnabled
        public String fname {get; set;}
        @AuraEnabled
        public String relatedProdName {get; set;}
        @AuraEnabled
        public String relatedProdId {get; set;}
        @AuraEnabled
        public Decimal quantity {get; set;}
        @AuraEnabled
        public Decimal quantityWithRecord {get; set;}
        @AuraEnabled
        public String sourceRecordId {get; set;}
        @AuraEnabled
        public String sourceParentId {get; set;}
        @AuraEnabled
        public String locationId {get; set;}
        @AuraEnabled
        public String notes {get; set;}
        @AuraEnabled
        public Boolean isParent {get; set;}
        @AuraEnabled
        public String serviceFrequency {get; set;}
        @AuraEnabled
        public Set<Id> surveyAssetIds {get; set;}
        
        SurveyProduct() {
            quantityWithRecord = 0.0;
            surveyAssetIds = new Set<Id>();
        }
    }
    
    public class SurveyLocationWrapper {
        
        @AuraEnabled
        public Survey_Location__c theLocation {get;set;}
        @AuraEnabled
        public List<Survey_Asset_Location__c> theAssets {get;set;}
        
        SurveyLocationWrapper (Survey_Location__c theLocation) {
            this.theLocation = theLocation;
        }
    }

    public class picklistWrapper{
        @AuraEnabled 
		public string pickListLabel;
        @AuraEnabled 
		public string pickListValue;
        @AuraEnabled 
		public string pickListTranslation;
        
    }

    @AuraEnabled
    public static String initSiteSurvey(String parentRecordId) 
    {
        //String siteSurveyId;
        if(parentRecordId.left(3) == Opportunity.sobjecttype.getDescribe().getKeyPrefix()) {
            return initSiteSurveyForOppty(parentRecordId);
        } else if(parentRecordId.left(3) == Order.sobjecttype.getDescribe().getKeyPrefix()) {
           return initSiteSurveyForOrder(parentRecordId);
        }
        return null;
        //System.debug(' Site Survey ' + siteSurveyId + ' parentRecordId ' + parentRecordId);
        //return siteSurveyId;
    }
    
   	@AuraEnabled
    public static Integer getLocationsPerPage(){
        return Integer.valueOf(dataSets.LocationsPerPage__c);
    }
    
    @AuraEnabled 
    public static Survey_Location__c saveSurveyLocation(String locationJson) {

        Survey_Location__c locationRecord = (Survey_Location__c)System.JSON.deserialize(locationJson, Survey_Location__c.class);
        
        if(locationRecord != null) {
            try {
                upsert locationRecord; 
                return locationRecord; 
            } catch(Exception e) {
                System.debug(e.getLineNumber() + ' -- ' + e.getMessage());
            }
        }
        return null;
    }
    
    private static String initSiteSurveyForOppty(String opptyId) {   
        Map<Id, OpportunityLineItem> validOppProds = new Map<Id, OpportunityLineItem>(); 
        List<Survey_Asset_Location__c> newAssets = new List<Survey_Asset_Location__c>();
        Savepoint sp = Database.setSavepoint();//added because of the insert and update calls [dk]
        
        try {
            Opportunity opp = [SELECT Id, AccountId, Site_Survey__c, RecordTypeId, (SELECT Id, Product2Id, Product2.Name, Quantity, OpportunityId, isConverted__c, isPurchaseOnly__c, SurveyAssetCountChecker__c,  
                                                      Opportunity.Site_Survey__c, Related_Product__c, Service_Frequency__c FROM OpportunityLineItems) 
                               FROM Opportunity WHERE Id = :opptyId ];
            for(OpportunityLineItem ol : opp.OpportunityLineItems)
            {
                Boolean isValid = ! (ol.IsConverted__c || ol.isPurchaseOnly__c) && opp.RecordTypeId!=dataSets.Opportunity_RecordType_Frequency_Change__c;
                if(isValid) {
                    Decimal difference = ( ol.SurveyAssetCountChecker__c == null ) ? ol.Quantity : ol.Quantity - ol.SurveyAssetCountChecker__c;
                    if(difference > 0) {
                        validOppProds.put(ol.Id, ol);  
                    }  
                }    
            } 
            
            for(OpportunityLineItem ol : validOppProds.values()) {
                for(Integer i=Integer.valueOf(ol.SurveyAssetCountChecker__c+1); i<=Integer.valueOf(ol.Quantity); i++) {
                    Survey_Asset_Location__c newAsset = new Survey_Asset_Location__c(
                        Site_Survey__c = ol.Opportunity.Site_Survey__c, 
                        Product__c = ol.Product2Id, 
                        Related_Product__c = ol.Related_Product__c, 
                        Originating_Record_ID__c = ol.Id, 
                        Originating_Parent_ID__c = ol.OpportunityId, 
                        Quantity__c = 1, 
                        Service_Frequency__c = ol.Service_Frequency__c
                    );
                    newAssets.add(newAsset);
                }
                ol.SurveyAssetCountChecker__c = ol.Quantity;
            }
            
            if(!newAssets.isEmpty()) {
                insert newAssets;
                System.debug(newAssets);
                update validOppProds.values();
                System.debug(validOppProds.values());
            }
            System.debug(opp.Site_Survey__c);
            return opp.Site_Survey__c;
        }catch(Exception e) {
            Database.rollback(sp);
            System.debug(e.getLineNumber() + ' -- ' + e.getMessage());
            return null;
        }      
    }
    
    private static String initSiteSurveyForOrder(String orderId) {
        Map<Id, OrderItem> orderItems = new Map<Id, OrderItem>();
        Map<Id, Survey_Asset_Location__c> newAssetMap = new Map<Id, Survey_Asset_Location__c>();
        List<Order_Item_Location__c> newOrderItemLocations = new List<Order_Item_Location__c>();
        Savepoint sp = Database.setSavepoint();//added because of the insert and update calls [dk]
        
        try {
            Order o = [SELECT Id, AccountId, Site_Survey__c, Parent_Order__c, Emergency__c,
                       (SELECT Id, Product2Id, Quantity, OrderId, isPurchaseOnly__c, SurveyAssetCountChecker__c, Order.Site_Survey__c, Related_Product__c, PricebookEntry.Product2Id, Active__c, 
                        HasSurveyAssets__c, Parent_Order_Product__c, Order.Parent_Order__r.Site_Survey__c, Frequency__c FROM OrderItems WHERE Active__c=TRUE) 
                       FROM Order WHERE Id=:orderId];
            orderId = o.Parent_Order__c == null ? o.Id : o.Parent_Order__c; 
            
            for(OrderItem oi : o.OrderItems) {
                Id orderProductId = oi.Parent_Order_Product__c == null ? oi.Id : oi.Parent_Order_Product__c;
                if(!oi.isPurchaseOnly__c && !oi.HasSurveyAssets__c) {
                    Survey_Asset_Location__c newAsset = new Survey_Asset_Location__c(
                        Site_Survey__c = oi.Order.Site_Survey__c, 
                        Product__c = oi.PricebookEntry.Product2Id, 
                        Related_Product__c = oi.Related_Product__c, 
                        Quantity__c = 1, 
                        Originating_Record_ID__c = orderProductId, 
                        Originating_Parent_ID__c = orderId, 
                        Service_Frequency__c = oi.Frequency__c
                    );
                    newAssetMap.put(oi.Id, newAsset);
                    orderItems.put(oi.Id, oi);
                }  
            }
            
            if(!newAssetMap.isEmpty()) {
                insert newAssetMap.values();
                
                for(OrderItem oi : orderItems.values()) {
                    if(!oi.isPurchaseOnly__c && !oi.HasSurveyAssets__c) {
                        Id orderProductId = oi.Parent_Order_Product__c == null ? oi.Id : oi.Parent_Order_Product__c;
                        newOrderItemLocations.add(new Order_Item_Location__c(
                            Order__c = orderId, 
                            Order_Product__c = orderProductId, 
                            Survey_Asset_Location__c = newAssetMap.get(oi.Id).Id
                        ));
                    }
                    oi.HasSurveyAssets__c = true;
                    oi.SurveyAssetCountChecker__c = oi.Quantity;
                }
                insert newOrderItemLocations;
                update orderItems.values();
            }  
            return o.Site_Survey__c;
        } catch(Exception e) {
            Database.rollback(sp);
            System.debug(e.getLineNumber() + ' -- ' + e.getMessage());
            return null;
        }  
    }

    @AuraEnabled
    public static ViewData loadViewData(String parentRecordId, String siteSurveyId)    
    { 
        System.debug(' -- Apex loadViewData -- ' + siteSurveyId);
        Map<Boolean, List<Survey_Asset_Location__c>> mapSAL = new Map<Boolean, List<Survey_Asset_Location__c>>();
        List<Survey_Asset_Location__c> listSAL = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> listOAL = new List<Order_Item_Location__c>();
        Set<Id> associatedSurveyRecords = new Set<Id>();
        Boolean isSeasonal = false;
        String languageCode = '';
        Set<Id> locationIds = new Set<Id>();
        Set<Id> associatedOrderLocationIds = new Set<Id>();
        List<SurveyLocationCounter> locationCounter = new List<SurveyLocationCounter>();
                
        try {
            if(parentRecordId.left(3) == Opportunity.sobjecttype.getDescribe().getKeyPrefix()) 		//OPPTY
            {
                Opportunity opp = [SELECT Id, isConverted__c, Account.ShippingState FROM Opportunity WHERE Id=:parentRecordId];
                Boolean isParent = !opp.isConverted__c;
                languageCode = (opp.Account.ShippingState == 'QC') ? 'fr' : '';
                
                listSAL = [SELECT Id, Site_Survey__c, Survey_Location__c, Originating_Parent_ID__c, Originating_Record_ID__c,Product__c,
                           Quantity__c, Product__r.Name, Product__r.French_Product_Name__c, Status__c, Related_Product__c, Related_Product__r.Name, Service_Frequency__c  FROM Survey_Asset_Location__c 
                           WHERE Originating_Parent_ID__c=:parentRecordId];
                
                System.debug(isParent + ' -- Opportunity');
                System.debug(listSAL);
                
                mapSAL.put(isParent, listSAL);

                for(Survey_Asset_Location__c sa : listSAL) {
                    associatedSurveyRecords.add(sa.Id);
                }
				
				List<Survey_Asset_Location__c> listOtherAssets = [SELECT Id, Site_Survey__c, Survey_Location__c, Originating_Parent_ID__c, Originating_Record_ID__c,Product__c,
                           										  Quantity__c, Product__r.Name, Product__r.French_Product_Name__c, Status__c, Related_Product__c, Related_Product__r.Name, Service_Frequency__c  
                                                                  FROM Survey_Asset_Location__c WHERE Id NOT IN:associatedSurveyRecords AND Status__c=:SAL_STATUS_ALLOCATED 
                                                                  AND Site_Survey__c=:siteSurveyId AND Service_Frequency__c!=:dataSets.Non_Recurring_Frequency_Value__c];
                
                if(!listOtherAssets.isEmpty()) {
                    if(!isParent) {
                        mapSAL.get(isParent).addAll(listOtherAssets);
                    } else {
                        mapSAL.put(false, listOtherAssets);
                    }
                }

            } 
            else if(parentRecordId.left(3) == Order.sobjecttype.getDescribe().getKeyPrefix()) 		//ORDER
            {     
                Set<Id> orderItemIds = new Set<Id>();
                Set<Id> emergencyOrderItemIds = new Set<Id>();
                Id orderId;
                
                Order o = [SELECT Id, AccountId, Site_Survey__c, Parent_Order__c, Emergency__c, Account.ShippingState, 
                           (SELECT Id, Product2Id, Quantity, OrderId, isPurchaseOnly__c, SurveyAssetCountChecker__c, Order.Site_Survey__c, Related_Product__c, 
                            PricebookEntry.Product2Id, Active__c, HasSurveyAssets__c, Parent_Order_Product__c, Order.Parent_Order__r.Site_Survey__c 
                            FROM OrderItems WHERE Active__c=TRUE) 
                           FROM Order WHERE Id=:parentRecordId];
                
                orderId = o.Id;
                
                languageCode = (o.Account.ShippingState == 'QC') ? 'fr' : '';

                for(OrderItem oi : o.OrderItems) {
                    orderItemIds.add(oi.Id);
                } 
                
                if(o.Parent_Order__c != null && !o.Emergency__c) {
                    orderId = o.Parent_Order__c;
                    System.debug(' Child Order ');
                    Map<Id, OrderItem> orderItemMap = new Map<Id, OrderItem>([SELECT Id, OrderId FROM OrderItem WHERE OrderId =:o.Parent_Order__c]);
                    orderItemIds.clear();
                    orderItemIds.addAll(orderItemMap.keySet()); 
                }
                List<Order_Item_Location__c> listOrderItemLocations = [SELECT Order_Product__c,Order_Product__r.OrderId, Survey_Asset_Location__c, Survey_Asset_Location__r.Site_Survey__c, 
                                                                       Survey_Asset_Location__r.Product__c,Survey_Asset_Location__r.Quantity__c, Order__r.Emergency__c, Survey_Asset_Location__r.Service_Frequency__c,
                                                                       Survey_Asset_Location__r.Status__c,Survey_Asset_Location__r.Survey_Location__c, Survey_Asset_Location__r.Related_Product__r.Id, 
                                                                       Survey_Asset_Location__r.Product__r.Name, Survey_Asset_Location__r.Product__r.French_Product_Name__c, Survey_Asset_Location__r.Related_Product__c, Survey_Asset_Location__r.Related_Product__r.Name, 
                                                                       Order__r.Season_Start_Date__c, Order_Product__r.PricebookEntry.Name, Order_Product__r.PricebookEntry.Product2Id
                                                                       FROM Order_Item_Location__c WHERE Order__c=:orderId AND Order_Product__c IN:orderItemIds];
                
                for(Order_Item_Location__c oil : listOrderItemLocations)
                {
                    if(oil.Survey_Asset_Location__c != null) {
                        Survey_Asset_Location__c sal = oil.Survey_Asset_Location__r;
                        sal.Originating_Parent_ID__c = oil.Order_Product__r.OrderId;
                        sal.Originating_Record_ID__c = oil.Order_Product__c;
                        listSAL.add(sal);
                        associatedSurveyRecords.add(oil.Survey_Asset_Location__c);
                    } 
                    associatedOrderLocationIds.add(oil.Id);
                }
                mapSAL.put(true, listSAL);
                
                List<Order_Item_Location__c> emergencyOrderLocations = [SELECT Order_Product__c, Order__r.Emergency__c, Survey_Asset_Location__c, Order__r.Site_Survey__c, 
                                                                        Order_Product__r.Active__c FROM Order_Item_Location__c WHERE ID NOT IN :associatedOrderLocationIds 
                                                                        AND Order__r.Site_Survey__c=:siteSurveyId AND Order__r.Emergency__c=TRUE /*AND Order_Product__r.Active__c=TRUE*/];
                for(Order_Item_Location__c ol : emergencyOrderLocations) {
                    if(ol.Survey_Asset_Location__c != null) {
                        associatedSurveyRecords.add(ol.Survey_Asset_Location__c);
                    }
                }
                
                List<Survey_Asset_Location__c> listOtherAssets = [SELECT Id, Site_Survey__c, Survey_Location__c, Originating_Parent_ID__c, Originating_Record_ID__c,Product__c,
                           										  Quantity__c, Product__r.Name, Product__r.French_Product_Name__c, Status__c, Related_Product__c, Related_Product__r.Name, Service_Frequency__c 
                                                                  FROM Survey_Asset_Location__c WHERE Id NOT IN:associatedSurveyRecords AND Status__c=:SAL_STATUS_ALLOCATED 
                                                                  AND Site_Survey__c=:siteSurveyId AND Service_Frequency__c!=:dataSets.Non_Recurring_Frequency_Value__c];
                
                if(!listOtherAssets.isEmpty()) {
                    System.debug(listOtherAssets);
                    mapSAL.put(false, listOtherAssets);
                }
            } 

            Map<String, SurveyProduct> mapUnallocatedProducts = new Map<String, SurveyProduct>();
            Map<String, SurveyProduct> mapAllocatedProducts = new Map<String, SurveyProduct>();
            
            for(Boolean value : mapSAL.keySet()){
                for(Survey_Asset_Location__c sal : mapSAL.get(value))
                {
                    if(sal.Status__c == SAL_STATUS_UNALLOCATED) {
                        String key = sal.Product__c;
                        if(sal.Related_Product__c != null) {
                            key = sal.Product__c + '|' + sal.Related_Product__c;
                        }
                        if(sal.Service_Frequency__c != null) {
                            key = key + sal.Service_Frequency__c;
                        }
                        SurveyProduct existingUnAllocatedRecord = mapUnallocatedProducts.get(key);
                        if(existingUnAllocatedRecord!=null)
                        {
                            existingUnAllocatedRecord.Quantity +=1;
                            existingUnAllocatedRecord.surveyAssetIds.add(sal.Id);
                        } else {
                            SurveyProduct sp = createSurveyProduct(value, sal);
                            sp.surveyAssetIds.add(sal.Id);
                            sp.sourceParentId = sal.Originating_Parent_ID__c;
                            sp.sourceRecordId = sal.Originating_Record_ID__c;
                            mapUnallocatedProducts.put(key, sp);
                        } 
                    } else {
                        String key = sal.Survey_Location__c + '|' + sal.Product__c;
                        //String key = sal.Survey_Location__c + '|' + sal.Product__c + '|' + value;
                        if(!locationIds.contains(sal.Survey_Location__c)) {
                            locationIds.add(sal.Survey_Location__c);
                            SurveyLocationCounter newCounter = new SurveyLocationCounter(String.valueOf(sal.Survey_Location__c), false);
                            locationCounter.add(newCounter);
                        }
                        if(sal.Related_Product__c != null) {
                            key = sal.Survey_Location__c + '|' + sal.Product__c + '|' + sal.Related_Product__c;
                        }
                        if(sal.Service_Frequency__c != null) {
                            key = key + sal.Service_Frequency__c;
                        }
                        SurveyProduct existingAllocatedRecord = mapAllocatedProducts.get(key);
                        if(existingAllocatedRecord!=null)
                        {
                            existingAllocatedRecord.Quantity +=1; 
                            existingAllocatedRecord.surveyAssetIds.add(sal.Id);
                            if(value) {
                                existingAllocatedRecord.isParent = value;
                                existingAllocatedRecord.quantityWithRecord +=1;
                            } 
                        } else {
                            SurveyProduct sp = createSurveyProduct(value, sal);
                            sp.surveyAssetIds.add(sal.Id);
                            sp.locationId = sal.Survey_Location__c;
                            mapAllocatedProducts.put(key, sp);
                        }
                    }
                }
            }
            
            List<Survey_Location__c> listLocations = [SELECT Id, Name, Building__c, Location__c, Location_Type__c, toLabel(Location_Type__c) labelLocationType, Floor__c, Unit_Number__c, Location_SubType__c, toLabel(Location_SubType__c) labelLocationSubType, Site_Survey__c, Notes__c,
                                           			  Installation_Notes__c, Service_Notes__c, Quantity_of_Allocated_Products__c, Service_Order__c, Number_of_Rooms__c, Language_Code__c 
                                                      FROM Survey_Location__c WHERE Site_Survey__c=:siteSurveyId ORDER BY Name LIMIT : (Integer.valueOf(dataSets.LocationsPerPage__c) + 1)];
            
            for(Survey_Location__c room : [SELECT Id, (SELECT Id FROM Survey_Assets_Locations__r LIMIT 1) 
                                           FROM Survey_Location__c WHERE Site_Survey__c=:siteSurveyId ORDER BY Name]) 
            {                         
                Boolean isDelete;
                if(room.Survey_Assets_Locations__r.isEmpty()) {
                    isDelete = true;
                } else {
                    isDelete = false;
                }
                SurveyLocationCounter newCounter = new SurveyLocationCounter(String.valueOf(room.Id), isDelete);
                locationCounter.add(newCounter);
            }
            
            //21530 - dynamically setting fields allowable for sorting [dk]
            Map<String, Site_Survey_Sorting_Setting__mdt> fieldsToSort = new Map<String, Site_Survey_Sorting_Setting__mdt>([SELECT API_Name__c, MasterLabel FROM Site_Survey_Sorting_Setting__mdt ORDER BY MasterLabel]);
            
            ViewData viewData = new ViewData();
            viewData.unAllocatedAssets = mapUnallocatedProducts.values();
            viewData.allocatedAssets = mapAllocatedProducts.values();
            viewData.surveyLocations = listLocations;
            viewData.siteSurveyId = siteSurveyId;
            viewData.isOrderSeasonal = false;
            viewData.locationCounter = locationCounter;
            viewData.sortFields = new List<Site_Survey_Sorting_Setting__mdt>(fieldsToSort.values());
            viewData.languageCode = languageCode;
            return viewData;
        }catch(Exception e) {
            System.debug(e.getLineNumber() + ' -- ' + e.getMessage());
            return null;
        }
    }
    
    @AuraEnabled
    public static List<Survey_Location__c> reQuerySurveyLocations(String siteSurveyId, Integer offsetAmount, String searchString, String filterVal, Boolean ascSort){
          System.debug('SEARCHSTRING: ' + searchString);
          String soql = 'SELECT Id, Name, Building__c, Location__c, Location_Type__c, toLabel(Location_Type__c) labelLocationType, Floor__c, Unit_Number__c, Location_SubType__c, toLabel(Location_SubType__c) labelLocationSubType, Site_Survey__c, Notes__c, Installation_Notes__c, Service_Notes__c, Quantity_of_Allocated_Products__c, Service_Order__c, Number_of_Rooms__c, Language_Code__c FROM Survey_Location__c WHERE Site_Survey__c = \'' + siteSurveyId +'\'';
          Integer limitVal = Integer.valueOf(dataSets.LocationsPerPage__c) + 1;
          Integer offsetVal = Integer.valueOf(offsetAmount);
          String sortDirection;
        if (filterVal == 'Floor__c'){
            filterVal = 'Floor_Code_Value__c';
        }
            if (ascSort){
                sortDirection = 'ASC';
            }
            else {
                sortDirection = 'DESC';
            }
        	if(String.isNotBlank(searchString)) {            
            	soql += ' AND (Name LIKE \'%' + searchString + '%\' OR ' + 
                'Building__c LIKE \'%' + searchString + '%\' OR ' + 
                'Floor__c LIKE \'%' + searchString + '%\' OR ' + 
                'Location_Type__c LIKE \'%' + searchString + '%\' OR ' +
                'Location_SubType__c LIKE \'%' + searchString + '%\')';
        	}
        soql +=' ORDER BY ' + filterVal + ' ' + sortDirection + ' LIMIT ' + limitVal + ' OFFSET ' + offsetVal; 
        return Database.query(soql);
                   /* return [SELECT Id, Name, Building__c, Location__c, Location_Type__c, Floor__c, Unit_Number__c, Location_SubType__c, Site_Survey__c, Notes__c,
                                           			  Installation_Notes__c, Service_Notes__c, Quantity_of_Allocated_Products__c, Service_Order__c
                                                      FROM Survey_Location__c WHERE Site_Survey__c=:siteSurveyId ORDER BY Name LIMIT :Integer.valueOf(dataSets.LocationsPerPage__c) + 1 OFFSET : Integer.valueOf(offsetAmount)];*/
    }

    @AuraEnabled
    public static List<picklistWrapper> getRoomSubTypes()
    {

        List<picklistWrapper> returnValue = new List<picklistWrapper>();

        //fetch the French Translations 
        List <Picklist_Translation__mdt> picklistTranslations = [SELECT Picklist_Value__c, Translation__c 
                                                                FROM Picklist_Translation__mdt 
                                                                WHERE Object_Name__c = 'Survey_Location__c' AND Field_Name__c ='Location_Type__c'
                                                                AND Language_Code__c = 'fr'];
        Map <String, String> picklistTranslationsMap = new Map <String, String>();
        for (Picklist_Translation__mdt plt : picklistTranslations) {
            picklistTranslationsMap.put(plt.Picklist_Value__c, plt.Translation__c);
        } 

        for(Schema.PicklistEntry v : Schema.Survey_Location__c.Location_Type__c.getDescribe().getPicklistValues()){
            picklistWrapper plw = new picklistWrapper();
            plw.pickListLabel = v.getLabel();
            plw.pickListValue = v.getValue();
            plw.pickListTranslation = picklistTranslationsMap.get(plw.pickListValue);
            returnValue.add(plw);
        }

        return returnValue; 
    }
    @AuraEnabled
    public static List<picklistWrapper> getLocationSubTypes()
    {
        list<picklistWrapper> returnValue = new list<picklistWrapper>();

        //fetch the French Translations 
        List <Picklist_Translation__mdt> picklistTranslations = [SELECT Picklist_Value__c, Translation__c 
                                                                FROM Picklist_Translation__mdt 
                                                                WHERE Object_Name__c = 'Survey_Location__c' AND Field_Name__c ='Location_SubType__c'
                                                                AND Language_Code__c = 'fr'];
        Map <String, String> picklistTranslationsMap = new Map <String, String>();
        for (Picklist_Translation__mdt plt : picklistTranslations) {
            picklistTranslationsMap.put(plt.Picklist_Value__c, plt.Translation__c);
        }

        for(Schema.PicklistEntry v : Schema.Survey_Location__c.Location_SubType__c.getDescribe().getPicklistValues()){
            picklistWrapper plw = new picklistWrapper();
            plw.pickListLabel = v.getLabel();
            plw.pickListValue = v.getValue();
            plw.pickListTranslation = picklistTranslationsMap.get(plw.pickListValue);
            returnValue.add(plw);
        }

        return returnValue; 
    }
    @AuraEnabled
    public static List<String> getNumberOfRooms() {
        List<String> t = new List<String>();
        
        for(Schema.PicklistEntry v : Schema.Survey_Location__c.Number_of_Rooms__c.getDescribe().getPicklistValues()){
            t.add(v.getValue());
        }
        
        return t; 
    }
    
    @AuraEnabled
    public static Boolean saveAllocations(String selectedProductJSON, String surveyLocationJSON, 
                                          Decimal allocatedQty, String parentRecordId, Boolean existingAsset)
    {
        System.debug('surveyProduct: ' + selectedProductJSON);
        System.debug('surveyLocation: ' + surveyLocationJSON);
        System.debug('allocatedQty: ' + allocatedQty); 
        System.debug('parentRecordId:' + parentRecordId);
        System.debug('existingAsset:' + existingAsset);
        
        List<Survey_Asset_Location__c> salToUpdate = new List<Survey_Asset_Location__c>();
        
        try
        {
            SurveyAssetAllocationController.SurveyProduct surveyProduct = (SurveyAssetAllocationController.SurveyProduct)JSON.deserialize(selectedProductJSON, SurveyAssetAllocationController.SurveyProduct.class);
            Survey_Location__c surveyLocation = (Survey_Location__c)JSON.deserialize(surveyLocationJSON, Survey_Location__c.class);
            System.debug(surveyProduct);
            
            Boolean hasRelated = false; 
            Boolean hasFrequency = false; 
            if(surveyProduct.relatedProdId != null) {
                hasRelated = true; 
            }
            if(surveyProduct.serviceFrequency != null) {
                hasFrequency = true; 
            }
            Integer quantity = Integer.valueOf(allocatedQty);
            
            String queryParamString;
            String queryLimitString = '';
            
            if(parentRecordId.left(3) == Opportunity.sobjecttype.getDescribe().getKeyPrefix()) {
                
                System.debug(' related -- ' + hasRelated + ' --frequency -- ' + hasFrequency);
                
                List<String> queryParams = new List<String>();
                queryParams.add('Id, Site_Survey__c, Survey_Location__c, Status__c, Originating_Parent_ID__c, Product__c, Service_Frequency__c');
                queryParams.add('Survey_Asset_Location__c');
                
                queryParamString = ' Status__c = \'' + SAL_STATUS_UNALLOCATED + '\'' + ' AND Product__c = \'' + surveyProduct.productId + '\'' + ' AND Originating_Parent_ID__c = \'' + surveyProduct.sourceParentId + '\'';
                
                if(hasRelated) {
                    queryParamString = queryParamString +  ' AND Related_Product__c= \'' + surveyProduct.relatedProdId + '\'' ;
                } else {
                    queryParamString = queryParamString + ' AND Related_Product__c = NULL';
                }
                
                if(hasFrequency) {
                    queryParamString = queryParamString +  ' AND Service_Frequency__c= \'' + surveyProduct.serviceFrequency + '\'' ;
                } else {
                    queryParamString = queryParamString + ' AND Service_Frequency__c = NULL';
                }
                
                if(quantity!=null) {
                    queryLimitString = ' LIMIT :quantity';
                }
                queryParams.add(queryParamString); 
                queryParams.add(queryLimitString); 
                
                System.debug(' --Formatted Query-- ' + String.format('SELECT {0} FROM {1} WHERE {2} {3}', queryParams));
                List<Survey_Asset_Location__c> listUnAllocatedSAL = Database.query(String.format('SELECT {0} FROM {1} WHERE {2} {3}', queryParams));
                
                System.debug(listUnAllocatedSAL);
                for(Survey_Asset_Location__c sal : listUnAllocatedSAL)
                {
                    /*if(allocatedQty > 0)
                    {*/
                        sal.Survey_Location__c = surveyLocation.Id;  
                        sal.Notes__c = surveyProduct.Notes;
                        salToUpdate.add(sal);
                        
                        /*allocatedQty = allocatedQty - 1;
                    } else {
                        break;
                    }*/
                    
                    //Begin:Shashi:11-26-2019:Prevent wrong Site Survey assignment
                    if(sal.Site_Survey__c!=surveyLocation.Site_Survey__c){
                        sal.Site_Survey__c = surveyLocation.Site_Survey__c;
                    }
                    //End
                }
                System.debug('saltoUpdate: ' + salToUpdate);
                if(!salToUpdate.isEmpty())
                    update salToUpdate;
                
            } else { 
                Id orderId; 
                
                Order o = [SELECT Id, AccountId, Site_Survey__c, Parent_Order__c FROM Order WHERE Id=:parentRecordId];
                
                orderId = o.Parent_Order__c == null ? o.Id : o.Parent_Order__c; 
                
                System.debug(hasRelated + ' ' + surveyProduct.relatedProdId);
                
                List<String> queryParams = new List<String>();
                queryParams.add('Id, Survey_Asset_Location__c, Order__c, Order_product__c, Order_product__r.Active__c, Survey_Asset_Location__r.Survey_Location__c, Survey_Asset_Location__r.Site_Survey__c, Survey_Asset_Location__r.Product__c, Survey_Asset_Location__r.Related_Product__c, Survey_Asset_Location__r.Status__c, Survey_Asset_Location__r.Service_Frequency__c');
                queryParams.add('Order_Item_Location__c');
                
                queryParamString = ' Survey_Asset_Location__r.Status__c = \'' + SAL_STATUS_UNALLOCATED + '\'' + ' AND Survey_Asset_Location__r.Product__c = \'' + surveyProduct.productId + '\'' + ' AND Order__c = \'' + orderId + '\''; 
                    
                if(hasRelated) {
                    queryParamString = queryParamString + ' AND Survey_Asset_Location__r.Related_Product__c = \'' + surveyProduct.relatedProdId + '\''; 
                } else {
                    queryParamString = queryParamString + ' AND Survey_Asset_Location__r.Related_Product__c = NULL';   
                }
                
                if(hasFrequency) {
                    queryParamString = queryParamString +  ' AND Survey_Asset_Location__r.Service_Frequency__c= \'' + surveyProduct.serviceFrequency + '\'' ;
                } else {
                    queryParamString = queryParamString + ' AND Survey_Asset_Location__r.Service_Frequency__c = NULL';
                }
                queryParamString = queryParamString + ' AND Order_product__r.Active__c = TRUE';
                
                if(quantity!=null) {
                    queryLimitString = ' LIMIT :quantity';
                }
                queryParams.add(queryParamString); 
                queryParams.add(queryLimitString);
                
                System.debug(' --Formatted Query-- ' + String.format('SELECT {0} FROM {1} WHERE {2} {3}', queryParams));
                
                List<Order_Item_Location__c> listOrderItemLocations = Database.query(String.format('SELECT {0} FROM {1} WHERE {2} {3}', queryParams));
                
                for(Order_Item_Location__c oil : listOrderItemLocations)
                {
                    Survey_Asset_Location__c sal = oil.Survey_Asset_Location__r;
                    sal.Survey_Location__c = surveyLocation.Id;  
                    sal.Notes__c = surveyProduct.Notes;
                    salToUpdate.add(sal);
                    
                }
                System.debug('saltoUpdate: ' + salToUpdate.size());
                if(!salToUpdate.isEmpty())
                    update salToUpdate;                    
            }
            
        } catch(Exception ex){
            throw ex;
        }   
        return true;
    }
    
    @AuraEnabled
    public static Boolean deleteSurveyLocation(String surveyLocationId)
    {        
        try {        
            delete [SELECT Id FROM Survey_Location__c where Id = :surveyLocationId];
            
        } catch(Exception ex)
        {     
            throw ex;
            return false;
        }
        return true;
    }
    
    @AuraEnabled
    public static Map<String,Decimal> cloneAssetAllocations(Survey_Location__c record, String recordId, Decimal min, Decimal max, Decimal startUnit, Decimal numUnits, Boolean cloneCurrentAllocations, Boolean hasWarnings) {
        System.debug('Clone Apex'); 
        System.debug(min); 
        System.debug(max);
        System.debug(recordId);
        System.debug('BOOLEAN: ' + cloneCurrentAllocations);
        System.debug('MIN: ' + min + 'MAX: ' + max + 'START UNIT: ' + startUnit);
        Savepoint sp = Database.setSavepoint();
        
        try {
            Map<String, Decimal> assetMap = new Map<String, Decimal>();
            Map<String, Decimal> unAllocatedAssetMap = new Map<String, Decimal>();
            Map<String, List<Survey_Asset_Location__c>> unAllocatedRecords = new Map<String, List<Survey_Asset_Location__c>>();
            Set<Id> productIds = new Set<Id>();
            Map<String,Decimal> validationResult = new Map<String,Decimal>();
            Boolean unitClone = (startUnit == null) ? false : true;
            Decimal totalFloors = (max == min) ? 1 : (max-min) + 1;
            Decimal totalLocations = (numUnits != null) ? totalFloors*numUnits : totalFloors;
            Map<String, String> validationProductIdToName = new Map<String, String>();
            if (cloneCurrentAllocations){
                if(recordId.left(3) == Opportunity.sobjecttype.getDescribe().getKeyPrefix()) {
                    List<Survey_Asset_Location__c> allocatedAssets = [SELECT Id, Survey_Location__c, Site_Survey__c, Product__c, Product__r.Name,  Product__r.French_Product_Name__c, Related_Product__c, Quantity__c, Originating_Parent_ID__c
                                                                      FROM Survey_Asset_Location__c WHERE Survey_Location__c=:record.Id AND Originating_Parent_ID__c=:recordId];
                    System.debug('CURRENTLY ALLOCATED ITEMS: ' + allocatedAssets);
                    if(allocatedAssets.isEmpty()) {
                        
                    } else {
                        for(Survey_Asset_Location__c sa : allocatedAssets){
                            productIds.add(sa.Product__c);
                            String key = sa.Product__c;
                            if(sa.Related_Product__c != null) {
                                key = sa.Product__c + '.' + sa.Related_Product__c;
                            }
                            if(assetMap.containsKey(key)) {
                                Decimal value;
                                if (!unitClone){
                                    value = assetMap.get(key) + totalFloors;
                                }
                                else{
                                    value = assetMap.get(key) + totalLocations;
                                }
                                assetMap.put(key, value);
                                System.debug('Key ' + key + ' value ' + value);
                            } else {
                                if (!unitClone){
                                    assetMap.put(key, totalFloors); 
                                }
                                else{
                                    assetMap.put(key, totalLocations);  
                                }
                            }
                            validationProductIdToName.put(key, sa.Product__r.Name);
                        }
                        System.debug(assetMap);
                        List<Survey_Asset_Location__c> unAllocatedAssets = [SELECT Id, Survey_Location__c, Site_Survey__c, Product__c, Related_Product__c, Status__c, Originating_Parent_ID__c
                                                                            FROM Survey_Asset_Location__c WHERE Site_Survey__c=:record.Site_Survey__c AND Status__c=:SAL_STATUS_UNALLOCATED 
                                                                            AND Product__c IN:productIds AND Originating_Parent_ID__c=:recordId];
                        
                        if(!unAllocatedAssets.isEmpty()) {
                            for(Survey_Asset_Location__c sa : unAllocatedAssets){
                                String key = sa.Product__c;
                                if(sa.Related_Product__c != null) {
                                    key = sa.Product__c + '.' + sa.Related_Product__c;
                                }
								
                                if(unAllocatedAssetMap.containsKey(key)) {
                                    Decimal value = unAllocatedAssetMap.get(key) + 1;
                                    unAllocatedAssetMap.put(key, value);
                                    unAllocatedRecords.get(key).add(sa);
                                } else {
                                    unAllocatedAssetMap.put(key, 1);
                                    unAllocatedRecords.put(key, new List<Survey_Asset_Location__c>{sa});
                                }
                                
                            }
                            validationResult = validateClone(assetMap, unAllocatedAssetMap, validationProductIdToName);
                        } else {
                            for (String key : assetMap.keySet()){
                                validationResult.put(validationProductIdToName.get(key), assetMap.get(key));
                            }
                        }
                        
                        system.debug('unAllocatedRecords: ' + unAllocatedRecords);
                        system.debug('unAllocatedAssetMap: ' + unAllocatedAssetMap);
                        system.debug('assetMap: ' + assetMap);
                        system.debug('unAllocatedRecords: ' + unAllocatedRecords);
                        system.debug('validation result is ' + validationResult );
                    }
                } else if(recordId.left(3) == Order.sobjecttype.getDescribe().getKeyPrefix()) {
                    Set<Id> survetAssetIds = new Set<Id>();
                    
                    Map<Id, Survey_Asset_Location__c> surveyAssetMap = new Map<Id, Survey_Asset_Location__c>([SELECT Id, Survey_Location__c, Site_Survey__c, Product__c, Product__r.Name,  Product__r.French_Product_Name__c, Related_Product__c, Quantity__c, 
                                                                                                              Originating_Parent_ID__c FROM Survey_Asset_Location__c WHERE Survey_Location__c=:record.Id]);
                    Map<Id, Survey_Asset_Location__c> validSurveyAssets = new Map<Id, Survey_Asset_Location__c>();
                    
                    for(Order_Item_Location__c oil : [SELECT Id, Order__c, Order_Product__c, Order_Product__r.Active__c, Survey_Asset_Location__c FROM Order_Item_Location__c
                                                      WHERE Survey_Asset_Location__c IN :surveyAssetMap.keySet() AND Order_Product__r.Active__c=TRUE AND Order__c=:recordId])
                    {
                        validSurveyAssets.put(oil.Survey_Asset_Location__c, surveyAssetMap.get(oil.Survey_Asset_Location__c));
                    }
                    
                    if(validSurveyAssets.isEmpty()) {
                        
                    } else {
                        for(Survey_Asset_Location__c sa : validSurveyAssets.values()){
                            productIds.add(sa.Product__c);
                            String key = sa.Product__c;
                            if(sa.Related_Product__c != null) {
                                key = sa.Product__c + '.' + sa.Related_Product__c;
                            }
                            if(assetMap.containsKey(key)) {
                                Decimal value;
                                if (!unitClone){
                                    value = assetMap.get(key) + totalFloors;
                                }
                                else {
                                    value = assetMap.get(key) + totalLocations;
                                }
                                assetMap.put(key, value);
                                System.debug('Key ' + key + ' value ' + value);
                            } else {
                                if (!unitClone){
                                    assetMap.put(key, totalFloors); 
                                }
                                else {
                                    assetMap.put(key, totalLocations); 
                                }
                            }
                            validationProductIdToName.put(key, sa.Product__r.Name);
                        }
                        System.debug(assetMap);
                        
                        Map<Id, Survey_Asset_Location__c> unallocatedSurveyAssetMap = new Map<Id, Survey_Asset_Location__c>([SELECT Id, Survey_Location__c, Site_Survey__c, Product__c, Related_Product__c, Status__c, Originating_Parent_ID__c
                                                                                                                             FROM Survey_Asset_Location__c WHERE Site_Survey__c=:record.Site_Survey__c AND Status__c=:SAL_STATUS_UNALLOCATED 
                                                                                                                             AND Product__c IN:productIds]);
                        
                        Map<Id, Survey_Asset_Location__c> unallocatedValidSurveyAssets = new Map<Id, Survey_Asset_Location__c>();
                        
                        for(Order_Item_Location__c oil : [SELECT Id, Order__c, Order_Product__c, Order_Product__r.Active__c, Survey_Asset_Location__c FROM Order_Item_Location__c
                                                          WHERE Survey_Asset_Location__c IN :unallocatedSurveyAssetMap.keySet() AND Order_Product__r.Active__c=TRUE AND Order__c=:recordId])
                        {
                            unallocatedValidSurveyAssets.put(oil.Survey_Asset_Location__c, unallocatedSurveyAssetMap.get(oil.Survey_Asset_Location__c));
                        }
                        
                        if(!unallocatedValidSurveyAssets.isEmpty()) {
                            for(Survey_Asset_Location__c sa : unallocatedValidSurveyAssets.values()){
                                String key = sa.Product__c;
                                if(sa.Related_Product__c != null) {
                                    key = sa.Product__c + '.' + sa.Related_Product__c;
                                }
                                if(unAllocatedAssetMap.containsKey(key)) {
                                    Decimal value = unAllocatedAssetMap.get(key) + 1;
                                    unAllocatedAssetMap.put(key, value);
                                    unAllocatedRecords.get(key).add(sa);
                                } else {
                                    unAllocatedAssetMap.put(key, 1);
                                    unAllocatedRecords.put(key, new List<Survey_Asset_Location__c>{sa});
                                }
                            }
                            validationResult = validateClone(assetMap, unAllocatedAssetMap, validationProductIdToName);
                        } else {
                            for (String key : assetMap.keySet()){
                                validationResult.put(validationProductIdToName.get(key), assetMap.get(key));
                            }
                        }
                        
                        system.debug('unAllocatedRecords: ' + unAllocatedRecords);
                        system.debug('unAllocatedAssetMap: ' + unAllocatedAssetMap);
                        system.debug('assetMap: ' + assetMap);
                        system.debug('unAllocatedRecords: ' + unAllocatedRecords);
                        system.debug('validation result is ' + validationResult );
                    }
                    
                }
            }
            
            if(validationResult.isEmpty() || !cloneCurrentAllocations || hasWarnings){
                List<Survey_Location__c> clonedRooms = new List<Survey_Location__c>();
                Map<Integer, SurveyLocationWrapper> clonedRoomsWrapperMap = new Map<Integer, SurveyLocationWrapper>();
                List<SurveyLocationWrapper> clonedRoomsWrapper = new List<SurveyLocationWrapper>();
                system.debug('value of min' + min);
                
                Integer low = Integer.valueOf(min);
                Integer high = Integer.valueOf(max);
                Integer lowUnit = (unitClone) ? Integer.valueOf(startUnit) : 0;
                Integer highUnit = (unitClone) ? (lowUnit + Integer.valueOf(numUnits)) : 0;
                for(Integer i=low; i<=high; i++) {
                    String floor =  String.valueOf(i);
                    String startOfUnitNumber = floor.left(2);
                    String locationName = '';
                    
                    if (unitClone){
                        for (Integer j=lowUnit; j<highUnit; j++){
                            String endUnitNumber = String.valueOf(j).right(2);
                            if(String.isNotBlank(endUnitNumber) && endUnitNumber.length() < 2) {
                                endUnitNumber =  '0'+endUnitNumber;
                            }
                            Survey_Location__c newLocation = record.clone(false,true,false,false);
                            SurveyLocationWrapper newRecord = new SurveyLocationWrapper(record);
                            newLocation.Floor__c = floor;
                            
                            System.debug('NEW LOCATION FLOOR: ' + newLocation.Floor__c);
                            
                            newLocation.Unit_Number__c = unitClone ? startOfUnitNumber + endUnitNumber : '';                            
                        	newLocation.Name = buildLocationName(newLocation);
                                                        
                            clonedRooms.add(newLocation); 
                            clonedRoomsWrapper.add(newRecord);
                            clonedRoomsWrapperMap.put(i, newRecord);
                        }
                    } else {
                        Survey_Location__c newLocation = record.clone(false,true,false,false);
                        SurveyLocationWrapper newRecord = new SurveyLocationWrapper(record);
                        newLocation.Floor__c = String.valueOf(i);

                        System.debug('NEW LOCATION FLOOR: ' + newLocation.Floor__c);
                        
                        newLocation.Name = buildLocationName(newLocation);
                        
                        clonedRooms.add(newLocation); 
                        clonedRoomsWrapper.add(newRecord);
                        clonedRoomsWrapperMap.put(i, newRecord);  
                    }
                }
                List<String> newLocationNames = new List<String>();
                for (Survey_Location__c loc : clonedRooms){
                    newLocationNames.add(loc.Name);
                }
                if (!(startUnit == null || numUnits == null)){
                    List<Survey_Location__c> sameNameLocations = [SELECT Id, Name, Site_Survey__c FROM Survey_Location__c WHERE Site_Survey__c=:record.Site_Survey__c AND Name IN : newLocationNames];
                    if (!sameNameLocations.isEmpty()){
                        Set<Integer> roomLocations = new Set<Integer>();
                        for (Survey_Location__c loc : clonedRooms){                     
                            for (Survey_Location__c existingLoc : sameNameLocations){
                                if (loc.Name == existingLoc.Name){
                                   roomLocations.add(clonedRooms.IndexOf(loc));
                                }
                            }
                        }
                        for (Integer i : roomLocations){
                            clonedRooms.remove(i);
                        }
                    }
                }
                
                system.debug('cloned rooms size is ' +  clonedRooms.size());
                if(!clonedRooms.isEmpty()) {
                    insert clonedRooms;   
                    if (cloneCurrentAllocations){
                        List<Survey_Asset_Location__c> updateAssets = new List<Survey_Asset_Location__c>();
                        
                        for(Survey_Location__c room : clonedRooms) {
                            for(String key : assetMap.keySet()){
                                List<Survey_Asset_Location__c> currSAs =  unAllocatedRecords.get(key);
                                
                                Integer totalSA  = Integer.valueOf(assetMap.get(key));
                                Integer saPerRoom;
                                if (!unitClone){
                                    saPerRoom = Integer.valueOf(totalSA/totalFloors);
                                } else{
                                    saPerRoom = Integer.valueOf(totalSA/totalLocations);
                                }
                                
                                if(currSAs!=null){                               
                                    for(Integer i = 0 ; i < saPerRoom ; i ++) {
                                        if (!currSAs.isEmpty()){
                                            Survey_Asset_Location__c sa = currSAs.get(0);
                                            sa.Survey_Location__c = room.id;  
                                            updateAssets.add(sa);
                                            currSAs.remove(0); 
                                        }
                                    }
                                }
                            }
                        }
                        if(!updateAssets.isEmpty()) {
                            update updateAssets;
                        }
                    }
                }
            }
         	return validationResult;
        } catch(Exception e) {
            Database.rollback(sp);
            System.debug(e.getLineNumber() + ' -- ' + e.getMessage());
            return new Map<String, Integer>();
        }
    }

    public static String getPicklistLabelTranslation(String fieldName, String picklistValue, String languageCode) {
        
        if (String.isBlank(picklistValue)) {
            return picklistValue;
        }

        Picklist_Translation__mdt[] plt = [SELECT Translation__c FROM Picklist_Translation__mdt 
                                            WHERE Object_Name__c = 'Survey_Location__c' AND Field_Name__c =: fieldName
                                            AND Picklist_Value__c =: picklistValue 
                                            AND Language_Code__c =: languageCode];
        if (plt.size() > 0) {
            return plt[0].Translation__c;
        }
        else {
            return picklistValue; //return the untranslated value
        }

    }

    /**
     * Used to build the location name - added for 21530 on Sept 13, 2018 [dk]
     * Public method becuase its used in multiple places - [MD]
     * Called from SetSurveyLocationFields.trigger - AddSurveyRoom has similar logic 
     */ 
    public static String buildLocationName(Survey_Location__c newLocation) {
        String locationName = '';
        String locationType = newLocation.Location_Type__c;
        String locationSubType = newLocation.Location_SubType__c;

        if (newLocation.Language_Code__c == 'fr') {
            locationType = getPicklistLabelTranslation('Location_Type__c', newLocation.Location_Type__c, newLocation.Language_Code__c);
            locationSubType = getPicklistLabelTranslation('Location_SubType__c', newLocation.Location_SubType__c, newLocation.Language_Code__c);
        }

        if(String.isNotBlank(newLocation.Building__c)) {
            System.debug('hit building');
            locationName += newLocation.Building__c;
            locationName += String.isNotBlank(newLocation.Floor__c) || String.isNotBlank(newLocation.Unit_Number__c) || 
                String.isNotBlank(newLocation.Location_Type__c) || String.isNotBlank(newLocation.Location_SubType__c) ? ', ' : locationName;
        }
        if(String.isNotBlank(newLocation.Floor__c)) {
            System.debug('hit floor');
            locationName += (newLocation.Language_Code__c == 'fr' ? Label.Site_Survey_Floor_FR : Label.Site_Survey_Floor_EN) + ': ' + newLocation.Floor__c;
            locationName += String.isNotBlank(newLocation.Unit_Number__c) || String.isNotBlank(newLocation.Location_Type__c) || 
                String.isNotBlank(newLocation.Location_SubType__c) ? ', ' : locationName;
        }
        if(String.isNotBlank(newLocation.Unit_Number__c)) {
            System.debug('hit unit number');
            locationName += (newLocation.Language_Code__c == 'fr' ? Label.Unit_FR : Label.Unit_EN) + ': ' + newLocation.Unit_Number__c;
            locationName += String.isNotBlank(newLocation.Location_Type__c) || String.isNotBlank(newLocation.Location_SubType__c) ? ', ' : locationName;
        }
        if(String.isNotBlank(newLocation.Location_SubType__c)) {
            System.debug('hit subtype');
            locationName += locationSubType;
            locationName += String.isNotBlank(newLocation.Location_Type__c) ? ' ' : locationName;
        }
        if(String.isNotBlank(newLocation.Location_Type__c)) {
            locationName += LocationType;
        }
        return locationName;
    }
    
    public static Map<String,Decimal> validateClone(Map<String, Decimal> assetMap, Map<String, Decimal> unAllocatedAssetMap, Map<String, String> validationProductIdToName) {
        Decimal remainingValue;
        Map<String,Decimal> returnedVals = new Map<String,Decimal>();
        try {
            for(String key : assetMap.keySet()) {
                Decimal value = unallocatedAssetMap.get(key); 
                Boolean hasAssetsLeft = value == null ? false : value >= assetMap.get(key); 
                if(!hasAssetsLeft) {
                    if (value != null){
                        remainingValue = assetMap.get(key) - value;
                    	returnedVals.put(validationProductIdToName.get(key), remainingValue);
                    } else{
                        returnedVals.put(validationProductIdToName.get(key), assetMap.get(key));
                    }
                }
            }
            return returnedVals;
        } catch(Exception e) {
            System.debug(e.getLineNumber() + ' -- ' + e.getMessage());
            return returnedVals;
        }
    }    
    
    @AuraEnabled
    public static Boolean deleteSurveyAssetLocation(String productId, String locationId, String parentRecordId, String relatedProdId, String frequency, Decimal quantity)
    {         
        try {
            Boolean hasRelated = true;
            if(String.isEmpty(relatedProdId)) {
                System.debug('is empty');
                hasRelated = false;
            }
            System.debug(hasRelated);
            
            Boolean hasFrequency = false; 
            
            if(frequency != null) {
                hasFrequency = true; 
            }
            List<String> queryParams = new List<String>();
            String queryParamString;
            
            if(parentRecordId.left(3) == Opportunity.sobjecttype.getDescribe().getKeyPrefix()) 		//OPPTY                
            {   
                queryParams.add('Id, Site_Survey__c, Survey_Location__c, Product__c, Originating_Parent_ID__c, Related_Product__c');
                queryParams.add('Survey_Asset_Location__c');
                
                queryParamString = ' Survey_Location__c = \'' + locationId + '\'' + ' AND Product__c = \'' + productId + '\'' + ' AND Originating_Parent_ID__c = \'' + parentRecordId + '\'';
                
                if(hasRelated) {
                    queryParamString = queryParamString +  ' AND Related_Product__c= \'' + relatedProdId + '\'' ;
                } else {
                    queryParamString = queryParamString + ' AND Related_Product__c = NULL';
                }
                
                if(hasFrequency) {
                    queryParamString = queryParamString +  ' AND Service_Frequency__c= \'' + frequency + '\'' ;
                } else {
                    queryParamString = queryParamString + ' AND Service_Frequency__c = NULL';
                }
                queryParams.add(queryParamString); 
                
                System.debug(' --Formatted Query-- ' + String.format('SELECT {0} FROM {1} WHERE {2}', queryParams));
                
                List<Survey_Asset_Location__c> listSAL = Database.query(String.format('SELECT {0} FROM {1} WHERE {2}', queryParams));
                System.debug(listSAL);
                for(Survey_Asset_Location__c sal : listSAL)
                {
                    sal.Survey_Location__c = null;
                }
                if(!listSAL.isEmpty())
                {
                    update listSAL; 
                }
            } else if(parentRecordId.left(3) == Order.sobjecttype.getDescribe().getKeyPrefix()){
                
                Id orderId; 
                
                Order o = [SELECT Id, AccountId, Site_Survey__c, Parent_Order__c, Emergency__c FROM Order WHERE Id=:parentRecordId];
                
                orderId = o.Parent_Order__c == null ? o.Id : o.Parent_Order__c; 
                
                queryParams.add('Order_Product__c,Survey_Asset_Location__c,Survey_Asset_Location__r.Status__c, Survey_Asset_Location__r.Site_Survey__c, Survey_Asset_Location__r.Survey_Location__c, Survey_Asset_Location__r.Product__c');
                queryParams.add('Order_Item_Location__c');
                
               //queryParamString = ' Order__c = \'' + orderId + '\'' + ' AND Survey_Asset_Location__r.Survey_Location__c = \'' + locationId + '\'' + ' AND Survey_Asset_Location__r.Product__c = \'' + productId + '\''; 
                 queryParamString = ' Order__c = \'' + orderId + '\'' + ' AND Survey_Asset_Location__r.Survey_Location__c = \'' + locationId + '\'' + ' AND Survey_Asset_Location__r.Product__c = \'' + productId + '\'' + ' AND Order_Product__r.Active__c = True';

                    
                if(hasRelated) {
                    queryParamString = queryParamString + ' AND Survey_Asset_Location__r.Related_Product__c = \'' + relatedProdId + '\''; 
                } else {
                    queryParamString = queryParamString + ' AND Survey_Asset_Location__r.Related_Product__c = NULL';   
                }
                
                if(hasFrequency) {
                    queryParamString = queryParamString +  ' AND Survey_Asset_Location__r.Service_Frequency__c= \'' + frequency + '\'' ;
                } else {
                    queryParamString = queryParamString + ' AND Survey_Asset_Location__r.Service_Frequency__c = NULL';
                }
                
                queryParams.add(queryParamString); 
                System.debug(' --Formatted Query-- ' + String.format('SELECT {0} FROM {1} WHERE {2}', queryParams));
                
                List<Order_Item_Location__c> listOrderItemLocation = Database.query(String.format('SELECT {0} FROM {1} WHERE {2}', queryParams));
                
                System.debug(listOrderItemLocation.size());
                System.debug(listOrderItemLocation);
                
                List<Survey_Asset_Location__c> listSAL = New List<Survey_Asset_Location__c>();
                for(Order_Item_Location__c oil : listOrderItemLocation)
                {
                    Survey_Asset_Location__c sal = oil.Survey_Asset_Location__r;
                    sal.Survey_Location__c = null;
                    listSAL.add(sal);
                }
                if(!listSAL.isEmpty())
                {
                    update listSAL;
                }              
            }
        } catch(Exception ex)
        {   
            throw ex;
            return false;
        }
        return true;
    }
    
    @AuraEnabled
    public static Boolean autoAllocateAssets(String record, Decimal quantity, Id siteSurveId) {
        System.debug('Auto Allocate: ' + quantity);
        System.debug('Site Survey Id: ' + siteSurveId);
        System.debug('Survey Product: ' + record);
        
        try {
            SurveyProduct theProduct = (SurveyProduct)JSON.Deserialize(record, SurveyProduct.class);
            System.debug(theProduct);
            System.debug(theProduct.surveyAssetIds.size());
            
            if(theProduct!=null && quantity!=null) {
                List<Survey_Asset_Location__c> updateAssets = new List<Survey_Asset_Location__c>();
                
                List<Survey_Asset_Location__c> surveyAssets = [SELECT Id, Survey_Location__c FROM Survey_Asset_Location__c 
                                                               WHERE Id IN :theProduct.surveyAssetIds AND Site_Survey__c= :siteSurveId];  
                List<Survey_Location__c> locations = [SELECT Id FROM Survey_Location__c WHERE Site_Survey__c= :siteSurveId ORDER BY Service_Order__c NULLS LAST];
                
                if(!locations.isEmpty() && !surveyAssets.isEmpty()) {
                    Integer totalAssets = Integer.valueOf(locations.size() * quantity);//surveyAssets.size(); //
                    System.debug('Total Assets' + totalAssets);
                    
                    for(Integer i=0; i<totalAssets; i++) {
                        if(!locations.isEmpty() && !surveyAssets.isEmpty()) {
                            Survey_Location__c sl = locations.remove(0);
                            for(Integer j=0; j<quantity; j++) {
                                if(!surveyAssets.isEmpty()) {
                                    Survey_Asset_Location__c sal = surveyAssets.remove(0);
                                    sal.Survey_Location__c = sl.Id;
                                    updateAssets.add(sal);
                                }                            
                            }
                        }
                    }
                    System.debug(updateAssets);
                    update updateAssets;
                    return true;
                }
            }
            return false;
        } catch(Exception e) {
            System.debug('Exception at ' + e.getLineNumber() + ' Message: ' + e.getMessage());
            return false;
        }
        
    }
    
    @AuraEnabled
    public static String getJSONString(){
        
        try{
            Configuration__c l = [select Content__c from Configuration__c where ObjectName__c = 'Survey_Location__c' 
                                    AND ControllingFieldName__c='Location_Type__c' AND DependantFieldName__c ='Location_SubType__c'
                                    ORDER BY CreatedDate DESC LIMIT 1 ];
            return (l.Content__c );
        }catch(Exception e){
            return '';
        }
    }
    
    public static SurveyProduct createSurveyProduct(Boolean value, Survey_Asset_Location__c record) {

        SurveyProduct sp = new SurveyProduct();
        sp.name = record.Product__r.Name;
        sp.fname = record.Product__r.Name;
        //when the time comes to translate product descriptions 
        //sp.fname = record.Product__r.French_Product_Name__c;
        sp.relatedProdName = record.Related_Product__r.Name;
        sp.relatedProdId = record.Related_Product__c;
        sp.quantity = record.Quantity__c;
        sp.productId = record.Product__c; 
        sp.isParent = value;
        sp.serviceFrequency = record.Service_Frequency__c;
        if(value) {
            sp.quantityWithRecord = 1;
        }
        return sp; 
    }
    
}