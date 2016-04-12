// ==UserScript==
// @name         Application-Level Binusmaya Exam Google Calendar Standalone
// @namespace    http://senakiho.tk/
// @version      2.0
// @description  Add shown exam schedules into Google Calendar. Standalone version without using web server.
// @author       IZ14-0
// @downloadURL  http://frizz925.github.io/js/BinusmayaGoogleCalendar.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.11.2/moment.min.js
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js
// @require      https://apis.google.com/js/client.js
// @require      http://frizz925.github.io/js/GoogleCalendarWebUIFramework.min.js
// @match        http://apps.binusmaya.binus.ac.id/Services/StudentMenu/TheoriticalExamSchedule.aspx*
// @match        http://apps.binusmaya.binus.ac.id/Services/StudentMenu/PracticalExamSchedule.aspx*
// @match        http://apps.binusmaya.binus.ac.id/Services/StudentMenu/SubstituteExamSchedule.aspx*
// @grant        none
// ==/UserScript==
"use strict";

var columnMapping = [
    'Course Code', 'Course Name', 'SKS',
    'Date', 'Hour', 'Room',
    'Campus', 'Class', 'Seat'
];

GoogleCalendarWebUIFramework({
    credentialsUrl: "http://frizz925.github.io/js/GoogleCalendarAppCredentials.json",
    calendarName: "Binusmaya Exam Calendar",
    fetchEvents: function() {
        var events = [];
        $('table.tablewithborder').each(function() {
            $(this).find('tr:not(:first-child)').each(function() {
                var cols = $(this).find('td');
                var data = {};
                $.each(columnMapping, function(idx, name) {
                    data[name] = $(cols[idx]).text().trim();
                });

                var time = data['Hour'].split('-');
                
                var summary = "[Exam] " + data['Course Code'] + "-" + data['Course Name'];
                var location = "Binus " + data['Campus'] + " " + data['Room'];
                var description = 
                    "Seat No: " + data['Seat'] + "\n" +
                    "Class: " + data['Class'] + "\n" +
                    "Credits: " + data['SKS'];
                    //19 Apr 2016 08:00
                var start = moment(data['Date'] + " " + time[0], "DD MMM YYYY HH:mm").toISOString();
                var end = moment(data['Date'] + " " + time[1], "DD MMM YYYY HH:mm").toISOString();
                
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
        var div = $('.contentForService > div:first-child');
        var container = $("<div></div>");
        div.after(container);
        return container;
    }
}).init();
