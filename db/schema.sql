CREATE DATABASE EMPLOYEE_TRACKER_DB;

USE EMPLOYEE_TRACKER_DB;


CREATE TABLE department (
  id int primary key auto_increment,
  name varchar(30) NOT NULL
);

CREATE TABLE role (
  id int primary key auto_increment,
  title varchar(30) not null,
  salary decimal,
  department_id int,
  foreign key (department_id) references department (id)
);

CREATE TABLE employee (
  id int primary key auto_increment,
  first_name varchar(30),
  last_name varchar(30),
  role_id int,
  manager_id int,
  foreign key (role_id) references role (id),
  foreign key (manager_id) references employee (id)
);
