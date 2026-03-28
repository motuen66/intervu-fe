import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchInterviewers,
  fetchCompanies,
  fetchSkills,
  setPage
} from '../store/homeSlice';
import FilterBar from '../components/FilterBar';
import CoachCar from '../components/CoachCard';
import {
  Star,
  ArrowRight,
  Search,
  MonitorPlay,
  Terminal,
  Zap,
  ScanSearch,
  Trophy,
  Users,
  Calendar
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './HomePage.css';

gsap.registerPlugin(ScrollTrigger);

const specializedTracks = [
  { icon: <MonitorPlay size={24} />, label: 'System Design' },
  { icon: <Terminal size={24} />, label: 'Backend Engineering' },
  { icon: <Zap size={24} />, label: 'Frontend Architecture' },
  { icon: <ScanSearch size={24} />, label: 'Product Management' },
  { icon: <Trophy size={24} />, label: 'Behavioral Excellence' },
];

const workflowSteps = [
  {
    step: '1',
    label: 'Find Coach',
    description: "Browse elite mentors from the world's leading tech and finance organizations.",
    icon: <Users size={24} />
  },
  {
    step: '2',
    label: 'Book Slot',
    description: 'Schedule a 1-on-1 mock interview at a time that works for your preparation cycle.',
    icon: <Calendar size={24} />
  },
  {
    step: '3',
    label: 'Ace Interview',
    description: 'Receive rigorous feedback and specific actionable steps to secure your dream offer.',
    icon: <Trophy size={24} />
  },
];

function HomePage() {
  const dispatch = useDispatch();
  const browseSectionRef = useRef(null);
  const {
    interviewers,
    loading,
    error,
    filters,
    pagination
  } = useSelector((state) => state.home);

  // Get user info from auth state
  const { userData } = useSelector((state) => state.auth || {});

  // Initial load
  useEffect(() => {
    dispatch(fetchCompanies());
    dispatch(fetchSkills());
    dispatch(fetchInterviewers());
  }, [dispatch]);

  // GSAP Animations
  useEffect(() => {
    const sections = document.querySelectorAll('.home-tracks-section, .home-workflow-section, .home-questions-feature');

    const ctx = gsap.context(() => {
      sections.forEach(section => {
        const titleNodes = section.querySelectorAll('.section-header h2, .section-header p');
        const itemNodes = section.querySelectorAll('.home-track-card, .home-workflow-card, .home-feature-card');

        gsap.fromTo(titleNodes,
          { y: 30, opacity: 0, filter: 'blur(8px)' },
          {
            y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.1,
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            }
          }
        );

        gsap.fromTo(itemNodes,
          { y: 40, opacity: 0, filter: 'blur(8px)' },
          {
            y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.15,
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  // Re-fetch khi filters thay đổi
  useEffect(() => {
    dispatch(fetchInterviewers({
      searchTerm: filters.searchTerm,
      companyId: filters.company,
      skillId: filters.skill
    }));
  }, [dispatch, filters.searchTerm, filters.company, filters.skill]);

  // Re-fetch khi page thay đổi
  useEffect(() => {
    dispatch(fetchInterviewers({ page: pagination.currentPage, ...filters }));
  }, [dispatch, pagination.currentPage]);

  // Ensure interviewers is an array
  const interviewersList = Array.isArray(interviewers) ? interviewers : [];

  // Scroll to browse section
  const scrollToBrowse = () => {
    browseSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    dispatch(setPage(newPage));
    browseSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const renderPagination = () => {
    const { currentPage, totalPages } = pagination;
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Previous
        </button>

        {startPage > 1 && (
          <>
            <button className="pagination-number" onClick={() => handlePageChange(1)}>1</button>
            {startPage > 2 && <span className="pagination-ellipsis">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            className={`pagination-number ${page === currentPage ? 'active' : ''}`}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
            <button className="pagination-number" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
          </>
        )}

        <button
          className="pagination-btn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    );
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome{userData?.fullName ? `, ${userData.fullName.split(' ')[0]}` : ''}
            </h1>
            <p className="hero-subtitle">Expert coaching, mock interviews, and more</p>
            <p className="hero-description">
              Connect with an expert in your field to practice mock interviews,
              review your resume, or create a study plan.
            </p>
            <button className="hero-cta" onClick={scrollToBrowse}>
              <span>Find your coach</span>
              <ArrowRight size={18} strokeWidth={2} />
            </button>
            <div className="hero-rating">
              <span className="stars" style={{ display: 'flex', gap: '4px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} fill="var(--mui-palette-secondary-main)" stroke="var(--mui-palette-secondary-main)" strokeWidth={2} />
                ))}
              </span>
              <span className="rating-text">4.8 rating from over 2,400 reviews</span>
            </div>
          </div>
          <div className="hero-visual">
            {/* Simple animation placeholder */}
            <div className="visual-placeholder">
              <div className="floating-card card-1">
                <div className="card-avatar"></div>
                <div className="card-text"></div>
              </div>
              <div className="floating-card card-2">
                <div className="card-avatar"></div>
                <div className="card-text"></div>
              </div>
              <div className="floating-card card-3">
                <div className="card-avatar"></div>
                <div className="card-text"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse Section */}
      <section className="browse-section" ref={browseSectionRef}>
        <h2>Browse all coaches</h2>

        {/* Filters */}
        <FilterBar />

        {/* Error State */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {loading && interviewersList.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading interviewers...</p>
          </div>
        ) : (
          <>
            {/* Interviewer Grid */}
            <div className="interviewers-grid">
              {interviewersList.map(interviewer => (
                <CoachCar
                  key={interviewer.id}
                  interviewer={interviewer}
                />
              ))}
            </div>

            {/* Empty State */}
            {!loading && interviewersList.length === 0 && (
              <div className="empty-state">
                <Search size={48} color="#64748B" strokeWidth={1.5} style={{ marginBottom: '16px' }} />
                <p>No interviewers found matching your criteria.</p>
              </div>
            )}

            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </section>

      {/* New Specialized Tracks Section */}
      <section className="home-tracks-section">
        <div className="section-header">
          <h2>Specialized Tracks</h2>
          <p>Targeted preparation for specific technical and leadership roles</p>
        </div>
        <div className="home-tracks-grid">
          {specializedTracks.map((track) => (
            <div key={track.label} className="home-track-card">
              <div className="track-icon-wrapper">
                {track.icon}
              </div>
              <span>{track.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* New Workflow Section */}
      <section className="home-workflow-section">
        <div className="section-header">
          <h2>The Path to Mastery</h2>
          <p>Our proven method for systematic career advancement</p>
        </div>
        <div className="home-workflow-grid">
          {workflowSteps.map((step) => (
            <div key={step.step} className="home-workflow-card">
              <div className="workflow-step-badge">{step.step}</div>
              <div className="workflow-icon-circle">
                {step.icon}
              </div>
              <h3>{step.label}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* New Questions Feature Section */}
      <section className="home-questions-feature">
        <div className="home-feature-card">
          <div className="feature-info">
            <span className="feature-label">NEW FEATURE</span>
            <h2>Master the Question Bank</h2>
            <p>10,000+ real-world questions analyzed by AI from top tech interview transcripts.</p>
            <div className="feature-highlights">
              <div className="highlight">
                <strong>5K+</strong>
                <span>Questions</span>
              </div>
              <div className="highlight">
                <strong>50+</strong>
                <span>Companies</span>
              </div>
            </div>
            <button className="feature-btn" onClick={() => window.location.href = '/questions'}>
              Explore Bank <ArrowRight size={18} />
            </button>
          </div>
          <div className="feature-visual">
            <div className="code-snippet-window">
              <div className="code-header">
                <span className="dot" /><span className="dot" /><span className="dot" />
                <span className="title">System Design: Rate Limiter</span>
              </div>
              <div className="code-content">
                <pre>
                  <code>
                    {`// Scenario: High-scale requests
Design a distributed rate limiter 
supporting 1M+ requests/sec 
with <2ms latency penalty.`}
                  </code>
                </pre>
              </div>
            </div>
            <div className="feature-glow" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;