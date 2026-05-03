import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import { Users, CheckCircle2, ArrowRight, Trophy } from "lucide-react";
import "./CoachOrbitHero.css";

const ORBIT_COUNT = 5;
const SLOT_STEP = 360 / ORBIT_COUNT;

function normalizeCoach(c) {
    if (!c) return null;
    return {
        coachId: c.coachId ?? c.CoachId,
        slugProfileUrl: c.slugProfileUrl ?? c.SlugProfileUrl ?? "",
        name: c.name ?? c.Name ?? "Coach",
        avatarUrl: c.avatarUrl ?? c.AvatarUrl ?? null,
        rating: typeof (c.rating ?? c.Rating) === "number" ? c.rating ?? c.Rating : Number(c.rating ?? c.Rating ?? 0),
        sessionCount: c.sessionCount ?? c.SessionCount ?? 0,
    };
}

/**
 * @param {object} props
 * @param {Array} props.coaches - up to 5 spotlight coaches from API
 * @param {number} [props.totalCoachCount] - optional platform coach count for stat
 * @param {(e?: import("react").SyntheticEvent) => void} props.onFindMatch
 */
export default function CoachOrbitHero({ coaches = [], totalCoachCount, onFindMatch }) {
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReduceMotion(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    const slots = useMemo(() => {
        const normalized = (coaches || []).map(normalizeCoach).filter(Boolean);
        const out = [];
        for (let i = 0; i < ORBIT_COUNT; i++) {
            out.push(normalized[i] || null);
        }
        return out;
    }, [coaches]);

    const activeCount = slots.filter(Boolean).length;
    const mentorLabel =
        typeof totalCoachCount === "number" && totalCoachCount > 0
            ? `${totalCoachCount}+ Mentors`
            : activeCount > 0
              ? `${activeCount}+ Mentors`
              : "450+ Mentors";

    return (
        <div className={`coach-orbit-hero${reduceMotion ? " coach-orbit-hero--reduced-motion" : ""}`}>
            <div className="coach-orbit-hero__left">
                <div className="coach-orbit-hero__badges">
                    <span className="coach-orbit-hero__badge">
                        <Trophy size={11} strokeWidth={2.5} aria-hidden />
                        Top coaches on INTERVU
                    </span>
                    <span className="coach-orbit-hero__badge-muted">
                        <span className="dot" aria-hidden />
                        Available now
                    </span>
                </div>
                <h2 className="coach-orbit-hero__title">
                    Book a session with{" "}
                    <em>Senior Engineers</em>{" "}
                    from FAANG
                </h2>
                <div className="coach-orbit-hero__stats">
                    <div className="coach-orbit-hero__stat">
                        <div className="coach-orbit-hero__stat-icon coach-orbit-hero__stat-icon--lime" aria-hidden>
                            <Users size={18} />
                        </div>
                        <div>
                            <div className="coach-orbit-hero__stat-label">Active coaches</div>
                            <div className="coach-orbit-hero__stat-value">{mentorLabel}</div>
                        </div>
                    </div>
                    <div className="coach-orbit-hero__stat">
                        <div className="coach-orbit-hero__stat-icon coach-orbit-hero__stat-icon--success" aria-hidden>
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <div className="coach-orbit-hero__stat-label">Success rate</div>
                            <div className="coach-orbit-hero__stat-value">92% Hired</div>
                        </div>
                    </div>
                </div>
                <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    endIcon={<ArrowRight size={18} strokeWidth={2.5} />}
                    onClick={onFindMatch}
                    sx={{ mt: 0.5, fontWeight: 800 }}
                >
                    Find My Match
                </Button>
            </div>

            <div className="coach-orbit-hero__stage-wrap" aria-hidden={!activeCount}>
                <div className="coach-orbit-hero__stage">
                    <div className="coach-orbit-hero__glow" />
                    <div className="coach-orbit-hero__ring coach-orbit-hero__ring--1" />
                    <div className="coach-orbit-hero__ring coach-orbit-hero__ring--2" />
                    <div className="coach-orbit-hero__ring coach-orbit-hero__ring--3" />

                    <div className="coach-orbit-hero__orbit">
                        {slots.map((coach, index) => (
                            <div
                                key={coach?.coachId ?? `empty-${index}`}
                                className="coach-orbit-hero__orbit-slot"
                                style={{ "--slot-angle": `${index * SLOT_STEP}deg` }}
                            >
                                <div className="coach-orbit-hero__avatar-wrap">
                                    {/* cancel the static slot-angle offset so avatar stays upright */}
                                    <div
                                        className="coach-orbit-hero__avatar-derotate"
                                        style={{ transform: `rotate(calc(-1 * ${index * SLOT_STEP}deg))` }}
                                    >
                                        {coach?.slugProfileUrl ? (
                                            <Link
                                                className="coach-orbit-hero__avatar-link"
                                                to={`/profile/${coach.slugProfileUrl}`}
                                                aria-label={`View coach profile: ${coach.name}`}
                                            >
                                                <Avatar
                                                    src={coach.avatarUrl || undefined}
                                                    alt={coach.name}
                                                    sx={{ width: "100%", height: "100%", fontSize: "1.1rem" }}
                                                >
                                                    {coach.name?.charAt(0)?.toUpperCase()}
                                                </Avatar>
                                            </Link>
                                        ) : (
                                            <span className="coach-orbit-hero__avatar-link coach-orbit-hero__avatar-link--empty">
                                                <Avatar sx={{ width: "100%", height: "100%", fontSize: "1rem" }} />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
