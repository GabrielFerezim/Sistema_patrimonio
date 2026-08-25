import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// String de conexão do Neon PostgreSQL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("AVISO: A variável DATABASE_URL não está configurada. O sistema usará fallback de armazenamento local.");
}

// Configura o pool do cliente pg
const { Pool } = pg;
const pool = new Pool({
  connectionString,
  ssl: connectionString ? {
    rejectUnauthorized: false // Obrigatório para conexão SSL do Neon
  } : undefined
});

// Auto-inicialização das tabelas do banco de dados
async function initDb() {
  if (!connectionString) return;
  let client;
  try {
    client = await pool.connect();
    
    // 1. Tabela de Patrimônios (Assets)
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
        notes TEXT,
        serial_number VARCHAR(100),
        purchase_date VARCHAR(50),
        value NUMERIC(12, 2),
        decommission_reason TEXT,
        last_verified TIMESTAMP
      );
    `);

    // Migrações automáticas de colunas para assets
    await client.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_verified TIMESTAMP;`);
    await client.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);`);
    await client.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS purchase_date VARCHAR(50);`);
    await client.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS value NUMERIC(12, 2);`);
    await client.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS decommission_reason TEXT;`);

    // 2. Tabela de Funcionários (Employees)
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        sector VARCHAR(100) NOT NULL,
        ramal VARCHAR(50),
        team VARCHAR(100),
        role VARCHAR(100),
        signed_term TEXT,
        signed_term_name VARCHAR(255),
        signed_term_at TIMESTAMP
      );
    `);

    await client.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS ramal VARCHAR(50);`);
    await client.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS team VARCHAR(100);`);
    await client.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS role VARCHAR(100);`);
    await client.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS signed_term TEXT;`);
    await client.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS signed_term_name VARCHAR(255);`);
    await client.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS signed_term_at TIMESTAMP;`);

    // 3. Tabela de Manutenções (Maintenances)
    await client.query(`
      CREATE TABLE IF NOT EXISTS maintenances (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER,
        asset_tag VARCHAR(50) NOT NULL,
        asset_name VARCHAR(255) NOT NULL,
        issue_description TEXT NOT NULL,
        provider VARCHAR(150),
        cost NUMERIC(10, 2),
        status VARCHAR(50) NOT NULL DEFAULT 'Em Aberto',
        opened_at TIMESTAMP DEFAULT NOW(),
        expected_return_at VARCHAR(50),
        closed_at TIMESTAMP,
        notes TEXT,
        return_destination VARCHAR(50),
        employee_name VARCHAR(100)
      );
    `);

    // 4. Tabela de Logs de Auditoria (Audit Logs)
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(50),
        user_name VARCHAR(100) DEFAULT 'Administrador',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. Tabela de Espaços / Ambientes Físicos (Spaces)
    await client.query(`
      CREATE TABLE IF NOT EXISTS spaces (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) UNIQUE NOT NULL,
        floor VARCHAR(100) NOT NULL,
        type VARCHAR(100) DEFAULT 'Sala de Reunião',
        description TEXT,
        icon VARCHAR(50) DEFAULT 'meeting',
        color VARCHAR(50) DEFAULT '#3b82f6',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 6. Tabela de Licenças de Software (Licenses)
    await client.query(`
      CREATE TABLE IF NOT EXISTS licenses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(100) NOT NULL,
        license_type VARCHAR(100) DEFAULT 'Assinatura Anual',
        license_key VARCHAR(255),
        total_seats INTEGER DEFAULT 1,
        assigned_to JSONB DEFAULT '[]'::jsonb,
        expiration_date VARCHAR(50),
        cost NUMERIC(10, 2),
        supplier VARCHAR(150),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Semeia licenças se vazio
    const licRes = await client.query('SELECT COUNT(*) FROM licenses');
    const licCount = parseInt(licRes.rows[0].count, 10);
    if (licCount === 0) {
      const initialLicenses = [
        {
          name: 'Microsoft 365 Business Standard',
          category: 'Produtividade',
          license_type: 'Assinatura Anual',
          license_key: 'MS365-TRYN-2025-ENTERPRISE',
          total_seats: 10,
          assigned_to: JSON.stringify([
            { id: 1, user: 'Thiago Alencar', machine: 'PAT-001', assigned_at: new Date().toISOString() },
            { id: 2, user: 'Mariana Costa', machine: 'PAT-002', assigned_at: new Date().toISOString() },
            { id: 3, user: 'Gabriel Ferezim', machine: 'PAT-005', assigned_at: new Date().toISOString() }
          ]),
          expiration_date: '2026-12-31',
          cost: 1450.00,
          supplier: 'Microsoft Cloud Services',
          notes: 'Pacote Office completo (Word, Excel, PowerPoint, Teams, 1TB OneDrive).'
        },
        {
          name: 'Adobe Creative Cloud All Apps',
          category: 'Design & Criação',
          license_type: 'Assinatura Anual',
          license_key: 'ADOBE-CC-PRO-2024',
          total_seats: 3,
          assigned_to: JSON.stringify([
            { id: 1, user: 'Mariana Costa', machine: 'PAT-002', assigned_at: new Date().toISOString() }
          ]),
          expiration_date: '2026-11-15',
          cost: 3200.00,
          supplier: 'Adobe Systems Brasil',
          notes: 'Photoshop, Illustrator, Premiere Pro, After Effects e InDesign.'
        },
        {
          name: 'Windows 11 Pro OEM',
          category: 'Sistema Operacional',
          license_type: 'Perpétua / Volume',
          license_key: 'WIN11-PRO-OEM-VOL-9921',
          total_seats: 15,
          assigned_to: JSON.stringify([
            { id: 1, user: 'Thiago Alencar', machine: 'PAT-001', assigned_at: new Date().toISOString() },
            { id: 2, user: 'Mariana Costa', machine: 'PAT-002', assigned_at: new Date().toISOString() },
            { id: 3, user: 'Carlos Eduardo', machine: 'PAT-003', assigned_at: new Date().toISOString() },
            { id: 4, user: 'Aline Schmidt', machine: 'PAT-004', assigned_at: new Date().toISOString() },
            { id: 5, user: 'Gabriel Ferezim', machine: 'PAT-005', assigned_at: new Date().toISOString() }
          ]),
          expiration_date: 'Perpétua',
          cost: 0.00,
          supplier: 'Dell OEM Licensing',
          notes: 'Licenças OEM pré-ativadas em hardware corporativo.'
        },
        {
          name: 'AutoCAD 2024 Architecture',
          category: 'Engenharia / Projetos',
          license_type: 'Assinatura Anual',
          license_key: 'AUTODESK-ACAD-2024-BR',
          total_seats: 2,
          assigned_to: JSON.stringify([]),
          expiration_date: '2026-09-30',
          cost: 4800.00,
          supplier: 'Autodesk Brasil',
          notes: 'Licença para desenvolvimento imobiliário e plantas corporativas.'
        }
      ];

      for (const lic of initialLicenses) {
        await client.query(`
          INSERT INTO licenses (name, category, license_type, license_key, total_seats, assigned_to, expiration_date, cost, supplier, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [lic.name, lic.category, lic.license_type, lic.license_key, lic.total_seats, lic.assigned_to, lic.expiration_date, lic.cost, lic.supplier, lic.notes]);
      }
    }

    // Semeia funcionários iniciais se a tabela estiver vazia
    const empRes = await client.query('SELECT COUNT(*) FROM employees');
    const empCount = parseInt(empRes.rows[0].count, 10);
    
    if (empCount === 0) {
      console.log("Banco de dados de funcionários vazio. Semeando dados iniciais...");
      const initialEmployees = [
        { name: 'Thiago Alencar', sector: 'Tecnologia da Informação', ramal: '4001', team: 'C&A', role: 'Analista de Suporte' },
        { name: 'Mariana Costa', sector: 'Marketing', ramal: '4002', team: 'Latam', role: 'Coordenadora de Marketing' },
        { name: 'Carlos Eduardo', sector: 'Diretoria', ramal: '4003', team: 'Prosegur', role: 'Diretor Executivo' },
        { name: 'Aline Schmidt', sector: 'Vendas', ramal: '4004', team: 'Latam', role: 'Executiva de Vendas' },
        { name: 'Gabriel Ferezim', sector: 'Tecnologia da Informação', ramal: '4005', team: 'C&A', role: 'Assistente de T.I I' }
      ];
      for (const emp of initialEmployees) {
        await client.query(`
          INSERT INTO employees (name, sector, ramal, team, role)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (name) DO NOTHING
        `, [emp.name, emp.sector, emp.ramal, emp.team, emp.role]);
      }
    }
    
    // Semeia patrimônios iniciais se a tabela estiver vazia
    const res = await client.query('SELECT COUNT(*) FROM assets');
    const count = parseInt(res.rows[0].count, 10);
    
    if (count === 0) {
      console.log("Banco de dados de patrimônios vazio. Semeando dados iniciais...");
      
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
          serial_number: 'BR-DELL-3420-99',
          last_verified: new Date()
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
          serial_number: 'LG-29WK600-01',
          last_verified: twoDaysAgo
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
          serial_number: 'C02G8990Q05D',
          last_verified: null
        },
        {
          tag: 'PAT-004',
          name: 'Cadeira Office Cavaletti',
          equipment: 'Cadeira Ergonômica',
          employee: null,
          location: 'Estoque Central',
          status: 'Em Estoque',
          condition: 'Novo',
          notes: 'Modelo ergonômico NR17, cor preta.',
          serial_number: 'CAV-NR17-2024',
          last_verified: fiveDaysAgo
        },
        {
          tag: 'PAT-005',
          name: 'Samsung Galaxy S22 128GB',
          equipment: 'Celular/Smartphone',
          employee: 'Aline Schmidt',
          location: 'Vendas',
          status: 'Em Uso',
          condition: 'Usado',
          notes: 'Celular corporativo. Tela com película aplicada.',
          serial_number: 'SM-S901B-44',
          last_verified: null
        },
        {
          tag: 'PAT-006',
          name: 'Impressora HP LaserJet Pro',
          equipment: 'Impressora',
          employee: null,
          location: 'Administração',
          status: 'Manutenção',
          condition: 'Usado',
          notes: 'Enviado para manutenção da placa lógica em 15/05/2026.',
          serial_number: 'HP-M404DW-09',
          last_verified: null
        }
      ];

      for (const asset of initialAssets) {
        await client.query(`
          INSERT INTO assets (tag, name, equipment, employee, location, status, condition, notes, serial_number, last_verified)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [asset.tag, asset.name, asset.equipment, asset.employee, asset.location, asset.status, asset.condition, asset.notes, asset.serial_number, asset.last_verified]);
      }

      // Semeia manutenção de exemplo
      await client.query(`
        INSERT INTO maintenances (asset_tag, asset_name, issue_description, provider, status, opened_at, notes)
        VALUES ('PAT-006', 'Impressora HP LaserJet Pro', 'Falha na conexão de rede e placa lógica', 'Suporte Técnico HP', 'Em Manutenção', NOW(), 'Aguardando substituição da peça.')
      `);

      // Semeia logs iniciais
      await client.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id, user_name)
        VALUES 
          ('SISTEMA', 'Inicialização do banco de dados e dados padrão', 'SYSTEM', '0', 'Admin'),
          ('CRIACAO', 'Cadastro do patrimônio PAT-001 (Dell Latitude)', 'ASSET', 'PAT-001', 'Admin')
      `);

      console.log("Dados e tabelas inicializados com sucesso!");
    }
  } catch (err) {
    console.error("Erro ao inicializar banco de dados:", err);
  } finally {
    if (client) client.release();
  }
}

