import { LightningElement, wire, api } from 'lwc';

export default class Panel extends LightningElement {
    isExpanded = false
    @api timelineGroups;
    @api activeSections = []
    isExpandAll = false;
    toggleLabel = '';
    get dropdownTriggerClass() {
        if (this.isExpanded) {
            return 'slds-utility-panel slds-grid slds-grid_vertical slds-is-open'
        } else {
            return 'slds-utility-panel slds-grid slds-grid_vertical'
        }
    }


    togglemenu(e) {

        this.isExpanded = !this.isExpanded;
    }

    closemenu(e) {
        this.isExpanded = false
        alert(this.isExpanded)
    }

    handleClick(e) {
        e.target.label = e.target.label === 'Expand All' ? 'Collapse All' : 'Expand All'
        this.isExpandAll = !this.isExpandAll;
        [...this.template.querySelectorAll('c-activitylineitem')]
            .forEach(node => node.expandAllNode());
    }
}