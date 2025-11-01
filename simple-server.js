const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Sistema de Embarcações funcionando!',
        timestamp: new Date().toISOString()
    });
});

// API básica para demonstração
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'API do Sistema de Embarcações funcionando!',
        services: {
            database: 'PostgreSQL',
            frontend: 'React + Vite',
            backend: 'Node.js + Express'
        },
        timestamp: new Date().toISOString()
    });
});

// Endpoint de login simulado
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Credenciais de demonstração
    if (email === 'admin@embarcacoes.com' && password === 'admin123') {
        res.json({
            success: true,
            user: {
                id: 1,
                name: 'Administrador',
                email: 'admin@embarcacoes.com',
                role: 'ADMIN'
            },
            token: 'demo-token-123'
        });
    } else if (email === 'cliente@teste.com' && password === 'cliente123') {
        res.json({
            success: true,
            user: {
                id: 2,
                name: 'Cliente Teste',
                email: 'cliente@teste.com',
                role: 'USER'
            },
            token: 'demo-token-456'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Credenciais inválidas'
        });
    }
});

// Endpoint de embarcações
app.get('/api/vessels', (req, res) => {
    res.json([
        {
            id: 1,
            name: 'Lancha Azul',
            description: 'Lancha para passeios',
            capacity: 8,
            location: 'Marina Central'
        },
        {
            id: 2,
            name: 'Iate Luxo',
            description: 'Iate de luxo para eventos',
            capacity: 12,
            location: 'Marina Premium'
        }
    ]);
});

// Endpoint de agendamentos
app.get('/api/bookings', (req, res) => {
    res.json([
        {
            id: 1,
            vesselId: 1,
            userId: 2,
            date: '2025-10-26',
            startTime: '09:00',
            endTime: '12:00',
            status: 'CONFIRMED'
        }
    ]);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 API: http://localhost:${PORT}/api/health`);
});
