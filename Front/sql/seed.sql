
INSERT INTO users (user_id, password_hash, name) VALUES
('superman', '$2b$10$jmW9IYI3a3YpR8o1Z1Y3fOa9yXr3f4m8h1v7vPjKEE3K0h4y1l5QG', 'Superman'),
('flash',    '$2b$10$jmW9IYI3a3YpR8o1Z1Y3fOa9yXr3f4m8h1v7vPjKEE3K0h4y1l5QG', 'Flash'),
('greenlantern', '$2b$10$jmW9IYI3a3YpR8o1Z1Y3fOa9yXr3f4m8h1v7vPjKEE3K0h4y1l5QG', 'Green Lantern');

INSERT INTO blogs (creator_user_id, creator_name, title, body, date_created) VALUES
('superman','Superman','Truth & Justice','Defending Metropolis one SQL query at a time.', NOW() - INTERVAL '5 days'),
('flash','Flash','Speed of Code','Optimizing database queries faster than light.', NOW() - INTERVAL '4 days'),
('greenlantern','Green Lantern','Power of Data','Willpower meets data power.', NOW() - INTERVAL '3 days'),
('superman','Superman','SQL Strength','Even Kryptonite can’t stop a good schema.', NOW() - INTERVAL '2 days'),
('flash','Flash','Racing the Backend','Fast APIs, faster queries.', NOW() - INTERVAL '1 day');
