import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email skipped - no SMTP config] To: ${to}, Subject: ${subject}`);
    return { skipped: true };
  }

  const mail = getTransporter();
  return mail.sendMail({
    from: process.env.EMAIL_FROM || 'Contract Portal <noreply@contractportal.com>',
    to,
    subject,
    html,
  });
}

export function buildExpirationEmail({ contract, daysLeft }) {
  const endDate = new Date(contract.endDate).toLocaleDateString('vi-VN');
  return {
    subject: `[Nhắc nhở] Hợp đồng ${contract.contractNumber} sắp hết hạn`,
    html: `
      <h2>Nhắc nhở gia hạn hợp đồng</h2>
      <p>Hợp đồng <strong>${contract.title}</strong> (${contract.contractNumber}) 
         sẽ hết hạn sau <strong>${daysLeft} ngày</strong>.</p>
      <ul>
        <li>Khách hàng: ${contract.customer?.name || 'N/A'}</li>
        <li>Ngày hết hạn: ${endDate}</li>
        <li>Giá trị: ${contract.value?.toLocaleString('vi-VN')} VND</li>
        <li>Trạng thái: ${contract.status}</li>
      </ul>
      <p>Vui lòng liên hệ khách hàng để gia hạn hợp đồng.</p>
    `,
  };
}
