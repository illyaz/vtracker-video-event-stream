const VTrackerVideoEventStream = require('./vtracker-video-event-stream');

const id = 1;
const token = '....';

// if undefined will disable event backfill
let lastEventId = '1638281939659-0' /* fs.readFileSync('last_event_id.txt') */;
const videoEntity = false;

const eventStream = new VTrackerVideoEventStream(id, token, lastEventId, videoEntity);

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
        console.info('   NEW', data.eventId, data.videoId)
    else
        console.warn('UPDATE', data.eventId, data.videoId, data.changesKey, data.changes)

    lastEventId = data.eventId; /* fs.writeFileSync('last_event_id.txt', data.eventId) */
})

eventStream.start();