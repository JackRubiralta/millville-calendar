const {
    createCalendar,
    addEvent,
    shareCalendar,
    deleteEvent,
    getCalendarEvents,
    getMillVilleCalendar,
    deleteAllCalendars,
} = require("./api");
const readline = require("readline");
const chalk = require("chalk");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
let defaultColor = null;
const humFlex = "FLEX";
const blockToClasses = {};
const blockToColors = {};
let humanitiesBlock = "";
const secondLunchBlocks = [];
const colorOptions = {
    1: { name: "Lavender", hex: "#7986cb" },
    2: { name: "Sage", hex: "#33b679" },
    3: { name: "Grape", hex: "#8e24aa" },
    4: { name: "Flamingo", hex: "#e67c73" },
    5: { name: "Banana", hex: "#f6c026" },
    6: { name: "Tangerine", hex: "#f5511d" },
    7: { name: "Peacock", hex: "#039be5" },
    8: { name: "Graphite", hex: "#616161" },
    9: { name: "Blueberry", hex: "#3f51b5" },
    10: { name: "Basil", hex: "#0b8043" },
    11: { name: "Tomato", hex: "#d60000" },
};

let shareEmail = null;

const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

const displayColors = () => {
    const colorChoices = Object.entries(colorOptions).map(([id, { hex }]) => 
        chalk.bgHex(hex)(` ${id} `)
    ).join(""); // Joining with a space to place numbers side by side
    console.log("Available Colors: " + colorChoices);
};
const setupCalendar = async () => {
    shareEmail = await askQuestion(
        "Please enter the email to share the calendar with: "
    );
    const blocks = ["A", "B", "C", "D", "E", "F"];
    const otherBlocks = ["Chapel", "FLEX", "House Meetings"]; // Add other categories as needed

    for (let block of blocks) {
        const className = await askQuestion(
            `Enter the name for block ${block}: `
        );
        blockToClasses[block] = className;

        displayColors();
        let colorId = await askQuestion("Choose a color ID: ");
        while (!colorOptions[colorId]) {
            console.log("Invalid color ID selected.");
            colorId = await askQuestion("Please enter a valid color ID: ");
        }
        blockToColors[block] = colorId;
    }

    humanitiesBlock = await askQuestion(
        "Which block is the Humanities block?: "
    );

    const lunchBlocks = await askQuestion(
        "Enter the blocks that have class during the first lunch block: "
    );


    secondLunchBlocks.push(...lunchBlocks.split(","));


    displayColors();
    let lunchColorId = await askQuestion(
        "Choose a color ID for Lunch: "
    );
    while (!colorOptions[lunchColorId]) {
        console.log("Invalid color ID selected for Lunch.");
        lunchColorId = await askQuestion(
            "Please enter a valid color ID for Lunch: "
        );
    }
    blockToColors["Lunch"] = lunchColorId; // Assigning a color for general Lunch

    for (const otherBlock of otherBlocks) {
        displayColors();
        let colorId = await askQuestion(
        `Choose a color ID for ${otherBlock}: `)

        while (!colorOptions[colorId]) {
            console.log(`Invalid color ID selected for ${otherBlock}.`);
            colorId = await askQuestion(
                `Please enter a valid color ID for ${otherBlock}: `
            );
        }
        blockToColors[otherBlock] = colorId; // Assigning a color for each otherBlock
    }

    let defaultColorId = await askQuestion(
        "Choose a default color ID for events: "
    );
    while (!colorOptions[defaultColorId]) {
        console.log("Invalid color ID selected for default color.");
        defaultColorId = await askQuestion(
            "Please enter a valid color ID for the default color: "
        );
    }
    defaultColor = defaultColorId; // Assigning a color for default events

    console.log("Configuration Complete!");
    rl.close();
};

const processEvents = async () => {
    const events = await getMillVilleCalendar(34);

    // Sort events by start time to handle them in chronological order
    events.sort(
        (a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime)
    );

    let processedEvents = [];
    let lastEvent = null; // This will hold the last humanities or flex event for comparison

    for (let i = 0; i < events.length; i++) {
        let event = events[i];
        let blockLetter = event.summary[0]; // Assuming the first character is the block letter

        if (event.summary === humanitiesBlock) {
            // Check if this event is a humanities block or a flex event
            if (lastEvent.summary === humFlex) {
                lastEvent.colorId = blockToColors[event.summary];
                lastEvent.end = event.end; // Extend the end time of the last event
                lastEvent.summary = blockToClasses[humanitiesBlock]; // Ensure the summary reflects the humanities block
                continue; // Skip adding the current event as a separate entry
            } else {
                event.colorId = blockToColors[event.summary];
                event.summary = blockToClasses[humanitiesBlock];
            }
        } else if (event.summary === humFlex) {
            if (lastEvent.summary === blockToClasses[humanitiesBlock]) {
                lastEvent.end = event.end; // Extend the end time of the last event
                continue; // Skip adding the current event as a separate entry
            }
        } else if (blockToClasses[event.summary]) {
            event.colorId = blockToColors[event.summary];
            event.summary = blockToClasses[event.summary];
        } else if (event.summary.length == 2) {
            let blockNumber = event.summary[1]; // Assuming the second character is the block number
            if (secondLunchBlocks.includes(blockLetter)) {
                if (blockNumber === "1") {
                    // Class time for this block
                    event.colorId = blockToColors[blockLetter];
                    event.summary = blockToClasses[blockLetter];
                } else if (blockNumber === "2") {
                    // Lunch time for this block
                    event.colorId = blockToColors["Lunch"];
                    event.summary = "Lunch";
                }
            } else {
                if (blockNumber === "1") {
                    // Lunch time for this block
                    event.colorId = blockToColors["Lunch"];
                    event.summary = "Lunch";
                } else if (blockNumber === "2") {
                    // Class time for this block
                    event.colorId = blockToColors[blockLetter];
                    event.summary = blockToClasses[blockLetter];
                }
            }
        } else if (event.summary == humFlex) {
            event.colorId = blockToColors[humFlex];
            event.summary = "Flex";
        } else if (event.summary == "House Meetings,") {
            event.summary = "House Meetings";
            event.colorId = blockToColors[event.summary];
        } else {
            event.summary = event.summary;
            event.colorId = defaultColor;
        }
        // Assuming you have an event object with a summary property

        lastEvent = event; // Update last event to the current event
        processedEvents.push(event);
    }
    // console.log(processedEvents);
    // Optionally create a new calendar and add these events to it
    const calendarDetails = await createCalendar(
        "Millville School Adjusted Events"
    );
    if (calendarDetails) {
        console.log(`New Calendar Created: ${calendarDetails.id}`);
        for (const event of processedEvents) {
            const result = await addEvent(event, calendarDetails.id);
            console.log(
                result
                    ? `Event added successfully: ${event.summary}`
                    : `Failed to add event: ${event.summary}`
            );
        }

        const shareResult = await shareCalendar(calendarDetails.id, shareEmail);
        if (shareResult) {
            console.log(`Calendar shared successfully with ${shareEmail}`);
        } else {
            console.log(`Failed to share calendar with ${shareEmail}`);
        }
    } else {
        console.log("Failed to create a new calendar");
    }
};

async function main() {
    await setupCalendar();
    await processEvents().catch(console.error);
}
main();
