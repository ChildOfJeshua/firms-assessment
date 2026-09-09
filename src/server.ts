import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { cleanData, Firm } from './clean';

const { verbose } = sqlite3;
const db = new verbose.sqlite3('firms.db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
// Since index.html is in root, we don't need express.static('public')
// app.use(express.static('public')); 

// Initialize the table
db.run(fs.readFileSync('schema.sql', 'utf8'), (err) => {
  if (err) console.error('Error initializing DB:', err);
});

app.post('/api/import', (req, res) => {
  try {
    const rawFiles = ['Cage Maintenance_ANONYMIZED.csv', 'Sales Patriot Project Vendor File_ANONYMIZED.csv', 'truncated_cages_ANONYMIZED.csv'];
    const allCleanFirms: Firm[] = [];

    for (const file of rawFiles) {
      const filePath = path.join('data', 'raw', file);
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() !== '');

      // Skip header line
      const dataLines = lines.slice(1);
      const cleanFirms = cleanData(dataLines);
      allCleanFirms.push(...cleanFirms);
    }

    // Insert all firms using serialize for sequential execution
    db.serialize(() => {
      const stmt = db.prepare('INSERT INTO firms (company_name, cage, email, phone, contact_name) VALUES (?, ?, ?, ?, ?)');
      
      allCleanFirms.forEach(firm => {
        stmt.run(firm.company_name, firm.cage, firm.email, firm.phone, firm.contact_name);
      });
      
      stmt.finalize();
      
      // Send response after insertion is done
      res.json({ success: true, count: allCleanFirms.length });
    });

  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
}
});

app.get('/api/firms', (req, res) => {
  db.all('SELECT * FROM firms', [], (err, firms) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(firms);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
