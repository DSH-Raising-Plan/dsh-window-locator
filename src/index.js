/**
 * dsh-window-locator — DeepSeek Harness plugin entry.
 * Port of https://github.com/canyueY/window-locator
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { pathToFileURL } from 'node:url';
import { allMonitors, desktopSnapshot, foregroundWindowInfo } from './win32.js';
import { desktopToolSpec, foregroundToolSpec, monitorsToolSpec } from './tool-spec.js';

export const name = 'dsh-window-locator';
export const inject = ['tools'];

export { allMonitors, desktopSnapshot, foregroundWindowInfo, isWindows } from './win32.js';

async function loadDefineTool() {
  try {
    const mod = await import('@deepseek-ai/dsh-tools');
    if (mod?.defineTool) return mod.defineTool;
  } catch { /* fall through */ }
  const override = process.env.DSH_TOOLS_PATH;
  if (override) {
    const mod = await import(pathToFileURL(override).href);
    if (mod?.defineTool) return mod.defineTool;
  }
  throw new Error('cannot resolve @deepseek-ai/dsh-tools (set DSH_TOOLS_PATH for local dev)');
}

export async function apply(ctx) {
  const defineTool = await loadDefineTool();
  ctx.windowLocator = { allMonitors, foregroundWindowInfo, desktopSnapshot };

  const monitors = defineTool({
    ...monitorsToolSpec(),
    async execute() {
      return { monitors: await allMonitors() };
    },
  });

  const foreground = defineTool({
    ...foregroundToolSpec(),
    async execute() {
      return await foregroundWindowInfo();
    },
  });

  const desktop = defineTool({
    ...desktopToolSpec(),
    async execute() {
      return await desktopSnapshot();
    },
  });

  const disposers = [
    ctx.tools.register(monitors),
    ctx.tools.register(foreground),
    ctx.tools.register(desktop),
  ];
  return () => {
    for (const dispose of disposers.reverse()) dispose?.();
    delete ctx.windowLocator;
  };
}
