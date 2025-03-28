/**
 * `uuid` presence REST API module.
 *
 * @internal
 */

import { TransportResponse } from '../../types/transport-response';
import { AbstractRequest } from '../../components/request';
import RequestOperation from '../../constants/operations';
import * as Presence from '../../types/api/presence';
import { encodeString } from '../../utils';
import { KeySet } from '../../types/api';

// --------------------------------------------------------
// ------------------------ Types -------------------------
// --------------------------------------------------------
// region Types

/**
 * Request configuration parameters.
 */
type RequestParameters = Required<Presence.WhereNowParameters> & {
  /**
   * PubNub REST API access key set.
   */
  keySet: KeySet;
};

/**
 * Service success response.
 */
type ServiceResponse = {
  /**
   * Request result status code.
   */
  status: number;

  /**
   * Where now human-readable result.
   */
  message: string;

  /**
   * Retrieved channels with `uuid` subscriber.
   */
  payload?: {
    /**
     * List of channels to which `uuid` currently subscribed.
     */
    channels: string[];
  };

  /**
   * Name of the service which provided response.
   */
  service: string;
};
// endregion

/**
 * Get `uuid` presence request.
 *
 * @internal
 */
export class WhereNowRequest extends AbstractRequest<Presence.WhereNowResponse, ServiceResponse> {
  constructor(private readonly parameters: RequestParameters) {
    super();
  }

  operation(): RequestOperation {
    return RequestOperation.PNWhereNowOperation;
  }

  validate(): string | undefined {
    if (!this.parameters.keySet.subscribeKey) return 'Missing Subscribe Key';
  }

  async parse(response: TransportResponse): Promise<Presence.WhereNowResponse> {
    const serviceResponse = this.deserializeResponse(response);

    if (!serviceResponse.payload) return { channels: [] };

    return { channels: serviceResponse.payload.channels };
  }

  protected get path(): string {
    const {
      keySet: { subscribeKey },
      uuid,
    } = this.parameters;

    return `/v2/presence/sub-key/${subscribeKey}/uuid/${encodeString(uuid)}`;
  }
}
