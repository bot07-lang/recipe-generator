import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="app-root">
      <header className="site-header">
        <div className="left-nav">
          {location.pathname !== '/' && (
            <button className="back-btn" onClick={() => navigate('/')}>← Home</button>
          )}
          <Link to="/" className="brand">
          <span className="brand-icon">🍳</span>
          <span className="brand-name">Recipe Card Generator</span>
          </Link>
        </div>
        <nav className="nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/generator" className={location.pathname.startsWith('/generator') ? 'active' : ''}>Generator</Link>
          <Link to="/developer" className={location.pathname.startsWith('/developer') ? 'active' : ''}>Developer</Link>
        </nav>
      </header>
      <main>
        <Outlet context={{ setNotification }} />
      </main>
      <footer className="site-footer">Made for content teams and developers</footer>
    </div>
  );
}


