# dsh-window-locator

Windows **显示器几何**与**前台窗口**查询（**物理像素**），做成 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 工具。

> 社区插件，与 DeepSeek 官方无关。  
> 概念来自 [`canyueY/window-locator`](https://github.com/canyueY/window-locator)。  
> 英文简版：[README.en.md](./README.en.md)

## 为什么需要它

截图工具和点击工具最怕坐标系不一致：Qt 的 `logical` 坐标、浏览器的 CSS 像素、Windows 的物理像素，在 125% / 150% 缩放下会差出一大截。这个插件统一返回 **物理像素**：

- 进程内先 `SetThreadDpiAwarenessContext(PMv2)`，再枚举显示器与前台窗口；
- 不经过任何 Qt 逻辑坐标换算；
- 多显示器时给出各自的 `bounds` 与 `work` 区域，主屏单独标出。

典型用法：让 Agent 先 `desktop_snapshot`，知道把鼠标点到哪、截图裁哪、当前前台是不是自己。

## 特性

- 多显示器：`device` / `bounds` / `work` / `is_primary`；
- 前台窗口：`hwnd` / `title` / `rect` / `pid` / 是否最大化 / `is_self`（是不是 DSH 自己）；
- 一次拿全：`desktop_snapshot` = 显示器列表 + 主屏 + 前台窗口；
- **仅 Windows**：底层通过 PowerShell 调 Win32 API。

## 前提

- Windows 10 / 11；
- `powershell.exe` 可用（系统自带即可）；
- Node ≥ 20（只影响开发，插件运行时由 DSH 提供）。

## 安装

```bash
dsh plugin --profile web add github:DSH-Raising-Plan/dsh-window-locator#plugin/dsh
```

## 工具

| 工具 | 参数 | 作用 |
| --- | --- | --- |
| `list_monitors` | 无 | 列出全部显示器（物理像素 bounds / work / 主屏标记） |
| `foreground_window` | 无 | 前台窗口标题、矩形、pid、最大化状态 |
| `desktop_snapshot` | 无 | 一次返回显示器列表 + 主屏 + 前台窗口 |

输出示例（节选）：

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
    "pid": 12345
  }
}
```

## 使用示例

```text
desktop_snapshot  → 看有几块屏、主屏多大、当前前台窗口是谁
```

```text
foreground_window → 截图前确认前台不是自己，避免把 Agent 的窗口截进去
```

## 限制

- **仅 Windows**；其它平台直接报错；
- 每次调用会启动一次 PowerShell，首次约几十到一百多毫秒；
- 返回的是物理像素，不是 DPI 无关的逻辑像素；如果你的下游按逻辑坐标算，需要自己除 `scale`；
- 某些全屏独占 / 受保护内容 / 提权窗口可能拿不到准确矩形或标题；
- 不提供“按标题找窗口”的枚举接口，只查前台。

## 开发

```bash
npm test
npm run check
```

需要 `@deepseek-ai/dsh-tools`（或设置 `DSH_TOOLS_PATH`）。

## 许可

AGPL-3.0-or-later
