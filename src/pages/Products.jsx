import { Link } from 'react-router-dom'
import './Products.css'

const products = [
  {
    id: 'vms',
    name: 'VMS',
    subtitle: 'Visitor Management System',
    tagline: 'Visitor management system Malaysia for offices, buildings and factories.',
    color: '#0e7490',
    gradient: 'linear-gradient(135deg, #075985, #0e7490)',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    description: 'Smartgogo VMS is a visitor management system for Malaysian offices, buildings and factories. Replace paper logbooks with visitor pre-registration, QR check-in, host notification, face verification and searchable visitor audit records.',
    features: [
      { title: 'QR Pre-Registration', desc: 'Invite visitors before arrival and reduce reception queue time' },
      { title: 'Face or QR Check-In', desc: 'Verify guests quickly using face recognition, QR or kiosk workflows' },
      { title: 'Host Notifications', desc: 'Alert employees when their visitor arrives at the site' },
      { title: 'Watchlist Control', desc: 'Flag restricted visitors and trigger security alerts' },
      { title: 'Badge and Photo Record', desc: 'Capture visitor identity and print badges where required' },
      { title: 'Audit Trail', desc: 'Search every visit by person, company, host, date and purpose' },
    ],
  },
  {
    id: 'dms',
    name: 'DMS',
    subtitle: 'Dormitory Management System',
    tagline: 'Dormitory management system Malaysia for worker hostels and accommodation.',
    color: '#0f766e',
    gradient: 'linear-gradient(135deg, #134e4a, #0f766e)',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    description: 'Smartgogo DMS is a dormitory management system for employers managing worker hostels in Malaysia. Track rooms, beds, occupancy, worker movement, maintenance cases and accommodation records from one dashboard.',
    features: [
      { title: 'Bed Allocation', desc: 'Assign rooms and beds with current occupancy visibility' },
      { title: 'Dormitory Access', desc: 'Record worker check-in and check-out using connected identity' },
      { title: 'Movement Records', desc: 'Track overnight absence, curfew and return-to-hostel events' },
      { title: 'Utility Tracking', desc: 'Capture utility usage for rooms or blocks where needed' },
      { title: 'Maintenance Logs', desc: 'Manage repair requests, incidents and follow-up status' },
      { title: 'Compliance Reports', desc: 'Prepare worker accommodation records for internal and external audits' },
    ],
  },
  {
    id: 'cms',
    name: 'CMS',
    subtitle: 'Canteen Subsidy System',
    tagline: 'Canteen subsidy system Malaysia for factory meal entitlement control.',
    color: '#c47f00',
    gradient: 'linear-gradient(135deg, #92400e, #c47f00)',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z"/>
      </svg>
    ),
    description: 'Smartgogo CMS is a canteen subsidy system for Malaysian factories. Control employee meal entitlement, subsidy rules, consumption by face, card or QR, duplicate meal alerts and daily canteen cost reports.',
    features: [
      { title: 'Meal Entitlement', desc: 'Set daily, weekly or shift-based meal allowances by worker group' },
      { title: 'Face / Card / QR Use', desc: 'Verify consumption at the counter with the method that fits your site' },
      { title: 'Subsidy Rules', desc: 'Calculate company subsidy and employee portion automatically' },
      { title: 'Fraud Prevention', desc: 'Reduce sharing, duplicate meals and ghost consumption' },
      { title: 'Menu and Pricing', desc: 'Manage canteen items, pricing and special meals centrally' },
      { title: 'Consumption Reports', desc: 'Review daily usage, cost and subsidy summaries' },
    ],
  },
  {
    id: 'cws',
    name: 'CWS',
    subtitle: 'Construction Workforce System',
    tagline: 'Construction workforce management system for site attendance and contractor control.',
    color: '#b45309',
    gradient: 'linear-gradient(135deg, #78350f, #b45309)',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 21V8l8-5 8 5v13"/>
        <path d="M9 21v-6h6v6"/>
        <path d="M8 11h8"/>
      </svg>
    ),
    description: 'Smartgogo CWS is a construction workforce management system for contractors and project sites. Manage worker registration, induction status, site attendance, certification validity and project headcount.',
    features: [
      { title: 'Contractor Registry', desc: 'Keep contractors, subcontractors and workers organized by project' },
      { title: 'Site Attendance', desc: 'Capture daily headcount through gate or mobile workflows' },
      { title: 'Induction Status', desc: 'Track who is approved to enter before work begins' },
      { title: 'Certification Checks', desc: 'Record permits, training and document validity' },
      { title: 'Project Dashboard', desc: 'View workforce presence across sites and zones' },
      { title: 'Safety Records', desc: 'Keep evidence ready for project and compliance review' },
    ],
  },
  {
    id: 'pal',
    name: 'PAL',
    subtitle: 'Payroll Attendance Leave System',
    tagline: 'Payroll attendance leave system Malaysia for HR teams.',
    color: '#1d4ed8',
    gradient: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    description: 'Smartgogo PAL is a payroll attendance leave system for Malaysian HR teams. Manage payroll processing, attendance records, leave applications, overtime, claims, payslips and HR reports.',
    features: [
      { title: 'Payroll Processing', desc: 'Calculate salary, allowance, deduction and statutory contribution workflows' },
      { title: 'Attendance Records', desc: 'Use verified clock-in events from face terminals or site devices' },
      { title: 'Leave Management', desc: 'Apply, approve and track leave balances in one place' },
      { title: 'Overtime and Claims', desc: 'Connect OT, claims and shift records to payroll preparation' },
      { title: 'Payslip Access', desc: 'Prepare employee payroll records and payslip workflows' },
      { title: 'HR Reporting', desc: 'Review payroll, attendance and leave data across teams or companies' },
    ],
  },
]

