'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchAllOrdersForExport } from '@/features/orders/orders.export.actions'
import { computeGrandTotal } from '@/lib/utils'
import type { OrdersParams } from '@/app/(dashboard)/orders/orders.params'
import type { Order } from '@/lib/types'

interface OrdersPDFDownloadProps {
  params: OrdersParams
  shopName: string
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function fmtCurrency(amount: number): string {
  return 'PHP ' + new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

async function generateOrdersPDF(
  orders: Order[],
  params: Pick<OrdersParams, 'search' | 'status' | 'type' | 'showDeleted' | 'startDate' | 'endDate'>,
  shopName: string
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 16

  // Blue accent bar
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 2, 'F')

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(17, 24, 39)
  doc.text(shopName, margin, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text('Orders Export', margin, 25)

  // Generated timestamp (top-right)
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

  // Divider
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.3)
  doc.line(margin, 30, pageW - margin, 30)

  let y = 38

  // Active filters summary
  const activeFilters: string[] = []
  if (params.startDate || params.endDate) {
    const from = params.startDate ?? '—'
    const to = params.endDate ?? '—'
    activeFilters.push(`Date: ${from} to ${to}`)
  }
  if (params.search) activeFilters.push(`Customer: "${params.search}"`)
  if (params.status !== 'all') activeFilters.push(`Status: ${params.status}`)
  if (params.type !== 'all') activeFilters.push(`Type: ${params.type === 'pickup' ? 'Pickup' : 'Walk-in'}`)
  if (params.showDeleted) activeFilters.push('Including deleted')

  if (activeFilters.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text('FILTERS', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(17, 24, 39)
    doc.text(activeFilters.join('  ·  '), margin, y)
    y += 10
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    doc.text('All orders (no filters applied)', margin, y)
    y += 10
  }

  // Count label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('ORDERS', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(156, 163, 175)
  doc.text(
    `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`,
    pageW - margin,
    y,
    { align: 'right' }
  )
  y += 4

  // Orders table
  const tableRows = orders.map((order) => {
    const total = computeGrandTotal(order)
    return [
      fmtDate(order.created_at),
      order.customer_name + (order.deleted_at ? ' (deleted)' : ''),
      order.status,
      order.order_type === 'pickup' ? 'Pickup' : 'Walk-in',
      order.weight != null ? `${order.weight} kg` : '—',
      total != null ? fmtCurrency(total) : '—',
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['Date & Time', 'Customer', 'Status', 'Type', 'Weight', 'Total']],
    body: tableRows,
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
      0: { cellWidth: 35 },
      1: { cellWidth: 47 },
      2: { cellWidth: 30 },
      3: { cellWidth: 18 },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 2) {
        const status = data.cell.raw as string
        if (status === 'Completed') {
          data.cell.styles.textColor = [21, 128, 61]
        } else if (status === 'Cancelled') {
          data.cell.styles.textColor = [185, 28, 28]
        } else {
          data.cell.styles.textColor = [37, 99, 235]
        }
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  // Footer on each page
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
  const timestamp = new Date().toISOString().slice(0, 10)
  doc.save(`${slug}-orders-${timestamp}.pdf`)
}

export function OrdersPDFDownload({ params, shopName }: OrdersPDFDownloadProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const orders = await fetchAllOrdersForExport({
        search: params.search,
        status: params.status,
        type: params.type,
        showDeleted: params.showDeleted,
        startDate: params.startDate,
        endDate: params.endDate,
      })
      await generateOrdersPDF(orders, {
        search: params.search,
        status: params.status,
        type: params.type,
        showDeleted: params.showDeleted,
        startDate: params.startDate,
        endDate: params.endDate,
      }, shopName)
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
