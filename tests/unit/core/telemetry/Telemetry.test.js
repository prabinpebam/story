import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Telemetry module is browser-oriented; unit tests stub window/navigator.

describe('Telemetry', () => {
  const originalWindow = globalThis.window;
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    globalThis.window = {};
    globalThis.navigator = { doNotTrack: '0' };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.navigator = originalNavigator;
    vi.restoreAllMocks();
  });

  it('does not emit when DNT is enabled', async () => {
    globalThis.navigator.doNotTrack = '1';
    const mod = await import('../../../../src/core/telemetry/Telemetry.js');
    const t = new mod.Telemetry();

    t.emit('presentation.entered', { mode: 'viewer', slideIndex: 0, slideCount: 1, requestFullscreen: true });
    expect(t.getDebugEvents()).toHaveLength(0);
  });

  it('sanitizes payloads by strict schema (drops unknown keys)', async () => {
    const mod = await import('../../../../src/core/telemetry/Telemetry.js');
    const t = new mod.Telemetry({ maxEvents: 10 });

    t.emit('presentation.navigate', {
      fromSlideIndex: 1,
      toSlideIndex: 2,
      method: 'keyboard',
      latencyMs: 42,
      notes: '<b>nope</b>',
      deckContent: 'should-not-pass',
    });

    const evs = t.getDebugEvents();
    expect(evs).toHaveLength(1);
    expect(evs[0].type).toBe('presentation.navigate');
    expect(evs[0].data.notes).toBeUndefined();
    expect(evs[0].data.deckContent).toBeUndefined();
    expect(evs[0].data.method).toBe('keyboard');
    expect(evs[0].data.latencyMs).toBe(42);
  });

  it('drops unknown event types (strict)', async () => {
    const mod = await import('../../../../src/core/telemetry/Telemetry.js');
    const t = new mod.Telemetry();
    t.emit('unknown.event.type', { any: 'thing' });
    expect(t.getDebugEvents()).toHaveLength(0);
  });

  it('accepts and sanitizes transition telemetry events (privacy-safe)', async () => {
    const mod = await import('../../../../src/core/telemetry/Telemetry.js');
    const t = new mod.Telemetry({ maxEvents: 20 });

    t.emit('transition_requested', {
      transitionType: 'wipe',
      direction: 'upLeft',
      durationMs: 300,
      easing: 'ease-in-out',
      isReducedMotion: false,
      url: 'https://example.com/secret.png',
      notes: 'should-not-pass',
    });

    t.emit('transition_blocked_for_readiness', {
      blockedBucket: '50-200',
      blockedMs: 123,
      transitionType: 'wipe',
      direction: 'upLeft',
      assetUrl: 'https://example.com/secret.png',
    });

    t.emit('transition_ready_latency', {
      latencyMs: 123,
      transitionType: 'wipe',
      direction: 'upLeft',
      assetId: 'secret',
    });

    t.emit('transition_animation_duration', {
      requestedMs: 300,
      actualMs: 298,
      transitionType: 'wipe',
      direction: 'upLeft',
      stack: 'should-not-pass',
    });

    t.emit('transition_fallback_to_none', {
      reason: 'unsupported',
      transitionType: 'magic',
      direction: 'right',
      slideContent: 'should-not-pass',
    });

    const evs = t.getDebugEvents();
    expect(evs.length).toBeGreaterThanOrEqual(5);

    const requested = evs.find((e) => e.type === 'transition_requested');
    expect(requested).toBeTruthy();
    expect(requested.data.transitionType).toBe('wipe');
    expect(requested.data.url).toBeUndefined();
    expect(requested.data.notes).toBeUndefined();

    const blocked = evs.find((e) => e.type === 'transition_blocked_for_readiness');
    expect(blocked).toBeTruthy();
    expect(blocked.data.assetUrl).toBeUndefined();
    expect(blocked.data.blockedBucket).toBe('50-200');
    expect(blocked.data.blockedMs).toBe(123);

    const fallback = evs.find((e) => e.type === 'transition_fallback_to_none');
    expect(fallback).toBeTruthy();
    expect(fallback.data.reason).toBe('unsupported');
    expect(fallback.data.slideContent).toBeUndefined();
  });

  it('truncates and strips angle brackets from messages', async () => {
    const mod = await import('../../../../src/core/telemetry/Telemetry.js');
    const t = new mod.Telemetry();

    t.emit('presentation.error', { errorType: 'x', message: '<script>alert(1)</script>' });
    const ev = t.getDebugEvents()[0];
    expect(ev.data.message).toBe('scriptalert(1)/script');
  });

  it('sanitizes crash payloads (privacy-safe schema + truncation)', async () => {
    const mod = await import('../../../../src/core/telemetry/Telemetry.js');
    const t = new mod.Telemetry({ maxEvents: 10 });

    const longStack = `<stack>${'x'.repeat(5000)}</stack>`;

    t.emit('crash', {
      kind: 'error',
      message: '<b>boom</b>',
      stack: longStack,
      slideIndex: 1,
      buildIndex: 0,
      notes: 'should-not-pass',
      deckContent: 'should-not-pass',
    });

    const evs = t.getDebugEvents();
    expect(evs).toHaveLength(1);
    expect(evs[0].type).toBe('crash');
    expect(evs[0].data.notes).toBeUndefined();
    expect(evs[0].data.deckContent).toBeUndefined();
    expect(String(evs[0].data.message)).toContain('boom');

    // safeString strips angle brackets and truncates.
    const stack = String(evs[0].data.stack ?? '');
    expect(stack.includes('<')).toBe(false);
    expect(stack.includes('>')).toBe(false);
    expect(stack.length).toBeLessThanOrEqual(2000);
  });
});
