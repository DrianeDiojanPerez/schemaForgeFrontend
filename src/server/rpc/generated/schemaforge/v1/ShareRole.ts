// Original file: schema.proto

export const ShareRole = {
  SHARE_ROLE_UNSPECIFIED: 'SHARE_ROLE_UNSPECIFIED',
  SHARE_ROLE_VIEWER: 'SHARE_ROLE_VIEWER',
  SHARE_ROLE_EDITOR: 'SHARE_ROLE_EDITOR',
} as const;

export type ShareRole =
  | 'SHARE_ROLE_UNSPECIFIED'
  | 0
  | 'SHARE_ROLE_VIEWER'
  | 1
  | 'SHARE_ROLE_EDITOR'
  | 2

export type ShareRole__Output = typeof ShareRole[keyof typeof ShareRole]
