// This is for jslint:
/* global $, $$, $A, Ajax, Effect, window, escape, unescape, Element */

if (tw === undefined) {
    var tw = {};
}
if (tw._common_internal === undefined) {
    tw._common_internal = {};
}

// JavaScript session methods
// ==========================
// JavaScript can persist values which survive page refreshes 
// but not changing tabs or opening another window

// WARNING: window.name is persisted over page reloads / page navigation.
// If the users navigates during the session to another (non ADDM) page 
// the stored values might have been changed. Always sanitise the input
// when using those values.

tw._common_internal.getJSSession = function () {
    if (window.name.indexOf('addmjssession') !== 0) {
        tw._common_internal.jssession = $H({});
        tw._common_internal.saveJSSession();
    } else {
        tw._common_internal.jssession = $H(window.name.substring(13).evalJSON());
    }
};
tw._common_internal.saveJSSession = function () {
    window.name = 'addmjssession' + Object.toJSON(tw._common_internal.jssession);
};

tw.confirm_dialog = undefined; // DOM element, which holds confirm dialog

// Remove a value from the JavaScript session
function jsSessionRemove(key, value) {
    tw._common_internal.getJSSession();
    tw._common_internal.jssession.remove(key);
    tw._common_internal.saveJSSession();
}

// Put a value into the JavaScript session
function jsSessionPut(key, value) {
    tw._common_internal.getJSSession();
    tw._common_internal.jssession.set(key, value);
    tw._common_internal.saveJSSession();
}

// Get a value from the JavaScript session
function jsSessionGet(key) {
    tw._common_internal.getJSSession();
    return tw._common_internal.jssession.get(key);    
}

function doPageRefresh() {
  // Refresh the page

  window.setTimeout(function () {
    window.location.reload(true);
  }, 100);
}

function stopBubble(event) {
    // Stop an event from bubbling up to enclosing dom elements
    // event: The event to stop
    //
    if (!event) {
        event = window.event;
    }
    if (event) {
        Event.stop(event);
    }
}

