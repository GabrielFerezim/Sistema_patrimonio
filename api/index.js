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

    // 0. Tabela de Configurações do Sistema (System Settings / SMTP)
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
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

    await client.query(`ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS asset_id INTEGER;`);
    await client.query(`ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS asset_tag VARCHAR(50);`);
    await client.query(`ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS asset_name VARCHAR(255);`);
    await client.query(`ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS issue_description TEXT;`);
    await client.query(`ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS provider VARCHAR(150);`);
    await client.query(`ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 2);`);
    await client.query(`ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Em Aberto';`);
    await client.query(`ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP DEFAULT NOW();`);
    await client.query(`ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS expected_return_at VARCHAR(50);`);
    await client.query(`ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;`);
    await client.query(`ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS notes TEXT;`);
    await client.query(`ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS return_destination VARCHAR(50);`);
    await client.query(`ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS employee_name VARCHAR(100);`);

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

    // 7. Tabela de Usuários do Sistema (System Users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Administrador',
        department VARCHAR(100) DEFAULT 'Tecnologia da Informação',
        status VARCHAR(20) DEFAULT 'Ativo',
        invite_sent_at TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Semeia usuário Admin principal Gabriel Ferezim se não existir
    try {
      await client.query(`
        INSERT INTO system_users (name, email, username, password, role, department, status, invite_sent_at)
        VALUES 
          ('Gabriel Ferezim', 'gabriel.ferezim@trynova.com.br', 'admin', 'admin123', 'Administrador', 'Tecnologia da Informação', 'Ativo', NOW()),
          ('Mateus Silva', 'mateus.silva@trynova.com.br', 'mateus', 'mateus123', 'Operador', 'Suporte de T.I', 'Ativo', NOW())
        ON CONFLICT (username) DO NOTHING;
      `);
    } catch (_) {}

    // Views analíticas para o Power BI
    try {
      await client.query(`
        CREATE OR REPLACE VIEW vw_powerbi_patrimonios AS
        SELECT 
          a.id AS id_patrimonio,
          a.tag AS tag_patrimonio,
          a.name AS nome_equipamento,
          a.equipment AS tipo_equipamento,
          a.location AS localizacao,
          COALESCE(a.employee, 'Disponível / Em Estoque') AS colaborador_responsavel,
          e.sector AS colaborador_setor,
          e.team AS colaborador_equipe_cliente,
          e.role AS colaborador_cargo,
          a.status AS status_patrimonio,
          a.condition AS condicao_conservacao,
          a.serial_number AS numero_serie,
          a.purchase_date AS data_aquisicao,
          COALESCE(a.value, 0) AS valor_aquisicao_brl,
          a.notes AS observacoes,
          a.last_verified AS data_ultima_auditoria,
          a.created_at AS data_cadastro
        FROM assets a
        LEFT JOIN employees e ON LOWER(TRIM(a.employee)) = LOWER(TRIM(e.name));
      `);

      await client.query(`
        CREATE OR REPLACE VIEW vw_powerbi_manutencoes AS
        SELECT 
          m.id AS id_manutencao,
          m.asset_tag AS tag_patrimonio,
          m.asset_name AS nome_equipamento,
          m.issue_description AS motivo_defeito,
          m.provider AS assistencia_fornecedor,
          COALESCE(m.cost, 0) AS custo_reparo_brl,
          m.status AS status_manutencao,
          m.opened_at AS data_abertura_chamado,
          m.closed_at AS data_conclusao_chamado,
          m.expected_return_at AS previsao_retorno,
          m.return_destination AS destino_apos_reparo,
          m.employee_name AS colaborador_vinculado
        FROM maintenances m;
      `);

      await client.query(`
        CREATE OR REPLACE VIEW vw_powerbi_licencas AS
        SELECT 
          l.id AS id_licenca,
          l.name AS software_nome,
          l.category AS categoria_software,
          l.license_type AS tipo_licenca,
          l.supplier AS fornecedor,
          l.total_seats AS assentos_totais,
          COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(l.assigned_to) = 'array' THEN l.assigned_to ELSE '[]'::jsonb END), 0) AS assentos_em_uso,
          (l.total_seats - COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(l.assigned_to) = 'array' THEN l.assigned_to ELSE '[]'::jsonb END), 0)) AS assentos_disponiveis,
          COALESCE(l.cost, 0) AS custo_total_licenca_brl,
          l.expiration_date AS data_expiracao,
          l.notes AS observacoes
        FROM licenses l;
      `);

      await client.query(`
        CREATE OR REPLACE VIEW vw_powerbi_colaboradores AS
        SELECT 
          e.id AS id_colaborador,
          e.name AS nome_colaborador,
          e.sector AS setor,
          e.ramal AS ramal,
          e.team AS equipe_cliente,
          e.role AS cargo,
          COUNT(a.id) AS total_equipamentos_em_custodia,
          COALESCE(SUM(a.value), 0) AS valor_total_custodia_brl
        FROM employees e
        LEFT JOIN assets a ON LOWER(TRIM(a.employee)) = LOWER(TRIM(e.name))
        GROUP BY e.id, e.name, e.sector, e.ramal, e.team, e.role;
      `);
    } catch (vErr) {
      console.warn("Aviso ao criar views do Power BI:", vErr.message);
    }

    console.log("Tabelas e Views do Power BI verificadas/inicializadas com sucesso!");
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
  
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const numId = parseInt(id, 10);
    let maintRes;

    if (!isNaN(numId) && numId < 2000000000) {
      maintRes = await client.query(`
        UPDATE maintenances
        SET status = $1,
            closed_at = CASE WHEN $1 = 'Concluída' THEN NOW() ELSE closed_at END,
            return_destination = COALESCE($2, return_destination),
            notes = COALESCE($3, notes),
            cost = COALESCE($4, cost),
            provider = COALESCE($5, provider),
            employee_name = COALESCE($6, employee_name)
        WHERE id = $7
        RETURNING *
      `, [
        status || 'Concluída',
        return_destination || 'Estoque',
        notes || null,
        cost !== undefined && cost !== '' && cost !== null ? parseFloat(cost) : null,
        provider || null,
        employee_name || null,
        numId
      ]);
    }

    if (!maintRes || maintRes.rows.length === 0) {
      const tagQuery = await client.query(`
        UPDATE maintenances
        SET status = $1,
            closed_at = CASE WHEN $1 = 'Concluída' THEN NOW() ELSE closed_at END,
            return_destination = COALESCE($2, return_destination),
            notes = COALESCE($3, notes),
            cost = COALESCE($4, cost),
            provider = COALESCE($5, provider),
            employee_name = COALESCE($6, employee_name)
        WHERE UPPER(asset_tag) = UPPER($7) AND status != 'Concluída'
        RETURNING *
      `, [
        status || 'Concluída',
        return_destination || 'Estoque',
        notes || null,
        cost !== undefined && cost !== '' && cost !== null ? parseFloat(cost) : null,
        provider || null,
        employee_name || null,
        String(id)
      ]);

      if (tagQuery.rows.length > 0) {
        maintRes = tagQuery;
      }
    }

    let record = maintRes && maintRes.rows.length > 0 ? maintRes.rows[0] : null;

    // Se concluiu a manutenção, ajusta o patrimônio na tabela assets
    if (status === 'Concluída') {
      const assetTagToUpdate = record ? record.asset_tag : (req.body.asset_tag || String(id));
      const isEmployeeDest = return_destination === 'Colaborador' && employee_name;

      await client.query(`
        UPDATE assets 
        SET status = $1,
            employee = $2,
            last_verified = NOW()
        WHERE UPPER(tag) = UPPER($3)
      `, [
        isEmployeeDest ? 'Em Uso' : 'Em Estoque',
        isEmployeeDest ? employee_name : null,
        assetTagToUpdate
      ]);

      try {
        await client.query(`
          INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
          VALUES ('MANUTENCAO', $1, 'PATRIMONIO', $2)
        `, [`Manutenção concluída para ${assetTagToUpdate}. Destino: ${return_destination || 'Estoque'}`, assetTagToUpdate]);
      } catch (_) {}
    }

    await client.query('COMMIT');
    res.json(record || { id, status: status || 'Concluída' });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Erro ao atualizar manutenção:', err);
    res.status(500).json({ error: 'Erro ao atualizar manutenção: ' + err.message });
  } finally {
    if (client) client.release();
  }
});

