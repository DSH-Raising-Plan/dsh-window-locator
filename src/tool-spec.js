export const MONITORS_TOOL = 'list_monitors';
export const FOREGROUND_TOOL = 'foreground_window';
export const DESKTOP_TOOL = 'desktop_snapshot';

export function monitorsToolSpec() {
  return {
    name: MONITORS_TOOL,
    description: 'List Windows monitors with physical-pixel bounds and work areas (not Qt logical coords).',
    parameters: {},
    output: {
      schema: { type: 'json' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
  };
}

export function foregroundToolSpec() {
  return {
    name: FOREGROUND_TOOL,
    description: 'Return the foreground window title, physical rect, pid, maximized flag. Use before screenshots to avoid capturing yourself.',
    parameters: {},
    output: {
      schema: { type: 'json' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
  };
}

export function desktopToolSpec() {
  return {
    name: DESKTOP_TOOL,
    description: 'One-shot: all monitors + primary + foreground window (physical pixels).',
    parameters: {},
    output: {
      schema: { type: 'json' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
  };
}
