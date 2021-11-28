let express = require('express');
let router = express.Router();
let fs = require('fs');
const jsonParser = express.json();
const fileUpload = require('express-fileupload');
const dbModule = require("../database");
const database = new dbModule("mongodb://127.0.0.1:27017/");
const excelModule = require('../excel');
const uuid = require("uuid");
const excelParser = new excelModule();

const goodsKeys = ['id', 'name', 'manufacturer', 'code', 'modificationCode', 'model', 'price', 'count', 'warehouse', 'rack', 'shelf'];
let xlsIsParsed = true;
let user = {};

router.use(fileUpload());
router.use((req, res, next) => {
    checkUuid(req.headers.cookie, (err, data) => {
        if (err) res.sendStatus(400);
        if (data) {
            next();
        } else {
            res.sendStatus(401);
        }
    })
})

router.post('/gettable', jsonParser, (req, res) => {
    if (!req.body) return res.sendStatus(400)
    console.log('/gettable', req.body);
    if (req.body) {
        getTable(req.body, (err, ans) => {
            if (err) {
                res.send({message: err.message, color: 'red', status: "error"})
            } else {
                res.send(ans);
            }
        });
    } else {
        res.send({message: "Ошибка: пустое поле", color: 'red'});
    }
})
router.post('/add', jsonParser, (req, res) => {
    if (!req.body) return res.sendStatus(400)
    if (req.body && req.body.name) {
        if (req.body.price) {
            if (req.body.price[0] === "-") {
                res.send({message: 'Отрицательная цена', color: 'red', status: "error"});
                return 0;
            }
            req.body.price = excelParser.string2num(req.body.price);
        }
        if (req.body.count) {
            if (req.body.count[0] === "-") {
                res.send({message: 'Отрицательное кличество', color: 'red', status: "error"});
                return 0;
            }
            req.body.count = excelParser.string2num(req.body.count);
        }
        addInDb(req.body, (err, id) => {
            if (err) {
                res.send({message: err.message, color: 'red', status: "error"})
            } else {
                res.send({message: "Добавлено", color: 'green', status: "ok", id: id})
            }
        });
    } else {
        res.send({message: "Ошибка: пустое поле", color: 'red', status: "error"});
    }
})
router.post('/update', jsonParser, (req, res) => {
    if (!req.body) return res.sendStatus(400)
    if (req.body && req.body.id) {
        if (req.body.price) {
            if (req.body.price[0] === "-") {
                res.send({message: 'Отрицательная цена', color: 'red', status: "error"});
                return 0;
            }
            req.body.price = excelParser.string2num(req.body.price);
        }
        if (req.body.count) {
            if (req.body.count[0] === "-") {
                res.send({message: 'Отрицательное кличество', color: 'red', status: "error"});
                return 0;
            }
            req.body.count = excelParser.string2num(req.body.count);
        }
        updateData(req.body, (err, ans) => {
            if (err) {
                res.send({message: err.message, color: 'red', status: "error"})
            } else {
                res.send({message: "Обновлено", color: 'green', status: "ok"})
            }
        });
    } else {
        res.send({message: "Ошибка: пустое поле", color: 'red', status: "error"});
    }
})
router.post('/delete', jsonParser, (req, res) => {
    if (!req.body) return res.sendStatus(400)
    if (req.body && req.body.id) {
        deleteData(req.body.id, (err, ans) => {
            if (err) {
                res.send({message: err.message, color: 'red', status: "error"})
            } else {
                res.send({message: "Удалено", color: 'green', status: "ok"})
            }
        });
    } else {
        res.send({message: "Ошибка: пустое поле", color: 'red', status: "error"});
    }
})
router.get('/deletemany/:from&:to', (req, res) => {
    let from = Number(req.params['from']);
    let to = Number(req.params['to']);
    console.log('delete many ', from, to);
    if (Number.isInteger(from) && Number.isInteger(to)) {
        database.deleteManyByID(from, to);
        res.send("Ок");
    } else {
        res.send('Не ок');
    }
})
router.post('/uploadxlsx', (req, res) => {
    if (req.files.file) {
        let fileName = req.files.file.name;
        let uploadPath = __dirname.slice(0, -6) + 'public\\xls\\' + fileName;
        req.files.file.mv(uploadPath, (err) => {
            if (err) {
                console.log(err);
                res.render('uploadxlsx', {title: "Ошибка: " + err.message});
            } else {
                console.log('1');
                parseXlsx(fileName);
                res.render('uploadxlsx', {title: "Файл загружен, идет добавление в базу данных."});
            }
        })
    } else {
        res.render('uploadxlsx', {title: "Ошибка: файл не найден"});
    }
})
router.post('/uploadxlsx/awaitupload', (req, res) => {
    if (xlsIsParsed) {
        res.send("Reload");
    } else {
        waitTimeoutXlsParse(200, () => {
            res.send("Reload");
            xlsIsParsed = true;
        })
    }
})
router.post('/unloadxlsx', (req, res) => {
    if (!req.body) return res.sendStatus(400)
    if (req.body) {
        createXls({}, (err, path) => {
            if (err) {
                res.send({message: err.message, color: 'red', status: "error"})
            } else {
                let fileName = path.substring(path.lastIndexOf('\\') + 1);
                res.send({message: fileName, color: 'green', status: "ok"});
                setTimeout(() => {
                    fs.unlink(path, () => console.log('Очищено: ', path));
                }, 10000)
            }
        });
    } else {
        res.send({message: "Ошибка: пустое поле", color: 'red', status: "error"});
    }
})

