'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import {
	applyTheme,
	createThemePreference,
	getNextThemeBoundary,
	readThemePreference,
	resolveThemeMode,
	THEME_STORAGE_KEY,
	type ThemeMode,
	type ThemePreference
} from '@/lib/theme'

type ThemeState = {
	mode: ThemeMode
	preference: ThemePreference | null
	initialized: boolean
}

export const useThemeStore = create<ThemeState>(() => ({ mode: 'light', preference: null, initialized: false }))

function savePreference(preference: ThemePreference | null, previousPreference?: ThemePreference) {
	try {
		if (previousPreference && localStorage.getItem(THEME_STORAGE_KEY) !== JSON.stringify(previousPreference)) return
		if (preference) localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preference))
		else localStorage.removeItem(THEME_STORAGE_KEY)
	} catch {
		// 禁用存储时，当前页面仍能手动切换，只是不跨刷新记忆。
	}
}

export function useThemeInit() {
	const siteContent = useConfigStore(state => state.siteContent)
	const { preference, initialized } = useThemeStore()

	useEffect(() => {
		let cached: ThemePreference | null = null
		try {
			cached = readThemePreference(localStorage.getItem(THEME_STORAGE_KEY))
		} catch {}
		useThemeStore.setState({ preference: cached, initialized: true })
		const onStorage = (event: StorageEvent) => {
			if (event.key === THEME_STORAGE_KEY || event.key === null) {
				useThemeStore.setState({ preference: readThemePreference(event.newValue) })
			}
		}
		window.addEventListener('storage', onStorage)
		return () => window.removeEventListener('storage', onStorage)
	}, [])

	useEffect(() => {
		if (!initialized) return
		let timer: ReturnType<typeof setTimeout>
		const schedule = siteContent.darkMode.autoSwitch
		const sync = () => {
			const now = new Date()
			const scheduleKey = JSON.stringify([schedule.enabled, schedule.start, schedule.end])
			const active =
				preference && preference.scheduleKey === scheduleKey && (preference.expiresAt === null || preference.expiresAt > now.getTime()) ? preference : null
			if (preference && !active) {
				useThemeStore.setState({ preference: null })
				// 旧标签页只忽略不同时间表的选择；过期定时器也不能清除更新后的选择。
				if (preference.scheduleKey === scheduleKey) savePreference(null, preference)
			}
			const mode = resolveThemeMode(schedule, active, now)
			applyTheme(siteContent, mode)
			useThemeStore.setState({ mode })
			clearTimeout(timer)
			const boundary = getNextThemeBoundary(schedule, now)
			const deadline = active?.expiresAt ?? boundary
			// 边界准时切换；定期及回到页面时校准，兼容休眠和系统时间变化。
			timer = setTimeout(sync, deadline === null ? 60_000 : Math.min(60_000, Math.max(1, deadline - now.getTime())))
		}
		sync()
		window.addEventListener('focus', sync)
		document.addEventListener('visibilitychange', sync)
		return () => {
			clearTimeout(timer)
			window.removeEventListener('focus', sync)
			document.removeEventListener('visibilitychange', sync)
		}
	}, [siteContent, preference, initialized])
}

export function useTheme() {
	const { mode, preference, initialized } = useThemeStore()
	const siteContent = useConfigStore(state => state.siteContent)
	const setPreference = (next: ThemePreference | null) => {
		const mode = resolveThemeMode(siteContent.darkMode.autoSwitch, next)
		savePreference(next)
		useThemeStore.setState({ mode, preference: next })
		applyTheme(siteContent, mode)
	}
	return {
		mode,
		initialized,
		isManual: preference !== null,
		toggle: () => setPreference(createThemePreference(mode === 'dark' ? 'light' : 'dark', siteContent.darkMode.autoSwitch)),
		restoreAuto: () => setPreference(null)
	}
}
