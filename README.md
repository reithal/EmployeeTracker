# EmployeeTracker

![Code Size](https://img.shields.io/github/languages/code-size/reithal/EmployeeTracker)
![Last Commit](https://img.shields.io/github/last-commit/reithal/EmployeeTracker)

![Follow](https://img.shields.io/github/followers/reithal?style=social)

A node base CLI application to maintain an employee database using MySQL.

## Introduction

The user will be prompted with several options that will allow them to perform the following functions:

- Add departments, roles, employees

- View employees by department or manager.

- Update employee roles

- Delete employees

- View the total utilized budget of a department -- ie the combined salaries of all employees in that department.

- [Installation](#installation)
  ​
- [Usage](#usage)
  ​
- [License](#license)
  ​
- [Contributing](#contributing)
  ​
- [Tests](#tests)
  ​
- [Questions](#questions)

## Installation

Perform the following command: npm install

This should install Node.js, along with the Inquirer, and MySQL modules.

## Usage

The application will be invoked with the following command:

node server.js

The user will be prompted with a series of options to perform their task. Some options will prompt for additional information such as adding a new role, employeem, etc.

Once prompted, the system will perform the required queries against the database to retreive or alter the data as requested.

![HowTo](https://github.com/reithal/EmployeeTracker/blob/master/assets/images/employeetracker.gif)

## License

This project uses the MIT license.

## Questions

If you have any issues or discover a problem please report it at ![Issues](https://github.com/reithal/EmployeeTracker/issues)
