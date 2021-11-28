let express = require('express');
let router = express.Router();
const uuid = require("uuid");
const jsonParser = express.json();

const dbModule = require("../database");
const database = new dbModule("mongodb://127.0.0.1:27017/");

let user = {};
router.get('/', (req, res) => {
    checkUuid(req.headers.cookie, (err, data) => {
        if (err) res.sendStatus(400);
        if (data) {
            database.findMaxId().then(count => {
                res.render('admin', {
                    login: user.login,
                    dbCount: count,
                });
            });
        } else {
            res.render('login');
        }
    })
});
router.post("/login", jsonParser, (req, res) => {
    console.log(req.body);
    if (!req.body) return res.sendStatus(400)
    if (req.body.login && req.body.password) {
        isLogin(req.body.login, req.body.password, (err, ans) => {
            if (err) res.sendStatus(500)
            if (uuid.validate(ans)) {
                res.header({"Set-Cookie": `UUID=${ans}; path=/; Max-Age=2592000; Secure`})
                res.send("Reload");
            } else {
                res.send(ans);
            }
        });
    } else res.send("Ошибка: пустое поле");
})
router.get("/logout", (req, res) => {
    user.isLogined = false;
    res.clearCookie('UUID');
    res.redirect("../");
})

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
            console.log("Login as", user.login)
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
async function isLogin(login, pass, callback) {
    database.checkPassword(login, pass)
        .catch(e => console.log(e))
        .then(resolve => {
            if (resolve === null) {
                callback(null, "Пользователь не существует");
            } else if (resolve === false) {
                callback(null, "Неверный пароль");
            } else if (uuid.validate(resolve)) {
                callback(null, resolve);
            } else {
                callback(new Error("Error, pass check failed"));
            }
        });
}

module.exports = router;