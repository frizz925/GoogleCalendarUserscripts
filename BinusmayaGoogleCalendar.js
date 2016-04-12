// ==UserScript==
// @name         Application-Level Binusmaya Google Calendar Standalone
// @namespace    http://senakiho.tk/
// @version      2.0
// @description  Add shown class schedules into Google Calendar. Standalone version without using web server.
// @author       IZ14-0
// @downloadURL  http://frizz925.github.io/js/BinusmayaGoogleCalendar.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.11.2/moment.min.js
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js
// @require      https://apis.google.com/js/client.js
// @require      http://frizz925.github.io/js/GoogleCalendarWebUIFramework.min.js
// @match        http://apps.binusmaya.binus.ac.id/LMS/newSchedule.aspx*
// @grant        none
// ==/UserScript==
"use strict";

var columnMapping = [
    'Date', 'Shift', 'Status',
    'Course', 'Credits', 'Class',
    'Room', 'Campus'
];

GoogleCalendarWebUIFramework({
    credentialsUrl: "http://frizz925.github.io/js/GoogleCalendarAppCredentials.json",
    calendarName: "Binusmaya Calendar",
    fetchEvents: function() {
        var events = [];
        $('table.tablewithborder:not(:last-of-type)').each(function() {
            $(this).find('tr:not(:first-child)').each(function() {
                var cols = $(this).find('td');
                var data = {};
                $.each(columnMapping, function(idx, name) {
                    data[name] = $(cols[idx]).text().trim();
                });

                var time = data['Shift'].split('-');
                
                var summary = "[" + data['Status'] + "] " + data['Course'];
                var location = "Binus " + data['Campus'] + " " + data['Room'];
                var description = 
                    "Class: " + data['Class'] + "\n" +
                    "Credits: " + data['Credits'];
					//Friday, 26 Feb 2016 07:20
                var start = moment(data['Date'] + " " + time[0], "dddd, DD MMM YYYY HH:mm").toISOString();
                var end = moment(data['Date'] + " " + time[1], "dddd, DD MMM YYYY HH:mm").toISOString();
                
                var json = {
                    'summary'   : summary,
                    'location'  : location,
                    'start'     : { 'dateTime' : start },
                    'end'       : { 'dateTime' : end },
                    'description'   : description,
                    'reminders' : {
                        'useDefault'    : true
                    }
                };

                events.push(json);
            });
        });

        return events;
    },
    uiElements: {
        revoke: $("<a href='#'>Revoke</a>"),
        auth: $("<a href='#'>Authorize</a>"),
        insert: $("<a href='#'>Add to Calendar</a>"),
        separator: $("<span> | </span>"),
        loading: $("<span>Loading...</span>")
    },
    uiLoadChecker: function() {
        return $('.tablewithborder').length;
    },
    uiWrapper: function() {
        var div = $('#thought > div:first-child');
        var container = $("<div></div>");
        div.after(container);
        return container;
    }
}).init();
