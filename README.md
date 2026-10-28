# dsh-window-locator

Windows **monitor geometry** + **foreground window** (physical pixels) as [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) tools.

> Community plugin. Not affiliated with DeepSeek.  
> Concepts from [`canyueY/window-locator`](https://github.com/canyueY/window-locator).

## Install

```bash
dsh plugin --profile web add github:canyueY/dsh-window-locator#plugin/dsh
```

Windows only. Uses PowerShell + Win32 with per-monitor DPI awareness v2 so coordinates are physical pixels.

## Tools

| Tool | Purpose |
| --- | --- |
| `list_monitors` | All monitors (bounds / work / primary) |
| `foreground_window` | Foreground title, rect, pid |
| `desktop_snapshot` | Monitors + foreground in one call |

## License

AGPL-3.0-or-later
