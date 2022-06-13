public class CollectServiceAppointmentIds{
    
 
   public String customIdsStr{get;set;}
   public List<String> listServiceApp{get;set;}
   public Integer count{get;set;}
   
   public CollectServiceAppointmentIds( ){    
       count = 0;
       Map<String,String> testmap = new Map<String,String>();
       String str ;
       List<String> returnedStrings = new List<String>();
       String countOfRecords;
           testmap = ApexPages.CurrentPage().getParameters();
           system.debug('aaaaaaaaaa'+testmap);
           for(String s : testmap.values()){
               returnedStrings.add(s);
           }
           system.debug('bbbbbbbbbb'+returnedStrings);
           countOfRecords = returnedStrings[1];           
           system.debug('cccccccccc'+countOfRecords);
           for(String s : countOfRecords.split(',')){
               count = count + 1;
           }
           if(count == 1){
               str = testmap.get('id');
           }else{
               str = testmap.get('services');
           }
            this.listServiceApp = str.split(',');

        customIdsStr = JSON.serialize(listServiceApp);
   }
      
}