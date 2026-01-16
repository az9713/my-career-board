'use client'

interface MoodSelectorProps {
  value: number | null
  onChange: (mood: number) => void
}

const moods = [
  { value: 1, emoji: '😞', label: 'Very Low' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
]

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex gap-2 justify-center">
      {moods.map((mood) => (
        <button
          key={mood.value}
          type="button"
          onClick={() => onChange(mood.value)}
          aria-label={`Mood ${mood.value}`}
          className={`
            w-10 h-10 rounded-full text-xl flex items-center justify-center
            transition-all hover:scale-110
            ${
              value === mood.value
                ? 'ring-2 ring-blue-500 bg-slate-600'
                : 'bg-slate-700 hover:bg-slate-600'
            }
          `}
        >
          {mood.emoji}
        </button>
      ))}
    </div>
  )
}
