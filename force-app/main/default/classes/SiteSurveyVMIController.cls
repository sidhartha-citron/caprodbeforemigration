public class SiteSurveyVMIController {
    
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
    
    public class vmiFlaggedProduct {
        @AuraEnabled
        public Boolean isChecked { get; set; }
        @AuraEnabled
        public String name { get; set; }
        @AuraEnabled
        public Decimal parLevel { get; set; }
        @AuraEnabled
        public String notes { get; set; }
        @AuraEnabled
        public String prodId { get; set; }
        @AuraEnabled
        public String family { get; set; }
        @AuraEnabled
        public Boolean hasFamilyChanged { get; set; }
        
        public vmiFlaggedProduct(Boolean isChecked, String name, Decimal parLevel, String notes, String prodId, String family) {
            this.isChecked = isChecked;
            this.name = name;
            this.parLevel = parLevel;
            this.notes = notes;
            this.prodId = prodId;
            this.family = family;
            this.hasFamilyChanged = false;
        }
    }
    
    @AuraEnabled
    public static List<VMI_Product__c> getVMIProducts(Id siteSurveyId) {
        
        List<VMI_Product__c> records = new List<VMI_Product__c>(); 
        String AcctId = [SELECT Account__c FROM Site_Survey__c WHERE Id=:siteSurveyId LIMIT 1].Account__c; 
        System.debug('ACCOUNTID: ' + AcctId);
        try {
            records = [SELECT Id, Par_Level__c, Product__r.Name, Notes__c, Account__c, Product__c
                       FROM VMI_Product__c WHERE Account__c=:AcctId];
            
            return records;
        } catch(Exception e) {
            System.debug(e.getLineNumber() + ' -- ' +e.getMessage());
            return null;
        }
    }
    
    @AuraEnabled
    public static List<vmiFlaggedProduct> getVMIFlaggedProducts(List<VMI_Product__c> vmiProds){
        List<vmiFlaggedProduct> returnedVMIFlaggedProds = new List<vmiFlaggedProduct>();
        List<Product2> vmiFlaggedProds = [SELECT Id, Name, Family FROM Product2 WHERE VMI_Product__c = true];
        
        /* case 21536 - sort by LoB [dk] */
        
        List<LineOfBusinessComparable> compares = new List<LineOfBusinessComparable>();
        
        for (Product2 vmiFlaggedProd : vmiFlaggedProds){
            compares.add(new LineOfBusinessComparable(vmiFlaggedProd));
        }
        
        compares.sort();
        
        String previousFamily = '';
        
        for (LineOfBusinessComparable comparable : compares) {
            Product2 comparedProd = comparable.prod;
            System.debug('compared');
            vmiFlaggedProduct tempProd = new vmiFlaggedProduct(false, comparedProd.Name, null, '', comparedProd.Id, comparedProd.Family);
            for (VMI_Product__c vmiProd : vmiProds){
                if (vmiProd.Product__c == comparedProd.Id){
                    tempProd.isChecked = true;
                    tempProd.parLevel = vmiProd.Par_Level__c;
                    tempProd.notes = vmiProd.Notes__c;
                }
            }
            if (previousFamily != comparedProd.Family) {
                tempProd.hasFamilyChanged = true;
                previousFamily = comparedProd.Family;
            }
            
            System.debug('CHANGED? ' + tempProd.hasFamilyChanged + '; PREVIOUS: ' + previousFamily);
            returnedVMIFlaggedProds.add(tempProd);
        }
        
        return returnedVMIFlaggedProds;
    }
    
    @AuraEnabled
    public static void saveNewProduct(VMI_Product__c record){
       if(record.Par_Level__c == null || record.Par_Level__c < 1) { 
                 AuraHandledException ex = new AuraHandledException('EXC');
                 throw ex;
        }
        try {
            upsert record;
        } catch(Exception e) {
            System.debug(e.getLineNumber() + ' -- ' +e.getMessage()); 
        }
    }
    
    @AuraEnabled
    public static void deleteSingleVMI(VMI_Product__c record){
        try {
        	delete record;
        } catch(Exception e) {
            System.debug(e.getLineNumber() + ' -- ' +e.getMessage()); 
        }           
    }
    
    @AuraEnabled
    public static List<VMI_Product__c> saveNewVMIProduct(String records, List<VMI_Product__c> existingVMIs, Id siteSurveyId) {
         String AcctId = [SELECT Account__c FROM Site_Survey__c WHERE Id=:siteSurveyId LIMIT 1].Account__c; 
         List<vmiFlaggedProduct> vmiFlaggedRecs = (List<vmiFlaggedProduct>)json.deserialize(records, List<vmiFlaggedProduct>.class); 
         System.debug(records);
         System.debug(existingVMIs);	
         System.debug(siteSurveyId);
         List<VMI_Product__c> recordsToUpsert = new List<VMI_Product__c>();
         List<VMI_Product__c> recordsToDelete = new List<VMI_Product__c>();
         for (vmiFlaggedProduct vmiFlaggedRec : vmiFlaggedRecs){
            if (vmiFlaggedRec.isChecked == true){
                if (vmiFlaggedRec.parLevel == null || vmiFlaggedRec.parLevel < 1){
                 System.debug(vmiFlaggedRec.parLevel);
                 AuraHandledException ex = new AuraHandledException('EXC');
                 throw ex;
             	}
              	VMI_Product__c tempVMI = new VMI_Product__c(Par_Level__c = vmiFlaggedRec.parLevel, Notes__c = vmiFlaggedRec.notes, Product__c = vmiFlaggedRec.prodId, Account__c = AcctId);
                for (VMI_Product__c existingVMI : existingVMIs){
                    if (existingVMI.Product__c == vmiFlaggedRec.prodId){
                        tempVMI.Id = existingVMI.Id;
                    }
                }
                recordsToUpsert.add(tempVMI);
            }
             else{
                 for (VMI_Product__c existingVMI : existingVMIs){
                    if (existingVMI.Product__c == vmiFlaggedRec.prodId){
                        recordsToDelete.add(existingVMI);
                    }                     
             	  }
             }
    	}
        try{
        upsert recordsToUpsert;
        delete recordsToDelete;
        } catch(Exception e) {
            System.debug(e.getLineNumber() + ' -- ' +e.getMessage()); 
        }
        return [SELECT Id, Par_Level__c, Product__r.Name, Notes__c, Account__c, Product__c
                       FROM VMI_Product__c WHERE Account__c=:AcctId];
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
    
}