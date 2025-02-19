import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { createCanvas } from 'canvas'
import { loadImage } from 'canvas'

// 定义样式配置
const STYLE_CONFIGS = {
  white: {
    width: 500,
    height: 120,
    background: { r: 255, g: 255, b: 255 },
    titleColor: '#1F2937',
    descriptionColor: '#4B5563',
    titleFont: 'bold 18px "Microsoft YaHei"',
    descriptionFont: '14px "Microsoft YaHei"',
    qrSize: 82,
    border: { r: 226, g: 232, b: 240, alpha: 0.6 },
    qrStyle: {
      dark: '#1F2937',
      light: '#FFFFFF',
      border: { r: 255, g: 255, b: 255 },
      padding: 4,
      tipText: '长按或扫码访问',
      tipColor: '#6B7280',
    },
    layout: {
      titleX: 25,
      titleY: 35,
      descriptionX: 25,
      descriptionY: 65,
      descriptionLineHeight: 20,
      qrRightPadding: 25,
      qrTopPadding: 8,
      tipSpacing: 2,
    }
  },
  wechat: {
    width: 500,
    height: 120,
    background: { r: 7, g: 193, b: 96 },
    titleColor: '#FFFFFF',
    descriptionColor: 'rgba(255, 255, 255, 0.9)',
    titleFont: 'bold 18px "Microsoft YaHei"',
    descriptionFont: '14px "Microsoft YaHei"',
    qrSize: 82,
    border: { r: 7, g: 193, b: 96, alpha: 0 },
    qrStyle: {
      dark: '#FFFFFF',
      light: '#07C160',
      border: { r: 7, g: 193, b: 96 },
      padding: 4,
      tipText: '长按或扫码访问',
      tipColor: 'rgba(255, 255, 255, 0.9)',
    },
    layout: {
      titleX: 25,
      titleY: 35,
      descriptionX: 25,
      descriptionY: 65,
      descriptionLineHeight: 20,
      qrRightPadding: 25,
      qrTopPadding: 8,
      tipSpacing: 2,
    }
  },
}

