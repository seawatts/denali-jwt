import ApplicationAction from '../application';

export default class ListPosts extends ApplicationAction {

  async respond() {
    return await this.db.all('post');
  }

}
