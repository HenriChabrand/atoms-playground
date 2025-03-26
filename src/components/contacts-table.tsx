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
import { Button } from "../components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
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

// CSS to hide scrollbars but keep scrolling functionality
const hideScrollbars = `
  /* Hide scrollbars but keep scrolling functionality */
  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;     /* Firefox */
  }
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
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

// Interface for field metadata
interface FieldMetadata {
  id: string;
  displayName?: string;
  description?: string;
  type: string;
  required?: boolean;
  name?: string;
  isCustom?: boolean;
}

// Interface for cached fields
interface CachedFields {
  timestamp: number;
  fields: FieldMetadata[];
}

// Type for field cache storage
type FieldCache = Record<string, Record<string, CachedFields>>;

// Interface for list resource options
interface ListResourceOptions {
  limit: number;
  fields?: string[];
  [key: string]: unknown;
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

// Helper function to check if a field has meaningful data
function hasFieldValue(resources: Resource[], fieldName: string): boolean {
  if (!resources.length) return false;

  return resources.some((resource) => {
    const value = resource.fields[fieldName];
    // Consider empty arrays as no value
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    // Consider null/undefined as no value
    return value !== null && value !== undefined;
  });
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

// Cache expiration time in milliseconds (24 hours)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// Helper function to update a resource field
/* eslint-disable @typescript-eslint/no-explicit-any */
const updateResource = async ({
  sessionToken,
  publicKey,
  modelId,
  resourceId,
  field,
  value,
}: {
  sessionToken: string;
  publicKey: string;
  modelId: string;
  resourceId: string;
  field: string;
  value: string | number;
}) => {
  const morph = Morph({
    publicKey,
  });

  // We have to use any type here due to the Morph SDK typing limitations
  return await morph
    .connections({ sessionToken })
    .resources(modelId)
    .update(resourceId, {
      [field]: value,
    } as any);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// Helper function to determine if a value is editable (string or number)
const isEditableValue = (value: unknown): boolean => {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    value === null ||
    value === undefined
  );
};

// Component for editable cell
function EditableCell({
  value,
  resourceId,
  columnId,
  modelId,
  sessionToken,
  publicKey,
  onUpdate,
  disabled,
}: {
  value: unknown;
  resourceId: string;
  columnId: string;
  modelId: string;
  sessionToken: string;
  publicKey: string;
  onUpdate?: () => void;
  disabled?: boolean;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState<string>(
    value !== null && value !== undefined ? String(value) : ""
  );
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isEditable = isEditableValue(value);
  const isEmpty = value === null || value === undefined;

  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleValueChange = async () => {
    if (!isEditable || (!isEmpty && inputValue === String(value))) {
      setIsEditing(false);
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      // Convert to number if the original value was a number
      const newValue =
        typeof value === "number" ? Number(inputValue) : inputValue;

      const result = await updateResource({
        sessionToken,
        publicKey,
        modelId,
        resourceId,
        field: columnId,
        value: newValue,
      });

      if (result.error) {
        setError(result.error.message || "Failed to update field");
        setInputValue(
          value !== null && value !== undefined ? String(value) : ""
        ); // Reset to original value
      } else if (onUpdate) {
        onUpdate(); // Trigger refresh
      }
    } catch (err) {
      console.error("Error updating resource:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setInputValue(value !== null && value !== undefined ? String(value) : ""); // Reset to original value
    } finally {
      setIsUpdating(false);
      setIsEditing(false);
    }
  };

  if (!isEditable) {
    return <div className="truncate">{formatFieldValue(value)}</div>;
  }

  return (
    <div className="relative">
      {isEditing ? (
        <input
          ref={inputRef}
          type={typeof value === "number" ? "number" : "text"}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleValueChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleValueChange();
            } else if (e.key === "Escape") {
              setInputValue(
                value !== null && value !== undefined ? String(value) : ""
              );
              setIsEditing(false);
            }
          }}
          className="w-full px-1 bg-transparent text-inherit border-border border-b focus:outline-none focus:ring-0 focus:border-primary"
          disabled={isUpdating || disabled}
          placeholder={isEmpty ? "Add value..." : ""}
        />
      ) : (
        <div
          onClick={() => isEditable && !disabled && setIsEditing(true)}
          className={`truncate p-1 ${
            isEditable && !disabled
              ? "cursor-text hover:bg-muted/50 rounded"
              : ""
          } ${isEmpty ? "text-muted-foreground italic" : ""}`}
        >
          {isEmpty ? "Empty" : inputValue}
        </div>
      )}
      {error && (
        <div className="text-xs text-destructive absolute bottom-0 left-0 transform translate-y-full">
          {error}
        </div>
      )}
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
        </div>
      )}
    </div>
  );
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
  const [modelFields, setModelFields] = React.useState<FieldMetadata[]>([]);
  const [selectedFields, setSelectedFields] = React.useState<string[]>([]);
  const [headerFieldSelectorOpen, setHeaderFieldSelectorOpen] =
    React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [isDataRefreshing, setIsDataRefreshing] = React.useState(false);

  // Use ref for field cache to persist across renders but not trigger renders
  const fieldCacheRef = React.useRef<FieldCache>({});

  // Trigger a refresh of the data
  const refreshData = React.useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Helper function to list resources
  const listResources = async ({
    sessionToken,
    publicKey,
    modelId,
    limit,
    fields,
  }: {
    sessionToken: string;
    publicKey: string;
    modelId: string;
    limit: number;
    fields?: string[];
  }) => {
    const morph = Morph({
      publicKey,
    });

    const options: ListResourceOptions = { limit };

    // Add fields parameter if any fields are selected
    if (fields && fields.length > 0) {
      options.fields = fields;
    }

    return await morph
      .connections({ sessionToken })
      .resources(modelId)
      .list(options);
  };

  // Helper function to list fields for a model
  const listFields = async ({
    sessionToken,
    publicKey,
    modelId,
    useCache = true,
  }: {
    sessionToken: string;
    publicKey: string;
    modelId: string;
    useCache?: boolean;
  }): Promise<FieldMetadata[]> => {
    // Check if we have cached data for this connector and model
    if (useCache && fieldCacheRef.current[connectorId]?.[modelId]) {
      const cachedData = fieldCacheRef.current[connectorId][modelId];
      const now = Date.now();

      // If cache is still valid, return the cached data
      if (now - cachedData.timestamp < CACHE_EXPIRATION) {
        return cachedData.fields;
      }
    }

    // If no cache or expired, fetch from API
    try {
      const morph = Morph({
        publicKey,
      });

      const response = await morph
        .connections({ sessionToken })
        .models(modelId)
        .listFields();

      if (response.error) {
        console.error("Error fetching fields:", response.error);
      }

      const fields = response.data || [];

      // Store in cache
      if (!fieldCacheRef.current[connectorId]) {
        fieldCacheRef.current[connectorId] = {};
      }

      fieldCacheRef.current[connectorId][modelId] = {
        timestamp: Date.now(),
        fields,
      };

      return fields;
    } catch (error) {
      console.error("Error fetching fields:", error);
      return [];
    }
  };

  // Reset selected fields when model changes
  React.useEffect(() => {
    setSelectedFields([]);
  }, [selectedModel]);

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

  // Fetch fields for the selected model
  React.useEffect(() => {
    let isMounted = true;

    const fetchFields = async () => {
      if (!selectedModel) {
        setModelFields([]);
        return;
      }

      try {
        let publicKey = "pk_demo_xxxxxxxxxxxxxxx";

        if (availableConnectorIds.includes(connectorId)) {
          publicKey = process.env.NEXT_PUBLIC_MORPH_PUBLIC_KEY ?? publicKey;
        }

        const fields = await listFields({
          sessionToken,
          publicKey,
          modelId: selectedModel,
        });

        if (!isMounted) return;

        setModelFields(fields);
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching fields:", error);
        // We don't set error state here as this is background loading of fields
      }
    };

    if (isConnected && selectedModel) {
      void fetchFields();
    } else {
      setModelFields([]);
    }

    return () => {
      isMounted = false;
    };
  }, [isConnected, sessionToken, connectorId, selectedModel]);

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
        // Set loading state but don't clear existing data yet
        if (resources.length === 0) {
          setIsLoading(true);
        } else {
          setIsDataRefreshing(true);
        }
        setError(null);

        let publicKey = "pk_demo_xxxxxxxxxxxxxxx";

        if (availableConnectorIds.includes(connectorId)) {
          publicKey = process.env.NEXT_PUBLIC_MORPH_PUBLIC_KEY ?? publicKey;
        }

        // Use the generic listResources method with the selected model, limit, and fields
        const result = await listResources({
          sessionToken,
          publicKey,
          modelId: selectedModel,
          limit,
          fields: selectedFields.length > 0 ? selectedFields : undefined,
        });

        if (!isMounted) return;

        if (result.error) {
          setError(result.error.message || `Failed to load ${selectedModel}`);
          return;
        }

        // Extract resources
        const fetchedResources = result.data || [];
        setResources(fetchedResources);

        // Determine columns dynamically from the resources' fields
        if (fetchedResources.length > 0) {
          // Get all unique field keys from all resources with meaningful data
          const allFields = new Set<string>();

          // First collect all potential fields
          const potentialFields = new Set<string>();
          fetchedResources.forEach((resource) => {
            if (resource.fields) {
              Object.keys(resource.fields).forEach((key) =>
                potentialFields.add(key)
              );
            }
          });

          // Then filter to keep only fields with meaningful values
          potentialFields.forEach((field) => {
            // Always include selected fields regardless of value
            if (
              selectedFields.includes(field) ||
              hasFieldValue(fetchedResources, field)
            ) {
              allFields.add(field);
            }
          });

          // Include any selected fields that might not be in the response
          selectedFields.forEach((field) => allFields.add(field));

          // Convert to array
          const columnsArray = Array.from(allFields);

          // Sort columns to ensure selected fields come first
          columnsArray.sort((a, b) => {
            const aIsSelected = selectedFields.includes(a);
            const bIsSelected = selectedFields.includes(b);

            if (aIsSelected && !bIsSelected) return -1;
            if (!aIsSelected && bIsSelected) return 1;

            // If both are selected or both are not selected, sort alphabetically
            return a.localeCompare(b);
          });

          setColumns(columnsArray);
        } else if (selectedFields.length > 0) {
          // If no resources but we have selected fields, show them
          setColumns([...selectedFields]);
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
          setIsDataRefreshing(false);
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
  }, [
    isConnected,
    sessionToken,
    connectorId,
    selectedModel,
    limit,
    selectedFields,
    refreshTrigger,
  ]);

  // Get field name from id
  const getFieldNameById = (fieldId: string): string => {
    const field = modelFields.find((f) => f.id === fieldId);
    return field?.name || field?.displayName || formatColumnName(fieldId);
  };

  // Handle field selection
  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  // Add a field directly from the table header
  const addField = (fieldId: string) => {
    if (!selectedFields.includes(fieldId)) {
      setSelectedFields((prev) => [...prev, fieldId]);
    }
    setHeaderFieldSelectorOpen(false);
  };

  // Get unused fields - fields that are not currently displayed in the table
  const getUnusedFields = (): FieldMetadata[] => {
    if (!modelFields.length) return [];

    return modelFields.filter((field) => !selectedFields.includes(field.id));
  };

  // Group fields by custom and system
  const { customFields, systemFields, hasCustomFields } = React.useMemo(() => {
    const unusedFields = getUnusedFields();
    const custom = unusedFields.filter((field) => field.isCustom);
    const system = unusedFields.filter((field) => !field.isCustom);

    return {
      customFields: custom,
      systemFields: system,
      hasCustomFields: custom.length > 0,
    };
  }, [modelFields, selectedFields]);

  // Check if there are any available fields to add
  const hasAvailableFields = customFields.length > 0 || systemFields.length > 0;

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
      <style jsx global>
        {hideScrollbars}
      </style>
      <div className="flex flex-wrap gap-4 items-center">
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
            disabled={limit <= 1 || isDataRefreshing}
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
            disabled={isDataRefreshing}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3"
            onClick={() => setLimit(limit + 1)}
            disabled={isDataRefreshing}
          >
            +
          </Button>

          {isDataRefreshing && (
            <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent ml-2"></div>
          )}
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
          <div className="overflow-x-auto max-w-full hide-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap sticky left-0 bg-background z-10">
                    ID
                  </TableHead>
                  <TableHead className="w-6 px-2">
                    <Popover
                      open={headerFieldSelectorOpen}
                      onOpenChange={setHeaderFieldSelectorOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={!hasAvailableFields || isDataRefreshing}
                          title={
                            hasAvailableFields
                              ? "Add field"
                              : "No more fields available"
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="p-0 w-[250px]"
                        align="end"
                        sideOffset={5}
                      >
                        <Command>
                          <CommandInput
                            placeholder="Search fields..."
                            className="h-9"
                          />
                          <CommandList className="max-h-[300px] overflow-y-auto">
                            <CommandEmpty>
                              No additional fields found.
                            </CommandEmpty>
                            {/* Group fields by custom and system */}
                            {hasCustomFields && (
                              <CommandGroup heading="Custom Fields">
                                {customFields.map((field) => (
                                  <CommandItem
                                    keywords={[field.name || field.id]}
                                    key={field.id}
                                    value={field.id}
                                    onSelect={() => addField(field.id)}
                                  >
                                    <div className="flex items-center flex-1">
                                      <div className="flex flex-col">
                                        <span>
                                          {field.name ||
                                            field.displayName ||
                                            field.id}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {field.type}
                                        </span>
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                            <CommandGroup heading="System Fields">
                              {systemFields.map((field) => (
                                <CommandItem
                                  key={field.id}
                                  keywords={[field.name || field.id]}
                                  value={field.id}
                                  onSelect={() => addField(field.id)}
                                >
                                  <div className="flex items-center flex-1">
                                    <div className="flex flex-col">
                                      <span>
                                        {field.name ||
                                          field.displayName ||
                                          field.id}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {field.type}
                                      </span>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                  {columns.map((column) => (
                    <TableHead
                      key={column}
                      className="whitespace-nowrap min-w-[150px] max-w-[300px]"
                      title={
                        modelFields.find((f) => f.id === column)?.description ||
                        ""
                      }
                    >
                      <div className="flex items-center space-x-1">
                        <span>{getFieldNameById(column)}</span>
                        {selectedFields.includes(column) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={isDataRefreshing}
                            onClick={() => toggleField(column)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={
                        columns.length + 2
                      } /* +2 for ID column and add button */
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
                      <TableCell className="w-6"></TableCell>
                      {columns.map((column) => (
                        <TableCell
                          key={`${resource.id}-${column}`}
                          className="min-w-[150px] max-w-[300px] overflow-hidden text-ellipsis"
                        >
                          <EditableCell
                            value={resource.fields?.[column]}
                            resourceId={resource.id}
                            columnId={column}
                            modelId={selectedModel}
                            sessionToken={sessionToken}
                            publicKey={
                              availableConnectorIds.includes(connectorId)
                                ? process.env.NEXT_PUBLIC_MORPH_PUBLIC_KEY || ""
                                : "pk_demo_xxxxxxxxxxxxxxx"
                            }
                            onUpdate={refreshData}
                            disabled={isDataRefreshing}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {isDataRefreshing && (
            <div className="absolute inset-0 bg-background/20 flex items-center justify-center pointer-events-none">
              <div className="sr-only">Refreshing data...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
