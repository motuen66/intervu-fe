import { useNavigate } from "react-router-dom";
import "./CoachCard.css";

function CoachCard({ interviewer, isRecommended = false }) {
    const navigate = useNavigate();

    const { id, user, cvUrl, portfolioUrl } = interviewer;

    // Extract name and email from user object or interviewer profile
    const profile = interviewer.interviewerProfile || {};
    const fullName = user?.fullName || profile.fullName || user?.name || profile.name;
    const email = user?.email || profile.email;
    const profilePicture = user?.profilePicture || profile.profilePicture;
    const slugProfileUrl = user?.slugProfileUrl;

    const displayName = fullName || email?.split("@")[0] || "Anonymous User";

    // Lấy thông tin từ interviewerProfile (nếu có)
    const bio = profile.bio || interviewer.bio || "";
    const experienceYears = profile.experienceYears || 0;
    const hourlyRate = profile.hourlyRate || 0;

    // Parse skills nếu là JSON string
    let skills = [];
    try {
        if (profile.skills) {
            skills = typeof profile.skills === "string" ? JSON.parse(profile.skills) : profile.skills;
        }
    } catch (e) {
        skills = [];
    }

    // Get skills from API response
    if (!skills.length && interviewer.skills) {
        skills = Array.isArray(interviewer.skills) ? interviewer.skills : [];
    }

    // Parse companies nếu có
    const companies = interviewer.companies || [];

    // Rating data (use real data or default)
    const rating = interviewer.rating || profile.rating || 5.0;
    const sessionsCount = interviewer.sessionsCount || profile.sessionsCount || 0;
    const handleBookNow = () => {
        if (!slugProfileUrl) return;
        navigate(`/profile/${slugProfileUrl}`);
    };

    return (
        <div className="interviewer-card">
            {/* Top Row: Avatar + Name + Recommended Badge */}
            <div className="card-top-row">
                <div className="avatar-name-section">
                    <img
                        src={
                            profilePicture ||
                            "https://fr.web.img6.acsta.net/r_1920_1080/pictures/22/12/06/08/39/0036027.jpg"
                        }
                        alt={displayName}
                        className="avatar"
                    />
                    {/* Name Section */}
                    <div className="name-section">
                        <h3 className="name">{displayName}</h3>

                        {/* Role */}
                        <div className="role-row">
                            <span className="role-text">Software Engineer</span>
                        </div>

                        {/* Companies */}
                        {companies.length > 0 && (
                            <div className="companies-row">
                                <span className="companies-text">
                                    {companies.slice(0, 2).map((company, index) => (
                                        <span key={company.id}>
                                            {company.name}
                                            {index < Math.min(companies.length, 2) - 1 && ", "}
                                        </span>
                                    ))}
                                    {companies.length > 2 && ` +${companies.length - 2} more`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                {isRecommended && <span className="recommended-badge">Recommended</span>}
            </div>

            {/* Rating Row */}
            <div className="rating-row">
                <span className="star">⭐</span>
                <span className="rating-value">{rating.toFixed(1)} rating</span>
                <span className="sessions-count">({sessionsCount} sessions)</span>
            </div>

            {/* Bio */}
            {bio && <p className="bio">{bio}</p>}

            {/* Skills Tags */}
            {skills.length > 0 && (
                <div className="skills-row">
                    {skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="skill-tag">
                            {typeof skill === "string" ? skill : skill.name}
                        </span>
                    ))}
                    {skills.length > 3 && <span className="skill-tag more-tag">+ {skills.length - 3} more</span>}
                </div>
            )}

            {/* Book Now Button */}
            <button className="book-btn" onClick={handleBookNow}>
                Book now →
            </button>
        </div>
    );
}

export default CoachCard;