const relatedProducts = [
  {
    name: 'SmartGoGo Mobile App',
    keyword: 'attendance mobile app Malaysia',
    copy: 'Mobile clock-in, leave application, claims submission, payslip access and manager approvals for employees on the move.',
  },
  {
    name: 'SmartPay',
    keyword: 'payroll software Malaysia',
    copy: 'Payroll calculation, statutory contribution support, allowance, deduction and payslip workflows for Malaysian HR teams.',
  },
  {
    name: 'Smartime',
    keyword: 'time attendance system Malaysia',
    copy: 'Attendance records from face recognition, fingerprint, card, QR, mobile app or time clock devices.',
  },
  {
    name: 'SmartLeave',
    keyword: 'leave management system Malaysia',
    copy: 'Leave application, approval routing, leave balance, calendar visibility and HR leave reports.',
  },
  {
    name: 'SmartClaim',
    keyword: 'e-claim system Malaysia',
    copy: 'Employee claim submission, receipt capture, approval status and claim records for payroll preparation.',
  },
  {
    name: 'Face / QR / Card Devices',
    keyword: 'face recognition attendance system Malaysia',
    copy: 'Face recognition terminals, QR code, RFID card and access devices for attendance, visitor, canteen and workforce records.',
  },
]

export default function Products() {
  return (
    <div className="products-page">
      <section className="page-hero">
        <div className="page-hero-bg" />
        <div className="container page-hero-content">
          <span className="section-label">Smartgogo Systems</span>
          <h1 className="page-hero-title">Workplace Management Software Malaysia for Visitors, Meals, Workers, Hostels and Payroll</h1>
          <p className="page-hero-desc">
            Choose the system your operation needs: visitor management system, canteen subsidy system, construction workforce management, dormitory management system or PAL payroll attendance leave system.
          </p>
          <Link to="/contact" className="btn-primary">
            Request a Demo
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>

      <section className="section products-detail">
        <div className="container">
          {products.map((p, i) => (
            <div key={p.id} className={`product-detail-card ${i % 2 === 1 ? 'reverse' : ''}`}>
              <div className="product-detail-visual" style={{ background: p.gradient }}>
                <div className="product-visual-icon">{p.icon}</div>
                <div className="product-visual-name">{p.name}</div>
                <div className="product-visual-sub">{p.subtitle}</div>
                <div className="product-visual-deco" />
              </div>
              <div className="product-detail-info">
                <span className="product-detail-badge" style={{ color: p.color, background: `${p.color}14` }}>
                  {p.subtitle}
                </span>
                <h2 className="product-detail-name">{p.name}</h2>
                <p className="product-detail-tagline">{p.tagline}</p>
                <p className="product-detail-desc">{p.description}</p>
                <div className="product-features-grid">
                  {p.features.map((f) => (
                    <div key={f.title} className="feature-item">
                      <div className="feature-check" style={{ background: `${p.color}18`, color: p.color }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <strong>{f.title}</strong>
                        <p>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/contact" className="btn-primary" style={{ marginTop: 8 }}>
                  Get a Demo
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section related-products-section">
        <div className="container">
          <div className="section-header center">
            <span className="section-label">Related Products</span>
            <h2 className="section-title">Smartgogo HR, Attendance and Device Modules</h2>
            <p className="section-subtitle">
              These products support the main Smartgogo systems. Use them with PAL, VMS, CMS, CWS or DMS when your company needs mobile app access, payroll software, time attendance, leave, claims or face recognition devices.
            </p>
          </div>
          <div className="related-products-grid">
            {relatedProducts.map((item) => (
              <article className="related-product-card" key={item.name}>
                <span>{item.keyword}</span>
                <h3>{item.name}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section products-bottom-cta">
        <div className="container">
          <div className="bottom-cta-inner">
            <h2>Not sure which system to start with?</h2>
            <p>Our team will review your operation and recommend the right system for visitors, meals, workers, hostels or HR payroll.</p>
            <div className="bottom-cta-actions">
              <Link to="/contact" className="btn-primary">Talk to Our Team</Link>
              <a href="tel:+60733889903" className="btn-outline">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.79a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16c.1.31.17.63.19.92z"/>
                </svg>
                +607-388 9903
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
