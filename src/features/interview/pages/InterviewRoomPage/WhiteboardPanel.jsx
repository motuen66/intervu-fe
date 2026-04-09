import { Box } from "@mui/material";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

// ---------------------------------------------------------------------------
// WhiteboardPanel
//
// Thin wrapper around <Excalidraw> that lives inside Panel A alongside the
// code editor.  All sync logic is handled by useWhiteboardSync – this
// component is purely presentational.
// ---------------------------------------------------------------------------
export function WhiteboardPanel({ excalidrawAPIRef, onChange, onPointerUp, readOnly }) {
  return (
    <Box
      sx={{
        flex: 1,
        height: "100%",
        position: "relative",
        // Excalidraw renders inside a div with class .excalidraw – make sure
        // it fills the available space.
        "& .excalidraw": { height: "100%" },
        "& .excalidraw-container": { height: "100%" },
      }}
    >
      <Excalidraw
        excalidrawAPI={(api) => {
          excalidrawAPIRef.current = api;
        }}
        onChange={onChange}
        onPointerUp={onPointerUp}
        viewModeEnabled={readOnly}
        theme="light"
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: false,
            export: { saveFileToDisk: true },
          },
        }}
      />
    </Box>
  );
}
