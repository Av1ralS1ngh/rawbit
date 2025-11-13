import React, { Suspense, useState } from "react";

import { Handle, Position } from "@xyflow/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Check,
  Copy,
  FileCode,
  MessageSquare,
  MoreHorizontal,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { ConnectionStatusBadge } from "./fields/ConnectionStatusBadge";
import { EditableLabel } from "./fields/EditableLabel";
import { FieldWithHandle } from "./fields/FieldWithHandle";
import { SelectField } from "./fields/SelectField";
import { TerminalField } from "./fields/TerminalField";
import { FieldSection } from "./sections/FieldSection";
import { GroupSection } from "./sections/GroupSection";
import { SENTINEL_EMPTY } from "@/lib/nodes/constants";
import { canGrowGroup } from "@/lib/nodes/fieldUtils";
import { INSTANCE_STRIDE, cn, getVal } from "@/lib/utils";
import type {
  FieldDefinition as BaseFieldDefinition,
  GroupDefinition,
  NodeData,
  ScriptExecutionResult,
} from "@/types";
import type { ConnectionStatus } from "@/hooks/nodes/useCalcNodeDerived";
import type { UseCalcNodeMutationsResult } from "@/hooks/nodes/useCalcNodeMutations";
import type { UseGroupInstancesResult } from "@/hooks/nodes/useGroupInstances";
import type { ClipboardLiteResult } from "@/hooks/nodes/useClipboardLite";

const ScriptExecutionSteps = React.lazy(
  () => import("@/components/dialog/ScriptExecutionSteps")
);
const NodeCodeDialog = React.lazy(
  () => import("@/components/dialog/NodeCodeDialog")
);

interface SingleValueProps {
  showField: boolean;
  showHandle: boolean;
  value: string | undefined;
  onChange: (value: string) => void;
}

interface ScriptData {
  isScriptVerification: boolean;
  scriptResult: ScriptExecutionResult | null;
  scriptSigInputHex: string;
  scriptPubKeyInputHex: string;
}

interface CalculationNodeViewProps {
  selected: boolean;
  data: NodeData;
  rawTitle: string;
  derived: {
    isMultiVal: boolean;
    nodeWidth: number;
    minHeight: number;
    connectionStatus: ConnectionStatus;
  };
  isInputConnected: (fieldIndex: number) => boolean;
  mut: UseCalcNodeMutationsResult;
  group: UseGroupInstancesResult;
  clip: ClipboardLiteResult;
  singleValue?: SingleValueProps;
  result: unknown;
  error: boolean;
  hasRegenerate: boolean;
  showComment: boolean;
  comment: string;
  script: ScriptData;
}

type FieldDefinition = BaseFieldDefinition & {
  options?: string[];
  comment?: string;
  allowEmpty00?: boolean;
  allowEmptyBlank?: boolean;
};

