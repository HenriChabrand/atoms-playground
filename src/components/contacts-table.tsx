"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { getModelWithListOperations } from "../app/[ownerId]/connectors/[connectorId]/actions";
import { availableConnectorIds } from "@/lib/connectors";
import { Morph } from "@runmorph/cloud";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Add this CSS class at the top of the file, after the imports
const hideNumberInputArrows = `
  /* Hide the up and down arrows for number inputs in different browsers */
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  /* Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }
`;

// Generic resource interface with dynamic fields
interface Resource {
  id: string;
  fields: Record<string, string | number | boolean | object | null>;
}

interface ResourceRef {
  object: string;
  model: string;
  id: string;
}

function isResourceRef(value: unknown): value is ResourceRef {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ResourceRef>;
  return (
    candidate.object === "resourceRef" &&
    typeof candidate.model === "string" &&
    typeof candidate.id === "string"
  );
}

// Function to truncate ID to max 20 characters with ellipsis
function truncateId(id: string): string {
  const maxLength = 20;
  if (id.length <= maxLength) {
    return id;
  }
  return `${id.substring(0, maxLength)}...`;
}

function getResourceRefId(resourceRef: ResourceRef): string {
  return truncateId(resourceRef.id);
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  // Handle single resource reference
  if (isResourceRef(value)) {
    return getResourceRefId(value);
  }

  // Handle array of resource references
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "";
    }

    // Check if array contains resource references
    if (value.every((item) => isResourceRef(item))) {
      const ids = value.map((item) => getResourceRefId(item as ResourceRef));
      const maxToShow = 3;

      if (ids.length <= maxToShow) {
        return ids.join(", ");
      } else {
        return `${ids.slice(0, maxToShow).join(", ")}...`;
      }
    }
  }

  // Handle other object types
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  // Handle primitive types
  return String(value);
}

/**
 * Formats a column name for display by:
 * 1. Converting camelCase to spaces (e.g., "firstName" -> "First Name")
 * 2. Converting snake_case to spaces (e.g., "first_name" -> "First Name")
 * 3. Capitalizing the first letter of each word
 */
