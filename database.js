const {MongoClient, ObjectId} = require("mongodb");
const crypto = require("crypto");

class Database {
    static instance;
    constructor(uri) {
        if (Database.instance) {
            return Database.instance;
        }
        this.uri = uri ?? "mongodb://localhost:27017/";
        this.mongoClient = new MongoClient(this.uri);
        this.queue = [];
        Database.instance = this;
    }

    // DB CRUD
    async create(dbName, collectionName, data) {
        try {
            await this.mongoClient.connect();
            const collection = this.mongoClient.db(dbName).collection(collectionName);
            console.log("Connected successfully to server");
            await collection.insertOne(data);
        } catch (e) {
            console.log(`Mongo module error: ${e}`);
        } finally {
            // await this.mongoClient.close();
        }
    }
    async read(dbName, collectionName, filter, project = null) {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db(dbName);
            const collection = db.collection(collectionName);
            console.log("Connected successfully to server");
            let a = await collection.find(filter);
            let count = await a.count()
            console.log("Cursor count:", count);
            if (count === 1) {
                return await a.project(project).next();
            } else if (count === 0) {
                return null;
            } else {
                return await a.project(project).toArray();
            }
        } catch (e) {
            console.log(`Mongo module error: ${e}`);
        } finally {
            // await this.mongoClient.close();
        }
    }
    async update(dbName, collectionName, filter, data) {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db(dbName);
            const collection = db.collection(collectionName);
            console.log("Connected successfully to server");
            await collection.updateOne(filter, {$set: data});
        } catch (e) {
            console.log(`Mongo module error: ${e}`);
        } finally {
            // await this.mongoClient.close();
        }
    }
    async delete(dbName, collectionName, filter) {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db(dbName);
            const collection = db.collection(collectionName);
            console.log("Connected successfully to server");
            await collection.deleteOne(filter);
        } catch (e) {
            console.log(`Mongo module error: ${e}`);
        } finally {
            // await this.mongoClient.close();
        }
    }
    async createMany(dbName, collectionName, dataArr) {
        try {
            await this.mongoClient.connect();
            const collection = await this.mongoClient.db(dbName).collection(collectionName);
            console.log("Connected successfully to server");
            /*
            Тут можно использовать два варианта добавления большого кол-ва документов
            Если количество документов < 100 000 и MongoBulk работает, то можно добавлять просто через
            await collection.insertMany(dataArr);
            это работает быстрее

            В ином случае можно добавлять документы с разбивкой по 1000
             */
            let len = dataArr.length;
            for (let i = 0; i < len; i += 1000) {
                let arr = dataArr.slice(i, i + 1000);
                this.queue.push(await collection.insertMany(arr));
            }
            await this.runQueue();
            // await collection.insertMany(dataArr);
            return 0;
        } catch (e) {
            console.log(`Mongo module error: ${e}`);
        } finally {
            // await this.mongoClient.close();
        }
    }

    async runQueue() {
        console.log(typeof this.runQueue);
        if (this.queue.length > 0) {
            let func = this.queue.shift();
            console.log('in queue', func, typeof func, this.queue.length);
            if (typeof func === 'function') {
                await func().then(await this.runQueue());
            }
        } else {
            // console.log('end');
        }
    }

    async deleteMany(dbName, collectionName, filter) {
        try {
            await this.mongoClient.connect();
            const collection = this.mongoClient.db(dbName).collection(collectionName);
            console.log("Connected successfully to server");
            await collection.deleteMany(filter);
            return 0;
        } catch (e) {
            console.log(`Mongo module error: ${e}`);
        } finally {
            // await this.mongoClient.close();
        }
    }
    async readPage(filter, project, sort = {'id': 1}, page = 1) {
        try {
            if (!(Number.isInteger(page) && page > 0)) {
                throw new Error('Неверно указана страница');
            }
            await this.mongoClient.connect();
            const db = this.mongoClient.db("db");
            const collection = db.collection("goods");
            console.log("Connected successfully to server", page * 50 - 50, page * 50 + 1);
            let a = await collection
                .find(filter)
                .sort(sort)
                .skip(page * 50 - 50)
                .limit(50)
                .project(project)
                .toArray();
            return a;
        } catch (e) {
            console.log(`Mongo module error: ${e}`);
        } finally {
            // await this.mongoClient.close();
        }
    }

    // DB Utils
    async findMaxId() {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db("db");
            const collection = db.collection("goods");
            console.log("Connected successfully to server");
            let a = await collection.stats();
            console.log("find max, count: ", a.count);
            return a.count;
        } catch (e) {
            console.log(`Mongo module error: ${e}`);
        } finally {
            await this.mongoClient.close();
        }
    }
    async deleteManyByID(from, to) {
        await this.deleteMany("db", "goods", {id: {$gt: from, $lt: to}});
    }
    async compareUuid(uuid) {
        if (uuid) {
            let data = await this.read("db", "users", {UUID: uuid})
            return data?.login ?? null;
        } else {
            console.log("Mongo module error: wrong data")
            return "Mongo module error: wrong data";
        }
    }
    async checkPassword(login, pass) {
        if (login && pass) {
            let data = await this.read("db", "users", {login: login});
            if (data === null) return null;
            let passHashed = crypto.pbkdf2Sync(pass, data.salt, 10000, 512, "sha512").toString("hex");
            if (passHashed === data.password) {
                let newUUID = crypto.randomUUID();
                await this.update("db", "users", {_id: ObjectId(data._id)}, {UUID: newUUID});
                return newUUID;
            } else {
                return false;
            }
        } else {
            console.log("Mongo module error: wrong data")
            return "Mongo module error: wrong data";
        }
    }
    async createUser(args) {
        if (args.login && args.password) {
            if (!await this.read("db", "users", {login: args.login})) {
                let user = {};
                for (let i in args) {
                    if (i) user[i] = args[i];
                }
                user.login = args.login;
                user.salt = crypto.randomBytes(128).toString("base64");
                user.password = crypto.pbkdf2Sync(args.password, user.salt, 10000, 512, "sha512").toString("hex");
                user.dateOfCreation = new Date().toISOString();
                user.UUID = crypto.randomUUID();
                await this.create("db", "users", user);
                return user.UUID;
            } else {
                console.log("Mongo module error: user exists");
                return "Mongo module error: user exists";
            }
        } else {
            console.log("Mongo module error: wrong user data")
            return "Mongo module error: wrong user data";
        }
    }
}

module.exports = Database;