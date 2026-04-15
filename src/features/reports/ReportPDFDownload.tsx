'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReportParams } from '@/features/reports/reports.params'
import type { ReportAnalytics } from '@/features/reports/reports.types'

interface ReportPDFDownloadProps {
  analytics: ReportAnalytics
  params: ReportParams
  shopName: string
}

function formatDateLabel(date: string): string {
  const [year, month, day] = date.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrencyPDF(amount: number): string {
  return 'PHP ' + new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

async function generatePDF(analytics: ReportAnalytics, params: ReportParams, shopName: string) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const { summary, dailyTrend, statusDistribution, orderTypeComparison } = analytics
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 16

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(17, 24, 39)
  doc.text(shopName, margin, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text('Reports Export', margin, 25)

  const generatedAt = new Date().toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.text(`Generated: ${generatedAt}`, pageW - margin, 18, { align: 'right' })

  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.3)
  doc.line(margin, 30, pageW - margin, 30)

  // ── Filter summary ────────────────────────────────────────────────────────
  let y = 38

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('REPORT PERIOD', margin, y)

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(17, 24, 39)
  doc.text(`${formatDateLabel(params.startDate)} – ${formatDateLabel(params.endDate)}`, margin, y)

  const activeFilters: string[] = []
  if (params.status !== 'all') activeFilters.push(`Status: ${params.status}`)
  if (params.type !== 'all') activeFilters.push(`Type: ${params.type === 'pickup' ? 'Pickup' : 'Walk-in'}`)

  if (activeFilters.length > 0) {
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text(`Filters: ${activeFilters.join(' · ')}`, margin, y)
  }

  y += 10

  // ── Summary cards (6) ─────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('SUMMARY', margin, y)

  y += 4

  const cards = [
    { label: 'Revenue', value: formatCurrencyPDF(summary.totalRevenue) },
    { label: 'Orders', value: String(summary.totalOrders) },
    { label: 'Completed', value: String(summary.completedCount) },
    { label: 'Weight', value: `${summary.totalWeight.toFixed(1)} kg` },
    {
      label: 'Avg Order Value',
      value: summary.completedCount > 0 ? formatCurrencyPDF(summary.avgOrderValue) : '—',
      small: true,
    },
    { label: 'Completion Rate', value: `${summary.completionRate.toFixed(1)}%` },
  ]

  const cardW = (pageW - margin * 2 - 5 * 3) / 6
  const cardH = 18
  const cardRadius = 2

  cards.forEach((card, i) => {
    const cx = margin + i * (cardW + 3)

    doc.setFillColor(249, 250, 251)
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.2)
    doc.roundedRect(cx, y, cardW, cardH, cardRadius, cardRadius, 'FD')

    doc.setFillColor(37, 99, 235)
    doc.roundedRect(cx, y, cardW, 1.5, cardRadius, cardRadius, 'F')
    doc.rect(cx, y + 0.5, cardW, 1, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(107, 114, 128)
    doc.text(card.label.toUpperCase(), cx + 3, y + 6.5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(card.small ? 6.5 : 9)
    doc.setTextColor(17, 24, 39)
    doc.text(card.value, cx + 3, y + 13.5)
  })

  y += cardH + 10

  // ── Daily Breakdown ───────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('DAILY BREAKDOWN', margin, y)

  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Orders', 'Revenue']],
    body: dailyTrend.map((row) => [row.date, row.orders, formatCurrencyPDF(row.revenue)]),
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: [55, 65, 81],
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [249, 250, 251],
      textColor: [107, 114, 128],
      fontStyle: 'bold',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 24, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' },
    },
  })

  // ── Status Breakdown ──────────────────────────────────────────────────────
  const afterDailyY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('STATUS BREAKDOWN', margin, afterDailyY)

  autoTable(doc, {
    startY: afterDailyY + 4,
    head: [['Status', 'Orders']],
    body: statusDistribution.map((row) => [row.status, row.count]),
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: [55, 65, 81],
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [249, 250, 251],
      textColor: [107, 114, 128],
      fontStyle: 'bold',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 24, halign: 'right' },
    },
  })

  // ── Order Type ────────────────────────────────────────────────────────────
  const afterStatusY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('ORDER TYPE', margin, afterStatusY)

  autoTable(doc, {
    startY: afterStatusY + 4,
    head: [['Type', 'Orders', 'Revenue']],
    body: orderTypeComparison.map((row) => [row.type, row.count, formatCurrencyPDF(row.revenue)]),
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: [55, 65, 81],
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [249, 250, 251],
      textColor: [107, 114, 128],
      fontStyle: 'bold',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 24, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' },
    },
  })

  // ── Footer on each page ───────────────────────────────────────────────────
  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    const footerY = doc.internal.pageSize.getHeight() - 8
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.2)
    doc.line(margin, footerY - 3, pageW - margin, footerY - 3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(156, 163, 175)
    doc.text(shopName, margin, footerY)
    doc.text(`Page ${p} of ${pageCount}`, pageW - margin, footerY, { align: 'right' })
  }

  const slug = shopName.toLowerCase().replace(/\s+/g, '-')
  doc.save(`${slug}-report-${params.startDate}-to-${params.endDate}.pdf`)
}

export function ReportPDFDownload({ analytics, params, shopName }: ReportPDFDownloadProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      await generatePDF(analytics, params, shopName)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="h-8 px-3 text-xs gap-1.5 whitespace-nowrap"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {loading ? 'Generating...' : 'Download PDF'}
    </Button>
  )
}
