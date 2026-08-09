import { useState } from 'react'
import './Contact.css'

const contactDetails = [
  {
    label: 'Office',
    lines: ['36-02 & 36-03, Jalan Permas 10', 'Bandar Baru Permas Jaya', '81750 Masai, Johor, Malaysia'],
  },
  {
    label: 'Phone',
    lines: ['+607-388 9903', '+6011-5354 9903', '+607-388 3686'],
    links: ['tel:+60733889903', 'tel:+601153549903', 'tel:+60733883686'],
  },
  {
    label: 'Email',
    lines: ['sales@smartouch.com.my'],
    links: ['mailto:sales@smartouch.com.my'],
  },
  {
    label: 'WhatsApp',
    lines: ['+6011-5354 9903'],
    links: ['https://wa.me/601153549903'],
  },
]

const reasons = [
  { icon: '01', text: 'Demo for VMS, CMS, CWS, DMS or PAL' },
  { icon: '02', text: 'Software, devices, mobile app and support' },
  { icon: '03', text: 'Recommended setup for your workplace' },
  { icon: '04', text: 'Malaysia-based implementation team' },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', message: '', interest: '' })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email'
    if (!form.message.trim()) e.message = 'Please tell us about your needs'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSubmitted(true)
  }

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }))
  }

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-bg" />
        <div className="container contact-hero-content">
          <span className="section-label" style={{ color: '#93c5fd', background: 'rgba(147,197,253,0.12)', borderColor: 'rgba(147,197,253,0.2)' }}>Contact Smartgogo</span>
          <h1 className="page-hero-title">Request a Demo for Workplace Management Software in Malaysia</h1>
          <p className="page-hero-desc">
            Whether you need visitor management system, canteen subsidy system, construction workforce management,
            dormitory management or PAL payroll attendance leave system, our team can recommend the right setup.
          </p>
          <div className="hero-reasons">
            {reasons.map((r) => (
              <div key={r.text} className="hero-reason">
                <span>{r.icon}</span>
                <span>{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-main">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-form-panel">
              <div className="form-header">
                <h2>Tell Us Which Smartgogo System You Need</h2>
                <p>Send your enquiry and our team will help you choose the right workplace management software, device and mobile app workflow.</p>
              </div>

              {submitted ? (
                <div className="form-success">
                  <div className="success-icon">OK</div>
                  <h3>Message Received</h3>
                  <p>Thank you for reaching out. Our team will contact you at <strong>{form.email}</strong> within 1 business day.</p>
                  <button className="btn-primary" onClick={() => { setSubmitted(false); setForm({ name: '', company: '', email: '', phone: '', message: '', interest: '' }) }}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                  <div className="form-row">
                    <div className={`form-group ${errors.name ? 'error' : ''}`}>
                      <label htmlFor="name">Full Name *</label>
                      <input id="name" type="text" placeholder="e.g. Ahmad Razif" value={form.name} onChange={handleChange('name')} />
                      {errors.name && <span className="error-msg">{errors.name}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="company">Company Name</label>
                      <input id="company" type="text" placeholder="e.g. ABC Manufacturing Sdn Bhd" value={form.company} onChange={handleChange('company')} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className={`form-group ${errors.email ? 'error' : ''}`}>
                      <label htmlFor="email">Email Address *</label>
                      <input id="email" type="email" placeholder="e.g. hr@company.com.my" value={form.email} onChange={handleChange('email')} />
                      {errors.email && <span className="error-msg">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input id="phone" type="tel" placeholder="e.g. +60 12-345 6789" value={form.phone} onChange={handleChange('phone')} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="interest">I'm interested in</label>
                    <select id="interest" value={form.interest} onChange={handleChange('interest')}>
                      <option value="">Select a system or service...</option>
                      <option value="vms">Visitor Management System Malaysia</option>
                      <option value="cms">Canteen Subsidy System Malaysia</option>
                      <option value="cws">Construction Workforce Management System</option>
                      <option value="dms">Dormitory Management System Malaysia</option>
                      <option value="pal">PAL Payroll Attendance Leave System</option>
                      <option value="device">Face / QR / Card Device</option>
                      <option value="full">Multiple Smartgogo Systems</option>
                      <option value="other">General Enquiry</option>
                    </select>
                  </div>
                  <div className={`form-group ${errors.message ? 'error' : ''}`}>
                    <label htmlFor="message">Tell us about your needs *</label>
                    <textarea
                      id="message"
                      rows={5}
                      placeholder="Describe your office, factory, construction site, dormitory or HR payroll requirement..."
                      value={form.message}
                      onChange={handleChange('message')}
                    />
                    {errors.message && <span className="error-msg">{errors.message}</span>}
                  </div>
                  <button type="submit" className="btn-primary form-submit">Send Message</button>
                  <p className="form-note">We respect your privacy. Your information will never be shared with third parties.</p>
                </form>
              )}
            </div>

            <div className="contact-info-panel">
              <div className="info-header">
                <h2>Smartgogo Contact Information</h2>
                <p>Contact our Malaysia team for workplace management software demos, device setup and implementation support.</p>
              </div>

              <div className="contact-details">
                {contactDetails.map((d) => (
                  <div key={d.label} className="contact-detail">
                    <div className="detail-icon">{d.label.slice(0, 2).toUpperCase()}</div>
                    <div className="detail-content">
                      <strong>{d.label}</strong>
                      <div className="detail-lines">
                        {d.lines.map((line, i) => (
                          d.links ? (
                            <a key={line} href={d.links[i]} target={d.links[i].startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{line}</a>
                          ) : (
                            <span key={line}>{line}</span>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="contact-entities">
                <h4>Registered Entities</h4>
                <div className="entity">
                  <strong>Smart Touch Technology Sdn Bhd</strong>
                  <span>Reg. No. 638440-D</span>
                </div>
                <div className="entity">
                  <strong>E Software MSC Sdn Bhd</strong>
                  <span>Reg. No. 780687-V</span>
                </div>
                <div className="entity">
                  <strong>GST Registration</strong>
                  <span>00 833 683 456</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="map-section">
        <div className="container">
          <div className="map-wrapper">
            <div className="map-placeholder">
              <div>
                <p className="map-title">Smart Touch Technology Sdn Bhd</p>
                <p>36-02 &amp; 36-03, Jalan Permas 10, Bandar Baru Permas Jaya, 81750 Masai, Johor</p>
                <a href="https://maps.google.com/?q=Smart+Touch+Technology+Masai+Johor" target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ marginTop: 16 }}>
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
