/**
 * @author Ryan Johnson <ryan@livepipe.net>
 * @copyright 2007 LivePipe LLC
 * @package Control.Modal
 * @license MIT
 * @url http://livepipe.net/projects/control_modal/
 * @version 1.2.11
 */

// This version has been heavily modified by BMC Software.

if(typeof(Control) == "undefined")
    Control = {};

Control.Modal = Class.create({
    mode: '',
    html: false,
    href: '',
    element: false,
    src: false,
    imageLoaded: false,
        // Start BMC Software Added
        draggableHandlers: {},
        // End BMC Software Added

    initialize: function(element,options){
        this.element = $(element);
        this.options = $H({
            beforeOpen: Prototype.emptyFunction,
            afterOpen: Prototype.emptyFunction,
            beforeClose: Prototype.emptyFunction,
            afterClose: Prototype.emptyFunction,
            beforeLoad: Prototype.emptyFunction,
            onLoad: Prototype.emptyFunction,
            onFailure: Prototype.emptyFunction,
            onException: Prototype.emptyFunction,
            // Start BMC Software Added
            onEscape: Control.Modal.close,
            // End BMC Software Added
            afterLoad: Prototype.emptyFunction,
            beforeImageLoad: Prototype.emptyFunction,
            afterImageLoad: Prototype.emptyFunction,
            contents: false,
            image: false,
            imageTemplate: new Template('<img src="#{src}" id="#{id}"/>'),
            imageAutoDisplay: true,
            imageCloseOnClick: true,
            hover: false,
            iframe: false,
            iframeTemplate: new Template('<iframe src="#{href}" width="100%" height="100%" frameborder="0" id="#{id}"></iframe>'),
            evalScripts: true, //for Ajax, define here instead of in requestOptions
            requestOptions: {}, //for Ajax.Request
            overlayDisplay: true,
            overlayClassName: '',
            overlayCloseOnClick: true,
            containerClassName: '',
            opacity: 0.3,
            // Start BMC Software Added
            zIndex: 998, // previous value 9998, modified in terms
                         // of 'z-index' refactoring
            // End BMC Software Added
            width: null,
            height: null,
            // Start BMC Software Added
            centreWidth: null,
            centreHeight: null,
            // End BMC Software Added
            offsetLeft: 0, //for use with 'relative'
            offsetTop: 0, //for use with 'relative'
            position: 'absolute' //'absolute' or 'relative'
        });
        if(options)
            this.options.update($H(options));
        target_match = false;
        image_match = false;
        if(this.element){
            target_match = Control.Modal.targetRegexp.exec(this.element.href);
            image_match = Control.Modal.imgRegexp.exec(this.element.href);
        }
        if(this.options.get('contents')){
            this.mode = 'contents';
        }else if(this.options.get('image') || image_match){
            this.mode = 'image';
            this.src = this.element.href;
        }else if(target_match){
            this.mode = 'named';
            x = $(target_match[1]);
            this.html = x.innerHTML;
            x.remove();
            this.href = target_match[1];
        }else{
            this.mode = (this.options.get('iframe')) ? 'iframe' : 'ajax';
            this.href = this.element.href;
        }
        if(this.element){
            if(this.options.get('hover')){
                this.element.observe('mouseover',this.open.bind(this));
                this.element.observe('mouseout',this.close.bind(this));
            }else{
                this.element.onclick = function(){
                    // Start BMC Software Edit
                    this.open(this.eval_scripts);
                    // End BMC Software Edit
                    return false;
                }.bindAsEventListener(this);
            }
        }
        // Start BMC Software Added
        element.onclick = function(){
            this.open(this.eval_scripts);
            return false;
        }.bindAsEventListener(this);
        // End BMC Software Added
        targets = Control.Modal.targetRegexp.exec(window.location);
        this.position = function(){
            Control.Modal.overlay.setStyle({
                height: Control.Modal.getDocumentHeight() + 'px',
                width: Control.Modal.getDocumentWidth() + 'px'
            });
            if(this.options.get('position') == 'absolute')
                // Tideway pass added centreHeight and centreWidth
                Control.Modal.center(this.options.get('centreHeight'),
                                     this.options.get('centreWidth'));
            else{
                yx = this.element.cumulativeOffset();
                Control.Modal.container.setStyle({
                    position: 'absolute',
                    top: yx[1] + this.options.get('offsetTop') + 'px',
                    left: yx[0] + this.options.get('offsetLeft') + 'px'
                });
            }
        }.bind(this);
        if(this.mode == 'image'){
            this.afterImageLoad = function(){
                if(this.options.get('imageAutoDisplay') && !window.opera)
                    $('modal_image').show();
                this.position();
                this.notifyResponders('afterImageLoad');
            }.bind(this);
        }
        // Start Tideway Added
        if(this.options.get('hover')){
            this.element.observe('mouseover',this.open.bind(this));
            this.element.observe('mouseout',this.close.bind(this));
        }
        // End Tideway Added
        if(this.mode == 'named' && targets && targets[1] && targets[1] == this.href)
            this.open();
    },
    open: function(evalScripts){
        this.eval_scripts = evalScripts

        // Start Tideway Modified
        var escape_func = this.options.get('onEscape');
        Control.Modal.onKeyDown = function(event){
            if(event.keyCode == Event.KEY_ESC) {
                escape_func();
            }
        }
        if(!this.options.get('hover')) {
            Event.observe($(document.getElementsByTagName('body')[0]),'keydown', Control.Modal.onKeyDown);
        }
        // End Tideway Modified
        
        Control.Modal.current = this;
        if(this.notifyResponders('beforeOpen') === false)
            return;
        if(!this.options.get('hover')){
            Control.Modal.overlay.setStyle({
                zIndex: this.options.get('zIndex')
            });
            Control.Modal.setOpacity(Control.Modal.overlay, this.options.get('opacity'));
        }
        Control.Modal.container.setStyle({
            zIndex: this.options.get('zIndex') + 1,
            width: (this.options.get('width') ? this.options.get('width') + 'px' : ''),
            height: (this.options.get('height') ? this.options.get('height') + 'px' : '')
        });
        if(Control.Modal.ie && !this.options.get('hover')){
            $A(document.getElementsByTagName('select')).each(function(select){
                select.style.visibility = 'hidden';
            });
        }
        Control.Modal.overlay.addClassName(this.options.get('overlayClassName'));
        Control.Modal.container.addClassName(this.options.get('containerClassName'));
        switch(this.mode){
            case 'image':
                this.imageLoaded = false;
                this.notifyResponders('beforeImageLoad');
                this.update(this.options.get('imageTemplate').evaluate({src: this.src, id: 'modal_image'}), evalScripts);
                this.position();
                if(this.options.get('imageAutoDisplay') && !window.opera)
                    $('modal_image').hide();
                if(this.options.get('imageCloseOnClick'))
                    $('modal_image').observe('click',Control.Modal.close);
                $('modal_image').observe('load',this.afterImageLoad);
                $('modal_image').observe('readystatechange',this.afterImageLoad);
                break;
            case 'ajax':
                this.notifyResponders('beforeLoad');
                options = $H({
                    method: 'get',
                    onSuccess: function(request){
                        this.notifyResponders('onLoad',request);
                        this.update(request.responseText);
                        if(this.options.get('evalScripts'))
                            request.responseText.evalScripts();
                        // Start Tideway Added
                        this.notifyResponders('onLoad',request);
                        this.update(request.responseText);
                        this.position();
                        // End Tideway Added
                        this.notifyResponders('afterLoad',request);
                    }.bind(this),
                    onFailure: this.options.get('onFailure'),
                    onException: this.options.get('onException')
                });
                if(this.options.get('requestOptions'))
                    options.update($H(this.options.get('requestOptions')));
                new Ajax.Request(this.href,options);
                break;
            case 'iframe':
                this.update(this.options.get('iframeTemplate').evaluate({href: this.href, id: 'modal_iframe'}), evalScripts);
                this.position();
                break;
            case 'contents':
                var contents = this.options.get('contents');
                this.update((typeof(contents) == 'function' ? contents.bind(this)() : contents), evalScripts);
                break;
            case 'named':
                this.update(this.html, evalScripts);
                break;
        }
        if(!this.options.get('hover')){
            if(this.options.get('overlayCloseOnClick') && this.options.get('overlayDisplay'))
                Control.Modal.overlay.observe('click',Control.Modal.close);
            if(this.options.get('overlayDisplay'))
                Control.Modal.overlay.show();
        }
        this.options.get('afterOpen')();
        
        // Making container draggable with fauxHeaderDraggable handler
        // Start BMC Software Added
        this.draggableHandlers = $$('.fauxHeader').collect(function(modal_window, index){
               return new Draggable(Control.Modal.container, 
                              {
                                  handle: modal_window,
                                  starteffect: null,
                                  endeffect: null,
                                  zindex: Control.Modal.container.style.zIndex
                              });
            });
        Control.Modal.container.removeAttribute('aria-hidden');           
        Control.Modal.overlay.removeAttribute('aria-hidden');           
        // End BMC Software Added
    },
    update: function(html, evalScripts){
        Control.Modal.container.update(html, evalScripts);
        this.position();
        Control.Modal.container.show();
        if(this.options.get('position') == 'absolute'){
            Event.stopObserving(window,'resize',this.position,false);
            Event.stopObserving(window,'scroll',this.position,false);
            Event.observe(window,'resize',this.position,false);
            Event.observe(window,'scroll',this.position,false);
        }
    },
    close: function(){
        response = this.notifyResponders('beforeClose');
        if(response == false && response != null)
            return;
        if(this.mode == 'image'){
            if(this.options.get('imageCloseOnClick'))
                $('modal_image').stopObserving('click',Control.Modal.close);
            $('modal_image').stopObserving('load',this.afterImageLoad);
            $('modal_image').stopObserving('readystatechange',this.afterImageLoad);
        }
        if(Control.Modal.ie && !this.options.get('hover')){
            $A(document.getElementsByTagName('select')).each(function(select){
                select.style.visibility = 'visible';
            });
        }
        if(!this.options.get('hover')) {
            Event.stopObserving(window,'keyup', Control.Modal.onKeyDown);
            // Start BMC Software Modified
            Event.stopObserving($(document.getElementsByTagName('body')[0]),'keydown', Control.Modal.onKeyDown);
            // End BMC Software Modified
        }
        Control.Modal.current = false;
        Control.Modal.overlay.removeClassName(this.options.get('overlayClassName'));
        Control.Modal.container.removeClassName(this.options.get('containerClassName'));
        Event.stopObserving(window,'resize',this.position,false);
        Event.stopObserving(window,'scroll',this.position,false);
        if(!this.options.get('hover')){
            if(this.options.get('overlayCloseOnClick') && this.options.get('overlayDisplay'))
                Control.Modal.overlay.stopObserving('click',Control.Modal.close);
            if(this.options.get('overlayDisplay'))
                Control.Modal.overlay.hide();
        }
        Control.Modal.container.update('');
        Control.Modal.container.hide();
        this.notifyResponders('afterClose');
        
        // Start BMC Software Added
        this.draggableHandlers.each(function(obj) {obj.destroy();});
        Control.Modal.container.setAttribute('aria-hidden','true');
        Control.Modal.overlay.setAttribute('aria-hidden','true');
        // End BMC Software Added
    },
    notifyResponders: function(event_name,argument){
        Control.Modal.responders.each(function(responder){
            if(responder[event_name])
                responder[event_name](argument);
        });
        response = this.options.get(event_name)(argument);
        return response;
    }
});

