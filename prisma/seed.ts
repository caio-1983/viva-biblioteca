import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://biblioteca:biblioteca@localhost:5432/biblioteca';
const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });

interface AcervoData {
  titulo: string;
  subtitulo?: string;
  autor?: string;
  edicao?: string;
  ano?: string;
  editora?: string;
  numeroExemplar: string;
  tombo?: string;
  classificacao?: string;
  assunto?: string;
  observacao?: string;
  isbn?: string;
}

function parseCSV(filePath: string): AcervoData[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Pula o cabeçalho
  const dataLines = lines.slice(1).filter(line => line.trim());

  const data: AcervoData[] = [];

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
    console.log('🚀 Iniciando importação do acervo...');

    const csvPath = path.join(__dirname, '../storage/imports/acervo.csv');

    if (!fs.existsSync(csvPath)) {
      console.error(`❌ Arquivo não encontrado: ${csvPath}`);
      process.exit(1);
    }

    const acervoData = parseCSV(csvPath);
    console.log(`📚 Encontrados ${acervoData.length} livros no arquivo CSV`);

    let imported = 0;
    let skipped = 0;

    for (const data of acervoData) {
      try {
        // Verifica se já existe
        const existing = await prisma.acervo.findUnique({
          where: { numeroExemplar: data.numeroExemplar }
        });

        if (existing) {
          console.log(`⏭️  Pulando ${data.titulo} (já existe)`);
          skipped++;
          continue;
        }

        // Converte o ano para DateTime se disponível
        let dataPublicacao: Date | undefined = undefined;
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
        console.error(`❌ Erro ao importar "${data.titulo}":`, error instanceof Error ? error.message : error);
        skipped++;
      }
    }

    console.log('\n📊 Resultado da importação:');
    console.log(`✅ Importados: ${imported}`);
    console.log(`⏭️  Pulados: ${skipped}`);
    console.log(`📚 Total: ${acervoData.length}`);

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
