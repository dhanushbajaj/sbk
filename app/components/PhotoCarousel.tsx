"use client";

import { useRef, useState } from "react";
import type { DdfMedia } from "@/lib/types";

export default function PhotoCarousel({ media, alt }: { media: DdfMedia[]; alt: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (media.length === 0) return null;

  function goTo(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(media.length - 1, i));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <div className="carousel">
      <div className="carousel-frame">
        <div className="carousel-track" ref={trackRef} onScroll={onScroll}>
          {media.map((m, i) => (
            <div className="carousel-slide" key={m.MediaKey}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.MediaURL}
                alt={`${alt} — photo ${i + 1} of ${media.length}`}
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
        {media.length > 1 && (
          <>
            <button
              className="carousel-btn prev"
              onClick={() => goTo(index - 1)}
              aria-label="Previous photo"
              disabled={index === 0}
            >
              ‹
            </button>
            <button
              className="carousel-btn next"
              onClick={() => goTo(index + 1)}
              aria-label="Next photo"
              disabled={index === media.length - 1}
            >
              ›
            </button>
            <span className="carousel-count">
              {index + 1} / {media.length}
            </span>
          </>
        )}
      </div>
      {media.length > 1 && (
        <div className="thumb-strip">
          {media.map((m, i) => (
            <button
              key={m.MediaKey}
              className={`thumb ${i === index ? "active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.MediaURL} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
