/**
 * Controller for Mass Edit Lightning component. Supports any
 * object type via custom settings.
 *
 * @author Ahsan Butt
 */
public with sharing class MassEditController {
    private static String OBJ_ORDER_ITEM = 'OrderItem';
    private static String FIELD_ACTIVE = 'Active__c'; //hack for special Order Item case
    private static String FIELD_REQUEST_PRICE_APPROVED = 'Requested_Price_Approved__c';
    private static String OVERRIDE_PERMISSION_SET = 'Standing_Order_Price_Override_Permission';

    @AuraEnabled
    public static RecordSet getRecordEntries(List<String> ids, String objName, String sortImpl, Integer startIndex, Integer pageSize) {
        // Get custom settings for this obj
        Mass_Edit_Settings__c settings = getSettings(objName);

        // Get field sets
        Schema.FieldSet readOnlyFields = FieldSetUtils.getFieldSet(objName, settings.Field_Set_read_only__c);
        Schema.FieldSet editFields = FieldSetUtils.getFieldSet(objName, settings.Field_Set_editable__c);
        // not implemented yet
        //Schema.FieldSet columnOrderFields = FieldSetUtils.getFieldSet(objName, settings.Field_Set_column_order__c);
        

        // Compose query
        String query = composeQuery(objName, new List<Schema.FieldSet>{readOnlyFields, editFields});
        System.debug('query is '+query);

        if (objName == OBJ_ORDER_ITEM) {
            //inject the account Id into the query
            query = query.replace('SELECT ','SELECT Account_Id__c, Order_Number__c, ');
        }

        // Execute query
        List<sObject> records = Database.query(query);
        System.debug('These are the records'+records.get(0));

        // Construct results object
        RecordSet results = new RecordSet(); // TODO: Sent sort impl via Lightning controllers
        
        // Get page of records
        List<RecordEntry> allRecords = convertToEntries(objName, records, readOnlyFields, editFields, sortImpl);
        allRecords.sort();
        Integer sIndex = Integer.valueOf(startIndex); // Work-around: Integer Lightning params can't be manipulated unless cast
        Integer pSize = Integer.valueOf(pageSize);
        results.records = getPageOfRecords(allRecords, sIndex, pSize);
    
        results.controlRecord = Schema.getGlobalDescribe().get(objName).newSObject();
    
        if (objName == OBJ_ORDER_ITEM) {
            results.accountId = (String)records[0].get('Account_Id__c');
            results.parentName = (String)records[0].get('Order_Number__c');
        }

        // Set search field label
        Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
        
        Schema.SObjectType objSchema = schemaMap.get(objName);
        Map<String, Schema.SObjectField> fieldMap = objSchema.getDescribe().fields.getMap();


        
        if (fieldMap.get(settings.Search_Field__c) != null) {
        	results.searchField = fieldMap.get(settings.Search_Field__c).getDescribe().getLabel();    
            System.debug('results searchField'+results.searchField);
        }
        
         
        if (results.records != null && results.records.size() > 0) {
            results.headers = results.records[0].fields;
        }
		System.debug('Results are: '+results);
        return results;
    }
  
    @AuraEnabled
    public static MassEditSaveResults saveRecords(List<sObject> records) {
        MassEditSaveResults results = new MassEditSaveResults();
        results.isSuccess = true;
        System.debug('Order id in Savve!');
        
        try {
            //System.debug('This is records in mass edit controller while saving'+records[0]);
            update records;
            results.numSaved = records.size();
        } catch (Exception e) {
            System.debug(e);
            results.isSuccess = false;
            results.errMsg = e.getMessage();
        }
        
        return results;
    }
    
    // Varun 04/03/2020: Move to Order Functionality
    @AuraEnabled
    public static CloneResultMap cloneOrderItem(List<OrderItem> records, String ordId) {
        
        //CloneResultMap resultMap = new CloneResultMap();
        //Generate a query to get all fields from the fieldset
        String soqlQuery = QueryGenerator.queryCloneOrderItems('Id in :records');
        System.debug('SOQL Query' + SoqlQuery);
        
        //List of original order products which are to be moved with all the fields
		List<OrderItem> orderProducts = database.query(soqlQuery);        
        
        System.debug('Order id in ord item clone' + ordId);
        System.debug('List of records' + records);
        
        if (ordId == null || records.isEmpty()) return null;
        
        //Query the destination order to set Control_Invoice_Ticket, Order item start date = destination order start date
        List<Order> order = [SELECT id,status,Control_Invoice_Ticket__c,OrderNumber,Effectivedate,AccountId FROM Order WHERE id = :ordId];       
        
        //Destination Order should be deactivated before insertion of new order product
        if(order[0].status =='Activated') 
        {
            System.debug('Status' + order[0].status);
			order[0].status = 'Draft';            
        }
        //order[0].Control_Invoice_Ticket__c=2;
        
        System.debug('orderProducts size'+orderProducts.size()); 
        
        //clonedOrderProducts : List which holds all cloned order products
        List<OrderItem> clonedOrderProducts 	= new List<OrderItem>();    
        List<OrderItem> listOriginalOrdProducts = new List<OrderItem>();                
		// OPCloneResultMap will hold the failed order products along with the error message
		// opToNewOPMap will hold the successfully inserted order products
        Map<Id, CloneResult> OPCloneResultMap = new Map<Id, CloneResult>();
        Map<Id, OrderItem> opToNewOPMap = new Map<Id, OrderItem>();
        List<OrderItem> oiFailures = new List<OrderItem>();
        //Survey Asset Location Map which holds SALs of successfully cloned Order products
        Map<Id, Survey_Asset_Location__c> newAssetMap = new Map<Id, Survey_Asset_Location__c>();
        //Order Item Location for cloned order products
        List<Order_Item_Location__c> newOrderItemLocations = new List<Order_Item_Location__c>();
        for(Integer i = 0; i < orderProducts.size(); i++) 
        {
            //orderProduct: Iterate through each orderProduct from list of orderProducts
            OrderItem orderProduct = orderProducts.get(i);
            System.debug('Sanchivan Order product'+orderProduct);
            System.debug('Sanchivan orderProduct.Id: ' + orderProduct.Id);
            System.debug('Sanchivan order[0].AccountId: ' + order[0].AccountId);
            System.debug('Sanchivan orderProduct.Product_Type__c: ' + orderProduct.Product_Type__c);
            System.debug('Sanchivan orderProduct.Frequency__c: ' + orderProduct.Frequency__c);
            System.debug('Sanchivan orderProduct.IsActive__c: ' + orderProduct.IsActive__c);
            
            //Filter out Non service and One Time Frequency order products 
            //Original order -Ship to account = Cloned order order ship to account
            //Original order product should be active 
            if(orderProduct.Product_Type__c == 'Service' && orderProduct.Frequency__c != 'One-Time' && 
               orderProduct.Account_Id__c == order[0].AccountId && orderProduct.IsActive__c)
            {
                //clonedOrderProduct : This will store the clone value    
                OrderItem clonedOrderProduct = orderProduct.clone(false, true, false, false);
                System.debug('cloned order product'+clonedOrderProduct.id);
                
                //Override clonedOrderProduct values
                clonedOrderProduct.OrderId 	    				= ordId;
                clonedOrderProduct.ServiceDate  				= order[0].Effectivedate;
                clonedOrderProduct.Need_Ticket__c 				= '$CLONE$';
                clonedOrderProduct.Cloned_From_Order_Line__c 	= orderProduct.id;    
            
                clonedOrderProducts.add(clonedOrderProduct); 
                System.debug('Order id in cloned order product'+clonedOrderProduct.OrderId);
                System.debug('Need ticket value in cloned op'+clonedOrderProduct.Need_Ticket__c);
            
                System.debug('Original order product id'+orderProduct.id);
                System.debug('Original order product status'+orderProduct.Active__c);
                listOriginalOrdProducts.add(orderProduct);
            } else {
                //Display failures if order products fail above if:criteria 
                orderProduct.Clone_Status__c = 'Failed';
                oiFailures.add(orderProduct);
                OPCloneResultMap.put(orderProduct.id, getErrorResult(oiFailures));
            }
        }

        if(oiFailures.isEmpty())
        {
            System.debug('Sanchivan oiFailures SOQL Limit START: ' + Limits.getQueries());
            update oiFailures; 
            System.debug('Sanchivan oiFailures SOQL Limit END: ' + Limits.getQueries());
        }
        
        if(!order.isEmpty())
        {
            System.debug('Sanchivan order SOQL Limit START: ' + Limits.getQueries());
            update order;
            System.debug('Sanchivan order SOQL Limit END: ' + Limits.getQueries());
        }
        
        System.debug('Cloned Order Products List' + clonedOrderProducts);

        if(!clonedOrderProducts.isEmpty())
        {
            //insert clonedOrderProducts;
            System.debug('Sanchivan clonedOrderProducts SOQL Limit START: ' + Limits.getQueries());
            Database.SaveResult[] orderProductSaveResults = Database.insert(clonedOrderProducts, false);
            System.debug('Sanchivan clonedOrderProducts SOQL Limit END: ' + Limits.getQueries());              
        
            System.debug('Order Product Save Results' + orderProductSaveResults);

            // Map<Id, CloneResult> OPCloneResultMap = new Map<Id, CloneResult>();

            List<OrderItem> OIS = new List<OrderItem>();
            
            Integer i = 0;
            for (Database.SaveResult ordPrdSR : orderProductSaveResults) {
                //OrderItem attemptedOrderProduct = clonedOrderProducts.get(i);
                OrderItem originalOrderProduct  = listOriginalOrdProducts.get(i);
                //System.debug('This is saved order product '+i+' : '+attemptedOrderProduct.id);
                if (ordPrdSR.isSuccess()) 
                {
                    System.debug('Successfully inserted');
                    //On successful insert change clone status and deactivate order product
                    originalOrderProduct.Clone_Status__c = 'Moved';
                    originalOrderProduct.Active__c = false;
                    originalOrderProduct.Need_Ticket__c= '$CLONE$';
                    //update originalOrderProduct;
                    ois.add(originalOrderProduct);
                    opToNewOPMap.put(originalOrderProduct.id, originalOrderProduct);
                } else {
                    System.debug('Failure during insertion');
                    //Update clone status on failure
                    originalOrderProduct.Clone_Status__c = 'Failed';
                    ois.add(originalOrderProduct);
                    OPCloneResultMap.put(originalOrderProduct.id, getErrorResult(ordPrdSR.getErrors()));
                }
                
                i++;
            }

            if(!ois.isEmpty())
            {
                System.debug('Sanchivan OIS SOQL Limit START: ' + Limits.getQueries());
                update OIS; 
                System.debug('Sanchivan OIS SOQL Limit END: ' + Limits.getQueries());
            }       
            
            Map<Id, OrderItem> newOrderItems = new Map<Id, OrderItem>(
                [SELECT 
                    Id, OrderId, Order.Parent_Order__c, Parent_Order_Product__c, isPurchaseOnly__c, PricebookEntry.Product2Id, Frequency__c, Active__c, Survey_Location__c,
                    HasSurveyAssets__c, Order.Site_Survey__c, Order.Parent_Order__r.Site_Survey__c, Quantity, Order.Emergency__c, Related_Product__c, Order.RecordTypeId
                 FROM 
                    OrderItem 
                 WHERE Id IN: clonedOrderProducts]);

            System.debug('This is newOrderItems map' + newOrderItems);
            
            for(OrderItem oi : clonedOrderProducts) {
                    
                OrderItem theItem = newOrderItems.get(oi.Id);
                //OrderItem theItem = clonedOrderProducts.get(j);
                
                Survey_Asset_Location__c newAsset = new Survey_Asset_Location__c(
                    Site_Survey__c = theItem.Order.Site_Survey__c, 
                    Product__c = theItem.PricebookEntry.Product2Id, 
                    Related_Product__c = oi.Related_Product__c, 
                    Quantity__c = 1, 
                    Originating_Record_ID__c = oi.Id, 
                    Originating_Parent_ID__c = oi.OrderId, 
                    Service_Frequency__c = oi.Frequency__c,
                    //21618, add Survey Location immediately if one exists
                    Survey_Location__c = theItem.Survey_Location__c
                );
                System.debug('This is new Asset'+newAsset);
                newAssetMap.put(oi.Id, newAsset);
                System.debug('Survey Location value while clone '+newAsset.Survey_Location__c);                   
            }
			
            if(!newAssetMap.isEmpty()) {
                System.debug('Sanchivan newAssetMap SOQL Limit START: ' + Limits.getQueries());
                insert newAssetMap.values();
                System.debug('Sanchivan newAssetMap SOQL Limit START: ' + Limits.getQueries());
                System.debug('The SAL asset map'+newAssetMap);
                for(OrderItem oi : clonedOrderProducts) 
                {
                    newOrderItemLocations.add(new Order_Item_Location__c(
                        Order__c = oi.OrderId, 
                        Order_Product__c = oi.Id, 
                        Survey_Asset_Location__c = (newAssetMap.get(oi.Id) != null ? newAssetMap.get(oi.Id).Id : null)
                        )); 
                    
                    oi.HasSurveyAssets__c = true;
                    oi.SurveyAssetCountChecker__c = oi.Quantity;
                }
                    
                if(!newOrderItemLocations.isEmpty())
                {
                    System.debug('Sanchivan newOrderItemLocations SOQL Limit START: ' + Limits.getQueries());
                    insert newOrderItemLocations;
                    System.debug('Sanchivan newOrderItemLocations SOQL Limit START: ' + Limits.getQueries());  
                }
                    
                System.debug(' new order item locations ' + newOrderItemLocations);
                System.debug(' changed order items ' + clonedOrderProducts);
                if(!clonedOrderProducts.isEmpty())
                {
                    System.debug('Sanchivan clonedOrderProducts SOQL Limit START: ' + Limits.getQueries());
                    update clonedOrderProducts;
                    System.debug('Sanchivan clonedOrderProducts SOQL Limit START: ' + Limits.getQueries());
                }                    
            }
        }
        System.debug('Before compile results');
        System.debug('Op To new Map'+opToNewOPMap);
        System.debug('Op clone result map'+OPCloneResultMap);    
        //return compileResults(OPCloneResultMap,opToNewOPMap,listOriginalOrdProducts);
        return compileResults(OPCloneResultMap,opToNewOPMap,orderProducts);
    }
    
    @AuraEnabled
    public static Map<Id, Boolean> searchRecords(String objName, List<sObject> records, String searchTerm) {
        Map<Id, Boolean> resultIds = new Map<Id, Boolean>();

        if (objName == OBJ_ORDER_ITEM) {
            Set<String> fieldsToSearch = FieldSetUtils.getfieldListFromFieldSet(objName, 'Seach_Fields');
            Map<Id, Set<String>> returnedOrderItems = new Map<Id, Set<String>>();
            getRelevantRecords(records, returnedOrderItems);

            for(SObject record : records) {
                String searchTermRegex = '(?i).*' + searchTerm + '.*'; 
                Pattern searchPattern = Pattern.compile(searchTermRegex);

                for(String field : fieldsToSearch) {
                    String fieldValue = (String) record.get(field);
                    Matcher matcher = searchPattern.matcher(fieldValue);

                    if(matcher.matches()) {
                        resultIds.put(record.Id, true);
                        break;
                    }
                }

                if(!resultIds.keySet().contains(record.Id)) {
                    Set<String> fieldValues = returnedOrderItems.get(record.id);
                    if(fieldValues != Null) {
                        for(String fieldValue : fieldValues) {
                            Matcher matcher = searchPattern.matcher(fieldValue);

                            if(matcher.matches()) {
                                resultIds.put(record.Id, true);
                                break;
                            }
                        }                        
                    }                     
                }
            }
        }

        return resultIds;        
    }	
	
    private static void getRelevantRecords(List<OrderItem> records, Map<Id, Set<String>> returnedOrderItems) {    
        Set<Id> surveyLocationIds = new Set<Id>();
        
        List<OrderItem> orderItems = new List<OrderItem>([SELECT Id, Survey_Location__C FROM OrderItem WHERE Id in: records]);
        
        for(OrderItem item : orderItems) {
            surveyLocationIds.add(item.Survey_Location__c);
        }

        List<Survey_Location__C> surveyLocations = new List<Survey_Location__C>([SELECT Id, Name, Building__c FROM Survey_Location__C WHERE Id in: surveyLocationIds]);
       
        for(OrderItem oi_new : orderItems) {
            for(Survey_Location__C sl_new: surveyLocations) {
                if(oi_new.Survey_Location__C == sl_new.Id){
                    Set<String> fieldValues = new Set<String>();
                    
                    fieldValues.add(sl_new.Name);
                    if(!String.isBlank(sl_new.Building__c)) {
                        fieldValues.add(sl_new.Building__c);
                    }
                    
                    returnedOrderItems.put(oi_new.Id, fieldValues);
                }
            }
        }
    }
    
    private static Mass_Edit_Settings__c getSettings(String objName) {
        List<Mass_Edit_Settings__c> settings = [SELECT Id, Name, Field_Set_editable__c, Field_Set_read_only__c, Search_Field__c
                                                FROM Mass_Edit_Settings__c
                                                WHERE Name = :objName];

        if (settings != null && settings.size() == 1) {
            return settings[0];
        }

        return null;
    }

    private static String composeQuery(String objName, List<Schema.FieldSet> fieldSets) {
        String fields = FieldSetUtils.getFieldsCommaDelimitedString(fieldSets);

        return String.format('SELECT {0} FROM {1} WHERE Id IN :ids', new List<String>{fields, objName});
    }

    private static List<RecordEntry> convertToEntries(String objName, List<sObject> records, Schema.FieldSet readOnlyFields, Schema.FieldSet editFields, String sortImpl) {
        List<RecordEntry> entries = new List<RecordEntry>();
		Boolean hasOverridePermission = hasOverridePermission();
        
        List<FieldEntry> readOnlyFieldEntries = getFieldEntries(objName, readOnlyFields, false, hasOverridePermission);
        List<FieldEntry> editFieldEntries = getFieldEntries(objName, editFields, true, hasOverridePermission);
        
        for (sObject record : records) {
            RecordEntry entry = new RecordEntry();
            entry.record = record;
            entry.sortImpl = sortImpl;
            
            entry.fields = new List<FieldEntry>();
            entry.fields.addAll(readOnlyFieldEntries);
            entry.fields.addAll(editFieldEntries);

            // Note: this is a hack for a feature request specifically for Order Item
            for (FieldEntry fe : entry.fields) {
                if (fe.name == FIELD_ACTIVE) {
                    entry.isActive = (Boolean) entry.record.get(FIELD_ACTIVE);
                    break;
                }
            }
            
            entries.add(entry);
        }

        return entries;
    }
    
    private static List<FieldEntry> getFieldEntries(String objName, Schema.FieldSet fs, Boolean isEditable, Boolean hasOverridePermission) {
        List<FieldEntry> fieldEntries = new List<FieldEntry>();

        for (Schema.FieldSetMember fsm : fs.getFields()) {
            FieldEntry f = new FieldEntry();
            f.isEditable = isEditable;
            f.name = fsm.getFieldPath();
            f.label = fsm.getLabel();
            f.type = fsm.getType().name();
            
            // Get picklist options, if applicable
            if (fsm.getType() == Schema.DisplayType.PICKLIST || fsm.getType() == Schema.DisplayType.MULTIPICKLIST) {
                f.opts = getOpts(objName, fsm);
            }

            // Specific hack for 'OrderItem.Requested Price Approved' field
            if (f.name != FIELD_REQUEST_PRICE_APPROVED || hasOverridePermission) {
           		fieldEntries.add(f);    
            }
            
        }

        return fieldEntries;

    }

    private static List<String> getOpts(String objName, Schema.FieldSetMember fsm) {
        List<Schema.DescribeSobjectResult> results = Schema.describeSObjects(new List<String>{objName});

        if (results == null || results.size() != 1) return null;

        Map<String, Schema.SObjectField> fieldMap = results[0].fields.getMap();

        for (String field : fieldMap.keySet()) {
            if (field == fsm.getFieldPath()) {
                Schema.DescribeFieldResult fieldDescribe = fieldMap.get(field).getDescribe();
                List<Schema.PicklistEntry> picklistEntries = fieldDescribe.getPicklistValues();
                List<String> opts = new List<String>{''};
                for (Schema.PicklistEntry picklist : picklistEntries) {
                    opts.add(picklist.getValue());
                }
                return opts;
            }
        }

        return null;
    }
    
    private static boolean hasOverridePermission() {
        List<PermissionSetAssignment> overridePS = [SELECT Assignee.Id 
                                                    FROM PermissionSetAssignment 
                                                    WHERE PermissionSet.Name = :OVERRIDE_PERMISSION_SET AND Assignee.Id = :UserInfo.getUserId()];
        return overridePS != null && overridePS.size() > 0;
    }
    
    private static List<RecordEntry> getPageOfRecords(List<RecordEntry> allRecords, Integer startIndex, Integer pageSize) {
        List<RecordEntry> records = new List<RecordEntry>();

        if (startIndex >= allRecords.size()) {
            return records;
        }

        Integer numRecordsRemaining = allRecords.size() - startIndex; 
        Integer endIndex = numRecordsRemaining < pagesize ? startIndex + numRecordsRemaining : startIndex + pagesize;

        for (Integer x = startIndex; x < endIndex; x++) {
            records.add(allRecords.get(x));
        }
        
        return records;
    }
    
    // Varun 04/03/2020: Move to Order Functionality        
    private static CloneResultMap compileResults(Map<Id, CloneResult> OPCloneResultMap, Map<Id, OrderItem> opToNewOPMap,List<OrderItem> listOriginalOrdProducts)
    {
        List<CloneResult> successes = new List<CloneResult>();
        List<CloneResult> failures = new List<CloneResult>();
        for (OrderItem oi : listOriginalOrdProducts) {
            if (OPCloneResultMap.containsKey(oi.id)) {
                failures.add(OPCloneResultMap.get(oi.id));
            } else {
                // Since only failure results were populated in the map, this must have been a success
                CloneResult clResult = new CloneResult();
                clResult.isSuccess = true;
                clResult.ordItem = opToNewOPMap.get(oi.id);
                successes.add(clResult);
            }
        }
        
        CloneResultMap resultMap = new CloneResultMap();
        System.debug('These are successes '+successes);
        System.debug('These are failures '+failures);
        resultMap.successes = successes;
        resultMap.failures = failures;
        
        return resultMap;
        
    }
    
    // Varun 04/03/2020: Move to Order Functionality
    @TestVisible
    private static CloneResult getErrorResult(List<Database.Error> errs) {
        CloneResult clResult = new CloneResult();
        clResult.isSuccess = false;
        String errMsg = '';
        for (Database.Error err : errs) {
            errMsg += err.getMessage();
        }
        clResult.msg = errMsg;  
        
        return clResult;
    }
    
    // Varun 04/03/2020: Move to Order Functionality
    @TestVisible
    private static CloneResult getErrorResult(List<OrderItem> errs) {
        //orderProduct.Product_Type__c=='Service' && orderProduct.Frequency__c != 'One-Time'&& orderProduct.Account_Id__c == order[0].AccountId && orderProduct.IsActive__c
        
        CloneResult clResult = new CloneResult();
		String errMsg = '';
        for (OrderItem oi : errs) {
            System.debug('This is failed product'+oi.Product_Name__c);               
        	clResult.ordItem   = oi;            
            clResult.isSuccess = false;
            if(oi.Product_Type__c!='Service'){
              //errMsg  = 'This order item product type is not service'; 
              errMsg  = System.Label.Order_Product_Not_Service; 
            }
            else if(oi.Frequency__c == 'One-Time'){
              errMsg  = System.Label.Invalid_Order_Product_Frequency;  
            }
            else if(!oi.IsActive__c){
              errMsg  = System.Label.Inactive_Order_Product;  
            }
            else
            {
              errMsg  = System.Label.Parent_Account_Mismatch;
            }
             
       	     clResult.msg   = errMsg;
             
        }

        return clResult;
    }
    
    // Varun 04/03/2020: Move to Order Functionality
     public class CloneResultMap {
        @AuraEnabled public List<CloneResult> successes;
        @AuraEnabled public List<CloneResult> failures;
    }
    
    // Varun 04/03/2020: Move to Order Functionality
   	 public class CloneResult {
        @AuraEnabled public Boolean isSuccess;
        @AuraEnabled public String msg;
        @AuraEnabled public OrderItem ordItem;
    }
}