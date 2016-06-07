// ==UserScript==
// @name         Messier Google Calendar Standalone
// @namespace    http://senakiho.tk/
// @version      2.0.2
// @description  Add shown teaching schedules into Google Calendar. Standalone version without using web server.
// @author       IZ14-0
// @downloadURL  https://github.com/Frizz925/GoogleCalendarUserscripts/raw/master/MessierGoogleCalendar.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.11.2/moment.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.12.0/lodash.min.js
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js
// @require      https://apis.google.com/js/client.js
// @require      http://frizz925.github.io/js/GoogleCalendarWebUIFramework.min.js
// @match        http://messier.slc/Home.aspx*
// @match        http://10.22.64.177/Home.aspx*
// @grant        none
// ==/UserScript==
"use strict";

/**
 * TODO: Implement marking schedules
 */

var columnMapping = [
    'Type', 'Description',
    'Start', 'End', 'Status'
];

var parsers = {};
parsers.default = function(parts) {
    return {
        course: parts.slice(0, parts.length-3).join(" "),
        session: parts[parts.length-1],
        room: parts[parts.length-2],
        class: parts[parts.length-3]
    };
};
parsers["Exam Proctor"] = function(parts) {
    return {
        course: parts.slice(0, parts.length-2).join(" "),
        room: parts[parts.length-1],
        class: parts[parts.length-2]
    };
};

GoogleCalendarWebUIFramework({
    credentialsUrl: "http://frizz925.github.io/js/GoogleCalendarAppCredentials.json",
    calendarName: "Messier Calendar",
    fetchEvents: function() {
        var events = [];
        $('tr.Waiting').each(function() {
            var cols = $(this).find('td');
            var data = {};
            $.each(columnMapping, function(idx, name) {
                data[name] = $(cols[idx]).text().trim();
            });
           
            var parts = data.Description.replace(/\s+/g, " ").split(" ");
            var parser = parsers[data.Type] || parsers.default;
            var parsed = parser(parts);

            var json = {
                summary: "[" + data.Type + "] " + parsed.course,
                start: { 
                    dateTime: moment(data['Start'], "DD-MMM-YYYY hh:mm A").toISOString(),
                },
                end: { 
                    dateTime: moment(data['End'], "DD-MMM-YYYY hh:mm A").toISOString(),
                },
                description: "Class: " + parsed.class + (parsed.session ? "\nSession: " + parsed.session : ""),
                reminders: {
                    useDefault: true
                },
                location: "Binus Anggrek " + parsed.room
            };
            
            events.push(json);
        });

        return events;
    },
    uiElements: {
        revoke: $("<span href='#' class='hlink'>Revoke</span>"),
        auth: $("<span href='#' class='hlink'>Authorize</span>"),
        insert: $("<span href='#' class='hlink'>Add to Calendar</span>"),
        separator: $("<span> | </span>"),
        loading: $("<span>Loading...</span>")
    },
    uiLoadChecker: function() {
        return $('span.hlink').length;
    },
    uiWrapper: function() {
        var div = $('#headermsg');
        var separator = $("<span> | </span>");
        div.append(separator);
        return div;
    }
}).init();
