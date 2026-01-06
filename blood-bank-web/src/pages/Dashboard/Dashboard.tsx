import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { laboratoryApi, sampleApi, storageApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import {
    TestTube,
    Archive,
    AlertTriangle,
    TrendingUp,
    Clock,
    ArrowRightLeft,
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts';
import './Dashboard.css';

export const DashboardPage: React.FC = () => {
    const { user } = useAuthStore();

    const { data: statistics } = useQuery({
        queryKey: ['laboratory-statistics', user?.laboratoryId],
        queryFn: async () => {
            if (!user?.laboratoryId) return null;
            const response = await laboratoryApi.getStatistics(user.laboratoryId);
            return response.data;
        },
        enabled: !!user?.laboratoryId,
    });

    const { data: expiringSamples } = useQuery({
        queryKey: ['expiring-samples'],
        queryFn: async () => {
            const response = await sampleApi.getExpiring(30);
            return response.data;
        },
    });

    const { data: occupancy } = useQuery({
        queryKey: ['storage-occupancy'],
        queryFn: async () => {
            const response = await storageApi.getOccupancy();
            return response.data;
        },
    });

    const statusColors: Record<string, string> = {
        COLLECTED: '#1976D2',
        STORED: '#388E3C',
        IN_TRANSFER: '#FFA000',
        UNDER_ANALYSIS: '#7B1FA2',
        ARCHIVED: '#616161',
        DISCARDED: '#D32F2F',
    };

    const statusLabels: Record<string, string> = {
        COLLECTED: 'Coletadas',
        STORED: 'Armazenadas',
        IN_TRANSFER: 'Em Transferência',
        UNDER_ANALYSIS: 'Em Análise',
        ARCHIVED: 'Arquivadas',
        DISCARDED: 'Descartadas',
    };

    const statusData = statistics?.samplesByStatus
        ? Object.entries(statistics.samplesByStatus).map(([status, count]) => ({
            name: statusLabels[status] || status,
            value: count as number,
            color: statusColors[status] || '#666',
        }))
        : [];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Visão geral do laboratório</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-700)' }}>
                        <TestTube size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{statistics?.totalSamples || 0}</span>
                        <span className="stat-label">Total de Amostras</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#E3F2FD', color: '#1976D2' }}>
                        <Archive size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{occupancy?.occupied || 0}</span>
                        <span className="stat-label">Posições Ocupadas</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#FFF3E0', color: '#FFA000' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{expiringSamples?.length || 0}</span>
                        <span className="stat-label">Próximas ao Vencimento</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#F3E5F5', color: '#7B1FA2' }}>
                        <ArrowRightLeft size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{statistics?.pendingTransfers || 0}</span>
                        <span className="stat-label">Transferências Pendentes</span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                {/* Status Distribution */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Distribuição por Status</h3>
                    </div>
                    <div className="chart-content">
                        {statusData.length > 0 ? (
                            <div className="pie-chart-container">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="chart-legend">
                                    {statusData.map((item, index) => (
                                        <div key={index} className="legend-item">
                                            <span
                                                className="legend-color"
                                                style={{ background: item.color }}
                                            />
                                            <span className="legend-label">{item.name}</span>
                                            <span className="legend-value">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="chart-empty">
                                <TrendingUp size={48} />
                                <p>Sem dados disponíveis</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Storage Capacity */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Capacidade de Armazenamento</h3>
                    </div>
                    <div className="chart-content">
                        {occupancy ? (
                            <div className="capacity-container">
                                <div className="capacity-gauge">
                                    <div
                                        className="capacity-fill"
                                        style={{
                                            width: `${occupancy.percentage}%`,
                                            background:
                                                occupancy.percentage > 90
                                                    ? 'var(--color-error)'
                                                    : occupancy.percentage > 70
                                                        ? 'var(--color-warning)'
                                                        : 'var(--color-success)',
                                        }}
                                    />
                                </div>
                                <div className="capacity-details">
                                    <div className="capacity-stat">
                                        <span className="capacity-value">{occupancy.percentage}%</span>
                                        <span className="capacity-label">Ocupação</span>
                                    </div>
                                    <div className="capacity-stat">
                                        <span className="capacity-value">{occupancy.available}</span>
                                        <span className="capacity-label">Disponíveis</span>
                                    </div>
                                    <div className="capacity-stat">
                                        <span className="capacity-value">{occupancy.blocked}</span>
                                        <span className="capacity-label">Bloqueadas</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="chart-empty">
                                <Archive size={48} />
                                <p>Carregando dados...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expiring Soon */}
            {expiringSamples && expiringSamples.length > 0 && (
                <div className="alert-section">
                    <div className="alert-header">
                        <AlertTriangle size={20} />
                        <h3>Amostras Próximas ao Vencimento</h3>
                    </div>
                    <div className="alert-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Código de Barras</th>
                                    <th>Tipo</th>
                                    <th>Paciente</th>
                                    <th>Vencimento</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expiringSamples.slice(0, 5).map((sample: {
                                    id: string;
                                    barcode: string;
                                    sampleType: { name: string };
                                    patientCode: string;
                                    expirationDate: string;
                                    status: string;
                                }) => (
                                    <tr key={sample.id}>
                                        <td className="font-mono">{sample.barcode}</td>
                                        <td>{sample.sampleType?.name}</td>
                                        <td>{sample.patientCode}</td>
                                        <td>
                                            <span className="expiration-date">
                                                <Clock size={14} />
                                                {new Date(sample.expirationDate).toLocaleDateString('pt-BR')}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className="status-badge"
                                                style={{ background: statusColors[sample.status] }}
                                            >
                                                {statusLabels[sample.status]}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
