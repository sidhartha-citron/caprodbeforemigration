var surveyWindow;

function popupSurveyWindow(){
    var w = 1160;
    var h = 700;
    var left = (screen.width - w)/2;
    var top = (screen.height/2)-(h/2)-30;
    var url = '../apex/CustomerExperience';
    var properties = 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no,';
    properties += 'width='+w+', height='+h+', top='+top+', left='+left;
    
    if(surveyWindow != null || (surveyWindow != undefined && !surveyWindow.closed)){
        surveyWindow.focus();
          
    }else{
       surveyWindow = window.open(url, '_blank', properties);   
    }
}