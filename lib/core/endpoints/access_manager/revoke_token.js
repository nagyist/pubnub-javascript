"use strict";
/**
 * PAM Revoke Token REST API module.
 *
 * @internal
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevokeTokenRequest = void 0;
const transport_request_1 = require("../../types/transport-request");
const request_1 = require("../../components/request");
const operations_1 = __importDefault(require("../../constants/operations"));
const utils_1 = require("../../utils");
// endregion
/**
 * Access token revoke request.
 *
 * Invalidate token and permissions which has been granted for it.
 *
 * @internal
 */
class RevokeTokenRequest extends request_1.AbstractRequest {
    constructor(parameters) {
        super({ method: transport_request_1.TransportMethod.DELETE });
        this.parameters = parameters;
    }
    operation() {
        return operations_1.default.PNAccessManagerRevokeToken;
    }
    validate() {
        if (!this.parameters.keySet.secretKey)
            return 'Missing Secret Key';
        if (!this.parameters.token)
            return "token can't be empty";
    }
    parse(response) {
        const _super = Object.create(null, {
            parse: { get: () => super.parse }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.parse.call(this, response).then((_) => ({}));
        });
    }
    get path() {
        const { keySet: { subscribeKey }, token, } = this.parameters;
        return `/v3/pam/${subscribeKey}/grant/${(0, utils_1.encodeString)(token)}`;
    }
}
exports.RevokeTokenRequest = RevokeTokenRequest;
