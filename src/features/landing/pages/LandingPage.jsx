import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dna,
  ArrowRight,
  MonitorPlay,
  ScanSearch,
  Terminal,
  LibraryBig,
  Zap,
  GitMerge,
  Trophy,
  LineChart,
  CheckCircle2
} from 'lucide-react';
import { PrimaryButton, SecondaryButton, TextButton } from '../../../common/components/buttons';
import FormTextField from '../../../common/components/form/FormTextField';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '../../../common/components/Navbar/Navbar';
import ThreeHero from '../components/ThreeHero';
import '../styles/LandingPage.css';

gsap.registerPlugin(ScrollTrigger);

const kineticWords = ['Train.', 'Refine.', 'Perform.'];

const floatingCards = [
  {
    label: 'mock_room.mov',
    title: 'Live mock room',
    detail: 'Video, code, pressure sync',
    type: 'media',
    x: '4%',
    y: '18%',
    rotate: -8,
    dx: -120,
    dy: -80,
    drift: 28
  },
  {
    label: 'behavioral.ts',
    title: 'Answer framing',
    detail: 'Action, tradeoff, result',
    type: 'code',
    x: '17%',
    y: '58%',
    rotate: 7,
    dx: -150,
    dy: 55,
    drift: 22
  },
  {
    label: 'feedback.md',
    title: 'Coach notes',
    detail: 'Clarity and depth',
    type: 'doc',
    x: '67%',
    y: '16%',
    rotate: 10,
    dx: 135,
    dy: -90,
    drift: 30
  },
  {
    label: 'signal.json',
    title: 'Signal report',
    detail: 'Strengths and leaks',
    type: 'code',
    x: '74%',
    y: '62%',
    rotate: -10,
    dx: 145,
    dy: 72,
    drift: 26
  },
  {
    label: 'score 87',
    title: 'Readiness',
    detail: 'Improved after retry',
    type: 'metric',
    x: '58%',
    y: '76%',
    rotate: -6,
    dx: 90,
    dy: 138,
    drift: 18
  },
  {
    label: 'retry flow',
    title: 'Next pass',
    detail: 'Fix the weak answer',
    type: 'metric',
    x: '9%',
    y: '76%',
    rotate: -5,
    dx: -95,
    dy: 132,
    drift: 20
  }
];

const overviewCards = [
  {
    icon: <Dna size={20} className="text-blue-400" />,
    label: 'AI GAP ANALYSIS',
    title: 'Decode your DNA. Bridge the Gap.',
    meta: 'CV VS JD MATCHING • SKILL DEFICIT • TARGET ALIGNMENT',
    size: 'wide' // Bento wide
  },
  {
    icon: <MonitorPlay size={20} className="text-purple-400" />,
    label: 'HYBRID MOCK ROOMS',
    title: 'Practice where the pressure is real.',
    meta: 'AI AVATARS • ELITE COACHES • LIVE CODING',
  },
  {
    icon: <Zap size={20} className="text-yellow-400" />,
    label: 'INTELLIGENT FEEDBACK',
    title: 'Turn your weak spots into your edge.',
    meta: 'SENTIMENT ANALYSIS • ACTIONABLE STEPS • SCORECARD',
  },
  {
    icon: <GitMerge size={20} className="text-green-400" />,
    label: 'DYNAMIC ROADMAPS',
    title: 'A custom path for every ambition.',
    meta: 'ADAPTIVE LEARNING • ROLE-SPECIFIC • MILESTONES',
    size: 'tall' // Bento tall
  },
  {
    icon: <LineChart size={20} className="text-red-400" />,
    label: 'PROGRESS ANALYTICS',
    title: 'Visualize your growth in real-time.',
    meta: 'READINESS INDEX • SKILL TRACKING • GROWTH CURVE',
  },
];

