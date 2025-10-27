import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-icon">🍽️</div>
        <h1 className="hero-title">Recipe Card Generator</h1>
        <p className="hero-subtitle">Transform your recipes into stunning visual cards. Perfect for content teams and developers.</p>
      </section>

      <section className="panels">
        <Link to="/generator" className="panel-link">
        <div className="panel">
          <div className="panel-icon">👥</div>
          <h3>For Content Teams</h3>
          <p>Choose templates, input recipe data, upload images, and export HTML + PNG cards in seconds.</p>
          <div className="chips">
            <span className="chip">Templates</span>
            <span className="chip">Live Preview</span>
            <span className="chip">Export Ready</span>
          </div>
        </div>
        </Link>
        <Link to="/developer" className="panel-link">
        <div className="panel">
          <div className="panel-icon">💻</div>
          <h3>For Developers</h3>
          <p>Create custom HTML templates with placeholders and make them instantly available to your team.</p>
          <div className="chips">
            <span className="chip">Custom HTML</span>
            <span className="chip">Template Manager</span>
            <span className="chip">Team Ready</span>
          </div>
        </div>
        </Link>
      </section>
    </div>
  );
}


