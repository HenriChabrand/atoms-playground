"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { cn } from "../lib/utils";
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

// Available connectors
export const connectors = [
  { id: "salesforce", label: "Salesforce" },
  { id: "hubspot", label: "HubSpot" },
  { id: "pipedrive", label: "Pipedrive" },
  { id: "gong", label: "Gong" },
  { id: "aircall", label: "Aircall" },
  { id: "dialpad", label: "Dialpad" },
  { id: "accelo", label: "Accelo" },
  { id: "acuity-scheduling", label: "Acuity Scheduling" },
  { id: "airtable", label: "Airtable" },
  { id: "anthropic", label: "Anthropic" },
  { id: "asana", label: "Asana" },
  { id: "affinity", label: "Affinity" },
  { id: "attio", label: "Attio" },
  { id: "blackbaud", label: "Blackbaud" },
  { id: "buildium", label: "Buildium" },
  { id: "builtwith", label: "BuiltWith" },
  { id: "clickup", label: "ClickUp" },
  { id: "close", label: "Close" },
  { id: "connectwise-psa", label: "ConnectWise PSA" },
  { id: "copper", label: "Copper" },
  { id: "e-conomic", label: "e-conomic" },
  { id: "exact-online", label: "Exact Online" },
  { id: "firefish", label: "Firefish" },
  { id: "freshbooks", label: "FreshBooks" },
  { id: "freshsales", label: "Freshsales" },
  { id: "front", label: "Front" },
  { id: "gainsight-cc", label: "Gainsight CC" },
  { id: "github", label: "GitHub" },
  { id: "gitlab", label: "GitLab" },
  { id: "holded", label: "Holded" },
  { id: "insightly", label: "Insightly" },
  { id: "intercom", label: "Intercom" },
  { id: "intuit", label: "Intuit" },
  { id: "jira", label: "Jira" },
  { id: "jira-data-center", label: "Jira Data Center" },
  { id: "kustomer", label: "Kustomer" },
  { id: "linear", label: "Linear" },
  { id: "luma", label: "Luma" },
  { id: "manatal", label: "Manatal" },
  { id: "medallia", label: "Medallia" },
  { id: "monday", label: "Monday" },
  { id: "netsuite", label: "NetSuite" },
  { id: "pennylane", label: "Pennylane" },
  { id: "quickbooks", label: "Quickbooks" },
  { id: "sage", label: "Sage" },
  { id: "teamwork", label: "Teamwork" },
  { id: "ticktick", label: "TickTick" },
  { id: "zoho-desk", label: "Zoho Desk" },
  { id: "zoominfo", label: "ZoomInfo" },
  { id: "cal-com", label: "Cal.com" },
  { id: "calendly", label: "Calendly" },
  { id: "coda", label: "Coda" },
  { id: "code-climate", label: "Code Climate" },
  { id: "envoy", label: "Envoy" },
  { id: "expensify", label: "Expensify" },
  { id: "figjam", label: "FigJam" },
  { id: "figma", label: "Figma" },
  { id: "fireflies", label: "Fireflies" },
  { id: "google-calendar", label: "Google Calendar" },
  { id: "google-docs", label: "Google Docs" },
  { id: "google-mail", label: "Google Mail" },
  { id: "google-sheet", label: "Google Sheet" },
  { id: "grain", label: "Grain" },
  { id: "harvest", label: "Harvest" },
  { id: "keeper-scim", label: "Keeper(SCIM)" },
  { id: "klipfolio", label: "Klipfolio" },
  { id: "lastpass", label: "LastPass" },
  { id: "lessonly", label: "Lessonly" },
  { id: "make", label: "Make" },
  { id: "microsoft-power-bi", label: "Microsoft Power BI" },
  { id: "microsoft-teams", label: "Microsoft Teams" },
  { id: "mindbody", label: "Mindbody" },
  { id: "miro", label: "Miro" },
  { id: "notion", label: "Notion" },
  { id: "one-note", label: "One Note" },
  { id: "openai", label: "OpenAI" },
  { id: "perimeter81", label: "Perimeter81" },
  { id: "perplexity", label: "Perplexity" },
  { id: "pingboard", label: "Pingboard" },
  { id: "pivotal-tracker", label: "Pivotal Tracker" },
  { id: "productboard", label: "Productboard" },
  { id: "servicem8", label: "ServiceM8" },
  { id: "servicenow", label: "ServiceNow" },
  { id: "shortcut", label: "Shortcut" },
  { id: "slack", label: "Slack" },
  { id: "tsheets", label: "TSheets" },
  { id: "wrike", label: "Wrike" },
  { id: "zoho-mail", label: "Zoho Mail" },
  { id: "fal-ai", label: "fal.ai" },
  { id: "workable", label: "Workable" },
  { id: "lever", label: "Lever" },
  { id: "greenhouse", label: "Greenhouse" },
  { id: "ashby", label: "Ashby" },
] as const;

export type ConnectorId = (typeof connectors)[number]["id"];

/**
 * Gets the display name of a connector by its ID
 * @param connectorId - The ID of the connector
 * @returns The display name of the connector, or the ID if not found
 */
export function getConnectorName(connectorId: string): string {
  const connector = connectors.find((c) => c.id === connectorId);
  return connector?.label ?? connectorId;
}

interface ConnectorSelectProps {
  defaultValue?: ConnectorId;
  className?: string;
  ownerId: string;
  onUnavailableConnector?: (message: string) => void;
}

export function ConnectorSelect({
  defaultValue,
  ownerId,
  className,
}: ConnectorSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [displayValue] = React.useState(defaultValue || "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeParam =
    searchParams.get("theme") === "light" ? "?theme=light" : "";

  // Handle connector selection without changing the button display
  const handleConnectorSelect = (selectedConnectorId: string) => {
    // Close the popover
    setOpen(false);

    // Only redirect if a different connector is selected
    if (selectedConnectorId !== displayValue) {
      router.push(`/${ownerId}/connectors/${selectedConnectorId}${themeParam}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between min-w-[200px]", className)}
        >
          <div className="flex space-x-2">
            <Image
              src={`/connector-icons/${displayValue}.svg`}
              alt={`connector icon`}
              width={18}
              height={18}
              className="mr-2"
            />
            {displayValue
              ? connectors.find((connector) => connector.id === displayValue)
                  ?.label
              : "Select a connector"}
          </div>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search connector..." className="h-9" />
          <CommandList className="max-h-[200px] overflow-y-auto">
            <CommandEmpty>No connector found.</CommandEmpty>
            <CommandGroup>
              {connectors.map((connector) => (
                <CommandItem
                  key={connector.id}
                  value={connector.id}
                  onSelect={(currentValue) => {
                    handleConnectorSelect(currentValue);
                  }}
                >
                  <Image
                    src={`/connector-icons/${connector.id}.svg`}
                    alt={`${connector.label} icon`}
                    width={18}
                    height={18}
                    className="mr-2"
                  />
                  {connector.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      displayValue === connector.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
