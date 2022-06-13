/*
    @Purpose : To generate WOGSL records on a daily basis and compare the start date of these WOGSL with 
              Work Orders.
    @Author  : Aieleeta      
*/
/*****************************************************NEW NEW NEW****************************/

public class CreateWorkOrderGenerationStatus{
    
    public static void CreateGenerationStatus(List<OrderItem> orderItemList){
        
        Integer noOfWogsl; // to hold the count of wogsl to be created
        List<Work_Order_Generation_Status__c> listCreateWOGSL = new List<Work_Order_Generation_Status__c>();

        /**** PART 1 : For all the incoming OrderItem, create the number of WOGSL based on Frequency*****/
        for(OrderItem oItem : orderItemList)
        {   
           system.debug('aaaaaaaaaaaa');
           Date ExpectedDate;
            // Taking the bigger of LACD / LIFD
            Date lastServicedDate = (oItem.Last_Automation_Created_Date__c > oItem.Last_InFlight_WO_Date__c)? oItem.Last_Automation_Created_Date__c :oItem.Last_InFlight_WO_Date__c ;           
            // Date to hold LSD+Frequency+Swing. This date will decide whethere Order Product will be considered or not
            if(lastServicedDate != null){
                ExpectedDate = lastServicedDate.addDays((oItem.FrequencyInDays__c).intValue());
                system.debug('bbbbbbbbb'+ ExpectedDate);
            }
                if(ExpectedDate != null){
                    system.debug('cccccccccccccccc');
                    if( ExpectedDate < System.Today().addDays(20)){
                        system.debug('ddddddddddd');
                        if(oItem.Frequency__c != null ){
                            system.debug('eeeeeeeeeeee');
                            if(oItem.FrequencyInDays__c >0){
                                noOfWogsl = GetCountofWOGSL(oItem.FrequencyInDays__c.intValue(),oItem);
                                system.debug('ffffffffff' + noOfWogsl);
                            }
                            if(noOfWogsl > 0){ // If WOGSL needs to be created
                                listCreateWOGSL.addAll(CreateWorkOrderGenerationStatusList(noOfWogsl,oItem,oItem.Order.AccountId)); // Create WOGSL via CreateWorkOrderGenerationStatusList()
                                system.debug('gggggggggg' + listCreateWOGSL);
                            }
                        }else{
                            continue;
                        }   
                    }
                }else{
                    continue;
                }
       
        }
        if(listCreateWOGSL.size() > 0){
            system.debug('hhhhhhhhhhhhh');
            //database.insert(listCreateWOGSL,false); // insert WOGSL.
            Database.SaveResult[] insertWOGS = Database.insert(listCreateWOGSL, false);
            system.debug('111111111111' + insertWOGS);
        }

    }
        /** METHOD TO CREATE WOGSL***/
    public static List<Work_Order_Generation_Status__c> CreateWorkOrderGenerationStatusList (Integer noOfWOGSL,OrderItem oItem, Id AccountId){
        system.debug('iiiiiiiiiiii');
        List<Work_Order_Generation_Status__c> listWorkOrderGenerationStatus = new List<Work_Order_Generation_Status__c>();
        List<Integer> listSwingNumber = new List<Integer>();
        listSwingNumber = GetFrequencySwing(oItem.Frequency__c,oItem.Line_of_Business__c);
        //Greater of LACD/LIFD
        Date lastServicedDate = (oItem.Last_Automation_Created_Date__c > oItem.Last_InFlight_WO_Date__c)? oItem.Last_Automation_Created_Date__c :oItem.Last_InFlight_WO_Date__c ; 
        // Date to hold LSD+Frequency+Swing. This date will decide whethere Order Product will be considered or not
        Date ExpectedDate = lastServicedDate.addDays((-listSwingNumber[0]) + ((oItem.FrequencyInDays__c).intValue()));
        Date CurrentDate = System.today();
        Map<Id,Id> mapOrderProductToAccount = new Map<Id,Id>();
        Map<Id,List<Boolean>> mapAccountDetails = new Map<Id,List<Boolean>>();
        
        if(listSwingNumber.size()>0 && ExpectedDate != null){
            system.debug('jjjjjjjjjjjjj' + ExpectedDate);
            for(Account a : [Select Inactive__c,On_Hold__c from Account where id =: AccountId]){
                mapAccountDetails.put(a.id,new List<Boolean>{a.On_Hold__c,a.Inactive__c});
                system.debug('kkkkkkkkkkkk' + mapAccountDetails);
            }
            for(integer i = 1; i <= noOfWOGSL; i++){
                    system.debug('lllllllllllllll');
                    Date ExpectedWOStartDate;
                    if(ExpectedDate < System.Today()){
                        ExpectedWOStartDate = (i == 1) ? CurrentDate : (CurrentDate.addDays((-listSwingNumber[0]) +(((oItem.FrequencyInDays__c).intValue())*(i-1))));
                    }else{
                        ExpectedWOStartDate = lastServicedDate.addDays((-listSwingNumber[0])+ (((oItem.FrequencyInDays__c).intValue())*(i)));
                    }
                    system.debug('mmmmmmmmmmmmmm' + ExpectedWOStartDate);
                    Work_Order_Generation_Status__c wogsl = new Work_Order_Generation_Status__c(
                                                                Order_Product__c = oItem.Id,
                                                                Order__c = oItem.OrderId,
                                                                Expected_WO_Start_Date__c = ExpectedWOStartDate,
                                                                Last_InFlight_WO_Date_stamp__c = String.valueOf(oItem.Last_InFlight_WO_Date__c),
                                                                Last_Automation_Created_Date_stamp__c = String.valueOf(oItem.Last_Automation_Created_Date__c),
                                                                Order_Status_Stamp__c = String.valueOf(oItem.Order.Status),
                                                                Order_Account_On_Hold__c = String.valueOf(mapAccountDetails.get(AccountId)[0]),
                                                                Order_Account_Inactive__c = String.valueOf(mapAccountDetails.get(AccountId)[1]),
                                                                Order_Product_Installation_Status__c = oItem.Installation_Status__c,
                                                                Order_Product_Valid_for_Install_Replace__c = String.valueOf(oItem.Valid_for_Install_Remove_Replace__c),
                                                                Order_Product_Active__c = String.valueOf(oItem.Active__c),
                                                                Order_Product_IsActive__c = String.valueOf(oItem.IsActive__c),
                                                                Order_Product_Inventory_Allocated__c = String.valueOf(oItem.Inventory_Allocated__c),
                                                                Order_Inventory_Allocated__c = String.valueOf(oItem.Order.Inventory_Allocated__c)
                                                                //Order_Product_Allowable_Frequency__c = oItem.Product2.Allowable_Frequencies__c
                                                                );
                                            
                    listWorkOrderGenerationStatus.add(wogsl);      
                    system.debug('nnnnnnnnnnnnnn' + listWorkOrderGenerationStatus);
            }
            
        }
        return listWorkOrderGenerationStatus; 
    }  
    
    
    /** METHOD TO GET THE COUNT OF WOGSL**/
    public static Integer GetCountofWOGSL(Integer frequency,OrderItem oItem){
        //Greater of LACD/LIFD
        Date lastServicedDate = (oItem.Last_Automation_Created_Date__c > oItem.Last_InFlight_WO_Date__c)? oItem.Last_Automation_Created_Date__c :oItem.Last_InFlight_WO_Date__c ; 
        List<Integer> listSwingNumber = new List<Integer>(); 
        listSwingNumber = GetFrequencySwing(oItem.Frequency__c,oItem.Line_of_Business__c);  
        // Date to hold LSD+Frequency+Swing. This date will decide whethere Order Product will be considered or not
        Date ExpectedDate = lastServicedDate.addDays((oItem.FrequencyInDays__c).intValue());
        //Final Date to decide number of WOGSL.
        Date FinalDateToDetermineCountWOGSL;
        Integer noOfWOGSL; // Integer to hold count of WOGS
        if(ExpectedDate < System.Today()){
            FinalDateToDetermineCountWOGSL = System.Today();
        }else{
            FinalDateToDetermineCountWOGSL = ExpectedDate;
        }       
        system.debug('oooooooooooooooo' + FinalDateToDetermineCountWOGSL);
        if(oItem.Last_InFlight_WO_Date__c > oItem.Last_Automation_Created_Date__c && !(oItem.Last_InFlight_WO_Date__c < System.Today())){
            noOfWOGSL = math.abs((System.Today().addDays(19).daysBetween(FinalDateToDetermineCountWOGSL))/frequency )+ 2;
        }else{
            noOfWOGSL = math.abs((System.Today().addDays(19).daysBetween(FinalDateToDetermineCountWOGSL))/frequency )+ 1;
        }   
        system.debug('ppppppppppppp' + noOfWOGSL);      
        return noOfWOGSL;    
    } 
    
