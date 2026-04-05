import { useState, useEffect, useRef } from "react";

function Counter({ end, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * end));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

function FeatureCard({ icon, title, description, delay }) {
  return (
    <div className="feature-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:         #f8f9fc;
          --surface:    #ffffff;
          --surface-2:  #f1f3f9;
          --primary:    #4f46e5;
          --primary-dk: #3730a3;
          --primary-lt: #ede9fe;
          --accent:     #6366f1;
          --blue:       #3b82f6;
          --blue-lt:    #eff6ff;
          --ink:        #0f0f1a;
          --ink-2:      #1e1b4b;
          --muted:      #6b7280;
          --muted-lt:   #9ca3af;
          --border:     #e5e7f0;
          --border-2:   #d1d5e8;
          --success:    #059669;
          --tag-bg:     #eef2ff;
          --tag-txt:    #4338ca;
        }

        html { scroll-behavior: smooth; }
        body {
          background: var(--bg);
          color: var(--ink);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 400;
          line-height: 1.6;
          overflow-x: hidden;
        }

        /* ── NAV ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 18px 48px;
          display: flex; align-items: center; justify-content: space-between;
          transition: all 0.35s ease;
        }
        .nav.scrolled {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          padding: 13px 48px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none;
        }
        .nav-logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--primary), var(--blue));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 16px; color: white;
          letter-spacing: -0.5px;
        }
        .nav-logo-text {
          font-size: 17px; font-weight: 700;
          color: var(--ink); letter-spacing: -0.3px;
        }
        .nav-links {
          display: flex; align-items: center; gap: 32px; list-style: none;
        }
        .nav-links a {
          color: var(--muted); text-decoration: none;
          font-size: 14px; font-weight: 500;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--primary); }
        .nav-cta { display: flex; gap: 10px; }
        .btn-ghost {
          padding: 8px 20px; border-radius: 8px;
          border: 1px solid var(--border-2);
          background: var(--surface); color: var(--ink-2);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 500;
          cursor: pointer; text-decoration: none;
          transition: all 0.2s;
          display: inline-flex; align-items: center;
        }
        .btn-ghost:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-lt); }
        .btn-primary {
          padding: 8px 20px; border-radius: 8px;
          background: var(--primary);
          color: white; font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 600;
          cursor: pointer; text-decoration: none;
          border: none; transition: all 0.2s;
          display: inline-flex; align-items: center;
        }
        .btn-primary:hover { background: var(--primary-dk); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79,70,229,0.3); }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 140px 24px 80px;
          position: relative; overflow: hidden;
          background: var(--surface);
        }
        .hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 90% 70% at 50% -5%, rgba(99,102,241,0.09) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 85% 85%, rgba(59,130,246,0.07) 0%, transparent 55%),
            radial-gradient(ellipse 40% 30% at 10% 70%, rgba(79,70,229,0.05) 0%, transparent 50%);
        }
        .hero-dots {
          position: absolute; inset: 0; z-index: 0;
          background-image: radial-gradient(circle, rgba(99,102,241,0.12) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 90%);
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 14px; border-radius: 100px;
          border: 1px solid rgba(99,102,241,0.25);
          background: var(--tag-bg);
          font-size: 12px; font-weight: 600;
          color: var(--tag-txt); letter-spacing: 0.06em;
          text-transform: uppercase; margin-bottom: 28px;
          position: relative; z-index: 1;
          animation: fadeUp 0.7s ease both;
        }
        .badge-pulse {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--primary);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
        .hero-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(44px, 7vw, 80px);
          font-weight: 800; line-height: 1.05;
          letter-spacing: -0.03em;
          color: var(--ink);
          position: relative; z-index: 1;
          animation: fadeUp 0.7s 0.08s ease both;
          max-width: 860px;
        }
        .hero-title em {
          font-style: italic;
          font-family: 'Instrument Serif', serif;
          font-weight: 400;
          background: linear-gradient(135deg, var(--primary) 0%, var(--blue) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: clamp(15px, 2vw, 18px);
          color: var(--muted); max-width: 540px;
          margin: 22px auto 0; line-height: 1.75;
          font-weight: 400;
          position: relative; z-index: 1;
          animation: fadeUp 0.7s 0.16s ease both;
        }
        .hero-actions {
          display: flex; gap: 12px; flex-wrap: wrap;
          justify-content: center; margin-top: 40px;
          position: relative; z-index: 1;
          animation: fadeUp 0.7s 0.24s ease both;
        }
        .btn-hero-primary {
          padding: 14px 32px; border-radius: 10px;
          background: var(--primary);
          color: white; font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px; font-weight: 600;
          cursor: pointer; text-decoration: none;
          border: none; transition: all 0.25s;
          display: inline-flex; align-items: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(79,70,229,0.25);
        }
        .btn-hero-primary:hover {
          background: var(--primary-dk);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(79,70,229,0.35);
        }
        .btn-hero-secondary {
          padding: 14px 32px; border-radius: 10px;
          border: 1.5px solid var(--border-2);
          background: var(--surface); color: var(--ink);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px; font-weight: 500;
          cursor: pointer; text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.25s;
        }
        .btn-hero-secondary:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--primary-lt);
        }
        .hero-preview {
          position: relative; z-index: 1; margin-top: 64px;
          animation: fadeUp 0.8s 0.36s ease both;
          max-width: 900px; width: 100%;
        }
        .hero-preview-frame {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(79,70,229,0.1), 0 4px 16px rgba(0,0,0,0.08);
        }
        .preview-bar {
          background: var(--surface-2);
          border-bottom: 1px solid var(--border);
          padding: 10px 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .preview-dot {
          width: 10px; height: 10px; border-radius: 50%;
        }
        .preview-url {
          margin-left: 12px; background: var(--surface);
          border: 1px solid var(--border); border-radius: 6px;
          padding: 4px 14px; font-size: 12px; color: var(--muted);
          flex: 1; max-width: 300px;
        }
        .preview-content {
          padding: 24px;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
        }
        .preview-stat {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 10px; padding: 16px 14px;
        }
        .preview-stat-label { font-size: 11px; color: var(--muted); font-weight: 500; margin-bottom: 4px; }
        .preview-stat-val { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .preview-stat-val.blue { color: var(--primary); }
        .preview-stat-val.green { color: var(--success); }
        .preview-stat-val.orange { color: #d97706; }
        .preview-stat-val.red { color: #dc2626; }

        /* ── STATS ── */
        .stats {
          padding: 56px 48px;
          background: var(--surface);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .stats-inner {
          max-width: 960px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr);
        }
        .stat-item {
          text-align: center; padding: 16px 20px;
          border-right: 1px solid var(--border);
        }
        .stat-item:last-child { border-right: none; }
        .stat-number {
          font-size: 44px; font-weight: 800;
          color: var(--primary); line-height: 1;
          letter-spacing: -0.03em;
        }
        .stat-label {
          font-size: 13px; color: var(--muted);
          margin-top: 6px; font-weight: 500;
        }

        /* ── SECTION COMMON ── */
        .section { padding: 96px 48px; }
        .section-inner { max-width: 1100px; margin: 0 auto; }
        .section-label {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--primary); margin-bottom: 14px;
          background: var(--tag-bg);
          padding: 5px 12px; border-radius: 100px;
          border: 1px solid rgba(99,102,241,0.2);
        }
        .section-title {
          font-size: clamp(32px, 4.5vw, 52px);
          font-weight: 800; line-height: 1.1;
          letter-spacing: -0.03em; color: var(--ink);
          max-width: 680px;
        }
        .section-title em {
          font-style: italic;
          font-family: 'Instrument Serif', serif;
          font-weight: 400;
          color: var(--primary);
        }
        .section-sub {
          font-size: 16px; color: var(--muted);
          max-width: 500px; margin-top: 14px;
          line-height: 1.75; font-weight: 400;
        }
        .centered { text-align: center; display: flex; flex-direction: column; align-items: center; }

        /* ── FEATURES ── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px; margin-top: 56px;
        }
        .feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px; padding: 28px 26px;
          transition: all 0.25s ease;
          animation: fadeUp 0.6s ease both;
          position: relative; overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--primary), var(--blue));
          opacity: 0; transition: opacity 0.3s;
        }
        .feature-card:hover {
          border-color: rgba(99,102,241,0.35);
          box-shadow: 0 8px 30px rgba(79,70,229,0.1);
          transform: translateY(-3px);
        }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon {
          font-size: 22px; margin-bottom: 14px;
          width: 46px; height: 46px;
          background: var(--tag-bg);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .feature-title {
          font-size: 16px; font-weight: 700;
          color: var(--ink); margin-bottom: 8px;
          letter-spacing: -0.2px;
        }
        .feature-desc {
          font-size: 13.5px; color: var(--muted);
          line-height: 1.65; font-weight: 400;
        }

        /* ── HOW IT WORKS ── */
        .steps {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 0; margin-top: 56px; position: relative;
        }
        .step {
          padding: 32px; border-right: 1px solid var(--border);
          position: relative;
        }
        .step:last-child { border-right: none; }
        .step-num {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), var(--blue));
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          font-size: 18px; font-weight: 800; color: white;
          letter-spacing: -1px;
        }
        .step-arrow {
          position: absolute; top: 52px; right: -14px;
          width: 28px; height: 28px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: var(--primary);
          z-index: 2;
        }
        .step:last-child .step-arrow { display: none; }
        .step-title {
          font-size: 18px; font-weight: 700;
          color: var(--ink); margin-bottom: 10px;
          letter-spacing: -0.3px;
        }
        .step-desc {
          font-size: 14px; color: var(--muted);
          line-height: 1.7; font-weight: 400;
        }

        /* ── ROLES ── */
        .roles {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 20px; margin-top: 56px;
        }
        .role-card {
          border: 1px solid var(--border);
          border-radius: 16px; padding: 36px 32px;
          background: var(--surface);
          transition: all 0.25s;
          position: relative; overflow: hidden;
        }
        .role-card.primary-card {
          background: linear-gradient(135deg, #f8f7ff 0%, #eef2ff 100%);
          border-color: rgba(99,102,241,0.3);
        }
        .role-card:hover {
          box-shadow: 0 12px 40px rgba(79,70,229,0.12);
          transform: translateY(-3px);
        }
        .role-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--tag-bg); color: var(--tag-txt);
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          padding: 4px 12px; border-radius: 100px;
          margin-bottom: 20px;
          border: 1px solid rgba(99,102,241,0.2);
        }
        .role-title {
          font-size: 26px; font-weight: 800;
          color: var(--ink); margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .role-sub {
          font-size: 14px; color: var(--muted);
          margin-bottom: 22px; line-height: 1.65; font-weight: 400;
        }
        .role-list {
          list-style: none; display: flex;
          flex-direction: column; gap: 9px;
        }
        .role-list li {
          font-size: 14px; color: #374151;
          display: flex; align-items: flex-start; gap: 10px;
          font-weight: 400;
        }
        .role-list li span.check {
          width: 18px; height: 18px; border-radius: 5px;
          background: var(--primary); color: white;
          font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 2px;
        }
        .role-cta {
          display: inline-flex; align-items: center; gap: 8px;
          margin-top: 28px; padding: 11px 26px; border-radius: 9px;
          background: var(--primary); color: white;
          font-size: 14px; font-weight: 600; text-decoration: none;
          transition: all 0.2s; border: none;
        }
        .role-cta:hover {
          background: var(--primary-dk);
          box-shadow: 0 6px 20px rgba(79,70,229,0.3);
          transform: translateY(-1px);
        }
        .role-cta-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          margin-top: 28px; padding: 11px 26px; border-radius: 9px;
          border: 1.5px solid var(--border-2);
          color: var(--ink); font-size: 14px; font-weight: 500;
          text-decoration: none; transition: all 0.2s; background: transparent;
        }
        .role-cta-ghost:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-lt); }

        /* ── TECH ── */
        .tech-grid {
          display: flex; flex-wrap: wrap; gap: 10px;
          margin-top: 44px; justify-content: center;
        }
        .tech-pill {
          padding: 7px 18px; border-radius: 100px;
          border: 1px solid var(--border);
          background: var(--surface);
          font-size: 13px; font-weight: 500;
          color: var(--muted); transition: all 0.2s;
        }
        .tech-pill:hover {
          border-color: var(--primary);
          color: var(--primary); background: var(--tag-bg);
        }

        /* ── CTA SECTION ── */
        .cta-section {
          padding: 96px 48px; text-align: center;
          background: var(--surface);
          border-top: 1px solid var(--border);
        }
        .cta-box {
          max-width: 700px; margin: 0 auto;
          background: linear-gradient(135deg, var(--primary) 0%, #4338ca 50%, var(--blue) 100%);
          border-radius: 24px; padding: 64px 48px;
          position: relative; overflow: hidden;
        }
        .cta-box::before {
          content: '';
          position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .cta-title {
          font-size: clamp(32px, 4vw, 46px);
          font-weight: 800; line-height: 1.1;
          color: white; margin-bottom: 14px;
          letter-spacing: -0.03em; position: relative; z-index: 1;
        }
        .cta-sub {
          font-size: 16px; color: rgba(255,255,255,0.75);
          margin-bottom: 36px; line-height: 1.7; position: relative; z-index: 1;
        }
        .cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }
        .btn-cta-white {
          padding: 13px 32px; border-radius: 10px;
          background: white; color: var(--primary);
          font-size: 15px; font-weight: 700;
          text-decoration: none; transition: all 0.25s;
          display: inline-flex; align-items: center; gap: 8px;
          border: none;
        }
        .btn-cta-white:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .btn-cta-outline {
          padding: 13px 32px; border-radius: 10px;
          border: 1.5px solid rgba(255,255,255,0.35);
          color: white; font-size: 15px; font-weight: 500;
          text-decoration: none; transition: all 0.25s;
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.08);
        }
        .btn-cta-outline:hover { border-color: white; background: rgba(255,255,255,0.15); }

        /* ── FOOTER ── */
        .footer { border-top: 1px solid var(--border); padding: 60px 48px 40px; background: var(--surface); }
        .footer-inner {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px;
        }
        .footer-brand-name {
          font-size: 18px; font-weight: 800;
          color: var(--ink); margin-bottom: 10px; letter-spacing: -0.3px;
        }
        .footer-brand-desc {
          font-size: 14px; color: var(--muted);
          line-height: 1.7; max-width: 300px; margin-bottom: 24px;
        }
        .footer-contact-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: var(--muted);
          margin-bottom: 10px; text-decoration: none; transition: color 0.2s;
        }
        .footer-contact-item:hover { color: var(--primary); }
        .footer-contact-icon {
          width: 28px; height: 28px;
          border: 1px solid var(--border); border-radius: 7px;
          background: var(--surface-2);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; flex-shrink: 0;
        }
        .footer-col-title {
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--ink); margin-bottom: 18px;
        }
        .footer-links { list-style: none; display: flex; flex-direction: column; gap: 11px; }
        .footer-links a {
          font-size: 14px; color: var(--muted);
          text-decoration: none; transition: color 0.2s;
        }
        .footer-links a:hover { color: var(--primary); }
        .footer-bottom {
          max-width: 1100px; margin: 44px auto 0;
          padding-top: 24px; border-top: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
        }
        .footer-copy { font-size: 13px; color: var(--muted-lt); }
        .footer-copy span { color: var(--primary); font-weight: 600; }
        .social-links { display: flex; gap: 10px; }
        .social-link {
          width: 32px; height: 32px;
          border: 1px solid var(--border); border-radius: 8px;
          background: var(--surface-2);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; text-decoration: none; color: var(--muted);
          transition: all 0.2s;
        }
        .social-link:hover { border-color: var(--primary); color: var(--primary); background: var(--tag-bg); }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── HAMBURGER ── */
        .hamburger {
          display: none; flex-direction: column;
          gap: 5px; cursor: pointer; padding: 6px;
          background: none; border: none;
          z-index: 200;
        }
        .hamburger span {
          display: block; width: 22px; height: 2px;
          background: var(--ink); border-radius: 2px;
          transition: all 0.3s ease;
          transform-origin: center;
        }
        .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* ── MOBILE DRAWER ── */
        .mobile-overlay {
          display: none; position: fixed; inset: 0; z-index: 150;
          background: rgba(15,15,26,0.45);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }
        .mobile-drawer {
          position: absolute; top: 0; right: 0; bottom: 0;
          width: 80%; max-width: 300px;
          background: var(--surface);
          border-left: 1px solid var(--border);
          padding: 80px 28px 40px;
          display: flex; flex-direction: column;
          animation: slideIn 0.3s ease;
          box-shadow: -8px 0 40px rgba(0,0,0,0.1);
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .mobile-nav-links {
          list-style: none; display: flex;
          flex-direction: column; gap: 4px; margin-bottom: 32px;
        }
        .mobile-nav-links a {
          display: block; padding: 12px 16px;
          font-size: 16px; font-weight: 600;
          color: var(--ink); text-decoration: none;
          border-radius: 10px; transition: all 0.15s;
        }
        .mobile-nav-links a:hover { background: var(--tag-bg); color: var(--primary); }
        .mobile-cta { display: flex; flex-direction: column; gap: 10px; }
        .mobile-cta a {
          display: flex; align-items: center; justify-content: center;
          padding: 13px 20px; border-radius: 10px;
          font-size: 15px; font-weight: 600; text-decoration: none;
          transition: all 0.2s;
        }
        .mobile-cta .m-signin {
          border: 1.5px solid var(--border-2);
          color: var(--ink); background: transparent;
        }
        .mobile-cta .m-signin:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-lt); }
        .mobile-cta .m-start {
          background: var(--primary); color: white;
          box-shadow: 0 4px 14px rgba(79,70,229,0.3);
        }
        .mobile-cta .m-start:hover { background: var(--primary-dk); }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .nav {
            padding: 14px 20px;
            background: rgba(255,255,255,0.96);
            border-bottom: 1px solid var(--border);
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          }
          .nav.scrolled { padding: 12px 20px; }
          .nav-links { display: none; }
          .nav-cta { display: none; }
          .hamburger { display: flex; }
          .mobile-overlay { display: block; }

          .hero { padding: 110px 20px 60px; }

          .stats { padding: 40px 20px; }
          .stats-inner { grid-template-columns: repeat(2, 1fr); }
          .stat-item:nth-child(2) { border-right: none; }
          .stat-item:nth-child(3) { border-top: 1px solid var(--border); }
          .stat-item:nth-child(4) { border-top: 1px solid var(--border); border-right: none; }

          .features-grid { grid-template-columns: 1fr; }

          .steps { grid-template-columns: 1fr; }
          .step { border-right: none; border-bottom: 1px solid var(--border); }
          .step:last-child { border-bottom: none; }
          .step-arrow { display: none; }

          .roles { grid-template-columns: 1fr; }

          .footer-inner { grid-template-columns: 1fr; gap: 36px; }
          .footer-bottom { flex-direction: column; text-align: center; }

          .section { padding: 64px 20px; }
          .cta-box { padding: 40px 20px; }
          .preview-content { grid-template-columns: repeat(2, 1fr); }

          .hero-title { letter-spacing: -0.02em; }
          .section-title { letter-spacing: -0.02em; }
        }

        @media (max-width: 480px) {
          .stats-inner { grid-template-columns: 1fr 1fr; }
          .stat-number { font-size: 36px; }
          .preview-content { grid-template-columns: 1fr 1fr; gap: 8px; padding: 16px; }
          .preview-stat { padding: 12px 10px; }
          .preview-stat-val { font-size: 18px; }
        }
      `}</style>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <ul className="mobile-nav-links">
              <li><a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a></li>
              <li><a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a></li>
              <li><a href="#roles" onClick={() => setMobileMenuOpen(false)}>For You</a></li>
              <li><a href="#tech" onClick={() => setMobileMenuOpen(false)}>Tech Stack</a></li>
            </ul>
            <div className="mobile-cta">
              <a href="https://placement-portal-red.vercel.app/login" className="m-signin">Sign In</a>
              <a href="https://placement-portal-red.vercel.app/register" className="m-start">Get Started →</a>
            </div>
          </div>
        </div>
      )}

      {/* ── NAV ── */}
 <nav className={`nav ${scrollY > 60 ? "scrolled" : ""}`}>
  <a href="#" className="nav-logo flex items-center gap-2">
    <img
      src="/logo.png"
      alt="Placement Portal"
      className="w-12 h-12 object-contain"
    />
    <span className="nav-logo-text text-lg font-semibold">
      PlacementPortal
    </span>
  </a>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#roles">For You</a></li>
          <li><a href="#tech">Tech</a></li>
        </ul>
        <div className="nav-cta">
          <a href="https://placement-portal-red.vercel.app/login" className="btn-ghost">Sign In</a>
          <a href="https://placement-portal-red.vercel.app/register" className="btn-primary">Get Started →</a>
        </div>
        <button
          className={`hamburger ${mobileMenuOpen ? "open" : ""}`}
          onClick={() => setMobileMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-dots" />
        <div className="hero-badge">
          <div className="badge-pulse" />
          Production-Grade Platform
        </div>
        <h1 className="hero-title">
          The Smart Way to Manage<br />
          <em>Campus Placements</em>
        </h1>
        <p className="hero-sub">
          A full-stack placement portal built for modern colleges — streamlining student onboarding,
          job postings, applications, and result processing in one powerful platform.
        </p>
        <div className="hero-actions">
          <a href="https://placement-portal-red.vercel.app/register" className="btn-hero-primary">
            Start for Free →
          </a>
          <a href="https://placement-portal-red.vercel.app/login" className="btn-hero-secondary">
            Sign In
          </a>
        </div>
        {/* Mini dashboard preview */}
        <div className="hero-preview">
          <div className="hero-preview-frame">
            <div className="preview-bar">
              <div className="preview-dot" style={{ background: "#ef4444" }} />
              <div className="preview-dot" style={{ background: "#f59e0b" }} />
              <div className="preview-dot" style={{ background: "#22c55e" }} />
              <div className="preview-url">placement-portal.vercel.app/dashboard</div>
            </div>
            <div className="preview-content">
              <div className="preview-stat">
                <div className="preview-stat-label">Total Students</div>
                <div className="preview-stat-val blue">8</div>
              </div>
              <div className="preview-stat">
                <div className="preview-stat-label">Placed Students</div>
                <div className="preview-stat-val green">3</div>
              </div>
              <div className="preview-stat">
                <div className="preview-stat-label">Placement Rate</div>
                <div className="preview-stat-val orange">37.5%</div>
              </div>
              <div className="preview-stat">
                <div className="preview-stat-label">Max Package</div>
                <div className="preview-stat-val blue">₹56 LPA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats">
        <div className="stats-inner">
          <div className="stat-item">
            <div className="stat-number"><Counter end={100} suffix="+" /></div>
            <div className="stat-label">Features Built</div>
          </div>
          <div className="stat-item">
            <div className="stat-number"><Counter end={99} suffix="%" /></div>
            <div className="stat-label">Faster API Response</div>
          </div>
          <div className="stat-item">
            <div className="stat-number"><Counter end={500} suffix="+" /></div>
            <div className="stat-label">Students Supported</div>
          </div>
          <div className="stat-item">
            <div className="stat-number"><Counter end={7} suffix="+" /></div>
            <div className="stat-label">Eligibility Criteria</div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="section" id="features" style={{ background: "var(--bg)" }}>
        <div className="section-inner">
          <div className="centered">
            <div className="section-label">✦ Everything You Need</div>
            <h2 className="section-title">Built for Real<br /><em>Placement Workflows</em></h2>
            <p className="section-sub">
              Every feature is designed around how placement cells actually work —
              from bulk imports to automated result processing.
            </p>
          </div>
          <div className="features-grid">
            <FeatureCard delay={0} icon="📊" title="Placement Dashboard" description="Real-time stats with branch-wise charts, package distribution, top hiring companies, and monthly placement trends — everything at a glance." />
            <FeatureCard delay={50} icon="🏢" title="Job Management" description="Create job postings with 7+ eligibility criteria — CGPA, 10th/12th marks, branch, backlogs, year, and placement status. Full datetime deadlines." />
            <FeatureCard delay={100} icon="📤" title="Bulk Import Students" description="Upload an Excel sheet — the portal auto-creates accounts, sends activation emails with crypto-secure tokens, and locks academic data automatically." />
            <FeatureCard delay={150} icon="📥" title="Bulk Result Processing" description="Upload company Excel files. Roll numbers are auto-detected with fuzzy matching, dry-run preview shows changes before applying, emails sent automatically." />
            <FeatureCard delay={200} icon="🔒" title="Profile Locking" description="Admins can lock student profiles to prevent modification of CGPA, marks, and backlogs — ensuring data integrity during placement season." />
            <FeatureCard delay={250} icon="⚡" title="Smart Caching" description="Node-Cache with smart invalidation reduces API response times from 470ms to under 5ms — 99% faster on repeat requests across all major endpoints." />
            <FeatureCard delay={300} icon="📧" title="Automated Emails" description="Students receive emails for every status change — shortlisted, OA cleared, technical interview, HR round, and final selection automatically." />
            <FeatureCard delay={350} icon="🛡️" title="Role-Based Access" description="JWT-based authentication with separate student and admin flows. Profile locking, debarring, verification gates, and account status management." />
            <FeatureCard delay={400} icon="📋" title="Audit Logs" description="Every bulk operation is logged — who uploaded, when, which company, how many records updated. Full transparency for placement cell accountability." />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section" id="how-it-works" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section-inner">
          <div className="centered">
            <div className="section-label">✦ Simple Process</div>
            <h2 className="section-title">How It <em>Works</em></h2>
            <p className="section-sub">
              From onboarding to final placement — the entire workflow automated in three steps.
            </p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-arrow">→</div>
              <h3 className="step-title">Onboard Students</h3>
              <p className="step-desc">Admin imports Excel with student data. Accounts are created, academic data pre-filled and locked, activation emails sent automatically.</p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-arrow">→</div>
              <h3 className="step-title">Post & Apply</h3>
              <p className="step-desc">Admin creates job postings with eligibility criteria. Eligible students apply. Server-side engine validates every application — no frontend trust.</p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h3 className="step-title">Process Results</h3>
              <p className="step-desc">Upload company Excel → auto-detect roll numbers → preview changes → confirm → all students notified instantly via email. Zero manual work.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="section" id="roles" style={{ background: "var(--bg)" }}>
        <div className="section-inner">
          <div className="section-label">✦ Two Powerful Roles</div>
          <h2 className="section-title">Built for <em>Students & Admins</em></h2>
          <p className="section-sub">Two completely separate experiences — each designed for its users.</p>
          <div className="roles">
            <div className="role-card primary-card">
              <div className="role-tag">👨‍🎓 For Students</div>
              <h3 className="role-title">Manage Your Placement Journey</h3>
              <p className="role-sub">Everything you need from profile to offer letter — all in one place.</p>
              <ul className="role-list">
                {["Browse jobs with real-time eligibility badges", "Track applications with round-by-round progress", "Upload resume and profile photo to Cloudinary", "Add 10th, 12th marks, CGPA, skills", "Withdraw applications before deadline", "Contact placement cell with FAQ support", "Receive email notifications for every update"].map(item => (
                  <li key={item}><span className="check">✓</span>{item}</li>
                ))}
              </ul>
              <a href="https://placement-portal-red.vercel.app/register" className="role-cta">Register as Student →</a>
            </div>
            <div className="role-card">
              <div className="role-tag">👨‍💼 For Admins</div>
              <h3 className="role-title">Full Control & Automation</h3>
              <p className="role-sub">Complete control over the placement process — with powerful automation tools.</p>
              <ul className="role-list">
                {["Dashboard with charts and placement statistics", "Create jobs with 7+ eligibility criteria", "Bulk import 500+ students from Excel", "Process company results with one Excel upload", "Verify, debar, lock, and manage all students", "Export applicants to Excel with resume links", "Audit logs for every bulk operation"].map(item => (
                  <li key={item}><span className="check">✓</span>{item}</li>
                ))}
              </ul>
              <a href="https://placement-portal-red.vercel.app/login" className="role-cta-ghost">Admin Login →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section className="section" id="tech" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div className="section-inner">
          <div className="centered">
            <div className="section-label">✦ Tech Stack</div>
            <h2 className="section-title">Built with <em>Modern Technologies</em></h2>
            <p className="section-sub">
              Production-grade stack chosen for performance, reliability, and developer experience.
            </p>
          </div>
          <div className="tech-grid">
            {["React.js", "Vite", "Tailwind CSS", "Node.js", "Express.js", "MongoDB", "JWT Auth", "Node-Cache", "Cloudinary", "Brevo SMTP", "Vercel", "Render", "Prisma ORM", "Docker", "Vercel Analytics"].map(t => (
              <div key={t} className="tech-pill">{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-box">
          <h2 className="cta-title">Ready to Transform Your Placement Process?</h2>
          <p className="cta-sub">
            Join the portal today. Students can self-register or admins can bulk import entire batches in minutes.
          </p>
          <div className="cta-btns">
            <a href="https://placement-portal-red.vercel.app/register" className="btn-cta-white">Get Started Free →</a>
            <a href="https://placement-portal-red.vercel.app/login" className="btn-cta-outline">Sign In</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div className="nav-logo-icon">P</div>
              <div className="footer-brand-name">PlacementPortal</div>
            </div>
            <p className="footer-brand-desc">
              A production-grade college placement management system — built to streamline every step from student onboarding to final selection.
            </p>
            <a href="mailto:kumarjhanitesh09@gmail.com" className="footer-contact-item">
              <div className="footer-contact-icon">✉</div>kumarjhanitesh09@gmail.com
            </a>
            <a href="tel:+919212290136" className="footer-contact-item">
              <div className="footer-contact-icon">📞</div>+91 9212290136
            </a>
            <a href="http://www.linkedin.com/in/nitesh-kumar-jha-55b484263" target="_blank" rel="noreferrer" className="footer-contact-item">
              <div className="footer-contact-icon">in</div>Nitesh Jha
            </a>
            <a href="https://github.com/niteshhh001" target="_blank" rel="noreferrer" className="footer-contact-item">
              <div className="footer-contact-icon">⌥</div>github.com/niteshhh001
            </a>
          </div>
          <div>
            <div className="footer-col-title">Portal</div>
            <ul className="footer-links">
              <li><a href="https://placement-portal-red.vercel.app/login">Sign In</a></li>
              <li><a href="https://placement-portal-red.vercel.app/register">Register</a></li>
              <li><a href="https://placement-portal-red.vercel.app/forgot-password">Forgot Password</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Developer</div>
            <ul className="footer-links">
              <li><a href="https://github.com/niteshhh001/Placement_Portal" target="_blank" rel="noreferrer">GitHub Repo</a></li>
              <li><a href="https://my-port-folio-nitesh.vercel.app/" target="_blank" rel="noreferrer">Portfolio</a></li>
              <li><a href="http://www.linkedin.com/in/nitesh-kumar-jha-55b484263" target="_blank" rel="noreferrer">LinkedIn</a></li>
              <li><a href="https://placement-portal-f7dv.onrender.com/api/health" target="_blank" rel="noreferrer">API Health</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© 2026 PlacementPortal. Built with ♥ by <span>Nitesh Jha</span></p>
          <div className="social-links">
            <a href="https://github.com/niteshhh001" target="_blank" rel="noreferrer" className="social-link">⌥</a>
            <a href="http://www.linkedin.com/in/nitesh-kumar-jha-55b484263" target="_blank" rel="noreferrer" className="social-link">in</a>
            <a href="mailto:kumarjhanitesh09@gmail.com" className="social-link">✉</a>
            <a href="https://my-port-folio-nitesh.vercel.app/" target="_blank" rel="noreferrer" className="social-link">◈</a>
          </div>
        </div>
      </footer>
    </>
  );
}