// DELETE: Exclui chamado de manutenção
app.delete('/api/maintenances/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const numId = parseInt(id, 10);
    let result;
    if (!isNaN(numId) && numId < 2000000000) {
      result = await pool.query('DELETE FROM maintenances WHERE id = $1 RETURNING *', [numId]);
    } else {
      result = await pool.query('DELETE FROM maintenances WHERE UPPER(asset_tag) = UPPER($1) RETURNING *', [String(id)]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro de manutenção não encontrado' });
    }

    res.json({ message: 'Chamado de manutenção excluído com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir manutenção.' });
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
    console.error('Erro ao cadastrar espaço:', err);
    if (err.code === '23505') {
      res.status(409).json({ error: 'Já existe um espaço cadastrado com este nome.' });
    } else {
      res.status(500).json({ error: 'Erro ao cadastrar espaço no banco de dados.' });
    }
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

    res.json({ message: 'Espaço excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir espaço:', err);
    res.status(500).json({ error: 'Erro ao excluir espaço' });
  }
});

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

// ==========================================
// ROTAS - AUTENTICAÇÃO E USUÁRIOS (USERS)
// ==========================================

// POST: Autenticação de Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Informe usuário/e-mail e senha.' });
  }

  const cleanLogin = String(username).trim().toLowerCase();
  const cleanPass = String(password).trim();

  try {
    let user = null;
    try {
      const result = await pool.query(
        'SELECT * FROM system_users WHERE LOWER(TRIM(username)) = $1 OR LOWER(TRIM(email)) = $1',
        [cleanLogin]
      );
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } catch (dbErr) {
      console.warn('Falha na consulta do DB ao autenticar:', dbErr.message);
    }

    if (user) {
      if (String(user.password).trim() !== cleanPass) {
        return res.status(401).json({ error: 'Senha incorreta.' });
      }
      if (user.status !== 'Ativo') {
        return res.status(403).json({ error: 'Usuário desativado. Entre em contato com o Administrador.' });
      }

      try {
        await pool.query('UPDATE system_users SET last_login = NOW() WHERE id = $1', [user.id]);
        await pool.query(`
          INSERT INTO audit_logs (action_type, description, entity_type, entity_id, user_name)
          VALUES ('LOGIN', $1, 'USUARIO', $2, $3)
        `, [`Usuário ${user.name} realizou login com sucesso`, String(user.id), user.name]);
      } catch (_) {}

      const { password: _, ...userSafe } = user;
      return res.json(userSafe);
    }

    // Fallback Master Admin Gabriel Ferezim
    if (
      (cleanLogin === 'admin' || cleanLogin === 'gabriel.ferezim@trynova.com.br' || cleanLogin === 'gabriel' || cleanLogin === 'gabriel.ferezim') &&
      (cleanPass === 'admin123' || cleanPass === 'admin')
    ) {
      return res.json({
        id: 1,
        username: 'admin',
        name: 'Gabriel Ferezim',
        email: 'gabriel.ferezim@trynova.com.br',
        role: 'Administrador',
        department: 'Tecnologia da Informação',
        status: 'Ativo',
        avatar: 'G'
      });
    }

    return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu usuário/e-mail e senha.' });
  } catch (err) {
    console.error('Erro na rota /api/login:', err);
    res.status(500).json({ error: 'Erro interno ao realizar autenticação.' });
  }
});

