'use client'

import { Moon, Sun, Clock3, Settings2 } from 'lucide-react'
import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/hooks/use-theme'
import { useConfigStore } from '@/app/(home)/stores/config-store'

export default function ThemeToggle() {
	const { mode, initialized, isManual, toggle, restoreAuto } = useTheme()
	const autoEnabled = useConfigStore(state => state.siteContent.darkMode.autoSwitch.enabled)
	const setConfigDialogOpen = useConfigStore(state => state.setConfigDialogOpen)
	const isHome = usePathname() === '/'
	const isDark = mode === 'dark'

	return (
		<div className='bg-card text-primary fixed bottom-6 left-6 z-40 flex items-center gap-1 rounded-full border p-1 shadow-md backdrop-blur-md max-sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] max-sm:left-4'>
			<motion.button
				type='button'
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				disabled={!initialized}
				onClick={toggle}
				aria-label={isDark ? '切换到白天模式' : '切换到黑夜模式'}
				aria-pressed={isDark}
				title={
					isManual ? (autoEnabled ? '手动模式，下次自动时段边界恢复自动' : '手动模式，保持当前选择') : autoEnabled ? '按站点时间表自动切换' : '自动切换已关闭'
				}
				className='hover:bg-brand/10 focus-visible:outline-brand flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'>
				{isDark ? <Moon className='size-4' /> : <Sun className='size-4' />}
				<span>{isDark ? '黑夜' : '白天'}</span>
			</motion.button>
			<button
				type='button'
				onClick={restoreAuto}
				disabled={!initialized || !isManual}
				aria-label={autoEnabled ? '恢复自动切换' : '恢复默认白天模式'}
				aria-pressed={!isManual}
				title={autoEnabled ? '恢复按站点时间表自动切换' : '自动切换已关闭，恢复白天模式'}
				className={`focus-visible:outline-brand flex items-center gap-1 rounded-full px-2 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${isManual ? 'text-secondary hover:bg-brand/10' : 'bg-brand/10 text-brand'}`}>
				<Clock3 className='size-3.5' />
				{autoEnabled ? '自动' : '默认'}
			</button>
			{isHome && (
				<button
					type='button'
					onClick={() => setConfigDialogOpen(true)}
					aria-label='打开主页配置'
					title='主页配置'
					className='text-secondary hover:bg-brand/10 focus-visible:outline-brand hidden rounded-full p-2 focus-visible:outline-2 focus-visible:outline-offset-2 max-sm:flex'>
					<Settings2 className='size-4' />
				</button>
			)}
		</div>
	)
}
