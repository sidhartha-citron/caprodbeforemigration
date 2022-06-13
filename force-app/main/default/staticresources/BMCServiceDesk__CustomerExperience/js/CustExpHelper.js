var contactMe = false;	//User can select whether he/she wants to be contacted by Service Manager
var divNA = '<div class="not-applicable">'+PSATNA+'</div>';	//This is to be appended to top section of slider
var comments;
var phone;
var isReferenceCustomer = false;
var testEmail;

$(document).ready(function(){
	$("#contactPhone").val(contactPhone);	
	$('#contactPhone').prop('disabled', true);
	
	$('.phoneLabel').on('click', function(){
		$(this).toggleClass('selected');
		contactMe = !contactMe;
		$('#contactPhone').prop('disabled', !$('#contactPhone').prop('disabled'));
	});
	
	$('.refCustomerLabel').on('click', function(){
		$(this).toggleClass('selected');
		isReferenceCustomer = !isReferenceCustomer;
	});
	
	$('.submitBtn').click(function(){
		if($(this).hasClass('submitBtnActive')){ submitData();};
	});
	
	getHtmlFromJSON();
	bindPrivacyStatementEvents();
	populatePrivacyStmt();
});

$(window).on('load',function(){
	var winWidth = $(window).width();
	var winHeight = $('body').height() + 86;
	window.resizeTo(winWidth, winHeight);
});

$(window).on('unload', function(){
	window.opener.surveyWindow = null;
});

function populatePrivacyStmt(){
	privacyStmtPart1 = privacyStmtPart1.replace(/\n/g,'<br\>');
	privacyStmtPart1 = privacyStmtPart1 + '<br\><br\>' + privacyStmtPart2.replace(/\n/g,'<br\>');
	privacyStmtPart3 = privacyStmtPart3.replace(/\n/g,'<br\>');
	
	privacyStmtPart3 = privacyStmtPart3.replace('{BMC_URL}', '<a href="http://www.bmc.com/legal/privacy-policy.html" target="_blank">http://www.bmc.com/legal/privacy-policy.html</a>');
	privacyStmtPart3 = privacyStmtPart3.replace('{BMC_EMAIL}', '<a href="mailto:privacy@BMC.com">Privacy@BMC.com</a>');
	
	$('.privacy-stmt-part1').html(privacyStmtPart1);
	$('.privacy-stmt-part2').html(privacyStmtPart3);
}

function showClosePanel(){
	$('#closePanel').show(400);
}
function closeClosePanel(){
	$('#closePanel').hide(400);
}
	
