/**
 * Created by timothychiang on 2020-04-22.
 */

import { track, api } from 'lwc';

import BaseComponent from 'c/baseComponent';

export default class Cpq2SummaryViewRowCoreList extends BaseComponent {
	@api lineItem;

	get productUnit(){
		return this.lineItem.productInfo.priceBookEntry.Product2.Unit__c;
	}

	get productInfo(){
		return this.lineItem.productInfo.priceBookEntry.Product2;
	}

	get pricebookInfo(){
		return this.lineItem.productInfo.priceBookEntry;
	}


}