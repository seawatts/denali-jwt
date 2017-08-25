# Denali Jwt

Middleware that validates JsonWebTokens and sets `this.jwt`.

This module lets you authenticate HTTP requests using JWT tokens in your Denali
applications. JWTs are typically used to protect API endpoints, and are
often issued using OpenID Connect.

## Install

```sh
$ denali install denali-jwt
```

## Developing

1. Clone the repo down
2. `yarn install`
3. `denali server`
4. Hit [localhost:3000](http://localhost:3000)

## Tests

```sh
$ denali test
```

## Usage

The JWT authentication middleware authenticates callers using a JWT.
If the token is valid, `this.jwt` will be set with the JSON object decoded
to be used by later middleware for authorization and access control.

For example,

```javascript
// config/environment.js
export default function environmentConfig(environment: any) {
  let config = {
    'denali-jwt': {
      issuer: 'https://mydomain.com/',
      audience: 'some-audiance',
      secret: process.env.JWT_SECRET
      algorithms: ['RS256']
    }
  };

  return config;
```

```javascript
// app/actions/application.js

import VerifyJwt from 'denali-jwt';
import { Action } from 'denali';

export default abstract ApplicationAction extends Action {
  static before = ['verifyJwt'];

  verifyJwt = VerifyJwt();
}
```

You can specify audience and/or issuer as well:

```javascript
'denali-jwt' = {
  secret: 'shhhhhhared-secret',
  audience: 'http://myapi/protected',
  issuer: 'http://issuer'
};
```

> If the JWT has an expiration (`exp`), it will be checked.

If you are using a base64 URL-encoded secret, pass a `Buffer` with `base64` encoding as the secret instead of a string:

```javascript
'denali-jwt' = {
  secret: new Buffer('shhhhhhared-secret', 'base64')
};
```

This module also support tokens signed with public/private key pairs. Instead of a secret, you can specify a Buffer with the public key

```javascript
let publicKey = fs.readFileSync('/path/to/public.pub');
'denali-jwt' = {
  secret: publicKey
};
```

By default, the decoded token is attached to `this.jwt` but can be configured with the `requestProperty` option.


```javascript
'denali-jwt' = {
   secret: publicKey,
   requestProperty: 'auth'
};
```

`requestProperty` utilizes [lodash.set](https://lodash.com/docs/4.17.2#set) and will accept nested property paths.

A custom function for extracting the token from a request can be specified with
the `getToken` option. This is useful if you need to pass the token through a
query parameter or a cookie. You can throw an error in this function and it will
be handled by `denali-jwt`.

```javascript
'denali-jwt' = {
  secret: 'hello world !',
  getToken: function fromHeaderOrQuerystring (req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  }
};
```
## Related Modules

- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — JSON Web Token sign and verification

## Contributors
Check them out [here](https://github.com/seawatts/denali-jwt/graphs/contributors)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
