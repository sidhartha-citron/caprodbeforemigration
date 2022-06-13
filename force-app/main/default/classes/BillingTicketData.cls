/**
 * BillingTicketData: Datastructure to store OrderItem Summary and changes
 * @author Shashi
 * @version 1.0 
 * @since 8-23-2019  
 **/
public class BillingTicketData {
    public static final String ADDED = 'ADDED'; 
    public static final String SERVICEP = 'SERVPRICE';
    public static final String INSTALLP = 'INSTPRICE';
    public static final String PURCHASEP = 'PRCHPRICE';
    public static final String MONTHLYREV = 'MREVPRICE';
    public static final String FREQUENCY = 'FREQUENCY';
    public static final String ACTIVATED = 'ACTIVE';
    public static final String DEACTIVE = 'DE-ACTIVE';
    public static final String REACTIVE = 'RE-ACTIVE';
    public static final String SEASTART = 'SEASTART';
    public static final String SEAEND = 'SEAEND';
    public static final String PONUM = 'PONUM';
    public static final String INSTALL_STATUS = 'Install';
    public static final String ISOPP = 'OPPORTUNITY';
    public static final String CLEAR_DATE = 'CLEARDT'; //Begin:Shashi:03-27-2020:Clear date 
    
    //Product Code
    public String ProductCode = '';
    public String ProductName = '';
    public String AccountName = '';
    
    public Set<String> stProdIds = new Set<String>();
    
    //Mapping of ProducId to <Event,Quantity>
    public Map<String,Decimal> mpPrdToQty = new Map<String,Decimal>();
    //Mapping of ProducId to <Event,Quantity added URL list>
    public Map<String,Set<String>> mpPrdToQURL = new Map<String,Set<String>>();
   
    
	//Mapping of ProducId to <Event,Old Price>
    public Map<String,Decimal> mpPrdToOPrice = new Map<String,Decimal>();
    //Mapping of ProducId to <Event,New Price>
    public Map<String,Decimal> mpPrdToNPrice = new Map<String,Decimal>();
    //Mapping of ProducId to <Event,Price Quantity>
    public Map<String,Decimal> mpPrdToPQty = new Map<String,Decimal>();
    //Mapping of ProducId to <Event,Price URL list>
    public Map<String,Set<String>> mpPrdToPURL = new Map<String,Set<String>>();
    
    
    //Mapping of ProducId to <Event,Frequency Quantity>
    public Map<String,Decimal> mpPrdToFQty = new Map<String,Decimal>();
    //Mapping of ProducId to <Event,Frequency URL list>
    public Map<String,Set<String>> mpPrdToFURL = new Map<String,Set<String>>();
}