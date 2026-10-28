import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isWindows, desktopSnapshot, Win32Unavailable } from '../src/win32.js';

describe('window-locator', () => {
  it('reports platform', () => {
    assert.equal(typeof isWindows(), 'boolean');
  });

  it('snapshot works on Windows or throws elsewhere', async () => {
    if (!isWindows()) {
      await assert.rejects(() => desktopSnapshot(), Win32Unavailable);
      return;
    }
    const snap = await desktopSnapshot();
    assert.ok(Array.isArray(snap.monitors));
    assert.ok(snap.monitors.length >= 1);
    assert.ok(snap.monitors[0].bounds.width > 0);
    assert.equal(typeof snap.foreground.title, 'string');
    assert.ok(snap.foreground.rect);
  });
});
