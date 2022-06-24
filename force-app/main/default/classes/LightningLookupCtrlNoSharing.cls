/**
 * @FileName: LightningLookupCtrlNoSharing
 * @Description: Helper methods for LightningLookupCtrl, without sharing
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/14/2019      Created
 *-----------------------------------------------------------  
 */
public without sharing class LightningLookupCtrlNoSharing {

    public static Search.SearchResults searchSOSL(String query) {
        return Search.find(query);
    }

    public static List<SObject> searchSOQL(String query) {
        return Database.query(query);
    }
}