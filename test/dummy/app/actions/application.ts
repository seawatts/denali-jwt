import { Action } from 'denali';
import { Mixin as JwtMixin } from 'denali-jwt';

export default class ApplicationAction extends Action.mixin(JwtMixin) {
}
