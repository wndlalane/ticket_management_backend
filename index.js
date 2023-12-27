const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3001;

const supabaseUrl = 'https://vdeaiezweqmvfbzifbxu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZWFpZXp3ZXFtdmZiemlmYnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM3MDM1MTYsImV4cCI6MjAxOTI3OTUxNn0.Q4g6YkF_hX_18pZuHv2B2OX8RyM_EuDua7CDAIlTado';

const supabase = createClient(supabaseUrl, supabaseKey);


app.use(bodyParser.json());

// Rota para obter todos os tickets
app.get('/tickets', async (req, res) => {
    const { data, error } = await supabase.from('Ticket').select();

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

    const { data, error } = await supabase.from('Ticket').insert([
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
