import { motion } from 'motion/react'
import cardStylesDefault from '@/config/card-styles-default.json'
import { ANIMATION_DELAY } from '@/consts'
import { useCenterStore } from '@/hooks/use-center'
import { useSize } from '@/hooks/use-size'
import { HomeDraggableLayer } from './home-draggable-layer'
import { useConfigStore } from './stores/config-store'

const PROJECT_BUTTONS = [
	{ cardKey: 'sakuraButton', href: '/sakura', label: '魔卡少女樱' },
	{ cardKey: 'nahidaButton', href: '/nahida1027', label: '浇灌一棵世界树' }
] as const

export default function ProjectButtons() {
	const center = useCenterStore()
	const { maxSM } = useSize()
	const cardStyles = useConfigStore(state => state.cardStyles)
	const visibleButtons = PROJECT_BUTTONS.filter(({ cardKey }) => cardStyles[cardKey].enabled !== false)

	if (visibleButtons.length === 0) return null

	return (
		<div className='contents max-sm:flex max-sm:gap-3'>
			{visibleButtons.map(({ cardKey, href, label }) => {
				const { width, height, offsetX, offsetY, order, icon } = cardStyles[cardKey]
				const defaults = cardStylesDefault[cardKey]
				const x = center.x + (offsetX ?? defaults.offsetX)
				const y = center.y + (offsetY ?? defaults.offsetY)

				return (
					<HomeDraggableLayer key={cardKey} cardKey={cardKey} x={x} y={y} width={width} height={height}>
						{/* 子站由各自的路由提供服务，使用原生链接发起页面导航。 */}
						<motion.a
							href={href}
							aria-label={label}
							title={label}
							initial={{ opacity: 0, scale: 0.6 }}
							animate={{ opacity: 1, scale: 1, transition: { delay: maxSM ? 0 : order * ANIMATION_DELAY } }}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							style={{ left: x, top: y, width, height }}
							className='card focus-visible:outline-brand flex shrink-0 items-center justify-center rounded-xl p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 max-sm:static'>
							<img src={icon?.trim() || defaults.icon} alt='' className='size-8 max-h-full max-w-full object-contain' />
						</motion.a>
					</HomeDraggableLayer>
				)
			})}
		</div>
	)
}
