import { LightningElement, track, api, wire } from 'lwc';
import getTasks from '@salesforce/apex/CallBlockController.getRecords';
import saveRecords from '@salesforce/apex/CallBlockController.saveRecords';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import FORM_FACTOR from '@salesforce/client/formFactor';
import deleteTask from '@salesforce/apex/CallBlockController.deleteTask';
import updateTask from '@salesforce/apex/CallBlockController.updateTask';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import updateTaskStatus from '@salesforce/apex/CallBlockController.updateTaskStatustoHigh';

const columns = [
    { label: 'Important', type: 'button-icon', typeAttributes: { iconName: { fieldName: 'iconPriority' }, name: 'priority', iconClass: { fieldName: 'iconPrioritycss' }, variant: 'bare' }, initialWidth: 81 },
    { cellAttributes: { iconName: { fieldName: 'iconToDisplay' } }, label: 'Company Name', sortable: true, fieldName: 'comLink', wrapText: true, type: 'url', typeAttributes: { label: { fieldName: 'Company' }, target: '_blank' }, initialWidth: 161 },
    { label: 'Contact Name', fieldName: 'Name', sortable: true, initialWidth: 140 },
    { label: 'Address', fieldName: 'Address', sortable: true, wrapText: true, initialWidth: 245 },
    { label: 'Industry', fieldName: 'Industry', sortable: true, initialWidth: 154, wrapText: true },
    { cellAttributes: { iconName: { fieldName: 'followUpIcon' }, alignment: 'right' }, label: 'Due Date', fieldName: 'DueDate', type: 'date-local', sortable: true, editable: true, initialWidth: 154 },
    { label: 'Date Added', fieldName: 'dateadded', type: 'date-local', sortable: true, initialWidth: 121 },
    { label: 'Phone', fieldName: 'Phone', type: 'phone', initialWidth: 126 },
    {
        type: 'button', typeAttributes: { iconName: 'utility:edit', variant: 'border-filled', iconClass: '', label: 'Edit', title: 'Edit', name: 'viewDetails', value: 'edit' }, initialWidth: 104
    },
    { type: 'button-icon', typeAttributes: { size: 'large', iconClass: 'slds-button_icon-error', iconName: 'action:delete', variant: 'border-filled', label: 'Delete', title: 'Delete', name: 'delete', value: 'delete' }, initialWidth: 30 },

];
const DELAY = 300;
const HIGH_PRIORITY = 'Important';
const ALL_PRIORITY = 'All Tasks';

const filterOptions = [
    { value: HIGH_PRIORITY, label: HIGH_PRIORITY },
    { value: ALL_PRIORITY, label: ALL_PRIORITY },
];
export default class Callblockv1 extends NavigationMixin(LightningElement) {
    @track error;
    @track records; //All tasks available for data table
    @track showTable = false; //Used to render table after we get the data from apex controller
    @track recordsToDisplay = []; //Records to be displayed on the page
    @track rowNumberOffset; //Row number
    @track record = {};
    @track sortedBy;
    @track sortBy;
    @track sortDirection;
    @track sub;
    @track value;
    @track recordPageUrl;
    ALL_TASKS = [];
    ALL_TASKS1 = [];
    isLoaded = false;
    taskSpinner = false;
    @track loading;
    norecord = false
    detectDevice;
    largedevice = false;
    tablestyle;
    columns = columns;
    selectedItemValue;
    // defaultSortDirection = 'asc';
    // sortDirection = 'asc';
    draftValues = [];
    blndaterange = true;
    //readonly = true;

