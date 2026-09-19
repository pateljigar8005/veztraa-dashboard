export default {
  loginEndpoint: '/auth/login',
  registerEndpoint: '/jwt/register',
  refreshEndpoint: '/auth/refresh',
  logoutEndpoint: '/auth/logout',

  tokenType: 'Bearer',

  storageTokenKeyName: 'accessToken',
  storageRefreshTokenKeyName: 'refreshToken'
}