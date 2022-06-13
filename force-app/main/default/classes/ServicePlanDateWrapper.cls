/**
 * @FileName: ServicePlanDateWrapper
 * @Description: Wrapper class for calculating and storing days of the week by occurrence over a specified period of
 *               months
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/29/2019      Created
 *-----------------------------------------------------------  
 */
public inherited sharing class ServicePlanDateWrapper {
    private static final Date KNOWN_SUNDAY = Date.newInstance(2017,1,1);

    private Map<Integer, DayWrapper> daysByNumber; // Map of specified day by integer value (ie. Sunday = 0)
    private Integer numberOfMonths; // Number of months being evaluated from a specified start date
    private Integer startingYear;
    private Integer startingMonth;

    /*
     * @Name        ServicePlanDateWrapper
     * @Description Constructor to map days by their integer value
     *              No months have been specified, so dates will be generated for 2 months by default (the current
     *              month, and next month)
     * @Author      Graeme Ward
     * @Params      N/A
     */
    public ServicePlanDateWrapper() {
        this(2, Date.today());
    }

    /*
     * @Name        ServicePlanDateWrapper
     * @Description Constructor to map days by their integer value over a specified period of months
     * @Author      Graeme Ward
     * @Params      numberOfMonths: number of months in the future for which to map days (includes current month)
     */
    public ServicePlanDateWrapper(Integer numberOfMonths) {
        this(numberOfMonths, Date.today());
    }

    /*
     * @Name        ServicePlanDateWrapper
     * @Description Constructor to map days by their integer value over a specified period of months
     * @Author      Graeme Ward
     * @Params      numberOfMonths: number of months from start date for which to map days
     *              startDate: The date used to determine the starting month and year
     */
    public ServicePlanDateWrapper(Integer numberOfMonths, Date startDate) {
        this.daysByNumber = new Map<Integer, DayWrapper>();
        this.numberOfMonths = numberOfMonths;
        this.startingYear = startDate.year();
        this.startingMonth = startDate.month();
        getDays();
    }

    /*
     * @Name        getDays
     * @Description Method to map days by their integer value (Sunday (0) - Saturday (6)) over a specified number of
     *              months
     * @Author      Graeme Ward
     * @Params      N/A
     * @Return      void
     */
    private void getDays() {
        for(Integer i = 0; i < 7; i++) {
            this.daysByNumber.put(i, new DayWrapper(i, numberOfMonths, startingYear, startingMonth));
        }
    }

    /*
     * @Name        DayWrapper
     * @Description Wrapper class to store all instances of a specified day and map instances of a specified day by
     *              occurrence within the evaluated months
     * @Author      Graeme Ward
     */
    private class DayWrapper {
        private List<Date> allDays;
        private Map<Integer, List<Date>> daysByOccurrence;

        /*
         * @Name        DayWrapper
         * @Description Constructor to get all instances of a specified day and map instances of a specified day by
         *              occurrence within the evaluated months
         * @Author      Graeme Ward
         * @Params      numberOfMonths: number of months in the future for which to map days (includes current month)
         */
        private DayWrapper(Integer dayInt, Integer numberOfMonths, Integer startingYear, Integer startingMonth) {
            this.allDays = new List<Date>();
            this.daysByOccurrence = new Map<Integer, List<Date>>();

            getDays(dayInt, numberOfMonths, startingYear, startingMonth);
        }

        /*
         * @Name        getDays
         * @Description Method to find and map all instances of a day within a period of months
         * @Author      Graeme Ward
         * @Params      dayInt: integer value of the day being fetched (ie. Sunday = 0)
         *              numberOfMonths: number of months in the future for which to map days from the starting month
         * @Return      void
         */
        private void getDays(Integer dayInt, Integer numberOfMonths, Integer startingYear, Integer startingMonth) {
            Date monthStart = Date.newInstance(startingYear, startingMonth, 1);
            Integer daysAfterSunday = Math.mod(KNOWN_SUNDAY.daysBetween(monthStart), 7);

            Date day = monthStart.addDays(dayInt - daysAfterSunday);

            if (day < monthStart) {
                day = day.addDays(7);
            }

            // get instances of the specified day within each month
            for(Integer i = 0; i < numberOfMonths; i++) {
                Integer count = 0;
                Date currentDate = monthStart.addMonths(i);

                while (day.month() == currentDate.month()) {
                    count ++;

                    // map the instance of the day by the occurrence
                    List<Date> occurrences = daysByOccurrence.get(count);

                    if(occurrences == null) {
                        occurrences = new List<Date>();
                    }

                    occurrences.add(day);
                    daysByOccurrence.put(count, occurrences);

                    // store all instances of the day
                    allDays.add(day);

                    // move to next instance of the day
                    day = day.addDays(7);
                }
            }
        }
    }

    /*
     * @Name        getServicePlanDays
     * @Description Method to find days within a specified period of months that correspond with a Schedule Type Code
     * @Author      Graeme Ward
     * @Params      scheduleCode: Schedule Type Code referenced by a Service Plan
     *              effectiveDate: The effective date of the service plan
     * @Return      List<Date>: List of days cached in this class that correspond to the Schedule Type Code
     */
    public List<Date> getServicePlanDays(String scheduleCode, Date effectiveDate) {
        return getServicePlanDays(scheduleCode, effectiveDate, null, null);
    }

    /*
     * @Name        getServicePlanDays
     * @Description Method to find days within a specified period of months that correspond with a Schedule Type Code
     * @Author      Graeme Ward
     * @Params      scheduleCode: Schedule Type Code referenced by a Service Plan
     *              effectiveDate: The effective date of the service plan
     *              startDate: The starting day for retrieving days corresponding to a Service Plan (if specified)
     * @Return      List<Date>: List of days cached in this class that correspond to the Schedule Type Code
     */
    public List<Date> getServicePlanDays(String scheduleCode, Date effectiveDate, Date startDate) {
        return getServicePlanDays(scheduleCode, effectiveDate, startDate, null);
    }

    /*
     * @Name        getServicePlanDays
     * @Description Method to find days within a specified period of months that correspond with a Schedule Type Code
     * @Author      Graeme Ward
     * @Params      scheduleCode: Schedule Type Code referenced by a Service Plan
     *              effectiveDate: the effective date on the service plan
     *              startDate: The starting day for retrieving days corresponding to a Service Plan (if specified)
     *              endDate: The end day for retrieving days corresponding to a Service Plan (if specified)
     * @Return      List<Date>: List of days cached in this class that correspond to the Schedule Type Code
     */
    public List<Date> getServicePlanDays(String scheduleCode, Date effectiveDate, Date startDate, Date endDate) {
        List<Date> days = new List<Date>();

        List<String> parsedScheduleCode = scheduleCode.split('-');

        switch on parsedScheduleCode[0] {
            // Weekly
            when 'W' {
                days = getWeeklyServicePlanDays(parsedScheduleCode, effectiveDate, startDate, endDate);
            }
            // Monthly
            when 'M' {
                days = getMonthlyServicePlanDays(parsedScheduleCode, effectiveDate, startDate, endDate);
            }
            // Bi-Monthly (every two months)
            when 'B' {
                days = getBiMonthlyServicePlanDays(parsedScheduleCode, effectiveDate, startDate, endDate);
            }
            // Quarterly
            when 'Q' {
                days = getQuarterlyServicePlanDays(parsedScheduleCode, effectiveDate, startDate, endDate);
            }
            // Semi-annually (two specified months)
            when 'S', 'SP' {
                days = getSpecifiedMonthServicePlanDays(parsedScheduleCode, effectiveDate, startDate, endDate);
            }
            // Interval
            when else {
                days = getIntervalServicePlanDays(parsedScheduleCode, effectiveDate, startDate, endDate);
            }
        }

        sortDays(days);

        return days;
    }

    /*
     * @Name        getWeeklyServicePlanDays
     * @Description Method to find days within a specified period of months that correspond with a weekly Schedule Type
     *              Code
     * @Author      Graeme Ward
     * @Params      parsedScheduleCode: Schedule Type Code parsed into a list
     *              effectiveDate: the effective date on the service plan
     *              startDate: The starting day for retrieving days corresponding to a Service Plan (if specified)
     *              endDate: The end day for retrieving days corresponding to a Service Plan (if specified)
     * @Return      List<Date>: List of days cached in this class that correspond to the Schedule Type Code
     */
    private List<Date> getWeeklyServicePlanDays(List<String> parsedScheduleCode, Date effectiveDate, Date startDate, Date endDate) {
        List<Date> days = getAllDays(parsedScheduleCode, 1);
        days = checkEffectiveDate(days, effectiveDate, startDate, endDate);

        return days;
    }

    /*
     * @Name        getMonthlyServicePlanDays
     * @Description Method to find days within a specified period of months that correspond with a monthly Schedule Type
     *              Code
     * @Author      Graeme Ward
     * @Params      parsedScheduleCode: Schedule Type Code parsed into a list
     *              effectiveDate: the effective date on the service plan
     *              startDate: The starting day for retrieving days corresponding to a Service Plan (if specified)
     *              endDate: The end day for retrieving days corresponding to a Service Plan (if specified)
     * @Return      List<Date>: List of days cached in this class that correspond to the Schedule Type Code
     */
    private List<Date> getMonthlyServicePlanDays(List<String> parsedScheduleCode, Date effectiveDate, Date startDate, Date endDate) {
        List<Date> days = getDayByOccurrences(parsedScheduleCode, 1);
        days = checkEffectiveDate(days, effectiveDate, startDate, endDate);

        return days;
    }

    /*
     * @Name        getWeeklyServicePlanDays
     * @Description Method to find days within a specified period of months that correspond with a bi-monthly Schedule Type
     *              Code
     * @Author      Graeme Ward
     * @Params      parsedScheduleCode: Schedule Type Code parsed into a list
     *              effectiveDate: the effective date on the service plan
     *              startDate: The starting day for retrieving days corresponding to a Service Plan (if specified)
     *              endDate: The end day for retrieving days corresponding to a Service Plan (if specified)
     * @Return      List<Date>: List of days cached in this class that correspond to the Schedule Type Code
     */
    private List<Date> getBiMonthlyServicePlanDays(List<String> parsedScheduleCode, Date effectiveDate, Date startDate, Date endDate) {
        List<Date> days = new List<Date>();

        List<Date> unfilteredDays = getDayByOccurrences(parsedScheduleCode, 2);

        for(Date day : unfilteredDays) {
            if(addDayInMonth(day, parsedScheduleCode) && checkEffectiveDate(day, effectiveDate, startDate, endDate)) {
                days.add(day);
            }
        }

        return days;
    }

    /*
     * @Name        getWeeklyServicePlanDays
     * @Description Method to find days within a specified period of months that correspond with a quarterly Schedule Type
     *              Code
     * @Author      Graeme Ward
     * @Params      parsedScheduleCode: Schedule Type Code parsed into a list
     *              effectiveDate: the effective date on the service plan
     *              startDate: The starting day for retrieving days corresponding to a Service Plan (if specified)
     *              endDate: The end day for retrieving days corresponding to a Service Plan (if specified)
     * @Return      List<Date>: List of days cached in this class that correspond to the Schedule Type Code
     */
    private List<Date> getQuarterlyServicePlanDays(List<String> parsedScheduleCode, Date effectiveDate, Date startDate, Date endDate) {
        List<Date> days = new List<Date>();

        List<Date> unfilteredDays = getDayByOccurrences(parsedScheduleCode, 2);

        for(Date day : unfilteredDays) {
            if(addDayInQuarter(day, parsedScheduleCode) && checkEffectiveDate(day, effectiveDate, startDate, endDate)) {
                days.add(day);
            }
        }

        return days;
    }

    /*
     * @Name        getTwiceAnnualServicePlanDays
     * @Description Method to find days within a specified period of months that correspond with a twice annual
     *              Schedule Type Code
     * @Author      Graeme Ward
     * @Params      parsedScheduleCode: Schedule Type Code parsed into a list
     *              effectiveDate: the effective date on the service plan
     *              startDate: The starting day for retrieving days corresponding to a Service Plan (if specified)
     *              endDate: The end day for retrieving days corresponding to a Service Plan (if specified)
     * @Return      List<Date>: List of days cached in this class that correspond to the Schedule Type Code
     */
    private List<Date> getSpecifiedMonthServicePlanDays(List<String> parsedScheduleCode, Date effectiveDate, Date startDate, Date endDate) {
        List<Date> days = new List<Date>();

        List<Date> unfilteredDays = getDayByOccurrences(parsedScheduleCode, 3);

        for(Date day : unfilteredDays) {
            if(addDayInSpecifiedMonths(day, parsedScheduleCode, 2) && checkEffectiveDate(day, effectiveDate, startDate, endDate)) {
                days.add(day);
            }
        }

        return days;
    }

    /*
     * @Name        getWeeklyServicePlanDays
     * @Description Method to find days within a specified period of months that correspond with an interval Schedule Type
     *              Code
     * @Author      Graeme Ward
     * @Params      parsedScheduleCode: Schedule Type Code parsed into a list
     *              effectiveDate: the effective date on the service plan
     *              startDate: The starting day for retrieving days corresponding to a Service Plan (if specified)
     *              endDate: The end day for retrieving days corresponding to a Service Plan (if specified)
     * @Return      List<Date>: List of days cached in this class that correspond to the Schedule Type Code
     */
    private List<Date> getIntervalServicePlanDays(List<String> parsedScheduleCode, Date effectiveDate, Date startDate, Date endDate) {
        List<Date> days = new List<Date>();

        Integer intervalLength = Integer.valueOf(parsedScheduleCode[0]); // Number of days between services (ie. 14, 28, 56, etc)
        Integer dayInt = Integer.valueOf(parsedScheduleCode[1]); // The integer value for the day being evaluated

        // Find the first instance of the specified day on or after the start date
        Integer daysAfterSunday = Math.mod(KNOWN_SUNDAY.daysBetween(effectiveDate), 7);
        Date firstInstance = effectiveDate.addDays(dayInt - daysAfterSunday);

        // While the first instance is prior to the start date, move forward one interval
        while (firstInstance < effectiveDate) {
            firstInstance = firstInstance.addDays(7);
        }

        // Create a day instance for the first day of the starting month
        Date monthStart = Date.newInstance(startingYear, startingMonth, 1);

        // Find the number of days between the month start and the most recent instance (on or before the month start)
        Integer daysAfterMostRecentInstance = Math.mod(firstInstance.daysBetween(monthStart), intervalLength);

        // current instance is the most recent instance after the first day of the starting month
        Date currentInstance = monthStart.addDays(-daysAfterMostRecentInstance);

        while(currentInstance < monthStart) {
        //while(currentInstance.month() < startingMonth) {
            currentInstance = currentInstance.addDays(intervalLength);
        }

        // final day within evaluated months
        Date finalDay = monthStart.addMonths(numberOfMonths);
        finalDay = finalDay.addDays(Date.daysInMonth(finalDay.year(), finalDay.month()) - 1);
        
        // store the numbers of all months being evaluated
        Set<Integer> months = new Set<Integer>();

        for(Integer i = 0; i < numberOfMonths; i++) {
            months.add(currentInstance.addMonths(i).month());
        }

        // add days to list until the interval takes the service dates beyond the end date or the final day being evaluated
        while(months.contains(currentInstance.month()) && currentInstance <= finalDay) {
            if(checkEffectiveDate(currentInstance, effectiveDate, startDate, endDate)) {
                days.add(currentInstance);
            }
            currentInstance = currentInstance.addDays(intervalLength);
        }

        return days;
    }

    /*
     * @Name        getAllDays
     * @Description Method to get all occurrences of a day
     * @Author      Graeme Ward
     * @Params      parsedScheduleCode: Schedule Type Code parsed into a list
     *              startingReference: The index value in the parsedScheduleCode that identifies a day of the week
     * @Return      Boolean: whether or not the day is a match for the Schedule Type Code
     */
    private List<Date> getAllDays(List<String> parsedScheduleCode, Integer startingReference) {
        List<Date> days = new List<Date>();

        for(Integer i = startingReference; i < parsedScheduleCode.size(); i++) {
            Integer dayInt = Integer.valueOf(parsedScheduleCode[i]);
            days.addAll(daysByNumber.get(dayInt).allDays);
        }

        return days;
    }

    /*
     * @Name        getDayByOccurrences
     * @Description Method to get the specified occurrences of a day
     * @Author      Graeme Ward
     * @Params      parsedScheduleCode: Schedule Type Code parsed into a list
     *              startingReference: The index value in the parsedScheduleCode that identifies a day of the week
     * @Return      Boolean: whether or not the day is a match for the Schedule Type Code
     */
    private List<Date> getDayByOccurrences(List<String> parsedScheduleCode, Integer startingReference) {
        List<Date> unfilteredDays = new List<Date>();

        Integer dayInt = Integer.valueOf(parsedScheduleCode[startingReference]);

        for(Integer i = startingReference + 1; i < parsedScheduleCode.size(); i++) {
            Integer occurrenceInt = Integer.valueOf(parsedScheduleCode[i]);
            unfilteredDays.addAll(daysByNumber.get(dayInt).daysByOccurrence.get(occurrenceInt));
        }

        return unfilteredDays;
    }

    /*
     * @Name        addDayInMonth
     * @Description Method to determine whether the specified day is a match for a monthly Schedule Type Code
     *              Code
     * @Author      Graeme Ward
     * @Params      day: Day being evaluated
     *              parsedScheduleCode: Schedule Type Code parsed into a list
     * @Return      Boolean: whether or not the day is a match for the Schedule Type Code
     */
    private Boolean addDayInMonth(Date day, List<String> parsedScheduleCode) {
        // check for even or odd months
        if((Integer.valueOf(parsedScheduleCode[1]) == 2
                    && Math.mod(day.month(), 2) == 0)
                || (Integer.valueOf(parsedScheduleCode[1]) == 1
                    && Math.mod(day.month(), 2) != 0))
        {
            return true;
        }

        return false;
    }

    /*
     * @Name        addDayInQuarter
     * @Description Method to determine whether the specified day is a match for a quarterly Schedule Type Code
     *              Code
     * @Author      Graeme Ward
     * @Params      day: Day being evaluated
     *              parsedScheduleCode: Schedule Type Code parsed into a list
     * @Return      Boolean: whether or not the day is a match for the Schedule Type Code
     */
    private Boolean addDayInQuarter(Date day, List<String> parsedScheduleCode) {
        Boolean addDay = false;

        Integer month = day.month();

        // 3rd month of quarter
        if(Integer.valueOf(parsedScheduleCode[1]) == 3
                && (month == 3 || month == 6 || month == 9 || month == 12))
        {

            addDay = true;
        }
        // 2nd month of quarter
        else if(Integer.valueOf(parsedScheduleCode[1]) == 2
                && (month == 2 || month == 5 || month == 8 || month == 11))
        {
            addDay = true;
        }
        // 1st month of quarter
        else if(Integer.valueOf(parsedScheduleCode[1]) == 1
                && (month == 1 || month == 4 || month == 7 || month == 10)) {
            addDay = true;
        }

        return addDay;
    }

    /*
     * @Name        addDayInSpecifiedMonths
     * @Description Method to determine whether the specified day is a match for months specified in a Schedule Type
     *              Code
     * @Author      Graeme Ward
     * @Params      day: Day being evaluated
     *              parsedScheduleCode: Schedule Type Code parsed into a list
     *              endingReference: The index value in the parsedSchedule code that is the last month being evaluated
     * @Return      Boolean: whether or not the day is a match for the Schedule Type Code
     */
    private Boolean addDayInSpecifiedMonths(Date day, List<String> parsedScheduleCode, Integer endingReference) {
        Boolean addDay = false;

        Integer month = day.month();

        for(Integer i = 1; i <= endingReference; i++) {
            if(month == Integer.valueOf(parsedScheduleCode[i])) {
                addDay = true;
                break;
            }
        }

        return addDay;
    }

    /*
     * @Name        checkEffectiveDate
     * @Description Method to evaluate a list of dates and filter out any that don't fall within a specified period
     * @Author      Graeme Ward
     * @Params      unfilteredDays: Days being evaluated
     *              effectiveDate: the effective date on the service plan
     *              startDate: The starting day for retrieving days corresponding to a Service Plan (if specified)
     *              endDate: The end day for retrieving days corresponding to a Service Plan (if specified)
     * @Return      List<Date>: list of dates that are on or after the start date
     */
    private List<Date> checkEffectiveDate(List<Date> unfilteredDays, Date effectiveDate, Date startDate, Date endDate) {
        List<Date> days = new List<Date>();

        for(Date d : unfilteredDays) {
            if (checkEffectiveDate(d, effectiveDate, startDate, endDate)) {
                days.add(d);
            }
        }

        return days;
    }

    /*
     * @Name        checkEffectiveDate
     * @Description Method to evaluate a day to see if it falls within a specified period
     * @Author      Graeme Ward
     * @Params      day: Day being evaluated
     *              effectiveDate: the effective date on the service plan
     *              startDate: The starting day for retrieving days corresponding to a Service Plan (if specified)
     *              endDate: The end day for retrieving days corresponding to a Service Plan (if specified)
     * @Return      Boolean: Whether or not the day is valid
     */
    private Boolean checkEffectiveDate(Date d, Date effectiveDate, Date startDate, Date endDate) {
        if(startDate == null || effectiveDate >= startDate) {
            return checkDate(d, effectiveDate, endDate);
        } else {
            return checkDate(d, startDate, endDate);
        }
    }

    /*
     * @Name        checkDate
     * @Description Method to evaluate a day to see if it falls within a specified period
     * @Author      Graeme Ward
     * @Params      day: Day being evaluated
     *              startDate: The starting day for retrieving days corresponding to a Service Plan
     *              endDate: The end day for retrieving days corresponding to a Service Plan (if specified)
     * @Return      Boolean: Whether or not the day is valid
     */
    private Boolean checkDate(Date d, Date startDate, Date endDate) {
        return (d >= startDate && endDate == null) || (d >= startDate && endDate != null && d <= endDate);
    }

    /*
     * @Name        sortDays
     * @Description Method to sort list of dates in ascending order
     * @Author      Graeme Ward
     * @Params      days: list of dates
     * @Return      void
     */
    private void sortDays(List<Date> days) {
        List<DateWrapper> dateWrapperList = new List<DateWrapper>();

        for(Date d : days) {
            dateWrapperList.add(new DateWrapper(d));
        }

        dateWrapperList.sort();
        days.clear();

        for(DateWrapper dw : dateWrapperList) {
            days.add(dw.d);
        }
    }

    /*
     * @Name        DateWrapper
     * @Description Class for wrapping dates to be sorted in ascending order
     * @Author      Graeme Ward
     */
    public class DateWrapper implements Comparable {
        public Date d;

        public DateWrapper(Date d) {
            this.d = d;
        }

        public Integer compareTo(Object compareTo) {
            return ((DateWrapper) compareTo).d.daysBetween(d);
        }
    }
}