// lib/pdfGenerator.ts
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Event {
  id: string
  title: string
  category: string
  country: string
  date: string
  timestamp?: number
  summary?: string
  source?: string
  url?: string
}

interface Risk {
  level: string
  area: string
  detail: string
}

interface Analysis {
  threatLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL'
  keyFindings: string[]
  emergingPatterns: string[]
  riskAssessment: Risk[]
  recommendations: string[]
  geographicHotspots: Array<{ country: string; count: number; percentage: number }>
  temporalTrends: string[]
}

interface Config {
  timeWindow: string
  countries: string[]
  categories: string[]
  includeSignals: boolean
  includeHotZones: boolean
  includeTimeline: boolean
}

export function generateBriefingPDF(
  events: Event[],
  analysis: Analysis,
  config: Config
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = margin

  // ==================== HELPERS ====================
  
  const checkPageBreak = (neededSpace: number): boolean => {
    if (yPos + neededSpace > pageHeight - margin - 10) {
      addFooter()
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  const addFooter = () => {
    const currentPage = doc.getCurrentPageInfo().pageNumber
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text(
      'UNCLASSIFIED // OPEN SOURCE INTELLIGENCE',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
    doc.text(
      `Page ${currentPage}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    )
  }

  const addSection = (title: string) => {
    checkPageBreak(12)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(title, margin, yPos)
    yPos += 2
    // Línea debajo del título
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 6
    doc.setFont('helvetica', 'normal')
  }

  const addBulletPoint = (text: string, indent: number = 5) => {
    const maxWidth = pageWidth - 2 * margin - indent
    const lines = doc.splitTextToSize(`• ${text}`, maxWidth)
    const neededSpace = lines.length * 4 + 1
    
    checkPageBreak(neededSpace)
    
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.text(lines, margin + indent, yPos)
    yPos += neededSpace
  }

  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  // ==================== HEADER ====================
  
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'bold')
  doc.text('UNCLASSIFIED // OPEN SOURCE INTELLIGENCE', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // ==================== TITLE ====================
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('INTELLIGENCE ASSESSMENT BRIEFING', pageWidth / 2, yPos, { align: 'center' })
  yPos += 6
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${timestamp}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 12

  // ==================== SUMMARY STATS ====================
  
  const statsData = [
    ['Time Period', `Last ${config.timeWindow}`],
    ['Total Events', events.length.toString()],
    ['Countries', new Set(events.map(e => e.country)).size.toString()],
    ['Categories', new Set(events.map(e => e.category)).size.toString()],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: statsData,
    theme: 'plain',
    styles: { 
      fontSize: 9, 
      cellPadding: 2,
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold',
        cellWidth: 60,
      },
      1: { 
        halign: 'left',
      }
    },
    margin: { left: margin, right: margin }
  })
  
  yPos = (doc as any).lastAutoTable.finalY + 8

  // ==================== THREAT LEVEL ====================
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`THREAT ASSESSMENT: ${analysis.threatLevel}`, margin, yPos)
  yPos += 8

  // ==================== EXECUTIVE SUMMARY ====================
  
  addSection('EXECUTIVE SUMMARY')

  // Intro párrafo
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const summaryIntro = `This intelligence assessment analyzes ${events.length} significant events collected over ${config.timeWindow}${config.countries.length > 0 ? ` with focus on ${config.countries.join(', ')}` : ''}. All data is derived from open-source intelligence (OSINT) including news media, social signals, satellite imagery, and public databases across ${new Set(events.map(e => e.country)).size} monitored countries.`
  const introLines = doc.splitTextToSize(summaryIntro, pageWidth - 2 * margin)
  doc.text(introLines, margin, yPos)
  yPos += introLines.length * 4 + 5

  // Methodology
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  const methodology = 'Methodology: Events are aggregated from multiple open sources, cross-referenced for verification, and analyzed using pattern detection algorithms. Threat assessments are generated through statistical analysis of event frequency, geographic distribution, and temporal clustering.'
  const methodLines = doc.splitTextToSize(methodology, pageWidth - 2 * margin - 5)
  doc.text(methodLines, margin + 5, yPos)
  yPos += methodLines.length * 3.5 + 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  // Key Findings
  if (analysis.keyFindings && analysis.keyFindings.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.text('Key Findings:', margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    
    analysis.keyFindings.forEach((finding) => {
      addBulletPoint(finding)
    })
    yPos += 3
  }

  // Emerging Patterns
  if (analysis.emergingPatterns && analysis.emergingPatterns.length > 0) {
    checkPageBreak(15)
    doc.setFont('helvetica', 'bold')
    doc.text('Emerging Patterns:', margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    
    analysis.emergingPatterns.forEach((pattern) => {
      addBulletPoint(pattern)
    })
    yPos += 3
  }

  // Temporal Trends
  if (analysis.temporalTrends && analysis.temporalTrends.length > 0) {
    checkPageBreak(15)
    doc.setFont('helvetica', 'bold')
    doc.text('Temporal Trends:', margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    
    analysis.temporalTrends.forEach((trend) => {
      addBulletPoint(trend)
    })
    yPos += 3
  }

  // Risk Assessment
  if (analysis.riskAssessment && analysis.riskAssessment.length > 0) {
    checkPageBreak(15)
    doc.setFont('helvetica', 'bold')
    doc.text('Risk Assessment:', margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    
    analysis.riskAssessment.forEach((risk) => {
      const riskText = `[${risk.level}] ${risk.area}: ${risk.detail}`
      addBulletPoint(riskText)
    })
    yPos += 3
  }

  // Recommendations
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    checkPageBreak(15)
    doc.setFont('helvetica', 'bold')
    doc.text('Recommendations:', margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    
    analysis.recommendations.forEach((rec) => {
      addBulletPoint(rec)
    })
    yPos += 3
  }

  // ==================== NUEVA PÁGINA: EVENTS ====================
  
  addFooter()
  doc.addPage()
  yPos = margin

  addSection('DETAILED EVENT ANALYSIS')

  // Agrupar por categoría
  const eventsByCategory: Record<string, Event[]> = {}
  events.forEach(e => {
    if (!eventsByCategory[e.category]) eventsByCategory[e.category] = []
    eventsByCategory[e.category].push(e)
  })

  Object.entries(eventsByCategory)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([category, catEvents]) => {
      checkPageBreak(15)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${category.toUpperCase()} (${catEvents.length} events)`, margin, yPos)
      yPos += 5
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      
      catEvents.slice(0, 15).forEach((event, idx) => {
        checkPageBreak(12)
        
        // Número del evento
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}.`, margin, yPos)
        
        // Título
        const titleLines = doc.splitTextToSize(event.title, pageWidth - 2 * margin - 8)
        doc.text(titleLines, margin + 5, yPos)
        yPos += titleLines.length * 3.5 + 1
        
        // Metadata
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.setFontSize(7)
        let metadata = `${event.country} | ${new Date(event.date).toLocaleDateString()}`
        if (event.source) {
          metadata += ` | Source: ${event.source}`
        }
        doc.text(metadata, margin + 5, yPos)
        yPos += 3
        
        // URL
        if (event.url) {
          doc.setTextColor(0, 0, 200)
          doc.textWithLink('View source', margin + 5, yPos, { url: event.url })
          doc.setTextColor(0, 0, 0)
          yPos += 3
        }
        
        // Summary
        if (event.summary) {
          doc.setFontSize(8)
          doc.setTextColor(60, 60, 60)
          const summaryText = event.summary.length > 200 
            ? event.summary.substring(0, 200) + '...' 
            : event.summary
          const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 2 * margin - 5)
          doc.text(summaryLines, margin + 5, yPos)
          yPos += summaryLines.length * 3 + 1
        }
        
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(8)
        yPos += 2
      })
      
      if (catEvents.length > 15) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(`... and ${catEvents.length - 15} additional ${category} events`, margin + 5, yPos)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        yPos += 4
      }
      
      yPos += 4
    })

  // ==================== NUEVA PÁGINA: GEOGRAPHIC ====================
  
  addFooter()
  doc.addPage()
  yPos = margin

  addSection('GEOGRAPHIC DISTRIBUTION')

  // Contar por país
  const countryCounts: Record<string, number> = {}
  events.forEach(e => {
    if (e.country && e.country !== 'Unknown') {
      countryCounts[e.country] = (countryCounts[e.country] || 0) + 1
    }
  })

  const sortedCountries = Object.entries(countryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)

  const geoData = sortedCountries.map(([country, count]) => [
    country,
    count.toString(),
    `${((count / events.length) * 100).toFixed(1)}%`
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Country', 'Events', '%']],
    body: geoData,
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'center', cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { left: margin, right: margin }
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // ==================== SOURCES SECTION ====================
  
  checkPageBreak(20)
  addSection('DATA SOURCES')

  doc.setFontSize(8)
  doc.text('This report aggregates data from the following source categories:', margin, yPos)
  yPos += 5

  const sources = [
    'International news agencies and media outlets',
    'Government press releases and official statements',
    'Social media signals and public communications',
    'Satellite imagery analysis (commercial providers)',
    'Public databases and statistical repositories',
    'NGO reports and human rights organizations'
  ]

  sources.forEach(source => {
    addBulletPoint(source, 3)
  })

  yPos += 5

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  const sourceNote = 'Note: All sources used in this assessment are publicly available and unclassified. Individual event sources are cited where available. For detailed source attribution, refer to the event listings above.'
  const noteLines = doc.splitTextToSize(sourceNote, pageWidth - 2 * margin)
  doc.text(noteLines, margin, yPos)
  doc.setFont('helvetica', 'normal')

  // ==================== FINAL FOOTER ====================
  
  addFooter()
  
  // Add disclaimer on last page
  yPos = pageHeight - 25
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  const disclaimer = 'DISCLAIMER: This assessment is based exclusively on publicly available information. Analysis conclusions are algorithmic and should be independently verified before operational use. Distribution: Approved for public release.'
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin)
  doc.text(disclaimerLines, margin, yPos)

  return doc
}