import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Video, BookOpen, Map, Search, User } from "lucide-react";
import "./FeatureCards.css";

/**
 * Six full feature shortcut cards at the top of the Candidate home.
 *
 * @param {{ onSmartMatch: () => void }} props
 */

const CARDS = [
    {
        id: "interviews",
        color: "blue",
        icon: Video,
        title: "Interviews",
        desc: "Manage your upcoming coaching sessions and review feedback from past interviews.",
        to: "/interview",
    },
    {
        id: "smart-match",
        color: "lime",
        icon: Sparkles,
        title: "Smart Matching",
        desc: "Our neural engine finds the perfect coach for your specific role and company target.",
        to: null, // opens Smart Match modal
        isAction: true,
    },
    {
        id: "questions",
        color: "violet",
        icon: BookOpen,
        title: "Question Bank",
        desc: "Hand-picked technical and behavioral questions from top companies like Google, Meta & Netflix.",
        to: "/questions",
    },
    {
        id: "roadmap",
        color: "amber",
        icon: Map,
        title: "Roadmap",
        desc: "Track your journey from first practice to the final offer. Personalized learning steps.",
        to: "/roadmap",
    },
    {
        id: "coaches",
        color: "teal",
        icon: Search,
        title: "Browse Coaches",
        desc: "Explore our elite network of FAANG mentors and industry experts.",
        to: "/coaches",
    },
    {
        id: "profile",
        color: "rose",
        icon: User,
        title: "My Profile",
        desc: "Update your experience, preferences, and career goals to get better matches.",
        to: "/candidate/profile",
    },
];

export default function FeatureCards({ onSmartMatch }) {
    return (
        <div className="fcard-grid" role="list">
            {CARDS.map((card) => {
                const Icon = card.icon;
                const inner = (
                    <>
                        <div className="fcard__glow" aria-hidden />
                        <div className="fcard__header">
                            <div className="fcard__icon-wrap" aria-hidden>
                                <Icon size={22} strokeWidth={1.8} />
                            </div>
                            <span className="fcard__dot" aria-hidden />
                        </div>
                        <div className="fcard__body">
                            <h3 className="fcard__title">{card.title}</h3>
                            <p className="fcard__desc">{card.desc}</p>
                        </div>
                        <span className="fcard__launch" aria-hidden>
                            Launch
                            <ArrowRight size={14} strokeWidth={2.5} className="fcard__launch-arrow" />
                        </span>
                    </>
                );

                if (card.isAction) {
                    return (
                        <button
                            key={card.id}
                            type="button"
                            role="listitem"
                            className={`fcard fcard--${card.color}`}
                            onClick={onSmartMatch}
                            aria-label={`Launch ${card.title}`}
                        >
                            {inner}
                        </button>
                    );
                }

                return (
                    <Link
                        key={card.id}
                        to={card.to}
                        role="listitem"
                        className={`fcard fcard--${card.color}`}
                        aria-label={`Launch ${card.title}`}
                    >
                        {inner}
                    </Link>
                );
            })}
        </div>
    );
}