const moduleStories = [
  {
    step: '01',
    label: 'Identify Gaps',
    title: 'Decode your alignment.',
    description: 'AI scans your CV against JD requirements to pinpoint exactly where you stand.',
    accent: 'var(--story-blue)',
    icon: <ScanSearch size={18} />,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000' // Placeholder 1 (GAP ANALYSIS)
  },
  {
    step: '02',
    label: 'Question Bank',
    title: 'Weaponize your knowledge.',
    description: 'Access 10,000+ targeted questions mapped to your specific skill gaps and job roles.',
    accent: 'var(--story-pink)',
    icon: <LibraryBig size={18} />,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000' // Placeholder 2 (ROADMAP)
  },
  {
    step: '03',
    label: 'Mock Session',
    title: 'Execute under pressure.',
    description: 'Apply your prep in high-fidelity rooms with AI or elite coaches and live coding.',
    accent: 'var(--story-green)',
    icon: <Terminal size={18} />,
    image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=1000' // Placeholder 3 (MOCK ROOM)
  },
  {
    step: '04',
    label: 'Mastery',
    title: 'Dominate the interview.',
    description: 'Visualize your progress, fix every weakness, and step into the room with total confidence.',
    accent: 'var(--story-violet)',
    icon: <Trophy size={18} />,
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1000' // Placeholder 4 (MASTERY)
  }
];