export async function POST(request: NextRequest) {
  try {
    const { url, style = 'modern', customTitle, customDescription } = await request.json()
    console.log('Received URL:', url, 'Style:', style)

    if (!url) {
      console.error('No URL provided')
      return NextResponse.json(
        { error: '请提供有效的 URL' },
        { status: 400 }
      )
    }

    // 验证 URL 格式
    try {
      const urlObj = new URL(url);
      // 检查协议
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return NextResponse.json(
          { error: '请输入正确的网页链接格式，例如：https://example.com' },
          { status: 400 }
        )
      }
      // 检查域名格式
      const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      if (!domainPattern.test(urlObj.hostname)) {
        return NextResponse.json(
          { error: '请输入有效的网页链接，域名格式不正确' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: '请输入正确的网页链接格式，例如：https://example.com' },
        { status: 400 }
      )
    }

    try {
      // 获取样式配置
      const styleConfig = STYLE_CONFIGS[style as keyof typeof STYLE_CONFIGS]

      // 启动浏览器并抓取网页信息
      console.log('Launching browser...')
      const browser = await chromium.launch()
      const page = await browser.newPage()
      
      let title = customTitle
      let description = customDescription
      
      try {
        console.log('Navigating to URL:', url)
        // 设置页面加载超时时间为 10 秒
        await page.goto(url, { timeout: 10000 })
        
        // 如果没有自定义标题和描述，则尝试从网页获取
        if (!customTitle) {
          title = await page.title() || '未能获取网页标题'
        }
        if (!customDescription) {
          description = await page.$eval(
            'meta[name="description"]',
            (el) => el.getAttribute('content') || ''
          ).catch(() => '未能获取网页描述')
        }
      } catch (err) {
        console.log('Failed to fetch page info:', err)
        // 设置默认值
        if (!title) title = '未能访问的网页'
        if (!description) description = '该网页暂时无法访问，您可以点击上方的"自定义标题和描述"来编辑显示内容'
      } finally {
        await browser.close()
        console.log('Browser closed')
      }

      // 生成二维码
      console.log('Generating QR code...')
      const scale = 2 // 增加分辨率
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: styleConfig.qrSize * scale,
        margin: 0,
        color: {
          dark: styleConfig.qrStyle.dark,
          light: styleConfig.qrStyle.light,
        },
      })

      // 创建主画布
      console.log('Creating main canvas...')
      const canvas = createCanvas(styleConfig.width * scale, styleConfig.height * scale)
      const ctx = canvas.getContext('2d')
      
      // 缩放画布以适应更高分辨率
      ctx.scale(scale, scale)
      
      // 启用字体平滑
      ctx.imageSmoothingEnabled = true
      
      // 绘制背景
      ctx.fillStyle = `rgb(${styleConfig.background.r}, ${styleConfig.background.g}, ${styleConfig.background.b})`
      ctx.fillRect(0, 0, styleConfig.width, styleConfig.height)
      
      // 绘制圆角矩形
      const radius = 8
      ctx.beginPath()
      ctx.moveTo(radius, 0)
      ctx.lineTo(styleConfig.width - radius, 0)
      ctx.quadraticCurveTo(styleConfig.width, 0, styleConfig.width, radius)
      ctx.lineTo(styleConfig.width, styleConfig.height - radius)
      ctx.quadraticCurveTo(styleConfig.width, styleConfig.height, styleConfig.width - radius, styleConfig.height)
      ctx.lineTo(radius, styleConfig.height)
      ctx.quadraticCurveTo(0, styleConfig.height, 0, styleConfig.height - radius)
      ctx.lineTo(0, radius)
      ctx.quadraticCurveTo(0, 0, radius, 0)
      ctx.closePath()
      ctx.clip()
      
      // 绘制标题
      ctx.font = styleConfig.titleFont
      ctx.fillStyle = styleConfig.titleColor
      const titleMaxWidth = styleConfig.width - styleConfig.qrSize - styleConfig.layout.qrRightPadding * 3
      let titleText = title
      if (ctx.measureText(title).width > titleMaxWidth) {
        let i = 0
        while (ctx.measureText(title.slice(0, i) + '...').width < titleMaxWidth && i < title.length) {
          i++
        }
        titleText = title.slice(0, i - 1) + '...'
      }
      ctx.fillText(titleText, styleConfig.layout.titleX, styleConfig.layout.titleY)
      
      // 绘制描述文本
      ctx.font = styleConfig.descriptionFont
      ctx.fillStyle = styleConfig.descriptionColor
      const wrappedDescription = wrapText(ctx as unknown as CanvasRenderingContext2D, description, titleMaxWidth)
      wrappedDescription.forEach((line, i) => {
        if (i < 2) {
          ctx.fillText(line, styleConfig.layout.descriptionX, styleConfig.layout.descriptionY + i * styleConfig.layout.descriptionLineHeight)
        } else if (i === 2) {
          let lastLine = line
          if (wrappedDescription.length > 3) {
            if (ctx.measureText(lastLine + '...').width > titleMaxWidth) {
              let i = lastLine.length
              while (ctx.measureText(lastLine.slice(0, i) + '...').width > titleMaxWidth) {
                i--
              }
              lastLine = lastLine.slice(0, i) + '...'
            } else {
              lastLine = line + '...'
            }
          }
          ctx.fillText(lastLine, styleConfig.layout.descriptionX, styleConfig.layout.descriptionY + i * styleConfig.layout.descriptionLineHeight)
        }
      })

      // 加载二维码图片
      const qrImage = await loadImage(qrCodeDataUrl)
      const qrX = styleConfig.width - styleConfig.qrSize - styleConfig.layout.qrRightPadding
      const qrY = styleConfig.layout.qrTopPadding
      
      // 绘制二维码背景
      ctx.fillStyle = styleConfig.qrStyle.light
      ctx.fillRect(qrX - styleConfig.qrStyle.padding, qrY - styleConfig.qrStyle.padding, 
                  styleConfig.qrSize + styleConfig.qrStyle.padding * 2, 
                  styleConfig.qrSize + styleConfig.qrStyle.padding * 2)
      
      // 绘制二维码
      ctx.drawImage(qrImage, qrX, qrY, styleConfig.qrSize, styleConfig.qrSize)
      
      // 绘制提示文字
      ctx.font = '12px "Microsoft YaHei"'
      ctx.fillStyle = styleConfig.qrStyle.tipColor
      ctx.textAlign = 'center'
      ctx.fillText(styleConfig.qrStyle.tipText, 
                  qrX + styleConfig.qrSize / 2, 
                  qrY + styleConfig.qrSize + styleConfig.qrStyle.padding + 16)

      // 转换为图片
      console.log('Converting to image...')
      const finalImage = await sharp(canvas.toBuffer('image/png'))
        .png()
        .toBuffer()

      console.log('Image generation completed')
      return new NextResponse(finalImage, {
        headers: {
          'Content-Type': 'image/png',
        },
      })
    } catch (innerError) {
      console.error('Error details:', innerError)
      throw innerError
    }
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: '生成图片时出错：' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}

// 辅助函数：文本换行
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split('')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine + word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
} 