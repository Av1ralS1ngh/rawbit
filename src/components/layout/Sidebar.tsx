import React, { useState, useMemo } from "react";
import {
  Edit,
  FileCode,
  Shield,
  KeyRound,
  CheckCircle2,
  ArrowRightLeft,
  Search,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import type { NodeTemplate } from "@/types";
import { allSidebarNodes } from "@/components/sidebar-nodes";

// Import your array of custom flows
import { customFlows } from "@/my_tx_flows/customFlows";

export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

function setSidebarDragPreview(
  dataTransfer: DataTransfer,
  sourceEl: Element
) {
  if (typeof document === "undefined" || !(sourceEl instanceof HTMLElement)) {
    return;
  }

  const rect = sourceEl.getBoundingClientRect();
  const computed = window.getComputedStyle(sourceEl);
  const ghost = sourceEl.cloneNode(true) as HTMLElement;

  Object.assign(ghost.style, {
    position: "fixed",
    top: "-1000px",
    left: "-1000px",
    pointerEvents: "none",
    zIndex: "2147483647",
    width: `${Math.max(1, rect.width)}px`,
    height: `${Math.max(1, rect.height)}px`,
    margin: "0",
    transform: "none",
    transition: "none",
    borderRadius: computed.borderRadius,
    overflow: "hidden",
    boxShadow: computed.boxShadow,
    opacity: "0.98",
  } as CSSStyleDeclaration);

  document.body.appendChild(ghost);
  dataTransfer.setDragImage(
    ghost,
    Math.min(18, Math.max(8, rect.width / 6)),
    Math.min(18, Math.max(8, rect.height / 4))
  );

  const cleanup = () => {
    ghost.remove();
    sourceEl.removeEventListener("dragend", cleanup);
  };
  sourceEl.addEventListener("dragend", cleanup, { once: true });
}

// Basic category definitions for your sidebar
const categories = [
  {
    id: "input-data",
    label: "Input/Data",
    icon: Edit,
    nodeFilter: (node: NodeTemplate) => node.category === "Input/Data",
  },
  {
    id: "data-formatting",
    label: "Data Formatting",
    icon: ArrowRightLeft,
    nodeFilter: (node: NodeTemplate) => node.category === "Data Formatting",
  },
  {
    id: "tx-templates",
    label: "Transaction Templates",
    icon: FileCode,
    nodeFilter: (node: NodeTemplate) =>
      node.category === "Transaction Templates",
  },
  {
    id: "crypto",
    label: "Cryptographic Operations",
    icon: Shield,
    nodeFilter: (node: NodeTemplate) =>
      node.category === "Cryptographic Operations",
  },
  {
    id: "keys-addresses",
    label: "Key & Address",
    icon: KeyRound,
    nodeFilter: (node: NodeTemplate) => node.category === "Key & Address",
  },
  {
    id: "utility",
    label: "Utility",
    icon: CheckCircle2,
    nodeFilter: (node: NodeTemplate) => node.category === "Utility",
  },
];

// Use the existing SidebarProps from your code
export function Sidebar({ isOpen }: SidebarProps) {
  const [openCategories, setOpenCategories] = useState<string[]>([
    "input-data",
  ]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const envBadge =
    (import.meta.env.VITE_ENV_LABEL &&
      import.meta.env.VITE_ENV_LABEL.trim()) ||
    (import.meta.env.DEV ? "local" : "");
  const envLabel = envBadge ? `(${envBadge})` : "";

  // Filter nodes by search (for the main node templates)
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();

    return allSidebarNodes.filter((node) => {
      // Create a combined searchable text from all relevant fields
      const searchableText = [
        node.label,
        node.description || "",
        node.functionName,
        node.nodeData.title || "",
        node.category || "",
        // Also include the label without special characters
        node.label.replace(/[→←\-_\s]/g, ""),
      ]
        .join(" ")
        .toLowerCase();

      // Basic partial match - this will find "Un" in "Uint32"
      if (searchableText.includes(query)) return true;

      // Handle common typos/variations
      const typoMap: { [key: string]: string[] } = {
        un: ["uint", "unsigned"],
        unit: ["uint"],
        int: ["uint", "varint", "integer"],
        byte: ["bytes"],
        address: ["addr"],
        pubkey: ["public key", "pub key"],
        privkey: ["private key", "priv key"],
        transaction: ["tx"],
        sig: ["sign", "signature"],
        op: ["opcode", "Opcode"],
        len: ["length"],
        var: ["varint"],
        seq: ["sequence"],
        scr: ["script"],
      };

      // Check if query matches any typo variations
      for (const [typo, corrections] of Object.entries(typoMap)) {
        if (query.startsWith(typo)) {
          for (const correction of corrections) {
            if (searchableText.includes(correction)) {
              return true;
            }
          }
        }
      }

      // Split query into words and check if all words are present
      const queryWords = query.split(/\s+/);
      if (queryWords.length > 1) {
        return queryWords.every((word) => searchableText.includes(word));
      }

      return false;
    });
  }, [searchQuery]);

  // Standard drag logic for normal single nodes
  const onDragStart = (event: React.DragEvent, node: NodeTemplate) => {
    const dragData = {
      type: node.type,
      functionName: node.functionName,
      nodeData: node.nodeData,
    };
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(dragData)
    );
    event.dataTransfer.effectAllowed = "move";
    setSidebarDragPreview(event.dataTransfer, event.currentTarget);
  };

  const clearSearch = () => setSearchQuery("");

  // Expand/collapse logic for categories
  const handleCategoryChange = (value: string) => {
    setOpenCategories((prev) => {
      if (prev.includes(value)) {
        return prev.filter((id) => id !== value);
      }
      return [...prev, value];
    });
  };

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-20 h-screen flex flex-col transition-all duration-300 border-r bg-background select-none overflow-hidden",
        isOpen ? "w-64" : "w-0"
      )}
      data-testid="sidebar"
      style={{ pointerEvents: isOpen ? "auto" : "none" }}
    >
      {/* Header */}
      <div className="flex h-14 items-center px-6 border-b overflow-hidden">
        <span
          className={cn(
            "text-xl font-medium tracking-tight transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0"
          )}
        >
          raw<span className="inline-block rotate-[14deg]">₿</span>it
          {envLabel && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {envLabel}
            </span>
          )}
        </span>
      </div>

      {/* Search box */}
      <div className="px-3 pt-2 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            id="sidebar-search"
            name="sidebarSearch"
            placeholder="Search nodes..."
            className="pl-8 pr-8 h-8 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            /* Disable browser spell‑check and auto‑features */
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          {searchQuery && (
            <button
              className="absolute right-2.5 top-2.5"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex-1 overflow-y-auto p-3 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        style={{
          maxHeight: "calc(100vh - 6.5rem)",
        }}
      >
        {/* If searching, show filtered results instead of categories */}
        {searchQuery ? (
          <div className="space-y-2">
            {filteredNodes.length > 0 ? (
              <>
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  Found {filteredNodes.length} result
                  {filteredNodes.length !== 1 ? "s" : ""}
                </div>
                {filteredNodes.map((node) => (
                  <div
                    key={`${node.functionName}-${node.label}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, node)}
                    className="flex cursor-grab items-center rounded-md border bg-card p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{node.label}</span>
                      {node.description && (
                        <span className="text-xs text-muted-foreground">
                          {node.description}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground mt-1">
                        Category: {node.category}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="p-4 text-sm text-muted-foreground rounded-md bg-muted/50 text-center">
                No matching nodes found
              </div>
            )}
          </div>
        ) : (
          // Normal Category View
          <Accordion
            type="multiple"
            value={openCategories}
            onValueChange={(value) => setOpenCategories(value)}
            className="w-full space-y-1"
          >
            {/* 1) Standard categories */}
            {categories.map((cat) => {
              const catNodes = allSidebarNodes.filter(cat.nodeFilter);
              const CatIcon = cat.icon;

              return (
                <AccordionItem
                  key={cat.id}
                  value={cat.id}
                  className="border-none"
                >
                  <AccordionTrigger
                    className="flex items-center py-2 px-2 rounded-md hover:bg-accent hover:no-underline"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryChange(cat.id);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <CatIcon className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium whitespace-normal break-words">
                        {cat.label}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-0 px-1">
                    {catNodes.length > 0 ? (
                      <div className="space-y-2 py-1">
                        {catNodes.map((node) => (
                          <div
                            key={`${node.functionName}-${node.label}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, node)}
                            className="ml-4 flex cursor-grab items-center rounded-md border bg-card p-3 hover:bg-accent transition-colors"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {node.label}
                              </span>
                              {node.description && (
                                <span className="text-xs text-muted-foreground">
                                  {node.description}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="ml-4 p-3 text-sm text-muted-foreground rounded-md bg-muted/50">
                        No items available
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}

            {/* 2) My Custom Flows => also drag-and-drop */}
            <AccordionItem
              key="my-custom-flows"
              value="my-custom-flows"
              className="border-none"
            >
              <AccordionTrigger
                className="flex items-center py-2 px-2 rounded-md hover:bg-accent hover:no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleCategoryChange("my-custom-flows");
                }}
              >
                <div className="flex items-start gap-2">
                  <FileCode className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium whitespace-normal break-words">
                    Flow Examples
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0 px-1">
                {customFlows.length > 0 ? (
                  <div className="space-y-2 py-1">
                    {customFlows.map((flow) => (
                      <div
                        key={flow.id}
                        draggable
                        onDragStart={(event) => {
                          const dragObj = {
                            type: "calculation",
                            functionName: "flow_template",
                            nodeData: {
                              flowData: flow.data,
                              flowLabel: flow.label,
                            },
                          };
                          event.dataTransfer.setData(
                            "application/reactflow",
                            JSON.stringify(dragObj)
                          );
                          event.dataTransfer.effectAllowed = "move";
                          setSidebarDragPreview(
                            event.dataTransfer,
                            event.currentTarget
                          );
                        }}
                        className="ml-4 flex cursor-grab items-center rounded-md border bg-card p-3 hover:bg-accent transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {flow.label}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            Drag to place entire subgraph
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ml-4 p-3 text-sm text-muted-foreground rounded-md bg-muted/50">
                    No custom flows found
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
}
