import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// String de conexão do Neon
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("ERRO: A variável de ambiente DATABASE_URL não está configurada!");
}

// Configura o pool do cliente pg
const { Pool } = pg;
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Obrigatório para conexão SSL do Neon
  }
});

// Auto-inicialização da tabela do banco de dados
async function initDb() {
  if (!connectionString) return;
  const client = await pool.connect();
  try {
    // Cria a tabela
    await client.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        tag VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        equipment VARCHAR(100) NOT NULL,
        employee VARCHAR(100),
        location VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        condition VARCHAR(50) NOT NULL,
        notes TEXT
      );
    `);
    
    // Verifica se a tabela está vazia, insere dados iniciais se necessário
    const res = await client.query('SELECT COUNT(*) FROM assets');
    const count = parseInt(res.rows[0].count, 10);
    
    if (count === 0) {
      console.log("Banco de dados vazio. Semeando dados iniciais...");
      const initialAssets = [
        {
          tag: 'PAT-001',
          name: 'Dell Latitude 3420 14"',
          equipment: 'Notebook',
          employee: 'Thiago Alencar',
          location: 'Tecnologia da Informação',
          status: 'Em Uso',
          condition: 'Novo',
          notes: 'Intel Core i5, 16GB RAM, 512GB SSD. Comprado em 10/2024.'
        },
        {
          tag: 'PAT-002',
          name: 'LG UltraWide 29" IPS',
          equipment: 'Monitor',
          employee: 'Mariana Costa',
          location: 'Marketing',
          status: 'Em Uso',
          condition: 'Usado',
          notes: 'Resolução 2560x1080. Sem detalhes.'
        },
        {
          tag: 'PAT-003',
          name: 'MacBook Pro M2 13"',
          equipment: 'Notebook',
          employee: 'Carlos Eduardo',
          location: 'Diretoria',
          status: 'Em Uso',
          condition: 'Novo',
          notes: 'Chip Apple M2, 8GB RAM, 256GB SSD.'
        },
        {
          tag: 'PAT-004',
          name: 'Cadeira Office Cavaletti',
          equipment: 'Cadeira Ergonômica',
          employee: '',
          location: 'Estoque Central',
          status: 'Em Estoque',
          condition: 'Novo',
          notes: 'Modelo ergonômico NR17, cor preta.'
        },
        {
          tag: 'PAT-005',
          name: 'Samsung Galaxy S22 128GB',
          equipment: 'Celular/Smartphone',
          employee: 'Aline Schmidt',
          location: 'Vendas',
          status: 'Em Uso',
          condition: 'Usado',
          notes: 'Celular corporativo. Tela trincada no canto inferior.'
        },
        {
          tag: 'PAT-006',
          name: 'Impressora HP LaserJet Pro',
          equipment: 'Impressora',
          employee: '',
          location: 'Administração',
          status: 'Manutenção',
          condition: 'Usado',
          notes: 'Enviado para manutenção da placa de rede física em 15/05/2026.'
        }
      ];

      for (const asset of initialAssets) {
        await client.query(`
          INSERT INTO assets (tag, name, equipment, employee, location, status, condition, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [asset.tag, asset.name, asset.equipment, asset.employee || null, asset.location, asset.status, asset.condition, asset.notes]);
      }
      console.log("Dados semeados com sucesso!");
    }
  } catch (err) {
    console.error("Erro ao inicializar banco de dados:", err);
  } finally {
    client.release();
  }
}

// Chama a inicialização do banco de dados
initDb();

// Rotas CRUD

// GET: Busca todos os patrimônios
app.get('/api/assets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM assets ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar patrimônios' });
  }
});

// POST: Adiciona novo patrimônio
app.post('/api/assets', async (req, res) => {
  const { tag, name, equipment, employee, location, status, condition, notes } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO assets (tag, name, equipment, employee, location, status, condition, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [tag, name, equipment, employee || null, location, status, condition, notes]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // violação de chave única
      res.status(400).json({ error: 'Já existe um patrimônio com esta Tag.' });
    } else {
      res.status(500).json({ error: 'Erro ao criar patrimônio' });
    }
  }
});

// PUT: Atualiza patrimônio
app.put('/api/assets/:id', async (req, res) => {
  const { id } = req.params;
  const { tag, name, equipment, employee, location, status, condition, notes } = req.body;
  try {
    const result = await pool.query(`
      UPDATE assets 
      SET tag = $1, name = $2, equipment = $3, employee = $4, location = $5, status = $6, condition = $7, notes = $8
      WHERE id = $9
      RETURNING *
    `, [tag, name, equipment, employee || null, location, status, condition, notes, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patrimônio não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.status(400).json({ error: 'Já existe um patrimônio com esta Tag.' });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar patrimônio' });
    }
  }
});

// DELETE: Exclui patrimônio
app.delete('/api/assets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patrimônio não encontrado' });
    }
    res.json({ message: 'Patrimônio excluído com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir patrimônio' });
  }
});

// POST: Validação de login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, username: 'admin', role: 'Administrador' });
  } else {
    res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }
});

// Inicialização local (se não estiver rodando na Vercel como Serverless Function)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Servidor de API rodando localmente na porta ${port}`);
  });
}

export default app;