function getHtmlFromJSON(){
    var leftBarContentProduct = '';
    var rightBarContentProduct = '';
    var leftBarContentService = '';
    var rightBarContentService = '';
    var commentInput = '';
    var indexPosition = 0;	//This handles addition of 'NA' to the top of the sliders
    var alterCols = true;	//This toggle between content to be added to right/left side of screen
    
    for(var key in dataMap){
        if(!Boolean(isAdminUser) && 
		(
		  (key == "IME__c" && featureMap["Incident__c"] == false)
          || (key == "PME__c" && featureMap["Problem__c"] == false)
          || (key == "SRME__c" && featureMap["ServiceRequest"] == false)
          || (key == "CME__c" && featureMap["Change_Request__c"] == false)
          || (key == "RME__c" && featureMap["Release__c"] == false)
		  || (key == "AE__c" && !Boolean(isAdminUser))
		)){
            continue;
        }
		if(!PropSegragateIncidentServiceRequest && key == "SRME__c"){
			continue;
		}
        if(dataMap[key] ==  undefined || dataMap[key].type == undefined) return;
		dataMap[key].percent = 102.5;
		
		//Create content
		var content = '<div class="surveyPanel'+dataMap[key].type+'" initialVal="'+dataMap[key].percent+'"><div class="surveyHeader" key="'+key+'">'+dataMap[key].label+'</div>';
		if(indexPosition == 0 || indexPosition == 1){
			content += divNA;
		}
		content += '<div class="slider" initialVal="'+dataMap[key].percent+'" id="'+ key +'" key="'+key+'"></div>';
		content += '</div>';
		
		//Add content to panels
		if(dataMap[key].type == 'product'){
			if(alterCols){
				leftBarContentProduct += content;
			}else{
				rightBarContentProduct += content;
			}
		}else{
			if(alterCols){
				leftBarContentService += content;
			}else{
				rightBarContentService += content;
			}
		}
		indexPosition++;
        alterCols = !alterCols;
    }
    
    $('.leftSurveyContainerProduct').append(leftBarContentProduct);
    $('.rightSurveyContainerProduct').append(rightBarContentProduct);
    $('.leftSurveyContainerService').append(leftBarContentService);
    $('.rightSurveyContainerService').append(rightBarContentService);
    
    $( ".slider" ).slider({
		max: 104,
		min: 0,
		step: 0.5,
		slide: function( event, ui ) {
			var key = $(this)[0].id;
			var percent = ui.value;
			dataMap[key].percent = percent;
			if(percent >= 0 && percent <= 25){
				tooltipVal = SurveyVeryDissatisfied;
			}else if(percent > 25 && percent <= 50){
				tooltipVal = SurveyDissatisfied;
			}else if(percent > 50 && percent <= 75){
				tooltipVal = SurveySatisfied;
			}else if(percent > 75 && percent <= 100){
				tooltipVal = SurveyVerySatisfied;
			}else if(percent > 100){
				tooltipVal = SurveyNotApplicable;
			}
			$(this).children().html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + tooltipVal + '</div></div>');
		},
		create: function(event, ui){
			var initialVal = $(this).parent()[0].getElementsByClassName('ui-slider')[0].getAttribute("initialVal");
			$(this).slider('value', initialVal);
		},
		stop: function( event, ui ) {
			var percent = ui.value;
			var key = $(this)[0].id;
			if(percent >= 0 && percent <= 25){
				$('#'+key).slider( "value", 12.5 );
			}else if(percent > 25 && percent <= 50){
				$('#'+key).slider( "value", 37.5 );
			}else if(percent > 50 && percent <= 75){
				$('#'+key).slider( "value", 62.5 );
			}else if(percent > 75 && percent <= 100){
				$('#'+key).slider( "value", 87.5 );
			}else if(percent > 100){
				$('#'+key).slider( "value", 102.5 );
			}
		}
	});
    
    $( ".ui-slider-handle" ).on('focusout mouseleave', function() {
        $('.ui-slider-handle').html("");
    }) 
    
    $( ".ui-slider-handle" ).mouseenter(function() {
        var value = $(this).parent().slider( "option", "value" );
        var percent = value;
		if(percent >= 0 && percent <= 25){
			tooltipVal = SurveyVeryDissatisfied;
		}else if(percent > 25 && percent <= 50){
			tooltipVal = SurveyDissatisfied;
		}else if(percent > 50 && percent <= 75){
			tooltipVal = SurveySatisfied;
		}else if(percent > 75 && percent <= 100){
			tooltipVal = SurveyVerySatisfied;
		}else if(percent > 100){
			tooltipVal = SurveyNotApplicable;
		}
        $(this).html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + tooltipVal + '</div></div>');
    }) 
}

function submitData(){
	comments = $("#surveyComment")  != undefined && $("#surveyComment").val() != undefined ? $("#surveyComment").val() : '';
	phone = $("#contactPhone")  != undefined && $("#contactPhone").val() != undefined ? $("#contactPhone").val() : '';
	testEmail = $("#testEmail")  != undefined && $("#testEmail").val() != undefined ? $("#testEmail").val() : '';
	submitSurvey();
}

function bindPrivacyStatementEvents(){
	$('.privacy-stmt-wrapper').draggable({
		containment: "window"
	});
	$('.close-privacy-stmt-wrapper').click(function(){
		$(this).parent().fadeOut(400);
	});
	$('.privacy-info-show').click(function(){
		var position = $(this).position();
		var msgWrapperHeight = $('.privacy-stmt-wrapper').height();
		var msgWrapperWidth = $('.privacy-stmt-wrapper').width();
		$('.privacy-stmt-wrapper').css({
			top: position.top-msgWrapperHeight-32, 
			left: (($(document).width()/2) - (msgWrapperWidth/2))});
		$('.privacy-stmt-wrapper').fadeIn();
	});
	$('.agreementLabel').click(function(){
		$(this).toggleClass('selected');
		$('.submitBtn').toggleClass('submitBtnActive');
	});
}

function submitSurvey(){
	var jsonMap = {};
	for(key in dataMap){
		jsonMap[key] = {"percent": dataMap[key].percent};
	}
	var jsonstring=JSON.stringify(jsonMap);
				
	Visualforce.remoting.Manager.invokeAction(
		methodGetSurveyResult,
		jsonstring,
		comments,
		phone,
		testEmail,
		isReferenceCustomer,
		function(result, event) {
			showClosePanel();
	},{escape: false}); 
}