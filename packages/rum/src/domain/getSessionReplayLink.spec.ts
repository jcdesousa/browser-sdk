import type { RumConfiguration, ViewContexts } from '@datadog/browser-rum-core'
import { registerCleanupTask } from '@datadog/browser-core/test'
import { createRumSessionManagerMock } from '../../../rum-core/test'
import { getSessionReplayLink } from './getSessionReplayLink'
import { addRecord, resetReplayStats } from './replayStats'

const DEFAULT_CONFIGURATION = {
  site: 'datad0g.com',
} as RumConfiguration

describe('getReplayLink', () => {
  afterEach(() => {
    resetReplayStats()
  })
  it('should return url without query param if no view', () => {
    const sessionManager = createRumSessionManagerMock().setId('session-id-1')
    const viewContexts = { findView: () => undefined } as ViewContexts

    const link = getSessionReplayLink(DEFAULT_CONFIGURATION, sessionManager, viewContexts, true)

    expect(link).toBe('https://dd.datad0g.com/rum/replay/sessions/session-id-1?')
  })

  it('should return the replay link', () => {
    const sessionManager = createRumSessionManagerMock().setId('session-id-1')
    const viewContexts = {
      findView: () => ({
        id: 'view-id-1',
        startClocks: {
          timeStamp: 123456,
        },
      }),
    } as ViewContexts
    addRecord('view-id-1')

    const link = getSessionReplayLink(
      { ...DEFAULT_CONFIGURATION, site: 'datadoghq.com', subdomain: 'toto' },
      sessionManager,
      viewContexts,
      true
    )

    expect(link).toBe('https://toto.datadoghq.com/rum/replay/sessions/session-id-1?seed=view-id-1&from=123456')
  })

  it('should return link when replay is forced', () => {
    const sessionManager = createRumSessionManagerMock()
      .setId('session-id-1')
      .setTrackedWithoutSessionReplay()
      .setForcedReplay()

    const viewContexts = {
      findView: () => ({
        id: 'view-id-1',
        startClocks: {
          timeStamp: 123456,
        },
      }),
    } as ViewContexts
    addRecord('view-id-1')

    const link = getSessionReplayLink(
      { ...DEFAULT_CONFIGURATION, site: 'datadoghq.com', subdomain: 'toto' },
      sessionManager,
      viewContexts,
      true
    )

    expect(link).toBe('https://toto.datadoghq.com/rum/replay/sessions/session-id-1?seed=view-id-1&from=123456')
  })

  it('return a param if replay is sampled out', () => {
    const sessionManager = createRumSessionManagerMock().setId('session-id-1').setTrackedWithoutSessionReplay()
    const viewContexts = {
      findView: () => ({
        id: 'view-id-1',
        startClocks: {
          timeStamp: 123456,
        },
      }),
    } as ViewContexts

    const link = getSessionReplayLink(
      { ...DEFAULT_CONFIGURATION, site: 'datadoghq.com' },
      sessionManager,
      viewContexts,
      true
    )
    expect(link).toBe(
      'https://app.datadoghq.com/rum/replay/sessions/session-id-1?error-type=incorrect-session-plan&seed=view-id-1&from=123456'
    )
  })

  it('return a param if rum is sampled out', () => {
    const sessionManager = createRumSessionManagerMock().setNotTracked()
    const viewContexts = {
      findView: () => undefined,
    } as ViewContexts

    const link = getSessionReplayLink(
      { ...DEFAULT_CONFIGURATION, site: 'datadoghq.com' },
      sessionManager,
      viewContexts,
      true
    )

    expect(link).toBe('https://app.datadoghq.com/rum/replay/sessions/no-session-id?error-type=rum-not-tracked')
  })

  it('should add a param if the replay was not started', () => {
    const sessionManager = createRumSessionManagerMock().setId('session-id-1')
    const viewContexts = {
      findView: () => ({
        id: 'view-id-1',
        startClocks: {
          timeStamp: 123456,
        },
      }),
    } as ViewContexts

    const link = getSessionReplayLink(
      { ...DEFAULT_CONFIGURATION, site: 'datadoghq.com' },
      sessionManager,
      viewContexts,
      false
    )

    expect(link).toBe(
      'https://app.datadoghq.com/rum/replay/sessions/session-id-1?error-type=replay-not-started&seed=view-id-1&from=123456'
    )
  })

  describe('browser not supported', () => {
    beforeEach(() => {
      // browser support function rely on Array.from being a function.
      const original = Array.from
      Array.from = undefined as any

      registerCleanupTask(() => {
        Array.from = original
      })
    })

    it('should add a param if the browser is not supported', () => {
      const sessionManager = createRumSessionManagerMock().setId('session-id-1')
      const viewContexts = {
        findView: () => ({
          id: 'view-id-1',
          startClocks: {
            timeStamp: 123456,
          },
        }),
      } as ViewContexts

      const link = getSessionReplayLink(
        { ...DEFAULT_CONFIGURATION, site: 'datadoghq.com' },
        sessionManager,
        viewContexts,
        false
      )

      expect(link).toBe(
        'https://app.datadoghq.com/rum/replay/sessions/session-id-1?error-type=browser-not-supported&seed=view-id-1&from=123456'
      )
    })
  })
})
