/**
 * Get Channel Metadata REST API module.
 *
 * @internal
 */

import { AbstractRequest } from '../../../components/request';
import RequestOperation from '../../../constants/operations';
import * as AppContext from '../../../types/api/app-context';
import { KeySet, Query } from '../../../types/api';
import { encodeString } from '../../../utils';

// --------------------------------------------------------
// ----------------------- Defaults -----------------------
// --------------------------------------------------------
// region Defaults

/**
 * Whether `Channel` custom field should be included by default or not.
 */
const INCLUDE_CUSTOM_FIELDS = true;
// endregion

// --------------------------------------------------------
// ------------------------ Types -------------------------
// --------------------------------------------------------
// region Types

/**
 * Request configuration parameters.
 */
type RequestParameters = AppContext.GetChannelMetadataParameters & {
  /**
   * PubNub REST API access key set.
   */
  keySet: KeySet;
};
// endregion

/**
 * Get Channel Metadata request.
 *
 * @internal
 */
export class GetChannelMetadataRequest<
  Response extends AppContext.GetChannelMetadataResponse<Custom>,
  Custom extends AppContext.CustomData = AppContext.CustomData,
> extends AbstractRequest<Response, Response> {
  constructor(private readonly parameters: RequestParameters) {
    super();

    // Apply default request parameters.
    parameters.include ??= {};
    parameters.include.customFields ??= INCLUDE_CUSTOM_FIELDS;
  }

  operation(): RequestOperation {
    return RequestOperation.PNGetChannelMetadataOperation;
  }

  validate(): string | undefined {
    if (!this.parameters.channel) return 'Channel cannot be empty';
  }

  protected get path(): string {
    const {
      keySet: { subscribeKey },
      channel,
    } = this.parameters;

    return `/v2/objects/${subscribeKey}/channels/${encodeString(channel)}`;
  }

  protected get queryParameters(): Query {
    return {
      include: ['status', 'type', ...(this.parameters.include!.customFields ? ['custom'] : [])].join(','),
    };
  }
}
