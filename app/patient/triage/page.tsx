'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import s from './page.module.scss'
import { ThermometerIcon } from '@/components/icons'

interface Question {
  id: string
  text: string
  type: 'text' | 'select' | 'multi'
  options?: string[]
}

interface TriageResult {
  _id: string
  severity: 'low' | 'medium' | 'high' | 'emergency'
  recommendation: string
  suggestedSpecialty?: string
  summary?: string
}

const FALLBACK_QUESTIONS: Question[] = [
  { id: 'main_symptom',   text: 'What is your main symptom?',                    type: 'text' },
  { id: 'duration',       text: 'How long have you had this symptom?',             type: 'select', options: ['Less than 24 hours', '1-3 days', '4-7 days', 'More than a week', 'More than a month'] },
  { id: 'severity',       text: 'How would you rate the severity? (1 = mild, 10 = severe)', type: 'select', options: ['1-2 (Mild)', '3-4', '5-6 (Moderate)', '7-8', '9-10 (Severe)'] },
  { id: 'associated',     text: 'Any associated symptoms?',                        type: 'multi', options: ['Fever', 'Headache', 'Vomiting', 'Diarrhoea', 'Chest pain', 'Shortness of breath', 'Dizziness', 'Rash', 'Joint pain', 'None'] },
  { id: 'medical_history',text: 'Any relevant medical history?',                   type: 'multi', options: ['Diabetes', 'Hypertension', 'Asthma', 'HIV/AIDS', 'Heart disease', 'Kidney disease', 'None'] },
]