function LandingPage() {
  const moduleStickyTop = 20;
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const pageRef = useRef(null);
  const moduleSectionRef = useRef(null);
  const moduleScrollTriggerRef = useRef(null);
  const overviewSectionRef = useRef(null);
  const storyCopyRef = useRef(null);
  const activeModuleRef = useRef(0);
  const [activeWord, setActiveWord] = useState(0);
  const activeWordRef = useRef(0);
  const [heroProgress, setHeroProgress] = useState(0);
  const [activeModule, setActiveModule] = useState(0);
  const [formStatus, setFormStatus] = useState('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experienceInput: '',
    linkedin: ''
  });
  const [coachProgress, setCoachProgress] = useState(0);
  const [mounted] = useState(true);
  const btnRef = useRef(null);

  // Performance-optimized refs for high-frequency updates
  const pointerRef = useRef({ x: 0, y: 0 });
  const orbSyncRef = useRef({ rotation: { x: 0, y: 0 }, floatingY: 0 });
  const cardsRef = useRef([]);

  useEffect(() => {
    const handleMove = event => {
      pointerRef.current = {
        x: event.clientX / window.innerWidth - 0.5,
        y: event.clientY / window.innerHeight - 0.5
      };
    };

    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  useEffect(() => {
    const reveals = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          } else {
            entry.target.classList.remove('is-visible');
          }
        });
      },
      { threshold: 0.16 }
    );

    reveals.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!heroRef.current || !titleRef.current) return undefined;

    // Scroll-based Hero Parallax
    const heroTrigger = ScrollTrigger.create({
      trigger: heroRef.current,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: self => setHeroProgress(self.progress)
    });

    // Autonomous Word Switching
    const storyLoop = setInterval(() => {
      setActiveWord(prev => {
        const next = (prev + 1) % kineticWords.length;
        activeWordRef.current = next;
        return next;
      });
    }, 2500);

    // High-performance direct-DOM update loop for cards
    const updateCards = () => {
      const p = pointerRef.current;
      const orb = orbSyncRef.current;
      const hp = heroProgress;

      cardsRef.current.forEach((cardEl, i) => {
        if (!cardEl) return;
        const card = floatingCards[i];

        // Orbital physics calculation
        const x = p.x * (i % 2 === 0 ? -24 : 24) + card.dx * hp + (orb.rotation.y * 50);
        const y = p.y * (i < 3 ? -18 : 18) + card.dy * hp - Math.sin(hp * Math.PI) * card.drift + (orb.rotation.x * 50) + (orb.floatingY * 100);
        const rotate = card.rotate + p.x * 8 + hp * (i % 2 === 0 ? -16 : 16);
        const scale = 1 - hp * 0.12 + (i === activeWordRef.current || i === activeWordRef.current + 3 ? 0.04 : 0);

        cardEl.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
        cardEl.style.opacity = (1 - hp * 0.28).toString();
      });
    };

    gsap.ticker.add(updateCards);

    return () => {
      heroTrigger.kill();
      clearInterval(storyLoop);
      gsap.ticker.remove(updateCards);
    };
  }, [heroProgress]);

  useEffect(() => {
    if (!pageRef.current) return undefined;

    const ctx = gsap.context(() => {
      const stages = gsap.utils.toArray('[data-text-stage]');

      stages.forEach(stage => {
        const titleNodes = stage.querySelectorAll('[data-stage-title]');
        const bodyNodes = stage.querySelectorAll('[data-text-body]');

        const enterTl = gsap.timeline({ paused: true });
        enterTl.fromTo(
          titleNodes,
          {
            y: 52,
            opacity: 0,
            scale: 0.95,
            filter: 'blur(10px)'
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.82,
            ease: 'power4.out',
          }
        );
        enterTl.fromTo(
          bodyNodes,
          {
            y: 26,
            opacity: 0,
            filter: 'blur(10px)'
          },
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.05
          },
          '-=0.45'
        );

        const exitTl = gsap.timeline({ paused: true });
        exitTl.to(titleNodes, {
          y: -20,
          opacity: 0,
          scale: 0.94,
          filter: 'blur(8px)',
          duration: 0.42,
          ease: 'power2.in'
        });
        exitTl.to(
          bodyNodes,
          {
            y: -18,
            opacity: 0,
            filter: 'blur(8px)',
            duration: 0.32,
            ease: 'power2.in'
          },
          '<'
        );

        ScrollTrigger.create({
          trigger: stage,
          start: 'top 72%',
          end: 'bottom 24%',
          onEnter: () => {
            exitTl.pause(0);
            enterTl.restart();
          },
          onEnterBack: () => {
            exitTl.pause(0);
            enterTl.restart();
          },
          onLeave: () => {
            enterTl.pause(0);
            exitTl.restart();
          },
          onLeaveBack: () => {
            enterTl.pause(0);
            exitTl.restart();
          }
        });
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!overviewSectionRef.current) return undefined;

    const ctx = gsap.context(() => {
      const headingNodes = overviewSectionRef.current.querySelectorAll(
        '.section-kicker span, .section-kicker p, .section-stage-title'
      );
      const cards = overviewSectionRef.current.querySelectorAll('.overview-card');

      gsap.set(headingNodes, {
        opacity: 0,
        y: 24,
        filter: 'blur(8px)'
      });

      gsap.set(cards, {
        opacity: 0,
        x: 90,
        rotateY: -8,
        scale: 0.97
      });

      const inTl = gsap.timeline({ paused: true });
      inTl.to(
        headingNodes,
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08
        },
        0
      );
      inTl.to(
        cards,
        {
          opacity: 1,
          y: 0,
          x: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.18
        }
      );

      ScrollTrigger.create({
        trigger: overviewSectionRef.current,
        start: 'top 76%',
        end: 'bottom 24%',
        onEnter: () => {
          inTl.pause(0);
          inTl.play();
        },
        onEnterBack: () => {
          inTl.pause(0);
          inTl.play();
        },
        onLeaveBack: () => {
          inTl.reverse();
        }
      });
    }, overviewSectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    activeModuleRef.current = activeModule;
  }, [activeModule]);

  useEffect(() => {
    if (!storyCopyRef.current) return undefined;

    const ctx = gsap.context(() => {
      const titleNode = storyCopyRef.current.querySelector('[data-story-title]');
      const bodyNodes = storyCopyRef.current.querySelectorAll('[data-text-body]');

      gsap.fromTo(
        titleNode,
        {
          y: 56,
          opacity: 0,
          scale: 0.94,
          filter: 'blur(10px)'
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.78,
          ease: 'power4.out',
        }
      );

      gsap.fromTo(
        bodyNodes,
        {
          y: 20,
          opacity: 0,
          filter: 'blur(10px)'
        },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.55,
          ease: 'power3.out'
        }
      );
    }, storyCopyRef);

    return () => ctx.revert();
  }, [activeModule]);

  useEffect(() => {
    if (!moduleSectionRef.current) return undefined;

    const ctx = gsap.context(() => {
      const storyCount = moduleStories.length;
      const pinnedPanel = moduleSectionRef.current.querySelector('.modules-story-layout');
      let lastIndex = -1;

      moduleScrollTriggerRef.current = ScrollTrigger.create({
        trigger: moduleSectionRef.current,
        start: () => `top top+=${moduleStickyTop}`,
        end: () => `+=${window.innerHeight * (storyCount + 0.6)}`,
        pin: pinnedPanel,
        pinSpacing: true,
        scrub: 0.9,
        onUpdate: self => {
          const nextIndex = Math.max(
            0,
            Math.min(storyCount - 1, Math.round(self.progress * (storyCount - 1)))
          );

          if (nextIndex !== lastIndex) {
            lastIndex = nextIndex;
            setActiveModule(nextIndex);
          }
        }
      });
    }, moduleSectionRef);

    return () => {
      if (moduleScrollTriggerRef.current) {
        moduleScrollTriggerRef.current.kill();
        moduleScrollTriggerRef.current = null;
      }
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    const filledBase = [formData.name, formData.email, formData.phone, formData.linkedin]
      .filter(v => String(v || '').trim() !== '').length;
    const hasExperience = Boolean(formData.experienceInput.trim());
    const filled = filledBase + (hasExperience ? 1 : 0);
    setCoachProgress(Math.round((filled / 5) * 100));
  }, [formData]);



  const heroVisualStyle = useMemo(
    () => ({
      transform: `translateY(${heroProgress * 28}px) scale(${1 - heroProgress * 0.06})`,
      opacity: 1 - heroProgress * 0.08
    }),
    [heroProgress]
  );

  const activeStory = moduleStories[activeModule];
  const moduleProgress = (activeModule + 1) / moduleStories.length;
  const clampedStoryProgress =
    moduleStories.length > 1 ? activeModule / (moduleStories.length - 1) : 1;

  const focusModuleSection = index => {
    setActiveModule(index);
    activeModuleRef.current = index;

    const trigger = moduleScrollTriggerRef.current;
    if (!trigger || typeof trigger.start !== 'number' || typeof trigger.end !== 'number') return;

    const ratio = moduleStories.length > 1 ? index / (moduleStories.length - 1) : 0;
    const targetY = trigger.start + (trigger.end - trigger.start) * ratio;

    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  };

  const set = field => e => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleRipple = e => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position:absolute;border-radius:50%;
      background:rgba(255,255,255,0.25);
      width:${size}px;height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
      transform:scale(0);
      animation:rippleOut 0.6s linear forwards;
      pointer-events:none;
    `;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  };

  const handleFormSubmit = async e => {
    e.preventDefault();
    if (formStatus === 'submitting') return;

    const required = ['name', 'email'];
    let hasError = false;
    required.forEach(field => {
      if (!formData[field].trim()) hasError = true;
    });
    if (!formData.experienceInput.trim()) {
      hasError = true;
    }
    if (hasError) return;

    setFormStatus('submitting');
    await new Promise(res => setTimeout(res, 1100));
    setFormStatus('success');
  };

  const handleResetForm = () => {
    setFormStatus('idle');
    setFormData({ name: '', email: '', phone: '', experienceInput: '', linkedin: '' });
  };

  const animDelay = i => (mounted ? `${i * 0.07}s` : '0s');
  const fieldStyle = i => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(16px)',
    transition: `opacity 0.5s ${animDelay(i)} cubic-bezier(0.16,1,0.3,1), transform 0.5s ${animDelay(i)} cubic-bezier(0.16,1,0.3,1)`,
  });
  const coachFieldSx = {
    '& .MuiOutlinedInput-root': {
      minHeight: 52,
      borderRadius: '12px',
      backgroundColor: '#fafafa',
      '&:hover': { backgroundColor: '#fff' },
      '&.Mui-focused': {
        backgroundColor: '#fff',
        boxShadow: '0 0 0 4px rgba(16,185,129,0.1)'
      }
    },
    '& .MuiInputLabel-root': {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 600,
      color: '#94a3b8'
    },
    '& .MuiInputBase-input': {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '0.9rem',
      fontWeight: 600,
      color: '#020617'
    }
  };

  return (
    <div className="landing-page polished-light" ref={pageRef}>
      <Navbar />

      <section className="hero-polished" ref={heroRef}>
        <div className="hero-noise" />
        <div className="hero-grid-pattern" />

        <div className="landing-shell">
          <div className="hero-polished-layout">
            <div className="hero-copy-polished">
              <div className="hero-copy-topline">
                <span>Interview rehearsal</span>
              </div>
              <div className="kinetic-stack" ref={titleRef}>
                {kineticWords.map((word, index) => (
                  <span
                    key={word}
                    className={index === activeWord ? 'kinetic-word is-active' : 'kinetic-word'}
                  >
                    {word}
                  </span>
                ))}
              </div>

              <div className="hero-cta-row">
                <PrimaryButton onClick={() => navigate('/home')} sx={{ minWidth: 140 }}>
                  Start now
                </PrimaryButton>
                <SecondaryButton onClick={() => navigate('/questions')} sx={{ minWidth: 140 }}>
                  Explore bank <ArrowRight size={16} />
                </SecondaryButton>
              </div>
            </div>

            <div className="hero-visual-polished" style={heroVisualStyle}>
              <ThreeHero
                pointer={pointerRef.current}
                onUpdate={(sync) => { orbSyncRef.current = sync; }}
              />

              {floatingCards.map((card, index) => (
                <article
                  key={card.label}
                  ref={el => { cardsRef.current[index] = el; }}
                  className={`floating-card ${card.type}`}
                  style={{ left: card.x, top: card.y }}
                >
                  <span className="floating-card-label">{card.label}</span>
                  <strong className="floating-card-title">{card.title}</strong>
                  <small className="floating-card-detail">{card.detail}</small>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="landing-section modules-story-section"
        id="modules"
        ref={moduleSectionRef}
      >
        <div className="landing-shell">
          <div className="modules-story-layout story-single-layout">
            <div className="story-single-wrap">
              <div className="section-kicker">
                <span data-reveal>Modules</span>
                <p data-reveal>One card stays pinned. Scroll to move through each state of the system.</p>
              </div>

              <article
                className="story-single-card"
                style={{ '--story-accent': activeStory.accent }}
              >
                <div className="story-single-header">
                  <div className="story-single-head">
                    <span className="story-preview-icon">{activeStory.icon}</span>
                    <div>
                      <p>{activeStory.label}</p>
                      <strong>{activeStory.step}</strong>
                    </div>
                  </div>
                  <div className="story-single-mini-progress">
                    <span>{activeStory.step}</span>
                    <small>{moduleStories.length.toString().padStart(2, '0')}</small>
                  </div>
                </div>

                <div className="story-single-body">
                  <div className="story-single-copy" ref={storyCopyRef} key={activeStory.step}>
                    <h2 data-story-title>{activeStory.title}</h2>
                    <p data-text-body>{activeStory.description}</p>
                  </div>

                  <div className="story-single-art">
                    <div
                      className="story-preview-surface"
                      style={{
                        transform: `rotate(${(-4 + clampedStoryProgress * 5).toFixed(2)}deg) translateY(${clampedStoryProgress * 12}px)`,
                        background: activeStory.image ? `url(${activeStory.image}) center/cover no-repeat` : '#fff'
                      }}
                    >
                      {activeStory.image && <div className="story-image-overlay" />}
                    </div>
                    <div
                      className="story-preview-orb"
                      style={{
                        transform: `rotate(${(18 - clampedStoryProgress * 14).toFixed(2)}deg) scale(${(0.96 + clampedStoryProgress * 0.08).toFixed(3)}) translateY(${(clampedStoryProgress * -10).toFixed(2)}px)`
                      }}
                    />
                    <div className="story-preview-glow" />
                  </div>
                </div>

                <div className="story-progress">
                  <div className="story-progress-track">
                    <span
                      className="story-progress-fill"
                      style={{ width: `${moduleProgress * 100}%` }}
                    />
                  </div>
                  <div className="story-progress-steps">
                    {moduleStories.map((story, index) => (
                      <button
                        key={story.step}
                        type="button"
                        className={index === activeModule ? 'is-active' : ''}
                        onClick={() => focusModuleSection(index)}
                      >
                        <strong>{story.step}</strong>
                        <small>{story.label}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section
        className="landing-section reveal-section modules-grid-section"
        data-reveal
        ref={overviewSectionRef}
      >
        <div className="landing-shell">
          <div className="section-heading-block">
            <div className="section-kicker section-kicker-spread" data-reveal>
              <span data-text-body>Overview</span>
              <p data-text-body>The full system, summarized after the story finishes.</p>
            </div>
            <h2 className="section-stage-title" data-reveal>
              See the full rehearsal system.
            </h2>
          </div>

          <div className="overview-grid">
            {overviewCards.map((card, idx) => (
              <article
                key={card.label}
                className={`overview-card ${card.size ? `bento-${card.size}` : ''}`}
                data-reveal
                style={{ transitionDelay: `${idx * 0.08}s` }}
                onPointerMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                }}
              >
                <div className="bento-card-spotlight" />
                <div className="bento-card-top">
                  <span className="bento-icon">{card.icon}</span>
                  <p>{card.label}</p>
                </div>
                <h3>{card.title}</h3>
                <span className="bento-meta">{card.meta}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="coaches" style={{ fontFamily: "'Outfit', sans-serif", padding: '8rem 0', background: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div className="coach-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '4rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <span style={{
              fontSize: 10, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase',
              color: '#10b981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 99, padding: '6px 14px', display: 'inline-block', width: 'fit-content',
              animation: 'fadeSlideUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both',
            }}>
              Join our network
            </span>

            <div style={{ animation: 'fadeSlideUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both' }}>
              <h2 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 950, lineHeight: 0.95, letterSpacing: '-0.04em', color: '#0f172a', margin: '0 0 0.5rem' }}>
                SHARE YOUR
              </h2>
              <h2 style={{
                fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 950, lineHeight: 0.95,
                letterSpacing: '-0.04em', margin: 0,
                background: 'linear-gradient(90deg, #10b981, #d9f99d)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                EXPERTISE.
              </h2>
            </div>

            <p style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b', lineHeight: 1.65, margin: 0, animation: 'fadeSlideUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both' }}>
              We are looking for Senior Engineers, Architects, and Tech Leads from global tech giants to mentor the next generation of talent.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem', animation: 'fadeSlideUp 0.6s 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
              {[
                'Flexible hours that fit your schedule',
                'Global networking with high-caliber talent',
                'Competitive compensation & platform perks',
                'Personal brand growth as a thought leader',
              ].map((item, i) => (
                <li key={i} className="perk-item" style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.88rem', fontWeight: 700, color: '#334155', transition: 'transform 0.2s' }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CheckCircle2 size={13} color="#10b981" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div style={{
              padding: '1.5rem', borderRadius: 20,
              background: 'linear-gradient(135deg, #f0fdf4, #f8fafc)',
              border: '1px solid rgba(16,185,129,0.15)',
              animation: 'fadeSlideUp 0.6s 0.5s cubic-bezier(0.16,1,0.3,1) both',
              position: 'relative',
            }}>
              <span style={{ position: 'absolute', top: -10, left: 16, fontSize: '3.5rem', fontWeight: 900, color: '#10b981', lineHeight: 1, opacity: 0.4 }}>"</span>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #10b981, #d9f99d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 900, color: '#020617',
                }}>SS</div>
                <div>
                  <p style={{ fontSize: '0.82rem', fontStyle: 'italic', fontWeight: 500, color: '#475569', margin: '0 0 0.6rem', lineHeight: 1.6 }}>
                    "INTERVU allows me to give back to the community while staying sharp on technical fundamentals."
                  </p>
                  <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#10b981' }}>
                    Sarah S., Staff Engineer at Google
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: -40, right: -40, width: 240, height: 240, borderRadius: '50%', background: 'rgba(217,249,157,0.3)', filter: 'blur(80px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: -40, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', filter: 'blur(80px)', pointerEvents: 'none' }} />

            <div style={{
              position: 'relative', zIndex: 1,
              background: '#fff', borderRadius: 28,
              border: '1px solid #f1f5f9',
              boxShadow: '0 40px 100px rgba(0,0,0,0.08), 0 0 0 1px rgba(16,185,129,0.05)',
              overflow: 'hidden',
            }}>
              <div style={{ height: 4, background: 'linear-gradient(90deg, #10b981, #d9f99d, #10b981)', backgroundSize: '200% 100%' }} />

              <div style={{ padding: '2.5rem 2.5rem 2rem' }}>
                <div style={{ marginBottom: '1.5rem', ...fieldStyle(0) }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#020617', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Apply now</h3>
                  <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#94a3b8', margin: 0 }}>Takes 2 minutes · We'll review within 48h</p>
                </div>

                <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, marginBottom: '2rem', overflow: 'hidden', ...fieldStyle(1) }}>
                  <div style={{
                    height: '100%',
                    width: `${formStatus === 'submitting' ? 100 : coachProgress}%`,
                    background: 'linear-gradient(90deg, #10b981, #d9f99d)',
                    borderRadius: 2,
                    transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow: '0 0 10px rgba(16,185,129,0.4)',
                  }} />
                </div>

                {formStatus === 'success' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '2rem 1rem' }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: 'rgba(16,185,129,0.08)',
                      border: '2px solid rgba(16,185,129,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                    }}>
                      <CheckCircle2 size={32} color="#10b981" />
                    </div>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#020617', margin: 0 }}>Application Received!</h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, margin: 0, lineHeight: 1.65, maxWidth: 280 }}>
                      Thank you for applying. Our team will review your profile and reach out within 48 hours.
                    </p>
                    <button onClick={handleResetForm} style={{
                      fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em',
                      color: '#10b981', background: 'none', border: 'none', cursor: 'pointer',
                      padding: '8px 16px', borderRadius: 8, marginTop: '0.5rem',
                      fontFamily: "'Outfit', sans-serif",
                    }}>
                      Submit another →
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ ...fieldStyle(2), marginBottom: '1.5rem' }}>
                      <FormTextField
                        id="f-name"
                        placeholder="Full Name"
                        type="text"
                        value={formData.name}
                        onChange={set('name')}
                        required
                        fullWidth
                        sx={coachFieldSx}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', ...fieldStyle(3), marginBottom: '1.5rem' }}>
                      <FormTextField
                        id="f-email"
                        placeholder="Work Email"
                        type="email"
                        value={formData.email}
                        onChange={set('email')}
                        required
                        fullWidth
                        sx={coachFieldSx}
                      />
                      <FormTextField
                        id="f-phone"
                        placeholder="Phone Number"
                        type="tel"
                        value={formData.phone}
                        onChange={set('phone')}
                        fullWidth
                        sx={coachFieldSx}
                      />
                    </div>

                    <div style={{...fieldStyle(5), marginBottom: '1.5rem'}} >
                      <FormTextField
                        id="f-experience-input"
                        placeholder="Years of Experience"
                        type="text"
                        value={formData.experienceInput}
                        onChange={set('experienceInput')}
                        required
                        fullWidth
                        sx={coachFieldSx}
                      />
                    </div>

                    <div style={{...fieldStyle(5), marginBottom: '1.5rem'}}>
                      <FormTextField
                        id="f-linkedin"
                        placeholder="LinkedIn Profile URL"
                        type="url"
                        value={formData.linkedin}
                        onChange={set('linkedin')}
                        fullWidth
                        sx={coachFieldSx}
                      />
                    </div>

                    <div style={{...fieldStyle(5), marginBottom: '1.5rem'}}>
                    <button 
                      ref={btnRef}
                      type="submit"
                      disabled={formStatus === 'submitting'}
                      className="intervu-submit-btn"
                      onMouseDown={handleRipple}
                      style={{
                        width: '100%', height: 54,
                        background: '#020617', color: '#fff', border: 'none',
                        borderRadius: 12, fontFamily: "'Outfit', sans-serif",
                        cursor: formStatus === 'submitting' ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                        position: 'relative', overflow: 'hidden',
                        opacity: formStatus === 'submitting' ? 0.8 : 1,
                        ...fieldStyle(6),
                      }}
                    >
                      <span className="btn-overlay" style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg, #10b981, #d9f99d)',
                        opacity: 0, transition: 'opacity 0.3s',
                      }} />
                      {formStatus === 'submitting' ? (
                        <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', position: 'relative', zIndex: 1 }} />
                      ) : (
                        <>
                          <span className="btn-text-inner" style={{ position: 'relative', zIndex: 1, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', transition: 'color 0.3s' }}>
                            Submit Application
                          </span>
                          <span className="btn-arrow-inner" style={{
                            position: 'relative', zIndex: 1,
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, transition: 'all 0.3s',
                          }}>›</span>
                        </>
                      )}
                    </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section reveal-section" id="cta" data-reveal>
        <div className="landing-shell">
          <div className="landing-cta-panel premium-cta">
            <div className="cta-copy-block">
              <div className="cta-marquee">
                <div className="cta-marquee-track">
                  <span>Kill the Gap. Claim the Seat.</span>
                  <span>Kill the Gap. Claim the Seat.</span>
                  <span>Kill the Gap. Claim the Seat.</span>
                </div>
              </div>
            </div>
            <div className="hero-cta-row">
              <PrimaryButton onClick={() => navigate('/home')} sx={{ minWidth: 140 }}>
                Start now
              </PrimaryButton>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer-simple">
        <div className="landing-shell">
          <p>&copy; 2026 Intervu. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

