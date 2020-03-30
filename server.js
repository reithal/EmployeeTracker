/* 
  server.js file for Node.js server application.
  HomeWork: Employer Tracker
  Author: Carlos Mazon
  Date: March 2020
*/


var mysql = require("mysql");
var inquirer = require("inquirer");
const cTable = require('console.table');  // NPMs console table

// Setup MySql Connection
var connection = mysql.createConnection({
  host: "localhost",

  // Your port, change if not 8889
  port: 8889,
  user: "root",
  password: "root",
  database: "EMPLOYEE_TRACKER_DB"
});

// Connect to the database and initiate the first funtion to bring up inquirer.
connection.connect(function(err) {
  if (err) throw err;
  runTracker();
});

// Query to return main set of all 3 tables together.
const mainQuery = ("SELECT a.id as id, a.first_name, a.last_name, b.title, c.name as department, b.salary, d.manager FROM employee as a INNER JOIN role as b ON a.role_id = b.id INNER JOIN department as c ON b.department_id = c.id   LEFT OUTER JOIN (SELECT id, concat(first_name, ' ', last_name) as manager from employee) as d ON a.manager_id = d.id");

/**
 *  Queries the department table to retun an array. Used for Inquirer choices.
 *
 * @returns {Array} object with name of departments
 */
function getDepts() {
  var departments = [];

  return new Promise(function(resolve, reject) {
    connection.query("SELECT * FROM department", function(err, res) {
      if (err) {
        reject(err)
      };
      res.forEach((dept)=>{
        const newDept = {
          value: dept.id,
          name: dept.name
        }
        departments.push(newDept);
      });
      resolve(departments);
    });
  });
};

/**
 *  Queries the Role table to retun an array. Used for Inquirer choices.
 *
 * @returns {Array} object with id, name
 */
function getRoles() {
  var roles = [];

  return new Promise(function(resolve, reject) {
    connection.query("SELECT * FROM role", function(err, res) {
      if (err) {
        reject(err)
      };
      res.forEach((role)=>{
        const newRole = {
          value: role.id,
          name: role.title
        };
        roles.push(newRole);
      });
      resolve(roles);
    });
  });
};

/**
 *  Queries the Employee table to retun an array. Used for Inquirer choices.
 *
 * @returns {Array} object with id, name passed to value,name.
 */

function getEmployees() {
  const employees=[];
  return new Promise(function(resolve, reject) {
    connection.query("SELECT id, concat(first_name, ' ', last_name) as name FROM employee", function(err, res) {
      res.forEach((emp)=>{
        const employee= {
          value : emp.id,
          name : emp.name
        }
        employees.push(employee);
      });
      resolve(employees);
    });
  })
};

/**
 *  Main function of the program. Initiates the user prompt/ UI. 
 *  Calls other functions based on user response.
 */
function runTracker() {
  inquirer
    .prompt({
      name: "action",
      type: "rawlist",
      message: "What would you like to do?",
      choices: [
        "View all employees",
        "View all employees by department",
        "View all employees by manager",
        "Add Employee",
        "Remove Employee",
        "Update Employee"
      ]
    })
    .then(function(answer) {
      switch (answer.action) {
      case "View all employees":
        employeesAll();
        break;

      case "View all employees by department":
        employeesByDept();
        break;

      case "View all employees by manager":
        employeesByMgr();
        break;

      case "Add Employee":
        addEmployee();
        break;

      case "Add Department":
        addDepartmnet();
        break;
      
      case "Add Role":
        addRole();
        break;
      
      case "Remove Employee":
        removeEmployee();
        break;
      
        case "Update Employee":
        updateEmployee();
        break;  
      }
    });
}
/**
 *  Displays a formatted table of the main query defined above.
 *
 */
function employeesAll() {
  connection.query(mainQuery + " order by a.id", function(err, res) {
    console.table(res);
    runTracker();     
    });
};

/**
 *  Function that first retrieves the list of departments, prompts the
 *  user to select one to return all employees pertaining to that department.
 */
async function employeesByDept() {
  const departments = await getDepts();
    
    console.log(departments);
    inquirer
      .prompt({
        name: "department",
        type: "list",
        message: "What department would you like to search for?",
        choices: departments
      })
      .then(function(answer) {
        var query = mainQuery + " WHERE c.id = ?";
        connection.query(query, [answer.department], function(err, res) {
          if(res.length > 0){
            console.table(res);
        } else {
          console.log("  Currently no employees in that deparment. ")
        }
        runTracker(); 
        });
      });
};