export default function PatientTriage () {
  const router = useRouter()
  const [questions, setQuestions]   = useState<Question[]>(FALLBACK_QUESTIONS)
  const [answers,   setAnswers]     = useState<Record<string, string | string[]>>({})
  const [triageId,  setTriageId]    = useState<string | null>(null)
  const [step,      setStep]        = useState(0)
  const [starting,  setStarting]    = useState(false)
  const [submitting,setSubmitting]  = useState(false)
  const [result,    setResult]      = useState<TriageResult | null>(null)
  const [phase,     setPhase]       = useState<'intro' | 'questions' | 'done'>('intro')

  useEffect(() => {
    api.get('/triage/questions')
      .then(r => {
        const qs = r.data.data?.questions
        if (qs?.length) setQuestions(qs)
      })
      .catch(() => {})
  }, [])

  async function startTriage () {
    setStarting(true)
    try {
      const r = await api.post('/triage/start', { symptoms: ['general'] })
      setTriageId(r.data.data?.triage?._id ?? null)
    } catch { }
    setPhase('questions')
    setStep(0)
    setStarting(false)
  }

  function setAnswer (id: string, val: string | string[]) {
    setAnswers(prev => ({ ...prev, [id]: val }))
  }

  function toggleMulti (id: string, opt: string) {
    const curr = (answers[id] as string[] | undefined) ?? []
    setAnswer(id, curr.includes(opt) ? curr.filter(v => v !== opt) : [...curr, opt])
  }

  async function submit (e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer: Array.isArray(answer) ? answer.join(', ') : answer,
      }))

      let triageResult: TriageResult | null = null

      if (triageId) {
        const r = await api.post('/triage/answer', { triageId, answers: answerArray })
        triageResult = r.data.data?.result ?? r.data.data?.triage
      }

      if (!triageResult) {
        const main = (answers['main_symptom'] as string ?? '').toLowerCase()
        const sev  = answers['severity'] as string ?? ''
        let severity: TriageResult['severity'] = 'low'
        let recommendation = 'Monitor your symptoms at home and rest well.'
        let suggestedSpecialty = 'General Practitioner'

        if (sev.includes('9-10') || main.includes('chest pain') || main.includes('shortness')) {
          severity = 'emergency'
          recommendation = 'Seek emergency care immediately.'
          suggestedSpecialty = 'Emergency Medicine'
        } else if (sev.includes('7-8') || sev.includes('5-6')) {
          severity = 'medium'
          recommendation = 'See a doctor within 24–48 hours.'
        }

        triageResult = { _id: 'local', severity, recommendation, suggestedSpecialty }
      }

      setResult(triageResult)
      setPhase('done')
    } catch { }
    setSubmitting(false)
  }

  const q = questions[step]
  const canNext = answers[q?.id] !== undefined && (Array.isArray(answers[q?.id]) ? (answers[q?.id] as string[]).length > 0 : (answers[q?.id] as string).trim().length > 0)

  const SEVERITY_COLOR: Record<string, string> = {
    low:       s.low,
    medium:    s.medium,
    high:      s.high,
    emergency: s.emergency,
  }

  if (phase === 'done' && result) return (
    <div className={s.result}>
      <div className={`${s.severityBadge} ${SEVERITY_COLOR[result.severity]}`}>
        {result.severity.toUpperCase()}
      </div>
      <h2>Triage Complete</h2>
      <p className={s.recommendation}>{result.recommendation}</p>
      {result.suggestedSpecialty && (
        <p className={s.specialty}>Suggested specialty: <strong>{result.suggestedSpecialty}</strong></p>
      )}
      {result.summary && <p className={s.summary}>{result.summary}</p>}
      <div className={s.resultActions}>
        {result.severity !== 'low' && (
          <button className={s.bookBtn} onClick={() => router.push('/patient/book')}>
            Book a Doctor Now
          </button>
        )}
        <button className={s.restartBtn} onClick={() => { setPhase('intro'); setAnswers({}); setStep(0); setResult(null) }}>
          Start Over
        </button>
      </div>
    </div>
  )

  if (phase === 'intro') return (
    <div className={s.intro}>
      <div className={s.introIcon}><ThermometerIcon size={48} /></div>
      <h2>Symptom Checker</h2>
      <p>Answer a few quick questions and we'll assess your symptoms and recommend next steps.</p>
      <ul className={s.introList}>
        <li>Takes about 2 minutes</li>
        <li>Powered by clinical triage guidelines</li>
        <li>Results guide you to the right care</li>
      </ul>
      <button className={s.startBtn} onClick={startTriage} disabled={starting}>
        {starting ? 'Starting…' : 'Start Symptom Check'}
      </button>
    </div>
  )

  return (
    <form className={s.questionWrap} onSubmit={step < questions.length - 1 ? (e) => { e.preventDefault(); setStep(prev => prev + 1) } : submit}>
      <div className={s.progress}>
        <div className={s.progressBar} style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
      </div>
      <p className={s.stepLabel}>Question {step + 1} of {questions.length}</p>

      <div className={s.question}>
        <h3>{q.text}</h3>

        {q.type === 'text' && (
          <input
            className={s.textInput}
            value={(answers[q.id] as string) ?? ''}
            onChange={e => setAnswer(q.id, e.target.value)}
            placeholder='Describe your symptom…'
            autoFocus
          />
        )}

        {q.type === 'select' && (
          <div className={s.optionList}>
            {q.options?.map(opt => (
              <label key={opt} className={`${s.option} ${answers[q.id] === opt ? s.optionActive : ''}`}>
                <input type='radio' name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswer(q.id, opt)} />
                {opt}
              </label>
            ))}
          </div>
        )}

        {q.type === 'multi' && (
          <div className={s.optionList}>
            {q.options?.map(opt => {
              const checked = ((answers[q.id] as string[]) ?? []).includes(opt)
              return (
                <label key={opt} className={`${s.option} ${checked ? s.optionActive : ''}`}>
                  <input type='checkbox' checked={checked} onChange={() => toggleMulti(q.id, opt)} />
                  {opt}
                </label>
              )
            })}
          </div>
        )}
      </div>

      <div className={s.nav}>
        {step > 0 && (
          <button type='button' className={s.backBtn} onClick={() => setStep(prev => prev - 1)}>← Back</button>
        )}
        <button
          type='submit'
          className={s.nextBtn}
          disabled={!canNext || submitting}
        >
          {step < questions.length - 1 ? 'Next →' : submitting ? 'Analysing…' : 'Get Results'}
        </button>
      </div>
    </form>
  )
}
