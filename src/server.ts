import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { cleanData, Firm } from './clean';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new Database('firms.db');
db.exec(fs.readFileSync('schema.sql','utf8'));

app.post('/api/import', (req,res) => {
  try {
    const rawFiles = ['Cage Maintenance_ANONYMIZED.csv', 'Sales Patriot Project Vendor File_ANONYMIZED.csv', 'truncated_cages_ANONYMIZED.csv'];
    const allCleanFirms: Firm[] = [];

    for (const file of rawFiles) {
      const filePath = path.join('data,' 'raw', file);
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line=>line.trim() !== ");

      const dataLines = lines.slice(1);
      const cleanFirms = cleanData(dataLines);
      allCleanFirms.push(...cleanFirms);
    }

  const stmt = db.prepare('INSERT INTO firms (company_name, cage, email, phone, contact_name)
                          VALUES (?,?,?,?,?)
');
  const insertMany = db.transactions((firms: Firm[]) => {
    for (const firm of firms) {
      stmt.run(firm.company_name, firm.cage, firm.email, firm.phone, firm,contact_name);
    }
});
    insertMany(allCleanFirms);

    res.json({success: true, count: allCleanFirms.length });
  } catch(error {
    res.status(500).json({error: error.message });
  }
});

app.get('/api/firms', (req, res) => {
    const firms = db.prepare('SELECT * FROM firms').all();
    res.json(firms);
});

app.listen(PORT, () => {
  console.log('Server running at http://localhost:${PORT}');
});
