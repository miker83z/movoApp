const MAM = require('@iota/mam');
const converter = require('@iota/converter');
const seedrandom = require('seedrandom');

class MAMChannel {
  /**
   * Constructor
   * @param {String} mode - MAM channel mode: 'public','private','restricted'
   * @param {String} provider - IOTA provider
   * @param {String} seed - The IOTA seed or a key used to generate it
   * @param {String} sideKey - The secret key for 'restricted' mode
   */
  constructor(mode, provider, seed = null, sideKey = null) {
    this.mode = mode;
    this.provider = provider;
    this.seed =
      seed && seed.length === 81 && /[A-Z9]/.test(seed)
        ? seed
        : MAMChannel.utils.iotaSeedGen(seed);
    this.sideKey = sideKey;
    this.mamState = null;
  }

  /**
   * Open or create and set channel mode
   */
  openChannel() {
    this.mamState = MAM.init(this.provider, this.seed);
    this.mamState = MAM.changeMode(this.mamState, this.mode, this.sideKey);
  }

  /**
   * Change the secret key to use from now on
   * @param {String} key - The new key
   */
  changeKey(key) {
    this.sideKey = key;
    this.mamState = MAM.changeMode(this.mamState, this.mode, this.sideKey);
  }

  /**
   * Return the actual state root
   * @returns {String} The root
   */
  getRoot() {
    return MAM.getRoot(this.mamState);
  }

  /**
   * Publish a message to tangle
   * @param {Object} packet - The message (a JSON object)
   * @returns {String} The message's root
   */
  async publish(packet) {
    // Create MAM Payload - STRING OF TRYTES
    let trytes = converter.asciiToTrytes(JSON.stringify(packet));
    let message = null;
    let limit = 20;
    // Search for messages already present in the tangle with that root
    do {
      message = MAM.create(this.mamState, trytes);
      this.mamState = message.state;
    } while (
      typeof (await MAM.fetchSingle(message.root, this.mode, this.sideKey))
        .payload !== 'undefined' &&
      limit++ > 0
    );

    // Attach the payload to the channel
    try {
      await MAM.attach(message.payload, message.address, 3, 9);
      console.log(
        'Published on MAM channel:\n',
        packet,
        '\nRoot:',
        message.root,
        '\n'
      );
    } catch (e) {
      console.log(e);
    }
    return message.root;
  }

  /**
   * Fetch messages from the current state's root
   * @returns {Object} A JSON object with all the messages fetched and next root
   */
  async fetch() {
    return await this.fetchFrom(this.getRoot());
  }

  /**
   * Fetch messages from root
   * @param {String} root - The root to start fetching
   * @returns {Object} A JSON object with all the messages fetched and next root
   */
  async fetchFrom(root) {
    let result = await MAM.fetch(root, this.mode, this.sideKey);
    if (typeof result.messages !== 'undefined' && result.messages.length > 0) {
      for (var i = result.messages.length - 1; i >= 0; i--) {
        result.messages[i] = JSON.parse(
          converter.trytesToAscii(result.messages[i])
        );
      }
    }
    return result;
  }

  /**
   * Fetch messages from root using a different key for each one
   * @param {String} root - The root to start fetching
   * @param {String[]} keys - The keys array
   * @returns {Object} A JSON object with all the messages fetched and next root
   */
  async fetchMultipleKeys(root, keys) {
    let result = {
      messages: [],
      nextRoot: root
    };
    for (let i = 0; i < keys.length; i++) {
      const tmpResult = await MAM.fetchSingle(
        result.nextRoot,
        this.mode,
        keys[i]
      );
      if (typeof tmpResult.payload !== 'undefined') {
        result.messages.push(
          JSON.parse(converter.trytesToAscii(tmpResult.payload))
        );
        result.nextRoot = tmpResult.nextRoot;
      } else {
        break;
      }
    }
    return result;
  }
}

MAMChannel.utils = {
  /**
   * Generate a random iota seed through a key
   * @param {String} key
   * @returns {String} The generated seed
   */
  iotaSeedGen(key) {
    const rng = seedrandom(key);
    const iotaSeedLength = 81;
    const seedCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
    let result = '';

    for (let i = 0; i < iotaSeedLength; i++) {
      const x = Math.round(rng() * seedCharset.length) % seedCharset.length;
      result += seedCharset[x];
    }

    return result;
  }
};

module.exports = MAMChannel;
