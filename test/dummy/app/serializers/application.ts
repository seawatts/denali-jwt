import { JSONAPISerializer } from 'denali';

export default class ApplicationSerializer extends JSONAPISerializer {
  attributes: string[] = [ ];
  relationships: any = {};
}
