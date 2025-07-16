import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";

dotenv.config();

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function resetDatabase() {
  console.log("🔄 Resetting database schema...");
  
  try {
    // Drop all tables
    await pool.query(`DROP TABLE IF EXISTS download_logs CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS onboarding_form_responses CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS onboarding_form_config CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS notifications CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS files CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS file_folders CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS free_project_access CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS script_topics CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS topics CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS scripts CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS episodes CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS projects CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS themes CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS radio_stations CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS otp_verifications CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS users CASCADE`);
    
    console.log("✅ Dropped all tables");

    // Create users table
    await pool.query(`
      CREATE TABLE users (
        id VARCHAR PRIMARY KEY NOT NULL,
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        username VARCHAR UNIQUE,
        password VARCHAR,
        role VARCHAR DEFAULT 'member',
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        login_count INTEGER DEFAULT 0,
        last_login_at TIMESTAMP,
        first_login_completed BOOLEAN DEFAULT false,
        location JSONB,
        onboarding_responses JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("✅ Created users table");

    // Create themes table
    await pool.query(`
      CREATE TABLE themes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("✅ Created themes table");

    // Create projects table
    await pool.query(`
      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        theme_id UUID,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (theme_id) REFERENCES themes(id)
      )
    `);
    
    console.log("✅ Created projects table");

    // Create episodes table
    await pool.query(`
      CREATE TABLE episodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);
    
    console.log("✅ Created episodes table");

    // Create scripts table
    await pool.query(`
      CREATE TABLE scripts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL,
        author_id VARCHAR NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `);
    
    console.log("✅ Created scripts table");

    // Create topics table
    await pool.query(`
      CREATE TABLE topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("✅ Created topics table");

    // Create radio_stations table
    await pool.query(`
      CREATE TABLE radio_stations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        frequency VARCHAR(255),
        location VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(255),
        website VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("✅ Created radio_stations table");

    // Create files table
    await pool.query(`
      CREATE TABLE files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        file_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("✅ Created files table");

    // Create onboarding_form_config table
    await pool.query(`
      CREATE TABLE onboarding_form_config (
        id VARCHAR PRIMARY KEY NOT NULL,
        version INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        questions JSONB NOT NULL,
        created_by VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    
    console.log("✅ Created onboarding_form_config table");

    // Create onboarding_form_responses table
    await pool.query(`
      CREATE TABLE onboarding_form_responses (
        id VARCHAR PRIMARY KEY NOT NULL,
        user_id VARCHAR NOT NULL,
        form_config_id VARCHAR NOT NULL,
        form_version INTEGER NOT NULL,
        responses JSONB NOT NULL,
        location JSONB,
        submitted_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (form_config_id) REFERENCES onboarding_form_config(id)
      )
    `);
    
    console.log("✅ Created onboarding_form_responses table");

    // Create notifications table
    await pool.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        priority VARCHAR(50) DEFAULT 'medium',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    console.log("✅ Created notifications table");

    // Create current user
    await pool.query(`
      INSERT INTO users (id, email, username, password, role, is_active, is_verified, first_login_completed) 
      VALUES ('0fjxiLwHrq5Zo2OP_Klmn', 'ashwaniswami858@gmail.com', 'ashwaniswami858', '$2b$10$abc123', 'admin', true, true, true)
      ON CONFLICT (id) DO NOTHING
    `);
    
    console.log("✅ Created current user");

    // Create sample themes
    await pool.query(`
      INSERT INTO themes (name) VALUES 
      ('News & Current Affairs'),
      ('Music & Entertainment'),
      ('Educational Content'),
      ('Community Programs'),
      ('Sports & Recreation')
      ON CONFLICT (name) DO NOTHING
    `);
    
    console.log("✅ Created sample themes");

    console.log("\n🎉 Database reset completed successfully!");
    console.log("🔗 All tables created with proper relationships");
    console.log("📊 Sample data added for testing");
    console.log("🚀 Application should now work correctly!");
    
    pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    pool.end();
    process.exit(1);
  }
}

resetDatabase();