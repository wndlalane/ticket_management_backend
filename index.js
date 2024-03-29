const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
var cors = require('cors')

const app = express();
const PORT = 3001;
app.use(bodyParser.json());
app.use(cors())


const supabaseUrl = 'https://vdeaiezweqmvfbzifbxu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZWFpZXp3ZXFtdmZiemlmYnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM3MDM1MTYsImV4cCI6MjAxOTI3OTUxNn0.Q4g6YkF_hX_18pZuHv2B2OX8RyM_EuDua7CDAIlTado';

const supabase = createClient(supabaseUrl, supabaseKey);

// Instruções para uso da API
rotas = [
    {
        nome: "login",
        metodo: "POST",
        descricao: "Autenticacao do usuario",
    },
    {
        nome: "signup",
        metodo: "POST",
        descricao: "Criar conta de autenticacao do usuario",
    },
    {
        nome: "logout",
        metodo: "POST",
        descricao: "Sair da conta",
    },
    {
        nome: "clientes",
        metodo: "GET",
        descricao: "Obtém todos os clientes",
    },
    {
        nome: "tecnicos",
        metodo: "GET",
        descricao: "Obtém todos os técnicos",
    },
    {
        nome: "tickets",
        metodo: "GET",
        descricao: "Obtém todos os tickets",
    },
    {
        nome: "tickets",
        metodo: "POST",
        descricao: "Cria um novo ticket",
    },
];


app.get("/", (req, res) => {
    res.json({ descricao: "Lista de routas para uso da API", 'rotas': rotas });
});


// Rota para o login.
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuario')
            .select('id, nome, email, cliente, tecnico')
            .eq('usuario_id', data.user.id)
            .single();

        if (usuarioError) {
            return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
        }

        const usuarioWithDetails = {
            id: usuarioData.id,
            nome: usuarioData.nome,
            email: usuarioData.email,
            cliente: usuarioData.cliente,
            tecnico: usuarioData.tecnico,
            token: data.session.access_token,
        };

        res.json({ success: true, message: 'Login successful', authentication: usuarioWithDetails });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




// Rota para criar conta
app.post('/signup', async (req, res) => {
    const { nome, email, password, tecnico, cliente } = req.body;

    try {
        // SignUp no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        // Inserir dados no Supabase Database
        const { data: insertData, error: insertError } = await supabase.from('usuario').insert([
            {
                nome,
                email,
                tecnico,
                cliente,
                usuario_id: authData.user.id
            },
        ]);

        if (insertError) {
            return res.status(500).json({ error: 'Erro ao criar um novo usuário no banco de dados Supabase' });
        }

        res.json({ success: true, message: 'Conta criada com sucesso', access_token: authData.session.access_token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro do Servidor Interno' });
    }
});

// Rota para o logout.
app.post('/logout', async (req, res) => {
    await supabase.auth.signOut();

    res.json({ success: true });
});

// Rota para obter todos os Clientes
app.get('/clientes', async (req, res) => {
    const { data, error } = await supabase.from('usuario').select().eq('cliente', true);

    if (error) {
        return res.status(500).json({ error: 'Erro ao buscar tickets do Superbase' });
    }

    res.json(data);
});

// Rota para obter todos os Tecnicos
app.get('/tecnicos', async (req, res) => {
    const { data, error } = await supabase.from('usuario').select().eq('tecnico', true);

    if (error) {
        return res.status(500).json({ error: 'Erro ao buscar tickets do Superbase' });
    }

    res.json(data);
});

// Rota para obter todos os tickets
app.get('/tickets', async (req, res) => {
    try {
        // Obter todos os tickets
        const { data: tickets, error: ticketsError } = await supabase
            .from('ticket')
            .select('*');

        if (ticketsError) {
            return res.status(500).json({ error: ticketsError });
        }

        // Obter todos os clientes
        const { data: clientes, error: clientesError } = await supabase
            .from('usuario')
            .select('id, nome, email');

        if (clientesError) {
            return res.status(500).json({ error: clientesError });
        }

        // Obter todos os técnicos (se existirem)
        const { data: tecnicos, error: tecnicosError } = await supabase
            .from('usuario')
            .select('id, nome, email')
            .in('id', tickets.map(ticket => ticket.tecnico_id).filter(Boolean));

        if (tecnicosError) {
            return res.status(500).json({ error: 'Erro ao buscar técnicos do Superbase' });
        }

        // Combinar os dados
        const ticketsCompletos = tickets.map(ticket => {
            const cliente = clientes.find(cliente => cliente.id === ticket.cliente_id);
            const tecnico = tecnicos.find(tecnico => tecnico.id === ticket.tecnico_id);

            return {
                ...ticket,
                cliente,
                tecnico: tecnico || {},
            };
        });

        res.json(ticketsCompletos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// Rota para obter todos os tickets de um usuário específico
app.get('/usuario/:usuarioId/tickets', async (req, res) => {
    const usuarioId = req.params.usuarioId;

    try {
        // Obter todos os tickets associados a um usuário especifico
        const { data: tickets, error: ticketsError } = await supabase
            .from('ticket')
            .select('*')
            .eq('cliente_id', usuarioId);

        if (ticketsError) {
            return res.status(500).json({ error: ticketsError });
        }

        // Obter informações do cliente
        const { data: clienteData, error: clienteError } = await supabase
            .from('usuario')
            .select('id, nome, email')
            .eq('id', usuarioId)
            .single();

        if (clienteError) {
            return res.status(500).json({ error: clienteError });
        }

        const cliente = clienteData;

        // Combinar os dados com informações de cliente e técnico
        const ticketsCompletos = await Promise.all(tickets.map(async ticket => {
            let tecnico = null;

            if (ticket.tecnico_id) {
                const { data: tecnicoData, error: tecnicoError } = await supabase
                    .from('usuario')
                    .select('id, nome, email')
                    .eq('id', ticket.tecnico_id)
                    .single();

                if (tecnicoError) {
                    return res.status(500).json({ error: tecnicoError });
                }

                tecnico = tecnicoData;
            }

            return {
                ...ticket,
                cliente: {
                    id: cliente.id,
                    nome: cliente.nome,
                    email: cliente.email,
                },
                tecnico,
            };
        }));

        res.json(ticketsCompletos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// Rota para criar um novo ticket
app.post('/tickets', async (req, res) => {
    const { assunto, descricao, cliente_id, tecnico_id } = req.body;

    if (!assunto || !descricao) {
        return res.status(400).json({ error: 'Assunto e descrição são obrigatórios' });
    }

    const { data, error } = await supabase.from('ticket').insert([
        {
            assunto,
            descricao,
            cliente_id,
            tecnico_id,
            status: "PENDENTE",
        },
    ]);

    if (error) {
        return res.status(500).json({ error: 'Erro ao criar um novo ticket no Superbase' });
    }

    res.json({ success: true });
});

// Rota para atualizar o status de um ticket
app.put('/tickets/:ticketId/status', async (req, res) => {
    const ticketId = req.params.ticketId;
    const { status, tecnico_id } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'O status é obrigatório' });
    }

    try {
        // Atualizar o status do ticket no Supabase
        const { data, error } = await supabase
            .from('ticket')
            .update({ status, tecnico_id })
            .eq('id', ticketId);

        if (error) {
            return res.status(500).json({ error: 'Erro ao atualizar o status do ticket no Superbase' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});


app.listen(PORT, () => {
    console.log(`O servidor está rodando na porta ${PORT}`);
});
