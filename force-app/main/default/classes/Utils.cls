public class Utils {
    private static Map<Integer, String> MONTH_NAMES = new Map<Integer, String>{
        1 => 'January',
        2 => 'February',
        3 => 'March',
        4 => 'April',
        5 => 'May',
        6 => 'June',
        7 => 'July',
        8 => 'August',
        9 => 'September',
        10 => 'October',
        11 => 'November',
        12 => 'December'
    };

    //--------------------------------------------------------------------
    // Date Utils
    //--------------------------------------------------------------------
    public static String getMonthName(Integer month){
        return MONTH_NAMES.get(month);
    }
}