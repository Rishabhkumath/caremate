import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Heart, Activity, Shield, Clock, Users, Brain, ArrowRight, CheckCircle } from 'lucide-react'

const features = [
  { icon: Activity, title: 'Real-Time Monitoring',     desc: 'Track vitals like BP, heart rate, oxygen, and temperature with trend analysis.' },
  { icon: Brain,    title: 'AI Health Assistant',      desc: 'Get instant health guidance, symptom analysis, and personalized routine recommendations.' },
  { icon: Clock,    title: 'Medication Reminders',     desc: 'Never miss a dose with smart, scheduled medication reminders and tracking.' },
  { icon: Users,    title: 'Care Team Coordination',   desc: 'Seamlessly connect patients, doctors, and caregivers in one unified platform.' },
  { icon: Shield,   title: 'Secure & Private',         desc: 'Enterprise-grade JWT authentication and end-to-end data security.' },
  { icon: Heart,    title: 'Appointment Scheduling',   desc: 'Book, manage, and track medical appointments with ease.' },
]

const roles = [
  { role: 'Patient',   desc: 'Monitor your health, manage medications, and connect with your care team.',          accent: '#2a7de1', soft: '#e8f1fd', badge: 'For You'   },
  { role: 'Doctor',    desc: 'View patient vitals, manage consultations, and write digital prescriptions.',        accent: '#0d9488', soft: '#ccfbf1', badge: 'Providers' },
  { role: 'Caregiver', desc: 'Oversee multiple patients, log care activities, and track their wellbeing.',        accent: '#7c3aed', soft: '#ede9fe', badge: 'Support'   },
]

