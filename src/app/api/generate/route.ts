import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { createCanvas, registerFont } from 'canvas'
import { loadImage } from 'canvas'
import * as cheerio from 'cheerio'
import path from 'path'

// 注册字体
registerFont(path.join(process.cwd(), 'public/fonts/NotoSansCJKsc-Regular.otf'), {
  family: 'Noto Sans CJK SC'
})

// 定义样式配置
const STYLE_CONFIGS = {
  white: {
    width: 500,
    height: 120,
    background: { r: 255, g: 255, b: 255 },
    titleColor: '#1F2937',
    descriptionColor: '#4B5563',
    titleFont: '18px "Noto Sans CJK SC"',
    descriptionFont: '14px "Noto Sans CJK SC"',
    qrSize: 82,
    border: { r: 229, g: 231, b: 235, alpha: 1 },
    qrStyle: {
      dark: '#1F2937',
      light: '#FFFFFF',
      border: { r: 255, g: 255, b: 255 },
      padding: 2,
      tipText: '长按或扫码访问',
      tipColor: '#6B7280',
      tipFont: '12px "Noto Sans CJK SC"',
    },
    layout: {
      titleX: 20,
      titleY: 35,
      descriptionX: 20,
      descriptionY: 65,
      descriptionLineHeight: 20,
      qrRightPadding: 20,
      qrTopPadding: 12,
      tipSpacing: 2,
    }
  },
  wechat: {
    width: 500,
    height: 120,
    background: { r: 7, g: 193, b: 96 },
    titleColor: '#FFFFFF',
    descriptionColor: 'rgba(255, 255, 255, 0.9)',
    titleFont: '18px "Noto Sans CJK SC"',
    descriptionFont: '14px "Noto Sans CJK SC"',
    qrSize: 82,
    border: { r: 7, g: 193, b: 96, alpha: 0 },
    qrStyle: {
      dark: '#FFFFFF',
      light: '#07C160',
      border: { r: 7, g: 193, b: 96 },
      padding: 2,
      tipText: '长按或扫码访问',
      tipColor: 'rgba(255, 255, 255, 0.9)',
      tipFont: '12px "Noto Sans CJK SC"',
    },
    layout: {
      titleX: 20,
      titleY: 35,
      descriptionX: 20,
      descriptionY: 65,
      descriptionLineHeight: 20,
      qrRightPadding: 20,
      qrTopPadding: 12,
      tipSpacing: 2,
    }
  },
}

