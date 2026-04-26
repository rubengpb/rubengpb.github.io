import { parse } from "./parser.js";
import { prettyPrint } from "./printer.js";
import { ao } from "./evals.js";

const terminal = document.getElementById("terminal");

let buffer = "";
let history = [];
let historyIndex = -1;
let opt = {
  eval : "NormalOrder",
  display : true,
  church : true
};

terminal.tabIndex = 0;
terminal.focus();

print(`λ-REPL playground v0.1.0 (:h for help)\n`);
newPrompt();

document.addEventListener("keydown", (e) => {
  if (e.key === "Backspace") {
    e.preventDefault();
    buffer = buffer.slice(0, -1);
    updateCurrentLine();
  }
  else if (e.key === "Enter") {
    e.preventDefault();
    handleEnter();
  }
  else if (e.key === "ArrowUp") {
    e.preventDefault();
    navigateHistory(-1);
  }
  else if (e.key === "ArrowDown") {
    e.preventDefault();
    navigateHistory(1);
  }
  else if (e.key.length === 1) {
    buffer += e.key;
    updateCurrentLine();
  }
});

function handleEnter() {
  const command = buffer.trim();

  finalizeCurrentLine();

  if (command !== "") {
    history.push(command);
  }

  executeCommand(command);

  buffer = "";
  historyIndex = history.length;

  newPrompt();
}

function executeCommand(cmd) {
  if (cmd === "") return;
  if (cmd.startsWith(":")) {
    handleBuiltins(cmd);
    return;
  }

  try {
    const ast = parse(cmd);
    if (opt.display) { print("Evaluating: " + prettyPrint(ast)); }
    const evaluated = ao(ast);
    print(prettyPrint(evaluated));
  } catch (e) {
    print("Error: " + e.message);
  }
}

function handleBuiltins(cmd) {
  if (cmd === ":clear" || cmd === ":c") {
    terminal.innerHTML = "";
    print(`λ-REPL playground v0.1.0 (:h for help)\n`);
    return;
  }

  if (cmd === ":help" || cmd === ":h") {
    print(`Learn programming in lambda-calculus with this REPL...`);
    return;
  }

  print("There is not a command: " + cmd)
}

function newPrompt() {
  const line = document.createElement("div");
  line.id = "current-line";

  line.innerHTML = `${getPrompt()} <span class="cursor"></span>`;

  terminal.appendChild(line);
  scrollToBottom();
}

function updateCurrentLine() {
  const line = document.getElementById("current-line");
  line.innerHTML = `${getPrompt()} ${escapeHTML(buffer)}<span class="cursor"></span>`;
}

function finalizeCurrentLine() {
  const line = document.getElementById("current-line");
  line.removeAttribute("id");
  line.innerHTML = `${getPrompt()} ${escapeHTML(buffer)}`;
}

function getPrompt() {
  return `λ> `;
}

function print(text) {
  const div = document.createElement("div");
  div.textContent = text;
  terminal.appendChild(div);
}

function navigateHistory(direction) {
  if (history.length === 0) return;

  historyIndex += direction;

  if (historyIndex < 0) historyIndex = 0;

  if (historyIndex >= history.length) {
    historyIndex = history.length;
    buffer = "";
  } else {
    buffer = history[historyIndex];
  }

  updateCurrentLine();
}

function scrollToBottom() {
  window.scrollTo(0, document.body.scrollHeight);
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
}