initDb();

// ==========================================
// ROTAS CRUD - PATRIMÔNIOS (ASSETS)
// ==========================================

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
  const { tag, name, equipment, employee, location, status, condition, notes, serial_number, purchase_date, value, last_verified } = req.body;
  
  if (!tag || !name || !equipment || !location) {
    return res.status(400).json({ error: 'Tag, Nome, Tipo de Equipamento e Localização são obrigatórios.' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO assets (tag, name, equipment, employee, location, status, condition, notes, serial_number, purchase_date, value, last_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      tag.trim().toUpperCase(),
      name.trim(),
      equipment.trim(),
      employee ? employee.trim() : null,
      location.trim(),
      status || 'Em Estoque',
      condition || 'Novo',
      notes || null,
      serial_number || null,
      purchase_date || null,
      value || null,
      last_verified || null
    ]);

    // Registra log de auditoria
    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('CADASTRO', $1, 'PATRIMONIO', $2)
      `, [`Cadastrado patrimônio ${tag.trim().toUpperCase()} (${name.trim()})`, tag.trim().toUpperCase()]);
    } catch (_) {}

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.status(400).json({ error: 'Já existe um patrimônio com esta Tag/Código.' });
    } else {
      res.status(500).json({ error: 'Erro ao criar patrimônio' });
    }
  }
});

// PUT: Atualiza patrimônio
app.put('/api/assets/:id', async (req, res) => {
  const { id } = req.params;
  const { tag, name, equipment, employee, location, status, condition, notes, serial_number, purchase_date, value, decommission_reason, last_verified } = req.body;
  
  try {
    const result = await pool.query(`
      UPDATE assets 
      SET tag = $1, name = $2, equipment = $3, employee = $4, location = $5, status = $6, condition = $7, notes = $8,
          serial_number = $9, purchase_date = $10, value = $11, decommission_reason = $12, last_verified = $13
      WHERE id = $14
      RETURNING *
    `, [
      tag.trim().toUpperCase(),
      name.trim(),
      equipment.trim(),
      employee ? employee.trim() : null,
      location.trim(),
      status,
      condition,
      notes || null,
      serial_number || null,
      purchase_date || null,
      value || null,
      decommission_reason || null,
      last_verified || null,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patrimônio não encontrado' });
    }

    // Registra log de auditoria
    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('ATUALIZACAO', $1, 'PATRIMONIO', $2)
      `, [`Atualizado patrimônio ${tag} - Status: ${status}`, tag]);
    } catch (_) {}

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