const navLinks = [
  { label: 'About Us', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Roles', href: '#roles' },
  { label: 'FAQ', href: '#faq' },
]

const faqs = [
  {
    question: 'Who can use CareMate?',
    answer: 'CareMate is built for patients, doctors, and caregivers who need one shared place for vitals, medications, appointments, and care updates.',
  },
  {
    question: 'Does CareMate replace a doctor?',
    answer: 'No. CareMate supports everyday monitoring and guidance, while medical decisions should always stay with qualified healthcare professionals.',
  },
  {
    question: 'Can caregivers manage more than one patient?',
    answer: 'Yes. Caregivers can track assigned patients, log care activities, and stay aligned with the wider care team.',
  },
  {
    question: 'Is patient information protected?',
    answer: 'CareMate uses secure authentication and role-based access so each person only sees the information needed for their care role.',
  },
]

const footerGroups = [
  {
    title: 'Quick Links',
    links: [
      { label: 'About Us', href: '#about' },
      { label: 'Features', href: '#features' },
      { label: 'Roles', href: '#roles' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'Get Started', href: '#get-started' },
      { label: 'Create Account', to: '/register' },
      { label: 'Sign In', to: '/login' },
      { label: 'care@caremate.app', href: 'mailto:care@caremate.app' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Security', href: '#security' },
      { label: 'Accessibility', href: '#accessibility' },
    ],
  },
]

export default function LandingPage() {
  // Handle anchor link scrolling
  useEffect(() => {
    const handleAnchorClick = (e) => {
      if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
        const href = e.target.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('#/')) {
          e.preventDefault();
          const targetId = href.substring(1);
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    };

    // Add click listener to document
    document.addEventListener('click', handleAnchorClick);
    
    // Also handle hash change when page loads
    const hash = window.location.hash.substring(1);
    if (hash && !hash.startsWith('/')) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }

    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: '#f4f7fb', color: '#0f172a' }}>

      {/* â”€â”€ Navbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <nav className="fixed top-0 w-full z-50"
           style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px',
                      minHeight: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#2a7de1,#1e63b8)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 4px 14px rgba(42,125,225,0.30)' }}>
              <span style={{ color: '#fff', fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 16 }}>C</span>
            </div>
            <span style={{ fontFamily: 'Fraunces,serif', fontWeight: 600, fontSize: 18, color: '#0f172a' }}>CareMate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
            {navLinks.map(({ label, href }) => (
              <a key={label}
                 href={href}
                 style={{ color: '#64748b', fontSize: 14, textDecoration: 'none', fontWeight: 500,
                          padding: '8px 0', transition: 'color 0.2s' }}
                 onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
                 onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                {label}
              </a>
            ))}
            <Link to="/login"
                  style={{ color: '#64748b', fontSize: 14, textDecoration: 'none', padding: '8px 16px',
                           borderRadius: 8, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
              Sign In
            </Link>
            <a href="#get-started" className="btn-primary" style={{ fontSize: 14, textDecoration: 'none' }}>
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section style={{ position: 'relative', paddingTop: 128, paddingBottom: 80,
                        paddingLeft: 24, paddingRight: 24, overflow: 'hidden' }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: 80,  left: '20%',  width: 400, height: 400,
                      background: 'radial-gradient(circle,rgba(42,125,225,0.08) 0%,transparent 70%)',
                      borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 120, right: '15%', width: 320, height: 320,
                      background: 'radial-gradient(circle,rgba(20,184,166,0.07) 0%,transparent 70%)',
                      borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Content â€” centred */}
        <div className="animate-fade-in"
             style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '6px 18px', borderRadius: 999,
                        background: '#e8f1fd', border: '1px solid rgba(42,125,225,0.20)',
                        fontSize: 13, color: '#2a7de1', fontWeight: 500, marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2a7de1',
                           animation: 'pulse 2s infinite' }} />
            AI-Powered Healthcare Monitoring
          </div>

          {/* Heading */}
          <h1 style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(2.5rem,6vw,4.5rem)',
                       fontWeight: 700, lineHeight: 1.1, color: '#0f172a', marginBottom: 24 }}>
            Your Virtual<br />
            <span className="text-gradient">Nursing Assistant</span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem,2vw,1.2rem)', color: '#64748b', lineHeight: 1.7,
                      maxWidth: 600, margin: '0 auto 36px' }}>
            CareMate connects patients, doctors, and caregivers in one intelligent platform -
            monitoring health, managing medications, and delivering AI-powered insights 24/7.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
            <Link to="/register" className="btn-primary"
                  style={{ fontSize: 15, padding: '12px 28px', textDecoration: 'none',
                           display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Start Free Today <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary"
                  style={{ fontSize: 15, padding: '12px 28px', textDecoration: 'none',
                           display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Sign In
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 24, flexWrap: 'wrap' }}>
            {['No credit card required', 'HIPAA-friendly design', 'All roles supported'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6,
                                       fontSize: 13, color: '#94a3b8' }}>
                <CheckCircle size={14} style={{ color: '#2a7de1' }} /> {item}
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* â”€â”€ Features â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="about" style={{ padding: '80px 24px', background: '#fff', scrollMarginTop: 90 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 28,
                      alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 12, color: '#2a7de1', fontWeight: 700,
                           textTransform: 'uppercase', letterSpacing: '0.08em' }}>About Us</span>
            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(1.8rem,3vw,2.5rem)',
                         fontWeight: 700, color: '#0f172a', margin: '10px 0 14px' }}>
              Care that stays close, even from a distance
            </h2>
            <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, margin: 0 }}>
              CareMate helps families and healthcare teams stay connected through simple health tracking,
              medication support, appointment coordination, and AI-assisted guidance for everyday care.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
            {[
              ['24/7', 'health guidance'],
              ['3', 'care roles connected'],
              ['Smart', 'medication reminders'],
              ['Secure', 'role-based access'],
            ].map(([value, label]) => (
              <div key={label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0',
                                        borderRadius: 12, padding: 20 }}>
                <div style={{ fontFamily: 'Fraunces,serif', color: '#2a7de1',
                              fontSize: 26, fontWeight: 700 }}>{value}</div>
                <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" style={{ padding: '80px 24px', scrollMarginTop: 90 }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(1.8rem,3vw,2.5rem)',
                         fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              Everything you need
            </h2>
            <p style={{ color: '#64748b', fontSize: 17, maxWidth: 480, margin: '0 auto' }}>
              A complete healthcare ecosystem, from vitals tracking to AI consultations.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                   style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
                             padding: 24, transition: 'box-shadow 0.2s, transform 0.2s',
                             cursor: 'default' }}
                   onMouseEnter={e => {
                     e.currentTarget.style.boxShadow = '0 8px 24px rgba(42,125,225,0.12)'
                     e.currentTarget.style.transform = 'translateY(-2px)'
                   }}
                   onMouseLeave={e => {
                     e.currentTarget.style.boxShadow = 'none'
                     e.currentTarget.style.transform = 'translateY(0)'
                   }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff',
                               display: 'flex', alignItems: 'center', justifyContent: 'center',
                               marginBottom: 16 }}>
                  <Icon size={20} style={{ color: '#2a7de1' }} />
                </div>
                <h3 style={{ fontFamily: 'Fraunces,serif', fontSize: 17, fontWeight: 600,
                              color: '#0f172a', marginBottom: 8 }}>{title}</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Roles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="roles" style={{ padding: '80px 24px', background: '#fff', scrollMarginTop: 90 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(1.8rem,3vw,2.5rem)',
                         fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              Built for every role
            </h2>
            <p style={{ color: '#64748b', fontSize: 17, maxWidth: 480, margin: '0 auto' }}>
              Tailored dashboards and tools for everyone in the care journey.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            {roles.map(({ role, desc, accent, soft, badge }) => (
              <div key={role}
                   style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14,
                             padding: 24, transition: 'box-shadow 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(42,125,225,0.10)'}
                   onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: soft,
                               display: 'flex', alignItems: 'center', justifyContent: 'center',
                               marginBottom: 16, border: `1px solid ${accent}22` }}>
                  <span style={{ fontFamily: 'Fraunces,serif', fontWeight: 700,
                                  fontSize: 20, color: accent }}>{role[0]}</span>
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600,
                                textTransform: 'uppercase', letterSpacing: '0.08em' }}>{badge}</span>
                <h3 style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 600,
                              color: '#0f172a', margin: '6px 0 8px' }}>{role}</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>{desc}</p>
                <Link to="/register"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                               fontSize: 14, color: accent, textDecoration: 'none', fontWeight: 500 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Get started <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="faq" style={{ padding: '80px 24px', scrollMarginTop: 90 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(1.8rem,3vw,2.5rem)',
                         fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              Frequently asked questions
            </h2>
            <p style={{ color: '#64748b', fontSize: 17, maxWidth: 520, margin: '0 auto' }}>
              Clear answers for patients, caregivers, and care teams getting started.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {faqs.map(({ question, answer }) => (
              <div key={question} style={{ background: '#fff', border: '1px solid #e2e8f0',
                                           borderRadius: 12, padding: 22 }}>
                <h3 style={{ fontFamily: 'Fraunces,serif', fontSize: 18, color: '#0f172a',
                             margin: '0 0 8px' }}>{question}</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="get-started" style={{ padding: '80px 24px', scrollMarginTop: 90 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20,
                        padding: 56, boxShadow: '0 8px 40px rgba(42,125,225,0.10)' }}>
            <Heart size={36} style={{ color: '#2a7de1', margin: '0 auto 16px' }}
                   className="heartbeat" />
            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(1.6rem,3vw,2.2rem)',
                         fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              Start your health journey today
            </h2>
            <p style={{ color: '#64748b', fontSize: 16, marginBottom: 28, lineHeight: 1.6 }}>
              Join thousands of patients, doctors, and caregivers using CareMate
              to deliver better healthcare.
            </p>
            <Link to="/register" className="btn-primary"
                  style={{ fontSize: 15, padding: '13px 32px', textDecoration: 'none',
                           display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Create Free Account <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '48px 24px 28px',
                       background: '#fff', color: '#64748b', fontSize: 14 }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#2a7de1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 15 }}>C</span>
              </div>
              <span style={{ fontFamily: 'Fraunces,serif', fontWeight: 600, fontSize: 18, color: '#0f172a' }}>CareMate</span>
            </div>
            <p style={{ lineHeight: 1.6, margin: 0, maxWidth: 260 }}>
              Virtual nursing assistance for connected, confident everyday care.
            </p>
          </div>
          {footerGroups.map(group => (
            <div key={group.title}>
              <h3 style={{ fontFamily: 'Fraunces,serif', color: '#0f172a', fontSize: 16,
                           margin: '0 0 14px' }}>{group.title}</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {group.links.map(link => (
                  link.to ? (
                    <Link key={link.label} to={link.to}
                          style={{ color: '#64748b', textDecoration: 'none' }}>
                      {link.label}
                    </Link>
                  ) : (
                    <a key={link.label} href={link.href}
                       style={{ color: '#64748b', textDecoration: 'none' }}>
                      {link.label}
                    </a>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1152, margin: '32px auto 0', paddingTop: 22,
                      borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 13,
                      display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <span>&copy; {new Date().getFullYear()} CareMate. Built with care.</span>
          <span id="privacy">Privacy-first healthcare support.</span>
        </div>
      </footer>
    </div>
  )
}
