import { Errors, ResponderParams, Container, Action } from 'denali';
import { verify, decode, VerifyOptions as JwtVerifyOptions } from 'jsonwebtoken';
import { isFunction } from 'util';
import * as assert from 'assert';
import { fromNode } from 'bluebird';
import { set } from 'lodash';
import * as uuid from 'uuid';
import * as createDebug from 'debug';

const debug = createDebug('denali-jwt:mixin');

export interface VerifyOptions extends JwtVerifyOptions {
  secret?: SecretCallback | string | Buffer;
  getToken?: GetTokenCallback,
  requestProperty?: string;
}
export type GetTokenCallback = (request: ResponderParams) => string;
export type SecretCallback = (request: ResponderParams, header: string, payload: string | Object, callback?: (error: Error, secret: string) => void) => string;

export interface Token extends Object {
  header: string
  payload: string
}

export type MiddlewareFunction = (request: ResponderParams) => Promise<void>;

export type MiddlewareFactory = (action: Action) => Promise<MiddlewareFunction>;

async function jwt(verifyOptions: VerifyOptions): Promise<MiddlewareFunction> {
  let action = this;

  return async function middleware(request: ResponderParams) {
    if (validCorsPreflight(request)) {
      return;
    }

    assert(verifyOptions, 'You must define on verifyOptions this action');

    let {
      secret,
      getToken,
      requestProperty
    } = verifyOptions;

    assert(secret, 'You must define on verifyOptions.secret this action');

    try {
      let getTokenCallback = getToken ? getToken : defaultGetToken;
      const token = getTokenCallback(request);
      let decodedToken = decode(token, { complete: true });

      let decodedSecret = await getSecret(secret, request, decodedToken);
      let jwt = await fromNode((cb) => verify(token, decodedSecret, verifyOptions, cb));

      set(action, requestProperty || 'jwt', jwt);

    } catch (err) {
      throw new Errors.Unauthorized(err);
    }
  };
}

function denaliMiddlewareHelper(middlewareFactory: MiddlewareFactory) {
  let middlewareId = uuid.v4();
  debug(`Assigning middleware - ${middlewareId}`);

  return async function denaliMiddlewareWrapper(request: ResponderParams) {
    let meta = this.container.metaFor(this);

    if (!meta.middlewareCache) {
      debug(`Creating initial meta property on action`);
      let middlewareCache: { [id: string]: MiddlewareFactory } = {};
      meta.middlewareCache = middlewareCache;
    }

    let middleware: MiddlewareFunction = meta.middlewareCache[middlewareId];

    if (!middleware) {
      middleware = meta.middlewareCache[middlewareId] = <MiddlewareFunction>await middlewareFactory(this);
      debug(`Using uncached middleware - ${middlewareId}`);
    } else {
      debug(`Using cached middleware - ${middlewareId}`);
    }

    return middleware(request);
  };
}
export default function verifyJwt() {
  return denaliMiddlewareHelper((action) => jwt.call(action, action.config['denali-jwt']));
}

// export default createMixin((BaseAction) =>
//   class JwtAction extends BaseAction {
//     static before = 'verifyJwt';
//     jwt: Object | string;
//     'verifyJwt' = verifyJwt;
//   }
// );

/**
 * Checks if an OPTIONS request with the access-control-request-headers containing authorization is being made
 * @param request
 * @returns {boolean}
 */
function validCorsPreflight({ headers, method }: ResponderParams): boolean {
  if (method === 'OPTIONS' && 'access-control-request-headers' in headers) {
    return headers['access-control-request-headers'].split(',').map((header: string) => {
      return header.trim();
    }).includes('authorization');
  } else {
    return false;
  }
}

let defaultGetToken: GetTokenCallback = ({ headers }: ResponderParams): string => {
  if (!headers || !('authorization' in headers)) {
    throw new Errors.Unauthorized('No authorization header present');
  }

  const parts = headers['authorization'].split(" ");;

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