// POST: Marca patrimônio como verificado (inventário físico)
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

// POST: Dar baixa em patrimônio (Decommission)
app.post('/api/assets/:id/decommission', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  const decommissionReason = reason && reason.trim() ? reason.trim() : 'Baixa operacional';

  try {
    const result = await pool.query(`
      UPDATE assets 
      SET status = 'Baixado',
          employee = NULL,
          decommission_reason = $1,
          last_verified = NOW()
      WHERE id = $2
      RETURNING *
    `, [decommissionReason, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patrimônio não encontrado' });
    }

    const item = result.rows[0];

    // Registra log de auditoria
    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('BAIXA', $1, 'PATRIMONIO', $2)
      `, [`Baixa efetuada no patrimônio ${item.tag} (${item.name}). Motivo: ${decommissionReason}`, item.tag]);
    } catch (_) {}

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao dar baixa no patrimônio' });
  }
});

// POST: Reativar patrimônio baixado de volta ao estoque
app.post('/api/assets/:id/reactivate', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      UPDATE assets 
      SET status = 'Em Estoque',
          employee = NULL,
          decommission_reason = NULL,
          last_verified = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patrimônio não encontrado' });
    }

    const item = result.rows[0];

    // Registra log de auditoria
    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('REATIVACAO', $1, 'PATRIMONIO', $2)
      `, [`Patrimônio ${item.tag} (${item.name}) reativado para o estoque central`, item.tag]);
    } catch (_) {}

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao reativar patrimônio' });
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

    try {
      const tag = result.rows[0].tag;
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('EXCLUSAO', $1, 'PATRIMONIO', $2)
      `, [`Excluído patrimônio ${tag}`, tag]);
    } catch (_) {}

    res.json({ message: 'Patrimônio excluído com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir patrimônio' });
  }
});

// ==========================================
// ROTAS CRUD - FUNCIONÁRIOS (EMPLOYEES)
// ==========================================

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
    `, [name.trim(), sector.trim(), ramal ? ramal.trim() : null, team ? team.trim() : 'Nenhuma', role ? role.trim() : null]);

    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('CADASTRO', $1, 'FUNCIONARIO', $2)
      `, [`Cadastrado colaborador ${name.trim()} (${sector.trim()})`, name.trim()]);
    } catch (_) {}

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
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
    
    const oldEmpRes = await client.query('SELECT name FROM employees WHERE id = $1', [id]);
    if (oldEmpRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }
    const oldName = oldEmpRes.rows[0].name;
    
    const result = await client.query(`
      UPDATE employees 
      SET name = $1, sector = $2, ramal = $3, team = $4, role = $5
      WHERE id = $6
      RETURNING *
    `, [name.trim(), sector.trim(), ramal ? ramal.trim() : null, team ? team.trim() : 'Nenhuma', role ? role.trim() : null, id]);
    
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
    
    const empRes = await client.query('SELECT name FROM employees WHERE id = $1', [id]);
    if (empRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }
    const empName = empRes.rows[0].name;
    
    await client.query('DELETE FROM employees WHERE id = $1', [id]);
    
    // Equipamentos em uso voltam para o estoque
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

// Termos de responsabilidade do funcionário
app.post('/api/employees/:id/term', async (req, res) => {
  const { id } = req.params;
  const { fileBase64, fileName } = req.body;
  if (!fileBase64 || !fileName) {
    return res.status(400).json({ error: 'Arquivo inválido.' });
  }
  try {
    const result = await pool.query(
      `UPDATE employees
       SET signed_term = $1, signed_term_name = $2, signed_term_at = NOW()
       WHERE id = $3
       RETURNING id, name, signed_term_name, signed_term_at`,
      [fileBase64, fileName, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar termo assinado.' });
  }
});

app.get('/api/employees/:id/term', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT signed_term, signed_term_name, signed_term_at FROM employees WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0 || !result.rows[0].signed_term) {
      return res.status(404).json({ error: 'Nenhum termo encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar termo assinado.' });
  }
});

app.delete('/api/employees/:id/term', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE employees SET signed_term = NULL, signed_term_name = NULL, signed_term_at = NULL WHERE id = $1`,
      [id]
    );
    res.json({ message: 'Termo removido com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover termo.' });
  }
});

