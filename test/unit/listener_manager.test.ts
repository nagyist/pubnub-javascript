/* global describe, it */

import assert from 'assert';

import { Listener, ListenerManager } from '../../src/core/components/listener_manager';
import PubNub from '../../src/node';

describe('components/ListenerManager', () => {
  it('supports removal of listeners', () => {
    let listeners = new ListenerManager();
    let bool1 = false;
    let bool2 = false;

    let listener1 = {
      message() {
        bool1 = true;
      },
    };

    let listener2 = {
      message() {
        bool2 = true;
      },
    };

    listeners.addListener(listener1);
    listeners.addListener(listener2);

    listeners.removeListener(listener2);
    listeners.announceMessage({
      channel: 'ch',
      subscription: 'ch',
      message: 'hi',
      timetoken: '123',
      publisher: 'John',
    });

    assert(bool1, 'bool1 was triggered');
    assert(!bool2, 'bool2 was not triggered');
  });

  it('supports presence announcements', () => {
    let listeners = new ListenerManager();
    let bool1 = false;
    let bool2 = false;
    let bool3 = false;

    let listener1 = {
      presence() {
        bool1 = true;
      },
    };

    let listener2 = {
      presence() {
        bool2 = true;
      },
    };

    let listener3 = {
      message() {
        bool3 = true;
      },
      status() {
        bool3 = true;
      },
    };

    listeners.addListener(listener1);
    listeners.addListener(listener2);
    listeners.addListener(listener3);

    listeners.announcePresence({
      channel: 'ch',
      subscription: 'ch',
      action: 'join',
      uuid: 'John',
      occupancy: 1,
      timetoken: '123',
      timestamp: 123,
    });

    assert(bool1, 'bool1 was triggered');
    assert(bool2, 'bool2 was triggered');
    assert(!bool3, 'bool3 was not triggered');
  });

  it('supports status announcements', () => {
    let listeners = new ListenerManager();
    let bool1 = false;
    let bool2 = false;
    let bool3 = false;

    let listener1 = {
      status() {
        bool1 = true;
      },
    };

    let listener2 = {
      status() {
        bool2 = true;
      },
    };

    let listener3 = {
      message() {
        bool3 = true;
      },
      presence() {
        bool3 = true;
      },
    };

    listeners.addListener(listener1);
    listeners.addListener(listener2);
    listeners.addListener(listener3);

    listeners.announceStatus({ statusCode: 200, category: PubNub.CATEGORIES.PNConnectedCategory });

    assert(bool1, 'bool1 was triggered');
    assert(bool2, 'bool2 was triggered');
    assert(!bool3, 'bool3 was not triggered');
  });

  it('supports message announcements', () => {
    let listeners = new ListenerManager();
    let bool1 = false;
    let bool2 = false;
    let bool3 = false;

    let listener1 = {
      message() {
        bool1 = true;
      },
    };

    let listener2 = {
      message() {
        bool2 = true;
      },
    };

    let listener3 = {
      status() {
        bool3 = true;
      },
      presence() {
        bool3 = true;
      },
    };

    listeners.addListener(listener1);
    listeners.addListener(listener2);
    listeners.addListener(listener3);

    listeners.announceMessage({
      channel: 'ch',
      subscription: 'ch',
      message: 'hi',
      timetoken: '123',
      publisher: 'John',
    });

    assert(bool1, 'bool1 was triggered');
    assert(bool2, 'bool2 was triggered');
    assert(!bool3, 'bool3 was not triggered');
  });

  it('announces network down events', () => {
    let listeners = new ListenerManager();
    let listener: Listener = {
      status(status) {
        assert.deepEqual(status, { category: PubNub.CATEGORIES.PNNetworkDownCategory });
      },
    };

    listeners.addListener(listener);

    listeners.announceNetworkDown();
  });

  it('announces network up events', () => {
    let listeners = new ListenerManager();
    let listener: Listener = {
      status(status) {
        assert.deepEqual(status, { category: PubNub.CATEGORIES.PNNetworkUpCategory });
      },
    };

    listeners.addListener(listener);

    listeners.announceNetworkUp();
  });
});
