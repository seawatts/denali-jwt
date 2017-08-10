import { Blueprint } from 'denali-cli';

// This blueprint is run when denali-jwt is installed via `denali install`. It's a good spot to
// make any changes to the consuming app or addon, i.e. create a config file, add a route, etc
export default class DenaliJwtBlueprint extends Blueprint {

  static blueprintName = 'denali-jwt';
  static description = 'Installs denali-jwt';

  locals(/* argv */) {}

}
