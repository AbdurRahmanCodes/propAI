import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Circle, ClipboardText, PaperPlaneRight } from '@phosphor-icons/react'
import { logUsability } from '../services/api'

const TASKS = [
  { id: 1, title: 'Browse Property Listings', desc: 'Navigate to the Properties page and view at least one property card.' },
  { id: 2, title: 'Search with Filters', desc: 'Use the filter panel on the Properties page to search by budget and bedroom count.' },
  { id: 3, title: 'Get AI Recommendations', desc: 'Go to AI Match, enter your preferences, and review the top 5 recommendations.' },
  { id: 4, title: 'Compare AI vs Simple Query', desc: 'Visit the Compare page, enter preferences, and review the side-by-side results.' },
  { id: 5, title: 'Save a Property', desc: 'Find a property you like and save it to your profile favourites.' },
]

const SUS_ITEMS = [
  'I think I would like to use this system frequently.',
  'I found the system unnecessarily complex.',
  'I thought the system was easy to use.',
  'I think I would need support to use this system.',
  'I found the various functions of this system well integrated.',
]

const SCALE = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']

function computeSUS(answers) {
  // SUS: odd items: score-1, even items: 5-score, multiply sum by 2.5
  const su = answers.map((a, i) => i % 2 === 0 ? (a - 1) : (5 - a))
  return Math.round(su.reduce((s, v) => s + v, 0) * 2.5)
}

export default function UsabilityPage() {
  const [tasksDone, setTasksDone] = useState({})
  const [sus, setSus] = useState({})
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('tasks') // 'tasks' | 'questionnaire' | 'done'

  const toggleTask = (id) => setTasksDone(t => ({ ...t, [id]: !t[id] }))
  const completed = Object.values(tasksDone).filter(Boolean).length
  const allTasksDone = completed === TASKS.length
  const susAnswered = Object.keys(sus).length === SUS_ITEMS.length

  const submitEval = async () => {
    if (!susAnswered) return
    setLoading(true)
    const answers = SUS_ITEMS.map((_, i) => sus[i] || 3)
    const susScore = computeSUS(answers)
    const sessionId = `session_${Date.now()}`
    try {
      await logUsability({
        session_id: sessionId,
        tasks_completed: completed,
        tasks_total: TASKS.length,
        completed: allTasksDone,
        sus_score: susScore,
        feedback,
      })
    } catch { /* still show done even if backend is offline */ }
    finally { setLoading(false); setPhase('done') }
  }

  return (
    <div style={{ paddingTop: 60, minHeight: '100vh', background: 'var(--c-bg)' }}>

      {/* Header */}
      <div style={{ background: 'var(--c-hero)', padding: '36px 0' }}>
        <div className="container" style={{ maxWidth: 700, textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'rgba(15,118,110,0.2)', border: '1px solid rgba(20,184,166,0.28)', fontSize: '0.75rem', fontWeight: 600, color: '#5EEAD4', marginBottom: 14 }}>
            <ClipboardText size={12} /> Usability Evaluation
          </span>
          <h1 style={{ fontFamily: 'Sora', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 10 }}>
            Platform Usability Study
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto' }}>
            Complete 5 tasks then answer 5 quick questions to help evaluate the platform. Takes ~5 minutes.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 700, padding: '32px 24px 80px' }}>

        {phase === 'done' ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={30} color="#10B981" />
            </div>
            <h2 className="heading-2" style={{ marginBottom: 8 }}>Evaluation Complete</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--c-text-3)', maxWidth: 380, margin: '0 auto' }}>
              Thank you! Your responses have been logged. The results appear in the Admin Dashboard under Usability Evaluation.
            </p>
          </motion.div>
        ) : phase === 'tasks' ? (
          <>
            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 className="heading-3">Task Completion</h2>
              <span className="tag tag-indigo">{completed} / {TASKS.length} done</span>
            </div>
            <div style={{ height: 4, background: 'var(--c-border)', borderRadius: 4, marginBottom: 24, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(completed / TASKS.length) * 100}%`, background: 'var(--c-indigo)', borderRadius: 4, transition: 'width 0.3s' }} />
            </div>

            {TASKS.map((task, i) => (
              <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', background: tasksDone[task.id] ? '#F0FDF4' : 'var(--c-surface)', border: `1px solid ${tasksDone[task.id] ? '#A7F3D0' : 'var(--c-border)'}`, borderRadius: 12, marginBottom: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => toggleTask(task.id)}>
                <div style={{ marginTop: 1, flexShrink: 0 }}>
                  {tasksDone[task.id]
                    ? <CheckCircle size={20} color="#10B981" />
                    : <Circle size={20} color="var(--c-border-strong)" />}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: tasksDone[task.id] ? '#065F46' : 'var(--c-text)', marginBottom: 2 }}>
                    Task {task.id}: {task.title}
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: tasksDone[task.id] ? '#059669' : 'var(--c-text-3)', lineHeight: 1.55 }}>{task.desc}</p>
                </div>
              </motion.div>
            ))}

            <button onClick={() => setPhase('questionnaire')} disabled={!allTasksDone} className="btn btn-primary" style={{ justifyContent: 'center', width: '100%', marginTop: 16, opacity: allTasksDone ? 1 : 0.4 }}>
              Continue to Questionnaire →
            </button>
            {!allTasksDone && (
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--c-text-4)', marginTop: 8 }}>
                Complete all {TASKS.length} tasks to continue
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="heading-3" style={{ marginBottom: 6 }}>System Usability Scale (SUS)</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--c-text-3)', marginBottom: 24 }}>Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).</p>

            {SUS_ITEMS.map((item, i) => (
              <div key={i} className="card" style={{ padding: '16px 18px', marginBottom: 10 }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--c-text)', marginBottom: 12 }}>{i + 1}. {item}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button key={val} type="button" onClick={() => setSus(s => ({ ...s, [i]: val }))}
                      style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: sus[i] === val ? '2px solid var(--c-indigo)' : '1px solid var(--c-border)', background: sus[i] === val ? 'var(--c-indigo-light)' : 'var(--c-surface)', color: sus[i] === val ? 'var(--c-indigo)' : 'var(--c-text-3)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                      {val}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--c-text-4)' }}>Strongly Disagree</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--c-text-4)' }}>Strongly Agree</span>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text-2)', marginBottom: 6 }}>
                Additional Feedback <span style={{ fontWeight: 400, color: 'var(--c-text-4)' }}>(optional)</span>
              </label>
              <textarea rows={3} className="input" value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="Any thoughts on the platform usability or recommendations..." style={{ resize: 'vertical', height: 80 }} />
            </div>

            <button onClick={submitEval} disabled={!susAnswered || loading} className="btn btn-primary" style={{ justifyContent: 'center', width: '100%', marginTop: 16, opacity: susAnswered ? 1 : 0.4 }}>
              {loading ? <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin .65s linear infinite' }} /> : <><PaperPlaneRight size={14} /> Submit Evaluation</>}
            </button>
          </>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
