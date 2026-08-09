import { Link } from 'react-router-dom'
import './Home.css'

const systems = [
  {
    code: 'VMS',
    name: 'Visitor Management',
    title: 'For offices and buildings',
    copy: 'Professional visitor registration, QR pre-check-in, host notification, face verification and audit records.',
    accent: '#0e7490',
  },
  {
    code: 'DMS',
    name: 'Dormitory Management',
    title: 'For worker accommodation',
    copy: 'Manage rooms, beds, occupancy, worker movement, utilities, maintenance and hostel compliance records.',
    accent: '#0f766e',
  },
  {
    code: 'CMS',
    name: 'Canteen Subsidy',
    title: 'For factories with meal control',
    copy: 'Control meal entitlement, subsidy deduction, face/card/QR consumption and canteen cost reporting.',
    accent: '#c47f00',
  },
  {
    code: 'CWS',
    name: 'Construction Workforce',
    title: 'For construction sites',
    copy: 'Manage contractors, worker attendance, induction, certification and project site headcount.',
    accent: '#b45309',
  },
  {
    code: 'PAL',
    name: 'Payroll Attendance Leave',
    title: 'For HR payroll teams',
    copy: 'Run payroll, attendance, leave, overtime, claims, payslips and HR reporting from one HR system.',
    accent: '#1d4ed8',
  },
]

const heroUseCases = [
  { code: 'VMS', label: 'Visitor Management', need: 'Office / building visitor records', className: 'office' },
  { code: 'CMS', label: 'Canteen Subsidy', need: 'Factory meal entitlement control', className: 'factory' },
  { code: 'CWS', label: 'Construction Workforce', need: 'Contractor and site headcount', className: 'construction' },
  { code: 'DMS', label: 'Dormitory Management', need: 'Worker hostel and bed records', className: 'dormitory' },
  { code: 'PAL', label: 'PAL HR Payroll', need: 'Payroll, attendance and leave', className: 'payroll' },
]

const heroMethods = ['Software System', 'Face / QR / Card Device', 'Mobile App', 'Installation & Support']

const useCasePath = [
  { label: 'Office / Building', system: 'VMS', detail: 'Register visitors, notify hosts and keep entry records.' },
  { label: 'Factory Canteen', system: 'CMS', detail: 'Control meal subsidy, entitlement and consumption.' },
  { label: 'Construction Site', system: 'CWS', detail: 'Know which contractors and workers are on site.' },
  { label: 'Worker Hostel', system: 'DMS', detail: 'Manage rooms, beds, movement and accommodation records.' },
  { label: 'HR Department', system: 'PAL', detail: 'Handle payroll, attendance, leave, overtime and claims.' },
]

const connectionLayers = [
  ['Choose One System', 'Start with the problem you need to solve now: visitors, meals, workforce, dormitory or HR payroll.'],
  ['Add the Right Capture Method', 'Use mobile app, face terminal, QR or card depending on the workplace and user flow.'],
  ['Connect Later When Needed', 'If you use multiple Smartgogo systems, selected records can be linked for reporting and less duplicate work.'],
]

const dashboardPanels = [
  {
    code: 'VMS',
    name: 'Visitor Management',
    focus: 'Office visitor dashboard',
    metrics: ['Visitors today', 'Pre-registered guests', 'Visitors still inside'],
    records: ['Visitor photo', 'Host name', 'Check-in / check-out time'],
    className: 'office',
  },
  {
    code: 'CMS',
    name: 'Canteen Subsidy',
    focus: 'Factory meal subsidy dashboard',
    metrics: ['Meals consumed', 'Subsidy cost', 'Duplicate meal alerts'],
    records: ['Employee ID', 'Meal entitlement', 'Company / employee portion'],
    className: 'factory',
  },
  {
    code: 'CWS',
    name: 'Construction Workforce',
    focus: 'Construction site dashboard',
    metrics: ['Workers on site', 'Contractor headcount', 'Expired certifications'],
    records: ['Project site', 'Induction status', 'Entry / exit log'],
    className: 'construction',
  },
  {
    code: 'DMS',
    name: 'Dormitory Management',
    focus: 'Worker hostel dashboard',
    metrics: ['Occupied beds', 'Room capacity', 'Overnight absence'],
    records: ['Room / bed number', 'Worker movement', 'Maintenance case'],
    className: 'dormitory',
  },
  {
    code: 'PAL',
    name: 'PAL HR Payroll',
    focus: 'Payroll, Attendance and Leave dashboard',
    modules: [
      ['Payroll', ['Salary calculation', 'OT and claims', 'Payslip / payroll report']],
      ['Attendance', ['Clock-in records', 'Late / absent exceptions', 'Shift and overtime summary']],
      ['Leave', ['Leave application', 'Approval status', 'Balance and calendar']],
    ],
    className: 'payroll',
  },
]

