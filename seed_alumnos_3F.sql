-- Alumnos de 3°F para la profesora DEYSI (23 hombres y 10 mujeres).
-- EJECUTAR SOLO DESPUÉS de que el usuario 'deysi' se haya registrado en la app.
insert into students(owner_id,apellidos,nombres,gender,aula,qr)
select u.id, v.a, v.n, v.g, '3°F', v.q from users u,
(values
('Aguilera De La Cruz','Leonel Dylan','H','ASIST|3°F|Aguilera De La Cruz, Leonel Dylan'),
('Aponte Huancaya','Rafael Aaron','H','ASIST|3°F|Aponte Huancaya, Rafael Aaron'),
('Ayala Morales','Diego James','H','ASIST|3°F|Ayala Morales, Diego James'),
('Cabrera Osorio','Liam Fabricio','H','ASIST|3°F|Cabrera Osorio, Liam Fabricio'),
('Diaz Briceño','Pedro Keylor','H','ASIST|3°F|Diaz Briceño, Pedro Keylor'),
('Espinoza Reymundo','Juan Cesar','H','ASIST|3°F|Espinoza Reymundo, Juan Cesar'),
('Gonzales Huerta','Jhon Kelvin','H','ASIST|3°F|Gonzales Huerta, Jhon Kelvin'),
('Huaynates Durand','Jose Alexis','H','ASIST|3°F|Huaynates Durand, Jose Alexis'),
('Laureano Surichaqui','Mael Raul','H','ASIST|3°F|Laureano Surichaqui, Mael Raul'),
('Medina Huisa','Galet Jacob','H','ASIST|3°F|Medina Huisa, Galet Jacob'),
('Natividad Bardales','Brayden Emilio','H','ASIST|3°F|Natividad Bardales, Brayden Emilio'),
('Ortega Taipe','Jordan Ibraimovic','H','ASIST|3°F|Ortega Taipe, Jordan Ibraimovic'),
('Palomino Limas','Liam Manuel','H','ASIST|3°F|Palomino Limas, Liam Manuel'),
('Quispe Porras','Yahiko Deyvis','H','ASIST|3°F|Quispe Porras, Yahiko Deyvis'),
('Rodriguez Berrospi','Jhunior Steven','H','ASIST|3°F|Rodriguez Berrospi, Jhunior Steven'),
('Salvatierra Vadillo','Angel','H','ASIST|3°F|Salvatierra Vadillo, Angel'),
('Silva Bernardo','Yefrey Delson','H','ASIST|3°F|Silva Bernardo, Yefrey Delson'),
('Soto Yañac','Sebastián','H','ASIST|3°F|Soto Yañac, Sebastián'),
('Tito Gozme','Adrian Gael','H','ASIST|3°F|Tito Gozme, Adrian Gael'),
('Valdivia Sumaran','Gael Jesús','H','ASIST|3°F|Valdivia Sumaran, Gael Jesús'),
('Vallejo Salazar','Iker Gael','H','ASIST|3°F|Vallejo Salazar, Iker Gael'),
('Vargas Mendoza','Yeico Jandel','H','ASIST|3°F|Vargas Mendoza, Yeico Jandel'),
('Vasquez Medrano','Piero','H','ASIST|3°F|Vasquez Medrano, Piero'),
('Balbin Bautista','Sully Cielo Alejandra','M','ASIST|3°F|Balbin Bautista, Sully Cielo Alejandra'),
('Bellido Meneses','Jamilett Maria','M','ASIST|3°F|Bellido Meneses, Jamilett Maria'),
('Campos Torres','Brianna Kasumi','M','ASIST|3°F|Campos Torres, Brianna Kasumi'),
('Canahualpa Masquez','Luna Mafer','M','ASIST|3°F|Canahualpa Masquez, Luna Mafer'),
('Huaman Oscco','Kenia Elif','M','ASIST|3°F|Huaman Oscco, Kenia Elif'),
('Huaroc Palomino','Anjalí Tiana','M','ASIST|3°F|Huaroc Palomino, Anjalí Tiana'),
('Jara Pineda','Ashley Luz','M','ASIST|3°F|Jara Pineda, Ashley Luz'),
('Rojas De La Cruz','Alessia Luciana','M','ASIST|3°F|Rojas De La Cruz, Alessia Luciana'),
('Sánchez Cajacuri','Adeline Taylor','M','ASIST|3°F|Sánchez Cajacuri, Adeline Taylor'),
('Zuca Curi','Cielo','M','ASIST|3°F|Zuca Curi, Cielo')
) as v(a,n,g,q)
where lower(u.username)='deysi'
on conflict (owner_id,qr) do nothing;

insert into user_settings(user_id,key,value)
select u.id,k,v from users u, (values ('aula','3°F'),('escuela','I.E. 0027'),('profesora','Deysi'),('anio','2026')) t(k,v)
where lower(u.username)='deysi' on conflict do nothing;
