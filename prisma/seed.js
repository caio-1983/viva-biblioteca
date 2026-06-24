const fs = require('fs');
const path = require('path');

// Carrega .env antes de qualquer outra coisa
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Agora importa o Prisma
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn'] : [],
});

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
    const subtitulo = columns[1]?.trim() || undefined;
    const autor = columns[2]?.trim() || undefined;
    const edicao = columns[3]?.trim() || undefined;
    const ano = columns[4]?.trim() || undefined;
    const editora = columns[5]?.trim() || undefined;
    const numero = columns[6]?.trim() || undefined;
    const tombo = columns[7]?.trim() || undefined;
    const classificacao = columns[8]?.trim() || undefined;
    const assunto = columns[9]?.trim() || undefined;
    const observacao = columns[11]?.trim() || undefined;
    const isbn = columns[12]?.trim() || undefined;

    // O número é necessário como ID único, se não tiver usa tombo ou cria um
    let numeroExemplar = numero || tombo || '';
    if (!numeroExemplar) {
      numeroExemplar = `AUTO-${index + 1}`;
    }

    data.push({
      titulo,
      subtitulo: subtitulo || undefined,
      autor: autor || undefined,
      edicao: edicao || undefined,
      ano: ano || undefined,
      editora: editora || undefined,
      numeroExemplar,
      tombo: tombo || undefined,
      classificacao: classificacao || undefined,
      assunto: assunto || undefined,
      observacao: observacao || undefined,
      isbn: isbn || undefined,
    });
  });

  return data;
}

async function main() {
  try {
    console.log('🚀 Iniciando importação do acervo...\n');

    const csvPath = path.join(__dirname, '../storage/imports/acervo.csv');

    if (!fs.existsSync(csvPath)) {
      console.error(`❌ Arquivo não encontrado: ${csvPath}`);
      process.exit(1);
    }

    const acervoData = parseCSV(csvPath);
    console.log(`📚 Encontrados ${acervoData.length} livros no arquivo CSV\n`);

    let imported = 0;
    let skipped = 0;

    for (const data of acervoData) {
      try {
        // Verifica se já existe
        const existing = await prisma.acervo.findUnique({
          where: { numeroExemplar: data.numeroExemplar }
        });

        if (existing) {
          console.log(`⏭️  Pulando: ${data.titulo} (já existe)`);
          skipped++;
          continue;
        }

        // Converte o ano para DateTime se disponível
        let dataPublicacao = undefined;
        if (data.ano) {
          try {
            const year = parseInt(data.ano);
            if (!isNaN(year)) {
              dataPublicacao = new Date(year, 0, 1);
            }
          } catch (e) {
            // Ignora se não conseguir converter
          }
        }

        // Divide os assuntos se houver vários separados por /
        let assunto1 = data.assunto || undefined;
        let assunto2 = undefined;
        let assunto3 = undefined;

        if (assunto1 && assunto1.includes('/')) {
          const assuntos = assunto1.split('/').map(a => a.trim());
          assunto1 = assuntos[0] || undefined;
          assunto2 = assuntos[1] || undefined;
          assunto3 = assuntos[2] || undefined;
        }

        // Cria o registro
        await prisma.acervo.create({
          data: {
            numeroExemplar: data.numeroExemplar,
            titulo: data.titulo,
            subtitulo: data.subtitulo,
            autor: data.autor,
            edicao: data.edicao,
            editora: data.editora,
            dataPublicacao,
            tombo: data.tombo,
            classificacao: data.classificacao,
            assunto1,
            assunto2,
            assunto3,
            observacao: data.observacao,
            isbn: data.isbn,
            status: 'DISPONIVEL',
            ativo: true,
          }
        });

        console.log(`✅ Importado: ${data.titulo}`);
        imported++;
      } catch (error) {
        console.error(`❌ Erro ao importar "${data.titulo}":`, error.message || error);
        skipped++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO DA IMPORTAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Importados com sucesso: ${imported}`);
    console.log(`⏭️  Pulados (duplicados ou erros): ${skipped}`);
    console.log(`📚 Total de livros processados: ${acervoData.length}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error('Erro na execução:', error);
  process.exit(1);
});
