/* global describe, beforeEach, it, before, afterEach, after */
/* eslint no-console: 0 */

import assert from 'assert';
import _ from 'underscore';
import nock from 'nock';

import PubNub from '../../../src/node/index';
import utils from '../../utils';

describe('#components/subscription_manager', () => {
  let pubnub: PubNub;
  let pubnubWithLimitedDeduplicationQueue: PubNub;
  let pubnubWithPassingHeartbeats: PubNub;
  let pubnubWithLimitedQueue: PubNub;
  let pubnubWithCrypto: PubNub;

  before(() => {
    nock.disableNetConnect();
  });

  beforeEach(() => {
    nock.cleanAll();
    pubnub = new PubNub({
      subscribeKey: 'mySubKey',
      publishKey: 'myPublishKey',
      origin: 'ps.pndsn.com',
      uuid: 'myUUID',
      // @ts-expect-error Force override default value.
      useRequestId: false,
      autoNetworkDetection: false,
      heartbeatInterval: 149,
    });
    pubnubWithLimitedDeduplicationQueue = new PubNub({
      subscribeKey: 'mySubKey',
      publishKey: 'myPublishKey',
      origin: 'ps.pndsn.com',
      uuid: 'myUUID',
      // @ts-expect-error Force override default value.
      useRequestId: false,
      autoNetworkDetection: false,
      maximumCacheSize: 1,
      dedupeOnSubscribe: true,
      heartbeatInterval: 149,
    });
    pubnubWithPassingHeartbeats = new PubNub({
      subscribeKey: 'mySubKey',
      publishKey: 'myPublishKey',
      origin: 'ps.pndsn.com',
      uuid: 'myUUID',
      // @ts-expect-error: This configuration option normally is hidden.
      announceSuccessfulHeartbeats: true,
      useRequestId: false,
      autoNetworkDetection: false,
      heartbeatInterval: 149,
    });
    pubnubWithLimitedQueue = new PubNub({
      subscribeKey: 'mySubKey',
      publishKey: 'myPublishKey',
      origin: 'ps.pndsn.com',
      uuid: 'myUUID',
      // @ts-expect-error Force override default value.
      useRequestId: false,
      requestMessageCountThreshold: 1,
      autoNetworkDetection: false,
      heartbeatInterval: 149,
    });
    pubnubWithCrypto = new PubNub({
      subscribeKey: 'mySubKey',
      publishKey: 'myPublishKey',
      origin: 'ps.pndsn.com',
      uuid: 'myUUID',
      // @ts-expect-error Force override default value.
      useRequestId: false,
      cryptoModule: PubNub.CryptoModule.aesCbcCryptoModule({ cipherKey: 'cipherKey' }),
    });
  });

  afterEach(() => {
    pubnub.destroy(true);
    pubnubWithLimitedDeduplicationQueue.destroy(true);
    pubnubWithPassingHeartbeats.destroy(true);
    pubnubWithLimitedQueue.destroy(true);
    pubnubWithCrypto.destroy(true);
  });

  it('passes the correct message information', (done) => {
    const scope1 = utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
      })
      .reply(
        200,
        '{"t":{"t":"3","r":1},"m":[{"a":"4","f":0,"i":"Client-g5d4g","p":{"t":"14607577960925503","r":1}, "i": "client1", "k":"mySubKey","c":"ch1","d":{"text":"Message"},"b":"ch1"}]}',
        { 'content-type': 'text/javascript' },
      );

    const scope2 = utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        tt: 3,
        tr: 1,
      })
      .reply(
        200,
        '{"t":{"t":"10","r":1},"m":[{"a":"4","f":0,"i":"Client-g5d4g","p":{"t":"14607577960925503","r":1},"i": "client2", "k":"mySubKey","c":"ch1","d":{"text":"Message3"},"b":"ch1"}]}',
        { 'content-type': 'text/javascript' },
      );

    const scope3 = utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        tt: 10,
        tr: 1,
      })
      .reply(
        200,
        '{"t":{"t":"20","r":1},"m":[{"a":"4","f":0,"i":"Client-g5d4g","p":{"t":"14607577960925503","r":1},"i": "client3", "k":"mySubKey","c":"ch1","d":{"text":"Message10"},"b":"ch1", "u": {"cool": "meta"}}]}',
        { 'content-type': 'text/javascript' },
      );
    utils
      .createNock()
      .get(/heartbeat$/)
      .query(true)
      .reply(200, '{"status": 200,"message":"OK","service":"Presence"}', { 'content-type': 'text/javascript' });

    const incomingPayloads = [];

    pubnub.addListener({
      message(messagePayload) {
        incomingPayloads.push(messagePayload);

        if (incomingPayloads.length === 3) {
          try {
            assert.equal(scope1.isDone(), true);
            assert.equal(scope2.isDone(), true);
            assert.equal(scope3.isDone(), true);
            assert.deepEqual(incomingPayloads, [
              {
                actualChannel: 'ch1',
                message: {
                  text: 'Message',
                },
                subscribedChannel: 'ch1',
                channel: 'ch1',
                subscription: 'ch1',
                timetoken: '14607577960925503',
                publisher: 'client1',
              },
              {
                actualChannel: 'ch1',
                message: {
                  text: 'Message3',
                },
                subscribedChannel: 'ch1',
                channel: 'ch1',
                subscription: 'ch1',
                timetoken: '14607577960925503',
                publisher: 'client2',
              },
              {
                actualChannel: 'ch1',
                message: {
                  text: 'Message10',
                },
                userMetadata: {
                  cool: 'meta',
                },
                subscribedChannel: 'ch1',
                channel: 'ch1',
                subscription: 'ch1',
                timetoken: '14607577960925503',
                publisher: 'client3',
              },
            ]);

            done();
          } catch (error) {
            done(error);
          }
        }
      },
    });

    pubnub.subscribe({ channels: ['ch1', 'ch2'], withPresence: true });
  });

  it('passes the correct presence information', (done) => {
    const scope = utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
      })
      .reply(
        200,
        '{"t":{"t":"14614512228786519","r":1},"m":[{"a":"4","f":0,"p":{"t":"14614512228418349","r":2},"k":"mySubKey","c":"ch1-pnpres","d":{"action": "join", "timestamp": 1461451222, "uuid": "4a6d5df7-e301-4e73-a7b7-6af9ab484eb0", "occupancy": 1},"b":"ch1-pnpres"}]}',
        { 'content-type': 'text/javascript' },
      );

    pubnub.addListener({
      presence(presencePayload) {
        try {
          assert.equal(scope.isDone(), true);
          assert.deepEqual(
            {
              channel: 'ch1',
              subscription: 'ch1-pnpres',
              actualChannel: 'ch1',
              occupancy: 1,
              subscribedChannel: 'ch1-pnpres',
              timestamp: 1461451222,
              timetoken: '14614512228418349',
              uuid: '4a6d5df7-e301-4e73-a7b7-6af9ab484eb0',
              action: 'join',
            },
            presencePayload,
          );
          done();
        } catch (error) {
          done(error);
        }
      },
    });

    pubnub.subscribe({ channels: ['ch1', 'ch2'], withPresence: true });
  });

  it('Unknown category status returned when user trigger TypeError in subscription handler', (done) => {
    let callDone = false;
    utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
      })
      .reply(
        200,
        '{"t":{"t":"6","r":1},"m":[{"a":"4","f":0,"i":"Client-g5d4g","p":{"t":"14607577960925503","r":1}, "i": "client1", "k":"mySubKey","c":"ch1","d":{"text":"Message"},"b":"ch1"}]}',
        { 'content-type': 'text/javascript' },
      );
    utils
      .createNock()
      .get(/heartbeat$/)
      .query(true)
      .reply(200, '{"status": 200,"message":"OK","service":"Presence"}', { 'content-type': 'text/javascript' });
    utils
      .createNock()
      .get(/leave$/)
      .query(true)
      .reply(200, '{"status": 200,"message":"OK","action":"leave","service":"Presence"}', {
        'content-type': 'text/javascript',
      });
    utils
      .createNock()
      .get('/publish/myPublishKey/mySubKey/0/ch1/0/%7B%22such%22%3A%22object%22%7D')
      .query(true)
      .reply(200, '[1,"Sent","14647523059145592"]', { 'content-type': 'text/javascript' });

    utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        tt: 6,
      })
      .reply(200, '{"t":{"t":"9","r":1},"m":[]}', { 'content-type': 'text/javascript' });

    pubnub.addListener({
      message(_) {
        // @ts-expect-error Intentional exception.
        null.test;
      },
      status(status) {
        if (status.category === PubNub.CATEGORIES.PNUnknownCategory && 'statusCode' in status) {
          try {
            assert.equal(status.errorData instanceof Error, true);
            if (!callDone) {
              callDone = true;
              done();
            }
          } catch (error) {
            done(error);
          }
        } else if (status.category === PubNub.CATEGORIES.PNConnectedCategory) {
          pubnub.publish({ message: { such: 'object' }, channel: 'ch1' }, () => {});
        }
      },
    });

    pubnub.subscribe({ channels: ['ch1'], withPresence: true });
  });

  it('passes the correct presence information when state is changed', (done) => {
    const scope1 = utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
      })
      .reply(
        200,
        '{"t":{"t":"14637536741734954","r":1},"m":[{"a":"4","f":512,"p":{"t":"14637536740940378","r":1},"k":"demo-36","c":"ch1-pnpres","d":{"action": "join", "timestamp": 1463753674, "uuid": "24c9bb19-1fcd-4c40-a6f1-522a8a1329ef", "occupancy": 3},"b":"ch1-pnpres"},{"a":"4","f":512,"p":{"t":"14637536741726901","r":1},"k":"demo-36","c":"ch1-pnpres","d":{"action": "state-change", "timestamp": 1463753674, "data": {"state": "cool"}, "uuid": "24c9bb19-1fcd-4c40-a6f1-522a8a1329ef", "occupancy": 3},"b":"ch1-pnpres"}]}',
        { 'content-type': 'text/javascript' },
      );
    utils
      .createNock()
      .get(/heartbeat$/)
      .query(true)
      .reply(200, '{"status": 200,"message":"OK","service":"Presence"}');
    utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        tt: '14637536741734954',
      })
      .reply(200, '{"t":{"t":"9","r":1},"m":[]}', { 'content-type': 'text/javascript' });

    pubnub.addListener({
      presence(presencePayload) {
        if (presencePayload.action !== 'state-change') return;
        try {
          assert.equal(scope1.isDone(), true);
          assert.deepEqual(presencePayload, {
            channel: 'ch1',
            subscription: 'ch1-pnpres',
            actualChannel: 'ch1',
            occupancy: 3,
            subscribedChannel: 'ch1-pnpres',
            timestamp: 1463753674,
            timetoken: '14637536741726901',
            uuid: '24c9bb19-1fcd-4c40-a6f1-522a8a1329ef',
            action: 'state-change',
            state: { state: 'cool' },
          });
          done();
        } catch (error) {
          done(error);
        }
      },
    });

    pubnub.subscribe({ channels: ['ch1', 'ch2'], withPresence: true });
  });

  it('reports when heartbeats failed', (done) => {
    utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
      })
      .reply(200, '{"t":{"t":"3","r":1},"m":[]}', { 'content-type': 'text/javascript' });

    pubnub.addListener({
      status(statusPayload) {
        if (statusPayload.operation !== PubNub.OPERATIONS.PNHeartbeatOperation) return;
        // @ts-expect-error Remove helper function before compare.
        delete statusPayload['toJSON'];

        const statusWithoutError = _.omit(statusPayload, 'errorData', 'statusCode');
        try {
          assert.deepEqual(
            {
              category: PubNub.CATEGORIES.PNUnknownCategory,
              error: true,
              operation: PubNub.OPERATIONS.PNHeartbeatOperation,
            },
            statusWithoutError,
          );
          done();
        } catch (error) {
          done(error);
        }
      },
    });

    pubnub.subscribe({
      channels: ['ch1', 'ch2'],
      withPresence: true,
      withHeartbeats: true,
    });
  });

  it('reports when heartbeats fail with error code', (done) => {
    const scope = utils
      .createNock()
      .get('/v2/presence/sub-key/mySubKey/channel/ch1,ch2/heartbeat')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        state: '{}',
      })
      .reply(400, '{"status": 400, "message": "OK", "service": "Presence"}', { 'content-type': 'text/javascript' });

    pubnub.addListener({
      status(statusPayload) {
        if (statusPayload.operation !== PubNub.OPERATIONS.PNHeartbeatOperation) return;
        // @ts-expect-error Remove helper function before compare.
        delete statusPayload['toJSON'];

        const statusWithoutError = _.omit(statusPayload, 'errorData');
        try {
          assert.equal(scope.isDone(), true);
          assert.deepEqual(
            {
              category: PubNub.CATEGORIES.PNBadRequestCategory,
              error: true,
              operation: PubNub.OPERATIONS.PNHeartbeatOperation,
              statusCode: 400,
            },
            statusWithoutError,
          );
          done();
        } catch (error) {
          done(error);
        }
      },
    });

    pubnub.subscribe({
      channels: ['ch1', 'ch2'],
      withPresence: true,
      withHeartbeats: true,
    });
  });

  it('reports when heartbeats pass', (done) => {
    const scope = utils
      .createNock()
      .get('/v2/presence/sub-key/mySubKey/channel/ch1,ch2/heartbeat')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        state: '{}',
      })
      .reply(200, '{"status": 200, "message": "OK", "service": "Presence"}', { 'content-type': 'text/javascript' });

    pubnubWithPassingHeartbeats.addListener({
      status(statusPayload) {
        if (statusPayload.operation !== PubNub.OPERATIONS.PNHeartbeatOperation) return;
        // @ts-expect-error Remove helper function before compare.
        delete statusPayload['toJSON'];

        try {
          assert.equal(scope.isDone(), true);
          assert.deepEqual(
            {
              error: false,
              operation: PubNub.OPERATIONS.PNHeartbeatOperation,
              category: PubNub.CATEGORIES.PNAcknowledgmentCategory,
              statusCode: 200,
            },
            statusPayload,
          );
          done();
        } catch (error) {
          done(error);
        }
      },
    });

    pubnubWithPassingHeartbeats.subscribe({
      channels: ['ch1', 'ch2'],
      withPresence: true,
      withHeartbeats: true,
    });
  });

  it('heartbeat removes presence channels', (done) => {
    const scope = utils
      .createNock()
      .get('/v2/presence/sub-key/mySubKey/channel/ch1/heartbeat')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        state: '{}',
      })
      .reply(200, '{"status": 200, "message": "OK", "service": "Presence"}', { 'content-type': 'text/javascript' });

    pubnubWithPassingHeartbeats.addListener({
      status(statusPayload) {
        if (statusPayload.operation !== PubNub.OPERATIONS.PNHeartbeatOperation) return;
        // @ts-expect-error Remove helper function before compare.
        delete statusPayload['toJSON'];

        try {
          assert.equal(scope.isDone(), true);
          assert.deepEqual(
            {
              error: false,
              operation: PubNub.OPERATIONS.PNHeartbeatOperation,
              category: PubNub.CATEGORIES.PNAcknowledgmentCategory,
              statusCode: 200,
            },
            statusPayload,
          );
          done();
        } catch (error) {
          done(error);
        }
      },
    });

    pubnubWithPassingHeartbeats.subscribe({
      channels: ['ch1', 'ch2-pnpres'],
    });
  });

  it("heartbeat doesn't make a call with only presence channels", (done) => {
    const scope = utils
      .createNock()
      .get('/v2/presence/sub-key/mySubKey/channel/ch1-pnpres,ch2-pnpres/heartbeat')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        state: '{}',
      })
      .reply(200, '{"status": 200, "message": "OK", "service": "Presence"}', { 'content-type': 'text/javascript' });

    pubnubWithPassingHeartbeats.addListener({
      status(statusPayload) {
        if (statusPayload.operation !== PubNub.OPERATIONS.PNHeartbeatOperation) return;
        // @ts-expect-error Remove helper function before compare.
        delete statusPayload['toJSON'];

        try {
          assert.equal(scope.isDone(), false);
          assert.deepEqual(
            {
              error: false,
              operation: PubNub.OPERATIONS.PNHeartbeatOperation,
              category: PubNub.CATEGORIES.PNAcknowledgmentCategory,
              statusCode: 200,
            },
            statusPayload,
          );
          done();
        } catch (error) {
          done(error);
        }
      },
    });

    pubnubWithPassingHeartbeats.subscribe({
      channels: ['ch1-pnpres', 'ch2-pnpres'],
    });
  });

  it('reports when heartbeats pass with heartbeatChannels', (done) => {
    const scope = utils
      .createNock()
      .get('/v2/presence/sub-key/mySubKey/channel/ch1,ch2/heartbeat')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        state: '{}',
      })
      .reply(200, '{"status": 200, "message": "OK", "service": "Presence"}', { 'content-type': 'text/javascript' });

    pubnubWithPassingHeartbeats.addListener({
      status(statusPayload) {
        if (statusPayload.operation !== PubNub.OPERATIONS.PNHeartbeatOperation) return;
        // @ts-expect-error Remove helper function before compare.
        delete statusPayload['toJSON'];

        try {
          assert.equal(scope.isDone(), true);
          assert.deepEqual(
            {
              error: false,
              operation: PubNub.OPERATIONS.PNHeartbeatOperation,
              category: PubNub.CATEGORIES.PNAcknowledgmentCategory,
              statusCode: 200,
            },
            statusPayload,
          );
          done();
        } catch (error) {
          done(error);
        }
      },
    });

    pubnubWithPassingHeartbeats.presence({
      channels: ['ch1', 'ch2'],
      connected: true,
    });
  });

  it('heartbeat removes presence channel groups', (done) => {
    const scope = utils
      .createNock()
      .get('/v2/presence/sub-key/mySubKey/channel/,/heartbeat')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        state: '{}',
        'channel-group': 'cg1',
      })
      .reply(200, '{"status": 200, "message": "OK", "service": "Presence"}', { 'content-type': 'text/javascript' });

    pubnubWithPassingHeartbeats.addListener({
      status(statusPayload) {
        if (statusPayload.operation !== PubNub.OPERATIONS.PNHeartbeatOperation) return;
        // @ts-expect-error Remove helper function before compare.
        delete statusPayload['toJSON'];

        try {
          assert.equal(scope.isDone(), true);
          assert.deepEqual(
            {
              error: false,
              operation: PubNub.OPERATIONS.PNHeartbeatOperation,
              category: PubNub.CATEGORIES.PNAcknowledgmentCategory,
              statusCode: 200,
            },
            statusPayload,
          );
          done();
        } catch (error) {
          done(error);
        }
      },
    });

    pubnubWithPassingHeartbeats.subscribe({
      channelGroups: ['cg1', 'cg2-pnpres'],
    });
  });

  it('reports when heartbeats pass with heartbeatChannelGroups', (done) => {
    const scope = utils
      .createNock()
      .get('/v2/presence/sub-key/mySubKey/channel/,/heartbeat')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        state: '{}',
        'channel-group': 'cg1',
      })
      .reply(200, '{"status": 200, "message": "OK", "service": "Presence"}', { 'content-type': 'text/javascript' });

    pubnubWithPassingHeartbeats.addListener({
      status(statusPayload) {
        if (statusPayload.operation !== PubNub.OPERATIONS.PNHeartbeatOperation) return;
        // @ts-expect-error Remove helper function before compare.
        delete statusPayload['toJSON'];

        try {
          assert.equal(scope.isDone(), true);
          assert.deepEqual(
            {
              error: false,
              operation: PubNub.OPERATIONS.PNHeartbeatOperation,
              category: PubNub.CATEGORIES.PNAcknowledgmentCategory,
              statusCode: 200,
            },
            statusPayload,
          );
          done();
        } catch (error) {
          done(error);
        }
      },
    });

    pubnubWithPassingHeartbeats.presence({
      channelGroups: ['cg1'],
      connected: true,
    });
  });

  it('reports when the queue is beyond set threshold', (done) => {
    const scope = utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
      })
      .reply(
        200,
        '{"t":{"t":"3","r":1},"m":[{"a":"4","f":0,"p":{"t":"14614512228418349","r":2},"k":"mySubKey","c":"ch2-pnpres","d":{"action": "join", "timestamp": 1461451222, "uuid": "4a6d5df7-e301-4e73-a7b7-6af9ab484eb0", "occupancy": 1},"b":"ch2-pnpres"}]}',
        { 'content-type': 'text/javascript' },
      );
    utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        tt: 3,
      })
      .reply(200, '{"t":{"t":"3","r":1},"m":[]}', { 'content-type': 'text/javascript' });

    pubnubWithLimitedQueue.addListener({
      status(statusPayload) {
        if (statusPayload.category !== PubNub.CATEGORIES.PNRequestMessageCountExceededCategory) return;
        // @ts-expect-error Remove helper function before compare.
        delete statusPayload['toJSON'];

        try {
          assert.equal(scope.isDone(), true);
          assert.equal(statusPayload.category, PubNub.CATEGORIES.PNRequestMessageCountExceededCategory);
          assert.equal(statusPayload.operation, PubNub.OPERATIONS.PNSubscribeOperation);
          done();
        } catch (error) {
          done(error);
        }
      },
    });

    pubnubWithLimitedQueue.subscribe({
      channels: ['ch1', 'ch2'],
      withPresence: true,
    });
  });

  it('supports deduping on duplicates', (done) => {
    // @ts-expect-error: This configuration option normally is hidden.
    pubnub._config.dedupeOnSubscribe = true;
    let messageCount = 0;

    utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
      })
      .reply(
        200,
        '{"t":{"t":"3","r":1},"m":[{"a":"4","f":0,"i":"Client-g5d4g","p":{"t":"14607577960925503","r":1}, "i": "client1", "k":"mySubKey","c":"ch1","d":{"text":"Message"},"b":"ch1"}]}',
        { 'content-type': 'text/javascript' },
      );

    utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        tt: 3,
        tr: 1,
      })
      .reply(
        200,
        '{"t":{"t":"14607577960932487","r":1},"m":[{"a":"4","f":0,"i":"Publisher-A","p":{"t":"14607577960925503","r":1},"o":{"t":"14737141991877032","r":2},"k":"mySubKey","c":"ch1","d":{"text":"Message"},"b":"ch1"},{"a":"4","f":0,"i":"Publisher-A","p":{"t":"14607577960925503","r":1},"o":{"t":"14737141991877032","r":2},"k":"mySubKey","c":"ch1","d":{"text":"Message"},"b":"ch1"}]}',
        { 'content-type': 'text/javascript' },
      );

    pubnub.addListener({
      message() {
        messageCount += 1;
      },
    });

    pubnub.subscribe({ channels: ['ch1', 'ch2'], withPresence: true });

    setTimeout(() => {
      if (messageCount === 1) {
        done();
      } else done(new Error(`Received unexpected number of messages: ${messageCount} (expected: 1)`));
    }, 250);
  });

  it('no deduping on duplicates ', (done) => {
    let messageCount = 0;

    utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
      })
      .reply(
        200,
        '{"t":{"t":"3","r":1},"m":[{"a":"4","f":0,"i":"Client-g5d4g","p":{"t":"14607577960925503","r":1}, "i": "client1", "k":"mySubKey","c":"ch2","d":{"text":"Message"},"b":"ch2"}]}',
        { 'content-type': 'text/javascript' },
      );

    utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        tt: 3,
        tr: 1,
      })
      .reply(
        200,
        '{"t":{"t":"14607577960932487","r":1},"m":[{"a":"4","f":0,"i":"Publisher-A","p":{"t":"14607577960925503","r":1},"o":{"t":"14737141991877032","r":2},"k":"mySubKey","c":"ch2","d":{"text":"Message"},"b":"ch2"},{"a":"4","f":0,"i":"Publisher-A","p":{"t":"14607577960925503","r":1},"o":{"t":"14737141991877032","r":2},"k":"mySubKey","c":"ch2","d":{"text":"Message"},"b":"ch2"}]}',
        { 'content-type': 'text/javascript' },
      );

    pubnub.addListener({
      message() {
        messageCount += 1;
      },
    });

    pubnub.subscribe({ channels: ['ch1', 'ch2'], withPresence: true });

    setTimeout(() => {
      if (messageCount === 3) {
        done();
      } else done(new Error(`Received unexpected number of messages: ${messageCount} (expected: 3)`));
    }, 250);
  });

  it('supports deduping on shallow queue', (done) => {
    let messageCount = 0;

    utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
      })
      .reply(
        200,
        '{"t":{"t":"3","r":1},"m":[{"a":"4","f":0,"i":"Client-g5d4g","p":{"t":"14607577960925503","r":1}, "i": "client1", "k":"mySubKey","c":"ch1","d":{"text":"Message"},"b":"ch1"}]}',
        { 'content-type': 'text/javascript' },
      );

    utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1,ch1-pnpres,ch2,ch2-pnpres/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
        tt: 3,
        tr: 1,
      })
      .reply(
        200,
        '{"t":{"t":"14607577960932487","r":1},"m":[{"a":"4","f":0,"i":"Publisher-A","p":{"t":"14607577960925503","r":1},"o":{"t":"14737141991877032","r":2},"k":"mySubKey","c":"ch1","d":{"text":"Message1"},"b":"ch1"},{"a":"4","f":0,"i":"Publisher-A","p":{"t":"14607577960925503","r":1},"o":{"t":"14737141991877032","r":2},"k":"mySubKey","c":"ch1","d":{"text":"Message2"},"b":"ch1"}, {"a":"4","f":0,"i":"Publisher-A","p":{"t":"14607577960925503","r":1},"o":{"t":"14737141991877032","r":2},"k":"mySubKey","c":"ch1","d":{"text":"Message1"},"b":"ch1"}]}',
        { 'content-type': 'text/javascript' },
      );

    pubnubWithLimitedDeduplicationQueue.addListener({
      message() {
        messageCount += 1;
      },
    });

    pubnubWithLimitedDeduplicationQueue.subscribe({ channels: ['ch1', 'ch2'], withPresence: true });

    setTimeout(() => {
      if (messageCount === 4) {
        done();
      } else done(new Error(`Received unexpected number of messages: ${messageCount} (expected: 4)`));
    }, 250);
  });

  it('handles unencrypted message when cryptoModule is configured', (done) => {
    const scope = utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
      })
      .reply(
        200,
        '{"t":{"t":"3","r":1},"m":[{"a":"4","f":0,"i":"Client-g5d4g","p":{"t":"14607577960925503","r":1}, "i": "client1", "k":"mySubKey","c":"ch1","d":"hello","b":"ch1"}]}',
        { 'content-type': 'text/javascript' },
      );

    const incomingPayloads = [];

    pubnubWithCrypto.addListener({
      message(messagePayload) {
        incomingPayloads.push(messagePayload);
        if (incomingPayloads.length === 1) {
          try {
            assert.equal(scope.isDone(), true);
            assert.deepEqual(incomingPayloads, [
              {
                actualChannel: 'ch1',
                message: 'hello',
                subscribedChannel: 'ch1',
                channel: 'ch1',
                subscription: 'ch1',
                timetoken: '14607577960925503',
                publisher: 'client1',
                error: 'Error while decrypting message content: Decryption error: invalid header version',
              },
            ]);
            done();
          } catch (error) {
            done(error);
          }
        }
      },
    });

    pubnubWithCrypto.subscribe({ channels: ['ch1'] });
  });

  it('handles unencrypted message when `setCipherKey()` is used', (done) => {
    pubnub.setCipherKey('hello');
    const scope = utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
      })
      .reply(
        200,
        '{"t":{"t":"3","r":1},"m":[{"a":"4","f":0,"i":"Client-g5d4g","p":{"t":"14607577960925503","r":1}, "i": "client1", "k":"mySubKey","c":"ch1","d":"hello","b":"ch1"}]}',
        { 'content-type': 'text/javascript' },
      );

    const incomingPayloads = [];

    pubnubWithCrypto.addListener({
      message(messagePayload) {
        incomingPayloads.push(messagePayload);
        if (incomingPayloads.length === 1) {
          try {
            assert.equal(scope.isDone(), true);
            assert.deepEqual(incomingPayloads, [
              {
                actualChannel: 'ch1',
                message: 'hello',
                subscribedChannel: 'ch1',
                channel: 'ch1',
                subscription: 'ch1',
                timetoken: '14607577960925503',
                publisher: 'client1',
                error: 'Error while decrypting message content: Decryption error: invalid header version',
              },
            ]);
            done();
          } catch (error) {
            done(error);
          }
        }
      },
    });

    pubnubWithCrypto.subscribe({ channels: ['ch1'] });
  });

  it('handles encryped messages when cryptoModule is configured', (done) => {
    const scope = utils
      .createNock()
      .get('/v2/subscribe/mySubKey/ch1/0')
      .query({
        pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
        uuid: 'myUUID',
        heartbeat: 300,
      })
      .reply(
        200,
        '{"t":{"t":"3","r":1},"m":[{"a":"4","f":0,"i":"Client-g5d4g","p":{"t":"14607577960925503","r":1}, "i": "client1", "k":"mySubKey","c":"ch1","d":"UE5FRAFBQ1JIEIocqA6BfaybN/3U0WJRam0v3bPwfAXezgeCeGp+MztQ","b":"ch1"}]}',
        { 'content-type': 'text/javascript' },
      );

    const incomingPayloads = [];

    pubnubWithCrypto.addListener({
      message(messagePayload) {
        incomingPayloads.push(messagePayload);
        if (incomingPayloads.length === 1) {
          try {
            assert.equal(scope.isDone(), true);
            assert.deepEqual(incomingPayloads, [
              {
                actualChannel: 'ch1',
                message: 'hello',
                subscribedChannel: 'ch1',
                channel: 'ch1',
                subscription: 'ch1',
                timetoken: '14607577960925503',
                publisher: 'client1',
              },
            ]);
            done();
          } catch (error) {
            done(error);
          }
        }
      },
    });

    pubnubWithCrypto.subscribe({ channels: ['ch1'] });
  });
});
