'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'

interface SubscriptionPlan {
  _id: string
  name: string
  description?: string
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
  isActive: boolean
  featured: boolean
  paystackPlanCode?: string
}

interface ActiveSubscription {
  _id: string
  plan: SubscriptionPlan
  status: 'active' | 'cancelled'
  nextBillingDate?: string
  createdAt: string
}

function formatPrice (price: number, interval: string) {
  return `₦${price.toLocaleString('en-NG')}/${interval === 'yearly' ? 'yr' : 'mo'}`
}

function formatDate (iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SubscriptionsPage () {
  const modal = useStatusModal()
  const [plans,       setPlans]       = useState<SubscriptionPlan[]>([])
  const [current,     setCurrent]     = useState<ActiveSubscription | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [cancelling,  setCancelling]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/subscriptions/mine'),
      ])
      setPlans(plansRes.data.data?.plans ?? [])
      setCurrent(subRes.data.data?.subscription ?? null)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubscribe (plan: SubscriptionPlan) {
    if (!plan.paystackPlanCode) {
      modal.show({ variant: 'pending', title: 'Coming Soon', message: `"${plan.name}" is not yet available for online subscription. Please check back soon.` })
      return
    }
    if (!confirm(`Subscribe to ${plan.name} for ${formatPrice(plan.price, plan.interval)}?\n\nYou will be charged via Paystack. Cancel anytime.`)) return
    setSubscribing(plan._id)
    try {
      const r = await api.post('/subscriptions/subscribe', { planId: plan._id })
      setCurrent(r.data.data?.subscription)
      modal.show({
        variant: 'success',
        title: 'Subscribed!',
        message: `You're now on the ${plan.name} plan. Enjoy your premium benefits.`,
        actionLabel: 'Great, thanks!',
      })
    } catch (err: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Subscription Failed',
        message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not process your subscription. Please try again.',
        actionLabel: 'Try Again',
      })
    } finally {
      setSubscribing(null)
    }
  }

  async function handleCancel () {
    if (!confirm('Cancel your subscription? You will lose access at the end of the billing period.')) return
    setCancelling(true)
    try {
      await api.put('/subscriptions/cancel')
      setCurrent(null)
      modal.show({
        variant: 'success',
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled. You will retain access until the end of your current billing period.',
      })
    } catch {
      modal.show({
        variant: 'declined',
        title: 'Cancellation Failed',
        message: 'Could not cancel your subscription. Please try again or contact support.',
        actionLabel: 'Try Again',
      })
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <div className={s.wrap}><Loader label='Loading plans…' /></div>

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Subscription Plans</h1>
          <p className={s.subtitle}>Subscribe to a plan to unlock premium features.</p>
        </div>
      </div>

      {/* Active plan banner */}
      {current && (
        <div className={s.activeBanner}>
          <div className={s.activeBannerLeft}>
            <span className={s.activeBadge}>✓ Active</span>
            <p className={s.activePlanName}>{current.plan?.name}</p>
            <p className={s.activeMeta}>Next billing: {formatDate(current.nextBillingDate)}</p>
          </div>
          <button className={s.cancelBtn} onClick={handleCancel} disabled={cancelling}>
            {cancelling ? 'Cancelling…' : 'Cancel Subscription'}
          </button>
        </div>
      )}

      {/* Plans grid */}
      {plans.length === 0 ? (
        <p className={s.empty}>No subscription plans are available at this time. Check back soon.</p>
      ) : (
        <div className={s.plansGrid}>
          {plans.map(plan => {
            const isActive = current?.plan?._id === plan._id || current?.plan === plan._id as any
            const isLoading = subscribing === plan._id
            return (
              <div key={plan._id} className={`${s.planCard} ${plan.featured ? s.planFeatured : ''} ${isActive ? s.planActive : ''}`}>
                {plan.featured && <span className={s.popularBadge}>★ Most Popular</span>}
                <div className={s.planHeader}>
                  <div>
                    <p className={s.planName}>{plan.name}</p>
                    {plan.description && <p className={s.planDesc}>{plan.description}</p>}
                  </div>
                  <div className={s.planPriceWrap}>
                    <span className={s.planPrice}>₦{plan.price.toLocaleString('en-NG')}</span>
                    <span className={s.planInterval}>/{plan.interval === 'yearly' ? 'yr' : 'mo'}</span>
                  </div>
                </div>

                {plan.features.length > 0 && (
                  <ul className={s.featureList}>
                    {plan.features.map((f, i) => (
                      <li key={i} className={s.featureItem}><span className={s.checkmark}>✓</span>{f}</li>
                    ))}
                  </ul>
                )}

                {isActive ? (
                  <div className={s.currentTag}>✓ Your current plan</div>
                ) : (
                  <button
                    className={`${s.subscribeBtn} ${plan.featured ? s.subscribeBtnFeatured : ''}`}
                    onClick={() => handleSubscribe(plan)}
                    disabled={!!subscribing}
                  >
                    {isLoading ? 'Processing…' : 'Subscribe Now'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className={s.footnote}>Payments are processed securely via Paystack. You can cancel anytime from this page.</p>
    </div>
  )
}
