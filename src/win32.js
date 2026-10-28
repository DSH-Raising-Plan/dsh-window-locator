/**
 * Windows physical-pixel monitor / foreground helpers via PowerShell + Win32.
 * Concepts from canyueY/window-locator (no Qt logical coords).
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';

const execFileAsync = promisify(execFile);

export class Win32Unavailable extends Error {
  constructor(message) {
    super(message);
    this.name = 'Win32Unavailable';
  }
}

export function isWindows() {
  return process.platform === 'win32';
}

/** PowerShell probe: DPI-aware physical rects + foreground window. */
const PS_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Collections.Generic;

public static class DshWinLoc {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }

  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct MONITORINFOEX {
    public int cbSize;
    public RECT rcMonitor;
    public RECT rcWork;
    public int dwFlags;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
    public string szDevice;
  }

  public delegate bool MonitorEnumProc(IntPtr hMonitor, IntPtr hdcMonitor, ref RECT lprcMonitor, IntPtr dwData);

  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int maxCount);
  [DllImport("user32.dll")] public static extern bool IsZoomed(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  [DllImport("user32.dll")] public static extern IntPtr SetThreadDpiAwarenessContext(IntPtr value);
  [DllImport("user32.dll")] public static extern bool EnumDisplayMonitors(IntPtr hdc, IntPtr clip, MonitorEnumProc cb, IntPtr data);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFOEX info);

  public class MonitorDto {
    public string device;
    public int[] bounds;
    public int[] work;
    public bool is_primary;
  }
  public class ForegroundDto {
    public long hwnd;
    public string title;
    public int[] rect;
    public bool maximized;
    public uint pid;
  }
  public class SnapshotDto {
    public List<MonitorDto> monitors = new List<MonitorDto>();
    public ForegroundDto foreground = new ForegroundDto();
  }

  static SnapshotDto _snap;

  static bool OnMonitor(IntPtr hMon, IntPtr hdc, ref RECT r, IntPtr data) {
    var info = new MONITORINFOEX();
    info.cbSize = Marshal.SizeOf(typeof(MONITORINFOEX));
    if (!GetMonitorInfo(hMon, ref info)) return true;
    var m = info.rcMonitor; var w = info.rcWork;
    _snap.monitors.Add(new MonitorDto {
      device = info.szDevice,
      bounds = new int[]{ m.Left, m.Top, m.Right, m.Bottom },
      work = new int[]{ w.Left, w.Top, w.Right, w.Bottom },
      is_primary = (info.dwFlags & 1) != 0
    });
    return true;
  }

  public static string SnapshotJson() {
    SetThreadDpiAwarenessContext((IntPtr)(-4)); // PMv2 = physical pixels
    _snap = new SnapshotDto();
    EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero, OnMonitor, IntPtr.Zero);
    var hwnd = GetForegroundWindow();
    _snap.foreground.hwnd = hwnd.ToInt64();
    if (hwnd != IntPtr.Zero) {
      var sb = new StringBuilder(512);
      GetWindowText(hwnd, sb, sb.Capacity);
      _snap.foreground.title = sb.ToString();
      RECT rect;
      if (GetWindowRect(hwnd, out rect)) {
        _snap.foreground.rect = new int[]{ rect.Left, rect.Top, rect.Right, rect.Bottom };
      } else {
        _snap.foreground.rect = new int[]{ 0, 0, 0, 0 };
      }
      _snap.foreground.maximized = IsZoomed(hwnd);
      uint pid; GetWindowThreadProcessId(hwnd, out pid); _snap.foreground.pid = pid;
    } else {
      _snap.foreground.title = "";
      _snap.foreground.rect = new int[]{ 0, 0, 0, 0 };
    }
    return new System.Web.Script.Serialization.JavaScriptSerializer().Serialize(_snap);
  }
}
'@ -ReferencedAssemblies System.Web.Extensions
[DshWinLoc]::SnapshotJson()
`;

function rectFromLTRB(arr) {
  if (!Array.isArray(arr) || arr.length < 4) return null;
  const [left, top, right, bottom] = arr.map(Number);
  return {
    left, top, right, bottom,
    x: left, y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

export async function desktopSnapshot() {
  if (!isWindows()) {
    throw new Win32Unavailable(`window locator only works on Windows (got ${process.platform})`);
  }
  const encoded = Buffer.from(PS_SCRIPT, 'utf16le').toString('base64');
  let stdout;
  try {
    const result = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
      { windowsHide: true, maxBuffer: 2 << 20 },
    );
    stdout = String(result.stdout || '').trim();
  } catch (err) {
    throw new Win32Unavailable(`PowerShell Win32 probe failed: ${err.message || err}`);
  }
  const line = stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).at(-1);
  if (!line) throw new Win32Unavailable('empty PowerShell output');
  let raw;
  try {
    raw = JSON.parse(line);
  } catch (err) {
    throw new Win32Unavailable(`bad JSON from PowerShell: ${err.message}; got ${line.slice(0, 200)}`);
  }
  const monitors = (raw.monitors || []).map((m) => ({
    device: m.device,
    bounds: rectFromLTRB(m.bounds),
    work: rectFromLTRB(m.work),
    is_primary: Boolean(m.is_primary),
  }));
  const fg = raw.foreground || {};
  return {
    monitors,
    primary: monitors.find((m) => m.is_primary) || monitors[0] || null,
    foreground: {
      hwnd: Number(fg.hwnd) || 0,
      title: String(fg.title || ''),
      rect: rectFromLTRB(fg.rect),
      maximized: Boolean(fg.maximized),
      pid: Number(fg.pid) || 0,
      is_self: Number(fg.pid) === process.pid,
    },
  };
}

export async function allMonitors() {
  return (await desktopSnapshot()).monitors;
}

export async function foregroundWindowInfo() {
  return (await desktopSnapshot()).foreground;
}
