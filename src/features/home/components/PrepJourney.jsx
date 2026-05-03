import { Link } from "react-router-dom";
import { Check, ArrowRight, ListChecks } from "lucide-react";
import "./PrepJourney.css";

export default function PrepJourney({ steps = [], loading = false }) {
    const doneCount = steps.filter((s) => s.done).length;
    const percent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

    if (loading) {
        return (
            <div className="pj">
                <div className="pj__skeleton">
                    {[72, 60, 68, 50].map((w, i) => (
                        <div key={i} className="pj__skeleton-row">
                            <div className="pj__skeleton-dot" />
                            <div className="pj__skeleton-line" style={{ width: `${w}%` }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="pj">
            <div className="pj__header">
                <h3 className="pj__title">
                    <span className="pj__icon" aria-hidden>
                        <ListChecks size={16} strokeWidth={2} />
                    </span>
                    Preparation Journey
                </h3>
            </div>

            <ol className="pj__steps">
                {steps.map((step, idx) => {
                    const isLast = idx === steps.length - 1;
                    const isActive = !step.done && steps.slice(0, idx).every((s) => s.done);

                    const nodeClass = step.done
                        ? "pj__node--done"
                        : isActive
                          ? "pj__node--active"
                          : "pj__node--pending";

                    return (
                        <li key={step.id} className="pj__step">
                            <div className="pj__track">
                                <div className={`pj__node ${nodeClass}`}>
                                    {step.done && <Check size={11} strokeWidth={3} />}
                                </div>
                                {!isLast && (
                                    <div
                                        className={`pj__connector ${step.done ? "pj__connector--lit" : "pj__connector--dim"}`}
                                    />
                                )}
                            </div>

                            <div className="pj__content">
                                <span className={`pj__label${step.done ? " pj__label--done" : ""}`}>
                                    {step.label}
                                </span>

                                {!step.done && isActive && step.to && (
                                    <Link className="pj__action" to={step.to}>
                                        {step.actionLabel ?? "Get started"}
                                        <ArrowRight size={10} strokeWidth={2.5} className="pj__action-arrow" />
                                    </Link>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>

            <div className="pj__progress-row">
                <span className="pj__progress-label">Progress</span>
                <div className="pj__bar-wrap">
                    <div className="pj__bar-fill" style={{ width: `${percent}%` }} />
                </div>
                <span className="pj__progress-label">{percent}%</span>
            </div>
        </div>
    );
}
