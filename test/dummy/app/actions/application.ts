import { Action } from 'denali';
import JwtMixin, { VerifyOptions } from '../../../../lib/index';

export default class ApplicationAction extends Action.mixin(JwtMixin) {
  static verifyOptions: VerifyOptions = {
    secret: '123'
  }
}
