import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Beaker, Lock, User, AlertCircle } from 'lucide-react';
import './Login.css';

export const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        try {
            await login(username, password);
            navigate('/');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Credenciais inválidas. Tente novamente.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-background">
                <div className="login-bg-pattern" />
            </div>

            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo">
                            <Beaker size={40} />
                        </div>
                        <h1 className="login-title">Blood Bank</h1>
                        <p className="login-subtitle">Sistema de Rastreabilidade de Amostras</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        {error && (
                            <div className="login-error">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <Input
                            label="Usuário"
                            placeholder="Digite seu usuário"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            leftIcon={<User size={18} />}
                            autoComplete="username"
                            disabled={isLoading}
                        />

                        <Input
                            label="Senha"
                            type="password"
                            placeholder="Digite sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            leftIcon={<Lock size={18} />}
                            autoComplete="current-password"
                            disabled={isLoading}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={isLoading}
                            className="login-button"
                        >
                            Entrar
                        </Button>
                    </form>

                    <div className="login-footer">
                        <p>Sistema de Inventário e Rastreabilidade</p>
                        <p className="login-version">v1.0.0</p>
                    </div>
                </div>

                <div className="login-features">
                    <div className="feature-item">
                        <div className="feature-icon">🔒</div>
                        <div className="feature-text">
                            <h3>Segurança</h3>
                            <p>Controle de acesso por laboratório</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">📊</div>
                        <div className="feature-text">
                            <h3>Rastreabilidade</h3>
                            <p>Histórico completo de movimentações</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">🧪</div>
                        <div className="feature-text">
                            <h3>Inventário</h3>
                            <p>Gestão de armazenamento inteligente</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
