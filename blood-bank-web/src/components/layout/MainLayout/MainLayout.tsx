import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
    Beaker,
    LayoutDashboard,
    TestTube,
    Archive,
    ArrowRightLeft,
    FileBarChart,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
} from 'lucide-react';
import './MainLayout.css';

export const MainLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    const { user, logout, hasRole } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/samples', icon: TestTube, label: 'Amostras' },
        { to: '/storage', icon: Archive, label: 'Armazenamento' },
        { to: '/transfers', icon: ArrowRightLeft, label: 'Transferências' },
        { to: '/reports', icon: FileBarChart, label: 'Relatórios' },
    ];

    const adminItems = [
        { to: '/users', icon: Users, label: 'Usuários', role: 'Laboratory Admin' },
        { to: '/settings', icon: Settings, label: 'Configurações', role: 'Laboratory Admin' },
    ];

    return (
        <div className={`main-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Beaker size={28} />
                        {sidebarOpen && <span>Blood Bank</span>}
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle sidebar"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        {sidebarOpen && <span className="nav-section-title">Menu</span>}
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `nav-item ${isActive ? 'active' : ''}`
                                }
                                end={item.to === '/'}
                            >
                                <item.icon size={20} />
                                {sidebarOpen && <span>{item.label}</span>}
                            </NavLink>
                        ))}
                    </div>

                    <div className="nav-section">
                        {sidebarOpen && <span className="nav-section-title">Admin</span>}
                        {adminItems
                            .filter((item) => hasRole(item.role))
                            .map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <item.icon size={20} />
                                    {sidebarOpen && <span>{item.label}</span>}
                                </NavLink>
                            ))}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        {sidebarOpen && <span>Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                {/* Header */}
                <header className="main-header">
                    <div className="header-left">
                        <h1 className="page-title">Dashboard</h1>
                    </div>

                    <div className="header-right">
                        <button className="header-icon-btn">
                            <Bell size={20} />
                            <span className="notification-badge">3</span>
                        </button>

                        <div className="user-menu">
                            <div className="user-avatar">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                            {sidebarOpen && (
                                <div className="user-info">
                                    <span className="user-name">{user?.fullName}</span>
                                    <span className="user-role">
                                        {user?.isGlobalAdmin ? 'Admin Global' : user?.roles[0] || 'Usuário'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
