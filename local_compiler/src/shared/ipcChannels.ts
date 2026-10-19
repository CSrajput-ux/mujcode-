/**
 * MUJCODE Local Compiler — Strictly Typed IPC Channel Registry
 * Prevents arbitrary or wildcard string channel exploitation.
 */

export const IPC_CHANNELS = {
  // Compiler & Diagnostics
  EXECUTE_CODE: 'compiler:execute-code',
  GET_DIAGNOSTICS: 'doctor:get-diagnostics',
  GET_SUPPORTED_LANGUAGES: 'compiler:get-languages',
  OPEN_EXTERNAL_URL: 'system:open-external',
  INSTALL_TOOLCHAIN: 'doctor:install-toolchain',
  RESCAN_LANGUAGE: 'doctor:rescan-language',


  // Secure Networking & Pairing
  GET_CONNECTION_STATE: 'agent:get-connection-state',
  GET_PAIRING_STATUS: 'agent:get-pairing-status',
  CONNECT: 'agent:connect',
  DISCONNECT: 'agent:disconnect',
  SUBMIT_PAIRING_CODE: 'agent:submit-pairing-code',
  UNPAIR: 'agent:unpair',
  ON_CONNECTION_STATE_CHANGED: 'agent:on-connection-state-changed'
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
