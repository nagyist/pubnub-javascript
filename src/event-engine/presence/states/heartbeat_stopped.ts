/**
 * Heartbeat stopped state module.
 *
 * @internal
 */

import { State } from '../../core/state';
import { Effects } from '../effects';
import { Events, joined, left, reconnect, leftAll } from '../events';
import { HeartbeatInactiveState } from './heartbeat_inactive';
import { HeartbeatingState } from './heartbeating';

/**
 * Context which represent current Presence Event Engine data state.
 *
 * @internal
 */
export type HeartbeatStoppedStateContext = {
  channels: string[];
  groups: string[];
};

/**
 * Heartbeat stopped state.
 *
 * State in which Presence Event Engine still has information about active channels / groups, but doesn't wait for
 * delayed heartbeat request sending.
 *
 * @internal
 */
export const HeartbeatStoppedState = new State<HeartbeatStoppedStateContext, Events, Effects>('HEARTBEAT_STOPPED');

HeartbeatStoppedState.on(joined.type, (context, event) =>
  HeartbeatStoppedState.with({
    channels: [...context.channels, ...event.payload.channels.filter((channel) => !context.channels.includes(channel))],
    groups: [...context.groups, ...event.payload.groups.filter((group) => !context.groups.includes(group))],
  }),
);

HeartbeatStoppedState.on(left.type, (context, event) =>
  HeartbeatStoppedState.with({
    channels: context.channels.filter((channel) => !event.payload.channels.includes(channel)),
    groups: context.groups.filter((group) => !event.payload.groups.includes(group)),
  }),
);

HeartbeatStoppedState.on(reconnect.type, (context, _) =>
  HeartbeatingState.with({
    channels: context.channels,
    groups: context.groups,
  }),
);

HeartbeatStoppedState.on(leftAll.type, (context, _) => HeartbeatInactiveState.with(undefined));
