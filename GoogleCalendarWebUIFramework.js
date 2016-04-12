// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name GoogleCalendarWebUIFramework.min.js
// ==/ClosureCompiler==

/**
 * Google Calendar Web UI Framework v1.0
 * http://frizz925.github.io/
 * Frizz925@hotmail.com
 */
"use strict";

/**
 * @class
 * @param {GoogleCalendarWebUIFramework~params} params
 */
function GoogleCalendarWebUIFramework(params) {
    var CLIENT_ID; 
    var API_KEY; 

    var SCOPES = "https://www.googleapis.com/auth/calendar";
    var POLL_INTERVAL = 500;
    var CONCURRENY_MAX = 4;

    var self = params || {};
    var handlers = {};
    var globals = {
        eventCount: 0,
        concurrentRequest: 0,
        calendarName: self.calendarName
    };

    var elements = self.uiElements;
    var credentials;
    var gapi;

    handlers.ClientLoad = function() {
        gapi.client.setApiKey(API_KEY);
        gapi.client.load('calendar', 'v3').then(function() {
            window.setTimeout(handlers.AuthCheck, 1);
        }, handlers.APIError);
    };

    handlers.AuthCheck = function() {
        loadingState(true);
        gapi.auth.authorize({
            client_id: CLIENT_ID,
            scope: SCOPES,
            immediate: true
        }, handlers.AuthResult);
    };

    handlers.AuthRequest = function() {
        loadingState(true);
        gapi.auth.authorize({
            client_id: CLIENT_ID,
            scope: SCOPES,
            immediate: false
        }, handlers.AuthResult);
    };

    handlers.AuthResult = function(authResult) {
        if (authResult && !authResult.error) {
            credentials = authResult;
        }
        loadingState(false);
    };

    handlers.RevokeRequest = function() {
        if (credentials.access_token) {
            loadingState(true);
            $.ajax({
                url: "https://accounts.google.com/o/oauth2/revoke?token=" + encodeURIComponent(credentials.access_token),
                complete: function() {
                    credentials = null;
                    loadingState(false);
                },
                xhrFields: {
                    withCredentials: true
                }
            });
        }
    };

    handlers.InsertRequest = function() {
        loadingState(true);
        gapi.client.calendar.calendarList.list().then(function(resp) {
            var calendarId;
            $.each(resp.result.items, function(idx, calendar) {
                if (calendar.summary == globals.calendarName) {
                    calendarId = calendar.id;
                    return false;
                }
            });
            
            if (!calendarId) {
                gapi.client.calendar.calendars.insert({
                    summary: globals.calendarName
                }).then(function(resp) {
                    processSchedules(resp.result.id);
                }, handlers.APIError);
            } else {
                processSchedules(calendarId);
            }
        }, handlers.APIError);
    };

    handlers.APIError = function(error) {
        console.log(error);
    };

    function processSchedules(calendarId) {
        globals.calendarId = calendarId;
        var events = self.fetchEvents();

        globals.eventCount = events.length;
        $.each(events, function(idx, event) {
            insertEvent(event);
        });
    }

    function loadingState(state) {
        if (state) {
            $(elements.loading).show();
            $(elements.auth).hide();
            $(elements.insert).hide();
            $(elements.separator).hide();
            $(elements.revoke).hide();
        } else {
            $(elements.loading).hide();
            if (credentials) {
                $(elements.insert).show();
                $(elements.separator).show();
                $(elements.revoke).show();
                $(elements.auth).hide();
            } else {
                $(elements.insert).hide();
                $(elements.separator).hide();
                $(elements.revoke).hide();
                $(elements.auth).show();
            }
        }
    }

    function eventHandled() {
        globals.concurrentRequest--;
        globals.eventCount--;
        if (globals.eventCount <= 0) {
            loadingState(false);
            alert("Schedules updated");
        }
    }

    function insertEvent(json) {
        if (globals.concurrentRequest >= CONCURRENY_MAX) {
            setTimeout(function() {
                insertEvent(json);
            }, POLL_INTERVAL);
            return;
        }

        globals.concurrentRequest++;
        gapi.client.calendar.events.list({
            calendarId: globals.calendarId,
            timeMin:  json.start.dateTime,
            timeMax:  json.end.dateTime
        }).then(function(resp) {
            if (resp.result.items.length) {
                console.log("Event '" + json.summary + "' has conflicting event at '" + json.start.dateTime + "'");
                eventHandled();
            } else {
                json['calendarId'] = globals.calendarId;
                gapi.client.calendar.events.insert(json).then(function(resp) {
                    console.log(resp.result);
                    eventHandled();
                }, handlers.APIError);
            }
        }, handlers.APIError);
    }

    $(elements.revoke).click(handlers.RevokeRequest);
    $(elements.auth).click(handlers.AuthRequest);
    $(elements.insert).click(handlers.InsertRequest);

    function waitUntilLoaded(checker, callback) {
        var poll = setInterval(function() {
            if (checker()) {
                callback();
                clearInterval(poll);
            }
        }, POLL_INTERVAL);
    }

    function loadAPI() {
        waitUntilLoaded(function() {
            return window.gapi && window.gapi.auth;
        }, function() {
            gapi = window.gapi;
            bootstrap(loadAPI);
        });
    }

    function loadUI() {
        waitUntilLoaded(self.uiLoadChecker, function() {
            var container = self.uiWrapper();
            
            $(container).append(elements.insert);
            $(container).append(elements.auth);
            $(container).append(elements.separator);
            $(container).append(elements.revoke);
            $(container).append(elements.loading)
            
            loadingState(true);
            bootstrap(loadUI);
        });
    }

    var bootstrapCount = 0;
    var bootstrapLoaders = [loadUI, loadAPI];
    function bootstrap(func) {
        bootstrapCount++;
        
        var funcname = func.toString();
        funcname = funcname.substr('function '.length);
        funcname = funcname.substr(0, funcname.indexOf('('));
        
        console.log("Bootstrap sequence called from '" + funcname + "'");
        if (bootstrapCount >= bootstrapLoaders.length) {
            console.log("Bootstrap sequence completed. Initializing API...");
            handlers.ClientLoad();
        }
    }

    function bootstrapInit(clientId, apiKey) {
        CLIENT_ID = clientId;
        API_KEY = apiKey;
        $.each(bootstrapLoaders, function(idx, el) {
            el();
        });
    }

    self.init = function() {
        if (params.clientId && params.apiKey) {
            bootstrapInit(params.clientId, params.apiKey);
        } else if (params.credentialsUrl) {
            $.get(params.credentialsUrl, function(data) {
                bootstrapInit(data.clientId, data.apiKey);
            });
        } else {
            throw "Credentials (client ID & API key) not fully provided";
        }
    }

    return self;
}

