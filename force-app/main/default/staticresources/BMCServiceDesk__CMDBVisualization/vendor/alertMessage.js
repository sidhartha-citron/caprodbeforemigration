/*jslint white: true, undef: true, bitwise: true, regexp: true, newcap: true, scripturl: true */
/*global $, Effect, Element, stopBubble */

// Copyright (C) 2008-2018, BMC Software
// All Rights Reserved
//
// THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE
// The copyright notice above does not evidence any
// actual or intended publication of such source code.
//
// RESTRICTED RIGHTS:
//
// This file may have been supplied under a license.
// It may be used, disclosed, and/or copied only as permitted
// under such license agreement.  Any copy must contain the
// above copyright notice and this restricted rights notice.
// Use, copying, and/or disclosure of the file is strictly
// prohibited unless otherwise provided in the license agreement.
//

var INFO_IMG    = "/styles/default/images/general/png/normal/message_board_info_white_24.png",
    WARNING_IMG = "/styles/default/images/general/png/normal/message_board_warning_white_24.png",
    ERROR_IMG   = "/styles/default/images/general/png/normal/message_board_error_white_24.png";

/*
 * Close the message board.
 */
function messageBoardClose() {
    "use strict";
    
    var msg_board = $('messageBoard');
    
    if (msg_board && msg_board.visible()) {
        if (typeof Effect !== 'undefined') {
            Effect.Fade('messageBoard', {duration: 0.2});
        } else {
            msg_board.hide();
        }
    }
}

/*
 * Create the message board.
 *
 * message      - text displayed below the title
 * title        - text displayed next to the icon
 * severity     - optional: severity of the message ("info", "warning", or "error")
 * allow_closing - optional: flag (default true); if true, adds the close button
 */
function createMessageBoard(message, title, severity, allow_closing) {
    "use strict";

    var msg_board = $('messageBoard');
    
    // Remove the board if it already exists
    
    if (msg_board) {
        msg_board.remove();
    }

    // Set default values if no parameters were given
    
    if (severity === undefined) {
        severity = "info";
    }
    
    if (allow_closing === undefined) {
        allow_closing = true;
    }
        
    // Create DOM elements for the message board
    
    var image_path, image_alt, title_container, messageTitle,
        action, message_action, module_setup_subcontent, module_discovery_subcontent;
    
    msg_board = new Element('div', {'id'    : 'messageBoard',
                                       'class' : 'messageBoardInfo',
                                       'style' : 'display: none;'});
    title_container = new Element('div', {'id'  : 'messageTitleContainer'});
    
    // Enable closing the message board if requested
    
    if (allow_closing === true) {

        action    = new Element('a', {'href' : 'javascript:void(0)'});
        image_path = "/styles/default/images/general/png/normal/close_16.png";
        image_alt  = "Close";

        action.observe('click', function (e) {
            stopBubble(e);
            messageBoardClose();
        });
        action.insert(new Element('img', {'alt'   : image_alt,
                                          'title' : image_alt,
                                          'src'   : image_path}));
        message_action = new Element('span', {'id' : 'messageActions'});
        title_container.insert(message_action.insert(action));
    }

    // Choose the icon based on the severity

    if (severity === "error") {
        image_path = ERROR_IMG;
        image_alt  = "Error";
        msg_board.addClassName("messageBoardError");

    } else if (severity === "warning") {
        image_path = WARNING_IMG;
        image_alt  = "Warning";
        msg_board.addClassName("messageBoardWarning");

    } else {
        image_path = INFO_IMG;
        image_alt  = "Info";
        msg_board.addClassName("messageBoardInfo");
    }

    messageTitle = new Element('div', {'id' : 'messageTitle'});
    messageTitle.insert(new Element('img', {'id'  : 'severityIcon',
                                            'src' : image_path,
                                            'alt' : image_alt,
                                            'title' : image_alt}));
    messageTitle.insert(new Element('span').insert(title || image_alt));

    // Insert in the outer elemnents

    msg_board.insert(title_container.insert(messageTitle));
    msg_board.insert(
        new Element('div', {'id' : 'messageContentContainer'}
            ).insert(new Element('div', {'id' : 'messageContent'}).insert(message))
    );    
    
    // Try to place the message board in the right spot

    module_setup_subcontent = $("ModuleSetup") !== null ?
            $("ModuleSetup").down(".subContent") :
            undefined;
    module_discovery_subcontent = $("ModuleDiscovery") !== null ?
            $("ModuleDiscovery").down(".subContent") :
            undefined;

    if (module_setup_subcontent !== undefined &&
        module_setup_subcontent.down() !== undefined) {
        module_setup_subcontent.down().insert({after : msg_board});

    } else if ($("start_stop_span") !== null) {

        // Insert below the discovery start/stop button

        $("start_stop_span").insert({ after : msg_board });

    } else if (module_discovery_subcontent !== undefined &&
               module_discovery_subcontent.down() !== undefined) {
        module_discovery_subcontent.down().insert({after : msg_board});

    } else if ($("ModuleSystem") !== null) {
        if ($("ajaxSearchTitle") !== null) {
            msg_board.setStyle({marginTop : '5px'});
            $("ajaxSearchTitle").insert({after : msg_board});
        } else {
            msg_board.setStyle({marginTop : '20px'});
            $("ModuleSystem").insert({after : msg_board});
        }

    } else if ($("breadcrumb") !== null) {
        msg_board.setStyle({marginTop : '20px'});
        $("breadcrumb").insert({after : msg_board});

    } else if ($("content1") !== null) {
        $("content1").insert({top : msg_board});

    } else {
        document.body.appendChild(msg_board);
    }

    msg_board.hide();

    return msg_board;
}

/*
 * Display the message board. Create the element if it doesn't exist.
 *
 * message       - text displayed below the title
 * title         - text displayed next to the icon
 * is_critical   - if true, uses the red error icon, otherwise the green info one
 * allow_closing - optional flag (default true); if true, adds the close button
 * on_click      - optional, function to call when the message board is clicked
 */
function messageBoardRaise(message, title, is_critical, allow_closing, on_click) {
    "use strict";

    var severity = "info",
        msg_board;

    if (allow_closing === undefined) {
        allow_closing = true;
    }

    if (is_critical) {
        severity = "error";
    }

    msg_board = createMessageBoard(message, title, severity, allow_closing);
    if (msg_board === null) {
        return false;
    }

    if (on_click) {
        msg_board.observe('click', function (e) {
            stopBubble(e);
            on_click();
        });
    }

    if (typeof Effect !== 'undefined') {
        Effect.Appear('messageBoard', {duration: 0.2});
    } else {
        msg_board.show();
    }

    return true;
}

/*
 *  Shows a message board with the given message and severity.
 *
 *  Returns:
 *
 *  message  - (unescaped) message to display to the user,
 *  severity - severity of the message ("info", "warning", or "error"),
 *  details  - additional details (optional),
 *  timeout  - specific timeout (< 0 default, 0 never, > 0 seconds)
 */
function messageBoardSet(message, severity, details, timeout) {
    "use strict";
    
    var msg_board = createMessageBoard(message, undefined, severity, timeout <= 0);
    if (msg_board === null || msg_board === undefined) {
        throw ("Could not find messageBoard element");
    }

    if (details) {
        // Add details element
        var msg_board_details = new Element('div', {
                            'id'    : 'messageBoardDetails',
                            'class' : 'messageBoardDetails'});
        msg_board_details.update(details);
        msg_board.insert(msg_board_details);
    }
    
    if (timeout > 0) {
        window.setTimeout(function () {
            msg_board.hide();
        }, timeout * 1000);
    }
    
    msg_board.show();
}
