import React, { useState, useEffect, useRef } from "react";
import { MousePointer2 } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const Overlay = ({ onFinish, hideQuestions = false }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [selectionStyle, setSelectionStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    display: "none",
  });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);

  const tauriWindow = getCurrentWindow();
  const lockdownApplied = useRef(false);

  // Apply lockdown: always on top, maximized, no decorations, hidden from captures
  useEffect(() => {
    if (lockdownApplied.current) return;
    lockdownApplied.current = true;

    const lockScreen = async () => {
      try {
        // Make window cover everything and stay on top
        await tauriWindow.setAlwaysOnTop(true);
        await tauriWindow.setFullscreen(false);
        await tauriWindow.maximize();
        await tauriWindow.setDecorations(false);
        await tauriWindow.setFocus();

        // Hide from screen recordings / task switcher (Windows)
        if (typeof tauriWindow.toPanel === "function") {
          await tauriWindow.toPanel();
        }
      } catch (e) {
        console.warn("[Overlay] Some lockdown features unavailable:", e);
      }
    };

    lockScreen();

    // Block Alt+Tab, Win key, etc. by requesting attention
    tauriWindow.setFocus().catch(() => {});
  }, []);

  // Mouse selection handlers
  const handleMouseDown = (e) => {
    if (e.target.closest("button")) return;
    setIsSelecting(true);
    setStartCoords({ x: e.clientX, y: e.clientY });
    setSelectionStyle({
      left: e.clientX,
      top: e.clientY,
      width: 0,
      height: 0,
      display: "block",
    });
  };

  const handleMouseMove = (e) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    if (!cursorVisible) setCursorVisible(true);

    if (!isSelecting) return;

    const width = Math.abs(e.clientX - startCoords.x);
    const height = Math.abs(e.clientY - startCoords.y);
    const left = Math.min(e.clientX, startCoords.x);
    const top = Math.min(e.clientY, startCoords.y);

    setSelectionStyle({ left, top, width, height, display: "block" });
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionStyle((prev) => ({ ...prev, display: "none" }));
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none"
      style={{ zIndex: 99999 }}
    >
      {/* Dark tinted overlay — blocks switching but still shows the app */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(14, 14, 14, 0.55)",
          backdropFilter: "blur(3px)",
          pointerEvents: "auto",
          cursor: "crosshair",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* Questions Panel - only show in video mode */}
      {!hideQuestions && (
        <div
          className="fixed right-8 top-1/4 w-96 bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-white shadow-2xl pointer-events-auto"
          style={{ zIndex: 100000 }}
        >
          <h2 className="text-xl font-bold border-b border-white/10 pb-3 mb-4">Interview Questions</h2>

          <div className="flex flex-col gap-3">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
              <h3 className="font-semibold text-red-400 mb-2 truncate">Q1. Event Loop in JS</h3>
              <p className="text-sm text-gray-200 line-clamp-3">
                Explain how the event loop works in JavaScript. What is the difference between the microtask queue and the macrotask queue?
              </p>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
              <h3 className="font-semibold text-red-400 mb-2 truncate">Q2. React Component Lifecycle</h3>
              <p className="text-sm text-gray-200 line-clamp-3">
                Describe the React hook equivalents of `componentDidMount`, `componentDidUpdate`, and `componentWillUnmount`. How does the dependency array affect execution?
              </p>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
              <h3 className="font-semibold text-red-400 mb-2 truncate">Q3. Web Security (XSS/CSRF)</h3>
              <p className="text-sm text-gray-200 line-clamp-3">
                How do Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) differ? What strategies would you use to mitigate these vulnerabilities?
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selection Rectangle */}
      <div
        className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none rounded-xl"
        style={{
          left: selectionStyle.left,
          top: selectionStyle.top,
          width: selectionStyle.width,
          height: selectionStyle.height,
          display: selectionStyle.display,
          zIndex: 100002,
        }}
      />

      {/* Custom Cursor */}
      <div
        className="fixed pointer-events-none transition-opacity duration-100"
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          transform: "translate(-50%, -50%)",
          opacity: cursorVisible ? 1 : 0,
          zIndex: 100003,
        }}
      >
        <MousePointer2 className="w-7 h-7 text-red-500 drop-shadow-2xl" />
      </div>
    </div>
  );
};

export default Overlay;
