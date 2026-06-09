/**
 * Telegram Bot API Notification Service
 * Sends real-time queue updates to patient chat IDs using the Telegram Bot API.
 */

export const getTelegramBotToken = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dstoma_telegram_token');
    if (saved) return saved.trim();
  }
  return ((import.meta as any).env?.VITE_TELEGRAM_BOT_TOKEN || '8763628372:AAHbaTWP-J7A4ZGAijFoTdXwROEZohOnvqc').trim();
};

export const setTelegramBotToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dstoma_telegram_token', (token || '').trim());
  }
};

/**
 * Sends a raw message to a Telegram Chat ID
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = getTelegramBotToken();
  if (!token) {
    console.warn("Telegram Bot Token is not configured. Please supply VITE_TELEGRAM_BOT_TOKEN or set it in SuperAdmin panel.");
    return false;
  }

  // Ensure chatId is clean and numeric
  const cleanChatId = chatId.trim();
  if (!cleanChatId) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Telegram API Error:", errorData);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Network error sending Telegram notification:", error);
    return false;
  }
}

/**
 * Send booking ticket confirmation
 */
export async function sendQueueCreatedNotification(
  chatId: string,
  ticketNumber: number,
  patientName: string,
  clinicName: string,
  doctorName: string,
  serviceName: string
): Promise<boolean> {
  const text = `<b>🏥 DStoma Navbat Tizimi</b>\n\n` +
    `🤖 Hurmatli <b>${patientName}</b>, siz muvaffaqiyatli navbat oldingiz!\n\n` +
    `📍 <b>Filial:</b> ${clinicName}\n` +
    `🎟 <b>Sizning chiptangiz:</b> <code style="font-size:16px;">#${ticketNumber}</code>\n` +
    `👨‍⚕ <b>Shifokor:</b> ${doctorName}\n` +
    `💼 <b>Xizmat turi:</b> ${serviceName}\n\n` +
    `<i>Sizga navbatingiz yaqinlashganda qo'shimcha xabar jo'natiladi. Salomat bo'ling!</i>`;

  return sendTelegramMessage(chatId, text);
}

/**
 * Send status change notification (e.g., called or completed)
 */
export async function sendQueueStatusNotification(
  chatId: string,
  ticketNumber: number,
  patientName: string,
  status: 'pending' | 'calling' | 'in_progress' | 'completed' | 'cancelled',
  doctorName: string
): Promise<boolean> {
  let statusText = '';
  let emoji = '🔔';
  
  if (status === 'calling') {
    statusText = `<b>Sizning navbatingiz yetib keldi!</b>\n👨‍⚕ Shifokor <b>${doctorName}</b> sizni qabulga chorlamoqda. Iltimos, xonaga kiring.`;
    emoji = '⚡';
  } else if (status === 'in_progress') {
    statusText = `Sizning qabul jarayoningiz <b>boshlandi</b>. Shifokor ko'rigi amalda.`;
    emoji = '🩺';
  } else if (status === 'completed') {
    statusText = `Sizning qabulingiz <b>muvaffaqiyatli yakunlandi</b>.\nSog'-salomat bo'ling! Tizimimizda shifokorga o'z bahoingizni qoldirishni unutmang.`;
    emoji = '✅';
  } else if (status === 'cancelled') {
    statusText = `Sizning chiptangiz <b>bekor qilindi</b>. Savollar yuzasidan klinika bilan bog'laning.`;
    emoji = '❌';
  } else {
    return false;
  }

  const text = `${emoji} <b>DStoma E'lon</b>\n\n` +
    `Hurmatli <b>${patientName}</b>!\n` +
    `🎟 Chipta: <code style="font-size:14px;">#${ticketNumber}</code>\n\n` +
    `${statusText}`;

  return sendTelegramMessage(chatId, text);
}
