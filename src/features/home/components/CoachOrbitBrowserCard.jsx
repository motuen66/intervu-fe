import "./CoachOrbitBrowserCard.css";

/**
 * Dark “browser window” frame: traffic lights + optional skeleton bars, content in gradient viewport.
 */
export default function CoachOrbitBrowserCard({ children }) {
    return (
        <div className="coach-orbit-browser-card">
            <div className="coach-orbit-browser-card__titlebar" aria-hidden>
                <div className="coach-orbit-browser-card__traffic">
                    <span className="coach-orbit-browser-card__dot coach-orbit-browser-card__dot--close" />
                    <span className="coach-orbit-browser-card__dot coach-orbit-browser-card__dot--min" />
                    <span className="coach-orbit-browser-card__dot coach-orbit-browser-card__dot--max" />
                </div>
                <div className="coach-orbit-browser-card__skeleton">
                    <span className="coach-orbit-browser-card__bar coach-orbit-browser-card__bar--long" />
                    <span className="coach-orbit-browser-card__bar coach-orbit-browser-card__bar--short" />
                </div>
            </div>
            <div className="coach-orbit-browser-card__viewport">{children}</div>
        </div>
    );
}
