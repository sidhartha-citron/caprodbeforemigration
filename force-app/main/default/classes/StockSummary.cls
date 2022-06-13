public with sharing class StockSummary  {
    
    public class ColumnRecord {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String name { get; set; }

        public ColumnRecord(String label, String name) {
            this.label = label;
            this.name = name;
        }
    }
    
    public class LineItem {
        @AuraEnabled
        public String ProductName;       
        @AuraEnabled
        public Decimal Quantity; 
        @AuraEnabled
        public String TypeOfService;
        @AuraEnabled
        public String RelatedProduct;
        @AuraEnabled
        public Boolean isVMIProduct;
        @AuraEnabled
        public Integer parLevel;
    }
    
    public class GroupedItem{
        @AuraEnabled
        public String address;
        @AuraEnabled
        public List<ItemMap> itemsMap;        
    }
    
    public class ItemMap{
        @AuraEnabled
        public String serviceType;
        @AuraEnabled
        public List<LineItem> itemsMap;
    }
    
    @AuraEnabled
    public static List<ColumnRecord> getColumns(List<String> columnAPINames) {
        List<ColumnRecord> columns = new List<ColumnRecord>();

        for (String s : columnAPINames) {
            List<String> ss = s.split('\\.');

            columns.add(new ColumnRecord(
                    Schema.getGlobalDescribe().get(ss[0]).getDescribe().fields.getMap().get(ss[1]).getDescribe().getLabel(),
                    ss[1])
            );
        }        
        return columns;
    }
    
    @AuraEnabled
    public static List<ColumnRecord> getVmiTableColumns(List<String> columnVmiAPINames) {
        List<ColumnRecord> columns = new List<ColumnRecord>();

        for (String s : columnVmiAPINames) {
            List<String> ss = s.split('\\.');

            columns.add(new ColumnRecord(
                    Schema.getGlobalDescribe().get(ss[0]).getDescribe().fields.getMap().get(ss[1]).getDescribe().getLabel(),
                    ss[1])
            );
        }        
        return columns;
    }
    
    @AuraEnabled
    public static List<LineItem> getWorkOrderItems(String filter, String startDate, String endDate) {
        Map<String, LineItem> workOrderItems = new Map<String, LineItem>();
        Set<String> VMIAccounts = new Set<String>();
        Map<String, Decimal> vmiMonthlyMap = new Map<String, Decimal>();
        Map<String, Decimal> WOINameToQuantity = new Map<String, Decimal>();
        List<VMI_Monthly_Adjustment__c> vmis = VMI_Monthly_Adjustment__c.getAll().values();

        for(VMI_Monthly_Adjustment__c vmi : vmis){
            vmiMonthlyMap.put(vmi.Name, vmi.Monthly_Adjustment__c*0.01);
        }

        try{
            Set<Id> workOrderIds = new Set<Id>();
            List<ServiceAppointment> serviceAppointments = StockSummary.getServiceAppointments(filter, startDate, endDate);

            for (ServiceAppointment sa : serviceAppointments) {
                workOrderIds.add(sa.ParentRecordId); 
            }

            List<AggregateResult> results = [
                    SELECT Product2.Name name, Product2.French_Product_Name__c frenchName, toLabel(Type_of_Service__c) serviceType, Related_Product__r.Name related,
                    SUM(Quantity) total, WorkOrder.AccountId vmiAccountId
                    FROM WorkOrderLineItem
                    WHERE WorkOrderId = :workOrderIds
                    GROUP BY Product2.Name, Product2.French_Product_Name__c, Type_of_Service__c, Related_Product__r.Name, WorkOrder.AccountId
            ];

            for(AggregateResult ar : results) {
                LineItem i = new LineItem();
                i.isVMIProduct = false;

                if (ar.get('name') != ''
                        && ar.get('name') != null
                        && !String.valueOf(ar.get('name')).contains(QueryUtils.fieldServiceSettings.VMI_Product_Name__c))
                {
                    if (UserInfo.getLanguage() == 'fr') {
                        i.ProductName = String.valueOf(ar.get('frenchName'));
                    }
                    else {
                        i.ProductName = String.valueOf(ar.get('name'));
                    }
                    i.Quantity = (ar.get('total')!=null) ? (Decimal)ar.get('total') : 0;

                    if (WOINameToQuantity.get(i.ProductName+ar.get('serviceType')+((ar.get('related')!=null) ? String.valueOf(ar.get('related')) : '')) != null){
                        i.Quantity += WOINameToQuantity.get(i.ProductName+ar.get('serviceType')+((ar.get('related')!=null) ? String.valueOf(ar.get('related')) : ''));
                    }

                    WOINameToQuantity.put(i.ProductName+ar.get('serviceType')+((ar.get('related')!=null) ? String.valueOf(ar.get('related')) : ''), i.Quantity);

                    i.TypeOfService = String.isBlank(String.valueOf(ar.get('serviceType'))) ? Label.Others_Type_of_Service : String.valueOf(ar.get('serviceType'));
                    i.RelatedProduct = (ar.get('related')!=null) ? String.valueOf(ar.get('related')) : '';
                    i.isVMIProduct = false;

                    workOrderItems.put(i.ProductName+ar.get('serviceType')+((ar.get('related')!=null) ? String.valueOf(ar.get('related')) : ''), i);
                } else if (String.valueOf(ar.get('name')).contains(QueryUtils.fieldServiceSettings.VMI_Product_Name__c)) {
                    VMIAccounts.add(String.valueOf(ar.get('vmiAccountId')));
                }
            }

            List<VMI_Product__c> vmiProds = [
                    SELECT Id, Product__r.Name, Product__r.French_Product_Name__c, Quantity_Per_Visit__c, Par_Level__c
                    FROM VMI_Product__c
                    WHERE Account__c IN : VMIAccounts
            ];

            String currentMonth = String.valueOf(Date.today().month());

            for (VMI_Product__c vmiProd : vmiProds) {
                Decimal quantity;

                if(vmiProd.Quantity_Per_Visit__c != null) {
                    quantity = (Decimal) Math.ceil(vmiProd.Quantity_Per_Visit__c * vmiMonthlyMap.get(currentMonth) + vmiProd.Quantity_Per_Visit__c);
                } else {
                    quantity = 0;
                }

                LineItem i = new LineItem();
                if (UserInfo.getLanguage() == 'fr') {
                    i.ProductName = vmiProd.Product__r.French_Product_Name__c;
                }
                else {
                    i.ProductName = vmiProd.Product__r.Name;
                }
                i.Quantity = quantity;
                i.TypeOfService = Label.VMI_Service_Description;
                i.isVMIProduct = true;
                i.parLevel = vmiProd.Par_Level__c != null ? Integer.valueOf(vmiProd.Par_Level__c) : null;
                workOrderItems.put(i.ProductName + 'VMI', i);
            }
        } catch(Exception e){
            System.debug(e.getMessage());
            System.debug(e.getLineNumber());
        }
        
        return workOrderItems.values();
    }
    
    @AuraEnabled
    public static List<GroupedItem> getWorkOrderItemsGrouped(String filter, String startDate, String endDate) {
        List<GroupedItem> listItems = new List<GroupedItem>();
        List<String> VMIAccounts = new List<String>();
        Map<String, Decimal> vmiMonthlyMap = new Map<String, Decimal>();
        List<VMI_Monthly_Adjustment__c> vmis = VMI_Monthly_Adjustment__c.getAll().values();

        for(VMI_Monthly_Adjustment__c vmi : vmis){
            vmiMonthlyMap.put(vmi.Name, vmi.Monthly_Adjustment__c*0.01);
        }
        
        try{       
            List<ServiceAppointment> serviceAppointments = StockSummary.getServiceAppointments(filter, startDate, endDate);
            
            // create map of account name and street with related work order ids
            Map<String, List<Id>> locationMap = new Map<String, List<Id> >();

            for( ServiceAppointment sa : serviceAppointments ) {
                String nameStreet = sa.Account__r.name + ' - ' + sa.Street;
                List<Id> currList = locationMap.get(nameStreet) != null ? locationMap.get(nameStreet) : new List<Id>();
                currList.add(sa.ParentRecordId);
                locationMap.put(nameStreet, currList);
            }
            
            Integer index = 0;

            for ( String street : locationMap.keySet() ) {
                Map<String,List<Id>> typeMap = new Map<String, List<Id> >();
                
                List<Id> currworkOrderIds = locationMap.get(street);
                GroupedItem item = new GroupedItem();
                item.address = street;

                List<WorkOrderLineItem> wolis = [
                        SELECT Id, Type_of_Service__c, toLabel(Type_of_Service__c) serviceType,
                        WorkOrderId, Product2.Name
                        FROM WorkOrderLineItem
                        WHERE WorkOrderId = :currworkOrderIds
                        AND Product2.Name != ''
                        AND Product2.Name != NULL
                ];

                for (WorkOrderLineItem li : wolis) {

                    String typeOfService = String.isBlank(li.Type_of_Service__c) ? Label.Others_Type_of_Service : String.valueOf(li.get('serviceType'));

                    if (String.valueOf(li.Product2.Name).contains(QueryUtils.fieldServiceSettings.VMI_Product_Name__c)){
                        typeOfService = Label.Stock_Summary_Service;
                    }

                    List<Id> currList = typeMap.get(typeOfService) != null ? typeMap.get(typeOfService) : new List<Id>();
                    currList.add(li.Id);

                    typeMap.put(typeOfService, currList);
                }
                
                List<ItemMap> listItemType = new List<ItemMap>();               

                for (String typeService : typeMap.keySet()) {
                    List<Id> currTypeIds = typeMap.get(typeService);
                    Map<String, LineItem> currItemList = new Map<String, LineItem>();
                    Map<String, Decimal> WOINameToQuantity = new Map<String, Decimal>();

                    List<AggregateResult> results = [
                            SELECT Product2.Name name, Product2.French_Product_Name__c frenchName, Related_Product__r.Name prod, SUM(Quantity) total,
                                    WorkOrder.AccountId vmiAccountId
                            FROM WorkOrderLineItem
                            WHERE Id = :currTypeIds
                            AND Product2.Name != ''
                            AND Product2.Name != NULL
                            GROUP BY Product2.Name, Product2.French_Product_Name__c, Related_Product__r.Name, WorkOrder.AccountId
                    ];

                    for(AggregateResult ar : results) {
                    	System.debug('ar---->' + ar);
                    }
                    
                    for(AggregateResult ar : results) { //Resume here
                        if (!String.valueOf(ar.get('name')).contains(QueryUtils.fieldServiceSettings.VMI_Product_Name__c)) {
                           
                            LineItem i = new LineItem();
                            if (UserInfo.getLanguage() == 'fr') {
                                i.ProductName = String.valueOf(ar.get('frenchName'));
                            }
                            else {
                                i.ProductName = String.valueOf(ar.get('name'));
                            }
                            i.Quantity = ar.get('total') != null ? (Decimal)(ar.get('total')) : 0;

                            if (WOINameToQuantity.get(i.ProductName) != null) {
                                i.Quantity += WOINameToQuantity.get(i.ProductName);
                            }

                            WOINameToQuantity.put(i.ProductName + i.RelatedProduct, i.Quantity);
                            i.RelatedProduct = ar.get('prod') != null ? String.valueOf(ar.get('prod')) : '';
                            i.isVMIProduct = false;
                        	
							
                            currItemList.put(i.ProductName + i.RelatedProduct, i);
                           
                            
                        } else if (String.valueOf(ar.get('name')).contains(QueryUtils.fieldServiceSettings.VMI_Product_Name__c)){
                            VMIAccounts.add(String.valueOf(ar.get('vmiAccountId')));
                        }
                    }

                    ItemMap currItem = new ItemMap();
                    currItem.serviceType = typeService;
                    currItem.itemsMap = currItemList.values();
                    
                    System.debug('currItemList---->'+currItemList);

                    listItemType.add(currItem);
                }
                
                List<LineItem> currItemList = new List<LineItem>();

                List<VMI_Product__c> vmiProds = [
                        SELECT Id, Product__r.Name, Product__r.French_Product_Name__c, Quantity_Per_Visit__c, Par_Level__c
                        FROM VMI_Product__c
                        WHERE Account__c IN : VMIAccounts
                ];

                String currentMonth = String.valueOf(Date.today().month());

                for (VMI_Product__c vmiProd : vmiProds) {
                    Decimal quantity;

                    if(vmiProd.Quantity_Per_Visit__c != null) {
                        quantity = (Decimal) Math.ceil(vmiProd.Quantity_Per_Visit__c*vmiMonthlyMap.get(currentMonth) + vmiProd.Quantity_Per_Visit__c);
                    } else {
                        quantity = 0;
                    }

                    LineItem i = new LineItem();
                    if (UserInfo.getLanguage() == 'fr') {
                        i.ProductName = vmiProd.Product__r.French_Product_Name__c;
                    }
                    else {
                        i.ProductName = vmiProd.Product__r.Name;
                    }
                    i.Quantity = quantity;
                    i.TypeOfService = Label.VMI_Service_Description;
                    i.parLevel = vmiProd.Par_Level__c != null ? Integer.valueOf(vmiProd.Par_Level__c) : null;
                    i.isVMIProduct = true;

                    currItemList.add(i);
                }
                
                if (!currItemList.isEmpty()) {
                    ItemMap currItem = new ItemMap();
                    currItem.serviceType = Label.VMI_Service_Description;
                    currItem.itemsMap = currItemList;

                    listItemType.add(currItem);
                }
                
                VMIAccounts.clear();
                
                if (!listItemType.isEmpty()) {
                    item.itemsMap = listItemType;
                    listItems.add(item);
                } else {
                    if(!listItems.isEmpty()) {
                        listItems.remove(index); 
                    }                  
                }
                index++;
            }            
        }catch(Exception e){
            System.debug('issue is' + e.getMessage());
            System.debug(e.getLineNumber());
        }
        
        return listItems;
    }         
    
    @AuraEnabled 
    public static List<ServiceAppointment> getServiceAppointments(String filter, String startDate, String endDate) {
        List<ServiceAppointment> sa = new List<ServiceAppointment>();    
        
        try {
            Id userId = UserInfo.getUserId();
            
            Set<Id> serviceAppointmentIds = new Set<Id>();
            String query = '';
            
            ServiceResource sr = [
                    SELECT Id, (SELECT ServiceAppointmentId FROM ServiceAppointments)
                    FROM ServiceResource
                    WHERE RelatedRecordId = :userId AND ResourceType = 'T'
                    AND IsActive = TRUE
                    LIMIT 1
            ];
            for (AssignedResource  ar : sr.ServiceAppointments) {
                serviceAppointmentIds.add(ar.ServiceAppointmentId);
            }
                        
            if (filter != 'CUSTOM_DATE_FILTER') {
                query = 'SELECT ParentRecordId,SchedStartTime,Street,Account__r.name FROM ServiceAppointment WHERE Street!=null AND Id IN :serviceAppointmentIds AND SchedStartTime = ' + filter ;
            } else {                      
                Datetime startDate_dt = StockSummary.getDateTime(startDate, true);
                Datetime endDate_dt = StockSummary.getDateTime(endDate, false);
                query = 'SELECT ParentRecordId,SchedStartTime,Street,Account__r.name FROM ServiceAppointment WHERE Street!=null AND Id IN :serviceAppointmentIds AND SchedStartTime >= :startDate_dt AND SchedStartTime <= :endDate_dt' ;
            }

            sa = Database.query(query);

        } catch(Exception e) {
            System.debug(e.getMessage());
            System.debug(e.getLineNumber());
        }
        return sa;
    }
    
    @AuraEnabled
    public static Datetime getDateTime(String date_d, Boolean start) {
        Date date_v = (date_d != null && date_d != '') ? Date.valueOf(date_d) : null;
        Datetime date_dt;
        
        if (start){ 
            date_dt = date_v != null ?  Datetime.newInstanceGmt(date_v.year(),date_v.month() ,date_v.day(), 00, 00, 00) : null;
        } else {
            date_dt = date_v != null ? Datetime.newInstanceGmt(date_v.year(),date_v.month() ,date_v.day(), 23, 59, 59) : null;
        }
        return date_dt;        
    }
}