const industries = [
  ['Manufacturing', 'Factories with gates, shifts, hostels, canteens, contractors, and high-volume worker movement.'],
  ['Construction', 'Sites that need contractor attendance, induction status, access records, and live headcount.'],
  ['Plantation', 'Remote workforce operations with housing, attendance, transport, and site visibility needs.'],
  ['Logistics', 'Warehouses and yards managing visitors, drivers, contractors, and restricted access zones.'],
]

const proofPoints = [
  'Face recognition connected to real operations, not only clock-in.',
  'Software, devices, installation, and support from one vendor.',
  'Built around Malaysian factories, hostels, worksites, and facilities.',
]

export default function Home() {
  return (
    <div className="home site-automation-home">
      <section className="st-hero">
        <div className="container st-hero-grid">
          <div className="st-hero-copy">
            <h1>Workplace Management Software in Malaysia</h1>
            <p className="st-hero-lead">
              Smartgogo provides visitor management system, canteen subsidy system, construction workforce management,
              dormitory management and PAL payroll attendance leave system for Malaysian offices, factories and worksites.
            </p>
            <p className="st-hero-line">Software, devices, mobile app, installation and local support from one team.</p>
            <div className="st-hero-actions">
              <Link to="/contact" className="btn-primary st-primary">Book a Demo</Link>
              <a href="#systems" className="btn-outline st-outline">Explore Systems</a>
            </div>
            <div className="st-trust-row">
              <span>Visitor Management</span>
              <span>Canteen Subsidy</span>
              <span>Construction Workforce</span>
              <span>Dormitory Management</span>
              <span>PAL HR Payroll</span>
            </div>
          </div>
          <div className="st-hero-visual" aria-label="Smartgogo workplace management systems overview">
            <div className="hero-solution-board">
              <div className="solution-board-top">
                <div>
                  <span>SMARTGOGO</span>
                  <strong>Workplace Management Systems</strong>
                </div>
                <small>Malaysia</small>
              </div>

              <div className="solution-list">
                {heroUseCases.map((item) => (
                  <div className={`solution-row ${item.className}`} key={item.code}>
                    <span>{item.code}</span>
                    <div>
                      <strong>{item.label}</strong>
                      <small>{item.need}</small>
                    </div>
                    <em>System</em>
                  </div>
                ))}
              </div>

              <div className="solution-board-bottom">
                {heroMethods.map((method) => (
                  <div key={method}>
                    <span>{method}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-service-note">
              <strong>What we deliver</strong>
              <p>Software setup, devices, mobile app workflow, training and local support.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="st-journey section">
        <div className="container">
          <div className="section-header center">
            <h2 className="section-title">Workplace Software for Visitors, Meals, Workers, Hostels and Payroll</h2>
            <p className="section-subtitle">
              We help companies replace paper forms, Excel lists and disconnected devices with focused management
              systems for the daily work of visitors, meals, workers, hostels and payroll.
            </p>
          </div>
          <div className="journey-track">
            {useCasePath.map((item) => (
              <article className="journey-step" key={`${item.label}-${item.system}`}>
                <div className="journey-icon">{item.system}</div>
                <h3>{item.label}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="st-dashboard section">
        <div className="container dashboard-grid">
          <div className="dashboard-copy">
            <span className="section-label">Management Dashboard Examples</span>
            <h2 className="section-title">Each System Shows the Records Your Team Actually Needs.</h2>
            <p className="section-subtitle">
              Each Smartgogo system has its own dashboard. Mobile app, face recognition, QR and card devices are added
              only where they help capture cleaner visitor, meal, worker, hostel or payroll records.
            </p>
            <div className="connection-list">
              {connectionLayers.map(([name, copy]) => (
                <div className="connection-item" key={name}>
                  <strong>{name}</strong>
                  <p>{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="ops-dashboard" aria-label="Smartgogo system dashboard examples">
            <div className="ops-topbar">
              <div>
                <span>Dashboard Examples</span>
                <strong>Each system has its own management view</strong>
              </div>
              <small>Not forced together</small>
            </div>

            <div className="system-dashboard-grid">
              {dashboardPanels.map((panel) => (
                <article className={`system-dashboard-panel ${panel.className}`} key={panel.code}>
                  <div className="panel-heading">
                    <span>{panel.code}</span>
                    <div>
                      <strong>{panel.name}</strong>
                      <small>{panel.focus}</small>
                    </div>
                  </div>
                  {panel.modules ? (
                    <div className="pal-module-grid">
                      {panel.modules.map(([moduleName, moduleItems]) => (
                        <div key={moduleName}>
                          <em>{moduleName}</em>
                          {moduleItems.map((item) => <p key={item}>{item}</p>)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="panel-columns">
                      <div>
                        <em>Key metrics</em>
                        {panel.metrics.map((metric) => <p key={metric}>{metric}</p>)}
                      </div>
                      <div>
                        <em>Records</em>
                        {panel.records.map((record) => <p key={record}>{record}</p>)}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="systems" className="st-systems section">
        <div className="container">
          <div className="section-header center">
            <h2 className="section-title">Five Smartgogo Systems for Malaysian Workplaces.</h2>
            <p className="section-subtitle">
              Choose one standalone system or combine modules later: VMS, Canteen Subsidy, CWS, DMS and PAL.
            </p>
          </div>
          <div className="systems-grid">
            {systems.map((system) => (
              <article className="system-card" key={system.code} style={{ '--system-accent': system.accent }}>
                <div className="system-code">{system.code}</div>
                <span>{system.name}</span>
                <h3>{system.title}</h3>
                <p>{system.copy}</p>
                <Link to="/products">Learn more</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="st-gap">
        <div className="container gap-grid">
          <div>
            <h2>Need face recognition attendance or worker movement records?</h2>
            <p>
              For factories, construction sites and dormitories, Smartgogo can connect face recognition attendance,
              QR, card or mobile app records to the system your operation uses.
            </p>
            <ul>
              {proofPoints.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </div>
          <div className="gap-dashboard">
            <div>
              <span>Dormitory Headcount</span>
              <strong>1,250</strong>
              <small>Workers</small>
            </div>
            <div className="gap-alert">
              <span>Variance</span>
              <strong>98</strong>
              <small>Unaccounted</small>
            </div>
            <div>
              <span>Gate Attendance</span>
              <strong>1,152</strong>
              <small>Workers</small>
            </div>
          </div>
        </div>
      </section>

      <section className="st-industries section">
        <div className="container">
          <div className="section-header center">
            <h2 className="section-title">Workplace Management Software Built for Malaysia</h2>
            <p className="section-subtitle">
              Smartgogo is designed for teams managing real gates, real workers, real facilities and real compliance pressure.
            </p>
          </div>
          <div className="industries-grid">
            {industries.map(([name, copy]) => (
              <article className="industry-card" key={name}>
                <h3>{name}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="st-final">
        <div className="container final-grid">
          <div>
            <h2>Which operation do you want to improve first?</h2>
            <p>Tell us whether your priority is visitors, canteen subsidy, construction workforce, dormitory management or PAL HR payroll. We will recommend the right system to start with.</p>
          </div>
          <Link to="/contact" className="btn-primary st-final-cta">Book a 30-minute demo</Link>
        </div>
      </section>
    </div>
  )
}
