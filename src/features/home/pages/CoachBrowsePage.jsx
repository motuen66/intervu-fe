import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { fetchInterviewers, fetchCompanies, fetchSkills, setPage } from "../store/homeSlice";
import FilterBar from "../components/FilterBar";
import CoachCar from "../components/CoachCard";
import SmartMatchModal from "../../smartSearch/components/SmartMatchModal";
import { Star, ArrowRight, Search } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./HomePage.css";

gsap.registerPlugin(ScrollTrigger);

/** Coach discovery (filters + grid). Used at `/home` (public) and `/coaches` (candidate). */
function CoachBrowsePage() {
    const dispatch = useDispatch();
    const browseSectionRef = useRef(null);
    const hasFetchedInterviewersRef = useRef(false);
    const [smartMatchOpen, setSmartMatchOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const { interviewers, loading, error, filters, pagination } = useSelector((state) => state.home);

    const { userData } = useSelector((state) => state.auth || {});

    useEffect(() => {
        setSmartMatchOpen(searchParams.get("smartMatch") === "1");
    }, [searchParams]);

    const openSmartMatch = () => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("smartMatch", "1");
        setSearchParams(nextParams);
    };

    const closeSmartMatch = () => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("smartMatch");
        setSearchParams(nextParams);
    };

    useEffect(() => {
        Promise.all([
            dispatch(fetchCompanies({ useGlobalLoading: true })),
            dispatch(fetchSkills({ useGlobalLoading: true })),
        ]);
    }, [dispatch]);

    useEffect(() => {
        const sections = document.querySelectorAll(
            ".home-tracks-section, .home-workflow-section, .home-questions-feature",
        );

        const ctx = gsap.context(() => {
            sections.forEach((section) => {
                const titleNodes = section.querySelectorAll(".section-header h2, .section-header p");
                const itemNodes = section.querySelectorAll(".home-track-card, .home-workflow-card, .home-feature-card");

                gsap.fromTo(
                    titleNodes,
                    { y: 30, opacity: 0, filter: "blur(8px)" },
                    {
                        y: 0,
                        opacity: 1,
                        filter: "blur(0px)",
                        duration: 0.8,
                        stagger: 0.1,
                        scrollTrigger: {
                            trigger: section,
                            start: "top 85%",
                            toggleActions: "play none none reverse",
                        },
                    },
                );

                gsap.fromTo(
                    itemNodes,
                    { y: 40, opacity: 0, filter: "blur(8px)" },
                    {
                        y: 0,
                        opacity: 1,
                        filter: "blur(0px)",
                        duration: 0.8,
                        stagger: 0.15,
                        scrollTrigger: {
                            trigger: section,
                            start: "top 80%",
                            toggleActions: "play none none reverse",
                        },
                    },
                );
            });
        });

        return () => ctx.revert();
    }, []);

    useEffect(() => {
        const shouldUseGlobalLoading = !hasFetchedInterviewersRef.current;
        hasFetchedInterviewersRef.current = true;

        dispatch(
            fetchInterviewers({
                page: pagination.currentPage,
                searchTerm: filters.searchTerm?.trim() || undefined,
                companyId: filters.company,
                industryId: filters.industry,
                skillId: filters.skill,
                skillIds: filters.skillIds?.length ? filters.skillIds.join(",") : undefined,
                minExperienceYears: filters.minExperienceYears || undefined,
                maxExperienceYears: filters.maxExperienceYears || undefined,
                minPrice: filters.minPrice || undefined,
                maxPrice: filters.maxPrice || undefined,
                useGlobalLoading: shouldUseGlobalLoading,
            }),
        );
    }, [dispatch, pagination.currentPage, filters]);

    const interviewersList = Array.isArray(interviewers) ? interviewers : [];

    const scrollToBrowse = () => {
        browseSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    const handlePageChange = (newPage) => {
        dispatch(setPage(newPage));
        browseSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
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
                        <button className="pagination-number" onClick={() => handlePageChange(1)}>
                            1
                        </button>
                        {startPage > 2 && <span className="pagination-ellipsis">...</span>}
                    </>
                )}

                {pages.map((page) => (
                    <button
                        key={page}
                        className={`pagination-number ${page === currentPage ? "active" : ""}`}
                        onClick={() => handlePageChange(page)}
                    >
                        {page}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                        <button className="pagination-number" onClick={() => handlePageChange(totalPages)}>
                            {totalPages}
                        </button>
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
            <section className="hero-section">
                <div className="hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Welcome{userData?.fullName ? `, ${userData.fullName.split(" ")[0]}` : ""}
                        </h1>
                        <p className="hero-subtitle">Expert coaching, mock interviews, and more</p>
                        <p className="hero-description">
                            Connect with an expert in your field to practice mock interviews, review your resume, or
                            create a study plan.
                        </p>
                        <button className="hero-cta" onClick={scrollToBrowse}>
                            <span>Find your coach</span>
                            <ArrowRight size={18} strokeWidth={2} />
                        </button>
                        <div className="hero-rating">
                            <span className="stars" style={{ display: "flex", gap: "4px" }}>
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={20}
                                        fill="var(--mui-palette-secondary-main)"
                                        stroke="var(--mui-palette-secondary-main)"
                                        strokeWidth={2}
                                    />
                                ))}
                            </span>
                            <span className="rating-text">4.8 rating from over 2,400 reviews</span>
                        </div>
                    </div>
                    <div className="hero-visual">
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

            <section className="browse-section" ref={browseSectionRef}>
                <div
                    style={{
                        display: "block",
                        marginBottom: "16px",
                    }}
                >
                    <h2 style={{ margin: 0 }}>Browse all coaches</h2>
                </div>

                <FilterBar onOpenSmartMatch={openSmartMatch} />

                {error && <div className="error-message">⚠️ {error}</div>}

                {loading && interviewersList.length === 0 ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (
                    <>
                        {loading && interviewersList.length > 0 && (
                            <Box sx={{ display: "flex", justifyContent: "center", pb: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        )}

                        <div className="interviewers-grid">
                            {interviewersList.map((interviewer) => (
                                <CoachCar key={interviewer.id} interviewer={interviewer} />
                            ))}
                        </div>

                        {!loading && interviewersList.length === 0 && (
                            <div className="empty-state">
                                <Search size={48} color="#64748B" strokeWidth={1.5} style={{ marginBottom: "16px" }} />
                                <p>No coaches found matching your criteria.</p>
                            </div>
                        )}

                        {renderPagination()}
                    </>
                )}
            </section>

            <SmartMatchModal open={smartMatchOpen} onClose={closeSmartMatch} />
        </div>
    );
}

export default CoachBrowsePage;