// Merge two objects
//
function mergeObjects(obj1, obj2){
    var obj3 = {}, attrname;
    for (attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

// Copy an object. This function copies only first-level attributes of the given object.
//
function copyObject(source_obj) {
  "use strict";

  return mergeObjects(source_obj, {});
}

// Bind a context to a function.
// (This function is the replacement for prototype's bind function
//  please use this for newer JavaScript code)
//
// Function this  - Value of "this" variable in the function.
// Function       - The function to bind a context to.
// Function args  - Function arguments (get prepended to any given arguments).
//
function bindContext() {
    var t = arguments[0],
        f = Array.prototype.slice.call(arguments, 1),
        a = f.splice(1);

    return function () {
        return f[0].apply(t,
                          a.concat(Array.prototype.slice.call(arguments, 0)));
    };
}

// Return a "debounced" version of a function.
//
// The function will be called after "timeout_ms", unless another call is made.
// Each call of the debounced function resets the timer.
//
// Inspired by underscore.js library - _.debounce function (but this is much
// simpler).
//
function debounce(func, timeout_ms) {
    "use strict";

    var objref, call_at, func_args;

    var callback = function () {
        if (Date.now() >= call_at) {
            func.apply(objref, func_args);
        }
    };

    return function () {
        call_at = Date.now() + timeout_ms;

        objref = this;
        func_args = arguments;

        window.setTimeout(callback, timeout_ms);
    };
}

// HTML encode a string.
// (This function is the replacement for prototype's escapeHTML function
//  please use this for newer JavaScript code)
//
function encodeHTML(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// trim() was added to JS 1.8.1 and is supported by modern browsers which
// doesn't include IE8 ...
// Ref: http://stackoverflow.com/questions/1418050/string-strip-for-javascript
if(typeof(String.prototype.trim) === "undefined")
{
    String.prototype.trim = function()
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

// Tail-preserving split
//
function tailSplit (str, splitChar, maxSplit) {
    var arr = str.split(splitChar),
        result = arr.splice(0, maxSplit);
    result.push(arr.join(splitChar));
    return result;
}

function constructHelpElement (text, positioned, link, linktext) {
    var info  = new Element('div', { 'class' : 'doclink closed' });
    var tooltip = new Element('div', { 'class' : 'doclink_tooltip' });

    // Add elements
    tooltip.insert(new Element('div').insert(text));
    info.insert(new Element('img', { src : '/styles/default/images/baseline/png/normal/unknown_16.png', alt : 'Information'}));
    info.insert(tooltip);
    tooltip.hide();        
    
    // Add event listeners
    info.down('img').observe('click', function (tooltip, positioned) {
        showTooltip(this, tooltip, positioned);
        autocloser.toggleHolder( info, tooltip);
    }.bind(info, tooltip, positioned));
    
    if (link !== undefined && linktext !== undefined) {
        var linkElement = new Element('a', { 'href' : link,
                                             'class' : 'doclink_link' });
        tooltip.insert(linkElement.insert(linktext));
        linkElement.observe('click', function (link) {
            window.location = link;
        }.bind(linkElement, link));
    }
    return info;
}

function showTooltip (source, tooltipElement, positioned) {
    var pos;
    if (tooltipElement !== undefined && source !== undefined) {
        if (positioned === true) {
            pos = source.positionedOffset();
        } else {
            pos = source.cumulativeOffset();
        }
        tooltipElement.absolutize();
        tooltipElement.setStyle({
            left : pos[0] - 50 + 'px',
            top  : (pos[1] + source.getHeight()) + 'px'
        });
    }
}


// Functions for the Tabs

function showTab(aElem, tabID, ancestorElem) {
    // optional third parameter to handle a CSS selector to  apply scope
    // cope with the case where the 3rd param is empty
    if(typeof ancestorElem === "undefined") {
        cssScope = "";
    } else {
        cssScope = ancestorElem + " ";
    }

    // specify selectors for scoped CSS
    tabSelector = $$("#tabHolder").length ? cssScope + "#tabHolder li.current" :
                                     cssScope + ".tabHolder li.current";
    tabContentSelector = cssScope + ".tabContentHolder";

    // actually do the tab switching
    $$(tabSelector).each(function(elem) {
        elem.removeClassName('current');
        elem.addClassName('inactive');
    });
    $(aElem).removeClassName('inactive');
    $(aElem).addClassName('current');
    $$(tabContentSelector).each(function(elem) {
        elem.removeClassName('openTab');
    });
    $(tabID).addClassName('openTab');
}


function setSelectIndex(sel, val) {
    for (var ii=0; ii < sel.options.length; ii++) {
        if (sel.options[ii].value === val) {
            sel.selectedIndex = ii;
            break;
        }
    }
}


function resetSearch() {
    document.sidebarsearch._tw_searchvalue.value='';
    setSelectIndex(document.sidebarsearch._tw_searchmodule, 'any');
    setSelectIndex(document.sidebarsearch._tw_searchtype, 'word');
    document.sidebarsearch._tw_mineonly.checked=0;
    document.sidebarsearch._tw_addDQ.checked=0;
    
}


function selectAll(tableID) {
    $(tableID).select('INPUT').each(function (e) {
        e.checked = 1;
    });
}


function deselectAll(tableID) {
    $(tableID).select('INPUT').each(function (e) {
        e.checked = 0;
    });
}


function setIframeFocus(objID, formName) {
    if ($(objID)) {
    
        if(navigator.appName === 'Microsoft Internet Explorer') {
            // W061: eval can be harmful
            // Do we even need this?
            eval('document.'+objID+'.'+formName+'.search.focus()');
        } else {
            $(objID).document.formName.search.focus();
        }
    }
}


function setParentFocus(objID) {
    parent.document.getElementById(objID).focus();
}



/* ***** Force Form Submit on Enter ***** */
function submitenter(form, e) {
    var keycode;
    if (window.event) {
        keycode = window.event.keyCode;
    
    } else if (e) {
        keycode = e.which;
    
    } else {
        return true;
    }
        
    if (keycode === 13) {
        form.submit();
        return false;   
    }
    return true;
}

/*
 * Functions to create relationships between elements
 */
function toggleFields(checkbox, enable_if_checked, field1, field2, etc) {
  // Sets the state of given fields based on the given checkbox and enable_if_checked
  // if enable_if_checked is true then checking the box enables the fields
  // if enable_if_checked is false then checking the box disables the fields
  var i, field;
  if (checkbox.checked === enable_if_checked){
      // enable any fields
      for (i = 2; i < arguments.length; i++){
          field = arguments[i];
          $(field).disabled = 0;
      }
  } else {
      // Was checked, now unchecked
      for (i = 2; i < arguments.length; i++){
          field = arguments[i];
          $(field).disabled = 1;
          $(field).value = "";
      }
  }  
}

/*
 * Function to swap class names on all the sub items of the given tagTypes
 * within containerID. Only items having fromClass will be changed to toClass.
 * Additionally the btnToShow will be shown, btnToHide will be hidden if they
 * are defined
 */
function swapClassOnSubItems(containerID, tagTypes,
                             fromClass, toClass, btnToShow, btnToHide) {
    // Change display of buttons
    if (btnToShow !== undefined) {
        // show() won't work here so set style directly
        $(btnToShow).setStyle({display : 'block'});
    }
    if (btnToHide !== undefined) {
        $(btnToHide).hide();
    }

    $(containerID).select(tagTypes).each(function (item) {
        if (item.hasClassName(fromClass)) {
            item.removeClassName(fromClass);
            item.addClassName(toClass);
        }
    });
}


function swapClassOnElement(elementID, fromClass, toClass,
                            btnToShow, btnToHide) {
    // Change display of buttons
    if (btnToShow !== undefined) {
        // show() won't work here so set style directly
        $(btnToShow).setStyle({display : 'block'});
    }
    if (btnToHide !== undefined) {
        $(btnToHide).hide();
    }

    $(elementID).removeClassName(fromClass);
    $(elementID).addClassName(toClass);    
}


function showSeparator(image_dir, id, label) {
    var theTableID = id+'_table';
    var theH3Id = id+'_h3';
    var sep = $(theH3Id);
    if (sep !== null) {
        sep.innerHTML = '<a href="javascript:hideSeparator(\''+image_dir+'\',\''+id+'\',\''+label+'\')"><img src="'+image_dir+'general/png/normal/neutral_less_16.png" alt="-">'+label+'</a>';
        sep.addClassName("sectionOpen");
        sep.removeClassName("sectionClosed");
        if(navigator.appName === 'Microsoft Internet Explorer')
        {
            $(theTableID).style.display='block';
        }
        else
        {
            $(theTableID).style.display='table';
        }
    }
}


function hideSeparator(image_dir, id, label) {
    var theTableID = id+'_table';
    var theH3Id = id+'_h3';
    var sep = $(theH3Id);
    if (sep !== null) {
        sep.innerHTML = '<a href="javascript:showSeparator(\''+image_dir+'\',\''+id+'\',\''+label+'\')"><img src="'+image_dir+'general/png/normal/neutral_more_16.png" alt="+">'+label+'</a>';
        sep.addClassName("sectionClosed");
        sep.removeClassName("sectionOpen");
        $(theTableID).style.display='none';
    }
}


        
/* ***** Visibility hiddenfunction ***** */
function daHidden(layerID) {
    $(layerID).style.visibility = 'hidden';
}

/* ***** Display block function ***** */
function daBlock(layerID) {
    $(layerID).style.display = 'block';
}

/* ***** Display none function ***** */
function daNone(layerID) {
    $(layerID).style.display = 'none';
}


/* ***** Check the syntaxis ***** */
function checkMySyn(id) {
    var syn = id.value;
    if (syn.match(/^[a-zA-Z_][a-zA-Z0-9_.]*$/) === null) {
        $('permitted').hide();
        $('not_permitted').show();
    } else {
        $('permitted').show();
        $('not_permitted').hide();
    }
}


/* ********** GENERAL COOKIE FUNCTIONS ********** */
function setCookie(name, value, lifespan, access_path) {
      
    var cookietext = name + "=" + escape(value);
    if (lifespan) {  
        var today = new Date();
        var expiredate = new Date();
        expiredate.setTime(today.getTime() + 1000*60*60*24 * lifespan);
        cookietext += "; expires=" + expiredate.toGMTString();
    }
    if (access_path !== null) { 
      cookietext += "; PATH="+access_path;
    }
   document.cookie = cookietext;
   return null;
}


function getCookie(Name) {
    var search = Name + "=";
    var CookieString = document.cookie;
    var result = null;
  
    if (CookieString.length > 0) {
        var offset = CookieString.indexOf(search);
        if (offset !== -1) {
            offset += search.length;
            var end = CookieString.indexOf(";", offset);
            if (end === -1) {  
                end = CookieString.length;
            }
            result = unescape(CookieString.substring(offset, end));
        }
    }
    return result;                                
}


function deleteCookie(Name, Path) {
    setCookie(Name, "Deleted", -1, Path);
}



function deleteAllGather() {
    
    if ($('checkAllGather').checked) {

        $$('tbody#gatherFilesBody input.deleteGather').each(function (e) {
            e.checked = 1;
        });

    } else {

        $$('tbody#gatherFilesBody input.deleteGather').each(function (e) {
            e.checked = 0;
        });

    }
}


/* ********** Schedule dialog functions ********** */

// Function to choose frequency type.

function chooseScheduleFrequency(select, id_prefix) {
  "use strict";

  // Hide everything.

  $$('.scheduleFrequency').each(function(e) {
    e.hide();
  });

  // Display based on choice.

  var frequency = select.options[select.selectedIndex].value;
  var end_time, today;

  if (frequency === 'week_days') {
    $$('.scheduleFrequencyWeekDays').each(function(e) {
      e.show();
    });

    // Select all days.

    $(id_prefix + '_schedule_week_days_start_holder').select('input').each(function(e) {
      var hidden = $('hidden_' + e.id);

      if (e.hasAttribute('week_day')) {
        e.addClassName('frequencyInputSelect');
        hidden.value = 'value';
      }
    });
    // Default to selecting end time.

    end_time = $(id_prefix + '_schedule_week_days_have_end');

    if (end_time) {
      end_time.checked = true;
    }

  } else if (frequency === 'week_once') {
    $$('.scheduleFrequencyWeekOnce').each(function(e) {
      e.show();
    });

    // Select today.

    today = new Date();
    var week_day = today.getDay();

    $(id_prefix + '_schedule_week_once_start_week_day').select('option').each(function(e) {
      if (e.value == week_day) {
        e.selected = true;
      }
    });
    $(id_prefix + '_schedule_week_once_end_week_day').select('option').each(function(e) {
      if (e.value == week_day) {
        e.selected = true;
      }
    });
    // Default to selecting end time.

    end_time = $(id_prefix + '_schedule_week_once_have_end');

    if (end_time) {
      end_time.checked = true;
    }

  } else if (frequency === 'month_day') {
    $$('.scheduleFrequencyMonthDay').each(function (e) {
      e.show();
    });
    // Select today.

    today = new Date();
    var month_day = today.getDate();

    $(id_prefix + '_schedule_month_day_start_day').select('option').each(function(e) {
      if (e.value == month_day) {
        e.selected = true;
      }
    });
    $(id_prefix + '_schedule_month_day_end_day').select('option').each(function(e) {
      if (e.value == month_day) {
        e.selected = true;
      }
    });
    // Default to selecting end time.

    end_time = $(id_prefix + '_schedule_month_day_have_end');

    if (end_time) {
      end_time.checked = true;
    }

  } else if (frequency === 'month_week') {
    $$('.scheduleFrequencyMonthWeek').each(function (e) {
      e.show();
    });
    // Default to selecting end time.

    end_time = $(id_prefix + '_schedule_month_week_have_end');

    if (end_time) {
      end_time.checked = true;
    }
  } else if (frequency === 'hourly') {
    $$('.scheduleFrequencyHourly').each(function (e) {
      e.show();
    });
  }
}


// Check if schedule is valid.

function validateSchedule(schedule, id_prefix, min_duration) {
  "use strict";

  // Check expecting a schedule.

  if (schedule) {
    if (!$(schedule).checked) {
      return true;
    }
  }
  // Check days.

  var select       = $(id_prefix + '_schedule_frequency'),
      frequency    = select.options[select.selectedIndex].value,
      failure      = '',
      time_base_id = null,
      time_fields  = null;

  if (frequency === 'week_days') {
    if (!$(id_prefix + '_schedule_week_days_start_holder').select('input').any(function(e) {
          return e.hasClassName('frequencyInputSelect');
        })) {
      failure = 'No day selected';
    }
    time_base_id = id_prefix + '_schedule_week_days';
    time_fields  = $A(['start_hour', 'end_hour', 'start_minute', 'end_minute']);
  } else if (frequency === 'week_once') {
    time_base_id = id_prefix + '_schedule_week_once';
    time_fields  = $A(['start_week_day', 'end_week_day', 'start_hour',
                       'end_hour', 'start_minute', 'end_minute']);
  } else if (frequency == 'month_day') {
    time_base_id = id_prefix + '_schedule_month_day';
    time_fields  = $A(['start_day', 'end_day', 'start_hour',
                       'end_hour', 'start_minute', 'end_minute']);
  } else if (frequency == 'month_week') {
    time_base_id = id_prefix + '_schedule_month_week';
    time_fields  = $A(['end_days', 'start_hour', 'end_hour',
                       'start_minute', 'end_minute']);
  }
  // Check times.

  if (time_base_id && !failure) {
    // Check for option to have no end time.

    var end_time = $(time_base_id + '_have_end');

    if (!end_time || end_time.checked) {
      // Have end time so ensure have a valid duration.

      var values = [];

      time_fields.each(function(e) {
        var select = $(time_base_id + '_' + e);

        values.push(parseInt(select.options[select.selectedIndex].value));
      }, values);

      // Extract duration information.

      var duration_days,
          duration_hours,
          duration_minutes;

      if (frequency === 'week_days') {
        duration_days    = 0;
        duration_hours   = values[1] - values[0];
        duration_minutes = values[3] - values[2];

        if ((duration_hours < 0) ||
            ((duration_hours === 0) && (duration_minutes < 0)))
          duration_days = 1;

      } else if (frequency === 'week_once') {
        duration_days    = values[1] - values[0];
        duration_hours   = values[3] - values[2];
        duration_minutes = values[5] - values[4];

        if ((duration_days < 0) ||
            ((duration_days === 0) &&
             ((duration_hours < 0) ||
              ((duration_hours === 0) && (duration_minutes < 0)))))
          duration_days += 7;

      } else if (frequency === 'month_day') {
        duration_days    = values[1] - values[0];
        duration_hours   = values[3] - values[2];
        duration_minutes = values[5] - values[4];

        if ((duration_days < 0) ||
            ((duration_days === 0) &&
             ((duration_hours < 0) ||
              ((duration_hours === 0) && (duration_minutes < 0)))))
          duration_days += 31;

      } else if (frequency === 'month_week') {
        duration_days    = values[0];
        duration_hours   = values[2] - values[1];
        duration_minutes = values[4] - values[3];

      }
      // Validate duration.

      var duration = duration_days * 24 * 60 * 60 +
                     duration_hours * 60 * 60 +
                     duration_minutes * 60;

      if (duration < 0)
        failure = 'For same day start time must precede end time';

      else if (min_duration && (duration <= min_duration)) {
        failure = 'Duration must be more than ';

        var minutes = min_duration / 60,
            seconds = min_duration % 60;

        if (minutes) {
          failure += minutes + ' minute';

          if (minutes > 1)
            failure += 's';
        }
        if (seconds) {
          if (minutes)
            failure += ' and ';

          failure += seconds + ' second';

          if (seconds > 1)
            failure += 's';
        }
      }
      else if (duration === 0)
        failure = 'Start and end time must differ';

      else if (duration >= 28 * 24 * 60 * 60)
        failure = 'Duration must be less than 28 days';
    }
  }
  // Update display.

  if (failure) {
    $(id_prefix + '_schedule_error_msg').update(failure);
    $(id_prefix + '_schedule_error').show();
    return false;
  }
  $(id_prefix + '_schedule_error').hide();
  return true;
}


// Toggle day or day of week buttons.

function toggleScheduleInput(input) {
  "use strict";

  var hidden = $('hidden_' + input.id);

  if (input.hasClassName('frequencyInputSelect')) {
    input.removeClassName('frequencyInputSelect');
    hidden.value = '';
  } else {
    input.addClassName('frequencyInputSelect');
    hidden.value = 'value';
  }
}


// Flag if scan has end time rather than until completion.

function toggleScheduleEndTime(row, no_end_time) {
  "use strict";

  $(row).select('select').each(function (e) {
    e.disabled = no_end_time;
  });
}


// Check pill UI content reporting errors.

function validateScheduleRange(event, range, range_error, range_error_msg) {
  "use strict";

  range = $(range);
  range.finishInput();

  // Make sure the pill content is valid.

  if (!range.contentIsValid()) {
    if (range.isEmpty()) {
      $(range_error_msg).update('Please enter one or more ranges');
    } else {
      $(range_error_msg).update('Please correct the invalid ranges');
    }
    $(range_error).show();
    stopBubble(event); // event will be undefined for key presses
    return false;
  }
  $(range_error).hide();
  return true;
}


function submitAndCloseEnter(form, event) {
  "use strict";

  if ((event.keyCode === Event.RETURN_KEY) ||
      (event.charCode === 13)) {
    form.submit();
    Control.Modal.close();
    return false;
  }
  return true;
}


function alertChange(changedElem) {
    $(changedElem).style.background='#f93';
    $('changeWarning').style.visibility='visible';
}


function addEventListening(holder) {
    $A([ $(holder).select('input'), 
         $(holder).select('select'), 
         $(holder).select('textarea')
      ]).flatten().each(function (e) {
    
        // W054: The Function constructor is a form of eval.
        // This needs fixing/replacing/removing
        if (!e.hasClassName('doNotHighlight')) {
            var my_onchange = "alertChange('" + e.id + "')";
            var onChangeHandler = new Function(my_onchange); 
            if (e.addEventListener) {
                e.addEventListener('change', onChangeHandler, false ); 
            } else if (e.attachEvent) {
                e.attachEvent('onchange', onChangeHandler); 
            }
        }
    });
}
 
 
function findPos(obj) {
    var curleft, curtop;
    curleft = curtop = 0;
    if (obj.offsetParent) {
        do {
          curleft += obj.offsetLeft;
          curtop += obj.offsetTop;
        
          obj = obj.offsetParent;
        } while (obj);
    }
    return [curleft,curtop];
}

function submitFormWithHiddenField (form_name, hidden_name, confirm_msg) {
    /* Function for submitting a form after first displaying a confirmation
     message and creating a hidden input field. This function has been
     used to display links instead of submit buttons.
     */

    if (confirm_msg) {
        showConfirmDialog(
            "Confirmation required",
            confirm_msg,
            bindContext(null, submitFormWithHiddenField, form_name, hidden_name, undefined)
        );
        autocloser.forceClose();
        return;
    }

    // Create hidden field
    var hidden_element = document.createElement("input");
    hidden_element.setAttribute("type", "hidden");
    hidden_element.setAttribute("name", hidden_name);
    hidden_element.setAttribute("value", true);

    // Submit form after appending hidden input field
    var form_element = $(form_name);
    if (form_element) {
        form_element.appendChild(hidden_element);
        form_element.submit();
    }
}


// COMMON AJAX FUNCTIONS

function isClusterErrorResponse(response) {
    if (response.getHeader("X-Addm-Exception-Type") !== null &&
        response.getHeader("X-Addm-Exception-Type").substring(0, 7) === 'cluster') {
          return true;
    }
    return false;
}

function mustDisplayClusterMgmtLink(response) {
    return (response.getHeader("X-Addm-Exception-Type") === 'cluster_show_link');
}

function getErrorMessageFromAddmHeader(response) {
    return response.getHeader("X-Addm-Error-Message");
}

// Check to see if ajax_login_redirect_path is defined and
// see the default if not. The use of typeof here is important
// as it handles the case where ajax_login_redirect_path is
// not declared at all.

if (typeof ajax_login_redirect_path === "undefined") {
    var ajax_login_redirect_path = '/ui/AjaxLoginRedirect';
}

function redirectToLogin(errorMsg) {
    // On an appliance/DaaS:
    // POST to AjaxLoginRedirect to setMessageBoard and redirect
    // to current page. Relative URL of the current page is passed 
	// to the backend to avoid security issues regarding open redirects
	// (see DRUD1-22089). Absolute URLs will not be processed by the 
	// backend and will be redirected to /Home
    //
    // On the Outpost the behaviour is the same but the URLs are different

    var formRedirect = new Element('form',
            {method: 'post', action: ajax_login_redirect_path});
    formRedirect.insert(new Element('input',
            {name: 'errorMsg', value: errorMsg, type: 'hidden'}));
    formRedirect.insert(new Element('input',
            {name: 'url', value: window.location.pathname+window.location.search, type: 'hidden'}));
    $(document.body).insert(formRedirect);
    formRedirect.submit();
}

/**
 * Parameters:
 *
 * - url: The URL to call. Do not include any parameters.
 * - params: A dictionary of parameters to use. Added to the URL if request
 *       is a GET, or as request parameters if a POST.
 * - idOfElementToUpdate: The id of a DOM element whose innerHTML will be
 *       set to the response, or null to do more sophisticated updates.
 * - callback (optional): A function to call if the call was successful and
 *       didn't lead to a redirect.
 * - method (optional): HTTP method to use for the request. Defaults to POST.
 * - errorMsg (optional): An error message to be used when the session has
 *       timed out. This will be passed as a hidden field on a POST request to
 *       the AjaxLoginRedirect URL and will be redirected to current URL for
 *       display on the message board.
 * - useMessageBoard (optional): Boolean. If true writes any errors to the
 *       message board instead of to idOfElementToUpdate or to an alert box
 *       (defaults to false).
 * - parseErrCallBack (optional): A function to call if an expected JSON 
 *       response cannot be parsed.
 * - requestHeaders (optional): A dictionary of request headers to set.
 * - failureCallback (optional): A function to call if the request has failed.
 */
 
function doAjaxCall(url, params, idOfElementToUpdate,
                    callback, method, errorMsg, useMessageBoard, 
                    parseErrCallBack, requestHeaders, failureCallback) {

    if (!method) {
        method = 'post';
    }
    if (useMessageBoard === undefined) {
        useMessageBoard = false;
    }
    new Ajax.Request(url, {
        method: method,
        parameters: params,
        requestHeaders: requestHeaders,
        
        onSuccess: function (callback, transport) {
            if (idOfElementToUpdate !== null) {
                var response = transport.responseText || "no response text";
                $(idOfElementToUpdate).update(response);
                if (callback !== undefined) {
                    callback(transport);
                }
            } else {
                var data;
                try {
                    data = transport.responseText.evalJSON(true);
                } catch(err) {
                    if (parseErrCallBack !== undefined) {
                        parseErrCallBack("Exception during ajax request", err);
                    } else if (window.console !== undefined) {
                        window.console.log("Exception during ajax request", err);
                    }
                    return;
                }

                var redirect = data.redirect;
                var reload = data.reload;
                var updates = data.updates;
                var return_value = data.return_value;
                
                if (redirect) {
                    document.location = redirect;
                    
                } else if (reload) {
                    window.location.reload();
                    
                } else if (updates) {
                    
                    for (var ii = 0; ii < updates.length; ii++) {
                    
                        var id_to_update = updates[ii][0];
                        var html = updates[ii][1];
                        
                        if ($(id_to_update)) {
                            $(id_to_update).update(html);
                            if (data.highlight) {
                                // Highlight the changed element
                                Effect.Pulsate( $(id_to_update), { duration: 0.5, pulses: 1, from: 0.7 } );
                            }
                        
                        } else {
                            alert("Can't find item with id " + id_to_update + " " + html);
                        }
                    }
                    
                    if (callback !== undefined) {
                      callback(transport);
                    }
                    
                    if (return_value) {
                        return return_value;
                    } else {
                        return;
                    }
                } else if (return_value) {
                    if (callback !== undefined) {
                        callback(transport);
                    }
                    return return_value;
                }
            }
        }.bind(this, callback),
        
        onFailure: function(response){
            if (response.status === 403) {
                if (errorMsg === undefined) {
                    errorMsg = 'Failed to perform requested action as the session timed out.';
                }
                redirectToLogin(errorMsg);
            } else if (response.status === 409) {
                alert("This page is out of date; please refresh and try again.");
            } else if (isClusterErrorResponse(response)) {
                var error_title = "The BMC Discovery cluster is experiencing problems";
                var error_msg = getErrorMessageFromAddmHeader(response);
                if (error_msg === null) {
                    error_msg = "Unexpected failure during cluster operations";
                }
                if(idOfElementToUpdate !== null || useMessageBoard) {
                    var refer_msg;
                    if (mustDisplayClusterMgmtLink(response)) {
                        refer_msg = 'Please visit <a href="/ui/ClusterManagement" title="Cluster Management Page">Cluster Management</a>.';
                    } else {
                        refer_msg = 'Please contact your BMC Discovery administrator.';
                    }
                    if (!useMessageBoard) {
                        // Update the DOM element
                        $(idOfElementToUpdate).innerHTML = [
                          '<h6 class="errorMsg"><img src="/styles/default/images/general/gif/alert_16.gif" alt="Error"> ' + error_title + '</h6>',
                          '<p>' + error_msg + '</p>',
                          '<p>' + refer_msg + '</p>'].join('');
                        return;
                    } else if (messageBoardRaise(error_msg + " " + refer_msg, error_title)) {
                        // The message board has been set successfully
                        window.scrollTo(0,0);
                        return;
                    }
                }
                // Show an alert window
                if (mustDisplayClusterMgmtLink(response)) {
                    alert(error_title + "\n" + error_msg +
                          "\nPlease visit the Cluster Management page.");
                } else {
                    alert(error_title + "\n" + error_msg +
                          "\nPlease contact your BMC Discovery administrator.");
                }
            } else {
                if (idOfElementToUpdate !== null && !useMessageBoard) {
                    $(idOfElementToUpdate).innerHTML =
                        '<strong>ERROR!</strong> Response ' + response.status;
                    //if debug has been enabled then display the complete error page
                    if(window.location.href.indexOf("debug=") !== -1) {
                        $("error").style="display:block";
                        $("error").innerHTML = response.statusText;
                    }
                    return;
                }
                var msg = "ERROR: " + response.status;
                if (useMessageBoard) {
                    if (response.statusText !== undefined) {
                        msg += " " + response.statusText;
                    }
                    if (messageBoardRaise(msg, "Internal error")) {
                        window.scrollTo(0,0);
                        if (failureCallback !== undefined) {
                            failureCallback(response);
                        }
                        return;
                    }
                }
                if (response.statusText !== undefined) {
                    msg += "\n" + response.statusText;
                }
                alert(msg);
                if (failureCallback !== undefined) {
                    failureCallback(response);
                }
            }
        }
    });
}



// Multiple file selector by Stickman -- http://www.the-stickman.com 
// with thanks to: [for Safari fixes] Luis Torrefranca -- http://www.law.pitt.edu and Shawn Parker & John Pennypacker -- http://www.fuzzycoconut.com [for duplicate name bug] 'neal'
function MultiSelector(list_target, hiddenInput, max) {

    // Where to write the list
    this.list_target = list_target;
    
    // How many elements?
    this.count = 0;
    
    // How many elements?
    this.id = 0;
    
    // Is there a maximum?
    if (max) {
        this.max = max;
    } else {
        this.max = -1;
    }
    
    /**
     * Add a new file input element
     */
    this.addElement = function (element) {

        // Make sure it's a file input element
        if (element.tagName === 'INPUT' && element.type === 'file') {

            // Element name -- what number am I?
            element.name = 'file_' + this.id++;

            // Add reference to this object
            element.multi_selector = this;

            // What to do when a file is selected
            element.onchange = function() {

                // New file input
                var new_element = document.createElement('input');
                new_element.type = 'file';
                new_element.className = 'mappingFileElem';

                // Add new element
                this.parentNode.insertBefore(new_element, this);

                // Apply 'update' to element
                this.multi_selector.addElement(new_element);

                // Update list
                this.multi_selector.addListRow(this);

                // Hide this: we can't use display:none because Safari doesn't like it
                this.style.position = 'absolute';
                this.style.left = '-1000px';
            };
            
            // If we've reached maximum number, disable input element
            if( this.max !== -1 && this.count >= this.max ){
                element.disabled = true;
            }

            // File element counter
            this.count++;
            
            // Most recent element
            this.current_element = element;
            
            hiddenInput.value = this.count-1;
            
        } else {
            // This can only be applied to file input elements!
            alert( 'Error: not a file input element' );
        }

    };

    /**
     * Add a new row to the list of files
     */
    this.addListRow = function (element) {

        // Row div
        var new_row = document.createElement('div');
        new_row.className = 'mappingFileName';

        // Delete button
        var new_row_button = document.createElement('input');
        new_row_button.type = 'button';
        new_row_button.value = 'Delete';

        // References
        new_row.element = element;

        // Delete function
        new_row_button.onclick = function() {

            // Remove element from form
            this.parentNode.element.parentNode.removeChild(this.parentNode.element);

            // Remove this row from the list
            this.parentNode.parentNode.removeChild(this.parentNode);

            // Decrement counter
            this.parentNode.element.multi_selector.count--;

            // Re-enable input element (if it's disabled)
            this.parentNode.element.multi_selector.current_element.disabled = false;
            
            hiddenInput.value = this.parentNode.element.multi_selector.count - 1;
            
            // Appease Safari
            //    without it Safari wants to reload the browser window
            //    which nixes your already queued uploads
            return false;
        };

        // Set row value
        new_row.innerHTML = '<span class="newMappingNameHolder">'+element.value+'</span>';

        // Add button
        new_row.appendChild(new_row_button);

        // Add it to the list
        this.list_target.appendChild(new_row);
    };
}


// Table sorting

var isIECheck = /*@cc_on!@*/false;

function inner_tablesort(clicky, table, columnIndex, hiddenClassName){
    // Remove the focus
    //
    clicky.blur();
    
    // If a sort icon was present somewhere on the table, remove it
    //
    $(table).select('span#sort_icon').invoke("remove");
    
    // prepare a new icon to put up, tentativelly with an ascending order
    //
    var sorticon = document.createElement('span');
    sorticon.id = "sort_icon";
    sorticon.innerHTML = isIECheck ? '<font face="webdings">5</font>&nbsp' : '&#x25B4;&nbsp;';
    
    // Retrieve the rows we need to sort
    //
    var table_body = table.down('tbody');    
    var unsortedRows = $(table_body).select('tr');
    
    // Was this sorted before, and if yes, how?
    //
    var current_sort;
    if (table_body.sort_column === columnIndex) {
        current_sort = table_body.sort_order;
    }
    
    // Sort them by the requested column
    //
    var context = { columnIndex: columnIndex };
    
    var sortedRows = unsortedRows.sortBy(function (node) {
        return node.select('td')[this.columnIndex].readAttribute('sorting_value');
    }.bind(context));
    
    if(current_sort === undefined) {
        // Insert the ascending sort icon
        //
        clicky.insertBefore(sorticon, clicky.firstDescendant());
        
        // remember
        table_body.sort_column = columnIndex;
        table_body.sort_order = 'ascending';

    } else if (current_sort === 'ascending') {
        // This was already sorted, reverse the sort
        //
        sortedRows.reverse();
        
        // Show the descending sort icon
        //
        sorticon.innerHTML = isIECheck ? '<font face="webdings">6</font>&nbsp;' : '&#x25BE;&nbsp;';
        clicky.insertBefore(sorticon, clicky.firstDescendant());
    
        // remember
        table_body.sort_column = columnIndex;
        table_body.sort_order = 'descending';

    } else if (current_sort === 'descending') {
    
        // This was already reversed, revert to original sort
        //
        sortedRows = unsortedRows.sortBy(function(node){
            return node.readAttribute('initial_sort');
        });
    
        // remember
        table_body.sort_column = -1;
    }

    // Do we need to show/hide the column or is it already all visible?
    //
    var hidden = $A(table_body.getElementsByClassName(hiddenClassName));
    
    if(hidden.size() > 0) {
        // Show everything
        //
        hidden.each(function(item, i) {
            item.removeClassName(hiddenClassName);
        });
        
        // Hide everything but the first 5 items
        //
        sortedRows.each(function(item, i) {
            if(i >= 5) {
                item.addClassName(hiddenClassName);
            }
        });
    }
    
    // Moving everything in place is easier to do in reverse
    //
    sortedRows.reverse();    
    sortedRows.each(function(item, i) {
        this.insertBefore(item, this.firstDescendant());
    }.bind(table_body));
    

    return false;
}


//this function helps IE6 with png
function fixPNG(element)
{
    if (versionOfIE().version <=6) {
        var src;

        if (element.tagName === 'IMG') {
            if (/\.png$/.test(element.src)) {
                src = element.src;
                element.src = "/styles/default/images/transparent.gif";
            }
        } else {
            src = element.currentStyle.backgroundImage.match(/url\("(.+\.png)"\)/i);
            if (src) {
                src = src[1];
                element.runtimeStyle.backgroundImage="none";
            }
        }

        if (src) {
            element.runtimeStyle.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + src + "',sizingMethod='scale')";
        }
    }
}

/* 
    This function gets IE version
    it returns an object with:
    obj.version - 5,6,7,8,9, etc or 'not IE'
    obj.compatibility - if this mode is on
    obj.quirks - if quirks mode is on

    if function returns 'not IE' string it won't cause any harm in checking such    
       if (obj.version > 6) because comparing string with digits returns false

       Number('not IE') yields NaN, and (NaN > 6) is false

    WARNING: This function only works up to IE10. From IE11 onwards 'not IE'
             will be returned. Hopefully that is not a problem as we should not
             need to do browser version sniffing anymore with higher versions.
*/

function versionOfIE() {    
    
    var agent = navigator.userAgent,
        tridentToken = parseInt(agent.substring(agent.indexOf('Trident/') + 8), 10),
        browserMode = parseInt(agent.substring(agent.indexOf('MSIE') + 5), 10),
        documentMode = document.documentMode,
        browser = {version: browserMode || 'not IE', compatibility: false, quirks: false};

    // IE9
    if (tridentToken === 5) {
        browser.version = 9;
        if (browserMode === 7) {
            browser.compatibility = true;
        }
    }

    // IE8 
    if (tridentToken === 4) {
        browser.version = 8;
        if (browserMode === 7) {
            browser.compatibility = true;
        }
    }

    // IE6
    if (browserMode === 6) {
        browser.version = 6;
    }

    // IE7
    if ((browserMode === 7) && isNaN(tridentToken)) {
        browser.version = 7;
    }

    // IE Quirks mode
    if (documentMode === 5) {
        browser.quirks = true;
    }

    return browser;
}


tw._common_internal.toggleSubMenu = function (togglerId, subMenuId) {
    "use strict";

    var menu = $(subMenuId);
    var toggler = $(togglerId);
    var parentMenu = $(togglerId).up('.actionDropdownMenu');

    var isClosed = toggler.hasClassName('closed');
    menu.style.left = (Prototype.Browser.IE6) ? parentMenu.clientWidth - 7 + 'px' : parentMenu.clientWidth + 'px';

    if (isClosed) {
        toggler.removeClassName('closed');
        Effect.Appear(menu, {
            duration: 0.3, afterFinish: function () {
                if (menu.clientHeight > '385') {
                    menu.childElements()[0].style.height = '385px';
                }
            }
        });
    }
    else {
        menu.hide();
        toggler.addClassName('closed');    
    }
};


// There is a similar function at
// python/common/timeutil.py:whenWasThat
// Please ensure you modify them both


// Makes human-readable text of time delta
//
// delta - time delta in seconds, supposed to be integer
//
function whenWasThat(delta) {
    "use strict";

    var timeRound = function (delta, unit, k) {
        if (k === undefined) {
            k = 0;
        }
        return Math.floor(delta / unit + k);
    };

    var SEC_ONE_SECOND =   1,
        SEC_ONE_MINUTE =  60 * SEC_ONE_SECOND,
        SEC_ONE_HOUR   =  60 * SEC_ONE_MINUTE,
        SEC_ONE_DAY    =  24 * SEC_ONE_HOUR,
        SEC_ONE_WEEK   =   7 * SEC_ONE_DAY,
        SEC_ONE_MONTH  =  30 * SEC_ONE_DAY,
        SEC_ONE_YEAR   = 365 * SEC_ONE_DAY;

    if (delta === 0)
        return "now";
    if (delta < SEC_ONE_MINUTE)
        return "less than a minute ago";
    if (delta < 2 * SEC_ONE_MINUTE)
        return "a minute ago";
    if (delta < 16 * SEC_ONE_MINUTE)
        return timeRound(delta, SEC_ONE_MINUTE) + " minutes ago";
    if (delta < 57 * SEC_ONE_MINUTE)
        return (5 * timeRound(delta, 5 * SEC_ONE_MINUTE, 0.4)) + " minutes ago";
    if (delta < SEC_ONE_HOUR + 15 * SEC_ONE_MINUTE)
        return "an hour ago";
    if (delta < SEC_ONE_HOUR + 45 * SEC_ONE_MINUTE)
        return "an hour and a half ago";
    if (delta < 2 * SEC_ONE_HOUR + 15 * SEC_ONE_MINUTE)
        return "2 hours ago";
    if (delta < 2 * SEC_ONE_HOUR + 45 * SEC_ONE_MINUTE)
        return "2 and a half hours ago";
    if (delta < 22 * SEC_ONE_HOUR)
        return timeRound(delta, SEC_ONE_HOUR, 0.25) + " hours ago";
    if (delta < SEC_ONE_DAY + 18 * SEC_ONE_HOUR)
        return "a day ago";
    if (delta < 21 * SEC_ONE_DAY)
        return timeRound(delta, SEC_ONE_DAY, 0.25) + " days ago";
    if (delta < 5 * SEC_ONE_WEEK)
        return timeRound(delta, SEC_ONE_WEEK) + " weeks ago";
    if (delta < 2 * SEC_ONE_MONTH)
        return "a month ago";
    if (delta < 12 * SEC_ONE_MONTH)
        return timeRound(delta, SEC_ONE_MONTH) + " months ago";
    if (delta < 18 * SEC_ONE_MONTH)
        return "over a year ago";
    if (delta < 24 * SEC_ONE_MONTH)
        return "a year and a half ago";
    return timeRound(delta, SEC_ONE_YEAR, 1 / 12.0) + " years ago";
}

// Makes human-readable text of time delta
//
// delta - time delta in DCE, supposed to be integer
//
function whenWasThatDCE(delta) {
    "use strict";
    return whenWasThat(Math.floor(delta / 10000000));
}

// The isElementInViewport() functions comes from:
// http://stackoverflow.com/questions/123999
//
function isElementInViewport(el) {
    var rect = $(el).getBoundingClientRect();

    // We need to exclude pageHeader height from the viewport since
    // it has fixed position on page
    var offset = $('pageHeader') ? $('pageHeader').offsetHeight : 0;

    return (
        rect.top - offset >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Returns all common page formats and size for them in mm
//
function getPageFormats() {
    return [
        {format: "A4",              size: [297, 210]},
        {format: "A3",              size: [420, 297]},
        {format: "A2",              size: [594, 420]},
        {format: "A1",              size: [841, 594]},
        {format: "A0",              size: [1189, 841]},
        {format: "Legal",           size: [356, 216]},
        {format: "Letter / ANSI A", size: [279, 216]},
        {format: "Ledger / ANSI B", size: [432, 279]},
        {format: "ANSI C",          size: [559, 432]},
        {format: "ANSI D",          size: [864, 559]},
        {format: "ANSI E",          size: [1118, 864]}
    ];
}

// Show confirmation dialog with "Yes" and "No" buttons or an information
// message with "OK" button.
//
// title            - title of the dialog,
// text             - description displayed inside the dialog,
// yes_btn_handler  - function to be called when YES button is clicked,
// no_btn_handler   - function to be called when NO button is clicked
// propagate_clicks - set to true if button click events should be propagated
//                    to other elements. The default behaviour is to "capture"
//                    the events and stop propagation.
// is_alert         - set to true if need to show only information message
//                    with OK button
// yes_btn_label    - Optional: the label to put on "Yes" / "OK" button.
// no_btn_label     - Optional: the label to put on "No" button. Only makes
//                    sense when is_alert is not true.
// auto_close       - Optional: when false, does not automatically close the
//                    dialog when buttons are clicked.
// extra_content    - Optional: extra Prototype.js Element to insert below
//                    the text section. It will be inserted inside a div.
function showConfirmDialog (title, text, yes_btn_handler, no_btn_handler,
                            propagate_clicks, is_alert,
                            yes_btn_label, no_btn_label,
                            auto_close, extra_content) {
    "use strict";

    // is_alert  -> default to "OK"
    // !is_alert -> default to "Yes"
    yes_btn_label = (yes_btn_label === undefined) ?
                    ((is_alert) ? "OK" : "Yes") : yes_btn_label;
    no_btn_label  = (no_btn_label === undefined) ? "No" : no_btn_label;
    auto_close    = (auto_close === undefined) ? true : auto_close;

    // HTML elements required for the modal dialog are not created until the DOM is fully 
    // loaded. In case it is needed beforehand, we initialise directly here to 
    // avoid accessing non-existent elements.
    Control.Modal.load();

    // Create contents of modal dialog
    var dialog,
        modal_max_height,
        dummy_el = new Element("div", {style: "width: 520px;"}),
        buttons = new Element("div", {"class": "modal-footer"}),
        content_div = new Element("div", {
        id: "confirm-dialog",
        style: "display: none;"
    });

    content_div.insert("<div class=\"modal-header\">" + title + "</div>");
    content_div.insert("<div class=\"confirm-dialog-content\">" + text + "</div>");

    if (extra_content) {
        var wrapped = extra_content.wrap(
            new Element("div", {"class": "confirm-dialog-extra-content"})
        );

        content_div.insert({"bottom": wrapped});
    }

    buttons.insert(
        new Element("button", {
            "class" : "button primary",
            "id"    : "confirm-collection-yes-button"
        }).update(yes_btn_label)
    );

    // Strange way to have spacing between buttons
    buttons.insert(new Element("span").update("&nbsp;"));

    // Need to specifically define an onclick attribute
    // here to make the button work correctly.
    if(!is_alert) {
        buttons.insert(
            new Element("button", {
                "class"   : "button secondary",
                "id"      : "confirm-collection-no-button"
            }).update(no_btn_label)
        );
    }

    content_div.insert(buttons);

    // Adding an 'overflow-y' property to the modal content will add an ugly
    // empty scroll bar to the regular modal window. We need to add a custom
    // class with 'overflow' property only when the modal content is too big to
    // fit the whole modal in the viewport.

    // When the modal title is over the page header it looks confusing, since
    // both have a similar background and in this case modal window takes the
    // whole viewport. Better add an offset between modal and viewport borders.
    modal_max_height = Control.Modal.getWindowHeight() - ($('pageHeader') ?
                       ($('pageHeader').offsetHeight * 2) : 0) - 20;

    dummy_el.insert(content_div.innerHTML);
    $$('body')[0].insert(dummy_el);

    if (dummy_el.offsetHeight >= modal_max_height) {
        // Set max-height as max possible modal height without its title and
        // footer buttons. Add corresponding class.
        dummy_el.select('.confirm-dialog-content')[0].innerHTML = '';
        content_div.down('.confirm-dialog-content')
            .addClassName('scroll-content')
            .setStyle({
               maxHeight: modal_max_height - dummy_el.offsetHeight + "px"
            });
    }

    dummy_el.remove();

    // Create confirm dialog or update its content if it already exists
    if (!tw.confirm_dialog) {
        var body = $$("body")[0],
            modal_div = new Element("div"),
            on_escape = function () {
                if (no_btn_handler !== undefined) {
                    no_btn_handler();
                }
                if (auto_close) {
                    Control.Modal.close();
                }
            };
        
        body.insert(modal_div);
        modal_div.insert(content_div);

        modal_div.insert(
            new Element("a", {
                href  : "#confirm-dialog",
                id    : "confirm-dialog-link",
                style : "display: none;"
            })
        );

        dialog = tw.confirm_dialog = new Control.Modal(
            $("confirm-dialog-link"),
            {
                opacity             : 0.65,
                overlayCloseOnClick : false,
                containerClassName  : "confirm-dialog",
                onEscape            : on_escape
            });
        tw.confirm_dialog.open();
    }
    else {
        dialog = tw.confirm_dialog;

        tw.confirm_dialog.open();
        tw.confirm_dialog.update(content_div.innerHTML);
    }

    // Remove previous event listener and attach new one for YES button
    $("confirm-collection-yes-button")
        .stopObserving("click")
        .observe("click", function (event) {
            if (!propagate_clicks) {
                event.stopPropagation();
            }

            if (yes_btn_handler !== undefined) {
                yes_btn_handler();
            }
            if (auto_close) {
                Control.Modal.close();
            }
        });

    // Remove previous event listener and attach new one for NO button
    if(!is_alert) {
        $("confirm-collection-no-button")
            .stopObserving("click")
            .observe("click", function (event) {
                if (!propagate_clicks) {
                    event.stopPropagation();
                }

                if (no_btn_handler !== undefined) {
                    no_btn_handler();
                }
                if (auto_close) {
                    Control.Modal.close();
                }
            });
    }

    return dialog;
}


 // This function collects all different values of an object attribute from a list of objects
 // and counts how often they occur. The attribute name whose values should be counted
 // is determined either by a function or a given attribute name.
 // Returns an object with all found values as attributes and the counts as values.
 //
 // collection      - Array of objects to iterate over.
 // key_determinate - Function or string user to determine a key

function countBy(collection, key_determinate) {
    var result = {},
        get_key;

    if (typeof key_determinate === "function") {
        get_key = function (item) {
            return key_determinate(item);
        };
    }
    else if (typeof key_determinate === "string") {
        get_key = function (item) {
            return item[key_determinate];
        };
    }

    for (var i = 0; i < collection.length; i++) {
        var key =  get_key(collection[i]);
        if (result.hasOwnProperty(key)) {
            ++result[key];
        }
        else {
            result[key] = 1;
        }
    }

    return result;
}



// Transforms the given array into an object whose attributes represent items of 
// the array and each value mapped to an attribute is set as boolean value - true. 
// 
// array - Input array.
//
function arrayToSet(array) {
    "use strict";

    if (!Array.isArray(array)) {
        throw Error("Unexpected Type: Function \"arrayToSet\" expects Arrays.");
    }

    return array.reduce(function (acc, node_id) {
        acc[node_id] = true;
        return acc;
    }, {});
}


function setAutoSize(textarea, limit) {
    // Set a limit if one not given
    if (limit === undefined) {
        limit = 8;
    }

    // Add the autoSizeField class to the text area so it picks up the right CSS
    textarea.addClassName("autoSizeField");

    // Resize handler function
    resizeHandler = function() {
        var str = textarea.value;
        var cols = textarea.cols;
    
        var linecount = 1;
        $A(str.split("\n")).each( function(l) {
            linecount += Math.ceil( l.length / cols ); // Take long lines into account
        });

        // Apply a sensible limit
        if (linecount > limit) {
            linecount = limit;
        }
        textarea.rows = linecount;
    };

    // Add events
    Event.observe(textarea, 'keydown', resizeHandler);
    Event.observe(textarea, 'keyup', resizeHandler);
    Event.observe(textarea, 'paste', resizeHandler);
    Event.observe(textarea, 'cut', resizeHandler);
    
    // Initialise the height based on content
    resizeHandler();
}

var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

// Count all separate symbols in a string
//
function countSymbols(string) {
	return string
		// Replace every surrogate pair with a BMP symbol.
		.replace(regexAstralSymbols, '_')
		// …and *then* get the length.
		.length;
}

// The new html5 elements are not supported in old IE versions. 
// Therefore we have to create them to avoid rendering and styling issues.
(function () {
    if (versionOfIE().version < 9) {

        // The list of currently used tags in existing markup
        var html5Tags = ['header', 'footer', 'nav', 'aside', 'main', 'article', 'section'];
    
        while (html5Tags.length) {
            document.createElement(html5Tags.pop());
        }
    }
})();

function referrerIsFromThisSite(referrer) {
    "use strict";

    // Handle empty referrer.
    if (!referrer) {
        return false;
    }

    var ref_hostname;

    // Get referrer's hostname.
    var a = document.createElement("a");
    a.href = referrer;
    ref_hostname = a.hostname;

    return window.location.hostname === ref_hostname;
}

// parse a dom tree starting from a given point, and calling
// the given function on each node.
// CAREFUL: this function may take a long time (and a lot of CPU)
// if it is called on a node that has many children.
function parseDomTree(node, func) {
    "use strict";
    
    func(node);
    for (var i=0; i<node.children.length; ++i) {
        parseDomTree(node.children[i], func);
    }
}
