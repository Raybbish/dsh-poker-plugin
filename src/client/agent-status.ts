/** Minimal view of the Harness session store supplied through slot props. */
export interface AgentSessionSummary {
  running: boolean;
}

export interface AgentSessionState {
  current?: string;
  byId: Readonly<Record<string, AgentSessionSummary | undefined>>;
}

export type SessionSelectorHook = <Selected>(selector: (state: AgentSessionState) => Selected) => Selected;

export interface HarnessStandardProps {
  useSessions?: SessionSelectorHook;
}

const idleSessions: SessionSelectorHook = (selector) => selector({ byId: {} });

/** Read only the one host fact this plugin needs: whether the active Agent runs. */
export function useAgentRunning(props: HarnessStandardProps): boolean {
  const useSessions = props.useSessions ?? idleSessions;
  return useSessions((state) => state.current !== undefined && state.byId[state.current]?.running === true);
}
