'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import s from './page.module.scss'
import { ThermometerIcon } from '@/components/icons'
import { Loader } from '@/components/Loader'
import { useStatusModal } from '@/components/StatusModal'

interface QuestionOption {
  value: string
  label: string
  weight?: number
}

interface Question {
  id: string
  question: string
  category?: string
  options: QuestionOption[]
}

interface TriageResult {
  severity: 'low' | 'medium' | 'high' | 'emergency'
  recommendation: string
  suggestedSpecialty?: string
}

const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 'q_general',
    question: 'How would you describe your overall condition right now?',
    options: [
      { value: 'fine',     label: 'I feel fine, just a minor concern' },
      { value: 'unwell',   label: 'I feel unwell but can manage' },
      { value: 'bad',      label: 'I feel quite bad' },
      { value: 'very_bad', label: 'I feel very bad / in distress' },
    ],
  },
  {
    id: 'q_duration',
    question: 'How long have you been experiencing these symptoms?',
    options: [
      { value: 'hours',  label: 'Less than 24 hours' },
      { value: 'days',   label: '1–3 days' },
      { value: 'week',   label: '4–7 days' },
      { value: 'weeks',  label: 'More than a week' },
    ],
  },
  {
    id: 'q_severity',
    question: 'How severe are your symptoms?',
    options: [
      { value: 'mild',      label: 'Mild — not interfering with daily life' },
      { value: 'moderate',  label: 'Moderate — affecting some activities' },
      { value: 'severe',    label: 'Severe — significantly limiting me' },
      { value: 'emergency', label: 'Very severe — I may need emergency care' },
    ],
  },
  {
    id: 'q_breathing',
    question: 'Are you experiencing any breathing difficulties?',
    options: [
      { value: 'none',     label: 'No breathing difficulties' },
      { value: 'mild',     label: 'Slight shortness of breath on exertion' },
      { value: 'moderate', label: 'Shortness of breath at rest' },
      { value: 'severe',   label: 'Severe difficulty breathing / gasping' },
    ],
  },
  {
    id: 'q_chest',
    question: 'Are you experiencing chest pain or tightness?',
    options: [
      { value: 'none',     label: 'No chest pain' },
      { value: 'mild',     label: 'Mild chest discomfort' },
      { value: 'moderate', label: 'Moderate chest pain' },
      { value: 'severe',   label: 'Severe crushing chest pain / pressure' },
    ],
  },
]

export default function PatientTriage () {
  const router = useRouter()
  const modal = useStatusModal()
  const [questions,   setQuestions]  = useState<Question[]>(FALLBACK_QUESTIONS)
  const [answers,     setAnswers]    = useState<Record<string, string>>({})
  const [sessionId,   setSessionId]  = useState<string | null>(null)
  const [step,        setStep]       = useState(0)
  const [starting,    setStarting]   = useState(false)
  const [submitting,  setSubmitting] = useState(false)
  const [result,      setResult]     = useState<TriageResult | null>(null)
  const [phase,       setPhase]      = useState<'intro' | 'questions' | 'done'>('intro')

  useEffect(() => {
    api.get('/triage/questions')
      .then(r => {
        const qs: Question[] = r.data.data?.questions
        if (qs?.length) setQuestions(qs)
      })
      .catch(() => {})
  }, [])

  async function startTriage () {
    setStarting(true)
    try {
      const r = await api.post('/triage/start', {})
      setSessionId(r.data.data?.sessionId ?? null)
      if (r.data.data?.questions?.length) setQuestions(r.data.data.questions)
    } catch { }
    setPhase('questions')
    setStep(0)
    setStarting(false)
  }

  function setAnswer (id: string, val: string) {
    setAnswers(prev => ({ ...prev, [id]: val }))
  }

  async function submit (e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }))

      let triageResult: TriageResult | null = null

      if (sessionId) {
        const r = await api.post('/triage/answer', { sessionId, answers: answerArray })
        const session = r.data.data?.session

        if (session) {
          const classMap: Record<string, TriageResult['severity']> = {
            red:    'emergency',
            yellow: 'medium',
            green:  'low',
          }
          triageResult = {
            severity:      classMap[session.classification] ?? 'low',
            recommendation: session.recommendedAction ?? 'Monitor your symptoms.',
          }
        }
      }

      if (!triageResult) {
        const sevAnswer = answers['q_severity'] ?? answers['q3'] ?? ''
        let severity: TriageResult['severity'] = 'low'
        let recommendation = 'Monitor your symptoms at home and rest well.'

        if (sevAnswer === 'emergency' || answers['q_chest'] === 'severe' || answers['q5'] === 'severe') {
          severity = 'emergency'
          recommendation = 'Seek emergency care immediately.'
        } else if (sevAnswer === 'severe' || sevAnswer === 'moderate') {
          severity = 'medium'
          recommendation = 'See a doctor within 24–48 hours.'
        }

        triageResult = { severity, recommendation }
      }

      setResult(triageResult)
      setPhase('done')
    } catch {
      modal.show({
        variant: 'declined',
        title: 'Submission Failed',
        message: 'Could not submit your triage. Please try again.',
        actionLabel: 'Try Again',
      })
    }
    setSubmitting(false)
  }

  const q = questions[step]
  const canNext = !!(q && answers[q.id])

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
        {starting ? <Loader inline size='sm' /> : 'Start Symptom Check'}
      </button>
    </div>
  )

  return (
    <form
      className={s.questionWrap}
      onSubmit={step < questions.length - 1
        ? (e) => { e.preventDefault(); setStep(prev => prev + 1) }
        : submit
      }
    >
      <div className={s.progress}>
        <div className={s.progressBar} style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
      </div>
      <p className={s.stepLabel}>Question {step + 1} of {questions.length}</p>

      <div className={s.question}>
        <h3>{q.question}</h3>

        <div className={s.optionList}>
          {q.options?.map(opt => (
            <label
              key={opt.value}
              className={`${s.option} ${answers[q.id] === opt.value ? s.optionActive : ''}`}
            >
              <input
                type='radio'
                name={q.id}
                value={opt.value}
                checked={answers[q.id] === opt.value}
                onChange={() => setAnswer(q.id, opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
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
          {step < questions.length - 1
            ? 'Next →'
            : submitting
              ? <Loader inline size='sm' />
              : 'Get Results'
          }
        </button>
      </div>
    </form>
  )
}
