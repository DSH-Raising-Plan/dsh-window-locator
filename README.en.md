# dsh-window-locator

Windows **monitor geometry** and **foreground window** queries in **physical pixels**, packaged as [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) tools.

> Community plugin. Not affiliated with DeepSeek.  
> Concepts from [`canyueY/window-locator`](https://github.com/canyueY/window-locator).  
> Chinese docs: [README.md](./README.md)

## Why

Screenshot and click tools break when coordinate systems disagree: Qt logical coordinates, browser CSS pixels and Windows physical pixels diverge under 125% / 150% scaling. This plugin always returns **physical pixels**:

- Calls `SetThreadDpiAwarenessContext(PMv2)` before enumerating monitors and the foreground window;
- No Qt logical-coordinate conversion;
- Reports `bounds` and `work` per monitor, with the primary one marked.

Typical use: let the agent call `desktop_snapshot` first, so it knows where to click, what to crop, and whether the foreground window is itself.

## Features

- Multi-monitor: `device` / `bounds` / `work` / `is_primary`;
- Foreground window: `hwnd` / `title` / `rect` / `pid` / `maximized` / `is_self` (whether it is DSH itself);
- One-shot `desktop_snapshot`: monitors + primary + foreground;
- **Windows only** — PowerShell calls Win32 under the hood.

## Requirements

- Windows 10 / 11;
- `powershell.exe` available (built in);
- Node ≥ 20 for development only.

## Install

```bash
dsh plugin --profile web add github:DSH-Raising-Plan/dsh-window-locator#plugin/dsh
```

## Tools

| Tool | Arguments | Purpose |
| --- | --- | --- |
| `list_monitors` | none | All monitors (physical-pixel bounds / work / primary flag) |
| `foreground_window` | none | Foreground title, rect, pid, maximized state |
| `desktop_snapshot` | none | Monitors + primary + foreground in one call |

Output example (truncated):

```json
{
  "monitors": [
    {
      "device": "\\\\.\\DISPLAY2",
      "bounds": { "x": 0, "y": 0, "width": 2560, "height": 1440 },
      "work": { "x": 0, "y": 0, "width": 2560, "height": 1392 },
      "is_primary": true
    }
  ],
  "primary": { "device": "\\\\.\\DISPLAY2", "is_primary": true },
  "foreground": {
    "hwnd": 67372,
    "title": "…",
    "rect": { "x": 109, "y": 139, "width": 1523, "height": 893 },
    "pid": 12345,
    "is_self": false
  }
}
```

## Examples

```text
desktop_snapshot  → how many monitors, primary size, current foreground window
```

```text
foreground_window → check the foreground is not yourself before taking a screenshot
```

## Limitations

- **Windows only**; other platforms raise;
- Each call spawns PowerShell (tens to ~100+ ms for the first call);
- Returns physical pixels, not DPI-independent logical pixels; divide by `scale` downstream if needed;
- Exclusive fullscreen / protected content / elevated windows may not expose an accurate rect or title;
- No “find window by title” enumeration — it only inspects the foreground window.

## Development

```bash
npm test
npm run check
```

Requires `@deepseek-ai/dsh-tools` (or `DSH_TOOLS_PATH`).

## License

AGPL-3.0-or-later
