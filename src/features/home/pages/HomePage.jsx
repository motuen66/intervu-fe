import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  fetchInterviewers,
  fetchCompanies,
  fetchSkills,
  setPage
} from '../store/homeSlice';
import FilterBar from '../components/FilterBar';
import CoachCar from '../components/CoachCard';
import SmartMatchModal from '../../smartSearch/components/SmartMatchModal';
import { Star, ArrowRight, Search, Sparkles } from 'lucide-react';
import './HomePage.css';

function HomePage() {
  const dispatch = useDispatch();
  const browseSectionRef = useRef(null);
  const [smartMatchOpen, setSmartMatchOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    interviewers,
    loading,
    error,
    filters,
    pagination
  } = useSelector((state) => state.home);

  // Get user info from auth state
  const { userData } = useSelector((state) => state.auth || {});

  useEffect(() => {
    setSmartMatchOpen(searchParams.get('smartMatch') === '1');
  }, [searchParams]);

  const openSmartMatch = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('smartMatch', '1');
    setSearchParams(nextParams);
  };

  const closeSmartMatch = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('smartMatch');
    setSearchParams(nextParams);
  };

  // Initial load
  useEffect(() => {
    dispatch(fetchCompanies());
    dispatch(fetchSkills());
    dispatch(fetchInterviewers());
  }, [dispatch]);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Browse all coaches</h2>
          <button
            className="hero-cta"
            onClick={openSmartMatch}
            style={{
              background: 'linear-gradient(135deg, #BEF264 0%, #D9F99D 100%)',
              color: '#0F172A',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              boxShadow: '0 2px 12px rgba(217, 249, 157, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={18} />
            Smart AI Match
          </button>
        </div>

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

      {/* Smart Match Modal */}
      <SmartMatchModal open={smartMatchOpen} onClose={closeSmartMatch} />
    </div>
  );
}

export default HomePage;