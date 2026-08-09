import { Link } from 'react-router-dom'
import './About.css'

const milestones = [
  ['1995', 'Payroll and attendance software roots', 'Our founder started by building payroll and attendance systems for large Malaysian workforces.'],
  ['2004', 'Smart Touch Technology founded', 'Smart Touch Technology Sdn Bhd was established in Johor to provide practical workplace software and local support.'],
  ['2009', 'Face recognition attendance', 'The team expanded into biometric and face recognition attendance devices for Malaysian workplaces.'],
  ['2020', 'Smartgogo mobile workflows', 'Smartgogo added mobile HR workflows for attendance, leave, payslip access and manager approvals.'],
  ['Today', 'Five workplace systems', 'Smartgogo now provides VMS, Canteen Subsidy, CWS, DMS and PAL systems for offices, factories, worksites and employers.'],
]

const values = [
  ['Practical Systems', 'We build software for real daily work: visitors, meals, workers, hostels, attendance, leave and payroll.'],
  ['Local Support', 'Our team provides system setup, device installation, training and support from Malaysia.'],
  ['Flexible Deployment', 'Customers can start with one system and add mobile app, face recognition, QR, card or dashboard features where useful.'],
  ['Reliable Records', 'We help companies replace paper forms, Excel lists and disconnected devices with searchable management records.'],
]

export default function About() {
  return (
    <div className="about-page">
      <section className="page-hero about-hero">
        <div className="page-hero-bg" />
        <div className="container page-hero-content">
          <span className="section-label" style={{ color: '#93c5fd', background: 'rgba(147,197,253,0.12)', borderColor: 'rgba(147,197,253,0.2)' }}>About Smartgogo</span>
          <h1 className="page-hero-title">Workplace Management Software Built in Malaysia</h1>
          <p className="page-hero-desc">
            Smartgogo is the product brand of Smart Touch Technology Sdn Bhd. We provide visitor management system,
            canteen subsidy system, construction workforce management, dormitory management and PAL payroll attendance
            leave system for Malaysian workplaces.
          </p>
        </div>
      </section>

      <section className="section mv-section">
        <div className="container">
          <div className="mv-grid">
            <div className="mv-card mission">
              <div className="mv-icon">VMS</div>
              <h3>Offices and Buildings</h3>
              <p>Visitor management software for visitor registration, QR check-in, host notification and audit records.</p>
            </div>
            <div className="mv-card vision">
              <div className="mv-icon">CMS</div>
              <h3>Factories and Canteens</h3>
              <p>Canteen subsidy software for meal entitlement, employee consumption, subsidy cost and duplicate meal control.</p>
            </div>
            <div className="mv-card philosophy">
              <div className="mv-icon">PAL</div>
              <h3>HR and Payroll Teams</h3>
              <p>Payroll attendance leave software for salary preparation, clock-in records, leave approval, overtime and claims.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section timeline-section">
        <div className="container">
          <div className="section-header center">
            <span className="section-label">Our Background</span>
            <h2 className="section-title">From Payroll Software to Workplace Management Systems</h2>
            <p className="section-subtitle">
              Our experience started with payroll and attendance, then expanded into face recognition devices, mobile app workflows,
              visitor management, canteen subsidy, construction workforce and dormitory management.
            </p>
          </div>
          <div className="timeline">
            {milestones.map(([year, title, desc], i) => (
              <div key={year} className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}>
                <div className="timeline-content">
                  <span className="timeline-year">{year}</span>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
                <div className="timeline-dot" />
              </div>
            ))}
            <div className="timeline-line" />
          </div>
        </div>
      </section>

      <section className="section values-section">
        <div className="container">
          <div className="section-header center">
            <span className="section-label">Why Companies Choose Us</span>
            <h2 className="section-title">Software, Devices, Mobile App and Support from One Team</h2>
            <p className="section-subtitle">
              Smartgogo is not only a software screen. We help customers choose the right system, set up the workflow,
              connect devices and train users.
            </p>
          </div>
          <div className="values-grid">
            {values.map(([title, desc]) => (
              <div key={title} className="value-card">
                <span className="value-icon">{title.slice(0, 2).toUpperCase()}</span>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="geo-section">
        <div className="container">
          <div className="geo-inner">
            <div className="geo-content">
              <span className="section-label">Malaysia Support</span>
              <h2 className="section-title">Based in Johor, Serving Malaysian Workplaces</h2>
              <p>
                Smart Touch Technology Sdn Bhd is headquartered in Johor, Malaysia. We support companies that need workplace
                management software, face recognition attendance devices, QR and card workflows, mobile app access and local implementation.
              </p>
              <div className="geo-stats">
                <div className="geo-stat">
                  <strong>Johor, Malaysia</strong>
                  <span>Headquarters and support hub</span>
                </div>
                <div className="geo-stat">
                  <strong>Offices, factories and worksites</strong>
                  <span>VMS, CMS, CWS, DMS and PAL systems</span>
                </div>
                <div className="geo-stat">
                  <strong>Software and devices</strong>
                  <span>Implementation, training and support</span>
                </div>
              </div>
            </div>
            <div className="geo-card">
              <div className="geo-map-placeholder">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <div className="geo-address">
                  <strong>Smart Touch Technology Sdn Bhd</strong>
                  <p>36-02 &amp; 36-03, Jalan Permas 10</p>
                  <p>Bandar Baru Permas Jaya</p>
                  <p>81750 Masai, Johor, Malaysia</p>
                  <a href="tel:+60733889903">+607-388 9903</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section about-cta-section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title" style={{ marginBottom: 12 }}>Need Workplace Management Software in Malaysia?</h2>
          <p className="section-subtitle" style={{ margin: '0 auto 36px' }}>
            Talk to Smartgogo about VMS, canteen subsidy, construction workforce, dormitory management or PAL payroll attendance leave systems.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn-primary">Request a Demo</Link>
            <Link to="/products" className="btn-outline">View Systems</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
