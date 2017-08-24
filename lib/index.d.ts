import { ResponderParams } from 'denali';
import { VerifyOptions as JwtVerifyOptions } from 'jsonwebtoken';

declare module 'denali-jwt' {
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

}
