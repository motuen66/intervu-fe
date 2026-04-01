import { useRef, useState, useCallback } from "react";
import { ROLES } from "../../../common/constants/common.js";

// ---------------------------------------------------------------------------
// Language definitions (example starter code per language)
// ---------------------------------------------------------------------------
export const LANGUAGE_EXAMPLES = {
  javascript: { example: 'console.log("Hello, World!");' },
  java: {
    example:
      'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  },
  csharp: {
    example:
      'using System;\nusing System.Collections.Generic;\nusing System.Linq;\nusing System.Text.RegularExpressions;\n\nnamespace HelloWorld\n{\n\tpublic class Program\n\t{\n\t\tpublic static void Main(string[] args)\n\t\t{\n\t\t\tConsole.WriteLine("Hello, World!");\n\t\t}\n\t}\n}',
  },
};

// ---------------------------------------------------------------------------
// useCodeSync
//
// Isolates Monaco editor state + real-time code sync from the rest of the
// interview room.  Deliberately has NO dependency on WebRTC state so that
// typing in the editor never causes a WebRTC re-render.
//
// Inputs
//   sendSignal  – (method: string, ...args) => void  – provided by useInterviewSignalR
//   roomId      – string
//   user        – { role }
//
// Outputs  (all stable refs or state)
//   editorRef, monacoRef
//   language, roomLanguageCodeMap
//   handleCodeChange, handleLanguageChange, handleEditorMount, formatCode
//   isRunning, consoleOutput, setConsoleOutput, testResults, setTestResults
//   runCode
//   applyExternalCode(code, lang)      – call when ReceiveCode fires
//   applyExternalLanguage(lang, code)  – call when ReceiveLanguage fires
//   initFromRoomState(state)           – call when ReceiveFullState fires
// ---------------------------------------------------------------------------
export function useCodeSync({ sendSignal, roomId, user }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const isExternalChange = useRef(false);
  const sendCodeTimeout = useRef(null);

  const [language, setLanguage] = useState("java");
  const [roomLanguageCodeMap, setRoomLanguageCodeMap] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState(null);
  const [testResults, setTestResults] = useState(null);

  // -------------------------------------------------------------------------
  // Receive handlers (called by orchestrator when SignalR events arrive)
  // -------------------------------------------------------------------------

  const applyExternalCode = useCallback((code, _lang) => {
    if (!editorRef.current) return;
    const savedPosition = editorRef.current.getPosition();
    isExternalChange.current = true;
    editorRef.current.setValue(code);
    if (savedPosition) editorRef.current.setPosition(savedPosition);
    isExternalChange.current = false;
  }, []);

  const applyExternalLanguage = useCallback((lang, codeForLang) => {
    const newCode = codeForLang ?? LANGUAGE_EXAMPLES[lang]?.example ?? "";
    setLanguage(lang);
    setRoomLanguageCodeMap((prev) => ({ ...prev, [lang]: newCode }));
    if (editorRef.current) {
      isExternalChange.current = true;
      editorRef.current.setValue(newCode);
      isExternalChange.current = false;
    }
  }, []);

  const initFromRoomState = useCallback((state) => {
    if (!state) return;
    const { currentLanguage, languageCodes } = state;
    const lang = currentLanguage || "java";
    const codeMap = languageCodes || {};
    const initialCode =
      codeMap[lang] || LANGUAGE_EXAMPLES[lang]?.example || "";
    if (!codeMap[lang]) codeMap[lang] = initialCode;

    setLanguage(lang);
    setRoomLanguageCodeMap(codeMap);

    if (editorRef.current) {
      isExternalChange.current = true;
      editorRef.current.setValue(initialCode);
      isExternalChange.current = false;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Local change handlers
  // -------------------------------------------------------------------------

  const handleCodeChange = useCallback(
    (value) => {
      if (isExternalChange.current || !sendSignal) return;
      // Only candidates broadcast code automatically
      if (user?.role !== ROLES.CANDIDATE) return;

      if (sendCodeTimeout.current) clearTimeout(sendCodeTimeout.current);
      sendCodeTimeout.current = setTimeout(() => {
        // Read language from state inside the timeout to avoid stale closure.
        // We pass it as a captured value from the outer scope; language is
        // updated via setState so we read it from a ref kept in sync.
        sendSignal("SendCode", roomId, value, currentLanguageRef.current).catch?.(
          console.error
        );
      }, 300);
    },
    [sendSignal, roomId, user?.role]
  );

  // Keep a ref of the current language so the debounced timeout reads the
  // latest value without needing to be recreated on every language change.
  const currentLanguageRef = useRef(language);
  const handleLanguageChange = useCallback(
    async (e) => {
      const newLang = e.target.value;
      const oldLang = currentLanguageRef.current;

      // Persist old code before switching
      if (sendSignal && editorRef.current) {
        const oldCode = editorRef.current.getValue();
        try {
          await sendSignal("SendCode", roomId, oldCode, oldLang);
        } catch (err) {
          console.error("Error sending old code on language change:", err);
        }
      }

      const codeToLoad =
        roomLanguageCodeMap[newLang] ||
        LANGUAGE_EXAMPLES[newLang]?.example ||
        "";

      if (editorRef.current) {
        isExternalChange.current = true;
        editorRef.current.setValue(codeToLoad);
        isExternalChange.current = false;
      }

      currentLanguageRef.current = newLang;
      setLanguage(newLang);
      setRoomLanguageCodeMap((prev) => ({ ...prev, [newLang]: codeToLoad }));

      if (sendSignal) {
        try {
          await sendSignal("SendLanguage", roomId, newLang);
        } catch (err) {
          console.error("Error sending new language:", err);
        }
      }
    },
    [sendSignal, roomId, roomLanguageCodeMap]
  );

  // Sync currentLanguageRef whenever language state changes
  // (covers external language changes from applyExternalLanguage)
  const prevLanguageRef = useRef(null);
  if (language !== prevLanguageRef.current) {
    prevLanguageRef.current = language;
    currentLanguageRef.current = language;
  }

  const formatCode = useCallback(() => {
    editorRef.current
      ?.getAction("editor.action.formatDocument")
      ?.run();
  }, []);

  const runCode = useCallback(() => {
    if (!sendSignal || !editorRef.current || isRunning) return;
    const currentCode = editorRef.current.getValue();
    setConsoleOutput(null);
    setTestResults(null);
    setIsRunning(true);
    sendSignal("RunCode", roomId, currentCode, currentLanguageRef.current).catch(
      (err) => {
        console.error("RunCode failed:", err);
        setConsoleOutput({
          stdout: null,
          stderr: `Error: Could not run code. ${err}`,
          exception: null,
          executionTime: 0,
        });
        setIsRunning(false);
      }
    );
  }, [sendSignal, roomId, isRunning]);

  // -------------------------------------------------------------------------
  // Monaco editor mount – registers all formatters
  // -------------------------------------------------------------------------

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // --- JavaScript: Prettier ---
    monaco.languages.registerDocumentFormattingEditProvider("javascript", {
      async provideDocumentFormattingEdits(model) {
        const code = model.getValue();
        try {
          // Dynamic import so the bundle only loads prettier when needed
          const [prettier, babelPlugin, estreePlugin] = await Promise.all([
            import("prettier/standalone"),
            import("prettier/plugins/babel"),
            import("prettier/plugins/estree"),
          ]);
          const formatted = await prettier.default.format(code, {
            parser: "babel",
            plugins: [babelPlugin.default, estreePlugin.default],
            tabWidth: 4,
            useTabs: false,
          });
          return [{ range: model.getFullModelRange(), text: formatted }];
        } catch (err) {
          console.error("Prettier formatting failed:", err);
          return [];
        }
      },
    });

    // --- C-style: Java / C# / C / C++ ---
    const cStyleFormatter = {
      provideDocumentFormattingEdits(model) {
        const code = model.getValue();
        let formatted = "";
        let indentLevel = 0;
        const indentUnit = "    ";
        const processed = code
          .replace(/\s*\{\s*/g, "\n{\n")
          .replace(/\s*\}\s*/g, "\n}\n")
          .replace(/\s*;\s*/g, ";\n");

        for (const line of processed.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith("}")) indentLevel = Math.max(0, indentLevel - 1);
          formatted += indentUnit.repeat(indentLevel) + trimmed + "\n";
          if (trimmed.endsWith("{")) indentLevel++;
        }
        return [
          {
            range: model.getFullModelRange(),
            text: formatted.replace(/\n\s*\n/g, "\n").trim(),
          },
        ];
      },
    };
    ["c", "c++", "java", "csharp"].forEach((lang) =>
      monaco.languages.registerDocumentFormattingEditProvider(lang, cStyleFormatter)
    );

    // --- Python ---
    monaco.languages.registerDocumentFormattingEditProvider("python", {
      provideDocumentFormattingEdits(model) {
        const edits = [];
        for (let i = 1; i <= model.getLineCount(); i++) {
          const line = model.getLineContent(i);
          const newText = line.replace(/\t/g, "    ").trimEnd();
          if (newText !== line)
            edits.push({ range: new monaco.Range(i, 1, i, line.length + 1), text: newText });
        }
        return edits;
      },
    });

    // --- Lua ---
    monaco.languages.registerDocumentFormattingEditProvider("lua", {
      provideDocumentFormattingEdits(model) {
        const edits = [];
        let indent = 0;
        const indentKeywords = ["function", "if", "for", "while", "repeat"];
        const dedentKeywords = ["end", "until"];
        const middleKeywords = ["else", "elseif"];

        for (let i = 1; i <= model.getLineCount(); i++) {
          const line = model.getLineContent(i);
          const trimmed = line.trim();
          if (!trimmed) {
            if (line.length > 0)
              edits.push({ range: new monaco.Range(i, 1, i, line.length + 1), text: "" });
            continue;
          }
          const firstWord = trimmed.split(/\s+/)[0];
          if (dedentKeywords.includes(firstWord) || middleKeywords.includes(firstWord)) {
            if (indent > 0) indent--;
          }
          const newText = "  ".repeat(indent) + trimmed;
          if (newText !== line)
            edits.push({ range: new monaco.Range(i, 1, i, line.length + 1), text: newText });
          const lastWord = trimmed.split(/\s+/).pop();
          if (
            indentKeywords.includes(firstWord) ||
            lastWord === "do" ||
            lastWord === "then"
          )
            indent++;
        }
        return edits;
      },
    });

    // Keyboard shortcut: Shift+Alt+F → format
    editor.addCommand(
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      () => formatCode()
    );
  }, [formatCode]);

  return {
    // Refs
    editorRef,
    monacoRef,
    // State
    language,
    roomLanguageCodeMap,
    isRunning,
    setIsRunning,
    consoleOutput,
    setConsoleOutput,
    testResults,
    setTestResults,
    // Handlers (local user actions)
    handleCodeChange,
    handleLanguageChange,
    handleEditorMount,
    formatCode,
    runCode,
    // External event handlers (called by orchestrator on SignalR events)
    applyExternalCode,
    applyExternalLanguage,
    initFromRoomState,
  };
}
