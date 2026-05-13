'use client'
import { useState } from 'react'
import { useCaption } from '../../../hooks/useAI'
import { Upload, Image as ImageIcon, Copy, Check } from 'lucide-react'

export function ImageTab() {
  const [imageUrl, setImageUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [uploadMode, setUploadMode] = useState<'url' | 'preview'>('url')
  const [copied, setCopied] = useState<'caption' | 'alt' | null>(null)
  
  const [captionState, generateCaption] = useCaption()
  
  const handleGenerate = async () => {
    if (!imageUrl) return
    const result = await generateCaption({ imageUrl })
    if (result) {
      setAltText(result.altText)
    }
  }
  
  const handleCopy = (text: string, type: 'caption' | 'alt') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }
  
  const handleApplyToImage = () => {
    // Dispatch custom event or update store to apply alt text to selected image
    // This will be connected to the editor's image block
    window.dispatchEvent(new CustomEvent('applyImageAlt', { 
      detail: { altText } 
    }))
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
        <p className="text-xs text-blue-800 leading-relaxed">
          Generate caption dan alt text untuk gambar menggunakan AI. Upload atau masukkan URL gambar.
        </p>
      </div>
      
      {/* URL Input */}
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1.5">URL Gambar</label>
        <input
          type="url"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full text-xs border rounded-lg px-3 py-2 outline-none focus:border-amber-400"
        />
      </div>
      
      {/* Or upload from computer (future implementation) */}
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1.5">Atau upload file</label>
        <button
          onClick={() => setUploadMode('preview')}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-6 flex flex-col items-center justify-center gap-2 hover:border-amber-400 transition-colors"
        >
          <Upload size={24} className="text-gray-400" />
          <span className="text-xs text-gray-500">Click to upload (coming soon)</span>
        </button>
      </div>
      
      {/* Image Preview */}
      {imageUrl && (
        <div className="border rounded-lg overflow-hidden">
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="w-full h-40 object-cover"
            onError={() => setImageUrl('')}
          />
        </div>
      )}
      
      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!imageUrl || captionState.loading}
        className="w-full py-2.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
      >
        {captionState.loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Generating...
          </span>
        ) : 'Generate Caption & Alt Text'}
      </button>
      
      {/* Results */}
      {captionState.result && (
        <div className="space-y-4">
          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">Caption</label>
              <button
                onClick={() => handleCopy(captionState.result!.caption, 'caption')}
                className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                {copied === 'caption' ? (
                  <><Check size={12} /> Copied!</>
                ) : (
                  <><Copy size={12} /> Copy</>
                )}
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-700">
              {captionState.result.caption}
            </div>
          </div>
          
          {/* Alt Text */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">Alt Text (untuk aksesibilitas)</label>
              <button
                onClick={() => handleCopy(captionState.result!.altText, 'alt')}
                className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                {copied === 'alt' ? (
                  <><Check size={12} /> Copied!</>
                ) : (
                  <><Copy size={12} /> Copy</>
                )}
              </button>
            </div>
            <textarea
              value={captionState.result.altText}
              onChange={e => setAltText(e.target.value)}
              rows={3}
              className="w-full text-xs border rounded-lg px-3 py-2 outline-none focus:border-amber-400 resize-none"
            />
          </div>
          
          {/* Apply Button */}
          <button
            onClick={handleApplyToImage}
            className="w-full py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            ✅ Terapkan ke Gambar
          </button>
        </div>
      )}
      
      {/* Error */}
      {captionState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-600">{captionState.error}</p>
        </div>
      )}
      
      {/* Info */}
      <div className="text-[10px] text-gray-400 text-center">
        <p>💡 Caption untuk tampilan, Alt text untuk aksesibilitas (screen reader)</p>
        <p className="mt-1">Cost: ~$0.008 per image</p>
      </div>
    </div>
  )
}