// ==========================================
// ROTAS CRUD - MANUTENÇÃO (MAINTENANCES)
// ==========================================

// GET: Lista todos os registros de manutenção
app.get('/api/maintenances', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenances ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar manutenções' });
  }
});

// POST: Abre novo chamado de manutenção
app.post('/api/maintenances', async (req, res) => {
  const { asset_id, asset_tag, asset_name, issue_description, provider, cost, expected_return_at, notes, employee_name } = req.body;
  
  if (!asset_tag || !issue_description) {
    return res.status(400).json({ error: 'Tag do patrimônio e descrição do problema são obrigatórios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cria registro de manutenção
    const maintRes = await client.query(`
      INSERT INTO maintenances (asset_id, asset_tag, asset_name, issue_description, provider, cost, status, opened_at, expected_return_at, notes, employee_name)
      VALUES ($1, $2, $3, $4, $5, $6, 'Em Manutenção', NOW(), $7, $8, $9)
      RETURNING *
    `, [asset_id || null, asset_tag, asset_name, issue_description, provider || null, cost || null, expected_return_at || null, notes || null, employee_name || null]);

    // Atualiza status do patrimônio para "Manutenção"
    await client.query(`
      UPDATE assets 
      SET status = 'Manutenção',
          notes = CASE WHEN notes IS NOT NULL AND notes != '' THEN notes || ' | ' || $1 ELSE $1 END
      WHERE tag = $2
    `, [`Enviado para manutenção: ${issue_description}`, asset_tag]);

    // Log de auditoria
    await client.query(`
      INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
      VALUES ('MANUTENCAO', $1, 'PATRIMONIO', $2)
    `, [`Equipamento ${asset_tag} (${asset_name}) enviado para manutenção: ${issue_description}`, asset_tag]);

    await client.query('COMMIT');
    res.status(201).json(maintRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar chamado de manutenção' });
  } finally {
    client.release();
  }
});

// PUT: Finaliza ou atualiza manutenção
app.put('/api/maintenances/:id', async (req, res) => {
  const { id } = req.params;
  const { status, closed_at, return_destination, employee_name, notes, cost, provider } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const maintRes = await client.query(`
      UPDATE maintenances
      SET status = $1,
          closed_at = CASE WHEN $1 = 'Concluída' THEN NOW() ELSE closed_at END,
          return_destination = $2,
          notes = $3,
          cost = $4,
          provider = $5
      WHERE id = $6
      RETURNING *
    `, [status || 'Concluída', return_destination || 'Estoque', notes || null, cost || null, provider || null, id]);

    if (maintRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Registro de manutenção não encontrado' });
    }

    const record = maintRes.rows[0];

    // Se concluiu a manutenção, ajusta o patrimônio
    if (status === 'Concluída') {
      if (return_destination === 'Colaborador' && employee_name) {
        await client.query(`
          UPDATE assets 
          SET status = 'Em Uso',
              employee = $1,
              last_verified = NOW()
          WHERE tag = $2
        `, [employee_name, record.asset_tag]);
      } else {
        await client.query(`
          UPDATE assets 
          SET status = 'Em Estoque',
              employee = NULL,
              last_verified = NOW()
          WHERE tag = $2
        `, [record.asset_tag]);
      }

      await client.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('MANUTENCAO', $1, 'PATRIMONIO', $2)
      `, [`Manutenção concluída para ${record.asset_tag}. Destino: ${return_destination}`, record.asset_tag]);
    }

    await client.query('COMMIT');
    res.json(maintRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar manutenção' });
  } finally {
    client.release();
  }
});

// ==========================================
// ROTAS DE AUDITORIA (AUDIT LOGS)
// ==========================================

app.get('/api/audit-logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar logs de auditoria' });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  const { action_type, description, entity_type, entity_id, user_name } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO audit_logs (action_type, description, entity_type, entity_id, user_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [action_type || 'INFO', description, entity_type || 'GERAL', entity_id || null, user_name || 'Administrador']);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar log' });
  }
});

// ==========================================
// AUTENTICAÇÃO
// ==========================================

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ 
      success: true, 
      username: 'admin', 
      name: 'Gabriel Ferezim (Admin)',
      role: 'Administrador do Sistema',
      avatar: 'G'
    });
  } else {
    res.status(401).json({ error: 'Usuário ou senha incorretos. Dica padrão: admin / admin123' });
  }
});

// ==========================================
// ROTAS CRUD - ESPAÇOS / AMBIENTES (SPACES)
// ==========================================

// GET: Lista todos os espaços
app.get('/api/spaces', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM spaces ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar espaços' });
  }
});

// POST: Cria novo espaço
app.post('/api/spaces', async (req, res) => {
  const { name, floor, type, description, icon, color } = req.body;
  if (!name || !floor) {
    return res.status(400).json({ error: 'Nome do espaço e andar são obrigatórios' });
  }
  try {
    const result = await pool.query(`
      INSERT INTO spaces (name, floor, type, description, icon, color)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      name.trim(),
      floor.trim(),
      type || 'Sala de Reunião',
      description || null,
      icon || 'meeting',
      color || '#3b82f6'
    ]);

    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('CADASTRO', $1, 'ESPACO', $2)
      `, [`Cadastrado novo espaço: ${name.trim()} (${floor.trim()})`, name.trim()]);
    } catch (_) {}

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar espaço. Verifique se o nome já existe.' });
  }
});

// PUT: Atualiza espaço existente
app.put('/api/spaces/:id', async (req, res) => {
  const { id } = req.params;
  const { name, floor, type, description, icon, color, oldName } = req.body;
  try {
    const result = await pool.query(`
      UPDATE spaces
      SET name = $1, floor = $2, type = $3, description = $4, icon = $5, color = $6
      WHERE id = $7
      RETURNING *
    `, [
      name.trim(),
      floor.trim(),
      type || 'Sala de Reunião',
      description || null,
      icon || 'meeting',
      color || '#3b82f6',
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Espaço não encontrado' });
    }

    // Se o nome do espaço mudou, atualiza a localização dos patrimônios alocados nele
    if (oldName && oldName !== name.trim()) {
      await pool.query(`
        UPDATE assets SET location = $1 WHERE location = $2
      `, [name.trim(), oldName]);
    }

    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('ATUALIZACAO', $1, 'ESPACO', $2)
      `, [`Atualizado espaço: ${name.trim()}`, name.trim()]);
    } catch (_) {}

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar espaço' });
  }
});

