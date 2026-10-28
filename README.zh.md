# dsh-window-locator · 中文说明

Windows **显示器几何**与**前台窗口**查询（物理像素），做成 DeepSeek Harness 工具。

> 社区插件。概念来自 [`canyueY/window-locator`](https://github.com/canyueY/window-locator)。

## 安装

```bash
dsh plugin --profile web add github:canyueY/dsh-window-locator#plugin/dsh
```

仅 Windows。经 PowerShell 调 Win32，并设 PMv2 DPI 感知，坐标为物理像素。

## 工具

| 工具 | 作用 |
| --- | --- |
| `list_monitors` | 列出显示器 |
| `foreground_window` | 前台窗口信息 |
| `desktop_snapshot` | 显示器 + 前台一次取回 |

## 许可

AGPL-3.0-or-later
