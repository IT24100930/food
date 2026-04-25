const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const path        = require('path');
const fs          = require('fs');

const generateInvoicePDF = async (payment, order, customer) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc      = new PDFDocument({ margin: 50, size: 'A4' });
      const fileName = `invoice_${payment.invoiceNumber}.pdf`;
      const filePath = path.join(__dirname, '../uploads/invoices', fileName);

      // Ensure directory exists
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ── Header ───────────────────────────────────────────
      doc.rect(0, 0, 612, 120).fill('#FF6B35');
      doc.fillColor('#FFFFFF')
        .fontSize(28).font('Helvetica-Bold')
        .text('Smart Food', 50, 35)
        .fontSize(12).font('Helvetica')
        .text('Smart Food Ordering & Management System', 50, 70)
        .text('📧 smartfood@example.com  |  📞 +94 11 234 5678', 50, 90);

      // ── Invoice Title ────────────────────────────────────
      doc.fillColor('#333333')
        .fontSize(20).font('Helvetica-Bold')
        .text('INVOICE', 400, 140, { align: 'right' });

      doc.fontSize(10).font('Helvetica')
        .text(`Invoice #: ${payment.invoiceNumber}`, 400, 168, { align: 'right' })
        .text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 400, 183, { align: 'right' })
        .text(`Order #: ${order.orderNumber}`, 400, 198, { align: 'right' });

      // ── Customer Info ────────────────────────────────────
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#FF6B35')
        .text('BILL TO:', 50, 140);
      doc.fontSize(10).font('Helvetica').fillColor('#333333')
        .text(customer.name, 50, 158)
        .text(customer.email, 50, 173)
        .text(order.orderType, 50, 188);

      // ── Divider ──────────────────────────────────────────
      doc.moveTo(50, 230).lineTo(562, 230).strokeColor('#FF6B35').lineWidth(2).stroke();

      // ── Table Header ─────────────────────────────────────
      doc.rect(50, 240, 512, 25).fill('#FFF3EE');
      doc.fillColor('#FF6B35').fontSize(10).font('Helvetica-Bold')
        .text('ITEM', 60, 248)
        .text('QTY', 320, 248, { width: 60, align: 'center' })
        .text('UNIT PRICE', 390, 248, { width: 80, align: 'right' })
        .text('SUBTOTAL', 475, 248, { width: 80, align: 'right' });

      // ── Table Rows ───────────────────────────────────────
      let y = 275;
      doc.fillColor('#333333').font('Helvetica').fontSize(10);
      order.items.forEach((item, i) => {
        if (i % 2 === 0) doc.rect(50, y - 4, 512, 22).fill('#FAFAFA');
        doc.fillColor('#333333')
          .text(item.name, 60, y, { width: 240 })
          .text(item.quantity.toString(), 320, y, { width: 60, align: 'center' })
          .text(`${payment.currency} ${item.price.toFixed(2)}`, 390, y, { width: 80, align: 'right' })
          .text(`${payment.currency} ${item.subtotal.toFixed(2)}`, 475, y, { width: 80, align: 'right' });
        y += 24;
      });

      // ── Totals ───────────────────────────────────────────
      y += 10;
      doc.moveTo(350, y).lineTo(562, y).strokeColor('#ddd').lineWidth(1).stroke();
      y += 12;
      const addRow = (label, value, bold = false) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(bold ? '#FF6B35' : '#555')
          .text(label, 350, y, { width: 120, align: 'right' })
          .text(value, 475, y, { width: 80, align: 'right' });
        y += 20;
      };
      addRow('Subtotal:', `${payment.currency} ${(payment.subtotal || 0).toFixed(2)}`);
      if (payment.taxAmount)      addRow('Tax:', `${payment.currency} ${payment.taxAmount.toFixed(2)}`);
      if (payment.discountAmount) addRow('Discount:', `-${payment.currency} ${payment.discountAmount.toFixed(2)}`);
      if (payment.tipAmount)      addRow('Tip:', `${payment.currency} ${payment.tipAmount.toFixed(2)}`);
      addRow('TOTAL:', `${payment.currency} ${payment.amountPaid.toFixed(2)}`, true);

      // ── QR Code ──────────────────────────────────────────
      const qrData = JSON.stringify({
        invoice: payment.invoiceNumber,
        order:   order.orderNumber,
        amount:  payment.amountPaid,
        currency: payment.currency,
        date:    new Date().toISOString()
      });
      const qrBuffer = await QRCode.toBuffer(qrData, { width: 100 });
      doc.image(qrBuffer, 50, y + 20, { width: 80, height: 80 });
      doc.fontSize(8).fillColor('#999')
        .text('Scan QR for verification', 50, y + 105, { width: 80, align: 'center' });

      // ── Footer ───────────────────────────────────────────
      doc.fontSize(9).fillColor('#aaa')
        .text('Thank you for dining with Smart Food! 🙏', 50, 760, { align: 'center', width: 512 })
        .text('This is a computer-generated invoice.', 50, 773, { align: 'center', width: 512 });

      doc.end();
      stream.on('finish', () => resolve({ filePath, fileName }));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };
