import { LightningElement, track, api } from 'lwc';

export default class BasicPagination extends LightningElement {

    _pageSize = 10;
    @track currentPageNumber = 1;
    @track totalPages = 0;
    @track resultSubsetList;
    @track pageList = [];
    @track atBeginning = true;
    @track atEnd = false;
    @track atBeginningStyle = 'selected-page';
    @track atEndStyle = '';
    @track _result;

    @api
    get result() {
        return this._result;
    }

    set result(value) {
        this.setAttribute('result', value);
        this._result = value;
        this.handlePagination();
    }

    @api
    get pageSize() {
        return this._pageSize;
    }

    set pageSize(value) {
        this._pageSize = value;
        if(this.result) {
            this.handlePagination();
        }
    }

    handlePagination(){
        this.totalPages = Math.ceil(this._result.length/this.pageSize);
        this.currentPageNumber = 1;
        this.buildData();
    }

    onNext() {        
        this.currentPageNumber++;
        this.buildData();
    }
    
    onPrev() {        
        this.currentPageNumber--;
        this.buildData();
    }
    
    processMe(event) {
        this.currentPageNumber = event.target.name;
        this.buildData();
    }
    
    onFirst() {        
        this.currentPageNumber = 1;
        this.buildData();
    }
    
    onLast() {        
        this.currentPageNumber = this.totalPages;
        this.buildData();
    }  
    /*
     * this function will build table data
     * based on current page selection
     * */
    buildData() {
        var data = [];
        var pageNumber = this.currentPageNumber;
        var pageSize = this.pageSize;
        var allData = this._result;
        var x = (pageNumber-1)*pageSize;
        
        //creating data-table data
        for(; x<(pageNumber)*pageSize; x++){
            if(allData[x]){
            	data.push(allData[x]);
            }
        }
        this.resultSubsetList = data;
        this.generatePageList();
        this.sendBackSubSet();
    }
    
    /*
     * this function generate page list
     * */
    generatePageList(){
        var pageNumber = parseInt(this.currentPageNumber);
        var pageListDisplay = [];
        var totalPageNum = this.totalPages;
        if(totalPageNum > 1){
            if(totalPageNum <= 10){
                var counter = 2;
                for(; counter < (totalPageNum); counter++){
                    pageListDisplay.push({number: counter, style:''});
                } 
            } else{
                if(pageNumber < 5){
                    pageListDisplay.push({number: 2, style:''}, {number: 3, style:''}, {number: 4, style:''}, {number: 5, style:''}, {number: 6, style:''});
                } else{
                    if(pageNumber>(totalPageNum-5)){
                        pageListDisplay.push({number: totalPageNum-5, style:''}, {number: totalPageNum-4, style:''}, {number: totalPageNum-3, style:''}, {number: totalPageNum-2, style:''}, {number: totalPageNum-1, style:''});
                    } else{
                        pageListDisplay.push({number: pageNumber-2, style:''}, {number: pageNumber-1, style:''}, {number: pageNumber, style:''}, {number: pageNumber+1, style:''}, {number: pageNumber+2, style:''});
                    }
                }
            }
        }

        for(var i=0; i < pageListDisplay.length; i++){
            if(pageListDisplay[i].number === pageNumber){
                pageListDisplay[i].style = 'selected-page';
            }
        }

        this.pageList = pageListDisplay;

        if(pageNumber === 1){
            this.atBeginning = true;
            this.atBeginningStyle = 'selected-page';
        } else {
            this.atBeginning = false;
            this.atBeginningStyle = '';
        }

        if(pageNumber === totalPageNum){
            this.atEnd = true;
            this.atEndStyle = 'selected-page';
        } else {
            this.atEnd = false;
            this.atEndStyle = '';
        }
    }
    
    sendBackSubSet(){
        const event = new CustomEvent('subsetchanged', {
            detail: {"value": JSON.stringify(this.resultSubsetList)}
        });
        this.dispatchEvent(event);
    }
}