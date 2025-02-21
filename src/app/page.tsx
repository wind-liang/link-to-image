'use client'

import { useState } from 'react'
import Image from 'next/image'

const STYLES = [
  {
    id: 'white',
    name: '简约白',
    description: '简洁大方的白色背景',
    preview: '黑色文字 + 白色背景',
  },
  {
    id: 'wechat',
    name: '微信绿',
    description: '微信风格设计',
    preview: '白色文字 + 绿色背景',
  },
]

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('white')
  const [customTitle, setCustomTitle] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [showCustomFields, setShowCustomFields] = useState(false)

  // 添加 URL 验证函数
  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      // 检查协议
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false;
      }
      // 检查域名格式
      const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      return domainPattern.test(url.hostname);
    } catch (_) {
      return false;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 在提交前验证 URL
    if (!isValidUrl(url)) {
      setError('请输入正确的网页链接格式，例如：https://example.com');
      return;
    }

    setLoading(true)
    setError('')
    setImageUrl('')
    setCopyStatus('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url, 
          style: selectedStyle,
          customTitle: customTitle.trim(),
          customDescription: customDescription.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '生成图片时出错')
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      setImageUrl(objectUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成图片时出错')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyImage = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ])
      setCopyStatus('复制成功！')
      setTimeout(() => setCopyStatus(''), 2000)
    } catch (err) {
      setCopyStatus('复制失败，请手动下载图片')
      console.error('复制失败:', err)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Link to Image
          </h1>
          <p className="text-xl text-gray-600">
            将网页链接转换成精美的图片，包含二维码和网站信息
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 样式选择 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STYLES.map((style) => (
                <div
                  key={style.id}
                  className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedStyle === style.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{style.name}</h3>
                    {selectedStyle === style.id && (
                      <span className="text-blue-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className={`h-[60px] rounded-lg mb-2 overflow-hidden ${
                    style.id === 'white' 
                      ? 'bg-white' 
                      : 'bg-[#07C160]'
                  }`}>
                    <div className="flex items-center h-full px-3">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className={`text-sm font-bold mb-1 ${
                          style.id === 'white' ? 'text-gray-900' : 'text-white'
                        }`}>
                          网页标题
                        </div>
                        <div className={`text-xs ${
                          style.id === 'white' ? 'text-gray-500' : 'text-white/90'
                        }`}>
                          网页描述信息
                        </div>
                      </div>
                      <div className={`w-[45px] h-[45px] flex-shrink-0 rounded-lg overflow-hidden ${
                        style.id === 'white' ? 'bg-gray-900' : 'bg-white'
                      }`}>
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M3 5h18v14H3V5z" stroke={style.id === 'white' ? '#fff' : '#07C160'} strokeWidth="2"/>
                            <path d="M7 9h10M7 13h10" stroke={style.id === 'white' ? '#fff' : '#07C160'} strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{style.description}</p>
                </div>
              ))}
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                输入网页链接
              </label>
              <div className="space-y-2">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    // 清除之前的错误信息
                    setError('');
                  }}
                  required
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors peer"
                  onInvalid={(e) => {
                    e.preventDefault();
                    const input = e.target as HTMLInputElement;
                    if (input.validity.valueMissing) {
                      input.setCustomValidity('请输入网页链接');
                    } else if (input.validity.typeMismatch || !isValidUrl(input.value)) {
                      input.setCustomValidity('请输入正确的网页链接格式，例如：https://example.com');
                    }
                  }}
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement;
                    input.setCustomValidity('');
                  }}
                />
                <p className="text-sm text-gray-500">
                  请输入以 https:// 或 http:// 开头的网页链接
                </p>
                <p className="text-sm text-red-600 hidden peer-[&:not(:placeholder-shown):invalid]:block">
                  请输入正确的网页链接格式，例如：https://example.com
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setShowCustomFields(!showCustomFields)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                {showCustomFields ? '收起编辑选项' : '自定义标题和描述'}
                <svg 
                  className={`w-4 h-4 transform transition-transform ${showCustomFields ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {showCustomFields && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="customTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    自定义标题
                  </label>
                  <input
                    type="text"
                    id="customTitle"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="不填则使用网页原标题"
                    maxLength={32}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="customDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    自定义描述
                  </label>
                  <textarea
                    id="customDescription"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="不填则使用网页原描述"
                    maxLength={150}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !url}
              className={`w-full py-3 px-6 rounded-lg transition-all font-medium flex items-center justify-center gap-2 ${
                !url 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : loading
                    ? 'bg-blue-500 text-white/90 cursor-wait'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="animate-pulse">生成中...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {!url ? '请输入链接' : '生成图片'}
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {imageUrl && (
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">生成的图片：</h2>
              <div className="relative bg-gray-50 rounded-lg p-4 sm:p-8 border border-gray-100">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden mx-auto">
                  <Image
                    src={imageUrl}
                    alt="生成的图片"
                    width={500}
                    height={120}
                    className="w-full h-auto"
                    style={{
                      imageRendering: 'crisp-edges',
                    }}
                    unoptimized
                  />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={imageUrl}
                    download="link-to-image.png"
                    className="flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm hover:shadow w-full sm:w-auto"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    下载图片
                  </a>
                  <button
                    onClick={handleCopyImage}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow w-full sm:w-auto"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    复制图片
                  </button>
                </div>
                {copyStatus && (
                  <div className={`mt-3 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                    copyStatus.includes('失败') ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {copyStatus.includes('失败') ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span className="animate-fade-in">{copyStatus}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p>适用于微信公众号、博客、社交媒体等场景</p>
          <p className="mt-2">支持任何有效的网页链接</p>
        </div>
      </div>
    </main>
  )
}
