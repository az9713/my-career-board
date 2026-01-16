'use client'

interface Skill {
  id: string
  name: string
  category: string
  proficiency: number
  targetLevel?: number | null
  yearsExperience?: number | null
}

interface SkillCardProps {
  skill: Skill
  onEdit?: (skill: Skill) => void
}

export function SkillCard({ skill, onEdit }: SkillCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-blue-500/20 text-blue-300'
      case 'soft-skill':
        return 'bg-purple-500/20 text-purple-300'
      case 'domain':
        return 'bg-green-500/20 text-green-300'
      case 'tool':
        return 'bg-orange-500/20 text-orange-300'
      default:
        return 'bg-slate-500/20 text-slate-300'
    }
  }

  const proficiencyPercentage = (skill.proficiency / 5) * 100
  const targetPercentage = skill.targetLevel ? (skill.targetLevel / 5) * 100 : null

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-medium text-white">{skill.name}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(skill.category)}`}>
          {skill.category}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-400">Proficiency</span>
          <span className="text-white">{skill.proficiency}/{skill.targetLevel || 5}</span>
        </div>
        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
          {targetPercentage && (
            <div
              className="absolute h-full bg-slate-600 rounded-full"
              style={{ width: `${targetPercentage}%` }}
            />
          )}
          <div
            className="absolute h-full bg-blue-500 rounded-full"
            style={{ width: `${proficiencyPercentage}%` }}
          />
        </div>
      </div>

      {skill.yearsExperience && (
        <div className="text-sm text-slate-400 mb-3">
          {skill.yearsExperience} years experience
        </div>
      )}

      {onEdit && (
        <button
          onClick={() => onEdit(skill)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Edit
        </button>
      )}
    </div>
  )
}
