import { useState } from 'react'
import { Link } from 'react-router-dom'
import { calculateRoi } from '../services/roiApi'
import './RoiCalculator.css'

const BUSINESS_TYPES = ['Restaurant', 'Retail', 'F&B', 'Hotel']

const INITIAL_FORM = {
  businessType: '',
  outletCount: '',
  dailyTransactions: '',
  transactionValue: '',
  currentCosts: '',
  staffCount: '',
  manualHoursPerDay: '',
}

function formatRM(value) {
  if (value === null || value === undefined) return 'RM 0'
  return 'RM ' + Number(value).toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function validate(form) {
  const errors = {}
  if (!form.businessType) errors.businessType = 'Please select a business type'
  if (!form.outletCount || Number(form.outletCount) < 1) errors.outletCount = 'Enter at least 1 outlet'
  if (!form.dailyTransactions || Number(form.dailyTransactions) < 1) errors.dailyTransactions = 'Enter daily transactions'
  if (!form.transactionValue || Number(form.transactionValue) <= 0) errors.transactionValue = 'Enter average transaction value'
  if (!form.currentCosts || Number(form.currentCosts) <= 0) errors.currentCosts = 'Enter current monthly staff costs'
  if (!form.staffCount || Number(form.staffCount) < 1) errors.staffCount = 'Enter staff count'
  if (!form.manualHoursPerDay || Number(form.manualHoursPerDay) <= 0) errors.manualHoursPerDay = 'Enter manual hours per day'
  return errors
}

export default function RoiCalculator() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [results, setResults] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const payload = {
      businessType: form.businessType,
      numberOfOutlets: Number(form.outletCount),
      dailyTransactions: Number(form.dailyTransactions),
      transactionValue: Number(form.transactionValue),
      currentCost: Number(form.currentCosts),
      staffCount: Number(form.staffCount),
      hoursPerDay: Number(form.manualHoursPerDay),
    }
    setResults(calculateRoi(payload))
  }

  function handleReset() {
    setForm(INITIAL_FORM)
    setErrors({})
    setResults(null)
  }

  return (
    <div className="roi-page">
      {/* Hero */}
      <section className="roi-hero">
        <div className="container">
          <div className="roi-hero-badge">ROI Calculator</div>
          <h1 className="roi-hero-title">
            How Much Could You Save<br />
            <span>with Smartgogo?</span>
          </h1>
          <p className="roi-hero-subtitle">
            Enter your business details below and see your projected savings in seconds.
            Based on real automation outcomes across Malaysian businesses.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="roi-calculator section">
        <div className="container">
          <div className="roi-grid">

            {/* Form Panel */}
            <div className="roi-form-panel">
              <div className="roi-panel-header">
                <h2>Your Business Details</h2>
                <p>All fields are required for an accurate estimate</p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {/* Business Type */}
                <div className={`roi-field ${errors.businessType ? 'error' : ''}`}>
                  <label htmlFor="businessType">Business Type</label>
                  <div className="roi-select-wrapper">
                    <select
                      id="businessType"
                      name="businessType"
                      value={form.businessType}
                      onChange={handleChange}
                    >
                      <option value="">Select your business type</option>
                      {BUSINESS_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <svg className="select-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {errors.businessType && <span className="roi-error-msg">{errors.businessType}</span>}
                </div>

                {/* Two-column row */}
                <div className="roi-row">
                  <div className={`roi-field ${errors.outletCount ? 'error' : ''}`}>
                    <label htmlFor="outletCount">Number of Outlets</label>
                    <div className="roi-input-wrapper">
                      <input
                        type="number"
                        id="outletCount"
                        name="outletCount"
                        value={form.outletCount}
                        onChange={handleChange}
                        placeholder="e.g. 3"
                        min="1"
                      />
                    </div>
                    {errors.outletCount && <span className="roi-error-msg">{errors.outletCount}</span>}
                  </div>

                  <div className={`roi-field ${errors.staffCount ? 'error' : ''}`}>
                    <label htmlFor="staffCount">Total Staff Count</label>
                    <div className="roi-input-wrapper">
                      <input
                        type="number"
                        id="staffCount"
                        name="staffCount"
                        value={form.staffCount}
                        onChange={handleChange}
                        placeholder="e.g. 12"
                        min="1"
                      />
                    </div>
                    {errors.staffCount && <span className="roi-error-msg">{errors.staffCount}</span>}
                  </div>
                </div>

                {/* Transactions row */}
                <div className="roi-row">
                  <div className={`roi-field ${errors.dailyTransactions ? 'error' : ''}`}>
                    <label htmlFor="dailyTransactions">Daily Transactions</label>
                    <div className="roi-input-wrapper">
                      <input
                        type="number"
                        id="dailyTransactions"
                        name="dailyTransactions"
                        value={form.dailyTransactions}
                        onChange={handleChange}
                        placeholder="e.g. 150"
                        min="1"
                      />
                    </div>
                    {errors.dailyTransactions && <span className="roi-error-msg">{errors.dailyTransactions}</span>}
                  </div>

                  <div className={`roi-field ${errors.transactionValue ? 'error' : ''}`}>
                    <label htmlFor="transactionValue">Avg. Transaction Value</label>
                    <div className="roi-input-wrapper prefix">
                      <span className="input-prefix">RM</span>
                      <input
                        type="number"
                        id="transactionValue"
                        name="transactionValue"
                        value={form.transactionValue}
                        onChange={handleChange}
                        placeholder="45.00"
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                    {errors.transactionValue && <span className="roi-error-msg">{errors.transactionValue}</span>}
                  </div>
                </div>

                {/* Costs row */}
                <div className="roi-row">
                  <div className={`roi-field ${errors.currentCosts ? 'error' : ''}`}>
                    <label htmlFor="currentCosts">Monthly Staff Costs</label>
                    <div className="roi-input-wrapper prefix">
                      <span className="input-prefix">RM</span>
                      <input
                        type="number"
                        id="currentCosts"
                        name="currentCosts"
                        value={form.currentCosts}
                        onChange={handleChange}
                        placeholder="25,000"
                        min="1"
                      />
                    </div>
                    {errors.currentCosts && <span className="roi-error-msg">{errors.currentCosts}</span>}
                  </div>

                  <div className={`roi-field ${errors.manualHoursPerDay ? 'error' : ''}`}>
                    <label htmlFor="manualHoursPerDay">Manual Work (hrs/day)</label>
                    <div className="roi-input-wrapper suffix">
                      <input
                        type="number"
                        id="manualHoursPerDay"
                        name="manualHoursPerDay"
                        value={form.manualHoursPerDay}
                        onChange={handleChange}
                        placeholder="6"
                        min="0.5"
                        step="0.5"
                        max="24"
                      />
                      <span className="input-suffix">hrs</span>
                    </div>
                    {errors.manualHoursPerDay && <span className="roi-error-msg">{errors.manualHoursPerDay}</span>}
                  </div>
                </div>

                <div className="roi-form-actions">
                  <button type="submit" className="roi-calc-btn">
                    Calculate My Savings
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3.75 9h10.5M9.75 4.5l4.5 4.5-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {results && (
                    <button type="button" className="roi-reset-btn" onClick={handleReset}>
                      Reset
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Results Panel */}
            <div className="roi-results-panel">
              {!results && (
                <div className="roi-results-placeholder">
                  <div className="placeholder-icon">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <rect x="4" y="4" width="40" height="40" rx="10" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3"/>
                      <path d="M16 24h16M24 16v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3>Your savings estimate will appear here</h3>
                  <p>Fill in your business details on the left and click <strong>Calculate My Savings</strong>.</p>
                </div>
              )}

              {results && (
                <div className="roi-results-content">
                  <div className="roi-results-header">
                    <span className="results-badge">Your Savings Estimate</span>
                    <h2>Here's Your ROI</h2>
                    <p>Based on your {form.outletCount} {Number(form.outletCount) === 1 ? 'outlet' : 'outlets'} - {form.businessType}</p>
                  </div>

                  {/* Hero metric */}
                  <div className="roi-hero-metric">
                    <div className="hero-metric-label">Annual Net Savings</div>
                    <div className="hero-metric-value">{formatRM(results.annualSavings)}</div>
                    <div className="hero-metric-sub">per year with Smartgogo</div>
                  </div>

                  {/* Key metrics grid */}
                  <div className="roi-metrics-grid">
                    <div className="roi-metric-card">
                      <div className="metric-icon monthly">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M2 8h16" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M6 2v3M14 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="metric-body">
                        <div className="metric-label">Monthly Savings</div>
                        <div className="metric-value">{formatRM(results.netSavings)}</div>
                      </div>
                    </div>

                    <div className="roi-metric-card">
                      <div className="metric-icon roi">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M3 14l4-5 4 3 6-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="metric-body">
                        <div className="metric-label">Return on Investment</div>
                        <div className="metric-value">{Number(results.roi).toFixed(0)}%</div>
                      </div>
                    </div>

                    <div className="roi-metric-card">
                      <div className="metric-icon payback">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M10 6.5v3.75l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="metric-body">
                        <div className="metric-label">Payback Period</div>
                        <div className="metric-value">{Number(results.paybackMonths).toFixed(1)} months</div>
                      </div>
                    </div>

                    <div className="roi-metric-card">
                      <div className="metric-icon cost">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 3v14M6.5 6.5h5a2 2 0 010 4h-3a2 2 0 000 4H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="metric-body">
                        <div className="metric-label">Smartgogo Cost</div>
                        <div className="metric-value metric-value--muted">{formatRM(results.smartouchCost)}<span>/mo</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Savings breakdown */}
                  <div className="roi-breakdown">
                    <h4>Savings Breakdown</h4>
                    <div className="breakdown-rows">
                      <div className="breakdown-row">
                        <span>Time &amp; Labour Savings</span>
                        <span className="breakdown-value positive">{formatRM(results.timeSavings)}</span>
                      </div>
                      <div className="breakdown-row">
                        <span>Error Reduction Savings</span>
                        <span className="breakdown-value positive">{formatRM(results.errorSavings)}</span>
                      </div>
                      <div className="breakdown-row">
                        <span>Monthly Revenue Benefit</span>
                        <span className="breakdown-value positive">{formatRM(results.monthlyRevenue)}</span>
                      </div>
                      <div className="breakdown-row breakdown-row--divider">
                        <span>Smartgogo Subscription</span>
                        <span className="breakdown-value negative">-{formatRM(results.smartouchCost)}</span>
                      </div>
                      <div className="breakdown-row breakdown-row--total">
                        <span>Net Monthly Savings</span>
                        <span className="breakdown-value">{formatRM(results.netSavings)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="roi-cta-block">
                    <p>Ready to start saving? Talk to a Smartgogo specialist.</p>
                    <Link to="/contact" className="roi-cta-btn">
                      Book a Free Demo
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>

                  <p className="roi-disclaimer">
                    * Estimates based on industry averages. Actual savings vary by business.
                    Smartgogo is priced at RM 299/outlet/month.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
