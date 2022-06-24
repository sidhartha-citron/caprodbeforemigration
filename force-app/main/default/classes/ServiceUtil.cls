/**
 * @description
 *
 * Created by timothychiang on 2020-04-25.
 *
 */

/**
 * @description utility class for services to centralize logic for common generic actions
 */
public with sharing class ServiceUtil {

	/**
	 * @description generic insert function
	 *
	 * @param targetList - SObjects to insert
	 * @param allOrNone - all or none switch
	 *
	 * @return DML results
	 */
	public static Database.SaveResult[] generalInsert(List<SObject> targetList, Boolean allOrNone){
		Database.SaveResult[] returnResult;
		if(!targetList.isEmpty()){
			try{
				returnResult = Database.insert(targetList, allOrNone);
			} catch (Exception e){
                System.debug('~~' + e.getMessage());
				throw e;
			}
		}
		return returnResult;
	}
    
	/**
	 * @description generic update function
	 *
	 * @param targetList - SObjects to update
	 * @param allOrNone - all or none switch
	 *
	 * @return DML results
	 */
	public static Database.SaveResult[] generalUpdate(List<SObject> targetList, Boolean allOrNone){
		Database.SaveResult[] returnResult ;
		if(!targetList.isEmpty()){
			try{
				returnResult = Database.update(targetList, allOrNone);
			} catch (Exception e){
				throw e;
			}
		}
		return returnResult;
	}
    
    /**
	 * @description generic upsert function
	 *
	 * @param targetList - SObjects to upsert
	 * @param allOrNone - all or none switch
	 *
	 * @return DML results
	 */
	public static Database.UpsertResult[] generalUpsert(List<SObject> targetList,Schema.SObjectField matchId,Boolean allOrNone){
		Database.UpsertResult[] returnResult;
		if(!targetList.isEmpty()){
		 try{
            	returnResult = Database.upsert(targetList,matchId, allOrNone);
 			} catch (Exception e){
                System.debug('~~' + e.getMessage());
				throw e;
			}
		}
		return returnResult;
	}
    
	/**
	 * @description generic delete function
	 *
	 * @param targetList - SObjects to delete
	 * @param allOrNone - all or none switch
	 *
	 * @return DML results
	 */
	public static Database.DeleteResult[] generalDelete(List<SObject> targetList, Boolean allOrNone){
		Database.DeleteResult[] returnResult;
		if(!targetList.isEmpty()){
			try{
				returnResult = Database.delete(targetList, allOrNone);
			} catch (Exception e){
				throw e;
			}
		}
		return returnResult;
	}


}