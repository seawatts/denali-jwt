import { attr } from 'denali';
import ApplicationModel from './application';

export default class Post extends ApplicationModel {

  static title = attr('text');

}
