/**
 * MUJCODE Local Compiler — Connection State Machine
 * 
 * Enforces legal state transitions and prevents inconsistent or duplicate states.
 */

import { AgentConnectionStatus } from '../shared/agentProtocol.js';

export type StateChangeListener = (newState: AgentConnectionStatus, oldState: AgentConnectionStatus, reason?: string) => void;

/**
 * Strict legal state transitions map
 */
const LEGAL_TRANSITIONS: Record<AgentConnectionStatus, AgentConnectionStatus[]> = {
  DISCONNECTED: ['CONNECTING', 'PAIRING_REQUIRED'],
  CONNECTING: ['CONNECTED', 'PAIRING_REQUIRED', 'ERROR', 'DISCONNECTED'],
  PAIRING_REQUIRED: ['CONNECTING', 'DISCONNECTED', 'ERROR'],
  CONNECTED: ['RECONNECTING', 'STOPPING', 'DISCONNECTED', 'ERROR'],
  RECONNECTING: ['CONNECTED', 'CONNECTING', 'ERROR', 'STOPPING', 'DISCONNECTED'],
  ERROR: ['RECONNECTING', 'CONNECTING', 'DISCONNECTED', 'PAIRING_REQUIRED'],
  STOPPING: ['DISCONNECTED']
};

export class AgentStateMachine {
  private currentState: AgentConnectionStatus = 'DISCONNECTED';
  private lastError: string | null = null;
  private listeners: Set<StateChangeListener> = new Set();

  getState(): AgentConnectionStatus {
    return this.currentState;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  isConnected(): boolean {
    return this.currentState === 'CONNECTED';
  }

  canTransitionTo(targetState: AgentConnectionStatus): boolean {
    const allowed = LEGAL_TRANSITIONS[this.currentState] || [];
    return allowed.includes(targetState);
  }

  transitionTo(targetState: AgentConnectionStatus, reason?: string): void {
    if (this.currentState === targetState) {
      return; // No-op for identical state
    }

    if (!this.canTransitionTo(targetState)) {
      throw new Error(
        `Illegal state transition: Cannot transition from "${this.currentState}" to "${targetState}". Legal targets: [${LEGAL_TRANSITIONS[this.currentState]?.join(', ')}]`
      );
    }

    const previousState = this.currentState;
    this.currentState = targetState;

    if (targetState === 'ERROR' && reason) {
      this.lastError = reason;
    } else if (targetState === 'CONNECTED' || targetState === 'CONNECTING') {
      this.lastError = null;
    }

    // Notify listeners safely
    for (const listener of this.listeners) {
      try {
        listener(targetState, previousState, reason);
      } catch (err) {
        console.error('[AgentStateMachine] Error in state change listener:', err);
      }
    }
  }

  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  reset(): void {
    this.currentState = 'DISCONNECTED';
    this.lastError = null;
  }
}
