/**
 * Created by timothychiang on 2020-04-20.
 */

import {api, track} from "lwc";

import Cpq2TableBody from 'c/cpq2TableBody';

export default class Cpq2TableBodyOpportunity extends Cpq2TableBody {

	@track serviceColHeaders = [
		{id: '1', name: 'Product', class: ''},
		{id: '2', name: 'Service', class: ''},
		{id: '3', name: '', class: ''},
		{id: '4', name: 'Installation', class: ''},
		{id: '5', name: 'Details', class: ''}];
	@track consumablesColHeaders = [
		{id: '1', name: 'Product', class: ''},
		{id: '2', name: '', class: ''},
		{id: '3', name: 'Order', class: ''},
		{id: '4', name: 'Core List Price', class: ''},
		{id: '5', name: 'Recurring or VMI', class: ''}];
	@track equipmentColHeaders = [
		{id: '1', name: 'Product', class: ''},
		{id: '2', name: '', class: ''},
		{id: '3', name: 'Order', class: ''},
		{id: '4', name: 'Core List Price', class: ''},
		{id: '5', name: 'Installation', class: ''}];

	@api isVmiServicePresent = false;
	@api coreListPriceLobList = [];

	get colHeaders() {
		if (this.tableType === this.PRODUCT_ITEM_TYPE_SERVICE) {
			return this.serviceColHeaders;
		} else if (this.tableType === this.PRODUCT_ITEM_TYPE_CONSUMABLES) {
			return this.consumablesColHeaders;
		} else if (this.tableType === this.PRODUCT_ITEM_TYPE_EQUIPMENT) {
			return this.equipmentColHeaders;
		}
	}
}