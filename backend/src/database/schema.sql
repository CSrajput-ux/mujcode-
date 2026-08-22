-- Enterprise Blueprint: Phase 4
-- Initial PostgreSQL Schema Definition

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "isPasswordChanged" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS problems (
    id VARCHAR(50) PRIMARY KEY,
    number SERIAL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20),
    category VARCHAR(100),
    topic VARCHAR(100),
    "timeLimit" FLOAT,
    "memoryLimit" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: We'll add remaining tables like submissions, testcases, etc. 
-- progressively as we migrate those repositories.