// DELETE: Exclui espaço
app.delete('/api/spaces/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const spaceRes = await pool.query('SELECT * FROM spaces WHERE id = $1', [id]);
    if (spaceRes.rows.length === 0) {
      return res.status(404).json({ error: 'Espaço não encontrado' });
    }

    const spaceName = spaceRes.rows[0].name;

    // Desvincula patrimônios deste espaço movendo a localização de volta para Estoque Central
    await pool.query(`
      UPDATE assets SET location = 'Estoque Central', status = 'Em Estoque' WHERE location = $1
    `, [spaceName]);

    await pool.query('DELETE FROM spaces WHERE id = $1', [id]);

    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('EXCLUSAO', $1, 'ESPACO', $2)
      `, [`Excluído espaço ${spaceName}. Equipamentos retornaram ao Estoque Central.`, spaceName]);
    } catch (_) {}

// ==========================================
// ROTAS CRUD - LICENÇAS DE SOFTWARE (LICENSES)
// ==========================================

// GET: Busca todas as licenças
app.get('/api/licenses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM licenses ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar licenças' });
  }
});

// POST: Cria nova licença
app.post('/api/licenses', async (req, res) => {
  const { name, category, license_type, license_key, total_seats, assigned_to, expiration_date, cost, supplier, notes } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Nome do software e categoria são obrigatórios.' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO licenses (name, category, license_type, license_key, total_seats, assigned_to, expiration_date, cost, supplier, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      name.trim(),
      category.trim(),
      license_type || 'Assinatura Anual',
      license_key ? license_key.trim() : null,
      parseInt(total_seats, 10) || 1,
      JSON.stringify(assigned_to || []),
      expiration_date || null,
      parseFloat(cost) || 0,
      supplier ? supplier.trim() : null,
      notes ? notes.trim() : null
    ]);

    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('CADASTRO', $1, 'LICENCA', $2)
      `, [`Cadastrada licença: ${name.trim()} (${total_seats} assentos)`, name.trim()]);
    } catch (_) {}

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar licença' });
  }
});