/**
 *  Function that first retrieves the list of employees who are listed as managers
 *  of other employees. Then prompts the user to select one to return all employees
 *  pertaining to that department.
 */
function employeesByMgr() {
  connection.query("SELECT concat(first_name, ' ', last_name) as name FROM employee where id in (SELECT manager_id from employee)", function(err, res) {
    const managers=[];
    res.forEach((mgr)=>{
      managers.push(mgr.name);
    });

  inquirer
    .prompt({
      name: "manager",
      type: "list",
      message: "What manager would you like to search for?",
      choices: managers
    })
    .then(function(answer) {
      answer.manager = '%' + answer.manager + '%';
      var query = mainQuery + " WHERE d.manager LIKE N?";
      connection.query(query, [answer.manager], function(err, res) {
        console.table(res);
        runTracker(); 
      });
    });
  });
};

/**
 *  Function that first retrieves the list of employees and roles then
 *  prompts the user to enter the information for the new employee.
 *  Inserts a record based on user reponses.
 */
async function addEmployee() {
  const roles = await getRoles();
  // DEBUG
  //console.log(roles);
  const managers = await getEmployees();
  // DEBUG
  //console.log(managers);
  managers.push({value: 0, name: "None"});
  const questions = [{
    name: "firstName",
    type: "input",
    message: "What is the employee's first name"
    },
    {
      name: "lastName",
      type: "input",
      message: "What is the employee's last name"
    },
    {
      name: "role",
      type: "list",
      message: "What is the employee's role",
      choices: roles
    },
    {
      name: "manager",
      type: "list",
      message: "What is the employee's manager",
      choices: managers
    },
  ];

  inquirer.prompt(questions)
  .then(function(answer) {
    // Debug to validate answers.
    // console.log(answer);

    // Sets manager id to null if no manager is selected.
    if (answer.manager == 0) {answer.manager = null;};
    var query = "INSERT INTO `employee` SET ?";
    connection.query(query, { first_name: answer.firstName, last_name: answer.lastName, role_id: answer.role, manager_id: answer.manager}, function(err, res) {
      if(err) {
        console.log("Error adding employee to Database.", err);
      } else {
        console.log(`Employee created with ID of : ${res.insertId} successfully.`);
      }
      runTracker(); 
    });
  });
};

/**
 *  Function that prompts the user to enter the information for 
 *  the new deparment.
 *  Inserts a record based on user reponses into department table.
 */
async function addDepartmnet() {

  inquirer.prompt([{
    name: "name",
    type: "input",
    message: "What is the name of the new Department: "
    }])
  .then(function(answer) {
    // Debug to validate answers.
    // console.log(answer);

    var query = "INSERT INTO `department` SET ?";
    connection.query(query, { name: answer.name}, function(err, res) {
      if(err) {
        console.log("Error adding department to Database.", err);
      } else {
        console.log(`Department created with ID of : ${res.insertId} successfully.`);
      }
      runTracker(); 
    });
  });
};

/**
 *  Function that prompts the user to enter the information for the new role.
 *  Inserts a record based on user reponses into role table.
 */
async function addRole() {
  const departments = await getDepts();

  inquirer.prompt([{
    name: "title",
    type: "input",
    message: "What is the title of the new role: "
    },
  {
    name: "salary",
    type: "input",
    message: "What is the salary of this new role: "
  },
  {
    name: "department",
    type: "list",
    message: "What deparment will this role be assigned to: ",
    choices: departments
  },
])
  .then(function(answer) {
    // Debug to validate answers.
    // console.log(answer);

    var query = "INSERT INTO `role` SET ?";
    connection.query(query, { name: answer.name}, function(err, res) {
      if(err) {
        console.log("Error adding department to Database.", err);
      } else {
        console.log(`Department created with ID of : ${res.insertId} successfully.`);
      }
      runTracker(); 
    });
  });
};

/**
 *  Function that first retrieves the list of employees then
 *  prompts the user to selec the employee to remove.
 *  Deletes a record based on user reponse.
 */
async function removeEmployee() {

  const employees = await getEmployees();
  inquirer.prompt([{
    name: "target",
    type: "list",
    message: "Which employee would you like to remove: ",
    choices: employees
  }])
  .then(function(answer) {
    // Debug to validate answers.
    // console.log(answer);
    var query = "DELETE FROM `employee` WHERE ?";
    connection.query(query, { id: answer.target}, function(err, res) {
      if(err) {
        console.log("Error removing employee from Database.", err);
      } else {
        console.log(`Employee deleted successfully.`);
      }
      runTracker(); 
    });
  });
};

 