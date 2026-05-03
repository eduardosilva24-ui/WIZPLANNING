import { ensureDatabaseSchema } from '../database/ensureSchema.js';

ensureDatabaseSchema()
  .then(() => {
    console.log('Database schema initialized successfully');
  })
  .catch((err) => {
    console.error('Error creating schema:', err);
    process.exit(1);
  });
