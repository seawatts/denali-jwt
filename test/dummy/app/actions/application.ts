import { Action } from 'denali';
import VerifyJwt from 'denali-jwt';

export default abstract class ApplicationAction extends Action {
  static before = ['verifyJwt'];

  verifyJwt = VerifyJwt();
}
