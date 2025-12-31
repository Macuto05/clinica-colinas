-- Delete the mistakenly created user and role
DELETE FROM "usuario" WHERE email = 'caja@clinica.com';
DELETE FROM "rol" WHERE nombre = 'CAJA';
