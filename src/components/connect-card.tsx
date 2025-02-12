"use client";
import { Connect, Morph } from "@runmorph/atoms";
import type { ConnectionCallbacks } from "@runmorph/atoms";

interface ConnectCardProps {
  sessionToken: string;
  connectorId: string;
  publicKey: string;
  connectionCallbacks?: ConnectionCallbacks;
}

export function ConnectCard({
  sessionToken,
  connectionCallbacks,
  publicKey,
}: ConnectCardProps) {
  return (
    <Morph.Provider config={{ publicKey }}>
      <Connect
        sessionToken={sessionToken}
        connectionCallbacks={connectionCallbacks}
      />
    </Morph.Provider>
  );
}
