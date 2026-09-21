import { parse } from "./parser.js";
import { prettyPrint } from "./printer.js";
import { ao } from "./evals.js";

const terminal = document.getElementById("terminal");
const outputEl = document.getElementById("output") || terminal;
const hiddenInput = document.getElementById("input");

let buffer = "";
let cursorPos = 0;
let history = [];
let historyIndex = -1;
const opt = {
  eval: "NormalOrder",
  display: true,
  church: true,
};

// focus handling — keep mobile keyboard alive
function focusInput() {
  if (hiddenInput) hiddenInput.focus();
  else { terminal.tabIndex = 0; terminal.focus(); }
}
if (hiddenInput) {
  // keep hidden input off-screen visually but functional for mobile
  hiddenInput.setAttribute("autocomplete", "off");
  hiddenInput.setAttribute("autocorrect", "off");
  hiddenInput.setAttribute("spellcheck", "false");
}
terminal.addEventListener("click", focusInput);
focusInput();

print(`λ-REPL playground v0.1.0 — type :h for help`);
newPrompt();
syncHiddenInput();

// ---- input listeners ----
// Desktop: capture keys on document (keeps vim feel)
// Mobile: sync from hidden input
document.addEventListener("keydown", handleKeyDown);

if (hiddenInput) {
  hiddenInput.addEventListener("input", () => {
    // Mobile IME / virtual keyboard
    buffer = hiddenInput.value;
    cursorPos = hiddenInput.selectionStart ?? buffer.length;
    updateCurrentLine();
  });
  // prevent hiddenInput from handling Enter/history twice — we handle at document level
  hiddenInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "ArrowUp" || e.key === "ArrowDown") {
      // let document handler deal, but prevent native form submit
      // we still need to stop the native cursor move for history
      if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
    }
  });
}

function handleKeyDown(e) {
  // ignore when typing in other inputs outside terminal? allow anyway
  const isTypingKey = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
  const curLine = document.getElementById("current-line");
  const hasFocus = curLine && (document.activeElement === hiddenInput || document.activeElement === terminal);
  // Even if not focused, keep capturing to mimic original behaviour, but respect browser shortcuts
  if (e.key === "Backspace") {
    e.preventDefault();
    if (cursorPos > 0) {
      buffer = buffer.slice(0, cursorPos - 1) + buffer.slice(cursorPos);
      cursorPos--;
      updateCurrentLine();
    }
  } else if (e.key === "Delete") {
    e.preventDefault();
    if (cursorPos < buffer.length) {
      buffer = buffer.slice(0, cursorPos) + buffer.slice(cursorPos + 1);
      updateCurrentLine();
    }
  } else if (e.key === "Enter") {
    e.preventDefault();
    handleEnter();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) cursorPos = 0;
    else if (cursorPos > 0) cursorPos--;
    updateCurrentLine();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) cursorPos = buffer.length;
    else if (cursorPos < buffer.length) cursorPos++;
    updateCurrentLine();
  } else if (e.key === "Home" || (e.ctrlKey && e.key === "a")) {
    e.preventDefault();
    cursorPos = 0;
    updateCurrentLine();
  } else if (e.key === "End" || (e.ctrlKey && e.key === "e")) {
    e.preventDefault();
    cursorPos = buffer.length;
    updateCurrentLine();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    navigateHistory(-1);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    navigateHistory(1);
  } else if (isTypingKey) {
    // insert at cursor
    // avoid capturing when a modal is open? ignore if meta
    e.preventDefault();
    buffer = buffer.slice(0, cursorPos) + e.key + buffer.slice(cursorPos);
    cursorPos++;
    updateCurrentLine();
  }
  // keep caret in view
  ensureCursorVisible();
}

function handleEnter() {
  const command = buffer.trim();
  finalizeCurrentLine();
  if (command !== "") {
    history.push(command);
  }
  historyIndex = history.length;
  buffer = "";
  cursorPos = 0;
  executeCommand(command);
  newPrompt();
  syncHiddenInput();
  focusInput();
}

function executeCommand(cmd) {
  if (cmd === "") return;
  if (cmd.startsWith(":")) {
    handleBuiltins(cmd);
    return;
  }
  try {
    const ast = parse(cmd);
    if (opt.display) print("→ " + prettyPrint(ast));
    const evaluated = ao(ast);
    print(prettyPrint(evaluated));
  } catch (e) {
    print("Error: " + e.message);
  }
}

