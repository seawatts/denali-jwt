import { createMixin, Errors, ResponderParams } from 'denali';
import { isFunction } from 'util';
import { sign, decode, verify, VerifyOptions as JwtVerifyOptions, SignOptions, DecodeOptions, VerifyCallback, SignCallback } from 'jsonwebtoken';
import * as assert from 'assert';
import { fromNode } from 'bluebird';
import { set } from 'lodash';

export type GetTokenCallback = (request: ResponderParams) => string;
export type SecretCallback = (request: ResponderParams, header: string, payload: string | Object, callback?: (error: Error, secret: string) => void) => string;

export interface VerifyOptions extends JwtVerifyOptions {
  secret?: SecretCallback | string | Buffer;
  getToken: GetTokenCallback,
  requestProperty: string;
}

interface Token extends Object {
  header: string
  payload: string
};

export default createMixin((BaseAction) =>
  class JWTAction extends BaseAction {

    before = ['verifyJwt', 'decodeJwt'];

    verifyOptions: VerifyOptions = {
      getToken,
      requestProperty: 'jwt'
    };

    jwt: Object | string;

    async verifiyJwt(request: ResponderParams) {
      if (validCorsPreflight(request)) {
        return;
      }

      assert(this.verifyOptions, 'You must define on verifyOptions this action');
      assert(this.verifyOptions.secret, 'You must define on verifyOptions.secret this action');

      try {
        const token = this.verifyOptions.getToken(request);
        let decodedToken = decode(token, { complete: true });

        let secret = await getSecret(this.verifyOptions.secret, request, decodedToken);
        let jwt = await fromNode((cb) => verify(token, secret, this.verifyOptions, cb));

        set(this, this.verifyOptions.requestProperty, jwt);

      } catch (err) {
        throw new Errors.Unauthorized(err);
      }
    }
  }
);

/**
 * Checks if an OPTIONS request with the access-control-request-headers containing authorization is being made
 * @param request
 * @returns {boolean}
 */
function validCorsPreflight({ headers, method }: ResponderParams): boolean {
  if (method === 'OPTIONS' && headers.has('access-control-request-headers')) {
    return headers.get('access-control-request-headers').split(',').map((header: string) => {
      return header.trim();
    }).includes('authorization');
  } else {
    return false;
  }
}


let getToken: GetTokenCallback = function ({ headers }: ResponderParams) {
  if (!headers || !headers.has('authorization')) {
    throw new Errors.Unauthorized('No authorization header present');
  }

  const parts = headers.get('authorization').split(" ");;

  if (parts.length == 2) {
    let [scheme, credentials] = parts;

    if (/^Bearer$/i.test(scheme)) {
      return credentials;
    } else {
      throw new Errors.Unauthorized('Format is Authorization: Bearer [token]');
    }
  } else {
    throw new Errors.Unauthorized('Bad Authorization header format. Format is "Authorization: Bearer token"');
  }
}

function isToken(token: Token | string | Object | null): token is Token {
  return token && (<Token>token).payload !== undefined;
}

async function getSecret(secret: SecretCallback | string | Buffer, request: ResponderParams, decodedToken: Token | string | Object | null): Promise<string> {
  if (typeof secret !== 'function') {
    return Promise.resolve(secret.toString());
  }

  let arity = secret.length;
  let header: string;
  let payload: string | Object;

  if (isToken(decodedToken)) {
    header = decodedToken.header;
    payload = decodedToken.payload;
  } else {
    payload = decodedToken;
  }

  if (arity == 4) {
    return fromNode((cb) => secret(request, header, payload, cb));
  } else {
    return fromNode((cb) => secret(request, payload, cb));
  }
}

