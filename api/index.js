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

    // Garante que a coluna last_verified existe (migração automática)
    await client.query(`
      ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_verified TIMESTAMP;
    `);

    // Cria a tabela de funcionários
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        sector VARCHAR(100) NOT NULL,
        ramal VARCHAR(50),
        team VARCHAR(100),
        role VARCHAR(100)
      );
    `);

    // Garante que as colunas novas existem (migração automática)
    await client.query(`
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS ramal VARCHAR(50);
    `);
    await client.query(`
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS team VARCHAR(100);
    `);
    await client.query(`
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS role VARCHAR(100);
    `);

    // Semeia funcionários iniciais se a tabela estiver vazia
    const empRes = await client.query('SELECT COUNT(*) FROM employees');
    const empCount = parseInt(empRes.rows[0].count, 10);
    
    if (empCount === 0) {
      console.log("Banco de dados de funcionários vazio. Semeando dados iniciais...");
      const initialEmployees = [
        { name: 'Thiago Alencar', sector: 'Tecnologia da Informação', ramal: '4001', team: 'C&A', role: 'Analista de Suporte' },
        { name: 'Mariana Costa', sector: 'Marketing', ramal: '4002', team: 'Latam', role: 'Coordenadora de Marketing' },
        { name: 'Carlos Eduardo', sector: 'Diretoria', ramal: '4003', team: 'Prosegur', role: 'Diretor Executivo' },
        { name: 'Aline Schmidt', sector: 'Vendas', ramal: '4004', team: 'Latam', role: 'Executiva de Vendas' }
      ];
      for (const emp of initialEmployees) {
        await client.query(`
          INSERT INTO employees (name, sector, ramal, team, role)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (name) DO NOTHING
        `, [emp.name, emp.sector, emp.ramal, emp.team, emp.role]);
      }
      console.log("Funcionários semeados com sucesso!");
    }
    
    // Verifica se a tabela está vazia, insere dados iniciais se necessário
    const res = await client.query('SELECT COUNT(*) FROM assets');
    const count = parseInt(res.rows[0].count, 10);
    
    if (count === 0) {
      console.log("Banco de dados vazio. Semeando dados iniciais...");
      
      // Datas simuladas para verificação
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const initialAssets = [
        {
          tag: 'PAT-001',
          name: 'Dell Latitude 3420 14"',
          equipment: 'Notebook',
          employee: 'Thiago Alencar',
          location: 'Tecnologia da Informação',
          status: 'Em Uso',
          condition: 'Novo',
          notes: 'Intel Core i5, 16GB RAM, 512GB SSD. Comprado em 10/2024.',
          last_verified: new Date() // Verificado hoje
        },
        {
          tag: 'PAT-002',
          name: 'LG UltraWide 29" IPS',
          equipment: 'Monitor',
          employee: 'Mariana Costa',
          location: 'Marketing',
          status: 'Em Uso',
          condition: 'Usado',
          notes: 'Resolução 2560x1080. Sem detalhes.',
          last_verified: twoDaysAgo // Verificado há 2 dias
        },
        {
          tag: 'PAT-003',
          name: 'MacBook Pro M2 13"',
          equipment: 'Notebook',
          employee: 'Carlos Eduardo',
          location: 'Diretoria',
          status: 'Em Uso',
          condition: 'Novo',
          notes: 'Chip Apple M2, 8GB RAM, 256GB SSD.',
          last_verified: null // Nunca verificado
        },
        {
          tag: 'PAT-004',
          name: 'Cadeira Office Cavaletti',
          equipment: 'Cadeira Ergonômica',
          employee: '',
          location: 'Estoque Central',
          status: 'Em Estoque',
          condition: 'Novo',
          notes: 'Modelo ergonômico NR17, cor preta.',
          last_verified: fiveDaysAgo // Verificado há 5 dias
        },
        {
          tag: 'PAT-005',
          name: 'Samsung Galaxy S22 128GB',
          equipment: 'Celular/Smartphone',
          employee: 'Aline Schmidt',
          location: 'Vendas',
          status: 'Em Uso',
          condition: 'Usado',
          notes: 'Celular corporativo. Tela trincada no canto inferior.',
          last_verified: null // Nunca verificado
        },
        {
          tag: 'PAT-006',
          name: 'Impressora HP LaserJet Pro',
          equipment: 'Impressora',
          employee: '',
          location: 'Administração',
          status: 'Manutenção',
          condition: 'Usado',
          notes: 'Enviado para manutenção da placa de rede física em 15/05/2026.',
          last_verified: null // Nunca verificado
        }
      ];

      for (const asset of initialAssets) {
        await client.query(`
          INSERT INTO assets (tag, name, equipment, employee, location, status, condition, notes, last_verified)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [asset.tag, asset.name, asset.equipment, asset.employee || null, asset.location, asset.status, asset.condition, asset.notes, asset.last_verified]);
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
  const { tag, name, equipment, employee, location, status, condition, notes, last_verified } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO assets (tag, name, equipment, employee, location, status, condition, notes, last_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [tag, name, equipment, employee || null, location, status, condition, notes, last_verified || null]);
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
  const { tag, name, equipment, employee, location, status, condition, notes, last_verified } = req.body;
  try {
    const result = await pool.query(`
      UPDATE assets 
      SET tag = $1, name = $2, equipment = $3, employee = $4, location = $5, status = $6, condition = $7, notes = $8, last_verified = $9
      WHERE id = $10
      RETURNING *
    `, [tag, name, equipment, employee || null, location, status, condition, notes, last_verified || null, id]);
    
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

// POST: Marca patrimônio como verificado (atualiza last_verified para NOW)
app.post('/api/assets/:id/verify', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      UPDATE assets 
      SET last_verified = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patrimônio não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao verificar patrimônio' });
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

// GET: Busca todos os funcionários
app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar funcionários' });
  }
});

