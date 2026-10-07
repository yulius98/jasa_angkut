export const BACKEND_URL =
  process.env.BACKEND_URL && process.env.BACKEND_URL !== ""
    ? process.env.BACKEND_URL
    : "http://localhost:3001"

export const ACCESS_TOKEN_COOKIE = "access_token"
export const REFRESH_TOKEN_COOKIE = "refresh_token"
export const USER_COOKIE = "user"

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7