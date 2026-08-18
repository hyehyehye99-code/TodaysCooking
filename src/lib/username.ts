const USERNAME_DOMAIN = "onaeyo.app";
const USERNAME_RE = /^[a-z0-9_]{4,20}$/;

export function isValidUsername(username: string) {
  return USERNAME_RE.test(username);
}

export function usernameToEmail(username: string) {
  return `${username}@${USERNAME_DOMAIN}`;
}