function handleBuiltins(cmd) {
  const c = cmd.trim().toLowerCase();
  if (c === ":clear" || c === ":c") {
    // clear history output, keep hidden input
    if (outputEl) outputEl.innerHTML = "";
    // remove any lingering current-line (already finalized)
    const old = document.getElementById("current-line");
    if (old) old.remove();
    print(`λ-REPL playground v0.1.0 — type :h for help`);
    return;
  }
  if (c === ":help" || c === ":h") {
    printHelp();
    return;
  }
  print(`Unknown command: ${cmd}  — try :h`);
}

function printHelp() {
  const lines = [
    "λ-REPL — help  (:h, :help)",
    "────────────────────────────────────────",
    "Syntax (pure lambda calculus):",
    "  \\x. M        abstraction  (also: lambda x. M)",
    "  M N          application  (left-associative)",
    "  (M)          grouping",
    "",
    "Examples:",
    "  \\x. x",
    "  (\\x. x) y              → y",
    "  (\\f. \\x. f (f x))      — Church numeral 2",
    "  (\\x. x x) (\\x. x x)    — Ω (diverges)",
    "",
    "Commands:",
    "  :h, :help    show this help",
    "  :c, :clear   clear screen",
    "",
    "Editing & navigation:",
    "  ← / →       move cursor inside the term",
    "  Home / End  jump to start / end   (Ctrl+A / Ctrl+E)",
    "  Ctrl+← / Ctrl+→  jump to start / end",
    "  Backspace / Delete  delete before / under cursor",
    "  Enter       evaluate",
    "  ↑ / ↓       history (as before)",
    "",
    "Evaluation:",
    "  Strategy: applicative order (ao) — call-by-value style.",
    "  The REPL prints the parsed term (→) then its normal form.",
    "  See evaluators-exploring for more strategies.",
  ];
  for (const l of lines) print(l);
}

function newPrompt() {
  // Ensure only one current-line exists
  const existing = document.getElementById("current-line");
  if (existing) existing.removeAttribute("id");
  const line = document.createElement("div");
  line.id = "current-line";
  line.className = "line input-line";
  // initial empty with cursor
  line.innerHTML = `${getPrompt()}<span class="cursor">&nbsp;</span>`;
  // append to outputEl or terminal
  if (outputEl && outputEl !== terminal) {
    // put after output but inside terminal
    terminal.appendChild(line);
  } else {
    terminal.appendChild(line);
  }
  updateCurrentLine();
  scrollToBottom();
}

function updateCurrentLine() {
  const line = document.getElementById("current-line");
  if (!line) return;
  const before = escapeHTML(buffer.slice(0, cursorPos));
  const after = escapeHTML(buffer.slice(cursorPos));
  // cursor is block between before/after; if at end, after is empty but cursor still visible
  // Use zero-width space for empty after to keep layout
  const afterHTML = after ? `<span class="after">${after}</span>` : "";
  line.innerHTML = `${getPrompt()}<span class="before">${before}</span><span class="cursor">&nbsp;</span>${afterHTML}`;
  syncHiddenInput();
  // Keep hidden input value in sync for mobile
}

function syncHiddenInput() {
  if (!hiddenInput) return;
  // avoid recursive input event loops: only set if different
  if (hiddenInput.value !== buffer) hiddenInput.value = buffer;
  try { hiddenInput.setSelectionRange(cursorPos, cursorPos); } catch {}
}

function finalizeCurrentLine() {
  const line = document.getElementById("current-line");
  if (!line) return;
  line.removeAttribute("id");
  line.classList.remove("input-line");
  line.innerHTML = `${getPrompt()}${escapeHTML(buffer)}`;
}

function getPrompt() {
  return `<span class="prompt">λ&gt;</span> `;
}

function print(text) {
  const div = document.createElement("div");
  div.className = "line";
  div.textContent = text;
  // append to output container
  const target = outputEl || terminal;
  target.appendChild(div);
  // if we appended to outputEl but terminal is parent, ensure current-line stays last
  const cur = document.getElementById("current-line");
  if (cur && target === outputEl) {
    // move current-line after new print (keep prompt at bottom)
    terminal.appendChild(cur);
  }
  scrollToBottom();
}

function navigateHistory(direction) {
  if (history.length === 0) return;
  historyIndex += direction;
  if (historyIndex < 0) historyIndex = 0;
  if (historyIndex >= history.length) {
    historyIndex = history.length;
    buffer = "";
    cursorPos = 0;
  } else {
    buffer = history[historyIndex];
    cursorPos = buffer.length;
  }
  updateCurrentLine();
}

function ensureCursorVisible() {
  const line = document.getElementById("current-line");
  if (line) line.scrollIntoView({ block: "nearest" });
}

function scrollToBottom() {
  window.scrollTo(0, document.body.scrollHeight);
  if (terminal) terminal.scrollTop = terminal.scrollHeight;
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
