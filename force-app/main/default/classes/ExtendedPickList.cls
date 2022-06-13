/**
 * Wrapper class used by MyServicesExtended controller
 * 
 * @author Ahsan Butt
*/
public class ExtendedPickList {
    @AuraEnabled
    public List<String> caseType { get; set; }
    
    public ExtendedPickList() {}
    
    public ExtendedPickList(List<String> caseType) {
        this.caseType = caseType;
    }
}