    /** method to get frequency**/
    public static List<Integer> GetFrequencySwing(String frequency, String lob){
        Map<string, frequency__c> mapFrequencySwing = new map<string, frequency__c>();
        mapFrequencySwing = Frequency__c.getAll();
        if(lob == null){
            return null;
        } else if(lob == 'Chemical'){
            Frequency__c f = mapFrequencySwing.get(frequency);
            return new List<Integer>{(Integer)f.Chemical_Minus_Days__c, (Integer)f.Chemical_Plus_Days__c};  
        } else if(lob == 'Life Safety'){
            Frequency__c f = mapFrequencySwing.get(frequency);
            return new List<Integer>{ (Integer)f.Life_Safety_Minus_Days__c, (Integer)f.Life_Safety_Plus_Days__c };
        }else if(lob == 'Pest Control'){
            Frequency__c f = mapFrequencySwing.get(frequency);
            return new List<Integer>{ (Integer)f.Pest_Minus_Days__c, (Integer)f.Pest_Plus_Days__c };
        }else if (lob == 'Hygiene') {
            Frequency__c f = mapFrequencySwing.get(frequency);
            return new List<Integer>{ (Integer)f.Hygiene_Minus_Days__c, (Integer)f.Hygiene_Plus_Days__c };
        }else {
            return null;
        }
    }
}