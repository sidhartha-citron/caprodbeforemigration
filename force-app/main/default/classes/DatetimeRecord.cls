global class DatetimeRecord {
    private static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    public Datetime startDate { get; set; }
    public Datetime endDate { get; set; }
    public Boolean emergency { get; set; }
    public Boolean hasPestControlMonthly { get; set; }
    public OperatingHours opHours {get; set;}
    //public Field_Service_Settings__c dataSets { get; set; }
    
    global DatetimeRecord(){
        //dataSets = Field_Service_Settings__c.getOrgDefaults();
    }
    
    global DatetimeRecord (Datetime startDate, Datetime endDate) {
        //dataSets = Field_Service_Settings__c.getOrgDefaults();
        this.startDate = startDate;
        this.endDate = endDate;
    }
    
    global DatetimeRecord (Datetime startDate, Datetime endDate, Boolean emergency, Boolean hasPestControlMonthly, OperatingHours opHours) {
        //dataSets = Field_Service_Settings__c.getOrgDefaults();
        this.startDate = startDate;
        this.endDate = endDate;
        this.emergency = emergency;
        this.hasPestControlMonthly = hasPestControlMonthly;
        this.opHours = opHours;
    }
    
    global static DatetimeRecord getWODates(DatetimeRecord woDates, Datetime todaysDate) {
        
        Time currentTime = todaysDate.time();
        System.debug('>>StartDate From WO Before Calculations: ' + woDates.startDate);
        System.debug('>>EndDate From WO Before Calculations: ' + woDates.endDate);
        //System.debug('>>OperatingHours ' + woDates.opHours);
        Map<String, List<TimeSlot>> timeSlotMap = new Map<String, List<TimeSlot>>();
        
        Timezone tz = Timezone.getTimeZone(woDates.opHours.TimeZone);
        Integer offsetHours = tz.getOffset(woDates.startDate)/3600000;
        //System.debug('TimeZone: ' + tz.getDisplayName() + ' Offset In Hours WRT GMT: ' + offsetHours);
        
        //Datetime startDate =  Datetime.newInstance(woDates.startDate.year(), woDates.startDate.month(), woDates.startDate.day(), 00, 00, 00);
        //Datetime endDate = Datetime.newInstance(woDates.endDate.year(), woDates.endDate.month(), woDates.endDate.day(), 23, 59, 59);
        Datetime startDate = woDates.startDate;
        Datetime endDate = woDates.endDate;
        
        Integer startDay = startDate.day();
        Integer endDay = endDate.day();
        
        //System.debug('>>StartDate From WO Before Operating Hours Logic: ' + woDates.startDate);
        //System.debug('>>EndDate From WO Before Operating Hours Logic: ' + woDates.endDate);
        if (woDates.opHours != null) {
            Time startTime = Time.newInstance(00, 00, 00, 00);
            Time endTime = Time.newInstance(23, 59, 59, 59);
            
            for (TimeSlot ts : woDates.opHours.TimeSlots) {
                //validDaysOTW.add(ts.DayOfWeek);
                if(timeSlotMap.containsKey(ts.DayOfWeek)) {
                    timeSlotMap.get(ts.DayOfWeek).add(ts);
                }else {
                    timeSlotMap.put(ts.DayOfWeek, new List<TimeSlot>{ts});
                }
            }
            System.debug('**TimeSlot** ' + timeSlotMap);
            if(!timeSlotMap.isEmpty()) {
                if(woDates.emergency) {
                    if(startDate > todaysDate) {
                        Datetime nextDate = startDate.addDays(1);
                        for(Integer i=0; i<1; i++) { 
                            String key = startDate.format('EEEE');
                            //System.debug(key);
                            if(timeSlotMap.containsKey(key)) { 
                                i=2;
                            } else {
                                startDate = nextDate; 
                            }
                        } 
                        //startDate = startDate.addDays(1); 
                        String key = startDate.format('EEEE');
                        if(timeSlotMap.containsKey(key)) {
                            List<TimeSlot> validSlots = timeSlotMap.get(startDate.format('EEEE'));
                            //System.debug('**Valid Slot** ' + validSlots);
                            startTime = validSlots.get(0).StartTime;
                        } else {
                            startDate = startDate.addDays(-1);
                            List<String> startTimes = dataSets.Emergency_Service_Start_Time__c.split('\\:');
                            List<String> endTimes = dataSets.Emergency_Service_End_Time__c.split('\\:');
                            if(!startTimes.isEmpty()) {
                                Integer startMinute = startTimes.size() < 2 ? 00 : Integer.valueOf(startTimes.get(1));
                                startTime = Time.newInstance(Integer.valueOf(startTimes.get(0)), startMinute, 00, 00);
                            }
                            if(!endTimes.isEmpty()) {
                                Integer endMinute = endTimes.size() < 2 ? 00 : Integer.valueOf(endTimes.get(1));
                                endTime = Time.newInstance(Integer.valueOf(endTimes.get(0)), endMinute, 59, 59); 
                            }
                        }
                        //System.debug('**Future Emergency** Start Time: ' + startTime + ' **End Time** ' + endTime);
                    } else {
                        startTime = currentTime;
                        //System.debug('**Current Emergency** Start Time: ' + startTime + ' **End Time** ' + endTime);
                    }
                    endDate = startDate;
                }else {
                    startDate = nextValidDay(timeSlotMap.keySet(), startDate, woDates.hasPestControlMonthly, startDate.month());
                    endDate = nextValidDay(timeSlotMap.keySet(), endDate, woDates.hasPestControlMonthly, endDate.month());
                    String key1 = endDate.format('EEEE');
                    String key2 = startDate.format('EEEE');
                    if(timeSlotMap.containsKey(key1)) {
                        List<TimeSlot> validSlots = timeSlotMap.get(key1);
                        Integer listSize = validSlots.size();
                        //startTime = validSlots.get(0).StartTime;
                        endTime = validSlots.get(listSize-1).EndTime; 
                    }
                    if(timeSlotMap.containsKey(key2)) {
                        List<TimeSlot> validSlots = timeSlotMap.get(key2);
                        //Integer listSize = validSlots.size();
                        startTime = validSlots.get(0).StartTime;
                        //endTime = validSlots.get(listSize-1).EndTime; 
                    }
                    //System.debug('**Regular** Start Time: ' + startTime + ' **End Time** ' + endTime);
                }
            }
            if(startTime>=endTime || endTime==Time.newInstance(00,00,endTime.second(),endTime.millisecond())){
                //System.debug('**Start Time Greater**  **IsEmergency** ' + woDates.emergency + ' **Start Time** ' + startTime + ' **End Time** ' + endTime);
                endTime = Time.newInstance(23, 59, 59, 59);
                //endDate = endDate.addDays(1); 
                //endDate = Datetime.newInstance(endDate.year(), endDate.month(), endDate.day(), 23, 59, 59);
            }
            //System.debug('**Calculated Time Values**  **IsEmergency** ' + woDates.emergency + ' **Start Time** ' + startTime + ' **End Time** ' + endTime);
            //System.debug('**Date Values before Offset **WorkOrder** **IsEmergency** ' + woDates.emergency +' **StartDate** ' + startDate + ' **EndDate** ' + endDate);
            startDate =  Datetime.newInstanceGMT(startDate.year(), startDate.month(), startDate.day(), startTime.hour(), startTime.minute(), 00).addHours(-offsetHours);
            endDate = Datetime.newInstanceGMT(endDate.year(), endDate.month(), endDate.day(), endTime.hour(), endTime.minute(), 59).addHours(-offsetHours);
        }
        //System.debug('After offset and timezone **WorkOrder** **IsEmergency** ' + woDates.emergency +' **StartDate** ' + startDate + ' **EndDate** ' + endDate);
        DatetimeRecord returnDates = new DatetimeRecord(startDate, endDate);
        return returnDates;
    }
    
    global static DateTime nextValidDay (Set<String> validDaysOTW, Datetime dueDate, Boolean hasPestMonthly, Integer month) {
        
        if(!validDaysOTW.contains(dueDate.format('EEEE'))) {
            if(hasPestMonthly) {
                if(month==dueDate.month()) {
                    dueDate = nextValidDay(validDaysOTW, dueDate.addDays(1), hasPestMonthly, month);
                }else{
                    dueDate = prevValidDay(validDaysOTW, dueDate.addDays(-1), hasPestMonthly, month);
                }
                
                //dueDate = dueDate.addDays(-1) ;
                //return dueDate;
            } else {
                dueDate = nextValidDay(validDaysOTW, dueDate.addDays(1), hasPestMonthly, month);
            }
            
        }
        return dueDate;
    }
    
    global static DateTime prevValidDay (Set<String> validDaysOTW, Datetime dueDate, Boolean hasPestMonthly, Integer month) {
        
        if(!validDaysOTW.contains(dueDate.format('EEEE'))) {
            dueDate = prevValidDay(validDaysOTW, dueDate.addDays(-1), hasPestMonthly, month);
            
        }
        return dueDate;
    }

}