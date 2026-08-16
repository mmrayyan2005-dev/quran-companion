import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const items = [
  { to: '/', label: 'Read', icon: '📖' },
  { to: '/search', label: 'Search', icon: '🔍' },
  { to: '/bookmarks', label: 'Saved', icon: '🔖' },
  { to: '/memorize', label: 'Memorize', icon: '✦' },
];

export default function BottomNav() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
        >
          <span className="bottom-nav__icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
      {isAuthenticated ? (
        <button className="bottom-nav__item bottom-nav__item--button" onClick={logout}>
          <span className="bottom-nav__icon" aria-hidden="true">↩</span>
          <span>Log out</span>
        </button>
      ) : (
        <NavLink
          to="/login"
          className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
        >
          <span className="bottom-nav__icon" aria-hidden="true">◇</span>
          <span>Log in</span>
        </NavLink>
      )}
    </nav>
  );
}
