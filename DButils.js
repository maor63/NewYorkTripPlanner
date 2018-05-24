//this is only an example, handling everything is yours responsibilty !
//this is an example - open and close the connection in each request

var ConnectionPool = require('tedious-connection-pool');
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

var poolConfig = {
    min: 2,
    max: 5,
    log: true
};

var connectionConfig = {
    userName: 'serveradmin',
    password: 'yaEl1892',
    server: 'mynewserver-181992.database.windows.net',
    options: { encrypt: true, database: 'ex3.2' }
};

//create the pool
var pool = new ConnectionPool(poolConfig, connectionConfig)

pool.on('error', function (err) {
    if (err) {
        console.log(err);
        reject(err);
    }
});
console.log('pool connection on');


//----------------------------------------------------------------------------------------------------------------------
exports.execQuery = function (dbReq) {
    return new Promise(function (resolve, reject) {

        try {

            var ans = [];
            var properties = [];

            //acquire a connection
            pool.acquire(function (err, connection) {
                if (err) {
                    console.log('acquire ' + err);
                    reject(err);
                }
                console.log('connection on');

                // var dbReq = new Request(query, function (err, rowCount) {
                //     if (err) {
                //         console.log('Request ' + err);
                //         reject(err);
                //     }
                // });

                dbReq.on('columnMetadata', function (columns) {
                    columns.forEach(function (column) {
                        if (column.colName != null)
                            properties.push(column.colName);
                    });
                });
                dbReq.on('row', function (row) {
                    var item = {};
                    for (i = 0; i < row.length; i++) {
                        item[properties[i]] = row[i].value;
                    }
                    ans.push(item);
                });

                dbReq.on('requestCompleted', function () {
                    console.log('request Completed: ' + dbReq.rowCount + ' row(s) returned');
                    console.log(ans);
                    connection.release();
                    resolve(ans);

                });
                connection.execSql(dbReq);

            });
        }
        catch (err) {
            reject(err)
        }
    });

};

function createRequest(query) {
    return new Request(query, function (err, row_count) {
        if (err) {
            console.log(err);
        }
    });
}

exports.addUser = function (user) {
    let query = "INSERT INTO Users VALUES(@userName, @password, @firstName, @lastName, @city, @country, @email);";
    let dbRequest = createRequest(query);
    dbRequest.addParameter('userName', TYPES.NVarChar, user.userName);
    dbRequest.addParameter('password', TYPES.NVarChar, user.password);
    dbRequest.addParameter('firstName', TYPES.NVarChar, user.firstName);
    dbRequest.addParameter('lastName', TYPES.NVarChar, user.lastName);
    dbRequest.addParameter('city', TYPES.NVarChar, user.city);
    dbRequest.addParameter('country', TYPES.NVarChar, user.country);
    dbRequest.addParameter('email', TYPES.NVarChar, user.email);
    exports.execQuery(dbRequest);
};

exports.addCategoriesPerUser = function(userName, categories){
    for (let i = 0, len = categories.length; i < len; i++) {
        let category = categories[i];
        let query = "INSERT INTO CategoryForUser(userID, categoryID) VALUES(@userName, @categoryID);";
        let dbRequest = createRequest(query);
        dbRequest.addParameter('userName', TYPES.NVarChar, userName);
        dbRequest.addParameter('categoryID', TYPES.Int, category);
        exports.execQuery(dbRequest);
    }
};

exports.getUser = function (userName) {
    let query = "SELECT * FROM Users WHERE user_name = @userName;";
    let dbRequest = createRequest(query);
    dbRequest.addParameter('userName', TYPES.NVarChar, userName);
    return exports.execQuery(dbRequest);
};

exports.isUserExists = function (userName) {
    let query = "SELECT * FROM Users WHERE user_name = @userName;";
    let dbRequest = createRequest(query);
    dbRequest.addParameter('userName', TYPES.NVarChar, userName);
    exports.execQuery(dbRequest).then(function (answers) {
        if(answers.length === 0)
            return false;
    }).catch(function (err) {
        console.log(err);
        return false;
    });
};