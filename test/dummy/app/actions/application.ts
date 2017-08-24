import { Action } from 'denali';
import JwtMixin from 'denali-jwt';

export default class ApplicationAction extends Action.mixin(JwtMixin) {
}
