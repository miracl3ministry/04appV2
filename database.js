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
        Database.instance = this;
    }
    async create(dbName, collectionName, data) {
        try {
            await this.mongoClient.connect();
            const collection = this.mongoClient.db(dbName).collection(collectionName);
            console.log("Connected successfully to server");
            await collection.insertOne(data);
        } catch (e) {
            console.log(`Mongo module error: ${e}`);
        } finally {
            await this.mongoClient.close();
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
            await this.mongoClient.close();
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
            await this.mongoClient.close();
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
            await this.mongoClient.close();
        }
    }
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
    async createMany(dbName, collectionName, dataArr) {
        try {
            await this.mongoClient.connect();
            const collection = this.mongoClient.db(dbName).collection(collectionName);
            console.log("Connected successfully to server");
            await collection.insertMany(dataArr);
        } catch (e) {
            console.log(`Mongo module error: ${e}`);
        } finally {
            await this.mongoClient.close();
        }
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
                await this.update("db", "users", {_id: ObjectId(data._id)}, {$set: {UUID: newUUID}});
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
                let data = {};
                for (let i in args) {
                    if (i) data[i] = args[i];
                }
                data.login = args.login;
                data.salt = crypto.randomBytes(128).toString("base64");
                data.password = crypto.pbkdf2Sync(args.password, data.salt, 10000, 512, "sha512").toString("hex");
                data.dateOfCreation = new Date().toISOString();
                data.UUID = crypto.randomUUID();
                await this.create("db", "users", data);
                return data.UUID;
            } else {
                console.log("Mongo module error: user exists");
                return "Mongo module error: user exists";
            }
        } else {
            console.log("Mongo module error: wrong data")
            return "Mongo module error: wrong data";
        }
    }
    async addInCollection(json) {
        await this.create("db", "goods", json);
    }
}
module.exports = Database;