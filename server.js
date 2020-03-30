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
        "View Budget by Department",
        "Add Employee",
        "Add Department",
        "Add Role",
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

      case "View Budget by Department":
        viewBudget();
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
 *  Returns console table of Employee id, first  & last name, title,
 *  department, salary, and manager.
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
 * 
 *  Returns ID of new employee.
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
 * 
 *  Returns ID of new department.
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
    
    connection.query(query, { title: answer.title, salary: answer.salary, department_id: answer.department}, function(err, res) {
      if(err) {
        console.log("Error adding role to Database.", err);
      } else {
        console.log(`Role created with ID of : ${res.insertId} successfully.`);
      }
      runTracker(); 
    });
  });
};

/**
 *  Function that first retrieves the list of employees then
 *  prompts the user to select the employee to remove.
 *  Deletes a record based on user reponse.
 * 
 *  Retuns confirmation
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

/**
 * Retreives all current list of employees and roles.
 * Prompts user select employee to update and to provide
 * a new role for selected employee.
 * 
 * Returns confirmation.
 */
async function updateEmployee() {

  const employees = await getEmployees();
  const roles = await getRoles();
  inquirer.prompt([{
    name: "target",
    type: "list",
    message: "Which employee would you like to update: ",
    choices: employees
  },
  {
    name: "role",
    type: "list",
    message: "Which is the employees new role: ",
    choices: roles
  }
])
  .then(function(answer) {
    // Debug to validate answers.
    // console.log(answer);
    var query = "UPDATE `employee` SET ? WHERE ?";
    connection.query(query, [{role_id: answer.role}, {id: answer.target}], function(err, res) {
      if(err) {
        console.log("Error updating employee in Database.", err);
      } else {
        console.log(`Employee updated successfully.`);
      }
      runTracker(); 
    });
  });
};

/**
 * Retrieves current list of Departments, then prompts user to select one
 * and returns aggregate of combine salaries for employees in selected
 * department.
 *
 * Returns console table of Department Name, # of Employees, sum of salaries.
 */
async function viewBudget() {

  const departments = await getDepts();
  
  inquirer.prompt([{
    name: "target",
    type: "list",
    message: "Which department's budget would you like to view: ",
    choices: departments
  }
])
  .then(function(answer) {
    // Debug to validate answers.
    // console.log(answer);
    var query = "SELECT b.name as Department, count(a.id) as Num_of_Employees, sum(c.salary) as Salary_Budget FROM `employee` as a INNER JOIN (SELECT id, salary, department_id FROM role) as c ON a.role_id = c.id INNER JOIN department as b ON c.department_id = b.id WHERE b.id = ?";
    connection.query(query, [answer.target], function(err, res) {
      if(err) {
        console.log("Error quering Database.", err);
      } else {
        console.table(res);
      }
      runTracker(); 
    });
  });
};