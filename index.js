const VTrackerVideoEventStream = require('./vtracker-video-event-stream');

const token = process.env.TOKEN;

// if undefined will disable event backfill
let lastEventId = '1638281939659-0' /* fs.readFileSync('last_event_id.txt') */;
const videoEntity = true;

/** Single rule */
// const eventStream = new VTrackerVideoEventStream(1, token, lastEventId, videoEntity);

/**
 * Multiple rules
 * [ 7, "and", 8 ]
 * [ 7, "or", 8 ]
 * [ 7, "and", [ "8", "or", "9" ] ]
 */
const eventStream = new VTrackerVideoEventStream([7, "and", 8], token, lastEventId, videoEntity);

eventStream.on('error', x => console.error(x.message))
eventStream.on('close', reason => console.warn('Closed', reason))
eventStream.on('init', data => {
    console.warn('Connected', data);
})

eventStream.on('event', data => {
    // if changesKey == undefined then
    //  new
    // else
    //  update
    if (!data.changesKey)
        console.info('   NEW', data.eventId, data.videoId, data.video)
    else
        console.warn('UPDATE', data.eventId, data.videoId, data.changesKey, data.changes, data.video)

    lastEventId = data.eventId; /* fs.writeFileSync('last_event_id.txt', data.eventId) */
})

eventStream.start();