import fs from 'fs';
import path from 'path';

interface Firm {
  company_name: string | null;
  cage: string | null;
  email: string | null;
  phone: string | null;
  contact_name: string | null;
}

const cleanData = (rawData: string[]): Firm[] => {
  const firmsMap = new Map<string, Firm>();

  for (const line of rawData) {
    const parts = line.split(',');
    if (parts.length < 2) continue;

    const [name, cage, email, phone, contact] = parts.map(p => p.trim());

    if (!name || !cage) continue;

    const validEmail = email && email.includes('@') ? email : null;

    const firm: Firm = {
      company_name: name,
      cage: cage,
      email: validEmail,
      phone: phone || null,
      contact_name: contact || null
    };

    if (!firmsMap.has(cage)) {
      firmsMap.set(cage, firm);
    } else {
      const existing = firmsMap.get(cage)!;
      const existingCount = Object.values(existing).filter(v => v !== null).length;
      const newCount = Object.values(firm).filter(v => v !== null).length;

      if (newCount > existingCount) {
        firmsMap.set(cage, firm);
      }
    }
  }
  return Array.from(firmsMap.values());
};

export { cleanData, Firm };
