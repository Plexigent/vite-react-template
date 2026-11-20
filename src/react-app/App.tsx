import { useEffect, useRef } from 'react';
import { mountExperience } from './experience/controller';
import { pages } from './experience/pages';
import './App.css';

function Mark() {
  return <span className="px-mark" aria-hidden="true">
    <span className="px-glyph px-glyph-x">x<span className="px-accent">x</span></span>
    <span className="px-glyph px-glyph-i">i<span className="px-accent">i</span></span>
  </span>;
}

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => mountExperience(root.current!), []);

  return <div id="plexigent-emergence-study" ref={root} aria-label="Plexigent emergence experience">
    <div className="px-stage">
      <header className="px-header">
        <a className="px-home" href="/" aria-label="Plexigent home" data-go="0"><Mark /></a>
        <button className="px-menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="plexigent-concept-menu">
          <span className="px-menu-label">Menu</span><span className="px-menu-lines" aria-hidden="true" />
        </button>
      </header>
      <div className="px-menu" id="plexigent-concept-menu" hidden>
        <nav className="px-menu-nav" aria-label="Plexigent domains">
          {pages.slice(1, 5).map((page, index) => <a key={page.path} href={page.path} data-go={index + 1}>{page.label}</a>)}
          <div className="px-menu-secondary">
            {pages.slice(5).map((page, index) => <a key={page.path} href={page.path} data-go={index + 5}>{page.label}</a>)}
          </div>
        </nav>
      </div>
      <main className="px-scene px-is-home" aria-label="Plexigent domain reveal" tabIndex={-1}>
        <canvas className="px-canvas" aria-hidden="true" hidden />
        <canvas className="px-origin" role="img" aria-label="Scattered dots gather into a feeding caterpillar, transform within a chrysalis, and emerge as the connected-dot Plexigent butterfly." />
        <img className="px-fallback" src="/plexigent-connected-butterfly.svg" alt="Connected-dot Plexigent butterfly" hidden />
        <div className="px-copy">
          <p className="px-kicker" hidden>Plexigent</p>
          <h1 className="px-title px-wordmark" tabIndex={-1} aria-label="Plexigent">Ple<Mark />gent</h1>
          <p className="px-prompt">Connecting Dots</p>
          <p className="px-about-purpose">
            We connect the dots where value is beginning to emerge. For us, that is an act of creation.
            Together with companies and labs that share our passion, we turn those early connections into things people can use.
          </p>
          <a className="px-contact" href="mailto:info@Plexigent.com" hidden>info@Plexigent.com</a>
        </div>
      </main>
      <footer className="px-footer px-waiting">
        <span className="px-footer-left">
          <span className="px-position" hidden />
          <button className="px-replay" type="button" aria-label="Replay the transformation" hidden>Replay</button>
        </span>
        <a className="px-next" href="/labs/"><span className="px-next-label">What if?</span><span className="px-chevron" aria-hidden="true" /></a>
        <button className="px-back" type="button" aria-label="Previous scene" hidden>Back</button>
      </footer>
    </div>
  </div>;
}
