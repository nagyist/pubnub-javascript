"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionSet = void 0;
const SubscribeCapable_1 = require("./SubscribeCapable");
/**
 * Multiple entities subscription set object which can be used to receive and handle real-time
 * updates.
 *
 * Subscription set object represent collection of per-entity subscription objects and allow
 * processing them at once for subscription loop and events handling.
 */
class SubscriptionSet extends SubscribeCapable_1.SubscribeCapable {
    /**
     * Create entities' subscription set object.
     *
     * Subscription set object represent collection of per-entity subscription objects and allow
     * processing them at once for subscription loop and events handling.
     *
     * @param channels - List of channels which should be used in subscription loop.
     * @param channelGroups - List of channel groups which should be used in subscription loop.
     * @param subscriptionOptions - Entities' subscription object configuration.
     * @param eventEmitter - Event emitter, which will notify listeners about updates received for
     * entities' channels / groups.
     * @param pubnub - PubNub instance which will perform subscribe / unsubscribe requests for
     * entities.
     *
     * @returns Ready to use entities' subscription set object.
     *
     * @internal
     */
    constructor({ channels = [], channelGroups = [], subscriptionOptions, eventEmitter, pubnub, }) {
        super();
        /**
         * List of channel names for subscription loop.
         *
         * List of entities' names which can have additional entries depending on from configuration
         * options. Presence events observing adds additional name to be used along with entity name.
         *
         * **Note:** Depending on from the entities' type, they may provide a list of channels which are
         * used to receive real-time updates for it.
         *
         * @internal
         */
        this.channelNames = [];
        /**
         * List of channel group names for subscription loop.
         *
         * List of entities' names which can have additional entries depending on from configuration
         * options. Presence events observing adds additional name to be used along with entity name.
         *
         * **Note:** Depending on from the entities' type, they may provide a list of channels which are
         * used to receive real-time updates for it.
         *
         * @internal
         */
        this.groupNames = [];
        /**
         * List of per-entity subscription objects.
         *
         * @internal
         */
        this.subscriptionList = [];
        /**
         * Whether subscribed ({@link SubscribeCapable#subscribe}) automatically during subscription
         * object / sets manipulation or not.
         *
         * @internal
         */
        this.subscribedAutomatically = false;
        /**
         * Whether subscribable object subscribed ({@link SubscribeCapable#subscribe}) or not.
         *
         * @internal
         */
        this.subscribed = false;
        this.options = subscriptionOptions;
        this.eventEmitter = eventEmitter;
        this.pubnub = pubnub;
        channels.forEach((c) => {
            const subscription = this.pubnub.channel(c).subscription(this.options);
            this.channelNames = [...this.channelNames, ...subscription.channels];
            this.subscriptionList.push(subscription);
        });
        channelGroups.forEach((cg) => {
            const subscription = this.pubnub.channelGroup(cg).subscription(this.options);
            this.groupNames = [...this.groupNames, ...subscription.channelGroups];
            this.subscriptionList.push(subscription);
        });
        this.typeBasedListener = {};
        this.typeBasedListenerId = eventEmitter.addListener(this.typeBasedListener, this.channelNames, this.groupNames);
    }
    /**
     * Add additional entity's subscription to the subscription set.
     *
     * **Important:** Changes will be effective only after {@link SubscribeCapable#subscribe} call or
     * next subscription loop.
     *
     * @param subscription - Other entity's subscription object, which should be added.
     */
    addSubscription(subscription) {
        this.subscriptionList.push(subscription);
        this.channelNames = [...this.channelNames, ...subscription.channels];
        this.groupNames = [...this.groupNames, ...subscription.channelGroups];
        this.eventEmitter.addListener(this.typeBasedListener, subscription.channels, subscription.channelGroups, this.typeBasedListenerId);
        // Make sure to listen events on channels / groups added with `subscription`.
        this.updateListeners();
        // Subscribe subscription object if subscription set already subscribed.
        // @ts-expect-error: Required access of protected field.
        if (this.subscribed && !subscription.subscribed) {
            subscription.subscribe();
            // @ts-expect-error: Required modification of protected field.
            subscription.subscribedAutomatically = true; // should be placed after .subscribe() call.
        }
    }
    /**
     * Remove entity's subscription object from the set.
     *
     * **Important:** Changes will be effective only after {@link SubscribeCapable#unsubscribe} call or
     * next subscription loop.
     *
     * @param subscription - Other entity's subscription object, which should be removed.
     */
    removeSubscription(subscription) {
        const channelsToRemove = subscription.channels;
        const groupsToRemove = subscription.channelGroups;
        this.channelNames = this.channelNames.filter((c) => !channelsToRemove.includes(c));
        this.groupNames = this.groupNames.filter((cg) => !groupsToRemove.includes(cg));
        this.subscriptionList = this.subscriptionList.filter((s) => s !== subscription);
        this.eventEmitter.removeListener(this.typeBasedListener, this.typeBasedListenerId, channelsToRemove, groupsToRemove);
        // Make sure to stop listening for events from channels / groups removed with `subscription`.
        this.updateListeners();
        // @ts-expect-error: Required access of protected field.
        if (subscription.subscribedAutomatically)
            subscription.unsubscribe();
    }
    /**
     * Merge with other subscription set object.
     *
     * **Important:** Changes will be effective only after {@link SubscribeCapable#subscribe} call or
     * next subscription loop.
     *
     * @param subscriptionSet - Other entities' subscription set, which should be joined.
     */
    addSubscriptionSet(subscriptionSet) {
        this.subscriptionList = [...this.subscriptionList, ...subscriptionSet.subscriptions];
        this.channelNames = [...this.channelNames, ...subscriptionSet.channels];
        this.groupNames = [...this.groupNames, ...subscriptionSet.channelGroups];
        this.eventEmitter.addListener(this.typeBasedListener, subscriptionSet.channels, subscriptionSet.channelGroups, this.typeBasedListenerId);
        // Make sure to listen events on channels / groups added with `subscription set`.
        this.updateListeners();
        // Subscribe subscription object if subscription set already subscribed.
        if (this.subscribed && !subscriptionSet.subscribed) {
            subscriptionSet.subscribe();
            subscriptionSet.subscribedAutomatically = true; // should be placed after .subscribe() call.
        }
    }
    /**
     * Subtract other subscription set object.
     *
     * **Important:** Changes will be effective only after {@link SubscribeCapable#unsubscribe} call or
     * next subscription loop.
     *
     * @param subscriptionSet - Other entities' subscription set, which should be subtracted.
     */
    removeSubscriptionSet(subscriptionSet) {
        const channelsToRemove = subscriptionSet.channels;
        const groupsToRemove = subscriptionSet.channelGroups;
        this.channelNames = this.channelNames.filter((c) => !channelsToRemove.includes(c));
        this.groupNames = this.groupNames.filter((cg) => !groupsToRemove.includes(cg));
        this.subscriptionList = this.subscriptionList.filter((s) => !subscriptionSet.subscriptions.includes(s));
        this.eventEmitter.removeListener(this.typeBasedListener, this.typeBasedListenerId, channelsToRemove, groupsToRemove);
        // Make sure to stop listening for events from channels / groups removed with `subscription set`.
        this.updateListeners();
        if (subscriptionSet.subscribedAutomatically)
            subscriptionSet.unsubscribe();
    }
    /**
     * Get list of entities' subscription objects registered in subscription set.
     *
     * @returns Entities' subscription objects list.
     */
    get subscriptions() {
        return this.subscriptionList.slice(0);
    }
    /**
     * Update listeners for current {@link SubscriptionSet} state.
     *
     * When {@link Subscription} or {@link SubscriptionSet} added / removed it is **required** to
     * update mapping of channels / groups (based on current {@link SubscriptionSet} state) to the
     * event listeners.
     *
     * @internal
     */
    updateListeners() {
        if (!this.aggregatedListener)
            return;
        const aggregatedListener = this.aggregatedListener;
        this.removeListener(this.aggregatedListener);
        this.addListener(aggregatedListener);
    }
}
exports.SubscriptionSet = SubscriptionSet;
