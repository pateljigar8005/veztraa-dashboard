export default {
  loginEndpoint: '/auth/login',
  registerEndpoint: '/jwt/register',
  refreshEndpoint: '/auth/refresh',
  logoutEndpoint: '/auth/logout',
  forgotPasswordEndpoint: '/auth/forgot-password',
  resetPasswordEndpoint: '/auth/reset-password',

  tokenType: 'Bearer',

  storageTokenKeyName: 'accessToken',
  storageRefreshTokenKeyName: 'refreshToken'
}