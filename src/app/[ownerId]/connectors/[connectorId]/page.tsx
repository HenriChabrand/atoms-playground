import { ConnectionWrapper } from "./connection-wrapper";
import { createSession } from "./actions";
import { Suspense } from "react";
import { availableConnectorIds } from "@/lib/connectors";
import { redirect } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ connectorId: string; ownerId: string }>;
  searchParams: Promise<{ dark?: string }>;
}) {
  const { connectorId, ownerId } = await params;
  const { dark } = await searchParams;
  const isDark = dark === "true";

  // Redirect if ownerId is "temp"
  if (ownerId === "temp") {
    const newOwnerId = `temp_${Date.now()}`;
    const darkParam = isDark ? "?dark=true" : "";
    redirect(`/${newOwnerId}/connectors/${connectorId}${darkParam}`);
  }

  if (!connectorId) return <p>No connector id provided</p>;
  let publicKey = "pk_demo_xxxxxxxxxxxxxxx";
  let secretKey = "sk_demo_xxxxxxxxxxxxxxx";
  let finalOwnerId = "demo";

  if (availableConnectorIds.includes(connectorId)) {
    publicKey = process.env.NEXT_PUBLIC_MORPH_PUBLIC_KEY ?? publicKey;
    secretKey = process.env.MORPH_SECRET_KEY ?? secretKey;
    finalOwnerId = ownerId;
  }

  console.log({ publicKey, secretKey, finalOwnerId, connectorId });
  // Create session on the server
  const result = await createSession({
    publicKey,
    secretKey,
    ownerId: finalOwnerId,
    connectorId: connectorId as "hubspot",
  });

  if (result.error) {
    console.log(result.error);
    return (
      <p>
        Could not create morph sessionToken for this connector in this demo.
      </p>
    );
  }

  return (
    <div
      data-theme={isDark ? "dark" : "light"}
      className="flex flex-col items-center min-h-screen pt-4 gap-8"
    >
      <div className="w-full">
        <Suspense fallback={<div>Loading connection...</div>}>
          <ConnectionWrapper
            sessionToken={result.data.sessionToken}
            connectorId={connectorId}
            ownerId={ownerId}
          />
        </Suspense>
      </div>
    </div>
  );
}
