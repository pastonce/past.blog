import type { SiteContent } from '@/app/(home)/stores/config-store'

export type ThemeMode = 'light' | 'dark'
export type ThemeSchedule = SiteContent['darkMode']['autoSwitch']
export type ThemePreference = { mode: ThemeMode; expiresAt: number | null; scheduleKey: string }

export const THEME_STORAGE_KEY = 'blog-theme-preference'
export const THEME_VARIABLES = {
	colorBrand: '--color-brand',
	colorPrimary: '--color-primary',
	colorSecondary: '--color-secondary',
	colorBrandSecondary: '--color-brand-secondary',
	colorBg: '--color-bg',
	colorBorder: '--color-border',
	colorCard: '--color-card',
	colorArticle: '--color-article'
} as const

let themeTransitionVersion = 0

export function parseThemeTime(value: string): number | null {
	if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null
	const [hours, minutes] = value.split(':').map(Number)
	return hours * 60 + minutes
}

export function getNextThemeBoundary(schedule: ThemeSchedule, now = new Date()): number | null {
	const start = parseThemeTime(schedule.start)
	const end = parseThemeTime(schedule.end)
	if (!schedule.enabled || start === null || end === null || start === end) return null

	// 使用本地日期计算下一次边界，兼容跨午夜时段以及本地夏令时。
	return Math.min(
		...[start, end].map(minutes => {
			const boundary = new Date(now)
			boundary.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
			if (boundary.getTime() <= now.getTime()) {
				boundary.setDate(boundary.getDate() + 1)
			}
			return boundary.getTime()
		})
	)
}

export function createThemePreference(mode: ThemeMode, schedule: ThemeSchedule, now = new Date()): ThemePreference {
	return {
		mode,
		expiresAt: getNextThemeBoundary(schedule, now),
		scheduleKey: JSON.stringify([schedule.enabled, schedule.start, schedule.end])
	}
}

export function readThemePreference(value: string | null): ThemePreference | null {
	try {
		const preference = JSON.parse(value || 'null')
		if (
			preference &&
			(preference.mode === 'light' || preference.mode === 'dark') &&
			(preference.expiresAt === null || (typeof preference.expiresAt === 'number' && Number.isFinite(preference.expiresAt))) &&
			typeof preference.scheduleKey === 'string'
		)
			return preference
	} catch {
		// 浏览器缓存损坏或不可用时，仍然按站点时间表显示。
	}
	return null
}

export function resolveThemeMode(schedule: ThemeSchedule, preference: ThemePreference | null, now = new Date()): ThemeMode {
	// 保持函数独立，首屏脚本与客户端共用同一个判断，避免刷新时闪回白天。
	const scheduleKey = JSON.stringify([schedule.enabled, schedule.start, schedule.end])
	if (preference?.scheduleKey === scheduleKey && (preference.expiresAt === null || preference.expiresAt > now.getTime())) {
		return preference.mode
	}
	if (!schedule.enabled || !/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.end)) return 'light'
	const [startHour, startMinute] = schedule.start.split(':').map(Number)
	const [endHour, endMinute] = schedule.end.split(':').map(Number)
	const start = startHour * 60 + startMinute
	const end = endHour * 60 + endMinute
	const minute = now.getHours() * 60 + now.getMinutes()
	const isNight = start < end ? minute >= start && minute < end : start !== end && (minute >= start || minute < end)
	return isNight ? 'dark' : 'light'
}

export function getThemeAppearance(content: SiteContent, mode: ThemeMode) {
	return mode === 'dark' ? content.darkMode : content
}

export function applyTheme(content: SiteContent, mode: ThemeMode) {
	const root = document.documentElement
	const appearance = getThemeAppearance(content, mode)
	const { theme } = appearance
	const isChanging =
		root.dataset.themeReady === 'true' &&
		(root.dataset.theme !== mode ||
			Object.keys(THEME_VARIABLES).some(
				key => root.style.getPropertyValue(THEME_VARIABLES[key as keyof typeof THEME_VARIABLES]) !== theme[key as keyof typeof theme]
			) ||
			root.style.getPropertyValue('--color-status-accent') !== (appearance.statusAccent ?? '#9ee4e4') ||
			root.style.getPropertyValue('--color-status-sakura') !== (appearance.statusSakuraBg ?? '#c7e7c5'))
	const version = isChanging ? ++themeTransitionVersion : themeTransitionVersion
	// 根节点已经在逐帧改变颜色，切换期间关闭组件的重复颜色过渡，防止不断取消、重启。
	if (isChanging) root.dataset.themeChanging = 'true'
	for (const key of Object.keys(THEME_VARIABLES) as Array<keyof typeof THEME_VARIABLES>) {
		root.style.setProperty(THEME_VARIABLES[key], theme[key])
		root.style.setProperty(`--night${THEME_VARIABLES[key].slice(1)}`, content.darkMode.theme[key])
	}
	root.style.setProperty('--color-status-accent', appearance.statusAccent ?? '#9ee4e4')
	root.style.setProperty('--color-status-sakura', appearance.statusSakuraBg ?? '#c7e7c5')
	root.style.colorScheme = mode
	root.classList.toggle('dark', mode === 'dark')
	root.dataset.theme = mode
	// 首屏脚本先应用颜色，客户端初始化之后再允许渐变，避免首次载入闪色。
	root.dataset.themeReady = 'true'
	if (isChanging) {
		const transitions = root.getAnimations().filter(animation => {
			const property = (animation as CSSTransition).transitionProperty
			return property?.startsWith('--color-') || property === '--theme-night-weight'
		})
		// 等实际动画结束再恢复悬停过渡；连续切换时，旧动画的结束回调不能提前恢复。
		Promise.allSettled(transitions.map(animation => animation.finished)).then(() => {
			requestAnimationFrame(() => {
				if (version === themeTransitionVersion) delete root.dataset.themeChanging
			})
		})
	}
}

export function getThemeInitScript(content: SiteContent): string {
	const config = JSON.stringify({
		theme: content.theme,
		statusAccent: content.statusAccent,
		statusSakuraBg: content.statusSakuraBg,
		darkMode: content.darkMode
	}).replace(/</g, '\\u003c')
	return `(() => {
		const content = ${config};
		const resolveMode = ${resolveThemeMode.toString()};
		const readPreference = ${readThemePreference.toString()};
		let preference = null;
		try { preference = readPreference(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})); } catch {}
		const mode = resolveMode(content.darkMode.autoSwitch, preference);
		const appearance = mode === 'dark' ? content.darkMode : content;
		const theme = appearance.theme;
		const root = document.documentElement;
		const variables = ${JSON.stringify(THEME_VARIABLES)};
		Object.keys(variables).forEach(key => {
			root.style.setProperty(variables[key], theme[key]);
			root.style.setProperty('--night' + variables[key].slice(1), content.darkMode.theme[key]);
		});
		root.style.setProperty('--color-status-accent', appearance.statusAccent ?? '#9ee4e4');
		root.style.setProperty('--color-status-sakura', appearance.statusSakuraBg ?? '#c7e7c5');
		root.style.colorScheme = mode;
		root.classList.toggle('dark', mode === 'dark');
		root.dataset.theme = mode;
	})();`
}