export function CalculationNodeView({
  selected,
  data,
  rawTitle,
  derived,
  isInputConnected,
  mut,
  group,
  clip,
  singleValue,
  result,
  error,
  hasRegenerate,
  showComment,
  comment,
  script,
}: CalculationNodeViewProps) {
  const [showCode, setShowCode] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const highlightStyles =
    data.isHighlighted && !selected
      ? cn(
          "ring-8 ring-yellow-400 ring-offset-4 ring-offset-background",
          "shadow-[0_0_10px_4px_rgba(234,179,8,0.8)]"
        )
      : "";
  const selectedStyles = selected
    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
    : "";

  const showField = singleValue?.showField ?? false;
  const showHandle = singleValue?.showHandle ?? false;

  const handleCopyId = () => {
    clip.copyId();
  };

  const makeRenderSingleField =
    (scope: string) => (field: FieldDefinition) => {
      const fieldIndex = field.index;
      const connected = isInputConnected(fieldIndex);
      const rawValue = getVal(data.inputs?.vals, fieldIndex) as
        | string
        | undefined;
      const fieldLabel = data.customFieldLabels?.[fieldIndex] || field.label;
      const handleOffset = scope.startsWith("between-") ? -32 : -16;

      if (field.options) {
        const current = rawValue ?? field.options[0];
        return (
          <SelectField
            key={`${scope}-${fieldIndex}`}
            label={fieldLabel}
            value={current}
            options={field.options}
            onChange={(value) =>
              mut.setFieldValue(fieldIndex, value, false, false)
            }
          />
        );
      }

      return (
        <FieldWithHandle
          key={`${scope}-${fieldIndex}`}
          handleId={`input-${fieldIndex}`}
          connected={connected}
          label={fieldLabel}
          placeholder={
            connected
              ? rawValue === SENTINEL_EMPTY
                ? "--EMPTY--"
                : "Connected"
              : field.placeholder
          }
          value={rawValue}
          small={field.small}
          rows={field.rows}
          handleOffset={handleOffset}
          disableHandle={field.unconnectable}
          allowEmpty00={field.allowEmpty00}
          allowEmptyBlank={field.allowEmptyBlank}
          comment={field.comment}
          onChange={(value) =>
            mut.setFieldValue(
              fieldIndex,
              value,
              connected,
              !!(field.allowEmpty00 || field.allowEmptyBlank)
            )
          }
          onLabelChange={(label) => mut.updateFieldLabel(fieldIndex, label)}
        />
      );
    };

  const renderGroupField = (
    offset: number,
    field: FieldDefinition,
    index: number
  ) => {
    const fieldIndex = offset + field.index;
    const connected = isInputConnected(fieldIndex);
    const rawValue = getVal(data.inputs?.vals, fieldIndex) as
      | string
      | undefined;
    const fieldLabel = data.customFieldLabels?.[fieldIndex] || field.label;

    if (field.options) {
      const current = rawValue ?? field.options[0];
      return (
        <SelectField
          key={`${field.label}-${fieldIndex}-${index}`}
          label={fieldLabel}
          value={current}
          options={field.options}
          onChange={(value) =>
            mut.setFieldValue(fieldIndex, value, false, false)
          }
        />
      );
    }

    return (
      <FieldWithHandle
        key={`${field.label}-${fieldIndex}`}
        comment={field.comment}
        handleId={`input-${fieldIndex}`}
        connected={connected}
        label={fieldLabel}
        placeholder={
          connected
            ? rawValue === SENTINEL_EMPTY
              ? "--EMPTY--"
              : "Connected"
            : field.placeholder
        }
        value={rawValue}
        small={field.small}
        rows={field.rows}
        handleOffset={-33}
        disableHandle={field.unconnectable}
        allowEmpty00={field.allowEmpty00}
        allowEmptyBlank={field.allowEmptyBlank}
        onChange={(value) =>
          mut.setFieldValue(
            fieldIndex,
            value,
            connected,
            !!(field.allowEmpty00 || field.allowEmptyBlank)
          )
        }
        onLabelChange={(label) => mut.updateFieldLabel(fieldIndex, label)}
      />
    );
  };

  const groupInstanceKeys = (groupDef: GroupDefinition) => {
    const keys = data.groupInstanceKeys?.[groupDef.title];
    if (keys?.length) return keys;

    const instanceCount = data.groupInstances?.[groupDef.title] ?? 0;
    return Array.from(
      { length: instanceCount },
      (_, index) => groupDef.baseIndex + index * INSTANCE_STRIDE
    );
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col border-2 bg-card font-mono text-primary shadow-md transition-colors",
        selectedStyles,
        highlightStyles,
        data.borderColor ? "!border-3" : "border-border"
      )}
      style={{
        width: derived.nodeWidth,
        minHeight: derived.minHeight,
        overflow: "visible",
        contain: "layout",
        ...(data.borderColor ? { borderColor: data.borderColor } : {}),
      }}
    >
      <div className="flex w-full flex-row items-start gap-2 border-b border-border p-2 text-xl">
        <div className="min-w-0 flex-1 break-words leading-tight">
          <EditableLabel
            value={rawTitle}
            onCommit={mut.handleTitleUpdate}
            className="text-xl"
            maxLength={100}
          />
        </div>

        <div className="flex flex-shrink-0 items-center space-x-2">
          {derived.connectionStatus.shouldShow && (
            <ConnectionStatusBadge
              connected={derived.connectionStatus.connected}
              total={derived.connectionStatus.total}
            />
          )}

          {error && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-pointer">
                    <AlertTriangle className="h-7 w-7 text-destructive" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <div className="flex flex-col gap-2">
                    <div className="max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                      {String(data.extendedError) || "Unknown error"}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="nodrag flex h-7 items-center gap-1 px-2"
                        onPointerDownCapture={(event) =>
                          event.stopPropagation()
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          clip.copyError();
                        }}
                      >
                        {clip.errorCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span className="text-xs">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="text-xs">Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {hasRegenerate && (
            <Button variant="ghost" size="icon" onClick={mut.handleRegenerate}>
              <RefreshCw className="h-5 w-5" />
            </Button>
          )}

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative z-10">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuPortal>
              <DropdownMenuContent
                align="end"
                side="right"
                avoidCollisions
                className="z-[100] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                style={{ fontSize: "14px", minWidth: "180px" }}
                onPointerDown={(event) => event.stopPropagation()}
                onWheelCapture={(event) => event.stopPropagation()}
              >
                {data.functionName && (
                  <DropdownMenuItem onSelect={() => setShowCode(true)}>
                    <span className="flex items-center gap-2">
                      <FileCode className="h-4 w-4" /> Show Code
                    </span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onSelect={mut.toggleComment}>
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {showComment ? "Hide Comment" : "Show Comment"}
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={handleCopyId}>
                  <span className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    {clip.idCopied ? "Copied ✓" : "Copy ID"}
                  </span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onSelect={mut.deleteNode}
                  className="text-destructive focus:text-destructive"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" /> Delete Node
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col p-4 text-sm">
        {!derived.isMultiVal && singleValue && (
          <div className="mb-4">
            {showField && (
              <FieldWithHandle
                handleId="input-0"
                connected={isInputConnected(0)}
                label={data.customFieldLabels?.[0] || "INPUT VALUE:"}
                placeholder="Type a value..."
                value={singleValue.value}
                onChange={singleValue.onChange}
                disableHandle={!showHandle}
                handleOffset={-16}
                onLabelChange={(value) => mut.updateFieldLabel(0, value)}
              />
            )}

            {!showField && showHandle && (
              <Handle
                type="target"
                position={Position.Left}
                id="input-0"
                className="!h-3 !w-3 !border-2 !border-primary !bg-background"
                style={{ top: "50%", transform: "translate(-50%, -50%)" }}
              />
            )}
          </div>
        )}

        {derived.isMultiVal && (
          <div className="mb-6 flex flex-col gap-6">
            <FieldSection
              fields={
                data.inputStructure?.ungrouped as FieldDefinition[] | undefined
              }
              scope="ungrouped"
              renderField={makeRenderSingleField("ungrouped")}
            />

            {data.inputStructure?.groups?.map((groupDef) => {
              const keys = groupInstanceKeys(groupDef);
              const instanceCount =
                data.groupInstances?.[groupDef.title] ?? keys.length;
              const canDecrement = instanceCount > (groupDef.minInstances ?? 1);
              const canIncrement = Boolean(
                groupDef.expandable &&
                  !(
                    groupDef.maxInstances &&
                    instanceCount >= groupDef.maxInstances
                  ) &&
                  canGrowGroup(
                    groupDef.baseIndex,
                    keys,
                    groupDef.fields as FieldDefinition[]
                  )
              );

              return (
                <React.Fragment key={groupDef.title}>
                  <GroupSection
                    group={groupDef}
                    instanceKeys={keys}
                    title={
                      data.customGroupTitles?.[groupDef.title] || groupDef.title
                    }
                    onTitleCommit={(title) =>
                      mut.updateGroupTitle(groupDef.title, title)
                    }
                    canIncrement={canIncrement}
                    canDecrement={canDecrement}
                    onIncrement={() =>
                      group.handleGroupSize(groupDef.title, groupDef, true)
                    }
                    onDecrement={() =>
                      group.handleGroupSize(groupDef.title, groupDef, false)
                    }
                    renderField={renderGroupField}
                  />

                  <FieldSection
                    fields={
                      data.inputStructure?.betweenGroups?.[groupDef.title] as
                        | FieldDefinition[]
                        | undefined
                    }
                    scope={`between-${groupDef.title}`}
                    paddingLeft={16}
                    renderField={makeRenderSingleField(
                      `between-${groupDef.title}`
                    )}
                  />
                </React.Fragment>
              );
            })}

            <FieldSection
              fields={
                data.inputStructure?.afterGroups as
                  | FieldDefinition[]
                  | undefined
              }
              scope="after"
              renderField={makeRenderSingleField("after")}
            />
          </div>
        )}

        <div className="mt-auto border-t border-border pt-2">
          <div className="mb-2 text-sm text-primary">
            {">"} Calculation Result:
          </div>
          <div className="flex items-start justify-between gap-2 text-sm">
            <div className="flex-1 min-w-0" data-testid="node-result">
              <span className="block whitespace-pre-wrap break-all">
                {clip.prettyResult}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="nodrag shrink-0 self-start"
              onPointerDownCapture={(event) => event.stopPropagation()}
              onClick={clip.copyResult}
              disabled={result === undefined}
              title={clip.resultCopied ? "Copied!" : "Copy result to clipboard"}
            >
              {clip.resultCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {data.networkDependent && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-medium">Network:</span>
              <Select
                value={data.selectedNetwork || "testnet"}
                onValueChange={mut.handleNetworkChange}
              >
                <SelectTrigger className="h-7 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mainnet">Mainnet</SelectItem>
                  <SelectItem value="testnet">Testnet</SelectItem>
                  <SelectItem value="regtest">Regtest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {script.isScriptVerification && script.scriptResult !== null ? (
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => setShowSteps(true)}
            >
              View Script Steps
            </Button>
          ) : null}
        </div>

        {showComment && (
          <div className="mt-4 border-t border-border pt-2">
            <TerminalField
              label="Node Comment:"
              placeholder="Enter your notes here..."
              value={comment}
              onChange={mut.handleCommentChange}
            />
          </div>
        )}
      </CardContent>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-primary !bg-background"
        style={{ top: "50%", transform: "translate(50%, -50%)" }}
      />

      <Suspense fallback={null}>
        <ScriptExecutionSteps
          open={showSteps}
          onClose={() => setShowSteps(false)}
          scriptResult={script.scriptResult}
          scriptSigInputHex={script.scriptSigInputHex}
          scriptPubKeyInputHex={script.scriptPubKeyInputHex}
        />
      </Suspense>

      <Suspense fallback={null}>
        <NodeCodeDialog
          open={showCode}
          onClose={() => setShowCode(false)}
          functionName={data.functionName}
        />
      </Suspense>
    </Card>
  );
}
