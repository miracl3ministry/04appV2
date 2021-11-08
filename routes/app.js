let express = require('express');
let router = express.Router();
const jsonParser = express.json();
const dbModule = require("../database");
const database = new dbModule("mongodb://127.0.0.1:27017/");

router.post('/gettable', jsonParser, (req, res) => {
    if (!req.body) return res.sendStatus(400)
    console.log('/gettable', req.body);
    if (req.body) {
        getTable('', (err, ans) => {
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
                res.send({message: "Обновлено", color: 'green', status: "ok"})
            }
        });
    } else {
        res.send({message: "Ошибка: пустое поле", color: 'red', status: "error"});
    }
})

async function getTable(params, callback) {
    try {
        let a = await database.read("db", "goods", {}, {_id: 0});
        callback(null, a);
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

module.exports = router;