import { motion } from 'motion/react'
import { useTheme } from '@/lib/hooks'

/**
 * Sun / moon toggle. The icon is a single circle with a travelling mask — the
 * moon is the sun with a bite taken out of it — and the palette swap wipes
 * outward from wherever the button happens to be.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={dark}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
      }}
      className={`group relative grid size-10 place-items-center rounded-full border border-line
        text-ink transition-colors duration-300 hover:border-accent hover:text-accent
        group-data-[over=true]/head:border-beige/40 group-data-[over=true]/head:text-beige
        group-data-[over=true]/head:hover:border-champagne group-data-[over=true]/head:hover:text-champagne ${className ?? ''}`}
    >
      <svg viewBox="0 0 24 24" className="size-[18px] overflow-visible">
        <defs>
          <mask id="theme-bite">
            <rect width="24" height="24" fill="#fff" />
            {/* Static cx/cy/r are required: motion only writes these
                presentation attributes once an animation resolves, and the
                first paint would otherwise set them to "undefined". */}
            <motion.circle
              cx={26}
              cy={0}
              r="8"
              fill="#000"
              initial={false}
              animate={{ cx: dark ? 15 : 26, cy: dark ? 6 : 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </mask>
        </defs>

        <motion.circle
          cx="12"
          cy="12"
          r={5.2}
          fill="currentColor"
          mask="url(#theme-bite)"
          initial={false}
          animate={{ r: dark ? 9 : 5.2 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />

        <motion.g
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          animate={{ opacity: dark ? 0 : 1, rotate: dark ? -60 : 0, scale: dark ? 0.5 : 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: '12px 12px' }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="12"
              y1="1.6"
              x2="12"
              y2="4"
              transform={`rotate(${deg} 12 12)`}
            />
          ))}
        </motion.g>
      </svg>
    </button>
  )
}
