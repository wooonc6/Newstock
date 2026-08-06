import Link from "next/link";
import type { CSSProperties } from "react";
import { PRODUCT_UPDATES } from "@/lib/productUpdates";

export default function UpdateTicker() {
  const duration = Math.max(34, PRODUCT_UPDATES.length * 10);
  const trackStyle = { "--update-ticker-duration": `${duration}s` } as CSSProperties;

  return (
    <section className="update-ticker" aria-label="Newstock 최근 업데이트">
      <div className="update-ticker-label" aria-hidden="true">
        <span className="update-ticker-live-dot" />
        UPDATE
      </div>

      <div className="update-ticker-viewport">
        <div className="update-ticker-track" style={trackStyle}>
          {[0, 1].map((copyIndex) => (
            <div
              key={copyIndex}
              className="update-ticker-group"
              aria-hidden={copyIndex === 1}
            >
              {PRODUCT_UPDATES.map((update) => (
                <Link
                  key={`${copyIndex}-${update.date}-${update.title}`}
                  className="update-ticker-item"
                  href={update.href}
                  tabIndex={copyIndex === 1 ? -1 : undefined}
                >
                  <time className="update-ticker-date">{update.date}</time>
                  <span className="update-ticker-tag">{update.label}</span>
                  <strong>{update.title}</strong>
                  <span className="update-ticker-summary">— {update.summary}</span>
                  <span className="update-ticker-separator" aria-hidden="true">●</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
