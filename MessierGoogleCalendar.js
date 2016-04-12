// ==UserScript==
// @name         Messier Google Calendar Standalone
// @namespace    http://senakiho.tk/
// @version      2.0
// @description  Add shown teaching schedules into Google Calendar. Standalone version without using web server.
// @author       IZ14-0
// @downloadURL  http://frizz925.github.io/js/MessierGoogleCalendar.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.11.2/moment.min.js
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js
// @require      https://apis.google.com/js/client.js
// @require      http://frizz925.github.io/js/GoogleCalendarWebUIFramework.min.js
// @match        http://messier.slc/Home.aspx*
// @match        http://10.22.64.177/Home.aspx*
// @grant        none
// ==/UserScript==
"use strict";

var columnMapping = [
    'Type', 'Description',
    'Start', 'End', 'Status'
];

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
           
            var parts = data['Description'].split(' ');
            
            var course = [];
            for (var i = 0; i < parts.length-4; i++) {
                course.push(parts[i]);
            }
            course = course.join(' ');
            
            var summary = "[" + data['Type'] + "] " + course;
            var description = "Class: " + parts[parts.length-4];
            var start = moment(data['Start'], "DD-MMM-YYYY hh:mm A").toISOString();
            var end = moment(data['End'], "DD-MMM-YYYY hh:mm A").toISOString();
            
            var json = {
                'summary'   : summary,
                'start'     : { 'dateTime' : start },
                'end'       : { 'dateTime' : end },
                'description'   : description,
                'reminders' : {
                    'useDefault'    : true
                }
            };
            
            if (data['Type'] == 'Teaching') {
                json['location'] = "Binus Anggrek " + parts[parts.length-2];
                json['description'] += "\nSession: " + parts[parts.length-1];
            }

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