router.post('/uploadphoto', jsonParser, (req, res) => {
    if (req.files) {
        res.send('coming soon');
    } else {
        res.send({message: "Ошибка: пустое поле", color: 'red', status: "error"});
    }
})

async function getTable(params, callback) {
    try {
        let sort = {'id': 1};
        if (params.order && goodsKeys.includes(params.order[0])) {
            sort = {};
            sort[params.order[0]] = 1;
            if (params.order[1] === -1) {
                sort[params.order[0]] = -1;
            }
        }
        if (params.search) {
            let re = new RegExp(`.*${params.search}.*`, 'gmi');
            let filter = {
                name: {$regex: re},
            };
            let a = await database.readPage(filter, {_id: 0}, sort, Number(params.page));
            user.lastQueryFilter = filter;
            callback(null, a);
        } else {
            let a = await database.readPage({}, {_id: 0}, sort, Number(params.page));
            user.lastQueryFilter = {};
            callback(null, a);
        }
    } catch (e) {
        console.log(e);
        callback(e);
    }
}
async function addInDb(body, callback) {
    try {
        body.id = await database.findMaxId() ?? 0;
        await database.create("db", "goods", body);
        callback(null, body.id);
    } catch (e) {
        console.log(e);
        callback(e);
    }
}
async function updateData(body, callback) {
    try {
        body.id = Number(body.id);
        console.log(body);
        await database.update("db", "goods", {id: body.id}, body);
        callback(null);
    } catch (e) {
        console.log(e);
        callback(e);
    }
}
async function deleteData(id, callback) {
    try {
        id = Number(id);
        await database.delete("db", "goods", {id: id});
        callback(null);
    } catch (e) {
        console.log(e);
        callback(e);
    }
}
async function parseXlsx(fileName) {
    xlsIsParsed = false;
    let path = `${__dirname.replace('\\routes', '')}\\public\\xls\\${fileName}`;
    let maxId = await database.findMaxId();
    let arr = await excelParser.start(path, maxId);
    database.createMany("db", "goods", arr)
        .catch(err => console.log(err))
        .then(() => {
            xlsIsParsed = true;
            fs.unlink(__dirname.slice(0, -6) + 'public\\xls\\' + fileName, (err, a) => {
                console.log(err, a);
            });
        })
}
async function createXls(params, callback) {
    try {
        let arr = await database.read("db", "goods", user.lastQueryFilter, {_id: 0});
        let path = `${__dirname.slice(0, -6)}\\public\\xls\\Книга1.xlsx`;
        excelParser.write(path, arr, callback);
    } catch (e) {
        console.log(e);
        callback(e);
    }
}
async function checkUuid(cookie, callback) {
    // callback(null, false)
    // callback(new Error("Текст ошибки"))
    if (cookie) {
        let cookieUuid;
        cookie.split(';').forEach((e) => {
            if (e.split("=")[0].includes("UUID") && uuid.validate(e.split("=")[1])) {
                cookieUuid = e.split("=")[1];
            }
        })
        if (cookieUuid) {
            user.login = await database.compareUuid(cookieUuid);
            console.log("Login as", user.login);
            if (user.login !== null) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        }
    } else {
        callback(null, false);
    }
}
function waitTimeoutXlsParse(ms = 500, callback) {
    setTimeout(() => {
        if (xlsIsParsed) {
            callback();
        } else {
            waitTimeoutXlsParse(ms * 2, callback);
        }
    }, ms)
}

module.exports = router;

// if first start
database.createUser({login: 'admin', password: 'admin'});