-- Create database
CREATE DATABASE product_lifecycle_db;

-- Use the database
\c product_lifecycle_db;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table for session management
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    segment VARCHAR(50) CHECK (segment IN ('Pembangkitan', 'Distribusi', 'Transmisi', 'Korporat', 'Pelayanan Pelanggan')),
    lifecycle_stage VARCHAR(50) CHECK (lifecycle_stage IN ('Introduction', 'Growth', 'Maturity', 'Decline')),
    price DECIMAL(10, 2),
    launch_date DATE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lifecycle_history table for tracking stage changes
CREATE TABLE lifecycle_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    previous_stage VARCHAR(50),
    new_stage VARCHAR(50),
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by INTEGER REFERENCES users(id),
    notes TEXT
);

-- Insert users with REAL hashes (replace with output from generate-hashes.js)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@company.com', '$2b$10$7GqSWJrcBj73g0xFQnp.9.hJdfhoB23BTpf7MxpPejCMx6MePcuXm', 'System Administrator', 'admin'),
('manager', 'manager@company.com', '$2b$10$7GqSWJrcBj73g0xFQnp.9.hJdfhoB23BTpf7MxpPejCMx6MePcuXm', 'Product Manager', 'manager'),
('user', 'user@company.com', '$2b$10$7GqSWJrcBj73g0xFQnp.9.hJdfhoB23BTpf7MxpPejCMx6MePcuXm', 'Regular User', 'user');

-- Insert sample data
-- Update sample data dengan segment
INSERT INTO products (name, description, category, segment, lifecycle_stage, price, launch_date, created_by) VALUES
('Cloud Management Platform', 'Enterprise cloud infrastructure management solution', 'Infrastructure', 'Korporat', 'Growth', 15000.00, '2023-01-15', 1),
('AI Analytics Tool', 'Machine learning powered business analytics', 'Analytics', 'Distribusi', 'Introduction', 8500.00, '2024-01-01', 1),
('Legacy ERP System', 'Traditional enterprise resource planning', 'Enterprise Software', 'Korporat', 'Decline', 25000.00, '2018-06-01', 2),
('Mobile Security Suite', 'Comprehensive mobile device security', 'Security', 'Pelayanan Pelanggan', 'Maturity', 12000.00, '2021-03-10', 2),
('Power Generation System', 'Advanced power generation monitoring', 'Energy', 'Pembangkitan', 'Growth', 50000.00, '2022-05-15', 1),
('Distribution Network Tool', 'Smart grid distribution management', 'Infrastructure', 'Distribusi', 'Maturity', 30000.00, '2021-08-20', 2),
('Transmission Monitor', 'High voltage transmission monitoring', 'Monitoring', 'Transmisi', 'Growth', 75000.00, '2023-03-10', 1);