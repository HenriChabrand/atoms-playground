"use server";

import { Morph } from "@runmorph/cloud";
import type { ConnectorId } from "@/components/connector-select";

export async function createSession({
  ownerId,
  connectorId,
  publicKey,
  secretKey,
}: {
  ownerId: string;
  connectorId: ConnectorId;
  publicKey: string;
  secretKey: string;
}) {
  const morph = Morph({
    publicKey,
    secretKey,
  });
  return await morph.sessions().create({
    connection: {
      connectorId: connectorId as "hubspot",
      ownerId: ownerId,
      operations: ["genericContact::retrieve"],
    },
  });
}

export async function listContacts({
  sessionToken,
  publicKey,
}: {
  sessionToken: string;
  publicKey: string;
}) {
  const morph = Morph({
    publicKey,
  });
  return await morph
    .connections({ sessionToken })
    .resources("genericContact")
    .list({
      limit: 3,
    });
}

export async function getModelWithListOperations({
  sessionToken,
  publicKey,
}: {
  sessionToken: string;
  publicKey: string;
}) {
  const morph = Morph({
    publicKey,
  });
  const { data, error } = await morph
    .connections({ sessionToken })
    .getConnector();
  if (error) throw error;

  // @ts-expect-error – to remove one new /cloud version pubished
  return data.operations
    ? // @ts-expect-error – to remove one new /cloud version pubished
      data.operations
        .filter((op: string) => op.endsWith("::list"))
        .map((op: string) => op.split("::")[0])
    : [];
}
