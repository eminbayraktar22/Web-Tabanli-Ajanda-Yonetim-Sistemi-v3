const { User, Task, Event } = require('../models');

// Ortak AI İstek Gönderici (BYOK)
const sendAiRequest = async (user, systemPrompt, userMessage) => {
  if (!user.ai_api_key) {
    throw new Error('MISSING_API_KEY');
  }

  const provider = user.ai_provider || 'openai';
  const model = user.ai_model || 'gpt-3.5-turbo';
  const apiKey = user.ai_api_key;

  try {
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7
        })
      });
      if (!res.ok) throw new Error(`OpenAI Hatası: ${res.statusText}`);
      const data = await res.json();
      return data.choices[0].message.content;
    } 
    
    else if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 
          'x-api-key': apiKey, 
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }]
        })
      });
      if (!res.ok) throw new Error(`Anthropic Hatası: ${res.statusText}`);
      const data = await res.json();
      return data.content[0].text;
    }

    else if (provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userMessage }] }
          ]
        })
      });
      if (!res.ok) throw new Error(`Gemini Hatası: ${res.statusText}`);
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Geçersiz AI Sağlayıcısı');
  } catch (error) {
    console.error('AI Request Error:', error.message);
    throw new Error('Yapay Zeka servisi ile iletişim kurulamadı. Lütfen API Anahtarınızı ve Model adını kontrol edin.');
  }
};

exports.breakdownTask = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Görev başlığı zorunludur.' });

    const user = await User.findByPk(req.user.id);
    const systemPrompt = `Sadece JSON formatında bir dizi (array) string döndüren bir asistansın. Başka hiçbir metin ekleme. Örnek: ["Alt görev 1", "Alt görev 2"]`;
    const userMessage = `Şu görev için mantıksal alt görevler oluştur:\nBaşlık: ${title}\nAçıklama: ${description || 'Yok'}`;

    const content = await sendAiRequest(user, systemPrompt, userMessage);

    let subtasks = [];
    try {
      const jsonStr = content.match(/\[.*\]/s)?.[0] || content; // Sadece array kısmını al
      subtasks = JSON.parse(jsonStr);
    } catch (parseError) {
      subtasks = content.split('\n').filter(line => line.trim() !== '').map(line => line.replace(/^-\s*/, '').trim());
    }

    res.json({ subtasks });
  } catch (error) {
    if (error.message === 'MISSING_API_KEY') return res.status(403).json({ error: 'Lütfen Profil Ayarlarından kendi API Anahtarınızı girin.' });
    res.status(500).json({ error: error.message });
  }
};

exports.summarizeNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ error: 'Özetlenecek notlar zorunludur.' });

    const user = await User.findByPk(req.user.id);
    const systemPrompt = `Sen profesyonel bir asistansın. Metni kısa ve öz bir şekilde özetle. Kararları ve aksiyon maddelerini vurgula.`;
    const userMessage = `Notlar:\n${notes}`;

    const summary = await sendAiRequest(user, systemPrompt, userMessage);
    res.json({ summary });
  } catch (error) {
    if (error.message === 'MISSING_API_KEY') return res.status(403).json({ error: 'Lütfen Profil Ayarlarından kendi API Anahtarınızı girin.' });
    res.status(500).json({ error: error.message });
  }
};

exports.chatWithCopilot = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Mesaj zorunludur.' });

    const user = await User.findByPk(req.user.id);
    
    // RAG: Context toplama (Bekleyen görevler ve yaklaşan etkinlikler)
    const pendingTasks = await Task.findAll({ where: { workspace_id: req.workspace_id, status: 'todo' }, limit: 10 });
    const upcomingEvents = await Event.findAll({ where: { workspace_id: req.workspace_id }, limit: 5, order: [['start_datetime', 'ASC']] });

    const contextTasks = pendingTasks.map(t => `- ${t.title} (Öncelik: ${t.priority})`).join('\n');
    const contextEvents = upcomingEvents.map(e => `- ${e.title} (${new Date(e.start_datetime).toLocaleString()})`).join('\n');

    const systemPrompt = `Sen ${user.name} kullanıcısının kişisel yapay zeka asistanısın (Copilot).
Kullanıcının mevcut durumu:
Bekleyen Görevleri:
${contextTasks || 'Yok'}

Yaklaşan Etkinlikleri:
${contextEvents || 'Yok'}

Bu bilgilere dayanarak kullanıcının sorularına yardımcı ol. Kısa, samimi ve profesyonel cevaplar ver.`;

    const reply = await sendAiRequest(user, systemPrompt, message);
    res.json({ reply });
  } catch (error) {
    if (error.message === 'MISSING_API_KEY') return res.status(403).json({ error: 'Lütfen Profil Ayarlarından kendi API Anahtarınızı girin.' });
    res.status(500).json({ error: error.message });
  }
};

exports.parseTask = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Lütfen bir cümle girin.' });

    const systemPrompt = `
      Sen akıllı bir görev ayrıştırıcısısın (Sys Pilot).
      Kullanıcının yazdığı doğal dildeki cümleyi analiz et ve JSON formatında geri dön.
      Şu alanları çıkar:
      - title (Görev başlığı)
      - tags (Dizge (array) olarak etiketler, örneğin "iş, acil". Yoksa boş array)
      - priority (Sadece "low", "medium" veya "high". Anlaşılamazsa "medium")
      - due_date (YYYY-MM-DD formatında bir tarih. Cümlede tarih geçmiyorsa null. "Yarın" denirse ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}, "Bugün" denirse ${new Date().toISOString().split('T')[0]})
      SADECE GEÇERLİ BİR JSON DÖNDÜR. Başka metin veya açıklama yazma.
    `;

    const aiResponse = await sendAiRequest(req.user, systemPrompt, text);
    
    // JSON parse etmeyi dene, baştaki sondaki gereksiz markdown işaretlerini temizle
    let cleanJson = aiResponse.trim();
    if (cleanJson.startsWith('\`\`\`json')) cleanJson = cleanJson.replace('\`\`\`json', '').replace('\`\`\`', '');
    if (cleanJson.startsWith('\`\`\`')) cleanJson = cleanJson.replace(/\`\`\`/g, '');
    
    const parsedData = JSON.parse(cleanJson);
    res.json({ data: parsedData });
  } catch (error) {
    console.error('NLP Parse Error:', error);
    res.status(500).json({ error: 'Cümle çözümlenemedi. ' + error.message });
  }
};
