"use client";

import * as React from "react";
import { ConnectCard } from "@/components/connect-card";
import { ContactsTable } from "@/components/contacts-table";
import type { ConnectionCallbacks } from "@runmorph/atoms";
import { Morph } from "@runmorph/cloud";
import { useSearchParams } from "next/navigation";
import {
  type ConnectorId,
  ConnectorSelect,
  getConnectorName,
} from "@/components/connector-select";
import { availableConnectorIds } from "@/lib/connectors";

interface ConnectionWrapperProps {
  sessionToken: string;
  connectorId: string;
  ownerId: string;
}

export function ConnectionWrapper({
  sessionToken,
  connectorId,
  ownerId,
}: ConnectionWrapperProps) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [unavailableMessage, setUnavailableMessage] = React.useState<
    string | null
  >(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [selectedConnector, setSelectedConnector] = React.useState(connectorId);
  const [publicKey, setPublicKey] = React.useState<string | null>(null);
  const [mockedConnectionFirst, setMockedConnectionFirst] =
    React.useState<boolean>(true);
  const searchParams = useSearchParams();
  const themeParam =
    searchParams.get("theme") === "light" ? "?theme=light" : "";

  // Handle unavailable connector selection
  const handleUnavailableConnector = (connectorId: string) => {
    setUnavailableMessage(getConnectorName(connectorId));
    setErrorMessage(null);
    setSelectedConnector(connectorId); // Force ContactsTable remount
    setIsConnected(false);
  };

  // Set public key based on connector availability
  React.useEffect(() => {
    if (availableConnectorIds.includes(connectorId)) {
      setErrorMessage(null);
      setUnavailableMessage(null);
      setPublicKey(
        process.env.NEXT_PUBLIC_MORPH_PUBLIC_KEY ?? "pk_demo_xxxxxxxxxxxxxxx"
      );
    } else {
      setErrorMessage(null);
      setUnavailableMessage(getConnectorName(connectorId));
      setPublicKey("pk_demo_xxxxxxxxxxxxxxx");
      setIsConnected(false);
      setMockedConnectionFirst(true);
    }
    setSelectedConnector(connectorId);
  }, [connectorId]);

  // Check connection status when connector changes
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!connectorId) return <p>No connector id provided</p>;
        if (!publicKey) return;
        if (publicKey === "pk_demo_xxxxxxxxxxxxxxx" && mockedConnectionFirst) {
          setMockedConnectionFirst(false);
          return;
        }
        const morph = Morph({
          publicKey,
        });
        const connection = morph.connections({ sessionToken });
        const { data, error } = await connection.retrieve();

        if (error) {
          console.error("Error retrieving connection:", error);
          setIsConnected(false);
          return;
        }

        const isAuthorized = data.status === "authorized";
        setIsConnected(isAuthorized);
        if (isAuthorized) {
          setUnavailableMessage(null);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Error checking connection status:", error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, [sessionToken, connectorId, publicKey]);

  const connectionCallbacks: ConnectionCallbacks = {
    authorized: () => {
      setIsConnected(true);
      setUnavailableMessage(null);
      setErrorMessage(null);
    },
    onError: (error: { message: string }) => {
      console.error("Connection error:", error);
      setErrorMessage(error.message);
      setIsConnected(false);
    },
  };

  return (
    <div className="pt-4">
      <div className="mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <React.Suspense fallback={<div>Loading connector select...</div>}>
            <ConnectorSelect
              defaultValue={connectorId as ConnectorId}
              ownerId={ownerId}
              onUnavailableConnector={handleUnavailableConnector}
            />
          </React.Suspense>
          <ConnectCard
            publicKey={publicKey}
            sessionToken={sessionToken}
            connectorId={connectorId}
            connectionCallbacks={connectionCallbacks}
          />
        </div>

        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200">
            {errorMessage}
          </div>
        )}

        {unavailableMessage && !isConnected && !errorMessage && (
          <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg text-yellow-800 dark:text-yellow-200">
            <p>
              {unavailableMessage} is using mocked data in the playground as it
              requires a private <code>CLIENT_ID</code> and{" "}
              <code>CLIENT_SECRET</code>.
            </p>
            <p>
              You can still test the authorization flow by clicking the menu (
              ⠇) and selecting &quot;Re-authorize&quot;
            </p>
            <br />
            <p>
              Try one of our playground-ready connectors like{" "}
              <a
                href={`/${ownerId}/connectors/salesforce${themeParam}`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Salesforce
              </a>{" "}
              or{" "}
              <a
                href={`/${ownerId}/connectors/hubspot${themeParam}`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                HubSpot
              </a>{" "}
              – or{" "}
              <a
                href={`https://cal.com/morphhq/sign-up-onboarding`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                book a demo
              </a>{" "}
              to test {unavailableMessage} live ✨
            </p>
          </div>
        )}

        <ContactsTable
          connectorId={connectorId}
          isConnected={isConnected}
          sessionToken={sessionToken}
          key={selectedConnector}
        />
      </div>
    </div>
  );
}
