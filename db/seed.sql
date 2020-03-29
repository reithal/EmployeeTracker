INSERT INTO department ("name") VALUES ("Sales");
INSERT INTO department ("name") VALUES ("Legal");
INSERT INTO department ("name") VALUES ("Finance");

INSERT INTO roles (title, salary, department_id) VALUES ("Salesperson", 60000, 1),
("Paralegal", 80000, 2),
("Sales Manager", 120000, 1),
("Accountant", 100000, 3),
("Legal Team Lead", 150000, 2);

INSERT INTO employee ("first_name", "last_name", "role_id", "manager_id") VALUES 
("Mike", "Chan", 5, null),
("Cesar", "Romero", 3, null),
("John", "Doe", 1, 2),
("Tom", "Allen", 2, 1)
