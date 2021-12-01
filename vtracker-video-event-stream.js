const axios = require('axios').default;
const EventEmitter = require('events');
const readline = require('readline');

class VTrackerVideoEventStream extends EventEmitter {

    /**
     * @type { Boolean }
     * @access private
     */
    _started = false;

    /**
     * @type { Boolean }
     * @access private
     */
    _stopping = false;

    /**
     * @type { readline.Interface }
     * @access private
     */
    _reader;


    /**
     * @param {number | (number | string | (number | string)[])[]} stream
     * @param {string} token
     * @param {string} resume
     * @param {boolean} entity
     */
    constructor(stream, token, resume, entity) {
        super();
        this.stream = stream;
        this.token = token;
        this.resume = resume;
        this.entity = entity;
    }

    /** @access private */
    async _connect() {
        let isError = false;
        try {
            const params = {};
            let url = `https://api.vtracker.app/v2/videos/youtube/streams/`;
            if (this.resume !== undefined)
                params.resume = this.resume;

            if (this.entity)
                params.entity = true;

            if(Array.isArray(this.stream)) {
                params.rules = JSON.stringify(this.stream);
                url += 'combinations'
            }else
                url += this.stream;

            const res = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                responseType: 'stream',
                params
            });

            this._reader = readline.createInterface({input: res.data})
            this._reader.on('close', () => {
                res.data.destroy();
                this._started = false;
                this._stopping = false;
            });

            for await (const line of this._reader) {
                const json = JSON.parse(line)
                switch (json.type) {
                    case 'init':
                        this.emit('init', json.data)
                        break;
                    case 'event':
                        this.emit('event', json.data)
                        this.resume = json.data.eventId;
                        break;
                    case 'ping':
                        this.emit('ping')
                        break;
                    case 'close':
                        this.emit('close', json.reason);
                        isError = true;
                        break;
                }
            }
        } catch (e) {
            try {
                isError = true;
                const {response} = e;
                if (response) {
                    const error = JSON.parse(response.data.read().toString());
                    const err = new Error(`[${error.statusCode}] ${error.message}`);
                    err.error = e;
                    this._onError(err);
                } else
                    this._onError(e);
            } catch {
                this._onError(e);
            }
        } finally {
            if (!this._stopping && isError)
                setTimeout(() => this._connect(), 5000)
        }
    }

    /** @access private */
    async _onError(e) {
        this.emit('error', e);
    }

    start() {
        if (this._started)
            throw new Error(`don't call 'start' twice`);

        this._stopping = false;
        this._connect();
    }

    stop() {
        if (this._stopping)
            throw new Error(`don't call 'stop' twice`);

        this._stopping = true;
        this._reader.close();
    }
}

module.exports = VTrackerVideoEventStream;