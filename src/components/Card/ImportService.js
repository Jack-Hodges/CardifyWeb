import Papa from 'papaparse';

export const parseImportFile = async (file) => {
  const fileType = file.name.split('.').pop().toLowerCase();
  
  try {
    switch (fileType) {
      case 'json':
        return await parseJSON(file);
      case 'csv':
        return await parseCSV(file);
      case 'txt':
        return await parseTXT(file);
      case 'xlsx':
        return await parseXLSX(file);
      default:
        throw new Error('Unsupported file format');
    }
  } catch (error) {
    throw new Error(`Error parsing file: ${error.message}`);
  }
};

const parseJSON = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) {
          throw new Error('JSON must contain an array of cards');
        }
        const cards = data.map(card => ({
          question: card.question || card.q || card.front || '',
          answer: card.answer || card.a || card.back || '',
          frontMode: 0,
          backMode: 0
        }));
        validateCards(cards);
        resolve(cards);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

const parseCSV = async (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const cards = results.data
            .filter(row => row.length >= 2 && row[0] && row[1])
            .map(row => ({
              question: row[0].trim(),
              answer: row[1].trim(),
              frontMode: 0,
              backMode: 0
            }));
          validateCards(cards);
          resolve(cards);
        } catch (error) {
          reject(new Error('Invalid CSV format'));
        }
      },
      error: (error) => reject(new Error('Error parsing CSV')),
      header: false
    });
  });
};

export const parseCSVString = async (text) => {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      complete: (results) => {
        try {
          const cards = results.data
            .filter(row => row.length >= 2 && row[0] && row[1])
            .map(row => ({
              question: row[0].trim(),
              answer: row[1].trim(),
              frontMode: 0,
              backMode: 0
            }));
          validateCards(cards);
          resolve(cards);
        } catch (error) {
          reject(new Error('Invalid CSV format'));
        }
      },
      error: () => reject(new Error('Error parsing CSV')),
      header: false
    });
  });
};

const parseTXT = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const cards = [];
        
        for (let i = 0; i < lines.length; i += 2) {
          if (i + 1 < lines.length) {
            cards.push({
              question: lines[i].trim(),
              answer: lines[i + 1].trim(),
              frontMode: 0,
              backMode: 0
            });
          }
        }
        
        validateCards(cards);
        resolve(cards);
      } catch (error) {
        reject(new Error('Invalid TXT format'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

const parseXLSX = async (file) => {
  const XLSX = await import('xlsx');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        const cards = jsonData
          .filter(row => row.length >= 2 && row[0] && row[1])
          .map(row => ({
            question: String(row[0]).trim(),
            answer: String(row[1]).trim(),
            frontMode: 0,
            backMode: 0
          }));
        
        validateCards(cards);
        resolve(cards);
      } catch (error) {
        reject(new Error('Invalid XLSX format'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
};

export const parseGeneratedFlashcards = (text) => {
  try {
    const lines = text.split('\n').filter(line => line.trim());
    const cards = lines.map(line => {
      const [question, answer] = line.split('|').map(part => part.trim());
      return {
        question,
        answer,
        frontMode: 0,
        backMode: 0
      };
    });
    
    validateCards(cards);
    return cards;
  } catch (error) {
    throw new Error(`Error parsing generated flashcards: ${error.message}`);
  }
};

const validateCards = (cards) => {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error('No valid cards found in file');
  }
  
  cards.forEach((card, index) => {
    if (!card.question || !card.answer) {
      throw new Error(`Invalid card at index ${index}: missing question or answer`);
    }
  });
}; 