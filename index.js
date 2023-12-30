const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3001;
app.use(bodyParser.json());

const supabaseUrl = 'https://vdeaiezweqmvfbzifbxu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZWFpZXp3ZXFtdmZiemlmYnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM3MDM1MTYsImV4cCI6MjAxOTI3OTUxNn0.Q4g6YkF_hX_18pZuHv2B2OX8RyM_EuDua7CDAIlTado';

const supabase = createClient(supabaseUrl, supabaseKey);

// Instruções para uso da API
rotas = [
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
    res.json({descricao:"Lista de routas para uso da API", 'rotas': rotas});
  });

// Rota para obter todos os Clientes
app.get('/clientes', async (req, res) => {
    const { data, error } = await supabase.from('usuario').select().eq('cliente', true);
        
    if (error) {
        return res.status(500).json({ error: 'Error fetching tickets from Superbase' });
    }

    res.json(data);
});

// Rota para obter todos os Tecnicos
app.get('/tecnicos', async (req, res) => {
    const { data, error } = await supabase.from('usuario').select().eq('tecnico', true);
        
    if (error) {
        return res.status(500).json({ error: 'Error fetching tickets from Superbase' });
    }

    res.json(data);
});

// Rota para obter todos os tickets
app.get('/tickets', async (req, res) => {
    const { data, error } = await supabase.from('ticket').select();
        
    if (error) {
        return res.status(500).json({ error: 'Error fetching tickets from Superbase' });
    }

    res.json(data);
});

// Rota para criar um novo ticket
app.post('/tickets', async (req, res) => {
    const { assunto, descricao, cliente_id, tecnico_responsavel_id } = req.body;

    if (!assunto || !descricao) {
        return res.status(400).json({ error: 'Assunto e descrição são obrigatórios' });
    }

    const { data, error } = await supabase.from('ticket').insert([
        {
            assunto,
            descricao,
            cliente_id,
            tecnico_responsavel_id,
            status: 'Aberto',
        },
    ]);

    if (error) {
        return res.status(500).json({ error: 'Error creating a new ticket in Superbase' });
    }

    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
