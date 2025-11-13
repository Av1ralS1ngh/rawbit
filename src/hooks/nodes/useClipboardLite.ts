import { useCallback, useMemo, useState } from "react";

interface ClipboardLiteArgs {
  result: unknown;
  rawTitle: string;
  id: string;
  extendedError?: string;
}

export interface ClipboardLiteResult {
  prettyResult: string;
  copyResult: () => void;
  copyError: () => void;
  copyId: () => void;
  resultCopied: boolean;
  errorCopied: boolean;
  idCopied: boolean;
}

export function useClipboardLite({
  result,
  rawTitle,
  id,
  extendedError,
}: ClipboardLiteArgs): ClipboardLiteResult {
  const [resultCopied, setResultCopied] = useState(false);
  const [errorCopied, setErrorCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  const prettyResult = useMemo(() => {
    if (result === undefined) return "No result";
    if (typeof result === "object" && result !== null) {
      try {
        return JSON.stringify(result, null, 2);
      } catch {
        return String(result);
      }
    }
    return String(result);
  }, [result]);

  const copyString = useCallback((text: string, onSuccess: () => void) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => onSuccess(),
        () => fallback()
      );
    } else {
      fallback();
    }

    function fallback() {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        onSuccess();
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }, []);

  const copyResult = useCallback(() => {
    if (result === undefined) return;

    copyString(prettyResult, () => {
      setResultCopied(true);
      window.setTimeout(() => setResultCopied(false), 1000);
    });
  }, [copyString, prettyResult, result]);

  const copyError = useCallback(() => {
    const message = String(extendedError ?? "Unknown error");
    const nodeInfo = rawTitle === id ? id : `${rawTitle} ${id}`;
    const textToCopy = `${nodeInfo}\nError: ${message}`;

    copyString(textToCopy, () => {
      setErrorCopied(true);
      window.setTimeout(() => setErrorCopied(false), 1500);
    });
  }, [copyString, extendedError, id, rawTitle]);

  const copyId = useCallback(() => {
    const text = `${rawTitle} ${id}`.trim();
    copyString(text, () => {
      setIdCopied(true);
      window.setTimeout(() => setIdCopied(false), 1000);
    });
  }, [copyString, id, rawTitle]);

  return {
    prettyResult,
    copyResult,
    copyError,
    copyId,
    resultCopied,
    errorCopied,
    idCopied,
  };
}
