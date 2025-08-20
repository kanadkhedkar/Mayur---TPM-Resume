// netlify/functions/submitContact.js
import { Client } from 'pg';

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST requests allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Connect to Neon PostgreSQL
    const client = new Client({
      connectionString: process.env.NEON_DB_URL, // <-- You will set this in Netlify
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // Create table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_form (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert form data
    await client.query(
      `INSERT INTO contact_form (name, email, message) VALUES ($1, $2, $3)`,
      [name, email, message]
    );

    await client.end();

    return new Response(
      JSON.stringify({ success: true, message: "Form submitted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
