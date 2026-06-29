'use client'

import React, { useCallback, useRef, useState } from 'react'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileDropZoneProps {
  onFile: (file: File) => void
  fileName?: string | null
  disabled?: boolean
}

export function FileDropZone({ onFile, fileName, disabled }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [typeError, setTypeError] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      setTypeError(false)
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        setTypeError(true)
        return
      }
      onFile(file)
    },
    [onFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only fire if leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ''
    },
    [handleFile],
  )

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 select-none',
          isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : fileName
              ? 'border-green-400 bg-green-50 hover:border-green-500'
              : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="sr-only"
          onChange={handleInputChange}
          disabled={disabled}
        />

        {fileName ? (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-green-100 p-3">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-700 text-base">{fileName}</p>
              <p className="text-sm text-slate-500 mt-1">
                Clique para selecionar outro arquivo
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'rounded-full p-3 transition-colors',
                isDragging ? 'bg-blue-100' : 'bg-slate-100',
              )}
            >
              <Upload
                className={cn(
                  'h-8 w-8 transition-colors',
                  isDragging ? 'text-blue-600' : 'text-slate-400',
                )}
              />
            </div>
            <div>
              <p className="font-semibold text-slate-700 text-base">
                {isDragging ? 'Solte o arquivo aqui' : 'Arraste o arquivo ou clique para selecionar'}
              </p>
              <p className="text-sm text-slate-500 mt-1">Suporta arquivos .xlsx</p>
            </div>
          </div>
        )}
      </div>

      {typeError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <X className="h-4 w-4 flex-shrink-0" />
          <span>Formato inválido. Selecione um arquivo .xlsx</span>
        </div>
      )}
    </div>
  )
}
