'use client'

interface Skill {
  id: string
  name: string
  category: string
  proficiency: number
}

interface SkillsMatrixProps {
  skills: Skill[]
  onSkillClick?: (skill: Skill) => void
}

export function SkillsMatrix({ skills, onSkillClick }: SkillsMatrixProps) {
  if (skills.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No skills yet. Add your first skill to build your skills matrix.
      </div>
    )
  }

  // Group skills by category
  const byCategory = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {})

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'border-blue-500'
      case 'soft-skill':
        return 'border-purple-500'
      case 'domain':
        return 'border-green-500'
      case 'tool':
        return 'border-orange-500'
      default:
        return 'border-slate-500'
    }
  }

  const getProficiencyColor = (proficiency: number) => {
    if (proficiency >= 4) return 'bg-green-500'
    if (proficiency >= 3) return 'bg-blue-500'
    if (proficiency >= 2) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {Object.entries(byCategory).map(([category, categorySkills]) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
            {category}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categorySkills.map((skill) => (
              <div
                key={skill.id}
                onClick={() => onSkillClick?.(skill)}
                className={`bg-slate-800 rounded-lg border-l-4 ${getCategoryColor(category)} p-3 cursor-pointer hover:bg-slate-750 transition-colors`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">{skill.name}</span>
                  <div className={`w-2 h-2 rounded-full ${getProficiencyColor(skill.proficiency)}`} />
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full ${
                        level <= skill.proficiency ? 'bg-blue-500' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