    @track currentFilter = ALL_PRIORITY;
    filterOptions = filterOptions;
    @track isExpanded = false;
    handleClickExtend() {
        this.isExpanded = !this.isExpanded;
    }
    get dropdownTriggerClass() {
        if (this.isExpanded) {
            return 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click custom_list_view slds-is-open'
        } else {
            return 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click custom_list_view'
        }
    }
    handleFilterChangeButton(event) {
        this.recordsToDisplay = [...this.recordsToDisplay]
        this.isLoaded = false;
        let filter = event.target.dataset.filter;
        this.isExpanded = !this.isExpanded;
        if (filter !== this.currentFilter) {
            this.currentFilter = event.target.dataset.filter;
            setTimeout(() => {
                this.handleFilterData(this.currentFilter), 0
            });
        } else {
            this.isLoaded = true;
        }
    }
    handleFilterData(filter) {
        if (filter === ALL_PRIORITY) {
            this.recordsToDisplay = this.ALL_TASKS
        } else {
            this.recordsToDisplay = this.ALL_TASKS.filter(item => {
                return item.Priority === 'High';
            })
        }
        this.startdate = '';
        this.enddate = '';
        if (this.largedevice) {
            this.template.querySelector('.search').value = ''
        }
        this.isLoaded = true;
    }
    startdate;
    enddate;
    handlestartdate(e) {
        this.startdate = e.detail.value
        this.enddate = e.detail.value;
        if (this.startdate !== undefined && this.startdate !== '' && this.startdate !== null) {
            this.recordsToDisplay = this.ALL_TASKS.filter((item) =>
                item.ActivityDate >= this.startdate && item.ActivityDate <= this.enddate
            );
        } else {
            this.recordsToDisplay = [...this.ALL_TASKS];
        }
    }
    toggleDueDate(e) {
        this.recordsToDisplay[e.target.dataset.index].readonly = false
        this.recordsToDisplay = [...this.recordsToDisplay]
    }
    handlefocusout(e) {
        this.recordsToDisplay[e.target.dataset.index].readonly = true
        this.recordsToDisplay = [...this.recordsToDisplay]
    }
    handleduedatechange(e) {
        this.isLoaded = true;
        const itemIndex = e.target.dataset.index;
        let duedatevalue = e.target.value
        let tskId = this.recordsToDisplay[itemIndex].Id;
        let task = [];
        task = [
            {
                'sobjectType': 'Task',
                'Id': tskId,
                'ActivityDate': duedatevalue
            }
        ];

        updateTask({ tskIds: task })
            .then(() => {
                this.isLoaded = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Task updated successfully',
                        variant: 'success'
                    })
                );
                this.recordsToDisplay[itemIndex].readonly = true
            }).catch(error => {
                this.isLoaded = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });

        this.recordsToDisplay = this.recordsToDisplay.map(item => {
            let item2 = task.find(i2 => i2.Id === item.Id);
            return item2 ? { ...item, ...item2 } : item;
        });
    }
    handleenddate(e) {
        if (this.startdate !== undefined && this.startdate !== '') {
            this.enddate = e.detail.value
            this.recordsToDisplay = this.ALL_TASKS.filter((item) =>
                item.ActivityDate >= this.startdate && item.ActivityDate <= this.enddate
            );
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Select Start Date first before selecting end date',
                    variant: 'error'
                })
            );
            this.enddate = null
        }
    }
    toggledaterange(e) {
        this.blndaterange = !this.blndaterange
    }
    isDueDateError = false;
    handleCellChange(e) {
        console.log(JSON.stringify(e.detail))
        var today = new Date();
        e.detail.draftValues.forEach(res => {
            var ddate = new Date(res.DueDate.split('T')[0]);
            var tdate = new Date(today.toISOString().split('T')[0])
            if (ddate < tdate) {
                this.isDueDateError = true;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Due date cannot be less than today',
                        variant: 'error'
                    })
                );
            }
            e.detail.draftValues = []
        })
        //{ "draftValues": [{ "DueDate": "2022-01-27T23:58:10.000Z", "Id": "00T6300000RLW4IEAX" }] }
    }
    handleSave(event) {
        this.isLoaded = true;
        var jsonArr = [];
        event.detail.draftValues.forEach(res =>
            jsonArr.push({
                Id: res.Id,
                ActivityDate: res.DueDate,
            })
        )
        console.log(jsonArr)
        if (this.isDueDateError) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Due date cannot be less than today',
                    variant: 'error'
                })
            );
        } else {
            updateTask({ tskIds: jsonArr })
                .then(() => {
                    this.isLoaded = false;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Task updated successfully',
                            variant: 'success'
                        })
                    );
                }).catch(error => {
                    this.isLoaded = false;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error deleting record',
                            message: error.body.message,
                            variant: 'error'
                        })
                    );
                });
        }
        this.draftValues = [];
        this.recordsToDisplay = this.recordsToDisplay.map(item => {
            let item2 = event.detail.draftValues.find(i2 => i2.Id === item.Id);
            return item2 ? { ...item, ...item2 } : item;
        });
        this.template.querySelector('lightning-datatable').selectedRows = [];
    }
    connectedCallback() {
        this.detectDevice = FORM_FACTOR;
        if (this.detectDevice === 'Large') {
            this.largedevice = true
            this.tablestyle = 'width:87%;margin:auto';
        }
        else {
            this.largedevice = false
            this.tablestyle = ''
        }
        this.getTaskRecords()
    }

    handleSortChange(e, label) {
        var sort = e.detail.value;
        this.onHandleSort(e, label)
    }

    refreshList() {
        this.currentFilter = ALL_PRIORITY;
        this.getTaskRecords()
    }
    iconToLead = false;
    iconToAccount = false;
    _allData;
    getTaskRecords() {
        this.taskSpinner = true;
        this.startdate = '';
        this.enddate = '';
        getTasks()
            .then(result => {
                var data = result;
                if (data) {
                    this.taskSpinner = false;
                    let recs = [];
                    for (let i = 0; i < data.length; i++) {
                        let task = {};
                        task.rowNumber = '' + (i + 1);
                        if (data[i].WhoId && data[i].WhoId.startsWith('00Q')) {
                            task.obj = 'Lead'
                            task.iconToDisplay = 'standard:lead'
                            task.comLink = '/' + data[i].WhoId
                            task.evAddress = data[i].Who.City + ' ' + data[i].Who.Street + ' ' + data[i].Who.State + ' ' + data[i].Who.PostalCode + ' ' + data[i].Who.Country;
                            task.Address = data[i].Who.PostalCode + ' ' + data[i].Who.City + ' ' + data[i].Who.Street + ' ' + data[i].Who.State + ' ' + data[i].Who.Country;
                            task.ph = 'tel:' + data[i].Who.Phone;
                            task.Phone = data[i].Who.Phone;
                            task.Industry = data[i].Who.Industry !== undefined ? data[i].Who.Industry : ' '
                            var checkformatphone = task.Phone !== undefined ? task.Phone : '';
                            if (checkformatphone.includes('-')) {
                                task.formattedphone = task.Phone.replace(/[- )(]/g, '');
                            }
                            task.Company = data[i].Who.Company;
                            task.Name = data[i].Who.Name;
                        }
                        if (data[i].WhoId && data[i].WhoId.startsWith('003')) {
                            task.obj = 'Contact'
                            task.iconToDisplay = 'standard:contact'
                            //task.comLink = '/' + data[i].Who.AccountId
                            task.comLink = '/' + data[i].WhoId;
                            task.evAddress = data[i].Who.Account !== undefined ? data[i].Who.Account.shipping_address__c : '';
                            task.Address = data[i].Who.Account !== undefined ? data[i].Who.Account.ShippingPostalCode + ' ' + data[i].Who.Account.ShippingCity + ' ' + data[i].Who.Account.ShippingStreet + ' ' + data[i].Who.Account.ShippingState + ' ' + data[i].Who.Account.ShippingCountry : '';
                            task.ph = data[i].Who.Account !== undefined ? 'tel:' + data[i].Who.Account.Phone : '';
                            //task.Phone = data[i].Who.Account.Phone
                            task.Phone = data[i].Who.Phone;
                            task.Industry = data[i].Who.Account !== undefined ? data[i].Who.Account.Industry : '';
                            task.formattedphone = task.Phone !== undefined ? task.Phone.replace(/[- )(]/g, '') : ''
                            task.Company = data[i].Who.Account !== undefined ? data[i].Who.Account.Name : '';
                            task.contactEmail = data[i].Who ? data[i].Who.Email : '';
                            task.Name = data[i].Who.Name;
                        }
                        task.Id = data[i].Id;
                        task.iconPriority = 'utility:favorite';
                        task.iconMobilePcss = data[i].Priority === 'High' ? 'warning' : '';
                        task.priority = data[i].Priority === 'High' ? true : false;
                        //data[i].Priority === 'High' ? 'utility:priority' : 'action:new_task';
                        // task.iconPrioritycss = data[i].Priority === 'High' ? 'slds-icon-text-error' : data[i].Priority === 'Normal' ? 'slds-icon-text-success' : data[i].Priority === 'Low' ? 'slds-icon-text-warning' : 'slds-icon-text-light';
                        task.iconPrioritycss = data[i].Priority === 'High' ? 'slds-button_icon-warning' : '';
                        task.DueDate = data[i].ActivityDate;
                        //task.schfollowUp = data[i].Scheduled_Follow_Up_on_Next_Call_Block__c ? 'action:approval' : '';
                        // task.CreatedDate = data[i].CreatedDate;
                        task.dateadded = data[i].CreatedDate;
                        console.log(task.dateadded)
                        //task.dietCSSClass = data[i].Scheduled_Follow_Up_on_Next_Call_Block__c ? 'slds-icon-custom-custom9' : '';
                        task.followUpIcon = data[i].Scheduled_Follow_Up_on_Next_Call_Block__c ? 'utility:missed_call' : '';
                        task.mobilefollowUpIcon = data[i].Scheduled_Follow_Up_on_Next_Call_Block__c ? 'box1 slds-tile slds-tile_board slds-border_bottom' : 'slds-tile slds-tile_board slds-border_bottom';
                        task.Status = data[i].Status;
                        task = Object.assign(task, data[i]);
                        recs.push(task);
                    }
                    this.ALL_TASKS = recs;

                    for (var i = 0; i < recs.length; i++) {
                        recs[i].readonly = true;
                    }
                    this.ALL_TASKS1 = recs;
                    console.log('this.ALL_TASKS1***** ' + JSON.stringify(this.ALL_TASKS1));
                    this.recordsToDisplay = recs;
                    console.log(this.recordsToDisplay)
                    this.showTable = true;
                }
            })
            .catch(error => {
                this.taskSpinner = false;
                this.error = error;
                console.log(this.error)
            });
    }

    // formatDate(date) {
    //     var d = new Date(date),
    //         month = '' + (d.getMonth() + 1),
    //         day = '' + d.getDate(),
    //         year = d.getFullYear();

    //     if (month.length < 2)
    //         month = '0' + month;
    //     if (day.length < 2)
    //         day = '0' + day;

    //     return [year, month, day].join('-');
    // }


    handleRowAction(event) {

        const actionName = event.detail.action.name;
        const row = event.detail.row;
        this.sub = row.Subject;
        this.recordPageUrl = '/' + row.Id;
        this.followupcheck = row.Scheduled_Follow_Up_on_Next_Call_Block__c;
        this.sub = row.Subject;
        this.value = row.Call_Block_Disposition__c
        this.inputNoteValue = row.Description
        this.showRowDetails(row);

    }
    onHandleSort1(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.recordsToDisplay));
        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };
        // cheking reverse direction
        let isReverse = direction === 'asc' ? 1 : -1;
        // sorting data
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';
            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });
        this.recordsToDisplay = parseData;
    }
    onHandleSort(e, label) {
        this.sortData(label, e.detail.value);
    }
    closeCancelDialog(e) {
        this.isDialogVisible = false;
        this.getTaskRecords();
    }
    handleChange(event) {
        this.value = event.detail.value;
        var rec = JSON.parse(JSON.stringify(this.record))
        rec.Call_Block_Disposition__c = this.value
        this.record = rec;
    }
    @track inputNoteValue;
    handleNoteChange(event) {
        this.inputNoteValue = event.target.value
    }
    @track followupcheck;
    handleFollowUpChange(e) {
        this.followupcheck = e.target.checked;
        console.log(this.followupcheck)
    }

    fixedWidth = "width:11rem;";
    @track showModal = false
    name
    companyname
    phonetodisplay
    rowdetails = {};
    @track sub;
    clicktodial(event) {
        const itemIndex = event.currentTarget.dataset.index;
        const rowData = this.recordsToDisplay[itemIndex];
        this.num = 'tel:' + rowData.Phone
    }
    @track isRowDetailsVisible = false;

    closemodal(event) {
        this.isRowDetailsVisible = event.detail;
        this.refreshData();
    }
    openmodal(event) {
        this.taskSpinner = true
        this.isRowDetailsVisible = true
        const itemIndex = event.currentTarget.dataset.index;
        const rowData = itemIndex != null ? this.recordsToDisplay[itemIndex] : this.dataRow;
        var idtoupdate = rowData.obj === 'Account' ? rowData.AccountId : rowData.WhoId;
        this.rowdetails = {
            companyname: rowData.Company,
            name: rowData.Name,
            activitydate: rowData.ActivityDate,
            address: rowData.evAddress,
            phonetodisplay: rowData.Phone,
            sub: rowData.Subject,
            email: rowData.Who.Email !== 'undefined' ? rowData.Who.Email : rowData.contactEmail,
            taskId: rowData.Id,
            iconname: rowData.iconToDisplay,
            status: rowData.Status,
            idtoupdate: idtoupdate,
            obj: rowData.obj,
            street: rowData.Who.Street,
            state: rowData.Who.State,
            postalcode: rowData.Who.PostalCode,
            accountId: rowData.Who.AccountId !== undefined ? rowData.Who.AccountId : '',
            country: rowData.Who.Country,
            mailingCity: rowData.Who.MailingCity !== undefined ? rowData.Who.MailingCity : '',
            mailingStreet: rowData.Who.MailingStreet !== undefined ? rowData.Who.MailingStreet : '',
            mailingState: rowData.Who.MailingState !== undefined ? rowData.Who.MailingState : '',
            mailingCountry: rowData.Who.MailingCountry !== undefined ? rowData.Who.MailingCountry : '',
            mailingPostalCode: rowData.Who.MailingPostalCode !== undefined ? rowData.Who.MailingPostalCode : ''
        }
        this.num = 'tel:' + rowData.Phone
        this.companyname = rowData.Company;
        this.name = rowData.Name
        this.phonetodisplay = rowData.Phone
        this.sub = rowData.Subject
        this.record = rowData;
        console.log(rowData);

        if (!this.largedevice) {
            var compDefinition = {
                componentDef: "c:callBlockDetails",
                attributes: {
                    c__rowdetails: this.rowdetails,
                    //c__showmodal: true
                }
            };

            //var encodedCompDef = btoa(JSON.stringify(compDefinition));
            var encodedCompDef = btoa(unescape(encodeURIComponent(JSON.stringify(compDefinition))));
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: '/one/one.app#' + encodedCompDef
                }
            });
        }
        this.isLoaded = false;
    }

    handleCancel() {
        this.showModal = false;
    }
    num;
    dataRow;
    @track isDialogVisible = false;
    @track tskId;
    iconPrioritycss;
    callRowAction(event) {
        this.tskId = event.detail.row.Id;
        const actionName = event.detail.action.name;
        if (actionName === 'viewDetails') {
            const dataRow = event.detail.row;
            this.dataRow = dataRow
            this.openmodal(event)
        }
        if (actionName === 'delete') {
            this.isDialogVisible = true;
        }

        if (actionName === 'priority') {
            let task = {
                'sobjectType': 'Task',
                'Id': this.tskId,
                'Priority': 'High'
            };

            let index = this.recordsToDisplay.findIndex(row => row.Id === event.detail.row.Id)
            if (this.recordsToDisplay[index].iconPrioritycss === 'slds-button_icon-warning') {
                this.recordsToDisplay[index].iconPrioritycss = ''
            } else {
                this.recordsToDisplay[index].iconPrioritycss = 'slds-button_icon-warning'
            }

            this.recordsToDisplay = [...this.recordsToDisplay]
            this.makeTaskStatusAsHigh(task, event.detail.row.rowNumber);
        }
    }

    taskStatusAsHigh(e) {
        console.log(e.detail)
        const index = e.target.dataset.index
        const rowData = this.recordsToDisplay[index];
        if (rowData.iconMobilePcss === 'warning') {
            rowData.iconMobilePcss = '';
        } else {
            rowData.iconMobilePcss = 'warning'
        }
        this.tskId = rowData.Id
        let task = {
            'sobjectType': 'Task',
            'Id': this.tskId,
            'Priority': 'High'
        };
        this.makeTaskStatusAsHigh(task, null)
    }

    makeTaskStatusAsHigh(tsk, num) {
        updateTaskStatus({ tskId: tsk })
            .then((res) => {
                console.log(res)
                //this.iconPrioritycss = JSON.parse(JSON.stringify(this.recordsToDisplay[num - 1])).iconPrioritycss
                //alert(this.iconPrioritycss)
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Task priority has been changed successfully.',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                console.log(error)
            })
    }

    handleDeleteEvent(e) {
        if (e.detail.status === 'Delete') {
            this.delete(e)
        }
    }


    delete(event) {
        let newData = JSON.parse(JSON.stringify(this.recordsToDisplay));
        newData = newData.filter((row) => row.Id !== this.tskId);
        newData.forEach((element, index) => (element.Id = index + 1));
        this.recordsToDisplay = newData;
        this.isDialogVisible = false;
        let task;
        task = {
            'sobjectType': 'Task',
            'Id': this.tskId
        };
        deleteTask({ tskId: task })
            .then(() => {
                this.refreshData();
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Record deleted',
                        variant: 'success'
                    })
                );
                this.isDialogVisible = false;
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error deleting record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
                this.isDialogVisible = false;
            });
    }

    refreshData() {
        this.getTaskRecords();
    }

    callgettask(e) {
        this.getTaskRecords();
    }
    handleOnselect(event) {
        this.selectedItemValue = event.detail.value;
        const index = event.target.dataset.index
        const rowData = this.recordsToDisplay[index];
        this.tskId = rowData.Id

        if (this.selectedItemValue === 'Edit') {
            this.openmodal(event)
        }
        if (this.selectedItemValue === 'Delete') {
            this.isDialogVisible = true;
        }
    }
    isSort = false;
    isFilter = false;
    isSearch = false;
    handleMobileSearch(e) {
        this.isSearch = !this.isSearch;
        this.isSort = false;
        this.isFilter = false;
    }
    handlesort(e) {
        this.isSort = !this.isSort;
        this.isFilter = false;
    }
    handlefilter(e) {
        this.isFilter = !this.isFilter;
        this.isSort = false;
    }
    accordianSection = ['A', 'B'];
    handleToggleSection(event) {
        if (this.accordianSection.length === 0) {
            this.accordianSection = ''
        }
        else {
            this.accordianSection = 'A'
        }

    }
    handleradiochange(e) {
        console.log(JSON.stringify(e))
        const label = e.detail.label;
        const direction = e.detail.value;
        if (label === 'Created Date') {
            this.handleSortChange(e, 'CreatedDate')
        }
        if (label === 'Industry') {
            this.handleSortChange(e, 'Industry')
        }
        if (label === 'Address') {
            this.handleSortChange(e, 'Address')
        }
        if (label === 'Company Name') {
            this.handleSortChange(e, 'Company')
        }
        if (label === 'Contact Name') {
            this.handleSortChange(e, 'Who.Name')
        }
        if (label === 'Priority') {
            this.handleFilterData(direction)
        }
        if (label === 'Important') {
            this.handleFilterData(direction)
        }
    }


    get filteroptions() {
        return [
            { label: 'All Tasks', value: 'All Tasks' },
            { label: 'Important', value: 'High' },
        ];
    }
    get options() {
        return [
            { label: 'ascending', value: 'asc' },
            { label: 'descending', value: 'desc' },
        ];
    }
    filtredNum;
    handleKeyChange(event) {
        window.clearTimeout(this.delayTimeout);
        const searchKey = event.target.value;
        if (searchKey) {
            this.delayTimeout = setTimeout(() => {

                this.searchKey = searchKey;
                this.recordsToDisplay = this.ALL_TASKS.filter(rec => JSON.stringify(rec).toLowerCase().includes(searchKey.toLowerCase()));
                this.filtredNum = this.recordsToDisplay.length;
            }, DELAY);
        } else {
            this.recordsToDisplay = [...this.ALL_TASKS];
        }
    }
}