-- Tạo employee nếu chưa có
INSERT INTO employee (
    id,
    name,
    email,
    phone,
    address,
    birthday,
    gender,
    position,
    key_avatar,
    created_at,
    updated_at,
    deleted
)
SELECT
    '645f2878-7fe6-4363-a46b-59f909011b2b',
    'System Admin',
    'admin@system.com',
    '0000000000',
    'System',
    '1990-01-01',
    null,
    'ADMIN',
    NULL,
    NOW(),
    NOW(),
    FALSE
    WHERE NOT EXISTS (
    SELECT 1 FROM employee WHERE id = '645f2878-7fe6-4363-a46b-59f909011b2b'
);

-- Tạo user nếu chưa có
INSERT INTO users (
    id,
    username,
    password,
    role,
    employee_id,
    status
)
SELECT
    '33e1e2de-e7bf-4624-a730-f8fdf8b64761',
    'admin',
    '$2a$10$yTVrPCQm9B3B2NH70u6qDeNajUMrBd3dIji84vCCessxCrVXul6Ei',
    'ADMIN',
    '645f2878-7fe6-4363-a46b-59f909011b2b',
    TRUE
    WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'admin'
);
