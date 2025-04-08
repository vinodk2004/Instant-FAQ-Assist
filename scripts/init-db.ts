import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function initializeDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Please add your MongoDB URI to .env.local');
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB successfully');

    const db = client.db('faq-assistant');
    
    // Create users collection with validation
    try {
      await db.createCollection('users', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'email', 'password', 'createdAt'],
            properties: {
              name: {
                bsonType: 'string',
                description: 'must be a string and is required'
              },
              email: {
                bsonType: 'string',
                pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                description: 'must be a valid email address and is required'
              },
              password: {
                bsonType: 'string',
                description: 'must be a string and is required'
              },
              createdAt: {
                bsonType: 'date',
                description: 'must be a date and is required'
              }
            }
          }
        }
      });
      console.log('Users collection created successfully');
    } catch (error: any) {
      if (error.code === 48) {
        console.log('Users collection already exists');
      } else {
        throw error;
      }
    }

    // Create an index on the email field to ensure uniqueness
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('Email index created successfully');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

initializeDatabase(); 