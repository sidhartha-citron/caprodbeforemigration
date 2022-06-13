public class StockSummaryVehicleInspectionController {
    
	    public class ColumnRecord {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String name { get; set; }
        
        public ColumnRecord(String label, String name) {
            this.label = label;
        }
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
        System.debug(columns);
        return columns;
    }
    
    @AuraEnabled
    public static Vehicle_Inspection__c initVI() {
        List<Vehicle_Inspection__c> VIs = [SELECT Id, CreatedDate, Adhered_to_tire_tread_depth_gauge_guide__c, Brakes_Passed_Pump_Test__c, 
                                           Doors_Close_and_Lock__c, First_Aid_Kit_OK__c, Fluids_Levels_OK__c, Horn_and_Back_up_Beeper_OK__c, Light_and_Indicators_OK__c, Mirrors_OK__c, 
                                           No_Fluid_Leaks__c, Ownership_and_Insurance_Valid__c, Service_Resource__c, Spill_Kit_OK__c, Ladder_in_Good_Working_order__c, 
                                           Submission_Date__c, Location__c, Vehicle_Inspection_Notes__c, Vehicle_License_Plate_Number__c, Service_Resource__r.Name 
                                           FROM Vehicle_Inspection__c 
                                           WHERE Service_Resource__r.relatedRecordId =: Userinfo.getUserId() AND CreatedDate=TODAY];
        if (VIs.isEmpty()){
            try{
            	String SRId = [Select Id FROM ServiceResource WHERE relatedRecordId =: Userinfo.getUserId()].Id;
            	Vehicle_Inspection__c VI = new Vehicle_Inspection__c(Service_Resource__c = SRId);
                insert VI;
            	return VI;
            } catch (Exception e){
                System.debug('Service Resource Error: ' + e.getMessage());
            	Vehicle_Inspection__c VI = new Vehicle_Inspection__c();
                insert VI;
            	return VI;
            }
        }
        else{
            return VIs[0];
        }
    }
    
   	@AuraEnabled
    public static Schema.Location initVehicle(Vehicle_Inspection__c VI) {
        try{
          	return [SELECT Id, Name FROM Location WHERE Id =: VI.Location__c LIMIT 1];
        } catch (Exception e){
            System.debug('Vehicle Error: ' + e.getMessage());
            return null;
        }
       
    }
    
    @AuraEnabled
    public static Vehicle_Inspection__c saveVehicle(String Vehicle, Vehicle_Inspection__c VI) {
        system.debug(Vehicle);
        if (Vehicle != null){
          	VI.Location__c = Vehicle;
        }
        else{
            VI.Location__c = null;
        }	
        try{
        	update VI;
        }
        catch (Exception e){
            System.debug('Vehicle Inspection Error: ' + e.getMessage());
        }
        	return VI;
    }
    
	@AuraEnabled
    public static void updateVI(Vehicle_Inspection__c VIRec) { 
        try{
        	update VIRec;  
        }
        catch (Exception e){
             System.debug('Vehicle Inspection Error: ' + e.getMessage());
        }
    }
    
   @AuraEnabled
    public static Boolean checkVI() {    
        Vehicle_Inspection__c VIRec = initVI();  
        if(VIRec.Submission_Date__c == null){
            return true;
        }
        else{
            return false;
        }
        
    }

   	@AuraEnabled
    public static String submitVI(Vehicle_Inspection__c VIRec) {   
        if((!VIRec.Adhered_to_tire_tread_depth_gauge_guide__c || !VIRec.Brakes_Passed_Pump_Test__c || !VIRec.Doors_Close_and_Lock__c || !VIRec.First_Aid_Kit_OK__c || !VIRec.Fluids_Levels_OK__c ||!VIRec.Horn_and_Back_up_Beeper_OK__c || !VIRec.Light_and_Indicators_OK__c || !VIRec.Mirrors_OK__c || !VIRec.No_Fluid_Leaks__c || !VIRec.Ownership_and_Insurance_Valid__c || !VIRec.Ladder_in_Good_Working_Order__c || VIRec.Spill_Kit_OK__c == 'No') && (VIRec.Vehicle_Inspection_Notes__c == null || VIRec.Vehicle_Inspection_Notes__c == '')){
            return Label.VIErrorMsg;
        }
        else if(VIRec.Location__c == null){
            return Label.VIErrorMsgVehicle;
        }
        else if(VIRec.Vehicle_License_Plate_Number__c == null || VIRec.Vehicle_License_Plate_Number__c.length()<6){
            return Label.VIErrorMsgLicense;
        }
        else{
        	VIRec.Submission_Date__c = Date.today();
            try{
        	update VIRec;    
            } catch (Exception e){
            System.debug('Vehicle Inspection Error: ' + e.getMessage());
       		 }
            return '';
        }
    }

    @AuraEnabled
    public static Map<String, String> getHelpText() {
        String helpText1 = Vehicle_Inspection__c.Ladder_in_Good_Working_order__c.getDescribe().getInlineHelpText();
        String helpText2 = Vehicle_Inspection__c.Adhered_to_tire_tread_depth_gauge_guide__c.getDescribe().getInlineHelpText();
        Map<String, String> mapStr = new Map<String, String>{'Ladder_in_Good_Working_order__c' => helpText1};
        mapStr.put('Adhered_to_tire_tread_depth_gauge_guide__c',helpText2);

        System.debug('Darcy mapStr: ' + mapStr);
        return mapStr;
    }
    
}