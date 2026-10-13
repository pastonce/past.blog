'use client'

import type { SiteContent } from '../stores/config-store'
import { ColorConfig } from './color-config'

interface DarkModeConfigProps {
	formData: SiteContent
	setFormData: React.Dispatch<React.SetStateAction<SiteContent>>
}

export function DarkModeConfig({ formData, setFormData }: DarkModeConfigProps) {
	const { darkMode } = formData
	// 日夜配色共用组件，包含状态页装饰色；只写回夜间字段，避免覆盖白天配色。
	const darkFormData = {
		...formData,
		theme: darkMode.theme,
		backgroundColors: darkMode.backgroundColors,
		statusAccent: darkMode.statusAccent,
		statusSakuraBg: darkMode.statusSakuraBg
	}
	const setDarkFormData: DarkModeConfigProps['setFormData'] = update => {
		setFormData(previous => {
			const current = {
				...previous,
				theme: previous.darkMode.theme,
				backgroundColors: previous.darkMode.backgroundColors,
				statusAccent: previous.darkMode.statusAccent,
				statusSakuraBg: previous.darkMode.statusSakuraBg
			}
			const next = typeof update === 'function' ? update(current) : update
			return {
				...previous,
				darkMode: {
					...previous.darkMode,
					theme: next.theme,
					backgroundColors: next.backgroundColors,
					statusAccent: next.statusAccent,
					statusSakuraBg: next.statusSakuraBg
				}
			}
		})
	}
	const updateSchedule = (update: Partial<SiteContent['darkMode']['autoSwitch']>) => {
		setFormData(previous => ({ ...previous, darkMode: { ...previous.darkMode, autoSwitch: { ...previous.darkMode.autoSwitch, ...update } } }))
	}

	return (
		<div className='space-y-6'>
			<div className='space-y-3'>
				<label className='flex items-center gap-2 text-sm font-medium'>
					<input
						type='checkbox'
						checked={darkMode.autoSwitch.enabled}
						onChange={event => updateSchedule({ enabled: event.target.checked })}
						className='accent-brand size-4'
					/>
					按时间自动切换
				</label>
				<div className='grid grid-cols-2 gap-4'>
					<label className='space-y-2 text-xs'>
						<span className='block'>黑夜开始时间</span>
						<input
							type='time'
							value={darkMode.autoSwitch.start}
							onChange={event => updateSchedule({ start: event.target.value })}
							className='bg-secondary/10 w-full rounded-lg border px-3 py-2 text-sm'
						/>
					</label>
					<label className='space-y-2 text-xs'>
						<span className='block'>黑夜结束时间</span>
						<input
							type='time'
							value={darkMode.autoSwitch.end}
							onChange={event => updateSchedule({ end: event.target.value })}
							className='bg-secondary/10 w-full rounded-lg border px-3 py-2 text-sm'
						/>
					</label>
				</div>
				<p className='text-secondary text-xs leading-relaxed'>
					按访问者设备的本地时间执行，支持跨午夜。开始时进入黑夜，结束时恢复白天；手动切换保持到下一次边界。关闭自动切换后，手动选择持续保留。
				</p>
				<p className='text-secondary text-xs leading-relaxed'>点击「预览」应用临时配置，再用左下角按钮切换黑夜查看配色。</p>
			</div>
			<ColorConfig formData={darkFormData} setFormData={setDarkFormData} />
		</div>
	)
}
