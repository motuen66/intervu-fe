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
import './HomePage.css';

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
              Find your coach →
            </button>
            <div className="hero-rating">
              <span className="stars">⭐⭐⭐⭐⭐</span>
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
                <p>😔 No interviewers found.</p>
              </div>
            )}

            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </section>
    </div>
  );
}

export default HomePage;