// POST: Adiciona novo funcionário
app.post('/api/employees', async (req, res) => {
  const { name, sector, ramal, team, role } = req.body;
  if (!name || !name.trim() || !sector || !sector.trim()) {
    return res.status(400).json({ error: 'Nome e setor são obrigatórios.' });
  }
  try {
    const result = await pool.query(`
      INSERT INTO employees (name, sector, ramal, team, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name.trim(), sector.trim(), ramal ? ramal.trim() : null, team ? team.trim() : null, role ? role.trim() : null]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // violação de chave única
      res.status(400).json({ error: 'Já existe um funcionário com este nome.' });
    } else {
      res.status(500).json({ error: 'Erro ao criar funcionário' });
    }
  }
});

// PUT: Atualiza funcionário
app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { name, sector, ramal, team, role } = req.body;
  if (!name || !name.trim() || !sector || !sector.trim()) {
    return res.status(400).json({ error: 'Nome e setor são obrigatórios.' });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Busca o nome antigo para atualizar os patrimônios associados
    const oldEmpRes = await client.query('SELECT name FROM employees WHERE id = $1', [id]);
    if (oldEmpRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }
    const oldName = oldEmpRes.rows[0].name;
    
    // Atualiza o funcionário
    const result = await client.query(`
      UPDATE employees 
      SET name = $1, sector = $2, ramal = $3, team = $4, role = $5
      WHERE id = $6
      RETURNING *
    `, [name.trim(), sector.trim(), ramal ? ramal.trim() : null, team ? team.trim() : null, role ? role.trim() : null, id]);
    
    // Se o nome mudou, atualiza os patrimônios
    if (oldName !== name.trim()) {
      await client.query(`
        UPDATE assets
        SET employee = $1
        WHERE employee = $2
      `, [name.trim(), oldName]);
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    if (err.code === '23505') {
      res.status(400).json({ error: 'Já existe um funcionário com este nome.' });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar funcionário' });
    }
  } finally {
    client.release();
  }
});

// DELETE: Exclui funcionário
app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Busca o nome do funcionário
    const empRes = await client.query('SELECT name FROM employees WHERE id = $1', [id]);
    if (empRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }
    const empName = empRes.rows[0].name;
    
    // Exclui funcionário
    await client.query('DELETE FROM employees WHERE id = $1', [id]);
    
    // Atualiza patrimônios associados (status 'Em Estoque' se estava 'Em Uso')
    await client.query(`
      UPDATE assets
      SET employee = NULL,
          status = CASE WHEN status = 'Em Uso' THEN 'Em Estoque' ELSE status END
      WHERE employee = $1
    `, [empName]);
    
    await client.query('COMMIT');
    res.json({ message: 'Funcionário excluído com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir funcionário' });
  } finally {
    client.release();
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
