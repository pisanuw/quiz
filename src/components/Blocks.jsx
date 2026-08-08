// The shared visual unit of the site: one block, one question.
// Also used on the home page where one block is ten percent of your happiness.
export default function Blocks({ filled, total, tone = 'marigold', size = 'sm', label }) {
  const height = size === 'lg' ? 'h-6' : size === 'md' ? 'h-3' : 'h-2'
  const tones = {
    marigold: 'bg-marigold',
    evergreen: 'bg-evergreen',
    clay: 'bg-clay'
  }
  return (
    <div className="flex items-center gap-[3px]" role="img" aria-label={label ?? `${filled} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`flex-1 ${height} rounded-[1px] ${i < filled ? tones[tone] : 'bg-line'}`}
        />
      ))}
    </div>
  )
}
