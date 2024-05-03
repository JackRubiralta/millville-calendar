require('dotenv').config();
const { google } = require('googleapis');

// Configuration and Google calendar API initialization
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const auth = new google.auth.JWT(
    CREDENTIALS.client_email,
    null,
    CREDENTIALS.private_key,
    SCOPES
);
const calendar = google.calendar({ version: "v3" });

// Function to create a new calendar with a specific title
const createCalendar = async (title) => {
    try {
        const response = await calendar.calendars.insert({
            auth,
            requestBody: { summary: title }
        });
        return response.data;
    } catch (error) {
        console.error(`Error at createCalendar --> ${error}`);
        return null;
    }
};

// Function to share a calendar with a specified email
const shareCalendar = async (calendarId, email) => {
    try {
        const response = await calendar.acl.insert({
            auth,
            calendarId,
            requestBody: {
                role: 'owner',
                scope: {
                    type: 'user',
                    value: email
                }
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error at shareCalendar --> ${error}`);
        return null;
    }
};

// Function to insert a new event into a specific calendar
const addEvent = async (event, calendarId) => {
    try {
        const response = await calendar.events.insert({
            auth,
            calendarId,
            resource: event
        });
        return response.status === 200 ? 1 : 0;
    } catch (error) {
        console.log(`Error at addEvent --> ${error}`);
        return 0;
    }
};

// Function to delete an event from a calendar
const deleteEvent = async (calendarId, eventId) => {
    try {
        const response = await calendar.events.delete({
            auth,
            calendarId,
            eventId
        });
        return response.data === '' ? 1 : 0;
    } catch (error) {
        console.error(`Error at deleteEvent --> ${error}`);
        return 0;
    }
};

// Function to get all events from a calendar between two dates
const getCalendarEvents = async (calendarId, startTime, endTime) => {
    try {
        const response = await calendar.events.list({
            auth,
            calendarId,
            timeMin: startTime,
            timeMax: endTime,
            timeZone: 'Asia/Kolkata'
        });
        return response.data.items;
    } catch (error) {
        console.error(`Error at getCalendarEvents --> ${error}`);
        return [];
    }
};




async function getMillVilleCalendar(date_range) {
  // Get date for the end of the week (Most recent Sunday)
    const dateFrom = new Date();
    const dateTo = new Date(dateFrom);
    dateTo.setDate(dateFrom.getDate() + date_range);
  
  
    const apiKey = "AIzaSyBxoBIAkPxbC1hZNtFOmpHFv_z2ya9I838";
    const formatDate = (date) =>
        `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    // Get the calendar events for the week from school's Google Calendar API
    const url = `https://www.googleapis.com/calendar/v3/calendars/spsacademiccal%40gmail.com/events?key=${apiKey}&timeMin=${formatDate(
        dateFrom
    )}T00%3A00%3A00-05%3A00&timeMax=${formatDate(
        dateTo
    )}T00%3A00%3A00-05%3A00&singleEvents=true&maxResults=9999`;
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();
    return data.items.map(event => ({
        summary: event.summary.trim(),  // Trim spaces from the summary
        start: { dateTime: event.start.dateTime || event.start.date, timeZone: event.start.timeZone },
        end: { dateTime: event.end.dateTime || event.end.date, timeZone: event.end.timeZone },
    }));
}

const deleteAllCalendars = async () => {
    try {
        // First, list all calendars
        const listResponse = await calendar.calendarList.list({
            auth
        });
        const calendars = listResponse.data.items;

        // Iterate over each calendar and delete it
        for (const cal of calendars) {
            // Skip primary calendar as it cannot be deleted
            if (cal.id === 'primary') {
                console.log("Skipping primary calendar.");
                continue;
            }

            const deleteResponse = await calendar.calendars.delete({
                auth,
                calendarId: cal.id
            });
            if (deleteResponse.status === 204) {
                console.log(`Deleted calendar: ${cal.summary} (ID: ${cal.id})`);
            } else {
                console.log(`Failed to delete calendar: ${cal.summary} (ID: ${cal.id})`);
            }
        }
    } catch (error) {
        console.error(`Error in deleteAllCalendars --> ${error}`);
    }
};

module.exports = {
    createCalendar,
    shareCalendar,
    addEvent,
    deleteEvent,
    getCalendarEvents,
    getMillVilleCalendar,
    deleteAllCalendars // Add this to export the new function
};