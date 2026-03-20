import Sidebar from './Sidebar';

export default function Layout({ children, title, subtitle, actions }) {
  return (
    <>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div className="topbar-main">
            <div className="topbar-title">{title}</div>
            {subtitle && <div className="topbar-sub">{subtitle}</div>}
          </div>
          <div className="topbar-loader">
            <div className="topbar-loader-fill"></div>
          </div>
          <div className="topbar-sub topbar-meta">AI Engine Active</div>
          <div className="topbar-right">
            <div className="status-dot"></div>
            <div className="status-label">System Online</div>
            {actions}
          </div>
        </div>
        <div className="content">
          {children}
        </div>
      </div>
    </>
  );
}