// GET: Lista todos os usuários do sistema
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, username, role, department, status, invite_sent_at, last_login, created_at FROM system_users ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuários do sistema.' });
  }
});

// ==========================================
// SERVIÇO DE ENVIO DE E-MAILS (SMTP)
// POST: Cria novo usuário
app.post('/api/users', async (req, res) => {
  const { name, email, username, password, role, department } = req.body;
  if (!name || !email || !username || !password) {
    return res.status(400).json({ error: 'Nome, e-mail, usuário e senha são obrigatórios.' });
  }

  try {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanRole = role || 'Operador';
    const cleanDept = department || 'Geral';

    const result = await pool.query(`
      INSERT INTO system_users (name, email, username, password, role, department, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'Ativo')
      RETURNING id, name, email, username, role, department, status, last_login, created_at
    `, [cleanName, cleanEmail, cleanUser, cleanPass, cleanRole, cleanDept]);

    const newUser = result.rows[0];

    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('CADASTRO', $1, 'USUARIO', $2)
      `, [`Cadastrado novo usuário: ${cleanName} (${cleanEmail}) como ${cleanRole}`, String(newUser.id)]);
    } catch (_) {}

    res.status(201).json(newUser);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Já existe um usuário com este e-mail ou nome de usuário.' });
    }
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});

// PUT: Atualiza usuário
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, username, password, role, department, status } = req.body;

  try {
    let query = `
      UPDATE system_users
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          username = COALESCE($3, username),
          role = COALESCE($4, role),
          department = COALESCE($5, department),
          status = COALESCE($6, status)
    `;
    const params = [
      name ? name.trim() : null,
      email ? email.trim().toLowerCase() : null,
      username ? username.trim().toLowerCase() : null,
      role || null,
      department || null,
      status || null
    ];

    if (password && password.trim()) {
      query += `, password = $7 WHERE id = $8 RETURNING id, name, email, username, role, department, status, invite_sent_at, last_login, created_at`;
      params.push(password.trim(), id);
    } else {
      query += ` WHERE id = $7 RETURNING id, name, email, username, role, department, status, invite_sent_at, last_login, created_at`;
      params.push(id);
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('ATUALIZACAO', $1, 'USUARIO', $2)
      `, [`Atualizado cadastro de usuário: ${result.rows[0].name}`, String(id)]);
    } catch (_) {}

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// DELETE: Exclui usuário
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const userRes = await pool.query('SELECT * FROM system_users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const user = userRes.rows[0];
    if (user.username === 'admin' || user.email === 'gabriel.ferezim@trynova.com.br') {
      return res.status(400).json({ error: 'O Administrador principal do sistema não pode ser excluído.' });
    }

    await pool.query('DELETE FROM system_users WHERE id = $1', [id]);

    try {
      await pool.query(`
        INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
        VALUES ('EXCLUSAO', $1, 'USUARIO', $2)
      `, [`Excluído usuário: ${user.name} (${user.username})`, String(id)]);
    } catch (_) {}

    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

// POST: Recuperação de Senha
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Informe seu e-mail cadastrado.' });
  }

  try {
    const result = await pool.query('SELECT * FROM system_users WHERE LOWER(email) = $1', [email.trim().toLowerCase()]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      try {
        await pool.query(`
          INSERT INTO audit_logs (action_type, description, entity_type, entity_id)
          VALUES ('NOTIFICACAO', $1, 'USUARIO', $2)
        `, [`Solicitação de recuperação de senha enviada para ${user.email}`, String(user.id)]);
      } catch (_) {}
    }
    res.json({ success: true, message: 'Se o e-mail informado estiver cadastrado, as instruções de redefinição foram enviadas.' });
  } catch (err) {
    console.error(err);
    res.json({ success: true, message: 'Se o e-mail informado estiver cadastrado, as instruções de redefinição foram enviadas.' });
  }
});

