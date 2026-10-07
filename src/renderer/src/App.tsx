import { useEffect, useRef, useState } from "react";
import {
  SHORTCUTS,
  type Capture,
  type Draft,
  type PipApi,
  type Preferences,
} from "../../shared/contracts";
import { Pip } from "./Pip";
import { applyEdit, replaceSelection } from "./text";
import styles from "./App.module.css";

declare global {
  interface Window {
    pip: PipApi;
  }
}

export function App() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const current = useRef<Draft | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]),
    [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState(false),
    [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [status, setStatus] = useState("Opening local storage…"),
    [error, setError] = useState("");
  const [saved, setSaved] = useState(0),
    [settings, setSettings] = useState(false);
  const playedCapture = useRef(0);
  const [preferences, setPreferences] = useState<Preferences>({
    shortcut: "Control+Alt+Space",
    quiet: false,
  });
  const [preferencesBusy, setPreferencesBusy] = useState(false);
  const [shortcutAvailable, setShortcutAvailable] = useState(true),
    [dataDirectory, setDataDirectory] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  function applyDraft(d: Draft) {
    current.current = d;
    setDraft(d);
  }
  async function load() {
    const result = await window.pip.snapshot();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const state = result.value;
    applyDraft(state.draft);
    setCaptures(state.captures);
    setTotal(state.total);
    setPreferences(state.preferences);
    setExpanded(state.expanded);
    setShortcutAvailable(state.shortcutAvailable);
    setDataDirectory(state.dataDirectory);
    setStatus(
      state.draft.text
        ? "Recovered draft · saved on this device"
        : "Ready for your next thought",
    );
    setError("");
  }
  async function flush() {
    if (!current.current) return false;
    const sent = current.current;
    const result = await window.pip.draft(sent);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    return (
      current.current.id === sent.id && current.current.version === sent.version
    );
  }
  async function dismiss(quit = false) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    let exiting = false;
    try {
      if (!(await flush())) return;
      const result = quit
        ? await window.pip.quit()
        : await window.pip.expand(false);
      if (!result.ok) setError(result.error);
      else {
        setExpanded(false);
        exiting = quit;
      }
    } catch {
      setError(
        "Could not save the draft. Keep Pip open and copy your input before restarting.",
      );
    } finally {
      if (!exiting) {
        busy.current = false;
        setSaving(false);
      }
    }
  }
  useEffect(() => {
    void load();
    return window.pip.onAction((action) => {
      if (action === "open") {
        setExpanded(true);
        setTimeout(() => textarea.current?.focus(), 0);
      } else void dismiss(action === "quit");
    });
  }, []);
  useEffect(() => {
    if (expanded) textarea.current?.focus();
  }, [expanded]);
  async function expand() {
    const result = await window.pip.expand(true);
    if (result.ok) setExpanded(true);
    else setError(result.error);
  }
  function change(text: string) {
    if (!current.current || busy.current) return;
    const next = {
      ...current.current,
      text,
      version: current.current.version + 1,
    };
    applyDraft(next);
    setError("");
    setStatus("Saving draft…");
    void window.pip
      .draft(next)
      .then((result) => {
        if (
          current.current?.id !== next.id ||
          current.current?.version !== next.version
        )
          return;
        if (result.ok)
          setStatus(
            text ? "Draft saved on this device" : "Ready for your next thought",
          );
        else {
          setStatus("Draft is not saved");
          setError(result.error);
        }
      })
      .catch(() => {
        setError(
          "Could not save this draft. Keep Pip open and copy your input before restarting.",
        );
      });
  }
  async function submit() {
    if (!current.current || busy.current || !current.current.text.trim())
      return;
    busy.current = true;
    setSaving(true);
    setError("");
    setStatus("Saving capture…");
    try {
      const result = await window.pip.capture(current.current);
      if (!result.ok) {
        setError(result.error);
        setStatus("Capture was not confirmed saved");
        return;
      }
      applyDraft(result.value.draft);
      setCaptures((previous) => [
        result.value.capture,
        ...previous.filter((c) => c.id !== result.value.capture.id),
      ]);
      setTotal((n) => n + 1);
      setStatus("Saved on this device");
      setSaved((n) => n + 1);
    } catch {
      setError(
        "Save could not be confirmed. Your input is still here; retry safely.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
      setTimeout(() => textarea.current?.focus(), 0);
    }
  }
  async function updatePreferences(next: Preferences) {
    const previous = preferences;
    setPreferencesBusy(true);
    setPreferences(next);
    try {
      const result = await window.pip.preferences(next);
      if (result.ok) {
        setPreferences({
          shortcut: result.value.shortcut,
          quiet: result.value.quiet,
        });
        setShortcutAvailable(result.value.shortcutAvailable);
        setError("");
      } else {
        setPreferences(previous);
        setError(result.error);
      }
    } finally {
      setPreferencesBusy(false);
    }
  }
  async function more() {
    const result = await window.pip.list(captures.at(-1)!.seq);
    if (result.ok)
      setCaptures((previous) => [
        ...previous,
        ...result.value.filter((c) => !previous.some((p) => p.id === c.id)),
      ]);
    else setError(result.error);
  }
  return (
    <main
      className={expanded ? styles.workspace : styles.notch}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          void dismiss();
        }
        if (
          event.key === "Enter" &&
          (event.ctrlKey || event.metaKey) &&
          !event.nativeEvent.isComposing
        ) {
          event.preventDefault();
          void submit();
        }
      }}
    >
      {!expanded ? (
        <>
          <button
            className={styles.notchButton}
            onClick={expand}
            aria-label="Open Pip capture"
          >
            <Pip
              saved={saved}
              quiet={preferences.quiet}
              played={playedCapture}
            />
            <strong>pip</strong>
            <span>
              {error
                ? "Needs attention"
                : draft?.text
                  ? "Resume draft"
                  : "Capture a thought"}
            </span>
          </button>
          <div
            className={styles.dragHandle}
            title="Drag to move Pip along the top edge"
            aria-label="Drag to move Pip"
          >
            ⠿
          </div>
        </>
      ) : (
        <>
          <header title="Drag to move Pip along the top edge">
            <div className={styles.identity}>
              <Pip
                saved={saved}
                quiet={preferences.quiet}
                played={playedCapture}
              />
              <div>
                <strong>pip</strong>
                <p>A little room for everything.</p>
              </div>
            </div>
            <button onClick={() => void dismiss()} aria-label="Collapse Pip">
              −
            </button>
          </header>
          <div className={styles.body}>
            <div className={styles.local}>
              <span /> Only on this device{" "}
              <button
                onClick={() => setSettings(!settings)}
                aria-expanded={settings}
              >
                Settings
              </button>
            </div>
            {settings && (
              <section className={styles.settings} aria-label="Settings">
                <label>
                  Capture shortcut
                  <select
                    disabled={preferencesBusy}
                    value={preferences.shortcut}
                    onChange={(e) =>
                      void updatePreferences({
                        ...preferences,
                        shortcut: e.target.value as Preferences["shortcut"],
                      })
                    }
                  >
                    {SHORTCUTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    disabled={preferencesBusy}
                    checked={preferences.quiet}
                    onChange={(e) =>
                      void updatePreferences({
                        ...preferences,
                        quiet: e.target.checked,
                      })
                    }
                  />{" "}
                  Quiet mode · still Pip
                </label>
                <p>
                  Sound is off. AI is not connected. Nothing is sent to a
                  provider.
                </p>
                <p className={styles.path}>Local data: {dataDirectory}</p>
                <button onClick={() => void dismiss(true)}>Quit Pip</button>
              </section>
            )}
            {!shortcutAvailable && (
              <p role="status" className={styles.warning}>
                The capture shortcut is in use. Choose another in Settings; Pip
                is also in your tray.
              </p>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <label htmlFor="capture" className={styles.prompt}>
                What’s on your mind?
              </label>
              <textarea
                id="capture"
                ref={textarea}
                value={draft?.text ?? ""}
                disabled={!draft || saving}
                onChange={(e) =>
                  change(applyEdit(current.current?.text ?? "", e.target.value))
                }
                onPaste={(event) => {
                  if (!current.current) return;
                  event.preventDefault();
                  const target = event.currentTarget,
                    start = target.selectionStart;
                  const inserted = event.clipboardData.getData("text/plain");
                  change(
                    replaceSelection(
                      current.current.text,
                      start,
                      target.selectionEnd,
                      inserted,
                    ),
                  );
                  const caret = start + inserted.replace(/\r\n?/g, "\n").length;
                  requestAnimationFrame(() =>
                    target.setSelectionRange(caret, caret),
                  );
                }}
                placeholder="A thought, a task, a link… just put it here."
                rows={4}
                aria-describedby="capture-status"
              />
              <div className={styles.saveRow}>
                <span id="capture-status" role="status">
                  {status}
                </span>
                <button
                  className={styles.primary}
                  type="submit"
                  disabled={!draft?.text.trim() || saving}
                >
                  {saving ? "Saving…" : "Save capture"}
                  <kbd>Ctrl ↵</kbd>
                </button>
              </div>
            </form>
            {error && (
              <div className={styles.error} role="alert">
                {error}
                {!draft && <button onClick={() => void load()}>Retry</button>}
              </div>
            )}
            <section className={styles.inbox} aria-label="Inbox">
              <div className={styles.inboxTitle}>
                <h1>
                  Inbox <span>{total}</span>
                </h1>
                <span>Organization comes later</span>
              </div>
              {!captures.length ? (
                <div className={styles.empty}>
                  <h2>Start anywhere.</h2>
                  <p>
                    Your thoughts don’t need a category yet.
                    <br />
                    Save one above, and it will be waiting here.
                  </p>
                </div>
              ) : (
                <ol>
                  {captures.map((c) => (
                    <li key={c.id}>
                      <div>
                        <time dateTime={c.capturedAt}>
                          {new Date(c.capturedAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </time>
                        <span>Original · unorganized</span>
                      </div>
                      <p>{c.text}</p>
                    </li>
                  ))}
                </ol>
              )}
              {captures.length < total && (
                <button onClick={() => void more()}>Load older captures</button>
              )}
            </section>
            <footer>Saved locally. Here when you need it.</footer>
          </div>
        </>
      )}
    </main>
  );
}
