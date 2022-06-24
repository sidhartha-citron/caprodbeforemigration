/**
 * ProductConsumedTrigger: 
 * @author Sanchivan Sivadasan
 * @version 1.0 
 * @since 01-29-2020
 **/
trigger ProductConsumedTrigger on ProductConsumed (before insert, before update) {
	new ProductConsumedTriggerHandler().run(); 
}