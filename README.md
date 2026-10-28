# dsh-window-locator

Windows **显示器几何**与**前台窗口**查询（**物理像素**），做成 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 工具。

> 社区插件，与 DeepSeek 官方无关。  
> 概念来自 [`canyueY/window-locator`](https://github.com/canyueY/window-locator)。  
> 英文简版：[README.en.md](./README.en.md)

## 安装

```bash
dsh plugin --profile web add github:DSH-Raising-Plan/dsh-window-locator#plugin/dsh
```

**仅 Windows。** 经 PowerShell 调 Win32，并启用 Per-Monitor DPI Awareness v2，返回坐标为物理像素（便于截图/点击对齐）。

## 工具

| 工具 | 作用 |
| --- | --- |
| `list_monitors` | 列出全部显示器（bounds / work / 是否主屏） |
| `foreground_window` | 前台窗口标题、矩形、进程 id |
| `desktop_snapshot` | 显示器列表 + 前台窗口一次取回 |

## 开发

```bash
npm test
npm run check
```

需要 `@deepseek-ai/dsh-tools`（或设置 `DSH_TOOLS_PATH`）。

## 许可

AGPL-3.0-or-later
