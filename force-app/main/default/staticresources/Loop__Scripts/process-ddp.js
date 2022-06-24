(function($) {
    if (window.Drawloop) return;

    function DdpRunner() {
        var runner = this;
        var checkInterval = 250;
        var maxJobs = 1;
        var stylesLoaded = {};

        this.jobs = {
            queued: [],
            running: [],
            complete: []
        };

        this.loadCSS = function(url, callback) {
            if (url in stylesLoaded) {
                callback();
                return;
            }

            var link = document.createElement('link');
            link.type = 'text/css';
            link.rel = 'stylesheet';
            link.media = 'screen,print';
            link.href = url;
            link.onload = function() {
                stylesLoaded[url] = true;
                callback();
            };

            document.getElementsByTagName('head')[0].appendChild(link);
        };

        this.waitForCSS = function(styleUrl, callback) {
            if (styleUrl in stylesLoaded) {
                callback();
            } else {
                setTimeout(function() {
                    runner.waitForCSS(styleUrl, callback);
                }, checkInterval);
            }
        };

        function run(component, data, styleUrl) {
            runner.waitForCSS(styleUrl, function() {
                if (!data.id) {
                    throw 'No DDP specified';
                }

                component.log('Running DDP: ' + data.id);

                var startTime = new Date();

                function getStatus(jobId, showProgress) {
                    if (typeof showProgress === 'undefined') showProgress = true;

                    component.client.getStatus(jobId, function(response) {
                        if (component.client.handleError(response)) return;

                        if ((new Date() - startTime) > component.options.timeout) {
                            component.client.options.onErrorCallback(
                              component.client.withDefaultArgs({ errorId: null, message: 'Timeout has expired for processing DDP: ' + jobId }));

                            component.client.complete = true;
                            return;
                        }

                        // If we are still running, invoke the onprogress callback and
                        // queue another callback to check status
                        if (component.client.checkJobStatus(response, 'Running')) {
                            if (showProgress) {
                                component.client.options.onProgressCallback(
                                    component.client.withDefaultArgs({ percent: response.job.percentComplete, message: response.job.message }));
                            }
                            setTimeout(function() {
                                getStatus(jobId, showProgress);
                            }, component.options.pollPause);
                        } else {
                            component.log('Getting files for job: ' + jobId);

                            component.client.getResult(jobId, function(response) {
                                component.log('Retrieved files: ' + JSON.stringify(response));
                                if (component.client.handleError(response)) return;

                                // We don't support Pause-to-Edit in this UI yet, so just automatically continue
                                // if we detect that we are paused for editing documents
                                if (component.client.checkIsPauseToEditResponse(response)) {
                                    component.client.continueRun(jobId, function(response) {
                                        component.log('Continue response: ' + JSON.stringify(response));
                                        if (component.client.handleError(response)) return;

                                        setTimeout(function() {
                                            getStatus(jobId);
                                        }, component.options.pollPause);
                                    });
                                } else {
                                    // For the purposes of DDP queueing, consider a DDP to be complete when we present
                                    // the user with the preview step, rather than once the continue step has been called (where applicable)
                                    component.client.complete = true;

                                    // Present user with Preview panel
                                    var $preview = component.$container.find('.panel-preview').html('');

                                    component.UI.showPanel('.panel-preview');

                                    if (!(component.client.checkJobStatus(response, 'Complete') && component.options.isAutoRun)) {
                                        var $fr = $('<div class="list-group section-files" />').appendTo($preview);

                                        for (var i = 0; i < response.job.files.length; i++) {
                                            var f = response.job.files[i];

                                            var $a = $('<a class="list-group-item" />')
                                                .attr('href', component.client.getFileUrl(jobId, f.id))
                                                .text(f.fileName);
                                            $fr.append($a);
                                        }
                                    }

                                    if (component.client.checkJobStatus(response, 'Paused')) {
                                        $('<div class="section-buttons list-group" />')
                                            .appendTo($preview)
                                            .append(
                                                $('<button type="button" class="btn btn-primary btn-continue"></button>')
                                                    .text(component.client.options.previewButtonText)
                                                    .click(function() {
                                                        $(this).addClass('disabled');

                                                        var continueShowProgress = false;

                                                        for (var i = 0; i < response.job.files.length; i++) {
                                                            if (response.job.files[i].replaceable) {
                                                                continueShowProgress = true;
                                                                break;
                                                            }
                                                        }

                                                        component.client.continueRun(jobId, function(response) {
                                                            component.log('Continue response: ' + JSON.stringify(response));
                                                            if (component.client.handleError(response)) return;

                                                            if (continueShowProgress) {
                                                                component.UI.showPanel('.panel-progress');
                                                            }

                                                            setTimeout(function() {
                                                                getStatus(jobId, continueShowProgress);
                                                            }, component.options.pollPause);
                                                        });
                                                    })
                                            );
                                    } else {
                                        var files = [];

                                        for (var i = 0; i < response.job.files.length; i++) {
                                            var f = $.extend({}, response.job.files[i]);

                                            delete f.replaceable;

                                            if (!('fileUrl' in f)) {
                                                f.fileUrl = component.client.getFileUrl(response.job.id, f.id);
                                            }

                                            files.push(f);
                                        }

                                        // Invoke callback method with data object containing copies of
                                        // files + data components of response.
                                        component.client.options.onCompleteCallback(
                                            component.client.withDefaultArgs({
                                                files: files,
                                                data: jQuery.extend({}, response.job.data),
                                                message: response.job.message
                                            }));
                                    }
                                }
                            });
                        }
                    });
                };

                component.client.options.onProgressCallback(
                    component.client.withDefaultArgs({ percent: 0, message: 'sending ddp request' }));

                component.client.run(data, function(response) {
                    this.complete = false;
                    component.log('Received response: ' + JSON.stringify(response));
                    if (component.client.handleError(response)) return;

                    component.currentRunId = response.jobId;
                    component.client.options.onProgressCallback(
                        component.client.withDefaultArgs({ percent: 0, message: 'processing ddp request' }));

                    setTimeout(function() {
                        getStatus(response.jobId);
                    }, component.options.pollPause);
                });
            });
        };

        function processQueue() {
            // Get indices of jobs reporting completion
            var completedIndices = [];
            for (var i = 0; i < runner.jobs.running.length; i++) {
                if (runner.jobs.running[i].component.isComplete()) {
                    completedIndices.push(i);
                }
            }

            // Move any complete jobs to the complete array
            for (var i = completedIndices.length; i > 0; i--) {
                var removed = runner.jobs.running.splice(completedIndices[i - 1], 1);
                runner.jobs.complete.push.apply(runner.jobs.complete, removed);
            }

            while (runner.jobs.queued.length > 0 && runner.jobs.running.length < maxJobs) {
                var info = runner.jobs.queued.shift();

                run(info.component, info.data, info.styleUrl);

                runner.jobs.running.push(info);
            }

            setTimeout(processQueue, checkInterval);
        };

        processQueue();
    };

    DdpRunner.prototype.queueDdp = function(component, data, styleUrl) {
        this.loadCSS(styleUrl, function() {
            component.client.options.onProgressCallback(
                component.client.withDefaultArgs({ percent: 0, message: 'queued' }));
        });

        this.jobs.queued.push({
            component: component,
            data: data,
            styleUrl: styleUrl
        });
    };

    window.Drawloop = {
        ddpRunner: new DdpRunner()
    };

    Drawloop.ProcessDdpComponent = function(options) {
        var component = this;

        this.$container = $('#' + options.containerId);

        // Accepts the name of a function and a default callback
        function wrapHandler(callbackFunctionName, defaultCallback) {
            return function() {
                if (typeof defaultCallback !== 'function') defaultCallback = function() { };

                var continueProcessing = true;

                if (typeof callbackFunctionName !== 'undefined' && typeof window[callbackFunctionName] === 'function') {
                    var tmp = window[callbackFunctionName].apply(window, arguments);

                    continueProcessing = tmp === undefined || !!tmp;
                }

                return continueProcessing && defaultCallback.apply(window, arguments);
            };
        };

        function onError(data) {
            var errorId = data.errorId;
            var message = data.message;

            component.UI.displayError(message + (errorId ? '<br/>Include this Error Id if you contact Drawloop Support: ' + errorId : ''));
            component.UI.showPanel('.panel-error');
        };

        function onComplete(data) {
            var message = data.message;
            var additionalData = data.data|| { };

            // DocuSign delivery option returns a message containing only a redirect URI in
            // the case of embedded signing. If we find a URI, redirect the page to that.
            if (component.client.options.deliveryOptionType == 'DocuSign' && /https:\/\//.test(message)) {
                window.location = message;
                return;
            }

            if (message && message.toLowerCase() != 'complete') {
                alert(message);
            }

            if (additionalData.returnUri) {
                window.location = additionalData.returnUri;
                return;
            }
        };

        function updateProgress(data) {
            var percent = data.percent;
            var message = data.message;

            component.log('updating progress: ' + percent + ', ' + message);
            var $panel = component.$container.find('.panel-progress');
            var $prog = $panel.find('.progress');
            var $progInner = $panel.find('.progress-bar');
            var $progText = $panel.find('.progress-bar-text');

            if (!$panel.is(':visible')) {
                $panel.show();
            }

            $progText.text(message);

            var tmp = $progInner.data('progress') || { progress: 0 };


            $(tmp).stop(true).animate({ progress: percent }, {
                duration: 300,
                step: function() {
                    var newPercent = Math.round(this.progress * 100);
                    var width = Math.round($prog.width() * this.progress);

                    setTimeout(function() {
                        $prog.find('.progress-bar-inner').text(newPercent + '%');
                        $progInner.width(width);
                        $progInner.attr('aria-valuenow', newPercent);

                        $progInner.data('progress', tmp);
                    }, 0);
                },
                complete: function() {
                    var newPercent = Math.round(percent * 100);
                    var width = Math.round($prog.width() * percent);

                    $prog.find('.progress-bar-inner').text(newPercent + '%');
                    $progInner.width(width);
                    $progInner.attr('aria-valuenow', newPercent);

                    $progInner.data('progress', this);
                }
            });
        };

        this.options = $.extend({ timeout: 600000 }, options, {
            onErrorCallback:                wrapHandler(options.onErrorCallback, onError),
            onProgressCallback:             wrapHandler(options.onProgressCallback, updateProgress),
            onCompleteCallback:             wrapHandler(options.onCompleteCallback, onComplete),
        });

        $.extend(this, {
            log: function(msg) {
                component.debug && window.console && console.log && console.log(msg);
            },
            UI: {
                displayError: function (msg) {
                    var $con = $('<div class="alert alert-danger" role="alert" style="display: none;" />');

                    $con.append(
                        $('<div />').html(msg)
                    );

                    component.$container.find('.panel-error')
                        .html('')
                        .append($con);
                    $con.show();
                },
                showPanel: function(panelSelector) {
                    component.$container
                        .find('.panel-progress, .panel-preview, .panel-error').hide();
                    component.$container.find(panelSelector).show();
                }
            },
            client: new Drawloop.DdpClient(this.options)
        });
    };

    Drawloop.ProcessDdpComponent.prototype.isComplete = function() {
        return this.client && this.client.complete;
    };

    Drawloop.DdpClient = function(options) {
        this.sessionId = options.sessionId;
        this.partnerServerUrl = options.partnerServerUrl;

        this.options = options;

        this.baseUrl = (this.options.endpoint || 'https://apps.drawloop.com') + '/salesforce/ddps/';

        this.getUrl = function(method) {
            return this.baseUrl + method + '?callback=?';
        };

        this.sendRequest = function(url, data, callback) {
            $.extend(data, {
                sessionId: this.sessionId,
                location: this.partnerServerUrl
            });

            $.getJSON(url, data, callback);
        };
    }

    Drawloop.DdpClient.prototype.withDefaultArgs = function(args) {
        return $.extend({
            containerId: this.options.containerId
        }, args);
    };

    Drawloop.DdpClient.prototype.run = function(data, callback) {
        $.ajaxSettings.traditional = true;

        this.sendRequest(this.getUrl('run'), data, callback);
    };

    Drawloop.DdpClient.prototype.handleError = function(response) {
        if (response.status == 'error') {
            this.options.onErrorCallback(
                this.withDefaultArgs({ errorId: response.errorId, message: response.message }));

            this.complete = true;
            return true;
        }

        return false;
    };

    Drawloop.DdpClient.prototype.getStatus = function(jobId, callback) {
        var data = {
            jobId: jobId
        };

        this.sendRequest(this.getUrl('getStatus'), data, callback);
    };

    Drawloop.DdpClient.prototype.continueRun = function(jobId, callback) {
        var data = {
            jobId: jobId
        };

        this.sendRequest(this.getUrl('Continue'), data, callback);
    };

    Drawloop.DdpClient.prototype.getResult = function(jobId, callback) {
        var data = {
            jobId: jobId
        };

        this.sendRequest(this.getUrl('getResult'), data, callback);
    };

    Drawloop.DdpClient.prototype.getFile = function(jobId, fileId, callback) {
        var data = {
            jobId: jobId,
            fileId: fileId
        };

        this.sendRequest(this.getUrl('getFile'), data, callback);
    };

    Drawloop.DdpClient.prototype.getFileUrl = function(jobId, fileId) {
        return this.baseUrl + 'getFile?jobId=' + encodeURIComponent(jobId)
            + '&fileId=' + encodeURIComponent(fileId);
    };

    Drawloop.DdpClient.prototype.checkJobStatus = function(response, status) {
        return response && response.job && response.job.status && status && response.job.status.toLowerCase() === status.toLowerCase();
    };

    Drawloop.DdpClient.prototype.checkIsPauseToEditResponse = function(response) {
        if (!this.checkJobStatus(response, 'Paused')
            || !(response && response.job && response.job.files)) return false;

        for (var i = 0; i < response.job.files.length; i++) {
            if (response.job.files[i].replaceable) {
                return true;
            }
        }

        return false;
    };
})(jQuery);
