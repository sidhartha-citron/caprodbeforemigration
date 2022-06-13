global class ComplexReports implements Database.Batchable<sObject>, Database.Stateful {

     
    WorkOrderLineItem[] woliList = new list<WorkOrderLineItem>(); 
	Datetime myDate = Datetime.newInstance(2018, 01, 1, 12, 00, 00);
	Datetime upsertDate = Datetime.newInstance(2019, 02, 15, 12, 00, 00);
    Datetime sdate = Datetime.newInstance(2018, 01, 1, 12, 00, 00);
    date goUnactive=system.today();
	workorder[] wo= new list<workorder>();
	orderitem [] oliList= new list<orderitem>();
	integer int1=0;
    integer unactivedays=0;
	ComplexReports__c[] crlist = new list<ComplexReports__c>();
	integer No_Days=0;
    integer activedays=0;
	list <string> wono= new list<string>();
	Map<String, Integer> wonoUnique= new Map<string, Integer>();
    list<workorderlineitem> woli= new list<workorderlineitem>();
    list<orderitemhistory> oli_his= new list<orderitemhistory>();
    list<orderitemhistory> oli_his_active= new list<orderitemhistory>();
	Boolean IsSeasonal=false;
   	integer int0=0;
    integer j=0;
    integer oli_hisSize=0;
    string oldvalue;
    string newvalue;
    datetime hiscreateddate;
    list<date> sys= new list<date>();
    list<datetime> createdat= new list<datetime>();
    string hisvalue;
    orderitemhistory his= new orderitemhistory();
    list<datetime> seasonstart=new list<datetime>();
    list<datetime> seasonend= new list<datetime>();
    list<datetime> Upsertdates= new list<datetime>();
    
 // Batch job start method
    global Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator (
           'select id from orderitem  where ( Active__c=true AND orderitem.order.isValid__c=TRUE AND orderitem.Order.Account.isValid__c=TRUE AND orderitem.order.Emergency__c=FALSE  ) '
            ); 
   }
   
    global void execute(Database.BatchableContext bc, List<orderitem> scope){ 
        list<Id> orderitems = new list<Id>();
        
       for(Orderitem oi : (List<Orderitem>) scope){
            orderitems.add(oi.Id);
        }     
        AnalyseOrderItem(orderitems);
    }
    
    global void AnalyseOrderItem(list<Id> orderitems) {
 
        //For loop for orderitems   
     
 	for(orderitem oli: [select orderitem.order.ordernumber, orderitem.order.account.AccPac_Account__c, orderitem.order.account.name, Product_name__c, 
                    frequency__c, Line_of_Business__c, Last_Automation_created_date__c,frequencyindays__c, createddate, orderitem.order.Season_Start_Date__c, 
                    orderitem.order.effectivedate, orderitem.order.isvalid__c, orderitem.order.account.shipping_Address__c , orderitem.order.Season_End_Date__c, lastmodifieddate, id, OrderItemNumber 
                    from orderitem  where (  orderitem.order.isValid__c=TRUE AND 
                    orderitem.Order.Account.isValid__c=TRUE AND orderitem.order.Emergency__c=FALSE AND id IN : orderitems) ] ){
   //system.debug('oli.createddate'+oli.createddate);
      	    woli=  [select id, workorderlineitem.workorder.status, createddate, 
                  workorderlineitem.workorder.createddate, workorderlineitem.workorder.ServiceTerritory.address, workorderlineitem.workorder.type__c, 
    	  		  workorderlineitem.workorder.workordernumber, workorderlineitem.workorder.Completed_Date__c from workorderlineitem
                  where((workorderlineitem.workorder.type__c='service' or workorderlineitem.workorder.type__c='delivery'
                  or workorderlineitem.workorder.type__c='installation')AND (workorderlineitem.workorder.status!='new'
                  or workorderlineitem.workorder.status!='Cannot Complete' )and workorderlineitem.order_product__c=:oli.id) ] ;
    // History or orderproduct                    
            oli_his=[select id, CreatedDate, Field, OldValue, NewValue FROM OrderItemHistory where (field='frequency__c'  and orderitemid=:oli.id) ];
            oli_his_active=[select id, CreatedDate, Field, OldValue, NewValue FROM OrderItemHistory where (field='active__c'  and orderitemid=:oli.id) ];            

   // system.debug('oli' + oli.id + oli.order.isvalid__c);
           
         //system.debug('oli   ' + oli.id+'  ' + oli.order.isvalid__c);
    if(woli.size()==0){ No_days=0;}
    if(woli.size() >0){
    system.debug('oli' + oli.id + oli.order.isvalid__c);
       
  // For Loop on workorderline items to put them in a list and sort
         
    for(workorderlineitem wol : woli ){
         
        if(wol.workorder.type__c=='installation' && wol.workorder.Completed_Date__c!=null)
        {sdate= oli.CreatedDate;
        // system.debug('oli.createddate'+oli.createddate);
        }
         else{
             sdate=oli.CreatedDate;
         }
       if(wol.workorder.status !='new' && wol.workorder.status !='Cannot Complete' && wol.workorder.status !='Dispatched'){
        //system.debug('workorder number' + woli.workorder.id);
        wono.add(wol.workorder.workordernumber);
          //  system.debug('Status = ' + woli.workorder.status);
    }
   }
    
    wono.sort();
        
     }//else {sdate=oli.createddate;}
  // Nested for loop on workorderline items to get the number of Actual occurances of a workorder
    for(string key :wono){
        
        if(!wonoUnique.containsKey(key)){
            wonoUnique.put(key,0);
            
        }
        Integer countInt=wonoUnique.get(key)+1;
        wonoUnique.put(key,countInt);
       } 
  sdate=oli.CreatedDate;
 if(oli.order.season_start_date__c !=null){goUnactive=date.valueof(oli.order.season_end_date__c);}
  // check for the active deactive history only one time
 if(oli_his_active.size()>0){ for(orderitemhistory ah:oli_his_active){if(ah.OldValue==false){goUnactive=date.valueof(ah.CreatedDate);}if (ah.oldvalue==true ) {unactivedays=(Date.ValueOf(ah.createddate)).daysBetween((goUnactive));}}}  
  
    oli_hisSize=oli_his.size();
 //To caluculate change of frequency from the history
                        
if(oli_hisSize>0){
    j=2;
    
   for(orderitemhistory hi: oli_his){
   oldvalue= (string)hi.OldValue;
   newvalue=(string)hi.NewValue;
   hiscreateddate= hi.CreatedDate ;
   system.debug('hiscreateddate = ' +hiscreateddate);}
}
        else{j=1;}                    
                 

         for(integer i=0; i < j; i++){
             
       // system.debug('New Value ' + his.newvalue +' Oldvalue '+ his.oldvalue +'  createddate ='+ his.createddate);
    //**************caclulate for No_days after freq change**************
   // calculate the Expected Occurance from the created date of Orderitems (to be modified)
   // Check for Seasonal Order
  
    if(oli_hisSize==0){sys.add(system.today());
    createdat.add(sdate);
    hisvalue=oli.Frequency__c;
    seasonstart.add(oli.order.season_start_date__c);
    seasonend.add(oli.order.season_end_date__c);
    upsertdates.add(upsertdate);}
             
   if(oli_hisSize>0 && i==0){
   createdat.add(sdate);
   sys.add(Date.valueof(hiscreateddate));
   hisvalue=OldValue; 
   seasonstart.add(oli.order.season_start_date__c);
   seasonend.add(hiscreateddate);
   upsertdates.add(upsertdate);} 

    else if(oli_hisSize>0 && i==1){ 
    createdat.add(hiscreateddate); 
    sys.add(system.today());
    hisvalue=NewValue;   
    seasonstart.add(hiscreateddate);
    seasonend.add(oli.order.season_end_date__c);
    upsertdates.add(hiscreateddate);}
   
      if(oli.order.season_start_date__c !=null){
             IsSeasonal=True;
             // system.debug('season start date ' + oli.order.season_start_date__c);
             // system.debug('season end date ' + oli.order.season_end_date__c);
   //if season_start_date and season_end_date is less than today.date  
             if(oli.order.season_start_date__c <system.today() && oli.order.season_end_date__c<system.today()){
             No_Days=(Date.ValueOf(seasonstart[i])).daysBetween(Date.ValueOf(seasonend[i]));
             //system.debug('No_days 1' +No_days);
                }
             
 //if season_start_Date is less than today and season end date is greater than today
              if(oli.order.season_start_date__c <system.today() && oli.order.season_end_date__c>system.today()){
                  integer No_Days2=0;
             // if oli.createddate is greater than season start date
                  if(sdate>oli.order.season_start_date__c){
                 No_Days2=(Date.ValueOf(createdat[i])).daysBetween(sys[i]);
               // System.debug('No_days2   ' + no_days2);
                  }
                  else if (sdate<oli.order.season_start_date__c){
                       No_Days2=(Date.ValueOf(seasonstart[i])).daysBetween(sys[i]);
                  
                  }
                  
                   if(sdate<oli.order.season_end_date__c.addyears(-1) ){
                      if(oli.order.season_end_date__c.addyears(-1)>system.today()){
                          No_Days=(Date.ValueOf(createdat[i])).daysBetween(sys[i])+ No_days2;
                      }
                      else if(oli.order.season_end_date__c.addyears(-1)<system.today()){
                          No_Days=(Date.ValueOf(createdat[i])).daysBetween(Date.ValueOf(seasonend[i].addyears(-1))) +No_days2;
                      }
                      
                  }
                  else if(sdate>oli.order.season_end_date__c.addyears(-1) )
                  {No_Days=No_days2;
                
              } }
 
               
          // season start date is greater than today
              if(oli.order.season_start_date__c >system.today()){         
                // end date year is equal to this year(No activity previous year)
                  if (oli.order.season_end_date__c.year()==system.today().year()){
                      No_days=0;   
                  }
               else if (oli.order.season_end_date__c.year()>system.today().year()){
                   if(oli.order.season_end_date__c.addyears(-1)<=system.today()){
                       No_Days=(Date.ValueOf(upsertdates[i])).daysBetween(Date.ValueOf(seasonend[i]));    }
                   else if(oli.order.season_end_date__c.addyears(-1)>system.today()){
                        No_Days=(Date.ValueOf(upsertdates[i])).daysBetween(Date.ValueOf(sys[i].addyears(1))); 
                   }
                   else if(oli.order.season_start_date__c.year()>system.today().year()){
                       No_Days=(Date.ValueOf(seasonstart[i])).daysBetween(Date.ValueOf(seasonend[i]));    
                   }
               }
             }
         }
                
         else{
             No_Days=(Date.ValueOf(createdat[i])).daysBetween(sys[i]);
            system.debug('oli.createddate  '+sdate);
           }
 //  system.debug('No of days 4 '+ No_Days);
   no_days=no_days-Unactivedays;    
                     
  //  system.debug('frequency =' + hisvalue);
    if(his.newvalue=='One-Time'){
        int1=0;
      //  system.debug('Expected Occurance= '+ int1 );
    }
    else  if(hisvalue=='Weekly'){
       int1=No_Days/7;
       //system.debug('Expected Occurance= '+ int1 );
    }
    else  if(hisvalue=='Fixed Weekly'){
       int1=No_Days/7;
       //system.debug('Expected Occurance= '+ int1 );
    }
    else  if(hisvalue=='Twice Monthly' ){
        int1=No_Days/15;
        //system.debug('Expected Occurance= '+ int1 );
    } else  if(hisvalue=='14 Days' ){
        int1=No_Days/14;
       // system.debug('Expected Occurance= '+ int1 );
    }
             else  if(hisvalue=='28 Days'){
      int1=No_Days/28;
      // system.debug('Expected Occurance= '+ int1 );
    }
             else  if(hisvalue=='120 Days'){
      int1=No_Days/120;
      // system.debug('Expected Occurance= '+ int1 );
    } else  if(hisvalue=='Semi-Annually'){
      int1=No_Days/182;
      // system.debug('Expected Occurance= '+ int1 );
    }
             else  if(hisvalue=='Quarterly'){
      int1=No_Days/90;
      // system.debug('Expected Occurance= '+ int1 );
    }
             else  if(hisvalue=='Annually'){
      int1=No_Days/365;
      // system.debug('Expected Occurance= '+ int1 );
    }
    else  if(hisvalue=='Monthly'){
      int1=No_Days/30;
      // system.debug('Expected Occurance= '+ int1 );
    }
   
    
    else  if(hisvalue=='Bi-Monthly' ){
    
   		 int1=No_Days/60;
      //system.debug('Expected Occurance= '+ int1 );
    }
    int0+=int1;
    int1=0;
           
    
    }
    //Simple No_days calculation
      integer size=wonounique.size();
    
     ComplexReports__c cr= new ComplexReports__c(AccountName__c=oli.order.account.name,
                                                 AccpacAcountNo__c= oli.order.account.AccPac_Account__c, 
                                                 ExpectedOccurance__c=int0,
                                                 OrderNumber__c=oli.order.ordernumber, 
                                                 Actual_Occurance__c=size,
                                                 frequency__c=oli.frequency__c,
                                                 Date_Created__c= oli.createddate,
                                                 Product_Name__c=oli.Product_Name__c,
                                                 Product_Number__c=oli.OrderItemNumber,
                                                 Product_Id__c=oli.Id,
                                                 Product_Last_Service_Date__c=oli.Last_Automation_Created_Date__c,
                                                 Line_of_business__c=oli.Line_of_Business__c,
                                                 Seasonal_order__c= Isseasonal,
                                                 Season_start__c= oli.order.season_start_date__c,
                                                 Season_end__c= oli.order.season_end_date__c,
                                                 Shipping_Address__c=oli.order.account.shipping_Address__c 
                                                  );
 	 crList.add(cr);   
    //system.debug(cr); */
    // system.debug('Actual Occurances = ' + size);
    wonoUnique.clear();
    wono.clear();
    IsSeasonal=false;
    orderitems.clear();
    Int0=0; 
    sys.clear();
    createdat.clear();
    seasonstart.clear();
    seasonend.clear();
    upsertdates.clear();
    oli_his_active.clear();
    unactivedays=0;
    oli_his.clear();
    no_days=0;
    
    
   }//FirstForLoop ends
  
	insert crList; 
   crList.clear();      
        
 }  // Method AnalyseOrderItems End
        
    global void finish(Database.BatchableContext bc){
     
        AsyncApexJob job = [SELECT Id, Status, NumberOfErrors, 
            JobItemsProcessed,
            TotalJobItems, CreatedBy.Email
            FROM AsyncApexJob
            WHERE Id = :bc.getJobId()];
        //system.debug('AsyncApexJog' + job);
       
    }
}