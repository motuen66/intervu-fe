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
  LineChart
} from 'lucide-react';
import { PrimaryButton, SecondaryButton, TextButton } from '../../../common/components/buttons';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PublicHeader from '../../../common/components/PublicHeader';
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

  return (
    <div className="landing-page polished-light" ref={pageRef}>
      <PublicHeader />

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
