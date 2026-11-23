import { create } from 'zustand'
import siteContent from '@/config/site-content.json'
import cardStyles from '@/config/card-styles.json'
import cardStylesDefault from '@/config/card-styles-default.json'

export type SiteContent = typeof siteContent
type CardStyleConfig = typeof cardStylesDefault
export type CardStyles = {
	[Key in keyof CardStyleConfig]: Omit<CardStyleConfig[Key], 'offsetX' | 'offsetY'> & {
		offsetX: number | null
		offsetY: number | null
	}
}

// 旧版布局配置可能没有新版加入的条目，先用默认配置补齐。
const initialCardStyles: CardStyles = { ...cardStylesDefault, ...cardStyles }

interface ConfigStore {
	siteContent: SiteContent
	cardStyles: CardStyles
	regenerateKey: number
	configDialogOpen: boolean
	setSiteContent: (content: SiteContent) => void
	setCardStyles: (styles: CardStyles) => void
	resetSiteContent: () => void
	resetCardStyles: () => void
	regenerateBubbles: () => void
	setConfigDialogOpen: (open: boolean) => void
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
	siteContent: { ...siteContent },
	cardStyles: { ...initialCardStyles },
	regenerateKey: 0,
	configDialogOpen: false,
	setSiteContent: (content: SiteContent) => {
		set({ siteContent: content })
	},
	setCardStyles: (styles: CardStyles) => {
		set({ cardStyles: styles })
	},
	resetSiteContent: () => {
		set({ siteContent: { ...siteContent } })
	},
	resetCardStyles: () => {
		set({ cardStyles: { ...initialCardStyles } })
	},
	regenerateBubbles: () => {
		set(state => ({ regenerateKey: state.regenerateKey + 1 }))
	},
	setConfigDialogOpen: (open: boolean) => {
		set({ configDialogOpen: open })
	}
}))

