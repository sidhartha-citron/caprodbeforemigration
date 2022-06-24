/**
* Name: EDW_ViewModels
* Author: PwC
* Date Created: February 1, 2019
* Purpose: To house all view models for the Emergency Dispatch Wizard
*/
public with sharing class EDW_ViewModels {
    private static Emergency_Dispatch_Wizard_Setttings__c edwSettings = Emergency_Dispatch_Wizard_Setttings__c.getOrgDefaults();
    
    public class AppointmentVisitViewModel {
        @AuraEnabled public String accountId {get;set;}
        @AuraEnabled public String workOrderId {get;set;}
        @AuraEnabled public List<ServiceAppointment> serviceAppointments {get;set;}
        @AuraEnabled public List<Path> paths {get;set;}
        @AuraEnabled public Integer numberOfServiceAppointments {get;set;}
        @AuraEnabled public Boolean areAllServiceAppoinmentsResourced {get;set;}
        
        public AppointmentVisitViewModel() {
            this.serviceAppointments = new List<ServiceAppointment>();
            this.paths = new List<Path>();
        }
    }
    
    public class ResourcePreferenceViewModel {
        @AuraEnabled public List<Technician_Preference__c> resourcePreferences {get;set;}
        @AuraEnabled public List<String> columnNames {get;set;}
        @AuraEnabled public Account account {get;set;}
        
        public ResourcePreferenceViewModel() {
            this.resourcePreferences = new List<Technician_Preference__c>();
            this.columnNames = new List<String>();
        }
    }
    
	public class MainViewModel {
        @AuraEnabled public String recordId {get;set;}
        @AuraEnabled public Account account {get;set;}
        @AuraEnabled public Contact contact {get;set;}
        @AuraEnabled public String poNumber {get;set;}
        @AuraEnabled public Case ticket {get;set;}
        @AuraEnabled public Order order {get;set;}
        @AuraEnabled public List<String> infestationLevels {get;set;}
        @AuraEnabled public List<String> treatmentTypes {get;set;}
        @AuraEnabled public List<String> numberOfRooms {get;set;}
        @AuraEnabled public List<TableOrderItem> tableRows {get;set;}
        @AuraEnabled public List<Path> paths {get;set;}
        @AuraEnabled public List<Integer> resourcesRange {get;set;}
        @AuraEnabled public Integer numberOfResources {get;set;}
        @AuraEnabled public Decimal totalEstimatedDuration {get;set;}
        @AuraEnabled public Decimal workTypeEstimatedDuration {get;set;}
        @AuraEnabled public Decimal defaultEstimatedDuration {get;set;}
        @AuraEnabled public Boolean isCommunity {get;set;}
        @AuraEnabled public String orderItemBatchJobId {get;set;}
        @AuraEnabled public AuraStatusResponse auraResponse {get;set;}
        @AuraEnabled public Integer pageNumber {get;set;}
        @AuraEnabled public Boolean disableNext {get;set;}//pagination
        @AuraEnabled public Integer orderItemCount {get;set;}
        @AuraEnabled public Decimal totalOrderAmount {get;set;}
        @AuraEnabled public Boolean isValidToGenerateWorkOrder {get;set;}//survey location validation
        @AuraEnabled public Date orderEffectiveDate {get;set;}
        @AuraEnabled public String orderEffectiveTime {get;set;}
        @AuraEnabled public String mode {get;set;}
        @AuraEnabled public Boolean isCancelOrderButtonAccessible {get;set;}
        @AuraEnabled public String orderNumber {get;set;}
        @AuraEnabled public String minOperatingHoursTime {get;set;}
        @AuraEnabled public String maxOperatingHoursTime {get;set;}
        
        public MainViewModel() {
            this.tableRows = new List<TableOrderItem>();
            this.numberOfRooms = new List<String>();
            this.infestationLevels = new List<String>();
            this.treatmentTypes = new List<String>();
            this.isCancelOrderButtonAccessible = false;
            this.orderNumber = Label.Default_Order_Name;
        }
        
        public List<Integer> initializeResourcesRange() {
            if (this.resourcesRange == null) {
                List<Integer> returnedSet = new List<Integer>();
                
                for (Integer i = 1; i <= edwSettings.Maximum_Number_of_Resources__c; i++) {
                    returnedSet.add(i);
                }
                
                return returnedSet;
            }
            
            return this.resourcesRange;
        }
        
        public List<Path> initializePaths() {
            if (this.paths == null) {
                return EDW_UtilityClass.initializePaths(this.mode);
            }
            
            return this.paths;
        }
    }
    
    public class OrderDateTimeViewModel {
        @AuraEnabled public AuraStatusResponse response {get;set;}
        @AuraEnabled public Order order {get;set;}
        @AuraEnabled public Boolean isOperatingHoursOverridden {get;set;}
        @AuraEnabled public String minOperatingHoursTime {get;set;}
        @AuraEnabled public String maxOperatingHoursTime {get;set;}
    }
    
    public class TableOrderItem {
        @AuraEnabled public Survey_Location__c surveyLocation {get;set;}
        @AuraEnabled public ProductWrapper selectedProduct {get;set;}
        @AuraEnabled public Product2 productRecord {get;set;}
        @AuraEnabled public String infestationLevel {get;set;}
        @AuraEnabled public String numberOfRooms {get;set;}
        @AuraEnabled public Warranty__c warranty {get;set;}
        @AuraEnabled public String orderItemId {get;set;}
        @AuraEnabled public String previousOrderItemId {get;set;}
        @AuraEnabled public OrderItem orderItem {get;set;}
        @AuraEnabled public String orderItemPONumber {get;set;}
        @AuraEnabled public String treatmentType {get;set;}
        @AuraEnabled public AuraStatusResponse auraResponse {get;set;}
        //Begin:Shashi:10-4-2019:Populate related infestation and rooms
        @AuraEnabled public List<String> infestLevelsCopy {get;set;}
        @AuraEnabled public List<String> numOfRoomsCopy {get;set;}
        //End
        
        public TableOrderItem(Survey_Location__c surveyLocation, String infestationLevel, Product2 productRecord, String numberOfRooms, ProductWrapper selectedProduct, Warranty__c warranty, String orderItemId, String previousOrderItemId, OrderItem orderItem, String treatmentType) {
            this.surveyLocation = surveyLocation;
            this.infestationLevel = infestationLevel;
            this.productRecord = productRecord;
            this.numberOfRooms = numberOfRooms;
            this.selectedProduct = selectedProduct;
            this.warranty = warranty;
            this.orderItemId = orderItemId;
            this.orderItem = orderItem;
            this.treatmentType = treatmentType;
            this.previousOrderItemId = previousOrderItemId;
            this.orderItemPONumber = orderItem.PO_Number__c;
            //Begin:Shashi:10-4-2019:Populate related infestation and rooms
            this.infestLevelsCopy = EDW_UtilityClass.getInfestationAndRooms(treatmentType,infestationLevel,'INFLVL');
            this.numOfRoomsCopy = EDW_UtilityClass.getInfestationAndRooms(treatmentType,infestationLevel,'ROOMS');
            //End
        }
    }
    
    public class OrderProductRequest {
        @AuraEnabled public String infestationLevel {get;set;}
        @AuraEnabled public String treatmentType {get;set;}
        @AuraEnabled public String numberOfUnits {get;set;}
        @AuraEnabled public String numberOfRooms {get;set;}
    }
    
    public class ProductWrapper {
        @AuraEnabled public String pricebookEntryId {get;set;}
        @AuraEnabled public String productId {get;set;}
        @AuraEnabled public String productName {get;set;}
        @AuraEnabled public String productCode {get;set;}
        @AuraEnabled public String durationType {get;set;}
        @AuraEnabled public Decimal estimatedDuration {get; set;}
        @AuraEnabled public String infestationLevel {get;set;}
        @AuraEnabled public String treatmentType {get;set;}
        @AuraEnabled public String numberOfRooms {get;set;}
        
        public ProductWrapper(String pricebookEntryId, String productId, String productName, String productCode, String durationType, Decimal estimatedDuration, String infestationLevel, String treatmentType, String numberOfRooms) {
            this.pricebookEntryId = pricebookEntryId;
            this.productId = productId;
            this.productName = productName;
            this.productCode = productCode;
            this.durationType = durationType;
            this.estimatedDuration = estimatedDuration;
            this.infestationLevel = infestationLevel;
            this.treatmentType = treatmentType;
            this.numberOfRooms = numberOfRooms;
        }
    }
    
    public class Path {
        @AuraEnabled public String pathName {get;set;}
        @AuraEnabled public Boolean isStepComplete {get;set;}
        @AuraEnabled public Boolean isCurrentPathItem {get;set;}
        
        public Path(String pathName) {
            this.pathName = pathName;
            this.isStepComplete = false;
        }
    }
    
    public class AccessValidationResponse {
        @AuraEnabled public AuraStatusResponse response {get;set;}
        @AuraEnabled public SObject theObject {get;set;}
        @AuraEnabled public String objectType {get;set;}
    }
    
    public static MainViewModel parseInitData(String json) {
        return (MainViewModel)System.JSON.deserialize(json, MainViewModel.class);
    }
    
    public static TableOrderItem parseTableOrderItem(String json) {
        return (TableOrderItem)System.JSON.deserialize(json, TableOrderItem.class);
    }
    
    public static List<TableOrderItem> parseTableOrderItemList(String json) {
        return (List<TableOrderItem>)System.JSON.deserialize(json, List<TableOrderItem>.class);
    }
    
    public static OrderProductRequest parseOrderProductRequest(String json) {
        return (OrderProductRequest)System.JSON.deserialize(json, OrderProductRequest.class);
    }
    
    public static OrderDateTimeViewModel parseOrderDateTimeViewModel(String json) {
        return (OrderDateTimeViewModel)System.JSON.deserialize(json, OrderDateTimeViewModel.class);
    }
}