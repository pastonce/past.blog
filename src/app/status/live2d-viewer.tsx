'use client'

import { useEffect, useRef, useState } from 'react'

/** PIXI Application 实例（CDN 加载，无类型包） */
interface PixiAppInstance {
	stage: { addChild: (child: unknown) => void }
	view: HTMLCanvasElement
	renderer: { resize: (width: number, height: number) => void }
	destroy: (opts?: { removeView?: boolean }) => void
}

/** Live2D 模型实例 */
interface Live2DModelInstance {
	anchor: { set: (x: number, y: number) => void }
	x: number
	y: number
	width: number
	height: number
	scale: { set: (x: number, y: number) => void }
	/** 模型原始画布尺寸（不受当前缩放影响） */
	internalModel: { originalWidth: number; originalHeight: number }
}

const CDN_SCRIPTS = [
	'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/6.2.0/browser/pixi.min.js',
	'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
	'https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/cubism4.min.js'
]

const MODEL_URL = '/live2d/火花LIVE2D.model3.json'

function loadScript(src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		if (document.querySelector(`script[src="${src}"]`)) {
			resolve()
			return
		}
		const script = document.createElement('script')
		script.src = src
		script.crossOrigin = 'anonymous'
		script.onload = () => resolve()
		script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
		document.head.appendChild(script)
	})
}

export default function Live2DViewer() {
	const containerRef = useRef<HTMLDivElement>(null)
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
	const [errorMsg, setErrorMsg] = useState<string>('')

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		let app: PixiAppInstance | null = null
		let model: Live2DModelInstance | null = null

		/** 按容器尺寸等比缩放模型并居中，保证完整可见（宽/高较小的一侧决定缩放比） */
		const fitModel = () => {
			if (!app || !model) return
			const width = container.clientWidth || 500
			const height = container.clientHeight || 500
			app.renderer.resize(width, height)
			// 用模型的原始尺寸计算缩放比
			const { originalWidth, originalHeight } = model.internalModel
			const fit =
				originalWidth > 0 && originalHeight > 0
					? Math.min(width / originalWidth, height / originalHeight) * 0.95
					: 0.18
			model.scale.set(fit, fit)
			model.x = width / 2
			model.y = height / 2
		}

		const init = async () => {
			try {
				for (const src of CDN_SCRIPTS) {
					await loadScript(src)
				}

				const PIXI = (window as unknown as { PIXI: unknown }).PIXI
				if (!PIXI) {
					throw new Error('PIXI not found on window')
				}
				;(window as unknown as { PIXI: unknown }).PIXI = PIXI

				const PIXIApp = (
					PIXI as { Application: new (opts: { view: HTMLCanvasElement; width?: number; height?: number; backgroundAlpha?: number; resolution?: number; autoDensity?: boolean }) => PixiAppInstance }
				).Application

				const Live2DModel = (PIXI as { live2d?: { Live2DModel: { from: (url: string) => Promise<Live2DModelInstance> } } }).live2d?.Live2DModel

				if (!Live2DModel) {
					throw new Error('PIXI.live2d.Live2DModel not found')
				}

				const width = container.clientWidth || 500
				const height = container.clientHeight || 500
				const canvas = document.createElement('canvas')
				canvas.style.display = 'block'
				// 模型纯展示、无交互需求：触摸/点击全部穿透，避免拦截手机端页面滚动
				// canvas.style.pointerEvents = 'none'
				container.appendChild(canvas)

				app = new PIXIApp({
					view: canvas,
					width,
					height,
					backgroundAlpha: 0,
					// 移动端高分屏按 DPR 渲染（上限 2），否则模型会发虚
					resolution: Math.min(window.devicePixelRatio || 1, 2),
					autoDensity: true
				})

				model = await Live2DModel.from(MODEL_URL)
				app.stage.addChild(model)

				model.anchor.set(0.5, 0.5)
				fitModel()

				window.addEventListener('resize', handleResize)
				window.addEventListener('orientationchange', handleResize)

				setStatus('ready')
			} catch (err) {
				setErrorMsg(err instanceof Error ? err.message : String(err))
				setStatus('error')
			}
		}

		// 等布局完成后重新适配（旋转屏幕 / 地址栏收起都会改变容器尺寸）
		const handleResize = () => {
			window.requestAnimationFrame(fitModel)
		}

		init()

		return () => {
			window.removeEventListener('resize', handleResize)
			window.removeEventListener('orientationchange', handleResize)
			if (app !== null && typeof app === 'object' && 'destroy' in app && typeof app.destroy === 'function') {
				app.destroy({ removeView: true })
			}
			app = null
			model = null
			container.innerHTML = ''
		}
	}, [])

	return (
		<div className='relative w-full h-full'>
			<div ref={containerRef} className='absolute inset-0 h-full w-full' />
			{status === 'loading' && <div className='text-(--status-text-muted) absolute inset-0 flex items-center justify-center'>加载 Live2D 模型中…</div>}
			{status === 'error' && <div className='absolute inset-0 flex items-center justify-center p-4 text-center text-red-500'>{errorMsg}</div>}
		</div>
	)
}