function formatColumnName(columnName: string): string {
  // Handle camelCase
  const spacedName = columnName
    // Insert a space before all uppercase letters that have a lowercase letter before them
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // Replace underscores with spaces
    .replace(/_/g, " ");

  // Capitalize first letter of each word
  return spacedName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Map of model IDs to their corresponding icon URLs
const modelIconMap: Record<string, string> = {
  // CRM models
  crmOpportunity: "https://mintlify.b-cdn.net/v6.6.0/duotone/badge-dollar.svg",
  crmPipeline: "https://mintlify.b-cdn.net/v6.6.0/duotone/square-kanban.svg",
  crmStage: "https://mintlify.b-cdn.net/v6.6.0/duotone/flag-pennant.svg",
  crmEngagement: "https://mintlify.b-cdn.net/v6.6.0/duotone/comments.svg",
  crmContact: "https://mintlify.b-cdn.net/v6.6.0/duotone/address-book.svg",
  crmAccount: "https://mintlify.b-cdn.net/v6.6.0/duotone/building.svg",
  crmLead: "https://mintlify.b-cdn.net/v6.6.0/duotone/user-plus.svg",
  crmDeal: "https://mintlify.b-cdn.net/v6.6.0/duotone/handshake.svg",

  // Generic models
  genericContact: "https://mintlify.b-cdn.net/v6.6.0/duotone/user-group.svg",
  genericCompany: "https://mintlify.b-cdn.net/v6.6.0/duotone/building.svg",
  genericUser: "https://mintlify.b-cdn.net/v6.6.0/duotone/users-medical.svg",
  genericWorkspace:
    "https://mintlify.b-cdn.net/v6.6.0/duotone/network-wired.svg",

  // Scheduling models
  schedulingEventType:
    "https://mintlify.b-cdn.net/v6.6.0/duotone/calendar-lines.svg",
  schedulingSlot:
    "https://mintlify.b-cdn.net/v6.6.0/duotone/calendar-clock.svg",
  schedulingEvent: "https://mintlify.b-cdn.net/v6.6.0/duotone/calendar-day.svg",

  // Telephony models
  telephonyCall: "https://mintlify.b-cdn.net/v6.6.0/duotone/phone.svg",
  telephonyCallTranscript:
    "https://mintlify.b-cdn.net/v6.6.0/duotone/file-lines.svg",

  // Widget models
  widgetCardView:
    "https://mintlify.b-cdn.net/v6.6.0/duotone/rectangle-history-circle-user.svg",

  // Legacy/additional models
  genericTask: "https://mintlify.b-cdn.net/v6.6.0/duotone/list-check.svg",
  genericEvent: "https://mintlify.b-cdn.net/v6.6.0/duotone/calendar.svg",
  genericNote: "https://mintlify.b-cdn.net/v6.6.0/duotone/note-sticky.svg",
  genericEmail: "https://mintlify.b-cdn.net/v6.6.0/duotone/envelope.svg",
  genericCall: "https://mintlify.b-cdn.net/v6.6.0/duotone/phone.svg",
  genericMeeting: "https://mintlify.b-cdn.net/v6.6.0/duotone/users.svg",
};

// Default icon for models without a specific icon
const defaultModelIcon = "https://mintlify.b-cdn.net/v6.6.0/duotone/cube.svg";

// Function to get the icon URL for a model
function getModelIconUrl(modelId: string): string {
  return modelIconMap[modelId] || defaultModelIcon;
}

// Component for displaying a model icon using CSS mask
function ModelIcon({
  modelId,
  className = "",
}: {
  modelId: string;
  className?: string;
}) {
  const iconUrl = getModelIconUrl(modelId);
  return (
    <div
      className={`w-4 h-4 bg-current mr-2 ${className}`}
      style={{
        maskImage: `url(${iconUrl})`,
        WebkitMaskImage: `url(${iconUrl})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

interface ContactsTableProps {
  isConnected: boolean;
  sessionToken: string;
  connectorId: string;
}

export function ContactsTable({
  isConnected,
  sessionToken,
  connectorId,
}: ContactsTableProps) {
  const [resources, setResources] = React.useState<Resource[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [models, setModels] = React.useState<string[]>([]);
  const [selectedModel, setSelectedModel] = React.useState<string>("");
  const [columns, setColumns] = React.useState<string[]>([]);
  const [limit, setLimit] = React.useState<number>(3);
  const [modelSelectorOpen, setModelSelectorOpen] = React.useState(false);

  // Helper function to list resources
  const listResources = async ({
    sessionToken,
    publicKey,
    modelId,
    limit,
  }: {
    sessionToken: string;
    publicKey: string;
    modelId: string;
    limit: number;
  }) => {
    const morph = Morph({
      publicKey,
    });
    return await morph.connections({ sessionToken }).resources(modelId).list({
      limit,
    });
  };

  // Fetch models with list operations
  React.useEffect(() => {
    let isMounted = true;

    const fetchModels = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let publicKey = "pk_demo_xxxxxxxxxxxxxxx";

        if (availableConnectorIds.includes(connectorId)) {
          publicKey = process.env.NEXT_PUBLIC_MORPH_PUBLIC_KEY ?? publicKey;
        }

        const modelsList = await getModelWithListOperations({
          sessionToken,
          publicKey,
        });

        if (!isMounted) return;

        setModels(modelsList);

        // Select the first model by default if available
        if (modelsList.length > 0) {
          setSelectedModel(modelsList[0]);
        }
      } catch (error) {
        if (!isMounted) return;
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (isConnected) {
      void fetchModels();
    } else {
      setModels([]);
      setSelectedModel("");
      setError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isConnected, sessionToken, connectorId]);

  // Fetch data for the selected model
  React.useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!selectedModel) {
        setResources([]);
        setColumns([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        let publicKey = "pk_demo_xxxxxxxxxxxxxxx";

        if (availableConnectorIds.includes(connectorId)) {
          publicKey = process.env.NEXT_PUBLIC_MORPH_PUBLIC_KEY ?? publicKey;
        }

        // Use the generic listResources method with the selected model and limit
        const result = await listResources({
          sessionToken,
          publicKey,
          modelId: selectedModel,
          limit,
        });

        if (!isMounted) return;

        if (result.error) {
          setError(result.error.message || `Failed to load ${selectedModel}`);
          return;
        }

        // Extract resources
        const fetchedResources = result.data || [];
        setResources(fetchedResources);

        // Determine columns dynamically from the first resource's fields
        if (fetchedResources.length > 0) {
          // Get all unique field keys from all resources
          const allFields = new Set<string>();
          fetchedResources.forEach((resource) => {
            if (resource.fields) {
              Object.keys(resource.fields).forEach((key) => allFields.add(key));
            }
          });

          // Convert to array and sort alphabetically
          setColumns(Array.from(allFields).sort());
        } else {
          setColumns([]);
        }
      } catch (error) {
        if (!isMounted) return;
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (isConnected && selectedModel) {
      void fetchData();
    } else {
      setResources([]);
      setColumns([]);
      setError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isConnected, sessionToken, connectorId, selectedModel, limit]);

  if (!isConnected) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Connect to load resources
      </div>
    );
  }

  if (isLoading && models.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Loading models...
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No list operations available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <style jsx global>
        {hideNumberInputArrows}
      </style>
      <div className="flex items-center space-x-4">
        <Popover open={modelSelectorOpen} onOpenChange={setModelSelectorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={modelSelectorOpen}
              className="justify-between min-w-[200px]"
            >
              <div className="flex items-center">
                {selectedModel ? (
                  <>
                    <ModelIcon modelId={selectedModel} />
                    {formatColumnName(selectedModel)}
                  </>
                ) : (
                  "Select a model"
                )}
              </div>
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[200px]"
            align="start"
            sideOffset={5}
          >
            <Command>
              <CommandInput placeholder="Search model..." className="h-9" />
              <CommandList className="max-h-[200px] overflow-y-auto">
                <CommandEmpty>No model found.</CommandEmpty>
                <CommandGroup>
                  {models.map((model) => (
                    <CommandItem
                      key={model}
                      value={model}
                      onSelect={(currentValue) => {
                        setSelectedModel(currentValue);
                        setModelSelectorOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        <ModelIcon modelId={model} />
                        {formatColumnName(model)}
                      </div>
                      <Check
                        className={cn(
                          "ml-auto",
                          selectedModel === model ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3"
            onClick={() => setLimit(Math.max(1, limit - 1))}
            disabled={limit <= 1}
          >
            -
          </Button>
          <input
            id="limit"
            type="number"
            min="1"
            max="100"
            value={limit}
            onChange={(e) =>
              setLimit(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-16 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-center appearance-none"
            placeholder="Limit"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3"
            onClick={() => setLimit(limit + 1)}
          >
            +
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Loading {selectedModel ? formatColumnName(selectedModel) : ""}...
        </div>
      ) : error ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground text-red-500">
          {error}
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="overflow-x-auto max-w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap sticky left-0 bg-background z-10">
                    ID
                  </TableHead>
                  {columns.map((column) => (
                    <TableHead
                      key={column}
                      className="whitespace-nowrap min-w-[150px] max-w-[300px]"
                    >
                      {formatColumnName(column)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="text-center text-muted-foreground"
                    >
                      No {selectedModel ? formatColumnName(selectedModel) : ""}{" "}
                      found
                    </TableCell>
                  </TableRow>
                ) : (
                  resources.slice(0, limit).map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="whitespace-nowrap sticky left-0 bg-background z-10">
                        <div
                          className="truncate max-w-[150px]"
                          title={resource.id}
                        >
                          {truncateId(resource.id)}
                        </div>
                      </TableCell>
                      {columns.map((column) => (
                        <TableCell
                          key={`${resource.id}-${column}`}
                          className="min-w-[150px] max-w-[300px] overflow-hidden text-ellipsis"
                        >
                          <div className="truncate">
                            {resource.fields &&
                            resource.fields[column] !== undefined
                              ? formatFieldValue(resource.fields[column])
                              : ""}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
