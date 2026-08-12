// A player's mark on the board: their photo if they turned it on, otherwise
// their initials. The board never receives a photo URL for anyone who has not
// opted in, so this falls back on absence rather than on a preference flag.
const SIZES = {
  sm: 'w-7 h-7 text-[0.6rem]',
  md: 'w-9 h-9 text-[0.7rem]',
  lg: 'w-14 h-14 text-base'
}

export default function Avatar({ name, src, size = 'sm', className = '' }) {
  const box = `${SIZES[size]} rounded-full border border-line shrink-0 ${className}`

  if (src) {
    return <img src={src} alt="" className={`${box} object-cover`} />
  }

  return (
    <span
      aria-hidden="true"
      className={`${box} bg-evergreen text-raised font-mono font-medium tracking-tight flex items-center justify-center select-none`}
    >
      {(name || '?').slice(0, 2).toUpperCase()}
    </span>
  )
}