// POST: Purga registros mockados do banco de dados
app.post('/api/purge-mock-data', async (req, res) => {
  try {
    await pool.query(`DELETE FROM assets WHERE tag IN ('PAT-001','PAT-002','PAT-003','PAT-004','PAT-005','PAT-006','PAT-007','PAT-008','PAT-009','PAT-010','PAT-011','PAT-012')`);
    await pool.query(`DELETE FROM employees WHERE name IN ('Thiago Alencar', 'Mariana Costa', 'Carlos Eduardo', 'Aline Schmidt')`);
    await pool.query(`DELETE FROM licenses WHERE license_key IN ('MS365-TRYN-2025-ENTERPRISE', 'ADOBE-CC-PRO-2024', 'WIN11-PRO-OEM-VOL-9921', 'AUTODESK-ACAD-2024-BR')`);
    await pool.query(`DELETE FROM maintenances WHERE asset_tag = 'PAT-006'`);
    await pool.query(`DELETE FROM audit_logs WHERE description LIKE '%PAT-001%' OR description LIKE '%Inicialização do banco de dados%'`);
    res.json({ success: true, message: 'Dados mockados removidos com sucesso!' });
  } catch (err) {
    console.error('Erro ao purgar dados mockados:', err);
    res.status(500).json({ error: 'Erro ao limpar dados mockados' });
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
