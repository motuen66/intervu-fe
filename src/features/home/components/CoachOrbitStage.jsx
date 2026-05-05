import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
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
 * Same orbit stage as CoachOrbitHero right column (glow + 3 rings + spinning avatars).
 * Used on browse coach inside CoachOrbitBrowserCard — shares CoachOrbitHero.css.
 */
export default function CoachOrbitStage({ coaches = [], reduceMotion: reduceMotionProp }) {
    const [reduceMotionMq, setReduceMotionMq] = useState(false);

    useEffect(() => {
        if (typeof reduceMotionProp === "boolean") return undefined;
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReduceMotionMq(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, [reduceMotionProp]);

    const reduceMotion = typeof reduceMotionProp === "boolean" ? reduceMotionProp : reduceMotionMq;

    const slots = useMemo(() => {
        const normalized = (coaches || []).map(normalizeCoach).filter(Boolean);
        const out = [];
        for (let i = 0; i < ORBIT_COUNT; i++) {
            out.push(normalized[i] || null);
        }
        return out;
    }, [coaches]);

    const activeCount = slots.filter(Boolean).length;

    const rootClass = `coach-orbit-stage-root${reduceMotion ? " coach-orbit-hero--reduced-motion" : ""}`;

    return (
        <div className={rootClass}>
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