// PUT: Atualiza licença
app.put('/api/licenses/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, license_type, license_key, total_seats, assigned_to, expiration_date, cost, supplier, notes } = req.body;

  try {
    const result = await pool.query(`
      UPDATE licenses
      SET name = $1, category = $2, license_type = $3, license_key = $4, total_seats = $5, assigned_to = $6, expiration_date = $7, cost = $8, supplier = $9, notes = $10
      WHERE id = $11
      RETURNING *
    `, [
      name.trim(),
      category.trim(),
      license_type || 'Assinatura Anual',
      license_key ? license_key.trim() : null,
      parseInt(total_seats, 10) || 1,
      JSON.stringify(assigned_to || []),
      expiration_date || null,
      parseFloat(cost) || 0,
      supplier ? supplier.trim() : null,
      notes ? notes.trim() : null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Licença não encontrada' });
    }

    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('ATUALIZACAO', $1, 'LICENCA', $2)
      `, [`Atualizada licença: ${name.trim()}`, name.trim()]);
    } catch (_) {}

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar licença' });
  }
});

// DELETE: Exclui licença
app.delete('/api/licenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const licRes = await pool.query('SELECT * FROM licenses WHERE id = $1', [id]);
    if (licRes.rows.length === 0) {
      return res.status(404).json({ error: 'Licença não encontrada' });
    }

    const licName = licRes.rows[0].name;
    await pool.query('DELETE FROM licenses WHERE id = $1', [id]);

    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('EXCLUSAO', $1, 'LICENCA', $2)
      `, [`Excluída licença: ${licName}`, licName]);
    } catch (_) {}

    res.json({ message: 'Licença excluída com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir licença' });
  }
});

// Inicialização do servidor local
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`🚀 Servidor Trynova API rodando com sucesso na porta ${port}`);
  });
}

export default app;
