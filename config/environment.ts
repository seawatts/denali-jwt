export default function environmentConfig(environment: string, appConfig: any) {

  let denaliJwtConfig = appConfig['denali-jwt'];

  appConfig['denali-jwt'] = Object.assign({}, denaliJwtConfig);
}
