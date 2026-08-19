import * as React from "react";
import { addBot, closeAiSettings, configureBotApi, useStore } from "../store";
import { tx } from "../i18n";

export function AiSettingsDialog(): React.ReactElement | null {
  const store = useStore();
  const [apiKey, setApiKey] = React.useState("");
  const [pendingRequest, setPendingRequest] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState("");

  const dismiss = React.useCallback((): void => {
    setApiKey("");
    setPendingRequest(null);
    setLocalError("");
    closeAiSettings();
  }, []);

  React.useEffect(() => {
    if (pendingRequest === null || store.botConfigurationRequestId !== pendingRequest || store.botConfigured !== true) return;
    const tableId = store.aiSettingsTableId;
    setApiKey("");
    setPendingRequest(null);
    closeAiSettings();
    if (tableId !== null) addBot(tableId);
  }, [pendingRequest, store.botConfigurationRequestId, store.botConfigured, store.aiSettingsTableId]);

  React.useEffect(() => {
    if (!store.aiSettingsOpen) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && pendingRequest === null) dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismiss, pendingRequest, store.aiSettingsOpen]);

  if (!store.aiSettingsOpen || !store.botConfigurable) return null;
  const valid = apiKey.trim().length >= 8;
  const submit = (): void => {
    if (!valid) {
      setLocalError(tx(store.locale, "aiKeyTooShort"));
      return;
    }
    const requestId = configureBotApi(apiKey.trim());
    if (requestId === null) {
      setLocalError(tx(store.locale, "aiKeySendFailed"));
      return;
    }
    setLocalError("");
    setPendingRequest(requestId);
  };

  return React.createElement(
    "div",
    { className: "hp-ai-settings-backdrop", role: "presentation" },
    React.createElement(
      "div",
      { className: "hp-ai-settings", role: "dialog", "aria-modal": true, "aria-labelledby": "hp-ai-settings-title" },
      React.createElement("div", { className: "hp-ai-settings-icon", "aria-hidden": true }, "✦"),
      React.createElement("h2", { id: "hp-ai-settings-title" }, tx(store.locale, "aiSettings")),
      React.createElement("p", null, tx(store.locale, "aiSettingsHint")),
      React.createElement(
        "label",
        { className: "hp-ai-key-field" },
        React.createElement("span", null, tx(store.locale, "deepSeekApiKey")),
        React.createElement("input", {
          type: "password",
          value: apiKey,
          autoComplete: "off",
          spellCheck: false,
          placeholder: store.botConfigured ? tx(store.locale, "replaceAiKey") : "sk-…",
          "data-testid": "ai-key-input",
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => setApiKey(event.currentTarget.value),
          onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          },
        }),
      ),
      React.createElement("p", { className: "hp-ai-memory-note" }, tx(store.locale, "aiMemoryOnly")),
      localError !== "" ? React.createElement("div", { className: "hp-ai-local-error" }, localError) : null,
      React.createElement(
        "div",
        { className: "hp-ai-settings-actions" },
        React.createElement("button", { type: "button", className: "hp-btn", disabled: pendingRequest !== null, onClick: dismiss }, tx(store.locale, "cancel")),
        React.createElement(
          "button",
          { type: "button", className: "hp-btn primary", disabled: !valid || pendingRequest !== null, "data-testid": "save-ai-key", onClick: submit },
          pendingRequest === null ? tx(store.locale, store.aiSettingsTableId === null ? "saveAiKey" : "saveAndAddBot") : tx(store.locale, "savingAiKey"),
        ),
      ),
    ),
  );
}