Object.extend(Control.Modal,{
    loaded: false,
    responders: $A([]),
    overlay: false,
    container: false,
    current: false,
    ie: false,
    targetRegexp: /#(.+)$/,
    imgRegexp: /\.(jpe?g|gif|png|tiff?)$/,
    overlayStyles: {
        position: (Prototype.Browser.IE6) ? 'absolute' : 'fixed',
        top: 0,
        left: 0
    },
    
    // Start BMC Software Modified
    onKeyDown: undefined,  // Will be initialised when the dialog is open since we 
                           // want to access "options" field of this object
    // End BMC Software Modified

    load: function(){
        if(!Control.Modal.loaded){
            Control.Modal.loaded = true;
            Control.Modal.ie = (navigator.appName == 'Microsoft Internet Explorer');
            Control.Modal.overlay = $(document.createElement('div'));
            Control.Modal.overlay.id = 'modal_overlay';
            Object.extend(Control.Modal.overlay.style,Control.Modal.overlayStyles);
            Control.Modal.overlay.hide();
            Control.Modal.container = $(document.createElement('div'));
            Control.Modal.container.id = 'modal_container';
            Control.Modal.container.hide();
            // Start BMC Software Modified
            Control.Modal.overlay.setAttribute('aria-hidden', 'true');
            Control.Modal.container.setAttribute('aria-hidden', 'true');
            Control.Modal.container.setAttribute('role', 'dialog');
            // End BMC Software Modified                       
            document.getElementsByTagName('body')[0].appendChild(Control.Modal.overlay);
            document.getElementsByTagName('body')[0].appendChild(Control.Modal.container);
        }
    },
    open: function(contents,options){
        m = new Control.Modal(false,$H({contents:contents}).merge(options));
        m.open();
        return m;
    },
    close: function(){
        if(Control.Modal.current)
            Control.Modal.current.close();
    },
    attachEvents: function(){
        Event.observe(window,'load',Control.Modal.load);
    },
    center: function(centreHeight, centreWidth){
        // BMC Software handle added centreHeight and centreWidth
        var element = this.container;
        if(!element._centered){
            this.container.setStyle({
                position: 'absolute'
            }); 
            this.container._centered = true;
        }
        var modal_dimensions = Control.Modal.container.getDimensions();
        if (centreHeight && modal_dimensions.height < centreHeight)
            modal_dimensions.height = centreHeight;
        if (centreWidth && modal_dimensions.width < centreWidth)
            modal_dimensions.width = centreWidth;
        Position.prepare();
        var offset_left = (Position.deltaX + Math.floor((Control.Modal.getWindowWidth() - modal_dimensions.width) / 2));
        var offset_top = (Position.deltaY + Math.floor((Control.Modal.getWindowHeight() - modal_dimensions.height) / 2));
        Control.Modal.container.setStyle({
            top: ((modal_dimensions.height <= Control.Modal.getWindowHeight()) ? ((offset_top != null && offset_top > 0) ? offset_top : '0') + 'px' : 0),
            left: ((modal_dimensions.width <= Control.Modal.getWindowWidth()) ? ((offset_left != null && offset_left > 0) ? offset_left : '0') + 'px' : 0)
        });
    },
    getWindowWidth: function(){
        return (self.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0);
    },
    getWindowHeight: function(){
        return (self.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0);
    },
    getDocumentWidth: function(){
        return Math.max(document.body.scrollWidth,Control.Modal.getWindowWidth());
    },
    getDocumentHeight: function(){
        return Math.max(document.body.scrollHeight,Control.Modal.getWindowHeight());
    },
    addResponder: function(responder){
        Control.Modal.responders.push(responder);
    },
    removeResponder: function(responder){
        Control.Modal.responders = Control.Modal.responders.without(responder);
    },
    //from Scriptaculous
    setOpacity: function(element,value){
        element= $(element);  
        if(value == 1){
            Element.setStyle(element,{
                opacity: (/Gecko/.test(navigator.userAgent) && !/Konqueror|Safari|KHTML/.test(navigator.userAgent)) ? 0.999999 : null
            });
        if(/MSIE/.test(navigator.userAgent))
            Element.setStyle(element,{
                filter: Element.getStyle(element,'filter').replace(/alpha\([^\)]*\)/gi,'')
            });  
        }else{  
            if(value < 0.00001) value = 0;  
            Element.setStyle(element, {opacity: value});
            if(/MSIE/.test(navigator.userAgent))  
                Element.setStyle(element,{
                    filter: Element.getStyle(element,'filter').replace(/alpha\([^\)]*\)/gi,'') + 'alpha(opacity='+value*100+')'
                });  
        }
    }
});


Control.Modal.attachEvents();
