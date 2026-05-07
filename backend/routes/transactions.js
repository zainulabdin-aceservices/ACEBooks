const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get transactions (Admin sees all, Users see their own)
router.get('/', verifyToken, async (req, res) => {
  const { role, id } = req.user;

  try {
    let queryStr = `
      SELECT t.id, t.created_by, t.customer_id, t.amount, t.description, t.date, t.receipt_image, t.type, t.hotel_items, t.created_at,
             u.name as user_name, c.name as customer_name 
      FROM transactions t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN customers c ON t.customer_id = c.id
    `;
    const params = [];

    if (role !== 'Admin') {
      queryStr += ` WHERE t.created_by = $1`;
      params.push(id);
    }

    queryStr += ` ORDER BY t.date DESC, t.id DESC`;

    const result = await db.query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

// Create new transaction
router.post('/', verifyToken, async (req, res) => {
  const { customerId, amount, description, date, receiptImage, type, hotelItems } = req.body;
  const userId = req.user.id;

  if (!amount || !date || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hotelItemsJson = hotelItems ? JSON.stringify(hotelItems) : null;

    const result = await db.query(
      `INSERT INTO transactions 
        (created_by, customer_id, amount, description, date, receipt_image, type, hotel_items) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [userId, customerId, amount, description || '', date, receiptImage || null, type, hotelItemsJson]
    );

    res.status(201).json({ message: 'Transaction created', transaction: result.rows[0] });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Error creating transaction' });
  }
});
// =============================================
// PARSE RECEIPT - OCR using OCR.space API
// =============================================
const axios = require('axios');
const FormData = require('form-data');

router.post('/parse-receipt', verifyToken, async (req, res) => {
  const { image } = req.body; // base64 string

  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    console.log('Starting OCR.space processing...');

    // OCR.space requires the base64 string to start with "data:image/jpeg;base64,"
    let base64Image = image;
    if (!base64Image.startsWith('data:')) {
      base64Image = `data:image/jpeg;base64,${image}`;
    }

    // OCR.space Engine 2 is much better for receipts
    const formData = new FormData();
    formData.append('base64Image', base64Image);
    formData.append('apikey', 'K81321525788957');
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('OCREngine', '2'); 
    formData.append('isTable', 'true'); // Helps with column data

    const ocrResponse = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: { ...formData.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    if (ocrResponse.data.IsErroredOnProcessing) {
      console.error('OCR.space Processing Error:', ocrResponse.data.ErrorMessage);
      return res.status(500).json({ error: 'OCR processing failed', details: ocrResponse.data.ErrorMessage });
    }

    const parsedResult = ocrResponse.data.ParsedResults[0];
    const fullText = parsedResult.ParsedText;
    console.log('OCR Raw Text:', fullText);

    const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    // --- Helper to fix common OCR number misreads (l -> 1, O -> 0, etc) ---
    const fixOCRNumbers = (str) => {
      return str
        .replace(/[lI|]/g, '1')
        .replace(/[OoD]/g, '0')
        .replace(/[sS]/g, '5')
        .replace(/[bB]/g, '8')
        .replace(/[G]/g, '6')
        .replace(/[zZ]/g, '2');
    };

    // --- Extract Store Name ---
    let storeName = 'Unknown Store';
    for (const line of lines) {
      if (line.length > 3 && /[a-zA-Z]/.test(line) && !line.toLowerCase().includes('invoice') && !line.toLowerCase().includes('receipt')) {
        storeName = line;
        break;
      }
    }

    // --- Extract Total Amount ---
    let totalAmount = null;
    let rsAmounts = [];

    // Pattern to find amounts specifically associated with Rs or RS
    // Handles formats like Rs 1,037.00, Rs1037, R$1037, etc.
    const rsPattern = /(?:Rs|R\$|RS)\s*([\dlI|OoDsSbBGzZ,]+\.?[\dlI|OoDsSbBGzZ]*)/gi;
    
    let match;
    while ((match = rsPattern.exec(fullText)) !== null) {
      const rawNum = match[1];
      const fixedNum = fixOCRNumbers(rawNum).replace(/,/g, '');
      const val = parseFloat(fixedNum);
      if (!isNaN(val) && val < 1000000) {
        rsAmounts.push(val);
      }
    }

    if (rsAmounts.length > 0) {
      // The highest "Rs" amount is almost always the total
      totalAmount = Math.max(...rsAmounts);
    }

    // Fallback: If no "Rs" found, use the keyword search
    if (totalAmount === null) {
      const totalKeywords = ['invoice', 'total', 'payable', 'value', 'grand'];
      for (let i = 0; i < lines.length; i++) {
        const lower = lines[i].toLowerCase();
        if (totalKeywords.some(k => lower.includes(k))) {
          let lineToSearch = lines[i];
          if (!lineToSearch.match(/\d/) && i + 1 < lines.length) lineToSearch = lines[i+1];
          
          const rawNumbers = lineToSearch.match(/[\dlI|OoDsSbBGzZ,]+\.?[\dlI|OoDsSbBGzZ]*/g);
          if (rawNumbers) {
            const fixedNum = fixOCRNumbers(rawNumbers[rawNumbers.length - 1]).replace(/,/g, '');
            const val = parseFloat(fixedNum);
            if (!isNaN(val) && val > 0) {
              totalAmount = val;
              break;
            }
          }
        }
      }
    }

    res.json({
      storeName,
      totalAmount,
      rawText: fullText,
    });

  } catch (error) {
    console.error('OCR Error:', error.message);
    res.status(500).json({ error: 'Failed to process receipt image' });
  }
});

module.exports = router;
