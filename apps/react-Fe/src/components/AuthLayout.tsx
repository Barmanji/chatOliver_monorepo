import { Outlet, Link } from 'react-router';

function AuthLayout() {
  return (
    <div style={{
      border: '2px solid #007bff',
      padding: '30px',
      margin: '50px auto',
      maxWidth: '600px',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      backgroundColor: '#e6f2ff'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid #a0c4ff', paddingBottom: '10px' }}>
        <h1>Welcome to Our App!</h1>
        <p>Please Login or Register to continue.</p>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <li>
              {/* Using Link from react-router-dom for navigation */}
              <Link to="/login" style={{ textDecoration: 'none', color: '#0056b3', fontWeight: 'bold' }}>Login</Link>
            </li>
            <li>
              {/* Using Link from react-router-dom for navigation */}
              <Link to="/register" style={{ textDecoration: 'none', color: '#0056b3', fontWeight: 'bold' }}>Register</Link>
            </li>
          </ul>
        </nav>
      </header>

      <main style={{ minHeight: '200px' }}>
        {/* The child route's element (Login or Register) will be rendered here. */}
        <Outlet />
      </main>

      <footer style={{ textAlign: 'center', marginTop: '30px', paddingTop: '10px', borderTop: '1px solid #a0c4ff', fontSize: '0.8em', color: '#555' }}>
        <p>&copy; 2025 Our Awesome App. All rights reserved.</p>
        <p>This is a shared footer for all authentication pages.</p>
      </footer>
    </div>
  );
}

export default AuthLayout;
