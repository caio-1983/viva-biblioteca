const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Pula o cabeçalho
  const dataLines = lines.slice(1).filter(line => line.trim());

  const data = [];

  dataLines.forEach((line, index) => {
    const columns = line.split(';');

    // Se a linha não tem dados suficientes, pula
    if (!columns[0] || !columns[0].trim()) return;

    const titulo = columns[0]?.trim() || '';
    const subtitulo = columns[1]?.trim() || null;
    const autor = columns[2]?.trim() || null;
    const edicao = columns[3]?.trim() || null;
    const ano = columns[4]?.trim() || null;
    const editora = columns[5]?.trim() || null;
    const numero = columns[6]?.trim() || null;
    const tombo = columns[7]?.trim() || null;
    const classificacao = columns[8]?.trim() || null;
    const assunto = columns[9]?.trim() || null;
    const observacao = columns[11]?.trim() || null;
    const isbn = columns[12]?.trim() || null;

    // O número é necessário como ID único
    let numeroExemplar = numero || tombo || `AUTO-${index + 1}`;

    data.push({
      numeroExemplar,
      titulo,
      subtitulo,
      autor,
      edicao,
      ano,
      editora,
      tombo,
      classificacao,
      assunto,
      observacao,
      isbn,
    });
  });

  return data;
}

function main() {
  try {
    console.log('🚀 Iniciando importação do acervo (SQLite direto)...\n');

    const csvPath = path.join(__dirname, '../storage/imports/acervo.csv');
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ Arquivo não encontrado: ${csvPath}`);
      process.exit(1);
    }

    // Abre o banco de dados SQLite
    const dbPath = path.join(__dirname, '../storage/database/biblioteca.db');
    console.log(`📂 Conectando ao banco: ${dbPath}\n`);

    const db = new Database(dbPath);

    // Prepara os dados
    const acervoData = parseCSV(csvPath);
    console.log(`📚 Encontrados ${acervoData.length} livros no arquivo CSV\n`);

    // Inicia uma transação para melhor performance
    const insertStmt = db.prepare(`
      INSERT INTO Acervo (
        numeroExemplar, titulo, subtitulo, autor, edicao,
        editora, dataPublicacao, tombo, classificacao,
        assunto1, assunto2, assunto3, observacao, isbn,
        status, ativo, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((items) => {
      let imported = 0;
      let skipped = 0;

      for (const item of items) {
        try {
          // Verifica se já existe
          const existing = db.prepare(
            'SELECT id FROM Acervo WHERE numeroExemplar = ?'
          ).get(item.numeroExemplar);

          if (existing) {
            console.log(`⏭️  Pulando: ${item.titulo} (já existe)`);
            skipped++;
            continue;
          }

          // Converte o ano
          let dataPublicacao = null;
          if (item.ano) {
            try {
              const year = parseInt(item.ano);
              if (!isNaN(year)) {
                dataPublicacao = new Date(year, 0, 1).toISOString();
              }
            } catch (e) {}
          }

          // Divide os assuntos
          let assunto1 = item.assunto || null;
          let assunto2 = null;
          let assunto3 = null;

          if (assunto1 && assunto1.includes('/')) {
            const assuntos = assunto1.split('/').map(a => a.trim());
            assunto1 = assuntos[0] || null;
            assunto2 = assuntos[1] || null;
            assunto3 = assuntos[2] || null;
          }

          const now = new Date().toISOString();

          insertStmt.run(
            item.numeroExemplar,
            item.titulo,
            item.subtitulo,
            item.autor,
            item.edicao,
            item.editora,
            dataPublicacao,
            item.tombo,
            item.classificacao,
            assunto1,
            assunto2,
            assunto3,
            item.observacao,
            item.isbn,
            'DISPONIVEL',
            1, // true/ativo
            now,
            now
          );

          console.log(`✅ Importado: ${item.titulo}`);
          imported++;
        } catch (error) {
          console.error(`❌ Erro ao importar "${item.titulo}":`, error.message);
          skipped++;
        }
      }

      return { imported, skipped };
    });

    const result = transaction(acervoData);

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO DA IMPORTAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Importados com sucesso: ${result.imported}`);
    console.log(`⏭️  Pulados (duplicados ou erros): ${result.skipped}`);
    console.log(`📚 Total de livros processados: ${acervoData.length}`);
    console.log('='.repeat(60) + '\n');

    db.close();
    console.log('✅ Importação concluída!');

  } catch (error) {
    console.error('❌ Erro fatal:', error.message || error);
    process.exit(1);
  }
}

main();
