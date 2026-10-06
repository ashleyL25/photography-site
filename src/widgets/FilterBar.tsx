import clsx from 'clsx'

export interface FilterOption {
  id: string
  label: string
  count?: number
}

/**
 * The bar above a listing: its filters, in one of three styles, and an
 * optional search field. Sticky, so it stays reachable while you scroll —
 * `top-16` matches the scrolled header's height.
 */
export function FilterBar({
  options,
  value,
  onChange,
  style = 'pills',
  search,
  onSearch,
  searchPlaceholder = 'Search',
  showFilters = true,
}: {
  options: FilterOption[]
  value: string
  onChange: (id: string) => void
  style?: string
  search?: string
  onSearch?: (value: string) => void
  searchPlaceholder?: string
  showFilters?: boolean
}) {
  const hasSearch = typeof search === 'string' && onSearch
  if (!showFilters && !hasSearch) return null

  return (
    <div className="sticky top-16 z-40 border-y border-line bg-canvas/90 backdrop-blur-xl">
      <div className="shell flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
        {showFilters && options.length > 1 && (
          <div className="min-w-0 flex-1">
            {style === 'dropdown' ? (
              <label className="relative inline-flex items-center">
                <span className="sr-only">Filter</span>
                <select
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="label cursor-pointer appearance-none rounded-full border border-line bg-transparent py-2.5 pr-10 pl-5 text-ink outline-none focus:border-accent"
                >
                  {options.map((o) => (
                    <option key={o.id} value={o.id} className="bg-canvas text-ink">
                      {o.label}
                      {typeof o.count === 'number' ? ` (${o.count})` : ''}
                    </option>
                  ))}
                </select>
                <span aria-hidden className="pointer-events-none absolute right-4 text-faint">
                  ▾
                </span>
              </label>
            ) : (
              <div
                className={clsx(
                  'flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                  style === 'rail' ? 'gap-7' : 'gap-2',
                )}
              >
                {options.map((o) => {
                  const on = value === o.id
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => onChange(o.id)}
                      aria-pressed={on}
                      className={clsx(
                        'label relative shrink-0 whitespace-nowrap transition-colors duration-400',
                        style === 'rail'
                          ? clsx('border-b py-2', on ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink')
                          : clsx('rounded-full border px-5 py-2.5', on ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'),
                      )}
                    >
                      {o.label}
                      {typeof o.count === 'number' && <span className="ml-2 text-[0.9em] opacity-50">{o.count}</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {hasSearch && (
          <label className="relative ml-auto w-full sm:w-64">
            <span className="sr-only">{searchPlaceholder}</span>
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch!(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-full border border-line bg-transparent py-2.5 pr-4 pl-10 text-[0.95rem] text-ink outline-none placeholder:text-faint focus:border-accent"
            />
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-faint" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="6.5" strokeWidth="1.5" />
              <path d="m16 16 4.5 4.5" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </label>
        )}
      </div>
    </div>
  )
}

/** The "Load more" button under a listing. */
export function LoadMore({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="mt-20 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="cta cta-primary"
      >
        {label}
      </button>
    </div>
  )
}