// 获取网页信息的函数
async function getPageInfo(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // 允许 HTTP 请求
      next: {
        revalidate: 0
      }
    });
    
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return {
        title: '未能访问的网页',
        description: '该网页暂时无法访问，您可以点击上方的"自定义标题和描述"来编辑显示内容'
      };
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      console.error('非 HTML 内容:', contentType);
      return {
        title: '不支持的网页类型',
        description: '该链接不是一个网页，您可以点击上方的"自定义标题和描述"来编辑显示内容'
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    let title = $('title').text().trim();
    let description = $('meta[name="description"]').attr('content')?.trim() || 
                     $('meta[property="og:description"]').attr('content')?.trim();

    // 如果标题为空，尝试其他常见标题标签
    if (!title) {
      title = $('meta[property="og:title"]').attr('content')?.trim() ||
              $('h1').first().text().trim() ||
              '未能获取网页标题';
    }

    // 如果描述为空，尝试获取第一段文字
    if (!description) {
      description = $('p').first().text().trim() || '未能获取网页描述';
    }

    // 限制长度
    title = title.slice(0, 40);
    description = description.slice(0, 150);
    
    return { title, description };
  } catch (error) {
    console.error('Error fetching page info:', error);
    return {
      title: '未能访问的网页',
      description: '该网页暂时无法访问，您可以点击上方的"自定义标题和描述"来编辑显示内容'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { style = 'modern', customTitle, customDescription } = body
    let { url } = body
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
      // 如果没有协议，添加 https://
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      const urlObj = new URL(url);
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
        { error: '请输入正确的网页链接格式，例如：example.com' },
        { status: 400 }
      )
    }

    // 获取样式配置
    const styleConfig = STYLE_CONFIGS[style as keyof typeof STYLE_CONFIGS]

    // 获取网页信息
    let title = customTitle;
    let description = customDescription;
    
    if (!customTitle || !customDescription) {
      const pageInfo = await getPageInfo(url);
      if (!customTitle) title = pageInfo.title;
      if (!customDescription) description = pageInfo.description;
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
    // 为边框预留空间
    const canvasWidth = style === 'white' ? styleConfig.width * scale + 2 : styleConfig.width * scale
    const canvasHeight = style === 'white' ? styleConfig.height * scale + 2 : styleConfig.height * scale
    const canvas = createCanvas(canvasWidth, canvasHeight)
    const ctx = canvas.getContext('2d')
    
    // 缩放画布以适应更高分辨率
    ctx.scale(scale, scale)
    
    // 启用字体平滑
    ctx.imageSmoothingEnabled = true
    
    // 如果是白色风格，先平移画布以预留边框空间
    if (style === 'white') {
      ctx.translate(1/scale, 1/scale)
    }
    
    // 绘制背景和边框
    const radius = 6 // 更自然的圆角大小
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

    // 如果是白色风格，绘制边框
    if (style === 'white') {
      ctx.save()
      ctx.strokeStyle = `rgb(${styleConfig.border.r}, ${styleConfig.border.g}, ${styleConfig.border.b})`
      ctx.lineWidth = 1/scale
      ctx.stroke()
      ctx.restore()
    }

    // 填充背景色
    ctx.fillStyle = `rgb(${styleConfig.background.r}, ${styleConfig.background.g}, ${styleConfig.background.b})`
    ctx.fill()
    
    // 创建裁剪路径
    ctx.save()
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
    
    // 绘制二维码背景和边框
    ctx.save()
    ctx.fillStyle = styleConfig.qrStyle.light
    const qrBgSize = styleConfig.qrSize + styleConfig.qrStyle.padding * 2
    const qrBgX = qrX - styleConfig.qrStyle.padding
    const qrBgY = qrY - styleConfig.qrStyle.padding
    // 绘制二维码背景圆角矩形
    const qrBgRadius = 4
    ctx.beginPath()
    ctx.moveTo(qrBgX + qrBgRadius, qrBgY)
    ctx.lineTo(qrBgX + qrBgSize - qrBgRadius, qrBgY)
    ctx.quadraticCurveTo(qrBgX + qrBgSize, qrBgY, qrBgX + qrBgSize, qrBgY + qrBgRadius)
    ctx.lineTo(qrBgX + qrBgSize, qrBgY + qrBgSize - qrBgRadius)
    ctx.quadraticCurveTo(qrBgX + qrBgSize, qrBgY + qrBgSize, qrBgX + qrBgSize - qrBgRadius, qrBgY + qrBgSize)
    ctx.lineTo(qrBgX + qrBgRadius, qrBgY + qrBgSize)
    ctx.quadraticCurveTo(qrBgX, qrBgY + qrBgSize, qrBgX, qrBgY + qrBgSize - qrBgRadius)
    ctx.lineTo(qrBgX, qrBgY + qrBgRadius)
    ctx.quadraticCurveTo(qrBgX, qrBgY, qrBgX + qrBgRadius, qrBgY)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // 绘制二维码
    ctx.drawImage(qrImage, qrX, qrY, styleConfig.qrSize, styleConfig.qrSize)
    
    // 绘制提示文字
    ctx.font = styleConfig.qrStyle.tipFont
    ctx.fillStyle = styleConfig.qrStyle.tipColor
    ctx.textAlign = 'center'
    ctx.fillText(styleConfig.qrStyle.tipText, 
                qrX + styleConfig.qrSize / 2, 
                qrY + styleConfig.qrSize + styleConfig.qrStyle.padding + 14)

    // 恢复裁剪路径
    ctx.restore()

    // 转换为图片
    console.log('Converting to image...')
    const finalImage = await sharp(canvas.toBuffer('image/png'))
      .png()
      .toBuffer()

    console.log('Image generation completed')
    return new NextResponse(finalImage, {
      headers: {
        'Content-Type': 'image/png',
        'X-Page-Title': Buffer.from(title).toString('base64'),
        'X-Page-Description': Buffer.from(description).toString('base64'),
      },
    })
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