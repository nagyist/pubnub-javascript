/* global describe, beforeEach, it, before, after */
/* eslint no-console: 0 */

import assert from 'assert';
import nock from 'nock';

import PubNub from '../../../src/node/index';
import utils from '../../utils';

describe('setting state operation', () => {
  let pubnub: PubNub;

  before(() => {
    nock.disableNetConnect();
  });

  beforeEach(() => {
    nock.cleanAll();
    pubnub = new PubNub({
      subscribeKey: 'mySubscribeKey',
      publishKey: 'myPublishKey',
      uuid: 'myUUID',
      // @ts-expect-error Force override default value.
      useRequestId: false,
    });
  });

  afterEach(() => {
    pubnub.destroy(true);
  });

  describe('#setState', () => {
    it('fails if no channels are provided', (done) => {
      pubnub.setState({ state: { hello: 'there' } }, (status) => {
        try {
          assert.equal(status.error, true);
          assert.equal(status.message, 'Please provide a list of channels and/or channel-groups');
          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it('supports updating for one channel', (done) => {
      const scope = utils
        .createNock()
        .get('/v2/presence/sub-key/mySubscribeKey/channel/ch1/uuid/myUUID/data')
        .query({
          pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
          uuid: 'myUUID',
          state: '{"hello":"there"}',
        })
        .reply(
          200,
          '{ "status": 200, "message": "OK", "payload": { "age" : 20, "status" : "online" }, "service": "Presence"}',
          { 'content-type': 'text/javascript' },
        );

      pubnub.setState({ channels: ['ch1'], state: { hello: 'there' } }, (status, response) => {
        try {
          assert.equal(status.error, false);
          assert(response !== null);
          assert.deepEqual(response.state, { age: 20, status: 'online' });
          assert.equal(scope.isDone(), true);
          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it('supports updating for multiple channels', (done) => {
      const scope = utils
        .createNock()
        .get('/v2/presence/sub-key/mySubscribeKey/channel/ch1,ch2/uuid/myUUID/data')
        .query({
          pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
          uuid: 'myUUID',
          state: '{"hello":"there"}',
        })
        .reply(
          200,
          '{ "status": 200, "message": "OK", "payload": { "age" : 20, "status" : "online" }, "service": "Presence"}',
          { 'content-type': 'text/javascript' },
        );

      pubnub.setState({ channels: ['ch1', 'ch2'], state: { hello: 'there' } }, (status, response) => {
        try {
          assert.equal(status.error, false);
          assert(response !== null);
          assert.deepEqual(response.state, { age: 20, status: 'online' });
          assert.equal(scope.isDone(), true);
          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it('supports updating for one channel group', (done) => {
      const scope = utils
        .createNock()
        .get('/v2/presence/sub-key/mySubscribeKey/channel/,/uuid/myUUID/data')
        .query({
          pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
          uuid: 'myUUID',
          state: '{"hello":"there"}',
          'channel-group': 'cg1',
        })
        .reply(
          200,
          '{ "status": 200, "message": "OK", "payload": { "age" : 20, "status" : "online" }, "service": "Presence"}',
          { 'content-type': 'text/javascript' },
        );

      pubnub.setState({ channelGroups: ['cg1'], state: { hello: 'there' } }, (status, response) => {
        try {
          assert.equal(status.error, false);
          assert(response !== null);
          assert.deepEqual(response.state, { age: 20, status: 'online' });
          assert.equal(scope.isDone(), true);
          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it('supports updating for multiple channel group', (done) => {
      const scope = utils
        .createNock()
        .get('/v2/presence/sub-key/mySubscribeKey/channel/,/uuid/myUUID/data')
        .query({
          pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
          uuid: 'myUUID',
          state: '{"hello":"there"}',
          'channel-group': 'cg1,cg2',
        })
        .reply(
          200,
          '{ "status": 200, "message": "OK", "payload": { "age" : 20, "status" : "online" }, "service": "Presence"}',
          { 'content-type': 'text/javascript' },
        );

      pubnub.setState({ channelGroups: ['cg1', 'cg2'], state: { hello: 'there' } }, (status, response) => {
        try {
          assert.equal(status.error, false);
          assert(response !== null);
          assert.deepEqual(response.state, { age: 20, status: 'online' });
          assert.equal(scope.isDone(), true);
          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it('supports promises', (done) => {
      const scope = utils
        .createNock()
        .get('/v2/presence/sub-key/mySubscribeKey/channel/ch1/uuid/myUUID/data')
        .query({
          pnsdk: `PubNub-JS-Nodejs/${pubnub.getVersion()}`,
          uuid: 'myUUID',
          state: '{"hello":"there"}',
        })
        .reply(
          200,
          '{ "status": 200, "message": "OK", "payload": { "age" : 20, "status" : "online" }, "service": "Presence"}',
          { 'content-type': 'text/javascript' },
        );

      const promise = pubnub.setState({
        channels: ['ch1'],
        state: { hello: 'there' },
      });
      assert.ok(promise);
      assert(typeof promise.then === 'function');
      promise
        .then((response) => {
          assert.deepEqual(response.state, { age: 20, status: 'online' });
          assert.equal(scope.isDone(), true);
          done();
        })
        .catch(done);
    });
  });
});
