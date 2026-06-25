'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function CadastroAcervoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    tipoPublicacao: '',
    isbn: '',
    classificacao: '',
    titulo: '',
    subtitulo: '',
    autor: '',
    edicao: '',
    editora: '',
    anoPublicacao: '',
    tombo: '',
    assunto1: '',
    assunto2: '',
    assunto3: '',
    colecao: '',
    observacao: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        anoPublicacao: formData.anoPublicacao ? Number(formData.anoPublicacao) : null,
      }

      const response = await fetch('/api/acervo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao cadastrar exemplar')
      }

      router.push('/acervo/consulta?success=cadastrado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar exemplar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/acervo/consulta">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Cadastrar Exemplar</h1>
              <p className="text-sm text-muted-foreground">
                Adicione um novo exemplar ao acervo
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="border-0 bg-card shadow-lg">
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Informações Básicas */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-foreground">
                  Informações Básicas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="titulo">
                      Título <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="titulo"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      placeholder="Digite o título"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtitulo">Subtítulo</Label>
                    <Input
                      id="subtitulo"
                      name="subtitulo"
                      value={formData.subtitulo}
                      onChange={handleChange}
                      placeholder="Digite o subtítulo"
                    />
                  </div>
                </div>
              </div>

              {/* Autor e Editora */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-foreground">
                  Autor e Editora
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="autor">Autor</Label>
                    <Input
                      id="autor"
                      name="autor"
                      value={formData.autor}
                      onChange={handleChange}
                      placeholder="Digite o autor"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editora">Editora</Label>
                    <Input
                      id="editora"
                      name="editora"
                      value={formData.editora}
                      onChange={handleChange}
                      placeholder="Digite a editora"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edicao">Edição</Label>
                    <Input
                      id="edicao"
                      name="edicao"
                      value={formData.edicao}
                      onChange={handleChange}
                      placeholder="Ex: 1ª, 2ª"
                    />
                  </div>
                  <div>
                    <Label htmlFor="anoPublicacao">Ano de Publicação</Label>
                    <Input
                      id="anoPublicacao"
                      name="anoPublicacao"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={formData.anoPublicacao}
                      onChange={handleChange}
                      placeholder="Ex: 2024"
                    />
                  </div>
                </div>
              </div>

              {/* Classificação e Assuntos */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-foreground">
                  Classificação e Assuntos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="classificacao">Classificação</Label>
                    <Input
                      id="classificacao"
                      name="classificacao"
                      value={formData.classificacao}
                      onChange={handleChange}
                      placeholder="Ex: 813.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipoPublicacao">Tipo de Publicação</Label>
                    <Input
                      id="tipoPublicacao"
                      name="tipoPublicacao"
                      value={formData.tipoPublicacao}
                      onChange={handleChange}
                      placeholder="Ex: Livro, Revista"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div>
                    <Label htmlFor="assunto1">Assunto Principal</Label>
                    <Input
                      id="assunto1"
                      name="assunto1"
                      value={formData.assunto1}
                      onChange={handleChange}
                      placeholder="Ex: Teologia"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assunto2">Assunto Secundário</Label>
                    <Input
                      id="assunto2"
                      name="assunto2"
                      value={formData.assunto2}
                      onChange={handleChange}
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assunto3">Assunto Terciário</Label>
                    <Input
                      id="assunto3"
                      name="assunto3"
                      value={formData.assunto3}
                      onChange={handleChange}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </div>

              {/* Identificação */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-foreground">
                  Identificação
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      name="isbn"
                      value={formData.isbn}
                      onChange={handleChange}
                      placeholder="Ex: 978-8-526-30203-5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tombo">Tombo</Label>
                    <Input
                      id="tombo"
                      name="tombo"
                      value={formData.tombo}
                      onChange={handleChange}
                      placeholder="Código do tombo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="colecao">Coleção</Label>
                    <Input
                      id="colecao"
                      name="colecao"
                      value={formData.colecao}
                      onChange={handleChange}
                      placeholder="Ex: Coleção 1"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-foreground">Observações</h2>
                <div>
                  <Label htmlFor="observacao">Observação</Label>
                  <textarea
                    id="observacao"
                    name="observacao"
                    value={formData.observacao}
                    onChange={handleChange}
                    placeholder="Adicione observações sobre o exemplar"
                    className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={4}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Cadastrando...' : 'Cadastrar Exemplar'}
                </Button>
                <Link href="/acervo/consulta">
                  <Button variant="outline">Cancelar</Button>
                </Link>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