/**
 * The parameters used to bootstrap the Google Calendar integration into web view, such as
 * how the framework should retrieve the events data from the view and integrate interactable buttons.
 * @typedef     {Object}    GoogleCalendarWebUIFramework~params
 * @property    {String}    clientId
 *                          (Optional) The client ID from the registered Google Calendar API application.
 * @property    {String}    apiKey
 *                          (Optional) The API key from the registered Google Calendar API application.
 * @property    {String}    credentialsUrl
 *                          (Optional) The URL that contains JSON file with app client ID and API key.
 * @property    {String}    calendarName
 *                          The calendar name to be created (or used if already exists).
 * @property    {GoogleCalendarWebUIFramework~fetchEvents}      fetchEvents
 * @property    {GoogleCalendarWebUIFramework~uiElements}       uiElements
 * @property    {GoogleCalendarWebUIFramework~uiLoadChecker}    uiLoadChecker
 * @property    {GoogleCalendarWebUIFramework~uiWrapper}        uiWrapper
 */

/**
 * List of DOM elements for the framework to attach event handlers to.
 * @typedef     {Object}    GoogleCalendarWebUIFramework~uiElements
 * @property    {Object}    revoke      - The revoke button.
 * @property    {Object}    auth        - The authorize button.
 * @property    {Object}    insert      - The "Add to Calendar" button.
 * @property    {Object}    separator   - The separator view to separate the buttons.
 * @property    {Object}    loading     - The "Loading..." view.
 */

/**
 * Event object that Google Calendar API accepts for creating new event.
 * @typedef     {Object}    GoogleCalendarWebUIFramework~event
 * @property    {String}    summary
 * @property    {String}    location
 * @property    {Object}    start
 * @property    {Object}    end
 * @property    {String}    description
 * @property    {Object}    reminders
 */

/**
 * @callback GoogleCalendarWebUIFramework~fetchEvents
 * @return  {GoogleCalendarWebUIFramework~event[]}
 */

/**
 * Check whether the web view is ready to be integrated with the framework.
 * @callback GoogleCalendarWebUIFramework~uiLoadChecker
 * @return  {Boolean}
 */

/**
 * Callback function that returns a DOM element in which the interactable buttons should reside.
 * @callback GoogleCalendarWebUIFramework~uiWrapper
 * @return  {Object} 
 */