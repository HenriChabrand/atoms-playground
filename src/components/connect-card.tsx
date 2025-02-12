"use client";
import { MorphProvider } from "@runmorph/atoms";
import { Connect } from "@runmorph/atoms";
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
    <MorphProvider config={{ publicKey }}>
      <Connect
        sessionToken={sessionToken}
        connectionCallbacks={connectionCallbacks}
      />
    </MorphProvider>
  );
}
