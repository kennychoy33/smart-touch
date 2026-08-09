import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="nav-logo" onClick={closeMenu}>
            <div className="logo-mark">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect width="10" height="10" rx="2" fill="white" fillOpacity="0.9"/>
                <rect x="12" width="10" height="10" rx="2" fill="white" fillOpacity="0.6"/>
                <rect y="12" width="10" height="10" rx="2" fill="white" fillOpacity="0.6"/>
                <rect x="12" y="12" width="10" height="10" rx="2" fill="white" fillOpacity="0.4"/>
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-name">Smartgogo</span>
              <span className="logo-sub">Workforce Systems</span>
            </div>
          </Link>

          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
            <NavLink to="/products" onClick={closeMenu}>Solutions</NavLink>
            <Link to="/#systems" onClick={closeMenu}>Industries</Link>
            <NavLink to="/about" onClick={closeMenu}>About</NavLink>
            <NavLink to="/contact" onClick={closeMenu}>Contact</NavLink>
            <Link to="/contact" className="nav-cta" onClick={closeMenu}>
              Book a Demo
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </nav>
      {menuOpen && <div className="nav-overlay" onClick={closeMenu} />}
    </>
  )
}
