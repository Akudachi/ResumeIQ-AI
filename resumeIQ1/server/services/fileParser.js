const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

class FileParser {
  static async parsePDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error('Failed to parse PDF file. The file may be corrupted or invalid.');
    }
  }

  static async parseDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new Error('Failed to parse DOCX file. The file may be corrupted or invalid.');
    }
  }

  static async parseDOC(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      let text = '';
      let temp = '';
      for (let i = 0; i < buffer.length; i++) {
        const char = buffer[i];
        if ((char >= 32 && char <= 126) || char === 10 || char === 13 || char === 9) {
          temp += String.fromCharCode(char);
        } else {
          if (temp.length >= 4) {
            text += temp + ' ';
          }
          temp = '';
        }
      }
      if (temp.length >= 4) {
        text += temp;
      }
      return text.trim();
    } catch (error) {
      throw new Error('Failed to parse DOC file. The file may be corrupted or invalid.');
    }
  }

  static async parseFile(filePath, mimeType) {
    const ext = path.extname(filePath).toLowerCase();
    let text = '';

    if (ext === '.txt' || mimeType === 'text/plain') {
      text = fs.readFileSync(filePath, 'utf8');
    } else if (ext === '.pdf' || mimeType === 'application/pdf') {
      text = await this.parsePDF(filePath);
    } else if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await this.parseDOCX(filePath);
    } else if (ext === '.doc' || mimeType === 'application/msword' || mimeType === 'application/vnd.ms-office') {
      text = await this.parseDOC(filePath);
    } else {
      // Fallback
      text = fs.readFileSync(filePath, 'utf8');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('The file appears to be empty or could not be read.');
    }

    return text;
  }

  static cleanup(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }
}

module.exports = FileParser;
